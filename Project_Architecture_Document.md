# HomeNest Kitchen — Master Project Architecture Document (PAD) v1.0

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Document:** `AGENTS.md` (agent rulebook + trap log), `CLAUDE.md` (workflow playbook), `README.md` (onboarding)
**Last Updated:** 2026-10-12
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

---

#### Revision Block — v1.0 (Tracked Changes)

- `[SYN]` Initial locked blueprint after the reference-parity remediation (session: audit → redesign → test harness → docs). All measurements taken live against `nest-culinary-hub.base44.app` on 2026-10-12 with an authenticated browser session; all computed-style pins taken from this repo's production build the same day.

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [Testing Strategy](#7-testing-strategy)
8. [Build & Deployment](#8-build--deployment)
9. [Developer Handbook](#9-developer-handbook)
10. [Known Issues & Outstanding Tasks](#10-known-issues--outstanding-tasks)
11. [Key Files Reference](#11-key-files-reference)
12. [Glossary](#12-glossary)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

This PAD is the single source of truth for the HomeNest Kitchen storefront. It describes the **current** system only; history lives in git. Read §3 first when changing code, §7 before touching tests, §5 before touching visuals. The document exists because the project's defining constraint — **computed-style parity with an external reference site** — is invisible from filenames alone.

### 1.2 Technology Stack Summary

| Layer | Technology | Version (lockfile) | Key Rationale |
|---|---|---|---|
| Build tool | Vite | 7.3.7 | Instant HMR for a component-heavy SPA; `appType: "spa"` preview fallback serves deep links in E2E without extra config |
| UI runtime | React | 19.2.6 | Context + hooks are sufficient; the app is one store, not a state-management showcase |
| Language | TypeScript | 5.9.3 (strict) | `noUnusedLocals`/`noUnusedParameters` double as the lint gate; no `any` at boundaries |
| Styling | Tailwind CSS | 4.1.17 | CSS-first `@theme` tokens; v4 was required to mirror the reference, which is itself a v4 app (oklch conversions and all) |
| Icons | lucide-react | 1.55.0 | Matches the reference's icon set visually (House, ShoppingBag, Banknote, …) |
| Class utilities | clsx + tailwind-merge | 2.1.1 / 3.4.0 | Conditional classes without style objects |
| Unit tests | Vitest | 4.1.11 | Node env, zero DOM cost, co-located seam tests |
| E2E tests | @playwright/test | 1.64.0 | Computed-style assertions (`toHaveCSS`), multi-project (desktop + mobile profiles) |
| Output | vite-plugin-singlefile | 2.3.3 | Single `dist/index.html` — the deployment unit is one static file |
| Fonts | Playfair Display + Inter (Google Fonts) | — | The reference's display serif and body sans, both measured live (session-34: the reference self-hosts Inter 300–700; the clone loads it via Google Fonts with a system-stack fallback — registered loading-mechanism divergence, identical rendered fonts) |

### 1.3 Architecture Decision Records

**ADR-001: Client-only SPA with localStorage persistence (no backend).**

- **Context:** The reference is a hosted Base44 app; the clone must run anywhere a static file can be served, with no database credentials in the demo.
- **Decision:** All commerce state (users, sessions, cart, wishlist, orders, product overrides, carousel, promo, newsletter) lives in a versioned `localStorage` key (`homenest.v2`) managed by a single React context (`src/lib/store.tsx`). No server, no API routes.
- **Rationale:** Faithful flows (stock decrements, order timelines, role gates) without infrastructure; deterministic E2E tests (fresh context = fresh store); deployment is one HTML file.
- **Consequences:** ➖ No cross-device or multi-user data; ➖ passwords are demo-grade (§6.4); ➕ zero-ops, tamper-safe demo, trivially portable.
- **Alternatives rejected:** Prisma/SQLite backend (the reference-repo pattern) — rejected for this scope: it breaks the single-file deployment story and adds ops without changing what the demo teaches. The `DATABASE_URL` contract is nonetheless preserved and contract-tested so a future server workstream can adopt the repo layout unchanged.

**ADR-002: Schema-relative DATABASE_URL contract (`file:../db/custom.db` → repo-root `db/`).**

- **Context:** The repo pins `DATABASE_URL="file:../db/custom.db"`; the `db/` folder must sit at the repo root; a future Prisma schema would live in `prisma/`.
- **Decision:** `src/lib/db-path.ts` resolves `file:` URLs the way the Prisma CLI does — relative to a `prisma/` schema anchor, with normalization — and exposes `dbPathFromRepoRoot()` (`db/custom.db`). Pinned by `tests/db-path.test.ts` (8 tests).
- **Rationale:** One URL resolves to one physical file from any working directory; the contract is executable documentation instead of a comment.
- **Consequences:** ➕ Tooling can compute the real DB location; ➖ the resolution rules are load-bearing ("do not simplify"). Session 26 (R26-03) added `npm run db:setup` — the contract now also has a real referent: a materialized SQLite file (schema + catalog + demo-user digests) at the resolved path, zero dependencies (`node:sqlite`), still tooling-only (the SPA never reads it).
- **Alternatives rejected:** Naive string stripping (the v1 implementation) — it documented the URL without honoring its semantics.

**ADR-003: Custom history-API router with centralized `matchPath`.**

- **Context:** The app needs deep-linkable routes from a single static file, including the reference's `/product/:id` URL shape.
- **Decision:** `src/lib/router.tsx` provides `RouterProvider` (popstate-synced), `navigate(to, { replace })`, a `Link` component (modifier-key aware, default-prevented), and one `matchPath()` function covering 27 routes. `vite preview`'s SPA fallback serves deep links in E2E.
- **Rationale:** react-router's weight is unnecessary for 27 literal patterns; centralizing matching keeps route structure a testable parity surface (the reference URL shape `/product/:id` is asserted in E2E).
- **Consequences:** ➕ Tiny, auditable, parity-controlled; ➖ new routes require three coordinated edits (`matchPath`, `App.tsx` switch, guards).
- **Alternatives rejected:** react-router — extra dependency for no behavioral gain at this route count.

**ADR-004: One StoreProvider; gate on `ready` before auth redirects.**

- **Context:** Persisted state rehydrates from localStorage in a mount effect; guards that navigate on first render would fire before hydration (observed: hard-refresh of `/admin` kicked logged-in users to `/login`).
- **Decision:** A single `StoreContext` exposes state + mutation callbacks plus a `ready` flag. `AdminFrame` and `AccountPage` wait for `ready` before rendering or redirecting.
- **Rationale:** One source of truth; the ready-gate makes the hydration race structurally impossible rather than timing-dependent (regression-pinned by E2E).
- **Consequences:** ➕ Refresh-safe sessions; ➖ components must consume `ready` (documented in AGENTS.md).
- **Alternatives rejected:** Sync localStorage read during `useState` initializer — breaks SSR shape and re-introduces first-render cost for every visitor.

**ADR-005: Tailwind v4 CSS-first with a measured token set and computed-style parity gate.**

- **Context:** The reference renders v4 output; its palette is shadcn-style HSL triplets (`--primary: 24 70% 50%`, etc.).
- **Decision:** All tokens live in `src/index.css` `@theme` as full `hsl()` literals (plus `#fbbf24` for the star amber — hex avoids hsl rounding drift); no `tailwind.config.js`. `tests/e2e/visual-parity.spec.ts` pins computed colors (`rgb(217,110,38)` primary, `rgb(251,250,249)` canvas, `rgb(29,24,22)` footer (session-30 re-measurement — the reference flipped its footer to `bg-foreground`; was `rgb(32,27,24)` sessions 3/4–27), `rgb(220,40,40)` discount, `rgb(251,191,36)` star amber (session-38 — the "Featured" pill is `bg-primary`), Playfair Display 700 headings).
- **Rationale:** v4's oklch conversions make eyeballed ports drift; computed styles (not screenshots) are assertable and deterministic.
- **Consequences:** ➕ Parity is a build-breaker, not an opinion; ➖ token changes require re-measuring specs in the same commit.
- **Alternatives rejected:** Screenshot diffing — nondeterministic across environments, and silently tolerates structural drift.

**ADR-006: Mobile menu portaled to `<body>` (the backdrop-filter containing-block rule).**

- **Context:** The v1 mobile drawer rendered inside the sticky header, which uses `backdrop-blur-sm`. Per CSS spec, `backdrop-filter` makes an element the containing block for `position: fixed` descendants — the drawer was confined to the 64–72px header box and appeared broken.
- **Decision:** The mobile menu (overlay + panel) is rendered via `createPortal(…, document.body)` as a fixed dropdown panel below the header; scroll locks and Escape handling stay in the `Header`.
- **Rationale:** Removes the trap structurally instead of sacrificing the header's blur; matches the reference's inline-dropdown menu behavior.
- **Consequences:** ➕ Robust menu at any header style; ➖ the menu must not rely on header-context CSS (documented as AGENTS.md trap #5).
- **Alternatives rejected:** Removing `backdrop-blur` from the header — visual drift from the reference.

**ADR-007: Two-layer test architecture (Vitest seams / Playwright production build).**

- **Context:** Fast feedback on pure logic vs. high-confidence parity on real bundles are different needs.
- **Decision:** Vitest (node env) owns `*.test.ts` co-located on pure seams (commerce math, db-path) — 22 tests. Playwright owns `tests/e2e/*.spec.ts` (41 specs × 2 projects = 82 runs) against `vite preview` of the production build, one worker, sequential file order.
- **Rationale:** The singlefile production bundle behaves differently from dev (inlined CSS); testing only dev would leave a verification gap. One worker keeps cart-adjacent specs deterministic without shared-state gymnastics (each test gets a fresh context anyway).
- **Consequences:** ➕ Deterministic, honest verification; ➖ `npm run e2e` requires `npm run build` first (encoded in docs, not in the script — the gate order is documented).
- **Alternatives rejected:** Component-testing DOM mocks — they assert mocks, not the shipped artifact.

---

## 2. High-Level System Topology

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Browser (any static host)                                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ dist/index.html  (~502 KB, single file, no runtime requests)   │  │
│  │  ├─ inlined JS bundle (React 19 + app + lucide icons)          │  │
│  │  ├─ inlined CSS (Tailwind v4 @theme output)                    │  │
│  │  └─ /images/* fetched from the same origin (public assets)     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│            │                                                        │
│            ▼                                                        │
│  ┌──────────────────────────┐     ┌───────────────────────────────┐ │
│  │ React tree               │     │ localStorage "homenest.v2"    │ │
│  │  RouterProvider          │◄───►│  users / sessionUserId        │ │
│  │  StoreProvider (1 ctx)   │     │  cart / wishlist / orders     │ │
│  │  PageShell (chrome)      │     │  products / carousel / promo  │ │
│  │  Routes (27)             │     │  newsletter                   │ │
│  └──────────────────────────┘     └───────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
             │                                        ▲
             ▼ (repo contract only, no runtime I/O)   │ git-ignored
   DATABASE_URL="file:../db/custom.db"  →  <repoRoot>/db/custom.db
```

- **Client layer:** one SPA, two audiences (storefront + admin console behind a role gate).
- **Edge/CDN:** any static host; the deployment artifact is one HTML file plus `/images/*`.
- **Application layer:** in-browser; the "backend" is the store's mutation callbacks.
- **Data layer:** `localStorage` at runtime; repo-root `db/custom.db` is a pinned contract path with no runtime reader.
- **External services:** Google Fonts (Playfair Display) at page load; graceful fallback to Georgia if blocked.

---

## 3. Application Architecture

### 3.1 The Layer Model (Golden Rule)

```
Layer 3  pages/       route surfaces. Own per-page state only; may call store
                      callbacks and lib helpers. Never import from components/
                      except shared chrome primitives.
Layer 2  components/  chrome.tsx (header/footer/drawers/forms) + product.tsx
                      (card primitives). Pure presentation + store callbacks.
Layer 1  lib/         router.tsx, store.tsx, commerce.ts, db-path.ts.
                      Framework-aware core: no imports from pages/ or components/.
Layer 0  data/        catalog.ts + types.ts. Pure data + typed lookups. No React.

Golden Rule: dependencies point downward only. lib/ never imports React-DOM
components; data/ imports nothing but types.
```

### 3.2 Annotated Directory Structure

```
homenest-store-g/
├── index.html                    ← entry; Playfair Display link; #root; viewport-fit=cover
├── vite.config.ts                ← react() + tailwindcss() + viteSingleFile(); @ alias;
│   │                               optimizeDeps.entries excludes the vendored skills/ tree
├── vitest.config.ts              ← node env; src/**/*.test.ts + tests/**/*.test.ts
├── playwright.config.ts          ← preview server :4173; chromium + mobile projects; 1 worker
├── tsconfig.json                 ← strict; noUnusedLocals/Parameters; @/* → src/*
├── .env                          ← DATABASE_URL="file:../db/custom.db" (git-ignored)
├── db/
│   └── catalog.json              ← brand config (name, promo code) — seed metadata
├── public/images/                ← product/hero imagery (absolute /images/... paths)
├── src/
│   ├── App.tsx                   ← RouterProvider → StoreProvider → PageShell → Routes (27)
│   ├── main.tsx                  ← createRoot render
│   ├── types.ts                  ← CategoryId (8), Product, CartLine, Address, User,
│   │                               Order(OrderStatus ×7), CarouselSlide, ToastMessage
│   ├── index.css                 ← @theme tokens (colors/shadows/radii) + base + a11y
│   ├── components/
│   │   ├── chrome.tsx            ← Header (+ portaled mobile menu), CartDrawer, Toaster,
│   │   │                           ChatButton, Footer, FeatureBar, PageShell, Field,
│   │   │                           inputClass, PrimaryButton, OutlineButton
│   │   └── product.tsx           ← Stars, ProductCard (badges + quick-add), ProductGrid
│   ├── data/catalog.ts           ← BRAND, CATEGORIES (8), PRODUCTS (24), CAROUSEL (3),
│   │                               DEMO_USERS (customer + admin), nav/footer link sets,
│   │                               productBySlug/productById/relatedProducts
│   ├── lib/
│   │   ├── router.tsx            ← RouterProvider/useRouter/useQuery/Link/matchPath
│   │   ├── store.tsx             ← StoreProvider: state, persistence (homenest.v2),
│   │   │                           cart/wishlist/auth/orders/promo/toast mutations
│   │   ├── commerce.ts           ← money + shipping + promo + tax + validation +
│   │   │                           card formatting + tracking URLs + delivery windows
│   │   ├── commerce.test.ts      ← 14 unit tests on the seams above
│   │   └── db-path.ts            ← schema-relative DATABASE_URL resolution (ADR-002)
│   └── pages/
│       ├── home.tsx              ← hero carousel, FeatureBar, categories, featured/new, CTA
│       ├── shop.tsx              ← ProductsPage (URL-driven filters), ProductPage, 404
│       ├── checkout-flow.tsx     ← CartPage, CheckoutPage (COD + card), OrderSuccessPage
│       ├── account-pages.tsx     ← AuthCard, AccountPage (4 tabs), AccountOrderPage,
│       │                           TrackOrderPage + OrderProgress stepper
│       ├── content-pages.tsx     ← About, Contact, 5 legal pages
│       └── admin-pages.tsx       ← AdminFrame role gate + 7 console surfaces
└── tests/
    ├── db-path.test.ts           ← DB URL contract (8 tests)
    └── e2e/
        ├── smoke.spec.ts         ← 5 chrome/route invariants
        ├── mobile-navigation.spec.ts ← 8 menu behaviors (the parity-critical surface)
        ├── catalog.spec.ts       ← 6 search/filter/sort/stepper behaviors
        ├── cart-checkout.spec.ts ← 9 COD flow behaviors incl. token gate + tracking
        ├── auth-admin.spec.ts    ← 7 auth/redirect/role-gate behaviors
        └── visual-parity.spec.ts ← 6 computed-style build-breakers
```

### 3.3 Critical Code Patterns

**Pattern 1 — Ready-gated role guard** (`src/pages/admin-pages.tsx`):

```tsx
function AdminFrame({ title, children }: { title: string; children: ReactNode }) {
  const { user, ready } = useStore();
  const { path, navigate } = useRouter();

  useEffect(() => {
    // Gate on `ready`: on a hard refresh the persisted session hydrates after
    // mount — navigating before that kicks logged-in admins out to /login.
    if (ready && !user) navigate(`/login?redirect=${encodeURIComponent(path)}`);
  }, [navigate, path, ready, user]);

  if (!ready || !user) return null;
  if (user.role !== "admin") {
    return <div>…Staff only…</div>;
  }
  return (/* admin console chrome */);
}
```

*Why:* the store hydrates asynchronously by design (ADR-004); guards must observe `ready` or they act on the seed's `sessionUserId: null`. Found as a real bug by E2E; the specs pin it.

**Pattern 2 — Portaled mobile menu** (`src/components/chrome.tsx`):

```tsx
{typeof document !== "undefined" &&
  createPortal(
    menuOpen ? (
      <div className="fixed inset-x-0 top-16 z-[350] md:hidden" id="mobile-nav-holder">
        <button className="fixed inset-0 top-16 -z-10 … bg-white/70 …"
                aria-label="Close menu overlay" onClick={() => setMenuOpen(false)} />
        <nav id="mobile-nav" aria-label="Mobile" className="… bg-card …">
          {/* search form + link rows; active row = bg-primary pill */}
        </nav>
      </div>
    ) : null,
    document.body,
  )}
```

*Why:* the sticky header's `backdrop-blur-sm` creates a containing block for fixed descendants (Tailwind v4 trap #5); portaling escapes it. The dropdown-panel shape, green close disc, and orange active pill are parity-pinned by `tests/e2e/mobile-navigation.spec.ts`.

**Pattern 3 — Delta-based, stock-clamped cart mutation** (`src/lib/store.tsx` + `src/lib/commerce.ts`):

```ts
export function mergeCartLine(lines: CartLine[], productId: string, delta: number, stock: number): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) {
    const quantity = clampQuantity(delta, stock);       // clamps to [0, stock]
    if (quantity <= 0) return lines;
    return [...lines, { productId, quantity }];
  }
  const quantity = clampQuantity(existing.quantity + delta, stock);
  if (quantity <= 0) return lines.filter((line) => line.productId !== productId);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}
```

*Why:* steppers submit deltas against the current line, and the clamp is applied inside the reducer — rapid clicks and out-of-stock adds cannot corrupt state. Unit-pinned in `commerce.test.ts`.

**Pattern 4 — Token-gated order success** (`src/pages/checkout-flow.tsx`):

```ts
const order = orders.find(
  (item) => item.number === number && (item.guestToken === token || item.userId === user?.id),
);
```

*Why:* guest confirmation links carry a capability token (`?order=&token=`); unknown pairs render a calm "We cannot show that order" instead of confirming existence. Owners reach the same order through `userId` without the token.

**Pattern 5 — URL-driven catalog filters** (`src/pages/shop.tsx`):

```ts
const setParams = (nextCategory: string, nextSearch: string) => {
  const params = new URLSearchParams();
  if (nextCategory && nextCategory !== "all") params.set("category", nextCategory);
  if (nextSearch.trim()) params.set("search", nextSearch.trim());
  const qs = params.toString();
  navigate(qs ? `/products?${qs}` : "/products", { replace: true });
};
```

*Why:* the URL is the single source of truth for search/category (live as-you-type via `replace: true`), so deep links, the header-search handoff (`/products?search=`), and back-button behavior all work identically.

---

## 4. Data Architecture

### 4.1 Runtime Store (localStorage `homenest.v4`)

| Field | Type | Notes |
|---|---|---|
| `users` | `User[]` | Seeded with demo customer + admin; registrations append. Passwords are salted WebCrypto digests (§6.2) — never plaintext at rest. |
| `sessionUserId` | `string \| null` | Session pointer; `logout()` nulls it explicitly. |
| `cart` | `CartLine[]` | `{ productId, quantity }`; quantities clamped to live stock on every mutation. |
| `wishlist` | `string[]` | Product ids. |
| `orders` | `Order[]` | Newest-first; snapshots everything needed for history rendering. |
| `products` | `Product[]` | Seed catalog + admin overrides (stock, visibility). |
| `carousel` | `CarouselSlide[]` | Admin-editable hero slides. |
| `promoCode` | `string \| null` | Applied code (NEST10). |
| `newsletter` | `string[]` | Subscribed emails. |

`STORAGE_KEY` is **versioned** (`homenest.v4`, session 5 — the seed now ships hashed demo credentials): bump it whenever the persisted shape or the seed catalog changes, otherwise stale client data shadows the new seed (observed during the redesign). The pairing is enforced by `tests/catalog-hash.test.ts` + `tests/catalog-registry.json`.

### 4.2 Domain Types (summary)

- `Product`: id, slug, category (8-value union), `priceCents`, `compareAtCents | null`, rating, reviewCount, stock, visibility/featured/isNew flags, image, gallery, badge, materials, features (rendered as PDP tag pills), description, shippingNote.
- `Order`: id, `ORD-YYYY-NNN` number, `userId | null`, email, placedAt, status (7-value union), item snapshots (`OrderItem` with name/image/unitCents), subtotal/discount/shipping/total cents, promoCode, shippingAddress snapshot, `paymentLast4` (`"COD"` for cash), carrier + trackingNumber, timeline events, guestToken.
- Money: integer cents end-to-end; `formatMoney` renders `$X.YZ` at display only.

### 4.3 Derived Commerce Math (single seam, unit-pinned)

`cartTotals(lines, products, code)` → subtotal → promo (NEST10: 10% off a ≥ $40 merchandise subtotal) → shipping (free ≥ $50, flat $9.99 under, $0 empty) → tax (0 bps — the reference shows no tax line) → total. Reference-measured thresholds live as exported constants; changing them is a parity decision, not a refactor.

### 4.4 Persistence Strategy

Writes are whole-state `JSON.stringify` after each mutation (debounce unnecessary at this size); reads tolerate missing keys, unknown shapes (`Partial<PersistedState>`), and JSON errors by falling back to seed. There is no migration path by design — the versioned key replaces it.

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Face | Weights | Notes |
|---|---|---|---|
| Display | Playfair Display | 700 (800 for hero numerals) | Product names, page titles, footer column titles; loaded via Google Fonts with Georgia fallback |
| Body | Inter | 400–700 (300 loaded) | Session-34 parity: the reference's measured body face; Google Fonts with system-stack fallback |
| Mono | System mono | 400 | Order numbers in legacy surfaces only |

Scale: page titles `text-4xl/5xl`, card titles `text-lg`, labels `text-sm`, category eyebrows `text-[11px] uppercase tracking-[0.14em] text-primary`.

### 5.2 Color Tokens (measured 2026-10-12)

| Token | CSS value | Computed (build) | Usage | WCAG note |
|---|---|---|---|---|
| `background` | `hsl(30 25% 98%)` | `rgb(251,250,249)` | Page canvas | — |
| `foreground` | `hsl(20 15% 10%)` | `rgb(26,23,21)` | Primary text | 15.9:1 on background |
| `primary` | `hsl(24 70% 50%)` | `rgb(217,110,38)` | CTAs, active nav pill, cart badge, quick-add hover | white text on primary ≈ 3.2:1 (large/bold + icon-paired) |
| `primary-dark` | `hsl(24 70% 43%)` | — | Hover state | — |
| `muted` | `hsl(30 15% 94%)` | — | Search fields, placeholders surfaces | — |
| `muted-foreground` | `hsl(20 10% 45%)` | — | Secondary text | ≈ 7:1 on background |
| `accent` | `hsl(160 40% 45%)` | `rgb(69,161,130)` | In-stock, Free shipping, trigger HOVER disc (session-36: the resting trigger is a bare icon; the accent-green disc is its `:hover` treatment) | white text used only on accent badges (decorative) |
| `destructive` | `hsl(0 72% 51%)` | `rgb(220,40,40)` | Discount pills, form errors | white text 4.6:1 |
| `badge` | `#fbbf24` | `rgb(251,191,36)` | Star ratings (session-38: amber-400; the "Featured" pill moved to `primary`) | amber stars are decorative icons |
| `border` | `hsl(30 15% 88%)` | — | Card/field borders | — |
| `card` | `hsl(0 0% 100%)` | `rgb(255,255,255)` | Card surfaces | — |
| `panel` | `hsl(0 0% 100% / 0.8)` | `rgba(255,255,255,0.8)` | Sticky-HEADER glass since session-36 (with `backdrop-blur-xl` 24px); the mobile-menu panel body is solid `bg-card` — the session-4 white/80 reading had measured the reference's header row (alpha baked into the token — v4 `/NN` modifiers color-mix in oklab; trap T-13) | — |
| `border-soft` | `hsl(30 15% 88% / 0.5)` | `rgba(229,224,220,0.5)` | Header + menu-panel 0.5-alpha hairlines (session-36; alpha baked) | — |
| `hero-body` | `hsl(0 0% 100% / 0.8)` | `rgba(255,255,255,0.8)` | Hero paragraph (session-36; the reference's `text-white/80`) | — |
| `dot-idle` | `hsl(0 0% 100% / 0.4)` | `rgba(255,255,255,0.4)` | Idle hero-carousel dots (session-36) | — |
| `frost` | `hsl(0 0% 100% / 0.1)` | `rgba(255,255,255,0.1)` | Hero-carousel arrow glass (session-36; with `backdrop-blur-md` 12px) | — |
| `footer` | — | `rgb(29,24,22)` | Footer canvas (session-30: = foreground) | text-background full color, modulated by element opacity (70% links/body, 50% bottom bar — session-34) |
| `footer-rule` | `hsl(30 25% 98% / 0.1)` | `rgba(251,250,249,0.1)` | Footer divider (session-34; alpha baked — v4 `/10` would color-mix in oklab) | — |
| `quick-add` | `hsl(0 0% 100% / 0.9)` | `rgba(255,255,255,0.9)` | Hover-revealed card quick-add pill (session-38; the reference's `bg-card/90`, alpha baked) | — |
| `secondary` | `hsl(33 31% 93%)` | `rgb(243,238,232)` | CTA cream button (session-38 re-measurement) | — |
| `secondary-hover` | `hsl(33 31% 93% / 0.8)` | `rgba(243,238,232,0.8)` | CTA button hover (session-38; alpha baked) | — |
| `primary-film` | `hsl(24 70% 50% / 0.1)` | `rgba(217,110,38,0.1)` | FeatureBar icon disc (session-38; the reference's `bg-primary/10`, alpha baked) | — |
| `gallery` | `hsl(30 15% 94% / 0.3)` | `rgba(242,240,237,0.3)` | PDP gallery tile bg (session-39; the reference's `bg-muted/30`, alpha baked — trap T-13). Session-40: the tile also carries the `border-border-soft` hairline (measured 1px `border-border/50` on all 8 reference PDPs — the s39 no-border reading is superseded) | — |
| `accent-soft` | `hsl(160 40% 95%)` | — | Success icon wash | — |

### 5.3 Component Primitives

No headless-UI library: primitives are hand-rolled and parity-pinned — `PrimaryButton`/`OutlineButton` (h-12 rounded-full pills), `Field`+`inputClass` (h-12 rounded-lg, danger border on error), `Stars` (session-38: five amber-400 stars + `(count)` — the reference renders no partial fills; the true rating stays in the aria-label), `ProductCard` (session-38: 16px radius / border-soft / shadow-sm→xl+lift chrome; red −% + primary-orange Featured semibold pills; hover-REVEALED 36px quick-add with the shopping-cart glyph; 12px/500 category eyebrow; 16px/600 Playfair line-clamp-2 name; all-amber stars; in-flow price row), `OrderProgress` (vertical 5-step stepper with connector line and `(Current)` marker), `CodNotice` (amber info box), toasts (white card, bottom-right, 3.2s).

### 5.4 Motion

Hero cross-fade (700ms opacity), carousel auto-advance (7s, cleared when <2 slides), card hover scale (`motion-safe:` prefixed), color transitions 200–300ms. Global `prefers-reduced-motion` kill-switch in `index.css`.

### 5.5 Z-Index Scale

`--z-sticky: 300` (header) · `--z-dropdown: 350` (mobile menu panel) · `--z-overlay: 400` · `--z-modal: 500` (cart drawer) · `--z-toast: 800`. Literal z-arbitrary values in components mirror these (`z-[300]`, `z-[350]`, `z-[500]`, `z-[800]`).

### 5.6 Registered Divergences From the Reference (do not "fix")

These supersets are intentional; they must not change the **resting visuals** of parity surfaces:

1. 24-product catalog (reference shows 8) with 16 additional products; the 8 reference products keep exact names, cents prices, ratings, and review counts.
2. Collapsed "Have a promo code?" entry in the cart summary (NEST10 — 10% off $40+).
3. Second payment option ("Credit / Debit Card") beneath the COD radio; COD remains default-selected.
4. Wishlist (saved products tab in the account page; store-backed).
5. Full admin console at `/admin/*` (role-gated) — the reference exposes none.
6. Estimated delivery window (`deliveryWindow`) on success/tracking surfaces.
7. Chat FAB bottom-right navigates to `/contact` (the reference's FAB opens a platform widget).
8. Demo login/register pages with email+password (the reference delegates to the Base44 platform auth screen).
9. Order numbers are `ORD-YYYY-NNN` sequential (the reference generates `ORD-XXXXXXXX` random) — sequential numbers are friendlier for support flows.
10. "Sign in" row in the mobile menu (the reference's menu lists the five nav links only) — the demo auth entry point; the reference delegates auth to its platform screen.
11. The mobile menu panel does NOT dim the page beneath it (session-3 re-measurement of the live reference; the session-1 measurement read a dim that is no longer present). Scroll-lock and the focus trap remain.
12. Color-contrast pairs on parity surfaces (white-on-orange CTAs, white-on-amber "Featured" pills, orange category labels, muted grays) match the reference tokens and fail WCAG AA contrast — documented exclusion from the axe gate (remediation plan §9.2 R3-04).
13. The mobile menu's search control is a compact muted pill at rest (session-36 re-measurement: the reference's pill is 40×28, `flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted`, with a `hidden sm:inline` label — icon-only at mobile widths) that expands into a working search input on tap — the reference's pill is functionally inert (and unclickable: the reference's own toast viewport covers it). Resting visuals match; function exceeds (registered superset). The pill keeps an `aria-label` so its accessible name survives the hidden label span (a11y superset).
14. **SEO posture superset (session 8, extended session 18).** The reference's robots.txt disallows nothing and its sitemap.xml lists `/admin/*`, `/account`, `/cart` with zero product URLs; the clone disallows private surfaces and lists every visible product as `/products/{slug}`. The reference ships no web app manifest (re-measured 2026-10-13: no `<link rel="manifest">` in its head; `/manifest.webmanifest` and `/site.webmanifest` are answered by the SPA catch-all with `text/html`). The clone ships a valid minimal manifest (`public/manifest.webmanifest`, R18-01): name/short_name, root-relative `start_url`/`scope`, `standalone` display, theme/background `#fbfaf9`, and the two install-required 192px/512px icons reusing the FAVICON-1 CDN logo; a `transformIndexHtml` post-hook in `vite.config.ts` restores the root-absolute href that viteSingleFile's `base: "./"` would otherwise relativize into a deep-route 404.
15. **Per-route head superset (session 8).** The reference ships a static-title map for 23 paths (PDPs keep the static title, admin titles leak an `admin/` namespace artifact); the clone pins the same map (incl. the "Order Tracking" / "Terms Of Service" quirks) and extends it: PDP → "{Product} | HomeNest Kitchen", humanized unknown slugs, auth/not-found titles, admin titles cleaned. Canonical links + per-route og:url and per-PDP Product JSON-LD are additive (the reference has none).
16. **Footer contact links + font loading mechanism (session 34).** The reference's footer contact rows are plain text with icons; the clone keeps `mailto:`/`tel:` anchors styled to identical resting visuals (function exceeds — the standing superset pattern). The reference self-hosts its fonts as bundled woff2; the clone loads Playfair Display and Inter via Google Fonts (`display=swap`) with the system stack as offline fallback — identical rendered typefaces, different delivery.
17. **Category filter URL shape (session 38).** The reference's category deep links use underscore ids (`/products?category=kitchen_tools`); the clone's seed uses hyphens (`/products?category=kitchen-tools`). Purely a query-string shape difference — identical filtering behavior, identical rendered labels ("Kitchen Tools"), zero resting-visual impact. Left as-is deliberately: changing ids would churn the catalog seed, `STORAGE_KEY` and the hash registry for a URL nuance.
18. **Quick-add keyboard reveal + CTA-as-link (session 38).** The reference's card quick-add is `opacity-0` until group-hover AND stays invisible under keyboard focus; the clone adds `focus-within:opacity-100` so Tab focus reveals the button (a11y superset, resting visuals identical). The reference's CTA "Browse All Products" renders as a `<button>`; the clone ships a real link to `/products` styled to the measured cream-pill spec (function exceeds, resting visuals identical). The section-header carousel arrows keep accessible names (the reference ships nameless buttons — its own a11y posture, not copied).
19. **PDP shipping/returns rows removed, not registered (session 39, remediation §28 D1).** The v1 port had added "Free shipping over $50" / "30-day returns" / per-product shippingNote rows to the PDP info column — the reference's column ends at the action row. A resting-visual addition on a measured parity surface cannot become a "resting-identical superset", so the rows were REMOVED (the shipping disclosure already lives on the cart/checkout/tracking surfaces; registered divergence #6 `deliveryWindow` covers the estimated-delivery function). `Product.shippingNote` stays in the type + catalog seed (data, no render seam) for the server-backed workstream — do not re-render it on the PDP.
20. **Account/order-row functional supersets (session 41, remediation §30 D2; session 42 update).** The reference's account rows are `<button>` elements that EXPAND IN PLACE (an accordion body: items, shipping/total line, address, a Track Order link); the clone renders the whole `p-5` row as a real link to the `/account/orders/:id` detail page (superset navigation — the same function-exceeds pattern as #16/#18; the detail page shows the accordion's full content plus the status timeline and tracking). Resting visuals are reference parity since session 42: a `space-y-3` list of ONE CARD PER ORDER (the s41 "ONE card" reading was a single-order-list artifact). The clone's account page also keeps the Log out control (R5-06 wrap-layout contract) and its tab row (profile/addresses/saved — #4/#5 family); the DEFAULT (orders) view renders the reference's measured profile card and per-order card list. The cart page keeps the collapsed promo-code entry (#2) and the checkout keeps the card option (#3) inside the reference's measured chrome.

21. **Order-success internals (session 42, remediation §31).** The v1 port's 80px green check disc above "Order Placed!" never existed on the reference — REMOVED, do not re-add (the s39 shipping-rows doctrine: a resting-visual invention on a measured surface cannot become a resting-identical superset). The success page's COD notice is the measured LARGE amber variant (`SuccessCodNotice` — 16px radius, p-5, 40px amber-100 disc), distinct from the cart's compact 12px variant (`CartCodNotice`); both are token-backed. `Order.phone?: string` is an optional additive field persisted by `placeOrder` and rendered as the reference's fourth Delivery Information row — old persisted orders hydrate without it (the catalog seed is untouched, so no STORAGE_KEY bump). The success CTAs are real links at the measured h-9 36px pill spec (the retired shared 48px buttons survive on admin/auth/account surfaces).

22. **Cart drawer superset (session 43, remediation §32).** The reference's header cart control is a plain anchor that **navigates to `/cart`** — it has no drawer (verified live at both viewports: zero dialogs/asides; the s41/s42 transcripts' "cart drawer" phrasing described the cart-icon → /cart-page flow). The clone's cart icon instead opens a modal side drawer (session-4 R4-01's a11y fix: aria-modal, focus trap, focus restore, Escape — pinned by `tests/e2e/cart-drawer.spec.ts`). Function exceeds (quick cart access + one-tap checkout without leaving the page); per the "supersets keep the measured row spec" doctrine the drawer's internals speak the s41-measured cart design language (16px hairline cards with square 80×80 images, muted-pill 24px-button steppers, inline 16px trash-2, "Order Summary" footer with the h-10 pill CTA) on a cream `bg-background` panel, and a "View full cart" control reaches the parity `/cart` page. The drawer's own chrome (right-side panel, max-w-md, `bg-foreground/40` dim overlay, drawer shadow) is superset chrome like the admin surfaces; its compact footer renders Subtotal + Total only — the full OS (shipping, COD, promo) lives on `/cart`.

---

## 6. Security Architecture

### 6.1 Security Rules & Enforcement

| Rule | Enforcement |
|---|---|
| Validate all external input at the boundary | `lib/commerce.ts` validators (`isEmail`, `isZip`, `isCardNumberValid`, `isExpiryValid`) called before mutations; native `required`/`minLength` on forms |
| No open redirects | `validateRedirectPath` rejects non-`/` paths, `//…`, and `://…`; pinned in unit + E2E (`open-redirect attempts fall back to /account`) |
| Guest order views are capability-gated | `guestToken` + order number must both match; owners bypass via `userId`; E2E pins tamper rejection |
| Role checks at the surface, not the link | `AdminFrame` re-checks `user.role` on every admin route; customers receive a calm "Staff only" surface (E2E-pinned) |
| No `dangerouslySetInnerHTML` anywhere | Grep-verified; React escaping only |
| Stock integrity | Every cart write re-clamps against current stock (`clampQuantity`); placement rejects over-stock with per-line messaging |
| Money integrity | Totals always re-derived server-side-equivalent (`cartTotals`) — never trusted from component props or URL |

### 6.2 Authentication & Authorization

Email + password against the seeded/registered user list; session = `sessionUserId` pointer in the store (persisted). Two roles: `customer`, `admin`. Login honors a validated `redirect` param; register auto-signs-in; logout nulls the session pointer and returns to `/`.

**Password-at-rest (session 5, R5-01).** Records store `passwordHash: "s1$<salt>$<sha256(salt:password)>"` — a salted WebCrypto SHA-256 digest (see `src/lib/password.ts`; 16-byte CSPRNG salt per record). `login`/`register`/`changePassword` are async and verify through `verifyPassword`, which also accepts legacy plaintext records so pre-v4 clients keep working; such records are re-hashed **in place on the next successful login** (upgrade-on-login). The shipped demo seed is pre-hashed. SHA-256 is not a KDF — this is defense-in-depth against casual localStorage disclosure, not a replacement for the server-backed auth workstream (§6.3).

### 6.3 Threat Model & Accepted Residual Risks (honest, demo-scoped)

| Vector | Mitigation | Residual risk |
|---|---|---|
| Credential theft | Nothing leaves the browser; passwords stored as salted WebCrypto digests (session 5, R5-01) | **Reduced but accepted:** SHA-256 is fast (not a KDF), and a client-only store cannot rate-limit or revoke credentials — the server-backed workstream (ADR-001) remains the real fix. Demo seed salts are static by construction (the seed is static) |
| Guest token forgery | 128-bit CSPRNG token (`crypto.getRandomValues`, hex) | Low: session 3 replaced the former ~59-bit `Math.random` token (R3-02); forgeability now requires brute-forcing 2¹²⁸ |
| XSS | React escaping only | Low: no HTML injection surfaces exist |
| Payment fraud | No real payments | None: card fields never leave the page; COD is simulated |
| Supply chain | `npm audit fix` applied | **Accepted:** 3 high advisories remain in `braces`/`micromatch` via `vite-plugin-singlefile`'s build-time globbing — no runtime exposure, inputs are trusted repo files; downgrading the plugin would be a breaking change |

---

## 7. Testing Strategy

### 7.1 Test Distribution

| Category | Files | Tests | Location | Framework |
|---|---|---|---|---|
| Commerce seam units | 1 | 15 | `src/lib/commerce.test.ts` | Vitest (node) |
| DB URL contract | 1 | 8 | `tests/db-path.test.ts` | Vitest (node) |
| Catalog ↔ storage-key registry | 1 (+ registry JSON) | 2 | `tests/catalog-hash.test.ts` | Vitest (node) |
| Password-at-rest contract | 1 | 8 | `tests/password.test.ts` | Vitest (node) |
| Route-head seam (R8-05) | 1 | 29 | `tests/seo.test.ts` | Vitest (node) |
| Robots/sitemap artifacts (R8-01/02/03) | 1 | 33 | `tests/sitemap.test.ts` | Vitest (node) |
| db scripts contract (R26-03) | 1 | 9 | `tests/db-scripts.test.ts` | Vitest (node) |
| Smoke | 1 | 5 | `tests/e2e/smoke.spec.ts` | Playwright |
| Mobile navigation (incl. session-27 bare-icon trigger pins) | 1 | 15 | `tests/e2e/mobile-navigation.spec.ts` | Playwright |
| Mobile header parity (incl. session-26 account-icon pins) | 1 | 5 | `tests/e2e/mobile-header-parity.spec.ts` | Playwright |
| Cart drawer modal + measured-language pins (session 43) | 1 | 7 | `tests/e2e/cart-drawer.spec.ts` | Playwright |
| Catalog | 1 | 6 | `tests/e2e/catalog.spec.ts` | Playwright |
| Cart & checkout | 1 | 9 | `tests/e2e/cart-checkout.spec.ts` | Playwright |
| Auth & admin | 1 | 7 | `tests/e2e/auth-admin.spec.ts` | Playwright |
| Visual parity (computed-style pins, sessions 12–42) | 1 | 59 | `tests/e2e/visual-parity.spec.ts` | Playwright |
| A11y smoke (axe) | 1 | 8 | `tests/e2e/a11y-smoke.spec.ts` | Playwright |
| Search combobox keyboard (R5-02) | 1 | 8 | `tests/e2e/search-keyboard.spec.ts` | Playwright |
| Password at rest E2E (R5-01) | 1 | 4 | `tests/e2e/password-hash.spec.ts` | Playwright |
| Account header layout (R5-06) | 1 | 1 | `tests/e2e/account-layout.spec.ts` | Playwright |
| SEO head gate (R8-06) | 1 | 19 | `tests/e2e/seo-head.spec.ts` | Playwright |
| PWA manifest (R18-01) | 1 | 3 | `tests/e2e/pwa-manifest.spec.ts` | Playwright |
| **Total** | **14 E2E spec files + 7 unit files** | **104 unit tests + 156 E2E specs → 312 runs** (104 × 1 + 156 × 2 projects) | | |

### 7.2 Test Patterns

- **Behavior-named tests** describing user-visible outcomes; file-top comments record measured provenance (reference facts + dates).
- **Computed-style parity gate**: `toHaveCSS` assertions on the six parity pins; treated as build-breakers. Screenshots are evidence, never gates.
- **Fresh-context isolation**: every E2E test starts with empty localStorage; no cross-test state, no reset scripts needed.
- **Strict-mode discipline**: `{ exact: true }` wherever copy collides ("Total"/"Subtotal", "Confirmed"/"confirmed", "Close menu"/"Close menu overlay").
- **Regression-first**: the ready-gate hydration bug and the storage-versioning bug were both found by E2E and pinned by the fixes' specs.

### 7.3 Coverage Philosophy

No numeric coverage gates. The standard: **every pure seam has a dedicated unit file, and every user flow has a dedicated E2E spec.** The parity spec is a build-breaker.

### 7.4 Pre-Push Checklist

1. `npm run typecheck` — exit 0
2. `npm run test` — 104/104
3. `npm run build` — succeeds (~507 KB single file)
4. `npm run e2e` — 212/212 across chromium + mobile (106 specs; session-36)
5. Docs updated in the same commit when contracts/visuals changed
6. `AGENTS.md` trap log grown (not worked around) if a new trap was discovered
7. Catalog edits: `tests/catalog-hash.test.ts` green — `STORAGE_KEY` bumped and `tests/catalog-registry.json` updated in the same change
8. `src/data/catalog.ts` edits never reintroduce plaintext demo credentials — the seed ships `s1$…` digests (E2E `password-hash.spec.ts` fails the build otherwise)

---

## 8. Build & Deployment

### 8.1 Production Build

```bash
npm run build      # → dist/index.html (single file, ~502 KB / ~127 KB gzip)
```

`vite-plugin-singlefile` inlines all JS/CSS; `public/images/*` ships alongside as static assets. Serve `dist/` from any static host with SPA fallback (`vite preview` locally; Netlify/Vercel/gh-pages rewrites on a host). The full deployment procedure — static-host matrix, SEO origin sync, verification checklist, troubleshooting — lives in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### 8.2 Environment Variables

| Name | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | Yes | Schema-relative SQLite URL; resolves to repo-root `db/custom.db` via `src/lib/db-path.ts` (contract-tested) | `file:../db/custom.db` |
| `E2E_PORT` | No | Playwright preview port | `4173` |
| `E2E_BASE_URL` | No | Playwright base URL override | `http://127.0.0.1:4173` |
| `VITE_SITE_URL` | No | Absolute origin for the SEO layer (canonical/og:url fallbacks in `index.html`, `src/lib/seo.ts`, sitemap generation). Override + re-run `node scripts/generate-sitemap.mjs` when deploying elsewhere | `http://localhost:4173` |
| `CI` | No | Tightens Playwright (forbidOnly, 2 retries, no server reuse) | unset |

### 8.3 CI/CD

No pipeline is configured in this repo. The pre-push gate is the documented `npm run verify && npm run e2e`; wiring it into CI is a one-line workflow if desired.

---

## 9. Developer Handbook

### 9.1 Local Setup

```bash
git clone https://github.com/nordeim/homenest-store-g.git
cd homenest-store-g
npm install          # Node ≥ 20
npm run dev          # http://localhost:5173
```

`.env` ships in the repo with the pinned `DATABASE_URL` (git-ignored in principle; keep the committed value and `.env.example` in sync).

### 9.2 Common Commands

| Command | Location | Purpose |
|---|---|---|
| `npm run dev` | repo root | Dev server :5173 |
| `npm run build` | repo root | Single-file production build |
| `npm run preview` | repo root | Serve dist/ :4173 (SPA fallback) |
| `npm run typecheck` | repo root | Strict tsc gate |
| `npm run test` / `test:watch` | repo root | Vitest units |
| `npm run e2e` | repo root | Playwright (build first) |
| `npx playwright test <spec>` | repo root | One spec |
| `npx playwright show-trace <zip>` | repo root | Failure trace inspection |

### 9.3 Code Style Rules

Enforced by `tsc` (strict, no unused locals/params, no fallthrough). Conventions: named exports, kebab-case page files with PascalCase exports, `cn()` for conditional classes, integer cents for money, absolute `/images/...` asset paths.

### 9.4 Git Workflow

Single `main` branch; Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`); atomic commits; docs updated with the change they describe; never commit `.env`, `db/*.db`, `node_modules/`, `dist/`, `test-results/`, `playwright-report/`.

---

## 10. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|---|---|---|---|
| ~~HIGH (accepted)~~ | ~~Demo passwords stored plaintext in localStorage~~ | — | **Hardened (session 5, R5-01):** salted WebCrypto digests at rest, upgrade-on-login, hashed demo seed. Server-backed auth (ADR-001) remains open for real deployments — SHA-256 is not a KDF and a client-only store cannot rate-limit or revoke |
| ~~HIGH (accepted)~~ | ~~Guest tokens use `Math.random()` (~59 bits)~~ | — | **Fixed (session 3, R3-02):** `generateGuestToken()` = 128-bit `crypto.getRandomValues`, hex-encoded |
| MEDIUM (accepted) | 3 high npm advisories in braces/micromatch via vite-plugin-singlefile | Build-time only; no runtime exposure | Accepted, documented in README troubleshooting |
| ~~MEDIUM~~ | ~~No ESLint/Prettier config~~ | — | **Closed (session 16, R16-01):** ESLint 9 flat config (`eslint.config.js`) wired into `npm run verify` as the `lint` stage — js/ts recommended + react-hooks + react-refresh, non-type-aware (tsc stays the type floor); provider+hook co-location carved out only for `store.tsx`/`router.tsx`/`chrome.tsx`; `skills/` excluded. First full run: 0 findings |
| ~~LOW~~ | ~~`isExpiryValid` hardcodes `year >= 26`~~ | — | **Fixed (session 3, R3-01):** rolling window with injectable clock; unit-pinned |
| ~~LOW~~ | ~~Account header card overflows on phones with long identities~~ | — | **Fixed (session 5, R5-06):** wrapping header row + `min-w-0`/`break-words`; pinned by `tests/e2e/account-layout.spec.ts` |
| LOW | WebKit not installed in this sandbox | Mobile project pins chromium engine; no Safari coverage locally | Accepted — host libs need root; browser binary cached, launch blocked (re-attempted session 3) |
| LOW | Color-contrast pairs on parity surfaces (orange/amber/gray tokens) fail WCAG AA | axe `color-contrast` findings on parity-pinned tokens | Accepted — the reference itself fails these pairs; visual parity wins (remediation plan §9.2 R3-04); structural a11y is gated clean on 8 surfaces |
| LOW | Carousel kicker field is stored but not rendered | Reference hero shows no kicker; kept for admin-editing future | Registered divergence |
| ~~LOW~~ | ~~Desktop search combobox options are not announced with result counts~~ | — | **Closed (session 14, R14-01):** sr-only `role="status" aria-live="polite"` region inside the search form announces result counts / no-results politely on query change; pinned by `tests/e2e/search-keyboard.spec.ts` R14-01 specs and re-verified live each session |
| LOW | Static SEO fallbacks hardcode the default origin (`http://localhost:4173`) | Deploying elsewhere needs `VITE_SITE_URL` + `node scripts/generate-sitemap.mjs`; the committed artifacts are test-gated against the catalog | Accepted — documented in `.env.example` (session 8) |
| ~~MEDIUM~~ | ~~`package.json` ships no db scripts (standing mandate item)~~ | — | **Closed (session 26, R26-03):** `db:init` / `db:seed` / `db:setup` materialize the ADR-002 contract as a real SQLite `db/custom.db` via `scripts/db-setup.mjs` (node:sqlite, zero deps, idempotent, Prisma-free per ADR-001 — tooling parity only). Pinned by `tests/db-scripts.test.ts` (9 tests) |
| LOW | Reference visual state is not frozen | The reference site drifts (menu trigger disc: green → bare → green → bare across sessions 3→5→26→27 — an oscillating surface; account avatar disc → plain icon by session 26) | Accepted — the follow-the-latest-measurement doctrine + computed-style E2E pins re-verify every session; remediation plan §22.1 records the session-27 drift remediation |

---

## 11. Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `src/components/chrome.tsx` | ~978 | Header + portaled mobile menu, APG search combobox (keyboard plan), modal cart drawer (measured-language internals, session 43), toaster, chat FAB, footer, feature bar, form primitives |
| `src/lib/store.tsx` | ~525 | Single store: state, persistence, all mutations (async hashed auth incl. upgrade-on-login) |
| `src/pages/checkout-flow.tsx` | ~853 | Cart, checkout (COD + card), token-gated success |
| `src/pages/account-pages.tsx` | ~881 | Auth card (async auth), account tabs, order detail, track order + stepper |
| `src/data/catalog.ts` | ~700 | Seed catalog (24 products), categories, carousel, demo users (hashed credentials) |
| `src/pages/shop.tsx` | ~404 | Products list (URL-driven filters), PDP (session-39/40 measured parity), 404 |
| `src/pages/content-pages.tsx` | ~409 | About + Contact (session-39/40 measured parity) + 5 legal pages (session-40: reference template, verbatim policies, dynamic date) |
| `src/lib/commerce.ts` | ~235 | Money/shipping/promo/validation/tracking seams |
| `src/lib/seo.ts` | ~170 | Pure route-head seam (`buildRouteMeta`): reference title map, canonical/og:url, Product JSON-LD (R8-05) |
| `src/components/head-manager.tsx` | ~100 | Applies the route-head contract to document.title/meta/canonical/JSON-LD inside RouterProvider |
| `scripts/generate-sitemap.mjs` | ~120 | Writes `public/robots.txt` + `public/sitemap.xml` from the catalog (`prebuild` hook; catalog-gated by `tests/sitemap.test.ts`) |
| `src/lib/password.ts` | ~75 | Salted WebCrypto digest contract (`s1$…`), verify w/ legacy fallback |
| `src/pages/admin-pages.tsx` | ~360 | Role-gated admin console (7 surfaces) |
| `src/lib/router.tsx` | ~130 | History router + matchPath (27 routes) |
| `src/index.css` | ~104 | `@theme` tokens (+ `--color-panel`) + base styles |
| `src/lib/db-path.ts` | ~60 | DATABASE_URL resolution contract |
| `tests/e2e/mobile-navigation.spec.ts` | ~223 | The parity-critical menu behaviors (incl. session-27 bare-icon trigger pins) |
| `tests/e2e/cart-drawer.spec.ts` | ~191 | Cart drawer modal semantics (focus trap, restore) + the measured-language pins (session 43) |
| `tests/e2e/search-keyboard.spec.ts` | ~106 | APG combobox keyboard plan (arrows/Home/End/Enter/Escape) |
| `tests/e2e/password-hash.spec.ts` | ~121 | Password-at-rest E2E: hashed seed, register, round-trip, legacy upgrade |
| `tests/e2e/account-layout.spec.ts` | ~36 | Account header stays inside the viewport with long identities |
| `tests/seo.test.ts` | ~190 | Route-head seam pins: reference title map, canonical/og:url split, Product JSON-LD shape |
| `tests/sitemap.test.ts` | ~130 | Committed robots.txt/sitemap.xml ↔ catalog consistency gate |
| `tests/e2e/seo-head.spec.ts` | ~185 | Served SEO artifacts + per-route titles + PDP canonical/og/JSON-LD |
| `tests/e2e/visual-parity.spec.ts` | ~50 | Computed-style build-breakers |
| `tests/db-path.test.ts` | ~75 | DB URL contract tests |

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Reference** | `nest-culinary-hub.base44.app` — the site whose resting visuals and flows are cloned |
| **Parity surface** | Any page/behavior expected to match the reference visually or functionally |
| **Registered divergence** | A documented, intentional superset feature (PAD §5.6) that must not alter parity surfaces' resting visuals |
| **Parity pin** | A computed-style value asserted by `tests/e2e/visual-parity.spec.ts` |
| **Ready gate** | The `StoreProvider.ready` flag that auth guards observe before redirecting (hydration-race guard) |
| **Schema-relative URL** | A `file:` URL resolved against a `prisma/` anchor, mirroring Prisma CLI semantics |
| **COD** | Cash on Delivery — the default payment method; stored as `paymentLast4: "COD"` |
| **Trap log** | Append-only list of Tailwind v4 / DOM traps in `AGENTS.md`; grow it, never work around it |
| **Single-file build** | The `dist/index.html` artifact with JS/CSS inlined (`vite-plugin-singlefile`) |
