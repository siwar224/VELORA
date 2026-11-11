"use client";

import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { admin } from "@/content/admin";
import { useToasts, type Toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICON = { error: CircleAlert, success: CircleCheck, info: Info } as const;

/** Errors with a Retry button stay until dismissed; everything else clears itself. */
const lifetime = (t: Toast) => (t.kind === "error" && t.action ? null : t.kind === "error" ? 9000 : 5000);

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const ms = lifetime(toast);
  const Icon = ICON[toast.kind];

  // Auto-dismiss, paused while the pointer or keyboard focus is on the toast.
  const remaining = useRef(ms);
  useEffect(() => {
    if (remaining.current === null || paused) return;
    const started = Date.now();
    const id = window.setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(id);
      if (remaining.current !== null) remaining.current -= Date.now() - started;
    };
  }, [paused, dismiss, toast.id]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 bg-espresso py-3 pr-1 pl-4 text-cream shadow-lg",
        toast.kind === "error" ? "border-l-[#e8946a]" : toast.kind === "success" ? "border-l-emerald-400" : "border-l-caramel",
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              dismiss(toast.id);
              toast.action?.run();
            }}
            className="mt-1 -ml-2 inline-flex min-h-11 items-center rounded px-2 text-sm font-semibold underline underline-offset-4 hover:text-caramel"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label={admin.errors.dismiss}
        className="flex size-11 shrink-0 items-center justify-center rounded text-cream/80 hover:text-cream"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/**
 * Toast stack, bottom right. The wrapper is a polite live region that always exists
 * (so additions are announced). Escape dismisses the newest toast; Retry / dismiss
 * buttons are ordinary focusable buttons (44px targets).
 */
export default function Toaster() {
  const toasts = useToasts((s) => s.toasts);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && useToasts.getState().toasts.length) useToasts.getState().dismissNewest();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section aria-label={admin.errors.notifications} className="pointer-events-none fixed right-4 bottom-4 z-[60] w-[min(26rem,calc(100vw-2rem))]">
      <div role="status" aria-live="polite" aria-relevant="additions text" className="flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </section>
  );
}
