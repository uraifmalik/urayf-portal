"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  SIDEBAR_CYCLE,
  type SidebarState,
  useSidebarState,
} from "@/lib/preferences";
import type { Plan, Store } from "@/lib/types";
import { ProfileMenu } from "./ProfileMenu";
import { Wordmark } from "./Wordmark";
import "./sidebar.css";

interface FixedNavEntry {
  href: string;
  label: string;
  icon: IconName;
}

const DASHBOARD_NAV: FixedNavEntry = {
  href: "/portal/dashboard",
  label: "Dashboard",
  icon: "dashboard",
};
const ADMIN_NAV: FixedNavEntry = {
  href: "/portal/admin",
  label: "Admin",
  icon: "admin",
};
const SETTINGS_NAV: FixedNavEntry = {
  href: "/portal/settings",
  label: "Settings",
  icon: "settings",
};

export interface SidebarProps {
  /** Per-client custom greeting; null falls back to "Welcome back." */
  greeting?: string | null;
  /** Stores the user is joined to, ordered by display_order ASC. */
  stores: Store[];
  /** Profile id — used by the profile menu's sign-out action. */
  userId: string;
  /** Email — shown in the profile menu header. */
  email: string;
  /** Full name — used for the identity block (avatar initials + first name). */
  fullName?: string | null;
  /** Public URL of the user's avatar image; null falls back to initials. */
  avatarUrl?: string | null;
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

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * The portal sidebar (Part 8). Wordmark links to the Dashboard; nav
 * items: Dashboard → user's stores (in display_order) → [Admin] →
 * Settings. The client's name is rendered in gold per Part 2 (one of
 * the four reserved gold uses). The identity block at the bottom is
 * clickable — see ProfileMenu.
 */
export function Sidebar({
  greeting,
  stores,
  userId,
  email,
  fullName,
  avatarUrl,
  plan,
  isAdmin = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [sidebarState, setSidebarState] = useSidebarState();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function navClass(href: string) {
    return ["nav-item", isActive(href) && "nav-item--active"]
      .filter(Boolean)
      .join(" ");
  }

  function cycle() {
    const next: SidebarState = SIDEBAR_CYCLE[sidebarState];
    setSidebarState(next);
  }

  const initials = initialsOf(fullName);
  const firstName = firstNameOf(fullName);

  return (
    <nav className="sidebar" aria-label="Portal navigation">
      {/* Collapse toggle — top-right of sidebar (open + rail states).
          Hidden via CSS on mobile; the mobile menu button takes over. */}
      <button
        type="button"
        className="sidebar__toggle"
        aria-label={`Sidebar: ${sidebarState}. Click to cycle.`}
        onClick={cycle}
      >
        <Icon name="panel-toggle" size={18} state={sidebarState} />
      </button>

      {/* 1. logo — wordmark links to Dashboard */}
      <Link
        href="/portal/dashboard"
        className="sidebar__logo-link"
        aria-label="Dashboard"
        onClick={onNavigate}
      >
        <Wordmark className="sidebar__logo" />
      </Link>

      {/* 2. greeting — the client's name renders in gold (Part 2).
          Inline layout: short greetings ("Mr. Malik") fit on one line;
          longer values wrap naturally to a second line. */}
      <div className="sidebar__identity">
        <p className="sidebar__welcome">
          {greeting ? (
            <>
              <span className="sidebar__welcome-prefix">Welcome,</span>{" "}
              <span className="sidebar__welcome-name">{greeting}.</span>
            </>
          ) : (
            "Welcome."
          )}
        </p>
      </div>

      {/* 3. nav — Dashboard, store entries, [Admin], Settings */}
      <div className="sidebar__nav">
        <Link
          href={DASHBOARD_NAV.href}
          className={navClass(DASHBOARD_NAV.href)}
          aria-current={isActive(DASHBOARD_NAV.href) ? "page" : undefined}
          onClick={onNavigate}
          title={DASHBOARD_NAV.label}
        >
          <Icon name={DASHBOARD_NAV.icon} size={18} />
          <span className="nav-item__label">{DASHBOARD_NAV.label}</span>
        </Link>

        {stores.map((store) => {
          const href = `/portal/${store.slug}`;
          return (
            <Link
              key={store.id}
              href={href}
              className={navClass(href)}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={onNavigate}
              title={store.name}
            >
              <Icon name="reports" size={18} />
              <span className="nav-item__label">{store.short_name}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href={ADMIN_NAV.href}
            className={navClass(ADMIN_NAV.href)}
            aria-current={isActive(ADMIN_NAV.href) ? "page" : undefined}
            onClick={onNavigate}
            title={ADMIN_NAV.label}
          >
            <Icon name={ADMIN_NAV.icon} size={18} />
            <span className="nav-item__label">{ADMIN_NAV.label}</span>
          </Link>
        )}

        <Link
          href={SETTINGS_NAV.href}
          className={navClass(SETTINGS_NAV.href)}
          aria-current={isActive(SETTINGS_NAV.href) ? "page" : undefined}
          onClick={onNavigate}
          title={SETTINGS_NAV.label}
        >
          <Icon name={SETTINGS_NAV.icon} size={18} />
          <span className="nav-item__label">{SETTINGS_NAV.label}</span>
        </Link>
      </div>

      {/* 4. bottom cluster — clickable identity opens the profile menu */}
      <div className="sidebar__bottom">
        {fullName && (
          <ProfileMenu
            userId={userId}
            email={email}
            trigger={
              <div className="sidebar__user">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    aria-hidden="true"
                    className="sidebar__avatar sidebar__avatar--image"
                  />
                ) : (
                  <span className="sidebar__avatar" aria-hidden="true">
                    {initials}
                  </span>
                )}
                <span className="sidebar__user-name">{firstName}</span>
                {plan && (
                  <>
                    <span className="sidebar__user-sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="sidebar__user-plan">
                      {titleCase(plan)}
                    </span>
                  </>
                )}
              </div>
            }
          />
        )}
      </div>
    </nav>
  );
}
