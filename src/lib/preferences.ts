"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const THEME_KEY = "urayf-theme";
const MOTION_KEY = "urayf-motion";
const SIDEBAR_KEY = "urayf-sidebar";

export type ThemePreference = "light" | "dark";
export type MotionPreference = "full" | "reduced";
export type SidebarState = "open" | "rail" | "hidden";

export const SIDEBAR_CYCLE: Record<SidebarState, SidebarState> = {
  open: "rail",
  rail: "hidden",
  hidden: "open",
};

export interface Preferences {
  theme: ThemePreference;
  motion: MotionPreference;
  setTheme: (next: ThemePreference) => void;
  setMotion: (next: MotionPreference) => void;
}

/**
 * Read the stored theme + motion preferences, apply them to
 * <html data-theme> / <html data-motion>, and return setters that
 * persist + re-apply on change. Used by AppShell to hydrate on
 * mount and by Settings to expose the toggles.
 */
export function usePreferences(): Preferences {
  const [theme, setThemeState] = useState<ThemePreference>("light");
  const [motion, setMotionState] = useState<MotionPreference>("full");

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    }

    const storedMotion = localStorage.getItem(MOTION_KEY);
    const initialMotion: MotionPreference =
      storedMotion === "full" || storedMotion === "reduced"
        ? storedMotion
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "reduced"
          : "full";
    setMotionState(initialMotion);
    document.documentElement.setAttribute("data-motion", initialMotion);
  }, []);

  function setTheme(next: ThemePreference) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable — preference still applies this session */
    }
  }

  function setMotion(next: MotionPreference) {
    setMotionState(next);
    document.documentElement.setAttribute("data-motion", next);
    try {
      localStorage.setItem(MOTION_KEY, next);
    } catch {
      /* storage unavailable — preference still applies this session */
    }
  }

  return { theme, motion, setTheme, setMotion };
}

/* ============================================================
   Sidebar state — module-scoped external store.
   The hook is called from BOTH AppShell (to decide whether to mount
   the floating toggle) and Sidebar (to drive the in-sidebar toggle).
   Both must observe the same value, so we cannot use per-component
   useState; we use useSyncExternalStore over a tiny pub-sub instead.
   The DOM attribute on <html> is the source of truth — the inline
   script in app/layout.tsx sets it before first paint.
   ============================================================ */

const sidebarListeners = new Set<() => void>();
function subscribeSidebar(cb: () => void) {
  sidebarListeners.add(cb);
  return () => {
    sidebarListeners.delete(cb);
  };
}
function emitSidebar() {
  sidebarListeners.forEach((cb) => cb());
}

function readSidebarFromDOM(): SidebarState {
  if (typeof document === "undefined") return "open";
  const v = document.documentElement.getAttribute("data-sidebar");
  return v === "rail" || v === "hidden" || v === "open" ? v : "open";
}

/**
 * Read the persisted sidebar collapse state ("open" | "rail" | "hidden"),
 * keep `<html data-sidebar>` in sync, and persist on change. Mobile
 * ignores this state — see shell.css.
 */
export function useSidebarState(): [SidebarState, (next: SidebarState) => void] {
  const state = useSyncExternalStore<SidebarState>(
    subscribeSidebar,
    readSidebarFromDOM,
    () => "open",
  );

  function update(next: SidebarState) {
    document.documentElement.setAttribute("data-sidebar", next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next);
    } catch {
      /* storage unavailable — preference still applies this session */
    }
    emitSidebar();
  }

  return [state, update];
}
