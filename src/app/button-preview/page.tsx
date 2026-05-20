import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Button, type ButtonRank } from "@/components/ui/Button";

/* Dev-only gallery for the Button component — three ranks, both
   themes. Renders the statically-showable states (default, disabled,
   loading); hover / active / focus are reachable by interacting. */

const RANKS: ButtonRank[] = ["primary", "secondary", "ghost"];

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

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {RANKS.map((rank) => (
          <div key={rank}>
            <h3
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-body)",
                fontWeight: "var(--font-weight-medium)",
                margin: "0 0 var(--space-3)",
              }}
            >
              {rank}
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                alignItems: "center",
              }}
            >
              <Button rank={rank}>Default</Button>
              <Button rank={rank} disabled>
                Disabled
              </Button>
              <Button rank={rank} loading>
                Loading
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-caption)",
          color: "var(--color-text-faint)",
          margin: "var(--space-5) 0 0",
          lineHeight: "var(--leading-body)",
        }}
      >
        Hover, press and tab-focus the Default buttons to see the
        remaining three states.
      </p>
    </section>
  );
}

export default function ButtonPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
