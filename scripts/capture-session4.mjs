// Session-4 screen captures for docs/screenshots/ — runs against the
// PRODUCTION build served by `vite preview` (the shipped artifact), same
// doctrine as the E2E suite.
// Usage: node scripts/capture-session4.mjs  (preview server must be on :4174)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://127.0.0.1:4174";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  // --- desktop surfaces ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/session4-home-desktop.png` });

  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/session4-products-desktop.png` });

  await page.goto(`${BASE}/product/p-knife-set`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/session4-pdp-desktop.png` });

  // Cart drawer open with an item (the new modal surface).
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await page.waitForTimeout(400);
  await page.locator('button[aria-label="Open cart"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/session4-cart-drawer.png` });
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
  await mpage.screenshot({ path: `${OUT}/session4-mobile-home.png` });

  await mpage.getByRole("button", { name: "Open menu" }).click();
  await mpage.waitForTimeout(400);
  await mpage.screenshot({ path: `${OUT}/session4-mobile-menu-open.png` });
  await mobile.close();

  console.log("session-4 captures complete");
} finally {
  await browser.close();
}
