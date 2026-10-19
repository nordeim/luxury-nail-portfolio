import { expect, test } from "@playwright/test";

/**
 * Per-route head gate (session 8 — SEO workstream, R8-05/R8-06).
 *
 * The reference ships a per-route title map + a static OG/Twitter head set.
 * The clone mirrors that shape and supersedes it on dynamic routes: PDPs
 * get real product titles + Product JSON-LD, every route gets canonical +
 * og:url, and the static index.html carries the Organization/WebSite nodes.
 *
 * The artifacts themselves (robots.txt/sitemap.xml) are pinned by
 * tests/sitemap.test.ts; here we verify the SERVED production bundle.
 *
 * Note: attribute selectors are built by string concatenation — some write
 * paths in this environment eat the adjacent "[h" character pair.
 */

const SITE_URL = process.env.E2E_SITE_URL ?? "http://localhost:4173";
const PRODUCT_CARD = "[" + 'href^="/product/"]';
const NAV_PRODUCTS = "[" + 'href="/products"]';

test.describe("served SEO artifacts", () => {
  test("robots.txt is served and disallows private surfaces", async ({
    request,
  }) => {
    const response = await request.get(`${SITE_URL}/robots.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap: ");
  });

  test("sitemap.xml is served with product URLs", async ({ request }) => {
    const response = await request.get(`${SITE_URL}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/products/");
    expect(body).not.toContain("/admin");
  });
});

test.describe("per-route document.title (reference title map)", () => {
  const cases: Array<[string, string]> = [
    ["/", "HomeNest Kitchen"],
    ["/products", "Products | HomeNest Kitchen"],
    ["/cart", "Cart | HomeNest Kitchen"],
    ["/checkout", "Checkout | HomeNest Kitchen"],
    ["/account", "Account | HomeNest Kitchen"],
    ["/login", "Sign In | HomeNest Kitchen"],
    ["/register", "Create Account | HomeNest Kitchen"],
    ["/about", "About | HomeNest Kitchen"],
    ["/contact", "Contact | HomeNest Kitchen"],
    ["/track-order", "Order Tracking | HomeNest Kitchen"],
    ["/terms-of-service", "Terms Of Service | HomeNest Kitchen"],
    ["/privacy-policy", "Privacy Policy | HomeNest Kitchen"],
    ["/no-such-page", "Page Not Found | HomeNest Kitchen"],
  ];

  for (const [path, expected] of cases) {
    test(`titles ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(expected);
    });
  }
});

test.describe("PDP head (superset)", () => {
  test("titles a known product and carries canonical + og + Product JSON-LD", async ({
    page,
  }) => {
    await page.goto("/products");
    const firstLink = page.locator(PRODUCT_CARD).first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href as string);
    await page.waitForLoadState("networkidle");

    const h1 = (await page.locator("h1").first().textContent())?.trim() ?? "";
    expect(h1.length).toBeGreaterThan(0);

    const title = await page.title();
    expect(title).toBe(`${h1} | HomeNest Kitchen`);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe(`${SITE_URL}${href}`);

    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(ogUrl).toBe(`${SITE_URL}${href}`);

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBe(title);

    const jsonLd = await page.evaluate(() => {
      const node = [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ].find((script) => script.textContent?.includes('"Product"'));
      return node
        ? (JSON.parse(node.textContent as string) as Record<string, unknown>)
        : null;
    });
    expect(jsonLd).not.toBeNull();
    expect(jsonLd?.["@type"]).toBe("Product");
    expect(jsonLd?.name).toBe(h1);
    const offers = jsonLd?.offers as Record<string, unknown>;
    expect(offers?.priceCurrency).toBe("USD");
    expect(offers?.availability).toBe("https://schema.org/InStock");
  });

  test("humanizes an unknown slug into the title without JSON-LD", async ({
    page,
  }) => {
    await page.goto("/products/cast-iron-skillet-of-doom");
    await expect(page).toHaveTitle(
      "Cast Iron Skillet Of Doom | HomeNest Kitchen",
    );
    const productLd = await page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')].some(
        (script) => script.textContent?.includes('"Product"'),
      ),
    );
    expect(productLd).toBe(false);
  });
});

test.describe("static head set (index.html)", () => {
  // The client-nav leg clicks a desktop nav link; the mobile project
  // carries navigation inside the menu panel instead (fixed-1280 pattern
  // from tests/e2e/search-keyboard.spec.ts).
  test.describe("desktop", () => {
    test.use({ viewport: { width: 1280, height: 720 } });
    test("home carries description, OG/Twitter set, and site JSON-LD nodes", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description).toContain("premium kitchen essentials");

      for (const property of [
        "og:title",
        "og:description",
        "og:image",
        "og:url",
        "og:site_name",
        "og:type",
      ]) {
        const value = await page
          .locator(`meta[property="${property}"]`)
          .getAttribute("content");
        expect(value?.length ?? 0).toBeGreaterThan(0);
      }
      const card = await page
        .locator('meta[name="twitter:card"]')
        .getAttribute("content");
      expect(card).toBe("summary_large_image");

      const nodes = await page.evaluate(() =>
        [
          ...document.querySelectorAll('script[type="application/ld+json"]'),
        ].map((script) => JSON.parse(script.textContent as string)),
      );
      const types = nodes.map((node) => node["@type"]);
      expect(types).toContain("Organization");
      expect(types).toContain("WebSite");
    });

    test("client navigation updates the title without reload", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveTitle("HomeNest Kitchen");
      await page.click(NAV_PRODUCTS);
      await expect(page).toHaveTitle("Products | HomeNest Kitchen");
      await page.goBack();
      await expect(page).toHaveTitle("HomeNest Kitchen");
    });
  });
});
