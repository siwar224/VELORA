import { brand, visit } from "@/content/site";

export default function Visit() {
  return (
    <footer
      id="visit"
      data-nav-theme="dark"
      aria-labelledby="visit-heading"
      className="bg-espresso px-5 pt-28 pb-10 text-cream md:px-10 md:pt-40 lg:px-20"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="eyebrow flex items-center gap-4 text-caramel">
          <span aria-hidden="true" className="h-px w-10 bg-caramel" />
          {visit.label}
        </p>
        <h2 id="visit-heading" className="mt-6 font-serif text-5xl font-light md:text-7xl">
          {visit.heading}
        </h2>

        <div className="mt-16 grid gap-12 border-t border-cream/15 pt-12 md:grid-cols-3">
          <address className="not-italic leading-relaxed text-cream/85">
            <p className="eyebrow mb-4 text-cream/60">Address</p>
            {visit.address.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>

          <div>
            <p className="eyebrow mb-4 text-cream/60">Hours</p>
            <dl className="space-y-1 text-cream/85">
              {visit.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-6 md:max-w-64">
                  <dt>{h.days}</dt>
                  <dd className="tabular-nums">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="eyebrow mb-4 text-cream/60">Contact</p>
            <a
              href={visit.contact.href}
              className="border-b border-caramel pb-1 text-cream transition-colors hover:text-caramel"
            >
              {visit.contact.label}
            </a>
          </div>
        </div>

        <div className="mt-28 flex flex-col justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} {brand.name} · {brand.tagline}
          </p>
          <p>{visit.smallPrint}</p>
        </div>
      </div>
    </footer>
  );
}
