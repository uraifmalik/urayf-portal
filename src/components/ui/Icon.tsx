import type { ReactNode, SVGProps } from "react";
import type { SidebarState } from "@/lib/preferences";

/* urayf icon set (Part 9). Custom icons, drawn to a 24-unit grid,
   1.5 uniform stroke, round caps/joins, outline only. Paths are taken
   verbatim from the brand board. Icons inherit currentColor and are
   NEVER gold — gold is reserved (Part 2). */

const ICONS: Record<string, ReactNode> = {
  // Dashboard — a layout of panels (proposed 5th icon; see build notes)
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="17" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7.5" rx="2" />
      <rect x="13.5" y="13" width="7" height="7.5" rx="2" />
    </>
  ),
  // Reports — a document leaf with a fine top rule
  reports: (
    <>
      <path d="M7 3.5 H14 L17.5 7 V20 A0.5 0.5 0 0 1 17 20.5 H7 A0.5 0.5 0 0 1 6.5 20 V4 A0.5 0.5 0 0 1 7 3.5 Z" />
      <path d="M14 3.5 V7 H17.5" />
      <path d="M9 11.5 H14.5" />
      <path d="M9 14.5 H14.5" />
      <path d="M9 17.5 H12" />
    </>
  ),
  // Meetings — a calendar with a single marked day
  meetings: (
    <>
      <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
      <path d="M4.5 9.5 H19.5" />
      <path d="M8.5 3.5 V6.5 M15.5 3.5 V6.5" />
      <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  // Account — a person: circle + shoulder arc
  account: (
    <>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19.5 A6.5 6.5 0 0 1 18.5 19.5" />
    </>
  ),
  // Admin — a key ("behind the counter")
  admin: (
    <>
      <circle cx="8.5" cy="8.5" r="4" />
      <path d="M11.3 11.3 L19 19 M16.5 16.5 L18.5 14.5 M14 14 L16 12" />
    </>
  ),
  // Sign out — an arrow leaving a frame (proposed 6th icon; see notes)
  signout: (
    <>
      <path d="M14 4 H6 A2 2 0 0 0 4 6 V18 A2 2 0 0 0 6 20 H14" />
      <path d="M10 12 H20" />
      <path d="M16.5 8.5 L20 12 L16.5 15.5" />
    </>
  ),
  // Settings — a gear: rim with six rectangular teeth at clock
  // positions 12, 2, 4, 6, 8, 10, and a hollow inner hub. Rim r=7,
  // tooth = 2 wide × 1.5 deep, hub r=3.6.
  settings: (
    <>
      <path d="M 10.4,1.1 L 13.6,1.1 L 14.2,3.2 A 7,7 0 0 1 16.4,4.5 L 18.4,3.5 L 20.5,5.6 L 19.5,7.6 A 7,7 0 0 1 20.7,9.8 L 22.8,10.4 L 22.8,13.6 L 20.7,14.2 A 7,7 0 0 1 19.5,16.4 L 20.5,18.4 L 18.4,20.5 L 16.4,19.5 A 7,7 0 0 1 14.2,20.8 L 13.6,22.9 L 10.4,22.9 L 9.8,20.8 A 7,7 0 0 1 7.6,19.5 L 5.6,20.5 L 3.5,18.4 L 4.5,16.4 A 7,7 0 0 1 3.3,14.2 L 1.2,13.6 L 1.2,10.4 L 3.3,9.8 A 7,7 0 0 1 4.5,7.6 L 3.5,5.6 L 5.6,3.5 L 7.6,4.5 A 7,7 0 0 1 9.8,3.2 Z" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
};

export type IconName = keyof typeof ICONS | "panel-toggle";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Square size in px. Default 24 — the drawing grid. */
  size?: number;
  /** Sidebar collapse state, used only by the panel-toggle glyph to
   *  position its inner divider. Ignored for other icons. */
  state?: SidebarState;
}

/* panel-toggle — outer rectangle + a sliding inner divider. The divider
   x position encodes the sidebar state (open=9, rail=11, hidden=15);
   it animates between positions via CSS (.panel-toggle__divider). */
const PANEL_TOGGLE_X: Record<SidebarState, number> = {
  open: 9,
  rail: 11,
  hidden: 15,
};

/**
 * urayf icon (Part 9). Renders one of the custom icons; the glyph
 * inherits the current text color via currentColor — never gold.
 */
export function Icon({ name, size = 24, state, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {name === "panel-toggle" ? (
        <>
          <rect x="3" y="5" width="18" height="14" />
          <line
            className="panel-toggle__divider"
            data-state={state ?? "open"}
            x1={PANEL_TOGGLE_X.open}
            y1="5"
            x2={PANEL_TOGGLE_X.open}
            y2="19"
          />
        </>
      ) : (
        ICONS[name]
      )}
    </svg>
  );
}
