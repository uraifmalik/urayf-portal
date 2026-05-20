import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AddStoreForm from "@/components/portal/AddStoreForm";
import UploadReportForm from "@/components/portal/UploadReportForm";
import { Card } from "@/components/ui/Card";
import { TypePill } from "@/components/ui/Pill";
import { getCurrentUser } from "@/lib/auth";
import { getProfiles, getReports, getStores } from "@/lib/data";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin — urayf portal",
};

const TYPE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
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
    <div className="admin">
      <h1 className="admin__heading">Admin</h1>

      {/* Upload a report --------------------------------------------- */}
      <Card style={{ padding: 0 }}>
        <div className="panel__head">
          <div className="panel__heading-text">
            <h2 className="panel__title">Upload a report</h2>
            <p className="panel__intro">
              The HTML file is delivered to the selected store&apos;s portal.
            </p>
          </div>
        </div>
        <div className="panel__body">
          <UploadReportForm stores={stores} />
        </div>
      </Card>

      {/* Stores ------------------------------------------------------ */}
      <Card style={{ padding: 0 }}>
        <div className="panel__head">
          <div className="panel__heading-text">
            <h2 className="panel__title">
              Stores <span className="panel__count">({stores.length})</span>
            </h2>
          </div>
          <AddStoreForm />
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Store</th>
                <th className="admin-table__num">Reports</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-table__empty">
                    No stores yet.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td className="admin-table__primary">{store.name}</td>
                    <td className="admin-table__num">
                      {reports.filter((r) => r.store_id === store.id).length}
                    </td>
                    <td>
                      {new Date(store.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client accounts --------------------------------------------- */}
      <Card style={{ padding: 0 }}>
        <div className="panel__head">
          <div className="panel__heading-text">
            <h2 className="panel__title">
              Client accounts{" "}
              <span className="panel__count">({profiles.length})</span>
            </h2>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Store</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="admin-table__primary">
                    {profile.full_name ?? "—"}
                  </td>
                  <td>{profile.email}</td>
                  <td>
                    {profile.is_admin ? "—" : storeName(profile.store_id)}
                  </td>
                  <td>{profile.is_admin ? "Admin" : "Client"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel__note">
          Client accounts are created in the Supabase Auth panel, then
          assigned to a store in the dashboard (see{" "}
          <code>supabase/schema.sql</code>).
        </p>
      </Card>

      {/* All reports ------------------------------------------------- */}
      <Card style={{ padding: 0 }}>
        <div className="panel__head">
          <div className="panel__heading-text">
            <h2 className="panel__title">
              All reports{" "}
              <span className="panel__count">({reports.length})</span>
            </h2>
          </div>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Store</th>
                <th>Type</th>
                <th>Report date</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No reports uploaded yet.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td className="admin-table__primary">{report.title}</td>
                    <td>{storeName(report.store_id)}</td>
                    <td>
                      <TypePill>
                        {TYPE_LABEL[report.type] ?? report.type}
                      </TypePill>
                    </td>
                    <td>
                      {new Date(report.report_date).toLocaleDateString()}
                    </td>
                    <td>{report.file_name ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
