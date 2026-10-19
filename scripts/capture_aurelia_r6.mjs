// R6 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (the shipped artifact), same doctrine as
// the e2e suite. Series 30–32.
//
// NOTE (R6): the capture heights intentionally differ from the 01–29 series —
// the typography-parity remediation (R6-02) plus the add-on band (R6-01)
// shift the layout; this is the first planned height change in project
// history (docs/remediation-plan-aurelia-r6.md §7.3).
//
// Usage: node scripts/capture_aurelia_r6.mjs  (preview server on :4173)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4173";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  // --- desktop light (30) ---
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/30-r6-home-desktop-light-full.png`, fullPage: true });

  // --- desktop dark (31) ---
  await page.evaluate(() => localStorage.setItem("aurelia.theme", "dark"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/31-r6-home-desktop-dark-full.png`, fullPage: true });

  // --- services page with the new add-on band (bonus evidence, desktop light) ---
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.goto(`${BASE}/services`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/33-r6-services-desktop-light-full.png`, fullPage: true });
  await desktop.close();

  // --- mobile light (32) ---
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(800);
  await mpage.screenshot({ path: `${OUT}/32-r6-home-mobile-light-full.png`, fullPage: true });
  await mobile.close();

  console.log("captures complete: 30 (desktop light), 31 (desktop dark), 32 (mobile light), 33 (services)");
} finally {
  await browser.close();
}
