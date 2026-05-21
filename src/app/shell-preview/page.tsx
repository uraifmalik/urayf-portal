import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

/* Dev-only preview of the page shell (Part 8 + Part 4) — sidebar +
   content grid, both themes. Narrow the browser below 760px to see
   the sidebar collapse to a top bar + slide-in L3 overlay. Not wired
   into the real routed pages. */

function SampleContent({ theme }: { theme: string }) {
  const eyebrow: CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-caption)",
    fontWeight: "var(--font-weight-semibold)",
    letterSpacing: "var(--tracking-caps)",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    margin: 0,
  };

  return (
    <>
      <p style={eyebrow}>{theme} theme · portal shell</p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: "var(--font-weight-regular)",
          fontSize: "var(--text-heading)",
          color: "var(--color-text-primary)",
          letterSpacing: "var(--tracking-display)",
          margin: "var(--space-3) 0 var(--space-5)",
        }}
      >
        Reports
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {["Daily — May 18", "Weekly — May 12", "Monthly — April"].map(
          (title) => (
            <Card key={title}>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-body)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-body)",
                  color: "var(--color-text-muted)",
                  margin: "var(--space-2) 0 0",
                  lineHeight: "var(--leading-body)",
                }}
              >
                Sample card on the content grid — 1144px max, centered.
              </p>
            </Card>
          ),
        )}
      </div>
    </>
  );
}

export default function ShellPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div>
      <div data-theme="light">
        <AppShell
          greeting="Mr. Malik"
          userId="preview"
          email="preview@urayf.com"
          fullName="Aisha Rahman"
          plan="premium"
          stores={[]}
          isAdmin
        >
          <SampleContent theme="Light" />
        </AppShell>
      </div>
      <div data-theme="dark">
        <AppShell
          greeting="Mr. Malik"
          userId="preview"
          email="preview@urayf.com"
          fullName="Aisha Rahman"
          plan="premium"
          stores={[]}
          isAdmin
        >
          <SampleContent theme="Dark" />
        </AppShell>
      </div>
    </div>
  );
}
