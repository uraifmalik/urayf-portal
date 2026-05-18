/**
 * Environment configuration.
 *
 * `isSupabaseConfigured` lets the whole app degrade gracefully: when no
 * Supabase credentials are present the portal runs in a self-contained
 * "demo mode" (sample data, no real auth) so the UI is fully browsable
 * before a Supabase project exists.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 0;
