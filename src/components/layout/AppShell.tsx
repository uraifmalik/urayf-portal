"use client";

import { useState } from "react";
import { Toaster } from "@/components/ui/toast";
import { LoginTransition } from "@/components/portal/LoginTransition";
import WelcomeModal from "@/components/portal/WelcomeModal";
import { Icon } from "@/components/ui/Icon";
import {
  SIDEBAR_CYCLE,
  usePreferences,
  useSidebarState,
} from "@/lib/preferences";
import type { Plan, Store } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { Wordmark } from "./Wordmark";
import "./shell.css";

export interface AppShellProps {
  children: React.ReactNode;
  /** Per-client custom greeting; null falls back to a generic greeting. */
  greeting?: string | null;
  /** Profile id — needed by the profile menu. */
  userId: string;
  /** Email — shown in the profile menu. */
  email: string;
  /** Full name used by the sidebar's identity block (avatar + first name). */
  fullName?: string | null;
  /** Public URL of the user's avatar image; null falls back to initials. */
  avatarUrl?: string | null;
  /** Plan tier shown in the identity block. */
  plan?: Plan | null;
  /** Stores the user is joined to, in nav order. */
  stores: Store[];
  /** Admin link shows only for admin users. */
  isAdmin?: boolean;
  /** When true, mounts the first-login welcome modal. */
  showWelcome?: boolean;
}

/**
 * The portal page shell (Part 8 + Part 4). Below 760px the sidebar
 * collapses to a top bar + L3 overlay. Desktop adds a three-state
 * collapse cycle (open → rail → hidden); the floating toggle below
 * mounts only when the sidebar is hidden.
 */
export function AppShell({
  children,
  greeting,
  userId,
  email,
  fullName,
  avatarUrl,
  plan,
  stores,
  isAdmin,
  showWelcome,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  usePreferences();
  const [sidebarState, setSidebarState] = useSidebarState();

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

      {/* Floating toggle — only present when the sidebar is hidden. */}
      {sidebarState === "hidden" && (
        <button
          type="button"
          className="shell__floating-toggle"
          aria-label="Show sidebar"
          onClick={() => setSidebarState(SIDEBAR_CYCLE.hidden)}
        >
          <Icon name="panel-toggle" size={18} state="hidden" />
        </button>
      )}

      <div className="shell__layout">
        <aside className="shell__sidebar">
          <Sidebar
            greeting={greeting}
            stores={stores}
            userId={userId}
            email={email}
            fullName={fullName}
            avatarUrl={avatarUrl}
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
      <LoginTransition />
    </div>
  );
}
