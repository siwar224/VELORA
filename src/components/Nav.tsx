"use client";

import { useEffect, useRef } from "react";
import { brand, nav } from "@/content/site";
import { ScrollTrigger } from "@/lib/gsap";

export default function Nav() {
  const headerRef = useRef<HTMLElement>(null);

  // Transparent over the hero; a solid espresso bar once you scroll past
  // ~60% of the first screen, so it stays readable over the cream sections.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const st = ScrollTrigger.create({
      start: () => window.innerHeight * 0.6,
      end: "max",
      onToggle: (self) => (header.dataset.solid = String(self.isActive)),
    });
    return () => st.kill();
  }, []);

  return (
    <header
      ref={headerRef}
      data-solid="false"
      className="fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-500 data-[solid=true]:bg-espresso/85 data-[solid=true]:backdrop-blur-md"
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[90rem] items-center justify-between px-5 py-5 md:px-10 md:py-7"
      >
        <a href="#top" className="font-serif text-2xl tracking-[0.3em] text-cream">
          {brand.name}
          <span className="sr-only"> — home</span>
        </a>

        <div className="flex items-center gap-6 md:gap-10">
          <ul className="hidden items-center gap-8 md:flex">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="eyebrow text-cream/80 transition-colors hover:text-cream"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={nav.cta.href}
            className="eyebrow border border-cream/40 px-4 py-2.5 text-cream transition-colors hover:border-caramel hover:bg-caramel/15"
          >
            {nav.cta.label}
          </a>
        </div>
      </nav>
    </header>
  );
}
