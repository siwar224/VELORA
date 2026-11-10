import Image from "next/image";
import { menu } from "@/content/site";
import { frameSrc } from "@/lib/frames";

export default function Menu() {
  return (
    <section
      id="menu"
      data-nav-theme="light"
      aria-labelledby="menu-heading"
      className="bg-milk px-5 py-28 text-espresso md:px-10 md:py-40 lg:px-20"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="eyebrow flex items-center gap-4 text-caramel-deep">
          <span aria-hidden="true" className="h-px w-10 bg-caramel-deep" />
          {menu.label}
        </p>
        <h2 id="menu-heading" className="mt-6 font-serif text-5xl font-light md:text-7xl">
          {menu.heading}
        </h2>

        <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {menu.items.map((item) => (
            <li key={item.name} className="group">
              {/* Decorative crop of a sequence frame, zoomed onto the glass. */}
              <div className="relative aspect-[4/5] overflow-hidden bg-espresso">
                <Image
                  src={frameSrc(item.frame)}
                  alt=""
                  fill
                  // Request ~1.7x the card width: the image is scaled up to crop onto the glass.
                  sizes="(min-width: 1024px) 43vw, (min-width: 640px) 85vw, 170vw"
                  className="scale-[1.6] object-cover object-[76%_55%] transition-transform duration-700 ease-out group-hover:scale-[1.7] motion-reduce:transition-none"
                />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-espresso/15 pt-4">
                <h3 className="font-serif text-2xl md:text-3xl">{item.name}</h3>
                <p className="font-sans text-sm tabular-nums text-espresso/70">{item.price}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-espresso/70">{item.notes}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
