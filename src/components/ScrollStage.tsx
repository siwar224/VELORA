"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import CanvasSequence, { glassScreenX, type CanvasSequenceHandle } from "@/components/CanvasSequence";
import HeroAmbient from "@/components/HeroAmbient";
import HeroBadge from "@/components/HeroBadge";
import HeroMotion from "@/components/HeroMotion";
import { reportFrameProgress } from "@/lib/preload";
import { stage } from "@/content/site";
import { timeline as T } from "@/content/timeline";
import { activeFrameSet, desktopFrames, frameSrc, MOBILE_QUERY, mobileFrames } from "@/lib/frames";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { startLenis } from "@/lib/lenis";

const MOTION = "(prefers-reduced-motion: no-preference)";
const REDUCE = "(prefers-reduced-motion: reduce)";

// Poster: frame 1 normally (also the LCP element), the finished drink for
// reduced motion, and the portrait set's first frame on phones once it exists.
// A <picture> lets the browser pick by media query before any JS runs.
const posterBase = { alt: "", sizes: "100vw", width: desktopFrames.width, height: desktopFrames.height };
const poster = getImageProps({ ...posterBase, src: frameSrc(1), priority: true }).props;
const posterReduced = getImageProps({ ...posterBase, src: frameSrc(desktopFrames.count) }).props;
const posterMobile = mobileFrames
  ? getImageProps({ ...posterBase, src: frameSrc(1, mobileFrames), width: mobileFrames.width, height: mobileFrames.height }).props
  : null;

/**
 * The pinned stage. One scrubbed GSAP timeline drives the frame index, the text
 * beats, the push-in and the cream wipe, so everything stays in sync both ways.
 * Timings come from src/content/timeline.ts.
 *
 * Reduced motion: no pin, no scrub, no smooth scroll, no frames downloaded. The
 * finished drink is a static backdrop and the beats stack as normal sections
 * (layout via `motion-reduce:` classes below).
 */
export default function ScrollStage() {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null); // inner media layer: hero intro, breathing, parallax
  const textRef = useRef<HTMLDivElement>(null); // wrapper around the beats: text parallax
  const canvasRef = useRef<CanvasSequenceHandle>(null);
  const debugRef = useRef<HTMLOutputElement>(null);
  const refreshedAfterEager = useRef(false);

  const onFrameProgress = (loaded: number, total: number) => {
    reportFrameProgress(loaded, total); // -> Preloader (page level)
    // First frames are in: re-measure once (cheap; guards against late layout shifts).
    if (!refreshedAfterEager.current && loaded >= Math.min(30, total)) {
      refreshedAfterEager.current = true;
      ScrollTrigger.refresh();
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;

    const html = document.documentElement;
    const setNav = (state: "clear" | "solid") => {
      if (html.dataset.nav !== state) html.dataset.nav = state;
    };
    const mm = gsap.matchMedia(root);
    let disposed = false;

    // ---------- Reduced motion: static page; nav goes glass once past the hero.
    mm.add(REDUCE, () => {
      ScrollTrigger.create({
        trigger: root,
        start: "bottom 80px",
        end: "max",
        onToggle: (self) => setNav(self.isActive ? "solid" : "clear"),
      });
    });

    // ---------- Full experience.
    mm.add(MOTION, (context) => {
      const stopLenis = startLenis();
      const debug = new URLSearchParams(window.location.search).has("debug") ? debugRef.current : null;
      if (debug) debug.hidden = false;

      // Build after fonts load: SplitText measures line breaks, and the pin
      // positions depend on final layout.
      document.fonts.ready.then(() => {
        if (disposed) return;
        context.add(() => buildTimeline(root, media, canvasRef, debug, setNav));
        ScrollTrigger.refresh();
      });

      return () => stopLenis();
    });

    return () => {
      disposed = true;
      mm.revert(); // kills timelines, ScrollTriggers, pin spacer and SplitText
      delete html.dataset.nav;
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="beat-arrival"
      className="relative h-svh overflow-hidden motion-reduce:h-auto motion-reduce:overflow-visible"
    >

      {/* Media layer: scaled as one piece for the push-in. Sticky backdrop for reduced motion. */}
      <div
        ref={mediaRef}
        aria-hidden="true"
        className="absolute inset-0 will-change-transform motion-reduce:sticky motion-reduce:top-0 motion-reduce:h-svh"
      >
        {/* Inner layer for the "living hero" (HeroMotion): its own transforms stack
            with the push-in on the outer layer instead of fighting it. */}
        <div ref={fxRef} className="absolute inset-0 will-change-transform">
          <picture>
            <source media={REDUCE} srcSet={posterReduced.srcSet} sizes="100vw" />
            {posterMobile && <source media={MOBILE_QUERY} srcSet={posterMobile.srcSet} sizes="100vw" />}
            <img {...poster} alt="" className={`poster-focal absolute inset-0 h-full w-full ${posterMobile ? "poster-mobile-set" : ""}`} />
          </picture>
          <CanvasSequence ref={canvasRef} onProgress={onFrameProgress} className="absolute inset-0 h-full w-full motion-reduce:hidden" />
        </div>

        {/* Legibility: espresso fade from the left on wide screens, stronger from the bottom below 1100px. */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/55 via-45% to-espresso/0 wide:bg-gradient-to-r wide:from-espresso/90 wide:via-espresso/55 wide:via-35% wide:to-espresso/0 wide:to-60%" />
      </div>

      {/* Light sweep + drifting particles (between the image and the text). */}
      <HeroAmbient />

      <p className="sr-only">{stage.canvasDescription}</p>

      {/* Text wrapper: mouse parallax moves this; the scroll timeline moves the beats inside. */}
      <div ref={textRef} className="absolute inset-0 motion-reduce:static">
      {stage.beats.map((beat, i) => {
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <article
            key={beat.id}
            data-beat={beat.id}
            // Beats after the first start hidden; the timeline reveals them.
            // Reduced motion: each beat is a normal full-screen block over the sticky backdrop.
            // Below 1100px ("wide"): text in the bottom third; above: vertically centred left column.
            // `gutter-x` is shared with the nav so the logo and the text line up.
            className={`gutter-x absolute inset-0 flex items-end pb-[12svh] wide:items-center wide:pb-0 motion-reduce:relative motion-reduce:visible motion-reduce:h-svh motion-reduce:opacity-100 ${i === 0 ? "motion-reduce:-mt-[100svh]" : "invisible opacity-0"}`}
          >
            {/* Wide: --hero-col = min(36rem, 40vw), ends before the glass (~55-60% across). */}
            <div className="max-w-xl md:max-w-[42vw] wide:max-w-(--hero-col)">
              <p data-reveal className="eyebrow flex items-center gap-4 text-caramel">
                <span aria-hidden="true" className="h-px w-10 bg-caramel" />
                {beat.label}
              </p>
              <Heading
                id={`beat-${beat.id}`}
                className="mt-6 font-serif text-5xl leading-[0.95] font-light text-cream md:text-[clamp(3rem,5.4vw,3.75rem)] wide:text-[clamp(4.5rem,6.2vw,6rem)]"
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
      </div>

      {/* Rotating badge (above the text layer so it stays clickable) + hero motion. */}
      <HeroBadge root={rootRef} />
      <HeroMotion root={rootRef} fx={fxRef} text={textRef} />

      {/* Optional colour wipe (timeline.wipe.frames; currently off). */}
      <div data-wipe aria-hidden="true" className="absolute inset-0 bg-cream [clip-path:inset(100%_0_0_0)] motion-reduce:hidden" />

      {/* Dev aid: add ?debug to the URL to see the live frame number. */}
      <output ref={debugRef} hidden className="absolute right-4 bottom-4 z-30 bg-black/70 px-2 py-1 font-mono text-xs text-white" />
    </section>
  );
}

/** The scrubbed timeline. 1 unit of timeline time = 1 frame of the active set. */
function buildTimeline(
  root: HTMLElement,
  media: HTMLElement,
  canvasRef: RefObject<CanvasSequenceHandle | null>,
  debug: HTMLOutputElement | null,
  setNav: (state: "clear" | "solid") => void,
) {
  const set = activeFrameSet();
  const last = set.count - 1;
  // Config positions are desktop frame numbers; scale them if a set of a
  // different length (e.g. the future portrait set) is playing.
  const k = last / (desktopFrames.count - 1);
  const at = (frame: number) => (frame - 1) * k;
  const fade = T.fadeFrames * k;
  const pushIn = T.pushIn.frames * k;
  const wipe = T.wipe.frames * k;
  const wipeStart = last + pushIn;

  const q = gsap.utils.selector(root);
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id: "stage", // looked up by HeroBadge to scroll to a beat
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
  tl.to(seq, { frame: last, duration: last, onUpdate: () => canvasRef.current?.setFrame(Math.round(seq.frame)) }, 0);

  // 2) Text beats.
  const beatIn = (id: string, frame: number) => {
    const sel = `[data-beat="${id}"]`;
    const lines = SplitText.create(q(`${sel} h1, ${sel} h2`), { type: "lines", mask: "lines" }).lines;
    tl.fromTo(q(sel), { autoAlpha: 0 }, { autoAlpha: 1, duration: fade / 3 }, at(frame));
    tl.from(lines, { yPercent: 110, duration: fade, stagger: fade / 6, ease: "power3.out" }, at(frame));
    tl.from(q(`${sel} [data-reveal]`), { autoAlpha: 0, y: 24, duration: fade, stagger: fade / 6, ease: "power2.out" }, at(frame) + fade / 3);
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
    transformOrigin: () => `${glassScreenX(window.innerWidth, window.innerHeight, set) * 100}% 50%`,
    duration: pushIn,
    ease: "power1.inOut",
  }, last);

  // 4) Optional cream panel wipe before unpinning (timeline.wipe.frames; 0 = off).
  //    Skipped entirely at 0, otherwise a zero-length tween would snap it shut at the end.
  if (wipe > 0) {
    tl.fromTo(q("[data-wipe]"),
      { clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: wipe, ease: "power2.inOut" },
      wipeStart);
  }

  // Pad to the exact total so scroll length maps 1:1 onto the config.
  tl.set({}, {}, wipeStart + wipe);

  const header = document.querySelector<HTMLElement>(".site-nav");
  tl.eventCallback("onUpdate", () => {
    const t = tl.time();
    // Nav: no bar over the frames; glass from the moment the cream wipe starts,
    // tinted for cream once the wipe has covered the top half of the screen.
    setNav(t >= wipeStart ? "solid" : "clear");
    // With a wipe, tint for cream once it covers the top half; without one the
    // sections below set the tint themselves (data-nav-theme).
    if (header && wipe > 0) header.dataset.theme = t >= wipeStart + wipe / 2 ? "light" : "dark";
    if (debug) {
      const phase = t <= last ? "" : t < wipeStart ? " · push-in" : " · wipe";
      debug.textContent = `frame ${Math.round(seq.frame) + 1}/${set.count}${phase}`;
    }
  });
}
