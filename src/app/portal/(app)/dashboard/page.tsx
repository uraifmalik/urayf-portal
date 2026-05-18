import type { Metadata } from "next";
import Link from "next/link";
import ReportTypeBadge from "@/components/portal/ReportTypeBadge";
import { getReports } from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard — Urayf Portal",
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

  const recent = reports.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of your delivered reports.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/5 bg-zinc-900 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="font-medium text-white">Latest reports</h2>
          <Link
            href="/portal/reports"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            No reports yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {recent.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/portal/reports/${report.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {report.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(report.report_date).toLocaleDateString()}
                    </p>
                  </div>
                  <ReportTypeBadge type={report.type} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
