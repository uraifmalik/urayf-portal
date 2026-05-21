import "server-only";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  sampleProfileStores,
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
    .order("display_order", { ascending: true });

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

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  if (!isSupabaseConfigured) {
    return sampleStores.find((s) => s.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getStoreBySlug:", error.message);
    return null;
  }
  return (data as Store | null) ?? null;
}

/**
 * Return the stores the given profile is assigned to, ordered by
 * `display_order ASC`. Admin sees every store (no join check);
 * non-admin membership is resolved exclusively through the
 * `profile_stores` join table.
 */
export async function getUserStores(profile: Profile): Promise<Store[]> {
  if (!isSupabaseConfigured) {
    if (profile.is_admin) {
      return [...sampleStores].sort(
        (a, b) => a.display_order - b.display_order,
      );
    }
    const ids = new Set<string>(
      sampleProfileStores
        .filter((j) => j.profile_id === profile.id)
        .map((j) => j.store_id),
    );
    return sampleStores
      .filter((s) => ids.has(s.id))
      .sort((a, b) => a.display_order - b.display_order);
  }

  const supabase = await createClient();

  if (profile.is_admin) {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      console.error("getUserStores(admin):", error.message);
      return [];
    }
    return (data as Store[]) ?? [];
  }

  const { data, error } = await supabase
    .from("profile_stores")
    .select("store_id, stores!inner(*)")
    .eq("profile_id", profile.id);
  if (error) {
    console.error("getUserStores:", error.message);
    return [];
  }
  type JoinRow = { stores: Store };
  const rows = (data as unknown as JoinRow[]) ?? [];
  return rows
    .map((r) => r.stores)
    .filter((s): s is Store => Boolean(s))
    .sort((a, b) => a.display_order - b.display_order);
}

/**
 * Return a map of profile_id → store list, for every profile join
 * the caller is permitted to see. Admin pages use this to render
 * the Accounts table's "Stores" column.
 */
export async function getAllProfileStores(): Promise<
  Map<string, Store[]>
> {
  if (!isSupabaseConfigured) {
    const result = new Map<string, Store[]>();
    for (const join of sampleProfileStores) {
      const store = sampleStores.find((s) => s.id === join.store_id);
      if (!store) continue;
      const list = result.get(join.profile_id) ?? [];
      list.push(store);
      result.set(join.profile_id, list);
    }
    for (const stores of result.values()) {
      stores.sort((a, b) => a.display_order - b.display_order);
    }
    return result;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_stores")
    .select("profile_id, stores!inner(*)");
  if (error) {
    console.error("getAllProfileStores:", error.message);
    return new Map();
  }
  type JoinRow = { profile_id: string; stores: Store };
  const rows = (data as unknown as JoinRow[]) ?? [];
  const result = new Map<string, Store[]>();
  for (const r of rows) {
    if (!r.stores) continue;
    const list = result.get(r.profile_id) ?? [];
    list.push(r.stores);
    result.set(r.profile_id, list);
  }
  for (const stores of result.values()) {
    stores.sort((a, b) => a.display_order - b.display_order);
  }
  return result;
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
