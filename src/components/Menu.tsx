"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { menu, type MenuItem } from "@/content/site";

/** Devices that get the large side preview; everything else taps a row to expand it. */
const HOVER_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 768px)";

/** Photo paths contain spaces ("Velvet Iced Latte.png"): encode them for the image optimiser. */
const src = (item: MenuItem) => encodeURI(item.image);
const focus = (item: MenuItem) => item.focus ?? "50% 45%";

/**
 * `sizes` for a photo shown with object-fit: cover in a box of `boxAspect` (w/h)
 * that is `px` wide. When the photo is relatively wider than its box, cover-fit
 * scales it up by imageAspect / boxAspect, so request that much wider a file.
 */
const coverSizes = (item: MenuItem, boxAspect: number, ...px: [query: string, width: number][]) => {
  const k = Math.max(1, (item.aspect ?? 1) / boxAspect);
  return px.map(([q, w]) => `${q ? q + " " : ""}${Math.ceil(w * k)}px`).join(", ");
};

function Tag({ tag }: { tag?: MenuItem["tag"] }) {
  if (!tag) return null;
  return (
    <span className="eyebrow shrink-0 rounded-full border border-caramel-deep/40 px-2 py-0.5 text-[0.58rem] text-caramel-deep">
      {tag}
    </span>
  );
}

function Notes({ item, className = "" }: { item: MenuItem; className?: string }) {
  return (
    <ul aria-label={menu.notesLabel} className={`flex flex-wrap gap-1.5 ${className}`}>
      {item.notes.map((n) => (
        <li key={n} className="rounded-full bg-espresso/[0.06] px-2.5 py-1 text-xs text-espresso/80">
          {n}
        </li>
      ))}
    </ul>
  );
}

/**
 * The menu: a printed card on cream (the only light section), now showing the
 * real product photos from /public/menu.
 * - Tabs (Cold / Espresso / Beans) follow the WAI-ARIA tabs pattern.
 * - Every row has a round thumbnail, name, signature/seasonal tag, dotted leader,
 *   price, recipe line and tasting notes.
 * - Mouse devices: hovering or focusing a row shows the product large in a
 *   sticky preview (cross-fade + slow settle), with its tasting notes as tags.
 * - Touch: tapping a row expands it with the full photo.
 * Photos go through next/image (AVIF/WebP at the displayed size), never the 2 MB PNGs.
 */
export default function Menu() {
  const uid = useId();
  const [tab, setTab] = useState(0);
  const [active, setActive] = useState(0); // previewed row (hover mode)
  const [open, setOpen] = useState<number | null>(null); // expanded row (touch mode)
  const [hoverMode, setHoverMode] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_QUERY);
    const update = () => setHoverMode(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const selectTab = (i: number) => {
    setTab(i);
    setActive(0);
    setOpen(null);
  };

  const onTabKey = (e: KeyboardEvent) => {
    const n = menu.tabs.length;
    const next = { ArrowRight: (tab + 1) % n, ArrowLeft: (tab - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  const items = menu.tabs[tab].items;
  const current = items[active] ?? items[0];
  const previewId = `${uid}-preview`;

  return (
    <section
      id="menu"
      data-nav-theme="light"
      aria-labelledby="menu-heading"
      className="bg-cream px-4 py-24 text-espresso md:px-10 md:py-36 lg:px-20"
    >
      {/* The "paper" card. */}
      <div className="mx-auto max-w-6xl bg-milk px-5 py-14 shadow-[0_40px_90px_-50px_rgb(30_18_11/0.45)] ring-1 ring-espresso/10 md:px-14 md:py-20">
        <header className="text-center">
          <p className="eyebrow text-caramel-deep">{menu.label}</p>
          <h2 id="menu-heading" data-reveal-heading className="mt-5 font-serif text-5xl font-light md:text-7xl">
            {menu.heading}
          </h2>
          <div aria-hidden="true" className="mx-auto mt-8 flex max-w-xs items-center gap-3 text-caramel-deep">
            <span className="h-px flex-1 bg-current" />
            <span className="size-1.5 rotate-45 bg-current" />
            <span className="h-px flex-1 bg-current" />
          </div>
        </header>

        {/* Tabs */}
        <div role="tablist" aria-label="Menu sections" className="mt-12 flex justify-center gap-2 md:gap-6" onKeyDown={onTabKey}>
          {menu.tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-controls={`${uid}-panel`}
              aria-selected={tab === i}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => selectTab(i)}
              className="eyebrow border-b-2 border-transparent px-3 py-3 text-espresso/70 transition-colors hover:text-espresso aria-selected:border-caramel-deep aria-selected:text-espresso"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-14 lg:grid-cols-[1fr_26rem]">
          {/* Rows */}
          <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${menu.tabs[tab].id}`}>
            {!hoverMode && <p className="eyebrow mb-6 text-espresso/70 md:hidden">{menu.tapHint}</p>}
            <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
              {items.map((item, i) => {
                const isActive = hoverMode && active === i;
                const isOpen = !hoverMode && open === i;
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      // Mouse devices: hover/focus/click previews the product. Touch: tap expands the row.
                      onMouseEnter={hoverMode ? () => setActive(i) : undefined}
                      onFocus={hoverMode ? () => setActive(i) : undefined}
                      onClick={() => (hoverMode ? setActive(i) : setOpen(isOpen ? null : i))}
                      aria-expanded={hoverMode ? undefined : isOpen}
                      aria-controls={hoverMode ? previewId : undefined}
                      aria-current={isActive ? "true" : undefined}
                      className="group flex w-full items-center gap-4 py-5 text-left md:gap-5"
                    >
                      {/* Round product thumbnail. */}
                      <span
                        className={`relative size-14 shrink-0 overflow-hidden rounded-full bg-espresso ring-2 ring-offset-2 ring-offset-milk transition-[box-shadow] duration-300 md:size-16 ${isActive ? "ring-caramel-deep" : "ring-transparent"}`}
                      >
                        <Image
                          src={src(item)}
                          alt=""
                          fill
                          sizes={coverSizes(item, 1, ["", 64])}
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none"
                          style={{ objectPosition: focus(item) }}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-3">
                          <span className={`font-serif text-2xl transition-colors md:text-[1.85rem] ${isActive ? "text-caramel-deep" : ""}`}>
                            {item.name}
                          </span>
                          <span className="hidden md:contents">
                            <Tag tag={item.tag} />
                          </span>
                          {/* Dotted leader */}
                          <span aria-hidden="true" className="min-w-6 flex-1 -translate-y-1.5 border-b-2 border-dotted border-espresso/25" />
                          <span className="font-sans text-base font-medium tabular-nums">{item.price}</span>
                        </span>
                        {/* Phones: the tag sits under the name so long names keep one line. */}
                        {item.tag && (
                          <span className="mt-1.5 block md:hidden">
                            <Tag tag={item.tag} />
                          </span>
                        )}
                        <span className="mt-1 block font-serif text-lg text-espresso/75 italic">{item.detail}</span>
                        <span className="eyebrow mt-1.5 block text-[0.62rem] text-caramel-deep">
                          <span className="sr-only">{menu.notesLabel}: </span>
                          {item.notes.join(" · ")}
                        </span>
                      </span>
                    </button>

                    {/* Touch: tapped row expands with the full product photo. */}
                    {!hoverMode && (
                      <div className={`grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          <div className="relative mb-6 aspect-[4/3] overflow-hidden bg-espresso">
                            {isOpen && (
                              <Image
                                src={src(item)}
                                alt={item.alt}
                                fill
                                sizes={coverSizes(item, 4 / 3, ["(min-width: 768px)", 700], ["", 480])}
                                className="object-cover"
                                style={{ objectPosition: focus(item) }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-8 text-center font-serif text-base text-espresso/75 italic">{menu.footnote}</p>
          </div>

          {/* Mouse devices: large sticky product preview. */}
          {hoverMode && (
            <figure id={previewId} className="self-start md:sticky md:top-28">
              <div className="relative aspect-[4/5] overflow-hidden bg-espresso shadow-[0_30px_60px_-35px_rgb(30_18_11/0.6)]">
                {items.map((item, i) => (
                  <Image
                    key={item.name}
                    src={src(item)}
                    alt={i === active ? item.alt : ""}
                    aria-hidden={i === active ? undefined : true}
                    fill
                    sizes={coverSizes(item, 4 / 5, ["(min-width: 1024px)", 416], ["", 352])}
                    // Cross-fade plus a slow settle from 1.06 for the incoming photo.
                    className={`object-cover transition-[opacity,transform] duration-[700ms,1400ms] ease-out motion-reduce:transition-none ${i === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"}`}
                    style={{ objectPosition: focus(item) }}
                  />
                ))}
              </div>
              <figcaption aria-hidden="true" className="mt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-baseline gap-3">
                    <span className="font-serif text-3xl">{current.name}</span>
                    <Tag tag={current.tag} />
                  </span>
                  <span className="font-sans text-base font-medium tabular-nums">{current.price}</span>
                </div>
                <p className="mt-1 font-serif text-lg text-espresso/75 italic">{current.detail}</p>
                <Notes item={current} className="mt-4" />
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
