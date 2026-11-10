"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { quote } from "@/content/site";
import { desktopFrames, frameSrc } from "@/lib/frames";
import { gsap, MOTION_OK } from "@/lib/gsap";

/** Full-bleed pull quote over the finished drink, with a slow parallax background. */
export default function Quote() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);
    mm.add(MOTION_OK, () => {
      gsap.fromTo("[data-parallax]", { yPercent: -10 }, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true, refreshPriority: -1 },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-nav-theme="dark"
      aria-label="From our head roaster"
      className="relative flex min-h-[85svh] items-center overflow-hidden px-5 py-28 md:px-10 lg:px-20"
    >
      {/* Oversized so the parallax never shows an edge. */}
      <div data-parallax aria-hidden="true" className="absolute -inset-y-[15%] inset-x-0">
        <Image src={frameSrc(desktopFrames.count)} alt="" fill sizes="100vw" className="object-cover object-[74%_50%]" />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-espresso/70" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/40 to-transparent" />

      <figure className="relative mx-auto w-full max-w-[90rem]">
        <span aria-hidden="true" className="block font-serif text-8xl leading-none text-caramel md:text-9xl">
          “
        </span>
        <blockquote>
          <p data-reveal-heading className="max-w-5xl font-serif text-4xl leading-[1.1] font-light text-cream md:text-6xl lg:text-7xl">
            {quote.text}
          </p>
        </blockquote>
        <figcaption className="mt-10 flex items-center gap-4">
          <span aria-hidden="true" className="h-px w-10 bg-caramel" />
          <span className="eyebrow text-cream">{quote.author}</span>
          <span className="text-sm text-cream/70">{quote.role}</span>
        </figcaption>
      </figure>
    </section>
  );
}
