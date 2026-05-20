"use client";

import { useState } from "react";
import { Toaster } from "@/components/ui/toast";
import WelcomeModal from "@/components/portal/WelcomeModal";
import { usePreferences } from "@/lib/preferences";
import type { Plan } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Wordmark } from "./Wordmark";
import "./shell.css";

export interface AppShellProps {
  children: React.ReactNode;
  /** Per-client custom greeting; null falls back to a generic greeting. */
  greeting?: string | null;
  /** Store identity line — the client's store. Null hides the line. */
  storeIdentity: string | null;
  /** Full name used by the sidebar's identity block (avatar + first name). */
  fullName?: string | null;
  /** Plan tier shown in the identity block. */
  plan?: Plan | null;
  /** Admin link shows only for admin users. */
  isAdmin?: boolean;
  /** When true, mounts the first-login welcome modal. */
  showWelcome?: boolean;
}

/**
 * The portal page shell (Part 8 + Part 4) — sidebar + main content
 * area on a 1144px grid. Below 760px the sidebar collapses to a top
 * bar; the menu button slides it in as an L3 overlay with a scrim.
 */
export function AppShell({
  children,
  greeting,
  storeIdentity,
  fullName,
  plan,
  isAdmin,
  showWelcome,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  usePreferences();

  return (
    <div className="shell" data-menu-open={menuOpen || undefined}>
      {/* Mobile top bar — hidden at desktop widths */}
      <header className="shell__topbar">
        <Wordmark />
        <button
          type="button"
          className="shell__menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7 H20" />
            <path d="M4 12 H20" />
            <path d="M4 17 H20" />
          </svg>
        </button>
      </header>

      {/* Scrim — dims the page behind the mobile overlay */}
      <div className="shell__scrim" onClick={close} aria-hidden="true" />

      <div className="shell__layout">
        <aside className="shell__sidebar">
          <Sidebar
            greeting={greeting}
            storeIdentity={storeIdentity}
            fullName={fullName}
            plan={plan}
            isAdmin={isAdmin}
            onNavigate={close}
          />
        </aside>
        <main className="shell__main">
          <div className="shell__content">{children}</div>
        </main>
      </div>

      <Toaster />
      {showWelcome && <WelcomeModal />}
    </div>
  );
}
