// R11 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (the shipped artifact), same doctrine as
// the e2e suite. Series 48–50.
//
// NOTE (R11): a third consecutive zero-findings validation round — no surface
// changed. Home is captured light + dark as the regression baseline (height
// expected unchanged from R7–R10 at 5286px); gallery is captured light to
// refresh its record with the R10 settle pass (filter row + all 12 works).
// (docs/remediation-plan-aurelia-r11.md §5)
//
// Usage: node scripts/capture_aurelia_r11.mjs  (preview server on :4173)
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:4173";
const OUT = "docs/screenshots";

// F1 (R10): native lazy-loaded images below the fold decode after Playwright
// stitches a fullPage capture. Walk the page first so every lazy image is
// requested, then wait for decode before the capture pass.
async function settleLazyImages(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; }),
      ),
    );
  });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();

  // --- home light (48, regression baseline) ---
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await settleLazyImages(page);
  const lightHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/48-r11-home-desktop-light-full.png`, fullPage: true });

  // --- home dark (49) ---
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("aurelia.theme", "dark");
  });
  await settleLazyImages(page);
  const darkHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/49-r11-home-desktop-dark-full.png`, fullPage: true });

  // --- gallery light (50, filter-row record refresh) ---
  await page.goto(`${BASE}/gallery`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("aurelia.theme", "light");
    document.documentElement.classList.remove("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await settleLazyImages(page);
  const galleryHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/50-r11-gallery-desktop-light-full.png`, fullPage: true });

  await browser.close();
  const size = (f) => (fs.statSync(`${OUT}/${f}`).size / 1024).toFixed(0);
  console.log(
    JSON.stringify({
      homeLight: { height: lightHeight, file: "48-r11-home-desktop-light-full.png", kb: size("48-r11-home-desktop-light-full.png") },
      homeDark: { height: darkHeight, file: "49-r11-home-desktop-dark-full.png", kb: size("49-r11-home-desktop-dark-full.png") },
      galleryLight: { height: galleryHeight, file: "50-r11-gallery-desktop-light-full.png", kb: size("50-r11-gallery-desktop-light-full.png") },
      expectedHomeHeight: 5286,
    }, null, 2),
  );
} catch (err) {
  await browser.close();
  console.error("capture failed:", err.message);
  process.exit(1);
}
