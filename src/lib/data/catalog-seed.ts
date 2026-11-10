import { menu, visit } from "@/content/site";
import type { Category, MenuItemRecord, Settings } from "./types";

/** Stable id from a product name ("Velvet Iced Latte" → "velvet-iced-latte"). */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const parsePrice = (p: string) => Number(p.replace(/[^0-9.]/g, ""));

/** Starting stock per item; a couple start low so the low-stock alerts have something to show. */
const STOCK: Record<string, number> = {
  "velvet-iced-latte": 64,
  "cold-brew": 9,
  "caramel-cortado": 38,
  "espresso-tonic": 22,
  espresso: 120,
  cortado: 80,
  "flat-white": 70,
  "filter-of-the-day": 6,
  "ethiopia-yirgacheffe": 14,
  "colombia-huila": 18,
  "kenya-nyeri-aa": 4,
  "brazil-cerrado": 20,
};

/** The default menu = the copy in site.ts. Used for SSR and as the first stored state. */
export function seedMenu(): MenuItemRecord[] {
  return menu.tabs.flatMap((tab) =>
    tab.items.map((item) => ({
      id: slug(item.name),
      category: tab.id as Category,
      name: item.name,
      detail: item.detail,
      notes: [...item.notes],
      price: parsePrice(item.price),
      image: item.image,
      alt: item.alt,
      focus: "focus" in item ? item.focus : undefined,
      aspect: "aspect" in item ? item.aspect : undefined,
      tag: "tag" in item ? item.tag : undefined,
      available: true,
      stock: STOCK[slug(item.name)] ?? 40,
    })),
  );
}

/** The default opening hours = visit.schedule in site.ts. */
export function seedSettings(): Settings {
  const schedule: Settings["schedule"] = {};
  for (let d = 0; d < 7; d++) {
    const h = visit.schedule[d];
    schedule[d] = h ? { open: true, from: h[0], to: h[1] } : { open: false, from: "09:00", to: "17:00" };
  }
  return { schedule, closedToday: { on: false, date: "", note: "" } };
}
