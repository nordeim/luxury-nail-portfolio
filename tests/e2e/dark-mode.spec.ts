import { expect, test } from "@playwright/test";

/**
 * Dark mode (clone superset — the reference ships none, Verified).
 *
 * Contract: class strategy on <html> (`@custom-variant dark`), toggle cycles
 * light → dark → system, choice persists across reloads, semantic tokens
 * flip (background/foreground/band), the hero photographic treatment stays
 * light-on-image in BOTH themes (static hero tokens), and the mobile menu
 * overlay follows the theme.
 */

async function openToggle(page: import("@playwright/test").Page) {
  // The toggle lives in the header on every route.
  return page.getByRole("button", { name: /^Color theme:/ });
}

/**
 * Fresh state defaults to SYSTEM (OS-preference respect is the shipped
 * default), so the cycle on a clean profile starts system → light → dark.
 * The single-click tests below pin the light → dark segment deterministically
 * by seeding the stored mode — ONLY when unset, so the persistence tests'
 * stored "dark" survives reloads and client-side navigations. The system-mode
 * test exercises the real cycle explicitly.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("aurelia.theme")) localStorage.setItem("aurelia.theme", "light");
  });
});

test.describe("dark mode", () => {
  test("toggle cycles light → dark and flips the html class + tokens", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    const toggle = await openToggle(page);
    await toggle.click(); // light → dark (seeded light; fresh profiles start at system)
    await expect(page.locator("html")).toHaveClass(/dark/);

    const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(19, 17, 15)"); // #13110f — hex-pinned dark ground
  });

  test("choice persists across reload", async ({ page }) => {
    await page.goto("/gallery");
    await (await openToggle(page)).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: /^Color theme: dark/ })).toBeVisible();
  });

  test("band surfaces invert: footer becomes cream on the dark ground", async ({ page }) => {
    await page.goto("/");
    await (await openToggle(page)).click();
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveCSS("background-color", "rgb(245, 243, 239)");
    const tagline = footer.getByText(/Luxury nail artistry for the discerning client/);
    await expect(tagline).toHaveCSS("color", "rgba(19, 17, 15, 0.7)");
  });

  test("hero overlay copy stays light over the photograph in both themes", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Aurelia" });
    await expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
    await (await openToggle(page)).click();
    await expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
  });

  test("mobile menu overlay follows the theme", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await (await openToggle(page)).click();
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toHaveCSS("background-color", "rgb(19, 17, 15)");
  });

  test("system mode follows prefers-color-scheme", async ({ page }) => {
    // Seeded light; cycle twice: light → dark → system. Then emulate dark at
    // the OS level.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/gallery");
    await (await openToggle(page)).click(); // light → dark
    await (await openToggle(page)).click(); // dark → system (dark per emulation)
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(50);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("all routes stay coherent in dark mode (no unreadable surfaces)", async ({ page }) => {
    await page.goto("/gallery");
    await (await openToggle(page)).click();
    for (const path of ["/", "/services", "/about", "/booking", "/login"]) {
      await page.goto(path);
      const bodyBg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bodyBg, `${path} did not flip to the dark ground`).toBe("rgb(19, 17, 15)");
    }
  });
});
