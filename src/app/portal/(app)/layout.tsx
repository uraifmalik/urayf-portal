import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data";

/**
 * Dashboard chrome for the authenticated portal: the brand AppShell
 * (sidebar + page shell). Applies to /portal/dashboard, /portal/reports
 * and /portal/admin. The login page sits outside this route group, so
 * it has no chrome.
 */
export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const store = user.store_id ? await getStore(user.store_id) : null;

  // The exact greeting for this client, set manually — null/empty
  // falls back to a generic greeting in the sidebar.
  const greeting = user.display_greeting?.trim() || null;

  // Store identity line — the client's store, when assigned. The
  // greeting line above carries who the viewer is; no separate role
  // fallback ("Administrator" / "Client") here.
  const storeIdentity = store?.name ?? null;

  return (
    <AppShell
      greeting={greeting}
      storeIdentity={storeIdentity}
      fullName={user.full_name}
      plan={user.plan}
      isAdmin={user.is_admin}
      showWelcome={!user.has_seen_welcome}
    >
      {children}
    </AppShell>
  );
}
