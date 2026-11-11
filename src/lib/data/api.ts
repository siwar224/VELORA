import { z } from "zod";
import { request } from "./http";
import { menuItemSchema, orderSchema, settingsSchema } from "./schemas";
import type { MenuItemInput, MenuItemRecord, NewOrder, Order, OrderStatus, Settings } from "./types";

/**
 * The data API: one small async function per endpoint (see src/mocks/handlers.ts
 * for the routes). Components never fetch directly, and never see storage; to
 * move to a real backend, point `request()` at it and delete src/mocks.
 */

export type { NewOrder };

// ------------------------------------------------------------------ menu

export const getMenu = (signal?: AbortSignal) => request("GET", "/api/menu", { schema: z.array(menuItemSchema), signal });

/** Create (no id) or update (with id) a menu item. */
export function saveMenuItem(input: MenuItemInput & { id?: string }): Promise<MenuItemRecord> {
  const { id, ...fields } = input;
  return id
    ? request("PATCH", `/api/menu/${encodeURIComponent(id)}`, { body: fields, schema: menuItemSchema })
    : request("POST", "/api/menu", { body: fields, schema: menuItemSchema });
}

export const deleteMenuItem = (id: string) => request("DELETE", `/api/menu/${encodeURIComponent(id)}`);

export const setAvailability = (id: string, available: boolean) =>
  request("PATCH", `/api/menu/${encodeURIComponent(id)}`, { body: { available }, schema: menuItemSchema });

// -------------------------------------------------------------- settings

export const getSettings = (signal?: AbortSignal) => request("GET", "/api/settings", { schema: settingsSchema, signal });

export const saveSettings = (settings: Settings) => request("PATCH", "/api/settings", { body: settings, schema: settingsSchema });

// ---------------------------------------------------------------- orders

/** Orders created at or after `from` (epoch ms), optionally only in some statuses. */
export function getOrders(params: { from?: number; status?: OrderStatus[] } = {}, signal?: AbortSignal): Promise<Order[]> {
  const q = new URLSearchParams();
  if (params.from !== undefined) q.set("from", String(params.from));
  for (const s of params.status ?? []) q.append("status", s);
  const qs = q.toString();
  return request("GET", `/api/orders${qs ? `?${qs}` : ""}`, { schema: z.array(orderSchema), signal });
}

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request("PATCH", `/api/orders/${encodeURIComponent(id)}`, { body: { status }, schema: orderSchema });

/**
 * Place an order. Pass the same `idempotencyKey` when retrying: the server then
 * returns the original order instead of creating a duplicate.
 */
export const createOrder = (input: NewOrder, idempotencyKey?: string) =>
  request("POST", "/api/orders", {
    body: input,
    schema: orderSchema,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
