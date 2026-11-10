import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Smooth scroll driven by GSAP's ticker, so Lenis and ScrollTrigger read the
 * same scroll position on the same frame. Returns a cleanup function.
 */
export function startLenis(): () => void {
  const lenis = new Lenis({ anchors: true }); // anchors: smooth-scroll #story etc.

  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000); // ticker gives seconds
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0); // never "skip ahead" after a slow frame; keeps scrub exact

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
