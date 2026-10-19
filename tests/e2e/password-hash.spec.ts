import { expect, test } from "@playwright/test";

/**
 * Password-at-rest contract (session 5, R5-01 — downgrades F-10).
 *
 * The demo store is client-only (registered divergence; the server-backed
 * auth workstream remains the real fix), but the passwords no longer sit in
 * localStorage as plaintext: records store `s1$<salt>$<sha256(salt:password)>`
 * (WebCrypto, CSPRNG salt). Login verifies against BOTH formats and migrates
 * legacy plaintext records in place on successful login (upgrade-on-login).
 * The shipped demo seed ships pre-hashed.
 *
 * These specs read the REAL persisted state the way an attacker would — by
 * dumping localStorage — and assert the plaintext never lands at rest.
 */

async function persistedUsers(page: import("@playwright/test").Page): Promise<Array<Record<string, unknown>>> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), "homenest.v4");
  expect(raw, "persisted store payload must exist").toBeTruthy();
  const parsed = JSON.parse(raw!) as { users?: Array<Record<string, unknown>> };
  return parsed.users ?? [];
}

test("demo seed ships hashed — demo passwords never appear at rest", async ({ page }) => {
  await page.goto("/");
  const users = await persistedUsers(page);
  const dump = await page.evaluate((key) => window.localStorage.getItem(key), "homenest.v4");

  for (const email of ["john@example.com", "admin@homenest.kitchen"]) {
    const user = users.find((u) => u.email === email);
    expect(user, `${email} seeded`).toBeTruthy();
    expect(user!.passwordHash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  }
  expect(dump).not.toContain("Demo1234!");
  expect(dump).not.toContain("Admin1234!");
});

test("registering hashes the password — plaintext never reaches localStorage", async ({ page }) => {
  const email = `hash-e2e-${Date.now()}@example.com`;
  const password = "Superset1!";
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  const users = await persistedUsers(page);
  const created = users.find((u) => u.email === email);
  expect(created, "registered user persisted").toBeTruthy();
  expect(created!.passwordHash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  expect(created!.passwordHash).not.toContain(password);

  const dump = await page.evaluate((key) => window.localStorage.getItem(key), "homenest.v4");
  expect(dump).not.toContain(password);
});

test("registered user can sign back in with the same password (hash round-trip)", async ({ page }) => {
  const email = `roundtrip-${Date.now()}@example.com`;
  const password = "Superset1!";
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  // Sign out, then sign back in through the real UI — the stored hash must
  // verify against the original password. Wait for the logged-out chrome
  // before the full reload: the header flips to "Sign in" only after the
  // store's persist effect has flushed the cleared session.
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("legacy plaintext records upgrade to hashes on successful login", async ({ page }) => {
  // Seed a pre-hash-era store payload: an old client's users array with the
  // LEGACY field name (`password`) and plaintext values, under the CURRENT
  // storage key. The store must verify it, sign the user in, and migrate the
  // record to a salted hash.
  await page.goto("/");
  await page.evaluate(
    ([key, legacy]) => {
      window.localStorage.setItem(key, legacy);
    },
    [
      "homenest.v4",
      JSON.stringify({
        users: [
          {
            id: "u-legacy",
            email: "legacy@example.com",
            name: "Legacy User",
            role: "customer",
            password: "Plaintext9!",
            addresses: [],
          },
        ],
      }),
    ] as const,
  );

  await page.goto("/login");
  await page.getByLabel("Email").fill("legacy@example.com");
  await page.getByLabel("Password").fill("Plaintext9!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);

  const users = await persistedUsers(page);
  const upgraded = users.find((u) => u.email === "legacy@example.com");
  expect(upgraded).toBeTruthy();
  expect(upgraded!.passwordHash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  expect(upgraded).not.toHaveProperty("password");
  const dump = await page.evaluate((key) => window.localStorage.getItem(key), "homenest.v4");
  expect(dump).not.toContain("Plaintext9!");
});
