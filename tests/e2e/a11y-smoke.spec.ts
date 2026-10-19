import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke checks (remediation follow-up #5).
 *
 * GATE: no critical or serious axe violations on the core shopping surfaces,
 * with ONE documented exception — the `color-contrast` rule is excluded from
 * the gate because every failing pair is a *parity-pinned reference token*:
 *
 *   - white on primary orange `rgb(217,110,38)` (nav pill, hero/CTA buttons,
 *     "Featured" card pill — session-38 re-measurement) ~3.2:1
 *   - white on badge amber-400 `rgb(251,191,36)` (star ratings) ~1.9:1
 *   - primary orange on white (card category labels) ~3.2:1
 *   - muted-foreground grays on white/muted surfaces ~4.4:1
 *
 * These combinations are pinned by `tests/e2e/visual-parity.spec.ts` and were
 * measured live from the reference site; the reference itself fails the same
 * checks. Visual parity with the reference is the higher-priority contract
 * (registered divergence — see Project_Architecture_Document.md §5.6 and the
 * remediation plan). Everything structural — labels, roles, accessible names,
 * forms, landmarks, keyboard reachability — is still gated at serious+.
 *
 * The contrast findings are logged (not gated) so regressions in the *count*
 * stay visible when running with `--reporter=line`.
 */

const CONTRAST_RULE = "color-contrast";

async function analyzeForGate(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).disableRules([CONTRAST_RULE]).analyze();
  const contrast = await new AxeBuilder({ page }).withRules([CONTRAST_RULE]).analyze();
  return { results, contrastCount: contrast.violations.reduce((n, v) => n + v.nodes.length, 0) };
}

function serious(results: Awaited<ReturnType<typeof AxeBuilder.prototype.analyze>>) {
  return results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
}

test.describe("a11y smoke", () => {
  test("home page has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/");
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] home: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  test("products page has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/products");
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] products: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  test("product detail has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Damascus Steel Chef Knife Set/i }).first().click();
    await expect(page.getByRole("heading", { name: /Damascus Steel/i })).toBeVisible();
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] pdp: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  test("cart page has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: /Add .+ to cart/ }).first().click();
    await page.goto("/cart");
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] cart: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  // Session-4 extension (remediation plan §9.6.3): the authenticated surfaces
  // join the gate. Login happens through the real UI (demo customer / admin).
  test("account page (authenticated) has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/account$/);
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] account: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  test("admin dashboard (authenticated) has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@homenest.kitchen");
    await page.getByLabel("Password").fill("Admin1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Login lands on /account; navigate to the console, then gate it.
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] admin: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  // Session-5 extension (audit finding): the transactional + support surfaces
  // join the gate — checkout is the highest-stakes form in the funnel.
  test("checkout page has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/product/p-knife-set");
    await page.getByRole("button", { name: /Add to cart/i }).first().click();
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/checkout$/);
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] checkout: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });

  test("contact page has no critical/serious structural violations", async ({ page }) => {
    await page.goto("/contact");
    const { results, contrastCount } = await analyzeForGate(page);
    console.log(`[a11y] contact: ${contrastCount} color-contrast nodes (parity-pinned, documented)`);
    expect(serious(results).map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });
});
