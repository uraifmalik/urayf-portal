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
    <form action={formAction}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "var(--space-2)",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <TextField
            label="Store name"
            name="name"
            type="text"
            required
            placeholder="New store name"
          />
        </div>
        <Button type="submit" rank="secondary" loading={pending}>
          Add store
        </Button>
      </div>
    </form>
  );
}
