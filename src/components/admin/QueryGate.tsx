"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import ErrorPanel from "./ErrorPanel";

/**
 * Renders what a page should show for the state of its queries:
 * - first load → the page's skeleton,
 * - failed first load → an error panel with Retry,
 * - otherwise (including background refetches, even failed ones, which keep
 *   showing the last good data and raise a toast instead) → the content.
 */
export default function QueryGate({
  queries,
  skeleton,
  children,
}: {
  queries: UseQueryResult<unknown, Error>[];
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  const failed = queries.find((q) => q.isError && q.data === undefined);
  if (failed) {
    return (
      <ErrorPanel
        error={failed.error}
        retrying={queries.some((q) => q.isFetching)}
        onRetry={() => queries.forEach((q) => q.isError && void q.refetch())}
      />
    );
  }
  if (queries.some((q) => q.isPending)) return <>{skeleton}</>;
  return <>{children}</>;
}
