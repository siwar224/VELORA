import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedMenu, seedSettings } from "./catalog-seed";
import type { MenuItemRecord, Order, Settings } from "./types";

/**
 * Two persisted stores, kept apart on purpose:
 * - catalog (menu + settings): small, read by the public site and the admin;
 * - orders (30 days of history): large, loaded by the admin only (and appended
 *   to by the public "Order ahead" form).
 * `skipHydration`: the server renders the defaults (from site.ts), then the
 * client rehydrates from localStorage after mount, so there's no hydration
 * mismatch. Components never touch these directly: they go through lib/data/api.
 */

export type CatalogState = { menu: MenuItemRecord[]; settings: Settings };
export type OrdersState = { orders: Order[]; seeded: boolean };

const storage = createJSONStorage(() => localStorage);

export const useCatalog = create<CatalogState>()(
  persist(() => ({ menu: seedMenu(), settings: seedSettings() }), {
    name: "velor:catalog",
    version: 1,
    storage,
    skipHydration: true,
  }),
);

export const useOrders = create<OrdersState>()(
  persist((): OrdersState => ({ orders: [], seeded: false }), {
    name: "velor:orders",
    version: 1,
    storage,
    skipHydration: true,
  }),
);
