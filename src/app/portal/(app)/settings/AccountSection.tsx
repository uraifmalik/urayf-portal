"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

interface AccountSectionProps {
  email: string;
  displayGreeting: string | null;
}

const DEMO_TOAST = "Demo mode — nothing is saved here.";

export function AccountSection({
  email,
  displayGreeting,
}: AccountSectionProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState<string>(displayGreeting ?? "");
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function saveGreeting() {
    const trimmed = greeting.trim();
    if (trimmed.length > 40) {
      toast.error("Keep it under 40 characters.");
      return;
    }
    setSavingGreeting(true);
    try {
      if (!isSupabaseConfigured) {
        toast.success(DEMO_TOAST);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.rpc("set_display_greeting", {
        new_greeting: trimmed,
      });
      if (error) throw error;
      toast.success("Updated.");
      router.refresh();
    } catch {
      toast.error("That didn't save. Try again in a moment.");
    } finally {
      setSavingGreeting(false);
    }
  }

  async function changePassword() {
    setResetting(true);
    try {
      if (!isSupabaseConfigured) {
        toast.success(DEMO_TOAST);
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

      <div className="settings__field">
        <TextField
          label="How urayf addresses you"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          maxLength={40}
          placeholder='e.g. "Mr. Malik"'
        />
        <Button rank="primary" onClick={saveGreeting} loading={savingGreeting}>
          Save
        </Button>
      </div>

      <div className="settings__signout">
        <Button rank="secondary" onClick={signOut} loading={signingOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
