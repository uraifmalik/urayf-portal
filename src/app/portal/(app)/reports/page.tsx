import type { Metadata } from "next";
import Link from "next/link";
import ReportTypeBadge from "@/components/portal/ReportTypeBadge";
import { getReports, getStores } from "@/lib/data";

export const metadata: Metadata = {
  title: "Reports — Urayf Portal",
};

export default async function ReportsPage() {
  const [reports, stores] = await Promise.all([getReports(), getStores()]);
  const storeName = (id: string) =>
    stores.find((s) => s.id === id)?.name ?? "Unknown store";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {reports.length} report{reports.length === 1 ? "" : "s"} available to
          you.
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-white/5 bg-zinc-900 px-5 py-12 text-center text-sm text-zinc-500">
          No reports have been delivered to you yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/portal/reports/${report.id}`}
              className="group flex flex-col rounded-xl border border-white/5 bg-zinc-900 p-5 transition-colors hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {storeName(report.store_id)}
                </span>
                <ReportTypeBadge type={report.type} />
              </div>
              <h3 className="mt-3 font-medium text-white group-hover:underline">
                {report.title}
              </h3>
              <p className="mt-4 text-xs text-zinc-600">
                Report date ·{" "}
                {new Date(report.report_date).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
