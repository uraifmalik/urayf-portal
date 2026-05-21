import type { Profile, Report, Store } from "@/lib/types";

/**
 * Demo-mode fixtures. Used only when `isSupabaseConfigured` is false so the
 * whole portal — including the report viewer and admin section — is
 * browsable before a Supabase project is connected.
 *
 * Demo report files are real HTML files in `public/demo-reports/`, so
 * `file_path` here is resolved to a public URL (see `getReportFileUrls`).
 */

export const sampleStores: Store[] = [
  {
    id: "s-001",
    name: "Downtown Flagship",
    slug: "downtown",
    short_name: "Downtown",
    display_order: 1,
    created_at: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "s-002",
    name: "Riverside Branch",
    slug: "riverside",
    short_name: "Riverside",
    display_order: 2,
    created_at: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "s-003",
    name: "Airport Kiosk",
    slug: "airport",
    short_name: "Airport",
    display_order: 3,
    created_at: "2026-02-01T09:00:00.000Z",
  },
];

/* profile_stores fixtures — store membership is now resolved
   exclusively through this join table. The legacy profiles.store_id
   column still exists in Supabase as a backward-compat shim, but
   application code no longer reads it. */
export const sampleProfileStores = [
  { profile_id: "u-admin", store_id: "s-001" },
  { profile_id: "u-admin", store_id: "s-002" },
  { profile_id: "u-admin", store_id: "s-003" },
  { profile_id: "u-001", store_id: "s-001" },
  { profile_id: "u-002", store_id: "s-002" },
  { profile_id: "u-003", store_id: "s-003" },
];

export const sampleProfiles: Profile[] = [
  {
    id: "u-admin",
    email: "demo@urayf.com",
    full_name: "Demo Admin",
    display_greeting: "Admin",
    is_admin: true,
    plan: "max",
    plan_rate_override: 400,
    has_seen_welcome: true,
    avatar_url: null,
  },
  {
    id: "u-001",
    email: "alex.kerr@example.com",
    full_name: "Alex Kerr",
    display_greeting: "Alex",
    is_admin: false,
    plan: "standard",
    plan_rate_override: null,
    has_seen_welcome: true,
    avatar_url: null,
  },
  {
    id: "u-002",
    email: "priya.shah@example.com",
    full_name: "Priya Shah",
    display_greeting: "Mrs. Shah",
    is_admin: false,
    plan: "premium",
    plan_rate_override: null,
    has_seen_welcome: true,
    avatar_url: null,
  },
  {
    id: "u-003",
    email: "sam.diaz@example.com",
    full_name: "Sam Diaz",
    display_greeting: null,
    is_admin: false,
    plan: null,
    plan_rate_override: null,
    has_seen_welcome: false,
    avatar_url: null,
  },
];

// Newest first — matches the `report_date desc` ordering used for Supabase.
export const sampleReports: Report[] = [
  {
    id: "r-001",
    store_id: "s-001",
    type: "daily",
    report_date: "2026-05-17",
    title: "Daily Sales — 17 May 2026",
    file_path: "demo-reports/daily-report.html",
    file_name: "daily-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-18T07:30:00.000Z",
  },
  {
    id: "r-004",
    store_id: "s-002",
    type: "daily",
    report_date: "2026-05-17",
    title: "Daily Sales — 17 May 2026",
    file_path: "demo-reports/daily-report.html",
    file_name: "daily-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-18T07:32:00.000Z",
  },
  {
    id: "r-002",
    store_id: "s-001",
    type: "weekly",
    report_date: "2026-05-11",
    title: "Weekly Summary — Week 19",
    file_path: "demo-reports/weekly-report.html",
    file_name: "weekly-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-12T08:00:00.000Z",
  },
  {
    id: "r-005",
    store_id: "s-002",
    type: "weekly",
    report_date: "2026-05-11",
    title: "Weekly Summary — Week 19",
    file_path: "demo-reports/weekly-report.html",
    file_name: "weekly-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-12T08:05:00.000Z",
  },
  {
    id: "r-003",
    store_id: "s-001",
    type: "monthly",
    report_date: "2026-05-01",
    title: "Monthly Report — April 2026",
    file_path: "demo-reports/monthly-report.html",
    file_name: "monthly-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "r-006",
    store_id: "s-003",
    type: "monthly",
    report_date: "2026-05-01",
    title: "Monthly Report — April 2026",
    file_path: "demo-reports/monthly-report.html",
    file_name: "monthly-report.html",
    uploaded_by: "u-admin",
    created_at: "2026-05-02T09:10:00.000Z",
  },
];
