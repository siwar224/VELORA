import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Settings for the simulated network. Tiny and dependency-free on purpose: the
 * admin UI (Settings panel, palette, top bar) reads and writes it directly, and
 * the mock server reads it on every request. It is deliberately NOT an API
 * resource, so you can always change it, even while every request is failing.
 */
export type LatencyMode = "fast" | "normal" | "slow";
export type FailureMode = "off" | "sometimes" | "always";

/** Response delay range per mode, in ms. */
export const LATENCY_MS: Record<LatencyMode, readonly [number, number]> = {
  fast: [50, 150],
  normal: [300, 900],
  slow: [1500, 3500], // "slow 3G"
};

/** Share of requests that fail in "sometimes" mode (about 1 in 15). */
export const FAILURE_RATE = 1 / 15;

/** Share of those failures that hang instead of returning a 500 (the client times out). */
export const TIMEOUT_SHARE = 0.3;

/** The client gives up on a request after this long. */
export const REQUEST_TIMEOUT_MS = 8000;

type NetworkSimState = { latency: LatencyMode; failures: FailureMode };

export const DEFAULT_NETWORK: NetworkSimState = { latency: "normal", failures: "off" };

export const useNetworkSim = create<NetworkSimState>()(
  persist((): NetworkSimState => ({ ...DEFAULT_NETWORK }), {
    name: "velor:network",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);

export const isDefaultNetwork = (s: NetworkSimState) => s.latency === DEFAULT_NETWORK.latency && s.failures === DEFAULT_NETWORK.failures;
