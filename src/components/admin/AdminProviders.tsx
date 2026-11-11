"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ApiError } from "@/lib/data/http";

// Development only: this branch is removed from production builds, so the devtools
// package (a devDependency) never ships.
const Devtools =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

/** Errors worth retrying: the network or the server had a hiccup, not "your request is wrong". */
const transient = (error: unknown) => !(error instanceof ApiError) || error.kind === "network" || error.kind === "timeout" || error.kind === "server";

function makeClient() {
  return new QueryClient({
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
