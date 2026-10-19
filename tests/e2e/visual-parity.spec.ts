import { expect, test } from "@playwright/test";

/**
 * Visual parity gate — clone-app-pat-pro doctrine: the gate is MEASURED,
 * never eyeballed. Every assertion pins a computed style on a STABLE
 * selector (aria labels / landmarks, never Tailwind-atomic classes) against
 * the values measured live on the reference (docs/reference-investigation.md
 * §4, Verified via getComputedStyle):
 *
 *   body background   rgb(245,243,239)   (cream)
 *   band / footer     rgb(26,26,26)      (#1A1A1A)
 *   footer body text  rgba(255,255,255,0.8)
 *   display font      "Cormorant Garamond", serif — h1 128px @1920, weight 400
 *   body font         Inter, sans-serif
 *   brand size        24px serif
 *
 * Screenshot diffs stay diagnostics-only; these computed assertions are the
 * acceptance test (clone-app-pat-pro: pixel-diff is never the gate).
 */

test.describe("desktop parity @1920x1080", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("body paints the measured cream ground in Inter", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 243, 239)");
    const font = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain("Inter");
  });

  test("hero display heading is Cormorant Garamond at 128px / 400", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Aurelia" });
    const styles = await h1.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { family: computed.fontFamily, size: computed.fontSize, weight: computed.fontWeight };
    });
    expect(styles.family).toContain("Cormorant Garamond");
    expect(styles.size).toBe("128px");
    expect(styles.weight).toBe("400");
  });

  test("hero fills the viewport with the photographic backdrop", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Introduction" });
    const box = await hero.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(1080);
    await expect(hero.locator("img")).toBeVisible();
  });

  test("philosophy band paints the measured #1A1A1A with white serif quote", async ({ page }) => {
    await page.goto("/");
    const band = page.getByRole("region" /* section */, { name: "" }).or(
      page.locator("section[aria-labelledby='philosophy-title']"),
    );
    const section = page.locator("section[aria-labelledby='philosophy-title']");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveCSS("background-color", "rgb(26, 26, 26)");
    const quote = section.getByRole("heading", { level: 2 });
    const styles = await quote.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { family: computed.fontFamily, color: computed.color };
    });
    expect(styles.family).toContain("Cormorant Garamond");
    expect(styles.color).toBe("rgb(255, 255, 255)");
    void band;
  });

  test("the journey CTA is the dark-on-cream button (measured)", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Book Now" });
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(cta).toHaveCSS("color", "rgb(255, 255, 255)");
  });

  test("footer paints #1A1A1A with white/80 body text", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveCSS("background-color", "rgb(26, 26, 26)");
    const tagline = footer.getByText(/Luxury nail artistry for the discerning client/);
    await expect(tagline).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");
  });

  test("brand wordmark is 24px serif", async ({ page }) => {
    await page.goto("/gallery");
    const brand = page.getByLabel("Aurelia — home");
    const styles = await brand.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { size: computed.fontSize, family: computed.fontFamily };
    });
    expect(styles.size).toBe("24px");
    expect(styles.family).toContain("Cormorant Garamond");
  });

  test("gallery renders all twelve works with captions", async ({ page }) => {
    await page.goto("/gallery");
    const figures = page.locator("figure");
    await expect(figures).toHaveCount(12);
    for (const name of ["Pearl Essence", "Midnight Garden", "Chrome Dreams", "Blush Hour", "Obsidian"]) {
      await expect(page.locator("figcaption").getByText(name)).toBeVisible();
    }
  });

  test("services lists the six verified services with durations", async ({ page }) => {
    await page.goto("/services");
    for (const [name, duration] of [
      ["Signature Manicure", "60 min"],
      ["Luxury Gel Extension", "90 min"],
      ["Bespoke Nail Art", "120 min"],
      ["Bridal Collection", "180 min"],
      ["Chrome & Specialty", "75 min"],
      ["Maintenance & Refill", "60 min"],
    ] as const) {
      const row = page.locator("li").filter({ hasText: name }).first();
      await expect(row).toContainText(duration);
    }
  });
});

test.describe("mobile parity @390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("portfolio stacks to a single column and captions stay visible", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("section[aria-labelledby='portfolio-title'] li");
    await expect(cards).toHaveCount(4);
    const first = cards.first();
    const second = cards.nth(1);
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(firstBox?.y).toBeLessThan(secondBox?.y ?? 0);
    // Same column on mobile: identical x.
    expect(Math.abs((firstBox?.x ?? 0) - (secondBox?.x ?? 0))).toBeLessThan(2);
    // Touch caption (name) is visible without hover — target the mobile
    // caption span, not the hover-overlay duplicate.
    await expect(first.locator("span.font-display")).toBeVisible();
  });

  test("hero heading scales down responsively (72px at 390w)", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Aurelia" });
    await expect(h1).toHaveCSS("font-size", "72px");
  });

  test("no horizontal overflow at any route (mobile usability gate)", async ({ page }) => {
    for (const path of ["/", "/gallery", "/services", "/about", "/booking"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
});
