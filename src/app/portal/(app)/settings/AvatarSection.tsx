"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

interface AvatarSectionProps {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEMO_TOAST = "Demo mode — nothing is saved here.";

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

/* Pick an extension from the file's MIME type — the bucket path uses
   this so the public URL has the right content-type. */
function extOf(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function AvatarSection({
  userId,
  fullName,
  avatarUrl,
}: AvatarSectionProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const initials = initialsOf(fullName);

  function openPicker() {
    fileRef.current?.click();
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-uploading the same file later
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Pick a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Avatar must be under 2 MB.");
      return;
    }

    if (!isSupabaseConfigured) {
      toast.success(DEMO_TOAST);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = extOf(file.type);
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      // Cache-bust so the new avatar shows immediately without a hard reload.
      const url = `${pub.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", userId);
      if (updateError) throw updateError;

      toast.success("Avatar updated.");
      router.refresh();
    } catch {
      toast.error("Couldn't upload that avatar. Try again in a moment.");
    } finally {
      setUploading(false);
    }
  }

  async function onRemove() {
    if (!isSupabaseConfigured) {
      toast.success(DEMO_TOAST);
      return;
    }

    setRemoving(true);
    try {
      const supabase = createClient();

      // List anything we previously uploaded under this user's folder and
      // remove all of it — covers ext changes (jpg → png and back).
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);
      if (files && files.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);
      if (updateError) throw updateError;

      toast.success("Avatar removed.");
      router.refresh();
    } catch {
      toast.error("Couldn't remove that avatar. Try again in a moment.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="settings__avatar">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          aria-hidden="true"
          className="settings__avatar-pic settings__avatar-pic--image"
        />
      ) : (
        <span className="settings__avatar-pic" aria-hidden="true">
          {initials}
        </span>
      )}

      <div className="settings__avatar-actions">
        <Button rank="secondary" onClick={openPicker} loading={uploading}>
          {avatarUrl ? "Change" : "Upload"}
        </Button>
        {avatarUrl && (
          <Button rank="secondary" onClick={onRemove} loading={removing}>
            Remove
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
