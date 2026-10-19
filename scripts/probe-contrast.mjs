// Probe: dump axe color-contrast violation details per page so we can
// separate genuinely fixable contrast from reference-design artifacts.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";

const pages = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "cart", path: "/cart" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const target of pages) {
  await page.goto(BASE + target.path);
  const results = await new AxeBuilder({ page }).analyze();
  const contrast = results.violations.find((v) => v.id === "color-contrast");
  console.log(`\n=== ${target.name} (${contrast ? contrast.nodes.length : 0} nodes) ===`);
  if (!contrast) continue;
  for (const node of contrast.nodes.slice(0, 12)) {
    const el = await page.locator(node.target.join(",")).first();
    const text = ((await el.textContent().catch(() => "")) ?? "").trim().slice(0, 60);
    // Which rule variant failed
    const anyFail = node.any.find((c) => !c.result)?.message ?? "";
    const ratioMatch = anyFail.match(/([\d.]+):1/g);
    console.log(`- ${node.target.join(" ")} | fg/bg ratio ${ratioMatch?.[0] ?? "?"} | "${text}"`);
  }
}

await browser.close();
