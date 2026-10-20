// R7 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (the shipped artifact), same doctrine as
// the e2e suite. Series 34–38.
//
// NOTE (R7): the capture heights intentionally differ from the 30–33 series —
// the gallery filter row (R7-02), the re-categorized captions (R7-03) and the
// About rebuild (R7-04) shift the layout; home copy also changed (R7-01/05/06)
// (docs/remediation-plan-aurelia-r7.md §7.5).
//
// Usage: node scripts/capture_aurelia_r7.mjs  (preview server on :4173)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4173";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  // --- desktop light (34) ---
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/34-r7-home-desktop-light-full.png`, fullPage: true });

  // --- desktop dark (35) ---
  await page.evaluate(() => localStorage.setItem("aurelia.theme", "dark"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/35-r7-home-desktop-dark-full.png`, fullPage: true });

  // --- gallery with the filter row (36, desktop light) ---
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.goto(`${BASE}/gallery`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/36-r7-gallery-desktop-light-full.png`, fullPage: true });

  // --- about with the rebuilt anatomy (37, desktop light) ---
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/37-r7-about-desktop-light-full.png`, fullPage: true });
  await desktop.close();

  // --- mobile light (38) ---
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(800);
  await mpage.screenshot({ path: `${OUT}/38-r7-home-mobile-light-full.png`, fullPage: true });
  await mobile.close();

  console.log("captures complete: 34 (home light), 35 (home dark), 36 (gallery), 37 (about), 38 (mobile light)");
} finally {
  await browser.close();
}
