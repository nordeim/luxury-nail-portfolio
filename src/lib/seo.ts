import type { Product } from "@/types";

/**
 * Per-route head seam (session 8 — SEO workstream).
 *
 * The reference site ships an inline per-route title map (decoded live
 * 2026-10-12 from its index.html) and a static OG/Twitter head set. The
 * clone follows that shape — and is a deliberate superset where the
 * reference under-invests (dynamic titles on PDPs, canonical links,
 * Product JSON-LD, private surfaces excluded from robots/sitemap).
 *
 * This module is the PURE seam: `buildRouteMeta` maps a location to the
 * head values a route should carry. `HeadManager` (App.tsx) applies them
 * to `document.title` / meta / link tags; keeping the logic pure keeps it
 * unit-pinnable in the node environment (tests/seo.test.ts).
 *
 * Divergences from the reference, registered in PAD §5.6:
 *   - Admin titles drop the reference's "admin/" prefix artifact
 *     ("admin/Admin Dashboard | …" → "Admin Dashboard | …").
 *   - Dynamic routes get real titles: PDP → "{Product Name} | HomeNest
 *     Kitchen", unknown slugs humanize (ecommerce-store template TITLE-2),
 *     auth pages and not-found are titled (template TITLE-NF-1).
 */

type Env = Record<string, string | undefined>;

const env = (import.meta as unknown as { env?: Env }).env;

/** Absolute site origin used by canonical/og:url/sitemap. Override with
 *  `VITE_SITE_URL` (see .env.example); scripts/generate-sitemap.mjs reads
 *  the same variable and must be re-run after changing it. */
export const SITE_URL = (env?.VITE_SITE_URL ?? "http://localhost:4173").replace(/\/+$/, "");

/** The reference's site-wide description, verbatim (brand-copy parity). */
export const SITE_DESCRIPTION =
  "Your professional destination for premium kitchen essentials, organized storage solutions, and gourmet cooking tools designed to elevate your culinary experience.";

const SUFFIX = "HomeNest Kitchen";

export interface RouteMeta {
  title: string;
  description: string;
  /** Absolute canonical URL — pathname only, query/hash dropped. */
  canonicalUrl: string;
  /** Absolute og:url — query preserved (ecommerce-store METADATA-OG-1). */
  ogUrl: string;
  /** schema.org Product node on resolved PDPs; null everywhere else. */
  jsonLd: Record<string, unknown> | null;
}

/** "cast-iron-dutch-oven" → "Cast Iron Dutch Oven" (template TITLE-2). */
export function humanizeSlug(slug: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();
  return decoded
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Static title map — exact pathname → title. Mirrors the reference's
 *  inline map (including its "Order Tracking" and "Terms Of Service"
 *  quirks) plus the clone's extra routes. */
const STATIC_TITLES: Record<string, string> = {
  "/": "HomeNest Kitchen",
  "/home": "HomeNest Kitchen",
  "/products": "Products",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/order-success": "Order Success",
  "/account": "Account",
  "/login": "Sign In",
  "/register": "Create Account",
  "/about": "About",
  "/contact": "Contact",
  "/track-order": "Order Tracking",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms Of Service",
  "/refund-policy": "Refund Policy",
  "/cookie-policy": "Cookie Policy",
  "/disclaimer": "Disclaimer",
  "/admin": "Admin Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/products": "Admin Products",
  "/admin/orders": "Admin Orders",
  "/admin/analytics": "Admin Analytics",
  "/admin/categories": "Admin Categories",
  "/admin/carousel": "Admin Carousel",
  "/admin/settings": "Admin Settings",
};

function splitLocation(path: string): { pathname: string; search: string } {
  const hashAt = path.indexOf("#");
  const withoutHash = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const queryAt = withoutHash.indexOf("?");
  const pathname = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
  const search = queryAt >= 0 ? withoutHash.slice(queryAt) : "";
  return { pathname: safeDecode(pathname), search };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function productNode(product: Product, path: string): Record<string, unknown> {
  const image = /^https?:\/\//.test(product.image)
    ? product.image
    : `${SITE_URL}${product.image}`;
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image,
    brand: { "@type": "Brand", name: "HomeNest" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${path}`,
      price: product.priceCents / 100,
      priceCurrency: "USD",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  if (product.rating > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }
  return node;
}

export function buildRouteMeta(path: string, products: Product[]): RouteMeta {
  const { pathname, search } = splitLocation(path);

  let title: string | undefined;
  let jsonLd: Record<string, unknown> | null = null;

  const staticTitle = STATIC_TITLES[pathname];
  if (staticTitle !== undefined) {
    title = staticTitle === "HomeNest Kitchen" ? staticTitle : `${staticTitle} | ${SUFFIX}`;
  } else {
    // Dynamic shapes first: PDP (both URL shapes), then parameterized
    // order-detail fallbacks, then not-found.
    const pdp = /^\/products\/([^/]+)$/.exec(pathname) ?? /^\/product\/([^/]+)$/.exec(pathname);
    const key = pdp?.[1];
    if (key) {
      const product = products.find((p) => p.slug === key || p.id === key);
      if (product) {
        title = `${product.name} | ${SUFFIX}`;
        jsonLd = productNode(product, pathname);
      } else {
        title = `${humanizeSlug(key)} | ${SUFFIX}`;
      }
    } else if (/^\/account\/orders\//.test(pathname)) {
      title = `${STATIC_TITLES["/account"]} | ${SUFFIX}`;
    } else if (/^\/admin\/orders\//.test(pathname)) {
      title = `${STATIC_TITLES["/admin/orders"]} | ${SUFFIX}`;
    } else {
      title = `Page Not Found | ${SUFFIX}`;
    }
  }

  return {
    title,
    description: SITE_DESCRIPTION,
    canonicalUrl: `${SITE_URL}${pathname}`,
    ogUrl: `${SITE_URL}${pathname}${search}`,
    jsonLd,
  };
}
