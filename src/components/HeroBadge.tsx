"use client";

import { useEffect, useRef, type RefObject } from "react";
import { glassScreenEdges } from "@/components/CanvasSequence";
import { stage as copy } from "@/content/site";
import { timeline as T } from "@/content/timeline";
import { activeFrameSet, desktopFrames } from "@/lib/frames";
import { gsap, MOTION_OK, ScrollTrigger } from "@/lib/gsap";
import { afterHero, onHeroActive } from "@/lib/hero";
import { getLenis } from "@/lib/lenis";
import { onPreloaderDone } from "@/lib/preload";
import { effectAfter } from "@/lib/idle";

const R = 80; // text circle radius in the 200×200 viewBox
const SPIN_SECONDS = 24;
const MARGIN = 12; // minimum clear space around the badge (≥ the parallax travel)

/**
 * Scroll position (px) at which a given frame number is shown. Mirrors the
 * mapping in ScrollStage.buildTimeline (1 timeline unit = 1 frame, then the
 * push-in and the optional wipe) without touching it.
 */
function scrollForFrame(frame: number) {
  const st = ScrollTrigger.getById("stage");
  if (!st) return null;
  const set = activeFrameSet();
  const last = set.count - 1;
  const k = last / (desktopFrames.count - 1);
  const total = last + (T.pushIn.frames + T.wipe.frames) * k;
  return st.start + (((frame - 1) * k) / total) * (st.end - st.start);
}

/**
 * Rotating circular text badge (SVG textPath) with an ice cube in the middle.
 * 24 s per turn, spins faster with scroll velocity, pauses off screen. Click /
 * Enter scrolls (Lenis) to the next text beat, then on to the Story section.
 * Placed in the gap between the text column and the glass when there's room
 * (glass position computed with the same cover-fit maths as the canvas,
 * including the final push-in); otherwise under the text (narrow desktops) or
 * just above it (phones and tablets). Not rendered for reduced motion.
 */
export default function HeroBadge({ root }: { root: RefObject<HTMLElement | null> }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Set up when the preloader hands over (the badge only appears then), keeping
  // its layout reads and triggers out of the page-load window.
  useEffect(() => effectAfter(onPreloaderDone, () => {
    const stage = root.current;
    const btn = btnRef.current;
    const ring = ringRef.current;
    if (!stage || !btn || !ring) return;

    const mm = gsap.matchMedia(stage);
    mm.add(MOTION_OK, () => {
      // ---- Placement (transform only: no layout shift).
      const place = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        const size = btn.offsetWidth;
        const boxes = Array.from(stage.querySelectorAll<HTMLElement>("[data-beat] > div"));
        if (!boxes.length) return;
        // offsetLeft/Top ignore transforms, so the beats' scroll animation doesn't skew this.
        // The column's max width, not its current content width: the h1 is being
        // split into lines for its reveal right when this runs, which shrinks it.
        const colWidth = (b: HTMLElement) => {
          const max = parseFloat(getComputedStyle(b).maxWidth);
          return Number.isFinite(max) ? Math.max(max, b.offsetWidth) : b.offsetWidth;
        };
        const textRight = Math.max(...boxes.map((b) => b.offsetLeft + colWidth(b)));
        const textTop = Math.min(...boxes.map((b) => b.offsetTop));
        const textBottom = Math.max(...boxes.map((b) => b.offsetTop + b.offsetHeight));
        const gutter = boxes[0].offsetLeft;

        let x: number;
        let y: number;
        if (window.matchMedia("(min-width: 68.75rem)").matches) {
          // Wide layout: the glass's left edge at its closest (end of the push-in).
          const set = activeFrameSet();
          const glass = glassScreenEdges(w, h, set);
          const cx = (glass.left + glass.right) / 2;
          const glassLeft = Math.min(glass.left, cx - (cx - glass.left) * T.pushIn.scale);
          const gap = glassLeft - textRight;
          if (gap >= size + MARGIN * 2) {
            x = textRight + (gap - size) / 2;
            y = h * 0.64 - size / 2;
          } else {
            x = gutter;
            y = Math.min(textBottom + 32, h - size - 24);
          }
        } else {
          // Bottom layout: right end of the label line, just above the tallest beat.
          x = w - gutter - size;
          y = textTop - size - MARGIN;
        }
        gsap.set(btn, { x: Math.round(x), y: Math.round(y) });
      };
      place();
      const ro = new ResizeObserver(place);
      ro.observe(stage);

      // ---- Spin: 24 s per turn, boosted by scroll velocity, eased back.
      // The ring is an HTML layer (not an SVG group), so rotating it is a pure GPU
      // transform with no repaint of the text. It only starts once the badge shows.
      const spin = gsap.to(ring, { rotation: 360, duration: SPIN_SECONDS, ease: "none", repeat: -1, paused: true });
      let shown = false;
      const velocity = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        endTrigger: afterHero(),
        end: "top top",
        refreshPriority: -1,
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 8);
          if (boost <= spin.timeScale()) return;
          gsap.to(spin, {
            timeScale: boost,
            duration: 0.2,
            overwrite: true,
            onComplete: () => void gsap.to(spin, { timeScale: 1, duration: 1.6, ease: "power2.out", overwrite: true }),
          });
        },
      });
      let heroActive = true;
      const offActive = onHeroActive((a) => {
        heroActive = a;
        if (a && shown) spin.resume();
        else spin.pause();
      });

      // ---- Appear with the hero intro.
      gsap.fromTo(btn, { autoAlpha: 0, scale: 0.85 }, {
        autoAlpha: 1, scale: 1, duration: 0.9, ease: "power3.out", delay: 0.8,
        onStart: () => {
          shown = true;
          if (heroActive) spin.resume();
        },
      });

      return () => {
        ro.disconnect();
        velocity.kill();
        offActive();
      };
    });
    return () => mm.revert();
  }), [root]);

  const onClick = () => {
    const targets = [T.beats.pour.in, T.beats.finish.in]
      .map((f) => scrollForFrame(f + T.fadeFrames)) // land once the beat is fully in
      .filter((v): v is number => v !== null);
    const next = targets.find((t) => t > window.scrollY + 4);
    const target = next ?? document.getElementById("story");
    if (target === null) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    else if (typeof target === "number") window.scrollTo({ top: target });
    else target.scrollIntoView();
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      aria-label={copy.badge.label}
      // Anchored top-left; moved into place with a transform (see place()).
      className="group absolute top-0 left-0 z-20 size-24 rounded-full text-cream invisible opacity-0 md:size-[132px] motion-reduce:hidden"
    >
      <svg viewBox="0 0 200 200" aria-hidden="true" className="size-full overflow-visible transition-transform duration-500 ease-out group-hover:scale-105">
        <circle cx="100" cy="100" r="99" className="fill-espresso/35" />
        <circle cx="100" cy="100" r="58" fill="none" className="stroke-cream/25" strokeWidth="1" />
        {/* Ice cube (isometric), nudged down on hover. */}
        <g className="transition-transform duration-500 ease-out group-hover:translate-y-1" fill="none" strokeLinejoin="round" strokeWidth="2.2">
          <path d="M100 78 L119 89 L119 111 L100 122 L81 111 L81 89 Z" className="stroke-cream" />
          <path d="M81 89 L100 100 L119 89 M100 100 L100 122" className="stroke-cream/70" />
          <path d="M88 93 L95 97" className="stroke-caramel" strokeLinecap="round" />
        </g>
      </svg>
      {/* Rotating text ring: its own GPU layer, rotated as a whole (see spin). */}
      <div ref={ringRef} className="pointer-events-none absolute inset-0 will-change-transform">
        <svg viewBox="0 0 200 200" aria-hidden="true" className="size-full overflow-visible transition-transform duration-500 ease-out group-hover:scale-105">
          <defs>
            <path id="hero-badge-circle" d={`M100,100 m-${R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0`} />
          </defs>
          <text className="fill-current font-sans text-[15px] font-medium tracking-[0.2em] uppercase">
            <textPath href="#hero-badge-circle" textLength={2 * Math.PI * R - 2} lengthAdjust="spacing">
              {copy.badge.text}
            </textPath>
          </text>
        </svg>
      </div>
    </button>
  );
}
