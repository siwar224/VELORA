import { z } from "zod";

/**
 * Shared contract between the app and the (mock) server. One definition gives:
 * the TypeScript types (z.infer), the server's request validation, and the
 * client's response validation. A real backend only has to honour these shapes.
 */

// ------------------------------------------------------------------ menu

export const categorySchema = z.enum(["cold", "espresso", "beans"]);
export const menuTagSchema = z.enum(["Signature", "Seasonal"]);

/** Fields a client may set on a menu item (everything except the server-made id). */
export const menuItemInputSchema = z.object({
  category: categorySchema,
  name: z.string().trim().min(2).max(40),
  detail: z.string().trim().max(120),
  notes: z.array(z.string().trim().min(1).max(24)).max(4),
  /** Euros. */
  price: z.number().min(0.5).max(100),
  /** Photo under /public; optional for items added in the admin. */
  image: z.string().max(200).optional(),
  alt: z.string().max(300).optional(),
  focus: z.string().max(40).optional(),
  aspect: z.number().positive().optional(),
  tag: menuTagSchema.optional(),
  available: z.boolean(),
  /** Units in stock (cups for drinks, bags for beans). */
  stock: z.number().int().min(0).max(100_000),
});
export const menuItemSchema = menuItemInputSchema.extend({ id: z.string().min(1) });
export const menuItemPatchSchema = menuItemInputSchema.partial();

// ---------------------------------------------------------------- orders

export const orderStatusSchema = z.enum(["new", "preparing", "ready", "picked-up"]);
export const orderSourceSchema = z.enum(["counter", "online", "simulated"]);
export const orderLineSchema = z.object({ itemId: z.string().min(1), qty: z.number().int().min(1).max(20) });

export const orderSchema = z.object({
  id: z.string(),
  /** Short human number shown on the board, e.g. 1042. */
  number: z.number().int(),
  createdAt: z.number(), // epoch ms
  pickupAt: z.number(), // epoch ms
  status: orderStatusSchema,
  customer: z.string(),
  lines: z.array(orderLineSchema),
  /** Euros, computed by the server at order time. */
  total: z.number(),
  source: orderSourceSchema,
  /** The Idempotency-Key the order was created with (lets retries return the same order). */
  idempotencyKey: z.string().optional(),
});

/** POST /api/orders body. The Idempotency-Key travels in a header, not here. */
export const newOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1).max(10),
  customer: z.string().trim().max(30),
  pickupAt: z.number(),
  source: orderSourceSchema,
});
export const orderPatchSchema = z.object({ status: orderStatusSchema });

// -------------------------------------------------------------- settings

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");
export const dayHoursSchema = z.object({ open: z.boolean(), from: timeSchema, to: timeSchema });

export const settingsSchema = z.object({
  /** Weekday "0" = Sunday … "6" = Saturday (JSON object keys are strings). */
  schedule: z.record(z.string(), dayHoursSchema),
  /** "Closed today": only applies on `date` (YYYY-MM-DD, shop time zone). */
  closedToday: z.object({ on: z.boolean(), date: z.string(), note: z.string().max(80) }),
});
export const settingsPatchSchema = settingsSchema.partial();

// ---------------------------------------------------------------- errors

/** Error body every failing endpoint returns. */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /** Field-level messages for validation errors, keyed by field path. */
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

// ----------------------------------------------------------------- types

export type Category = z.infer<typeof categorySchema>;
export type MenuItemRecord = z.infer<typeof menuItemSchema>;
export type MenuItemInput = z.infer<typeof menuItemInputSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderLine = z.infer<typeof orderLineSchema>;
export type Order = z.infer<typeof orderSchema>;
export type NewOrder = z.infer<typeof newOrderSchema>;
export type DayHours = z.infer<typeof dayHoursSchema>;
export type Settings = z.infer<typeof settingsSchema>;
