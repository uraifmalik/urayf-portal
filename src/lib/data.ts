import "server-only";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  sampleProfiles,
  sampleReports,
  sampleStores,
} from "@/lib/sample-data";
import type { Profile, Report, Store } from "@/lib/types";

/**
 * Data access layer.
 *
 * Every function reads from Supabase when it is configured, and otherwise
 * falls back to the in-repo demo fixtures. Row Level Security (see
 * `supabase/schema.sql`) is what scopes data per user — a client only ever
 * sees their own store's reports.
 *
 * Report files are served by the route handler at
 * `/portal/reports/[id]/file`, which streams them as `text/html`.
 */

export async function getReports(): Promise<Report[]> {
  if (!isSupabaseConfigured) return sampleReports;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getReports:", error.message);
    return [];
  }
  return (data as Report[]) ?? [];
}

export async function getReport(id: string): Promise<Report | null> {
  if (!isSupabaseConfigured) {
    return sampleReports.find((r) => r.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getReport:", error.message);
    return null;
  }
  return (data as Report | null) ?? null;
}

export async function getStores(): Promise<Store[]> {
  if (!isSupabaseConfigured) return sampleStores;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getStores:", error.message);
    return [];
  }
  return (data as Store[]) ?? [];
}

export async function getStore(id: string): Promise<Store | null> {
  if (!isSupabaseConfigured) {
    return sampleStores.find((s) => s.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getStore:", error.message);
    return null;
  }
  return (data as Store | null) ?? null;
}

export async function getProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return sampleProfiles;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("getProfiles:", error.message);
    return [];
  }
  return (data as Profile[]) ?? [];
}
