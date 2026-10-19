import { expect, test } from "@playwright/test";

/**
 * Smoke specs — production build (vite preview), one <main> per page,
 * header/footer chrome present. Reference-parity surfaces.
 */

test("home renders the hero, feature bar, and exactly one main", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  // Desktop widths show the inline primary nav; mobile widths show the hamburger.
  const isDesktop = page.viewportSize()!.width >= 768;
  if (isDesktop) {
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Shop by Category" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Transform Your Kitchen Today" })).toBeVisible();
});

test("products page lists the catalog with filters", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
  await expect(page.getByText(/products? found/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Damascus Steel Chef Knife Set/ }).first()).toBeVisible();
});

test("product detail opens from the reference URL shape /product/:id", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("link", { name: /Damascus Steel Chef Knife Set/ }).first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByRole("heading", { level: 1, name: /Damascus Steel Chef Knife Set/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buy Now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "You May Also Like" })).toBeVisible();
});

test("unknown routes render the styled 404", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
});

test("footer exposes quick links and policies", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("Quick Links")).toBeVisible();
  await expect(footer.getByText("Policies")).toBeVisible();
  await expect(footer.getByText("Contact Us")).toBeVisible();
});
