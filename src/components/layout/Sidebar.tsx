"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Plan } from "@/lib/types";
import { Wordmark } from "./Wordmark";
import "./sidebar.css";

interface NavEntry {
  href: string;
  label: string;
  icon: IconName;
}

const BASE_NAV: NavEntry[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/portal/reports", label: "Reports", icon: "reports" },
];
const ADMIN_NAV: NavEntry = {
  href: "/portal/admin",
  label: "Admin",
  icon: "admin",
};
const SETTINGS_NAV: NavEntry = {
  href: "/portal/settings",
  label: "Settings",
  icon: "settings",
};

export interface SidebarProps {
  /** Per-client custom greeting; null falls back to "Welcome back." */
  greeting?: string | null;
  /** Store identity line. Null/empty hides the second line entirely. */
  storeIdentity: string | null;
  /** Full name — used for the identity block (avatar initials + first name). */
  fullName?: string | null;
  /** Plan label shown in the identity block; null hides the separator + plan. */
  plan?: Plan | null;
  /** Admin nav item shows only for admin users (Part 8). */
  isAdmin?: boolean;
  /** Called on navigation — used to close the mobile overlay. */
  onNavigate?: () => void;
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

function firstNameOf(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

/**
 * The portal sidebar (Part 8). Wired to the real routes, the theme
 * + motion preferences, and the per-client identity block. Sign-out
 * lives on the Settings page now; Admin is a regular nav item for
 * admin users.
 */
export function Sidebar({
  greeting,
  storeIdentity,
  fullName,
  plan,
  isAdmin = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function navClass(href: string) {
    return ["nav-item", isActive(href) && "nav-item--active"]
      .filter(Boolean)
      .join(" ");
  }

  // Nav order: Dashboard, Reports, [Admin], Settings.
  const navItems: NavEntry[] = isAdmin
    ? [...BASE_NAV, ADMIN_NAV, SETTINGS_NAV]
    : [...BASE_NAV, SETTINGS_NAV];

  const initials = initialsOf(fullName);
  const firstName = firstNameOf(fullName);

  return (
    <nav className="sidebar" aria-label="Portal navigation">
      {/* 1. logo — wordmark, centered */}
      <Wordmark className="sidebar__logo" />

      {/* 2. greeting + store identity */}
      <div className="sidebar__identity">
        <p className="sidebar__welcome">
          {greeting ? `Welcome back, ${greeting}.` : "Welcome back."}
        </p>
        {storeIdentity && <p className="sidebar__store">{storeIdentity}</p>}
      </div>

      {/* 3. nav — Admin inlined for admins, Settings always last */}
      <div className="sidebar__nav">
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={navClass(href)}
            aria-current={isActive(href) ? "page" : undefined}
            onClick={onNavigate}
          >
            <Icon name={icon} size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* 4. strategy-meeting card */}
      <Card elevation="raised" className="sidebar__meeting">
        <p className="meeting__eyebrow">Next meeting</p>
        <p className="meeting__date">May 24</p>
        <p className="meeting__detail">10:00 AM with urayf</p>
      </Card>

      {/* 5. bottom cluster — pushed down — identity only */}
      <div className="sidebar__bottom">
        {fullName && (
          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="sidebar__user-name">{firstName}</span>
            {plan && (
              <>
                <span className="sidebar__user-sep" aria-hidden="true">
                  ·
                </span>
                <span className="sidebar__user-plan">{plan}</span>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
