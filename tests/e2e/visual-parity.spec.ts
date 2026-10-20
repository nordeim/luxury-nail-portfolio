import { expect, test } from "@playwright/test";

/**
 * Visual parity gate — clone-app-pat-pro doctrine: the gate is MEASURED,
 * never eyeballed. Every assertion pins a computed style on a STABLE
 * selector (aria labels / landmarks, never Tailwind-atomic classes) against
 * the values measured live on the reference (docs/reference-investigation.md
 * §4, Verified via getComputedStyle):
 *
 *   body background   rgb(245,243,239)   (cream)
 *   band / footer     rgb(26,26,26)      (#1A1A1A)
 *   footer body text  rgba(255,255,255,0.8)
 *   display font      "Cormorant Garamond", serif — h1 128px @1920, weight 400
 *   body font         Inter, sans-serif
 *   brand size        24px serif
 *
 * Screenshot diffs stay diagnostics-only; these computed assertions are the
 * acceptance test (clone-app-pat-pro: pixel-diff is never the gate).
 */

test.describe("desktop parity @1920x1080", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("body paints the measured cream ground in Inter", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 243, 239)");
    const font = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toContain("Inter");
  });

  test("hero display heading is Cormorant Garamond at 128px / 400", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Aurelia" });
    const styles = await h1.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { family: computed.fontFamily, size: computed.fontSize, weight: computed.fontWeight };
    });
    expect(styles.family).toContain("Cormorant Garamond");
    expect(styles.size).toBe("128px");
    expect(styles.weight).toBe("400");
  });

  test("hero fills the viewport with the photographic backdrop", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Introduction" });
    const box = await hero.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(1080);
    await expect(hero.locator("img")).toBeVisible();
  });

  test("philosophy band paints the measured #1A1A1A with white serif quote", async ({ page }) => {
    await page.goto("/");
    const band = page.getByRole("region" /* section */, { name: "" }).or(
      page.locator("section[aria-labelledby='philosophy-title']"),
    );
    const section = page.locator("section[aria-labelledby='philosophy-title']");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveCSS("background-color", "rgb(26, 26, 26)");
    const quote = section.getByRole("heading", { level: 2 });
    const styles = await quote.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { family: computed.fontFamily, color: computed.color };
    });
    expect(styles.family).toContain("Cormorant Garamond");
    expect(styles.color).toBe("rgb(255, 255, 255)");
    void band;
  });
  test("the journey CTA is the dark-on-cream button (measured)", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Book Now" });
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(cta).toHaveCSS("color", "rgb(255, 255, 255)");
  });

  test("footer paints #1A1A1A with white/80 body text", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveCSS("background-color", "rgb(26, 26, 26)");
    const tagline = footer.getByText(/Luxury nail artistry for the discerning client/);
    await expect(tagline).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");
  });

  test("brand wordmark is 24px serif", async ({ page }) => {
    await page.goto("/gallery");
    const brand = page.getByLabel("Aurelia — home");
    const styles = await brand.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { size: computed.fontSize, family: computed.fontFamily };
    });
    expect(styles.size).toBe("24px");
    expect(styles.family).toContain("Cormorant Garamond");
  });

  test("nav links carry the measured reference geometry (14px / 0.1em / 400)", async ({ page }) => {
    // R6-02: R1 classified eyebrow px as unmeasured (Reasoned); the live
    // census measured the reference nav at 14px Inter 400, letter-spacing
    // 0.1em (1.4px), uppercase — pinned here against the retuned classes.
    await page.goto("/gallery");
    const link = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Gallery" });
    const styles = await link.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { size: computed.fontSize, tracking: computed.letterSpacing, weight: computed.fontWeight };
    });
    expect(styles.size).toBe("14px");
    expect(styles.tracking).toBe("1.4px");
    expect(styles.weight).toBe("400");
  });

  test("active route is marked with aria-current and the AA gold ink", async ({ page }) => {
    // R6-04: the reference paints the active nav item gold (2.97:1 — an AA
    // fail it ships); the clone echoes the intent with the AA-passing
    // --gold-ink (5.29:1 on cream) plus programmatic aria-current semantics.
    await page.goto("/gallery");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const active = nav.getByRole("link", { name: "Gallery" });
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(active).toHaveCSS("color", "rgb(111, 99, 82)");
    const inactive = nav.getByRole("link", { name: "About" });
    await expect(inactive).not.toHaveAttribute("aria-current", "page");
  });

  test("section eyebrows compute the measured 14px / 0.3em / 400 geometry", async ({ page }) => {
    // R6-02: the @utility eyebrow retune — one source fix, pinned on the
    // gallery page's "The Collection" (reference-measured geometry).
    await page.goto("/gallery");
    const eyebrow = page.getByText("The Collection", { exact: true });
    const styles = await eyebrow.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { size: computed.fontSize, tracking: computed.letterSpacing, weight: computed.fontWeight };
    });
    expect(styles.size).toBe("14px");
    expect(styles.tracking).toBe("4.2px");
    expect(styles.weight).toBe("400");
  });

  test("philosophy quote renders 48px with the measured rose accent span", async ({ page }) => {
    // R6-02/R6-03: reference band anatomy — 48px Cormorant quote with the
    // rose #D4A5A5 accent on "refined elegance" (8.02:1 on the band), rose
    // eyebrow, faint attribution.
    await page.goto("/");
    const section = page.locator("section[aria-labelledby='philosophy-title']");
    await section.scrollIntoViewIfNeeded();
    const quote = section.getByRole("heading", { level: 2 });
    await expect(quote).toHaveCSS("font-size", "48px");
    const accent = quote.locator("span.text-band-accent");
    await expect(accent).toHaveText("refined elegance");
    await expect(accent).toHaveCSS("color", "rgb(212, 165, 165)");
    await expect(section.getByText("The Philosophy", { exact: true })).toHaveCSS(
      "color",
      "rgb(212, 165, 165)",
    );
  });

  test("about h1 is the measured 60px (one step below the other inner pages)", async ({ page }) => {
    // R6-02: the reference About page runs text-5xl lg:text-6xl (48/60px) —
    // measured live at 390 and 1440; the other inner pages stay 72px.
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "60px");
  });

  test("services page shows the measured prices and the add-on band (R6-01)", async ({ page }) => {
    // Reference drift: prices now render next to durations, and the
    // ENHANCEMENTS band carries the four measured add-ons. The booking
    // select (booking-flow spec) stays six services without prices.
    await page.goto("/services");
    const list = page.locator("ul").filter({ has: page.getByRole("heading", { name: "Signature Manicure" }) });
    await expect(list.getByText("$85")).toBeVisible();
    await expect(list.getByText("$200+")).toBeVisible();
    const band = page.locator("section[aria-labelledby='addons-title']");
    await expect(band.getByText("Add-On Services")).toBeVisible();
    for (const [name, price] of [
      ["Hand Massage", "$20"],
      ["Paraffin Treatment", "$25"],
      ["Nail Repair (per nail)", "$15"],
      ["Design Consultation", "Complimentary"],
    ] as const) {
      const row = band.locator("li").filter({ hasText: name });
      await expect(row).toContainText(price);
    }
  });

  test("gallery renders all twelve works with captions", async ({ page }) => {
    await page.goto("/gallery");
    const figures = page.locator("figure");
    await expect(figures).toHaveCount(12);
    for (const name of ["Pearl Essence", "Midnight Garden", "Chrome Dreams", "Blush Hour", "Obsidian"]) {
      await expect(page.locator("figcaption").getByText(name)).toBeVisible();
    }
  });

  test("services lists the six verified services with durations", async ({ page }) => {
    await page.goto("/services");
    for (const [name, duration] of [
      ["Signature Manicure", "60 min"],
      ["Luxury Gel Extension", "90 min"],
      ["Bespoke Nail Art", "120 min"],
      ["Bridal Collection", "180 min"],
      ["Chrome & Specialty", "75 min"],
      ["Maintenance & Refill", "60 min"],
    ] as const) {
      const row = page.locator("li").filter({ hasText: name }).first();
      await expect(row).toContainText(duration);
    }
  });

  test("gallery filter group renders the six measured chips with ALL active (R7-02)", async ({ page }) => {
    // R7-02: the reference ships working category filters between the intro
    // and the grid (measured: active = white on #1a1a1a, inactive = ink on
    // transparent). The clone implements them as an aria-pressed toggle group.
    await page.goto("/gallery");
    const group = page.getByRole("group", { name: "Filter works by category" });
    const chips = group.getByRole("button");
    await expect(chips).toHaveCount(6);
    const all = group.getByRole("button", { name: "All", exact: true });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(all).toHaveCSS("color", "rgb(255, 255, 255)");
    const bridal = group.getByRole("button", { name: "Bridal", exact: true });
    await expect(bridal).toHaveAttribute("aria-pressed", "false");
    await expect(bridal).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("gallery BRIDAL filter shows exactly the three measured works (R7-02)", async ({ page }) => {
    // Reference probe 2026-10-20: BRIDAL → Midnight Garden, Ivory Dreams,
    // Rose Petal. Name-invariant matching (F2): the DOM text is title-case.
    await page.goto("/gallery");
    const group = page.getByRole("group", { name: "Filter works by category" });
    await group.getByRole("button", { name: /bridal/i }).click();
    await expect(page.locator("figure")).toHaveCount(3);
    for (const name of ["Midnight Garden", "Ivory Dreams", "Rose Petal"]) {
      await expect(page.locator("figcaption").getByText(name)).toBeVisible();
    }
    await expect(page.locator("figcaption").getByText("Pearl Essence")).toBeHidden();
    await expect(group.getByRole("button", { name: /bridal/i })).toHaveAttribute("aria-pressed", "true");
    await expect(group.getByRole("button", { name: "All", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("gallery SEASONAL filter shows the two measured works (R7-03)", async ({ page }) => {
    // R7-03: Seasonal exists in the reference's five-cycle — Winter Frost
    // and Autumn Ember. The clone previously had no seasonal category.
    await page.goto("/gallery");
    const group = page.getByRole("group", { name: "Filter works by category" });
    await group.getByRole("button", { name: /seasonal/i }).click();
    await expect(page.locator("figure")).toHaveCount(2);
    for (const name of ["Winter Frost", "Autumn Ember"]) {
      await expect(page.locator("figcaption").getByText(name)).toBeVisible();
    }
  });

  test("gallery ALL restores all twelve works (R7-02)", async ({ page }) => {
    await page.goto("/gallery");
    const group = page.getByRole("group", { name: "Filter works by category" });
    // The measured five-cycle distributes unevenly: avant-garde owns exactly
    // two works (Chrome Dreams, Obsidian).
    await group.getByRole("button", { name: /avant-garde/i }).click();
    await expect(page.locator("figure")).toHaveCount(2);
    await group.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.locator("figure")).toHaveCount(12);
  });

  test("gallery captions carry the measured five-cycle categories (R7-03)", async ({ page }) => {
    // R7-03: the R1 4-cycle inference missed Seasonal — eight works were
    // miscategorized. Pinned on the two most visible corrections.
    await page.goto("/gallery");
    const winter = page.locator("figure").filter({ hasText: "Winter Frost" });
    await expect(winter).toContainText("Seasonal");
    const golden = page.locator("figure").filter({ hasText: "Golden Hour" });
    await expect(golden).toContainText("Editorial");
  });

  test("hero carries the measured tagline (R7-01)", async ({ page }) => {
    // R7-01: reference drift — "…for the extraordinary." replaced the
    // R1-Verified "…for the modern icon."
    await page.goto("/");
    await expect(page.getByText(/Bespoke nail designs for the extraordinary\./)).toBeVisible();
  });

  test("home carries the measured experience paragraphs and attribution (R7-05/06)", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/From the initial consultation to the final design, every detail is thoughtfully considered/),
    ).toBeVisible();
    await expect(
      page.getByText(/blend traditional techniques with contemporary artistry, creating designs that are as unique as you are\./),
    ).toBeVisible();
    // R7-06: em-dash prefix + comma format (uppercase is CSS-level; the DOM
    // text keeps title case).
    await expect(page.getByText("— Aurelia Chen, Founder & Artist")).toBeVisible();
  });

  test("about page renders the measured bio, stats, band, values, featured-in and CTA (R7-04)", async ({ page }) => {
    await page.goto("/about");
    // Eyebrow: "The Artist" (was "Founder & Artist").
    await expect(page.getByText("The Artist", { exact: true })).toBeVisible();
    // Bio + in-column quote.
    await expect(page.getByText(/With over a decade of experience in luxury nail artistry/)).toBeVisible();
    await expect(
      page.getByText(/Trained in both Paris and Tokyo, her work has graced the pages of Vogue/),
    ).toBeVisible();
    await expect(page.getByText(/I believe nails are the ultimate accessory\./)).toBeVisible();
    // Stats row: 3 numbers with their measured labels.
    for (const [value, label] of [
      ["12+", "Years Experience"],
      ["5K+", "Happy Clients"],
      ["50+", "Editorial Features"],
    ] as const) {
      const stat = page.locator("ul > li").filter({ hasText: value }).getByText(label, { exact: true });
      await expect(stat).toBeVisible();
    }
    // Philosophy band with the rose accent on "wearable art".
    const band = page.locator("section[aria-labelledby='about-philosophy-title']");
    await expect(band).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(band.getByText("The Philosophy", { exact: true })).toBeVisible();
    await expect(band.locator("span.text-band-accent")).toHaveText("wearable art");
    await expect(
      band.getByText(/Every appointment at Aurelia begins with understanding—your style, your story, your vision\./),
    ).toBeVisible();
    // Values carry the measured bodies.
    await expect(page.getByText("Every stroke, every detail is executed with unwavering precision and care.")).toBeVisible();
    // Featured-in strip.
    await expect(page.getByText("As Featured In", { exact: true })).toBeVisible();
    for (const name of ["Vogue", "Elle", "Harper's Bazaar", "Allure", "Glamour"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    // CTA support + measured button label.
    await expect(page.getByText("Ready to bring your nail vision to life? I'd love to hear from you.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Book a Consultation" })).toBeVisible();
  });
});

test.describe("mobile parity @390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("portfolio stacks to a single column and captions stay visible", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("section[aria-labelledby='portfolio-title'] li");
    await expect(cards).toHaveCount(4);
    const first = cards.first();
    const second = cards.nth(1);
    const firstBox = await first.boundingBox();
    const secondBox = await second.boundingBox();
    expect(firstBox?.y).toBeLessThan(secondBox?.y ?? 0);
    // Same column on mobile: identical x.
    expect(Math.abs((firstBox?.x ?? 0) - (secondBox?.x ?? 0))).toBeLessThan(2);
    // Touch caption (name) is visible without hover — target the mobile
    // caption span, not the hover-overlay duplicate.
    await expect(first.locator("span.font-display")).toBeVisible();
  });

  test("hero heading scales down responsively (72px at 390w)", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1, name: "Aurelia" });
    await expect(h1).toHaveCSS("font-size", "72px");
  });

  test("no horizontal overflow at any route (mobile usability gate)", async ({ page }) => {
    for (const path of ["/", "/gallery", "/services", "/about", "/booking"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });

  test("mobile menu links compute the measured 30px serif", async ({ page }) => {
    // R6-02: the reference's overlay links measure 30px Cormorant (live,
    // 390×844); the clone shipped an unmeasured 36px (text-4xl) since R1.
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    const link = dialog.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Gallery" });
    const styles = await link.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { size: computed.fontSize, family: computed.fontFamily };
    });
    expect(styles.size).toBe("30px");
    expect(styles.family).toContain("Cormorant Garamond");
  });

  test("mobile menu marks the active route with aria-current", async ({ page }) => {
    // R6-04: the active-route contract reaches the overlay menu too.
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog.getByRole("link", { name: "Gallery", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(dialog.getByRole("link", { name: "About", exact: true })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("gallery filter chips wrap on mobile without horizontal overflow (R7-02)", async ({ page }) => {
    // Reference probe 2026-10-20: at 390px the six chips wrap to three rows
    // with no horizontal overflow — the clone's flex-wrap row must hold too.
    await page.goto("/gallery");
    const group = page.getByRole("group", { name: "Filter works by category" });
    await expect(group.getByRole("button")).toHaveCount(6);
    const box = await group.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(80); // wraps past a single chip row
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
