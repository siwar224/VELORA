"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { admin } from "@/content/admin";
import { bestSellers, kpis, LOW_STOCK, lowStock, ordersByHour, revenueByDay } from "@/lib/data/stats";
import { useCatalog, useOrders } from "@/lib/data/store";
import PageHeader, { Segmented } from "./PageHeader";

const t = admin.overview;
const locale = admin.common.locale;
const eur = new Intl.NumberFormat(locale, { style: "currency", currency: admin.common.currency, maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat(locale, { style: "currency", currency: admin.common.currency });
const int = new Intl.NumberFormat(locale);
const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" });

const revenueConfig = { revenue: { label: t.revenueChart.series, color: "var(--chart-1)" } } satisfies ChartConfig;
const hourConfig = { orders: { label: t.hourChart.series, color: "var(--chart-2)" } } satisfies ChartConfig;

/** Hidden data table so chart values are available to screen readers. */
function ChartTable<T extends Record<string, string | number>>({ caption, rows, cols }: { caption: string; rows: T[]; cols: [keyof T, string][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{cols.map(([, label]) => <th key={label}>{label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{cols.map(([k]) => <td key={String(k)}>{r[k]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Overview() {
  const [days, setDays] = useState<7 | 30>(7);
  const orders = useOrders((s) => s.orders);
  const menu = useCatalog((s) => s.menu);

  const data = useMemo(
    () => ({
      kpis: kpis(orders, days),
      revenue: revenueByDay(orders, days, locale),
      hours: ordersByHour(orders, days),
      best: bestSellers(orders, menu, days),
      low: lowStock(menu),
    }),
    [orders, menu, days],
  );
  const maxBest = data.best[0]?.qty ?? 1;

  const fmt = (key: string, v: number) => (key === "revenue" ? eur.format(v) : key === "avgTicket" ? eur2.format(v) : int.format(v));

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        <Segmented
          label={t.range.label}
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: t.range.d7 },
            { value: 30, label: t.range.d30 },
          ]}
        />
      </PageHeader>

      {/* KPIs */}
      <section aria-label={t.title} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => {
          const up = (k.change ?? 0) >= 0;
          return (
            <Card key={k.key} className="gap-2">
              <CardHeader>
                <CardDescription className="eyebrow">{t.kpis[k.key]}</CardDescription>
                <CardTitle className="font-serif text-4xl font-normal tabular-nums">{fmt(k.key, k.value)}</CardTitle>
              </CardHeader>
              <CardContent>
                {k.change !== null && (
                  <p className={`flex items-center gap-1 text-sm ${up ? "text-caramel-deep" : "text-destructive"}`}>
                    {up ? <ArrowUpRight aria-hidden className="size-4" /> : <ArrowDownRight aria-hidden className="size-4" />}
                    <span className="font-medium tabular-nums">{pct.format(k.change)}</span>
                    <span className="text-muted-foreground">{t.kpis.vsPrev}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.revenueChart.title}</CardTitle>
            <CardDescription>{t.revenueChart.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="aspect-auto h-72 w-full">
              <LineChart data={data.revenue} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => eur.format(v)} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => eur.format(Number(v))} />} />
                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2.5} dot={days === 7} isAnimationActive={false} />
              </LineChart>
            </ChartContainer>
            <ChartTable caption={`${t.revenueChart.title}, ${t.revenueChart.subtitle}`} rows={data.revenue} cols={[["day", "Day"], ["revenue", t.revenueChart.series]]} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.hourChart.title}</CardTitle>
            <CardDescription>{t.hourChart.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={hourConfig} className="aspect-auto h-72 w-full">
              <BarChart data={data.hours} margin={{ left: 0, right: 4, top: 8 }} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} interval={1} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" fillOpacity={0.85} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
            <ChartTable caption={`${t.hourChart.title}, ${t.hourChart.subtitle}`} rows={data.hours} cols={[["hour", "Hour"], ["orders", t.hourChart.series]]} />
          </CardContent>
        </Card>
      </div>

      {/* Best sellers + low stock */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.bestSellers.title}</CardTitle>
            <CardDescription>{t.bestSellers.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.best.length === 0 ? (
              <p className="text-muted-foreground">{t.bestSellers.empty}</p>
            ) : (
              <ol className="space-y-4">
                {data.best.map((b, i) => (
                  <li key={b.id} className="flex items-center gap-4">
                    <span className="w-5 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {b.image && <Image src={encodeURI(b.image)} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium">{b.name}</span>
                        <span className="text-sm tabular-nums">{int.format(b.qty)}</span>
                      </div>
                      <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-caramel" style={{ width: `${(b.qty / maxBest) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.lowStock.title}</CardTitle>
            <CardDescription>{t.lowStock.subtitle.replace("10", String(LOW_STOCK))}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.low.length === 0 ? (
              <p className="text-muted-foreground">{t.lowStock.ok}</p>
            ) : (
              <ul className="divide-y">
                {data.low.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <AlertTriangle aria-hidden className="size-4 shrink-0 text-caramel-deep" />
                    <span className="flex-1 font-medium">{m.name}</span>
                    <Badge variant={m.stock <= 5 ? "destructive" : "secondary"} className="tabular-nums">
                      {m.stock} {t.lowStock.left}
                    </Badge>
                    <Link href={`/admin/menu?edit=${m.id}`} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-caramel-deep underline-offset-4 hover:underline">
                      {t.lowStock.restock}
                      <span className="sr-only"> {m.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
