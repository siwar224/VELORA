"use client";

import { ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { admin } from "@/content/admin";
import { brand } from "@/content/site";
import { cn } from "@/lib/utils";
import { isActive, NAV } from "./nav";

type Props = {
  collapsed: boolean;
  onToggle?: () => void;
  onLogout: () => void;
  /** Called after a link is followed (closes the mobile drawer). */
  onNavigate?: () => void;
};

/** Dark espresso sidebar. Collapses to an icon rail (tooltips show the labels). */
export default function AdminSidebar({ collapsed, onToggle, onLogout, onNavigate }: Props) {
  const pathname = usePathname();

  const item = (label: string, icon: React.ReactNode, el: React.ReactElement) =>
    collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ) : (
      el
    );

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
      "focus-visible:outline-caramel",
      active ? "bg-caramel text-espresso font-medium" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
      collapsed && "justify-center px-0",
    );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center" : "px-5")}>
        <Link href="/admin" onClick={onNavigate} className="flex min-h-11 items-center font-serif text-2xl tracking-[0.3em]" aria-label={`${brand.name} admin home`}>
          {collapsed ? "V" : brand.name}
          <span className="-ml-[0.2em] text-caramel">.</span>
        </Link>
      </div>

      <nav aria-label={admin.nav.sectionLabel} className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <div key={href}>
              {item(
                label,
                <Icon />,
                <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} aria-label={collapsed ? label : undefined} className={linkClass(active)}>
                  <Icon aria-hidden className="size-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>,
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-3">
        {item(
          admin.nav.viewSite,
          null,
          <Link href="/" aria-label={collapsed ? admin.nav.viewSite : undefined} className={linkClass(false)}>
            <ExternalLink aria-hidden className="size-5 shrink-0" />
            {!collapsed && <span>{admin.nav.viewSite}</span>}
          </Link>,
        )}
        {item(
          admin.nav.logout,
          null,
          <button type="button" onClick={onLogout} aria-label={collapsed ? admin.nav.logout : undefined} className={cn(linkClass(false), "w-full")}>
            <LogOut aria-hidden className="size-5 shrink-0" />
            {!collapsed && <span>{admin.nav.logout}</span>}
          </button>,
        )}
        {onToggle &&
          item(
            collapsed ? admin.nav.expand : admin.nav.collapse,
            null,
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? admin.nav.expand : admin.nav.collapse}
              aria-expanded={!collapsed}
              className={cn(linkClass(false), "w-full")}
            >
              {collapsed ? <PanelLeftOpen aria-hidden className="size-5 shrink-0" /> : <PanelLeftClose aria-hidden className="size-5 shrink-0" />}
              {!collapsed && <span>{admin.nav.collapse}</span>}
            </button>,
          )}
      </div>
    </div>
  );
}
