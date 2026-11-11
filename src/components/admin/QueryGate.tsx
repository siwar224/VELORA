"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { admin } from "@/content/admin";
import { Button } from "@/components/ui/button";

/**
 * Renders what a page should show for the state of its queries:
 * - first load → the page's skeleton,
 * - failed first load → an error panel with Retry,
 * - otherwise (including background refetches, even failed ones, which keep
 *   showing the last good data) → the content.
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
      <div role="alert" className="rounded-xl border bg-card p-8 text-center">
        <p className="font-serif text-2xl">{admin.errors.loadFailed}</p>
        <Button className="mt-6" onClick={() => queries.forEach((q) => q.isError && void q.refetch())}>
          {admin.errors.retry}
        </Button>
      </div>
    );
  }
  if (queries.some((q) => q.isPending)) return <>{skeleton}</>;
  return <>{children}</>;
}
