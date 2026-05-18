import Sidebar from "@/components/portal/Sidebar";
import SignOutButton from "@/components/portal/SignOutButton";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getStore } from "@/lib/data";

/**
 * Dashboard chrome for the authenticated portal: sidebar + top bar.
 * Applies to /portal/dashboard, /portal/reports and /portal/admin.
 * The login page sits outside this route group, so it has no chrome.
 */
export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const store = user.store_id ? await getStore(user.store_id) : null;
  const subtitle = user.is_admin
    ? "Administrator"
    : (store?.name ?? "Client");

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar isAdmin={user.is_admin} />

      <div className="flex min-w-0 flex-1 flex-col">
        {!isSupabaseConfigured && (
          <div className="bg-amber-500/10 px-6 py-2 text-center text-xs text-amber-300">
            Demo mode — Supabase is not configured. Add credentials to{" "}
            <code className="font-mono">.env.local</code> to enable real auth,
            data and uploads.
          </div>
        )}

        <header className="flex h-16 items-center justify-between border-b border-white/5 px-6">
          <div>
            <p className="text-sm font-medium text-white">
              {user.full_name ?? user.email}
            </p>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
          <SignOutButton />
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
