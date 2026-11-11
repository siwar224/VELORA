"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { orderAhead as t, visit } from "@/content/site";
import { createOrder } from "@/lib/data/api";
import { effectiveSchedule } from "@/lib/data/schedule";
import { useLiveCatalog } from "@/lib/data/live";
import { openStatus, zonedNow } from "@/lib/hours";

const SLOT = 15; // minutes between pickup slots
const LEAD = 10; // minimum minutes from now to the first slot

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const price = (p: number) => (Number.isInteger(p) ? `€${p}` : `€${p.toFixed(2)}`);

/**
 * The order form inside the "Order ahead" dialog: drink, quantity, name and a
 * pickup slot (15-minute steps, at least 10 minutes away, before closing, in
 * Paris time). Creates the order through lib/data/api, so it appears live on
 * the admin's Orders board. Demo: no payment.
 */
export default function OrderForm({ onClose }: { onClose: () => void }) {
  const uid = useId();
  const { menu, settings } = useLiveCatalog();
  const drinks = useMemo(() => menu.filter((m) => m.available && m.category !== "beans"), [menu]);

  // Pickup slots for today, or when ordering reopens.
  const { slots, closedText } = useMemo(() => {
    const schedule = effectiveSchedule(settings);
    const now = new Date();
    const { day, minutes } = zonedNow(now, visit.timeZone);
    const today = schedule[day];
    const list: { label: string; at: number }[] = [];
    if (today) {
      const first = Math.max(toMin(today[0]), Math.ceil((minutes + LEAD) / SLOT) * SLOT);
      for (let m = first; m <= toMin(today[1]) - SLOT; m += SLOT) list.push({ label: hhmm(m), at: now.getTime() + (m - minutes) * 60_000 });
    }
    if (list.length) return { slots: list, closedText: "" };
    const next = openStatus(schedule, visit.timeZone, now);
    if (next.open || !next.opensAt) return { slots: list, closedText: t.closedAllWeek };
    const when = next.opensDay === null ? t.today(next.opensAt) : t.onDay(visit.status.daysLong[next.opensDay], next.opensAt);
    return { slots: list, closedText: t.closedNow(when) };
  }, [settings]);

  const [itemId, setItemId] = useState(drinks[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [slot, setSlot] = useState(0);
  const [errors, setErrors] = useState<{ name?: string; drink?: string }>({});
  const [done, setDone] = useState<{ number: number; time: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim() || name.trim().length > 30) errs.name = t.errors.name;
    if (!drinks.some((d) => d.id === itemId)) errs.drink = t.errors.drink;
    setErrors(errs);
    if (Object.keys(errs).length || !slots[slot]) return;
    setBusy(true);
    const order = await createOrder({ lines: [{ itemId, qty }], customer: name.trim(), pickupAt: slots[slot].at, source: "online" });
    setBusy(false);
    setDone({ number: order.number, time: slots[slot].label });
  };

  if (done) {
    return (
      <div role="status" className="mt-6">
        <p className="eyebrow text-caramel-deep">{t.successTitle}</p>
        <p className="mt-3 font-serif text-2xl">{t.success(done.number, done.time)}</p>
        <p className="mt-4 text-sm text-espresso/75">{t.demoNote}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={() => setDone(null)} className="eyebrow min-h-11 border border-espresso/30 px-5 hover:border-caramel-deep">
            {t.another}
          </button>
          <button type="button" onClick={onClose} className="eyebrow min-h-11 bg-espresso px-6 text-cream hover:bg-caramel-deep">
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  if (closedText) {
    return <p className="mt-6 text-lg text-espresso/80">{closedText}</p>;
  }

  const field = "mt-2 block min-h-11 w-full border border-espresso/25 bg-white px-3 text-base text-espresso";
  const selected = drinks.find((d) => d.id === itemId);

  return (
    <form onSubmit={submit} noValidate className="mt-2">
      <p className="text-espresso/75">{t.intro}</p>

      <label htmlFor={`${uid}-drink`} className="eyebrow mt-6 block text-espresso/75">
        {t.drink}
      </label>
      <select
        id={`${uid}-drink`}
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        className={field}
        aria-invalid={!!errors.drink}
        aria-describedby={errors.drink ? `${uid}-drink-err` : undefined}
      >
        {drinks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {price(d.price)}
          </option>
        ))}
      </select>
      {errors.drink && <p id={`${uid}-drink-err`} className="mt-1 text-sm text-[#a3341f]">{errors.drink}</p>}

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <span id={`${uid}-qty-label`} className="eyebrow block text-espresso/75">
            {t.quantity}
          </span>
          <div role="group" aria-labelledby={`${uid}-qty-label`} className="mt-2 flex items-center border border-espresso/25 bg-white">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={t.decrease} className="size-11 text-xl disabled:opacity-40">
              −
            </button>
            <output aria-live="polite" className="flex-1 text-center tabular-nums">{qty}</output>
            <button type="button" onClick={() => setQty((q) => Math.min(4, q + 1))} disabled={qty >= 4} aria-label={t.increase} className="size-11 text-xl disabled:opacity-40">
              +
            </button>
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-slot`} className="eyebrow block text-espresso/75">
            {t.pickup}
          </label>
          <select id={`${uid}-slot`} value={slot} onChange={(e) => setSlot(Number(e.target.value))} className={field}>
            {slots.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor={`${uid}-name`} className="eyebrow mt-5 block text-espresso/75">
        {t.name}
      </label>
      <input
        id={`${uid}-name`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.namePlaceholder}
        autoComplete="given-name"
        maxLength={30}
        className={field}
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? `${uid}-name-err` : undefined}
      />
      {errors.name && <p id={`${uid}-name-err`} className="mt-1 text-sm text-[#a3341f]">{errors.name}</p>}

      <p className="mt-5 text-sm text-espresso/75">{t.demoNote}</p>

      <button type="submit" disabled={busy} className="eyebrow mt-6 flex min-h-12 w-full items-center justify-between bg-espresso px-6 text-cream transition-colors hover:bg-caramel-deep disabled:opacity-60">
        <span>{t.submit}</span>
        <span className="tabular-nums">{selected ? price(Math.round(selected.price * qty * 100) / 100) : ""}</span>
      </button>
    </form>
  );
}
