import { expect, test } from "@playwright/test";

/**
 * Cart drawer modal semantics (session-4 follow-up to the mobile-menu modal
 * work). The drawer is the app's top modal surface (z-[500]): it carries
 * aria-modal, moves focus into the dialog on open, traps Tab within the
 * panel, and restores focus to the cart trigger on close — the same contract
 * the mobile menu has had since session 3. Escape-to-close and scroll-lock
 * were already in place and stay pinned here.
 */

async function addKnife(page: import("@playwright/test").Page) {
  await page.goto("/product/p-knife-set");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
}

test("cart drawer opens as a modal dialog with focus inside", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[aria-label="Open cart"]').click();

  const dialog = page.getByRole("dialog", { name: "Cart", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Focus moves into the dialog (first focusable = the header close button),
  // never left on the dimmed background page.
  await expect(dialog.getByRole("button", { name: "Close cart" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
});

test("Tab cycles within the drawer and never reaches the page behind", async ({ page }) => {
  await addKnife(page);
  await page.locator('button[aria-label="Open cart"]').click();

  const dialog = page.getByRole("dialog", { name: "Cart", exact: true });
  await expect(dialog).toBeVisible();

  // One cart line: close, decrease, increase, remove, Checkout, View full cart
  // = 6 focusables inside the dialog (the backdrop click-catcher is out of
  // the tab order). A full Tab cycle must land back on the first focusable.
  const focusables = dialog.locator('a[href], button:not([disabled]):not([tabindex="-1"])');
  const count = await focusables.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i += 1) await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close cart" })).toBeFocused();

  // Shift+Tab from the first focusable wraps to the last.
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "View full cart" })).toBeFocused();
});

test("closing the drawer restores focus to the cart trigger", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator('button[aria-label="Open cart"]');
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // The X button inside the dialog closes it too, with the same restore.
  await trigger.click();
  await page.getByRole("dialog", { name: "Cart", exact: true }).getByRole("button", { name: "Close cart" }).click();
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

/**
 * Session-43 (F43-01…F43-08) — the cart-drawer superset alignment. The
 * reference has NO cart drawer (its cart icon is a plain anchor that
 * navigates to /cart — verified live, 0 dialogs/asides at both viewports),
 * so these are NOT reference pins: they pin the s41-MEASURED cart design
 * language (§30 F41-14…F20) onto the superset surface, per the standing
 * doctrine that supersets keep the measured row spec (§31 D5, PAD §5.6 #22).
 * The drawer's own chrome (right-side panel, max-w-md, dim overlay) is
 * unregistered superset chrome, like the admin surfaces.
 */

async function openDrawer(page: import("@playwright/test").Page) {
  await page.locator('button[aria-label="Open cart"]').click();
  return page.getByRole("dialog", { name: "Cart", exact: true });
}

test("cart drawer header carries the measured panel heading", async ({ page }) => {
  await page.goto("/");
  const drawer = await openDrawer(page);

  // F43-02/D5: "Your Cart" exactly — the count lives on the header badge
  // (F41-15), never the heading. Panel-scale: 20px/700 Playfair.
  const h2 = drawer.getByRole("heading", { name: "Your Cart", exact: true });
  await expect(h2).toBeVisible();
  await expect(h2).toHaveText("Your Cart");
  await expect(h2).toHaveCSS("font-size", "20px");
  await expect(h2).toHaveCSS("font-weight", "700");
  await expect(h2).toHaveCSS("font-family", /Playfair/);

  // F43-08: the close control drops to the 36px measured button family
  // (menu trigger 36×36) with a 16px glyph.
  const close = drawer.getByRole("button", { name: "Close cart" });
  await expect(close).toHaveCSS("width", "36px");
  await expect(close).toHaveCSS("height", "36px");

  // F43-08: the empty state aligns its copy to the page's measured
  // empty-state language (no trailing period, muted sub).
  const empty = drawer.getByRole("heading", { name: "Your cart is empty", exact: true });
  await expect(empty).toBeVisible();
  await expect(drawer.getByText("No items in cart. Start shopping to fill it up.")).toBeVisible();
});

test("cart drawer item cards match the measured cart card spec", async ({ page }) => {
  await addKnife(page);
  const drawer = await openDrawer(page);

  // F43-03: the measured card chrome — 16px radius, 0.5-alpha hairline,
  // p-4, gap-4, NO shadow — on the cream panel canvas (bg-background),
  // exactly the page's card-on-canvas relationship.
  const item = drawer.locator("li").first();
  await expect(item).toHaveCSS("border-radius", "16px");
  await expect(item).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(item).toHaveCSS("padding", "16px");
  await expect(item).toHaveCSS("column-gap", "16px");
  await expect(item).toHaveCSS("box-shadow", "none");

  // F43-03: SQUARE 80×80 image — no radius, no border (F41-16).
  const img = item.locator("img").first();
  await expect(img).toHaveCSS("width", "80px");
  await expect(img).toHaveCSS("height", "80px");
  await expect(img).toHaveCSS("border-radius", "0px");
  await expect(img).toHaveCSS("border-top-width", "0px");
});

test("cart drawer item internals match the measured row spec", async ({ page }) => {
  await addKnife(page);
  const drawer = await openDrawer(page);

  // F43-04: h3 16px/600, unit price 16px/700 primary, line total 14px/700
  // in the items-end right column (F41-17).
  const item = drawer.locator("li").first();
  const name = item.locator("h3");
  await expect(name).toHaveCSS("font-size", "16px");
  await expect(name).toHaveCSS("font-weight", "600");
  const unitPrice = item.locator(".text-primary").first();
  await expect(unitPrice).toHaveCSS("font-size", "16px");
  await expect(unitPrice).toHaveCSS("font-weight", "700");
  const lineTotal = item.locator("[class*='items-end'] .font-bold").last();
  await expect(lineTotal).toHaveCSS("font-size", "14px");

  // F43-05: the stepper is the MUTED pill with 24×24 buttons (F41-18).
  const stepper = item.locator("[class*='bg-muted']").filter({ has: page.getByRole("button") }).first();
  await expect(stepper).toHaveCSS("background-color", "rgb(242, 240, 237)");
  const stepButtons = stepper.getByRole("button");
  await expect(stepButtons.first()).toHaveCSS("width", "24px");
  await expect(stepButtons.first()).toHaveCSS("height", "24px");

  // F43-06: the remove control is the inline 16px trash glyph (F41-19).
  const trash = item.getByRole("button", { name: /^Remove/ });
  const trashSize = await trash.evaluate((el) => {
    const svg = el.querySelector("svg");
    return svg ? Math.round(svg.getBoundingClientRect().width) : 0;
  });
  expect(trashSize).toBe(16);
});

test("cart drawer footer carries the measured OS language and CTA", async ({ page }) => {
  await addKnife(page);
  const drawer = await openDrawer(page);

  // F43-07: the footer speaks the measured OS language — h2 "Order Summary"
  // 18px/700, Total row 18px/700, and the h-10 40px pill CTA (F41-20).
  const footer = drawer.locator("div.border-t");
  await expect(footer.locator("h2")).toHaveText("Order Summary");
  await expect(footer.locator("h2")).toHaveCSS("font-size", "18px");
  await expect(footer.locator("h2")).toHaveCSS("font-weight", "700");
  await expect(footer.locator(".text-lg.font-bold").last()).toHaveCSS("font-size", "18px");
  const checkout = footer.getByRole("button", { name: "Checkout" });
  await expect(checkout).toHaveCSS("height", "40px");
  await expect(checkout).toHaveCSS("border-radius", "9999px");
  await expect(checkout).toHaveCSS("font-size", "14px");
  await expect(checkout).toHaveCSS("font-weight", "500");
  await expect(checkout).toHaveCSS("background-color", "rgb(217, 110, 38)");

  // F43-07: "View full cart" adopts the measured muted text-link spec.
  const viewCart = footer.getByRole("button", { name: "View full cart" });
  await expect(viewCart).toHaveCSS("font-size", "14px");
  await expect(viewCart).toHaveCSS("font-weight", "500");
  await expect(viewCart).toHaveCSS("color", "rgb(126, 111, 103)");
});
