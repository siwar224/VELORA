// Scroll choreography for the pinned stage. Tune the story here, not in components.
//
// UNIT: every position below is a FRAME NUMBER (1-based, same as f_0001.webp).
// The GSAP timeline is built so that 1 unit of timeline time = 1 frame, which
// makes "beat 2 appears at frame 40" literally `at: 40`.
// Open the site with `?debug` to see the live frame number while you scroll.
//
// Values are measured from the frames (CLAUDE.md's original ranges were off):
//   1–20 calm · 21–60 ice drops in gently · ~70–205 splashes · ~205–225 settles
//   · ~225–326 condensation. Brief's original values: arrival.out 24,
//   pour 40–130, finish.in 232.

export const timeline = {
  /**
   * The sequence plays frames 1…lastFrame; later frames are never downloaded.
   * 267: condensation is already there, the rest adds nothing. The files stay
   * in public/frames so this is a one-number change.
   */
  lastFrame: 267,
  /**
   * Total pinned scroll length, in viewport heights. Scaled down with lastFrame
   * (was 650 / 450 for all 326 frames) so each frame keeps the same scroll speed.
   */
  scrollVh: { desktop: 550, mobile: 380 },
  /** Seconds the visuals take to catch up with the scrollbar (ScrollTrigger scrub). */
  scrub: 0.5,
  /** How many frames a text fade in/out lasts. */
  fadeFrames: 12,

  beats: {
    // Hero: stays while the ice drops in gently, clears just before the first splash.
    arrival: { out: 50 },
    // "Crafted in motion": across the whole splash phase.
    pour: { in: 68, out: 200 },
    // "Worth savouring": as condensation forms; stays until the wipe.
    finish: { in: 222 },
  },

  /** After the last frame: slow push-in on the glass. Length in frame units of scroll. */
  pushIn: { frames: 40, scale: 1.15 },
  /** Then the cream panel wipes up over the stage before it unpins into the Story section. */
  wipe: { frames: 30 },
} as const;
