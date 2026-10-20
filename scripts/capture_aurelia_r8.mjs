// R8 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (the shipped artifact), same doctrine as
// the e2e suite. Series 39–41.
//
// NOTE (R8): the changed surface this round is /about — the featured-in strip
// rebuilt as a centered hairline-bordered band and the CTA unboxed to the
// centered max-w-3xl block (R8-01). Home is captured as the regression
// baseline (height expected unchanged from R7 at 5286px). Gallery/services/
// mobile surfaces are untouched by R8 — the 34–38 series remains their record.
// (docs/remediation-plan-aurelia-r8.md §5)
//
// Usage: node scripts/capture_aurelia_r8.mjs  (preview server on :4173)
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4173";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();

  // --- home light (39, regression baseline) ---
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/39-r8-home-desktop-light-full.png`, fullPage: true });

  // --- about light (40, the changed surface) ---
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/40-r8-about-desktop-light-full.png`, fullPage: true });

  // --- about dark (41, token flips on the new band/CTA) ---
  await page.evaluate(() => localStorage.setItem("aurelia.theme", "dark"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/41-r8-about-desktop-dark-full.png`, fullPage: true });
  await desktop.close();

  console.log("captures complete: 39 (home light baseline), 40 (about light), 41 (about dark)");
} finally {
  await browser.close();
}
