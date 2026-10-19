import { useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, SearchIcon, ShoppingCart, Star } from "lucide-react";
import { PrimaryButton } from "@/components/chrome";
import { ProductGrid } from "@/components/product";
import { CATEGORIES, productById, productBySlug, relatedProducts } from "@/data/catalog";
import { CarouselArrows, ProductRow } from "@/pages/home";
import { discountPercent, formatMoney } from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { CategoryId, Product, SortKey } from "@/types";
import { cn } from "@/utils/cn";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Highest Rated",
  featured: "Featured",
};

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  if (sort === "price-asc") return copy.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === "price-desc") return copy.sort((a, b) => b.priceCents - a.priceCents);
  if (sort === "rating") return copy.sort((a, b) => b.rating - a.rating);
  if (sort === "newest") return copy.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  return copy.sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function ProductsPage() {
  const query = useQuery();
  const { navigate } = useRouter();
  const { visibleProducts } = useStore();
  const category = (query.get("category") as CategoryId | null) ?? "all";
  const search = query.get("search") ?? "";
  const [sort, setSort] = useState<SortKey>("newest");

  const setParams = (nextCategory: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextCategory && nextCategory !== "all") params.set("category", nextCategory);
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    const qs = params.toString();
    navigate(qs ? `/products?${qs}` : "/products", { replace: true });
  };

  const filtered = useMemo(() => {
    let list = visibleProducts;
    if (category !== "all") list = list.filter((product) => product.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.materials.some((material) => material.toLowerCase().includes(q)),
      );
    }
    return sortProducts(list, sort);
  }, [category, search, sort, visibleProducts]);

  const categoryName = CATEGORIES.find((item) => item.id === category)?.name ?? "All Products";

  return (
    /* Session-39 (F39-14): one space-y-8 wrapper owns the catalog rhythm
       (32px on the non-last children — v4's space-y computes on
       margin-block-end), replacing the old py-10 + mt-2/mt-8/mt-8 margins. */
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        {/* F39-15: h1 text-3xl→text-4xl (30px mobile / 36px md+) with the
            v3 line-heights; the count is text-base (16px), not text-sm. */}
        <h1 className="font-display text-3xl font-bold leading-[36px] text-foreground md:text-4xl md:leading-[40px]">
          {categoryName}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "product" : "products"} found
        </p>
      </div>

      {/* F39-16: flex-col → sm:flex-row (the reference splits the row at
          sm, not lg); h-9 pill controls — search at text-base (16px) with
          a 16px muted icon at left-3, selects at text-sm/400. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            aria-label="Search products"
            placeholder="Search products..."
            onChange={(event) => setParams(category, event.target.value)}
            className="h-9 w-full rounded-[9999px] border border-border bg-card pl-9 pr-4 text-base text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-3">
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <select
              value={category === "all" ? "" : category}
              onChange={(event) => setParams(event.target.value, search)}
              className="h-9 w-full appearance-none rounded-full border border-border bg-card pl-3 pr-9 text-sm font-normal text-foreground sm:w-48"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </label>
          <label className="relative">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-9 w-full appearance-none rounded-full border border-border bg-card pl-3 pr-9 text-sm font-normal text-foreground sm:w-48"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </label>
        </div>
      </div>

      <ProductGrid products={filtered} empty="No products match those filters. Try clearing the search." />
    </div>
  );
}

export function ProductPage({ slug }: { slug: string }) {
  const { visibleProducts, addToCart, toast } = useStore();
  const { navigate } = useRouter();
  const bySlug = productBySlug(slug, visibleProducts);
  const byId = productById(slug, visibleProducts);
  const product = bySlug ?? byId;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Hoisted above the not-found early return — hooks must run unconditionally.
  const relatedRow = useRef<HTMLDivElement>(null);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">Product not found</h1>
        <p className="mt-3 text-muted-foreground">That piece may have sold out or been delisted.</p>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse products
        </PrimaryButton>
      </div>
    );
  }

  const discount = discountPercent(product.priceCents, product.compareAtCents);
  const related = relatedProducts(product, visibleProducts).slice(0, 8);
  const inStock = product.stock > 0;
  const categoryName = CATEGORIES.find((item) => item.id === product.category)?.name ?? product.category;

  const scrollRelated = (direction: 1 | -1) => {
    relatedRow.current?.scrollBy({ left: direction * 320, behavior: "smooth" });
  };

  const onAdd = () => {
    const error = addToCart(product.id, quantity);
    if (error) {
      toast(error);
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const onBuyNow = () => {
    const error = addToCart(product.id, quantity);
    if (error) {
      toast(error);
      return;
    }
    navigate("/checkout");
  };

  return (
    /* Session-39 (F39-01): one space-y-16 wrapper owns the PDP rhythm — a
       uniform 64px (v4's space-y computes on margin-block-end of the
       non-last children), replacing the old mt-6 grid / mt-16 related
       margins. The back link, the body grid, and the related section are
       the three children. */
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* F39-02: side-by-side from md (768px), not lg — a whole tablet
          band stacked in the old layout. gap-10 = 40px column-gap. */}
      <div className="grid gap-10 md:grid-cols-2">
        {/* F39-03/F40-01: an aspect-square 24px-radius muted/30 tile with
            the border-border/50 hairline (1px rgba(229,224,220,0.5) —
            measured on all 8 reference PDPs; the s39 "no border" reading
            is superseded). The bg alpha is baked into --color-gallery
            because v4's /30 modifier color-mixes in oklab (T-13). */}
        <div className="aspect-square overflow-hidden rounded-[24px] border border-border-soft bg-gallery">
          <img
            src={product.image}
            alt={product.name}
            width={900}
            height={900}
            className="aspect-square w-full object-cover"
          />
        </div>

        {/* F39-04: one space-y-6 column (24px) replaces the per-row
            mt-2/3/5/6 margins; no <hr> hairlines — the reference's info
            column is a clean stack. */}
        <div className="space-y-6">
          {/* F39-05: 14px/500, 0.7px tracking, uppercase, primary — the
              source text is proper-case ("Kitchen Tools", from CATEGORIES). */}
          <p className="text-sm font-medium uppercase tracking-[0.7px] text-primary">{categoryName}</p>
          {/* F39-06: text-3xl→text-4xl with the v3 line-heights (D6). */}
          <h1 className="font-display text-3xl font-bold leading-[36px] text-foreground md:text-4xl md:leading-[40px]">
            {product.name}
          </h1>

          {/* F39-07: 20px amber stars + ONE muted "4.9 (412 reviews)"
              span (14px/400) — the card Stars primitive (14px + "(412)")
              stays on the card/catalog surfaces; the PDP row is this
              larger variant. */}
          <div className="flex items-center gap-2" aria-label={`Rated ${product.rating} out of 5`}>
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((index) => (
                <Star key={index} className="h-5 w-5 fill-badge text-badge" />
              ))}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-foreground">{formatMoney(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(product.compareAtCents)}
                </span>
                {discount > 0 && (
                  <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white">
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* F39-08: 16px/400 foreground text with a green icon (the
              accent token = rgb(69,161,130)) — the whole row is NOT green. */}
          <p
            className={cn(
              "inline-flex items-center gap-1.5 text-base font-normal",
              inStock ? "text-foreground" : "text-destructive",
            )}
          >
            <Check className="h-4 w-4 text-accent" strokeWidth={2.5} aria-hidden="true" />
            {inStock ? "In Stock" : "Out of stock"}
          </p>

          {/* F39-09: an h3 16px/600 + a 16px/26px muted paragraph. */}
          <div>
            <h3 className="text-base font-semibold text-foreground">Description</h3>
            <p className="mt-2 text-base leading-[26px] text-muted-foreground">{product.description}</p>
          </div>

          {/* F39-10: CREAM pills — bg-secondary (rgb(243,238,232)), text
              secondary-foreground (rgb(44,36,33)), 12px, 2px 10px padding. */}
          {product.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-[9999px] bg-secondary px-[10px] py-[2px] text-xs font-medium leading-[18px] text-secondary-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* F39-11: a 112x36 muted pill (bg-muted, NO border) with 16px
              glyphs and a 16px value — not the old 46px bordered card. */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="inline-flex items-center rounded-[9999px] bg-muted">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground disabled:opacity-40"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-base font-medium" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground disabled:opacity-40"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Session-36 (F36-11) re-measurement: the reference's PDP action row
              is a ROW at every width (flex gap-3) — Add-to-Cart h-10 px-8
              flex-1 (14px/500, shadow, hover:bg-primary/90), Buy Now h-10 px-6
              with NO flex-1. The old clone markup (flex-col on mobile with
              BOTH buttons flex-1 h-12) collapsed them to 20-22px: the flex
              algorithm ignores `height` under `flex-basis: 0%`, so the
              buttons fell to min-content. Row layout + reference geometry
              fixes both the collapse and the parity. */}
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[9999px] bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              onClick={onAdd}
              disabled={!inStock}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-[9999px] border border-border bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={onBuyNow}
              disabled={!inStock}
            >
              Buy Now
            </button>
          </div>

          {/* F39-13 (D1): the shipping/returns/shippingNote rows are GONE —
              the PDP info column is a measured parity surface and the
              shipping disclosure already lives on the cart/checkout/
              tracking surfaces. Product.shippingNote stays in the type +
              seed (data, no render seam) for the server-backed workstream. */}
        </div>
      </div>

      {/* F39-12 (D2): the related section is the home-page carousel
          pattern — space-y-6, a header row (h2 24→30px + 16px subtitle +
          2x40px arrows), and a scroll-snap ProductRow of min-260/max-280
          cells. The reference's algorithm produced 1 card; the clone shows
          its 8 candidates in the scrollable row (surplus off-viewport,
          exactly like the home carousels over a longer catalog). */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="related-heading" className="font-display text-2xl font-bold text-foreground md:text-3xl">
                You May Also Like
              </h2>
              <p className="mt-1 text-base text-muted-foreground">Similar products you might enjoy</p>
            </div>
            <CarouselArrows onScroll={scrollRelated} />
          </div>
          <ProductRow products={related} rowRef={relatedRow} />
        </section>
      )}
    </div>
  );
}

export function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Page Not Found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <PrimaryButton className="mt-8" onClick={() => navigate("/")}>
        Go Home
      </PrimaryButton>
    </div>
  );
}
