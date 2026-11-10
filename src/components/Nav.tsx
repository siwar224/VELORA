import { brand, nav } from "@/content/site";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[90rem] items-center justify-between px-5 py-5 md:px-10 md:py-7"
      >
        <a href="#top" className="font-serif text-2xl tracking-[0.3em] text-cream">
          {brand.name}
          <span className="sr-only"> — home</span>
        </a>

        <div className="flex items-center gap-6 md:gap-10">
          <ul className="hidden items-center gap-8 md:flex">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="eyebrow text-cream/80 transition-colors hover:text-cream"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={nav.cta.href}
            className="eyebrow border border-cream/40 px-4 py-2.5 text-cream transition-colors hover:border-caramel hover:bg-caramel/15"
          >
            {nav.cta.label}
          </a>
        </div>
      </nav>
    </header>
  );
}
