import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../src/data/catalog";
import { SITE_DESCRIPTION, SITE_URL, buildRouteMeta } from "../src/lib/seo";

/**
 * Per-route head contract (session 8 — SEO workstream).
 *
 * The reference site (nest-culinary-hub.base44.app) ships an inline
 * per-route title map — decoded live 2026-10-12 from its index.html:
 *
 *   "/"            → "HomeNest Kitchen"
 *   "/products"    → "Products | HomeNest Kitchen"
 *   "/track-order" → "Order Tracking | HomeNest Kitchen"   (quirk pinned)
 *   "/terms-of-service" → "Terms Of Service | HomeNest Kitchen" (capital "Of")
 *   "/cart"        → "Cart | HomeNest Kitchen"
 *   ... etc — the full map lives in buildRouteMeta.
 *
 * Two deliberate divergences (registered in PAD §5.6):
 *   - Admin titles drop the reference's "admin/" prefix artifact
 *     ("admin/Admin Dashboard | …" → "Admin Dashboard | …").
 *   - Dynamic routes get real titles (the reference leaves its static title
 *     on PDPs): PDP → "{Product Name} | HomeNest Kitchen", unknown slugs
 *     humanize (ecommerce-store template TITLE-2 pattern), auth pages and
 *     not-found are titled too.
 *
 * The seam is pure so it stays unit-testable in the node environment —
 * HeadManager (App.tsx) merely applies what this returns.
 */

const SUFFIX = "HomeNest Kitchen";

describe("seo constants", () => {
  it("exposes the reference's site description verbatim (brand copy parity)", () => {
    expect(SITE_DESCRIPTION).toBe(
      "Your professional destination for premium kitchen essentials, organized storage solutions, and gourmet cooking tools designed to elevate your culinary experience.",
    );
  });

  it("exposes a SITE_URL with no trailing slash", () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("buildRouteMeta — static reference map", () => {
  const cases: Array<[string, string]> = [
    ["/", "HomeNest Kitchen"],
    ["/home", "HomeNest Kitchen"],
    ["/products", `Products | ${SUFFIX}`],
    ["/cart", `Cart | ${SUFFIX}`],
    ["/checkout", `Checkout | ${SUFFIX}`],
    ["/order-success", `Order Success | ${SUFFIX}`],
    ["/account", `Account | ${SUFFIX}`],
    ["/login", `Sign In | ${SUFFIX}`],
    ["/register", `Create Account | ${SUFFIX}`],
    ["/about", `About | ${SUFFIX}`],
    ["/contact", `Contact | ${SUFFIX}`],
    ["/track-order", `Order Tracking | ${SUFFIX}`],
    ["/privacy-policy", `Privacy Policy | ${SUFFIX}`],
    ["/terms-of-service", `Terms Of Service | ${SUFFIX}`],
    ["/refund-policy", `Refund Policy | ${SUFFIX}`],
    ["/cookie-policy", `Cookie Policy | ${SUFFIX}`],
    ["/disclaimer", `Disclaimer | ${SUFFIX}`],
    ["/admin", `Admin Dashboard | ${SUFFIX}`],
    ["/admin/dashboard", `Admin Dashboard | ${SUFFIX}`],
    ["/admin/products", `Admin Products | ${SUFFIX}`],
    ["/admin/orders", `Admin Orders | ${SUFFIX}`],
    ["/admin/analytics", `Admin Analytics | ${SUFFIX}`],
    ["/admin/categories", `Admin Categories | ${SUFFIX}`],
    ["/admin/carousel", `Admin Carousel | ${SUFFIX}`],
    ["/admin/settings", `Admin Settings | ${SUFFIX}`],
  ];

  it.each(cases)("titles %s as %s", (path, expected) => {
    expect(buildRouteMeta(path, PRODUCTS).title).toBe(expected);
  });

  it("falls back to the parent title for parameterized account/admin orders", () => {
    expect(buildRouteMeta("/account/orders/ORD-123", PRODUCTS).title).toBe(`Account | ${SUFFIX}`);
    expect(buildRouteMeta("/admin/orders/ORD-123", PRODUCTS).title).toBe(`Admin Orders | ${SUFFIX}`);
  });

  it("titles unknown paths as not-found", () => {
    expect(buildRouteMeta("/no-such-page", PRODUCTS).title).toBe(`Page Not Found | ${SUFFIX}`);
  });

  it("ignores query and hash for title lookup", () => {
    expect(buildRouteMeta("/products?category=cookware", PRODUCTS).title).toBe(`Products | ${SUFFIX}`);
    expect(buildRouteMeta("/about#team", PRODUCTS).title).toBe(`About | ${SUFFIX}`);
  });
});

describe("buildRouteMeta — product routes (superset)", () => {
  const product = PRODUCTS[0];
  if (!product) throw new Error("catalog seed is empty");

  it("titles a known slug with the product name", () => {
    expect(buildRouteMeta(`/products/${product.slug}`, PRODUCTS).title).toBe(
      `${product.name} | ${SUFFIX}`,
    );
  });

  it("resolves the /product/:id reference URL shape (by slug or id)", () => {
    expect(buildRouteMeta(`/product/${product.slug}`, PRODUCTS).title).toBe(
      `${product.name} | ${SUFFIX}`,
    );
    expect(buildRouteMeta(`/product/${product.id}`, PRODUCTS).title).toBe(
      `${product.name} | ${SUFFIX}`,
    );
  });

  it("humanizes an unknown slug into the title (template TITLE-2 parity)", () => {
    expect(buildRouteMeta("/products/cast-iron-dutch-oven", PRODUCTS).title).toBe(
      `Cast Iron Dutch Oven | ${SUFFIX}`,
    );
    expect(buildRouteMeta("/product/definitely-not-real", PRODUCTS).title).toBe(
      `Definitely Not Real | ${SUFFIX}`,
    );
  });

  it("decodes percent-encoded slugs before humanizing", () => {
    expect(buildRouteMeta("/products/sous%20vide%20pot", PRODUCTS).title).toBe(
      `Sous Vide Pot | ${SUFFIX}`,
    );
  });
});

describe("buildRouteMeta — canonical + og:url", () => {
  it("canonicalizes to the path without query/hash, absolute", () => {
    const meta = buildRouteMeta("/products?category=cookware#grid", PRODUCTS);
    expect(meta.canonicalUrl).toBe(`${SITE_URL}/products`);
  });

  it("preserves the query on og:url (ecommerce-store METADATA-OG-1 shape)", () => {
    const meta = buildRouteMeta("/products?category=cookware", PRODUCTS);
    expect(meta.ogUrl).toBe(`${SITE_URL}/products?category=cookware`);
  });

  it("keeps canonical and og:url equal on clean paths", () => {
    const meta = buildRouteMeta("/", PRODUCTS);
    expect(meta.canonicalUrl).toBe(`${SITE_URL}/`);
    expect(meta.ogUrl).toBe(`${SITE_URL}/`);
  });
});

describe("buildRouteMeta — PDP Product JSON-LD (template JSON-LD-1 shape)", () => {
  const product = PRODUCTS.find((p) => p.stock > 0 && p.rating > 0);
  const outOfStock = PRODUCTS.find((p) => p.stock === 0);
  if (!product) throw new Error("no in-stock rated product in seed");

  it("emits a Product node with offer, brand, and rating for a known slug", () => {
    const meta = buildRouteMeta(`/products/${product.slug}`, PRODUCTS);
    const node = meta.jsonLd as Record<string, unknown> | null;
    expect(node).not.toBeNull();
    expect(node?.["@context"]).toBe("https://schema.org");
    expect(node?.["@type"]).toBe("Product");
    expect(node?.name).toBe(product.name);
    expect(node?.description).toBe(product.description);
    expect(node?.image).toBe(`${SITE_URL}${product.image}`);

    const brand = node?.brand as Record<string, unknown>;
    expect(brand["@type"]).toBe("Brand");
    expect(brand.name).toBe("HomeNest");

    const offers = node?.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.url).toBe(`${SITE_URL}/products/${product.slug}`);
    expect(offers.price).toBe(product.priceCents / 100);
    expect(offers.priceCurrency).toBe("USD");
    expect(offers.availability).toBe("https://schema.org/InStock");

    const rating = node?.aggregateRating as Record<string, unknown>;
    expect(rating["@type"]).toBe("AggregateRating");
    expect(rating.ratingValue).toBe(product.rating);
    expect(rating.reviewCount).toBe(product.reviewCount);
  });

  it("marks out-of-stock products as OutOfStock", () => {
    if (!outOfStock) return; // seed may keep every product stocked
    const meta = buildRouteMeta(`/products/${outOfStock.slug}`, PRODUCTS);
    const offers = (meta.jsonLd as Record<string, unknown>)?.offers as Record<string, unknown>;
    expect(offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("omits aggregateRating when the product has no rating", () => {
    const unrated = PRODUCTS.find((p) => p.rating === 0);
    if (!unrated) return;
    const meta = buildRouteMeta(`/products/${unrated.slug}`, PRODUCTS);
    expect((meta.jsonLd as Record<string, unknown>)?.aggregateRating).toBeUndefined();
  });

  it("emits no JSON-LD for non-PDP routes", () => {
    expect(buildRouteMeta("/", PRODUCTS).jsonLd).toBeNull();
    expect(buildRouteMeta("/products", PRODUCTS).jsonLd).toBeNull();
    expect(buildRouteMeta("/products/not-a-real-slug", PRODUCTS).jsonLd).toBeNull();
  });
});

describe("buildRouteMeta — description", () => {
  it("carries the site description on every route", () => {
    for (const path of ["/", "/products", "/cart", "/nope"]) {
      expect(buildRouteMeta(path, PRODUCTS).description).toBe(SITE_DESCRIPTION);
    }
  });
});
