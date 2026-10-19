// Session-5 screen captures for docs/screenshots/ — runs against the
// PRODUCTION build served by `vite preview` (the shipped artifact), same
// doctrine as the E2E suite.
// Usage: node scripts/capture-session5.mjs  (preview server must be on :4174)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4174";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  // --- desktop surfaces ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/session5-home-desktop.png` });

  // The R5-02 combobox: overlay open, one suggestion activated by ArrowDown
  // (aria-activedescendant + highlighted row).
  await page.getByRole("button", { name: "Search products" }).click();
  await page.getByRole("combobox", { name: "Search products" }).fill("bowl");
  await page.getByRole("combobox", { name: "Search products" }).press("ArrowDown");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/session5-search-combobox.png` });
  await page.keyboard.press("Escape");
  await desktop.close();

  // --- mobile surfaces ---
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  });
  const mpage = await mobile.newPage();

  await mpage.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(600);
  await mpage.screenshot({ path: `${OUT}/session5-mobile-home.png` });

  // The R5-03 re-measured menu: bare dark trigger icon in BOTH states.
  await mpage.getByRole("button", { name: "Open menu" }).click();
  await mpage.waitForTimeout(400);
  await mpage.screenshot({ path: `${OUT}/session5-mobile-menu-open.png` });

  // The R5-06 account header card (wrapped row, identity text breaks).
  await mpage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await mpage.getByLabel("Email").fill("john@example.com");
  await mpage.getByLabel("Password").fill("Demo1234!");
  await mpage.getByRole("button", { name: "Sign in" }).click();
  await mpage.waitForURL(/\/account$/);
  await mpage.waitForTimeout(500);
  await mpage.screenshot({ path: `${OUT}/session5-account-mobile.png` });
  await mobile.close();

  console.log("session-5 captures complete");
} finally {
  await browser.close();
}
