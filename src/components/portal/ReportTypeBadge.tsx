import type { ReportType } from "@/lib/types";

const STYLES: Record<ReportType, string> = {
  daily: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  weekly: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
  monthly: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
};

const LABELS: Record<ReportType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function ReportTypeBadge({ type }: { type: ReportType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
