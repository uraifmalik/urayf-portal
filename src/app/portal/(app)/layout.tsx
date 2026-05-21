import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getUserStores } from "@/lib/data";

/**
 * Dashboard chrome for the authenticated portal: the brand AppShell
 * (sidebar + page shell). The store-identity line under the welcome
 * was removed in the multi-store round — stores now live in the nav
 * itself. Only display_greeting and the stores list are threaded down.
 */
export default async function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userStores = await getUserStores(user);

  // The exact greeting for this client, set manually — null/empty
  // falls back to a generic greeting in the sidebar.
  const greeting = user.display_greeting?.trim() || null;

  return (
    <AppShell
      greeting={greeting}
      userId={user.id}
      email={user.email}
      fullName={user.full_name}
      avatarUrl={user.avatar_url}
      plan={user.plan}
      isAdmin={user.is_admin}
      stores={userStores}
      showWelcome={!user.has_seen_welcome}
    >
      {children}
    </AppShell>
  );
}
