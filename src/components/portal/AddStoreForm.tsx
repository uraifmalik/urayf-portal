"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/toast";
import { addStore } from "@/lib/admin-actions";
import type { ActionState, Profile } from "@/lib/types";

interface AddStoreFormProps {
  profiles: Profile[];
  nextDisplayOrder: number;
}

/* Lowercase + strip non-alphanumerics. Matches the SLUG_RE on the
   server. Used to auto-fill the slug field from short_name. */
function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export default function AddStoreForm({
  profiles,
  nextDisplayOrder,
}: AddStoreFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addStore,
    null,
  );

  const [shortName, setShortName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  // Auto-derive slug from short_name UNTIL the user edits the slug
  // directly — then they own the field.
  useEffect(() => {
    if (slugDirty) return;
    setSlug(slugify(shortName));
  }, [shortName, slugDirty]);

  const slugInvalid = slug !== "" && !/^[a-z0-9]+$/.test(slug);

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
        placeholder="The Corner Store"
      />

      <TextField
        label="Short name"
        name="short_name"
        type="text"
        required
        value={shortName}
        onChange={(e) => setShortName(e.target.value)}
        placeholder="TCS"
        maxLength={20}
      />

      <TextField
        label="Slug"
        name="slug"
        type="text"
        required
        value={slug}
        onChange={(e) => {
          setSlugDirty(true);
          setSlug(e.target.value);
        }}
        placeholder="tcs"
        error={
          slugInvalid
            ? "Lowercase letters and digits only."
            : undefined
        }
      />

      <TextField
        label="Display order"
        name="display_order"
        type="number"
        required
        defaultValue={String(nextDisplayOrder)}
        min={1}
        step={1}
      />

      <div className="field">
        <label className="field__label" htmlFor="profile_id">
          Assign to client
        </label>
        <div className="field__select-wrap">
          <select
            id="profile_id"
            name="profile_id"
            required
            defaultValue=""
            className="field__input field__select"
          >
            <option value="" disabled>
              Select a client…
            </option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name ?? p.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="submit"
        rank="secondary"
        loading={pending}
        disabled={slugInvalid}
        style={{ width: "100%" }}
      >
        Add store
      </Button>
    </form>
  );
}
