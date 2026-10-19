import { expect, test } from "@playwright/test";

/**
 * Password-at-rest contract.
 *
 * The demo is client-only (registered divergence; the server-backed auth
 * workstream remains the real fix), but passwords never sit in localStorage
 * as plaintext: records store `s1$<salt>$<sha256(salt:password)>` (WebCrypto,
 * CSPRNG salt). The shipped demo seed ships pre-hashed digests, registration
 * hashes at creation, and login verifies against the digest (with an
 * upgrade-on-login path for any legacy plaintext record).
 *
 * These specs read the REAL persisted state the way an attacker would — by
 * dumping localStorage — and assert the plaintext never lands at rest.
 */

const STORAGE_KEY = "aurelia.v1";

async function persistedUsers(page: import("@playwright/test").Page): Promise<Array<Record<string, unknown>>> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  expect(raw, "persisted store payload must exist").toBeTruthy();
  const parsed = JSON.parse(raw!) as { users?: Array<Record<string, unknown>> };
  return parsed.users ?? [];
}

test("demo seed ships hashed — demo passwords never appear at rest", async ({ page }) => {
  await page.goto("/");
  const users = await persistedUsers(page);
  for (const email of ["demo@aurelia.studio", "guest@aurelia.studio"]) {
    const user = users.find((candidate) => candidate.email === email);
    expect(user, `${email} seeded`).toBeTruthy();
    expect(user!.passwordHash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  }
  const dump = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  expect(dump).not.toContain("Aurelia-Demo-2025");
  expect(dump).not.toContain("Aurelia-Guest-2025");
});

test("registering hashes the password — plaintext never reaches localStorage", async ({ page }) => {
  const email = `hash-e2e-${Date.now()}@example.com`;
  const password = "Superset-1!";
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);

  const users = await persistedUsers(page);
  const created = users.find((candidate) => candidate.email === email);
  expect(created, "registered user persisted").toBeTruthy();
  expect(created!.passwordHash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  expect(created!.passwordHash).not.toContain(password);

  const dump = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  expect(dump).not.toContain(password);
});

test("registered user can sign back in with the same password (hash round-trip)", async ({ page }) => {
  const email = `roundtrip-${Date.now()}@example.com`;
  const password = "Superset-1!";
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Sign out, then sign back in through the real UI — the stored hash must
  // verify against the original password.
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page.getByText("Sign in to view your account")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expectSessionAffordance(page);
});

/** Session affordance is viewport-dependent: desktop nav link vs mobile menu item. */
async function expectSessionAffordance(page: import("@playwright/test").Page) {
  const openMenu = page.getByRole("button", { name: "Open menu" });
  if (await openMenu.isVisible()) {
    await openMenu.click();
    await expect(
      page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: "Account" }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: "Account" })).toBeVisible();
  }
}

test("session state survives a reload, and sign-out clears it", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("guest@aurelia.studio");
  await page.getByLabel("Password").fill("Aurelia-Guest-2025");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expectSessionAffordance(page);

  await page.reload();
  await expectSessionAffordance(page);

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.reload();
  await expect(page.getByText("Sign in to view your account")).toBeVisible();
});
