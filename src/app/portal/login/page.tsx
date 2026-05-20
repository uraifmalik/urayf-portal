import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/portal/LoginForm";
import { Wordmark } from "@/components/layout/Wordmark";

export const metadata: Metadata = {
  title: "Sign in — urayf portal",
};

/* Login is always the LIGHT theme — no toggle here (Part 1). */
export default function LoginPage() {
  return (
    <div
      data-theme="light"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        backgroundColor: "var(--color-paper)",
        color: "var(--color-text-primary)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "360px" }}>
        {/* Wordmark — the only thing above the card. Sits centered,
            a deliberate space-5 above the sign-in form. */}
        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: "var(--space-5)",
            textDecoration: "none",
          }}
        >
          <Wordmark />
        </Link>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
