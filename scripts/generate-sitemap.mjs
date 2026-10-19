#!/usr/bin/env node
/**
 * Generates public/robots.txt + public/sitemap.xml (session 8 — SEO).
 *
 * Run manually:  node scripts/generate-sitemap.mjs
 * Runs automatically before every production build via the "prebuild" hook.
 *
 * Vite copies public/ verbatim into dist/, so the single-file production
 * bundle serves both artifacts next to index.html.
 *
 * Site origin: VITE_SITE_URL (must match src/lib/seo.ts — both default to
 * http://localhost:4173). Change it there AND here, then commit the
 * refreshed artifacts; tests/sitemap.test.ts gates the committed output
 * against the real catalog (R8-03).
 *
 * Posture (superset vs the live reference, probed 2026-10-12):
 *   - private surfaces (/admin, /account, /cart, /checkout,
 *     /order-success) are DISALLOWED and EXCLUDED — the reference's
 *     robots.txt disallows nothing and its sitemap lists /admin/*.
 *   - every visible catalog product is listed as /products/{slug} — the
 *     reference's sitemap carries zero product URLs.
 *   - priorities/frequencies follow the ecommerce-store template's
 *     src/app/sitemap.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = (process.env.VITE_SITE_URL ?? "http://localhost:4173").replace(/\/+$/, "");

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/** Extract visible product slugs from src/data/catalog.ts.
 *  Product objects are brace-free inside (arrays only), so a flat object
  * scan is safe; tests/sitemap.test.ts cross-checks the output against the
  * real catalog import, so any drift fails the gate. */
function visibleSlugs() {
  const source = readFileSync(join(ROOT, "src", "data", "catalog.ts"), "utf8");
  const objects = source.match(/\{[^{}]*\}/gs) ?? [];
  const slugs = [];
  for (const object of objects) {
    const slug = /(?:^|[,{\n]\s*)slug:\s*"([^"]+)"/.exec(object)?.[1];
    if (!slug) continue;
    if (/visible:\s*false/.test(object)) continue;
    slugs.push(slug);
  }
  return slugs;
}

// path, changefreq, priority — mirrors the ecommerce-store template.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "monthly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/cookie-policy", changefreq: "monthly", priority: "0.3" },
  { path: "/disclaimer", changefreq: "monthly", priority: "0.3" },
  { path: "/login", changefreq: "yearly", priority: "0.2" },
  { path: "/register", changefreq: "yearly", priority: "0.2" },
];

const DISALLOWED = ["/admin", "/account", "/cart", "/checkout", "/order-success"];

function robotsXml() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...DISALLOWED.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ];
  return lines.join("\n");
}

function sitemapXml(slugs) {
  const urls = [
    ...STATIC_ROUTES.map((route) => ({ loc: `${SITE_URL}${route.path}`, ...route })),
    ...slugs.map((slug) => ({
      loc: `${SITE_URL}/products/${slug}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];
  const body = urls
    .map(
      (url) =>
        "    <url>\n" +
        `        <loc>${escapeXml(url.loc)}</loc>\n` +
        `        <changefreq>${url.changefreq}</changefreq>\n` +
        `        <priority>${url.priority}</priority>\n` +
        "    </url>",
    )
    .join("\n");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    "\n</urlset>\n"
  );
}

const slugs = visibleSlugs();
writeFileSync(join(ROOT, "public", "robots.txt"), robotsXml());
writeFileSync(join(ROOT, "public", "sitemap.xml"), sitemapXml(slugs));
console.log(`seo: wrote public/robots.txt + public/sitemap.xml (${SITE_URL}) — ${STATIC_ROUTES.length} static + ${slugs.length} product URLs`);
