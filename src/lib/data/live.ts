"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "./store";
import { startSync } from "./sync";

let syncing = false;

/**
 * Public site: the live menu + settings. Before hydration this is the default
 * catalog built from site.ts (so the server HTML is unchanged); after mount it
 * reads what the admin saved and follows changes from other tabs live.
 */
export function useLiveCatalog() {
  const menu = useCatalog((s) => s.menu);
  const settings = useCatalog((s) => s.settings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.resolve(useCatalog.persist.rehydrate()).then(() => alive && setHydrated(true));
    if (!syncing) {
      syncing = true; // one listener for the page's lifetime
      startSync();
    }
    return () => {
      alive = false;
    };
  }, []);

  return { menu, settings, hydrated };
}

/** Ask the page to open the "Order ahead" form (the form listens for this event). */
export const OPEN_ORDER_EVENT = "velor:open-order";
export const openOrderForm = () => window.dispatchEvent(new Event(OPEN_ORDER_EVENT));
