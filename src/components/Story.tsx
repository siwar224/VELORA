"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { story } from "@/content/site";
import { desktopFrames, frameSrc } from "@/lib/frames";
import { gsap, MOTION_OK, ScrollTrigger } from "@/lib/gsap";

/**
 * Our Story (dark). Left: sticky heading, intro and counters. Right: a macro
 * crop of the finished drink with a light parallax, then the four steps, each
 * lighting up as it crosses the middle of the screen.
 *
 * Without JS / with reduced motion: counters show their final value, no
 * parallax; steps still highlight (an opacity change, not motion).
 */
export default function Story() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);
    // These sit below the pinned stage: measure them after its pin spacer exists.
    const after = { refreshPriority: -1 };

    // Steps highlight in every mode.
    mm.add("all", () => {
      root.querySelectorAll<HTMLElement>("[data-step]").forEach((step) => {
        step.dataset.active = "false";
        ScrollTrigger.create({
          ...after,
          trigger: step,
          // Active while the step crosses the screen centre: exactly one at a time.
          start: "top center",
          end: "bottom center",
          onToggle: (self) => (step.dataset.active = String(self.isActive)),
        });
      });
    });

    mm.add(MOTION_OK, () => {
      // Counters: count up once when they come into view.
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const n = { v: 0 };
        el.textContent = "0";
        gsap.to(n, {
          v: target,
          duration: 1.8,
          ease: "power3.out",
          onUpdate: () => (el.textContent = String(Math.round(n.v))),
          scrollTrigger: { ...after, trigger: el, start: "top 88%", once: true },
        });
      });

      // Light parallax on the macro crop.
      gsap.fromTo("[data-parallax]", { yPercent: -7 }, {
        yPercent: 7,
        ease: "none",
        scrollTrigger: { ...after, trigger: "[data-parallax-frame]", start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="story"
      data-nav-theme="dark"
      aria-labelledby="story-heading"
      className="bg-espresso px-5 py-28 text-cream md:px-10 md:py-40 lg:px-20"
    >
      <div className="mx-auto grid max-w-[90rem] gap-16 md:grid-cols-[5fr_7fr] md:gap-20">
        {/* Left: sticky on desktop. */}
        <div className="self-start md:sticky md:top-32">
          <p className="eyebrow flex items-center gap-4 text-caramel">
            <span aria-hidden="true" className="h-px w-10 bg-caramel" />
            {story.label}
          </p>
          <h2 id="story-heading" data-reveal-heading className="mt-8 font-serif text-5xl leading-[1] font-light md:text-6xl lg:text-7xl">
            {story.heading}
          </h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-cream/75 md:text-lg">{story.intro}</p>

          <dl className="mt-14 grid grid-cols-3 border-t border-cream/15">
            {story.counters.map((c) => (
              <div key={c.label} className="border-r border-cream/15 px-4 pt-6 first:pl-0 last:border-r-0 md:px-6">
                <dt className="eyebrow text-cream/60">{c.label}</dt>
                <dd className="mt-3 font-serif text-4xl font-light text-cream tabular-nums md:text-5xl">
                  {/* Animated digits are hidden from screen readers; the sr-only text has the real value. */}
                  <span aria-hidden="true">
                    <span data-count={c.value}>{c.value}</span>
                    <span className="text-caramel">{c.suffix}</span>
                  </span>
                  <span className="sr-only">
                    {c.value}
                    {c.suffix}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: macro crop + steps. */}
        <div>
          <div data-parallax-frame className="relative aspect-[4/5] overflow-hidden bg-black/30 md:aspect-[5/4]">
            <div data-parallax className="absolute -inset-y-[10%] inset-x-0">
              <Image
                src={frameSrc(desktopFrames.count)}
                alt={story.imageAlt}
                fill
                sizes="(min-width: 768px) 120vw, 260vw"
                // Zoomed onto the condensation: the image is right-aligned, then scaled
                // around where the glass lands in the box (42% across on 4:5, 63% on 5:4).
                className="origin-[42%_62%] scale-[2.2] object-cover object-[100%_50%] md:origin-[63%_62%]"
              />
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent" />
          </div>

          <ol className="mt-16 border-t border-cream/15">
            {story.steps.map((step, i) => (
              <li
                key={step.title}
                data-step
                data-active="true"
                // Inactive steps are dimmed but every text stays above WCAG AA contrast.
                className="group relative grid grid-cols-[3.5rem_1fr] gap-x-4 border-b border-cream/15 py-10 md:grid-cols-[5rem_1fr] md:py-14"
              >
                {/* Caramel line that grows on the active step. */}
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-px w-full origin-left scale-x-0 bg-caramel transition-transform duration-700 ease-out group-data-[active=true]:scale-x-100 motion-reduce:transition-none"
                />
                <span className="pt-3 font-sans text-xs tracking-[0.2em] text-cream/60 tabular-nums transition-colors duration-500 group-data-[active=true]:text-caramel">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-4xl font-light text-cream/55 transition-colors duration-500 group-data-[active=true]:text-cream md:text-5xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-cream/60 transition-colors duration-500 group-data-[active=true]:text-cream/85 md:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
