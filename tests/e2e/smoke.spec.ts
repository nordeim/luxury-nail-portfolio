import { expect, test } from "@playwright/test";

/**
 * Smoke — every public route renders its landmark content, per-route titles
 * apply, direct navigation and refresh work on nested routes (Delivery Bar
 * items 1, 2, 4), and unknown routes meet the 404 page (reference parity).
 */

const ROUTES: Array<{ path: string; heading: string; title: string }> = [
  { path: "/", heading: "Aurelia", title: "Aurelia Nail Artistry" },
  { path: "/gallery", heading: "Gallery", title: "Gallery | Aurelia Nail Artistry" },
  { path: "/services", heading: "Services", title: "Services | Aurelia Nail Artistry" },
  { path: "/about", heading: "Aurelia Chen", title: "About | Aurelia Nail Artistry" },
  { path: "/booking", heading: "Book Your Session", title: "Booking | Aurelia Nail Artistry" },
];

test.describe("route smoke", () => {
  for (const route of ROUTES) {
    test(`direct navigation renders ${route.path} with its title`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible();
      await expect(page).toHaveTitle(route.title);
    });
  }

  test("refresh works on a nested route (history deep link)", async ({ page }) => {
    await page.goto("/services");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Services", level: 1 })).toBeVisible();
    await expect(page).toHaveTitle("Services | Aurelia Nail Artistry");
  });

  test("unknown routes render the styled 404", async ({ page }) => {
    await page.goto("/definitely-not-a-route");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page).toHaveTitle("Page Not Found | Aurelia Nail Artistry");
    await page.getByRole("link", { name: "Return Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("footer navigation reaches every route", async ({ page }) => {
    await page.goto("/about");
    for (const [label, path] of [
      ["Home", "/"],
      ["Gallery", "/gallery"],
      ["Services", "/services"],
      ["Booking", "/booking"],
    ] as const) {
      await page.getByRole("contentinfo").getByRole("link", { name: label, exact: true }).click();
      expect(new URL(page.url()).pathname).toBe(path);
      await page.goto("/about");
    }
  });

  test("landing portfolio cards link to the gallery (reference behavior)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The Portfolio" })).toBeVisible();
    const firstCard = page.getByRole("link", { name: /Pearl Essence/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
