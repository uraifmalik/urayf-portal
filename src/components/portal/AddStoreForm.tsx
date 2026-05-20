"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/toast";
import { addStore } from "@/lib/admin-actions";
import type { ActionState } from "@/lib/types";

export default function AddStoreForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addStore,
    null,
  );

  // The result is confirmed with a toast (Part 11).
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
      }}
    >
      <TextField
        label="Store name"
        name="name"
        type="text"
        required
        placeholder="New store name"
      />
      <Button
        type="submit"
        rank="secondary"
        loading={pending}
        style={{ width: "100%" }}
      >
        Add store
      </Button>
    </form>
  );
}
