import type { MenuItemRecord, Order, OrderLine, Settings } from "./types";

/**
 * 30 days of realistic order history, generated from a fixed seed so every
 * visitor (and every test run) sees the same numbers:
 * - morning (8–10) and lunch (12–14) peaks inside each day's opening hours,
 * - weekends ~35% busier, a gentle upward trend, ±10% day-to-day noise,
 * - uneven drink popularity (iced latte and cold brew lead; beans are occasional),
 * - 1–3 lines per order, mostly single cups.
 * Today's orders up to "now" are included; the most recent few are left active
 * so the Orders board isn't empty.
 */

/** mulberry32: tiny, fast, seedable PRNG (0 ≤ x < 1). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20211101; // VELOR's (fictional) opening day

/** Relative popularity by item id; unknown (admin-added) items get 3. */
export const POPULARITY: Record<string, number> = {
  "velvet-iced-latte": 26,
  "cold-brew": 18,
  "flat-white": 12,
  "caramel-cortado": 12,
  espresso: 10,
  cortado: 8,
  "espresso-tonic": 8,
  "filter-of-the-day": 5,
  "ethiopia-yirgacheffe": 1.4,
  "brazil-cerrado": 1.3,
  "colombia-huila": 1.1,
  "kenya-nyeri-aa": 0.8,
};

/** Relative traffic by hour of day (only hours inside opening times are used). */
const HOURLY: Record<number, number> = {
  7: 0.7, 8: 1.7, 9: 1.9, 10: 1.1, 11: 0.9, 12: 1.8, 13: 1.6, 14: 0.9, 15: 0.7, 16: 0.8, 17: 0.6, 18: 0.35,
};

export const CUSTOMERS = [
  "Inès", "Léa", "Hugo", "Camille", "Noah", "Chloé", "Lucas", "Manon", "Jules", "Sarah", "Adam", "Emma",
  "Louis", "Zoé", "Gabriel", "Alice", "Arthur", "Jade", "Raphaël", "Lina", "Nathan", "Rose", "Tom", "Mila",
  "Yanis", "Anna", "Théo", "Nina", "Sami", "Clara",
];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Weighted pick. */
export function pick<T>(rand: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = rand() * total;
  for (const t of items) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1];
}

/** One random order's lines (used by the seed and by the live simulator). */
export function randomLines(rand: () => number, menu: MenuItemRecord[]): OrderLine[] {
  const drinks = menu.filter((m) => m.available);
  if (!drinks.length) return [];
  const count = rand() < 0.65 ? 1 : rand() < 0.78 ? 2 : 3;
  const lines: OrderLine[] = [];
  for (let i = 0; i < count; i++) {
    const item = pick(rand, drinks, (m) => POPULARITY[m.id] ?? 3);
    const existing = lines.find((l) => l.itemId === item.id);
    if (existing) existing.qty += 1;
    else lines.push({ itemId: item.id, qty: rand() < 0.12 ? 2 : 1 });
  }
  return lines;
}

export const orderTotal = (lines: OrderLine[], menu: MenuItemRecord[]) =>
  Math.round(lines.reduce((s, l) => s + (menu.find((m) => m.id === l.itemId)?.price ?? 0) * l.qty, 0) * 100) / 100;

export function seedOrders(menu: MenuItemRecord[], settings: Settings, now = new Date()): Order[] {
  const rand = mulberry32(SEED);
  const orders: Order[] = [];
  let number = 1000;
  const DAYS = 30;

  for (let back = DAYS - 1; back >= 0; back--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const hours = settings.schedule[day.getDay()];
    if (!hours?.open) continue;
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const trend = 1 + ((DAYS - back) / DAYS) * 0.08; // +8% over the month
    const target = Math.round(92 * (weekend ? 1.35 : 1) * trend * (0.9 + rand() * 0.2));

    const open = toMin(hours.from);
    const close = toMin(hours.to);
    const minutes: number[] = [];
    for (let m = open; m < close; m += 5) minutes.push(m);

    for (let i = 0; i < target; i++) {
      const minute = pick(rand, minutes, (m) => HOURLY[Math.floor(m / 60)] ?? 0.3) + Math.floor(rand() * 5);
      const createdAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minute, Math.floor(rand() * 60)).getTime();
      if (createdAt > now.getTime()) continue; // today: only up to now
      const lines = randomLines(rand, menu);
      orders.push({
        id: `o${createdAt.toString(36)}${i}`,
        number: 0,
        createdAt,
        pickupAt: createdAt + (6 + Math.floor(rand() * 10)) * 60_000,
        status: "picked-up",
        customer: CUSTOMERS[Math.floor(rand() * CUSTOMERS.length)],
        lines,
        total: orderTotal(lines, menu),
        source: rand() < 0.3 ? "online" : "counter",
      });
    }
  }

  orders.sort((a, b) => a.createdAt - b.createdAt);
  for (const o of orders) o.number = ++number;

  // Leave today's most recent orders in flight so the board has something on it.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todays = orders.filter((o) => o.createdAt >= today);
  const recent = todays.slice(-6);
  recent.forEach((o, i) => (o.status = i < 2 ? "ready" : i < 4 ? "preparing" : "new"));
  return orders;
}
