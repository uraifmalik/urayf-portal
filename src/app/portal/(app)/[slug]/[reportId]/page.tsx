import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportViewer from "@/components/portal/ReportViewer";
import { getCurrentUser } from "@/lib/auth";
import {
  getReport,
  getStoreBySlug,
  getUserStores,
} from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string; reportId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { reportId } = await params;
  const report = await getReport(reportId);
  return {
    title: report
      ? `${report.title} — urayf portal`
      : "Report unavailable — urayf portal",
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { slug, reportId } = await params;

  const [user, store, report] = await Promise.all([
    getCurrentUser(),
    getStoreBySlug(slug),
    getReport(reportId),
  ]);

  // 404 (not 403) for any of: missing store, missing report, the
  // report doesn't belong to this slug's store, or the user isn't
  // joined to it. We don't want to reveal whether the store or
  // report exists when the viewer has no business looking.
  if (!store || !report || report.store_id !== store.id) notFound();

  const userStores = await getUserStores(user);
  const authorized = userStores.some((s) => s.id === store.id);
  if (!authorized) notFound();

  return <ReportViewer report={report} store={store} />;
}
