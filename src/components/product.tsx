import { ShoppingCart, Star } from "lucide-react";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import { discountPercent, formatMoney } from "@/lib/commerce";
import type { Product } from "@/types";

export function Stars({ rating, count }: { rating: number; count?: number }) {
  /* Session-38 re-measurement (reference /products + PDP): the reference
     renders ALL five stars amber-400 (fill-badge, now #fbbf24) with a
     2px gap — the rating nuance lives in the "(count)" text, not in
     partial fills. The true rating stays in the aria-label (a11y
     superset). starFloor() remains in commerce.ts (unit-pinned). */
  return (
    <span className="flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-badge text-badge" />
        ))}
      </span>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">({count})</span>}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toast } = useStore();
  const discount = discountPercent(product.priceCents, product.compareAtCents);

  const quickAdd = () => {
    const error = addToCart(product.id, 1);
    if (error) toast(error);
  };

  return (
    /* Session-38 (F38-04..07) — the measured reference card: 16px radius
       (v3 rounded-2xl — the v4 rounded-xl computes 20px, trap #6), a
       0.5-alpha hairline (border-border-soft, T-13), shadow-sm at rest
       with hover:shadow-xl + hover:-translate-y-1 over 500ms, image
       scale-110/700 with a black/10 hover overlay, semibold py-0.5 badge
       pills (featured = bg-primary orange), a hover-REVEALED 36px
       quick-add (p-2.5 + shopping-cart glyph, alpha-baked bg-quick-add,
       4px frost — the reference's v3 backdrop-blur-sm), text-base/600
       line-clamp-2 name, 12px/500 category label, in-flow price row. */
    <article className="group relative overflow-hidden rounded-[16px] border border-border-soft bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link href={`/product/${product.id}`} className="block" aria-label={product.name}>
          <img
            src={product.image}
            alt={product.name}
            width={640}
            height={640}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-110"
          />
        </Link>
        {/* Image hover dim — pointer-events-none so it never steals the
            link's clicks (the reference nests it inside its single <a>). */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
        <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-[9999px] bg-destructive px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="rounded-[9999px] bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
              Featured
            </span>
          )}
        </span>
        <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            className="rounded-full bg-quick-add p-2.5 text-foreground shadow-lg backdrop-blur-[4px] transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label={`Add ${product.name} to cart`}
            onClick={quickAdd}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Link href={`/product/${product.id}`} className="block space-y-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          {product.category.replace("-", " ")}
        </p>
        <h3 className="font-display text-base font-semibold leading-tight text-foreground line-clamp-2 transition-colors duration-300 group-hover:text-primary">
          {product.name}
        </h3>
        <Stars rating={product.rating} count={product.reviewCount} />
        <p className="flex items-baseline gap-2 pt-1">
          <span data-testid="card-price" className="text-lg font-bold text-foreground">{formatMoney(product.priceCents)}</span>
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <span data-testid="card-compare-at" className="text-sm text-muted-foreground line-through">
              {formatMoney(product.compareAtCents)}
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, empty }: { products: Product[]; empty: string }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[16px] border border-border-soft bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }
  return (
    /* Session-39 (F39-16): the reference /products grid is 2-up from the
       smallest width (grid-cols-2, 169px-class cards at 390px) and steps
       to 3 at md / 4 at lg — the clone shipped 1-up until sm. */
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
