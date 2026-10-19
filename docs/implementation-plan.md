# Implementation Plan — Aurelia Nail Artistry Clone ("luxury-nail-portfolio")

**Companion to:** `docs/reference-investigation.md` (evidence base)
**Method:** replicate-web-app v5.1 (Phases 3–6) + repo skills `clone-app-pat-pro` (computed-style
gate), `tdd` (seams-first), `react19-ts6-vite8-tailwindv4-mvp` + `tailwind-patterns` (Tailwind v4
discipline), `docs/Tailwind-V4-Validation-Report.md` (engine-trap log).

---

## 0. Definition of Ready — acceptance criteria

1. All five public routes (`/`, `/gallery`, `/services`, `/about`, `/booking`) render with
   visual parity to the reference at 1920×1080 and 390×844 (measured-token gate, not eyeball).
2. Booking form validates (HTML5 + explicit rules: date ≥ today, studio closed Sun/Mon) and
   produces the "Request Received" confirmation state identical in structure to the reference.
3. Auth (sign in / sign up / reset-request UX) works against the local store with hashed
   passwords; session survives reload; sign-out exists (superset — reference has none).
4. Mobile navigation: hamburger → full-screen overlay, focus-trapped, Escape closes, link click
   navigates + dismisses; pinned by `tests/e2e/mobile-navigation.spec.ts`.
5. Dark mode (superset): toggle + system default, persisted; all routes coherent in both themes.
6. Gates green: `npm run typecheck && npm run lint && npm run test && npm run build`.
7. vitest unit layer + Playwright e2e layer both present and passing (`npm test`, `npm run e2e`).
8. Delivery Bar: `npm run dev` serves the app; primary journey (land → services → booking →
   request received) completes end-to-end; direct navigation + refresh on every route works.

## 1. Stack Decision Record

### A. Stack fingerprint → clone stack

| Reference evidence | Clone decision |
|---|---|
| Base44-hosted React-family SPA, Google Fonts `@import` (Cormorant Garamond + Inter) | Keep the scaffold stack (dependency rule below): **Vite 7 + React 19 + TypeScript strict + Tailwind v4.1 CSS-first**. Self-host-equivalent font loading via Google Fonts `<link>` in `index.html` with system serif/sans fallbacks (the scaffold's offline-first doctrine; recorded in Deviations). |
| Per-route `document.title` map ("X \| Aurelia Nail Artistry") | Keep scaffold `seo.ts` + `HeadManager` seam; rewrite the route map for Aurelia. |
| No observable router/state libs at UI level | Keep scaffold's zero-dependency router (`src/lib/router.tsx`) + store pattern. |
| Native HTML5 validation on booking form | Match: native `required` + `type` semantics, plus explicit min-date/closed-day rules as a superset. |

**Sole-author rule (clone-app-pat-pro):** the foundation (tokens, layout, chrome, data, store) is
authored by one agent pass; route pages consume tokens and never redefine them.

### B. Entity → store mapping

The scaffold's ADR-001 stands: **zero-server SPA; runtime state in `localStorage`; `DATABASE_URL`
is the tooling contract materialized by `scripts/db-setup.mjs` (node:sqlite, zero deps) at
`<repoRoot>/db/custom.db`.** The user-mandated `.env` value `DATABASE_URL="file:../db/custom.db"`
is already the scaffold contract (`src/lib/db-path.ts`, pinned by `tests/db-path.test.ts`).

Entities (Aurelia domain, replacing catalog/cart/orders):

| Entity | Fields | Store |
|---|---|---|
| `Service` | id, name, slug, description, durationMin, category, order | seed data (read-only) |
| `GalleryItem` | id, name, category, image, order | seed data (read-only) |
| `BookingRequest` | id, name, email, phone, serviceId, date (ISO), timeSlot, notes, userId?, status, createdAt | localStorage via store; projected into SQLite by `db:setup` seed for tooling parity |
| `User` | id, email, name, role ("customer"\|"admin"), passwordHash (s1$ salted digest), theme? | localStorage via store (scaffold pattern, hashed at rest) |

### C. Auth strategy mapping

Reference auth = Base44 platform account with **no user-visible feature delta** (verified). The
clone ships its own explicit model (replicate-web-app Phase 4 rule): email/password with salted
WebCrypto digests (`src/lib/password.ts`, kept), session id in the persisted store, sign-in /
sign-up / reset-request UX mirroring the reference's three views, plus a sign-out + minimal
account surface as the **superset**. Server-side authorization is impossible in a zero-server
SPA — this is the scaffold's registered, documented limitation (PAD Security §); admin views are
gated client-side and clearly labeled demo-only. No reference credentials, cookies, or tokens are
reused anywhere.

### D. AI-feature stub policy

No AI features observed → none implemented. Nothing to stub. (Recorded so the gap is explicit.)

## 2. Deviations Ledger

| Area | Reference behavior | Clone behavior | Rationale | Confidence |
|---|---|---|---|---|
| Brand name | "Aurelia Nail Artistry" (demo) | Same brand, "portfolio concept" framing retained | Clone authorized as demo superset | Verified |
| Dark mode | Absent (verified) | Full dark theme + toggle, persisted, system-aware default | Operator requested dark capture; superset mandate | Assumed |
| Founder name | Inconsistent: hero quote "Aurelia Voss" vs About "Aurelia Chen" | Unified to **Aurelia Chen** everywhere | Reference bug; consistency is production-grade behavior | Assumed |
| Google sign-in button | Present (flow unexercised) | Not rendered — email/password only | Dead controls forbidden; no OAuth backend in a zero-server SPA | Reasoned |
| Booking persistence | Base44 backend entity | localStorage store + SQLite projection via db:setup | Scaffold ADR-001; observable UX contract preserved | Reasoned |
| Booking validation | Native required only | Native + date≥today + closed Sun/Mon + slot coherence | Superset; studio hours evidence (Tue–Sat 10–6) | Assumed |
| Account area | None (auth gates nothing) | `/account`: profile, my booking requests, sign out | Superset mandate; gives auth a real purpose | Assumed |
| Admin area | None | `/admin/bookings` (role-gated, demo-only) booking list | Superset mandate; reuses scaffold admin pattern minimally | Assumed |
| Imagery | Base44-hosted photography (proprietary) | **Independently generated** editorial nail-art images (AI-generated for this project, committed to `public/images/`) | IP boundary 6: no asset laundering | Verified |
| Legal/policy pages | None on reference | None added | Reference parity first; superset scope stays app-functional | Assumed |
| "Edit with Base44" badge | Floating platform badge | Excluded | Platform chrome, not design | Verified |
| Theme toggle cycle | n/a (no toggle on reference) | **Two-state light ↔ dark** — every activation flips the RESOLVED theme; fresh profiles start in OS-following `system` mode until the first interaction pins a choice; pre-paint head script applies the stored/OS theme before first paint | Remediation R2-01 (`docs/remediation-plan-aurelia-r2.md`): the shipped fixed-order cycle's first click was a visual no-op on light-OS machines, and the missing pre-paint application produced a light flash for dark users — both read as "switching doesn't work" | Verified |
| Copyright year | "© 2024" | "© 2025" | Production-grade currency | Assumed |
| Routes | `/Gallery` hrefs observed (case-insensitive router) | Canonical lowercase paths (`/gallery`…) | Clean URLs; reference normalizes anyway | Reasoned |
| PORTFOLIO nav item | href `/Home` (lands on home) | `/#portfolio` scroll-to-section on landing | Same observable outcome, explicit anchor | Reasoned |

## 3. Design tokens (measured → `@theme`)

CSS-first only (no `tailwind.config.js`). All colors full `hsl()`/`rgb()` literals (trap 1);
alpha baked into tokens, never `/NN` modifiers on custom tokens (oklab color-mix trap);
`@custom-variant hover (&:hover)` un-gating kept; **`@custom-variant dark (&:where(.dark,
.dark *))` added for class-based dark mode** (v4 requirement — tailwind-patterns gap note).

Light: bg `#F5F3EF` = `hsl(40 33% 95%)` measured `rgb(245,243,239)`; ink `hsl(30 8% 12%)`
(#1A1A1A family measured `rgb(26,26,26)`); muted ink `rgba(255,255,255,0.8)` on dark surfaces.
Fonts: `--font-display: "Cormorant Garamond", Georgia, serif`; `--font-sans: "Inter", system-ui,
…`. Shadows: v3-geometry pins carried from the trap log. Radii per scaffold. Z-scale per scaffold.

Dark theme (superset, designed from the light system): bg `hsl(30 10% 8%)`, surface
`hsl(30 9% 11%)`, ink `hsl(40 33% 95%)`, hairlines `hsl(40 20% 95% / 0.14)`, accent gold
`hsl(36 41% 62%)`. Semantic tokens flip under `.dark`; components consume semantics only.

## 4. Feature sequence (foundation sole-author → routes → states → polish)

1. `src/types.ts` — Aurelia domain types.
2. `src/data/studio.ts` — services (6, verbatim descriptions/durations), gallery items (12),
   time slots (5), studio info, nav links, demo users (digests only).
3. `src/index.css` — token block + dark variant + base + utilities (keep trap pins).
4. `src/lib/store.tsx` — rewrite: session/auth (scaffold password lib), bookings, theme, toasts.
5. `src/components/chrome.tsx` — Header (transparent-over-hero → solid on scroll), MobileMenu
   (portal + focus trap + Escape + scroll lock; **no `space-y-*` with `mt-*` children** — gap
   layout instead; trap 4), Footer, PageShell, Toasts.
6. `src/lib/seo.ts` + `HeadManager` + `index.html` — Aurelia titles/descriptions/OG; fonts.
7. Routes: Home (hero/portfolio/philosophy/experience/CTA), Gallery, Services, About, Booking,
   Auth (signin/signup/reset), Account, AdminBookings, NotFound.
8. Images: generate 14 editorial assets → `public/images/` (hero, studio, 12 works).
9. Tests: unit (booking seam, auth store, seo map, db-path, theme tokens) + e2e (smoke,
   mobile-navigation, booking-flow, auth, visual-parity, dark-mode, seo-head).
10. Tooling: `.env`, `db-setup.mjs` seed (services/bookings), sitemap script, manifest, robots.
11. Gates → dev server → agent-browser parity sweep → `docs/screenshots/`.

## 5. Test plan (seams-first, tdd skill)

**Seams (public, observable):** (1) booking validation + confirmation state machine; (2) auth
store contract (register/login/logout/upgrade); (3) route→meta map (SEO); (4) db-path resolution;
(5) mobile navigation behavior (e2e); (6) theme toggle persistence (e2e).

- Unit (vitest, node env): booking rules (closed days, past dates, slot list), password
  hash/verify roundtrip + legacy verify, seo map, db-path, catalog→SQLite projection counts.
- E2E (Playwright, chromium + iPhone-14 profile): smoke (5 routes render, titles),
  mobile-navigation (overlay open/focus-trap/Escape/link-nav), booking-flow (validation →
  success state), auth (register → logout → login), visual-parity (computed-style assertions on
  stable selectors: h1 font/size, body bg, footer bg, button styles — clone-app-pat-pro gate),
  dark-mode (toggle → `html.dark` → token flip), a11y-smoke (axe, kept from scaffold).

## 6. Risks & pre-mortem

| Risk | Mitigation |
|---|---|
| Tailwind v4 engine traps (space-y, shadows, oklab, hover gating) | Trap-log pins carried into `index.css`; class-form fixes; e2e computed-style assertions |
| Mobile menu regression (the user-flagged bug class) | Portal to body (backdrop-filter containing-block trap), focus trap, `inert` background, gap-based spacing, dedicated e2e spec |
| Font swap shifts metrics vs reference | Google Fonts link with `display=swap` + system fallbacks; parity gate asserts family, not pixel diff |
| Generated images inconsistent | One style prompt family (warm editorial macro), fixed seed discipline per batch, review pass |
| localStorage schema drift from scaffold keys | New `STORAGE_KEY` namespace (`aurelia:v1`), fresh seed |
| agentic scope creep | Acceptance criteria §0 fixed; Deviations Ledger is the only extension surface |

## 7. Delivery Bar plan

`npm run dev` on :5173 → agent-browser sweep (desktop + mobile, light + dark): every route,
mobile menu, booking journey, auth journey, direct refresh on nested routes, empty-notes
booking, long-string notes (coherence), failed localStorage (private-mode coherence). Screenshots
→ `docs/screenshots/`. Ledger records commands run + results.
