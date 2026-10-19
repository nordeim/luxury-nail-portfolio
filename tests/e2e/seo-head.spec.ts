import { expect, test } from "@playwright/test";

/**
 * Per-route head gate (served production bundle).
 *
 * Reference contract (Verified): per-route titles ("Aurelia Nail Artistry" /
 * "Gallery | Aurelia Nail Artistry" / "Booking | Aurelia Nail Artistry").
 * Clone superset: every route titled, canonical + og:url per route, the
 * static index.html carries the NailSalon/WebSite JSON-LD nodes, and the
 * served robots/sitemap artifacts match tests/sitemap.test.ts.
 */

const SITE_URL = process.env.E2E_SITE_URL ?? "http://localhost:4173";

test.describe("served SEO artifacts", () => {
  test("robots.txt is served and disallows private surfaces", async ({ request }) => {
    const response = await request.get(`${SITE_URL}/robots.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /account");
    expect(body).toContain("Sitemap: ");
  });

  test("sitemap.xml is served with the public routes and no private ones", async ({ request }) => {
    const response = await request.get(`${SITE_URL}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain(`${SITE_URL}/gallery`);
    expect(body).toContain(`${SITE_URL}/booking`);
    expect(body).not.toContain("/admin");
    expect(body).not.toContain("/account");
  });
});

test.describe("per-route head contract", () => {
  const cases: Array<[string, string]> = [
    ["/", "Aurelia Nail Artistry"],
    ["/gallery", "Gallery | Aurelia Nail Artistry"],
    ["/services", "Services | Aurelia Nail Artistry"],
    ["/about", "About | Aurelia Nail Artistry"],
    ["/booking", "Booking | Aurelia Nail Artistry"],
    ["/login", "Sign In | Aurelia Nail Artistry"],
  ];

  for (const [path, title] of cases) {
    test(`${path} carries "${title}"`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /Aurelia Nail Artistry/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE_URL}${path}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${SITE_URL}${path}`,
      );
    });
  }

  test("the /home alias canonicalizes to / on the served artifact (R3-03)", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveTitle("Aurelia Nail Artistry");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE_URL}/`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${SITE_URL}/`);
  });

  test("unknown paths ship noindex (soft-404 contract — R3-04)", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page).toHaveTitle("Page Not Found | Aurelia Nail Artistry");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    // Known routes stay indexable.
    await page.goto("/gallery");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  });

  test("a mixed-case route canonicalizes to the sitemap's lowercase form (R4-01)", async ({ page }) => {
    // The router renders /Gallery as the gallery (case-insensitive, reference
    // behavior) but the canonical space has one spelling per page — the
    // lowercase one the sitemap generates.
    await page.goto("/Gallery");
    await expect(page).toHaveTitle("Gallery | Aurelia Nail Artistry");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_URL}/gallery`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${SITE_URL}/gallery`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  });

  test("private surfaces ship noindex on the served artifact (R4-02)", async ({ page }) => {
    // robots.txt disallows these paths, but Disallow matching is
    // case-sensitive — a case-variant URL bypasses it and gets crawled, so
    // the head contract must agree that private surfaces are not for the
    // index (defense in depth).
    await page.goto("/account");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  });

  test("static head completes the social-card meta (R3-02)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1344");
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "768");
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      /manicured hand|nail/i,
    );
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      /manicured hand|nail/i,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");
    // viteSingleFile's base:'./' rewrites root-absolute hrefs to relative
    // (documented in pwa-manifest.spec) — assert the real contract: the
    // link points at the icon file and the file is actually served.
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      /icon-180\.png$/,
    );
    const iconResponse = await page.request.get(`${SITE_URL}/icon-180.png`);
    expect(iconResponse.status()).toBe(200);
  });

  test("SPA navigation updates the title per route (client-side route change)", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Aurelia Nail Artistry");
    // Viewport-dependent affordance: desktop "Primary" nav vs mobile menu.
    const openMenu = page.getByRole("button", { name: "Open menu" });
    if (await openMenu.isVisible()) {
      await openMenu.click();
      await page
        .getByRole("dialog", { name: "Site menu" })
        .getByRole("navigation", { name: "Mobile" })
        .getByRole("link", { name: "Gallery" })
        .click();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Gallery" }).click();
    }
    await expect(page).toHaveURL(/\/gallery$/);
    await expect(page).toHaveTitle("Gallery | Aurelia Nail Artistry");
  });

  test("static head ships the NailSalon and WebSite JSON-LD nodes", async ({ page }) => {
    await page.goto("/");
    const nodes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => JSON.parse(script.textContent ?? "{}")),
    );
    const types = nodes.map((node) => node["@type"]);
    expect(types).toContain("NailSalon");
    expect(types).toContain("WebSite");
    const salon = nodes.find((node) => node["@type"] === "NailSalon");
    expect(salon?.telephone).toBe("+1-310-555-0123");
    expect(salon?.address?.addressLocality).toBe("Los Angeles");
    // R3-06: catalog-derived enrichment — the documented Instagram handle and
    // the structured form of the studio hours (Tu–Sa 10:00–18:00).
    expect(salon?.sameAs).toContain("https://www.instagram.com/aurelia.nails");
    const spec = salon?.openingHoursSpecification?.[0];
    expect(spec?.opens).toBe("10:00");
    expect(spec?.closes).toBe("18:00");
    expect(spec?.dayOfWeek).toContain("Tuesday");
    expect(spec?.dayOfWeek).toContain("Saturday");
    expect(spec?.dayOfWeek).not.toContain("Sunday");
  });
});
