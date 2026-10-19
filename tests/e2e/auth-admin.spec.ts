import { expect, test } from "@playwright/test";

/**
 * Auth + admin gate. Login honors ?redirect=, validates same-origin paths,
 * logs the demo customer in through the real UI, and gates /admin to the
 * admin role with a calm staff-only surface for customers.
 */

test("login form validates and rejects bad credentials without leaking state", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome to HomeNest Kitchen" })).toBeVisible();
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("WrongPassword1!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("demo customer signs in through the UI and lands on the account page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "John Mercer" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Order History" })).toBeVisible();
  await expect(page.getByText("No orders yet")).toBeVisible();
});

test("login honors the redirect parameter", async ({ page }) => {
  await page.goto("/login?redirect=%2Ftrack-order");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/track-order$/);
});

test("open-redirect attempts fall back to /account", async ({ page }) => {
  await page.goto("/login?redirect=https%3A%2F%2Fevil.example%2Fsteal");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("registering a fresh account signs the user in", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Superset1!");
  await page.getByLabel("Confirm password").fill("Superset1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("customers hitting /admin get the staff-only surface, admins get the console", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Staff only" })).toBeVisible();

  // Signing in as a different user swaps the session; the role-blocked view
  // intentionally has no chrome, so we return to /login directly.
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@homenest.kitchen");
  await page.getByLabel("Password").fill("Admin1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
  for (const section of ["Products", "Orders", "Analytics", "Categories", "Carousel", "Settings"]) {
    await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: section })).toBeVisible();
  }
});

test("admin dashboard reflects placed orders in revenue", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await page.goto("/checkout");
  await page.getByLabel("Full Name *").fill("John Mercer");
  await page.getByLabel("Phone Number *").fill("+1 (555) 010-0148");
  await page.getByLabel("Email Address").fill("john@example.com");
  await page.getByLabel("Street Address *").fill("48 Oak Street");
  await page.getByLabel("City *").fill("San Francisco");
  await page.getByLabel("State").fill("CA");
  await page.getByRole("button", { name: "Place Order" }).click();
  await expect(page).toHaveURL(/\/order-success/);

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@homenest.kitchen");
  await page.getByLabel("Password").fill("Admin1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Revenue")).toBeVisible();
  await expect(page.locator("main").getByText("$199.99")).toBeVisible();
});
