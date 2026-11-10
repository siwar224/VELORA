import { timeline } from "@/content/timeline";
import manifest from "@/data/frames.json";

type FrameSetManifest = { count: number; pattern: string; pad: number };
type Manifest = FrameSetManifest & { mobile?: FrameSetManifest };
const m = manifest as Manifest;

/** A frame sequence plus how to crop it (focal point = where the glass is). */
export type FrameSet = FrameSetManifest & {
  width: number;
  height: number;
  focalX: number;
  focalY: number;
};

// The manifest says what exists on disk; timeline.lastFrame says how much of it plays.
export const desktopFrames: FrameSet = {
  count: Math.min(m.count, timeline.lastFrame),
  pattern: m.pattern,
  pad: m.pad,
  width: 1920,
  height: 1080,
  focalX: 0.74, // glass sits at ~61–87% of the width
  focalY: 0.5,
};

/**
 * Portrait set: does not exist yet. Drop frames into public/frames/mobile/ and
 * the manifest picks them up; phones in portrait then use them automatically.
 * Assumed 1080×1920 with the glass centred: adjust here once the set exists.
 */
export const mobileFrames: FrameSet | null = m.mobile
  ? {
      ...m.mobile,
      // Same cut point, proportionally, in case the portrait set has a different length.
      count: Math.min(m.mobile.count, Math.round((timeline.lastFrame / m.count) * m.mobile.count)),
      width: 1080,
      height: 1920,
      focalX: 0.5,
      focalY: 0.5,
    }
  : null;

export const MOBILE_QUERY = "(max-width: 768px) and (orientation: portrait)";

/** The set to play on this device (browser only). */
export function activeFrameSet(): FrameSet {
  return mobileFrames && window.matchMedia(MOBILE_QUERY).matches ? mobileFrames : desktopFrames;
}

/** URL of a 1-based frame number, e.g. frameSrc(1) -> "/frames/desktop/f_0001.webp". */
export function frameSrc(n: number, set: FrameSetManifest = desktopFrames): string {
  return set.pattern.replace("{n}", String(n).padStart(set.pad, "0"));
}
