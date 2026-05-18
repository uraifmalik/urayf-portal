import { redirect } from "next/navigation";

/**
 * /portal — entry point. Middleware sends unauthenticated visitors to the
 * login page; everyone else lands on the dashboard.
 */
export default function PortalIndex() {
  redirect("/portal/dashboard");
}
