import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import type { Plan } from "@/lib/types";
import { AccountSection } from "./AccountSection";
import { GeneralSection } from "./GeneralSection";
import { PreferencesSection } from "./PreferencesSection";
import "./settings.css";

export const metadata: Metadata = {
  title: "Settings — urayf portal",
};

const PLAN_RATES: Record<Plan, number> = {
  standard: 300,
  premium: 400,
  max: 700,
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PRICING_URL = "https://urayf.com/pricing";

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function nextBillingLabel(now: Date): string {
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `1st of ${MONTH_NAMES[nextMonth.getMonth()]}`;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const plan = user.plan;
  const standardRate = plan ? PLAN_RATES[plan] : null;
  const override = user.plan_rate_override;
  const showOverride =
    override !== null && standardRate !== null && override !== standardRate;
  const nextBilling = nextBillingLabel(new Date());

  return (
    <div className="settings">
      <h1 className="settings__heading">Settings</h1>

      {/* ---- General ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">General</h2>
        </div>
        <div className="settings__section-body">
          <GeneralSection
            userId={user.id}
            fullName={user.full_name}
            avatarUrl={user.avatar_url}
            displayGreeting={user.display_greeting}
          />
        </div>
      </Card>

      {/* ---- Account ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">Account</h2>
        </div>
        <div className="settings__section-body">
          <AccountSection email={user.email} />
        </div>
      </Card>

      {/* ---- Preferences ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">Preferences</h2>
        </div>
        <div className="settings__section-body">
          <PreferencesSection />
        </div>
      </Card>

      {/* ---- Billing ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">Billing</h2>
        </div>
        <div className="settings__section-body">
          {plan && standardRate !== null ? (
            <dl className="settings__plan">
              <div className="settings__plan-row">
                <dt>Current plan</dt>
                <dd>{titleCase(plan)}</dd>
              </div>
              <div className="settings__plan-row">
                <dt>Standard rate</dt>
                <dd>${standardRate}/month</dd>
              </div>
              {showOverride && (
                <div className="settings__plan-row">
                  <dt>Your rate</dt>
                  <dd>
                    ${override}/month{" "}
                    <span className="settings__plan-note">
                      (founder&apos;s rate)
                    </span>
                  </dd>
                </div>
              )}
              <div className="settings__plan-row">
                <dt>Next billing</dt>
                <dd>{nextBilling}</dd>
              </div>
            </dl>
          ) : (
            <p className="settings__plan-empty">
              No plan assigned. Contact urayf to get started.
            </p>
          )}

          {/* Payment — placeholder until Stripe is wired up. */}
          <section className="settings__payment">
            <h3 className="settings__subheading">Payment</h3>
            <p className="settings__payment-note">
              No payment method on file. Contact{" "}
              <a
                href="mailto:billing@urayf.com"
                className="settings__payment-link"
              >
                billing@urayf.com
              </a>{" "}
              to add one.
            </p>
          </section>

          <div className="settings__billing-actions">
            <Button
              rank="secondary"
              href={PRICING_URL}
              target="_blank"
              rel="noreferrer"
            >
              Adjust plan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
