"use client";

import { useEffect, useRef } from "react";
import { brand, nav } from "@/content/site";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Fixed nav with two looks (styles in globals.css, `.site-nav`):
 * - Over the frame sequence: no bar at all, just a faint top scrim so the
 *   links stay legible without hiding the animation.
 * - From the cream wipe onward: frosted espresso glass. ScrollStage switches
 *   this by setting <html data-nav="solid">, exactly when the wipe starts.
 * In glass mode the bar slides away while you scroll down and comes back as
 * soon as you scroll up (or tab into it).
 */
export default function Nav() {
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const triggers = [
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const solid = document.documentElement.dataset.nav === "solid";
          header.dataset.hidden = String(solid && self.direction === 1);
          // Whole-page reading progress, drawn as a caramel hairline under the nav.
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
        },
      }),
      // Glass tint follows the section under the bar: cream glass over light
      // sections, espresso glass over dark ones (sections opt in with data-nav-theme).
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-nav-theme]")).map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 40px",
          end: "bottom 40px",
          refreshPriority: -1, // measure after the stage's pin spacer exists
          onToggle: (self) => {
            if (self.isActive) header.dataset.theme = el.dataset.navTheme;
          },
        }),
      ),
    ];
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <header
      ref={headerRef}
      data-hidden="false"
      data-theme="dark"
      className="site-nav fixed inset-x-0 top-0 z-40 text-(--nav-fg)"
    >
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-caramel"
        style={{ transform: "scaleX(0)" }}
      />
      <nav
        aria-label="Main"
        className="relative mx-auto flex max-w-[90rem] items-center justify-between px-5 py-5 md:px-10 md:py-6"
      >
        <a href="#top" className="font-serif text-2xl tracking-[0.3em]">
          {brand.name}
          {/* Signature caramel dot after the wordmark. */}
          <span aria-hidden="true" className="-ml-[0.2em] text-caramel">
            .
          </span>
          <span className="sr-only"> — home</span>
        </a>

        <div className="flex items-center gap-6 md:gap-10">
          <ul className="hidden items-center gap-8 md:flex">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="eyebrow opacity-80 transition-opacity hover:opacity-100">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={nav.cta.href}
            className="eyebrow border border-current/40 px-4 py-2.5 transition-colors hover:border-caramel hover:bg-caramel/15"
          >
            {nav.cta.label}
          </a>
        </div>
      </nav>
    </header>
  );
}
