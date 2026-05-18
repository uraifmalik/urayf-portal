export type ReportType = "daily" | "weekly" | "monthly";

export type Store = {
  id: string;
  name: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  store_id: string | null;
  is_admin: boolean;
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
