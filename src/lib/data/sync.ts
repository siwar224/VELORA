import { useCatalog, useOrders } from "./store";

/**
 * Cross-tab live updates. Every mutation in lib/data/api broadcasts a topic;
 * other tabs (the public site, other admin tabs) rehydrate that store.
 * BroadcastChannel is instant; the `storage` event is the fallback (it fires in
 * other tabs whenever localStorage changes).
 */
export type Topic = "catalog" | "orders";

const CHANNEL = "velor-sync";
const KEYS: Record<string, Topic> = { "velor:catalog": "catalog", "velor:orders": "orders" };

let channel: BroadcastChannel | null = null;
const getChannel = () => {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  return (channel ??= new BroadcastChannel(CHANNEL));
};

/** Tell other tabs that `topic` changed. */
export function broadcast(topic: Topic) {
  getChannel()?.postMessage({ topic });
}

const rehydrate = (topic: Topic) => (topic === "catalog" ? useCatalog : useOrders).persist.rehydrate();

/** Keep this tab's stores in sync with other tabs. Returns a stop function. */
export function startSync(onChange?: (topic: Topic) => void): () => void {
  const ch = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL);
  const handle = async (topic: Topic) => {
    await rehydrate(topic);
    onChange?.(topic);
  };
  if (ch) ch.onmessage = (e: MessageEvent<{ topic: Topic }>) => void handle(e.data.topic);
  const onStorage = (e: StorageEvent) => {
    const topic = e.key ? KEYS[e.key] : undefined;
    if (topic) void handle(topic);
  };
  window.addEventListener("storage", onStorage);
  return () => {
    ch?.close();
    window.removeEventListener("storage", onStorage);
  };
}
