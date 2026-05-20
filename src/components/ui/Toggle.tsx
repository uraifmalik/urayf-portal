"use client";

import { useState } from "react";
import "./toggle.css";

export interface ToggleProps {
  /** Label sits left of the track. */
  label: string;
  /** Uncontrolled initial state. Ignored when `checked` is provided. */
  defaultOn?: boolean;
  /** Controlled state — when set, the parent owns the value. */
  checked?: boolean;
  onChange?: (on: boolean) => void;
}

/**
 * urayf toggle (Part 7) — a pill track with a mark-color knob. Used
 * for the sidebar preferences (Theme, Motion). Works controlled
 * (pass `checked`) or uncontrolled (pass `defaultOn`).
 */
export function Toggle({
  label,
  defaultOn = false,
  checked,
  onChange,
}: ToggleProps) {
  const isControlled = checked !== undefined;
  const [internalOn, setInternalOn] = useState(defaultOn);
  const on = isControlled ? checked : internalOn;

  function toggle() {
    const next = !on;
    if (!isControlled) setInternalOn(next);
    onChange?.(next);
  }

  return (
    <div className="toggle">
      <span className="toggle__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className="toggle__track"
        onClick={toggle}
      >
        <span className="toggle__knob" />
      </button>
    </div>
  );
}
