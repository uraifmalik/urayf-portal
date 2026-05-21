import Link from "next/link";
import ReportSample from "./ReportSample";
import "./home.css";

const STEPS = [
  {
    n: "1",
    title: "Onboarding",
    desc: "We get connected to your data and learn your business.",
  },
  {
    n: "2",
    title: "Analysis",
    desc: "AI-driven intelligence crunches your daily, weekly, and monthly numbers.",
  },
  {
    n: "3",
    title: "Reports",
    desc: "You receive custom reports in plain language.",
  },
] as const;

const TIERS = [
  {
    name: "Standard",
    price: "$300/month",
    features: [
      "Cash management",
      "Inventory management",
      "Daily reports",
    ],
  },
  {
    name: "Premium",
    price: "$400/month",
    features: [
      "Everything in Standard",
      "Weekly reports",
    ],
  },
  {
    name: "Max",
    price: "$700/month",
    features: [
      "Everything in Premium",
      "Monthly reports",
      "Monthly meetings",
    ],
  },
] as const;

function CheckIcon() {
  return (
    <svg
      className="home-tier__check"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3,8 7,12 13,4" />
    </svg>
  );
}

export default function Homepage() {
  return (
    <div className="home" data-theme="dark">
      {/* 1. Nav ----------------------------------------------------- */}
      <header className="home-nav">
        <Link href="/" className="home-nav__wordmark" aria-label="urayf home">
          urayf
        </Link>
        <Link href="/portal/login" className="home-nav__signin">
          Executive Suite
        </Link>
      </header>

      {/* 2. Hero ---------------------------------------------------- */}
      <section className="home-hero">
        <h1 className="home-hero__tagline">Our Craft, Your Luxury.</h1>
        <p className="home-hero__support">
          Business intelligence for owners and franchisees.
        </p>
        <a href="mailto:contact@urayf.com" className="home-cta">
          Get in touch
        </a>
      </section>

      {/* 3. How it works ------------------------------------------- */}
      <section className="home-steps-section">
        <h2 className="home-section__heading">How it works</h2>
        <ol className="home-steps">
          {STEPS.map((step) => (
            <li key={step.n} className="home-step">
              <span className="home-step__numeral" aria-hidden="true">
                {step.n}
              </span>
              <h3 className="home-step__title">{step.title}</h3>
              <p className="home-step__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Tier cards --------------------------------------------- */}
      <section className="home-services">
        <h2 className="home-section__heading">What we do</h2>
        <div className="home-tiers">
          {TIERS.map((tier) => (
            <article key={tier.name} className="home-tier">
              <h3 className="home-tier__name">{tier.name}</h3>
              <p className="home-tier__price">{tier.price}</p>
              <hr className="home-tier__divider" />
              <ul className="home-tier__features">
                {tier.features.map((feature) => (
                  <li key={feature} className="home-tier__feature">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 5. What you'll see ---------------------------------------- */}
      <section className="home-sample-section">
        <h2 className="home-section__heading">What you&rsquo;ll see</h2>
        <div className="home-sample-wrap">
          <ReportSample />
        </div>
      </section>

      {/* 6. The Origin Story --------------------------------------- */}
      <section className="home-origin">
        <h2 className="home-section__heading">The Origin Story</h2>
        <div className="home-origin__body">
          <p>
            Beginning with the 7-Eleven franchisee world five years ago, urayf
            is now a business intelligence firm built for owners who want to
            understand their business down to the hour.
          </p>
          <p>
            The truth is: store owners are working from outdated systems that
            aren&rsquo;t optimized for the person actually running the store.
            Owners need intelligence that serves their day-to-day decisions.
            Delivery Reconciliation. Shift Analysis. Variance Summaries. We
            provide metrics most owners have never seen before.
          </p>
          <p className="home-origin__punchline">
            Custom-crafted reports — the luxury of not having to do them
            yourself.
          </p>
        </div>
      </section>

      {/* 7. Testimonial -------------------------------------------- */}
      {/* Hidden until real client quote is available. Uncomment when ready. */}
      {/*
      <section className="home-testimonial">
        <h2 className="home-section__heading">What our clients say</h2>
        <blockquote className="home-testimonial__quote">
          placeholder quote — Nawazish Malik, 7-Eleven Franchisee
        </blockquote>
        <p className="home-testimonial__attribution">
          — Nawazish Malik, 7-Eleven Franchisee #19775
        </p>
      </section>
      */}

      {/* 8. Second CTA --------------------------------------------- */}
      <section className="home-cta-band">
        <h2 className="home-cta-band__heading">
          See your business with a clarity you&rsquo;ve never experienced
          before.
        </h2>
        <a href="mailto:contact@urayf.com" className="home-cta">
          Get in touch
        </a>
      </section>

      {/* 9. Footer ------------------------------------------------- */}
      <footer className="home-footer">
        <div className="home-footer__row">
          <div className="home-footer__brand">
            <p className="home-footer__wordmark">urayf</p>
            <p className="home-footer__tagline">Our Craft, Your Luxury.</p>
          </div>
          <nav className="home-footer__links" aria-label="Footer">
            <a href="mailto:contact@urayf.com" className="home-footer__link">
              Contact
            </a>
            <span className="home-footer__sep" aria-hidden="true">
              ·
            </span>
            <Link href="/privacy" className="home-footer__link">
              Privacy Policy
            </Link>
            <span className="home-footer__sep" aria-hidden="true">
              ·
            </span>
            <Link href="/terms" className="home-footer__link">
              Terms of Service
            </Link>
          </nav>
        </div>
        <p className="home-footer__copyright">
          © 2026 urayf. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
