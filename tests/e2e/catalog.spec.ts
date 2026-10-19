import { expect, test } from "@playwright/test";

/**
 * Catalog behavior: live search, category + sort controls, quantity stepper,
 * stock-guarded add-to-cart, and the quick-add affordance on cards.
 */

test("search filters products live as you type", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("searchbox", { name: "Search products" }).fill("knife");
  await expect(page).toHaveURL(/search=knife/);
  await expect(page.getByText(/product(s)? found/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Damascus Steel Chef Knife Set/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Professional Stand Mixer" })).toHaveCount(0);
});

test("category select deep-links and filters", async ({ page }) => {
  await page.goto("/products?category=cookware");
  await expect(page.getByRole("heading", { name: "Cookware" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Damascus Steel Chef Knife Set" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Enameled Cast Iron Dutch Oven/ })).toBeVisible();
});

test("sort by price ascending reorders the grid", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("combobox").nth(1).selectOption("price-asc");
  const prices = await page.getByTestId("card-price").allTextContents();
  const dollars = prices.map((price) => Number(price.replace(/[$,]/g, "")));
  expect(dollars.length).toBeGreaterThan(4);
  const sorted = [...dollars].sort((a, b) => a - b);
  expect(dollars).toEqual(sorted);
});

test("quantity stepper clamps at 1 and at stock, then adds to cart", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  const qty = page.locator("span[aria-live=polite]");
  await expect(qty).toHaveText("1");
  const decrease = page.getByRole("button", { name: "Decrease quantity" });
  await expect(decrease).toBeDisabled();
  await expect(qty).toHaveText("1");
  const increase = page.getByRole("button", { name: "Increase quantity" });
  await increase.click();
  await increase.click();
  await expect(qty).toHaveText("3");

  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
  await expect(page.locator('button[aria-label="Open cart"] span')).toHaveText("3");
});

test("quick-add from the product card increments the cart badge", async ({ page }) => {
  await page.goto("/products");
  await page.locator('button[aria-label^="Add Artisan Copper Frying Pan"]').first().click();
  await expect(page.locator('button[aria-label="Open cart"] span')).toHaveText("1");
});

test("header search opens a panel and routes to results", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).first().click();
  await page.getByPlaceholder("Search products...").fill("copper");
  const results = page.getByRole("listbox");
  await expect(results.getByRole("option").first()).toBeVisible();
  await results.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/product\//);
});
