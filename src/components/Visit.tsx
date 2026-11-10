"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { brand, visit } from "@/content/site";
import { openStatus, type OpenStatus } from "@/lib/hours";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "Open now · until 18:30" / "Closed · opens Mon 07:30", from the hours in site.ts (Paris time). */
function StatusBadge() {
  // Computed in the browser only: the server's clock and time zone would be wrong
  // (and cause a hydration mismatch). Refreshed every minute.
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setStatus(openStatus(visit.schedule, visit.timeZone));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const s = visit.status;
  const text = !status
    ? " "
    : status.open
      ? `${s.open} · ${s.until} ${status.closes}`
      : `${s.closed} · ${s.opens} ${status.opensDay === null ? "" : `${s.days[status.opensDay]} `}${status.opensAt}`;

  return (
    <p
      aria-live="polite"
      className={`inline-flex min-h-9 items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm transition-opacity ${status ? "opacity-100" : "opacity-0"} ${status?.open ? "border-emerald-400/40 text-emerald-200" : "border-cream/25 text-cream/85"}`}
    >
      <span aria-hidden="true" className="relative flex size-2">
        {status?.open && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />}
        <span className={`relative size-2 rounded-full ${status?.open ? "bg-emerald-400" : "bg-cream/50"}`} />
      </span>
      {text}
    </p>
  );
}

/** Frontend-only newsletter form: validates and confirms, sends nothing anywhere. */
function Newsletter() {
  const id = useId();
  const n = visit.newsletter;
  const [state, setState] = useState<"idle" | "error" | "success">("idle");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!EMAIL_RE.test(email)) return setState("error");
    // No backend by design: wire a provider (Buttondown, Mailchimp, a Vercel function…) here.
    setState("success");
    form.reset();
  };

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${id}-msg`}>
      <h3 className="font-serif text-3xl font-light">{n.title}</h3>
      <p className="mt-3 max-w-sm text-cream/75">{n.body}</p>
      <label htmlFor={`${id}-email`} className="eyebrow mt-8 block text-cream/70">
        {n.label}
      </label>
      <div className="mt-3 flex max-w-md border-b border-cream/30 focus-within:border-caramel">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={n.placeholder}
          aria-invalid={state === "error"}
          onChange={() => state !== "idle" && setState("idle")}
          className="min-w-0 flex-1 bg-transparent py-3 text-cream placeholder:text-cream/40 focus:outline-none"
        />
        <button type="submit" className="eyebrow shrink-0 px-2 py-3 text-cream transition-colors hover:text-caramel">
          {n.button} <span aria-hidden="true">→</span>
        </button>
      </div>
      <p id={`${id}-msg`} role="status" className={`mt-3 min-h-6 text-sm ${state === "error" ? "text-[#f0a37a]" : "text-cream/85"}`}>
        {state === "error" ? n.error : state === "success" ? n.success : ""}
      </p>
    </form>
  );
}

export default function Visit() {
  return (
    <footer
      id="visit"
      data-nav-theme="dark"
      aria-labelledby="visit-heading"
      className="relative overflow-hidden bg-espresso px-5 pt-28 text-cream md:px-10 md:pt-40 lg:px-20"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="eyebrow flex items-center gap-4 text-caramel">
          <span aria-hidden="true" className="h-px w-10 bg-caramel" />
          {visit.label}
        </p>

        <div className="mt-8 grid gap-16 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <h2 id="visit-heading" data-reveal-heading className="font-serif text-5xl font-light md:text-7xl">
              {visit.heading}
            </h2>
            <div className="mt-8">
              <StatusBadge />
            </div>
            <a
              href={visit.order.href}
              className="eyebrow mt-10 inline-flex items-center gap-3 bg-caramel px-7 py-4 text-espresso transition-colors hover:bg-cream"
            >
              {visit.order.label} <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="space-y-10">
            <address className="not-italic leading-relaxed text-cream/85">
              <p className="eyebrow mb-4 text-cream/60">Address</p>
              {visit.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
            <div>
              <p className="eyebrow mb-4 text-cream/60">Hours</p>
              <dl className="space-y-1 text-cream/85">
                {visit.hours.map((h) => (
                  <div key={h.days} className="flex justify-between gap-6 md:max-w-72">
                    <dt>{h.days}</dt>
                    <dd className="tabular-nums">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <p className="eyebrow mb-4 text-cream/60">Contact</p>
              <a href={visit.contact.href} className="border-b border-caramel pb-1 transition-colors hover:text-caramel">
                {visit.contact.label}
              </a>
            </div>
          </div>

          <Newsletter />
        </div>

        <div className="mt-24 flex flex-col justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} {brand.name} · {brand.tagline} · {brand.signature}
          </p>
          <p>{visit.smallPrint}</p>
        </div>
      </div>

      {/* Huge wordmark, cropped by the bottom edge of the page. */}
      <p
        aria-hidden="true"
        className="pointer-events-none mt-10 -mb-[0.2em] text-center font-serif text-[30vw] leading-[0.8] font-light tracking-[0.06em] whitespace-nowrap select-none"
      >
        <span className="bg-gradient-to-b from-cream/25 to-cream/0 bg-clip-text text-transparent">{brand.name}</span>
      </p>
    </footer>
  );
}
