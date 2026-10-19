import { useEffect } from "react";
import { PRODUCTS } from "@/data/catalog";
import { useRouter } from "@/lib/router";
import { buildRouteMeta } from "@/lib/seo";

/**
 * Applies the per-route head contract (session 8 — SEO workstream).
 *
 * `src/lib/seo.ts` is the pure seam (unit-pinned by tests/seo.test.ts);
 * this component merely writes what `buildRouteMeta` returns:
 *   - document.title — the reference's per-route title map (decoded live
 *     2026-10-12), extended to dynamic routes (PDP product titles,
 *     humanized unknown slugs, auth/not-found pages).
 *   - meta description, canonical link, og/twitter title+description+url.
 *   - a scoped `#route-jsonld` script carrying the schema.org Product node
 *     on resolved PDPs — removed everywhere else (one node per script).
 *
 * The static fallbacks in index.html cover first paint and no-JS crawlers;
 * this effect takes over on every route change (including popstate — the
 * router's location state drives it).
 */

const ROUTE_JSONLD_ID = "route-jsonld";

function upsertMeta(selector: string, create: () => HTMLMetaElement, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function writeRouteJsonLd(node: Record<string, unknown> | null): void {
  const existing = document.head.querySelector<HTMLScriptElement>(`#${ROUTE_JSONLD_ID}`);
  if (!node) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement("script");
  if (!existing) {
    script.id = ROUTE_JSONLD_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(node);
}

export function HeadManager() {
  const { path, search } = useRouter();

  useEffect(() => {
    const meta = buildRouteMeta(`${path}${search}`, PRODUCTS);

    document.title = meta.title;

    upsertMeta(
      'meta[name="description"]',
      () => document.createElement("meta"),
      meta.description,
    );
    upsertMeta('meta[property="og:title"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("property", "og:title");
      return el;
    }, meta.title);
    upsertMeta('meta[property="og:description"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("property", "og:description");
      return el;
    }, meta.description);
    upsertMeta('meta[property="og:url"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("property", "og:url");
      return el;
    }, meta.ogUrl);
    upsertMeta('meta[name="twitter:title"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("name", "twitter:title");
      return el;
    }, meta.title);
    upsertMeta('meta[name="twitter:description"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("name", "twitter:description");
      return el;
    }, meta.description);
    upsertMeta('meta[name="twitter:url"]', () => {
      const el = document.createElement("meta");
      el.setAttribute("name", "twitter:url");
      return el;
    }, meta.ogUrl);

    upsertCanonical(meta.canonicalUrl);
    writeRouteJsonLd(meta.jsonLd);
  }, [path, search]);

  return null;
}
