"use client";

import { CloudOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { admin } from "@/content/admin";
import { isDefaultNetwork, useNetworkSim } from "@/lib/data/network-sim";
import { describeError } from "./errors";

/**
 * Inline panel for a page (or the app shell) that couldn't load: what happened in
 * plain words, a Retry button (disabled while retrying), and, if the network
 * simulator is on, a pointer to it, since that's the likely cause in the demo.
 */
export default function ErrorPanel({
  error,
  title = admin.errors.loadFailed,
  body,
  retrying = false,
  onRetry,
}: {
  error?: unknown;
  title?: string;
  /** Overrides the sentence derived from `error`. */
  body?: string;
  retrying?: boolean;
  onRetry: () => void;
}) {
  const network = useNetworkSim();
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-xl border bg-card px-6 py-12 text-center">
      <CloudOff aria-hidden className="mx-auto size-8 text-caramel-deep" />
      <p className="mt-4 font-serif text-3xl">{title}</p>
      <p className="mt-2 text-muted-foreground">{body ?? describeError(error)}</p>
      {!isDefaultNetwork(network) && (
        <p className="mt-2 text-sm text-muted-foreground">
          {admin.errors.simulatorOn}{" "}
          <Link href="/admin/settings" className="font-medium text-caramel-deep underline underline-offset-4">
            {admin.errors.openSimulator}
          </Link>
        </p>
      )}
      <Button className="mt-6" onClick={onRetry} disabled={retrying}>
        {retrying ? admin.errors.retrying : admin.errors.retry}
      </Button>
    </div>
  );
}
