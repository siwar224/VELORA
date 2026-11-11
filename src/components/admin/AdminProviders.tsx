"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { admin } from "@/content/admin";
import { ApiError } from "@/lib/data/http";
import { qk } from "@/lib/data/queries";
import { useToasts } from "@/lib/toast";
import { showFailure } from "./errors";

// Development only: this branch is removed from production builds, so the devtools
// package (a devDependency) never ships.
const Devtools =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

/** Errors worth retrying: the network or the server had a hiccup, not "your request is wrong". */
const transient = (error: unknown) => !(error instanceof ApiError) || error.kind === "network" || error.kind === "timeout" || error.kind === "server";

const WHAT: Record<string, string> = {
  [qk.menu[0]]: admin.errors.what.menu,
  [qk.settings[0]]: admin.errors.what.settings,
  [qk.orders[0]]: admin.errors.what.orders,
};

function makeClient() {
  return new QueryClient({
    // A *background* refresh that fails (the page already has data) must not blank the
    // page: it keeps the last data and raises one toast per resource, with Retry.
    // First-load failures are handled by each page's error panel instead.
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.state.data === undefined) return;
        // One failure, one message: if an error toast is already showing (e.g. the action
        // that triggered this refetch just failed), don't pile a second one on top.
        if (useToasts.getState().toasts.some((t) => t.kind === "error")) return;
        const resource = String(query.queryKey[0]);
        showFailure(admin.errors.refreshFailed(WHAT[resource] ?? resource), error, () => void query.fetch(), `refresh-${resource}`);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // One quick retry for transient failures only; errors then surface in the UI.
        retry: (count, error) => count < 1 && transient(error),
        retryDelay: 600,
      },
      // Mutations are never auto-retried: a failed save rolls back and offers a Retry button.
      mutations: { retry: 0 },
    },
  });
}

/**
 * The one QueryClient, for the admin only (this file is imported by the admin
 * layout, never by the public site, so TanStack Query isn't in its bundle).
 */
export default function AdminProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Devtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
