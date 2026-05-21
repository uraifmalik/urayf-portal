"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import "@/components/ui/field.css";
import { toast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { AvatarSection } from "./AvatarSection";

interface GeneralSectionProps {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  displayGreeting: string | null;
}

/**
 * General section — avatar row + "How should we address you?" row.
 * Both rows follow the label-left / control-right ledger pattern.
 */
export function GeneralSection({
  userId,
  fullName,
  avatarUrl,
  displayGreeting,
}: GeneralSectionProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState<string>(displayGreeting ?? "");
  const [savingGreeting, setSavingGreeting] = useState(false);

  async function saveGreeting() {
    const trimmed = greeting.trim();
    if (trimmed.length > 40) {
      toast.error("Keep it under 40 characters.");
      return;
    }
    setSavingGreeting(true);
    try {
      if (!isSupabaseConfigured) {
        toast.success("Demo mode — nothing is saved here.");
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

  return (
    <div className="settings__account">
      <div className="settings__row settings__row--avatar">
        <p className="settings__label">Avatar</p>
        <AvatarSection
          userId={userId}
          fullName={fullName}
          avatarUrl={avatarUrl}
        />
      </div>

      <div className="settings__row settings__row--greeting">
        <p className="settings__label">How should we address you?</p>
        <div className="settings__field">
          <input
            className="field__input"
            type="text"
            aria-label="How should we address you?"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            maxLength={40}
            placeholder='e.g. "Mr. Malik"'
          />
          <Button
            rank="secondary"
            onClick={saveGreeting}
            loading={savingGreeting}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
