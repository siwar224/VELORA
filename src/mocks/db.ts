import type { ZodType } from "zod";
import { slug } from "@/lib/data/catalog-seed";
import type { MenuItemInput, MenuItemRecord, NewOrder, Order, OrderStatus, Settings } from "@/lib/data/types";
import { useCatalog, useOrders } from "@/lib/data/store";
import { broadcast } from "@/lib/data/sync";

/**
 * The mock "server": business rules over the persisted stores. Request handlers
 * (./handlers) are thin wrappers around these functions. Like a real stateless
 * server, every function re-reads storage first (another tab may have written)
 * and tells other tabs when it changes something.
 */

/** An error the mock server turns into a JSON error response. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Parse a JSON request body against a schema, or fail with a 400 / 422. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new HttpError(400, "invalid_json", "The request body is not valid JSON.");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) fields[issue.path.join(".") || "_"] ??= issue.message;
    throw new HttpError(422, "validation_failed", "Some fields are not valid.", fields);
  }
  return result.data;
}

const catalog = async () => {
  await useCatalog.persist.rehydrate();
  return useCatalog.getState();
};
const orders = async () => {
  await useOrders.persist.rehydrate();
  return useOrders.getState();
};

// ------------------------------------------------------------------ menu

export async function listMenu(): Promise<MenuItemRecord[]> {
  return (await catalog()).menu;
}

export async function getMenuItem(id: string): Promise<MenuItemRecord> {
  const item = (await catalog()).menu.find((m) => m.id === id);
  if (!item) throw new HttpError(404, "not_found", "That menu item no longer exists.");
  return item;
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItemRecord> {
  const { menu } = await catalog();
  const base = slug(input.name) || "item";
  let id = base;
  for (let n = 2; menu.some((m) => m.id === id); n++) id = `${base}-${n}`;
  const item: MenuItemRecord = { ...input, id };
  useCatalog.setState({ menu: [...menu, item] });
  broadcast("catalog");
  return item;
}

export async function updateMenuItem(id: string, patch: Partial<MenuItemInput>): Promise<MenuItemRecord> {
  const { menu } = await catalog();
  const current = menu.find((m) => m.id === id);
  if (!current) throw new HttpError(404, "not_found", "That menu item no longer exists.");
  const next: MenuItemRecord = { ...current, ...patch, id };
  useCatalog.setState({ menu: menu.map((m) => (m.id === id ? next : m)) });
  broadcast("catalog");
  return next;
}

export async function removeMenuItem(id: string): Promise<void> {
  const { menu } = await catalog();
  if (!menu.some((m) => m.id === id)) throw new HttpError(404, "not_found", "That menu item no longer exists.");
  useCatalog.setState({ menu: menu.filter((m) => m.id !== id) });
  broadcast("catalog");
}

// -------------------------------------------------------------- settings

export async function readSettings(): Promise<Settings> {
  return (await catalog()).settings;
}

export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const { settings } = await catalog();
  const next: Settings = { ...settings, ...patch };
  useCatalog.setState({ settings: next });
  broadcast("catalog");
  return next;
}

// ---------------------------------------------------------------- orders

let seeding: Promise<Order[]> | null = null;

/**
 * First visit: generate 30 days of history (the generator is only loaded when needed).
 * Single-flight: several requests arriving together (the board and the overview both
 * load orders) share one seeding run instead of racing.
 */
async function ensureSeeded(): Promise<Order[]> {
  const state = await orders();
  if (state.seeded) return state.orders;
  return (seeding ??= seed(state.orders).finally(() => (seeding = null)));
}

async function seed(existing: Order[]): Promise<Order[]> {
  const { seedOrders } = await import("@/lib/data/seed");
  const { menu, settings } = await catalog();
  const history = seedOrders(menu, settings);
  // Keep any orders placed from the public site before the history existed.
  const maxSeed = history.reduce((m, o) => Math.max(m, o.number), 1000);
  const earlier = existing.map((o, i) => ({ ...o, number: maxSeed + i + 1 }));
  useOrders.setState({ orders: [...history, ...earlier], seeded: true });
  return useOrders.getState().orders;
}

export async function listOrders(filter: { from?: number; status?: OrderStatus[] } = {}): Promise<Order[]> {
  const all = await ensureSeeded();
  return all.filter((o) => (filter.from === undefined || o.createdAt >= filter.from) && (!filter.status || filter.status.includes(o.status)));
}

export async function getOrder(id: string): Promise<Order> {
  const order = (await ensureSeeded()).find((o) => o.id === id);
  if (!order) throw new HttpError(404, "not_found", "That order no longer exists.");
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const all = await ensureSeeded();
  const current = all.find((o) => o.id === id);
  if (!current) throw new HttpError(404, "not_found", "That order no longer exists.");
  const next: Order = { ...current, status };
  useOrders.setState({ orders: all.map((o) => (o.id === id ? next : o)) });
  broadcast("orders");
  return next;
}

/**
 * Place an order. Rules: items must exist and be available; the total is computed
 * here (never trusted from the client); stock is decremented. With an
 * Idempotency-Key, repeating the request returns the original order instead of
 * creating a second one (double clicks, retries after a timeout).
 */
export async function placeOrder(input: NewOrder, idempotencyKey?: string): Promise<{ order: Order; created: boolean }> {
  const all = await ensureSeeded();
  if (idempotencyKey) {
    const existing = all.find((o) => o.idempotencyKey === idempotencyKey);
    if (existing) return { order: existing, created: false };
  }
  const { menu } = await catalog();
  let total = 0;
  for (const line of input.lines) {
    const item = menu.find((m) => m.id === line.itemId);
    if (!item) throw new HttpError(422, "unknown_item", "One of the items is no longer on the menu.", { lines: "Unknown item" });
    if (!item.available) throw new HttpError(409, "unavailable", `${item.name} is sold out.`, { lines: `${item.name} is sold out` });
    total += item.price * line.qty;
  }
  const now = Date.now();
  const order: Order = {
    id: `o${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    number: all.reduce((m, o) => Math.max(m, o.number), 1000) + 1,
    createdAt: now,
    pickupAt: input.pickupAt,
    status: "new",
    customer: input.customer.trim() || "Guest",
    lines: input.lines,
    total: Math.round(total * 100) / 100,
    source: input.source,
    idempotencyKey,
  };
  useOrders.setState({ orders: [...all, order] });
  useCatalog.setState({
    menu: menu.map((m) => {
      const line = input.lines.find((l) => l.itemId === m.id);
      return line ? { ...m, stock: Math.max(0, m.stock - line.qty) } : m;
    }),
  });
  broadcast("orders");
  broadcast("catalog");
  return { order, created: true };
}
