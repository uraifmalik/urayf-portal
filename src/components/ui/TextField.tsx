"use client";

import { forwardRef, useId, useState } from "react";
import "./field.css";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Visible label, sits above the field. Required — no placeholder-as-label. */
  label: string;
  /** Tags the field "(optional)". urayf marks the exception, not the rule. */
  optional?: boolean;
  /** Controlled error message. When set, overrides blur validation. */
  error?: string;
  /** Runs on blur only (never on keystroke). Return a message, or null if valid. */
  validate?: (value: string) => string | null;
}

/**
 * urayf text field — an inset well (Part 7). Label above, optional blur
 * validation, single plain error message below. Styling is token-driven
 * (field.css); theme follows the nearest [data-theme] ancestor.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    { label, optional, error, validate, className, onBlur, onChange, ...rest },
    ref,
  ) {
    const id = useId();
    const errorId = `${id}-error`;
    const [blurError, setBlurError] = useState<string | null>(null);

    const message = error ?? blurError;
    const invalid = Boolean(message);

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      // Validate on blur, not on every keystroke — calm, not nagging (Part 7).
      if (validate) setBlurError(validate(e.target.value));
      onBlur?.(e);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      // Clear a shown error as the user corrects it; re-checked on next blur.
      if (blurError) setBlurError(null);
      onChange?.(e);
    }

    return (
      <div className={["field", className].filter(Boolean).join(" ")}>
        <label className="field__label" htmlFor={id}>
          {label}
          {optional && <span className="field__optional"> (optional)</span>}
        </label>
        <input
          {...rest}
          ref={ref}
          id={id}
          className="field__input"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        {invalid && (
          <p className="field__error" id={errorId}>
            {message}
          </p>
        )}
      </div>
    );
  },
);
