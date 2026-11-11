import { queryOptions } from "@tanstack/react-query";
import { getMenu, getOrders, getSettings } from "./api";
import type { OrderStatus } from "./types";

/**
 * Query keys and query options for the admin (the public site doesn't use TanStack
 * Query). Components call these through useQuery; they call lib/data/api, which calls
 * fetch(). Keys are per resource so a change only invalidates what it affects.
 * Mutations (with their failure toasts) live in components/admin/mutations.ts.
 */

export const qk = {
  menu: ["menu"] as const,
  settings: ["settings"] as const,
  /** Everything order-related: invalidating this refreshes the board and the overview. */
  orders: ["orders"] as const,
  board: ["orders", "board"] as const,
  period: ["orders", "period"] as const,
};

/** Orders are polled while the tab is visible. */
export const ORDERS_REFETCH_MS = 15_000;
/** How far back the Overview loads orders (current + previous period for the KPI trends). */
export const ORDER_HISTORY_DAYS = 60;

const ACTIVE: OrderStatus[] = ["new", "preparing", "ready"];
const DAY = 86_400_000;
const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const menuQuery = () =>
  queryOptions({ queryKey: qk.menu, queryFn: ({ signal }) => getMenu(signal), staleTime: 30_000 });

export const settingsQuery = () =>
  queryOptions({ queryKey: qk.settings, queryFn: ({ signal }) => getSettings(signal), staleTime: 30_000 });

/**
 * The kanban board: every order still in progress (any date) plus today's picked-up
 * ones, as two small requests instead of one 30-day download.
 */
export const boardQuery = () =>
  queryOptions({
    queryKey: qk.board,
    queryFn: async ({ signal }) => {
      const [active, done] = await Promise.all([
        getOrders({ status: ACTIVE }, signal),
        getOrders({ from: startOfToday(), status: ["picked-up"] }, signal),
      ]);
      return [...active, ...done];
    },
    staleTime: 5_000,
    refetchInterval: ORDERS_REFETCH_MS,
  });

/** Orders for the Overview's statistics. */
export const periodQuery = () =>
  queryOptions({
    queryKey: qk.period,
    queryFn: ({ signal }) => getOrders({ from: startOfToday() - ORDER_HISTORY_DAYS * DAY }, signal),
    staleTime: 10_000,
    refetchInterval: ORDERS_REFETCH_MS,
  });
