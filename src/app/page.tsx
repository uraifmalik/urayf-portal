import type { Metadata } from "next";
import Homepage from "@/components/home/Homepage";

export const metadata: Metadata = {
  title: "Urayf",
  description: "Urayf",
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
