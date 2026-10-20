import { ABOUT, STUDIO, STUDIO_IMAGE } from "@/data/studio";
import { CtaLink } from "@/components/chrome";

// About — founder story, stats, philosophy band, values, studio, featured-in
// (docs/reference-investigation.md §3.4; rebuilt to the measured anatomy in
// R7-04, docs/remediation-plan-aurelia-r7.md §5). Founder unified to
// "Aurelia Chen" (the reference's own Voss/Chen inconsistency is now fixed
// upstream; the R1 ledger row's unification matches). The founder portrait is
// independently generated for this project — no reference asset is copied.
// The address/hours line in the studio section is a clone superset sourced
// from the reference's own /booking info cards (deviations ledger).

export function AboutPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <header className="max-w-2xl">
          <p className="eyebrow text-muted-foreground">{ABOUT.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-normal lg:text-6xl">{ABOUT.founder}</h1>
        </header>

        <section aria-label="About the founder" className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <img
            src={ABOUT.portrait}
            alt="Aurelia Chen — nail artist, standing in the cream Aurelia studio"
            className="aspect-[3/4] w-full object-cover"
            loading="lazy"
          />
          <div className="space-y-6">
            {ABOUT.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <p className="text-base leading-relaxed text-muted-foreground">"{ABOUT.quote}"</p>
          </div>
        </section>

        <ul className="mt-20 grid grid-cols-3 gap-8 text-center lg:text-left">
          {ABOUT.stats.map((stat) => (
            <li key={stat.label}>
              <p className="font-display text-3xl sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="about-philosophy-title"
        className="bg-band text-band-foreground"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center lg:py-32">
          <p className="eyebrow text-band-accent">The Philosophy</p>
          <h2 id="about-philosophy-title" className="mt-8 font-display text-3xl leading-snug font-normal sm:text-5xl">
            {ABOUT.manifesto.split(new RegExp(`(${ABOUT.manifestoAccent})`)).map((part, index) =>
              part === ABOUT.manifestoAccent ? (
                <span key={index} className="text-band-accent">{part}</span>
              ) : (
                <span key={index}>{part}</span>
              ),
            )}
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-band-faint">
            {ABOUT.philosophyParagraph}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <section aria-labelledby="values-title">
          <p className="eyebrow text-muted-foreground">What Guides Us</p>
          <h2 id="values-title" className="mt-4 font-display text-4xl font-normal">
            Our Values
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {ABOUT.values.map((value) => (
              <article key={value.title}>
                <h3 className="font-display text-2xl">{value.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="studio-title" className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="studio-title" className="font-display text-4xl font-normal">
              The Studio
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              {ABOUT.studioBody}
            </p>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {STUDIO.addressLines[0]} · {STUDIO.addressLines[1]}
              <br />
              {STUDIO.hoursLine1}, {STUDIO.hoursLine2}
            </p>
          </div>
          <img
            src={STUDIO_IMAGE}
            alt="The Aurelia studio — a serene cream atelier with travertine table"
            className="aspect-[3/2] w-full object-cover"
            loading="lazy"
          />
        </section>

        <section aria-labelledby="featured-title" className="mt-24">
          <p className="eyebrow text-muted-foreground">As Featured In</p>
          <ul className="mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-4">
            {ABOUT.featuredIn.map((name) => (
              <li key={name} className="font-display text-2xl text-ink-soft">
                {name}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cta-title" className="mt-24 border border-hairline bg-surface-raised p-10">
          <h2 id="cta-title" className="font-display text-3xl">
            {ABOUT.ctaTitle}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{ABOUT.ctaSupport}</p>
          <CtaLink href="/booking" tone="dark" className="mt-8">
            {ABOUT.cta}
          </CtaLink>
        </section>
      </div>
    </>
  );
}
