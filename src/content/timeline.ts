// Scroll choreography for the pinned stage. Tune the story here, not in components.
//
// UNIT: every position below is a FRAME NUMBER (1-based, same as f_0001.webp).
// The GSAP timeline is built so that 1 unit of timeline time = 1 frame, which
// makes "beat 2 appears at frame 40" literally `at: 40`.
// Open the site with `?debug` to see the live frame number while you scroll.
//
// Current values follow CLAUDE.md's beats. Measured from the frames, the big
// splash actually runs ~70–205 and condensation starts ~225, see the README.

export const timeline = {
  /** Total pinned scroll length, in viewport heights. */
  scrollVh: { desktop: 650, mobile: 450 },
  /** Seconds the visuals take to catch up with the scrollbar (ScrollTrigger scrub). */
  scrub: 0.5,
  /** How many frames a text fade in/out lasts. */
  fadeFrames: 12,

  beats: {
    // Hero: visible from the start, leaves as the ice starts falling.
    arrival: { out: 24 },
    // "Crafted in motion": during the splash.
    pour: { in: 40, out: 130 },
    // "Worth savouring": as condensation forms; stays until the wipe.
    finish: { in: 232 },
  },

  /** After the last frame: slow push-in on the glass. Length in frame units of scroll. */
  pushIn: { frames: 40, scale: 1.15 },
  /** Then the cream panel wipes up over the stage before it unpins into the Story section. */
  wipe: { frames: 30 },
} as const;
