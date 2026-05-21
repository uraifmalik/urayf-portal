"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

interface ProfileMenuProps {
  userId: string;
  email: string;
  trigger: ReactNode;
}

const PRICING_URL = "https://urayf.com/pricing";

/**
 * Floating menu anchored to the sidebar identity block, opening
 * UPWARD. Click-outside / Escape close. Fades in on a 120ms quick
 * easing curve (Part 12). All copy is read-only display except for
 * the Sign out action; "Change the language" is a placeholder that
 * carries a "Soon" suffix and is intentionally unclickable.
 */
export function ProfileMenu({ userId: _userId, email, trigger }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function signOut() {
    setSigningOut(true);
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        /* ignore — proceed to login */
      }
    }
    close();
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <div className="profile-menu" ref={wrapperRef}>
      <button
        type="button"
        className="profile-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="profile-menu__panel"
          role="menu"
          aria-label="Account menu"
        >
          <p className="profile-menu__email" role="presentation">
            {email}
          </p>
          <div className="profile-menu__divider" role="separator" />
          <Link
            href="/portal/settings"
            className="profile-menu__item"
            role="menuitem"
            onClick={close}
          >
            Settings
          </Link>
          <button
            type="button"
            className="profile-menu__item profile-menu__item--soon"
            role="menuitem"
            disabled
            aria-disabled="true"
          >
            <span>Change the language</span>
            <span className="profile-menu__soon">Soon</span>
          </button>
          <a
            href="mailto:support@urayf.com"
            className="profile-menu__item"
            role="menuitem"
            onClick={close}
          >
            Contact us
          </a>
          <a
            href={PRICING_URL}
            target="_blank"
            rel="noreferrer"
            className="profile-menu__item"
            role="menuitem"
            onClick={close}
          >
            Adjust plan
          </a>
          <div className="profile-menu__divider" role="separator" />
          <button
            type="button"
            className="profile-menu__item"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
