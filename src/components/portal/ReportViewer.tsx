import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TypePill } from "@/components/ui/Pill";
import type { Report, Store } from "@/lib/types";
import "./viewer.css";

const TYPE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * Renders an uploaded HTML report inline.
 *
 * The file is loaded as the <iframe> source from our own route handler
 * (`/portal/[slug]/[reportId]/file`), which always serves it as `text/html` so
 * it renders as a page. The iframe is sandboxed so the report's own CSS/JS
 * cannot leak into or break the portal chrome.
 *
 * Only the viewer FRAME is brand-styled — the report inside the iframe is
 * a standalone HTML file with its own styling and is left untouched.
 */
export default function ReportViewer({
  report,
  store,
}: {
  report: Report;
  store: Store | null;
}) {
  const fileUrl = store
    ? `/portal/${store.slug}/${report.id}/file`
    : `/portal/dashboard`;
  const backHref = store ? `/portal/${store.slug}` : "/portal/dashboard";
  const backLabel = store ? `← Back to ${store.name}` : "← Back to dashboard";

  const reportDate = new Date(report.report_date).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="viewer">
      <Link href={backHref} className="viewer__back">
        {backLabel}
      </Link>

      <div className="viewer__head">
        <div className="viewer__head-main">
          <div className="viewer__meta">
            <TypePill>{TYPE_LABEL[report.type] ?? report.type}</TypePill>
            <span className="viewer__store">
              {store?.name ?? "Unknown store"}
            </span>
          </div>
          <h1 className="viewer__title">{report.title}</h1>
          <p className="viewer__date">Report date · {reportDate}</p>
        </div>

        <div className="viewer__actions">
          <Button
            rank="secondary"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in new tab
          </Button>
          <Button
            rank="primary"
            href={`${fileUrl}?download=1`}
            download={report.file_name ?? "report.html"}
          >
            Download
          </Button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <iframe
          src={fileUrl}
          title={report.title}
          className="viewer__frame"
          sandbox="allow-scripts allow-popups allow-downloads"
        />
      </Card>
    </div>
  );
}
