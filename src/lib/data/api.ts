import { visit } from "@/content/site";
import { slug } from "./catalog-seed";
import { useCatalog, useOrders } from "./store";
import { broadcast } from "./sync";
import type { MenuItemRecord, Order, OrderLine, OrderStatus, Settings } from "./types";

/**
 * The data API used by the admin and the public site. Every function is async on
 * purpose: today they read/write the persisted Zustand stores (localStorage);
 * swapping this one file for fetch() calls to a real backend changes nothing
 * for the components. Mutations re-read storage first (another tab may have
 * written) and broadcast the change to other tabs.
 */

const fresh = async () => {
  await useCatalog.persist.rehydrate();
};
const freshOrders = async () => {
  await useOrders.persist.rehydrate();
};

// ---------------------------------------------------------------- catalog

export async function getMenu(): Promise<MenuItemRecord[]> {
  await fresh();
  return useCatalog.getState().menu;
}

/** Create or update a menu item (new items get an id from their name). */
export async function saveMenuItem(input: Omit<MenuItemRecord, "id"> & { id?: string }): Promise<MenuItemRecord> {
  await fresh();
  const menu = useCatalog.getState().menu;
  let id = input.id;
  if (!id) {
    const base = slug(input.name) || "item";
    id = base;
    for (let n = 2; menu.some((m) => m.id === id); n++) id = `${base}-${n}`;
  }
  const item: MenuItemRecord = { ...input, id };
  const exists = menu.some((m) => m.id === id);
  useCatalog.setState({ menu: exists ? menu.map((m) => (m.id === id ? item : m)) : [...menu, item] });
  broadcast("catalog");
  return item;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await fresh();
  useCatalog.setState({ menu: useCatalog.getState().menu.filter((m) => m.id !== id) });
  broadcast("catalog");
}

export async function setAvailability(id: string, available: boolean): Promise<void> {
  await fresh();
  useCatalog.setState({ menu: useCatalog.getState().menu.map((m) => (m.id === id ? { ...m, available } : m)) });
  broadcast("catalog");
}

export async function getSettings(): Promise<Settings> {
  await fresh();
  return useCatalog.getState().settings;
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  await fresh();
  useCatalog.setState({ settings });
  broadcast("catalog");
  return settings;
}

/** Today's date (YYYY-MM-DD) in the shop's time zone. */
export function shopToday(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: visit.timeZone }).format(date);
}

/**
 * The schedule in the shape lib/hours expects, with "closed today" applied:
 * weekday → [from, to] or null.
 */
export function effectiveSchedule(settings: Settings, date = new Date()): Record<number, readonly [string, string] | null> {
  const out: Record<number, readonly [string, string] | null> = {};
  for (let d = 0; d < 7; d++) {
    const h = settings.schedule[d];
    out[d] = h?.open ? [h.from, h.to] : null;
  }
  if (settings.closedToday.on && settings.closedToday.date === shopToday(date)) {
    const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: visit.timeZone })).getDay();
    out[weekday] = null;
  }
  return out;
}

// ---------------------------------------------------------------- orders

/** Load orders; on first visit, seed 30 days of history (generator loaded on demand). */
export async function ensureOrders(): Promise<Order[]> {
  await Promise.all([fresh(), freshOrders()]);
  const state = useOrders.getState();
  if (!state.seeded) {
    const { seedOrders } = await import("./seed");
    const { menu, settings } = useCatalog.getState();
    const history = seedOrders(menu, settings);
    // Keep any orders placed from the public site before the admin was first opened.
    const maxSeed = history.reduce((m, o) => Math.max(m, o.number), 1000);
    const earlier = state.orders.map((o, i) => ({ ...o, number: maxSeed + i + 1 }));
    useOrders.setState({ orders: [...history, ...earlier], seeded: true });
  }
  return useOrders.getState().orders;
}

export async function getOrders(): Promise<Order[]> {
  await freshOrders();
  return useOrders.getState().orders;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await freshOrders();
  useOrders.setState({ orders: useOrders.getState().orders.map((o) => (o.id === id ? { ...o, status } : o)) });
  broadcast("orders");
}

export type NewOrder = { lines: OrderLine[]; customer: string; pickupAt: number; source: Order["source"] };

/** Place an order (public "Order ahead" form, or the simulator). Decrements stock. */
export async function createOrder(input: NewOrder): Promise<Order> {
  await Promise.all([fresh(), freshOrders()]);
  const { menu } = useCatalog.getState();
  const { orders } = useOrders.getState();
  const now = Date.now();
  const total = Math.round(input.lines.reduce((s, l) => s + (menu.find((m) => m.id === l.itemId)?.price ?? 0) * l.qty, 0) * 100) / 100;
  const order: Order = {
    id: `o${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    number: orders.reduce((m, o) => Math.max(m, o.number), 1000) + 1,
    createdAt: now,
    pickupAt: input.pickupAt,
    status: "new",
    customer: input.customer.trim() || "Guest",
    lines: input.lines,
    total,
    source: input.source,
  };
  useOrders.setState({ orders: [...orders, order] });
  useCatalog.setState({
    menu: menu.map((m) => {
      const line = input.lines.find((l) => l.itemId === m.id);
      return line ? { ...m, stock: Math.max(0, m.stock - line.qty) } : m;
    }),
  });
  broadcast("orders");
  broadcast("catalog");
  return order;
}
