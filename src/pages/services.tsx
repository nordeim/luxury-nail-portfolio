import { ADD_ON_SERVICES, BOOKING_POLICIES, SERVICES } from "@/data/studio";
import { CtaLink } from "@/components/chrome";

// Services — six curated services (names/descriptions/durations verbatim from
// the reference, docs/reference-investigation.md §3.3) + the three policy
// cards + "Ready to Book?" CTA. Remediation R6-01: the live reference
// re-measured 2026-10-20 renders prices on every core service and an
// "Add-On Services" (ENHANCEMENTS) band with four priced items — the catalog
// and this page track it. The booking form deliberately stays price-free and
// add-on-free (the reference's booking select offers exactly the six core
// services; unit-pinned in tests/catalog.test.ts).

export function ServicesPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <header className="max-w-2xl">
          <p className="eyebrow text-muted-foreground">Curated Experiences</p>
          <h1 className="mt-4 font-display text-6xl font-normal lg:text-7xl">Services</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Every appointment begins with a private consultation. Choose the experience —
            we shape the rest around you.
          </p>
        </header>

        <ul className="mt-16 border-t border-hairline">
          {SERVICES.map((service, index) => (
            <li
              key={service.id}
              className="grid gap-4 border-b border-hairline py-10 md:grid-cols-[10rem_1fr_1fr] md:gap-10"
            >
              <p className="eyebrow text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
              <div>
                <h2 className="font-display text-3xl">{service.name}</h2>
                {/* R6-01: reference meta row — duration + price side by side in
                    the warm gold family; --gold-ink keeps it AA on cream
                    (5.29:1) where the reference's static gold fails (2.97:1). */}
                <p className="mt-3 flex items-center gap-3 text-sm font-normal text-gold-ink">
                  <span>{service.durationMin} min</span>
                  <span aria-hidden="true">·</span>
                  <span>{service.price}</span>
                </p>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </li>
          ))}
        </ul>

        {/* ENHANCEMENTS band — reference anatomy (measured R6-01): dark band,
            eyebrow + 36px serif heading + faint intro on the left, four
            hairline-ruled name/price rows on the right. */}
        <section
          aria-labelledby="addons-title"
          className="mt-24 bg-band text-band-foreground"
        >
          <div className="grid gap-12 p-10 lg:grid-cols-2 lg:p-16">
            <div>
              <p className="eyebrow text-band-accent">Enhancements</p>
              <h2 id="addons-title" className="mt-4 font-display text-3xl font-normal lg:text-4xl">
                Add-On Services
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-band-faint">
                Elevate your experience with our curated selection of enhancement services.
              </p>
            </div>
            <ul>
              {ADD_ON_SERVICES.map((addOn) => (
                <li
                  key={addOn.id}
                  className="flex items-center justify-between gap-6 border-b border-band-hairline py-4"
                >
                  <span className="text-base">{addOn.name}</span>
                  <span className="text-sm text-band-gold">{addOn.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="policies-title" className="mt-24">
          <h2 id="policies-title" className="font-display text-4xl font-normal">
            Studio Policies
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {BOOKING_POLICIES.map((policy) => (
              <article key={policy.title} className="border border-hairline bg-surface-raised p-8">
                <h3 className="font-display text-2xl">{policy.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{policy.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="ready-title" className="bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center">
          <h2 id="ready-title" className="font-display text-5xl font-normal">
            Ready to Book?
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Request your appointment online and the studio will confirm within 24 hours.
          </p>
          <CtaLink href="/booking" tone="dark" className="mt-10">
            Book Your Session
          </CtaLink>
        </div>
      </section>
    </>
  );
}
