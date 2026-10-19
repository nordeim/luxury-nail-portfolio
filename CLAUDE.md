# CLAUDE.md — HomeNest Kitchen

This file is read fresh for every conversation. Be brief and practical. The exhaustive rulebook (trap log, parity pins, testing quirks) lives in `AGENTS.md`; the full engineering reference is `Project_Architecture_Document.md`; the distilled 20-section engineering skill (patterns, debugging, lessons) is `homenest-store-g_SKILL.md`; the audit ledger is `docs/remediation-plan.md`.

## 1. Core Identity

HomeNest Kitchen is a production-grade e-commerce storefront + admin console — a visual and functional clone of `nest-culinary-hub.base44.app` (reference measured live 2026-10-12) implemented as a **client-only SPA**: Vite 7, React 19, TypeScript strict, Tailwind CSS v4 (CSS-first `@theme`), shipped as a single HTML file via `vite-plugin-singlefile`. There is no server: commerce state (cart, wishlist, orders, sessions) persists in browser `localStorage` (`homenest.v4`), with `DATABASE_URL="file:../db/custom.db"` pinned for the repo-root `db/` tooling contract.

The SEO layer (session 8) is a generated + seam-driven superset: `src/lib/seo.ts` owns the per-route head contract (the reference's inline title map incl. its quirks, plus dynamic PDP/auth/not-found titles, canonical, og:url, Product JSON-LD), `src/components/head-manager.tsx` applies it, and `scripts/generate-sitemap.mjs` writes `public/robots.txt` + `public/sitemap.xml` (catalog-gated by `tests/sitemap.test.ts`) via the `prebuild` hook. Never hand-edit the artifacts or set `document.title` outside the seam (AGENTS.md rules 10–11).

## 2. Foundational Principles — The Meticulous Six-Phase Workflow

1. **ANALYZE** — Read the relevant files completely before proposing anything. Check `AGENTS.md` (trap log) and this file first.
2. **PLAN** — Break work into vertical slices: one seam, one test, one implementation. State assumptions explicitly.
3. **VALIDATE** — Confirm the slice is testable: which spec pins it? If none exists, write it first (red → green).
4. **IMPLEMENT** — Smallest change that satisfies the slice without weakening guards.
5. **VERIFY** — Run the full gate: `npm run verify && npm run e2e`. All five stages (typecheck, lint, unit, build, E2E) must exit 0.
6. **DELIVER** — Conventional Commit; update `AGENTS.md`/`README.md`/`Project_Architecture_Document.md` in the same commit when behavior, contracts, or visuals changed.

Non-negotiables:
- Never weaken a trap-log pin to make something pass.
- Never delete or skip a test to ship; fix the underlying issue or flag the debt explicitly.
- Never claim "works" without having run the gate and observed the result.

## 3. Implementation Standards

### TypeScript
- Strict mode; `noUnusedLocals`/`noUnusedParameters` are compile errors — prune imports.
- No `any` (use `unknown` at boundaries), no `ts-ignore`, no commented-out code.
- Named exports for components and helpers; `interface` for object shapes, `type` for unions.

### React 19
- Function components only. State lives in `StoreProvider` (one context) — do not add parallel contexts or external state libs without an ADR.
- Effects: keep them for true I/O (storage persistence, timers, listeners). Derive during render (`useMemo`) instead of syncing state in effects.
- Overlay/menu primitives that need `position: fixed` while the header is `backdrop-blur`-ed MUST be portaled to `document.body` (see AGENTS.md trap #5).

### Tailwind CSS v4
- CSS-first: `@theme` in `src/index.css` is the only token source. No `tailwind.config.js`, ever.
- Colors are full `hsl(...)` literals. Parity-critical computed values are pinned in `tests/e2e/visual-parity.spec.ts` — re-measure after token changes.
- `@custom-variant hover (&:hover);` in index.css overrides v4's built-in hover variant — v4 media-gates `hover:*` behind `@media (hover: hover)`, which silently killed the clone's hovers in no-hover contexts (the v3-era reference applies hover unconditionally). AGENTS.md trap #9.
- Body font is **Inter** (Google Fonts, system stack fallback — session-34 parity with the reference); display font is Playfair Display.
- Gradients that need sRGB parity use explicit `linear-gradient(...)` inline styles.

### Data contracts
- Money = integer cents; format only at render (`formatMoney`).
- Validate inputs at the boundary with the helpers in `lib/commerce.ts` (`isEmail`, `isZip`, `isCardNumberValid`, `isExpiryValid` — rolling window with injectable clock, `validateRedirectPath`). Same-origin redirects only.
- Guest order views are capability-gated: `?order=<number>&token=<guestToken>`; tokens are 128-bit `crypto.getRandomValues` hex (`generateGuestToken`); owners see their orders via `userId`.

## 4. Development Workflow

### Environment
```bash
npm install
cp .env.example .env   # already committed as .env in this repo; keep values in sync
npm run dev            # http://localhost:5173
```

### Commands
| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build (single file) | `npm run build` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test` / `npm run test:watch` |
| Lint (flat config, R16-01) | `npm run lint` |
| E2E (needs build) | `npm run build && npm run e2e` |
| Everything (pre-push) | `npm run verify && npm run e2e` |

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Customer | `john@example.com` | `Demo1234!` |
| Admin | `admin@homenest.kitchen` | `Admin1234!` |

Passwords are hashed at rest (session 5, R5-01): `User.passwordHash` = `s1$<salt>$<sha256(salt:password)>` via WebCrypto with a CSPRNG salt (`src/lib/password.ts`); `login`/`register`/`changePassword` are async and legacy plaintext records upgrade in place on the next successful login. The demo seed ships pre-hashed. This is defense-in-depth, not a KDF — never copy the pattern into a server-backed deployment; see PAD §6.2/§6.3.

## 5. Testing Strategy

- **Unit (Vitest, node env)**: pure seams only — commerce math, db-path contract, catalog↔storage-key registry, password-at-rest contract, route-head seam (`buildRouteMeta`), committed robots/sitemap ↔ catalog consistency, db-scripts contract. Co-located `*.test.ts` next to the seam, plus `tests/*.test.ts` for repo contracts. 104 tests.
- **E2E (Playwright, production build)**: user-visible behavior through real UI interactions — smoke, mobile navigation (incl. modal focus trap + bare-icon trigger + hover-disc pins), mobile header parity, cart-drawer modal semantics, catalog, cart/checkout, auth/admin, search-combobox keyboard plan, account-header layout, password-at-rest, a11y smoke (axe structural gate on eight surfaces incl. checkout/contact and authenticated account/admin), visual parity (incl. the session-38 home-page content layer: category tiles, carousels, card chrome, FeatureBar, CTA, hero container, header action-row hovers; and the session-39 PDP/catalog/content-page layer: gallery/info/stepper/related-carousel, /products filters + 2-up mobile grid, contact/about wrappers; the session-40 watch-list closure layer: about internals, the legal template + verbatim policies + dynamic date, contact form fields; and the session-41 checkout/cart/account/track layer: the max-w-5xl checkout shell + lg:grid-cols-3 layout, shadcn v3 checkout fields, PM radio-cards, the sticky OS card, the cart square-image cards + muted-pill steppers + amber COD box, the account profile card + per-order-card order list, the track-order pill search; and the session-42 order-success/account-orders layer: the no-disc header + primary-line pill, the large amber COD variant, the gallery-band card with square images, the 4-row delivery block with phone, the 36px pill links, the per-order account cards; and the session-43 cart-drawer superset layer: the measured-language pins — "Your Cart" 20px/700, 16px hairline cards with square 80×80 images, muted-pill steppers, inline trash-2, the "Order Summary" footer with the h-10 pill CTA), SEO head gate (served robots/sitemap, per-route titles, PDP canonical/og/JSON-LD), PWA manifest. 156 specs = 312 runs across chromium + mobile (iPhone 14 profile on chromium engine), `workers: 1`.
- **Visual parity gate**: `tests/e2e/visual-parity.spec.ts` asserts computed colors/fonts from the reference measurement. Treat it as a build-breaker.
- Bugs get a failing regression test at the same seam before the fix.

## 6. Code Quality

- The gate is green before every push: `npm run verify && npm run e2e`.
- No `console.log` in committed code; `console.error("[tag]", err)` for caught failures.
- Commit style: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), atomic units, why in the body when non-obvious.
- Docs updated in the same commit as the change they describe.

## 7. Error Handling & Debug

Debug order: reproduce in the browser → read the console → `npm run typecheck` → single unit test → single E2E spec with `npx playwright test <spec> --headed`. For flaky E2E: `trace: "retain-on-failure"` artifacts in `test-results/` (`npx playwright show-trace <zip>`).

Known traps to check first: hydration race (gate on `ready`), stale localStorage (bump `STORAGE_KEY`), strict-mode locator collisions (use `exact: true`), disabled-button clicks, backdrop-filter containing block.

## 8. Communication & Docs

- Explain why, not just what. Tag claims as Verified / Reasoned / Assumed when it matters.
- ADRs live in `Project_Architecture_Document.md` §1.3. New consequential decisions get a new ADR number — append, never renumber.
- Registered divergences from the reference site are listed in PAD §5.6. Superset features must not change the resting visuals of parity surfaces.

## 9. Project-Specific Standards

- **Route structure is a parity surface**: `/product/:id` mirrors the reference; `/products/:slug` remains supported for deep links.
- **Catalog**: the 8 reference products (names, cents prices, ratings, review counts) are pinned exactly; the extra 16 products are the registered superset.
- **Success metrics**: the gate is green; new features ship with tests at the same seam; the trap log grows instead of being worked around; a fresh clone reaches `npm run dev` in under two minutes with zero manual steps.
