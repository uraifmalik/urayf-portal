import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AddStoreForm from "@/components/portal/AddStoreForm";
import ReportTypeBadge from "@/components/portal/ReportTypeBadge";
import UploadReportForm from "@/components/portal/UploadReportForm";
import { getCurrentUser } from "@/lib/auth";
import { getProfiles, getReports, getStores } from "@/lib/data";

export const metadata: Metadata = {
  title: "Admin — Urayf Portal",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user.is_admin) redirect("/portal/dashboard");

  const [reports, stores, profiles] = await Promise.all([
    getReports(),
    getStores(),
    getProfiles(),
  ]);

  const storeName = (id: string | null) =>
    stores.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload reports and manage stores and client accounts.
        </p>
      </div>

      {/* Upload a report ---------------------------------------------- */}
      <section className="rounded-xl border border-white/5 bg-zinc-900">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-medium text-white">Upload a report</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            The HTML file is delivered to the selected store&apos;s portal.
          </p>
        </div>
        <div className="p-5">
          <UploadReportForm stores={stores} />
        </div>
      </section>

      {/* Stores ------------------------------------------------------- */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <h2 className="font-medium text-white">
            Stores <span className="text-zinc-500">({stores.length})</span>
          </h2>
          <AddStoreForm />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium">Reports</th>
                <th className="px-5 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stores.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-6 text-center text-zinc-500"
                  >
                    No stores yet.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td className="px-5 py-3 text-white">{store.name}</td>
                    <td className="px-5 py-3 text-zinc-400">
                      {reports.filter((r) => r.store_id === store.id).length}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {new Date(store.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Client accounts --------------------------------------------- */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-medium text-white">
            Client accounts{" "}
            <span className="text-zinc-500">({profiles.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-5 py-3 text-white">
                    {profile.full_name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{profile.email}</td>
                  <td className="px-5 py-3 text-zinc-400">
                    {profile.is_admin ? "—" : storeName(profile.store_id)}
                  </td>
                  <td className="px-5 py-3 text-zinc-400">
                    {profile.is_admin ? "Admin" : "Client"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/5 px-5 py-3 text-xs text-zinc-600">
          Client accounts are created at sign-up. Assign a client to a store
          from the Supabase dashboard (see <code>supabase/schema.sql</code>).
        </p>
      </section>

      {/* All reports -------------------------------------------------- */}
      <section className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-medium text-white">
            All reports <span className="text-zinc-500">({reports.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Report date</th>
                <th className="px-5 py-3 font-medium">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-6 text-center text-zinc-500"
                  >
                    No reports uploaded yet.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-5 py-3 text-white">{report.title}</td>
                    <td className="px-5 py-3 text-zinc-400">
                      {storeName(report.store_id)}
                    </td>
                    <td className="px-5 py-3">
                      <ReportTypeBadge type={report.type} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {new Date(report.report_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {report.file_name ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
