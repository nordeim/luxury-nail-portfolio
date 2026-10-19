import { expect, test } from "@playwright/test";

/**
 * Cart → checkout → placement → tracking, the COD flow with reference parity.
 * Free shipping at $50 (flat $9.99 under), no tax line, COD by default with a
 * demo card option. Order success is token-gated for guests.
 */

async function addKnife(page: import("@playwright/test").Page, quantity = 1) {
  await page.goto("/product/p-knife-set");
  for (let index = 1; index < quantity; index += 1) {
    await page.getByRole("button", { name: "Increase quantity" }).click();
  }
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
}

async function fillCheckout(page: import("@playwright/test").Page) {
  await page.getByLabel("Full Name *").fill("John Mercer");
  await page.getByLabel("Phone Number *").fill("+1 (555) 010-0148");
  await page.getByLabel("Email Address").fill("john@example.com");
  await page.getByLabel("Street Address *").fill("48 Oak Street");
  await page.getByLabel("Apartment, Suite, etc. (optional)").fill("Apt 3");
  await page.getByLabel("City *").fill("San Francisco");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("ZIP Code").fill("94110");
}

test("cart page shows subtotal, free shipping at $50+, and the COD notice", async ({ page }) => {
  await addKnife(page);
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: /Your Cart/ })).toBeVisible();
  await expect(page.getByText("Subtotal")).toBeVisible();
  await expect(page.getByText("Free")).toBeVisible();
  await expect(page.getByText("Total", { exact: true })).toBeVisible();
  await expect(page.getByText("Cash on Delivery")).toBeVisible();
  await expect(page.getByText("Tax")).toHaveCount(0);
});

test("empty cart offers the honest empty state", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Browse Products" })).toBeVisible();
});

test("cart drawer mirrors the page and checks out", async ({ page }) => {
  await addKnife(page);
  await page.locator('button[aria-label="Open cart"]').click();
  const drawer = page.getByRole("dialog", { name: "Cart" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("Damascus Steel Chef Knife Set");
  await drawer.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("checkout validates required fields before placing", async ({ page }) => {
  await addKnife(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page.getByText("Full name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
});

test("promo code applies the NEST10 discount above the min spend", async ({ page }) => {
  await addKnife(page, 1);
  await page.goto("/cart");
  await page.getByRole("button", { name: "Have a promo code?" }).click();
  await page.getByLabel("Promo code").fill("NEST10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("NEST10 applied.")).toBeVisible();
  await expect(page.getByText(/Discount \(NEST10\)/)).toBeVisible();
});

test("placing a COD order lands on the token-gated success page", async ({ page }) => {
  await addKnife(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  await expect(page.getByRole("radio", { name: /Cash on Delivery/ })).toBeChecked();
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page).toHaveURL(/\/order-success\?order=ORD-.+&token=/);
  await expect(page.getByRole("heading", { name: "Order Placed!" })).toBeVisible();
  await expect(page.getByText(/Order #ORD-/)).toBeVisible();
  await expect(page.getByText("Cash on Delivery").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order Details" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery Information" })).toBeVisible();
  // Session-36 (F36-12) → session-42 (F42-11) supersession: the success
  // CTAs are real LINKS at the measured h-9 36px pill spec (the reference
  // ships a > button at 36px; the s36 48px shared-button pin guarded a
  // flex-1 collapse that no longer applies — the h-9 pills carry no
  // flex-1, and the 36px height is pinned by visual-parity's
  // success-buttons spec).
  const cta = page.getByRole("link", { name: "Continue Shopping" });
  const ctaBox = await cta.boundingBox();
  expect(Math.round(ctaBox?.height ?? 0)).toBe(36);
});

test("the success link rejects tampering", async ({ page }) => {
  await page.goto("/order-success?order=ORD-2026-999&token=wrong-token");
  await expect(page.getByText("We cannot show that order")).toBeVisible();
});

test("placed order is trackable by order number with a 5-step progress", async ({ page }) => {
  await addKnife(page);
  await page.goto("/checkout");
  await fillCheckout(page);
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page).toHaveURL(/\/order-success/);
  const orderNumber = (page.url().match(/order=(ORD-[\w-]+)/) ?? [])[1];
  expect(orderNumber).toBeTruthy();

  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(orderNumber);
  await page.getByRole("button", { name: "Track" }).click();
  await expect(page.getByText(orderNumber).first()).toBeVisible();
  const progress = page.getByRole("list", { name: "Order progress" });
  await expect(progress).toBeVisible();
  for (const step of ["Order Placed", "Confirmed", "Processing", "Shipped", "Delivered"]) {
    await expect(progress.getByText(step, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Items Ordered" })).toBeVisible();
});

test("unknown order number shows a calm miss state", async ({ page }) => {
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill("ORD-NOPE-404");
  await page.getByRole("button", { name: "Track" }).click();
  await expect(page.getByText("No matching order", { exact: false })).toBeVisible();
});
