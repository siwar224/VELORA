import { story } from "@/content/site";

export default function Story() {
  return (
    <section
      id="story"
      data-nav-theme="light"
      aria-labelledby="story-heading"
      className="bg-cream px-5 py-28 text-espresso md:px-10 md:py-40 lg:px-20"
    >
      <div className="mx-auto max-w-[90rem]">
        <p className="eyebrow flex items-center gap-4 text-caramel-deep">
          <span aria-hidden="true" className="h-px w-10 bg-caramel-deep" />
          {story.label}
        </p>

        <div className="mt-10 grid gap-12 border-t border-espresso/15 pt-12 md:grid-cols-2 md:gap-20">
          <h2
            id="story-heading"
            className="font-serif text-4xl leading-[1.05] font-light md:text-6xl"
          >
            {story.heading}
          </h2>
          <div className="space-y-6 text-base leading-relaxed text-espresso/80 md:text-lg">
            {story.columns.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <dl className="mt-20 grid grid-cols-3 border-t border-espresso/15">
          {story.stats.map((s) => (
            <div key={s.label} className="border-r border-espresso/15 px-4 pt-8 first:pl-0 last:border-r-0 md:px-8">
              <dt className="eyebrow text-espresso/75">{s.label}</dt>
              <dd className="mt-3 font-serif text-4xl font-light md:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
