import { expect, test } from "@playwright/test";

/**
 * Mobile navigation — the parity-critical surface (user-flagged bug class).
 *
 * Reference behavior (measured live 2026-10-19 on
 * aurelia-nail-artistry-demo.base44.app at 390x844, Verified):
 *   - hamburger opens a FULL-SCREEN cream overlay (not a drawer),
 *   - brand top-left, close (X) top-right,
 *   - large serif links stacked: Portfolio, Gallery, Services, About, Book,
 *   - a link tap navigates AND dismisses the overlay,
 *   - no search surface in the menu.
 *
 * Regression pins carried from the Tailwind v4 trap log
 * (docs/Tailwind-V4-Validation-Report.md):
 *   - TRAP 4 — space-y/mt specificity: v4's `:where(.space-y-1 > :not(:last-child))`
 *     contributes zero specificity, so an `mt-3` child of a space-y container
 *     resurrects a 12px gap where the v3 engine overrode it to 4px. The menu
 *     panel therefore uses gap-* layout and its links must compute ZERO
 *     margin-top — pinned here.
 *   - TRAP 5 — containing block: the menu is portaled to <body> (never a
 *     fixed descendant of the header).
 *   - A11y: dialog semantics, focus trap, Escape close, focus restore.
 */

test.use({ viewport: { width: 390, height: 844 } });

async function openMenu(page: import("@playwright/test").Page) {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open menu" });
  await expect(open).toBeVisible();
  await open.click();
  return page.getByRole("dialog", { name: "Site menu" });
}

test("hamburger opens the full-screen overlay with brand, close, and serif links", async ({ page }) => {
  const dialog = await openMenu(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Aurelia — home")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close menu" })).toBeVisible();
  for (const label of ["Portfolio", "Gallery", "Services", "About", "Book"]) {
    await expect(dialog.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(dialog.getByRole("link", { name: "Sign In" })).toBeVisible();
});

test("overlay fills the viewport and paints the background surface", async ({ page }) => {
  const dialog = await openMenu(page);
  const box = await dialog.boundingBox();
  expect(box?.width).toBe(390);
  expect(box?.height).toBe(844);
  // Light theme background — the reference's full-screen cream overlay.
  await expect(dialog).toHaveCSS("background-color", "rgb(245, 243, 239)");
});

test("TRAP-4 pin: menu links carry zero margin-top (gap layout, no resurrected mt-*)", async ({ page }) => {
  const dialog = await openMenu(page);
  const links = dialog.getByRole("navigation", { name: "Mobile" }).getByRole("link");
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(6);
  // With gap-based stacking every link computes margin-top: 0px. A stray
  // mt-* inside a space-y container would resurrect 12px in v4 (trap 4).
  for (let index = 0; index < count; index += 1) {
    await expect(links.nth(index)).toHaveCSS("margin-top", "0px");
  }
});

test("link tap navigates and dismisses the overlay", async ({ page }) => {
  const dialog = await openMenu(page);
  await dialog.getByRole("link", { name: "Gallery", exact: true }).click();
  await expect(page).toHaveURL(/\/gallery$/);
  await expect(page.getByRole("heading", { name: "Gallery", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
});

test("Escape closes the overlay without navigating", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("close button returns to the page with the trigger reset", async ({ page }) => {
  await openMenu(page);
  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("body scroll locks while open and unlocks after close", async ({ page }) => {
  const dialog = await openMenu(page);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await dialog.getByRole("button", { name: "Close menu" }).click();
  await expect(page.locator("body")).toHaveCSS("overflow", "visible");
});

test("overlay is announced as a modal dialog portaled outside the header", async ({ page }) => {
  const dialog = await openMenu(page);
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  // TRAP-5 pin: the dialog must not be a DOM descendant of the header.
  const insideHeader = await dialog.evaluate(
    (element) => Boolean(element.closest("header")),
  );
  expect(insideHeader).toBe(false);
});

test("focus moves into the overlay on open, cycles within it, and restores on close", async ({ page }) => {
  const dialog = await openMenu(page);

  // Initial focus lands on the first focusable (the brand link).
  await expect(dialog.getByLabel("Aurelia — home")).toBeFocused();

  // Tab past every focusable (brand + 5 nav links + Sign In + theme + close)
  // — the cycle must wrap INSIDE the dialog, never reach the background.
  const focusables = await dialog.locator('a[href], button:not([disabled])').count();
  for (let index = 0; index < focusables; index += 1) await page.keyboard.press("Tab");
  const stillInside = await page.evaluate(() =>
    Boolean(document.activeElement?.closest('[role="dialog"]')),
  );
  expect(stillInside).toBe(true);

  // Shift+Tab from the first focusable wraps to the last.
  await page.keyboard.press("Shift+Tab");
  const wrapInside = await page.evaluate(() =>
    Boolean(document.activeElement?.closest('[role="dialog"]')),
  );
  expect(wrapInside).toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

test("hamburger is hidden on desktop widths where the primary nav shows", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("overlay works on inner routes too (Gallery)", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Site menu" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Services", exact: true }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("heading", { name: "Services", level: 1 })).toBeVisible();
});
