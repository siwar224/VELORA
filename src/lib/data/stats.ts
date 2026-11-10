import type { MenuItemRecord, Order } from "./types";

/** Pure helpers that turn orders into dashboard numbers. */

const DAY = 86_400_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** [from, to) for the last `days` days including today, and the period before it. */
export function periods(days: number, now = Date.now()) {
  const end = startOfDay(now) + DAY;
  const from = end - days * DAY;
  return { from, to: end, prevFrom: from - days * DAY, prevTo: from };
}

const between = (orders: Order[], from: number, to: number) => orders.filter((o) => o.createdAt >= from && o.createdAt < to);
const items = (o: Order) => o.lines.reduce((s, l) => s + l.qty, 0);

function summary(orders: Order[]) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return { revenue, orders: orders.length, avgTicket: orders.length ? revenue / orders.length : 0, items: orders.reduce((s, o) => s + items(o), 0) };
}

/** KPIs for the period, each with its change vs the previous period (fraction, e.g. 0.12 = +12%). */
export function kpis(orders: Order[], days: number) {
  const p = periods(days);
  const cur = summary(between(orders, p.from, p.to));
  const prev = summary(between(orders, p.prevFrom, p.prevTo));
  const change = (a: number, b: number) => (b ? (a - b) / b : null);
  return (["revenue", "orders", "avgTicket", "items"] as const).map((key) => ({ key, value: cur[key], change: change(cur[key], prev[key]) }));
}

/** Revenue per day for the period (oldest first). */
export function revenueByDay(orders: Order[], days: number, locale: string) {
  const p = periods(days);
  const fmt = new Intl.DateTimeFormat(locale, days <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" });
  const out = Array.from({ length: days }, (_, i) => ({ day: fmt.format(new Date(p.from + i * DAY)), revenue: 0 }));
  for (const o of between(orders, p.from, p.to)) out[Math.floor((o.createdAt - p.from) / DAY)].revenue += o.total;
  return out.map((d) => ({ ...d, revenue: Math.round(d.revenue) }));
}

/** Average orders per hour of day over the period's open days (7h–19h). */
export function ordersByHour(orders: Order[], days: number) {
  const p = periods(days);
  const list = between(orders, p.from, p.to);
  const openDays = new Set(list.map((o) => startOfDay(o.createdAt))).size || 1;
  const counts = new Map<number, number>();
  for (const o of list) {
    const h = new Date(o.createdAt).getHours();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return Array.from({ length: 13 }, (_, i) => i + 7).map((h) => ({
    hour: `${String(h).padStart(2, "0")}h`,
    orders: Math.round(((counts.get(h) ?? 0) / openDays) * 10) / 10,
  }));
}

/** Top sellers by units in the period. */
export function bestSellers(orders: Order[], menu: MenuItemRecord[], days: number, n = 5) {
  const p = periods(days);
  const units = new Map<string, number>();
  for (const o of between(orders, p.from, p.to)) for (const l of o.lines) units.set(l.itemId, (units.get(l.itemId) ?? 0) + l.qty);
  return [...units.entries()]
    .map(([id, qty]) => {
      const item = menu.find((m) => m.id === id);
      return { id, name: item?.name ?? id, qty, revenue: qty * (item?.price ?? 0), image: item?.image };
    })
    .sort((a, b) => b.qty - a.qty)
    .slice(0, n);
}

export const LOW_STOCK = 10;
export const lowStock = (menu: MenuItemRecord[]) => menu.filter((m) => m.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock);
