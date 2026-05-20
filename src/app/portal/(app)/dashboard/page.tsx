import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Ledger, type LedgerRow } from "@/components/ui/Ledger";
import { getReports } from "@/lib/data";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard — urayf portal",
};

const TYPE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default async function DashboardPage() {
  const reports = await getReports();

  const stats = [
    { label: "Total reports", value: reports.length },
    {
      label: "Daily",
      value: reports.filter((r) => r.type === "daily").length,
    },
    {
      label: "Weekly",
      value: reports.filter((r) => r.type === "weekly").length,
    },
    {
      label: "Monthly",
      value: reports.filter((r) => r.type === "monthly").length,
    },
  ];

  const recentRows: LedgerRow[] = reports.slice(0, 5).map((report) => ({
    id: report.id,
    href: `/portal/reports/${report.id}`,
    pill: TYPE_LABEL[report.type] ?? report.type,
    title: report.title,
    date: new Date(report.report_date).toLocaleDateString(),
  }));

  return (
    <div className="dash">
      <h1 className="dash__heading">Dashboard</h1>

      <div className="dash__stats">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat">
            <p className="stat__label">{stat.label}</p>
            <p className="stat__figure">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div className="ledger__head">
          <h2 className="ledger__title">Latest reports</h2>
        </div>
        <Ledger rows={recentRows} />
      </Card>
    </div>
  );
}
