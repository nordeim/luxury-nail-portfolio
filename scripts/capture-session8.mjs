// Session-8 screen captures for docs/screenshots/ — runs against the
// PRODUCTION build served by `vite preview` (the shipped artifact), same
// doctrine as the E2E suite.
// Usage: node scripts/capture-session8.mjs  (preview server must be on :4175)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4175";
const OUT = "docs/screenshots";
const PRODUCT_CARD = '[' + 'href^="/product/"]';

const browser = await chromium.launch();
try {
  // --- desktop: home with the SEO head set in place ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/session8-home-desktop.png` });

  // PDP with the Product JSON-LD + per-route title/canonical applied
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.locator(PRODUCT_CARD).first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/session8-pdp-desktop.png` });
  await desktop.close();

  // --- mobile surfaces (re-verify the session-3/4/5 menu pins visually) ---
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
  await mpage.screenshot({ path: `${OUT}/session8-mobile-home.png` });

  // open the modal menu (trigger swaps its label Open menu / Close menu)
  await mpage.getByRole("button", { name: "Open menu" }).click();
  await mpage.waitForTimeout(500);
  await mpage.screenshot({ path: `${OUT}/session8-mobile-menu-open.png` });
  await mobile.close();
} finally {
  await browser.close();
}
