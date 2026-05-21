import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Ledger, type LedgerRow } from "@/components/ui/Ledger";
import { getCurrentUser } from "@/lib/auth";
import { getReports, getUserStores } from "@/lib/data";
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
  const user = await getCurrentUser();
  const [reports, userStores] = await Promise.all([
    getReports(),
    getUserStores(user),
  ]);

  // RLS scopes reports server-side, but we additionally filter to the
  // stores the user is actually joined to for the dashboard's recent
  // list (defence in depth, and so the data layer can be used uniformly).
  const allowedStoreIds = new Set(userStores.map((s) => s.id));
  const allowedReports = reports.filter((r) =>
    allowedStoreIds.has(r.store_id),
  );
  const storeById = new Map(userStores.map((s) => [s.id, s] as const));

  const stats = [
    { label: "Total reports", value: allowedReports.length },
    {
      label: "Daily",
      value: allowedReports.filter((r) => r.type === "daily").length,
    },
    {
      label: "Weekly",
      value: allowedReports.filter((r) => r.type === "weekly").length,
    },
    {
      label: "Monthly",
      value: allowedReports.filter((r) => r.type === "monthly").length,
    },
  ];

  const recentRows: LedgerRow[] = allowedReports.slice(0, 5).map((report) => {
    const store = storeById.get(report.store_id);
    return {
      id: report.id,
      href: store
        ? `/portal/${store.slug}/${report.id}`
        : `/portal/dashboard`,
      pill: TYPE_LABEL[report.type] ?? report.type,
      storePill: store?.short_name,
      title: report.title,
      date: new Date(report.report_date).toLocaleDateString(),
    };
  });

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
        <Ledger
          rows={recentRows}
          emptyTitle="No reports to view yet."
          emptyVariant="quiet"
        />
      </Card>
    </div>
  );
}
