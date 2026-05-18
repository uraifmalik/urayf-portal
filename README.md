# Urayf

Two-part web app:

1. **urayf.com** — a single, fully self-contained homepage. Black background,
   black header with the Urayf wordmark and a **Client Login** button linking
   to `/portal`. Everything below the header is a black stage reserved for a
   future scroll animation.
2. **urayf.com/portal** — the client portal: login, dashboard, report viewer
   and an admin section, backed by Supabase auth + Postgres.

Built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**,
**Supabase** and deployed to **Vercel**.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. With no Supabase credentials the portal runs in
**demo mode** — sample data, and any login works — so the whole UI is
browsable immediately.

## Connecting Supabase

1. Create a project at <https://app.supabase.com>.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. In Supabase Auth → URL Configuration, add
   `http://localhost:3000/auth/callback` (and the production equivalent) as a
   redirect URL.
5. Sign up once, then run the first-run SQL at the bottom of
   `supabase/schema.sql`: make yourself an admin
   (`update public.profiles set is_admin = true ...`), create a store, and
   assign each client account a `store_id`.

Restart `npm run dev` — real auth, RLS-scoped data, file uploads and the
admin section are now live. Uploaded report files are stored in the private
`reports` storage bucket, foldered by store.

## Deploying to Vercel

1. Push this folder to a Git repository and import it at
   <https://vercel.com/new>.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
   Project Settings → Environment Variables.
3. Deploy. No extra build configuration is required.

## Project layout

```
src/
  app/
    layout.tsx              Root layout (html/body, fonts)
    page.tsx                urayf.com — renders <Homepage /> only
    portal/
      layout.tsx            Thin wrapper for all /portal routes
      page.tsx              Redirects to the dashboard
      login/page.tsx        Login screen (no dashboard chrome)
      (app)/                Route group: authenticated dashboard chrome
        layout.tsx          Sidebar + top bar + auth gate
        dashboard/          Stats and recent reports
        reports/            Report list + [id] viewer
        admin/              Clients and all-reports tables (admin only)
    auth/callback/route.ts  Supabase OAuth / email-link callback
  components/
    home/                   Homepage — ISOLATED, imports nothing else
    portal/                 Portal-only UI components
  lib/
    config.ts               Env + isSupabaseConfigured flag
    auth.ts                 getCurrentUser()
    data.ts                 Reports/clients queries (Supabase or fixtures)
    sample-data.ts          Demo-mode fixtures
    types.ts                Shared types
    supabase/               Browser, server and middleware clients
  middleware.ts             Session refresh + /portal route guard
supabase/schema.sql         Database schema, RLS policies, signup trigger
```

### Homepage isolation

`src/components/home/` is self-contained: it imports only `next/link` and
React, and nothing in the portal imports from it. The future scroll animation
is built entirely inside `Homepage.tsx` (or new files under `home/`) — the
`#home-animation-stage` `<section>` is the mount point.
