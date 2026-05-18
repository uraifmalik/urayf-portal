import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 "proxy" convention (formerly "middleware").
 *
 * Runs only for portal routes — the public homepage (urayf.com) is never
 * touched by auth logic, keeping it fully isolated.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/portal", "/portal/:path*"],
};
