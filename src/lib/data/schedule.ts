import { visit } from "@/content/site";
import type { Settings } from "./types";

/**
 * Pure opening-hours helpers, kept apart from the API client on purpose: the
 * public page imports these, and must not pull the fetch/zod client into its
 * initial bundle.
 */

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
