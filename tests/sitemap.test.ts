import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../src/data/catalog";
import { SITE_URL } from "../src/lib/seo";

/**
 * Robots + sitemap contract (session 8 — SEO workstream).
 *
 * The committed `public/robots.txt` and `public/sitemap.xml` are generated
 * by `scripts/generate-sitemap.mjs` (run: `node scripts/generate-sitemap.mjs`
 * — `npm run build` runs it via prebuild). Vite copies `public/` verbatim
 * into `dist/`, so the production single-file bundle serves both.
 *
 * Superset posture vs the live reference (probed 2026-10-12):
 *   - the reference's robots.txt disallows nothing and its sitemap lists
 *     /admin/*, /account, /cart, /checkout — private surfaces SHOULD NOT be
 *     in robots-reachable sitemaps; ours disallows and excludes them.
 *   - the reference's sitemap carries ZERO product URLs; ours carries every
 *     visible catalog product as /products/{slug}.
 *   - priorities/frequencies follow the ecommerce-store template's sitemap.ts.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROBOTS = readFileSync(join(ROOT, "public", "robots.txt"), "utf8");
const SITEMAP = readFileSync(join(ROOT, "public", "sitemap.xml"), "utf8");

interface SitemapEntry {
  loc: string;
  changefreq: string;
  priority: string;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of blocks) {
    const loc = /<loc>\s*([^<]*?)\s*<\/loc>/.exec(block)?.[1];
    const changefreq = /<changefreq>\s*([^<]*?)\s*<\/changefreq>/.exec(block)?.[1] ?? "";
    const priority = /<priority>\s*([^<]*?)\s*<\/priority>/.exec(block)?.[1] ?? "";
    if (loc) entries.push({ loc, changefreq, priority });
  }
  return entries;
}

const entries = parseSitemap(SITEMAP);
const locs = entries.map((e) => e.loc);

describe("public/robots.txt", () => {
  it("allows all user agents", () => {
    expect(ROBOTS).toMatch(/User-agent:\s*\*/);
    expect(ROBOTS).toMatch(/Allow:\s*\/(?!\w)/);
  });

  it("disallows private surfaces (improvement over the reference)", () => {
    for (const path of ["/admin", "/account", "/cart", "/checkout", "/order-success"]) {
      expect(ROBOTS).toContain(`Disallow: ${path}`);
    }
  });

  it("points at the sitemap", () => {
    expect(ROBOTS).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe("public/sitemap.xml — structure", () => {
  it("is a well-formed urlset with entries", () => {
    expect(SITEMAP).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(SITEMAP).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(SITEMAP.trim().endsWith("</urlset>")).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("uses one consistent origin (SITE_URL) everywhere", () => {
    const origins = new Set(locs.map((loc) => new URL(loc).origin));
    expect([...origins]).toEqual([SITE_URL]);
  });

  it("carries valid changefreq + priority pairs", () => {
    const freqs = new Set(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]);
    for (const entry of entries) {
      expect(freqs.has(entry.changefreq), entry.loc).toBe(true);
      expect(Number(entry.priority)).toBeGreaterThanOrEqual(0);
      expect(Number(entry.priority)).toBeLessThanOrEqual(1);
    }
  });
});

describe("public/sitemap.xml — static routes (template sitemap.ts pattern)", () => {
  const staticCases: Array<[string, string, string]> = [
    ["/", "1", "daily"],
    ["/products", "0.9", "daily"],
    ["/about", "0.5", "monthly"],
    ["/contact", "0.5", "monthly"],
    ["/track-order", "0.5", "monthly"],
    ["/privacy-policy", "0.3", "monthly"],
    ["/terms-of-service", "0.3", "monthly"],
    ["/refund-policy", "0.3", "monthly"],
    ["/cookie-policy", "0.3", "monthly"],
    ["/disclaimer", "0.3", "monthly"],
    ["/login", "0.2", "yearly"],
    ["/register", "0.2", "yearly"],
  ];

  it.each(staticCases)("includes %s at priority %s (%s)", (path, priority, freq) => {
    const entry = entries.find((e) => e.loc === `${SITE_URL}${path}`);
    expect(entry, `${path} missing from sitemap`).toBeDefined();
    expect(entry?.priority).toBe(priority);
    expect(entry?.changefreq).toBe(freq);
  });
});

describe("public/sitemap.xml — catalog consistency (R8-03 gate)", () => {
  it("lists every visible product as /products/{slug} at priority 0.8 weekly", () => {
    const visible = PRODUCTS.filter((p) => p.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const product of visible) {
      const entry = entries.find((e) => e.loc === `${SITE_URL}/products/${product.slug}`);
      expect(entry, `${product.slug} missing from sitemap`).toBeDefined();
      expect(entry?.priority).toBe("0.8");
      expect(entry?.changefreq).toBe("weekly");
    }
    const pdpEntries = entries.filter((e) => e.loc.startsWith(`${SITE_URL}/products/`));
    expect(pdpEntries).toHaveLength(visible.length);
  });

  it("excludes private surfaces (the reference wrongly lists them)", () => {
    for (const prefix of ["/admin", "/account", "/cart", "/checkout", "/order-success"]) {
      expect(locs.some((loc) => new URL(loc).pathname.startsWith(prefix)), prefix).toBe(false);
    }
  });
});
