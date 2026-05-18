import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * The signed-in user used across the portal app routes.
 *
 * - Demo mode (no Supabase): returns a fixed admin user so every screen,
 *   including the admin section, is reachable.
 * - Configured: resolves the Supabase auth user and joins their profile
 *   row. With no session the caller is redirected to the login page
 *   (the proxy normally catches this first; this is defence in depth).
 */
const DEMO_USER: Profile = {
  id: "demo",
  email: "demo@urayf.com",
  full_name: "Demo Admin",
  store_id: null,
  is_admin: true,
};

export async function getCurrentUser(): Promise<Profile> {
  if (!isSupabaseConfigured) return DEMO_USER;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    (profile as Profile | null) ?? {
      id: user.id,
      email: user.email ?? "",
      full_name: user.email ?? null,
      store_id: null,
      is_admin: false,
    }
  );
}
