import { CATEGORY_LABELS, GALLERY_WORKS } from "@/data/studio";

// Gallery — the 12-work grid (docs/reference-investigation.md §3.2).
// Reference items are non-links; the clone keeps that (figures, not anchors)
// and shows captions below each work — the accessible editorial pattern.

export function GalleryPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <header className="max-w-2xl">
        <p className="eyebrow text-muted-foreground">The Collection</p>
        <h1 className="mt-4 font-display text-6xl font-normal lg:text-7xl">Gallery</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Twelve signature works from the Aurelia atelier — editorial statements, bridal
          heirlooms, and avant-garde studies, each crafted as a one-of-a-kind composition.
        </p>
      </header>
      <ul className="mt-16 grid gap-x-10 gap-y-16 sm:grid-cols-2">
        {GALLERY_WORKS.map((work) => (
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
