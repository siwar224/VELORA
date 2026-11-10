"use client";

import { useEffect, type RefObject } from "react";
import { gsap, MOTION_OK, ScrollTrigger, SplitText } from "@/lib/gsap";
import { afterHero, markIntroDone, onHeroActive, setHeroActive } from "@/lib/hero";
import { onPreloaderDone } from "@/lib/preload";
import { idleEffect } from "@/lib/idle";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** Breathing range. Starts at 1.02, not 1.00, so the ±12px mouse parallax never shows an edge. */
const BREATH = { from: 1.02, to: 1.055, halfCycle: 9 }; // 9 s each way ≈ 18 s per breath
/** Rest between the end of the intro and the first breath: keeps the load window calm. */
const BREATH_DELAY = 2.5;

type Props = {
  root: RefObject<HTMLElement | null>;
  /** Inner media layer (poster + canvas). The outer layer keeps the scroll push-in. */
  fx: RefObject<HTMLElement | null>;
  /** Wrapper around the text beats (the beats themselves are animated by the scroll timeline). */
  text: RefObject<HTMLElement | null>;
};

/**
 * The "living hero" motion, layered on top of the scroll timeline without
 * touching it (all transforms go on wrappers the timeline doesn't animate):
 * 1. Intro after the preloader: canvas 1.08 + blur 6px → sharp, h1 line reveal.
 * 2. Idle breathing: slow sine scale loop on the inner media layer.
 * 3. Mouse parallax (fine pointers only): media against the cursor, text with it.
 * Off for reduced motion. Everything pauses while the hero is off screen.
 * Renders nothing.
 */
export default function HeroMotion({ root, fx, text }: Props) {
  // Set up in its own idle task, not inside React's hydration task (keeps TBT low).
  useEffect(() => idleEffect(() => {
    const stage = root.current;
    const media = fx.current;
    const words = text.current;
    if (!stage || !media || !words) return;

    // One trigger spanning the whole pinned stage → shared "hero on screen" signal.
    // Created when the preloader hands over: nothing loops before that, and it keeps
    // the trigger's layout measurement out of the page-load window.
    let zone: ScrollTrigger | null = null;
    const offZone = onPreloaderDone(() => {
      zone = ScrollTrigger.create({
        trigger: stage,
        start: "top bottom",
        endTrigger: afterHero(),
        end: "top top",
        refreshPriority: -1,
        onToggle: (self) => setHeroActive(self.isActive),
      });
    });
    const offPaused = onHeroActive((active) => (stage.dataset.heroPaused = String(!active)));

    const mm = gsap.matchMedia(stage);
    mm.add({ motion: MOTION_OK, fine: FINE_POINTER }, (context) => {
      const { motion, fine } = context.conditions as { motion: boolean; fine: boolean };
      if (!motion) return;

      // ---- 1 + 2. Intro, then breathing.
      // Scale only while loading; the blur is added at the intro's first frame (still
      // behind the opaque preloader backdrop), so nothing blurs a full-screen layer
      // while the first frames are being drawn.
      gsap.set(media, { scale: 1.08 });
      let breathe: gsap.core.Tween | null = null;
      let heroActive = true;
      const offActive = onHeroActive((a) => {
        heroActive = a;
        if (breathe && a) breathe.resume();
        else if (breathe) breathe.pause();
      });

      const offDone = onPreloaderDone(() => {
        // SplitText measures line breaks: wait for the web fonts first.
        document.fonts.ready.then(() =>
          context.add(() => {
            const intro = gsap.timeline();
            intro.fromTo(media, { filter: "blur(6px)" }, { scale: BREATH.from, filter: "blur(0px)", duration: 1.4, ease: "power3.out", clearProps: "filter" }, 0);

            const h1 = stage.querySelector<HTMLElement>("#beat-arrival");
            if (h1) {
              // The h1 has been painted under the preloader all along (it is the LCP
              // element); it's only hidden for this reveal, then the split is undone.
              const split = SplitText.create(h1, { type: "lines", mask: "lines" });
              intro.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.1, ease: "power4.out", onComplete: () => split.revert() }, 0.25);
            }
            intro.from(stage.querySelectorAll('[data-beat="arrival"] [data-reveal]'), {
              autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.08, ease: "power2.out",
            }, 0.55);

            intro.add(() => {
              markIntroDone();
              breathe = gsap.fromTo(media, { scale: BREATH.from }, {
                scale: BREATH.to, duration: BREATH.halfCycle, ease: "sine.inOut", yoyo: true, repeat: -1, delay: BREATH_DELAY,
              });
              if (!heroActive) breathe.pause();
            }, 1.4);
          }),
        );
      });

      // ---- 3. Mouse parallax (fine pointers only), transforms only via quickTo.
      let offMove = () => {};
      if (fine) {
        const opts = { duration: 1.1, ease: "power3.out" };
        const mx = gsap.quickTo(media, "x", opts);
        const my = gsap.quickTo(media, "y", opts);
        const tx = gsap.quickTo(words, "x", opts);
        const ty = gsap.quickTo(words, "y", opts);
        const onMove = (e: PointerEvent) => {
          if (!heroActive || e.pointerType !== "mouse") return;
          const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 … 1
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          // Never more than the 2% overscan the breathing floor gives (minus 1px), max 12px.
          const ax = Math.min(12, window.innerWidth * 0.01 - 1);
          const ay = Math.min(12, window.innerHeight * 0.01 - 1);
          mx(-nx * ax);
          my(-ny * ay);
          tx(nx * 6);
          ty(ny * 6);
        };
        const reset = () => [mx, my, tx, ty].forEach((to) => to(0));
        // Listen only once the hero is revealed.
        const offListen = onPreloaderDone(() => {
          window.addEventListener("pointermove", onMove, { passive: true });
          document.documentElement.addEventListener("pointerleave", reset);
        });
        offMove = () => {
          offListen();
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", reset);
        };
      }

      return () => {
        offActive();
        offDone();
        offMove();
        breathe?.kill();
      };
    });

    return () => {
      mm.revert();
      offZone();
      zone?.kill();
      offPaused();
    };
  }), [root, fx, text]);

  return null;
}
