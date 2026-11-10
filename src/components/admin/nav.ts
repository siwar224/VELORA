import { ClipboardList, Coffee, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import { admin } from "@/content/admin";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Admin pages, in sidebar order. */
export const NAV: NavItem[] = [
  { href: "/admin", label: admin.nav.overview, icon: LayoutDashboard },
  { href: "/admin/orders", label: admin.nav.orders, icon: ClipboardList },
  { href: "/admin/menu", label: admin.nav.menu, icon: Coffee },
  { href: "/admin/settings", label: admin.nav.settings, icon: Settings },
];

export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
