import { expect, test } from "@playwright/test";

/**
 * Account header card — mobile layout contract (session 5, R5-06).
 *
 * The header row (`flex items-center justify-between`) held the identity
 * block without a min-width floor: a long registered name/email pushed the
 * "Log out" control past the right viewport edge on phones, clipping it and
 * making it un-tappable (caught by the password round-trip spec on the
 * iPhone 14 profile). The row must wrap and the identity text must break,
 * keeping the control inside the viewport for ANY identity length.
 */

test.use({ viewport: { width: 390, height: 844 } });

test("log-out control stays inside the viewport with a long identity", async ({ page }) => {
  const email = `verylongroundtripprefix-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Superset1!");
  await page.getByLabel("Confirm password").fill("Superset1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  const logout = page.getByRole("button", { name: "Log out" });
  await expect(logout).toBeVisible();

  const box = await logout.boundingBox();
  expect(box, "log-out control has a bounding box").toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  // And it is actually tappable — the click resolves.
  await logout.click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
