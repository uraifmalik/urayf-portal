import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import type { Plan } from "@/lib/types";
import { AccountSection } from "./AccountSection";
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

      {/* ---- Account ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">Account</h2>
        </div>
        <div className="settings__section-body">
          <AccountSection
            email={user.email}
            displayGreeting={user.display_greeting}
          />
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

      {/* ---- Plan ---- */}
      <Card style={{ padding: 0 }}>
        <div className="settings__section-head">
          <h2 className="settings__section-title">Plan</h2>
        </div>
        <div className="settings__section-body">
          {plan && standardRate !== null ? (
            <dl className="settings__plan">
              <div className="settings__plan-row">
                <dt>Current plan</dt>
                <dd>{plan}</dd>
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
        </div>
      </Card>
    </div>
  );
}
