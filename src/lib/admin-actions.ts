"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

/**
 * Admin Server Actions. Both gracefully no-op in demo mode so the admin
 * UI stays fully clickable without Supabase.
 */

const REPORT_TYPES = ["daily", "weekly", "monthly"] as const;
const SLUG_RE = /^[a-z0-9]+$/;

export async function uploadReport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user.is_admin)
    return { ok: false, message: "Only admins can do that." };

  const storeId = String(formData.get("store_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const reportDate = String(formData.get("report_date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (
    !storeId ||
    !REPORT_TYPES.includes(type as (typeof REPORT_TYPES)[number]) ||
    !reportDate ||
    !title ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    return {
      ok: false,
      message: "Fill in every field and choose a file.",
    };
  }

  if (!isSupabaseConfigured) {
    return { ok: true, message: "Demo mode — nothing is saved here." };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${storeId}/${reportDate}-${type}-${crypto.randomUUID()}-${safeName}`;

  const isHtml = /\.html?$/i.test(file.name) || file.type === "text/html";
  const contentType = isHtml ? "text/html" : file.type || "text/html";

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(path, file, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      message: "That report couldn't be uploaded. Try again in a moment.",
    };
  }

  const { error: insertError } = await supabase.from("reports").insert({
    store_id: storeId,
    type,
    report_date: reportDate,
    title,
    file_path: path,
    file_name: file.name,
    uploaded_by: user.id,
  });

  if (insertError) {
    await supabase.storage.from("reports").remove([path]);
    return {
      ok: false,
      message: "That report couldn't be saved. Try again in a moment.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/dashboard");
  return { ok: true, message: "Report uploaded." };
}

export async function addStore(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user.is_admin)
    return { ok: false, message: "Only admins can do that." };

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const displayOrderRaw = String(formData.get("display_order") ?? "").trim();
  const profileId = String(formData.get("profile_id") ?? "").trim();

  if (!name) return { ok: false, message: "Enter a store name." };
  if (!shortName)
    return { ok: false, message: "Enter a short name for the sidebar." };
  if (!slug || !SLUG_RE.test(slug))
    return {
      ok: false,
      message: "Slug must be lowercase letters and digits only.",
    };
  const displayOrder = Number.parseInt(displayOrderRaw, 10);
  if (!Number.isFinite(displayOrder) || displayOrder < 1)
    return { ok: false, message: "Display order must be a positive integer." };
  if (!profileId)
    return { ok: false, message: "Choose which client this store belongs to." };

  if (!isSupabaseConfigured) {
    return { ok: true, message: "Demo mode — nothing is saved here." };
  }

  const supabase = await createClient();

  const { data: inserted, error: storeError } = await supabase
    .from("stores")
    .insert({
      name,
      short_name: shortName,
      slug,
      display_order: displayOrder,
    })
    .select("id")
    .maybeSingle();

  if (storeError || !inserted) {
    const msg = storeError?.message ?? "";
    if (msg.includes("stores_slug_unique") || msg.includes("duplicate")) {
      return { ok: false, message: "That slug is already in use." };
    }
    return {
      ok: false,
      message: "That store couldn't be saved. Try again in a moment.",
    };
  }

  const { error: joinError } = await supabase
    .from("profile_stores")
    .insert({ profile_id: profileId, store_id: inserted.id });
  if (joinError) {
    // Best-effort rollback so a failed join doesn't leave a dangling
    // store assigned to nobody.
    await supabase.from("stores").delete().eq("id", inserted.id);
    return {
      ok: false,
      message: "Couldn't assign the store. Try again in a moment.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/dashboard");
  return { ok: true, message: "Store added." };
}
