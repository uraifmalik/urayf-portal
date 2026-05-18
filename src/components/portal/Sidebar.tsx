"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };

const BASE_NAV: NavItem[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/portal/reports", label: "Reports", icon: "▤" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/portal/admin", label: "Admin", icon: "⚙" },
];

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/5 bg-black">
      <div className="flex h-16 items-center border-b border-white/5 px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[0.3em] text-white"
        >
          URAYF
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white font-medium text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span aria-hidden className="w-4 text-center">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4 text-xs text-zinc-600">
        Urayf Portal · v0.1
      </div>
    </aside>
  );
}
