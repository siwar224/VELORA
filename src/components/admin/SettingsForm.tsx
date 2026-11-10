"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { admin } from "@/content/admin";
import { saveSettings, shopToday } from "@/lib/data/api";
import { useCatalog } from "@/lib/data/store";
import type { Settings } from "@/lib/data/types";
import PageHeader from "./PageHeader";

const t = admin.settings;
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

/** Opening hours per weekday + "closed today". Saving updates the website's "Open now" badge. */
export default function SettingsForm() {
  const stored = useCatalog((s) => s.settings);
  const [draft, setDraft] = useState<Settings>(stored);
  const [status, setStatus] = useState("");

  const today = shopToday();
  const closedToday = draft.closedToday.on && draft.closedToday.date === today;
  const invalid = WEEK.filter((d) => draft.schedule[d].open && draft.schedule[d].to <= draft.schedule[d].from);

  const setDay = (d: number, patch: Partial<Settings["schedule"][number]>) => {
    setStatus("");
    setDraft((s) => ({ ...s, schedule: { ...s.schedule, [d]: { ...s.schedule[d], ...patch } } }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid.length) return;
    await saveSettings({ ...draft, closedToday: { ...draft.closedToday, date: draft.closedToday.on ? today : draft.closedToday.date } });
    setStatus(t.saved);
  };

  return (
    <form onSubmit={save} noValidate>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        <Button type="submit" disabled={invalid.length > 0}>
          {t.save}
        </Button>
      </PageHeader>
      <p role="status" className="mb-4 min-h-6 text-sm font-medium text-caramel-deep">{status}</p>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.hoursTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {WEEK.map((d) => {
                const h = draft.schedule[d];
                const bad = invalid.includes(d);
                const id = `day-${d}`;
                return (
                  <li key={d} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
                    <div className="flex w-44 items-center gap-3">
                      <Switch id={`${id}-open`} checked={h.open} onCheckedChange={(open) => setDay(d, { open })} />
                      <Label htmlFor={`${id}-open`} className="text-base">
                        {t.days[d]}
                        <span className="sr-only">: {h.open ? t.open : t.closed}</span>
                      </Label>
                    </div>
                    {h.open ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Label htmlFor={`${id}-from`} className="text-sm text-muted-foreground">{t.from}</Label>
                        <Input id={`${id}-from`} type="time" value={h.from} onChange={(e) => setDay(d, { from: e.target.value })} className="h-11 w-32" aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined} />
                        <Label htmlFor={`${id}-to`} className="text-sm text-muted-foreground">{t.to}</Label>
                        <Input id={`${id}-to`} type="time" value={h.to} onChange={(e) => setDay(d, { to: e.target.value })} className="h-11 w-32" aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined} />
                        {bad && <p id={`${id}-err`} className="w-full text-sm text-destructive">{t.errors.order}</p>}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t.closed}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-normal">{t.closedToday}</CardTitle>
            <CardDescription>{t.closedTodayHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border bg-background px-3">
              <Label htmlFor="closed-today">{t.closedToday}</Label>
              <Switch
                id="closed-today"
                checked={closedToday}
                onCheckedChange={(on) => {
                  setStatus("");
                  setDraft((s) => ({ ...s, closedToday: { ...s.closedToday, on, date: today } }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closed-note">{t.closedNote}</Label>
              <Input
                id="closed-note"
                className="h-11"
                value={draft.closedToday.note}
                maxLength={80}
                onChange={(e) => setDraft((s) => ({ ...s, closedToday: { ...s.closedToday, note: e.target.value } }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
