import type { Metadata } from "next";
import Homepage from "@/components/home/Homepage";

export const metadata: Metadata = {
  title: "urayf — business intelligence for owners and franchisees",
  description:
    "urayf is a boutique business intelligence firm. Custom-crafted reports for store owners who want to understand their business down to the hour.",
};

/**
 * urayf.com — the public homepage.
 *
 * This route renders nothing but the self-contained <Homepage /> component.
 * All homepage markup, styling and (future) animation live under
 * `src/components/home/`. The portal lives entirely under `src/app/portal/`
 * and `src/components/portal/` — the two never import from each other.
 */
export default function Page() {
  return <Homepage />;
}
