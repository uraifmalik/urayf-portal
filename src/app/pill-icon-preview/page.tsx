import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { StatusPill, TypePill } from "@/components/ui/Pill";

/* Dev-only gallery for the Part 10 pills and Part 9 icons, both
   themes. Don't apply across the app yet — review only. */

const ICONS: IconName[] = ["reports", "meetings", "account", "admin"];

const eyebrow: CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-caption)",
  fontWeight: "var(--font-weight-semibold)",
  letterSpacing: "var(--tracking-caps)",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  margin: "0 0 var(--space-3)",
};

function ThemePanel({ theme }: { theme: "light" | "dark" }) {
  const panel: CSSProperties = {
    backgroundColor: "var(--color-paper)",
    color: "var(--color-text-primary)",
    padding: "var(--space-6)",
    flex: 1,
  };
  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    flexWrap: "wrap",
  };

  return (
    <section data-theme={theme} style={panel}>
      <h2 style={{ ...eyebrow, marginBottom: "var(--space-5)" }}>
        {theme} theme
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div>
          <p style={eyebrow}>Status pills</p>
          <div style={row}>
            <StatusPill tone="negative">Short</StatusPill>
            <StatusPill tone="positive">Over</StatusPill>
            <StatusPill tone="neutral">Pending</StatusPill>
          </div>
        </div>

        <div>
          <p style={eyebrow}>Type pills</p>
          <div style={row}>
            <TypePill>Daily</TypePill>
            <TypePill>Weekly</TypePill>
            <TypePill>Monthly</TypePill>
          </div>
        </div>

        <div>
          <p style={eyebrow}>Icons — inherit text color, never gold</p>
          <div style={{ ...row, gap: "var(--space-5)" }}>
            {ICONS.map((name) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <Icon name={name} size={32} />
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--text-caption)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PillIconPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
