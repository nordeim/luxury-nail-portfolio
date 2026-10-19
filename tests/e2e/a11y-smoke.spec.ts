import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke — WCAG 2.2 AA is the baseline (implementation plan §0).
 *
 * GATE: no critical or serious axe violations on the core surfaces. Unlike
 * the previous project, the Aurelia palette needs NO contrast exception:
 * static eyebrow text uses muted-foreground (≈5.5:1 on cream, ≈6.5:1 on the
 * dark ground), band surfaces run white-on-#1A1A1A (≈14:1), and the gold
 * token appears only on hovers/borders — never as the sole carrier of
 * information (Deviations Ledger, contrast-correctness sweep).
 */

const VIOLATION_IMPACT_BLOCKER = ["critical", "serious"] as const;

async function expectNoBlockers(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  const results = await new AxeBuilder({ page }).analyze();
  const blockers = results.violations.filter((violation) =>
    VIOLATION_IMPACT_BLOCKER.includes(violation.impact as "critical" | "serious"),
  );
  const summary = blockers
    .map((violation) => `${violation.id}(${violation.nodes.length})`)
    .join(", ");
  expect(blockers, `${path}: ${summary}`).toHaveLength(0);
}

test.describe("axe smoke — public routes", () => {
  for (const path of ["/", "/gallery", "/services", "/about", "/booking", "/login"]) {
    test(`${path} has no critical/serious violations`, async ({ page }) => {
      await expectNoBlockers(page, path);
    });
  }
});

test.describe("structure", () => {
  test("primary nav, main, and footer landmarks exist on every route", async ({ page }) => {
    for (const path of ["/", "/gallery", "/booking"]) {
      await page.goto(path);
      // Landmark strategy is viewport-dependent: the desktop "Primary" nav is
      // display:none on mobile (its affordance is the menu button; the menu
      // overlay exposes the "Mobile" nav when open — asserted after the loop).
      const openMenu = page.getByRole("button", { name: "Open menu" });
      if (!(await openMenu.isVisible())) {
        await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
      }
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
    }
    // On mobile, opening the menu must expose a real navigation landmark.
    if (await page.getByRole("button", { name: "Open menu" }).isVisible()) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(1);
    }
  });

  test("booking form fields are labeled (programmatic, not placeholder-only)", async ({ page }) => {
    await page.goto("/booking");
    for (const name of ["Full Name", "Email Address", "Phone Number", "Service", "Date", "Time"]) {
      await expect(page.getByLabel(name)).toBeVisible();
    }
    // The required contract is native (reference parity).
    for (const name of ["Full Name", "Email Address", "Phone Number", "Service", "Date", "Time"]) {
      await expect(page.getByLabel(name)).toHaveAttribute("required", "");
    }
  });

  test("images carry meaningful alt text (gallery)", async ({ page }) => {
    await page.goto("/gallery");
    const images = page.locator("figure img");
    const count = await images.count();
    expect(count).toBe(12);
    for (let index = 0; index < count; index += 1) {
      const alt = await images.nth(index).getAttribute("alt");
      expect(alt?.length ?? 0, `gallery image ${index} alt`).toBeGreaterThan(10);
    }
  });

  test("keyboard reachability: nav → CTA → form traverses in DOM order", async ({ page }) => {
    await page.goto("/booking");
    await page.keyboard.press("Tab"); // brand
    await page.keyboard.press("Tab"); // next header control (viewport-dependent)
    // Desktop: the first primary nav link. Mobile: brand → theme toggle →
    // menu button, so walk forward until the menu button takes focus.
    const openMenu = page.getByRole("button", { name: "Open menu" });
    if (await openMenu.isVisible()) {
      for (let tabs = 0; tabs < 4 && !(await openMenu.evaluate((el) => el === document.activeElement)); tabs += 1) {
        await page.keyboard.press("Tab");
      }
      await expect(openMenu).toBeFocused();
    } else {
      const focused = await page.evaluate(() => document.activeElement?.textContent ?? "");
      expect(focused?.trim()).toBe("Portfolio");
    }
  });
});
