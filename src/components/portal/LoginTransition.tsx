"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import "./login-transition.css";

const FLAG_KEY = "urayf-just-logged-in";
const BAR_MS = 1000;
const FADE_MS = 300;

type Phase = "loading" | "closing";

/**
 * Full-screen transition shown ONCE after a successful login, before
 * the dashboard appears. Wordmark + progress bar over surface-paper,
 * always light. Triggered by a sessionStorage flag set by LoginForm
 * just before navigation; the flag is cleared on mount so the
 * overlay only ever appears for the immediate post-login render.
 */
export function LoginTransition() {
  const [shown, setShown] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    let flag: string | null = null;
    try {
      flag = sessionStorage.getItem(FLAG_KEY);
      if (flag) sessionStorage.removeItem(FLAG_KEY);
    } catch {
      /* storage unavailable — never show the overlay */
    }
    if (!flag) return;

    setShown(true);
    const barTimer = setTimeout(() => setPhase("closing"), BAR_MS);
    const closeTimer = setTimeout(
      () => setShown(false),
      BAR_MS + FADE_MS,
    );
    return () => {
      clearTimeout(barTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  if (!shown) return null;

  return (
    <div
      className="login-transition"
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label="Signing you in"
    >
      <div className="login-transition__stack">
        {/* Reserved space for the logo icon when one ships. */}
        <div className="login-transition__logo-slot" aria-hidden="true" />
        <Wordmark className="login-transition__wordmark" />
        <div className="login-transition__bar-track" aria-hidden="true">
          <div className="login-transition__bar" />
        </div>
      </div>
    </div>
  );
}
