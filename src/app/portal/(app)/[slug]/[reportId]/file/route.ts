import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getReport, getStoreBySlug } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

/**
 * Serves an uploaded report file with an explicit `text/html` content
 * type so the <iframe> in the report viewer RENDERS it as a web page.
 *
 * Authorization: the slug must match the report's store. Combined
 * with RLS (which already scopes reports per user) this means a
 * URL-twiddling attacker who guesses a report id but lacks access
 * to the store still gets 404.
 *
 * Append `?download=1` to serve the file as an attachment instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; reportId: string }> },
) {
  const { slug, reportId } = await params;

  const [store, report] = await Promise.all([
    getStoreBySlug(slug),
    getReport(reportId),
  ]);
  if (!store || !report || report.store_id !== store.id) {
    return new NextResponse("Report not found", { status: 404 });
  }

  let html: string;

  if (!isSupabaseConfigured) {
    const publicDir = path.join(process.cwd(), "public");
    const resolved = path.resolve(publicDir, report.file_path);
    if (!resolved.startsWith(publicDir + path.sep)) {
      return new NextResponse("Invalid file path", { status: 400 });
    }
    try {
      html = await readFile(resolved, "utf-8");
    } catch {
      return new NextResponse("Report file not found", { status: 404 });
    }
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("reports")
      .download(report.file_path);
    if (error || !data) {
      return new NextResponse("Could not load report file", { status: 502 });
    }
    html = await data.text();
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "private, no-store");

  if (request.nextUrl.searchParams.has("download")) {
    const safeName = (report.file_name ?? "report.html").replace(
      /["\\\r\n]/g,
      "_",
    );
    headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
  }

  return new NextResponse(html, { headers });
}
