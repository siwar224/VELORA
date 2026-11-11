import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { admin } from "@/content/admin";
import PageHeader from "./PageHeader";

/**
 * Loading skeletons, one per page. They reuse the real components and the real static
 * text (titles, labels, column names) and only replace dynamic values with grey bars
 * of the same line height, so when the data arrives nothing moves (no layout shift).
 */

/** Wrapper: one polite "Loading…" for screen readers, bars are aria-hidden. */
function Loading({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{admin.common.loading}</span>
      {children}
    </div>
  );
}

// -------------------------------------------------------------- Overview

const o = admin.overview;

export function OverviewSkeleton() {
  return (
    <Loading>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(["revenue", "orders", "avgTicket", "items"] as const).map((k) => (
          <Card key={k} className="gap-2">
            <CardHeader>
              <CardDescription className="eyebrow">{o.kpis[k]}</CardDescription>
              <CardTitle className="font-serif text-4xl font-normal">
                <Skeleton className="h-10 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-44" />
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        {[
          { c: "xl:col-span-3", head: o.revenueChart },
          { c: "xl:col-span-2", head: o.hourChart },
        ].map(({ c, head }) => (
          <Card key={head.title} className={c}>
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-normal">{head.title}</CardTitle>
              <CardDescription>{head.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{o.bestSellers.title}</CardTitle>
            <CardDescription>{o.bestSellers.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-10 flex-1" />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{o.lowStock.title}</CardTitle>
            <CardDescription>{o.lowStock.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex min-h-11 items-center gap-3 py-3">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Loading>
  );
}

// ---------------------------------------------------------------- Orders

const COLUMNS = ["new", "preparing", "ready", "picked-up"] as const;
const CARDS_PER_COLUMN = { new: 2, preparing: 2, ready: 2, "picked-up": 3 };

export function BoardSkeleton() {
  return (
    <Loading>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((c) => (
          <section key={c} className="flex min-h-64 flex-col rounded-xl border bg-muted/50">
            <header className="flex items-center justify-between px-4 py-3">
              <h2 className="font-medium">{admin.orders.columns[c]}</h2>
              <Skeleton className="h-[22px] w-8 rounded-full" />
            </header>
            <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
              {Array.from({ length: CARDS_PER_COLUMN[c] }, (_, i) => (
                <div key={i} className="rounded-lg border bg-card p-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <Skeleton className="-ml-1 size-11 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="mt-2 h-9 w-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Loading>
  );
}

// ------------------------------------------------------------------ Menu

const m = admin.menu.columns;

export function MenuTableSkeleton() {
  return (
    <Loading>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {[m.item, m.category, m.price, m.stock, m.available].map((label, i) => (
                <TableHead key={label}>
                  {/* Sortable columns are 44px tall buttons in the real table. */}
                  <span className={i === 0 || i === 2 || i === 3 ? "-ml-2 inline-flex h-11 items-center px-2" : undefined}>{label}</span>
                </TableHead>
              ))}
              <TableHead>
                <span className="sr-only">{m.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 12 }, (_, i) => (
              <TableRow key={i}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-11 shrink-0 rounded-full" />
                    <div className="flex h-11 flex-col justify-center gap-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3.5 w-64 max-w-full" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="py-3"><Skeleton className="h-4 w-14" /></TableCell>
                <TableCell className="py-3"><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell className="py-3"><Skeleton className="h-[18px] w-8 rounded-full" /></TableCell>
                <TableCell className="py-3"><Skeleton className="size-11" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Loading>
  );
}

// -------------------------------------------------------------- Settings

const s = admin.settings;
const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function SettingsSkeleton() {
  return (
    <Loading>
      <PageHeader title={s.title} subtitle={s.subtitle}>
        <Button type="button" disabled>
          {s.save}
        </Button>
      </PageHeader>
      <p className="mb-4 min-h-6 text-sm" />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{s.hoursTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {WEEK.map((d) => (
                <li key={d} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
                  <div className="flex w-44 items-center gap-3">
                    <Switch disabled checked={false} aria-hidden tabIndex={-1} />
                    <span className="text-base leading-none font-medium">{s.days[d]}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">{s.from}</span>
                    <Skeleton className="h-11 w-32" />
                    <span className="text-sm text-muted-foreground">{s.to}</span>
                    <Skeleton className="h-11 w-32" />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{s.closedToday}</CardTitle>
            <CardDescription>{s.closedTodayHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border bg-background px-3">
              <span className="text-sm leading-none font-medium">{s.closedToday}</span>
              <Switch disabled checked={false} aria-hidden tabIndex={-1} />
            </div>
            <div className="space-y-2">
              <span className="text-sm leading-none font-medium">{s.closedNote}</span>
              <Skeleton className="h-11 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Loading>
  );
}
