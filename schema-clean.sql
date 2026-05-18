-- ============================================================
-- Urayf Portal — Supabase schema
-- Manual report delivery system: stores, client accounts, reports.
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- ============================================================

-- ---------- optional clean reset ----------
-- Uncomment to wipe and recreate (destroys all data in these tables):
-- drop table if exists public.reports  cascade;
-- drop table if exists public.profiles cascade;
-- drop table if exists public.stores   cascade;

-- ============================================================
-- Tables
-- ============================================================

-- ---------- stores ----------
create table if not exists public.stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ---------- profiles (one per auth user) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  store_id   uuid references public.stores(id) on delete set null,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_store_id_idx on public.profiles (store_id);

-- ---------- reports ----------
-- The uploaded file lives in the private Storage bucket 'reports' at
-- path '{store_id}/...'. file_path is that object path; file_name is the
-- original filename for display/download.
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  type        text not null check (type in ('daily', 'weekly', 'monthly')),
  report_date date not null,
  title       text not null,
  file_path   text not null,
  file_name   text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists reports_store_id_idx    on public.reports (store_id);
create index if not exists reports_report_date_idx on public.reports (report_date);

-- ============================================================
-- Helper functions (SECURITY DEFINER bypasses RLS internally so the
-- policies below can call them without recursing on themselves)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.my_store_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Auto-create a profile row when a new auth user signs up.
-- store_id stays null and is_admin stays false until an admin assigns them.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.stores   enable row level security;
alter table public.profiles enable row level security;
alter table public.reports  enable row level security;

-- ---------- stores ----------
drop policy if exists "Admins manage stores" on public.stores;
create policy "Admins manage stores"
  on public.stores for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Clients read their own store" on public.stores;
create policy "Clients read their own store"
  on public.stores for select
  using (id = public.my_store_id());

-- ---------- profiles ----------
drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Only admins may change profiles (assigning store_id / is_admin).
-- This prevents a client from reassigning their own store.
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- reports ----------
drop policy if exists "Admins manage reports" on public.reports;
create policy "Admins manage reports"
  on public.reports for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Clients read their store's reports" on public.reports;
create policy "Clients read their store's reports"
  on public.reports for select
  using (store_id = public.my_store_id());

-- ============================================================
-- Storage: private bucket for uploaded report files
-- Files are stored at '{store_id}/<filename>'.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "Admins manage report files" on storage.objects;
create policy "Admins manage report files"
  on storage.objects for all
  using (bucket_id = 'reports' and public.is_admin())
  with check (bucket_id = 'reports' and public.is_admin());

-- A client may download only files inside their own store's folder.
drop policy if exists "Clients read their store's files" on storage.objects;
create policy "Clients read their store's files"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = public.my_store_id()::text
  );

-- ============================================================
-- First-run setup
-- ============================================================
-- 1. Sign up once through the portal, then make yourself an admin:
--      update public.profiles set is_admin = true where email = 'you@urayf.com';
-- 2. Create a store:
--      insert into public.stores (name) values ('My First Store');
-- 3. Assign a client account to that store:
--      update public.profiles
--        set store_id = (select id from public.stores where name = 'My First Store')
--        where email = 'client@example.com';
