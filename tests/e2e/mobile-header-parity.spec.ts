import { expect, test } from "@playwright/test";

/**
 * Session-3 mobile header parity pins — measured live against the reference
 * site at 390×844 on 2026-10-12:
 *
 *   1. The hamburger sits at the TRAILING edge (right of the cart icon) —
 *      the reference header is logo → user → cart → hamburger.
 *   2. The mobile header has NO dedicated search button (search lives inside
 *      the dropdown menu; desktop keeps the pill).
 *   3. The feature bar renders as a 2×2 grid on phones (reference is 2-col
 *      at 390px, not stacked).
 *   4. The hero carousel's first slide is "Elevate Your Kitchen" (reference
 *      order: Elevate Your Kitchen → New Arrivals → Sale).
 */

test.use({ viewport: { width: 390, height: 844 } });

test("hamburger trails the cart icon in the mobile header", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("link", { name: "HomeNest home" });
  const cart = page.getByRole("button", { name: "Open cart" });
  const burger = page.getByRole("button", { name: "Open menu" });
  await expect(logo).toBeVisible();
  await expect(cart).toBeVisible();
  await expect(burger).toBeVisible();

  const logoBox = await logo.boundingBox();
  const cartBox = await cart.boundingBox();
  const burgerBox = await burger.boundingBox();
  expect(logoBox).not.toBeNull();
  expect(cartBox).not.toBeNull();
  expect(burgerBox).not.toBeNull();
  if (!logoBox || !cartBox || !burgerBox) return;

  expect(burgerBox.x).toBeGreaterThan(cartBox.x); // trailing edge
  expect(cartBox.x).toBeGreaterThan(logoBox.x); // logo leads
});

test("mobile header has no dedicated search button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Search products" })).toHaveCount(0);
  // Search remains reachable inside the dropdown menu — behind the compact
  // pill (session-4 re-measurement: the reference's resting menu shows a
  // muted icon pill, not an expanded input; tapping it reveals the input).
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Site menu" });
  const pill = menu.getByRole("button", { name: "Search products" });
  await expect(pill).toBeVisible();
  await pill.click();
  await expect(menu.getByPlaceholder("Search products...")).toBeVisible();
});

test("feature bar is a 2x2 grid on phones", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "Store highlights" });
  const cards = section.locator("div.rounded-2xl, div.bg-card");
  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if (!first || !second) return;
  // Same row: the second card starts at roughly the same y (±2px) and to the right.
  expect(Math.abs(second.y - first.y)).toBeLessThan(2);
  expect(second.x).toBeGreaterThan(first.x);
});

test("hero carousel opens on the reference's first slide", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Featured collections" });
  await expect(region.getByRole("heading", { level: 1 })).toHaveText("Elevate Your Kitchen");
});

test("header account button renders a plain icon in both auth states (session-26)", async ({ page }) => {
  // Session-26 re-measurement (2026-10-14, logged in on the reference with
  // the owner-supplied User-role account): the header account button is a
  // transparent round button with a plain dark lucide-user glyph — NO green
  // avatar disc. The logged-out state was already a plain icon; the clone
  // previously wrapped the logged-in glyph in a bg-accent disc (the
  // session-2 measurement) — both states now match the latest measurement.
  await page.goto("/");
  const accountLoggedOut = page
    .locator("header")
    .getByRole("link", { name: "Sign in" });
  await expect(accountLoggedOut).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(accountLoggedOut.locator("span")).toHaveCount(0);

  await page.goto("/login");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);
  const accountLoggedIn = page
    .locator("header")
    .getByRole("link", { name: "Account" });
  await expect(accountLoggedIn).toBeVisible();
  await expect(accountLoggedIn).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  // No green disc span in the logged-in state either — the glyph renders
  // directly in the button, matching the reference measurement.
  await expect(accountLoggedIn.locator("span")).toHaveCount(0);
  await expect(accountLoggedIn).toHaveCSS("color", "rgb(29, 24, 22)");
});
