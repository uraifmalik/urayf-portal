"use client";

import { Button } from "@/components/ui/Button";
import "./error.css";

/* Route-level error boundary for the portal app pages (Part 11).
   Plain language, no raw error or stack trace, calm — and a way
   back. The `error` is received but intentionally not shown. */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="errstate">
      <p className="errstate__title">This didn&apos;t load.</p>
      <p className="errstate__hint">
        Something interrupted the page. Try again, or come back in a
        moment.
      </p>
      <Button rank="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
