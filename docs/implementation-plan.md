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
| Auth-page ground | Base44 **platform chrome**: white `rgb(255,255,255)` + system font stack (`ui-sans-serif, system-ui…`) on `/login` (all five studio routes are cream) — same chrome family as its 404 page and the excluded "Edit with Base44" badge | Studio design system on auth pages too: cream `#f5f3ef`, Cormorant/Inter, same tokens as every route | Platform chrome is not studio design (the reference itself doesn't style auth); the clone's real-accounts auth is a superset surface and stays visually coherent. Remeasured R5 (`remediation-plan-aurelia-r5.md` §3 R5-01) | Verified |
| Eyebrow geometry | 14px / 0.3em tracking / weight 400 (nav links 0.1em; measured live R6 — the R1 investigation had declared the px unmeasured, "Reasoned") | Same geometry as of R6 (`@utility eyebrow` retuned; nav uses explicit 0.1em classes) — before R6 the clone shipped 11px / 0.32em / 500 everywhere | The R1-era values were an approximation; the R6 computed-style census measured the reference and the utility was normalized. Session-1's contrast decision (static gold eyebrows → muted) predates the ledger and is formalized here: the reference's gold `#9C8B7A` text fails AA on cream (2.97:1); `--gold-ink` (5.29:1) now carries the AA text-state gold role. R6 (`remediation-plan-aurelia-r6.md` §3 R6-02) | Verified |
| Active-route state | Active nav item painted static gold text (desktop nav + mobile menu — fails AA at 14px on cream) | `aria-current="page"` + `--gold-ink` text (5.29:1 cream / 8.18:1 dark) — the reference's warm-accent intent with corrected contrast + programmatic semantics | The R1 interaction inventory verified the reference's active-state visual; the clone now ships an AA-compliant superset of it. R6 (`remediation-plan-aurelia-r6.md` §3 R6-04) | Verified |
| Services pricing + add-ons | Six services priced ($85/$150/$200+/$350/$120/$75) + an ENHANCEMENTS band with four priced add-ons (updated on the reference after R1 verified a price-free catalog) | Same catalog as of R6: prices verbatim on the six + the add-on band in the studio token system; the booking select stays six-and-price-free (reference contract) | Reference drift catch-up: the clone tracks the live reference. R6 (`remediation-plan-aurelia-r6.md` §3 R6-01) | Verified |
| Band anatomy | Philosophy band: rose `#D4A5A5` eyebrow, 48px quote with a rose accent span on "refined elegance", white/50 attribution | Same anatomy as of R6 via `--band-accent` (8.02:1/4.81:1) + `--band-faint` (white/60 normalized; 6.86:1/5.11:1) + `sm:text-5xl` quote | Rose passes AA on both band grounds (the reason it was adoptable where the gold text was not). Attribution alpha normalized 0.5→0.6 (imperceptible, single faint level). R6 (`remediation-plan-aurelia-r6.md` §3 R6-03) | Verified |
| Hero tagline + measured copy drift | Hero tagline re-measured 2026-10-20: "…Bespoke nail designs for the extraordinary." (R1 had Verified "…for the modern icon." — the demo was edited since); home experience paragraphs, gallery intro and philosophy attribution all re-extracted verbatim | Same strings as of R7 (`HERO.tagline`, `EXPERIENCE.paragraphs`, gallery intro, `PHILOSOPHY.attribution` = "— Aurelia Chen, Founder & Artist", em-dash prefix + comma; the reference also fixed its Voss/Chen bug to Chen upstream). Quote glyphs straight `"` (the reference's literal blockquote text) | Second reference-drift catch-up: the clone tracks the live reference; `tests/content-parity.test.ts` pins the measured strings. R7 (`remediation-plan-aurelia-r7.md` §3 R7-01/05/06/07) | Verified |
| Gallery category filters | Six working chips (All/Editorial/Bridal/Avant-Garde/Classic/Seasonal) between intro and grid; active white-on-`#1a1a1a`, inactive ink on transparent + faint border; state is in-memory only | Same behavior as of R7 as an accessible `aria-pressed` toggle group (`role="group"` labeled "Filter works by category") over clone tokens (`bg-band`/`border-hairline`); grid renders the filtered slice | Functional parity: the filters are the reference's own shipped functionality, not speculative scope. R7 (`remediation-plan-aurelia-r7.md` §3 R7-02) | Verified |
| Gallery categories: five-cycle | Categories cycle through FIVE values (Editorial, Bridal, Avant-Garde, Classic, **Seasonal**) across the 12 works | Same per-work map as of R7 (`WorkCategory` += `seasonal`; eight works re-categorized; db projection re-seeded; unit-pinned) | R1's "Reasoned" four-cycle inference missed Seasonal; the R7 live DOM census measured the true cycle. R7 (`remediation-plan-aurelia-r7.md` §3 R7-03) | Verified |
| About-page anatomy | "The Artist" eyebrow + 2-col bio (portrait + 2 paragraphs + in-column quote), 3-col stats (12+/5K+/50+), dark THE PHILOSOPHY band (rose eyebrow + 48px manifesto + rose "wearable art" span + white/60 paragraph), "What Guides Us" values (measured bodies), rewritten studio paragraph, AS FEATURED IN strip (Vogue/Elle/Harper's Bazaar/Allure/Glamour), "Let's Create Together" + "Book a Consultation" CTA | Same section order and copy as of R7 in the studio token system; founder portrait **independently generated** (IP boundary); band reuses the AA rose tokens | R7-04: R1's one-line About record could not discriminate drift vs build-time gap — the live extraction is the parity target either way. R7 (`remediation-plan-aurelia-r7.md` §3 R7-04) | Verified |
| About studio address/hours | The reference's About studio block has no address/hours lines (they live on its /booking info cards) | The clone keeps an address/hours line under the studio paragraph — data sourced from the reference's own `/booking` info cards (Verified R1) | Superset realism: verified data in the natural surface; no invented content | Reasoned |
| About featured-in/CTA anatomy + strip name color | Strip = centered hairline-bordered band (`border-y py-12` container-width, centered eyebrow, `justify-center items-center gap-12` names row, **uppercase DOM names** `VOGUE…`, Cormorant 24px/400 at ink/30 alpha — ≈2.2:1 AA fail); CTA = unboxed centered `max-w-3xl` block (h2 `md:text-4xl` 36px, 16px support, 96px band→h2 rhythm) | Same band/centering/casing/rhythm as of R8 in clone tokens (`border-y border-hairline py-12`, centered, `gap-12`, uppercase data, h2 `text-3xl md:text-4xl`, 16px centered support); strip names keep the AA-passing `text-ink-soft` and the eyebrow stays muted-foreground (both AA doctrine; the reference's gold eyebrow 2.97:1 and ink/30 names ≈2.2:1 both fail) | R8-01: R7's rebuild measured the copy and container but approximated the band/centering/casing anatomy; the R8 computed-style census completed the measurement. Color deltas are the settled R6-04 doctrine (match intent, correct the math). R8 (`remediation-plan-aurelia-r8.md` §3) | Verified |
| Gallery caption treatment | Captions render inside a hover-reveal overlay (`absolute inset-0 … opacity-0` + group-hover): 12px uppercase category above 20px serif white name — **invisible on touch devices** (no hover) | Captions always visible below each work (figcaption: 24px display name + 14px uppercase category, ink/muted tokens) — the standing `@media (hover:hover)` doctrine (AGENTS v4-trap 6: "never hide information behind hover alone") | Deliberate a11y superset since R1 (code-commented in `gallery.tsx`); formalized here per the R5-01 precedent so the deviation is discoverable. R8 (`remediation-plan-aurelia-r8.md` §3 R8-02) | Verified |

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
