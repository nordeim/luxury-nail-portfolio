# Session 47 — Task 35 execution record
## The twenty-fifth sweep: the fourth consecutive full-surface drift re-check

Round context: the session-46 validation round (§35) closed clean at
`a127bdc`; the owner then added `docs/session_54.md` (owner commit
`6b5c7c4` — the raw session-46-round transcript; zero code drift).
This round executed **Task 35 — the 25th bidirectional sweep**,
holding the standing cadence: a full-surface drift re-check of every
pinned surface on both sides. The file's prior content (the
round-added session-43-round transcript) is preserved in git at
`2c21b6f`.

### Baseline gate (reproduced exactly)

| Stage | Result |
|---|---|
| typecheck | ✓ |
| lint | ✓ |
| unit (Vitest) | 104/104 ✓ |
| build | **530.57 KB** ✓ — deterministic (two consecutive builds → identical md5 `72be036…`, the same hash as s45/s46; third consecutive round at this figure) |
| E2E | **312/312 ✓ (156 specs × 2 projects, 5.8 min)** — first attempt, after a pre-emptive `npx playwright install chromium` (the cache had regressed to revision-1200-only) |

Environment notes: the chromium cache regressed between rounds (the
s46 both-revisions read did not persist), so the install ran BEFORE
the E2E stage per the §34/§35 quirk doctrine — first-attempt green.
The venv's paramiko was also missing at round start (environment
reset) and was reinstalled (5.0.0) before the push phase.

### Reference side — every pinned surface re-measured live (zero drift)

Logged in with the owner-supplied account; 390×844 mobile +
1440×900 desktop where noted.

- **Chrome pins**: mobile trigger BARE at rest (**measurement 17**,
  no seventeenth flip; fifteen consecutive bare since s30); account
  and cart glyphs plain dark 16px `rgb(29,24,22)` 36×36 (the nav's
  "Search products…" control is desktop-only — zero-rect at mobile);
  header glass `rgba(255,255,255,0.8)` + `blur(24px)` + 1px bottom
  hairline `rgba(229,224,220,0.5)` on a sticky NAV (h=65); brand
  "HomeNest" wordmark SPAN Playfair Display 20px/700; body
  `rgb(251,250,249)`; text elements compute `Inter, sans-serif`
  (both webfonts live); robots allow-all + sitemap link (22 URLs).
- **Mobile menu**: inline `md:hidden` dropdown — 5 links 14px/500,
  Home active white-on-orange `rgb(217,110,38)`, 44px rows, first
  row y=121. Zero change.
- **Home**: hero carousel rotates (three slides observed — all
  render h1 36px/700 Playfair white; a mid-rotation read is not
  drift); hero 358×500 r-24; card chrome 16px/hairline/white +
  `shadow-sm` (full computed string carries the
  `rgba(0,0,0,0.05) 0px 1px 2px 0px` layer); Featured badge orange
  pill 12px/600 73×22 ×12.
- **/products**: h1 30px/700; "8 products found" (first read);
  36px pill search; 36px pill category filter (custom button);
  mobile 2-col grid (x=16/x=205, 169px cards, y=361).
- **PDP**: back 14px; h1 30px/700; 356×356 image in r-24 1px-bordered
  card; "4.9 (412 reviews)"; CTA 40px/9999px orange.
- **/cart**: h1 "Your Cart" 30px/700 no count; 16px/hairline cards;
  80×80 square images; h3 16px/600; OS 18px/700; compact amber COD
  `rgb(255,251,235)`/r-12/border `rgb(253,230,138)`; Proceed 40px
  pill.
- **/checkout**: h1 30px/700; labels 14px/500; fields
  36px/r-12/hairline/transparent; Place Order 40px pill.
- **/account**: h1 20px/700; OH h2 20px/700; per-order 16px/hairline
  cards — 5 orders (ORD-MVA85CBJ, ORD-MVA3M5YT, ORD-MV96YYQU,
  ORD-MV8ZOL1T, ORD-MV530OZN): the §35 set of 4 plus the s46
  round's own evidence order; no new owner orders. Dynamic content,
  per the D2 precedent.
- **/track-order**: h1 30px/700; 56px disc r-16 + 28px icon; 36px
  pills; result (ORD-MV8ZOL1T, native type + Enter after a
  click-interception note): 18px Playfair/700 number; amber badge
  `rgb(254,243,199)` 14px/500 (text "pending" — dynamic, the style
  pins hold); steps 14px/500 muted; amber COD r-16.
- **/order-success** (fresh order **ORD-MVC1DNQK** placed this
  sweep): h1 "Order Placed!" 30px; pill
  `rgba(217,110,38,0.05)`/9999px/38px; LARGE amber COD r-16/h-128;
  CTAs 36px.
- **/about**: h1 36px/700; value cards 16px p-24; promise beige
  `rgb(243,238,232)` r-24. **/contact**: h1 36px; Send 36px pill.

### Clone side — production preview :4173 (the same 530.57 KB build)

- **Mobile menu (trap #5, verified by hand)**: modal dialog
  aria-label "Site menu", portalized to `document.body` (chain
  `BODY>HTML`); panel 390px at y=64, solid white, 6 rows × 44px;
  focus trap verified (13 Tabs cycle inside: Close → Search → Home
  → Products → Track Order → About → Contact → Account → wrap);
  Escape closes and **restores focus to the "Open menu" trigger**
  via the real pointer-click path. Interaction note (documented in
  §36.4-D5): a synthetic JS `.click()` open leaves the captured
  restore target at BODY (JS clicks don't focus the trigger) — an
  instrumentation artifact, not a product defect; the E2E spec's
  real-click path restores exactly.
- **Cart drawer (s43 layer)**: h2 "Your Cart" 20px/700 Playfair;
  80×80 square r-0 images; 16px/hairline p-4 cards; h3 16px/600;
  price 16px/700 `rgb(217,110,38)`; muted-pill steppers
  `rgb(242,240,237)` 24×24 buttons; inline trash-2; "Order Summary"
  18px/700; CTA 40px/9999px; "View full cart" 14px/500 muted;
  **desktop geometry x=992/w=448/h=900 byte-for-byte**.
- **Header glass**: sticky HEADER 65px, `rgba(255,255,255,0.8)` +
  `blur(24px)` + bottom hairline; brand 20px/700 Playfair.
- **Served SEO superset**: robots 5 disallows + sitemap link;
  sitemap 36 `<loc>` URLs; manifest 200; per-route titles live
  ("Products | HomeNest Kitchen", PDP
  "Damascus Steel Chef Knife Set | HomeNest Kitchen").
- Clone-session notes (no parity impact): the /products quick-add
  is icon-only with aria-label "Add {product} to cart" (text-regex
  locators miss it); the drawer was first opened empty (correct
  empty state), then re-measured with the item added.

### Captures (9 images, all dimension-validated)

Reference evidence (390×844): `_ref-sweep47-menu-mobile.png`,
`_ref-sweep47-success-mobile.png`. Clone verification:
`_sweep47-clone-mobile-menu.png` (390×844),
`_sweep47-clone-cart-drawer-mobile.png` (390×844),
`_sweep47-clone-cart-drawer-desktop.png` (1440×900),
`_sweep47-clone-home-desktop.png` (1440×900),
`_sweep47-clone-products-desktop.png` (1440×900),
`_sweep47-clone-pdp-desktop.png` (1440×900),
`_sweep47-clone-cart-desktop.png` (1440×900).

### Verification gate

typecheck ✓ lint ✓ 104/104 unit ✓ 530.57 KB deterministic ✓
312/312 E2E ✓ — validation round, zero code delta, zero new
findings. Parity posture: trigger bare at measurement 17 (fifteen
consecutive since s30); every content-layer pin holds on both
sides; the watch list is unchanged (accordion registered
divergence #20, admin-only surfaces, entrance animations D8,
reference drift watch — this round clean); ADR-001 remains the only
open owner decision.
