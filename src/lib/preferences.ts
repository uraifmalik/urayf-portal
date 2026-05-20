"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "urayf-theme";
const MOTION_KEY = "urayf-motion";

export type ThemePreference = "light" | "dark";
export type MotionPreference = "full" | "reduced";

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
