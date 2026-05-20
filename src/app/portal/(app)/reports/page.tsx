import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Ledger, type LedgerRow } from "@/components/ui/Ledger";
import { getReports } from "@/lib/data";
import type { Report, ReportType } from "@/lib/types";
import "./reports.css";

export const metadata: Metadata = {
  title: "Reports — urayf portal",
};

const TYPE_LABEL: Record<ReportType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/* Three sections stacked, fixed order: daily → weekly → monthly.
   When a section has no reports, the Ledger renders its empty state
   with the section-specific wording (Part 11 + Part 13). */
const SECTIONS: {
  type: ReportType;
  title: string;
  emptyTitle: string;
}[] = [
  { type: "daily", title: "Daily reports", emptyTitle: "No daily reports yet." },
  { type: "weekly", title: "Weekly reports", emptyTitle: "No weekly reports yet." },
  { type: "monthly", title: "Monthly reports", emptyTitle: "No monthly reports yet." },
];

export default async function ReportsPage() {
  const reports = await getReports();

  const toRow = (report: Report): LedgerRow => ({
    id: report.id,
    href: `/portal/reports/${report.id}`,
    pill: TYPE_LABEL[report.type],
    title: report.title,
    date: new Date(report.report_date).toLocaleDateString(),
  });

  return (
    <div className="reports">
      <h1 className="reports__heading">Reports</h1>

      {SECTIONS.map(({ type, title, emptyTitle }) => {
        const rows = reports.filter((r) => r.type === type).map(toRow);
        return (
          <Card key={type} style={{ padding: 0 }}>
            <div className="reports__section-head">
              <h2 className="reports__section-title">{title}</h2>
            </div>
            <Ledger rows={rows} emptyTitle={emptyTitle} />
          </Card>
        );
      })}
    </div>
  );
}
