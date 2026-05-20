import "./wordmark.css";

/**
 * The urayf wordmark (Part 8). It is TEXT — rendered in text-primary,
 * never gold. Gold is reserved; only the future logo ICON is gold.
 */
export function Wordmark({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={["wordmark", className].filter(Boolean).join(" ")}
      {...rest}
    >
      urayf
    </span>
  );
}
