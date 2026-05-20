"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";

/* Voice spec (Part 13) — the approved login-fail wording. */
const LOGIN_FAILED =
  "That email and password don't match. Check both and try again.";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/portal/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? LOGIN_FAILED : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Demo mode: no real auth — go straight into the portal.
    if (!isSupabaseConfigured) {
      router.push(redirectTo);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(LOGIN_FAILED);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Card elevation="raised">
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {!isSupabaseConfigured && (
          <p
            style={{
              margin: 0,
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--color-line-soft)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-caption)",
              lineHeight: "var(--leading-body)",
              color: "var(--color-text-muted)",
            }}
          >
            Demo mode — any email and password will sign you in.
          </p>
        )}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />

        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-caption)",
              lineHeight: "var(--leading-body)",
              color: "var(--color-accent-red)",
            }}
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          rank="primary"
          loading={loading}
          style={{ width: "100%" }}
        >
          Sign in
        </Button>

        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          Need access? Get in touch with urayf
        </p>
      </form>
    </Card>
  );
}
