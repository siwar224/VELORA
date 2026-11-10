/** Data model shared by the admin dashboard and the public site (frontend-only demo). */

export type Category = "cold" | "espresso" | "beans";

export type MenuItemRecord = {
  id: string;
  category: Category;
  name: string;
  detail: string;
  notes: string[];
  /** Euros. */
  price: number;
  /** Photo under /public, optional for items added in the admin. */
  image?: string;
  alt?: string;
  focus?: string;
  aspect?: number;
  tag?: "Signature" | "Seasonal";
  available: boolean;
  /** Units in stock (cups for drinks, bags for beans). */
  stock: number;
};

export type OrderStatus = "new" | "preparing" | "ready" | "picked-up";

export type OrderLine = { itemId: string; qty: number };

export type Order = {
  id: string;
  /** Short human number shown on the board, e.g. 1042. */
  number: number;
  createdAt: number; // epoch ms
  pickupAt: number; // epoch ms
  status: OrderStatus;
  customer: string;
  lines: OrderLine[];
  /** Euros, computed at order time. */
  total: number;
  source: "counter" | "online" | "simulated";
};

export type DayHours = { open: boolean; from: string; to: string }; // "HH:MM"

export type Settings = {
  /** Weekday 0 = Sunday … 6 = Saturday. */
  schedule: Record<number, DayHours>;
  /** "Closed today": only applies on `date` (YYYY-MM-DD, shop time zone). */
  closedToday: { on: boolean; date: string; note: string };
};
