"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

interface AccountSectionProps {
  email: string;
}

/**
 * Account section — read-only email, password reset, sign-out.
 * "How should we address you?" lives in the General section now,
 * not here.
 */
export function AccountSection({ email }: AccountSectionProps) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function changePassword() {
    setResetting(true);
    try {
      if (!isSupabaseConfigured) {
        toast.success("Demo mode — nothing is saved here.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Check your email for a reset link.");
    } catch {
      toast.error("Couldn't send the reset link. Try again in a moment.");
    } finally {
      setResetting(false);
    }
  }

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
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <div className="settings__account">
      <div className="settings__row">
        <p className="settings__label">Email</p>
        <p className="settings__value">{email}</p>
      </div>

      <div className="settings__row">
        <p className="settings__label">Password</p>
        <Button rank="secondary" onClick={changePassword} loading={resetting}>
          Send reset link
        </Button>
      </div>

      <div className="settings__row">
        <p className="settings__label">Session</p>
        <Button rank="secondary" onClick={signOut} loading={signingOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
