import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Register once, in the browser only (this module is also evaluated during SSR).
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Mobile browsers resize the viewport when the URL bar shows/hides; don't
  // recalculate every trigger (and jump the pinned stage) when that happens.
  ScrollTrigger.config({ ignoreMobileResize: true });}

/** gsap.matchMedia() conditions shared by the sections. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const MOTION_REDUCED = "(prefers-reduced-motion: reduce)";

export { gsap, ScrollTrigger, SplitText };
