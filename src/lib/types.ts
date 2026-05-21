export type ReportType = "daily" | "weekly" | "monthly";

export type Plan = "standard" | "premium" | "max";

export type Store = {
  id: string;
  name: string;
  /** URL identifier — lowercase alphanumerics, unique per store. */
  slug: string;
  /** Sidebar display label (e.g. "TCS" or "19775"). */
  short_name: string;
  /** Position in the sidebar nav, ascending. */
  display_order: number;
  created_at: string;
};

/** Many-to-many join — a profile is assigned to one or more stores. */
export type ProfileStore = {
  profile_id: string;
  store_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  /** Exact greeting for this client, set manually — never inferred. */
  display_greeting: string | null;
  is_admin: boolean;
  /** Subscription tier; null = no plan assigned. */
  plan: Plan | null;
  /** Custom monthly rate in USD (overrides the standard plan price). */
  plan_rate_override: number | null;
  /** Whether this user has been shown the first-login welcome modal. */
  has_seen_welcome: boolean;
  /** Public URL of the user's avatar image; null falls back to initials. */
  avatar_url: string | null;
  created_at?: string;
};

export type Report = {
  id: string;
  store_id: string;
  type: ReportType;
  /** ISO date (YYYY-MM-DD) the report covers. */
  report_date: string;
  title: string;
  /** Path of the uploaded file inside the `reports` storage bucket. */
  file_path: string;
  /** Original filename, for display and download. */
  file_name: string | null;
  uploaded_by: string | null;
  created_at: string;
};

/** Return shape for the admin Server Actions (upload report, add store). */
export type ActionState = { ok: boolean; message: string } | null;
