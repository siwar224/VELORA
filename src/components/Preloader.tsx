"use client";

import { useEffect, useRef } from "react";
import { brand } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { markPreloaderDone, onFrameProgress } from "@/lib/preload";

/** Reveal once this share of frames is decoded… */
const THRESHOLD = 0.3;
/** …or after this long at most, so a slow connection is never stuck behind it. */
const MAX_WAIT_MS = 4000;

/**
 * Minimal preloader: wordmark + a thin caramel progress line. Purely visual
 * (aria-hidden); the page underneath is already rendered and accessible.
 * Rendered at page level (not inside the pinned stage) so it always sits above
 * the nav. Progress arrives from CanvasSequence via lib/preload.ts.
 *
 * Exit: the wordmark glides into the nav logo's exact position (FLIP) while the
 * backdrop fades, then hands over to the real logo. That moment is broadcast
 * (markPreloaderDone) so HeroLife can play the hero intro in step with it.
 * Hidden without JS (noscript style) and for reduced motion (no frames load).
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLParagraphElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markPreloaderDone();
      return;
    }

    let finished = false;
    let exit: gsap.core.Timeline | null = null;
    const hide = () => (root.dataset.done = "true");

    const finish = () => {
      if (finished) return;
      finished = true;
      const word = wordRef.current;
      const logo = document.querySelector<HTMLElement>("[data-logo]");
      const to = logo?.getBoundingClientRect();
      markPreloaderDone();

      // No visible logo to land on (e.g. nav scrolled away): just fade out.
      if (!word || !logo || !to || to.height === 0 || to.bottom < 0) {
        exit = gsap.timeline({ onComplete: hide }).to(root, { opacity: 0, duration: 0.6, ease: "power2.out" });
        return;
      }

      // FLIP: same typography as the logo, scaled by font-size ratio, aligned
      // on the left edge and the vertical centre.
      const from = word.getBoundingClientRect();
      const scale = parseFloat(getComputedStyle(logo).fontSize) / parseFloat(getComputedStyle(word).fontSize);
      const x = to.left - from.left;
      const y = to.top + to.height / 2 - (from.top + from.height / 2);
      logo.style.visibility = "hidden";

      exit = gsap
        .timeline({
          onComplete: () => {
            logo.style.visibility = "";
            hide();
          },
        })
        .to(trackRef.current, { opacity: 0, duration: 0.3, ease: "power1.out" }, 0)
        .to(bgRef.current, { opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0.1)
        .to(word, { x, y, scale, transformOrigin: "0% 50%", duration: 1.05, ease: "power3.inOut" }, 0);
    };

    const unsubscribe = onFrameProgress((loaded, total) => {
      const p = Math.min(1, loaded / (total * THRESHOLD));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (p >= 1) finish();
    });
    const id = window.setTimeout(finish, MAX_WAIT_MS);
    return () => {
      unsubscribe();
      window.clearTimeout(id);
      exit?.kill();
      const logo = document.querySelector<HTMLElement>("[data-logo]");
      if (logo) logo.style.visibility = "";
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-done="false"
      className="preloader pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 data-[done=true]:invisible motion-reduce:hidden"
    >
      <noscript>
        <style>{".preloader{display:none}"}</style>
      </noscript>
      {/* Backdrop on its own layer so it can fade while the wordmark stays opaque. */}
      <div ref={bgRef} className="pointer-events-auto absolute inset-0 bg-espresso" />
      {/* Same tracking as the nav logo so the glide lands glyph-for-glyph. */}
      <p ref={wordRef} className="relative font-serif text-3xl tracking-[0.3em] text-cream will-change-transform">
        {brand.name}
        <span className="-ml-[0.2em] text-caramel">.</span>
      </p>
      <div ref={trackRef} className="relative h-px w-40 overflow-hidden bg-cream/15">
        <div
          ref={barRef}
          className="h-full origin-left bg-caramel transition-transform duration-300"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
