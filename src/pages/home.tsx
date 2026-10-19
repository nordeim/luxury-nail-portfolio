import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  ArrowRight,
  Cake,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  Flower2,
  Package,
  Sparkles,
  UtensilsCrossed,
  Wine,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FeatureBar } from "@/components/chrome";
import { ProductCard } from "@/components/product";
import { CATEGORIES } from "@/data/catalog";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";

/* Session-38 (F38-01) — the reference's "Shop by Category" grid is compact
   ICON TILES: a per-category 56px gradient disc (explicit linear-gradient,
   v3 from-*-400 -> to-*-500 pairs measured live) with a 28px white glyph.
   The map lives here (component-local) rather than in the catalog seed so
   a presentation-only change never churns the catalog hash / STORAGE_KEY. */
const CATEGORY_TILES: Record<string, { icon: LucideIcon; gradient: string }> = {
  cookware: {
    icon: CookingPot,
    gradient: "linear-gradient(to right bottom, rgb(251, 146, 60), rgb(239, 68, 68))",
  },
  bakeware: {
    icon: Cake,
    gradient: "linear-gradient(to right bottom, rgb(244, 114, 182), rgb(244, 63, 94))",
  },
  "kitchen-tools": {
    icon: UtensilsCrossed,
    gradient: "linear-gradient(to right bottom, rgb(251, 191, 36), rgb(249, 115, 22))",
  },
  storage: {
    icon: Package,
    gradient: "linear-gradient(to right bottom, rgb(45, 212, 191), rgb(16, 185, 129))",
  },
  appliances: {
    icon: Zap,
    gradient: "linear-gradient(to right bottom, rgb(96, 165, 250), rgb(99, 102, 241))",
  },
  dining: {
    icon: Wine,
    gradient: "linear-gradient(to right bottom, rgb(192, 132, 252), rgb(139, 92, 246))",
  },
  cleaning: {
    icon: Sparkles,
    gradient: "linear-gradient(to right bottom, rgb(34, 211, 238), rgb(14, 165, 233))",
  },
  decor: {
    icon: Flower2,
    gradient: "linear-gradient(to right bottom, rgb(163, 230, 53), rgb(34, 197, 94))",
  },
};

/* Session-38 (F38-03) — Featured (6) and New Arrivals (8) are horizontal
   scroll-snap carousels on the reference: flex gap-5 overflow-x-auto pb-4
   scrollbar-hide snap-x snap-mandatory with min-w-[260px] max-w-[280px]
   snap-start flex-shrink-0 cells (not responsive grids). */
export function ProductRow({ products, rowRef }: { products: Product[]; rowRef: RefObject<HTMLDivElement | null> }) {
  if (products.length === 0) return null;
  return (
    <div ref={rowRef} className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
      {products.map((product) => (
        <div key={product.id} className="min-w-[260px] max-w-[280px] flex-shrink-0 snap-start">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

export function CarouselArrows({ onScroll }: { onScroll: (direction: 1 | -1) => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
        aria-label="Scroll products back"
        onClick={() => onScroll(-1)}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
      </button>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
        aria-label="Scroll products forward"
        onClick={() => onScroll(1)}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}

export function HomePage() {
  const { carousel, visibleProducts } = useStore();
  const slides = carousel.filter((slide) => slide.active);
  const [index, setIndex] = useState(0);
  const featuredRow = useRef<HTMLDivElement>(null);
  const arrivalsRow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  const trending = visibleProducts.filter((product) => product.featured).slice(0, 6);
  const arrivals = visibleProducts.filter((product) => product.isNew).slice(0, 8);

  const scrollRow = (row: RefObject<HTMLDivElement | null>, direction: 1 | -1) => {
    row.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  /* Session-38 (F38-11): one space-y-16 pb-8 wrapper owns the page rhythm
     (64px uniform section gaps — the reference's main layout), so the
     sections below carry no vertical padding of their own; the hero keeps
     its pt-6. */
  return (
    <div className="space-y-16 pb-8">
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8" aria-label="Featured collections">
        {/* Session-38 (F38-10): the reference's hero card is FIXED-height
            (h-[500px] md:h-[600px]) with a BLACK three-stop tint —
            linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.3),
            rgba(0,0,0,0)) — and a max-w-2xl px-8 md:px-16 vertically
            centered text column (was min-h 420/520, a warm two-stop tint,
            and a max-w-7xl px-6/10 column). */}
        <div className="relative h-[500px] w-full overflow-hidden rounded-2xl md:h-[600px]">
          {slides.map((item, slideIndex) => (
            <img
              key={item.id}
              src={item.image}
              alt=""
              width={1600}
              height={900}
              aria-hidden={slideIndex !== index}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              style={{ opacity: slideIndex === index ? 1 : 0 }}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0))" }}
          />
          {slide && (
            <div className="relative z-10 flex h-full items-center">
              <div className="max-w-2xl px-8 md:px-16">
                {/* Session-36 (F36-06/07/08) re-measurement: the reference hero
                    renders text-4xl md:text-6xl (36→60px) with leading-tight,
                    a text-lg md:text-xl white/80 paragraph (max-w-lg), and an
                    h-10 px-8 text-base/600 CTA (40px tall). */}
                <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-white md:text-6xl">
                  {slide.title}
                </h1>
                <p className="mb-8 max-w-lg text-lg text-hero-body md:text-xl">{slide.body}</p>
                <Link
                  href={slide.href}
                  className="inline-flex h-10 w-fit items-center rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          )}
          <div className="absolute bottom-6 left-8 z-10 flex items-center gap-3 md:left-16">
            {slides.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show slide ${dotIndex + 1}`}
                aria-pressed={dotIndex === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  /* Session-36 (F36-09): reference dots — active 32×6 white,
                     idle 16×6 white/40 (bg-dot-idle, alpha-baked).
                     Session-38: position left-8 md:left-16, gap-3. */
                  dotIndex === index ? "w-8 bg-white" : "w-4 bg-dot-idle hover:bg-white/80",
                )}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
          <div className="absolute bottom-6 right-6 z-10 flex gap-2">
            {/* Session-36 (F36-10): reference arrows — 40px discs,
                white/10 glass (bg-frost, alpha-baked) with a 12px frost. */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-frost text-white backdrop-blur-md transition-colors hover:bg-white/30"
              aria-label="Previous slide"
              onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-frost text-white backdrop-blur-md transition-colors hover:bg-white/30"
              aria-label="Next slide"
              onClick={() => setIndex((current) => (current + 1) % slides.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <FeatureBar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="categories-heading">
        <div className="text-center mb-8">
          {/* Session-38 (F38-02): reference headings are text-2xl md:text-3xl
              (24→30px) with 16px mt-2 subtitles and verbatim reference copy
              (was text-3xl md:text-4xl + 14px mt-3 + clone copy). */}
          <h2 id="categories-heading" className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-base text-muted-foreground">Find exactly what you need for your home</p>
        </div>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          {CATEGORIES.map((category) => {
            const tile = CATEGORY_TILES[category.id] ?? CATEGORY_TILES.cookware;
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group cursor-pointer"
                aria-label={`Shop ${category.name}`}
              >
                <div className="flex flex-col items-center gap-3 rounded-[16px] border border-border-soft bg-card p-5 transition-all duration-[400ms] hover:border-primary/30 hover:shadow-lg">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-[16px] shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: tile.gradient }}
                  >
                    <tile.icon className="h-7 w-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="featured-heading">
        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="featured-heading" className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Featured Products
              </h2>
              <p className="mt-1 text-base text-muted-foreground">Hand-picked favorites for your home</p>
            </div>
            <CarouselArrows onScroll={(direction) => scrollRow(featuredRow, direction)} />
          </div>
          <ProductRow products={trending} rowRef={featuredRow} />
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="arrivals-heading">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 id="arrivals-heading" className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  New Arrivals
                </h2>
                <p className="mt-1 text-base text-muted-foreground">The latest additions to our collection</p>
              </div>
              <CarouselArrows onScroll={(direction) => scrollRow(arrivalsRow, direction)} />
            </div>
            <ProductRow products={arrivals} rowRef={arrivalsRow} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Call to action">
        {/* Session-38 (F38-09): the reference CTA is a 24px-radius card
            painted with a right-fading primary gradient (explicit
            linear-gradient, T-3), p-10 md:p-16, a text-lg md:text-xl /80
            paragraph (max-w-2xl), and a CREAM button (bg-secondary =
            rgb(243,238,232), text-secondary-foreground = rgb(44,36,33),
            h-10 px-8 14px/600, hover = the cream at 0.8 alpha). */}
        <div
          className="rounded-2xl p-10 text-center text-primary-foreground md:p-16"
          style={{ background: "linear-gradient(to right, rgb(217, 110, 38), rgba(217, 110, 38, 0.8))" }}
        >
          <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">Transform Your Kitchen Today</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-hero-body">
            Browse our curated collection of premium home and kitchen essentials. Quality that lasts, design that
            inspires.
          </p>
          <Link
            href="/products"
            className="mt-0 inline-flex h-10 items-center gap-2 rounded-[9999px] bg-secondary px-8 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary-hover"
          >
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
