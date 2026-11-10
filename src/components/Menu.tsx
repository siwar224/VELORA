"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { menu } from "@/content/site";
import { frameSrc } from "@/lib/frames";

/** Devices that get the side preview on hover; everything else taps to expand. */
const HOVER_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 768px)";
/** Every frame used by the menu, so the preview can cross-fade between preloaded images. */
const PREVIEW_FRAMES = [...new Set(menu.tabs.flatMap((t) => t.items.map((i) => i.frame)))];

/**
 * Crops zoomed onto the glass: right-align the frame, then scale around where
 * the glass lands in that box (42% across in the 4:5 preview, 71% in the 16:10 row).
 */
const previewImage = "origin-[42%_50%] scale-[1.6] object-cover object-[100%_50%]";
const rowImage = "origin-[71%_50%] scale-[1.5] object-cover object-[100%_50%]";

/**
 * The menu, styled as a printed card on cream (the only light section).
 * Tabs follow the WAI-ARIA tabs pattern (arrow keys, Home/End). With a mouse,
 * hovering a row shows a large preview beside the list; on touch, tapping a row
 * expands it with its picture.
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

        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-16">
          {/* Rows */}
          <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${menu.tabs[tab].id}`} tabIndex={0}>
            {!hoverMode && <p className="eyebrow mb-6 text-espresso/70 md:hidden">{menu.tapHint}</p>}
            <ul className="divide-y divide-espresso/10 border-y border-espresso/10">
              {items.map((item, i) => {
                const isOpen = !hoverMode && open === i;
                const row = (
                  <>
                    <span className="flex items-baseline gap-3">
                      <span className={`font-serif text-2xl transition-colors md:text-[2rem] ${hoverMode && active === i ? "text-caramel-deep" : ""}`}>
                        {item.name}
                      </span>
                      {/* Dotted leader */}
                      <span aria-hidden="true" className="min-w-6 flex-1 -translate-y-1.5 border-b-2 border-dotted border-espresso/25" />
                      <span className="font-sans text-base font-medium tabular-nums">{item.price}</span>
                    </span>
                    <span className="mt-1.5 block font-serif text-lg text-espresso/75 italic">{item.note}</span>
                  </>
                );

                return (
                  <li key={item.name} className="py-6" onMouseEnter={hoverMode ? () => setActive(i) : undefined}>
                    {hoverMode ? (
                      <div>{row}</div>
                    ) : (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="block w-full text-left"
                      >
                        {row}
                      </button>
                    )}
                    {/* Touch: tapped row expands with its picture. */}
                    {!hoverMode && (
                      <div className={`grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                        <div className="overflow-hidden">
                          <div className="relative mt-5 aspect-[16/10] overflow-hidden bg-espresso">
                            {isOpen && <Image src={frameSrc(item.frame)} alt="" fill sizes="150vw" className={rowImage} />}
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

          {/* Hover mode: large sticky preview, cross-fading between the menu's frames. */}
          {hoverMode && (
            <figure aria-hidden="true" className="self-start md:sticky md:top-28">
              <div className="relative aspect-[4/5] overflow-hidden bg-espresso">
                {PREVIEW_FRAMES.map((f) => (
                  <Image
                    key={f}
                    src={frameSrc(f)}
                    alt=""
                    fill
                    sizes="38rem" // ~1.7x the 22rem panel: the image is scaled up to crop
                    className={`${previewImage} transition-opacity duration-500 ${f === current.frame ? "opacity-100" : "opacity-0"}`}
                  />
                ))}
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between">
                <span className="font-serif text-2xl">{current.name}</span>
                <span className="font-sans text-sm tabular-nums text-espresso/70">{current.price}</span>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
