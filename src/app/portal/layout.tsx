import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "urayf — portal",
  description: "urayf client portal.",
};

/**
 * Wraps every /portal route. Kept intentionally thin — the dashboard
 * chrome (sidebar + header) lives in the `(app)` route group so the login
 * page can opt out of it.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
