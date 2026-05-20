import "./card.css";

/** Elevation level — see brand system Part 5.
 *  raised   — L1, the base card. Surface-step + border, no shadow.
 *  floating — L2, dropdowns / popovers. Adds the deeper shadow.
 *  modal    — L3, dialogs. Adds the dramatic shadow; pair with a scrim. */
export type Elevation = "raised" | "floating" | "modal";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
}

/**
 * urayf card (Part 5). Depth is surface-step + border first; shadow
 * appears only when something genuinely floats (L2 / L3). The border
 * is the cut-groove (sunk color) on dark, the warm line on light —
 * styling is token-driven (card.css), theme follows [data-theme].
 */
export function Card({
  elevation = "raised",
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={["card", `card--${elevation}`, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
