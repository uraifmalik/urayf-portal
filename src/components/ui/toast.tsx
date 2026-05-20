"use client";

import { useEffect, useState } from "react";
import "./toast.css";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  exiting?: boolean;
}

/* A tiny module-level store — toasts can be raised from anywhere
   (toast.success / toast.error) without threading a context. */
let items: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(items);
}

function remove(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function dismiss(id: number) {
  items = items.map((t) => (t.id === id ? { ...t, exiting: true } : t));
  emit();
  // hold for the exit animation (moderate), then drop it
  setTimeout(() => remove(id), 240);
}

function add(message: string, tone: ToastTone) {
  const id = nextId++;
  items = [...items, { id, message, tone }];
  emit();
  setTimeout(() => dismiss(id), 4000); // auto-dismiss ~4s (Part 11)
}

export const toast = {
  success: (message: string) => add(message, "success"),
  error: (message: string) => add(message, "error"),
};

function CheckGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 L10 17.5 L19 7" />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7 L17 17 M17 7 L7 17" />
    </svg>
  );
}

/**
 * Mounts once (in AppShell). Renders the live toast stack — brief,
 * bottom-anchored, L2 floating, auto-dismissing.
 */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.tone}`}
          data-exiting={t.exiting || undefined}
        >
          <span className="toast__glyph">
            {t.tone === "success" ? <CheckGlyph /> : <CrossGlyph />}
          </span>
          <span className="toast__message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
