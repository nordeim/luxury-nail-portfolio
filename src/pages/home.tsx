import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CtaLink } from "@/components/chrome";
import { CATEGORY_LABELS, EXPERIENCE, HERO, JOURNEY, PHILOSOPHY, featuredWorks } from "@/data/studio";
import { Link } from "@/lib/router";
import { useRouter } from "@/lib/router";

// Landing page — section order and copy mirror the reference
// (docs/reference-investigation.md §3.1, Verified).

export function HomePage() {
  const { hash } = useRouter();

  useEffect(() => {
    if (hash !== "#portfolio") return;
    document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  const works = featuredWorks();

  return (
    <>
    <section aria-label="Introduction" className="relative flex min-h-svh items-center justify-center overflow-hidden">
      <img
        src={HERO.image}
        alt="Macro study of an elegant hand with glossy amber nails, lit in low-key editorial style"
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      {/* Trap 3: explicit sRGB gradient, not bg-gradient-to-* (oklab drift). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(10,9,8,0.55) 0%, rgba(10,9,8,0.35) 40%, rgba(10,9,8,0.65) 100%)" }}
      />
      <div className="relative z-10 flex flex-col items-center px-6 text-center text-hero-ink">
        <p className="eyebrow animate-fade-in text-hero-ink/80">{HERO.eyebrow}</p>
        <h1 className="animate-fade-up mt-6 font-display text-7xl leading-[0.95] font-normal sm:text-8xl lg:text-[8rem]">
          {HERO.title}
        </h1>
        <p className="animate-fade-up mt-6 max-w-md text-sm leading-relaxed text-hero-ink/90 sm:text-base">
          {HERO.tagline}
        </p>
        <CtaLink href="/booking" tone="light" className="mt-10">
          {HERO.cta}
        </CtaLink>
      </div>
      <a
        href="#portfolio"
        aria-label="Scroll to portfolio"
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-hero-ink/80 transition-colors hover:text-hero-ink"
      >
        <ChevronDown className="h-5 w-5 animate-bounce" aria-hidden="true" />
      </a>
    </section>

      <section id="portfolio" aria-labelledby="portfolio-title" className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-muted-foreground">Selected Works</p>
            <h2 id="portfolio-title" className="mt-4 font-display text-5xl font-normal lg:text-6xl">
              The Portfolio
            </h2>
          </div>
          <Link
            href="/gallery"
            className="eyebrow group inline-flex items-center gap-2 whitespace-nowrap transition-colors hover:text-gold"
          >
            View All
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:gap-10">
          {works.map((work) => (
            <li key={work.id}>
              <Link
                href="/gallery"
                className="group relative block overflow-hidden"
                /* Label-in-Name (WCAG 2.5.3): the accessible name must
                   contain the visible caption text ("{name} {category}" —
                   the touch caption is visible below sm, where axe 4.14
                   enforces the rule). An em-dash here breaks token
                   containment and fails label-content-name-mismatch. */
                aria-label={`${work.name} ${CATEGORY_LABELS[work.category]}`}
              >
                <img
                  src={work.image}
                  alt={`${work.name} — ${CATEGORY_LABELS[work.category]} nail artistry`}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                  style={{ background: "linear-gradient(to top, rgba(20,17,15,0.72) 0%, rgba(20,17,15,0) 55%)" }}
                >
                  <div className="flex flex-col gap-1 p-7 text-left text-hero-pill">
                    <p className="eyebrow text-hero-pill-soft">{CATEGORY_LABELS[work.category]}</p>
                    <p className="font-display text-3xl">{work.name}</p>
                  </div>
                </div>
                {/* Touch devices get no hover — caption stays available. */}
                <div className="mt-3 flex items-baseline justify-between sm:hidden">
                  <span className="font-display text-xl">{work.name}</span>
                  {/* Whitespace text node (axe 4.14 label-content-name-mismatch
                      root cause, R2-02): JSX strips inter-element whitespace,
                      fusing the caption for word segmentation into
                      "…EssenceEditorial" — a token no aria-label can contain.
                      The space is invisible in the flex row; it restores the
                      "name category" token sequence for Label-in-Name. */}
                  {" "}
                  <span className="eyebrow text-muted-foreground">{CATEGORY_LABELS[work.category]}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="sr-only">Featured works link to the full gallery.</p>
      </section>

      <section aria-labelledby="philosophy-title" className="bg-band text-band-foreground">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center lg:py-28">
          <p className="eyebrow text-band-accent">{PHILOSOPHY.eyebrow}</p>
          <h2 id="philosophy-title" className="mt-8 font-display text-3xl leading-snug font-normal sm:text-5xl">
            “{PHILOSOPHY.quote.split(/(refined elegance)/).map((part, index) =>
              part === "refined elegance" ? (
                // R6-03: the reference carries a rose accent span on this
                // phrase (measured 48px #D4A5A5 on the band — 8.02:1).
                <span key={index} className="text-band-accent">{part}</span>
              ) : (
                <span key={index}>{part}</span>
              ),
            )}”
          </h2>
          <p className="eyebrow mt-8 text-band-faint">{PHILOSOPHY.attribution}</p>
        </div>
      </section>

      <section aria-labelledby="experience-title" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <img
            src={EXPERIENCE.image}
            alt="Nail artist hand-painting an intricate design at the atelier table"
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
          />
          <div>
            <p className="eyebrow text-muted-foreground">{EXPERIENCE.eyebrow}</p>
            <h2 id="experience-title" className="mt-4 font-display text-5xl font-normal lg:text-6xl">
              {EXPERIENCE.title}
            </h2>
            {EXPERIENCE.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <CtaLink href="/services" tone="dark" className="mt-10">
              {EXPERIENCE.cta}
            </CtaLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="journey-title" className="bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center lg:py-28">
          <p className="eyebrow text-muted-foreground">{JOURNEY.eyebrow}</p>
          <h2 id="journey-title" className="mt-4 font-display text-5xl font-normal lg:text-6xl">
            {JOURNEY.title}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            {JOURNEY.support}
          </p>
          <CtaLink href="/booking" tone="dark" className="mt-10">
            {JOURNEY.cta}
          </CtaLink>
        </div>
      </section>
    </>
  );
}
