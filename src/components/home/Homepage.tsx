import Link from "next/link";

/**
 * Urayf homepage — FULLY SELF-CONTAINED.
 *
 * Rules for this component (keep them true):
 *  - Imports nothing from `src/components/portal/*` or `src/lib/*`.
 *  - Owns all of its own markup and styling.
 *  - The black <section> below the header is the stage for a future
 *    elaborate scroll animation. Build that animation inside this file
 *    (or new files under `src/components/home/`) without touching the
 *    portal. Nothing outside `home/` depends on what happens here.
 */
export default function Homepage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* ---------------------------------------------------------------
          Header — black bar, brand on the left, portal entry on the right
      ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-black px-6 py-5 md:px-12">
        <Link
          href="/"
          aria-label="Urayf home"
          className="select-none text-xl font-semibold tracking-[0.3em] text-white"
        >
          URAYF
        </Link>

        <Link
          href="/portal"
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          Client Login
        </Link>
      </header>

      {/* ---------------------------------------------------------------
          Animation stage — intentionally pure black.
          This is the placeholder for the future scroll animation.
          Mount the animation inside this <section>.
      ---------------------------------------------------------------- */}
      <section
        id="home-animation-stage"
        aria-label="Urayf"
        className="relative flex-1 bg-black"
      >
        {/* ▶ SCROLL ANIMATION MOUNT POINT — build the homepage animation here. */}
      </section>
    </div>
  );
}
