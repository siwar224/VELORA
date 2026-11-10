"use client";

import { Menu as MenuIcon, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { admin } from "@/content/admin";
import { createOrder, ensureOrders, getSettings, saveSettings, shopToday } from "@/lib/data/api";
import { CUSTOMERS, randomLines } from "@/lib/data/seed";
import { useCatalog } from "@/lib/data/store";
import { startSync } from "@/lib/data/sync";
import { cn } from "@/lib/utils";
import AdminSidebar from "./AdminSidebar";
import CommandPalette from "./CommandPalette";
import { isActive, NAV } from "./nav";
import { isSignedIn, signOut, useAdminUi } from "./session";

/** Ready once the demo session is confirmed and the stores are loaded (and seeded). */
const ReadyContext = createContext(false);
export const useAdminReady = () => useContext(ReadyContext);

/** A simulated customer order (used by the timer and the palette). */
async function simulateOrder() {
  const menu = useCatalog.getState().menu;
  const lines = randomLines(Math.random, menu.filter((m) => m.category !== "beans" || Math.random() < 0.1));
  if (!lines.length) return null;
  return createOrder({
    lines,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    pickupAt: Date.now() + (8 + Math.floor(Math.random() * 12)) * 60_000,
    source: "simulated",
  });
}

/**
 * Admin chrome: demo-session guard, data bootstrap + cross-tab sync, the
 * incoming-order simulator, sidebar (collapsible; drawer on phones), top bar
 * with the ⌘K palette, and a polite live region for new-order notifications.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { collapsed: savedCollapsed, simulating } = useAdminUi();
  const [narrow, setNarrow] = useState(false);

  // ---- Guard: no demo session → login (client-side only; this is a demo).
  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    let stop = () => {};
    (async () => {
      await useCatalog.persist.rehydrate();
      await ensureOrders();
      stop = startSync();
      setReady(true);
    })();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // ---- Sidebar defaults to the icon rail below 1100px (tablets).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1099px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const collapsed = savedCollapsed ?? narrow;

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? "" : t)), 5000);
  }, []);

  const newOrder = useCallback(async () => {
    const o = await simulateOrder();
    if (o) notify(admin.orders.newOrderToast(o.number, o.customer));
  }, [notify]);

  // ---- Incoming-order simulator: every 20–40 s while on (not under reduced motion).
  useEffect(() => {
    if (!ready || !simulating || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    const schedule = () => {
      id = window.setTimeout(async () => {
        await newOrder();
        schedule();
      }, 20_000 + Math.random() * 20_000);
    };
    schedule();
    return () => window.clearTimeout(id);
  }, [ready, simulating, newOrder]);

  const toggleClosed = async () => {
    const s = await getSettings();
    const today = shopToday();
    const on = !(s.closedToday.on && s.closedToday.date === today);
    await saveSettings({ ...s, closedToday: { ...s.closedToday, on, date: today } });
    notify(on ? `${admin.settings.closedToday}: ${admin.settings.closed}` : `${admin.settings.closedToday}: ${admin.settings.open}`);
  };

  const logout = () => {
    signOut();
    router.replace("/admin/login");
  };

  const title = NAV.find((n) => isActive(pathname, n.href))?.label ?? admin.meta.title;

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground" role="status">
        {admin.common.loading}
      </div>
    );
  }

  const sidebarProps = { onLogout: logout };

  return (
    <ReadyContext.Provider value={ready}>
      <div className="flex min-h-svh">
        {/* Desktop / tablet sidebar */}
        <aside className={cn("sticky top-0 hidden h-svh shrink-0 transition-[width] duration-300 md:block", collapsed ? "w-[76px]" : "w-64")}>
          <AdminSidebar {...sidebarProps} collapsed={collapsed} onToggle={() => useAdminUi.setState({ collapsed: !collapsed })} />
        </aside>

        {/* Phone drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
            <SheetTitle className="sr-only">{admin.nav.sectionLabel}</SheetTitle>
            <AdminSidebar {...sidebarProps} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <p role="note" className="bg-caramel px-4 py-1.5 text-center text-xs font-medium text-espresso">
            {admin.demoBanner}
          </p>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label={admin.nav.menuButton} onClick={() => setDrawerOpen(true)}>
              <MenuIcon aria-hidden />
            </Button>
            {/* The page itself carries the <h1>; this is a compact visual title on phones only. */}
            <p aria-hidden="true" className="font-serif text-2xl md:hidden">{title}</p>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="flex h-11 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-64"
                aria-keyshortcuts="Meta+K Control+K"
              >
                <Search aria-hidden className="size-4" />
                <span className="hidden sm:inline">{admin.palette.trigger}</span>
                <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-xs sm:inline">{admin.palette.shortcut}</kbd>
              </button>
            </div>
          </header>

          <main id="admin-main" className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNewOrder={newOrder}
        onToggleSimulator={() => useAdminUi.setState({ simulating: !simulating })}
        onToggleClosed={toggleClosed}
        onLogout={logout}
      />

      {/* New-order notifications (announced politely to screen readers). */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
        {toast && <p className="rounded-md bg-espresso px-4 py-3 text-sm text-cream shadow-lg">{toast}</p>}
      </div>
    </ReadyContext.Provider>
  );
}
