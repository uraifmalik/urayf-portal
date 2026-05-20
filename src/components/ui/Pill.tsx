import "./pill.css";

/** Status tone — see brand system Part 10.
 *  negative — short / negative (red).
 *  positive — over / positive (green).
 *  neutral  — pending, balanced (text-muted). */
export type StatusTone = "negative" | "positive" | "neutral";

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
}

/**
 * Status pill (Part 10) — a fine outlined tag in the status color.
 * Always paired with a word; pass the word as children.
 */
export function StatusPill({
  tone,
  className,
  ...rest
}: StatusPillProps) {
  return (
    <span
      className={["pill", `pill--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

/**
 * Type pill (Part 10) — Daily / Weekly / Monthly. text-primary word
 * with a line-color outline; never the reserved gold. Pass the word
 * as children.
 */
export function TypePill({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={["pill", "pill--type", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
