---
name: luxury-nail-portfolio
description: >-
  Engineering skill for the Aurelia Nail Artistry codebase — a Vite 7 + React 19 +
  TypeScript strict + Tailwind CSS 4 single-file SPA clone (functional superset) of
  aurelia-nail-artistry-demo.base44.app. Captures the verified reference-parity
  doctrine, the Tailwind v4 trap log, the zero-server persistence contracts, the
  test-gate architecture (95 unit + 214 e2e), anti-patterns, debugging procedures,
  and lessons learned. Use when extending, debugging, onboarding, or replicating
  this codebase.
version: 1.0.0
last_updated: 2026-10-20
project_state: >-
  COMPLETE AND GREEN — typecheck ✓ lint ✓ 95/95 unit ✓ 214/214 e2e ✓
  production build (446 KB single file) ✓ review rounds R1-R12 executed (theme
  switching remediated: two-state toggle + pre-paint script; axe 4.14 Label-in-Name
  fixed; sitemap lastmod + SEO hardening: soft-404 noindex, /home alias canonical,
  social-card meta, icon surfaces, JSON-LD enrichment; R4: case-variant lowercase
  canonical, private-surface noindex, theme-color follows the resolved theme;
  R5: R4 fixes re-verified live, auth-page platform-chrome divergence documented
  as a deviation; R6: reference-drift catch-up — services pricing + Add-On
  Services band, measured eyebrow/nav/menu/quote/About geometry, active-route
  aria-current + AA gold-ink, band accent tokens, GitHub Actions CI (first run
  green); R7: second reference-drift catch-up — hero tagline, gallery category
  filters + the measured five-cycle (Seasonal), About-page rebuild (bio +
  stats + philosophy band + featured-in + measured CTA), experience
  paragraphs, attribution format, quote glyphs, gallery intro; R8: R7-surface
  anatomy completion — featured-in strip as a centered hairline-bordered band
  (uppercase measured names), unboxed centered CTA, caption-treatment
  deviation ledgered, sitemap-lastmod lag note; R9: full validation round —
  zero findings of severity, all R2–R8 pins re-verified live, reference
  re-extracted with no drift, CI on the R8 head GREEN; R10: full validation
  round (second consecutive zero-findings round) — all R2–R9 pins re-verified
  live, reference re-extracted with no drift, CI on the R9 head GREEN, F1
  capture-tooling record + lazy-image settle fix; R11: full validation round
  (third consecutive zero-findings round) — all R2–R10 pins re-verified live
  via a scripted 31/31-check battery, reference re-extracted with no drift,
  CI on the R10 head GREEN per the R10 session record, F1 probe-method
  record: census multi-select surfaces per select; R12: full validation round
  (fourth consecutive zero-findings round) — all R2–R11 pins re-verified live
  via a scripted 31/31-check battery, reference re-extracted with no drift
  (13/13 incl. the per-select booking contract), CI on the R11 head GREEN
  (run #11, verified live), F1 probe-method completion record: per-select
  census implemented in the probe; R13: full validation round (fifth
  consecutive zero-findings round) — all R2–R12 pins re-verified live via a
  scripted 32/32-check battery, reference re-extracted with no drift
  (13/13), operator-credential login re-verified, F1 post-reset
  probe-reconstruction record (four first-pass FAILs root-caused to probe
  artifacts: CTA role, catalog-name provenance, theme-color sync path,
  menu-footer scope) ✓ capture sweeps
  through R13 (56 verified PNGs) ✓ pushed to origin/main.
---

# Aurelia Nail Artistry — Codebase Engineering SKILL

> **How to use this document:** read §1–§3 before your first change; keep §9–§11 (anti-patterns, debugging, pre-ship) open while you work; §19–§20 are the lookup tables. Every claim is verifiable against a named file or a runnable command. Companion docs: `AGENTS.md` (condensed rulebook), `CLAUDE.md` (session playbook), `Project_Architecture_Document.md` (ADRs + topology), `docs/reference-investigation.md` (verified reference evidence), `docs/implementation-plan.md` (plan + deviations ledger).

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Lib Seams Deep Dive (the "hooks" layer)](#6-lib-seams-deep-dive-the-hooks-layer)
7. [Data Management & Persistence](#7-data-management--persistence)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns (with code)](#15-coding-patterns-with-code)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
- [Appendix A — ADR Summaries](#appendix-a--adr-summaries)
- [Appendix B — Test Inventory](#appendix-b--test-inventory)
- [Appendix C — Reference Evidence Map](#appendix-c--reference-evidence-map)
- [Appendix D — Quick Reference Card](#appendix-d--quick-reference-card)

---

## 1. Project Identity & Design Philosophy

**One sentence:** a luxury nail-studio marketing + booking single-page application that reproduces `aurelia-nail-artistry-demo.base44.app` with verified visual parity and extends it with dark mode, hashed-credential accounts, and a role-gated admin booking surface — deployable as one static HTML file.

**Design thesis:** *warm editorial luxury* — an oversized Cormorant Garamond serif voice on a measured warm-cream ground (`#f5f3ef`), near-black ink bands (`#1a1a1a`), full-bleed photography, hairline rules, uppercase letterspaced eyebrows, and generous negative space. The reference measures (from `docs/reference-investigation.md`, Verified): cream `rgb(245,243,239)`, ink `rgb(26,26,26)`, hero h1 at 128px/400, no prices anywhere on Services (durations only), and a booking flow whose form is **replaced** — not succeeded — by a "Request Received" confirmation.

**Non-negotiable design rules:**

1. **Measured sRGB wins.** Any color an e2e test asserts is a hex literal in `src/index.css` with its measured rgb triple in a comment. hsl is never used where a gate exists (it drifts 1 unit per engine — this bit twice).
2. **Gold is an accent, not an ink.** `--gold` fails WCAG AA at eyebrow sizes on cream; it may appear on hover states, borders, and dark-ground accents only.
3. **The hero never flips.** Hero copy/pill tokens are static because they sit on photography; dark mode flips the *page* around the photograph, not the photograph.
4. **No generic components.** No card grids with drop shadows, no Bootstrap-ism buttons, no gradients. Elevation is expressed by band inversion and hairlines, not shadows (the v4 shadow-scale trap is documented; shadows are deliberately near-absent).
5. **Copy parity.** Studio name, tagline, address, hours, email, phone, service names/durations, and the confirmation copy are pinned evidence — change them only with a matching reference-evidence update or a ledger entry.

**CTA hierarchy:** primary = dark band button ("Book Your Session" / "Book Now") on cream; secondary = outline/hairline. Every page funnels to `/booking`; the header keeps a persistent Book link.

**Anti-generic mandate:** if a change would look at home in a SaaS template, it is wrong for this codebase. When in doubt, re-read §5.2 of the reference investigation and match the type scale.

---

## 2. Tech Stack & Environment

Versions are read from `package.json` (exact, lockfile-pinned via `package-lock.json`).

| Layer | Technology | Version | Critical note |
|---|---|---|---|
| UI runtime | `react` / `react-dom` | 19.3.1 | Function components + hooks only; no `forwardRef`, no class components |
| Language | `typescript` | 5.9.3 | strict + `noUnusedLocals` + `erasableSyntaxOnly` + `verbatimModuleSyntax` (`tsconfig.json`) |
| Build | `vite` | 7.3.7 | Dev on :5173; preview on :4173 |
| Single-file | `vite-plugin-singlefile` | 2.3.4 | Inlines JS+CSS → `dist/index.html` (~446 KB / ~118.4 KB gzip; its `base: './'` rewrites root-absolute hrefs to relative — see pwa-manifest.spec) |
| Styling | `tailwindcss` + `@tailwindcss/vite` | 4.3.3 | **CSS-first**: `@theme` + `@custom-variant` in `src/index.css`; there is **no `tailwind.config.js`** |
| Routing | custom (`src/lib/router.tsx`) | — | `pushState`/`popstate`, case-insensitive `matchPath`, ~107 LOC, zero deps |
| State | React Context + `localStorage` | — | `aurelia:v1` namespace (`src/lib/storage-key.ts`), seed-on-mount pattern |
| Icons | `lucide-react` | 1.59.0 | Inline SVGs; the only runtime dependency besides react/clsx/tailwind-merge |
| Utilities | `clsx` / `tailwind-merge` | 2.1.1 / 3.7.0 | Wrapped by `src/utils/cn.ts` |
| Unit tests | `vitest` | 4.1.12 | Node env (`vitest.config.ts`); 9 files + 1 colocated seam spec, **95 tests** |
| E2E | `@playwright/test` | 1.64.1 | **214 tests**; projects `chromium` (Desktop Chrome) + `mobile` (iPhone 14 on chromium engine — avoids a WebKit install) |
| A11y e2e | `@axe-core/playwright` | 4.14.0 | axe smoke on all public routes |
| Lint | `eslint` + `typescript-eslint` + react-hooks/react-refresh | 9.39.5 / 8.71.2 | Flat config `eslint.config.js` |
| DB tooling | `node:sqlite` (stdlib) | Node ≥ 22.5 | Zero-dep; **the SPA itself needs only Node ≥ 20** |

**Runtime environment contract:** the only runtime network request is Google Fonts (Cormorant Garamond + Inter, `display=swap`). Images are same-origin `/images/*` (15 independently generated assets — never copied from the reference). No cookies, no server, no env vars at runtime; `VITE_SITE_URL` is baked at build time for SEO defaults.

---

## 3. Bootstrapping & Configuration

```bash
git clone git@github.com:nordeim/luxury-nail-portfolio.git
cd luxury-nail-portfolio
npm install                       # lockfile install
cp .env.example .env              # DATABASE_URL="file:../db/custom.db"
npm run db:setup                  # Node ≥ 22.5 — materializes + seeds db/custom.db
npm run dev                       # http://localhost:5173
npm run verify && npm run e2e     # the full gate chain (e2e builds first)
```

**Configuration files that matter:**

| File | What it pins |
|---|---|
| `vite.config.ts` | React plugin, Tailwind v4 vite plugin, `vite-plugin-singlefile`, `@` → `./src` alias |
| `tsconfig.json` | strict, `noUnusedLocals`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `@/*` paths |
| `eslint.config.js` | Flat config; typescript-eslint + react-hooks + react-refresh |
| `vitest.config.ts` | Node environment; resolves the same `@` alias |
| `playwright.config.ts` | `testDir tests/e2e`, workers 1, two projects, webServer = `vite preview --port 4173 --strictPort`, `reuseExistingServer` off in CI |
| `.env` / `.env.example` | `DATABASE_URL="file:../db/custom.db"` (schema-relative, ADR-002); optional `VITE_SITE_URL` |

**Demo accounts** (seeded from `src/data/studio.ts`; digests verified by `tests/password.test.ts`): admin `demo@aurelia.studio` / `Aurelia-Demo-2025`; customer `guest@aurelia.studio` / `Aurelia-Guest-2025`.

**Sandbox/CI gotcha:** if a parent workspace exports its own `DATABASE_URL`, prefix db/e2e commands with `env -u DATABASE_URL`. The containment audit in `scripts/db-setup.mjs` will otherwise refuse to run (loudly) — that failure is the guard working.

---

## 4. The Design System (Code-First)

The entire design system is `src/index.css` (185 lines). Read it before any styling work; it carries the token blocks **and** the annotated trap-log pins.

### 4.1 Token architecture (why `@theme inline`)

```css
:root { --background: #f5f3ef; /* rgb(245,243,239) measured — hex pin */ … }
.dark { --background: #13110f; /* rgb(19,17,15) designed dark ground — hex pin */ … }

@theme inline {
  --color-background: var(--background);   /* utilities read the VARIABLE, not a value */
  --color-foreground: var(--foreground);
  …
}
```

`@theme inline` makes utilities like `bg-background`/`text-foreground` resolve the CSS **variable at use-site**, which is what lets a single class flip under `.dark`. A plain `@theme` (value-inlined) would freeze light values into the utilities and dark mode would silently do nothing to them. If `:root` values ever vanish from the production build, check §10.2 (the CSS-comment landmine) before doubting the token architecture.

### 4.2 Token groups

- **Surface semantics:** `--background`, `--foreground`, `--surface`, `--surface-raised`, `--muted-foreground`, `--hairline`, `--ink-soft`, `--gold` — all flip under `.dark`.
- **Band semantics:** `--band`, `--band-foreground`, `--band-muted`, `--band-hairline` — the editorial inversion: dark bands (`#1a1a1a` + white ink) in light mode become cream bands (`#f5f3ef` + `#13110f` ink) in dark mode. Footer, philosophy quote, and dark CTAs consume these.
- **Hero statics:** `--hero-ink`, `--hero-ink-soft`, `--hero-pill`, `--hero-pill-ink`, `--hero-pill-soft` — **defined only in `:root`**, never redefined in `.dark`. Components on the photograph (`text-hero-ink`) are theme-invariant by construction.
- **Z-scale:** `--z-sticky: 300`, `--z-overlay: 400`, `--z-toast: 800` — consumed as `z-(--z-overlay)` arbitrary-value utilities (§18).

### 4.3 Typography system

| Utility/role | Face | Notes |
|---|---|---|
| `font-display` | Cormorant Garamond, Georgia, serif | Hero h1 (desktop scale ≈ reference 128px), section h2, mobile menu links, admin headings |
| body default | Inter, system-ui stack | Set on `body` in the base layer |
| `.eyebrow` | Inter, uppercase, letterspaced | Section kickers, form labels, buttons, footer micro-copy |

Fonts load in `index.html` via Google Fonts with `preconnect` + `display=swap`. Parity asserts **font families**, never pixel metrics (swap drift is acceptable; family drift is not — pinned in `tests/e2e/visual-parity.spec.ts`).

### 4.4 Motion

One entrance animation (`animate-fade-up`, used by the booking confirmation), color/opacity transitions on interactive elements, and the arrow-translate hover on band buttons. `prefers-reduced-motion` is honored in the base layer. No other keyframes — new motion needs a reduced-motion story and a reason.

### 4.5 The trap-log pins (annotated in place in `index.css`)

| # | Trap | Structural fix carried in this codebase |
|---|---|---|
| 1 | v4 `space-y-*` compiles to zero-specificity `:where()` — child `mt-*` now wins and changes layouts | No `space-y-*` + child `mt-*` anywhere; flex/grid `gap-*` instead; mobile menu e2e asserts computed spacing |
| 2 | `backdrop-filter` ancestor creates a containing block that clips `fixed` descendants | Mobile menu is a `createPortal(document.body)` overlay; no backdrop-filter above fixed elements |
| 3 | Bare-HSL transparency + oklch/oklab conversion drift | e2e-asserted colors are hex literals (§1 rule 1) |
| 4 | v4 shadow-scale shift | Shadows are near-absent by design; band inversion expresses elevation |
| 5 | v4 re-gates hover behind `@media (hover:hover)` | `@custom-variant hover` declared; hover never hides content (gallery touch captions exist) |
| — | Dark-mode strategy | `@custom-variant dark (&:where(.dark, .dark *))` — class strategy, toggled on `<html>` |

---

## 5. Component Architecture & Patterns

**Inventory:** 2 component files (`chrome.tsx` 398 lines, `head-manager.tsx`), 9 page files, 10 lib modules, 1 data module, 1 types module — ~2,932 source lines total. All components are function components; there are no `"use client"` directives (no server runtime) and no HOCs.

### 5.1 The chrome (`src/components/chrome.tsx`)

| Export | Role | Pins |
|---|---|---|
| `BrandMark` | Wordmark link, `text-hero-ink` over the hero / `text-foreground` elsewhere | Theme-aware via props, not media queries |
| `ThemeToggle` | **Two-state** light ↔ dark switch (R2-01): every click flips the RESOLVED theme via `nextThemeMode`; fresh profiles start in OS-following `system` mode until the first click pins a choice; `aria-label="Color theme: <mode>. Activate to switch."`; `data-theme-mode`/`data-theme-dark` hooks for tests | Applies theme via `src/lib/theme.ts`; tracks `<html>` class with a MutationObserver for icon state; the pre-paint head script in `index.html` owns first-paint theming (`data-theme-applied`, e2e-pinned) |
| `Header` | Transparent-over-hero on `/` (`absolute`, `text-hero-ink`) → solid `bg-background` with hairline on other routes; desktop nav `aria-label="Primary"` (hidden below `md`); mobile row with ThemeToggle + `Open menu` button | Route change closes the menu (`useEffect [path]`) |
| `MobileMenu` | `createPortal(document.body)` full-screen `role="dialog"` labelled "Site menu"; focus trap + Escape + scroll lock; gap-based nav (`aria-label="Mobile"`); `AccountMenuLink` renders Account/Sign In by session state | ADR-005 structural fixes (§4.5 traps 1–2); focus returns to opener on close |
| `Footer` | Cream/dark band with Navigate + Connect columns; `role="contentinfo"` | Consumes band tokens — the e2e dark-inversion assertion target |
| `Toasts` | `--z-toast` layer, auto-dismissing | `toast()` comes from the store |

### 5.2 Pages

`home.tsx` (hero / "The Portfolio" 2×2 teaser / philosophy quote band / "Bespoke Artistry" experience / "Ready to Create?" CTA) · `gallery.tsx` (12-work grid, hover overlay + touch captions, category labels) · `services.tsx` (6 services with durations — **no prices**, reference parity — plus 3 policy cards) · `about.tsx` (founder story, values, studio block) · `booking.tsx` (info cards + form → confirmation state machine) · `auth.tsx` (shared `AuthCard` for signin/register/reset) · `account.tsx` (profile + booking history + cancel) · `admin.tsx` (role-gated booking requests with status workflow) · `not-found.tsx` (404).

### 5.3 Wiring pattern

`App.tsx` = `RouterProvider → HeadManager + StoreProvider → Routes switch (matchPath name → page)`. Head ownership sits **inside** the provider so every navigation re-runs the SEO contract. Page shells use the `PageShell` pattern (max-width container + consistent vertical rhythm via `py-24 lg:py-32`).

---

## 6. Lib Seams Deep Dive (the "hooks" layer)

This project has no custom React hooks beyond store context consumption; its reuse layer is **pure-function seams** in `src/lib/` — each unit-pinned in a bare Node environment (the layer rule of §AGENTS: seams never import pages).

| Seam | File | Contract | Pinned by |
|---|---|---|---|
| Booking validation | `src/lib/booking.ts` (~80 ln) | `validateBooking(input, { today, knownServices })` → per-field errors; `isClosedDay` (Sun/Mon); `todayIso()` (local-time ISO); slot whitelist via `TIME_SLOTS` | `src/lib/booking.test.ts` (127 ln) |
| Passwords | `src/lib/password.ts` (~80 ln) | `hashPassword` → `s1$<32-hex-salt>$<sha256(salt:password)>`; `verifyPassword` constant-time; legacy plaintext verifies then upgrades on login | `tests/password.test.ts` incl. **demo-seed integrity** |
| SEO map | `src/lib/seo.ts` (~87 ln) | Route → title/description/OG; canonical from `VITE_SITE_URL` fallback | `tests/seo.test.ts` |
| Theme | `src/lib/theme.ts` (~40 ln) | `resolveTheme(mode, prefersDark)`; `applyTheme` toggles `<html>.dark` + `colorScheme`; storage keys | e2e `dark-mode.spec.ts` |
| DB path | `src/lib/db-path.ts` (~67 ln) | ADR-002 schema-relative resolver (prisma/ anchor + clamp); TS mirror of the mjs rules | `tests/db-path.test.ts` |
| Router | `src/lib/router.tsx` (~107 ln) | `useRouter()` → `{ path, navigate }`; `matchPath` case-insensitive; `Link` renders real `<a>` | e2e smoke + per-route specs |
| Store | `src/lib/store.tsx` (~225 ln) | `StoreProvider`: persisted `{ users, sessionUserId, bookings }`, `login/register/logout`, `createBooking/cancelBooking/setBookingStatus/bookingsForUser`, `toast` | e2e auth-flow/booking-flow/password-hash |

**Store contract details:** duplicate registration normalizes email (lowercase) and rejects; `register` hashes via WebCrypto (async); bookings attach `userId` of the current session (null when anonymous); the persisted document is written on every state change after hydration (§15.1 pattern).

---

## 7. Data Management & Persistence

### 7.1 Two persistence systems, one rule

**Runtime (browser):** one JSON document under `localStorage["aurelia:v1"]` — `users` (with digests), `sessionUserId`, `bookings`. Theme persists separately under `aurelia.theme`. First run seeds from `src/data/studio.ts`. Private-mode rejection is caught → session-only demo (e2e-pinned). Namespace bump (`aurelia:v1` → `v2`) is the migration policy.

**Tooling (Node ≥ 22.5):** `npm run db:setup` → `db/custom.db` (SQLite) with `services`, `gallery_works`, `users`, `booking_requests` (schema in `scripts/db-setup.mjs` §SCHEMA). Seed counts are cross-checked against the real `studio.ts` import by `tests/db-scripts.test.ts`. **Nothing in `src/` reads the DB** — it exists to prove the ADR-002 data contract and for admin/docs.

### 7.2 The ADR-002 resolution contract (memorize this)

```
DATABASE_URL = "file:../db/custom.db"
  → resolveDbPath: join("prisma", "../db/custom.db") = "db/custom.db"   (anchor absorbs one ..)
  → targetFile: join(<repoRoot>, "db/custom.db")                        (CWD-independent)
  → auditContainment: relative URL landing outside <repoRoot> → hard error;
                      absolute URL outside → allowed + stderr notice (test harness escape hatch)
```

The resolver **clamps**: excess `..` segments cannot escape above the repo root (the path stack bottoms out at empty). Misconfiguration is structurally impossible for relative URLs and loud for absolute ones. The rules exist twice (TS + mjs) and are pinned thrice (`tests/db-path.test.ts`, `tests/db-scripts.test.ts`, the `.env` contract test which reads `.env` when present else `.env.example`).

### 7.3 Catalog single-source doctrine

`src/data/studio.ts` is the **only** place services, gallery works, time slots, nav links, studio info, and demo users exist. Pages, the SEO map, the sitemap generator (regex-projection like db-setup), and the SQLite seed all derive from it. Adding a service = one edit here + typecheck will find every broken assumption.

---

## 8. Accessibility Implementation

- **Automated:** axe smoke (`@axe-core/playwright`) with critical/serious violations forbidden on every public route (`tests/e2e/a11y-smoke.spec.ts`).
- **Landmarks:** single `<main>` + `contentinfo` footer on every route; `Primary` (desktop) / `Mobile` (menu overlay) navigation landmarks — viewport-aware assertions, because the desktop nav is `display:none` on mobile.
- **Labels doctrine (hard-won):** every control has a programmatic name. `<legend>` does **not** label controls — bind it via `aria-labelledby` (booking notes field). Helper text must live **outside** the `<label>` or the accessible name aggregates it (the password field carries an explicit `aria-label="Password"` because "Min. 8 characters" inside the label broke exact-name queries).
- **Keyboard:** focus trap + Escape + focus-return in the mobile menu; visible focus ring (gold border) on brand/menu; tab order verified per viewport (brand → toggle → menu button on mobile; brand → first nav link on desktop).
- **Contrast:** muted-foreground (not gold) for static eyebrows; dark-red inline validation text; ≥4.5:1 body ink in both themes. The gallery's hover overlay has touch captions so no content is hover-gated.
- **Reduced motion:** entrance animation disabled under `prefers-reduced-motion`.

---

## 9. Anti-Patterns & Common Bugs

Numbered for reference; each entry has bitten this codebase or its predecessor.

1. **#01 Asserting hsl-authored colors in e2e** — hsl→rgb drifts 1 unit per engine (`hsl(40 33% 95%)` renders `rgb(246,244,238)`, not the measured `245,243,239`). Fix: hex literals in CSS.
2. **#02 CSS block comments containing `*/`-forming sequences** — a header comment naming `bg-*/text-*` utilities terminated its own comment early; Tailwind silently dropped the `:root` block from the build (`.dark` survived — the build "succeeded"). Fix: never write `*/` inside comment prose.
3. **#03 Following ambient `DATABASE_URL` silently** — a parent workspace env var redirected `db:setup` outside the repo. Fix: containment audit + `env -u DATABASE_URL` in sandbox docs.
4. **#04 `space-y-*` with child `mt-*`** — the user-flagged v4 mobile-nav bug class. Fix: gap layout (structural, not override).
5. **#05 Fixed-position elements under a `backdrop-filter` ancestor** — clipped overlay. Fix: portal to `document.body`.
6. **#06 Fabricated seed digests** — demo credentials shipped with digests that never matched `sha256(salt:password)`; sign-in failed silently. Fix: seed-integrity unit test.
7. **#07 Native constraints shadowing custom validation** — `min` on the date input blocked the custom past-date alert; `minLength` on register blocked the custom short-password message. Fix: native for required-UX only, custom for domain rules.
8. **#08 `getByLabel` against non-label structures** — `<legend>` and helper-text-inside-`<label>` break exact accessible-name queries. Fix: `aria-labelledby`/`aria-label` (§8).
9. **#09 jest-dom assertions in Playwright specs** — `toBeRequired` doesn't exist; the test crashes with "is not a function". Fix: `toHaveAttribute("required", "")`.
10. **#10 Desktop-only e2e affordance assumptions** — `Primary` nav, `Account` link, and `Sign Out` are desktop-viewport or dedicated-surface affordances; mobile asserts must branch on `Open menu` visibility and sign out via `/account`.
11. **#11 Plain `@theme` with `.dark` overrides** — value-inlined tokens freeze light values into utilities; dark mode stops working for those classes. Fix: `@theme inline` + CSS variables.
12. **#12 Success flows without navigation** — a register/login handler that only toasts leaves the URL on the auth route (and the user confused). Fix: `navigate("/", { replace: true })` on success (reference-verified behavior).
13. **#13 Static gold text** — fails AA at eyebrow sizes on cream. Fix: muted-foreground; gold for hover/borders only.
14. **#14 Copying e2e totals into docs as constants and forgetting them** — 75/166 appeared in README/AGENTS/PAD/SKILL; R3 moved them in seven places and still missed four (README arch table, this file's frontmatter description + §3, two ~437 KB stragglers). R4's rule: sweep to termination with `rg "75|166|437"` over all six docs — spot-fixing count migrations loses. Move totals together.
15. **#15 `test.use()` inside a test body** — illegal in Playwright; use `page.setViewportSize()` for per-test viewports.
16. **#16 Editing one of the two DB-resolution mirrors** — `db-path.ts` and `db-setup.mjs` must move together or the pinned tests fail.

---

## 10. Debugging Guide

### 10.1 Symptom → cause → fix (fast table)

| Symptom | Likely cause | Fix |
|---|---|---|
| Parity test: bg off by exactly 1 rgb unit | hsl token where a hex pin belongs | Pin the hex (`#…`) in `src/index.css`, rebuild |
| `:root` tokens missing from `dist/index.html` but `.dark` present | CSS comment with `*/` inside (early termination) | Rewrite the comment (§9 #02), rebuild |
| `db:setup` → "OUTSIDE the repo root" error | Ambient `DATABASE_URL` (relative, escaping) | `env -u DATABASE_URL npm run db:setup` |
| `db:setup` writes to a parent workspace | Ambient absolute `DATABASE_URL` override | Same — then check the stderr notice logic if intentional |
| "node:sqlite is unavailable" | Node < 22.5 for db scripts | Use Node ≥ 22.5 for `db:*` (SPA still needs ≥ 20) |
| Toggle click doesn't flip the page | Pre-R2-01 bundle (fixed `system → light → dark` order made click 1 a no-op on light OS) | Two-state `nextThemeMode` flips the RESOLVED theme — rebuild; the fresh-first-click e2e pin guards it |
| Dark tokens flip but a section stays light | Component uses a static/hero token or a raw color | Consume semantic tokens only (`bg-background`, `text-foreground`, band tokens) |
| `getByLabel('Password', { exact: true })` times out | Helper text aggregated into the accessible name | Move helper text out of `<label>`; add `aria-label` |
| Register/login "does nothing" (URL unchanged) | Failure branch rendered (check `role="alert"`) or duplicate email | Read the alert; unique emails in tests use `Date.now()` |
| Admin page shows restriction notice | Signed in as `guest@` (role customer) or session lost on full reload | Sign in as `demo@aurelia.studio`; check `localStorage` seeded |
| Playwright: "expect(...).toBeX is not a function" | jest-dom assertion imported from muscle memory | Use the Playwright equivalent (§9 #09) |
| Mobile test can't find nav links | Desktop nav hidden at mobile viewport | Branch on `Open menu` and use the `Site menu` dialog (`Mobile` nav) |
| e2e tests stale behavior | `dist/` older than `src/` | `npm run build` (e2e serves the build, never dev) |
| Sitemap/robots stale after route change | prebuild regenerates only on build | `npm run seo:generate` + commit refreshed artifacts |
| agent-browser probe returns fallback-sized/odd-token reads | `open --viewport` is a no-op in 0.39.0, and the page can be probed before async CSS (Base44 bundles late) applies | Always `set viewport <w> <h>` + re-open + settle (networkidle) before measuring; distrust the first computed read after a reload |
| Sandbox background processes die between tool calls (`setsid`/`nohup`/`disown` all fail) | The sandbox reaps children per call | Run dev-server-dependent probes within a single call; re-start per call (`curl -s localhost:5173 || (npx vite &)`) |
| Raw CSS-selector click on a theme/menu control no-ops at mobile viewports | CSS selectors match hidden DOM nodes — at mobile widths `button[data-theme-mode]` first matches the display-none desktop toggle (e2e is immune: `getByRole` uses the a11y tree = visible only) | Probe pattern: `[...document.querySelectorAll(sel)].find(x => x.offsetWidth)` before `.click()` |

### 10.2 The swallowed-`:root` incident (full procedure, §9 #02)

**Symptom:** production CSS contains `.dark` variables but no `:root` light values; every `bg-background` renders transparent in light mode; no build error. **Repro:** minimal file through the same pipeline works → bisect by re-adding content → the header comment is the culprit. **Root cause:** comment prose containing `bg-*/text-*` — the `*/` inside terminates the block comment early, and the parser then swallows the following `:root` block as "comment continuation". **Fix:** reword the comment; **prevention:** §13 pitfall list; **detection:** any parity test on a light token (they all broke at once).

### 10.3 E2E debugging procedure

1. Read `test-results/<failing-test>/error-context.md` — Playwright snapshots the full a11y tree at failure; the missing/wrong node is usually visible directly.
2. `trace.zip` next to it → `npx playwright show-trace <path>`.
3. Reproduce manually: `npx vite preview --port 4174` + `agent-browser open`/`eval` (React-safe fill via native setters — see §15.5).
4. Only then change code or spec — decide which side owns the defect (app bug vs spec assumption) and pin the decision in a comment.

---

## 11. Pre-Ship Checklist

```bash
env -u DATABASE_URL npm run verify     # typecheck → lint → 95 unit → build
env -u DATABASE_URL npm run e2e        # 214 e2e vs the fresh build
env -u DATABASE_URL npm run db:setup   # containment audit + seed contract
```

- [ ] New/changed user-visible copy or tokens checked against `docs/reference-investigation.md` (or logged as a deviation)
- [ ] Any e2e-asserted color is a hex literal with its rgb comment
- [ ] No `space-y-*` + child `mt-*`; no backdrop-filter above fixed elements; no `*/` inside CSS comments
- [ ] Form controls all have programmatic names; helper text outside labels
- [ ] Viewport-sensitive e2e branches on `Open menu` visibility
- [ ] Test totals (95/214) updated in README + AGENTS + PAD + this SKILL if moved (sweep `rg "75|166|81|178|89|194|212|437|439|442" docs/ *.md` to termination)
- [ ] Docs updated in the same commit for any contract change (root docs + this file)
- [ ] Push via SSH wrapper to `main` only (key outside repo, `--dry-run` first, verify remote ref == HEAD)

---

## 12. Lessons Learnt & How to Avoid Them

1. **Measured beats authored.** The reference's rendered sRGB values — not the CSS authoring format — are the contract. Two 1-unit drifts (`#f5f3ef` light, `#13110f` dark) taught: pin hex, comment the rgb triple, and let the computed-style gate be the referee.
2. **"Build succeeded" is not "CSS intact".** Tailwind v4 silently swallowed a token block because of comment prose. Every silent-corruption incident needs a regression test that reads the **built artifact** (the parity suite does).
3. **Environment is part of the contract.** An ambient `DATABASE_URL` from a parent workspace redirected file materialization; the code was "correct" and the operation wrong. Containment audits convert that class from silent to loud.
4. **Specs are contracts — write them against the shipped behavior, not intentions.** Five e2e failures in this build were spec-side assumptions (theme cycle start, desktop affordances, jest-dom assertions); three were app-side (native constraint shadowing, missing accessible names, missing post-auth navigation). Diagnose ownership explicitly before editing either side.
5. **Seeds must be executed, not assumed.** A fabricated digest is indistinguishable from a real one until someone logs in. Anything generated (digests, sitemaps, DB rows) gets an execution-verified test.
6. **The a11y tree is the e2e API.** Playwright's `error-context.md` a11y snapshot resolved more failures in this build than any other artifact — label/role defects show up as missing nodes immediately.
7. **Structural fixes beat CSS overrides.** The mobile-nav trap was "fixed" for good only when the menu became a portal with gap spacing — CSS-level patches kept regressing across engine versions in the predecessor project.
8. **One catalog source.** Every duplication of studio data eventually disagreed; `studio.ts` single-sourcing plus regex projections (with count-pinned tests) ended the drift class.

---

## 13. Pitfalls to Avoid

- Don't "simplify" hex-pinned tokens back to hsl — the parity gate will (correctly) fail.
- Don't add native HTML constraints (`min`, `minLength`, `pattern`) over fields whose custom messages are unit-pinned.
- Don't write CSS comments containing `*/`-forming sequences; don't rename utilities in comment prose.
- Don't put helper text inside `<label>`; don't rely on `<legend>` for control naming.
- Don't assert desktop affordances in mobile-project tests (and vice versa).
- Don't run `db:*` with an ambient `DATABASE_URL` in scope; don't commit `db/*.db`.
- Don't hand-write password digests or demo credentials without the seed-integrity test passing.
- Don't fetch fonts/assets from the reference site or copy its imagery — the IP boundary is absolute; all 15 assets are independently generated.
- Don't introduce a server, an ORM, or a runtime env dependency — ADR-001 forbids it.
- Don't add `space-y-*` to containers whose children have their own top margins.

---

## 14. Best Practices

1. **Gate-first workflow:** `verify` before every commit; `e2e` before every push; rebuild before e2e.
2. **Change tokens, not components:** theming moves through `index.css` semantic tokens; components stay token-consuming.
3. **Pin behavior at the seam:** new domain logic goes into `src/lib/` pure functions with injectable inputs (`today`, `knownServices`) and a colocated/pinned test.
4. **Keep the e2e hooks stable:** `data-booking-form`, `data-booking-confirmation`, `data-theme-mode`, `aria-label` strings are API — change them only with the specs that pin them.
5. **Viewport-aware assertions** as a suite-wide pattern (`Open menu` visibility branching) — copy, don't reinvent.
6. **Document contracts where they live:** the resolver rules live in both mirrors' headers; the trap pins live inline in `index.css`; this SKILL cross-references rather than duplicates.
7. **Regenerate, don't hand-edit** derived artifacts (`sitemap.xml`, `robots.txt`, `db/custom.db`).
8. **Unique test emails** via `Date.now()` suffixes; never assert on shared mutable state.

---

## 15. Coding Patterns (with code)

### 15.1 Seed-on-mount store (hydration-safe persistence)

```tsx
const [state, setState] = useState<PersistedState>(seedState); // coherent first paint
const [ready, setReady] = useState(false);
useEffect(() => { setState(loadState()); setReady(true); }, []);   // hydrate once
useEffect(() => {
  if (!ready) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* private-mode: session-only demo */ }
}, [state, ready]);
```

*Why:* without `ready`, the first effect flush would persist the seed over the real stored state.

### 15.2 Injectable pure validation (the booking seam)

```ts
const validation = validateBooking(form, { today: todayIso(), knownServices: SERVICES.map(s => s.id) });
if (hasErrors(validation)) { setErrors(validation); return; }
```

*Why:* `today` injection makes closed-day/future-date logic deterministic in tests; the page owns only UI wiring.

### 15.3 Portal mobile menu with structural pins

```tsx
return createPortal(
  <div role="dialog" aria-modal="true" aria-label="Site menu" ref={panelRef}
       className="fixed inset-0 z-(--z-overlay) flex flex-col bg-background text-foreground">
    <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-8 px-8 pb-24">…</nav>
  </div>, document.body);
```

*Why:* portal (trap 2), `gap-8` (trap 1), dialog semantics + focus trap + Escape + scroll lock (a11y), focus-return to opener.

### 15.4 Theme application with system-mode sync

```ts
useEffect(() => {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => applyTheme(resolveTheme(mode, media.matches));
  sync();
  media.addEventListener("change", sync);       // live system-mode tracking (mode="system" only)
  return () => media.removeEventListener("change", sync);
}, [mode]);

const cycle = () => {
  // Two-state switch (R2-01): flip the RESOLVED theme, not a fixed order -
  // every activation is visible. First click pins an explicit choice.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const next = nextThemeMode(mode, resolveTheme(mode, media.matches));
  setMode(next);
  writeStoredMode(next);
};
```

*Why:* `system` mode must track the OS live until the first interaction (e2e-pinned via `emulateMedia`); `applyTheme` owns the `<html>` class + `colorScheme`; `nextThemeMode(mode, resolved) !== resolved` is the unit-pinned no-op impossibility invariant. First-paint theming is owned separately by the synchronous head script in `index.html` (`data-theme-applied`), which mirrors the same stored-mode contract.

### 15.5 React-safe programmatic fill (test tooling)

```js
const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype
            : el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
el.dispatchEvent(new Event("input", { bubbles: true }));
el.dispatchEvent(new Event("change", { bubbles: true }));
```

*Why:* direct assignment doesn't propagate to React controlled state; the prototype setter + input event does. (Playwright's `.fill()`/`.type()` handles this natively — this pattern is for `agent-browser`/eval-driven reproduction, §10.3.)

### 15.6 Post-auth redirect (reference-verified)

```ts
toast(mode === "signin" ? "Welcome back." : "Welcome to Aurelia.");
navigate("/", { replace: true });   // Back skips the auth view
```

---

## 16. Coding Anti-Patterns

- **Raw colors in components** (`text-[#1a1a1a]`) — bypasses theming; use semantic utilities.
- **`forwardRef`/HOC wrappers** — React 19 + this codebase's composition style doesn't need them.
- **Conditional `space-y` "spacing fixes"** with margins — use gap.
- **Store writes outside the store** — `localStorage` is touched only by `store.tsx`/`theme.ts`.
- **Route tables duplicated per page** — nav comes from `NAV_LINKS`; the router owns matching.
- **Silent catches** — every catch degrades visibly (session-only toast, inline error) or is commented as a deliberate non-fatal path.
- **Assertion-free refactors** — moving a seam without running its pinned test is how the fabricated-digest class reproduces.

---

## 17. Responsive Breakpoint Reference

| Context | Value | Behavior |
|---|---|---|
| Primary breakpoint | Tailwind `md` (768px) | Desktop nav (`Primary`, inline links + ThemeToggle) vs mobile row (ThemeToggle + hamburger); grids collapse to single column below it |
| Container | `max-w-7xl` + `px-6 lg:px-10` | Page gutters |
| Section rhythm | `py-24 lg:py-32` | Editorial vertical spacing |
| Hero type scale | clamp-based display sizes | ≈128px desktop (reference-measured), scales down on mobile |
| Booking form | `sm:grid-cols-2` | Date/time pair side-by-side from `sm` (640px) |
| E2E viewports | 1920×1080 desktop · 390×844 (iPhone 14 profile) | The two parity profiles; `page.setViewportSize` for ad-hoc mobile states |
| No-horizontal-overflow gate | e2e mobile parity spec | Every route at 390px — layout regressions fail CI-local |

---

## 18. Z-Index Layer Map

| Token | Value | Consumers |
|---|---|---|
| `--z-sticky` | 300 | Sticky/absolute header (over page content, under overlays) |
| `--z-overlay` | 400 | Mobile menu portal (`fixed inset-0`) |
| `--z-toast` | 800 | Toast stack (topmost) |

Consumed as arbitrary-value utilities: `z-(--z-sticky)`, `z-(--z-overlay)`, `z-(--z-toast)`. Never use bare `z-50`-style utilities for architecture layers — the tokens are the layer map.

---

## 19. Color Reference (Complete)

Light (`:root`) / Dark (`.dark`) — hex where pinned, with measured/comment values:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#f5f3ef` (245,243,239 measured) | `#13110f` (19,17,15 designed) |
| `--foreground` | `hsl(30 8% 12%)` | `hsl(40 33% 95%)` |
| `--surface` | `hsl(40 30% 92%)` | `hsl(30 9% 11%)` |
| `--surface-raised` | `hsl(40 25% 98%)` | `hsl(30 8% 14%)` |
| `--muted-foreground` | `hsl(30 6% 40%)` | `hsl(40 12% 66%)` |
| `--hairline` | `hsl(30 10% 87%)` | `hsl(40 33% 95% / 0.14)` |
| `--ink-soft` | `hsl(30 6% 32%)` | `hsl(40 20% 82%)` |
| `--gold` | `hsl(36 41% 62%)` | `hsl(38 44% 66%)` |
| `--band` | `#1a1a1a` (26,26,26 measured) | `#f5f3ef` |
| `--band-foreground` | white | `#13110f` |
| `--band-muted` | `rgba(255,255,255,0.8)` (footer body measured) | `rgba(19,17,15,0.7)` |
| `--band-hairline` | `hsl(0 0% 100% / 0.2)` | `rgba(19,17,15,0.2)` |
| `--hero-ink` / `--hero-ink-soft` | white / white 80% (static both themes) | — |
| `--hero-pill` / `--hero-pill-ink` / `--hero-pill-soft` | `#f5f3ef` / `hsl(30 8% 12%)` / `hsl(40 33% 95% / 0.8)` (static) | — |

Ground-truth values asserted by the parity/dark-mode suites: body bg light `rgb(245,243,239)`, dark `rgb(19,17,15)`; footer light `rgb(26,26,26)` band with `rgba(255,255,255,0.8)` body; footer dark `rgb(245,243,239)` band with `rgba(19,17,15,0.7)` tagline; hero h1 white in both themes.

---

## 20. The Complete TypeScript Interface Reference

Source of truth: `src/types.ts` (types) + `src/lib/*.ts` (seam signatures).

```ts
type ServiceCategoryId = "signature" | "extensions" | "bespoke" | "bridal" | "specialty" | "maintenance";
type WorkCategory = "editorial" | "bridal" | "avant-garde" | "classic";
type BookingStatus = "received" | "confirmed" | "cancelled";
type ThemeMode = "light" | "dark" | "system";

interface Service { id: string; name: string; description: string; durationMin: number; category: ServiceCategoryId; }
interface GalleryWork { id: string; name: string; category: WorkCategory; image: string; featuredOrder: number | null; }
interface TimeSlot { label: string; minutes: number; }   // label exactly as offered, e.g. "10:00 AM"
interface StudioInfo {
  name: string; fullName: string; tagline: string;
  addressLines: [string, string]; hoursLine1: string; hoursLine2: string;
  email: string; phone: string; instagram: string;
}
interface BookingRequest {
  id: string; name: string; email: string; phone: string; serviceId: string;
  date: string;            // ISO YYYY-MM-DD
  timeSlot: string; notes: string;
  userId: string | null;   // set when the requester was signed in
  status: BookingStatus; createdAt: string;
}
interface User { id: string; email: string; name: string; role: "customer" | "admin"; passwordHash: string; }
interface ToastMessage { id: string; text: string; }

// Seam signatures (src/lib/booking.ts, password.ts, db-path.ts, theme.ts):
type BookingField = keyof BookingInput;   // name|email|phone|serviceId|date|timeSlot|notes
declare function validateBooking(input: BookingInput, options?: { today?: string; knownServices?: readonly string[] }): Partial<Record<BookingField, string>>;
declare function hasErrors(errors: Partial<Record<BookingField, string>>): boolean;
declare function isClosedDay(dateIso: string): boolean;        // Sun/Mon
declare function todayIso(now?: Date): string;                 // local-time ISO
declare function hashPassword(password: string, salt?: string): Promise<string>; // s1$salt$digest
declare function verifyPassword(password: string, stored: string): Promise<boolean>;
declare function isHashedPassword(value: string): boolean;     // /^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/
declare function resolveDbPath(url?: string, schemaDir?: string): string;
declare function dbPathFromRepoRoot(url?: string): string;     // "db/custom.db"
declare function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark";
declare function applyTheme(theme: "light" | "dark"): void;    // <html>.dark + colorScheme

// Router (src/lib/router.tsx):
interface RouterValue { path: string; search: string; hash: string; navigate: (to: string, options?: { replace?: boolean }) => void; }

// Store (src/lib/store.tsx):
interface StoreValue {
  user: User | null; bookings: BookingRequest[];
  login(email: string, password: string): Promise<string | null>;   // null = success
  register(email: string, password: string): Promise<string | null>;
  logout(): void;
  createBooking(input: BookingInput): { ok: boolean; errors?: Partial<Record<BookingField, string>>; booking?: BookingRequest };
  cancelBooking(id: string): void;
  setBookingStatus(id: string, status: BookingStatus): void;
  bookingsForUser(userId: string): BookingRequest[];
  toast(text: string): void;
}
```

---

## Appendix A — ADR Summaries

Full records with consequences and rejected alternatives: `Project_Architecture_Document.md` §1.3.

| ADR | Decision | One-line rationale |
|---|---|---|
| 001 | Zero-server SPA; runtime state in `localStorage`; `DATABASE_URL` is tooling-only | Static-host deployment surface; no credentials; mirrors reference behavior |
| 002 | Schema-relative `file:../db/custom.db` + clamp + containment audit | CWD-independent resolution; the escape class is structurally impossible/loud |
| 003 | Single-file production build; e2e tests the artifact | Kills dev/prod drift; deployment = copy one file |
| 004 | Tailwind v4 CSS-first tokens; measured hex pins; class-based dark variant | Engine-stable parity; `@theme inline` makes semantics flippable |
| 005 | Portal mobile menu; focus trap; gap-based spacing | Structural fix for the v4 `space-y` + `backdrop-filter` traps; a11y contract |
| 006 | Custom history router + s1$ hashed auth store | Zero deps for two small seams; case-insensitive matching is reference-verified |

## Appendix B — Test Inventory

| Suite | Files | Tests | Highlights |
|---|---|---|---|
| Vitest unit | 9 (`tests/*.test.ts`) + 1 colocated | **95** | booking seam · **theme contract (`resolveTheme` + two-state `nextThemeMode` no-op invariant)** · password contract + seed integrity · seo map (**incl. /home alias + case-variant lowercase canonical + soft-404/private-surface noindex robots**) · db-path rules · db-scripts subprocess + containment (clamp + notice) **+ R6 in-place schema upgrade** · sitemap projection (**incl. git-derived lastmod contract**) · catalog (R6: measured prices verbatim + add-on list + booking-whitelist exclusion) · **content-parity (R7: measured tagline, five-cycle category map, experience paragraphs, attribution format, measured About pack; R8: uppercase measured featured-in names)** |
| Playwright e2e | 10 specs × 2 projects | **214** | smoke · **mobile-navigation (v4 trap pin + 30px links + aria-current)** · booking-flow (validation→confirmation→admin) · auth-flow · **dark-mode (first-click flip + pre-paint script + theme-color sync + persistence + system honoring)** · visual-parity (computed styles + R6 geometry/active-state/pricing pins + R7 filter-row/content pins **+ R8 featured-in-band/CTA-anatomy pin**) · a11y-smoke (axe + structure + keyboard) · seo-head (**SPA-nav titles + JSON-LD + social-card meta + alias + case-variant canonical + soft-404/private-surface noindex**) · pwa-manifest · password-hash (round-trip, no-plaintext, session persistence) |

Run: `npm run test` / `npm run e2e`. Totals are quoted in README/AGENTS/PAD/this file — move them together (§9 #14).

## Appendix C — Reference Evidence Map

Verified observations (`docs/reference-investigation.md`) that this codebase pins:

| Reference fact | Where pinned |
|---|---|
| Cream `rgb(245,243,239)` / ink `rgb(26,26,26)` / hero h1 Cormorant 128px | `src/index.css` tokens + `visual-parity.spec.ts` |
| 6 services with durations, **no prices**; 3 policy cards | `src/data/studio.ts` + `services.tsx` + smoke/e2e copy assertions |
| 12 gallery works, 4 categories, no detail pages | `GALLERY_WORKS` + `gallery.tsx` |
| 5 time slots ("10:00 AM" … "4:00 PM") | `TIME_SLOTS` + booking e2e `selectOption` |
| Booking form public; native required validation; form REPLACED by "Request Received" | `booking.tsx` state machine + `booking-flow.spec.ts` |
| Studio contact block (address/hours/email/phone) | `STUDIO_INFO` + info-cards e2e |
| Auth: email+password views (sign-in/sign-up/reset structure) | `auth.tsx` AuthCard + `auth-flow.spec.ts` |
| Case-insensitive route paths (`/Home` ≡ `/`) | `router.tsx` matchPath |
| No dark mode on the reference | Deviations ledger → this clone's dark mode is a designed superset |
| Post-login redirect to `/` | `auth.tsx` navigate("/") |

## Appendix D — Quick Reference Card

```bash
# gates
env -u DATABASE_URL npm run verify && env -u DATABASE_URL npm run e2e
env -u DATABASE_URL npm run db:setup          # → <repoRoot>/db/custom.db

# focused work
npx vitest run tests/password.test.ts
npx playwright test tests/e2e/mobile-navigation.spec.ts --project=mobile
npm run build && npm run preview               # inspect the shipped artifact :4173

# debugging
npx playwright show-trace test-results/<dir>/trace.zip
cat test-results/<dir>/error-context.md        # a11y snapshot at failure

# push (main only)
python3 docs/ssh_git_wrapper_v3.py --key-file <key-outside-repo> \
  --remote git@github.com:nordeim/luxury-nail-portfolio.git --dry-run
python3 docs/ssh_git_wrapper_v3.py --key-file <key-outside-repo> \
  --remote git@github.com:nordeim/luxury-nail-portfolio.git
```

Key files: `src/index.css` (tokens+traps) · `src/data/studio.ts` (catalog) · `src/lib/store.tsx` (state) · `src/components/chrome.tsx` (shell) · `scripts/db-setup.mjs` (ADR-002) · `tests/e2e/visual-parity.spec.ts` (parity gate) · `docs/reference-investigation.md` (evidence).
