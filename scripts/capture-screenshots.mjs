// Capture additional dev-server screenshots for docs/screenshots/
// Usage: node scripts/capture-screenshots.mjs (dev server must be on :5173)
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:5173";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
try {
  // --- desktop: place an order, capture success + track result ---
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.locator('a[href^="/product/"]').first().click();
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Proceed to Checkout/ }).first().click();
  await page.waitForTimeout(400);
  await page.getByLabel("Full Name").fill("Doc Capture");
  await page.getByLabel("Phone").fill("5550001234");
  await page.getByLabel("Email", { exact: false }).first().fill("docs@homenest.com");
  await page.getByLabel("Street Address").fill("1 Screenshot Way");
  await page.getByLabel("City").fill("Home City");
  await page.getByLabel("State").fill("HC");
  await page.getByLabel("ZIP").fill("10001");
  await page.getByRole("button", { name: /Place Order/ }).click();
  await page.waitForURL("**/order-success**", { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/order-success.png` });
  const orderNo = (await page.locator("text=/ORD-\\d{4}-\\d{3}/").first().textContent())?.match(/ORD-\d{4}-\d{3}/)?.[0];
  console.log("captured order-success.png; order:", orderNo);

  if (orderNo) {
    await page.goto(`${BASE}/track-order`, { waitUntil: "networkidle" });
    await page.getByLabel(/Order number/i).fill(orderNo);
    await page.getByRole("button", { name: /Track/i }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/track-order-result.png`, fullPage: true });
    console.log("captured track-order-result.png");
  }
  await desktop.close();

  // --- mobile: PDP ---
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    hasTouch: true,
    isMobile: true,
  });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await mpage.locator('a[href^="/product/"]').first().click();
  await mpage.waitForTimeout(500);
  await mpage.screenshot({ path: `${OUT}/mobile-product-detail.png`, fullPage: true });
  console.log("captured mobile-product-detail.png");
  await mobile.close();
  console.log("DONE");
} finally {
  await browser.close();
}
