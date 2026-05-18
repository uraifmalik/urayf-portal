"use client";

import { useActionState } from "react";
import { uploadReport } from "@/lib/admin-actions";
import type { ActionState, Store } from "@/lib/types";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/40";
const LABEL = "mb-1 block text-xs font-medium text-zinc-400";

export default function UploadReportForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadReport,
    null,
  );

  const noStores = stores.length === 0;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="store_id" className={LABEL}>
            Store
          </label>
          <select id="store_id" name="store_id" required className={FIELD}>
            <option value="">Select a store…</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className={LABEL}>
            Type
          </label>
          <select id="type" name="type" required defaultValue="" className={FIELD}>
            <option value="" disabled>
              Select a type…
            </option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label htmlFor="report_date" className={LABEL}>
            Report date
          </label>
          <input
            id="report_date"
            name="report_date"
            type="date"
            required
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="title" className={LABEL}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Daily Sales — 17 May 2026"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="file" className={LABEL}>
          Report file (HTML)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".html,text/html"
          required
          className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/20"
        />
      </div>

      {state && (
        <p
          className={`rounded-lg px-3 py-2 text-xs ${
            state.ok
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-amber-500/10 text-amber-300"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || noStores}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload report"}
        </button>
        {noStores && (
          <span className="text-xs text-zinc-500">
            Add a store first to enable uploads.
          </span>
        )}
      </div>
    </form>
  );
}
