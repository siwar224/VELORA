/**
 * Data model shared by the admin dashboard and the public site (frontend-only demo).
 * The types are inferred from the zod schemas in ./schemas (single source of truth);
 * this file only re-exports them, and is erased at build time.
 */
export type {
  Category,
  DayHours,
  MenuItemInput,
  MenuItemRecord,
  NewOrder,
  Order,
  OrderLine,
  OrderStatus,
  Settings,
} from "./schemas";
