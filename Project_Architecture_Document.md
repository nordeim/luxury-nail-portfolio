# Aurelia Nail Artistry — Master Project Architecture Document (PAD) v1.0

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** `README.md` (onboarding), `AGENTS.md` (agent rulebook + traps), `CLAUDE.md` (session playbook), `docs/reference-investigation.md` (verified reference evidence), `docs/implementation-plan.md` (plan + deviations ledger)
**Last Updated:** 2026-10-19
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

#### Revision Block — v1.0 (Initial Aurelia Blueprint)

- `[SR]` v1.0 written against the completed Aurelia clone (commit `1439bce`): all sections verified against the working tree and the green gate chain (typecheck, lint, 69/69 unit, 162/162 e2e, build).
- `[SR-R2]` review round R2 (2026-10-19): owner dependency bump audited (Tailwind 4.3.3, React 19.3.1, Playwright 1.64.1, axe 4.14 — all gates green on the new set); theme contract amended per `docs/remediation-plan-aurelia-r2.md` (two-state toggle + pre-paint head script; R2-01) and the axe 4.14 Label-in-Name fix (R2-02). Totals now 75/75 unit, 166/166 e2e, build ~437 KB. §1 stack table, §4.1 theme row and §5.3 reflect the amended contract.
- `[SR-R3]` review round R3 (2026-10-19): sitemap/SEO audit vs the ecommerce-store template + the live reference (`docs/remediation-plan-aurelia-r3.md`). SEO-head contract extended: sitemap `<lastmod>` (git-derived, deterministic per content state), soft-404 `noindex, follow` via a `RouteMeta.robots` field upserted by HeadManager, `/home` alias canonicalizes to `/`, complete social-card meta (og:image width/height/alt, twitter:image:alt, og:locale), `apple-touch-icon` + manifest maskable entry, NailSalon JSON-LD `sameAs` + `openingHoursSpecification`. Totals now 79/79 unit, 172/172 e2e, build ~438 KB.
- `[SR-R4]` review round R4 (2026-10-19): R3 validation + audit (`docs/remediation-plan-aurelia-r4.md`). Canonical space consolidated — case variants (`/Gallery`, `/Home`) canonicalize to the sitemap's lowercase form (R4-01); robots tightened to an indexable allowlist (the sitemap's public routes + `/home`) so private surfaces (`/account`, `/admin/*`, `/reset`) ship `noindex, follow` (R4-02); `theme-color` follows the resolved theme — synced by the pre-paint head script (meta moved above it) and `applyTheme` (R4-03). Totals now 81/81 unit, 178/178 e2e, build ~439 KB.
- `[SR-R5]` review round R5 (2026-10-19): R4 validation — every R4 fix re-verified live on the served artifact (canonical case, private noindex, theme-color both seams, soft-404), all parity pins hold (six-route reference ground matrix; mobile-menu traps incl. the theme-follow contract now evidenced dark→light), template sitemap/robots posture unchanged, 0 dependency vulnerabilities (`docs/remediation-plan-aurelia-r5.md`). One docs-only finding: the reference's auth pages render on Base44 platform chrome (white + system fonts) — recorded as a formal deviation (implementation-plan §2 R5-01); the clone keeps the studio design system on auth. Totals unchanged (81/178, ~439 KB).
- `[SR-R6]` review round R6 (2026-10-20): reference-drift catch-up + measured typography normalization (`docs/remediation-plan-aurelia-r6.md`). The live reference now prices its six services and ships an "Add-On Services" (ENHANCEMENTS) band — the catalog grew to match (`Service.price`, `ADD_ON_SERVICES`, services-page band, `add_on_services` table + PRAGMA-guarded in-place upgrade); the R1-declared-unmeasured eyebrow geometry was measured and normalized (14px/0.3em/400 utility; nav 0.1em; menu 30px; quote 48px + rose accent span; About h1 48/60); the active-route state ships as `aria-current="page"` + the AA-passing `--gold-ink` (the reference's gold active text fails AA at 2.97:1 — intent matched, math corrected); band anatomy tokenized (`--band-accent`/`--band-faint`/`--band-gold`); hosted CI closes the standing watch item (`.github/workflows/ci.yml`). Totals now 89/89 unit, 194/194 e2e, build ~442 KB.
- `[SR-R7]` review round R7 (2026-10-20): second reference-drift catch-up — copy + functionality (`docs/remediation-plan-aurelia-r7.md`). R6's hosted-CI workflow verified green on its first real run; the live parity sweep found the reference had drifted again: hero tagline re-measured (R7-01), the gallery gained **working category filters** (R7-02: an `aria-pressed` toggle group over clone tokens) and its true **five-cycle category model including Seasonal** (R7-03 — R1's four-cycle inference was wrong; eight works re-categorized), the About page was rebuilt to the measured anatomy (R7-04: "The Artist" bio + in-column quote + generated founder portrait, 3-col stats 12+/5K+/50+, dark philosophy band with the rose "wearable art" accent, What Guides Us values, rewritten studio paragraph, AS FEATURED IN strip, Book-a-Consultation CTA), and the home experience paragraphs / attribution format (em-dash prefix) / quote glyphs (straight ") / gallery intro were re-pinned verbatim (R7-05..07). Totals now 95/95 unit, 212/212 e2e, build ~446 KB.
- `[SR-R8]` review round R8 (2026-10-20): R7-surfaces anatomy completion (`docs/remediation-plan-aurelia-r8.md`). R7's next-round checks closed (CI on `87f26aa` GREEN; captures 36–37 eyeballed); the live sweep verified the reference has NOT drifted since R7 and every R2–R7 regression pin holds. One parity gap found on R7's own new surfaces (R8-01, Medium): the featured-in strip now renders as the measured **centered hairline-bordered band** (`border-y py-12` container-width, centered eyebrow, `justify-center items-center gap-12` names, **uppercase DOM names** `VOGUE…` — data-level change) and the CTA is **unboxed and centered** (`max-w-3xl`, h2 `text-3xl md:text-4xl` 36px, 16px support, 96px band→h2 rhythm); strip names keep the AA-passing `text-ink-soft` (the reference's ink/30 ≈2.2:1 fails — ledger). The gallery caption-treatment deviation (hover-reveal vs always-visible) was formalized in the ledger (R8-02), and the git-derived sitemap-lastmod one-generation lag is now documented in AGENTS (R8-03). Totals now 95/95 unit, 214/214 e2e, build ~446 KB.
- `[SR-R9]` review round R9 (2026-10-20): full validation round — **zero findings of severity** (`docs/remediation-plan-aurelia-r9.md`). R8's next-round checks closed (CI on `52bb6cf` GREEN via the check-runs API; Google Fonts watch unchanged LOW); the live sweep re-verified **every R2–R8 regression pin holds** (ground matrix, copy pins, pricing/add-ons, gallery-filter click-through, R8 featured-in band + CTA census matching the clone exactly, mobile-menu battery incl. theme-follow both directions with settled values, SEO surfaces) and re-extracted the reference with **no drift since R8** (all five routes + booking contract + platform-chrome login + operator-credential login verified live → redirect to `/`). Two probe-doctrine records only (F1: pin the viewport before responsive-type censuses — a 390px leftover viewport reads the CTA h2 at 30px pre-`md:`; F2: clear the shared browser-session console buffer between probe targets — the reference platform's Tailwind-CDN warning is session residue, not clone output). Totals unchanged (95/95 unit, 214/214 e2e, build 445.98 KB); sitemap regenerated byte-identical (R8 commit date == content-date — the documented one-generation lag did not trigger).
- `[SR-R10]` review round R10 (2026-10-20): full validation round — **zero findings of severity, the second consecutive** (`docs/remediation-plan-aurelia-r10.md`). R9's next-round checks closed (CI on `aac02c0` GREEN via the check-runs API, run 39358821312; Google Fonts watch unchanged LOW); the live sweep re-verified **every R2–R9 regression pin holds** (ground matrix 5 routes, copy pins, services pricing + add-ons, booking contract, gallery-filter click-through BRIDAL → 3 works, R8 featured-in band + CTA census matching the reference exactly, mobile-menu battery at 390×844 incl. theme-follow both directions with settled values, SEO surfaces + served artifacts, console cleanliness per the R9-F2 doctrine) and re-extracted the reference with **no drift since R9** (home/services/gallery/about/booking + platform-chrome login + operator-credential login verified live → redirect to `/`). One Informational record with a tooling fix (F1: fullPage captures stitch below-the-fold tiles before native `loading="lazy"` images decode — the gallery's last two works rendered caption-only in the R7 and pre-fix R10 captures while the live page loads all 12 (`naturalWidth` verified); `scripts/capture_aurelia_r10.mjs` ships a `settleLazyImages()` scroll-walk pass and the re-captured series 45–47 renders all works). Probe-method notes recorded: `aurelia.theme` is a plain-string storage value (JSON-shaped probes silently no-op to `system`); the CTA h2 census targets "Let's Create Together" by exact text. Totals unchanged (95/95 unit, 214/214 e2e, build 445.98 KB); sitemap regenerated byte-identical (R9 commit date == content-date — the lag did not trigger).
- `[SR-R12]` review round R12 (2026-10-20): full validation round — **zero findings of severity, the fourth consecutive** (`docs/remediation-plan-aurelia-r12.md`). No sandbox reset this round: the workspace sat at the R11 head (`a49205a`); `git pull` fast-forwarded one commit to `9b84e11` (docs-only session log, zero code paths), and the full e2e suite passed **214/214 on the first attempt** with the Playwright cache already at the pinned revision. R11's next-round checks CLOSED: **CI on the R11 head `a49205a` GREEN — run #11 verified live via the GitHub API** (the R11 rate-limit window cleared; run #12 on `9b84e11` also green — all 12 CI runs since R6 green); Google Fonts watch unchanged LOW; reference-drift re-extraction executed. The live sweep re-verified **every R2–R11 regression pin via a scripted 31/31-check battery** (ground matrix 5 routes, copy pins, services pricing + add-ons, booking contract, gallery-filter click-through, R8 featured-in band + CTA census, mobile-menu battery at 390×844 incl. portal-direct-child-of-body + 30px nav links + TRAP-4 + aria-current gold-ink + Escape/scroll-restore + theme-follow both directions, SEO surfaces + served artifacts, console hygiene) and re-extracted the reference with **no drift since R11** (all five routes + the per-select booking contract — 6 services + 5 time slots asserted as separate checks — + platform-chrome login + operator-credential login verified live → redirect to `/`; mobile menu 30px links + gold active). One Informational probe-method record (F1: the R12 reference probe now implements the R11 per-select doctrine natively — the R11-era probe still flattened all selects page-wide, re-observed live as a false 11-option FAIL). Totals unchanged (95/95 unit, 214/214 e2e, build 445.98 KB); sitemap regenerated byte-identical (content-date == today — the lag did not trigger); captures 51–53.
- `[SR-R11]` review round R11 (2026-10-20): full validation round — **zero findings of severity, the third consecutive** (`docs/remediation-plan-aurelia-r11.md`). The workspace had been reset to the R3 head; `git pull` restored the tree to `535fe95` (docs-only session log on top of R10's `8dcae88`), the Playwright browser cache was restored (`npx playwright install chromium`, the documented R4-F1 quirk), and the full e2e suite passed **214/214 on the first attempt**. R10's next-round checks: CI on `8dcae88` GREEN per the R10 session record (run 39361994646 — this round's independent API re-check rate-limited, R8/R9 precedent); Google Fonts watch unchanged LOW; reference-drift re-extraction executed. The live sweep re-verified **every R2–R10 regression pin via a scripted 31/31-check battery** (ground matrix 5 routes, copy pins, services pricing + add-ons, booking contract, gallery-filter click-through, R8 featured-in band + CTA census, mobile-menu battery at 390×844 incl. portal-direct-child-of-body + 30px nav links + TRAP-4 + aria-current gold-ink + Escape/scroll-restore + theme-follow both directions, SEO surfaces + served artifacts, console hygiene) and re-extracted the reference with **no drift since R10** (all five routes + booking contract incl. the per-select service census + platform-chrome login + operator-credential login verified live → redirect to `/`; mobile menu 30px links + gold active). One Informational probe-method record (F1: census multi-select surfaces per select — the reference booking page ships service + time-slot selects; a page-wide option flatten misreads the contract). Totals unchanged (95/95 unit, 214/214 e2e, build 445.98 KB); sitemap regenerated byte-identical (content-date == today — the lag did not trigger); captures 48–50.
- `[CA]` ADR-002 extended with the containment-audit amendment (session 3 remediation): the DB can no longer silently materialize outside the repo root.
- `[SYN]` Design-token doctrine locked to **measured sRGB hex pins** after two 1-unit hsl→rgb drift defects (light `#f5f3ef`, dark `#13110f`) were caught by the computed-style parity gate.

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

This PAD is the single source of truth for the Aurelia Nail Artistry SPA — a production-grade, visually verified clone (functional superset) of `aurelia-nail-artistry-demo.base44.app`. It exists so that an engineer (or agent) can understand, extend, debug, or replicate the system **without re-deriving the decision history**.

How to use it:

- **New engineer/agent:** read §2 → §3 → `AGENTS.md`, then run the Quick Start in `README.md`.
- **Debugging a visual regression:** start at §5 (Design System) and the trap pins in `src/index.css`; the parity gate contract is §7.
- **Reviewing a tech choice:** every choice is an ADR in §1.3; the reference-evidence base is `docs/reference-investigation.md`.

The reference observation was performed under the replicate-web-app methodology with evidence labels (`Verified` / `Reasoned` / `Assumed` / `Unknown`); the clone's parity targets and the deviations ledger both trace back to that document.

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
|---|---|---|---|
| UI runtime | React | 19.3.1 | Function components + hooks only; no class components, no `forwardRef` |
| Language | TypeScript (strict) | 5.9.3 | `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax` |
| Build | Vite | 7.3.7 | Fast dev server; the SPA ships as a **single HTML file** (ADR-003) |
| Single-file plugin | vite-plugin-singlefile | 2.3.4 | Inlines JS+CSS into `dist/index.html` (~446 KB / ~118.4 KB gzip) |
| Styling | Tailwind CSS (CSS-first) | 4.3.3 | v4 `@theme inline` + `@custom-variant`; **no `tailwind.config.js`** (ADR-004) |
| Routing | Custom history router | — (~107 LOC) | Zero-dep `pushState` router with case-insensitive route matching (ADR-006) |
| State | React Context + localStorage | — | `aurelia:v1` namespaced store: session, bookings, theme, toasts (ADR-001) |
| Icons | lucide-react | 1.59.0 | Tree-shaken inline SVGs |
| Unit tests | Vitest | 4.1.12 | Node env; pure-seam coverage (booking, theme, password, seo, db-path) |
| E2E tests | Playwright | 1.64.1 | Two projects (Desktop Chrome + iPhone 14 on chromium engine); runs against `vite preview` |
| DB tooling | `node:sqlite` (stdlib) | Node ≥ 22.5 | Zero-dependency materialization of the ADR-002 `DATABASE_URL` contract |
| Lint | ESLint (flat config) + typescript-eslint | 9.39.5 / 8.71.2 | `eslint.config.js`; react-hooks + react-refresh rules |

Versions are read from `package.json` (lockfile-pinned via `package-lock.json`). There is no Prisma, no ORM, no server framework, and no CSS preprocessor by deliberate decision (ADR-001).

### 1.3 Architecture Decision Records

**ADR-001: Zero-server SPA — all runtime state lives in `localStorage`**

- **Context:** The reference is a Base44 demo whose only persistence is platform-level; the clone must run on any static host with no backend, no env-var secrets, and no running processes. Booking requests and accounts must still demo end-to-end (create → persist → review → cancel).
- **Decision:** The SPA is browser-only. Session state, booking requests, and registered users live in a namespaced `localStorage` store (`aurelia:v1`, `src/lib/store.tsx` + `src/lib/storage-key.ts`). `DATABASE_URL` remains a **tooling-only** contract: `scripts/db-setup.mjs` materializes a real SQLite file so operators/CI can prove the data contract, but nothing in the runtime bundle reads it.
- **Rationale:** Matches the deployment surface (static hosting), keeps the attack surface at zero (no server, no DB credentials), and mirrors the reference's observable behavior. Prisma was explicitly rejected — a server-side ORM implies a runtime the target hosting model does not have (evidence: `scripts/db-setup.mjs` header, `src/types.ts`, `tests/db-scripts.test.ts`).
- **Consequences:** (+) Anywhere-static deployment; no infra spend; trivial offline demo. (−) Data is per-browser and cleared with site data; the admin surface is honestly labelled "Demo surface — requests persist in this browser's local store only."
- **Alternatives rejected:** Prisma + SQLite server (requires a process); Supabase/Firebase (external dependency + keys, breaks the zero-server constraint); in-memory only (loses the persistence the reference demonstrates).

**ADR-002: `DATABASE_URL="file:../db/custom.db"` — schema-relative resolution with containment audit**

- **Context:** The operator contract fixes the database at `<repoRoot>/db/custom.db` while keeping `db/` gitignored (binaries). The URL must resolve identically no matter the caller's working directory (npm scripts, tests, CI).
- **Decision:** `DATABASE_URL` is **schema-relative**: it resolves the way the Prisma CLI does against a `prisma/` directory at the repo root, so `file:../db/custom.db` → `<repoRoot>/db/custom.db`. The resolver (`src/lib/db-path.ts`, mirrored in `scripts/db-setup.mjs`) anchors relative URLs to the repo root, **clamps** excess `..` segments (relative URLs can never escape the repo root — structural guarantee), and a **containment audit** hard-fails any relative URL that would resolve outside the repo root while allowing absolute URLs as explicit overrides (CI temp workspaces) with a prominent stderr notice. The `db/` directory stays git-tracked via a `catalog.json` marker; `*.db`/`*.db-journal` are gitignored.
- **Rationale:** An earlier sandbox run had an ambient `DATABASE_URL` (absolute, pointing outside the repo) silently redirect materialization into a parent workspace — the guard makes that failure class loud instead of silent, without breaking legitimate absolute-override usage pinned by the test harness (`tests/db-scripts.test.ts`).
- **Consequences:** (+) Deterministic, CWD-independent resolution; misconfiguration fails fast with an actionable message; test harness keeps its absolute-override escape hatch. (−) Two resolvers (TS mirror + mjs mirror) must stay in sync — pinned by `tests/db-path.test.ts` and `tests/db-scripts.test.ts`.
- **Alternatives rejected:** CWD-relative resolution (breaks under npm subdirs and CI workspaces); forcing `db/custom.db` absolute (not portable); silently following ambient env (the defect this ADR amends).

**ADR-003: Single-file production build (`vite-plugin-singlefile`)**

- **Context:** The deliverable must deploy to any static host (including sandboxed preview hosts) with zero asset pipeline at the edge, and the e2e suite must test **exactly what ships**.
- **Decision:** `vite build` inlines all JS and CSS into one `dist/index.html` (~446 KB, ~118.4 KB gzip at the R7 feature set, no external chunk requests). The e2e suite runs against `vite preview` of that artifact, never against the dev server.
- **Rationale:** Removes the last class of "works in dev, differs in prod" drift for a no-backend app; makes deployment a single-file copy.
- **Consequences:** (+) Trivial deploys; e2e fidelity. (−) No HTTP-level code splitting (irrelevant at this size); every change requires a rebuild before e2e.
- **Alternatives rejected:** Standard multi-chunk build (deploy complexity without benefit here); SSR frameworks (violates ADR-001).

**ADR-004: Tailwind v4 CSS-first tokens — measured hex pins + class-based dark variant**

- **Context:** The project pins Tailwind 4.1.17, whose engine rewrite changes several v3 assumptions (documented in `docs/Tailwind-V4-Validation-Report.md`: `space-y-*` → zero-specificity `:where()`, bare-HSL transparency, oklch/oklab drift, shadow-scale shift, `@media (hover:hover)` gating). Visual parity with a measured reference is a hard requirement.
- **Decision:** All design tokens live in `src/index.css` as `:root`/`.dark` CSS custom properties surfaced to utilities via `@theme inline`. Token colors that parity tests assert are written as **measured sRGB hex literals** (`#f5f3ef` light ground, `#13110f` dark ground, `#1a1a1a` bands) because hsl→rgb conversion drifts 1 unit per engine. Dark mode uses the class strategy `@custom-variant dark (&:where(.dark, .dark *))` with semantic tokens flipping under `.dark`. Static hero tokens (`--hero-*`) deliberately never flip (photography treatment).
- **Rationale:** Two 1-unit color-drift defects were caught by the computed-style parity gate — hex pins make the asserted values engine-independent. The `@theme inline` + CSS-variable pattern is what makes `text-foreground`/`bg-background` flip under `.dark` without component changes.
- **Consequences:** (+) Engine-stable parity; components consume semantics only. (−) Raw hex is less self-describing than hsl — each pin carries a comment with its measured rgb triple; CSS block comments must never contain `*/`-forming sequences like `bg-*/text-*` (a header comment of that shape once terminated the comment early and silently swallowed the `:root` block in the production build).
- **Alternatives rejected:** JS-config theme (v4 CSS-first is the framework direction); oklch token pipeline (introduces the drift class the pins eliminate).

**ADR-005: Portal-rendered mobile menu with focus trap and gap-based spacing**

- **Context:** The user-flagged Tailwind v4 mobile-nav bug class: inside a `space-y-*` panel, v4's zero-specificity `:where()` selector no longer overrides a child's explicit `mt-*`, changing the layout the v3 engine produced. Additionally, a `backdrop-filter` on an ancestor creates a containing block that clips `position: fixed` descendants.
- **Decision:** The mobile menu is a `createPortal(document.body)` overlay (`role="dialog"`, `aria-modal`, labelled "Site menu") with: a focus trap + Escape handling + background scroll lock; **gap-based flex spacing instead of any `space-y-*` + `mt-*` combination** (trap 4 pin); no `backdrop-filter` ancestor (trap 5 pin); focus moves in on open and returns to the opener on close.
- **Rationale:** Eliminates both engine-trap classes structurally rather than by CSS overrides, and satisfies the a11y contract (dialog semantics, trapped focus, Escape) verified by the dedicated `tests/e2e/mobile-navigation.spec.ts` regression pin.
- **Consequences:** (+) Layout is engine-version-stable; a11y-correct; e2e-pinned. (−) Portal content is outside the header's DOM tree (event propagation to header handlers is intentionally severed).
- **Alternatives rejected:** In-place overlay inside `<header>` (backdrop-filter trap); `space-y` with stripped child margins (still engine-dependent — the pin requires the structural fix).

**ADR-006: Custom history router + hashed-credential auth store**

- **Context:** The app needs client-side routing and demo authentication with no server. React Router was available in the ecosystem but the scaffold's custom router already covers the route matrix with case-insensitive matching observed on the reference (`/Home`, `/Gallery` hrefs normalize).
- **Decision:** `src/lib/router.tsx` implements a `pushState`/`popstate` router (~107 LOC) exposing `useRouter()` (`path`, `navigate`) and a case-insensitive `matchPath`. Auth uses salted WebCrypto SHA-256 digests (`s1$<32-hex-salt>$<64-hex-digest>` of `salt:password`) in `src/lib/password.ts`; legacy plaintext records verify then upgrade on login. Sessions are `sessionUserId` pointers into the users array — no tokens, no cookies.
- **Rationale:** Zero dependencies for two small seams; digest format is unit-pinned (`tests/password.test.ts`) including **demo-seed verification** (a fabricated seed digest once shipped and silently broke demo sign-in — the seed-integrity test now prevents that class).
- **Consequences:** (+) Tiny, auditable, dependency-free. (−) Demo-grade security posture only — acceptable because credentials never leave the browser and the store is local (§6 documents the boundary).
- **Alternatives rejected:** React Router (dependency weight for 9 routes); real JWT/cookie auth (needs a server, violates ADR-001).

---

## 2. High-Level System Topology

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Browser (any static host serves dist/index.html — one file, no chunks)    │
│                                                                           │
│  ┌───────────────────────── React 19 SPA ─────────────────────────────┐   │
│  │  Router (history API) → Pages (9 routes) → Chrome (header/menu/    │   │
│  │  footer) → Context Store (session · bookings · theme · toasts)     │   │
│  │        │                                    │                       │   │
│  │        ▼                                    ▼                       │   │
│  │  HeadManager (per-route                       localStorage          │   │
│  │  title/OG/JSON-LD contract)                   aurelia:v1            │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Fonts: Google Fonts (Cormorant Garamond · Inter, display=swap)           │
│  Images: /images/* — 15 independently generated editorial assets          │
└───────────────────────────────────────────────────────────────────────────┘
        ▲                                                     ▲
        │ build (vite + singlefile)                           │ tooling (Node ≥ 22.5)
┌───────┴────────────────────────────┐   ┌──────────────────────┴────────────┐
│ Build: npm run build               │   │ scripts/db-setup.mjs (node:sqlite)│
│  prebuild → generate-sitemap.mjs   │   │  → db/custom.db (SQLite, seeded)  │
│  vite build → dist/index.html      │   │ scripts/generate-sitemap.mjs      │
└────────────────────────────────────┘   │  → public/sitemap.xml, robots.txt │
                                         └───────────────────────────────────┘
External services: none at runtime. Google Fonts is the only cross-origin
request; everything else is same-origin static assets.
```

Scaling characteristics: the artifact is fully static — CDN-cacheable, immutable-per-build, no horizontal-scaling story needed. The only runtime constraint is the browser (React 19 targets evergreen browsers; `localStorage` availability degrades gracefully to session-only in private modes).

---

## 3. Application Architecture

### 3.1 The Layer Model

```
Layer 0: Tokens & primitives — src/index.css, src/utils/cn.ts.
         Rule: CSS custom properties only; components never hardcode colors.

Layer 1: Domain & data — src/types.ts, src/data/studio.ts.
         Rule: studio.ts is the ONLY catalog source; everything else imports
         from it. Demo-user records carry password DIGESTS, never plaintext.

Layer 2: Pure domain seams — src/lib/booking.ts, src/lib/password.ts,
         src/lib/seo.ts, src/lib/db-path.ts, src/lib/theme.ts.
         Rule: pure functions, no React, no DOM (except theme/password DOM
         touch points behind explicit APIs); every seam is unit-pinned.

Layer 3: State & services — src/lib/store.tsx (Context), src/lib/router.tsx.
         Rule: the store is the single writer to the persisted namespace;
         router owns history; pages never touch window.history directly.

Layer 4: Chrome & pages — src/components/*.tsx, src/pages/*.tsx.
         Rule: consume semantic tokens and store hooks only; layout-critical
         structures (mobile menu) follow the ADR-005 structural pins.
```

**The Golden Rule:** dependencies point downward only (pages → store → seams → data/tokens). A Layer-2 module must never import from Layer 4 — this is what keeps the seams unit-testable in a bare Node env.

### 3.2 Annotated Directory Structure

```text
src/
├── index.css               ← Layer 0: token blocks (:root/.dark), @theme inline,
│                              base styles, trap-log pins (annotated in place)
├── main.tsx                ← entry: createRoot → App
├── App.tsx                 ← HeadManager + StoreProvider + RouterProvider + Routes switch
├── types.ts                ← Layer 1: Service, GalleryWork, TimeSlot, User,
│                              BookingRequest, ThemeMode, BookingStatus
├── utils/cn.ts             ← clsx + tailwind-merge helper
├── data/
│   └── studio.ts           ← STUDIO info · SERVICES (6) · GALLERY_WORKS (12) ·
│                              TIME_SLOTS (5) · NAV_LINKS · DEMO_USERS (digests)
├── lib/
│   ├── router.tsx          ← Layer 3: pushState/popstate router, matchPath (case-insensitive)
│   ├── store.tsx           ← Layer 3: persisted state, auth (login/register/logout),
│   │                          bookings (create/cancel/status), toasts, seed-on-mount
│   ├── booking.ts          ← Layer 2: validateBooking (pure), isClosedDay, todayIso, slot whitelist
│   ├── password.ts         ← Layer 2: s1$ digest hash/verify + legacy upgrade path
│   ├── seo.ts              ← Layer 2: per-route title/description/OG map (unit-pinned)
│   ├── theme.ts            ← Layer 2: theme resolution + <html> class application
│   ├── db-path.ts          ← Layer 2: ADR-002 resolver (TS mirror of the mjs rules)
│   ├── storage-key.ts      ← namespace constant (aurelia:v1)
│   └── booking.test.ts     ← seam unit tests colocated with the seam
├── components/
│   ├── chrome.tsx          ← Header (transparent-over-hero → solid), ThemeToggle,
│   │                          MobileMenu (portal + focus trap), Footer, PageShell, Toasts
│   └── head-manager.tsx    ← applies the SEO contract on every route change
└── pages/
    ├── home.tsx            ← hero / portfolio teaser / philosophy / experience / CTA bands
    ├── gallery.tsx         ← 12-work visual grid (category labels, hover overlay + touch captions)
    ├── services.tsx        ← 6 services with durations (no prices — reference parity) + 3 policy cards
    ├── about.tsx           ← founder story, values (Precision/Passion/Excellence), studio block
    ├── booking.tsx         ← form → validation → confirmation state machine (data-booking-* hooks)
    ├── auth.tsx            ← AuthCard (signin/register/reset) with reference copy
    ├── account.tsx         ← profile + user bookings with cancel
    ├── admin.tsx           ← AdminBookingsPage (role-gated) with status workflow
    └── not-found.tsx       ← 404
tests/
├── *.test.ts               ← node-env unit suites (seams + tooling contracts)
└── e2e/*.spec.ts           ← 10 Playwright specs (see §7)
scripts/
├── db-setup.mjs            ← ADR-002 materialization + containment audit + seed projection
└── generate-sitemap.mjs    ← sitemap/robots projection from the route map
```

### 3.3 Critical Code Patterns

**Pattern 1 — the persisted store with seed-on-mount (Layer 3).**

```tsx
const [state, setState] = useState<PersistedState>(seedState); // sync first paint
const [ready, setReady] = useState(false);
useEffect(() => { setState(loadState()); setReady(true); }, []);   // hydrate
useEffect(() => {
  if (!ready) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* private-mode persistence failure is non-fatal */ }
}, [state, ready]);
```

*Why:* the synchronous `seedState` initial value guarantees a coherent first render (no hydration flicker), while the `ready` flag prevents the seed from being persisted over the real stored state. The try/catch encodes the private-mode contract pinned by e2e.

**Pattern 2 — the pure booking seam (Layer 2).**

```ts
export function validateBooking(
  input: BookingInput,
  options: { today?: string; knownServices?: readonly string[] } = {},
): Partial<Record<BookingField, string>> { /* pure rule checks */ }
```

*Why:* all domain rules (future dates, closed Sun/Mon, slot whitelist, email/phone shape) are pure and injectable (`today`, `knownServices`), so the unit suite tests real calendar logic deterministically and the page component only wires UI state. Native HTML5 validation covers required-field UX; custom validation covers the richer rules the reference leaves to the browser (the booking date input deliberately has **no** `min` attribute so the custom "Choose a date in the future." message is reachable — pinned by e2e).

**Pattern 3 — the portal mobile menu with structural trap pins (Layer 4).**

```tsx
return createPortal(
  <div role="dialog" aria-modal="true" aria-label="Site menu"
       className="fixed inset-0 z-(--z-overlay) flex flex-col bg-background text-foreground">
    <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-8 px-8 pb-24">
      {NAV_LINKS.map((link) => <Link key={link.label} href={link.href} onClick={onClose} … />)}
    </nav>
  </div>, document.body);
```

*Why:* `gap-8` instead of `space-y-*` + child `mt-*` (v4 specificity trap), portal to `body` (backdrop-filter containing-block trap), dialog semantics + focus trap (a11y contract). The structure — not a CSS override — is the pin; `tests/e2e/mobile-navigation.spec.ts` asserts the computed spacing so a regression cannot land silently.

**Pattern 4 — head ownership per route (SEO contract).**

```tsx
// App.tsx — Head ownership sits inside the RouterProvider so every route
// change (push/replace/popstate) re-runs the head contract.
<RouterProvider>
  <HeadManager />
  <StoreProvider>…</StoreProvider>
</RouterProvider>
```

*Why:* a single owner applies title/description/OG/JSON-LD from the `seo.ts` map on every navigation; the static head in `index.html` is the fallback for first paint. `tests/e2e/seo-head.spec.ts` asserts both the direct-load and SPA-navigation paths.

**Pattern 5 — schema-relative DB resolution mirrored twice, pinned thrice (ADR-002).**

```mjs
function targetFile(url) {
  const resolved = resolveDbPath(url);           // prisma/ anchor + clamp
  if (isAbsolute(resolved)) return resolved;
  return join(ROOT, resolved);                   // repo-root anchored
}
auditContainment(url, file);                     // loud failure on escape
```

*Why:* the resolution rules exist in both `src/lib/db-path.ts` (TS, docs/admin copy) and `scripts/db-setup.mjs` (executor); the drift risk is neutralized by `tests/db-path.test.ts` (rules), `tests/db-scripts.test.ts` (real-script execution + containment pins), and the `.env`/`.env.example` contract test.

---

## 4. Data Architecture

### 4.1 Runtime Persistence (browser)

The SPA persists to `localStorage` under the `aurelia:v1` namespace as one JSON document:

| Field | Type | Contents |
|---|---|---|
| `users` | `User[]` | id, email (normalized lowercase), name, role (`admin` \| `customer`), `passwordHash` (s1$ digest — **never plaintext**) |
| `sessionUserId` | `string \| null` | pointer into `users`; the entire session model |
| `bookings` | `BookingRequest[]` | id (`bk-<ts>-<rand>`), name, email, phone, serviceId, date (ISO), timeSlot, notes, userId, status (`received` \| `confirmed` \| `cancelled`), createdAt |
| `theme` | stored separately under `aurelia.theme` | `light` \| `dark` \| `system` — `system` is the fresh-profile initial mode (OS-following); the first toggle interaction pins an explicit `light`/`dark` (two-state contract, R2-01). A pre-paint head script resolves the same contract before first paint and tints `meta[name=theme-color]` in the same pass (R4-03); `applyTheme` keeps the meta synced on every transition. |

Seeded on first run from `src/data/studio.ts` (services catalog is compile-time; only users/bookings persist). Duplicate-registration is rejected on normalized email equality.

### 4.2 Tooling Database (SQLite, ADR-002)

`npm run db:setup` materializes `db/custom.db` via `node:sqlite` (zero deps, Node ≥ 22.5):

```mermaid
erDiagram
    services ||--o{ booking_requests : "service_id"
    users ||--o{ booking_requests : "user_id"
    services { TEXT id PK  TEXT name  TEXT description  INTEGER duration_min  TEXT category }
    gallery_works { TEXT id PK  TEXT name  TEXT category  TEXT image  INTEGER featured_order }
    users { TEXT id PK  TEXT email UNIQUE  TEXT name  TEXT role  TEXT password_hash }
    booking_requests { TEXT id PK  TEXT name  TEXT email  TEXT phone  TEXT service_id  TEXT date  TEXT time_slot  TEXT notes  TEXT user_id  TEXT status  TEXT created_at }
```

Seed counts are cross-checked against the true `studio.ts` import by `tests/db-scripts.test.ts` (extraction drift fails CI, not production). Password digests are inserted as-is and never logged. The schema is `CREATE TABLE IF NOT EXISTS` — idempotent re-runs are safe.

### 4.3 Persistence Strategy

- **Runtime:** write-through JSON on every state change (debounce unnecessary at this scale); private-mode `localStorage` rejection is caught and degrades to session-only (pinned by e2e).
- **Tooling:** `INSERT OR REPLACE` seed semantics; `BEGIN`/`COMMIT` transaction with rollback on error; the DB file is disposable (`db:setup` rebuilds it).
- **Migration policy:** none at runtime (schema versioned by the namespace constant; a breaking change bumps `aurelia:v1` → `aurelia:v2` and re-seeds).

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Typeface | Usage rule |
|---|---|---|
| Display | **Cormorant Garamond** (400) | Hero h1 (128px on desktop reference scale), section h2s, mobile menu links, numerals in editorial contexts. Georgia/Times fallback. |
| Body/UI | **Inter** | Body copy, nav eyebrows (uppercase, letterspaced), forms, buttons, footer. system-ui fallback. |
| Eyebrow | Inter, uppercase, tracked | `.eyebrow` utility — section kickers and micro-labels. |

Fonts load via Google Fonts `display=swap`; fallbacks are metric-declared in `@theme inline`. Parity asserts **families**, not pixel metrics (font-swap drift is acceptable; family drift is not).

### 5.2 Color Tokens (semantic, hex-pinned where asserted)

| Token | Light | Dark | Usage / contrast note |
|---|---|---|---|
| `--background` | `#f5f3ef` (measured rgb 245,243,239) | `#13110f` (rgb 19,17,15) | Page ground. Hex pins — hsl rendering drifts 1 unit. |
| `--foreground` | `hsl(30 8% 12%)` | `hsl(40 33% 95%)` | Body ink; >12:1 on ground in both themes. |
| `--surface` / `--surface-raised` | `hsl(40 30% 92%)` / `hsl(40 25% 98%)` | `hsl(30 9% 11%)` / `hsl(30 8% 14%)` | Cards, confirmation panel. |
| `--muted-foreground` | `hsl(30 6% 40%)` | `hsl(40 12% 66%)` | Secondary copy (≥4.5:1 on ground). |
| `--hairline` | `hsl(30 10% 87%)` | `hsl(40 33% 95% / 0.14)` | Borders, dividers. |
| `--gold` | `hsl(36 41% 62%)` | `hsl(38 44% 66%)` | **Hover/borders only** — fails WCAG AA at eyebrow sizes on cream; static gold text is forbidden (contrast sweep remediation). |
| `--band` / `--band-foreground` / `--band-muted` | `#1a1a1a` / white / white 80% | `#f5f3ef` / `#13110f` / `#13110f` 70% | Editorial inversion: dark bands in light mode, cream bands in dark mode. |
| `--hero-ink` / `--hero-pill*` | white / cream pill tokens — **static in both themes** | | Hero copy sits on photography; never flips. |

### 5.3 Component Primitives

No component library. Hand-rolled primitives in `chrome.tsx` (Header, ThemeToggle, MobileMenu, Footer, PageShell, Toasts) and per-page sections. `cn()` (clsx + tailwind-merge) governs conditional classes. Buttons: `eyebrow` uppercase + arrow glyph with hover translate; focus rings are visible (keyboard e2e). `ThemeToggle` is a **two-state light ↔ dark switch** (R2-01): every activation flips the RESOLVED theme (`nextThemeMode` seam, unit-pinned no-op impossibility invariant); fresh profiles start in OS-following `system` mode until the first click pins a choice; the pre-paint head script in `index.html` applies the same contract before first paint (`data-theme-applied`, e2e-pinned). `meta[name=theme-color]` follows the resolved theme (R4-03): the pre-paint script syncs it before first paint (the meta sits above the script), then `applyTheme` (theme.ts) syncs it on every toggle/OS-change — the mobile browser chrome never stays cream in dark mode.

### 5.4 Motion / Animation

Single entrance animation (`animate-fade-up` on the booking confirmation), color/opacity transitions on hover/focus, and the mobile-menu overlay (no slide animation — instant full-screen). `prefers-reduced-motion` disables the entrance animation via the base-layer media query.

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement |
|---|---|
| Passwords are never stored or logged in plaintext | `src/lib/password.ts` s1$ digest; `tests/password.test.ts` pins format + round-trip + "no plaintext in record"; db-setup comment doctrine (R5-01) |
| Demo seeds must hash-verify against documented passwords | `tests/password.test.ts` seed-integrity test (added after a fabricated digest silently broke demo sign-in) |
| No secrets in the repo | `.env` gitignored; `.env.example` is the committed template; `*.key`/`ssh-key.txt` gitignored; deploy keys live outside the repo per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` |
| DB binaries never committed | `db/*.db`, `db/*.db-journal` gitignored; `db/catalog.json` marker keeps the folder tracked |
| Ambient env cannot redirect the DB outside the repo | ADR-002 containment audit (`scripts/db-setup.mjs`) — relative-escape hard-fails, absolute override prints a notice |
| No inline event handlers / no `dangerouslySetInnerHTML` on user data | Codebase convention; JSON-LD blocks are static, generated from constants |

### 6.2 Authentication & Authorization

- **Session model:** `sessionUserId` pointer in the persisted store — login/logout are store mutations; no tokens, no cookies, nothing cross-origin.
- **Password storage:** `s1$<salt>$<sha256(salt:password)>`; constant-time hex comparison on verify; legacy plaintext records verify once and are upgraded to digests on successful login.
- **Authorization:** single role check — `AdminBookingsPage` gates on `user.role === "admin"` and renders a restriction notice otherwise; `/account` redirects anonymous visitors to a sign-in prompt. Both surfaces are e2e-pinned.

### 6.3 Threat Model (demo boundary)

| Vector | Mitigation | Residual risk (accepted) |
|---|---|---|
| Credential theft from local storage | Digests only; plaintext never persisted | Demo-grade — an attacker with local storage access owns the browser anyway |
| XSS → store exfiltration | React escaping; no `dangerouslySetInnerHTML` on user input; notes render as text | Standard React caveats |
| CSRF | N/A — no server, no cookies | None |
| Booking spam | Client-side validation only | Accepted: zero-server demo; the admin surface is labelled as local-only |

---

## 7. Testing Strategy

### 7.1 Test Distribution

| Category | Files | Tests | Location | Framework |
|---|---|---|---|---|
| Unit (node env) | 6 files | 69 | `tests/*.test.ts` + `src/lib/booking.test.ts` | Vitest 4.1 |
| E2E (production preview) | 10 specs | 162 | `tests/e2e/*.spec.ts` | Playwright 1.64 (chromium + iPhone-14 projects) |
| Total | 16 | **231** | — | — |

### 7.2 Test Patterns

- **Seam-first unit tests:** booking rules (injectable `today`), password contract **+ demo-seed integrity**, seo route map (titles, canonical/og:url split, **/home alias canonical, soft-404 robots**), db-path resolution, db-scripts (real subprocess execution against temp DBs), sitemap projection (**incl. the git-derived lastmod contract**).
- **Computed-style parity gate** (`visual-parity.spec.ts`): ground-truth assertions on stable selectors (h1 family/size, body bg, footer bg, button styles) — the gate that caught both hsl-drift defects. Family-level, not pixel-diff, so font swap doesn't flake.
- **Structural regression pins:** `mobile-navigation.spec.ts` pins the ADR-005 trap fixes (computed gap spacing, focus trap, Escape, link navigation); `dark-mode.spec.ts` pins the class flip, token values, persistence, and system-mode behavior; `a11y-smoke.spec.ts` runs axe on all public routes + landmark/label/keyboard structure.
- **Viewport-aware assertions:** desktop nav affordances (`Primary`) vs mobile menu (`Site menu` dialog) are asserted per project — the suite encodes the pattern rather than skipping mobile.

### 7.3 Coverage Thresholds

No numeric thresholds configured. The de-facto rule: **every Layer-2 seam and every tooling contract has a test** — new seams without tests fail review.

### 7.4 Pre-Push Checklist

1. `npm run verify` (typecheck → lint → unit → build) green
2. `npm run e2e` green (both projects)
3. `npm run db:setup` succeeds (containment audit passes)
4. New/changed contracts documented (PAD/AGENTS/README updated in the same change)

---

## 8. Build & Deployment

### 8.1 Production Build

```bash
npm run build    # prebuild: node scripts/generate-sitemap.mjs → vite build
```

Output: **`dist/index.html`** (~446 KB, ~118.4 KB gzip at the R7 feature set) — one file, no chunks, no service worker. Serve it from any static host; SPA fallback is unnecessary (single document). `public/*` (images, manifest, icons, sitemap, robots) deploys alongside.

### 8.2 Environment Variables

| Name | Required | Description | Default |
|---|---|---|---|
| `DATABASE_URL` | yes (tooling) | ADR-002 schema-relative URL; must resolve inside the repo root | `file:../db/custom.db` |
| `VITE_SITE_URL` | optional | Absolute origin baked into canonical/OG defaults and the generated sitemap | `http://localhost:4173` |

After changing `VITE_SITE_URL`: run `node scripts/generate-sitemap.mjs` and commit the refreshed `public/` artifacts.

### 8.3 Docker / CI

None configured — static hosting needs neither. The pre-push gate is the local `verify` + `e2e` chain (§7.4). Deployment notes: `docs/DEPLOYMENT.md`.

### 8.4 Git Delivery

Pushes go to `main` only (no feature branches) via the deploy-key wrapper: `docs/ssh_git_wrapper_v3.py` materializes the operator key as a 0600 temp file outside the repo, pushes `HEAD:refs/heads/main`, verifies the remote ref equals local HEAD, syncs `refs/remotes/origin/main`, and shreds temp material. Procedure: `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.

---

## 9. Developer Handbook

### 9.1 Local Setup

Minimal (SPA only): `npm install` → `npm run dev` (:5173).
Full: `cp .env.example .env` → `npm run db:setup` (Node ≥ 22.5) → `npm run build` → `npm run e2e`.

### 9.2 Common Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Sitemap generation + single-file production build |
| `npm run preview` | Serve dist/ on :4173 (what e2e targets) |
| `npm run verify` | typecheck → lint → unit → build (the local CI) |
| `npm run test` / `npm run test:watch` | Vitest unit suite |
| `npm run e2e` | Playwright suite (auto-starts its own preview server) |
| `npm run db:init` / `db:seed` / `db:setup` | Schema only / seed only / both (Node ≥ 22.5) |
| `npm run seo:generate` | Regenerate sitemap/robots from the route map |
| `npx playwright test <spec> --project=mobile` | One spec, one profile |

### 9.3 Code Style Rules

TypeScript strict + `erasableSyntaxOnly` (no enums/namespaces/parameter properties). ESLint flat config with react-hooks/react-refresh. Early returns, no default exports for components, `type`-only imports via `verbatimModuleSyntax`. Comments explain **why** and carry the trap-log pins.

### 9.4 Git Workflow

`main` only; atomic commits with conventional-style subjects; docs updated in the same commit as the contract they describe. Working tree must be clean before a wrapper push (rule: the wrapper pushes commits, not the tree).

---

## 10. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|---|---|---|---|
| LOW | `skills/` and `docs/session_*.md` carry the prior project's (HomeNest) session history | Context noise for agents exploring the repo | Kept deliberately (operator-uploaded history); new docs supersede |
| LOW | Google Fonts is a runtime cross-origin dependency | First-paint font swap on cold cache; offline demos show fallbacks | Accepted (`display=swap` + metric fallbacks); self-hosting is the future fix |
| LOW | No hosted CI | Gates run locally only | **Closed in R6** — `.github/workflows/ci.yml` runs verify + full e2e on push/PR to `main` |
| INFO | Dark mode is a designed superset (reference ships none) | None — documented deviation, e2e-pinned | Closed |

No CRITICAL/HIGH issues are open: the gate chain (typecheck, lint, 95/95 unit, 214/214 e2e) is green at the time of writing.

---

## 11. Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `src/components/chrome.tsx` | ~361 | Header/ThemeToggle/MobileMenu(portal+focus trap)/Footer/Toasts — where the v4 traps live |
| `src/pages/booking.tsx` | ~314 | Booking form → validation → confirmation state machine; `data-booking-*` e2e hooks |
| `scripts/db-setup.mjs` | ~298 | ADR-002 executor: resolve + containment audit + schema + seed projection |
| `src/data/studio.ts` | ~226 | The single catalog source (services, works, slots, nav, demo users) |
| `src/lib/store.tsx` | ~225 | Persisted store: auth, bookings, toasts (seed-on-mount pattern) |
| `src/index.css` | ~185 | Token blocks (hex pins), dark variant, `@theme inline`, trap pins |
| `src/pages/auth.tsx` | ~187 | AuthCard (signin/register/reset) with reference copy + post-auth redirect |
| `src/pages/home.tsx` | ~160 | Editorial landing: hero/portfolio/philosophy/experience/CTA |
| `tests/e2e/visual-parity.spec.ts` | ~156 | Computed-style parity gate (the color-drift catcher) |
| `tests/e2e/mobile-navigation.spec.ts` | ~149 | The user-flagged Tailwind v4 mobile-nav regression pin |
| `src/lib/booking.ts` | ~80 | Pure validation seam (future dates, closed days, slot whitelist) |
| `src/lib/password.ts` | ~80 | s1$ digest hash/verify + legacy upgrade |
| `src/lib/router.tsx` | ~107 | Custom history router + case-insensitive matchPath |

---

## 12. Glossary

| Term | Meaning |
|---|---|
| **Reference** | `aurelia-nail-artistry-demo.base44.app` — the observed original being cloned |
| **Verified / Assumed** | Evidence labels from `docs/reference-investigation.md` (directly observed vs stated decision) |
| **Superset** | Clone functionality beyond the reference (dark mode, accounts, admin surface) — all logged in the deviations ledger |
| **Trap log** | Annotated Tailwind v4 engine-trap fixes carried in `src/index.css` (see `docs/Tailwind-V4-Validation-Report.md`) |
| **s1$ digest** | `s1$<32-hex-salt>$<64-hex-sha256(salt:password)>` — the project's password record format |
| **Parity gate** | The computed-style e2e assertions that pin measured reference values on stable selectors |
| **Containment audit** | `scripts/db-setup.mjs` guard that fails loudly when a relative `DATABASE_URL` would escape the repo root |
| **ADR-002 anchor** | The virtual `prisma/` directory semantics: `file:../db/custom.db` resolves against `<repoRoot>/prisma/` → `<repoRoot>/db/custom.db` |
