"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { ChevronDown, GripVertical, Pause, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { admin } from "@/content/admin";
import { boardQuery, menuQuery, useMoveOrder } from "@/lib/data/queries";
import type { MenuItemRecord, Order, OrderStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import PageHeader from "./PageHeader";
import QueryGate from "./QueryGate";
import { useAdminUi } from "./session";
import { BoardSkeleton } from "./skeletons";

const t = admin.orders;
const COLUMNS: OrderStatus[] = ["new", "preparing", "ready", "picked-up"];
const time = new Intl.DateTimeFormat(admin.common.locale, { hour: "2-digit", minute: "2-digit" });
const eur = new Intl.NumberFormat(admin.common.locale, { style: "currency", currency: admin.common.currency });
/** How many of today's picked-up orders to show (the rest are counted). */
const PICKED_SHOWN = 8;

/**
 * Keyboard moves jump a whole column at a time (left/right) instead of dnd-kit's
 * default 25px nudges, so Space → → Space moves a card two columns over.
 */
const columnJump: KeyboardCoordinateGetter = (event, { context: { active, droppableRects, collisionRect, over } }) => {
  if (!active || !collisionRect) return undefined;
  const dir = event.code === KeyboardCode.Right ? 1 : event.code === KeyboardCode.Left ? -1 : 0;
  if (!dir) return undefined;
  event.preventDefault();
  const current = (over?.id as OrderStatus | undefined) ?? (active.data.current?.status as OrderStatus);
  const next = COLUMNS[Math.min(COLUMNS.length - 1, Math.max(0, COLUMNS.indexOf(current) + dir))];
  const rect = droppableRects.get(next);
  if (!rect) return undefined;
  return { x: rect.left + rect.width / 2 - collisionRect.width / 2, y: rect.top + 56 };
};

function summary(order: Order, menu: MenuItemRecord[]) {
  return order.lines.map((l) => `${l.qty} × ${menu.find((m) => m.id === l.itemId)?.name ?? l.itemId}`).join(", ");
}

type Move = (id: string, status: OrderStatus) => void;

function OrderCard({ order, menu, onMove, overlay = false }: { order: Order; menu: MenuItemRecord[]; onMove?: Move; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id, data: { status: order.status, number: order.number }, disabled: overlay });
  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      aria-label={`Order ${order.number}, ${order.customer}`}
      className={cn("rounded-lg border bg-card p-3 shadow-sm", isDragging && !overlay && "opacity-40", overlay && "rotate-1 shadow-xl ring-2 ring-caramel")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="-ml-1 flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label={t.moveCard(order.number)}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="size-5" />
        </button>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-medium">
              #{order.number} <span className="font-normal text-muted-foreground">· {order.customer}</span>
            </p>
            <p className="text-sm font-medium tabular-nums">{eur.format(order.total)}</p>
          </div>
          <p className="mt-1 text-sm text-foreground/80">{summary(order, menu)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t.pickup} {time.format(order.pickupAt)}
            </span>
            <Badge variant="outline" className="font-normal">{t.sources[order.source]}</Badge>
          </div>
        </div>
      </div>
      {!overlay && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="mt-2 h-9 w-full justify-between text-muted-foreground">
              {t.moveTo}
              <span className="sr-only"> (order {order.number})</span>
              <ChevronDown aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.moveTo}</DropdownMenuLabel>
            {COLUMNS.filter((c) => c !== order.status).map((c) => (
              <DropdownMenuItem key={c} className="min-h-11" onSelect={() => onMove?.(order.id, c)}>
                {t.columns[c]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </article>
  );
}

function Column({ status, orders, menu, onMove, extra }: { status: OrderStatus; orders: Order[]; menu: MenuItemRecord[]; onMove: Move; extra?: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const headingId = `col-${status}`;
  return (
    <section aria-labelledby={headingId} className={cn("flex min-h-64 flex-col rounded-xl border bg-muted/50 transition-colors", isOver && "border-caramel bg-accent")}>
      <header className="flex items-center justify-between px-4 py-3">
        <h2 id={headingId} className="font-medium">
          {t.columns[status]}
        </h2>
        <Badge variant="secondary" className="tabular-nums">{orders.length + (extra ?? 0)}</Badge>
      </header>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-3 px-3 pb-3">
        {orders.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted-foreground">{t.empty}</p>}
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} menu={menu} onMove={onMove} />
        ))}
        {!!extra && <p className="px-1 text-center text-xs text-muted-foreground">+{extra} {t.pickedUpToday.toLowerCase()}</p>}
      </div>
    </section>
  );
}

const NONE: never[] = [];

export default function OrdersBoard() {
  const board = useQuery(boardQuery());
  const menuQ = useQuery(menuQuery());
  const move = useMoveOrder();
  const orders: Order[] = board.data ?? NONE;
  const menu: MenuItemRecord[] = menuQ.data ?? NONE;
  const simulating = useAdminUi((s) => s.simulating);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnJump }),
  );

  const columns = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const by: Record<OrderStatus, Order[]> = { new: [], preparing: [], ready: [], "picked-up": [] };
    for (const o of orders) {
      if (o.status === "picked-up" && o.createdAt < start) continue;
      by[o.status].push(o);
    }
    // Oldest first in active columns (first come, first served); most recent first in picked up.
    by.new.sort((a, b) => a.createdAt - b.createdAt);
    by.preparing.sort((a, b) => a.createdAt - b.createdAt);
    by.ready.sort((a, b) => a.createdAt - b.createdAt);
    by["picked-up"].sort((a, b) => b.createdAt - a.createdAt);
    return by;
  }, [orders]);

  const byId = (id: unknown) => orders.find((o) => o.id === id);
  const colName = (id: unknown) => (id ? t.columns[id as OrderStatus] : "");
  const announcements: Announcements = {
    onDragStart: ({ active }) => t.a11y.picked(byId(active.id)?.number ?? 0, colName(byId(active.id)?.status)),
    onDragOver: ({ active, over }) => (over ? t.a11y.over(byId(active.id)?.number ?? 0, colName(over.id)) : undefined),
    onDragEnd: ({ active, over }) => (over ? t.a11y.dropped(byId(active.id)?.number ?? 0, colName(over.id)) : t.a11y.cancelled(byId(active.id)?.number ?? 0)),
    onDragCancel: ({ active }) => t.a11y.cancelled(byId(active.id)?.number ?? 0),
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const order = byId(e.active.id);
    const target = e.over?.id as OrderStatus | undefined;
    if (order && target && target !== order.status) move.mutate({ id: order.id, status: target });
  };
  const active = activeId ? byId(activeId) : undefined;
  const pickedShown = columns["picked-up"].slice(0, PICKED_SHOWN);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {simulating ? t.simulator.on : t.simulator.off}
        </p>
        <Button variant="outline" onClick={() => useAdminUi.setState({ simulating: !simulating })} title={t.simulator.hint}>
          {simulating ? <Pause aria-hidden /> : <Play aria-hidden />}
          {simulating ? t.simulator.pause : t.simulator.resume}
        </Button>
      </PageHeader>

      <QueryGate queries={[board, menuQ]} skeleton={<BoardSkeleton />}>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t.a11y.instructions } }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((c) => (
            <Column
              key={c}
              status={c}
              menu={menu}
              onMove={(id, status) => move.mutate({ id, status })}
              orders={c === "picked-up" ? pickedShown : columns[c]}
              extra={c === "picked-up" ? columns[c].length - pickedShown.length : undefined}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{active ? <OrderCard order={active} menu={menu} overlay /> : null}</DragOverlay>
      </DndContext>
      </QueryGate>
    </>
  );
}
