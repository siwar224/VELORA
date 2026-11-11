"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { admin } from "@/content/admin";
import { DEFAULT_NETWORK, useNetworkSim, type FailureMode, type LatencyMode } from "@/lib/data/network-sim";
import { Segmented } from "./PageHeader";

const t = admin.network;

/**
 * Network simulator panel (Settings). It reads and writes the persisted simulator
 * settings directly, NOT through the API, and it doesn't depend on the settings
 * query: so it is always usable, even while every request is failing.
 */
export default function NetworkSimulator() {
  const { latency, failures } = useNetworkSim();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="font-serif text-2xl font-normal">{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p id="net-speed" className="text-sm font-medium">{t.latency.label}</p>
            <Segmented<LatencyMode>
              label={t.latency.label}
              value={latency}
              onChange={(v) => useNetworkSim.setState({ latency: v })}
              options={(["fast", "normal", "slow"] as const).map((v) => ({ value: v, label: t.latency[v] }))}
            />
            <p className="text-sm text-muted-foreground">{t.latencyHint[latency]}</p>
          </div>
          <div className="space-y-2">
            <p id="net-failures" className="text-sm font-medium">{t.failures.label}</p>
            <Segmented<FailureMode>
              label={t.failures.label}
              value={failures}
              onChange={(v) => useNetworkSim.setState({ failures: v })}
              options={(["off", "sometimes", "always"] as const).map((v) => ({ value: v, label: t.failures[v] }))}
            />
            <p className="text-sm text-muted-foreground">{t.failuresHint[failures]}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" variant="outline" onClick={() => useNetworkSim.setState({ ...DEFAULT_NETWORK })}>
            {t.reset}
          </Button>
          <p role="status" className="text-sm text-muted-foreground">{t.saved}</p>
        </div>
      </CardContent>
    </Card>
  );
}
