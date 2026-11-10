import Image from "next/image";
import { stage } from "@/content/site";
import { frameSrc } from "@/lib/frames";

/**
 * The pinned, scroll-scrubbed stage.
 *
 * Step (a): static only. A sticky first-frame poster (also the LCP element) with
 * the three beats stacked over it. Step (b) layers CanvasSequence on top of the
 * poster; step (c) moves the beats onto one GSAP timeline.
 */
export default function ScrollStage() {
  return (
    <section id="top" aria-labelledby="beat-arrival" className="relative">
      {/* Sticky backdrop: stays in view while the beats scroll over it. */}
      <div className="sticky top-0 h-svh overflow-hidden" aria-hidden="true">
        {/* next/image `fill` needs a relative/absolute parent, not a sticky one. */}
        <div className="absolute inset-0">
        <Image
          src={frameSrc(1)}
          alt=""
          fill
          priority
          sizes="100vw"
          // Same focal point the canvas will use: keep the glass (~74% across) in frame.
          className="object-cover object-[74%_50%]"
        />
        </div>
        {/* Legibility: espresso fade from the left on desktop, from the bottom on mobile. */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/50 to-espresso/0 md:bg-gradient-to-r md:from-espresso/90 md:via-espresso/55 md:via-35% md:to-espresso/0 md:to-60%" />
      </div>

      <p className="sr-only">{stage.canvasDescription}</p>

      {/* Pull the beats up over the sticky backdrop. */}
      <div className="relative -mt-[100svh]">
        {stage.beats.map((beat, i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <article
              key={beat.id}
              className="flex h-svh items-end px-5 pb-[12svh] md:items-center md:px-10 md:pb-0 lg:px-20"
            >
              <div className="max-w-xl md:max-w-[min(36rem,45vw)]">
                <p className="eyebrow flex items-center gap-4 text-caramel">
                  <span aria-hidden="true" className="h-px w-10 bg-caramel" />
                  {beat.label}
                </p>
                <Heading
                  id={`beat-${beat.id}`}
                  className="mt-6 font-serif text-5xl leading-[0.95] font-light text-cream md:text-7xl lg:text-8xl"
                >
                  {beat.heading}
                </Heading>
                <p className="mt-6 max-w-md text-base leading-relaxed text-cream/85 md:text-lg">
                  {beat.body}
                </p>
                {"cta" in beat && (
                  <a
                    href={beat.cta.href}
                    className="eyebrow mt-10 inline-flex items-center gap-3 border-b border-caramel pb-2 text-cream transition-colors hover:text-caramel"
                  >
                    {beat.cta.label}
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
