import type { ZodType } from "zod";
import { ensureMocks } from "@/mocks/start";
import { REQUEST_TIMEOUT_MS } from "./network-sim";
import { apiErrorBodySchema } from "./schemas";

/**
 * Typed fetch wrapper for the data API. This is the only place that knows the app
 * talks to a "server": swap ensureMocks() for nothing and the same calls go to a
 * real backend. Every failure becomes an ApiError with a `kind` the UI can show
 * a readable message for (never raw error text).
 */
export type ApiErrorKind =
  | "network" // couldn't reach the server (or the mock worker couldn't start)
  | "timeout" // no answer within REQUEST_TIMEOUT_MS
  | "server" // 5xx
  | "validation" // 400 / 409 / 422: the request was refused
  | "not-found" // 404
  | "invalid-response"; // the server answered, but not in the agreed shape

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions<T> = {
  body?: unknown;
  headers?: Record<string, string>;
  /** Response validator; omit for empty (204) responses. */
  schema?: ZodType<T>;
  /** Caller-side cancellation (TanStack Query passes its signal here). */
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function request<T = void>(method: string, path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { body, headers, schema, signal, timeoutMs = REQUEST_TIMEOUT_MS } = options;

  // READY GATE: no request leaves before the mock service worker is up.
  try {
    await ensureMocks();
  } catch {
    throw new ApiError("network", "The mock server couldn't start.", undefined, "mocks_unavailable");
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener("abort", onCallerAbort);

  try {
    let res: Response;
    try {
      res = await fetch(path, {
        method,
        headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (timedOut) throw new ApiError("timeout", "The request timed out.");
      if (signal?.aborted) throw e; // cancelled by the caller: not an error to report
      throw new ApiError("network", "The request couldn't be sent.");
    }

    if (!res.ok) {
      const parsed = apiErrorBodySchema.safeParse(await res.json().catch(() => null));
      const err = parsed.success ? parsed.data.error : undefined;
      const kind: ApiErrorKind = res.status === 404 ? "not-found" : res.status >= 500 ? "server" : "validation";
      throw new ApiError(kind, err?.message ?? `Request failed (${res.status}).`, res.status, err?.code, err?.fields);
    }

    if (res.status === 204 || !schema) return undefined as T;
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new ApiError("invalid-response", "The server's answer wasn't in the expected shape.", res.status);
    return parsed.data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onCallerAbort);
  }
}
