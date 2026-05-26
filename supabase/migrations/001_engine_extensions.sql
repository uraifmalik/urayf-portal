-- ============================================================================
-- urayf · Engine Schema Extensions · migration 001
-- ----------------------------------------------------------------------------
-- Adds the tables and columns the Engine needs on top of the original
-- portal schema (supabase/schema.sql). Safe to run on a database that
-- already has the v1 schema applied; safe to run multiple times.
--
-- What this adds:
--   • raw_snapshots       — Layer 1 output (immutable per run)
--   • runs                — one row per Engine execution; the audit thread
--   • audit_log           — Layer 2 writebacks (immutable)
--   • invoice_ledger      — Layer 3 persistent reconciliation state
--   • supervisor_findings — Layer 6 check results, blocking + non-blocking
--   • reports (extended)  — new columns: run_id, payload, supervisor_status
--   • stores (extended)   — new columns: store_number, timezone,
--                           maintenance_monthly_baseline, variance_thresholds
--
-- Run this in the Supabase SQL editor after `supabase/schema.sql`.
-- ============================================================================


-- ============================================================================
-- 0. Extensions to existing tables
-- ============================================================================

-- ---------- stores: add operational config ----------
-- store_number: the 7-Eleven franchise store number (e.g. '19775'). String,
--               not int, because leading zeros may matter.
-- timezone:     IANA timezone name (e.g. 'America/Chicago'). The store's
--               local time defines business-date boundaries.
-- maintenance_monthly_baseline: per-store override of the $3,000 default
--               from Playbook v4 §Layer 3. Null = use default.
-- variance_thresholds: per-store override of the playbook's severity bands.
--               JSON shaped { within: 5.00, mild: 50.00, moderate: 100.00 }.
--               Null = use defaults.
alter table public.stores
  add column if not exists store_number text,
  add column if not exists timezone     text not null default 'America/Chicago',
  add column if not exists maintenance_monthly_baseline numeric(10,2),
  add column if not exists variance_thresholds jsonb;

create unique index if not exists stores_store_number_uq
  on public.stores (store_number)
  where store_number is not null;


-- ---------- reports: link to runs, store payload, supervisor status ----------
-- run_id:            the engine run that produced this report. Null for
--                    manually-uploaded reports (the legacy path stays open
--                    until Phase 6).
-- payload:           the full DailyReportPayload JSON. Stored alongside the
--                    rendered HTML so we can re-render with a new template
--                    version without re-running Layers 1–3.
-- schema_version:    the payload schema version this report conforms to.
-- supervisor_status: gates Portal visibility. Only 'passed' and
--                    'passed_with_warnings' reports are shown to clients.
--                    Null = legacy / manually-uploaded (visible).
-- supervisor_summary:short human-readable description of any warnings.
alter table public.reports
  add column if not exists run_id uuid,
  add column if not exists payload jsonb,
  add column if not exists schema_version text,
  add column if not exists supervisor_status text
    check (supervisor_status in (
      'passed',
      'passed_with_warnings',
      'blocked',
      'needs_review'
    )),
  add column if not exists supervisor_summary text;

create index if not exists reports_run_id_idx
  on public.reports (run_id) where run_id is not null;

create index if not exists reports_supervisor_status_idx
  on public.reports (supervisor_status);


-- ============================================================================
-- 1. New tables
-- ============================================================================

-- ---------- runs ----------
-- One row per end-to-end Engine execution for a (store, business_date) pair.
-- The audit thread: every other engine-produced row carries run_id.
-- A run is created the moment the Engine starts and updated as layers
-- complete. status reflects the most recent layer's outcome.
create table if not exists public.runs (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.stores(id),
  business_date   date not null,
  -- Cadence the run was scheduled for. Daily / weekly / monthly map to the
  -- corresponding reports.type values.
  cadence         text not null check (cadence in ('daily', 'weekly', 'monthly')),
  -- Overall status of the run, updated as layers complete.
  status          text not null default 'started' check (status in (
    'started',
    'collecting',     -- Layer 1 in progress
    'writing_back',   -- Layer 2 in progress
    'computing',      -- Layer 3 in progress
    'generating',     -- Layer 4 in progress
    'supervising',    -- Layer 6 in progress
    'publishing',     -- Layer 5 in progress
    'succeeded',
    'failed',
    'aborted'         -- a previous run was hung; this run won't proceed
  )),
  -- The Engine's git SHA or version tag at the time of the run. Useful for
  -- "this report was produced by code version X" forensics.
  engine_version  text,
  -- Free-form last-error if the run failed. Detailed errors live in logs;
  -- this is a one-line summary surfacing in the run dashboard.
  last_error      text,
  started_at      timestamptz not null default now(),
  -- Set when the run terminates (success or failure). Null while running.
  finished_at     timestamptz
);

create index if not exists runs_store_business_idx
  on public.runs (store_id, business_date desc);

create index if not exists runs_status_idx
  on public.runs (status);

-- One non-aborted run per (store, business_date, cadence). If a run is
-- restarted, the previous incomplete run must first be marked 'aborted' or
-- 'failed' — this prevents two daily runs colliding for the same store/date.
create unique index if not exists runs_active_unique
  on public.runs (store_id, business_date, cadence)
  where status not in ('aborted', 'failed');


-- ---------- raw_snapshots ----------
-- Layer 1's output. Immutable: one row per run. If a run is restarted,
-- the previous run's snapshot stays — runs cleanup is by deleting the run,
-- which deletes the snapshot via the foreign key.
-- Note: snapshots can be large (EJ data for a busy store has hundreds of
-- transactions with line items). jsonb compresses well; budget ~100KB per
-- snapshot in the absence of measured data.
create table if not exists public.raw_snapshots (
  run_id        uuid primary key references public.runs(id) on delete cascade,
  store_id      uuid not null references public.stores(id),
  business_date date not null,
  -- The Layer 1 collection result, structured per Playbook v4 §Layer 1.
  -- The Calculator reads from this; no other layer mutates it.
  data          jsonb not null,
  -- How long Layer 1 took, in seconds. For monitoring.
  collected_in_seconds integer,
  created_at    timestamptz not null default now()
);

create index if not exists raw_snapshots_store_business_idx
  on public.raw_snapshots (store_id, business_date desc);


-- ---------- audit_log ----------
-- Layer 2's writebacks. Immutable record of every write the Engine made to
-- 7BOSS. Each row corresponds to one attempted action; status reflects the
-- outcome. The idempotency_key allows the Engine to look up "did I already
-- do this?" before re-attempting.
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.runs(id),
  store_id        uuid not null references public.stores(id),
  business_date   date not null,
  -- e.g. 'lotto_worksheet', 'cash_summary_deposit', 'invoice_memo'
  screen          text not null,
  -- e.g. 'save', 'add_memo', 'set_deposit'
  action          text not null,
  -- Hash of the action's input payload (vendor, cost, retail, etc.).
  -- Same screen+action+payload_hash = same idempotency key.
  -- The (store_id, business_date, screen, action, payload_hash) tuple is
  -- the natural key from Playbook v4; we store its hash for index efficiency.
  idempotency_key text not null,
  -- The action's input as JSON. Stored for debuggability.
  payload         jsonb not null,
  status          text not null check (status in (
    'in_progress',
    'success',
    'failed',
    'skipped'  -- already done in an earlier run; idempotency hit
  )),
  -- If failed, the error message. Stack traces live in logs.
  error_message   text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz
);

create index if not exists audit_log_idempotency_idx
  on public.audit_log (store_id, business_date, screen, action, idempotency_key);

create index if not exists audit_log_run_id_idx
  on public.audit_log (run_id);

create index if not exists audit_log_status_idx
  on public.audit_log (status);


-- ---------- invoice_ledger ----------
-- Layer 3's persistent state. One row per normalized invoice key, per store.
-- Mutated in place by each daily run. The status state machine is described
-- in Playbook v4 §Layer 3.
--
-- Money columns use numeric(12,2) — exact decimal, not float. The Engine
-- converts to/from JSON float at its read/write boundary.
create table if not exists public.invoice_ledger (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  -- Normalized invoice key (longest trailing-digit suffix, ≥4 digits).
  -- One row per (store_id, key).
  key                 text not null,

  -- ISR side --
  isr_vendor          text,
  isr_invoice         text,
  isr_cost            numeric(12,2),
  isr_retail          numeric(12,2),
  isr_date            date,
  isr_first_seen_run  uuid references public.runs(id),
  isr_last_seen_run   uuid references public.runs(id),

  -- DMR side --
  dmr_vendor          text,
  dmr_invoice         text,
  dmr_cost            numeric(12,2),
  dmr_retail          numeric(12,2),
  dmr_thru_date       date,
  dmr_first_seen_run  uuid references public.runs(id),
  dmr_last_seen_run   uuid references public.runs(id),

  -- State machine --
  status              text not null check (status in (
    'matched',
    'mismatched',
    'isr_pending_dmr',
    'dmr_pending_isr',
    'resolved',
    'stale'
  )),
  first_seen          date not null default current_date,
  last_updated        timestamptz not null default now(),
  days_pending        integer not null default 0
);

create unique index if not exists invoice_ledger_store_key_uq
  on public.invoice_ledger (store_id, key);

create index if not exists invoice_ledger_status_idx
  on public.invoice_ledger (store_id, status);

create index if not exists invoice_ledger_stale_candidates_idx
  on public.invoice_ledger (store_id, days_pending)
  where status in ('isr_pending_dmr', 'dmr_pending_isr', 'mismatched');

-- Trigger to keep last_updated honest without the Engine remembering to set it.
create or replace function public.touch_invoice_ledger_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists trg_invoice_ledger_updated_at on public.invoice_ledger;
create trigger trg_invoice_ledger_updated_at
  before update on public.invoice_ledger
  for each row execute function public.touch_invoice_ledger_updated_at();


-- ---------- supervisor_findings ----------
-- Layer 6's output. Every finding is one row. Multiple findings per run is
-- normal — info findings are common, warnings less so, blocking findings
-- rare.
create table if not exists public.supervisor_findings (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.runs(id) on delete cascade,
  -- Which check tier raised this finding. See Playbook v4 §Layer 6.
  tier          text not null check (tier in ('tier_1', 'tier_2', 'tier_3')),
  -- A short stable identifier for the check, e.g. 'ej_row_count_mismatch',
  -- 'sales_sum_inconsistent', 'prose_number_not_in_payload'. Use the same
  -- name across runs so a dashboard can group findings by check.
  check_name    text not null,
  severity      text not null check (severity in ('blocking', 'warning', 'info')),
  -- Human-readable summary suitable for display in the run dashboard or
  -- (for warnings) in the Portal badge.
  message       text not null,
  -- Optional structured detail for debugging. e.g. {expected: 1611.26, actual: 1611.30}.
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists supervisor_findings_run_idx
  on public.supervisor_findings (run_id);

create index if not exists supervisor_findings_severity_idx
  on public.supervisor_findings (severity, created_at desc);


-- ============================================================================
-- 2. Helper functions used by RLS
-- ============================================================================

-- public.is_admin() and public.my_store_id() already exist from schema.sql;
-- we reuse them rather than redefining.


-- ============================================================================
-- 3. Row Level Security
-- ============================================================================
-- All engine tables are admin-only at the row level. The Engine uses the
-- service role key (which bypasses RLS), so no service-account policy is
-- needed. Clients have no direct visibility into runs, snapshots, audit
-- log, ledger, or findings — they only see published reports.

alter table public.runs                enable row level security;
alter table public.raw_snapshots       enable row level security;
alter table public.audit_log           enable row level security;
alter table public.invoice_ledger      enable row level security;
alter table public.supervisor_findings enable row level security;

-- ---------- runs ----------
drop policy if exists "Admins manage runs" on public.runs;
create policy "Admins manage runs"
  on public.runs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- raw_snapshots ----------
drop policy if exists "Admins manage raw snapshots" on public.raw_snapshots;
create policy "Admins manage raw snapshots"
  on public.raw_snapshots for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- audit_log ----------
drop policy if exists "Admins read audit log" on public.audit_log;
create policy "Admins read audit log"
  on public.audit_log for select
  using (public.is_admin());

-- audit_log is append-only from the application's perspective. Only the
-- service role can insert/update — not even admins via the dashboard, to
-- prevent accidental tampering. This is enforced by having no insert/update
-- policy at all; the service role bypasses RLS, so the Engine can still write.

-- ---------- invoice_ledger ----------
drop policy if exists "Admins manage invoice ledger" on public.invoice_ledger;
create policy "Admins manage invoice ledger"
  on public.invoice_ledger for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- supervisor_findings ----------
drop policy if exists "Admins read supervisor findings" on public.supervisor_findings;
create policy "Admins read supervisor findings"
  on public.supervisor_findings for select
  using (public.is_admin());

-- Like audit_log, findings are append-only from the application's perspective.
-- No insert/update policy — service role only.


-- ============================================================================
-- 4. Foreign key on reports.run_id (deferred so it doesn't break the
--    legacy upload path while runs is empty)
-- ============================================================================

do $$
begin
  if not exists (
    select 1
      from information_schema.table_constraints
     where table_schema = 'public'
       and table_name = 'reports'
       and constraint_name = 'reports_run_id_fkey'
  ) then
    alter table public.reports
      add constraint reports_run_id_fkey
      foreign key (run_id) references public.runs(id);
  end if;
end$$;


-- ============================================================================
-- 5. Convenience views (read-only; for the run dashboard and Supervisor UI)
-- ============================================================================

-- run_summary: one row per run with the most relevant fields for the
-- dashboard. Joins runs to its store and computes counts of findings by
-- severity. Convenient for the admin dashboard query.
create or replace view public.run_summary as
select
  r.id                       as run_id,
  r.business_date,
  r.cadence,
  r.status,
  r.engine_version,
  r.started_at,
  r.finished_at,
  extract(epoch from (r.finished_at - r.started_at))::int
                             as duration_seconds,
  r.last_error,
  s.id                       as store_id,
  s.name                     as store_name,
  s.store_number,
  (select count(*) from public.supervisor_findings f
     where f.run_id = r.id and f.severity = 'blocking') as blocking_count,
  (select count(*) from public.supervisor_findings f
     where f.run_id = r.id and f.severity = 'warning')  as warning_count,
  (select count(*) from public.supervisor_findings f
     where f.run_id = r.id and f.severity = 'info')     as info_count
from public.runs r
join public.stores s on s.id = r.store_id;

-- Views inherit RLS from the underlying tables; no separate policy needed.


-- ============================================================================
-- End of migration 001
-- ============================================================================
