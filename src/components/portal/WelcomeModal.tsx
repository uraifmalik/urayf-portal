"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import "@/components/ui/field.css"; // .field__input for the modal's input
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import "./welcome.css";

type Phase = "ask" | "writing" | "closing";

/**
 * The first-login welcome modal. Two-state flow:
 *   ask     — "How would you like us to address you?" + input + buttons.
 *   writing — "Welcome, {input}." + progress bar growing 0→100% over 1s.
 *             The bar's 1.0s is a MINIMUM: if the save takes longer, the
 *             close waits for the save before tearing down.
 *   closing — fade out (300ms), then unmount + refresh.
 *
 * Skip closes immediately — no animation, no fanfare — and fires
 * `mark_welcome_seen` in the background so the modal never reopens.
 */
export default function WelcomeModal() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ask");
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(true);

  async function onSkip() {
    // Immediate visual close — no animation per spec.
    setMounted(false);
    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        await supabase.rpc("mark_welcome_seen");
      }
    } catch {
      /* ignore — refresh below ensures next render reflects state */
    }
    router.refresh();
  }

  async function onSave() {
    const trimmed = input.trim();
    if (!trimmed) {
      onSkip();
      return;
    }
    if (trimmed.length > 40) return;

    setPhase("writing");
    const start = Date.now();
    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        await supabase.rpc("set_display_greeting", { new_greeting: trimmed });
      }
    } catch {
      /* ignore — close anyway */
    }
    // The bar's 1.0s duration is a minimum; if save took longer, this
    // simply resolves to 0 and the close fires once both are done.
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, 1000 - elapsed);
    setTimeout(() => {
      setPhase("closing");
      setTimeout(() => {
        setMounted(false);
        router.refresh();
      }, 300);
    }, remaining);
  }

  // Escape = Skip (only while we're still asking).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && phase === "ask") onSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!mounted) return null;

  // Scrim click = Skip — but only for the scrim itself, not the modal.
  function onScrimClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && phase === "ask") onSkip();
  }

  const trimmedDisplay = input.trim();

  return (
    <div
      className="welcome-scrim"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={onScrimClick}
    >
      <div className="welcome" data-phase={phase}>
        {/* STATE 1 — the ask */}
        <div className="welcome__ask">
          <h2 id="welcome-title" className="welcome__question">
            How would you like us to address you?
          </h2>
          <div className="welcome__field">
            <input
              className="field__input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={40}
              placeholder='e.g. "Mr. Malik"'
              autoFocus
              disabled={phase !== "ask"}
              aria-labelledby="welcome-title"
            />
          </div>
          <div className="welcome__actions">
            <Button
              rank="ghost"
              onClick={onSkip}
              disabled={phase !== "ask"}
            >
              Skip for now
            </Button>
            <Button
              rank="primary"
              onClick={onSave}
              disabled={phase !== "ask"}
            >
              Save
            </Button>
          </div>
        </div>

        {/* STATE 2 — the moment of recognition */}
        <div className="welcome__done">
          <p className="welcome__greeting">
            {trimmedDisplay ? `Welcome, ${trimmedDisplay}.` : "Welcome."}
          </p>
          <div className="welcome__bar-track" aria-hidden="true">
            <div className="welcome__bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
