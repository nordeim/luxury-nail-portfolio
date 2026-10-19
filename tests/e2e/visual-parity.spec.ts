import { expect, test } from "@playwright/test";

/**
 * Computed-style visual parity gate — the parity spec is a build-breaker,
 * mirroring the ecommerce-store reference convention ("screenshots are not
 * evidence; computed styles are"). Values measured live 2026-10-12 from
 * nest-culinary-hub.base44.app and from this build via getComputedStyle.
 */

test("body background matches the reference canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(251, 250, 249)");
});

test("primary actions use the reference orange", async ({ page }) => {
  await page.goto("/");
  const activeNav = page.locator('nav[aria-label="Primary"] a[aria-current="page"]');
  await expect(activeNav).toHaveCSS("background-color", "rgb(217, 110, 38)");
  const heroCta = page.locator("main").getByRole("link", { name: "Browse Collection" });
  await expect(heroCta).toHaveCSS("background-color", "rgb(217, 110, 38)");
});

test("headings render the reference display serif", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCSS("font-family", /Playfair Display/);
  await expect(page.locator("h1")).toHaveCSS("font-weight", "700");
});

test("footer uses the reference dark charcoal", async ({ page }) => {
  await page.goto("/");
  // Session-30 re-measurement (2026-10-14, agent-browser @390×844 + 1440×900,
  // logged in): the reference footer flipped from its dedicated charcoal
  // rgb(32,27,24) to bg-foreground — rgb(29,24,22) on fresh loads of / and
  // /products, both viewports. The clone follows the latest measurement.
  await expect(page.locator("footer")).toHaveCSS("background-color", "rgb(29, 24, 22)");
});

test("footer text layer matches the reference quiet-footer spec", async ({ page }) => {
  await page.goto("/");
  // Session-34 re-measurement (2026-10-14, agent-browser @390×844 + 1440×900,
  // logged in): the reference footer renders a "quiet" text layer on the
  // session-30 bg-foreground canvas — full text-background color (rgb(251,
  // 250,249)) modulated by ELEMENT opacity (70% links/tagline/contact, 50%
  // bottom bar), Playfair 16px/600 h4 column headings, a 20px Playfair brand
  // wordmark beside a bare 24px primary house glyph, and a contained 1px
  // background/10 divider. The clone previously mirrored its own header's
  // brand treatment (orange square + white glyph) and used white/60 COLOR
  // alpha on links — visually darker at rest (rendered ~rgb(165,163,162) vs
  // the reference's ~rgb(187,186,185)) and without the orange hover. This
  // spec pins the measured reference values.
  const footer = page.locator("footer");
  await expect(footer).toHaveCSS("color", "rgb(251, 250, 249)");

  const link = footer.getByRole("link", { name: "Products", exact: true });
  await expect(link).toHaveCSS("color", "rgb(251, 250, 249)");
  await expect(link).toHaveCSS("opacity", "0.7");

  const heading = footer.getByRole("heading", { name: "Quick Links", exact: true });
  await expect(heading).toHaveCSS("font-family", /Playfair Display/);
  await expect(heading).toHaveCSS("font-size", "16px");
  await expect(heading).toHaveCSS("font-weight", "600");

  const brand = footer.locator("span.font-display");
  await expect(brand).toHaveCSS("font-size", "20px");
  await expect(brand).toHaveCSS("font-weight", "700");

  const bottomLink = footer.getByRole("link", { name: "Privacy", exact: true });
  await expect(bottomLink).toHaveCSS("font-size", "12px");
  await expect(bottomLink).toHaveCSS("opacity", "0.5");

  const divider = footer.locator(".bg-footer-rule");
  await expect(divider).toHaveCSS("background-color", "rgba(251, 250, 249, 0.1)");
  await expect(divider).toHaveCSS("height", "1px");
});

test("header brand mark matches the reference geometry", async ({ page }) => {
  await page.goto("/");
  // Session-34 measurement (same sweep): the reference's header brand mark
  // is a 36px rounded-xl (12px) primary square with a 20px stroke-2 house
  // glyph and shadow-sm → shadow-md on group hover, beside a 20px/700
  // Playfair wordmark with default letter-spacing. The clone ported
  // rounded-lg + text-[1.4rem] + tracking-tight + stroke 2.2 — pinned here
  // to the measured reference values.
  const brandLink = page
    .locator("header")
    .getByRole("link", { name: "HomeNest home" });
  const mark = brandLink.locator("span.bg-primary");
  await expect(mark).toHaveCSS("border-radius", "12px");
  await expect(mark).toHaveCSS("width", "36px");

  const wordmark = brandLink.locator("span.font-display");
  await expect(wordmark).toHaveCSS("font-family", /Playfair Display/);
  await expect(wordmark).toHaveCSS("font-size", "20px");
  await expect(wordmark).toHaveCSS("font-weight", "700");
  await expect(wordmark).toHaveCSS("letter-spacing", "normal");
});

test("body text renders in the reference's Inter", async ({ page }) => {
  await page.goto("/");
  // Session-34 measurement (same sweep): the reference self-hosts Inter
  // (weights 300–700, document.fonts) and sets its body font to Inter —
  // every non-display glyph renders in Inter. The clone shipped the system
  // sans stack (v1 port); pinned here so body typography matches. Inter
  // loads from Google Fonts exactly like the existing Playfair link, with
  // the system stack retained as the offline fallback.
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family.startsWith("Inter")).toBe(true);
  const interReady = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("16px Inter");
  });
  expect(interReady).toBe(true);
});

test("product cards show discount and featured pills with round geometry", async ({ page }) => {
  await page.goto("/products");
  const discount = page.locator("article").filter({ hasText: "Damascus Steel Chef Knife Set" }).first().getByText("-29%");
  await expect(discount).toHaveCSS("background-color", "rgb(220, 40, 40)");
  await expect(discount).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("cart badge uses the primary orange", async ({ page }) => {
  await page.goto("/products");
  await page.locator('button[aria-label^="Add Damascus Steel Chef Knife Set"]').first().click();
  const badge = page.locator('button[aria-label="Open cart"] span');
  await expect(badge).toHaveText("1");
  await expect(badge).toHaveCSS("background-color", "rgb(217, 110, 38)");
});

test("sticky header matches the reference glass layer", async ({ page }) => {
  await page.goto("/");
  // Session-36 measurement (logged-in reference, 390x844 + 1440x900):
  // the reference's sticky nav paints rgba(255,255,255,0.8) with a
  // 24px backdrop frost and a 0.5-alpha hairline. The clone shipped
  // bg-card/95 + blur(8px) + a solid border (v1 port, never measured).
  // The white/80 alpha is baked into the --color-panel token (T-13
  // doctrine: v4 /80 would color-mix in oklab, not rgba).
  const header = page.locator("header");
  await expect(header).toHaveCSS("background-color", "rgba(255, 255, 255, 0.8)");
  await expect(header).toHaveCSS("backdrop-filter", "blur(24px)");
  await expect(header).toHaveCSS("border-bottom-width", "1px");
  await expect(header).toHaveCSS("border-bottom-color", "rgba(229, 224, 220, 0.5)");
});

test("hero text layer matches the reference scale", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1").first();
  const p = h1.locator("..").locator("p").first();
  // Session-36 measurement: the reference hero renders
  // text-4xl md:text-6xl (36 -> 60px, leading-tight) with the
  // paragraph at text-lg md:text-xl (18 -> 20px), white/80, max-w-lg.
  // The clone shipped 2.4rem/5xl/6xl + 16px/85%/max-w-md.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  await expect(h1).toHaveCSS("font-size", isMobile ? "36px" : "60px");
  await expect(h1).toHaveCSS("font-weight", "700");
  await expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(p).toHaveCSS("font-size", isMobile ? "18px" : "20px");
  await expect(p).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");
  await expect(p).toHaveCSS("max-width", "512px");
});

test("hero CTA and carousel controls match the reference geometry", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1").first();
  const hero = h1.locator("xpath=ancestor::div[3]");
  // CTA: the reference ships an h-10 (40px) pill with text-base/600
  // and px-8 (32px) padding (session-36). The clone shipped h-12/px-7/
  // text-sm.
  const cta = hero.locator("a", { hasText: /shop|browse|view/i }).first();
  const ctaBox = await cta.boundingBox();
  expect(Math.round(ctaBox?.height ?? 0)).toBe(40);
  await expect(cta).toHaveCSS("font-size", "16px");
  await expect(cta).toHaveCSS("font-weight", "600");
  await expect(cta).toHaveCSS("padding-left", "32px");
  // Carousel dots: active 32x6 white, inactive 16x6 white/40.
  const activeDot = page.getByRole("button", { name: "Show slide 1" });
  const inactiveDot = page.getByRole("button", { name: "Show slide 2" });
  await expect(activeDot).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const adBox = await activeDot.boundingBox();
  expect(Math.round(adBox?.width ?? 0)).toBe(32);
  expect(Math.round(adBox?.height ?? 0)).toBe(6);
  await expect(inactiveDot).toHaveCSS("background-color", "rgba(255, 255, 255, 0.4)");
  const idBox = await inactiveDot.boundingBox();
  expect(Math.round(idBox?.width ?? 0)).toBe(16);
  expect(Math.round(idBox?.height ?? 0)).toBe(6);
  // Arrows: 40px discs, white/10 with a 12px frost.
  const prev = page.getByRole("button", { name: "Previous slide" });
  const prevBox = await prev.boundingBox();
  expect(Math.round(prevBox?.width ?? 0)).toBe(40);
  expect(Math.round(prevBox?.height ?? 0)).toBe(40);
  await expect(prev).toHaveCSS("background-color", "rgba(255, 255, 255, 0.1)");
  await expect(prev).toHaveCSS("backdrop-filter", "blur(12px)");
});

test("home section headers match the reference scale and copy", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement (logged-in reference, 390x844 + 1440x900): the
  // reference's home section headings are font-heading text-2xl md:text-3xl
  // (24 -> 30px, 700) with 16px text-muted-foreground subtitles (mt-2 for
  // the centered category block, mt-1 for the row headers). The clone
  // shipped text-3xl md:text-4xl (30 -> 36px) with 14px mt-3 subtitles and
  // its own copy; the reference's copy is pinned verbatim below.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const catH2 = page.getByRole("heading", { name: "Shop by Category" });
  await expect(catH2).toHaveCSS("font-size", isMobile ? "24px" : "30px");
  await expect(catH2).toHaveCSS("font-weight", "700");
  const catSub = catH2.locator("..").locator("p");
  await expect(catSub).toHaveCSS("font-size", "16px");
  await expect(catSub).toHaveCSS("margin-top", "8px");
  await expect(catSub).toHaveText("Find exactly what you need for your home");

  const featH2 = page.getByRole("heading", { name: "Featured Products" });
  await expect(featH2).toHaveCSS("font-size", isMobile ? "24px" : "30px");
  const featSub = featH2.locator("..").locator("p");
  await expect(featSub).toHaveCSS("font-size", "16px");
  await expect(featSub).toHaveCSS("margin-top", "4px");
  await expect(featSub).toHaveText("Hand-picked favorites for your home");

  const newArrH2 = page.getByRole("heading", { name: "New Arrivals" });
  const newArrSub = newArrH2.locator("..").locator("p");
  await expect(newArrSub).toHaveText("The latest additions to our collection");

  // The reference has NO "View All" pill in its section headers (the
  // clone's pill was a v1 invention; the header row carries carousel
  // arrows instead — pinned in the carousel test).
  const featuredSection = featH2.locator("xpath=ancestor::section[1]");
  await expect(featuredSection.getByRole("link", { name: "View All" })).toHaveCount(0);
});

test("category section renders the reference icon tiles", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the reference's "Shop by Category" grid is
  // compact ICON TILES (grid-cols-4 mobile / grid-cols-8 desktop, gap-3):
  // white bg-card tiles, rounded-2xl in the v3 scale = 16px, border/50,
  // p-5, flex-col items-center gap-3; a 56px rounded-[16px] per-category
  // gradient disc (explicit linear-gradient, v3 from-*-400 -> to-*-500)
  // with a 28px white glyph; a 14px/500 label. The clone shipped
  // full-width photo cards with a dark overlay (never measured).
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const region = page.getByRole("region", { name: "Shop by Category" });
  const grid = region.locator("div.grid").first();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 4 : 8);
  expect(await grid.locator("a[href*='category']").count()).toBe(8);

  const tile = grid.locator("a[href*='category']").first();
  const tileCard = tile.locator("div").first();
  await expect(tileCard).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(tileCard).toHaveCSS("border-radius", "16px");
  await expect(tileCard).toHaveCSS("border-top-color", "rgba(229, 224, 220, 0.5)");
  await expect(tileCard).toHaveCSS("padding", "20px");

  const disc = tileCard.locator("div").first();
  const discBox = await disc.boundingBox();
  expect(Math.round(discBox?.width ?? 0)).toBe(56);
  expect(Math.round(discBox?.height ?? 0)).toBe(56);
  await expect(disc).toHaveCSS("border-radius", "16px");
  const discBg = await disc.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(discBg).toContain("linear-gradient");
  expect(discBg).toContain("rgb(251, 146, 60)"); // cookware: orange-400 -> red-500

  const label = tileCard.locator("span, p").last();
  await expect(label).toHaveText("Cookware");
  await expect(label).toHaveCSS("font-size", "14px");
  await expect(label).toHaveCSS("font-weight", "500");
});

test("featured and arrival rows are the reference scroll carousels", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: Featured (6 cards) and New Arrivals (8) are
  // horizontal scroll-snap carousels — flex gap-5 overflow-x-auto pb-4
  // scrollbar-hide snap-x snap-mandatory with min-w-[260px] max-w-[280px]
  // snap-start flex-shrink-0 cells — with two w-10 h-10 border-chevron
  // arrow buttons in the header row. The clone shipped responsive grids.
  const featH2 = page.getByRole("heading", { name: "Featured Products" });
  const featRow = featH2.locator(
    "xpath=following::div[contains(@class,'overflow-x-auto')][1]",
  );
  await expect(featRow).toHaveCSS("overflow-x", "auto");
  await expect(featRow).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(featRow).toHaveCSS("column-gap", "20px");
  expect(await featRow.locator("article").count()).toBe(6);

  const cell = featRow.locator("div").first();
  await expect(cell).toHaveCSS("min-width", "260px");
  await expect(cell).toHaveCSS("max-width", "280px");
  await expect(cell).toHaveCSS("flex-shrink", "0");

  const newH2 = page.getByRole("heading", { name: "New Arrivals" });
  const newRow = newH2.locator(
    "xpath=following::div[contains(@class,'overflow-x-auto')][1]",
  );
  expect(await newRow.locator("article").count()).toBe(8);

  // Header arrow buttons: 40px, hairline border, transparent at rest.
  const arrow = featH2.locator("xpath=../..").locator("button").first();
  const arrowBox = await arrow.boundingBox();
  expect(Math.round(arrowBox?.width ?? 0)).toBe(40);
  expect(Math.round(arrowBox?.height ?? 0)).toBe(40);
  await expect(arrow).toHaveCSS("border-top-width", "1px");
  await expect(arrow).toHaveCSS("border-top-color", "rgb(229, 224, 220)");
});

test("product cards match the reference chrome, badges, and quick-add", async ({ page }) => {
  await page.goto("/products");
  // Session-38 measurement (reference /products + home carousels — same
  // card): rounded-2xl(v3)=16px, border-border/50, shadow-sm at rest with
  // hover:shadow-xl + -translate-y-1 (duration-500); badges are semibold
  // py-0.5 pills with shadow, the FEATURED pill is bg-primary (orange —
  // the session-1 "badge amber" pin is superseded); stars fill amber-400
  // rgb(251,191,36) with a 2px gap; the name is text-base/600
  // line-clamp-2; the quick-add is a hover-REVEALED 36px pill (p-2.5 +
  // 16px shopping-cart glyph, bg-card/90 -> rgba(255,255,255,0.9),
  // backdrop-blur 4px, shadow-lg) — invisible at rest, exactly like the
  // reference.
  const card = page.locator("article").filter({ hasText: "Damascus Steel Chef Knife Set" }).first();
  await expect(card).toHaveCSS("border-radius", "16px");
  await expect(card).toHaveCSS("border-top-color", "rgba(229, 224, 220, 0.5)");

  const featured = card.getByText("Featured", { exact: true });
  await expect(featured).toHaveCSS("background-color", "rgb(217, 110, 38)");
  const discount = card.getByText("-29%");
  await expect(discount).toHaveCSS("padding", "2px 10px");
  await expect(discount).toHaveCSS("font-weight", "600");

  const star = card.locator("svg.lucide-star").first();
  await expect(star).toHaveCSS("fill", "rgb(251, 191, 36)");

  const h3 = card.getByRole("heading", { name: "Damascus Steel Chef Knife Set" });
  await expect(h3).toHaveCSS("font-size", "16px");
  await expect(h3).toHaveCSS("font-weight", "600");
  const catLabel = card.locator("p.text-primary, p.uppercase").first();
  await expect(catLabel).toHaveCSS("font-size", "12px");
  await expect(catLabel).toHaveCSS("font-weight", "500");

  const quickAdd = card.locator('button[aria-label^="Add Damascus"]');
  const quickWrap = quickAdd.locator("xpath=..");
  await expect(quickWrap).toHaveCSS("opacity", "0");
  const qaBox = await quickAdd.boundingBox();
  expect(Math.round(qaBox?.width ?? 0)).toBe(36);
  expect(Math.round(qaBox?.height ?? 0)).toBe(36);
  await expect(quickAdd).toHaveCSS("background-color", "rgba(255, 255, 255, 0.9)");
  await expect(quickAdd).toHaveCSS("backdrop-filter", "blur(4px)");
  expect(await quickAdd.locator("svg.lucide-shopping-cart").count()).toBe(1);
});

test("feature bar matches the reference compact cards", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: FB items are p-4 gap-3 rounded-2xl(v3=16px)
  // bg-card border-border/50 cards (no shadow) with a 44px rounded-xl
  // (v3=12px) bg-primary/10 disc carrying a 20px stroke-2 glyph; titles
  // text-sm font-semibold, subs text-xs (12px); the grid is
  // grid-cols-2 md:grid-cols-4 gap-4. The clone shipped p-5/rounded-xl
  // (v4 20px)/shadow-card, 48px discs with 24px stroke-1.8 glyphs, bold
  // titles, and 14px subs.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const section = page.getByRole("region", { name: "Store highlights" });
  const grid = section.locator("div.grid").first();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 2 : 4);

  const item = grid.locator("div").first();
  await expect(item).toHaveCSS("border-radius", "16px");
  await expect(item).toHaveCSS("padding", "16px");
  await expect(item).toHaveCSS("box-shadow", "none");

  const disc = item.locator("span, div").first();
  const discBox = await disc.boundingBox();
  expect(Math.round(discBox?.width ?? 0)).toBe(44);
  expect(Math.round(discBox?.height ?? 0)).toBe(44);
  await expect(disc).toHaveCSS("background-color", "rgba(217, 110, 38, 0.1)");

  const title = item.getByText("Free Shipping", { exact: true });
  await expect(title).toHaveCSS("font-weight", "600");
  const sub = item.getByText("On orders over $50", { exact: true });
  await expect(sub).toHaveCSS("font-size", "12px");
});

test("CTA banner matches the reference gradient card", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the CTA is a rounded-3xl (24px) card painted
  // with linear-gradient(to right, rgb(217,110,38), rgba(217,110,38,0.8)),
  // p-10 md:p-16 text-center; the paragraph is text-lg md:text-xl
  // white/80 max-w-2xl mb-8; the button is the reference's CREAM pill —
  // rgb(243,238,232) bg, rgb(44,36,33) text, h-10 px-8 14px/600
  // (hover -> the cream at 0.8 alpha). The clone shipped a solid orange
  // card with a pure-white 48px button.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const h2 = page.getByRole("heading", { name: "Transform Your Kitchen Today" });
  const wrap = h2.locator("xpath=..");
  await expect(wrap).toHaveCSS("border-radius", "24px");
  await expect(wrap).toHaveCSS("padding", isMobile ? "40px" : "64px");
  const bg = await wrap.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain("linear-gradient(to right");
  expect(bg).toContain("rgb(217, 110, 38)");
  expect(bg).toContain("rgba(217, 110, 38, 0.8)");

  const p = wrap.locator("p").first();
  // text-lg flat — 18px at BOTH viewports (re-measured; an early sweep
  // reading of "20px/512px" had accidentally measured the HERO paragraph).
  await expect(p).toHaveCSS("font-size", "18px");
  await expect(p).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");

  const btn = wrap.getByRole("link", { name: "Browse All Products" });
  const btnBox = await btn.boundingBox();
  expect(Math.round(btnBox?.height ?? 0)).toBe(40);
  await expect(btn).toHaveCSS("background-color", "rgb(243, 238, 232)");
  await expect(btn).toHaveCSS("color", "rgb(44, 36, 33)");
  await expect(btn).toHaveCSS("font-size", "14px");
});

test("hero container matches the reference geometry", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the hero card is h-[500px] md:h-[600px]
  // (fixed) with rounded-3xl (24px) corners and a BLACK three-stop tint —
  // linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.3),
  // rgba(0,0,0,0)) — over the photo; the text column is max-w-2xl
  // px-8 md:px-16, vertically centered; the dots sit bottom-6 left-8
  // md:left-16 with gap-3. The clone shipped min-h 420/520, a warm
  // two-stop tint, a max-w-7xl px-6/10 column, and left-6/10 dots.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const heroCard = page.locator("h1").first().locator("xpath=ancestor::div[3]");
  expect(Math.round((await heroCard.boundingBox())?.height ?? 0)).toBe(isMobile ? 500 : 600);
  await expect(heroCard).toHaveCSS("border-radius", "24px");

  const overlay = heroCard.locator("div[class*='absolute inset-0']").first();
  const tint = await overlay.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(tint).toContain("rgba(0, 0, 0, 0.6)");
  expect(tint).toContain("rgba(0, 0, 0, 0.3)");
  expect(tint).toContain("rgba(0, 0, 0, 0)");

  const textCol = page.locator("h1").first().locator("xpath=ancestor::div[contains(@class,'max-w-2xl')]");
  await expect(textCol).toHaveCSS("padding-left", isMobile ? "32px" : "64px");

  const dots = page.getByRole("button", { name: "Show slide 1" }).locator("xpath=..");
  await expect(dots).toHaveCSS("column-gap", "12px");
  await expect(dots).toHaveCSS("left", isMobile ? "32px" : "64px");
});

test("account and cart buttons show the reference green hover disc", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the reference's account and cart buttons
  // share the menu trigger's hover treatment (session-36) — an
  // accent-green disc rgb(69,161,130) with a white glyph at 150ms.
  // The clone's buttons had no hover treatment at all (resting states
  // stay the pinned plain dark glyphs).
  const account = page.getByRole("link", { name: /Account|Sign in/ });
  await account.hover();
  await expect(account).toHaveCSS("background-color", "rgb(69, 161, 130)");
  await expect(account).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(account).toHaveCSS("transition-duration", "0.15s");

  const cart = page.getByRole("button", { name: "Open cart" });
  await cart.hover();
  await expect(cart).toHaveCSS("background-color", "rgb(69, 161, 130)");
  await expect(cart).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("PDP action row matches the reference layout and heights", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // Session-36 measurement: the reference's PDP action row is a ROW at
  // every width (flex gap-3): Add-to-Cart h-10 px-8 flex-1 (14px/500,
  // shadow, hover:bg-primary/90), Buy Now h-10 px-6 with NO flex-1.
  // The clone shipped flex-col-on-mobile with BOTH flex-1 h-12 — the
  // flex algorithm ignores height under flex-basis 0% and collapsed
  // both buttons to 20-22px on mobile (the F36-11 collapse bug).
  const add = page.getByRole("button", { name: "Add to Cart" });
  const buy = page.getByRole("button", { name: "Buy Now" });
  for (const btn of [add, buy]) {
    const box = await btn.boundingBox();
    expect(Math.round(box?.height ?? 0)).toBe(40);
    await expect(btn).toHaveCSS("font-weight", "500");
    await expect(btn).toHaveCSS("border-radius", "9999px");
  }
  await expect(add).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(add).toHaveCSS("padding-left", "32px");
  // Row layout at EVERY width: both buttons share one horizontal line.
  const addBox = await add.boundingBox();
  const buyBox = await buy.boundingBox();
  expect(Math.round(Math.abs(addBox!.y - buyBox!.y))).toBe(0);
  // flex-1 only on Add (Buy is content-width).
  expect(addBox!.width).toBeGreaterThan(buyBox!.width + 40);
});

/* ── Session-39 (seventeenth sweep): the PDP/catalog-page layer + content-page
   rhythm, measured live 2026-10-14 (agent-browser @390×844 + 1440×900, logged
   in; remediation plan §28). RED first, then GREEN. ── */

test("PDP wrapper rhythm and gallery surface match the reference", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-01: one space-y-16 wrapper (64px) owns the rhythm — py-8, no mt-6/mt-16.
  // (v4's space-y puts the space on margin-block-end of non-last children.)
  const wrap = page.locator("main > div");
  const back = wrap.getByRole("link", { name: "Back to Products" });
  await expect(back).toHaveCSS("margin-bottom", "64px");
  await expect(wrap).toHaveCSS("padding-top", "32px");
  // F39-03/F40-01: the gallery is an aspect-square 24px-radius muted/30 tile
  // (the reference's bg-muted/30 computes rgba(242,240,237,0.3)) WITH the
  // border-border/50 hairline — measured on all 8 reference PDPs in
  // session-40; the s39 "no border" reading is superseded.
  const gallery = page.locator("main [class*='grid-cols-2'] > div").first();
  await expect(gallery).toHaveCSS("border-radius", "24px");
  await expect(gallery).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(gallery).toHaveCSS("background-color", "rgba(242, 240, 237, 0.3)");
  await expect(gallery).toHaveCSS("aspect-ratio", "1 / 1");
});

test("PDP grid splits at the reference md breakpoint", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-02: the reference goes side-by-side from 768px (md:grid-cols-2); the
  // clone stacked through 1023px (lg). At the mobile project (390px) the
  // grid stays 1-col on both; the desktop project (1440px) asserts 2.
  const viewport = page.viewportSize();
  const grid = page.locator("main [class*='grid-cols-2']");
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(viewport && viewport.width < 768 ? 1 : 2);
  await expect(grid).toHaveCSS("column-gap", "40px");
});

test("PDP info text layer matches the reference rows", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  // F39-04: the info column is one space-y-6 column (24px on margin-block-end).
  const info = page.locator("main [class*='grid-cols-2'] > div").nth(1);
  await expect(info.locator("xpath=child::*[1]")).toHaveCSS("margin-bottom", "24px");
  // F39-05: category label 14px/500, ls 0.7px, primary.
  const label = info.locator("p").first();
  await expect(label).toHaveCSS("font-size", "14px");
  await expect(label).toHaveCSS("font-weight", "500");
  await expect(label).toHaveCSS("letter-spacing", "0.7px");
  await expect(label).toHaveCSS("color", "rgb(217, 110, 38)");
  await expect(label).toHaveText(/Kitchen Tools/i);
  // F39-06: h1 text-3xl (30px) at mobile, text-4xl (36px) at md+.
  const h1 = info.getByRole("heading", { name: "Damascus Steel Chef Knife Set", exact: true });
  await expect(h1).toHaveCSS("font-size", isMobile ? "30px" : "36px");
  await expect(h1).toHaveCSS("font-weight", "700");
  await expect(h1).toHaveCSS("font-family", /Playfair Display/);
  // F39-07: rating — 20px amber stars + ONE muted "4.9 (412 reviews)" span.
  const star = info.locator("svg").first();
  await expect(star).toHaveCSS("width", "20px");
  await expect(star).toHaveCSS("color", "rgb(251, 191, 36)");
  const ratingText = info.getByText(/\(412 reviews\)/);
  await expect(ratingText).toHaveCSS("font-size", "14px");
  await expect(ratingText).toHaveCSS("font-weight", "400");
  await expect(ratingText).toHaveCSS("color", "rgb(126, 111, 103)");
  // F39-08: stock 16px/400 foreground + a green icon.
  const stock = info.getByText("In Stock", { exact: true });
  await expect(stock).toHaveCSS("font-size", "16px");
  await expect(stock).toHaveCSS("color", "rgb(29, 24, 22)");
  // F39-09: Description is an h3 16px/600 + a 16px/26px muted paragraph.
  const descHeading = info.getByRole("heading", { name: "Description", exact: true });
  await expect(descHeading).toHaveCSS("font-size", "16px");
  await expect(descHeading).toHaveCSS("font-weight", "600");
  const descP = info.getByText(/Professional 5-piece knife set/);
  await expect(descP).toHaveCSS("font-size", "16px");
  await expect(descP).toHaveCSS("line-height", "26px");
  await expect(descP).toHaveCSS("color", "rgb(126, 111, 103)");
});

test("PDP tags are the reference cream pills", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-10: feature tags — bg rgb(243,238,232) (the secondary cream), text
  // rgb(44,36,33), 12px, 2px 10px padding, 9999px radius.
  const tag = page.getByText("gift set", { exact: true });
  await expect(tag).toHaveCSS("background-color", "rgb(243, 238, 232)");
  await expect(tag).toHaveCSS("color", "rgb(44, 36, 33)");
  await expect(tag).toHaveCSS("font-size", "12px");
  await expect(tag).toHaveCSS("padding", "2px 10px");
  await expect(tag).toHaveCSS("border-radius", "9999px");
});

test("PDP quantity stepper matches the reference muted pill", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-11: 36px muted pill (bg rgb(242,240,237)), NO border, 16px value.
  const stepper = page.getByLabel("Decrease quantity").locator("xpath=..");
  await expect(stepper).toHaveCSS("height", "36px");
  await expect(stepper).toHaveCSS("background-color", "rgb(242, 240, 237)");
  await expect(stepper).toHaveCSS("border-width", "0px");
  await expect(stepper).toHaveCSS("border-radius", "9999px");
  const value = stepper.getByText("1", { exact: true });
  await expect(value).toHaveCSS("font-size", "16px");
});

test("PDP related section is the reference carousel", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-12: space-y-6 section (24px on margin-block-end); header row (h2 +
  // subtitle + 2×40px arrows); a scroll-snap carousel row (not a grid).
  const section = page.locator("main section");
  await expect(section.locator("xpath=child::*[1]")).toHaveCSS("margin-bottom", "24px");
  const h2 = section.getByRole("heading", { name: "You May Also Like", exact: true });
  await expect(h2).toHaveCSS("font-family", /Playfair Display/);
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  await expect(h2).toHaveCSS("font-size", isMobile ? "24px" : "30px");
  const arrows = section.getByRole("button", { name: /Scroll products/ });
  await expect(arrows).toHaveCount(2);
  for (const arrow of await arrows.all()) {
    const box = await arrow.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(40);
    expect(Math.round(box?.height ?? 0)).toBe(40);
  }
  const row = section.locator("div.scrollbar-hide");
  const rowStyles = await row.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { overflow: cs.overflowX, snap: cs.scrollSnapType, display: cs.display };
  });
  expect(rowStyles.overflow).toBe("auto");
  expect(rowStyles.snap).toContain("x mandatory");
  expect(rowStyles.display).toBe("flex");
});

test("PDP info column carries no shipping or returns rows", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // F39-13: the reference's info column ends at the qty/action rows — the
  // clone's "Free shipping over $50" / "30-day returns" / shippingNote rows
  // were resting-visual superset violations on a parity surface.
  const info = page.locator("main [class*='grid-cols-2'] > div").nth(1);
  await expect(info.getByText(/Free shipping over \$50/)).toHaveCount(0);
  await expect(info.getByText(/30-day returns/)).toHaveCount(0);
  await expect(info.getByText(/^Shipping:/)).toHaveCount(0);
});

test("products page header and filter row match the reference scale", async ({ page }) => {
  await page.goto("/products");
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const wrap = page.locator("main > div");
  // F39-14: py-8 space-y-8 (32px rhythm on margin-block-end).
  await expect(wrap).toHaveCSS("padding-top", "32px");
  await expect(wrap.locator("xpath=child::*[1]")).toHaveCSS("margin-bottom", "32px");
  // F39-15: h1 30px at mobile / 36px at md+; the count is 16px.
  const h1 = wrap.getByRole("heading", { name: /All Products|Shop/i });
  await expect(h1).toHaveCSS("font-size", isMobile ? "30px" : "36px");
  const count = wrap.getByText(/products? found/);
  await expect(count).toHaveCSS("font-size", "16px");
  // F39-16: h-9 (36px) controls — search 16px font, selects 14px/400.
  const search = wrap.getByLabel("Search products");
  await expect(search).toHaveCSS("height", "36px");
  await expect(search).toHaveCSS("font-size", "16px");
  await expect(search).toHaveCSS("border-radius", "9999px");
  const category = wrap.getByLabel("Filter by category");
  await expect(category).toHaveCSS("height", "36px");
  await expect(category).toHaveCSS("font-size", "14px");
  await expect(category).toHaveCSS("font-weight", "400");
});

test("products grid is two-up at mobile like the reference", async ({ page }) => {
  await page.goto("/products");
  // F39-16: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 (2-up at 390px; the
  // clone shipped 1-up until sm). Cards land in the 169-289px band.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const grid = page.locator("main [class*='grid-cols-2']");
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 2 : 4);
  const card = page.locator("main article").first();
  const box = await card.boundingBox();
  expect(Math.round(box?.width ?? 0)).toBeLessThan(isMobile ? 200 : 320);
});

test("contact page matches the reference rhythm and card chrome", async ({ page }) => {
  await page.goto("/contact");
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const wrap = page.locator("main > div");
  // F39-17: py-12 space-y-12 (48px rhythm on margin-block-end); the page
  // ends at the form.
  await expect(wrap).toHaveCSS("padding-top", "48px");
  await expect(wrap.locator("xpath=child::*[1]")).toHaveCSS("margin-bottom", "48px");
  // Info cards: 16px radius, the 0.5-alpha hairline, no shadow. The grid
  // is the wrapper's second child (header, info grid, form).
  const grid = wrap.locator("div.grid").first();
  const card = grid.locator("div").first();
  await expect(card).toHaveCSS("border-radius", "16px");
  await expect(card).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(card).toHaveCSS("box-shadow", "none");
  // Grid: md:grid-cols-3 (stacked at mobile, 3-up at md+), gap-6 (24px).
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 1 : 3);
  await expect(grid).toHaveCSS("gap", "24px");
  // Form: p-8 (32px), 16px radius, bg-card, no shadow.
  const form = wrap.locator("form");
  await expect(form).toHaveCSS("padding", "32px");
  await expect(form).toHaveCSS("border-radius", "16px");
  await expect(form).toHaveCSS("background-color", "rgb(255, 255, 255)");
  // The trailing self-service row is gone (the reference ends at the form).
  await expect(wrap.getByText(/Prefer self-service/)).toHaveCount(0);
});

test("about page wrapper matches the reference measure", async ({ page }) => {
  await page.goto("/about");
  const viewport = page.viewportSize();
  // F39-18: max-w-4xl (896px) at desktop, py-12 space-y-12 rhythm.
  const wrap = page.locator("main > div");
  await expect(wrap).toHaveCSS("padding-top", "48px");
  await expect(wrap.locator("xpath=child::*[1]")).toHaveCSS("margin-bottom", "48px");
  if (viewport && viewport.width >= 1024) {
    await expect(wrap).toHaveCSS("max-width", "896px");
  }
});

/* ── Session-40: the watch-list closure layer ─────────────────────────── */

test("PDP gallery tile carries the reference hairline", async ({ page }) => {
  await page.goto("/product/p-copper-pan");
  // F40-01: measured on all 8 reference PDPs — the tile is an aspect-square
  // 24px-radius bg-muted/30 tile WITH border border-border/50 (1px
  // rgba(229,224,220,0.5)). The s39 "no border" pin is superseded.
  const tile = page.locator("main img").first().locator("..");
  await expect(tile).toHaveCSS("border-top-width", "1px");
  await expect(tile).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(tile).toHaveCSS("border-radius", "24px");
  await expect(tile).toHaveCSS("background-color", "rgba(242, 240, 237, 0.3)");
});

test("about header matches the reference measure", async ({ page }) => {
  await page.goto("/about");
  // F40-02..04: text-center space-y-4 rhythm; h1 FLAT text-4xl (36px, no
  // responsive scale); subtitle text-lg 18px/28px muted.
  const wrap = page.locator("main > div");
  const header = wrap.locator("xpath=child::*[1]");
  await expect(header).toHaveCSS("text-align", "center");
  await expect(header.locator("h1")).toHaveCSS("font-size", "36px");
  await expect(header.locator("h1")).toHaveCSS("margin-bottom", "16px");
  await expect(header.locator("p")).toHaveCSS("font-size", "18px");
  await expect(header.locator("p")).toHaveCSS("line-height", "28px");
  await expect(header.locator("p")).toHaveCSS("color", "rgb(126, 111, 103)");
});

test("about story grid and card chrome match the reference", async ({ page }) => {
  await page.goto("/about");
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  // F40-05: grid md:grid-cols-2 gap-6 — the tablet band stays 1-col.
  const grid = page.locator("main > div > div.grid");
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 1 : 2);
  await expect(grid).toHaveCSS("gap", "24px");
  // F40-06/07: p-6 rounded-2xl(16px) bg-card border/50 NO shadow, 12px
  // internal rhythm; icon disc rounded-xl = 12px (trap #6: explicit radii).
  const card = grid.locator("div").first();
  await expect(card).toHaveCSS("border-radius", "16px");
  await expect(card).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(card).toHaveCSS("box-shadow", "none");
  await expect(card).toHaveCSS("padding", "24px");
  const icon = card.locator("span");
  const iconBox = await icon.boundingBox();
  expect(Math.round(iconBox?.width ?? 0)).toBe(48);
  await expect(icon).toHaveCSS("border-radius", "12px");
  // F40-08/09: h3 18px/600 on the space-y-3 rhythm; body 14px muted.
  await expect(card.locator("h3")).toHaveCSS("font-size", "18px");
  await expect(card.locator("h3")).toHaveCSS("font-weight", "600");
  await expect(card.locator("h3")).toHaveCSS("margin-bottom", "12px");
  await expect(card.locator("h3")).toHaveCSS("margin-top", "0px");
  await expect(card.locator("p")).toHaveCSS("font-size", "14px");
});

test("about promise CTA matches the reference measure", async ({ page }) => {
  await page.goto("/about");
  // F40-10..12: p-10 rounded-3xl bg-secondary; h2 flat 24px mb-3; body
  // 16px/26px on the rhythm (no mt).
  const cta = page.locator("main > div > div[class*='bg-secondary']");
  await expect(cta).toHaveCSS("padding", "40px");
  await expect(cta).toHaveCSS("border-radius", "24px");
  await expect(cta).toHaveCSS("background-color", "rgb(243, 238, 232)");
  await expect(cta.locator("h2")).toHaveCSS("font-size", "24px");
  await expect(cta.locator("h2")).toHaveCSS("margin-bottom", "12px");
  await expect(cta.locator("p")).toHaveCSS("font-size", "16px");
  await expect(cta.locator("p")).toHaveCSS("line-height", "26px");
  await expect(cta.locator("p")).toHaveCSS("margin-top", "0px");
});

test("legal wrapper matches the reference template", async ({ page }) => {
  await page.goto("/privacy-policy");
  // F40-13/14: max-w-3xl px-4 sm:px-6 lg:px-8 py-12; h1 mb-8.
  const wrap = page.locator("main > div");
  await expect(wrap).toHaveCSS("padding-top", "48px");
  const h1 = wrap.locator("h1");
  await expect(h1).toHaveCSS("font-size", "36px");
  await expect(h1).toHaveCSS("margin-bottom", "32px");
  // The date row is NOT a separate subtitle — it lives inside the prose.
  await expect(wrap.locator("xpath=child::*[2]")).toHaveCSS("font-size", "16px");
});

test("legal prose matches the reference text scale", async ({ page }) => {
  await page.goto("/privacy-policy");
  // F40-15..18: prose base 16px, space-y-6 rhythm, h2 20px/600 foreground,
  // p 16px/24px muted, ul list-disc pl-6 space-y-2.
  const prose = page.locator("main > div > div");
  const firstP = prose.locator("p").first();
  await expect(firstP).toHaveCSS("font-size", "16px");
  await expect(firstP).toHaveCSS("line-height", "24px");
  await expect(firstP).toHaveCSS("color", "rgb(126, 111, 103)");
  await expect(firstP).toHaveCSS("margin-bottom", "24px");
  const h2 = prose.locator("h2").first();
  await expect(h2).toHaveCSS("font-size", "20px");
  await expect(h2).toHaveCSS("font-weight", "600");
  await expect(h2).toHaveCSS("line-height", "28px");
  await expect(h2).toHaveCSS("color", "rgb(29, 24, 22)");
  const ul = prose.locator("ul").first();
  await expect(ul).toHaveCSS("padding-left", "24px");
  await expect(ul).toHaveCSS("list-style-type", "disc");
  const li = ul.locator("li").first();
  await expect(li).toHaveCSS("font-size", "16px");
  await expect(li).toHaveCSS("margin-bottom", "8px");
  await expect(li).toHaveCSS("margin-left", "0px");
});

test("legal pages carry the reference section set", async ({ page }) => {
  // F40-19: the reference ships full standard policies — the section
  // counts are the content contract.
  const pages: [string, number, string][] = [
    ["/privacy-policy", 8, "Advertising"],
    ["/terms-of-service", 7, "Governing Law"],
    ["/disclaimer", 5, "Testimonials Disclaimer"],
    ["/cookie-policy", 5, "Managing Cookies"],
    ["/refund-policy", 5, "Exchanges"],
  ];
  for (const [path, count, marker] of pages) {
    await page.goto(path);
    const prose = page.locator("main > div > div");
    expect(await prose.locator("h2").count()).toBe(count);
    await expect(prose.getByText(marker).first()).toBeVisible();
  }
});

test("legal last-updated date renders dynamically", async ({ page }) => {
  await page.goto("/privacy-policy");
  // F40-20: the reference computes the current date (M/D/YYYY) — a static
  // build date is wrong the day after any build.
  const expected = new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const dateRow = page.locator("main > div > div p").first();
  await expect(dateRow).toContainText(`Last updated: ${expected}`);
});

test("contact form fields match the reference spec", async ({ page }) => {
  await page.goto("/contact");
  // F40-21..25: the form card hairline; shadcn v3 fields — h-9 36px
  // 16px radius-12 bg-transparent border-input; labels leading-none;
  // textarea min-h-60 rows-5; full-width h-9 pill submit.
  const form = page.locator("main form");
  await expect(form).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  const nameInput = form.locator("#contact-name");
  await expect(nameInput).toHaveCSS("height", "36px");
  await expect(nameInput).toHaveCSS("font-size", "16px");
  await expect(nameInput).toHaveCSS("border-radius", "12px");
  await expect(nameInput).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(nameInput).toHaveCSS("border-color", "rgb(229, 224, 220)");
  await expect(form.locator("label").first()).toHaveCSS("line-height", "14px");
  const message = form.locator("#contact-message");
  await expect(message).toHaveCSS("min-height", "60px");
  await expect(message).toHaveCSS("font-size", "16px");
  const submit = form.locator("button[type=submit]");
  await expect(submit).toHaveCSS("height", "36px");
  await expect(submit).toHaveCSS("border-radius", "9999px");
  await expect(submit).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(submit).toHaveCSS("font-weight", "500");
  // Full-width: the submit spans the same inner width as the textarea
  // (both w-full at every viewport — the name/email pair is 2-up at sm+).
  const messageWidth = await message.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  const submitWidth = await submit.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(Math.abs(submitWidth - messageWidth)).toBeLessThanOrEqual(2);
});

/** Session-41 — the checkout/cart/account/track layer (19th sweep,
 * 2026-10-15). Reference values measured live (agent-browser, logged in,
 * 390×844 + 1440×900): F41-01…F41-28, remediation plan §30. */

async function sweep41AddKnife(page: import("@playwright/test").Page) {
  await page.goto("/product/p-knife-set");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
}

test("checkout shell matches the reference wrapper, heading, and grid", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  // F41-01: max-w-5xl py-8 wrapper.
  const wrapper = page.locator("main > div");
  await expect(wrapper).toHaveCSS("max-width", "1024px");
  await expect(wrapper).toHaveCSS("padding-top", "32px");
  // F41-02: h1 text-3xl 30px.
  const h1 = page.getByRole("heading", { name: "Checkout", exact: true });
  await expect(h1).toHaveCSS("font-size", "30px");
  await expect(h1).toHaveCSS("font-weight", "700");
  // F41-03: grid lg:grid-cols-3 gap-8 with a col-span-2 form column.
  const grid = page.locator('main > div > div[class*="grid-cols-3"]');
  const viewport = page.viewportSize();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(viewport && viewport.width < 1024 ? 1 : 3);
  await expect(grid).toHaveCSS("column-gap", "32px");
  const formColumn = grid.locator("xpath=child::*[contains(@class, 'col-span-2')]");
  await expect(formColumn).toHaveCount(1);
});

test("checkout section cards match the reference chrome", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  // F41-04: bg-card rounded-2xl border/50 p-6 space-y-4, NO shadow.
  const contactCard = page.locator("main section", { hasText: "Contact Information" }).first();
  await expect(contactCard).toHaveCSS("border-radius", "16px");
  await expect(contactCard).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(contactCard).toHaveCSS("box-shadow", "none");
  await expect(contactCard).toHaveCSS("padding", "24px");
  // F41-05: h2 18px/600 (font-heading text-lg font-semibold).
  const h2 = contactCard.getByRole("heading", { name: "Contact Information", exact: true });
  await expect(h2).toHaveCSS("font-size", "18px");
  await expect(h2).toHaveCSS("font-weight", "600");
  // The OS heading is 18px/700 (text-lg font-bold).
  const allOsHeadings = page.getByRole("heading", { name: "Order Summary", exact: true });
  const osCount = await allOsHeadings.count();
  for (let i = 0; i < osCount; i += 1) {
    await expect(allOsHeadings.nth(i)).toHaveCSS("font-size", "18px");
    await expect(allOsHeadings.nth(i)).toHaveCSS("font-weight", "700");
  }
});

test("checkout form fields match the shadcn v3 spec", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  // F41-06: h-9 36px 16px rounded-[12px] bg-transparent; labels
  // leading-none 14px/500; space-y-2 field wrappers.
  const nameInput = page.locator("#co-name");
  await expect(nameInput).toHaveCSS("height", "36px");
  await expect(nameInput).toHaveCSS("font-size", "16px");
  await expect(nameInput).toHaveCSS("border-radius", "12px");
  await expect(nameInput).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(nameInput).toHaveCSS("border-color", "rgb(229, 224, 220)");
  const nameLabel = page.locator("label[for='co-name']");
  await expect(nameLabel).toHaveCSS("font-size", "14px");
  await expect(nameLabel).toHaveCSS("font-weight", "500");
  await expect(nameLabel).toHaveCSS("line-height", "14px");
  // F41-06 rhythm: v4's space-y-2 puts the space on margin-block-end of
  // non-last children (trap #4) — the label carries the 8px seam.
  await expect(nameLabel).toHaveCSS("margin-bottom", "8px");
  // F41-07: the Country select at 36px/12px/transparent.
  const country = page.locator("#co-country");
  await expect(country).toHaveCSS("height", "36px");
  await expect(country).toHaveCSS("border-radius", "12px");
  await expect(country).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  // F41-08: the notes textarea min-h-60 py-2 16px 12px.
  const notes = page.locator("#co-notes");
  await expect(notes).toHaveCSS("min-height", "60px");
  await expect(notes).toHaveCSS("font-size", "16px");
  await expect(notes).toHaveCSS("border-radius", "12px");
});

test("checkout payment options match the reference radio-card", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  // F41-09: gap-4, 2px primary border when selected, 40px rounded-full
  // primary/10 disc, 16px/600 title, 14px/400 sub.
  const cod = page.getByRole("radio", { name: /Cash on Delivery/ });
  await expect(cod).toHaveCSS("column-gap", "16px");
  await expect(cod).toHaveCSS("border-width", "2px");
  await expect(cod).toHaveCSS("border-color", "rgb(217, 110, 38)");
  await expect(cod).toHaveCSS("background-color", "rgba(217, 110, 38, 0.05)");
  await expect(cod).toHaveCSS("border-radius", "12px");
  await expect(cod).toContainText("Cash on Delivery");
  const title = cod.locator(".font-semibold").first();
  await expect(title).toHaveCSS("font-size", "16px");
  await expect(title).toHaveCSS("font-weight", "600");
  const sub = cod.locator(".text-sm.text-muted-foreground").first();
  await expect(sub).toHaveCSS("font-size", "14px");
  await expect(sub).toHaveCSS("font-weight", "400");
  const disc = cod.locator("[class*='bg-primary-film']").first();
  const discRadius = await disc.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(["9999px", "calc(infinity * 1px)"]).toContain(discRadius);
});

test("checkout order summary matches the reference card and button", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  // F41-10: rounded-2xl border/50 p-6 no shadow, sticky top-24.
  const summaryCard = page.locator("main aside").first();
  await expect(summaryCard).toHaveCSS("border-radius", "16px");
  await expect(summaryCard).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(summaryCard).toHaveCSS("padding", "24px");
  await expect(summaryCard).toHaveCSS("box-shadow", "none");
  await expect(summaryCard).toHaveCSS("position", "sticky");
  await expect(summaryCard).toHaveCSS("top", "96px");
  // Dividers are 1px bg-border divs, not <hr>.
  await expect(summaryCard.locator("hr")).toHaveCount(0);
  const divider = summaryCard.locator("[class*='bg-border']").first();
  await expect(divider).toHaveCSS("height", "1px");
  await expect(divider).toHaveCSS("background-color", "rgb(229, 224, 220)");
  // Items: 48px images, name 14px/500, Qty 12px, price 14px/600.
  const itemImg = summaryCard.locator("img").first();
  await expect(itemImg).toHaveCSS("width", "48px");
  await expect(itemImg).toHaveCSS("height", "48px");
  const itemName = summaryCard.locator("p").first();
  await expect(itemName).toHaveCSS("font-size", "14px");
  await expect(itemName).toHaveCSS("font-weight", "500");
  // Total row 18px/700, no border-top seam.
  const totalRow = summaryCard.locator(".text-lg.font-bold").last();
  await expect(totalRow).toHaveCSS("font-size", "18px");
  await expect(totalRow).toHaveCSS("font-weight", "700");
  // F41-11: Place Order h-10 40px 14px/500 rounded-full with the v3 shadow.
  const placeOrder = page.getByRole("button", { name: "Place Order" });
  await expect(placeOrder).toHaveCSS("height", "40px");
  await expect(placeOrder).toHaveCSS("font-size", "14px");
  await expect(placeOrder).toHaveCSS("font-weight", "500");
  await expect(placeOrder).toHaveCSS("border-radius", "9999px");
  expect((await placeOrder.evaluate((el) => getComputedStyle(el).boxShadow)) !== "none").toBe(true);
});

test("cart shell matches the reference wrapper, heading, and grid", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/cart");
  // F41-14/15: max-w-5xl py-8, "Your Cart" 30px with NO count span.
  const wrapper = page.locator("main > div");
  await expect(wrapper).toHaveCSS("max-width", "1024px");
  await expect(wrapper).toHaveCSS("padding-top", "32px");
  const h1 = page.getByRole("heading", { name: "Your Cart", exact: true });
  await expect(h1).toHaveText("Your Cart");
  await expect(h1).toHaveCSS("font-size", "30px");
  await expect(h1).toHaveCSS("font-weight", "700");
  await expect(h1.locator("span")).toHaveCount(0);
  // The reference layout is the same lg:grid-cols-3 shell.
  const grid = page.locator('main > div > div[class*="grid-cols-3"]');
  const viewport = page.viewportSize();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(viewport && viewport.width < 1024 ? 1 : 3);
});

test("cart item card matches the reference chrome and internals", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/cart");
  // F41-16: rounded-2xl border/50 p-4 flex gap-4, NO shadow.
  const item = page.locator("main li").first();
  await expect(item).toHaveCSS("border-radius", "16px");
  await expect(item).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(item).toHaveCSS("padding", "16px");
  await expect(item).toHaveCSS("column-gap", "16px");
  await expect(item).toHaveCSS("box-shadow", "none");
  // SQUARE 80×80 image — no radius, no border.
  const img = item.locator("img").first();
  await expect(img).toHaveCSS("width", "80px");
  await expect(img).toHaveCSS("height", "80px");
  await expect(img).toHaveCSS("border-radius", "0px");
  await expect(img).toHaveCSS("border-top-width", "0px");
  // F41-17: name 16px/600, unit price 16px/700 primary, line total 14px/700.
  const name = item.locator("h3");
  await expect(name).toHaveCSS("font-size", "16px");
  await expect(name).toHaveCSS("font-weight", "600");
  const unitPrice = item.locator(".text-primary").first();
  await expect(unitPrice).toHaveCSS("font-size", "16px");
  await expect(unitPrice).toHaveCSS("font-weight", "700");
  const lineTotal = item.locator("[class*='items-end'] .font-bold").last();
  await expect(lineTotal).toHaveCSS("font-size", "14px");
  // F41-18: the stepper is a MUTED pill with 24×24 buttons.
  const stepper = item.locator("[class*='bg-muted']").filter({ has: page.getByRole("button") }).first();
  await expect(stepper).toHaveCSS("background-color", "rgb(242, 240, 237)");
  const stepButtons = stepper.getByRole("button");
  await expect(stepButtons.first()).toHaveCSS("width", "24px");
  await expect(stepButtons.first()).toHaveCSS("height", "24px");
  const trash = item.getByRole("button", { name: /^Remove/ });
  const trashSize = await trash.evaluate((el) => {
    const svg = el.querySelector("svg");
    return svg ? Math.round(svg.getBoundingClientRect().width) : 0;
  });
  expect(trashSize).toBe(16);
});

test("cart order summary carries the reference amber COD notice", async ({ page }) => {
  await sweep41AddKnife(page);
  await page.goto("/cart");
  // F41-20: h2 18px/700, 1px bg-border dividers (no hr), Total 18px/700,
  // the amber COD box, and the h-10 Proceed control.
  const os = page.locator("main aside").first();
  await expect(os.locator("h2")).toHaveCSS("font-size", "18px");
  await expect(os.locator("h2")).toHaveCSS("font-weight", "700");
  await expect(os.locator("hr")).toHaveCount(0);
  await expect(os.locator(".text-lg.font-bold").last()).toHaveCSS("font-size", "18px");
  const cod = os.locator("[class*='cod-box'], [data-cod]").first();
  await expect(cod).toHaveCSS("background-color", "rgb(255, 251, 235)");
  await expect(cod).toHaveCSS("border-color", "rgb(253, 230, 138)");
  await expect(cod).toHaveCSS("border-radius", "12px");
  await expect(cod).toHaveCSS("padding", "12px");
  const proceed = os.getByRole("link", { name: /Proceed to Checkout/ });
  await expect(proceed).toHaveCSS("height", "40px");
  await expect(proceed).toHaveCSS("border-radius", "9999px");
});

test("account shell matches the reference profile card", async ({ page }) => {
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);
  // F41-21: max-w-3xl wrapper.
  const wrapper = page.locator("main > div");
  await expect(wrapper).toHaveCSS("max-width", "768px");
  // F41-22: profile card rounded-2xl border/50 p-6 no shadow; the 20px gap
  // sits on the IDENTITY row (avatar | text) — the outer row keeps its
  // R5-06 wrap layout (gap-4 between identity and controls).
  const profile = page.locator("main [class*='bg-card']").first();
  await expect(profile).toHaveCSS("border-radius", "16px");
  await expect(profile).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(profile).toHaveCSS("padding", "24px");
  await expect(profile).toHaveCSS("box-shadow", "none");
  const avatar = profile.locator("[class*='rounded-full']").first();
  const identityRow = avatar.locator("xpath=..");
  await expect(identityRow).toHaveCSS("column-gap", "20px");
  await expect(avatar).toHaveCSS("width", "64px");
  await expect(avatar).toHaveCSS("background-color", "rgba(217, 110, 38, 0.1)");
  const avatarIcon = await avatar.evaluate((el) => (el.querySelector("svg")?.getAttribute("class") || ""));
  expect(avatarIcon).toContain("lucide-user");
  // h1 20px/700.
  const h1 = profile.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCSS("font-size", "20px");
  await expect(h1).toHaveCSS("font-weight", "700");
  // The role pill is the cream secondary pill, VISIBLE at all widths.
  const pill = profile.locator("[data-role-pill], .bg-secondary").first();
  await expect(pill).toBeVisible();
  await expect(pill).toHaveCSS("background-color", "rgb(243, 238, 232)");
  await expect(pill).toHaveCSS("color", "rgb(44, 36, 33)");
  await expect(pill).toHaveCSS("font-size", "12px");
  await expect(pill).toHaveCSS("font-weight", "600");
});

test("account order history matches the reference card list (s42 supersession)", async ({ page }) => {
  // Login → place one order → the orders tab renders the reference list.
  // s41 read this as ONE card holding all rows; the s42 re-measurement
  // with two orders exposed per-order cards (F42-13). This single-order
  // smoke keeps its assertions — they hold under both structures — while
  // the per-order spec below pins the space-y-3 list shape.
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);
  await sweep41AddKnife(page);
  await page.goto("/checkout");
  await page.getByLabel("Full Name *").fill("John Mercer");
  await page.getByLabel("Phone Number *").fill("+1 (555) 010-0148");
  await page.getByLabel("Street Address *").fill("48 Oak Street");
  await page.getByLabel("City *").fill("San Francisco");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("ZIP Code").fill("94110");
  await page.getByRole("button", { name: "Place Order" }).click();
  await page.waitForURL(/\/order-success/);
  await page.goto("/account");
  // F41-23: Order History h2 text-xl 20px/700.
  const h2 = page.getByRole("heading", { name: "Order History", exact: true });
  await expect(h2).toHaveCSS("font-size", "20px");
  await expect(h2).toHaveCSS("font-weight", "700");
  // F41-24 (s42-superseded pin, values hold): the overflow-hidden card —
  // with one order the per-order card IS the first overflow-hidden card;
  // rows p-5 flex items-center gap-4 (the clone renders the row as a
  // link — superset navigation, PAD §5.6 #20).
  const ordersCard = page.locator("[data-orders-card], main .overflow-hidden").first();
  await expect(ordersCard).toHaveCSS("border-radius", "16px");
  await expect(ordersCard).toHaveCSS("overflow", "hidden");
  await expect(ordersCard).toHaveCSS("box-shadow", "none");
  const row = ordersCard.getByRole("link").first();
  await expect(row).toHaveCSS("padding", "20px");
  await expect(row).toHaveCSS("column-gap", "16px");
  const number = row.locator(".font-semibold").first();
  await expect(number).toHaveCSS("font-size", "16px");
  await expect(number).toHaveCSS("font-weight", "600");
  const meta = row.locator(".text-xs").first();
  await expect(meta).toHaveCSS("font-size", "12px");
});

test("track order entry matches the reference shell", async ({ page }) => {
  await page.goto("/track-order");
  // F41-25: py-12 wrapper (48px).
  const wrapper = page.locator("main > div");
  await expect(wrapper).toHaveCSS("padding-top", "48px");
  // F41-26: 56px disc + 28px icon; h1 text-3xl 30px; sub 16px.
  const disc = page.locator("main .rounded-2xl, main [class*='rounded-[16px]']").first();
  await expect(disc).toHaveCSS("width", "56px");
  await expect(disc).toHaveCSS("height", "56px");
  const discIcon = await disc.evaluate((el) => {
    const svg = el.querySelector("svg");
    return svg ? Math.round(svg.getBoundingClientRect().width) : 0;
  });
  expect(discIcon).toBe(28);
  const h1 = page.getByRole("heading", { name: "Track Your Order" });
  await expect(h1).toHaveCSS("font-size", "30px");
  await expect(h1).toHaveCSS("font-weight", "700");
  const sub = page.locator("main .text-center p").first();
  await expect(sub).toHaveCSS("font-size", "16px");
  // F41-27: h-9 rounded-full pill input (16px) + h-9 Track button.
  const input = page.locator("#track-number");
  await expect(input).toHaveCSS("height", "36px");
  await expect(input).toHaveCSS("font-size", "16px");
  await expect(input).toHaveCSS("border-radius", "9999px");
  const trackButton = page.getByRole("button", { name: "Track", exact: true });
  await expect(trackButton).toHaveCSS("height", "36px");
});

/* ── Session-42 (twentieth sweep): the order-success / account-orders layer ──
   Measured live 2026-10-15 on nest-culinary-hub.base44.app (fresh COD order,
   logged-in, 390×844 + 1440×900). Findings F42-01…F42-15 in
   docs/remediation-plan.md §31. */

async function sweep42PlaceOrder(page: import("@playwright/test").Page) {
  await page.goto("/product/p-knife-set");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Full Name *").fill("John Mercer");
  await page.getByLabel("Phone Number *").fill("+1 (555) 010-0148");
  await page.getByLabel("Email Address").fill("john@example.com");
  await page.getByLabel("Street Address *").fill("48 Oak Street");
  await page.getByLabel("City *").fill("San Francisco");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("ZIP Code").fill("94110");
  await page.getByRole("button", { name: "Place Order" }).click();
  await page.waitForURL(/\/order-success/);
}

test("order success shell matches the reference wrapper and pill", async ({ page }) => {
  await sweep42PlaceOrder(page);
  // F42-01: max-w-2xl py-12 wrapper, 32px space-y-8 rhythm.
  const wrapper = page.locator("main > div");
  await expect(wrapper).toHaveCSS("max-width", "672px");
  await expect(wrapper).toHaveCSS("padding-top", "48px");
  // F42-02/03: h1 text-3xl 30px/700 with NO icon disc above it (the v1
  // 80px accent disc is removed per remediation §31 D4).
  const h1 = page.getByRole("heading", { name: "Order Placed!", exact: true });
  await expect(h1).toHaveCSS("font-size", "30px");
  await expect(h1).toHaveCSS("font-weight", "700");
  expect(await page.locator("main [class*='bg-accent-soft']").count()).toBe(0);
  const sub = h1.locator("xpath=following-sibling::p[1]");
  await expect(sub).toHaveCSS("font-size", "16px");
  await expect(sub).toHaveCSS("margin-top", "8px");
  // F42-04: the order pill — primary-faint bg, primary-line border, px-5
  // py-2, 38px tall, Package 16px, span 14px/600 primary.
  const pill = page.locator("[data-order-pill]");
  await expect(pill).toHaveCSS("background-color", "rgba(217, 110, 38, 0.05)");
  await expect(pill).toHaveCSS("border-color", "rgba(217, 110, 38, 0.2)");
  await expect(pill).toHaveCSS("padding", "8px 20px");
  await expect(pill).toHaveCSS("height", "38px");
  const pillRadius = await pill.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(["9999px", "calc(infinity * 1px)"]).toContain(pillRadius);
  const pillText = pill.getByText(/^Order #ORD-/);
  await expect(pillText).toHaveCSS("font-size", "14px");
  await expect(pillText).toHaveCSS("font-weight", "600");
  await expect(pillText).toHaveCSS("color", "rgb(217, 110, 38)");
  const pillIcon = pill.locator("svg");
  const pillIconW = await pillIcon.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(pillIconW).toBe(16);
});

test("order success carries the reference large amber COD notice", async ({ page }) => {
  await sweep42PlaceOrder(page);
  // F42-05: the SUCCESS variant — 16px radius, p-5, flex gap-4, 40px
  // amber-100 disc with a 20px amber-600 Banknote, title 16px/600
  // rgb(120,53,15), body 14px/400 rgb(180,83,9) (remediation §31 D2 —
  // separate from the cart's compact 12px variant).
  const box = page.locator("[data-cod-success]");
  await expect(box).toHaveCSS("background-color", "rgb(255, 251, 235)");
  await expect(box).toHaveCSS("border-color", "rgb(253, 230, 138)");
  await expect(box).toHaveCSS("border-radius", "16px");
  await expect(box).toHaveCSS("padding", "20px");
  await expect(box).toHaveCSS("column-gap", "16px");
  const disc = box.locator("[class*='rounded-full'], [class*='rounded-[9999px]']").first();
  await expect(disc).toHaveCSS("width", "40px");
  await expect(disc).toHaveCSS("height", "40px");
  await expect(disc).toHaveCSS("background-color", "rgb(254, 243, 199)");
  const discIcon = disc.locator("svg");
  await expect(discIcon).toHaveCSS("width", "20px");
  await expect(discIcon).toHaveCSS("color", "rgb(217, 119, 6)");
  const title = box.getByText("Cash on Delivery", { exact: true });
  await expect(title).toHaveCSS("font-size", "16px");
  await expect(title).toHaveCSS("font-weight", "600");
  await expect(title).toHaveCSS("color", "rgb(120, 53, 15)");
  const body = box.getByText(/Please have/);
  await expect(body).toHaveCSS("font-size", "14px");
  await expect(body).toHaveCSS("color", "rgb(180, 83, 9)");
});

test("order success card matches the reference chrome and header band", async ({ page }) => {
  await sweep42PlaceOrder(page);
  // F42-06: 16px radius, hairline border, no shadow, overflow-hidden.
  const card = page.locator("[data-success-card]");
  await expect(card).toHaveCSS("border-radius", "16px");
  await expect(card).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(card).toHaveCSS("box-shadow", "none");
  await expect(card).toHaveCSS("overflow", "hidden");
  // F42-01 rhythm: the card is a non-last space-y-8 child (margin-block-end
  // 32px per trap #4).
  await expect(card).toHaveCSS("margin-bottom", "32px");
  // F42-07: the muted/30 header band + Playfair 16px/600 h2.
  const band = card.locator("[data-card-band]");
  await expect(band).toHaveCSS("background-color", "rgba(242, 240, 237, 0.3)");
  await expect(band).toHaveCSS("padding", "20px");
  await expect(band).toHaveCSS("border-bottom-width", "1px");
  await expect(band).toHaveCSS("border-bottom-color", "rgba(229, 224, 220, 0.5)");
  const h2 = card.getByRole("heading", { name: "Order Details", exact: true });
  await expect(h2).toHaveCSS("font-size", "16px");
  await expect(h2).toHaveCSS("font-weight", "600");
  await expect(h2).toHaveCSS("font-family", /Playfair Display/);
});

test("order success items and totals match the reference rows", async ({ page }) => {
  await sweep42PlaceOrder(page);
  const card = page.locator("[data-success-card]");
  // F42-08: 48px SQUARE images (radius 0, no border), 14px/500 names,
  // 12px qty, 14px/600 prices, space-y-3 rhythm, p-5.
  const items = card.locator("[data-order-items]");
  await expect(items).toHaveCSS("padding", "20px");
  const img = items.locator("img").first();
  await expect(img).toHaveCSS("width", "48px");
  await expect(img).toHaveCSS("height", "48px");
  await expect(img).toHaveCSS("border-radius", "0px");
  await expect(img).toHaveCSS("border-top-width", "0px");
  const name = items.locator("p.font-medium").first();
  await expect(name).toHaveCSS("font-size", "14px");
  await expect(name).toHaveCSS("font-weight", "500");
  const qty = items.getByText(/^Qty:/);
  await expect(qty).toHaveCSS("font-size", "12px");
  const price = items.locator("p.font-semibold").first();
  await expect(price).toHaveCSS("font-size", "14px");
  await expect(price).toHaveCSS("font-weight", "600");
  // F42-09: totals p-5 space-y-2 text-sm; muted 14px/400 rows; the Total
  // row 16px/700; "Free" is MUTED (not green).
  const totals = card.locator("[data-order-totals]");
  await expect(totals).toHaveCSS("padding", "20px");
  const subtotalRow = totals.getByText("Subtotal").locator("xpath=..");
  await expect(subtotalRow).toHaveCSS("font-size", "14px");
  const shippingValue = totals.getByText("Free", { exact: true });
  await expect(shippingValue).toHaveCSS("color", "rgb(126, 111, 103)");
  const totalRow = totals.getByText("Total", { exact: true }).locator("xpath=..");
  await expect(totalRow).toHaveCSS("font-size", "16px");
  await expect(totalRow).toHaveCSS("font-weight", "700");
  // The bg-border 1px dividers between sections (not section border-t).
  const dividers = card.locator(".bg-border");
  await expect(dividers).toHaveCount(2);
});

test("order success delivery information matches the reference rows", async ({ page }) => {
  await sweep42PlaceOrder(page);
  const card = page.locator("[data-success-card]");
  // F42-10: h3 Inter 14px/600; FOUR rows (name, phone, email, address)
  // 14px/400 muted with 16px primary icons — the phone row is new
  // (Order.phone, remediation §31 D3).
  const block = card.locator("[data-delivery-info]");
  const h3 = block.getByRole("heading", { name: "Delivery Information" });
  await expect(h3).toHaveCSS("font-size", "14px");
  await expect(h3).toHaveCSS("font-weight", "600");
  await expect(h3).toHaveCSS("font-family", /Inter/);
  const rows = block.locator("li");
  await expect(rows).toHaveCount(4);
  const phone = block.getByText("+1 (555) 010-0148");
  await expect(phone).toBeVisible();
  await expect(phone).toHaveCSS("font-size", "14px");
  await expect(phone).toHaveCSS("color", "rgb(126, 111, 103)");
  const firstIcon = rows.first().locator("svg");
  await expect(firstIcon).toHaveCSS("color", "rgb(217, 110, 38)");
  const firstIconW = await firstIcon.evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(firstIconW).toBe(16);
});

test("order success buttons match the reference 36px pills", async ({ page }) => {
  await sweep42PlaceOrder(page);
  // F42-11: h-9 36px rounded-full 14px/500 px-4 pills — outline (Back to
  // Home) + primary (Continue Shopping) — in a flex-col sm:flex-row gap-3
  // row (the last space-y-8 child).
  const back = page.getByRole("link", { name: "Back to Home" });
  await expect(back).toHaveCSS("height", "36px");
  await expect(back).toHaveCSS("border-radius", "9999px");
  await expect(back).toHaveCSS("font-size", "14px");
  await expect(back).toHaveCSS("font-weight", "500");
  await expect(back).toHaveCSS("padding-left", "16px");
  await expect(back).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(back).toHaveCSS("border-color", "rgb(229, 224, 220)");
  // Shadow pins assert the v3 GEOMETRY via containment — the reference is
  // v3-composed (2 leading transparent shadow layers), this build's v4
  // composes 4; exact-string pins can never match across engines (trap
  // #10 doctrine: pin the geometry, not the serialization).
  const backShadow = await back.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(backShadow).toContain("rgba(0, 0, 0, 0.05) 0px 1px 2px 0px");
  const cont = page.getByRole("link", { name: "Continue Shopping" });
  await expect(cont).toHaveCSS("height", "36px");
  await expect(cont).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(cont).toHaveCSS("color", "rgb(255, 255, 255)");
  const contShadow = await cont.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(contShadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 3px 0px");
  expect(contShadow).toContain("rgba(0, 0, 0, 0.1) 0px 1px 2px -1px");
  const row = back.locator("xpath=..");
  const viewport = page.viewportSize();
  await expect(row).toHaveCSS("flex-direction", viewport && viewport.width < 640 ? "column" : "row");
  await expect(row).toHaveCSS("row-gap", "12px");
});

test("account orders list renders per-order reference cards", async ({ page }) => {
  // F42-13 (supersedes s41 F41-24's "ONE card" reading — a single-order
  // list artifact): the list is a space-y-3 wrapper of ONE CARD PER ORDER.
  // Login → place TWO orders → assert the per-card structure.
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Demo1234!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/account$/);
  await sweep42PlaceOrder(page);
  await sweep42PlaceOrder(page);
  await page.goto("/account");
  const list = page.locator("[data-orders-list]");
  const cards = list.locator("li");
  await expect(cards).toHaveCount(2);
  const first = cards.first();
  await expect(first).toHaveCSS("border-radius", "16px");
  await expect(first).toHaveCSS("border-color", "rgba(229, 224, 220, 0.5)");
  await expect(first).toHaveCSS("box-shadow", "none");
  await expect(first).toHaveCSS("overflow", "hidden");
  // v4 space-y-3 puts the 12px seam on margin-block-end of non-last cards.
  await expect(first).toHaveCSS("margin-bottom", "12px");
  // F42-14 (s41 row internals hold): the row link p-5 gap-4 with 16px/600
  // numbers and 12px meta.
  const row = first.getByRole("link");
  await expect(row).toHaveCSS("padding", "20px");
  await expect(row).toHaveCSS("column-gap", "16px");
  const number = row.locator(".font-semibold").first();
  await expect(number).toHaveCSS("font-size", "16px");
  await expect(number).toHaveCSS("font-weight", "600");
  const meta = row.locator(".text-xs").first();
  await expect(meta).toHaveCSS("font-size", "12px");
});
