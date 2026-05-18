import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { getReport } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

/**
 * Serves an uploaded report file with an explicit `text/html` content type
 * so the <iframe> in the report viewer RENDERS it as a web page instead of
 * showing its raw source.
 *
 * This is deliberately robust: whatever content type the file was stored
 * with (Supabase Storage can serve user uploads as text/plain or a generic
 * binary type), we override it here. Existing reports are fixed too — no
 * re-upload needed.
 *
 * `getReport` runs under the caller's session, so RLS guarantees a client
 * can only ever fetch their own store's report.
 *
 * Append `?download=1` to serve the file as an attachment instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const report = await getReport(id);
  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  let html: string;

  if (!isSupabaseConfigured) {
    // Demo mode: the file is a static asset under /public.
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
    // Live mode: download the file from the private storage bucket.
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
