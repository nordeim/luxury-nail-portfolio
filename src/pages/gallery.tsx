import { useState } from "react";
import { CATEGORY_LABELS, GALLERY_WORKS } from "@/data/studio";
import type { WorkCategory } from "@/types";

// Gallery — the 12-work grid with the reference's category filters
// (docs/reference-investigation.md §3.2; R7-02/R7-03).
// Reference items are non-links; the clone keeps that (figures, not anchors)
// and shows captions below each work — the accessible editorial pattern.
// The filter row is the reference's own shipped functionality (measured
// 2026-10-20): six chips, active = white on the band ground, inactive = ink
// on transparent with a hairline border; implemented here as an aria-pressed
// toggle group with the clone's token system.

type CategoryFilter = "all" | WorkCategory;

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "editorial", label: "Editorial" },
  { value: "bridal", label: "Bridal" },
  { value: "avant-garde", label: "Avant-Garde" },
  { value: "classic", label: "Classic" },
  { value: "seasonal", label: "Seasonal" },
];

export function GalleryPage() {
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const visible =
    filter === "all" ? GALLERY_WORKS : GALLERY_WORKS.filter((work) => work.category === filter);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <header className="max-w-2xl">
        <p className="eyebrow text-muted-foreground">The Collection</p>
        <h1 className="mt-4 font-display text-6xl font-normal lg:text-7xl">Gallery</h1>
        {/* R7-07: intro re-measured verbatim 2026-10-20. */}
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          A curated selection of our finest work. Each design tells a story of elegance,
          creativity, and meticulous craftsmanship.
        </p>
      </header>

      <div
        role="group"
        aria-label="Filter works by category"
        className="mt-12 flex flex-wrap gap-4"
      >
        {FILTERS.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(value)}
              className={`border px-5 py-2 text-xs uppercase tracking-widest transition-colors duration-300 ${
                active
                  ? "border-band bg-band text-band-foreground"
                  : "border-hairline bg-transparent text-foreground hover:border-ink-soft"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ul className="mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2">
        {visible.map((work) => (
          <li key={work.id}>
            <figure>
              <img
                src={work.image}
                alt={`${work.name} — ${CATEGORY_LABELS[work.category]} nail artistry`}
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
              <figcaption className="mt-5 flex items-baseline justify-between gap-4">
                <span className="font-display text-2xl">{work.name}</span>
                <span className="eyebrow whitespace-nowrap text-muted-foreground">
                  {CATEGORY_LABELS[work.category]}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
