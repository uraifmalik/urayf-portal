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
    // A demo action still succeeds — it just doesn't persist.
    return { ok: true, message: "Demo mode — nothing is saved here." };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${storeId}/${reportDate}-${type}-${crypto.randomUUID()}-${safeName}`;

  // Force a correct content type so the file is stored as HTML rather than
  // text/plain or a generic binary type. (The /file route handler also
  // enforces text/html when serving, so existing uploads render too.)
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
    // Roll back the orphaned file so a failed insert leaves no mess.
    await supabase.storage.from("reports").remove([path]);
    return {
      ok: false,
      message: "That report couldn't be saved. Try again in a moment.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/reports");
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
  if (!name) return { ok: false, message: "Enter a store name." };

  if (!isSupabaseConfigured) {
    // A demo action still succeeds — it just doesn't persist.
    return { ok: true, message: "Demo mode — nothing is saved here." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("stores").insert({ name });
  if (error)
    return {
      ok: false,
      message: "That store couldn't be saved. Try again in a moment.",
    };

  revalidatePath("/portal/admin");
  return { ok: true, message: "Store added." };
}
