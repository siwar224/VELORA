"use client";

import { useEffect } from "react";
import { gsap, MOTION_OK, SplitText } from "@/lib/gsap";

/**
 * Line-by-line reveal for every element marked `data-reveal-heading` (section
 * headings and the pull quote), when it scrolls into view. Renders nothing.
 * Skipped for reduced motion: headings are simply there.
 */
export default function HeadingReveals() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    let disposed = false;

    // SplitText measures line breaks, so wait for the web fonts; then wait for an
    // idle moment: every heading is below the fold, so this stays off the
    // critical path of the first paint (keeps Total Blocking Time down).
    const whenIdle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 2000 }) : window.setTimeout(cb, 200);
    document.fonts.ready.then(() => whenIdle(() => {
      if (disposed) return;
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal-heading]").forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            // Line splitting never breaks words, so the text reads normally as is;
            // SplitText's default aria-label isn't allowed on <p> (the pull quote).
            aria: "none",
            autoSplit: true, // re-split on resize / font change; the returned tween is re-created
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 1.1,
                stagger: 0.09,
                ease: "power4.out",
                // Below the pinned stage: measure after its pin spacer exists.
                scrollTrigger: { trigger: el, start: "top 85%", once: true, refreshPriority: -1 },
              }),
          });
        });
      });
    }));

    return () => {
      disposed = true;
      mm.revert();
    };
  }, []);

  return null;
}
