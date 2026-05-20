import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportViewer from "@/components/portal/ReportViewer";
import { getReport, getStore } from "@/lib/data";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  return {
    title: report
      ? `${report.title} — urayf portal`
      : "Report unavailable — urayf portal",
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) notFound();

  const store = await getStore(report.store_id);

  return <ReportViewer report={report} store={store} />;
}
