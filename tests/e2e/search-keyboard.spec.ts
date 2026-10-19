import { expect, test } from "@playwright/test";

/**
 * Desktop search combobox — keyboard interaction plan (session 5, R5-02).
 *
 * The overlay already ships the static ARIA skeleton (role="combobox",
 * aria-expanded, aria-autocomplete="list", role="listbox"/"option"), but had
 * ZERO keyboard support: no arrow keys, no aria-activedescendant, no
 * aria-selected, no Escape-to-dismiss — keyboard users could not reach any
 * suggestion and could only submit the raw query. These specs pin the WAI-ARIA
 * 1.2 combobox pattern:
 *
 *   ArrowDown / ArrowUp  move the active option, wrapping at both ends
 *   Home / End           jump to first / last option
 *   Enter                navigates to the active option's product
 *   Escape               dismisses the overlay entirely
 *
 * The active option is exposed via aria-activedescendant on the input and
 * aria-selected="true" on the option — focus stays in the input the whole
 * time (APG combobox, listbox-popup variant).
 *
 * Desktop-only: below md the header search button does not exist (mobile
 * search lives inside the menu; see mobile-navigation.spec.ts).
 */

test.use({ viewport: { width: 1280, height: 800 } });

test.skip(({ viewport }) => (viewport?.width ?? 0) < 768, "desktop-only combobox");

async function openSearch(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  const input = page.getByRole("combobox", { name: "Search products" });
  await expect(input).toBeVisible();
  await input.fill("bowl");
  // Wait for the suggestion listbox with at least one option.
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  return { input, listbox };
}

test("ArrowDown activates options via aria-activedescendant and aria-selected", async ({ page }) => {
  const { input, listbox } = await openSearch(page);
  const options = listbox.getByRole("option");
  const count = await options.count();
  expect(count).toBeGreaterThan(0);

  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", "site-search-opt-0");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", "site-search-opt-1");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "false");
});

test("ArrowUp wraps to the last option; Home and End jump to the ends", async ({ page }) => {
  const { input, listbox } = await openSearch(page);
  const options = listbox.getByRole("option");
  const count = await options.count();
  expect(count).toBeGreaterThan(0);
  const last = `site-search-opt-${count - 1}`;

  // From -1 (nothing active) ArrowUp wraps to the LAST option.
  await input.press("ArrowUp");
  await expect(input).toHaveAttribute("aria-activedescendant", last);

  await input.press("Home");
  await expect(input).toHaveAttribute("aria-activedescendant", "site-search-opt-0");

  await input.press("End");
  await expect(input).toHaveAttribute("aria-activedescendant", last);
});

test("Enter navigates to the highlighted product and closes the overlay", async ({ page }) => {
  const { input, listbox } = await openSearch(page);
  const firstHref = await listbox.getByRole("option").nth(0).locator("a").getAttribute("href");
  expect(firstHref).toBeTruthy();

  await input.press("ArrowDown");
  await input.press("Enter");

  const escaped = firstHref!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escaped}$`));
  // Overlay dismissed after navigation.
  await expect(page.getByRole("combobox", { name: "Search products" })).toHaveCount(0);
});

test("Enter without an active option still submits the query to the products page", async ({ page }) => {
  const { input } = await openSearch(page);
  await input.press("Enter");
  await expect(page).toHaveURL(/\/products\?search=bowl$/);
});

test("Escape dismisses the overlay", async ({ page }) => {
  const { input } = await openSearch(page);
  await input.press("ArrowDown");
  await input.press("Escape");
  await expect(page.getByRole("combobox", { name: "Search products" })).toHaveCount(0);
  // The trigger's expanded state resets with the overlay gone.
  await expect(page.getByRole("button", { name: "Search products" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

// ---------------------------------------------------------------------------
// R14-01 — screen-reader result announcements (aria-live superset).
//
// The combobox was fully operable (keyboard + ARIA wiring) but silent: a
// sighted user sees the suggestion list appear, while a screen-reader user
// gets no announcement that results changed. APG combobox guidance pairs the
// pattern with a polite live region so result-count changes are announced
// without moving focus. The region is visually hidden (sr-only) — zero
// visual impact, verified against the reference parity pins.
// ---------------------------------------------------------------------------

test("announces the result count via a polite live region", async ({ page }) => {
  const { listbox } = await openSearch(page);
  // The status region lives inside the search form, uniquely scoped.
  const status = page.getByRole("search").getByRole("status");
  await expect(status).toBeAttached();

  const count = await listbox.getByRole("option").count();
  expect(count).toBeGreaterThan(0);
  await expect(status).toHaveText(new RegExp(`^${count} products? match(?:es)? your search\\.$`));
});

test("announces 'no results' when the query matches nothing", async ({ page }) => {
  const { input } = await openSearch(page);
  await input.fill("zzqqxx-no-match");
  await expect(page.getByRole("search").getByRole("status")).toHaveText(
    "No products match that search.",
  );
});

test("status region is empty before a query is typed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  // Attached and polite from the start, but announces nothing until queried.
  const status = page.getByRole("search").getByRole("status");
  await expect(status).toBeAttached();
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveText("");
});
