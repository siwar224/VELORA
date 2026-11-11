import { delay, HttpResponse } from "msw";
import { FAILURE_RATE, LATENCY_MS, TIMEOUT_SHARE, useNetworkSim } from "@/lib/data/network-sim";

/**
 * Makes the mock server behave like a real network: every request waits a
 * random time (by latency mode) and, depending on the failure mode, may fail.
 * A failure is either an HTTP 500, or a request that never answers (so the
 * client's own timeout has to kick in). Returns the failure response, or null.
 */
export async function applyNetwork(): Promise<Response | null> {
  await useNetworkSim.persist.rehydrate(); // pick up changes made in another tab
  const { latency, failures } = useNetworkSim.getState();

  const [min, max] = LATENCY_MS[latency];
  await delay(min + Math.random() * (max - min));

  if (failures === "off") return null;
  if (failures === "sometimes" && Math.random() >= FAILURE_RATE) return null;

  // "always" fails fast with a 500 so the demo stays usable; "sometimes" also hangs now and then.
  if (failures === "sometimes" && Math.random() < TIMEOUT_SHARE) {
    await delay("infinite");
    return null; // never reached
  }
  return HttpResponse.json(
    { error: { code: "simulated_failure", message: "Simulated server error." } },
    { status: 500 },
  );
}
