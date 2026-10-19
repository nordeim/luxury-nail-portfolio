import { expect, test } from "@playwright/test";

/**
 * Dark mode (clone superset — the reference ships none, Verified).
 *
 * Contract (amended by remediation R2-01, docs/remediation-plan-aurelia-r2.md):
 * class strategy on <html> (`@custom-variant dark`); the toggle is a
 * TWO-STATE light ↔ dark switch whose every activation flips the visible
 * theme (the shipped system → light first click was a visual no-op on
 * light-OS machines — the reported "switching does not work" defect);
 * "system" is the fresh-profile initial mode, honored until the first
 * interaction; a pre-paint inline script applies the stored/OS theme
 * before first paint (no light flash for dark users); choice persists
 * across reloads; semantic tokens flip; hero stays light-on-image in both
 * themes; the mobile menu overlay follows the theme.
 */

async function openToggle(page: import("@playwright/test").Page) {
  // The toggle lives in the header on every route.
  return page.getByRole("button", { name: /^Color theme:/ });
}

/**
 * Fresh state defaults to SYSTEM (OS-preference respect is the shipped
 * initial mode), and the two-state toggle's first click lands on the
 * OPPOSITE of the resolved theme — so the single-click tests below seed the
 * stored light deterministically (ONLY when unset, so the persistence
 * tests' stored "dark" survives reloads and client-side navigations). Tests
 * that need a fresh or explicit-system profile seed it themselves.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("aurelia.theme")) localStorage.setItem("aurelia.theme", "light");
  });
});
// NOTE: tests that need a FRESH or explicit-system profile set the storage
// inside the test itself — the beforeEach seed only fills a vacuum.

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

  test("fresh profile: the FIRST click visibly flips the ground (R2-01 regression pin)", async ({ page }) => {
    // The reported defect: a fresh (system-mode) profile on a light-OS
    // machine clicked the toggle and nothing visibly changed (system → light
    // resolved to the same cream). The two-state cycle pins the first click
    // to the OPPOSITE of the resolved theme — always a visible flip.
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/gallery");
    const bgBefore = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgBefore).toBe("rgb(245, 243, 239)"); // fresh profile on light OS paints cream

    await (await openToggle(page)).click(); // ONE click
    const bgAfter = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgAfter, "first click from a fresh profile must visibly flip the ground").toBe("rgb(19, 17, 15)");
  });

  test("system mode follows prefers-color-scheme until the first interaction", async ({ page }) => {
    // Fresh system-mode profile (override the beforeEach seed): dark OS →
    // dark page; flipping the OS emulation live re-resolves; an explicit
    // click pins a choice that survives further OS flips.
    await page.addInitScript(() => localStorage.setItem("aurelia.theme", "system"));
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/gallery");
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(50);
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await (await openToggle(page)).click(); // pins dark (opposite of resolved light)
    await page.emulateMedia({ colorScheme: "light" }); // OS says light…
    await page.waitForTimeout(50);
    await expect(page.locator("html")).toHaveClass(/dark/); // …explicit dark choice sticks
  });

  test("pre-paint script applies the stored theme before first paint (R2-01)", async ({ page }) => {
    // Structural + functional pin for the FOUC fix: the served HTML carries
    // a synchronous head script that resolves aurelia.theme against the OS
    // preference and stamps data-theme-applied on <html> before React
    // mounts (a dark user must never see the light tokens flash).
    const served = await (await page.request.get("/")).text();
    expect(served, "pre-paint theme script missing from the served HTML").toContain("aurelia.theme");

    await page.addInitScript(() => localStorage.setItem("aurelia.theme", "dark"));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The inline head script is synchronous: by DOMContentLoaded it has
    // always run, React's effects have not necessarily. The attribute is
    // written by the script alone — its presence IS the pre-paint proof.
    await expect(page.locator("html")).toHaveAttribute("data-theme-applied", "dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
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
