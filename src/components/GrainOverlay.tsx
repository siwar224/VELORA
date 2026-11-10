/**
 * Film grain + vignette over the whole page. Pure CSS, no JS, no repaint cost
 * beyond one fixed layer: the grain is a tiny inline SVG noise tile.
 */
const noise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function GrainOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: noise }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_65%,rgb(30_18_11/0.22)_100%)]" />
    </div>
  );
}
