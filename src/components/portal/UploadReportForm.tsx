"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/toast";
import { uploadReport } from "@/lib/admin-actions";
import type { ActionState, Store } from "@/lib/types";

export default function UploadReportForm({ stores }: { stores: Store[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    uploadReport,
    null,
  );

  const noStores = stores.length === 0;

  // The upload result is confirmed with a toast (Part 11).
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
      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {/* Store — select styled as the field well + chevron (Part 7) */}
        <div className="field">
          <label className="field__label" htmlFor="store_id">
            Store
          </label>
          <div className="field__select-wrap">
            <select
              id="store_id"
              name="store_id"
              required
              defaultValue=""
              className="field__input field__select"
            >
              <option value="">Select a store…</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type */}
        <div className="field">
          <label className="field__label" htmlFor="type">
            Type
          </label>
          <div className="field__select-wrap">
            <select
              id="type"
              name="type"
              required
              defaultValue=""
              className="field__input field__select"
            >
              <option value="" disabled>
                Select a type…
              </option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <TextField label="Report date" name="report_date" type="date" required />

        <TextField
          label="Title"
          name="title"
          type="text"
          required
          placeholder="Daily Sales — 17 May 2026"
        />
      </div>

      {/* Report file */}
      <div className="field">
        <label className="field__label" htmlFor="file">
          Report file (HTML)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".html,text/html"
          required
          className="field__file"
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <Button
          type="submit"
          rank="primary"
          loading={pending}
          disabled={noStores}
        >
          Upload report
        </Button>
        {noStores && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            Add a store before uploading a report.
          </span>
        )}
      </div>
    </form>
  );
}
