import { admin } from "@/content/admin";
import { ApiError } from "@/lib/data/http";
import { toast } from "@/lib/toast";

/** A readable sentence for any error. Never the raw error text. */
export function describeError(error: unknown): string {
  const kind = error instanceof ApiError ? error.kind : "unknown";
  return admin.errors.reasons[kind];
}

/** Error toast for a failed action: what failed + why, with an optional Retry button. */
export function showFailure(what: string, error: unknown, retry?: () => void, key?: string) {
  toast.error(`${what} ${describeError(error)}`, {
    key,
    action: retry ? { label: admin.errors.retry, run: retry } : undefined,
  });
}
