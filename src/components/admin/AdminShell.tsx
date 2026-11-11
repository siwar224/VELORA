"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Activity, Menu as MenuIcon, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { admin } from "@/content/admin";
import { createOrder } from "@/lib/data/api";
import { isDefaultNetwork, useNetworkSim } from "@/lib/data/network-sim";
import { menuQuery, qk, settingsQuery } from "@/lib/data/queries";
import { shopToday } from "@/lib/data/schedule";
import { ensureMocks } from "@/mocks/start";
import { CUSTOMERS, randomLines } from "@/lib/data/seed";
import { startSync } from "@/lib/data/sync";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import AdminSidebar from "./AdminSidebar";
import CommandPalette from "./CommandPalette";
import ErrorPanel from "./ErrorPanel";
import { showFailure } from "./errors";
import { useSaveSettings } from "./mutations";
import { isActive, NAV } from "./nav";
import { isSignedIn, signOut, useAdminUi } from "./session";
import Toaster from "./Toaster";

/** Ready once the demo session is confirmed and the stores are loaded (and seeded). */
const ReadyContext = createContext(false);
export const useAdminReady = () => useContext(ReadyContext);

/** A simulated customer order (used by the timer and the palette), sent through the API. */
async function simulateOrder(qc: QueryClient) {
  const menu = await qc.ensureQueryData(menuQuery());
  const lines = randomLines(Math.random, menu.filter((m) => m.category !== "beans" || Math.random() < 0.1));
  if (!lines.length) return null;
  const order = await createOrder({
    lines,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    pickupAt: Date.now() + (8 + Math.floor(Math.random() * 12)) * 60_000,
    source: "simulated",
  });
  // The order changed the board and (stock) the menu.
  void qc.invalidateQueries({ queryKey: qk.orders });
  void qc.invalidateQueries({ queryKey: qk.menu });
  return order;
}

/**
 * Admin chrome: demo-session guard, data bootstrap + cross-tab sync, the
 * incoming-order simulator, sidebar (collapsible; drawer on phones), top bar
 * with the ⌘K palette, and a polite live region for new-order notifications.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [boot, setBoot] = useState<"loading" | "ready" | "error">("loading");
  const ready = boot === "ready";
  const rebootRef = useRef<() => void>(() => {});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { collapsed: savedCollapsed, simulating } = useAdminUi();
  const network = useNetworkSim();
  const saveSettings = useSaveSettings();
  const [narrow, setNarrow] = useState(false);

  // ---- Guard: no demo session → login (client-side only; this is a demo).
  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    let stop = () => {};
    let alive = true;
    const start = async () => {
      setBoot("loading");
      // READY GATE: nothing renders (so nothing requests) until the mock server is up.
      try {
        await ensureMocks();
      } catch {
        if (alive) setBoot("error"); // e.g. service workers blocked: show a Retry panel
        return;
      }
      if (!alive) return;
      // Changes made in other tabs (or the public site) refresh the matching queries.
      stop();
      stop = startSync(
        (topic) => {
          if (topic === "orders") void qc.invalidateQueries({ queryKey: qk.orders });
          else {
            void qc.invalidateQueries({ queryKey: qk.menu });
            void qc.invalidateQueries({ queryKey: qk.settings });
          }
        },
        { rehydrate: false },
      );
      setBoot("ready");
    };
    rebootRef.current = () => void start();
    void start();
    return () => {
      alive = false;
      stop();
    };
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

  const notify = useCallback((msg: string) => void toast.info(msg), []);

  /** Add a simulated order. The background timer skips a failed one quietly; the palette's manual one reports it. */
  const newOrder = useCallback(
    async (manual = false) => {
      const attempt = async (): Promise<void> => {
        try {
          const o = await simulateOrder(qc);
          if (o) notify(admin.orders.newOrderToast(o.number, o.customer));
        } catch (error) {
          if (manual) showFailure(admin.errors.actions.testOrder, error, () => void attempt());
        }
      };
      await attempt();
    },
    [notify, qc],
  );

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
    try {
      const s = await qc.fetchQuery(settingsQuery());
      const today = shopToday();
      const on = !(s.closedToday.on && s.closedToday.date === today);
      saveSettings.mutate(
        { ...s, closedToday: { ...s.closedToday, on, date: today } },
        { onSuccess: () => notify(on ? `${admin.settings.closedToday}: ${admin.settings.closed}` : `${admin.settings.closedToday}: ${admin.settings.open}`) },
      );
    } catch (error) {
      showFailure(admin.errors.actions.closedToday, error, () => void toggleClosed());
    }
  };

  const logout = () => {
    signOut();
    router.replace("/admin/login");
  };

  const title = NAV.find((n) => isActive(pathname, n.href))?.label ?? admin.meta.title;

  if (boot === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <ErrorPanel title={admin.errors.boot.title} body={admin.errors.boot.body} onRetry={() => rebootRef.current()} />
      </div>
    );
  }
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
              {/* Visible whenever the network simulator is not at its defaults. */}
              {!isDefaultNetwork(network) && (
                <Link
                  href="/admin/settings"
                  aria-label={admin.network.indicatorLabel}
                  className="flex h-11 items-center gap-2 rounded-md border border-caramel-deep/50 bg-accent px-3 text-sm text-caramel-deep"
                >
                  <Activity aria-hidden className="size-4" />
                  <span className="hidden lg:inline">
                    {admin.network.indicator(admin.network.latency[network.latency], admin.network.failures[network.failures].toLowerCase())}
                  </span>
                </Link>
              )}
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
        onNetwork={(failures) => useNetworkSim.setState({ failures })}
        onNewOrder={() => void newOrder(true)}
        onToggleSimulator={() => useAdminUi.setState({ simulating: !simulating })}
        onToggleClosed={toggleClosed}
        onLogout={logout}
      />

      {/* Notifications: new orders, failed actions (with Retry). Polite live region. */}
      <Toaster />
    </ReadyContext.Provider>
  );
}
