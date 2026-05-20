import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/* Dev-only gallery for the card / elevation system (Part 5) — L1
   raised, L2 floating, L3 modal — in both themes. The L3 example
   sits on a scrim so the dimmed ground reads behind it. */

function CardBody({ level, note }: { level: string; note: string }) {
  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-caption)",
          fontWeight: "var(--font-weight-semibold)",
          letterSpacing: "var(--tracking-caps)",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          margin: "0 0 var(--space-2)",
        }}
      >
        {level}
      </p>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-body)",
          color: "var(--color-text-primary)",
          margin: 0,
          lineHeight: "var(--leading-body)",
        }}
      >
        {note}
      </p>
    </>
  );
}

function ThemePanel({ theme }: { theme: "light" | "dark" }) {
  const panel: CSSProperties = {
    backgroundColor: "var(--color-paper)",
    color: "var(--color-text-primary)",
    padding: "var(--space-6)",
    flex: 1,
  };

  return (
    <section data-theme={theme} style={panel}>
      <h2
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-caption)",
          fontWeight: "var(--font-weight-semibold)",
          letterSpacing: "var(--tracking-caps)",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          margin: "0 0 var(--space-5)",
        }}
      >
        {theme} theme
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
          maxWidth: "340px",
        }}
      >
        {/* L1 raised — no shadow */}
        <Card elevation="raised">
          <CardBody
            level="L1 — raised"
            note="Surface-step and border only. A card never carries a shadow."
          />
        </Card>

        {/* L2 floating — the deeper shadow */}
        <Card elevation="floating">
          <CardBody
            level="L2 — floating"
            note="Dropdowns and popovers. Adds the deeper --shadow-l2."
          />
        </Card>

        {/* L3 modal — dramatic shadow over a scrim */}
        <div
          style={
            {
              position: "relative",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              backgroundColor: "var(--color-paper)",
              padding: "var(--space-6) var(--space-4)",
            } as CSSProperties
          }
        >
          {/* the scrim dims the ground behind the modal */}
          <div
            className="card-scrim"
            style={{ position: "absolute", inset: 0 }}
            aria-hidden="true"
          />
          <Card
            elevation="modal"
            style={{ position: "relative" } as CSSProperties}
          >
            <CardBody
              level="L3 — modal"
              note="Dialogs. Adds the dramatic --shadow-l3 over a dimmed scrim."
            />
          </Card>
        </div>
      </div>
    </section>
  );
}

export default function CardPreviewPage(): ReactNode {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
