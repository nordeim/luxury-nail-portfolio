import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SITE_URL } from "../src/lib/seo";

/**
 * Robots + sitemap contract.
 *
 * The committed `public/robots.txt` and `public/sitemap.xml` are generated
 * by `scripts/generate-sitemap.mjs` (run: `node scripts/generate-sitemap.mjs`
 * — `npm run build` runs it via prebuild). Vite copies `public/` verbatim
 * into `dist/`, so the production single-file bundle serves both.
 *
 * Posture vs the live reference (docs/reference-investigation.md): the
 * reference demo exposes no robots/sitemap contract worth pinning; the clone
 * ships the superset — private surfaces disallowed, every public route
 * listed, none of the auth/reset surfaces crawlable.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROBOTS = readFileSync(join(ROOT, "public", "robots.txt"), "utf8");
const SITEMAP = readFileSync(join(ROOT, "public", "sitemap.xml"), "utf8");

interface SitemapEntry {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod: string;
}

function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  for (const block of blocks) {
    const loc = /<loc>\s*([^<]*?)\s*<\/loc>/.exec(block)?.[1];
    const changefreq = /<changefreq>\s*([^<]*?)\s*<\/changefreq>/.exec(block)?.[1] ?? "";
    const priority = /<priority>\s*([^<]*?)\s*<\/priority>/.exec(block)?.[1] ?? "";
    const lastmod = /<lastmod>\s*([^<]*?)\s*<\/lastmod>/.exec(block)?.[1] ?? "";
    if (loc) entries.push({ loc, changefreq, priority, lastmod });
  }
  return entries;
}

const entries = parseSitemap(SITEMAP);
const locs = entries.map((entry) => entry.loc);

describe("public/robots.txt", () => {
  it("allows the public site and disallows private surfaces", () => {
    expect(ROBOTS).toContain("Allow: /");
    expect(ROBOTS).toContain("Disallow: /admin");
    expect(ROBOTS).toContain("Disallow: /account");
    expect(ROBOTS).toContain("Disallow: /reset");
  });

  it("points at the canonical sitemap", () => {
    expect(ROBOTS).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe("public/sitemap.xml", () => {
  it("lists every public route exactly once", () => {
    for (const path of ["/", "/gallery", "/services", "/about", "/booking", "/login", "/register"]) {
      expect(locs).toContain(`${SITE_URL}${path}`);
    }
    const unique = new Set(locs);
    expect(unique.size).toBe(locs.length);
  });

  it("never lists private surfaces", () => {
    for (const loc of locs) {
      expect(loc).not.toMatch(/\/(admin|account|reset)/);
    }
  });

  it("prioritizes the landing page above the rest", () => {
    const home = entries.find((entry) => entry.loc === `${SITE_URL}/`);
    expect(home?.priority).toBe("1");
  });

  it("is well-formed XML with a single urlset", () => {
    expect(SITEMAP).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(SITEMAP.match(/<urlset /g)?.length).toBe(1);
    expect(SITEMAP.endsWith("</urlset>\n")).toBe(true);
  });

  it("carries a W3C lastmod on every URL (R3-01 — template parity)", () => {
    // The ecommerce-store template's sitemap carries lastModified; the
    // generator projects the latest content-commit date onto every entry.
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("derives lastmod from content, never from the future", () => {
    const values = new Set(entries.map((entry) => entry.lastmod));
    // One content date for the whole static site (deterministic per tree).
    expect(values.size).toBe(1);
    const [lastmod] = values;
    const today = new Date().toISOString().slice(0, 10);
    expect(BigInt(lastmod.replaceAll("-", ""))).toBeLessThanOrEqual(BigInt(today.replaceAll("-", "")));
  });
});
