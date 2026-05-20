import { forwardRef } from "react";
import "./button.css";

/** Button rank — see brand system Part 6.
 *  primary   — the one action that matters (one per screen).
 *  secondary — supporting actions.
 *  ghost     — tertiary (Back, dismiss). */
export type ButtonRank = "primary" | "secondary" | "ghost";

interface ButtonOwnProps {
  rank?: ButtonRank;
  /** Hides the label and shows a centered spinner; also disables the button. */
  loading?: boolean;
}

type ButtonAsButton = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & {
    /** When set, the button renders as an <a> link. */
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * urayf Button. Three ranks, all six states, both themes. Renders an
 * <a> when given `href`, otherwise a <button>. Styling is token-driven
 * — see button.css.
 */
export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  { rank = "primary", loading = false, className, children, ...rest },
  ref,
) {
  const classNames = ["btn", `btn--${rank}`, className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="btn__label">{children}</span>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </>
  );

  // Link form — renders an <a> (no disabled/loading semantics on links).
  if (rest.href !== undefined) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classNames}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  // Button form — renders a <button>.
  const { type = "button", disabled, ...buttonRest } =
    rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      className={classNames}
      {...buttonRest}
    >
      {content}
    </button>
  );
});
