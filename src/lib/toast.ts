import { create } from "zustand";

/**
 * Tiny toast store (no dependency). Toasts are rendered by components/admin/Toaster,
 * in a polite live region. A toast with the same `key` replaces the previous one, so
 * a repeating failure (e.g. a 15 s refresh that keeps failing) never piles up.
 */
export type ToastKind = "error" | "success" | "info";
export type ToastAction = { label: string; run: () => void };
export type Toast = { id: string; key?: string; kind: ToastKind; message: string; action?: ToastAction };

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissNewest: () => void;
};

const MAX_VISIBLE = 4;
let counter = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${++counter}`;
    set((s) => ({ toasts: [...s.toasts.filter((t) => !toast.key || t.key !== toast.key), { ...toast, id }].slice(-MAX_VISIBLE) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dismissNewest: () => set((s) => ({ toasts: s.toasts.slice(0, -1) })),
}));

const push = (kind: ToastKind) => (message: string, options: { action?: ToastAction; key?: string } = {}) =>
  useToasts.getState().push({ kind, message, ...options });

export const toast = { error: push("error"), success: push("success"), info: push("info") };
