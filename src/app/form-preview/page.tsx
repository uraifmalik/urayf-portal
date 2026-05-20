"use client";

import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { TextField } from "@/components/ui/TextField";

/* Dev-only gallery for the form primitives (Part 7) — text field,
   label, error message. Both themes. Default / filled / error /
   disabled / optional show statically; hover and focus are reachable
   by interacting. The last field validates live on blur. */

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
    return "Enter a valid email address.";
  return null;
}

function ThemePanel({ theme }: { theme: "light" | "dark" }) {
  const panel: CSSProperties = {
    backgroundColor: "var(--color-paper)",
    color: "var(--color-text-primary)",
    padding: "var(--space-6)",
    flex: 1,
  };
  const eyebrow: CSSProperties = {
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-caption)",
    fontWeight: "var(--font-weight-semibold)",
    letterSpacing: "var(--tracking-caps)",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    margin: "0 0 var(--space-5)",
  };

  return (
    <section data-theme={theme} style={panel}>
      <h2 style={eyebrow}>{theme} theme</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
          maxWidth: "320px",
        }}
      >
        <TextField label="Default" placeholder="Placeholder text" />
        <TextField label="Filled" defaultValue="Aisha Rahman" />
        <TextField
          label="Error"
          defaultValue="not-an-email"
          error="Enter a valid email address."
        />
        <TextField
          label="Disabled"
          defaultValue="URY-0042"
          disabled
        />
        <TextField
          label="Company"
          optional
          placeholder="Placeholder text"
        />
        <TextField
          label="Validates on blur"
          type="email"
          placeholder="you@example.com"
          validate={validateEmail}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-caption)",
          color: "var(--color-text-faint)",
          margin: "var(--space-5) 0 0",
          lineHeight: "var(--leading-body)",
          maxWidth: "320px",
        }}
      >
        Hover and tab-focus any field for those two states. The last
        field validates on blur — type something, then click away.
      </p>
    </section>
  );
}

export default function FormPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ display: "flex", minHeight: "100vh", flexWrap: "wrap" }}>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
