import { expect, test } from "@playwright/test";

/**
 * Booking flow — the primary user journey (Delivery Bar item 3).
 *
 * Reference contract (Verified, docs/reference-investigation.md §3.5):
 *   - info cards: Location / Hours / Contact with the studio's real details,
 *   - required: name, email, phone, service; date + time + optional notes,
 *   - empty submit is blocked (native HTML5 on the four required fields),
 *   - a valid submit REPLACES the form with the "Request Received"
 *     confirmation ("...confirm your booking within 24 hours").
 * Supersets (Deviations Ledger): future-date rule, closed Sun/Mon rule,
 * persistence to the local store, and (when signed in) account attachment.
 */

async function fillBooking(page: import("@playwright/test").Page, overrides?: { date?: string }) {
  await page.goto("/booking");
  await page.getByLabel("Full Name").fill("Ava Laurent");
  await page.getByLabel("Email Address").fill("ava@example.com");
  await page.getByLabel("Phone Number").fill("(310) 555-0100");
  await page.getByLabel("Service").selectOption({ label: "Bespoke Nail Art — 120 min" });
  const future = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const offset = future.getTimezoneOffset() * 60_000;
  const iso = new Date(future.getTime() - offset).toISOString().slice(0, 10);
  // Nudge forward until the ISO date lands on a studio day (Tue–Sat).
  const closed = [0, 1];
  const guard = new Date(`${iso}T12:00:00`);
  while (closed.includes(guard.getDay())) guard.setDate(guard.getDate() + 1);
  const openIso = overrides?.date
    ? overrides.date
    : `${guard.getFullYear()}-${String(guard.getMonth() + 1).padStart(2, "0")}-${String(guard.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Date").fill(openIso);
  await page.getByLabel("Time").selectOption("1:00 PM");
  await page.getByLabel("Additional Notes").fill("Soft chromes, almond shape.");
  return openIso;
}

test.describe("booking", () => {
  test("info cards carry the verified studio details", async ({ page }) => {
    await page.goto("/booking");
    const info = page.getByRole("complementary", { name: "Studio information" });
    await expect(info).toContainText("8423 Melrose Place");
    await expect(info).toContainText("Los Angeles, CA 90069");
    await expect(info).toContainText("Tuesday – Saturday");
    await expect(info).toContainText("10:00 AM – 6:00 PM");
    await expect(info).toContainText("hello@aurelia-nails.com");
    await expect(info).toContainText("(310) 555-0123");
  });

  test("empty submit is blocked by native validation (reference baseline)", async ({ page }) => {
    await page.goto("/booking");
    await page.getByRole("button", { name: "Request Appointment" }).click();
    // Native constraint validation keeps the form mounted and focuses the
    // first invalid field — the confirmation must NOT appear.
    await expect(page.getByRole("heading", { name: "Request Received" })).toHaveCount(0);
    await expect(page.locator("input[name=name]")).toBeFocused();
  });

  test("custom validation: past date is rejected with an explicit message", async ({ page }) => {
    await page.goto("/booking");
    await page.getByLabel("Full Name").fill("Ava Laurent");
    await page.getByLabel("Email Address").fill("ava@example.com");
    await page.getByLabel("Phone Number").fill("(310) 555-0100");
    await page.getByLabel("Service").selectOption({ index: 1 });
    await page.getByLabel("Date").fill("2020-01-01");
    await page.getByLabel("Time").selectOption("1:00 PM");
    await page.getByRole("button", { name: "Request Appointment" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Choose a date in the future." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Request Received" })).toHaveCount(0);
  });

  test("custom validation: closed days (Sun/Mon) are rejected", async ({ page }) => {
    await page.goto("/booking");
    await page.getByLabel("Full Name").fill("Ava Laurent");
    await page.getByLabel("Email Address").fill("ava@example.com");
    await page.getByLabel("Phone Number").fill("(310) 555-0100");
    await page.getByLabel("Service").selectOption({ index: 1 });
    // 2099-06-07 is a Sunday; 2099-06-08 the Monday after.
    await page.getByLabel("Date").fill("2099-06-07");
    await page.getByLabel("Time").selectOption("1:00 PM");
    await page.getByRole("button", { name: "Request Appointment" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "The studio is closed Sundays and Mondays." }),
    ).toBeVisible();
  });

  test("valid submit replaces the form with the Request Received confirmation", async ({ page }) => {
    await fillBooking(page);
    await page.getByRole("button", { name: "Request Appointment" }).click();
    const confirmation = page.locator("[data-booking-confirmation='visible']");
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByRole("heading", { name: "Request Received" })).toBeVisible();
    await expect(confirmation).toContainText(
      "We'll review your request and get back to you within 24 hours to confirm your appointment.",
    );
    await expect(confirmation).toContainText("We look forward to seeing you");
    // The form is gone (reference: the form is REPLACED, Verified).
    await expect(page.locator("[data-booking-form]")).toHaveCount(0);
  });

  test("the request persists to the store and reaches the admin surface", async ({ page }) => {
    await fillBooking(page);
    await page.getByRole("button", { name: "Request Appointment" }).click();
    await expect(page.locator("[data-booking-confirmation='visible']")).toBeVisible();

    // Sign in as the studio admin (development-only seed account) and review.
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@aurelia.studio");
    await page.getByLabel("Password").fill("Aurelia-Demo-2025");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.goto("/admin/bookings");
    await expect(page.getByRole("heading", { name: "Booking Requests" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ava Laurent" })).toBeVisible();
    await expect(page.getByRole("cell", { name: /Bespoke Nail Art/ })).toBeVisible();
  });

  test("booking made while signed in lands in /account and can be cancelled", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("guest@aurelia.studio");
    await page.getByLabel("Password").fill("Aurelia-Guest-2025");
    await page.getByRole("button", { name: "Sign in" }).click();

    await fillBooking(page);
    await page.getByRole("button", { name: "Request Appointment" }).click();
    await expect(page.locator("[data-booking-confirmation='visible']")).toBeVisible();

    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Booking Requests" })).toBeVisible();
    await expect(page.getByText("Bespoke Nail Art")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Cancelled").first()).toBeVisible();
  });
});
