import Link from "next/link";
import ReportTypeBadge from "@/components/portal/ReportTypeBadge";
import type { Report, Store } from "@/lib/types";

/**
 * Renders an uploaded HTML report inline.
 *
 * The file is loaded as the <iframe> source from our own route handler
 * (`/portal/reports/[id]/file`), which always serves it as `text/html` so
 * it renders as a page. The iframe is sandboxed so the report's own CSS/JS
 * cannot leak into or break the portal chrome. Rendered full-width inside
 * the dashboard layout, so the sidebar stays visible.
 */
export default function ReportViewer({
  report,
  store,
}: {
  report: Report;
  store: Store | null;
}) {
  const fileUrl = `/portal/reports/${report.id}/file`;

  const reportDate = new Date(report.report_date).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="space-y-5">
      <Link
        href="/portal/reports"
        className="inline-block text-sm text-zinc-400 transition-colors hover:text-white"
      >
        ← Back to reports
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ReportTypeBadge type={report.type} />
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              {store?.name ?? "Unknown store"}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">{report.title}</h1>
          <p className="text-sm text-zinc-500">Report date · {reportDate}</p>
        </div>

        <div className="flex gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            Open in new tab
          </a>
          <a
            href={`${fileUrl}?download=1`}
            download={report.file_name ?? "report.html"}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Download
          </a>
        </div>
      </div>

      <iframe
        src={fileUrl}
        title={report.title}
        className="h-[78vh] min-h-[600px] w-full rounded-xl border border-white/10 bg-white"
        sandbox="allow-scripts allow-popups allow-downloads"
      />
    </div>
  );
}
