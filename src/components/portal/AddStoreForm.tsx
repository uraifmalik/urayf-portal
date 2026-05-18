"use client";

import { useActionState } from "react";
import { addStore } from "@/lib/admin-actions";
import type { ActionState } from "@/lib/types";

export default function AddStoreForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addStore,
    null,
  );

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder="New store name"
          className="min-w-48 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add store"}
        </button>
      </form>

      {state && (
        <p
          className={`text-xs ${
            state.ok ? "text-emerald-300" : "text-amber-300"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
