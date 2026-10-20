// R9 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (the shipped artifact), same doctrine as
// the e2e suite. Series 42–44.
//
// NOTE (R9): a zero-findings validation round — no surface changed. Home is
// captured light + dark as the regression baseline (height expected unchanged
// from R7/R8 at 5286px); about is captured light to re-verify the R8 anatomy
// surfaces (centered hairline-bordered featured-in band + unboxed centered
// CTA) on the shipped artifact. Gallery/services/mobile surfaces are
// untouched since R8 — the 34–41 series remains their record.
// (docs/remediation-plan-aurelia-r9.md §5)
//
// Usage: node scripts/capture_aurelia_r9.mjs  (preview server on :4173)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4173";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();

  // --- home light (42, regression baseline) ---
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const lightHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/42-r9-home-desktop-light-full.png`, fullPage: true });

  // --- home dark (43) ---
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("aurelia.theme", "dark");
  });
  await page.waitForTimeout(400);
  const darkHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/43-r9-home-desktop-dark-full.png`, fullPage: true });

  // --- about light (44, R8 anatomy re-verification) ---
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("aurelia.theme", "light");
    document.documentElement.classList.remove("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const aboutHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/44-r9-about-desktop-light-full.png`, fullPage: true });

  await browser.close();
  const size = (f) => (fs.statSync(`${OUT}/${f}`).size / 1024).toFixed(0);
  console.log(
    JSON.stringify({
      homeLight: { height: lightHeight, file: "42-r9-home-desktop-light-full.png", kb: size("42-r9-home-desktop-light-full.png") },
      homeDark: { height: darkHeight, file: "43-r9-home-desktop-dark-full.png", kb: size("43-r9-home-desktop-dark-full.png") },
      aboutLight: { height: aboutHeight, file: "44-r9-about-desktop-light-full.png", kb: size("44-r9-about-desktop-light-full.png") },
      expectedHomeHeight: 5286,
    }, null, 2),
  );
} catch (err) {
  await browser.close();
  console.error("capture failed:", err.message);
  process.exit(1);
}
