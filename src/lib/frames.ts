import manifest from "@/data/frames.json";

/** Number of frames in the desktop sequence (from the generated manifest). */
export const FRAME_COUNT = manifest.count;

/** URL of a 1-based frame number, e.g. frameSrc(1) -> "/frames/desktop/f_0001.webp". */
export function frameSrc(n: number): string {
  return manifest.pattern.replace("{n}", String(n).padStart(manifest.pad, "0"));
}
