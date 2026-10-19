---
name: homenest-store-g
description: >
  Codebase-verified engineering skill for the HomeNest Kitchen storefront
  (Vite 7 + React 19 + TypeScript 5.9 + Tailwind CSS v4 single-file SPA).
  Use when extending, debugging, onboarding, or re-verifying this codebase.
  Captures the design system, the Tailwind v4 trap log (backdrop-filter
  containing block, hsl() literals, oklab gradients), the parity contract with
  the reference site, the two-layer test architecture, and every lesson from
  the Session 1 remediation.
version: 1.4.0
last_updated: 2026-10-15
tags:
  - react
  - vite
  - tailwind-v4
  - ecommerce
  - visual-parity
  - testing
  - skill
project_state: "typecheck clean · 104/104 unit · build green (single file ~530 KB) · 312/312 E2E (156 specs × chromium + mobile) · SEO head contract gated"
---

# HomeNest Store G — Project Skill

> **How to use this document:** A future agent extending this codebase should
> read §1–§5 before writing any code, keep §9–§13 open while debugging, run
> §11 before shipping, and consult §19–§20 for exact tokens and types. Every
> claim here is verifiable against a specific file or command; verification
> commands are given inline. Where this document and the code disagree, the
> code wins — and this document should be patched (see §6.3 drift check of the
> distill meta-skill).

---

## Table of Contents

1. Project Identity & Design Philosophy
2. Tech Stack & Environment
3. Bootstrapping & Configuration
4. The Design System (Code-First)
5. Component Architecture & Patterns
6. Custom Hooks & Provider Deep Dive
7. Content Management & Data (Catalog, Users, Orders)
8. Accessibility Implementation
9. Anti-Patterns & Common Bugs (registered trap log)
10. Debugging Guide
11. Pre-Ship Checklist
12. Lessons Learnt & How to Avoid Them
13. Pitfalls to Avoid
14. Best Practices
15. Coding Patterns (copy-pasteable)
16. Coding Anti-Patterns
17. Responsive Breakpoint Reference
18. Z-Index Layer Map
19. Color Reference (Complete)
20. The Complete TypeScript Interface Reference
- Appendix A: Route Map (all 26 routes)
- Appendix B: Verification & Test Ledger
- Appendix C: Parity Contract with the Reference Site
- Appendix D: Audit History

---

## §1 Project Identity & Design Philosophy

**What this is:** `homenest-store-g` is a production-grade single-page
e-commerce storefront ("HomeNest Kitchen" — premium home & kitchen products)
built as a deliberate **visual clone + functional superset** of the reference
site `https://nest-culinary-hub.base44.app/`. It is a browser-only SPA: no
server, no database at runtime — catalog, users, carts, and orders live in
`localStorage` under a versioned key, and the whole app compiles to a single
HTML file via `vite-plugin-singlefile`.

**Design thesis:** warm artisanal commerce — cream paper background, burnt-
orange primary, serif display headings (Playfair Display), pill-shaped CTAs,
12 px radii, generous whitespace. The reference is the spec; divergence is a
bug unless registered (Appendix C).

**Non-negotiable design rules:**
1. Primary orange `hsl(24 70% 50%)` is the only CTA color. Green
   `hsl(160 40% 45%)` is reserved for positive states (In Stock, Free, the
   logged-in avatar dot, the mobile menu close disc). Never introduce a second
   accent hue.
2. Headings use `font-display` (Playfair Display); body uses **Inter**
   (session-34 parity with the reference's measured body face; Google
   Fonts, system-stack fallback). Do not swap or add webfonts beyond the
   two Google Fonts links in `index.html` (Playfair Display + Inter).
3. Active nav = filled orange pill with white text (desktop row and mobile
   row alike). Never underline active links.
4. Buttons are fully rounded pills; cards use `radius-lg/xl` (12–20 px);
   hero/CTA banners use `radius-2xl` (24 px).
5. Money is always integer cents in domain code and formatted through
   `formatMoney()` at the edge — never floats, never ad-hoc `$` strings.

**CTA hierarchy:** primary (orange pill) → outline (border pill) → ghost text
link. One primary CTA per view region (Add to Cart, Proceed to Checkout, Place
Order, Send Message, Browse All Products).

**Anti-generic mandate:** no Bootstrap-blue links, no default focus rings
(`:focus-visible` is themed to the primary orange ring), no alert-dialog
browser popups (toasts via the `Toaster` component), no emoji icons (lucide-
react only), no purple/indigo gradients. Hero overlays use explicit
`linear-gradient()` (see trap T-3).

**What this project is NOT:** it is not a Next.js app, has no SSR, no server
actions, no Prisma client at runtime, no i18n, no analytics. The `prisma/`
and `db/` conventions exist purely for the tooling/env contract (§3, §7 of
`src/lib/db-path.ts`).

---

## §2 Tech Stack & Environment

Exact versions from `package.json` (verified 2026-10-12):

| Layer | Technology | Version | Critical Note |
|---|---|---|---|
| Build | Vite | `^7.3.2` | `optimizeDeps.entries` is PINNED to `index.html` + `src/**` — see trap T-6 before touching |
| UI runtime | React + React DOM | `^19.2.6` | Strict-compliant; portal API used for mobile nav |
| Language | TypeScript | `^5.9.3` | `tsc --noEmit` is the type gate; no `any` in src |
| Styling | Tailwind CSS | `^4.1.17` | CSS-first `@theme` in `src/index.css`; **no `tailwind.config.ts`** |
| Tailwind plugin | @tailwindcss/vite | `^4.1.17` | v4 integration; PostCSS file not used |
| Single-file | vite-plugin-singlefile | `^2.3.0` | Inlines JS/CSS into `dist/index.html` (~502 KB) |
| Icons | lucide-react | `^1.55.0` | Only icon source; no emoji, no icon fonts |
| Class utils | clsx + tailwind-merge | `^2.1.1` / `^3.4.0` | Wrapped by `src/utils/cn.ts` (`cn()`) |
| Unit test | Vitest | `^4.1.11` | `environment: "node"`; include patterns deliberately exclude `*.spec.ts` |
| E2E | @playwright/test | `^1.64.0` | Runs against the PRODUCTION build (`vite preview`), 2 projects |
| Types | @types/node / react / react-dom | `^22.19.17` / `^19.2.7` / `^19.2.3` | Node types needed by config files |

**Runtime deps are exactly five** (`clsx`, `lucide-react`, `react`,
`react-dom`, `tailwind-merge`). Everything else is devDependencies — keep it
that way (the single-file bundle must stay lean).

**Environment variables (exactly 1):**

| Var | Value | Meaning |
|---|---|---|
| `DATABASE_URL` | `file:../db/custom.db` | SCHEMA-RELATIVE (Prisma-style) URL. Resolves against a virtual `prisma/` anchor at repo root → `<repoRoot>/db/custom.db`. Consumed by tooling/docs/admin copy via `src/lib/db-path.ts`; the SPA itself never reads env at runtime. |

`.env` is git-ignored; `.env.example` is git-tracked and must always match the
contract above.

---

## §3 Bootstrapping & Configuration

From a fresh clone:

```bash
npm install                 # runtime + dev deps
cp .env.example .env        # DATABASE_URL="file:../db/custom.db"
npm run dev                 # Vite dev server on :5173
npm run verify              # typecheck && unit tests && production build
npm run e2e                 # builds are expected; serves dist via `vite preview` on 127.0.0.1:4173
```

There is no scaffolding command, no workspace file, no Prisma CLI step: the
"database" seed is static data in `src/data/catalog.ts` hydrated into
`localStorage` on first run (storage key versioning, §7).

**Config file map (what lives where — do not duplicate settings):**

| File | Owns |
|---|---|
| `vite.config.ts` | Plugins (`react`, `tailwindcss`, `viteSingleFile`), `@` → `src` alias, `optimizeDeps.entries` pin |
| `vitest.config.ts` | Unit layer: `environment: "node"`, include `src/**/*.test.ts` + `tests/**/*.test.ts`, `testTimeout: 30_000`, alias |
| `playwright.config.ts` | E2E layer: `testDir: tests/e2e`, 45 s test / 10 s expect timeouts, `workers: 1`, `fullyParallel: false`, trace `retain-on-failure`, `webServer` = `vite preview` on `127.0.0.1:4173` strictPort, projects `chromium` + `mobile` |
| `tsconfig.json` | Strict TS, `@` path mapping, bundler resolution |
| `index.html` | Title/meta, Google Fonts (Playfair Display only), `#root` mount |
| `src/index.css` | ALL design tokens (`@theme`), base styles, focus ring, reduced-motion |
| `.gitignore` | `.env`, `db/*.db`, `dist/`, `test-results/`, `research/`, key material |

**Playwright project notes:** the `mobile` project is the iPhone 14 device
profile **pinned to the chromium engine** (`browserName: "chromium"`). This is
deliberate — WebKit needs host libraries slim CI images lack. Removing the pin
requires installing WebKit deps; see trap T-11. E2E always tests the
production build, never the dev server (mirrors the ecommerce-store reference
convention).

---

## §4 The Design System (Code-First)

Single source of truth: the `@theme` block in `src/index.css` (99 lines
total). Tailwind v4 reads this directly — there is no JS config. The block
also carries a **five-line trap-log comment**; the traps are expanded in §9.

**Fonts:** `--font-display` = Playfair Display + Georgia fallback (headings,
brand, order numbers); `--font-sans` = system UI stack (everything else);
`--font-mono` available but rarely used. Loaded via one Google Fonts
stylesheet in `index.html` (weights 400–800 + italic 400).

**Color tokens** (full hex/usage table in §19): semantic shadcn-style names —
`background`, `foreground`, `primary`/`-dark`/`-foreground`, `secondary`/`-foreground`,
`muted`/`-foreground`, `accent` (+`-soft`), `destructive`, `border`, `card`/`-foreground`,
`ring`, `badge` (amber-400 stars, session-38 — the "Featured" pill is `primary`),
`footer` (near-black warm brown) + the alpha-baked parity films (`panel`,
`border-soft`, `hero-body`, `quick-add`, `primary-film`, `primary-faint`,
`secondary-hover`, `gallery`, `primary-line` (session-42, the success order
pill border)) and the amber COD tokens (`cod-bg`/`cod-border`/`cod-title`/
`cod-body`, session-41 — measured sRGB, not badge alphas — plus the
session-42 large-variant trio `cod-disc`/`cod-disc-icon`/
`cod-title-strong`).
⚠️ Values are full `hsl()` literals (badge is `#fbbf24` hex — hsl rounding drifts
a channel) — bare `H S% L%` triplets resolve to transparent in v4 (trap T-1).

**Shadows (5):** `shadow-sm` (pinned to v3 geometry — v4 moved the scale one
notch, trap T-2), `shadow-card`, `shadow-pop` (menus/drawer panels),
`shadow-drawer` (cart drawer), `shadow-toast`.

**Radii (5):** `sm` 0.5rem → `2xl` 1.5rem. CTAs ignore the scale and use
`rounded-full` pills by design.

**Z-index tokens (5):** `--z-sticky: 300`, `--z-dropdown: 350`,
`--z-overlay: 400`, `--z-modal: 500`, `--z-toast: 800`. In components these
appear as arbitrary-value classes (`z-[300]` etc.) — see §18 for the full map.

**Keyframes:** none. There is intentionally **no custom animation CSS**; all
motion is Tailwind transitions + `prefers-reduced-motion` neutralization in
`index.css` (duration forced to 0.01 ms). If you add an animation, register it
here and keep it CSS-only.

**Base styles:** `html { scroll-behavior: smooth }`, themed `::selection`
(orange 22% alpha), themed `:focus-visible` (2 px `--color-ring` outline,
2 px offset), `body` on `--color-background`/`--color-foreground`.

**Gradients:** hero/CTA overlays must use explicit
`linear-gradient(...)` declarations, **not** `bg-gradient-to-*` utilities —
v4 interpolates in oklab and shifts the hue vs the reference (trap T-3).

---

## §5 Component Architecture & Patterns

**Layer model (4 layers, imports point strictly downward):**

```
pages/         (11 route screens — compose components + store + commerce)
components/    (chrome.tsx shared chrome; product.tsx catalog cards)
lib/           (router, store, commerce, db-path — framework-agnostic seams)
data/  types/  utils/  (static catalog, shared types, cn helper)
```

Golden rule: `pages/` may import from `components/`, `lib/`, `data/`;
`components/` may import from `lib/`, `data/`; `lib/` imports **nothing from
above itself** (`lib/commerce.ts` and `lib/db-path.ts` are pure and unit-test
pinned). `lib/store.tsx` is the only stateful module.

**File map with sizes (line counts verified):**

| File | Lines | Purpose |
|---|---|---|
| `src/App.tsx` | 106 | Route switch (`matchPath` → page), auth/admin gating, skip link |
| `src/components/chrome.tsx` | 978 | `Header` (+ search overlay + portal mobile nav), `CartDrawer` (modal; session-43: the reference has NO drawer — its cart anchor navigates to /cart — so the drawer is the PAD §5.6 #22 superset, internals at the s41-measured cart language: 16px hairline cards, square 80×80 images, muted-pill steppers, trash-2, OS footer, h-10 CTA), `Toaster`, `ChatButton`, `Footer`, `FeatureBar`, `PageShell`, `Field`, `PrimaryButton`, `OutlineButton`, `BrandMark` |
| `src/components/product.tsx` | 121 | `ProductCard` (session-38 chrome/badges/hover-revealed quick-add), `Stars`, `ProductGrid` (session-39: grid-cols-2 md:3 lg:4), price row |
| `src/pages/home.tsx` | 315 | Hero carousel (fixed 500/600px card), FeatureBar, 8 category icon tiles, Featured (6) + New (8) scroll-snap carousels, gradient CTA; exports `ProductRow`/`CarouselArrows` (reused by the PDP related section, session-39) |
| `src/pages/shop.tsx` | 404 | Products list (URL-driven search/category/sort, session-39 h-9 pill filters + 2-up mobile grid), PDP (session-39: space-y rhythm, md grid, gallery tile + session-40 border-soft hairline, info rows, stepper, related carousel — no shipping rows), 404 |
| `src/pages/checkout-flow.tsx` | 887 | Cart page (session-41: square-image cards, muted-pill steppers, amber COD OS), single-page checkout (session-41: max-w-5xl shell, lg:grid-cols-3, shadcn fields, PM radio-cards, sticky OS; session-42: persists `form.phone`), order success (session-42: no-disc header, primary-line pill, SuccessCodNotice, gallery-band card, square images, muted totals, 4-row delivery, 36px pill links) |
| `src/pages/account-pages.tsx` | 886 | Auth (login/register), profile + order history + tabs (session-41: reference profile card; session-42: per-order cards), account order detail, track-order lookup (session-41: pill search shell) |
| `src/pages/content-pages.tsx` | 409 | About (session-40 internals: h3 cards, md grid, flat h1, cream CTA), Contact (session-39 wrappers/cards + session-40 shadcn field layer), 5 legal pages (session-40: reference template + verbatim policies + dynamic `legalDate()`) |
| `src/pages/admin-pages.tsx` | 349 | Admin console (dashboard, products, orders, analytics, categories, carousel, settings) |
| `src/lib/store.tsx` | 528 | `StoreProvider` + `useStore` — cart/auth/orders/UI state, localStorage persistence (session-42: `placeOrder` persists `phone`) |
| `src/lib/commerce.ts` | 232 | Pure money/shipping/promo/order/validation domain functions |
| `src/lib/router.tsx` | 126 | History-API router: `RouterProvider`, `useRouter`, `Link`, `matchPath` |
| `src/lib/db-path.ts` | 67 | `DATABASE_URL` contract + schema-relative resolution (pure) |
| `src/data/catalog.ts` | 700 | `BRAND`, `CATEGORIES` (8), `PRODUCTS` (24), `CAROUSEL` (3), `DEMO_USERS` (2), nav/footer link tables, product lookup helpers |
| `src/types.ts` | 133 | All shared interfaces (§20) — session-42 adds `Order.phone?` |
| `src/index.css` | 99 | `@theme` tokens + base styles |
| `src/utils/cn.ts` | 6 | `cn()` = clsx + tailwind-merge |

**Client/server split:** N/A (no SSR). Every module is a client module;
`typeof document !== "undefined"` guards exist only where portals render.

**Routing pattern:** no react-router. `lib/router.tsx` listens to
`popstate` + link clicks, exposes `useRouter()` (`{ path, search, hash,
navigate }`), and `matchPath()` returns `{ name, params }` for 26 routes
(Appendix A). Pages are switched in `App.tsx` via a `switch` on the matched
name. URL is the source of truth on the products page: search/category/sort
are **read from and written to** the query string (`navigate` with
`replace: true`), so filters survive refresh and are shareable.

**Auth gating pattern:** `App.tsx` checks `user?.role` for `/admin/*` and
`user` for `/account*`, but **only after the store signals `ready`** — the
hydration race fix (trap T-8). Redirect targets always pass through
`validateRedirectPath()` (open-redirect guard, pinned by E2E).

**Checkout pattern:** cart → single-page checkout (contact / shipping /
payment / notes) → `placeOrder()` in the store → redirect to `/order-success`
with the order number. Payment methods: COD (default, reference parity) and
Card (superset, validated by `commerce.ts` card helpers). Guest checkout is
allowed; the order carries a `guestToken` that gates `/track-order` lookups.

---

## §6 Custom Hooks & Provider Deep Dive

There are exactly **two custom hooks** and one provider — keep it that way
unless a third use case appears in two places.

**`useStore()` — `src/lib/store.tsx:485`**
Signature: `function useStore(): StoreValue`. Returns the whole store value
(state + actions) from `React.createContext`. Consumers destructure only what
they need. The provider:

- Hydrates once on mount from `localStorage[STORAGE_KEY]` (currently
  `homenest.v4`, owned by `src/lib/storage-key.ts`; the catalog↔key pairing is
  **contract-enforced** by `tests/catalog-hash.test.ts` — see trap T-7),
  merging with seed data and setting `ready: true` **synchronously after rehydration**
  so route guards can wait on it.
- Persists cart/users/orders/UI prefs back on every state change.
- Action surface (verified from source): `setCartOpen`, `setSearchOpen`,
  `addToCart(productId, quantity?) => string | null` (returns toast text or
  error), `setLineQty`, `removeLine`, `setPromo`, `login(email, password) =>
  string | null`, `register`, `logout`, `updateProfile`,
  `placeOrder(input) => { ok, order? , error? }`-shaped result,
  `updateProduct`, `updateOrderStatus`, `updateCarousel` (the admin surface),
  plus state: `cart`, `cartOpen`, `searchOpen`, `user`, `orders`, `products`,
  `carousel`, `promo`, `ready`.

**Action error convention:** mutating actions return `string | null` — a
human-readable error string on failure, `null` on success. Pages surface it
inline; no exceptions cross the boundary.

**`useRouter()` — `src/lib/router.tsx:46`**
Signature: `useRouter(): { path, search, hash, navigate }`. `navigate(to,
{ replace? })` pushes history state; a `popstate` listener syncs. `Link`
(href, children, props) renders a real `<a>` (crawlable, middle-click safe)
and intercepts left-clicks that are unmodified and in-app.

**Why not per-slice hooks:** the app is one bundle with one storage key;
splitting the context would orphan the single persistence effect. If bundle
size ever matters, split *reads* via `useSyncExternalStore` selectors instead
of adding contexts.

**SSR safety:** not required (no SSR), but the mobile-nav portal guards with
`typeof document !== "undefined"` anyway — preserve that guard if you copy the
pattern.

---

## §7 Content Management & Data (Catalog, Users, Orders)

**Static data lives in `src/data/catalog.ts`** (700 lines): `BRAND` (name,
tagline, contact), `CATEGORIES` (8, each with id/name/blurb/image),
`PRODUCTS` (24), `CAROUSEL` (3 hero slides), `DEMO_USERS` (2), `NAV_LINKS`
(5), `FOOTER_QUICK_LINKS` (5), `FOOTER_LEGAL` (5), plus lookup helpers
(`productBySlug`, `productById`, `relatedProducts`).

**The 8 reference products are parity-pinned** (names, prices, compare-at,
ratings, review counts match the reference site exactly; imagery mirrored
into `public/images/`). They are identified by `featured: true` — do not
reprice or rename them without re-measuring the reference (Appendix C).

**Demo accounts (pinned by E2E):**
- Customer: `john@example.com` / `Demo1234!`
- Admin: `admin@homenest.kitchen` / `Admin1234!`

**How to add a product (3 steps):**
1. Append a `Product` object to `PRODUCTS` in `src/data/catalog.ts` — `id`
   must be unique; `slug` unique; image path under `public/images/`.
2. If it should appear in the reference-parity grid, set `featured: true`
   (max: keep the Featured grid at the reference's visual weight).
3. Run `npm run test` — the `catalog-hash` contract test fails if the seed
   hash has no registry row: bump `STORAGE_KEY` (`src/lib/storage-key.ts`),
   add the new hash → new key row to `tests/catalog-registry.json`. Catalog-
   count E2E pins (`tests/e2e/catalog.spec.ts`) assert "N products found";
   update the expected count **only if** the change is intentional.

**How to add a category:** add to the `CategoryId` union in `src/types.ts`
**first** (the compiler then forces every switch/map), then `CATEGORIES`.
Category slugs are also filter query values on `/products` — E2E covers
`All Categories` + per-category filtering.

**Orders:** created at runtime by `placeOrder()`, persisted in the same
storage key, listed in account + admin. `nextOrderNumber()` generates
`ORD-YYYY-NNN` **sequentially** (per-year max + 1, zero-padded, collision-safe
against existing orders; the clock is injectable for deterministic tests).
Status flow and labels: see `statusLabel()` in `commerce.ts` and the 5-step
vertical stepper (Order Placed → Confirmed → Processing → Shipped →
Delivered) on the track/account pages.

**Why `import.meta.glob` is not used:** there is no filesystem content layer;
the single-file build inlines everything, and Vite glob would break the
dep-scanner pin. Static arrays + versioned storage is the whole content
architecture.

**`db/catalog.json`:** a tooling-time manifest (not imported by the app)
declaring the same `DATABASE_URL` contract; kept in sync manually. The `db/`
folder is git-tracked except `*.db` binaries (`.gitignore`).

---

## §8 Accessibility Implementation

Verified behaviors (kept honest by E2E):

- **Focus ring:** global `:focus-visible` themed to `--color-ring` (orange),
  2 px outline + 2 px offset — never remove; never add `outline-none` without
  a replacement.
- **Skip link:** `App.tsx` renders an sr-only skip-to-content link that
  becomes visible on focus (first tab stop).
- **Landmarks/labels:** header `<header>` + nav; mobile menu `<nav
  aria-label="Mobile">` (E2E depends on this accessible name — `tests/e2e/
  mobile-navigation.spec.ts`); search inputs all have `htmlFor`-linked sr-only
  labels; the desktop search input uses `role="combobox"` with
  `aria-expanded` + `aria-autocomplete="list"` and a `role="listbox"` popup —
  and the full APG keyboard plan (ArrowDown/ArrowUp wrap, Home/End,
  Enter selects, Escape dismisses, `aria-activedescendant` + `aria-selected`;
  `tests/e2e/search-keyboard.spec.ts`).
- **Mobile menu:** a true modal — `role="dialog" aria-modal="true"
  aria-label="Site menu"` with a focus trap (focus enters at the search
  pill/input, Tab cycles within the panel, Escape restores focus to the
  trigger), closes on Escape (keyboard path pinned by E2E), scroll-locks the
  body while open, overlay button is labelled
  (`aria-label="Close menu overlay"`), active link carries
  `aria-current="page"`.
- **Cart drawer:** the same modal contract — `aria-modal="true"`, focus
  moves into the drawer on open (close button first), Tab/Shift+Tab cycle
  within it, Escape and the backdrop click-catcher close it, focus restores
  to the cart trigger (pinned by `tests/e2e/cart-drawer.spec.ts`). The
  reference has NO drawer (its cart anchor navigates to /cart — session-43
  finding), so the drawer is the registered superset PAD §5.6 #22 with its
  internals pinned to the s41-measured cart language ("Your Cart" 20px/700
  Playfair, 16px hairline cards + square 80×80 images, muted-pill
  steppers, inline trash-2, "Order Summary" 18px/700 footer, h-10 pill
  CTA) — 4 measured-language specs added in session 43.
- **Touch targets:** nav rows `min-h-11` (44 px); icon buttons h-10/h-11.
- **Reduced motion:** global `prefers-reduced-motion` clamp in `index.css`
  (all durations → 0.01 ms).
- **Contrast:** white on primary orange (4.5:1-class pair used only at large/
  bold sizes and UI affordances); body text is near-black on cream
  (~15:1); `muted-foreground` on background passes for secondary text.
- **Images:** product/category images carry `alt=""` where decorative inside
  link+text pairs; meaningful images get names.

To verify: run `npm run e2e` (keyboard specs) and manually tab the home page —
order is skip link → nav → search → user/cart → content.

---

## §9 Anti-Patterns & Common Bugs (registered trap log)

Format: symptom → root cause → fix → lesson. These all **actually happened**
in this codebase's history. Tests pin every fix.

### T-1: Transparent theme colors (HIGH)
**Symptom:** elements using token classes render invisible/unstyled.
**Root cause:** Tailwind v4 `@theme` values written as bare space-separated
triplets (`--color-primary: 24 70% 50%`) resolve to transparent — v4 requires
full color functions.
**Fix:** every `--color-*` in `src/index.css` is a full `hsl(...)` literal.
**Lesson:** when porting shadcn triplets into a v4 `@theme`, wrap in `hsl()`.
Pinned by `tests/e2e/visual-parity.spec.ts` computed-style checks.

### T-2: `shadow-sm` scale shift (MEDIUM)
**Symptom:** cards look flatter/heavier than the reference.
**Root cause:** Tailwind v4 moved the `shadow-sm` definition one notch.
**Fix:** `--shadow-sm` explicitly pinned in `@theme` to the v3 geometry.
**Lesson:** pin any token whose cross-version drift is visible.

### T-3: Gradient hue drift (HIGH)
**Symptom:** hero overlay/CTA banner colors disagree with the reference.
**Root cause:** v4 `bg-gradient-to-*` interpolates in oklab; the reference was
measured in sRGB.
**Fix:** explicit `linear-gradient()` in CSS for hero overlays and the home
CTA banner.
**Lesson:** for pixel-parity work, measure with `getComputedStyle` and write
plain CSS gradients, not utility sugar.

### T-4: The backdrop-filter containing-block trap (CRITICAL — the mobile
nav bug)
**Symptom:** mobile menu renders squashed inside the 64–72 px header box
(links overlap, overlay missing); "fixed" positioning seems ignored.
**Root cause:** per CSS spec, `backdrop-filter` (used by the sticky header's
`backdrop-blur-sm`) makes that header the **containing block for
`position: fixed` descendants**. The v1 drawer + overlay were rendered *inside*
the header JSX, so `fixed` resolved against the header box, not the viewport.
This is a spec-compliant browser behavior, not a Tailwind regression — but it
bites hard in Tailwind v4 UIs that lean on blurred sticky headers.
**Fix:** the mobile menu dialog renders through
`createPortal(..., document.body)` from inside `Header` (`chrome.tsx`),
positioned `fixed inset-x-0 top-16 z-[350]`. The header keeps its blur.
**Lesson:** any `position: fixed` element must not be a DOM descendant of an
element with `backdrop-filter`/`filter`/`transform`/`contain`. Portal it.
Pinned by 11 specs in `tests/e2e/mobile-navigation.spec.ts`.

### T-5: ESM `__dirname` crash (MEDIUM)
**Symptom:** `vitest.config.ts`/`vite.config.ts` throw `__dirname is not
defined`.
**Root cause:** ESM configs don't define CJS globals.
**Fix:** `const __dirname = path.dirname(fileURLToPath(import.meta.url))` in
both configs.
**Lesson:** copy the two-line shim, never reference `__dirname` bare in this
repo.

### T-6: Vite dep-scanner crash on vendored `skills/` (HIGH)
**Symptom:** dev server fails pre-bundling with import errors from files you
never wrote (e.g. `three`), paths under `skills/`.
**Root cause:** Vite's scanner walks the project for entry HTML; the vendored
`skills/` tree contains 265 folders of reference HTML with bare imports.
**Fix:** `optimizeDeps.entries: ["index.html", "src/**/*.{ts,tsx}"]` in
`vite.config.ts`.
**Lesson:** `skills/` is reference material only — excluded from checking,
testing, and compilation. If a new vendored folder appears, extend the pin.

### T-7: Stale localStorage shadowing (HIGH)
**Symptom:** after catalog changes, the UI shows old products/counts.
**Root cause:** persisted `products` under a version-less storage key
override the re-seeded catalog.
**Fix:** `STORAGE_KEY` lives in `src/lib/storage-key.ts` (currently
`homenest.v4`) and is **contract-pinned**: `tests/catalog-hash.test.ts`
sha-256-hashes `src/data/catalog.ts` and requires a matching hash → key row
in `tests/catalog-registry.json`. A seed edit without the bump fails the
gate with repair instructions (this caught the session-3 carousel reorder).
**Lesson:** every persisted shape change ships with a key version bump in the
same commit — and now the gate proves it instead of trusting the checklist.

### T-8: Hydration race on guarded routes (HIGH)
**Symptom:** hard refresh of `/admin` (logged in) bounces to `/login`.
**Root cause:** route guards evaluated `user` before the persisted session
rehydrated from `localStorage`.
**Fix:** guards (AdminFrame/AccountPage/AccountOrderPage) wait for the
store's `ready` flag.
**Lesson:** never gate on persisted state without a rehydration signal.
Pinned by `tests/e2e/auth-admin.spec.ts`.

### T-9: Playwright strict-mode selector traps (LOW, test-authoring)
**Symptom:** `strict mode violation` or silently-matching zero elements.
**Root cause:** `getByRole` does substring matching on accessible names;
multiple elements matched.
**Fix:** scope assertions by viewport/region, prefer exact IDs
(`#mobile-nav`) and `testid`s added for stability (`data-testid` on card
price).
**Lesson:** in this repo, assert the mobile menu via `#mobile-nav`, never
generic role+name alone.

### T-10: `vite preview` ≠ dev server for E2E (MEDIUM)
**Symptom:** E2E passes on dev, fails on preview (or vice versa).
**Root cause:** dev-only behaviors (dep optimizer, HMR overlay) differ.
**Fix:** Playwright `webServer` runs `npm run preview` on the built bundle;
E2E never targets :5173.
**Lesson:** the parity gate is only meaningful against the artifact you ship.

### T-11: WebKit unavailable in slim environments (INFO)
**Symptom:** mobile project aborts: missing host libraries.
**Fix:** iPhone 14 profile pinned to `browserName: "chromium"`.
**Lesson:** device emulation ≠ engine; pin deliberately and document.

### T-12: Schema-relative DB URL treated as literal (MEDIUM)
**Symptom:** tooling resolves `file:../db/custom.db` against CWD → wrong path.
**Fix:** `src/lib/db-path.ts` implements Prisma-style resolution against the
`prisma/` anchor, pinned by `tests/db-path.test.ts` (8 tests).
**Lesson:** env contracts deserve contract tests too.

### T-13: v4 computed-value serialization drifts from v3-era references
(SESSION 4)
**Symptom:** a parity pin asserting an exact computed value fails even though
the class "looks right": `bg-card/80` computes to `oklab(... / 0.8)` (v4
opacity modifiers color-mix in oklab) where the reference emits
`rgba(255,255,255,0.8)`; `rounded-full` computes to `calc(infinity * 1px)`
(≈ `3.35544e+07px` in Chromium) where the reference emits the v3-era literal
`9999px`.
**Root cause:** Tailwind v4 serializes these utilities differently from the
older builds the reference was produced with; visually identical, but the
repo's parity gate pins computed strings.
**Fix:** bake parity-critical alpha into a token (`--color-panel: hsl(0 0%
100% / 0.8)` → `bg-panel`) and use `rounded-[9999px]` where an exact radius
string is pinned. Both fixes found while matching the reference's menu panel
(session 4).
**Lesson:** measure `getComputedStyle` on BOTH sides before writing the pin;
choose the utility whose *computed* value — not whose name — matches.

---

## §10 Debugging Guide

**Build failures**
| Error | Cause | Fix |
|---|---|---|
| `__dirname is not defined` (config) | ESM config | T-5 shim |
| Pre-bundle import errors mentioning `skills/...` | dep scanner left the pin | T-6: restore `optimizeDeps.entries` |
| `Cannot find module '@/...'` | alias missing in the config you're running | both vite + vitest configs must carry the `@` alias |
| Type errors in pages after token rename | stale `@theme` names | grep old class names (`rg "text-copper|bg-linen" src`) — legacy v1 names must be gone |

**Runtime errors**
| Symptom | Cause | Fix |
|---|---|---|
| Mobile menu squashed in header | T-4 containing block | keep the portal; check nobody re-inlined the drawer |
| Blank token colors | T-1 bare triplets | restore `hsl()` literals |
| Refresh of `/admin` → `/login` while logged in | T-8 race | guard on `ready` |
| Old catalog after data change | T-7 shadowing | bump storage key version |
| Images 404 under `/images/...` | asset not in `public/images/` | re-add file; check exact filename case |

**Test failures**
| Symptom | Cause | Fix |
|---|---|---|
| E2E times out connecting to :4173 | previous preview still bound / strictPort conflict | kill stale process or set `E2E_PORT` |
| `strict mode violation` | substring name match | T-9 scoping |
| Mobile specs fail on desktop run | viewport-scoped assertions | specs already scope `#mobile-nav` — don't unscope |
| Unit test picks up `*.spec.ts` | vitest include edited | restore include list (§3) |
| Catalog count mismatch | intentional/intentional-less catalog edit | update seed count pin + storage version together |

**Visual/styling**
| Symptom | Cause | Fix |
|---|---|---|
| Gradient hue off vs reference | T-3 oklab | explicit `linear-gradient()` |
| Shadows too heavy | T-2 scale | pinned `--shadow-sm` |
| Menu panel under cart drawer | z-index regression | §18 map (350 < 500) |

**Live-site verification commands:**
```bash
npm run verify && npm run e2e                 # full gate
npx playwright test --project=mobile          # mobile-nav suite only
npx playwright test tests/e2e/visual-parity   # computed-style parity pins
node -e "console.log(require('./src/lib/db-path.ts'))"  # n/a — use vitest for db-path
```

---

## §11 Pre-Ship Checklist

Run in order; all must pass (this is the repo's contract, executed before
every push):

```bash
npm run typecheck   # tsc --noEmit — zero errors
npm run test        # vitest — 104/104 (7 files)
npm run build       # vite build — single-file dist/index.html (prebuild regenerates SEO artifacts)
npm run e2e         # playwright — 312/312 (156 specs × chromium+mobile)
```

Before committing, also verify:
- [ ] No `.env` staged (git-ignored); `.env.example` still matches the
      `DATABASE_URL` contract (+ `VITE_SITE_URL` documentation).
- [ ] If visible catalog slugs changed: `public/sitemap.xml` regenerated
      (`npm run seo:generate`) — `tests/sitemap.test.ts` enforces it.
- [ ] New routes got a title in `src/lib/seo.ts` (unit-pinned) — never
      `document.title` ad hoc in a page (AGENTS.md rule 10).
- [ ] `db/*.db` binaries not staged.
- [ ] If persisted shapes or the seed catalog changed: `STORAGE_KEY` bumped
      **and** the new hash → key row added to `tests/catalog-registry.json`
      (T-7 — the `catalog-hash` test enforces both), plus catalog-count pins
      updated in the same commit.
- [ ] If `skills/` tree changed: `optimizeDeps.entries` still excludes it.
- [ ] Mobile nav still portal-rendered (T-4): `rg -n "createPortal" src/components/chrome.tsx`
      → exactly one, targeting `document.body`.
- [ ] No new runtime dependency added without justification (§2 lists five).
- [ ] Screenshots refreshed if any surface changed visually
      (`docs/screenshots/`).
- [ ] Docs aligned: README/AGENTS/CLAUDE/PAD + this SKILL (test counts,
      versions, file paths).

Post-deploy (single-file bundle): serve `dist/index.html` from any static
host and smoke: home renders, add-to-cart increments badge, mobile menu opens
and navigates, checkout places an order, track-order finds it.

---

## §12 Lessons Learnt & How to Avoid Them

1. **Measure, then write CSS** — every parity value in `src/index.css` came
   from `getComputedStyle` on the live reference (T-1/T-2/T-3). Guessing from
   screenshots produced two wrong palettes before the measured approach stuck.
2. **Portal anything fixed near blurred chrome** — the T-4 trap cost the
   mobile nav entirely; one `createPortal` line is the whole fix. Check for
   `backdrop-*`, `filter`, `transform`, `contain` on ancestors before
   trusting `position: fixed`.
3. **Tests first caught *app* bugs, not test bugs** — the E2E layer exposed
   the T-8 hydration race and (indirectly) the T-7 stale-storage bug. The TDD
   loop paid for itself on day one.
4. **Version your persistence from day one** — T-7 only surfaced because the
   catalog changed under a version-less key. The fix is trivial; retrofitting
   it after user data exists is not.
5. **Exclude vendored reference material at the tool boundary** — T-6: the
   `skills/` folder is documentation, not code. Exclusions belong in tooling
   config (`optimizeDeps.entries`, vitest include, git archive), not in
   developer memory.
6. **Test the contract, not the incident** — db-path tests pin the
   *normalized* path contract (the first test draft pinned un-normalized
   strings and was corrected). Contracts outlive incident details.
7. **Emulate devices, pin engines** — T-11: device profile and browser engine
   are independent axes; choose them independently and write down why.
8. **E2E against the artifact you ship** — T-10: preview-of-build is the only
   honest parity target.
9. **Accessible names are API** — E2E depends on `aria-label="Mobile"` and
   combobox semantics; changing markup is a breaking change to the test
   suite, so treat a11y attributes as published contract.
10. **Integer cents everywhere** — money bugs are silent; `commerce.ts`'s
    integer math + unit pins keep totals, discounts, and shipping exact.
11. **Docs are part of the diff** — AGENTS/CLAUDE/README/PAD updated in the
    same commit as behavior changes kept every claim current (this SKILL
    continues that rule).
12. **Sequencing beats heroics** — audit → parity → tests → docs → push, in
    that order, let each phase's outputs feed the next (measured tokens fed
    tests; tests fed docs).

---

## §13 Pitfalls to Avoid

**Architecture**
- Don't render `position: fixed` elements inside the blurred header (T-4) —
  portal to `document.body`.
- Don't import `data/` into `lib/` (layer inversion); `lib` stays pure.
- Don't add a second state system (context zoo, external store) — the single
  `StoreProvider` is the design.

**TypeScript**
- Don't use `any` for store/cart shapes; `StoreValue` and `src/types.ts` are
  complete.
- Don't widen `CategoryId` without updating `CATEGORIES` + filter UI +
  E2E expectations in the same commit.

**Testing**
- Don't point Playwright at the dev server (T-10).
- Don't write `getByRole("link", { name: "Account" })` unscoped — substring
  collisions (T-9).
- Don't delete a failing pin to go green; fix the app or consciously update
  the pin with rationale.

**Design system**
- Don't introduce raw hex/hsl values in components — use `@theme` tokens.
- Don't use `bg-gradient-to-*` for parity surfaces (T-3).
- Don't restyle the green accent into decorative use (§1 rule 1).

**Security (demo-grade, documented)**
- Passwords are hashed at rest since session 5 (`s1$<salt>$<sha256>` records
  in `src/lib/password.ts`; upgrade-on-login migrates legacy plaintext). Don't
  revert the seed to plaintext, don't log credentials, and don't present this
  as real auth — SHA-256 is not a KDF; the production path is server-side
  auth (see PAD threat model).
- Guest tokens are crypto-grade since session 3 (`generateGuestToken()` in
  `lib/commerce.ts`); don't regress them to `Math.random`.

**Performance**
- Don't import icon barrels beyond used icons (single-file bundle inflates).
- Don't add runtime deps for things `commerce.ts`/`cn()` already do.

---

## §14 Best Practices

- **Code organization:** pages by route domain, one shared `chrome.tsx`,
  pure `lib/`, static `data/`. New shared UI → `components/`; new domain
  math → `commerce.ts` with unit pins.
- **TypeScript:** `interface` for object shapes, `type` for unions;
  `import type` where import is type-only; strict mode, no `any`.
- **React:** function components + named exports only (no default exports in
  src); props typed inline for one-off components; context consumed via the
  single `useStore()`/`useRouter()` hooks.
- **Styling:** Tailwind token classes exclusively; `cn()` for conditional
  classes; arbitrary z-index values only from the §18 map.
- **State:** read `ready` before any auth-dependent render; persist via the
  store, never ad-hoc `localStorage` writes elsewhere.
- **Testing:** TDD for domain changes (unit pin first), E2E for surfaces;
  every bug fix lands with its regression pin (§9 shows the mapping).
- **Docs:** behavior change ⇒ same-commit update to affected docs; test
  counts and versions are quoted exactly, never rounded.
- **Git:** Conventional Commits (`feat|fix|test|docs:`), main-branch only,
  atomic commits per concern.

---

## §15 Coding Patterns (copy-pasteable)

**Pattern: portal a fixed overlay out of blurred chrome** (the T-4 fix;
`chrome.tsx`)

```tsx
{typeof document !== "undefined" &&
  createPortal(
    menuOpen ? (
      <div
        className="fixed inset-x-0 top-16 z-[350] md:hidden"
        id="mobile-nav-holder"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <button
          type="button"
          tabIndex={-1}
          className="fixed inset-0 top-16 -z-10 h-[calc(100vh-4rem)] cursor-default bg-transparent"
          aria-label="Close menu overlay"
          onClick={() => setMenuOpen(false)}
        />
        <nav id="mobile-nav" aria-label="Mobile" className="border-b border-border bg-card px-4 pb-6 pt-3 shadow-pop">
          {/* search + NAV_LINKS rows; active row: bg-primary text-primary-foreground rounded-full */}
        </nav>
      </div>
    ) : null,
    document.body,
  )}
```

The `Header` pairs this with a focus-trap effect: on open, focus moves to the
panel's first focusable (the search input); the window keydown handler cycles
Tab/Shift+Tab within `#mobile-nav-holder` and closes on Escape; the cleanup
restores focus to the trigger.

**Pattern: store action with `string | null` error contract** (`store.tsx`)

```tsx
addToCart: (productId, quantity = 1) => {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return "Product not found.";
  // clampQuantity guards stock; returns toast text on success, error string otherwise
},
```

**Pattern: URL-driven page state** (`shop.tsx` — filters live in the query
string)

```tsx
const { search, navigate } = useRouter();
const params = new URLSearchParams(search);
const q = params.get("search") ?? "";
// on change:
navigate(`/products?${next.toString()}`, { replace: true });
```

**Pattern: schema-relative env contract + contract tests** (`db-path.ts` +
`tests/db-path.test.ts`)

```ts
export const DATABASE_URL = "file:../db/custom.db";
export const SCHEMA_DIR = "prisma";
export function resolveDbPath(url = DATABASE_URL, schemaDir = SCHEMA_DIR): string {
  // file:../db/custom.db + prisma/ anchor → "prisma/db/custom.db" (normalized)
}
```

**Pattern: integer-cents money math** (`commerce.ts`)

```ts
export const FREE_SHIPPING_THRESHOLD = 5_000; // $50 — reference parity
export const FLAT_SHIPPING_CENTS = 999;       // $9.99 below threshold
export const TAX_BPS = 0;                     // no tax line (reference parity)
export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

**Pattern: guarded route with hydration gate** (`App.tsx`)

```tsx
function AdminFrame({ children }: { children: ReactNode }) {
  const { user, ready } = useStore();
  const { navigate } = useRouter();
  useEffect(() => {
    if (ready && user?.role !== "admin") navigate("/login");
  }, [ready, user, navigate]);
  if (!ready) return null;          // T-8: wait for rehydration
  if (user?.role !== "admin") return null;
  return <>{children}</>;
}
```

**Pattern: computed-style parity pin** (`tests/e2e/visual-parity.spec.ts`)

```ts
const bg = await page.evaluate(() => getComputedStyle(document.querySelector("#mobile-nav a.bg-primary")).backgroundColor);
expect(bg).toBe("rgb(217, 110, 38)"); // primary hsl(24 70% 50%) measured from the reference
```

**Pattern: route-head contract (session 8)** (`src/lib/seo.ts` + `src/components/head-manager.tsx`)

```tsx
// Pure seam — unit-pinned, no DOM:
const meta = buildRouteMeta("/products/cast-iron-dutch-oven", PRODUCTS);
// → { title: "Cast Iron Dutch Oven | HomeNest Kitchen",
//     canonicalUrl: SITE_URL + "/products/cast-iron-dutch-oven",
//     ogUrl: SITE_URL + "/products/..." (query preserved),
//     jsonLd: { "@type": "Product", offers: { price: cents/100, ... } } }

// Application — one effect inside RouterProvider (HeadManager):
document.title = meta.title;
upsertCanonical(meta.canonicalUrl);
writeRouteJsonLd(meta.jsonLd); // scoped #route-jsonld, removed when null
```

Rules: titles/canonical/og:url/JSON-LD come ONLY from the seam; new routes
get a `buildRouteMeta` entry (or static-map row) unit-pinned in
`tests/seo.test.ts`; robots.txt/sitemap.xml are generated
(`npm run seo:generate`), never hand-edited; the origin lives in
`VITE_SITE_URL` (`.env.example`) shared by the seam, the generator, and the
index.html fallbacks.

---

## §16 Coding Anti-Patterns

| Don't | Do instead |
|---|---|
| Nest a drawer inside a `backdrop-blur` header | portal to `document.body` (T-4) |
| `--color-x: 24 70% 50%` in `@theme` | full `hsl()` literal (T-1) |
| `bg-gradient-to-*` on parity surfaces | explicit `linear-gradient()` (T-3) |
| Bare `__dirname` in ESM configs | `fileURLToPath(import.meta.url)` shim (T-5) |
| Float money math / `toFixed` chains | integer cents + `formatMoney` |
| `localStorage.getItem` scattered in pages | the versioned store (§6) |
| Guarded routes reading `user` pre-`ready` | hydration gate (T-8) |
| `any` on store/domain shapes | `src/types.ts` interfaces (§20) |
| Default exports in `src/` | named exports only |
| New context per feature | single `useStore()` |
| Raw hex classes (`bg-[#d96e26]`) | token classes (`bg-primary`) |
| z-index guessing (`z-50`, `z-999`) | §18 layer map |
| Deleting a failing test pin | fix the app, or update the pin with rationale |

---

## §17 Responsive Breakpoint Reference

Tailwind v4 defaults (no custom screens in `@theme`): `sm 640 · md 768 ·
lg 1024 · xl 1280 · 2xl 1536`.

Usage patterns by surface:
- **Header:** desktop nav hidden below `md` (`hidden md:flex`); mobile
  controls (user/cart/hamburger) hidden at `md` and up. The mobile menu
  portal is `md:hidden` — it can never appear on desktop even if state
  glitches.
- **Grids:** product/category grids `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
  (home) / `sm:grid-cols-2 lg:grid-cols-4` (products page).
- **Page width:** `PageShell` constrains to a max-width container with
  horizontal padding; admin variant keeps a sidebar at `lg`.
- **Hero:** text scales `text-3xl → text-5xl`; carousel height shrinks on
  small screens.
- **Forms:** checkout/account use single-column at mobile, 2-column + summary
  sidebar at `lg`.

Mobile testing recommendation: the `mobile` Playwright project is the iPhone
14 profile (390×844, touch, mobile UA). Run
`npx playwright test --project=mobile` after any header/nav/grid change.

---

## §18 Z-Index Layer Map

Verified usage (arbitrary-value classes; `@theme` exposes the same numbers):

| z | Element | File | Purpose |
|---|---|---|---|
| `z-[300]` | Sticky header | `chrome.tsx:94` | App chrome sits above page content |
| `z-[350]` | Mobile nav portal (`#mobile-nav-holder`) + desktop search overlay | `chrome.tsx` | Below cart drawer, above header/page; transparent click-catcher is `-z-10` inside the portal |
| `z-[420]` | Chat FAB | `chrome.tsx:458` | Floats above content, below modal surfaces |
| `z-[500]` | Cart drawer (`fixed inset-0` root) | `chrome.tsx:333` | Top modal surface |
| `z-[800]` | Toaster stack | `chrome.tsx:440` | Always visible |
| `z-10` | In-card image badge / hero content | `product.tsx`, `home.tsx` | Local stacking inside cards only |

Conflict rules: drawer (500) > mobile menu (350); toasts (800) top all;
chat FAB yields to drawer/modal. Never introduce a z-index outside this
table — extend the table and the `@theme` z tokens together.

---

## §19 Color Reference (Complete)

Every value below is copied from `src/index.css` `@theme` (verified against
the file; a mismatch here is a bug — fix the CSS or this table, never
neither):

| Token | Value | Usage |
|---|---|---|
| `background` | `hsl(30 25% 98%)` = `#FBFAF9` | page background |
| `foreground` | `hsl(20 15% 10%)` = `#1D1816` | body text |
| `primary` | `hsl(24 70% 50%)` = `#D96E26` | CTA pills, active nav, prices, brand mark, links |
| `primary-dark` | `hsl(24 70% 43%)` = `#BA5E21` | hover/pressed primary |
| `primary-foreground` | `hsl(0 0% 100%)` | text on primary |
| `secondary` | `hsl(35 30% 93%)` = `#F3EEE8` | soft beige fills (COD box, promise card) |
| `secondary-foreground` | `hsl(20 15% 20%)` = `#3B302B` | text on secondary |
| `muted` | `hsl(30 15% 94%)` = `#F2F0ED` | input fills, hover rows |
| `muted-foreground` | `hsl(20 10% 45%)` = `#7E6F67` | secondary text, subtitles |
| `accent` | `hsl(160 40% 45%)` = `#45A182` | green: In Stock, Free shipping, logged-in dot |
| `accent-soft` | `hsl(160 40% 95%)` | green-tinted backgrounds |
| `destructive` | `hsl(0 72% 51%)` = `#DC2828` | discount pills, destructive actions |
| `border` | `hsl(30 15% 88%)` = `#E5E0DC` | all borders/dividers |
| `card` / `card-foreground` | `hsl(0 0% 100%)` / `hsl(20 15% 10%)` | cards, header, drawer |
| `ring` | `hsl(24 70% 50%)` | focus ring (= primary) |
| `badge` | `#fbbf24` = `rgb(251,191,36)` | star ratings (amber-400, session-38; the "Featured" pill is `bg-primary`) |
| `footer` | `hsl(20 15% 10%)` = `#1D1816` (= foreground, session-30 re-measurement) | dark footer background |
| `footer-rule` | `hsl(30 25% 98% / 0.1)` = `rgba(251,250,249,0.1)` | footer divider (session-34, alpha baked per T-13) |
| `panel` | `hsl(0 0% 100% / 0.8)` = `rgba(255,255,255,0.8)` | sticky-HEADER glass + `backdrop-blur-xl` (session-36; the menu panel body is solid `bg-card`) |
| `border-soft` | `hsl(30 15% 88% / 0.5)` = `rgba(229,224,220,0.5)` | header/panel 0.5-alpha hairlines (session-36) |
| `hero-body` | `hsl(0 0% 100% / 0.8)` = `rgba(255,255,255,0.8)` | hero paragraph (session-36, alpha baked) |
| `dot-idle` | `hsl(0 0% 100% / 0.4)` = `rgba(255,255,255,0.4)` | idle carousel dots (session-36) |
| `frost` | `hsl(0 0% 100% / 0.1)` = `rgba(255,255,255,0.1)` | carousel arrow glass (session-36) |
| `gallery` | `hsl(30 15% 94% / 0.3)` = `rgba(242,240,237,0.3)` | PDP gallery tile (session-39; the reference's `bg-muted/30`, alpha baked per T-13) |

Opacity conventions: primary at 22% for `::selection`; the sticky header is
`--color-panel` (white/80, alpha baked) with `backdrop-blur-xl` (24px) since
session-36 — the mobile-menu panel BODY is solid `bg-card` (the session-4
white/80 reading had measured the header row). The v4 `hover:` variant is
overridden to plain `&:hover` (`@custom-variant hover (&:hover);` in
index.css) because v4 media-gates hovers behind `@media (hover: hover)` and
the v3-era reference does not (trap T-9).

Forbidden colors: any blue/purple/indigo; raw Tailwind palette classes
(`bg-orange-500` etc.) — use semantic tokens only (pinned by visual-parity
specs).

---

## §20 The Complete TypeScript Interface Reference

All from `src/types.ts` (verified). Copy-paste compiles against the repo.

```ts
export type CategoryId =
  | "cookware" | "bakeware" | "kitchen-tools" | "storage"
  | "appliances" | "dining" | "cleaning" | "decor";

export interface Category { id: CategoryId; name: string; blurb: string; image: string; }

export interface Product {
  id: string; slug: string; name: string; category: CategoryId;
  priceCents: number; compareAtCents: number | null;
  rating: number; reviewCount: number; stock: number;
  visible: boolean; featured: boolean; isNew: boolean;
  image: string; gallery: string[]; badge: string | null;
  materials: string[]; features: string[];
  description: string; shippingNote: string;
}

export interface CartLine { productId: string; quantity: number; }

export interface Address {
  id: string; label: string; name: string; line1: string; line2: string;
  city: string; state: string; zip: string; country: string; isDefault: boolean;
}

export interface User {
  id: string; email: string; name: string;
  role: "customer" | "admin"; password: string; addresses: Address[];
}

export type OrderStatus =
  | "pending" | "paid" | "processing" | "in_transit"
  | "delivered" | "cancelled" | "refunded";

export interface OrderItem { productId: string; name: string; image: string; unitCents: number; quantity: number; }

export interface Order {
  id: string; number: string; userId: string | null; email: string;
  placedAt: string; status: OrderStatus; items: OrderItem[];
  subtotalCents: number; discountCents: number; shippingCents: number;
  taxCents: number; totalCents: number; promoCode: string | null;
  shippingAddress: Omit<Address, "id" | "isDefault" | "label">;
  paymentLast4: string; carrier: string | null; trackingNumber: string | null;
  timeline: { at: string; label: string }[]; guestToken: string;
}

export interface CarouselSlide { id: string; title: string; kicker: string; body: string; cta: string; href: string; image: string; active: boolean; }
export interface ToastMessage { id: string; text: string; }
export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
```

Environment interface (the one env var):

```ts
/** .env — schema-relative, resolved by src/lib/db-path.ts (contract-tested) */
export const DATABASE_URL = "file:../db/custom.db"; // → <repoRoot>/db/custom.db
```

---

## Appendix A: Route Map (all 26 routes)

Source: `matchPath()` in `src/lib/router.tsx`. Product pages accept BOTH URL
shapes (reference `/product/{id}` + legacy slug `/products/{slug}`).

| Route | Name | Guard |
|---|---|---|
| `/` | home | — |
| `/products` | products (URL-driven q/category/sort) | — |
| `/products/:slug` · `/product/:id` | product (PDP) | — |
| `/cart` | cart | — |
| `/checkout` | checkout | — |
| `/order-success` | order-success | — |
| `/account` | account | logged-in |
| `/account/orders/:id` | account-order | logged-in |
| `/login` · `/register` | auth | — |
| `/about` · `/contact` · `/track-order` | content | — |
| `/privacy-policy` · `/terms-of-service` · `/refund-policy` · `/cookie-policy` · `/disclaimer` | legal | — |
| `/admin`, `/admin/dashboard` | admin-dashboard | role=admin |
| `/admin/products` · `/admin/orders` · `/admin/analytics` · `/admin/categories` · `/admin/carousel` · `/admin/settings` | admin screens | role=admin |
| `/admin/orders/:id` | admin-order | role=admin |
| anything else | not-found | — |

## Appendix B: Verification & Test Ledger

- Unit (vitest, node env): `src/lib/commerce.test.ts` + `tests/db-path.test.ts`
  + `tests/catalog-hash.test.ts` + `tests/password.test.ts` +
  `tests/seo.test.ts` + `tests/sitemap.test.ts` + `tests/db-scripts.test.ts`
  = **104 tests, 7 files, all green**.
- E2E (playwright, production build via preview server): **156 specs** —
  visual-parity 59 (incl. the session-39 PDP/catalog/content-page layer,
  the session-40 watch-list closure layer: about internals, legal
  template + verbatim policies + dynamic date, contact form fields; the
  session-41 checkout/cart/account/track layer: the max-w-5xl +
  lg:grid-cols-3 checkout shell, shadcn v3 fields, PM radio-cards, the
  sticky OS card, cart square-image cards + muted-pill steppers + the
  amber COD box, the account profile card + order list, the track-order
  pill search; and the session-42 order-success/account-orders layer: the
  no-disc header + primary-line order pill, the large amber COD variant
  with its amber-100 disc, the gallery-band card with square images and
  muted totals, the 4-row delivery block with phone, the 36px pill
  links, the per-order account cards),
  cart-drawer 7 (incl. the session-43 cart-drawer superset layer: the
  reference-has-no-drawer fact, the measured-language pins — "Your Cart"
  20px/700, 16px hairline cards with square 80×80 images, muted-pill
  steppers, inline trash-2, "Order Summary" footer with the h-10 pill CTA),
  seo-head 19, mobile-navigation 15, cart-checkout 9, a11y-smoke 8,
  search-keyboard 8, auth-admin 7, catalog 6, smoke 5,
  mobile-header-parity 5, password-hash 4, pwa-manifest 3,
  account-layout 1 — × 2 projects (chromium, mobile) = **312 executions,
  all green** (session-42 gate, 5.6 min).
- Reproduce: `npm run verify && npm run e2e`.

## Appendix C: Parity Contract with the Reference Site

Measured live (agent-browser, desktop + mobile) and pinned by
`tests/e2e/visual-parity.spec.ts`:

1. Primary orange computed `rgb(217, 110, 38)` on CTA/active-nav surfaces.
2. Active nav is a filled pill (radius ≥ half height), white text.
3. Mobile menu: inline dropdown panel below the header (not a side drawer);
   hamburger is the TRAILING header icon (right of the cart); no page dim
   (session-3 re-measurement); closes on navigation and Escape; modal focus
   trap keeps Tab inside the panel. Session-36 re-measurement: the panel BODY
   is SOLID `bg-card` with a `border-border-soft` bottom hairline and NO drop
   shadow (the session-4 "translucent white/80" reading had measured the
   reference's header row — now the header itself: `--color-panel` white/80 +
   `backdrop-blur-xl` 24px); rows are 14px/500 with muted-foreground inactive
   text and a 12px active-row radius; the search control is the reference's
   compact 40×28 muted pill (label `hidden sm:inline` — icon-only at mobile;
   the reference's pill is inert — the clone expands it into a working input,
   registered divergence #13). Session-5 re-measurement: the reference DROPPED
   the green close disc — the trigger is a bare dark icon in BOTH states
   (transparent 36×36 button, foreground glyph, no inner span); session-36
   added its HOVER pin (accent-green disc + white glyph + 150ms, both
   states — v4's `@media (hover: hover)` gating had to be overridden first,
   trap T-9).
4. Cart summary shows Subtotal / Shipping (Free ≥ $50) / Total — **no tax
   line**.
5. Checkout defaults to Cash on Delivery; card is the registered superset.
6. PDP shows green "In Stock", red `-N%` pill, primary-ORANGE "Featured"
   pill (session-38 re-measurement — no longer amber), orange category
   eyebrow, Playfair product name, all-amber star row + `(count)`.
   Session-39 full spec: `py-8 space-y-16` wrapper, `md:grid-cols-2`
   body, aspect-square 24px-radius borderless gallery tile
   (`rgba(242,240,237,0.3)`), `space-y-6` info column (14px/500/0.7px
   label, text-3xl→4xl h1, 20px amber stars + "4.9 (412 reviews)",
   16px stock row with green icon, h3 Description + 16px/26px paragraph,
   cream 2px-10px feature pills, 112×36 muted stepper), a scroll-snap
   related carousel with 40px arrows, and NO shipping/returns rows
   (removed, PAD §5.6 #19 — `shippingNote` stays in the seed).
7. Footer is the dark 4-column layout with the bottom legal bar.
8. Registered supersets (allowed divergences): 24-product catalog (8
   reference-exact), promo code `NEST10` (10% off ≥ $40), card payment,
   wishlist, admin console, delivery-window estimates, chat FAB → /contact.

## Appendix D: Audit History

| Session | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-12 | Full Mode C audit → parity redesign → test infra → docs | 17 findings (F-01…F-17) remediated (R-01…R-24); gate 22/22 unit + 82/82 E2E; see `docs/remediation-plan.md` + `docs/session_1.md` |
| 2 | 2026-10-12 | Session-1 transcript validation → remediation plan → SKILL distillation | Ledger validated against code; `docs/remediation-plan.md` + this SKILL created per both distill skills; 18 screenshots; gate re-verified 22/22 unit + 82/82 E2E; see `docs/session_2.md` |
| 3 | 2026-10-12 | Ledger validation → follow-ups (TDD) → live parity re-measurement | R-05 over-claim corrected; `isExpiryValid` rolling window, 128-bit crypto guest tokens, mobile-menu modal dialog + focus trap, axe structural gate, catalog↔key registry contract; 5 mobile parity gaps fixed (hamburger trailing, no header search button, 2×2 feature bar, carousel order, no page dim); STORAGE_KEY → homenest.v3; gate 25/25 unit + 104/104 E2E |
| 4 | 2026-10-12 | Session-3 transcript validation → audit → live parity re-sweep → TDD follow-ups | SKILL drift corrected (§7 order numbers, §8 stale a11y gap, §13, §15, §19); cart drawer became a full modal (aria-modal + focus trap + focus restore); axe gate extended to authenticated surfaces (account, admin); 5 more menu parity gaps fixed (translucent shadowless panel, compact search pill + expand-on-tap superset, 14px/500 rows, muted inactive text, 12px active radius); traps T-13 (oklab opacity-mix, calc(infinity) radius); gate 25/25 unit + 120/120 E2E; see `docs/session_4.md` |
| 5 | 2026-10-12 | §10.5 candidates → audit → re-sweep → TDD follow-ups | Password-at-rest hardened (R5-01: `src/lib/password.ts` salted WebCrypto digests, async auth, upgrade-on-login, hashed demo seed, STORAGE_KEY → homenest.v4 — downgrades F-10); desktop search became a full APG combobox (R5-02); reference re-sweep caught the green close disc removed (R5-03) and carousel auto-rotation explained; axe gate extended to checkout + contact (R5-04); stale `homenest.v1` copy fixed (R5-05); account-header phone overflow fixed (R5-06); gate 33/33 unit + 144/144 E2E; see `docs/session_6.md` |
| 8 | 2026-10-12 | Sitemap & SEO workstream (user mandate; template pattern adapted to the SPA) → re-sweep → TDD follow-ups | Re-sweep found NO drift (first time in four); reference SEO shape decoded; robots.txt + generated sitemap.xml (24 product URLs, private surfaces excluded — R8-01/02/03, catalog-gated); index.html static head set (OG/Twitter/canonical/JSON-LD/CDN favicon — R8-04); per-route head contract `src/lib/seo.ts` + `HeadManager` (R8-05); served-artifact E2E gate (R8-06); VITE_SITE_URL documented; gate 95/95 unit + 182/182 E2E; see `docs/session_8.md` |

*End of skill. Maintain per the meta-skill: bump minor version on sprints,
major on stack upgrades; re-verify §2 versions, §11 counts, and §19 hexes
against the code before each release.*
