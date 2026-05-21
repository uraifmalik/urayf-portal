import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Ledger, type LedgerRow } from "@/components/ui/Ledger";
import { getCurrentUser } from "@/lib/auth";
import { getReports, getStoreBySlug, getUserStores } from "@/lib/data";
import type { Report, ReportType } from "@/lib/types";
import "./store.css";

type PageProps = { params: Promise<{ slug: string }> };

const TYPE_LABEL: Record<ReportType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const SECTIONS: {
  type: ReportType;
  title: string;
  emptyTitle: string;
}[] = [
  { type: "daily", title: "Daily reports", emptyTitle: "No daily reports yet." },
  { type: "weekly", title: "Weekly reports", emptyTitle: "No weekly reports yet." },
  { type: "monthly", title: "Monthly reports", emptyTitle: "No monthly reports yet." },
];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  return {
    title: store
      ? `${store.name} — urayf portal`
      : "Store unavailable — urayf portal",
  };
}

export default async function StoreReportsPage({ params }: PageProps) {
  const { slug } = await params;
  const [user, store] = await Promise.all([
    getCurrentUser(),
    getStoreBySlug(slug),
  ]);
  if (!store) notFound();

  // Authorization — the user must be joined to this store, otherwise
  // 404 (do not reveal that the store exists).
  const userStores = await getUserStores(user);
  const authorized = userStores.some((s) => s.id === store.id);
  if (!authorized) notFound();

  const reports = (await getReports()).filter((r) => r.store_id === store.id);

  const toRow = (report: Report): LedgerRow => ({
    id: report.id,
    href: `/portal/${store.slug}/${report.id}`,
    pill: TYPE_LABEL[report.type],
    title: report.title,
    date: new Date(report.report_date).toLocaleDateString(),
  });

  return (
    <div className="store-reports">
      <h1 className="store-reports__heading">{store.short_name}</h1>

      {SECTIONS.map(({ type, title, emptyTitle }) => {
        const rows = reports.filter((r) => r.type === type).map(toRow);
        return (
          <Card key={type} style={{ padding: 0 }}>
            <div className="store-reports__section-head">
              <h2 className="store-reports__section-title">{title}</h2>
            </div>
            <Ledger
              rows={rows}
              emptyTitle={emptyTitle}
              emptyVariant="quiet"
              hidePill
            />
          </Card>
        );
      })}
    </div>
  );
}
