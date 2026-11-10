import { marquee } from "@/content/site";

/** How many times the phrase repeats in each half of the track (each half must be wider than the screen). */
const REPEAT = 6;

/**
 * Caramel band between the stage and the story. Pure CSS loop (globals.css,
 * `.marquee`): the track holds two identical halves and slides by -50%, so the
 * seam is invisible. Pauses on hover; static under reduced motion.
 */
export default function Marquee() {
  const phrase = marquee.words.join(" · ");
  const half = Array.from({ length: REPEAT }, (_, i) => (
    <span key={i} className="flex items-center">
      <span className="px-6 md:px-10">{phrase}</span>
      {/* CSS diamond, not a "✦" glyph: neither brand font has it, and the system
          font fallback lookup cost ~100ms of layout on first paint. */}
      <span aria-hidden="true" className="inline-block size-[0.16em] rotate-45 bg-current" />
    </span>
  ));

  return (
    <section data-nav-theme="dark" aria-label={phrase} className="marquee overflow-hidden bg-caramel py-6 text-espresso md:py-8">
      <div aria-hidden="true" className="marquee-track flex w-max font-serif text-4xl font-light tracking-[0.12em] whitespace-nowrap uppercase md:text-6xl">
        <div className="flex">{half}</div>
        <div className="flex">{half}</div>
      </div>
    </section>
  );
}
