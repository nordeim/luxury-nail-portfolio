// R14 screen captures for docs/screenshots/ — runs against the PRODUCTION
// build served by `vite preview` (spawned here; same doctrine as the e2e
// suite). Series 57–59.
//
// NOTE (R14): a sixth consecutive zero-findings validation round — no surface
// changed. Home is captured light + dark as the regression baseline (height
// expected unchanged from R7–R13 at 5286px); gallery is captured light to
// refresh its record (filter row + all 12 works via the R10 settle pass).
// (docs/remediation-plan-aurelia-r14.md §5)
//
// Usage: node scripts/capture_aurelia_r14.mjs
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { spawn } from "node:child_process";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "docs/screenshots";

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

const preview = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
for (let i = 0; i < 60; i++) {
  const up = await fetch(BASE).then((r) => r.ok).catch(() => false);
  if (up) break;
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await desktop.newPage();

  // --- home light (57, regression baseline) ---
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("aurelia.theme"));
  await page.reload({ waitUntil: "networkidle" });
  await settleLazyImages(page);
  const lightHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/57-r14-home-desktop-light-full.png`, fullPage: true });

  // --- home dark (58) ---
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("aurelia.theme", "dark");
  });
  await settleLazyImages(page);
  const darkHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/58-r14-home-desktop-dark-full.png`, fullPage: true });

  // --- gallery light (59, filter-row record refresh) ---
  await page.goto(`${BASE}/gallery`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("aurelia.theme", "light");
    document.documentElement.classList.remove("dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await settleLazyImages(page);
  const galleryHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: `${OUT}/59-r14-gallery-desktop-light-full.png`, fullPage: true });

  await browser.close();
  const size = (f) => (fs.statSync(`${OUT}/${f}`).size / 1024).toFixed(0);
  console.log(
    JSON.stringify({
      homeLight: { height: lightHeight, file: "57-r14-home-desktop-light-full.png", kb: size("57-r14-home-desktop-light-full.png") },
      homeDark: { height: darkHeight, file: "58-r14-home-desktop-dark-full.png", kb: size("58-r14-home-desktop-dark-full.png") },
      galleryLight: { height: galleryHeight, file: "59-r14-gallery-desktop-light-full.png", kb: size("59-r14-gallery-desktop-light-full.png") },
      expectedHomeHeight: 5286,
    }, null, 2),
  );
} catch (err) {
  await browser.close();
  console.error("capture failed:", err.message);
  process.exit(1);
} finally {
  preview.kill("SIGTERM");
}
