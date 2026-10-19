import { expect, test } from "@playwright/test";

/**
 * R18-01 — PWA manifest superset (session 18).
 *
 * The reference site ships NO web app manifest: its head carries no
 * <link rel="manifest">, and /manifest.webmanifest (or /site.webmanifest)
 * is answered by the SPA catch-all with text/html. The clone supersedes
 * that with a valid, minimal manifest — zero visual footprint, additive
 * installability (Chrome install criteria: 192px + 512px icons, name,
 * start_url, display).
 *
 * Icons reuse the established FAVICON-1 precedent: the reference's own
 * media-CDN logo at the two install-required sizes (no shipped binary).
 * theme/background colors mirror the pinned canvas #fbfaf9.
 */

const SITE_URL = process.env.E2E_SITE_URL ?? "http://localhost:4173";

test.describe("served PWA manifest (superset)", () => {
  test("manifest.webmanifest is served with the manifest MIME type", async ({
    request,
  }) => {
    const response = await request.get(`${SITE_URL}/manifest.webmanifest`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "application/manifest+json",
    );
  });

  test("manifest carries the install-required members and icon sizes", async ({
    request,
  }) => {
    const response = await request.get(`${SITE_URL}/manifest.webmanifest`);
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      name?: string;
      short_name?: string;
      start_url?: string;
      scope?: string;
      display?: string;
      theme_color?: string;
      background_color?: string;
      icons?: Array<{ src?: string; sizes?: string; type?: string }>;
    };

    expect(manifest.name).toBe("HomeNest Kitchen");
    expect(manifest.short_name).toBe("HomeNest");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#fbfaf9");
    expect(manifest.background_color).toBe("#fbfaf9");

    const icons = manifest.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of icons) {
      // Absolute CDN URL per the FAVICON-1 precedent (no shipped binary).
      expect(icon.src).toMatch(/^https?:\/\//);
      expect(icon.type).toBe("image/png");
    }
  });

  test("the static head links the manifest from deep routes too", async ({
    page,
  }) => {
    // viteSingleFile forces base './', which would rewrite a root-absolute
    // manifest href to a relative one. On a 2-segment route that relative
    // href resolves under /products/ and 404s — pin the root-absolute form
    // exactly there, plus on the home route.
    await page.goto("/products");
    const firstLink = page.locator('[' + 'href^="/product/"]').first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href as string);

    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", "/manifest.webmanifest");

    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
  });
});
