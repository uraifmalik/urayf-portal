"use client";

import { Toggle } from "@/components/ui/Toggle";
import { usePreferences } from "@/lib/preferences";

/**
 * Preferences — theme + motion toggles. Mirrors the row register
 * used by Account (left label, right control), but using the
 * shared Toggle component instead of a Button.
 */
export function PreferencesSection() {
  const { theme, motion, setTheme, setMotion } = usePreferences();

  return (
    <div className="settings__account">
      <div className="settings__row">
        <p className="settings__label">Theme</p>
        <Toggle
          label="Theme"
          checked={theme === "dark"}
          onChange={(on) => setTheme(on ? "dark" : "light")}
        />
      </div>
      <div className="settings__row">
        <p className="settings__label">Motion</p>
        <Toggle
          label="Motion"
          checked={motion === "full"}
          onChange={(on) => setMotion(on ? "full" : "reduced")}
        />
      </div>
    </div>
  );
}
