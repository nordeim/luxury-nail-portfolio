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
  });
});
