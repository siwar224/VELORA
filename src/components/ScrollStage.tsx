"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import CanvasSequence, { glassScreenX, type CanvasSequenceHandle } from "@/components/CanvasSequence";
import { stage } from "@/content/site";
import { timeline as T } from "@/content/timeline";
import { FRAME_COUNT, frameSrc } from "@/lib/frames";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { startLenis } from "@/lib/lenis";

const LAST = FRAME_COUNT - 1; // last 0-based frame index
/** Timeline time of a 1-based frame number (1 unit of time = 1 frame). */
const at = (frame: number) => frame - 1;

/**
 * The pinned stage. One scrubbed GSAP timeline drives the frame index, the text
 * beats, the push-in and the cream wipe, so everything stays in sync both ways.
 * Timings come from src/content/timeline.ts.
 */
export default function ScrollStage() {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<CanvasSequenceHandle>(null);
  const debugRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;

    const stopLenis = startLenis();
    const ctx = gsap.context(() => {}, root);
    const debug = new URLSearchParams(window.location.search).has("debug") ? debugRef.current : null;
    if (debug) debug.hidden = false;
    let disposed = false;

    // Build after fonts load: SplitText measures line breaks, and the pin
    // positions depend on final layout.
    document.fonts.ready.then(() => {
      if (disposed) return;
      ctx.add(() => {
        const q = gsap.utils.selector(root);
        const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
        const total = LAST + T.pushIn.frames + T.wipe.frames;
        const fade = T.fadeFrames;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            // Whole timeline maps onto this much scroll; recomputed on resize.
            end: () => `+=${(window.innerHeight * (isMobile() ? T.scrollVh.mobile : T.scrollVh.desktop)) / 100}`,
            scrub: T.scrub,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // 1) Frame index: a plain number tweened linearly across the sequence.
        const seq = { frame: 0 };
        tl.to(seq, {
          frame: LAST,
          duration: LAST,
          onUpdate: () => canvasRef.current?.setFrame(Math.round(seq.frame)),
        }, 0);

        // 2) Text beats.
        const split = (id: string) =>
          SplitText.create(q(`[data-beat="${id}"] h1, [data-beat="${id}"] h2`), { type: "lines", mask: "lines" });

        const beatIn = (id: string, frame: number) => {
          const lines = split(id).lines;
          tl.fromTo(q(`[data-beat="${id}"]`), { autoAlpha: 0 }, { autoAlpha: 1, duration: fade / 3 }, at(frame));
          tl.from(lines, { yPercent: 110, duration: fade, stagger: fade / 6, ease: "power3.out" }, at(frame));
          tl.from(q(`[data-beat="${id}"] [data-reveal]`), {
            autoAlpha: 0, y: 24, duration: fade, stagger: fade / 6, ease: "power2.out",
          }, at(frame) + fade / 3);
        };
        const beatOut = (id: string, frame: number) => {
          tl.to(q(`[data-beat="${id}"]`), { autoAlpha: 0, y: -60, duration: fade, ease: "power1.in" }, at(frame));
        };

        beatOut("arrival", T.beats.arrival.out);
        beatIn("pour", T.beats.pour.in);
        beatOut("pour", T.beats.pour.out);
        beatIn("finish", T.beats.finish.in);

        // 3) Push-in on the glass after the last frame. Origin follows where the
        //    glass actually is on screen (right side on desktop, centre on phones).
        tl.to(media, {
          scale: T.pushIn.scale,
          transformOrigin: () => `${glassScreenX(window.innerWidth, window.innerHeight) * 100}% 50%`,
          duration: T.pushIn.frames,
          ease: "power1.inOut",
        }, LAST);

        // 4) Cream panel wipes up; the stage then unpins straight into Story (also cream).
        tl.fromTo(q("[data-wipe]"),
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: T.wipe.frames, ease: "power2.inOut" },
          LAST + T.pushIn.frames);

        // Pad to the exact total so scroll length maps 1:1 onto the config.
        tl.set({}, {}, total);

        if (debug) {
          tl.eventCallback("onUpdate", () => {
            const t = tl.time();
            const phase = t <= LAST ? "" : t <= LAST + T.pushIn.frames ? " · push-in" : " · wipe";
            debug.textContent = `frame ${Math.round(seq.frame) + 1}/${FRAME_COUNT}${phase}`;
          });
        }
      });
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      ctx.revert(); // kills the timeline, ScrollTrigger, pin spacer and SplitText
      stopLenis();
    };
  }, []);

  return (
    <section ref={rootRef} id="top" aria-labelledby="beat-arrival" className="relative h-svh overflow-hidden">
      {/* Media layer: scaled as one piece for the push-in. */}
      <div ref={mediaRef} className="absolute inset-0 will-change-transform" aria-hidden="true">
        {/* Poster: first frame as a real image, the LCP element, shown until the canvas draws. */}
        <Image src={frameSrc(1)} alt="" fill priority sizes="100vw" className="poster-focal" />
        <CanvasSequence ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      {/* Legibility: espresso fade from the left on desktop, from the bottom on mobile. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/50 to-espresso/0 md:bg-gradient-to-r md:from-espresso/90 md:via-espresso/55 md:via-35% md:to-espresso/0 md:to-60%"
      />

      <p className="sr-only">{stage.canvasDescription}</p>

      {stage.beats.map((beat, i) => {
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <article
            key={beat.id}
            data-beat={beat.id}
            // Beats after the first start hidden; the timeline reveals them.
            className={`absolute inset-0 flex items-end px-5 pb-[12svh] md:items-center md:px-10 md:pb-0 lg:px-20 ${i > 0 ? "invisible opacity-0" : ""}`}
          >
            <div className="max-w-xl md:max-w-[min(36rem,45vw)]">
              <p data-reveal className="eyebrow flex items-center gap-4 text-caramel">
                <span aria-hidden="true" className="h-px w-10 bg-caramel" />
                {beat.label}
              </p>
              <Heading
                id={`beat-${beat.id}`}
                className="mt-6 font-serif text-5xl leading-[0.95] font-light text-cream md:text-7xl lg:text-8xl"
              >
                {beat.heading}
              </Heading>
              <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-cream/85 md:text-lg">
                {beat.body}
              </p>
              {"cta" in beat && (
                <a
                  data-reveal
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

      {/* Colour wipe into the cream Story section. */}
      <div data-wipe aria-hidden="true" className="absolute inset-0 bg-cream [clip-path:inset(100%_0_0_0)]" />

      {/* Dev aid: add ?debug to the URL to see the live frame number. */}
      <output
        ref={debugRef}
        hidden
        className="absolute right-4 bottom-4 z-30 bg-black/70 px-2 py-1 font-mono text-xs text-white"
      />
    </section>
  );
}
