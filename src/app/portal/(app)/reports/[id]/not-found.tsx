import Link from "next/link";

export default function ReportNotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-white/5 bg-zinc-900 p-10 text-center">
      <h1 className="text-lg font-semibold text-white">Report not found</h1>
      <p className="text-sm text-zinc-500">
        This report does not exist or is not available to your account.
      </p>
      <Link
        href="/portal/reports"
        className="inline-block text-sm text-zinc-300 underline transition-colors hover:text-white"
      >
        Back to reports
      </Link>
    </div>
  );
}
