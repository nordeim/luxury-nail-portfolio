import { expect, test } from "@playwright/test";

/**
 * Auth flow — the three reference views (sign in / sign up / reset) plus the
 * clone's session lifecycle (register → session → sign out → login).
 * Reference parity: the three view structures are Verified; the Google
 * button is intentionally absent (Deviations Ledger). Passwords persist as
 * salted digests (tests/e2e/password-hash.spec.ts).
 */

async function registerUser(page: import("@playwright/test").Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Correct-Horse-9");
  await page.getByLabel("Confirm Password").fill("Correct-Horse-9");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("auth", () => {
  test("sign-in view carries the reference structure", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome to Aurelia Nail Artistry" })).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("required", "");
    await page.getByLabel("Password").fill("");
    await expect(page.getByLabel("Password")).toHaveAttribute("required", "");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Need an account? Sign up" })).toBeVisible();
  });

  test("register → session opens → sign out → login returns", async ({ page }) => {
    const email = `ava-${Date.now()}@example.com`;
    await registerUser(page, email);

    // Session: header shows Account, /account shows the profile.
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /^ava-/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByText("Sign in to view your account")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Correct-Horse-9");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
    // The session affordance is viewport-dependent: the desktop nav link vs
    // the account item inside the mobile menu overlay.
    const openMenu = page.getByRole("button", { name: "Open menu" });
    if (await openMenu.isVisible()) {
      await openMenu.click();
      await expect(
        page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: "Account" }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
    }
  });

  test("wrong password is rejected with the reference-shaped message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@aurelia.studio");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText("Email or password is incorrect.");
    // The failure keeps the user signed out.
    await page.goto("/account");
    await expect(page.getByText("Sign in to view your account")).toBeVisible();
  });

  test("register validation: short password and mismatched confirm are rejected", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Email").fill(`short-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("short1!");
    await page.getByLabel("Confirm Password").fill("short1!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();

    await page.getByLabel("Password", { exact: true }).fill("long-enough-1");
    await page.getByLabel("Confirm Password").fill("different-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("duplicate registration is rejected", async ({ page }) => {
    const email = `dupe-${Date.now()}@example.com`;
    await registerUser(page, email);
    // Sign Out lives on the account surface (all viewports).
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("Correct-Horse-9");
    await page.getByLabel("Confirm Password").fill("Correct-Horse-9");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert")).toContainText("An account with that email already exists.");
  });

  test("reset view mirrors the reference copy", async ({ page }) => {
    await page.goto("/reset");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(
      page.getByText("Enter your email and we'll send you a link to reset your password"),
    ).toBeVisible();
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If an account exists for");
  });

  test("protected route (/account) redirects anonymous visitors to a sign-in prompt", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByText("Sign in to view your account")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to view your account" })).toBeVisible();
  });

  test("admin surface is gated to the studio role", async ({ page }) => {
    await page.goto("/admin/bookings");
    await expect(page.getByText("Not available for this account")).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill("guest@aurelia.studio");
    await page.getByLabel("Password").fill("Aurelia-Guest-2025");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.goto("/admin/bookings");
    await expect(page.getByText("Not available for this account")).toBeVisible();
  });
});
