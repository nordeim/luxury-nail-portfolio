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
 * <lastmod> (R3-01, parity with the ecommerce-store template's sitemap.ts
 * which carries lastModified): every entry gets the latest Y-m-d commit
 * date across content-affecting paths (catalog, pages, tokens, head,
 * imagery) — deterministic per content state, never a build timestamp
 * (that would churn per rebuild and train crawlers to distrust it). When
 * git metadata is unavailable (tarball builds), <lastmod> is omitted
 * entirely — a valid sitemap either way; the skip is logged loudly.
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
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
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



// path, changefreq, priority — mirrors the ecommerce-store template.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1" },
  { path: "/gallery", changefreq: "weekly", priority: "0.9" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/booking", changefreq: "monthly", priority: "0.8" },
  { path: "/login", changefreq: "yearly", priority: "0.2" },
  { path: "/register", changefreq: "yearly", priority: "0.2" },
];

const DISALLOWED = ["/admin", "/account", "/reset"];

// Paths whose last change dates the site's content (add a path when its
// edits should refresh the sitemap's lastmod).
const CONTENT_PATHS = [
  "src/data/studio.ts",
  "src/pages/",
  "src/index.css",
  "index.html",
  "public/images/",
];

/** Latest Y-m-d committer date across CONTENT_PATHS, or null when git
 *  metadata is unavailable (non-git checkout) — callers omit <lastmod>. */
function contentLastmod() {
  try {
    const out = execSync(
      `git log -1 --format=%cs -- ${CONTENT_PATHS.map((p) => JSON.stringify(p)).join(" ")}`,
      { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

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

function sitemapXml(lastmod) {
  const urls = STATIC_ROUTES.map((route) => ({ loc: `${SITE_URL}${route.path}`, ...route }));
  const body = urls
    .map(
      (url) =>
        "    <url>\n" +
        `        <loc>${escapeXml(url.loc)}</loc>\n` +
        `        <changefreq>${url.changefreq}</changefreq>\n` +
        `        <priority>${url.priority}</priority>\n` +
        (lastmod ? `        <lastmod>${lastmod}</lastmod>\n` : "") +
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

const lastmod = contentLastmod();
if (!lastmod) {
  console.error("seo: git metadata unavailable — sitemap written WITHOUT <lastmod>");
}
writeFileSync(join(ROOT, "public", "robots.txt"), robotsXml());
writeFileSync(join(ROOT, "public", "sitemap.xml"), sitemapXml(lastmod));
console.log(
  `seo: wrote public/robots.txt + public/sitemap.xml (${SITE_URL}) — ${STATIC_ROUTES.length} static URLs` +
    (lastmod ? `, lastmod ${lastmod}` : ", no lastmod"),
);
