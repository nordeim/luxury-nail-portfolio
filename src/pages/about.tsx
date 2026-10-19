import { ABOUT, STUDIO, STUDIO_IMAGE } from "@/data/studio";
import { CtaLink } from "@/components/chrome";

// About — founder story, values, studio (docs/reference-investigation.md §3.4).
// Founder unified to "Aurelia Chen" (reference's hero quote said "Aurelia
// Voss" — inconsistency resolved per the Deviations Ledger).

export function AboutPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-muted-foreground">{ABOUT.role}</p>
          <h1 className="mt-4 font-display text-5xl font-normal lg:text-6xl">{ABOUT.founder}</h1>
          <p className="mt-8 font-display text-2xl leading-snug text-ink-soft sm:text-3xl">
            {ABOUT.manifesto}
          </p>
        </header>

        <img
          src={STUDIO_IMAGE}
          alt="The Aurelia studio — a serene cream atelier with travertine table"
          className="mt-16 aspect-[3/2] w-full object-cover"
          loading="lazy"
        />

        <section aria-labelledby="values-title" className="mt-24">
          <h2 id="values-title" className="font-display text-4xl font-normal">
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
          <div className="border border-hairline bg-surface-raised p-10">
            <h3 className="font-display text-3xl">Let's Create Together</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Private consultations are open Tuesday through Saturday. Bring your inspiration —
              we will bring the artistry.
            </p>
            <CtaLink href="/booking" tone="dark" className="mt-8">
              Book Your Session
            </CtaLink>
          </div>
        </section>
      </div>
    </>
  );
}
