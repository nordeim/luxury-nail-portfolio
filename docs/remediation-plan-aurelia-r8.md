# Aurelia Nail Artistry — Validation & Remediation Plan (Round R8)

> **Status:** EXECUTED — all ToDo items closed in the same session (evidence in §6)
> **Round scope:** Post-delivery review round with the standing **sitemap/SEO** mandate (template reference: `nordeim/ecommerce-store` — `src/app/sitemap.ts` + `robots.ts`), plus the regular duties: workspace refresh → doc/status review (`session_8.md`, R7 plan, worklog) → alignment validation → codebase audit (R7 commits) → **CI verification on the R7 head (R7 §7 item ①)** → live parity sweep (mobile-menu deep-check, Tailwind v4 traps, full reference re-extraction) → versioned plan → TDD fixes → full gates → capture refresh → docs alignment (incl. `docs/DEPLOYMENT.md`) → single commit + push to `main`.
> **Reference site:** `https://aurelia-nail-artistry-demo.base44.app/` (probed live this round — all five routes + login re-extracted, booking contract re-checked, mobile menu re-probed at 390×844, featured-in/CTA computed-style census)
> **Prior rounds:** `docs/remediation-plan-aurelia-r1.md` (validation-only), `-r2.md` (theme remediation), `-r3.md` (sitemap/SEO hardening), `-r4.md` (canonical/robots/theme-color), `-r5.md` (R4 validation + auth-chrome deviation), `-r6.md` (reference-drift catch-up + typography normalization), `-r7.md` (copy drift catch-up + gallery filters + About rebuild). Versioned per the standing planning-docs mandate.
> **Exclusion (standing):** `skills/` excluded from typecheck/lint/unit tests — re-verified in place.

---

## 1. Executive Summary

The round began from `b068c7c` (the owner's `docs/session_8.md` commit) on top of `87f26aa` (R7) — the pull brought exactly those two commits and the tree was clean. The baseline was re-proven before any change: typecheck ✓ lint ✓ **95/95 unit** ✓ build **445.63 KB / gzip 118.43 kB** ✓ — byte-identical to the R7 ledger — and the **full e2e suite passed 212/212** after one documented infra excursion (the sandbox reset left a stale Playwright cache: chromium-1200 present, v1.64.1 needs headless-shell-1248; `npx playwright install chromium` restored it — same class as R4-F1/R6, procedure per `AGENTS.md`).

R7's flagged next-round checks closed immediately: **(①) the GitHub Actions run on the R7 head `87f26aa` is GREEN** (success, observed via the API; the follow-up session-log commit `b068c7c` also ran green — R7's rate-limited observation is now resolved) and **(②) captures 36–37 eyeballed clean** (gallery filter chip row + rebuilt About anatomy all rendering correctly). The standing **(③) Google Fonts cross-origin** watch item remains LOW and unchanged.

The audit (Mode C) of the R7 commits confirmed a coherent round: `87f26aa` = 23 files (code + tests + db data + captures + docs, matching its plan §4) and `b068c7c` = 1 docs-only file. `npm audit` 0 vulnerabilities; DOM-sink/secret/placeholder scans clean (the only `password` matches are the documented, test-pinned demo seeds). The standing sitemap/SEO mandate found **no drift**: the ecommerce-store template (`sitemap.ts` static routes + per-entity lastModified; allow-`/` robots with private disallows + sitemap pointer) is unchanged since R7, and the clone's generated artifacts (7 URLs, git-derived lastmod, private surfaces excluded AND meta-noindexed, soft-404 noindex verified live) remain template-parity-plus.

The live parity sweep then verified **every R2–R7 regression pin holds** — ground matrix (5 routes cream, h1 72/60/36), hero tagline, experience paragraphs, attribution, quote, services pricing + add-on band, booking contract (6 services / 5 slots / field types), gallery filters click-through (BRIDAL → exactly {Midnight Garden, Ivory Dreams, Rose Petal}), the five-cycle captions, and the full mobile-menu battery at 390×844 (portal dialog + aria-modal + "Site menu" + scroll-lock + 30px links + TRAP-4 `mt:0px` + aria-current + Escape/scroll-restore + theme-follow both directions with settled values: dark panel `rgb(19,17,15)`, active gold `rgb(206,178,130)`, theme-color `#13110f`). The reference itself has **not drifted since R7** — all copy re-extracted verbatim matches the R7 pins.

The sweep did surface **one real parity gap on R7's own new surfaces** plus two process findings:

1. **R8-01 (Medium): the About featured-in strip and CTA anatomy diverge from the measured reference.** The reference renders the featured-in strip as a **centered, hairline-bordered band** — `border-y border-[#e8e5df] py-12` spanning the content container (1184px at vw 1280), eyebrow "As Featured In" **centered**, names in a `flex flex-wrap justify-center items-center gap-12` row (48px gaps), names as **uppercase DOM text** (`VOGUE`, `ELLE`, `HARPER'S BAZAAR`, `ALLURE`, `GLAMOUR` — Cormorant Garamond 24px/400/tracking normal, ink at 30% alpha), and the CTA as an **unboxed, centered** block (`max-w-3xl mx-auto text-center`, h2 "Let's Create Together" `text-3xl md:text-4xl` = 36px at desktop with `mb-6`, 16px warm-umber/70 support line, dark ink button). The clone ships a plain `mt-24` section with a left-aligned `items-baseline gap-x-10 gap-y-4` strip of title-case names, and wraps the CTA in a bordered `bg-surface-raised p-10` box with a 30px h2 and 14px support. R7's rebuild measured the strip container (`max-w-7xl … mb-24`) but not the band/centering/casing anatomy — this round's computed-style census completes the measurement.
2. **R8-02 (Low, docs): the gallery caption-treatment deviation was never ledgered.** The reference reveals work captions in a hover overlay (`absolute inset-0 … opacity-0` + group-hover, 12px uppercase category + 20px serif white name) — invisible on touch; the clone shows captions below each work (24px name + 14px uppercase eyebrow, ink/muted) per the standing `@media (hover:hover)` doctrine ("never hide information behind hover alone"). The choice is code-commented (`gallery.tsx`) and pre-dates R6's trap pins but never made it into the deviations ledger; this round formalizes it per the R5-01 precedent.
3. **R8-03 (Informational): git-derived sitemap lastmod lags one commit generation by design.** The prebuild that generates `public/sitemap.xml` runs *before* the commit that then becomes the lastmod source, so a post-pull rebuild always regenerates the artifact with the newer HEAD date and leaves the tree dirty (observed this round: committed `2026-10-19` vs regenerated `2026-10-20` from `87f26aa`'s commit date). Deterministic and self-correcting at the next commit; documented in `AGENTS.md` tooling contracts and the regenerated artifact ships in this round's commit.

Remediation (TDD, regression-pinned): the featured-in data becomes the measured uppercase names; the About strip rebuilds to the bordered centered band (clone tokens: `border-y border-hairline py-12`, centered eyebrow, `justify-center items-center gap-12`, names keep the AA-passing `text-ink-soft` — the reference's ink/30 fails contrast at ~2.2:1, the settled R6-04 doctrine); the CTA unboxes to the centered `max-w-3xl` block with the `text-3xl md:text-4xl` h2, 16px centered support and centered `CtaLink`; unit + e2e pins updated RED-first; ledger rows for the strip/CTA color deviation and the caption treatment; the lastmod note lands in `AGENTS.md`.

## 2. Alignment Validation (docs ↔ codebase, post-pull)

| Check | Result |
|---|---|
| `git pull` fast-forward `87f26aa..b068c7c` (single commit: `docs/session_8.md` — the R7-round transcript; zero code drift) | ✓ clean, main only |
| Root docs (README, AGENTS, CLAUDE, PAD, SKILL) + `session_8.md` + R7 plan + `worklog.md` reviewed | ✓ |
| `.env` / `.env.example` / root `db/` (`custom.db` + `catalog.json`) contract — `DATABASE_URL="file:../db/custom.db"`, db at repo root; `.env.example` tracked, `.env` gitignored | ✓ intact (standing mandate re-verified, no change needed) |
| vitest + Playwright suite configs (`vitest.config.ts`, `playwright.config.ts`) present and green (95 unit node-env / 212 e2e × 2 projects vs `vite preview`) | ✓ intact (standing mandate re-verified) |
| `skills/` triple exclusion (tsconfig include / eslint globalIgnores / vitest include) | ✓ in place |
| R7 commits audit: `87f26aa` = 23 files (coherent TDD round), `b068c7c` = docs-only | ✓ |
| **CI check (R7 §7 ①):** GitHub Actions run on `87f26aa` → **success** (run 39346664055); `b068c7c` → success (run 39350394228) | ✓ closed |
| R7 §7 ②: captures 36–37 eyeballed (gallery chip row + About anatomy render correctly) | ✓ clean |
| Baseline gates: typecheck ✓ lint ✓ 95/95 unit ✓ build 445.63 KB ✓ e2e 212/212 (after documented browser-cache install) | ✓ §6 ledger |
| Post-build tree state: `public/sitemap.xml` regenerated with HEAD's commit date → one-generation lastmod drift observed (R8-03) | ✓ documented |

## 3. Audit Findings (Mode C) & Fixes

Severity counts: **0 Critical · 0 High · 1 Medium · 1 Low · 1 Informational.**

| # | Severity | Location | Description | Evidence | Fix | Confidence |
|---|---|---|---|---|---|---|
| R8-01 | Medium (content/parity) | `src/pages/about.tsx` (featured-in section + CTA section), `src/data/studio.ts` (`ABOUT.featuredIn`) | **R7's About strip/CTA anatomy diverges from the measured reference.** Featured-in: reference = `border-y border-[#e8e5df] py-12` band spanning the content container (1184px at vw1280), centered eyebrow (14px/4.2px), names `flex flex-wrap justify-center items-center gap-12` (48px), **uppercase DOM text** (`VOGUE`/`ELLE`/`HARPER'S BAZAAR`/`ALLURE`/`GLAMOUR`), Cormorant Garamond 24px/400/normal, ink 30% alpha (≈2.2:1 on cream — AA fail); clone = plain `mt-24` section, left eyebrow, `items-baseline gap-x-10 gap-y-4` strip (16/40px), title-case DOM text, AA-passing `text-ink-soft` `rgb(86,82,77)`. CTA: reference = unboxed centered `max-w-3xl mx-auto text-center`, h2 `text-3xl md:text-4xl` (36px desktop) `mb-6`, 16px support `rgba(61,43,31,0.7)`, centered ink button (p 20px 40px); clone = left-aligned `border border-hairline bg-surface-raised p-10` box, h2 `text-3xl` (30px), 14px support. Copy itself matches; geometry/casing/alignment do not | Live computed-style census 2026-10-20 (strip: jc center / ai center / gap 48px / bt+bb 1px / py 48px; names: span DOM `VOGUE`, Cormorant 24px/400, `rgba(26,26,26,0.3)`; CTA chain: `max-w-3xl mx-auto px-6 lg:px-12 text-center`, h2 36px/mb 24px, support 16px centered; clone probes: jc normal / ai baseline / gap 16px 40px / bt 0px; h2 30px `ta:start`; box bg `rgb(251,250,249)` p 40px) | Strip section → `mt-24 border-y border-hairline py-12` (spans the existing max-w-7xl container, matching the reference's container-width band); eyebrow → centered; strip → `justify-center items-center gap-12` (mt-8 kept — measured 32px eyebrow→names gap); `ABOUT.featuredIn` → measured uppercase names; CTA section → unbox to `max-w-3xl mx-auto text-center` (no border/bg), h2 → `text-3xl md:text-4xl` + `mb-6`, support → centered `text-base` (16px), `CtaLink` centered; name color **stays** `text-ink-soft` (reference ink/30 fails AA — ledger row); unit + e2e pins RED-first (uppercase names, band borders, centered strip, unboxed centered CTA, h2 36px) | Verified (casing/geometry/color/alignment all computed live) |
| R8-02 | Low (docs/ledger) | `docs/implementation-plan.md` §2 | **Gallery caption-treatment deviation never ledgered.** Reference: captions inside a hover-reveal overlay (`absolute inset-0 flex flex-col justify-end p-6 opacity-0` + group-hover) — category P (12px uppercase) above name H3 (20px serif white); captions invisible on touch devices. Clone: captions always visible below each image (figcaption: name span 24px display-ink + category span 14px uppercase muted) — the standing `@media (hover:hover)` doctrine (AGENTS v4-trap 6: "never hide information behind hover alone") and a deliberate a11y superset, code-commented in `gallery.tsx` but absent from the ledger since R1 | Live DOM census: reference caption container `opacity-0 gro…` with white 20px H3 + 12px P; clone static figcaption spans (24px/14px ink/muted); `AGENTS.md` trap 6; `docs/reference-investigation.md` §2 "Hover (visual only)" | Ledger row formalizing the deviation (treatment + internal anatomy deltas + doctrine rationale) — per the R5-01 precedent; no code change | Verified |
| R8-03 | Informational (tooling) | `public/sitemap.xml`, `AGENTS.md` §Tooling contracts | **Git-derived lastmod lags one commit generation by design.** `prebuild` regenerates the sitemap from the current HEAD's commit date; the commit that introduces the artifact then becomes the *next* lastmod source — so every post-pull rebuild marks the file dirty (observed: committed `2026-10-19` vs regenerated `2026-10-20` from `87f26aa`'s date; R7's "tree clean after builds" held pre-commit only) | `git diff public/sitemap.xml` after baseline build (lastmod-only delta, all 7 URLs) | Document the standing behavior in `AGENTS.md` (expected post-pull dirty state; regenerate + ship in the round's commit — no code change; the generator's git-derived design is intentional and pinned) | Verified |
| F1 | Informational | Probe tooling | **React same-tick eval race:** clicking a filter chip and reading the grid in the same eval returned the pre-render DOM (empty result sets) — the F1/F3 mount-gate discipline extends to post-click waits; re-probed with click → sleep → read and the result sets matched the reference exactly | Gallery click-through probes §5 | Recorded; probes keep one-action-one-eval with settles | Verified |

## 4. Remediation ToDo List (executed)

| ID | Task | Mode | Status |
|---|---|---|---|
| R8-T01 | Workspace refresh + docs/session_8.md / R7 plan / worklog review | — | ✓ |
| R8-T02 | Alignment validation (docs ↔ tree, env/db contract, vitest+Playwright configs, skills exclusion) + R7 §7 checks (CI on `87f26aa` GREEN; captures 36–37 eyeballed) | — | ✓ §2 |
| R8-T03 | Baseline gates on the pulled tree: typecheck/lint/95 unit/build 445.63 KB + full e2e 212/212 (browser-cache install excursion documented) | — | ✓ |
| R8-T04 | Standing sitemap/SEO audit vs the re-fetched `ecommerce-store` template (sitemap.ts + robots.ts) + live soft-404/canonical/JSON-LD verification | Mode C | ✓ no drift |
| R8-T05 | R2–R7-fix live regression verification (ground matrix, tagline/copy pins, services pricing + add-ons, booking contract, gallery filters click-through, five-cycle captions, mobile-menu battery + theme-follow, SEO surfaces) | — | ✓ §5 |
| R8-T06 | Live parity sweep vs the reference (all routes re-extracted → no copy drift; featured-in/CTA computed-style census → R8-01; caption-treatment census → R8-02; sitemap lastmod behavior → R8-03) | — | ✓ §5 |
| R8-T07 | TDD RED: unit pin (`MEASURED_ABOUT.featuredIn` uppercase) + e2e pins (bordered centered band, uppercase names, unboxed centered CTA with md 36px h2) — RED observed pre-fix | TDD | ✓ |
| R8-T08 | TDD GREEN: `studio.ts` (`featuredIn` uppercase); `about.tsx` (strip band + centering, CTA unbox + centering + type scale) | TDD | ✓ |
| R8-T09 | Ledger rows (`implementation-plan.md` §2): featured-in/CTA anatomy + AA color doctrine row; gallery caption-treatment row | Docs | ✓ |
| R8-T10 | Full gates re-run: typecheck/lint/unit/build + FULL e2e (both projects) + `npm audit` + security scans | — | ✓ §6 |
| R8-T11 | Capture refresh → `docs/screenshots/` r8 series (about light + dark — the changed surface; home light regression baseline) | — | ✓ |
| R8-T12 | Docs alignment (README, AGENTS incl. lastmod note, CLAUDE, PAD SR-R8, SKILL, DEPLOYMENT) | Docs | ✓ |
| R8-T13 | Versioned plan (this file) + single commit + push to `main` via `docs/ssh_git_wrapper_v3.py` (`--remote` explicit) | — | ✓ |

## 5. Reference & Parity Evidence (this round)

- **Reference drift status: NONE since R7.** Home (tagline, experience paragraphs, quote + attribution, portfolio quartet, footer), Services (six priced services + ENHANCEMENTS band + 3 policies), Gallery (intro, six chips, five-cycle categories), About (bio/quote/stats/band/values/studio/featured-in/CTA copy), Booking (6-service select, 5 slots, Location/Hours/Contact cards) — all re-extracted 2026-10-20 and matching the R7 pins verbatim. Login = platform chrome (white + system fonts + email/password + Google + Sign in + Forgot password) — R5-01 deviation stands.
- **Reference route ground matrix (live):** five studio routes cream `rgb(245,243,239)`; home h1 wordmark 128px, h2s 60/48/60/60 — matching the clone exactly.
- **Featured-in strip census (R8-01):** section `border-y border-[#e8e5df] py-12` (offsetWidth 1184 at vw 1280 — container-width band, not full-bleed); strip `flex flex-wrap justify-center items-center gap-12`; eyebrow "As Featured In" centered 14px/4.2px gold `rgb(156,139,122)` (AA fail — clone keeps muted per doctrine); names: `<span>` `VOGUE` DOM text, `"Cormorant Garamond", serif` 24px/400/normal, `rgba(26,26,26,0.3)` (≈2.2:1 AA fail — clone keeps `text-ink-soft` 5.5:1-class token).
- **CTA census (R8-01):** chain `min-h-screen pt-32 pb-24` → `max-w-3xl mx-auto px-6 lg:px-12 text-center` → h2 "Let's Create Together" (`font-serif text-3xl md:text-4xl` — 36px at desktop, `mb-6`, ink) → support 16px centered `rgba(61,43,31,0.7)` → button `rgb(26,26,26)`/white 14px p 20px 40px. No border, no background — the clone's bordered box was R7 approximation.
- **Caption-treatment census (R8-02):** reference card = `div.group.cursor-pointer.overflow-hidden` → hover overlay `absolute inset-0 flex flex-col justify-end p-6 opacity-0` → P category 12px uppercase + H3 name 20px serif white; items are non-links. Clone = `figure > IMG + figcaption(name 24px, category 14px uppercase)` static below image.
- **Clone regression battery (all R2–R7 pins hold, live):** ground matrix 5 routes cream + h1 72/60(inner/about)/36(login); tagline "…Bespoke nail designs for the extraordinary."; quote 48px + rose span; services pricing $85/$150/$200+/$350/$120/$75 + add-on band; booking select 6 services (durations suffix = documented superset) + text/email/tel/date/textarea; gallery `role=group` with 6 aria-pressed chips, BRIDAL → {Midnight Garden, Ivory Dreams, Rose Petal}, ALL → 12; mobile menu 390×844 — portal dialog + aria-modal + "Site menu" + scroll-lock + 30px links + TRAP-4 `mt:0px` + aria-current + Escape/scroll-restore + theme-follow (dark panel `rgb(19,17,15)`, links `rgb(246,244,238)`, active `rgb(206,178,130)`, tc `#13110f`); SEO surfaces — canonical, JSON-LD, description, OG, soft-404 "Page Not Found" `noindex, follow`.
- **Template re-check (standing sitemap/SEO mandate):** `nordeim/ecommerce-store` `src/app/sitemap.ts` (5 static routes + per-product lastModified) + `robots.ts` (allow `/`, disallow admin/account/checkout/api, sitemap pointer) re-fetched — unchanged since R7; clone artifacts remain template-parity-plus (7 URLs, git-derived lastmod, private noindex both layers).
- **Captures (r8 series):** about desktop light + dark (the changed surfaces — bordered centered band + unboxed centered CTA) + home desktop light (regression baseline, height unchanged from R7 at 5286px).

## 6. Verification Ledger (this round)

| Gate | Command | Result |
|---|---|---|
| Typecheck (baseline + post-fix) | `npm run typecheck` | ✓ silent |
| Lint (baseline + post-fix) | `npm run lint` | ✓ silent |
| Unit (baseline) | `npm run test` | ✓ 95/95 |
| Unit (post-fix) | `npm run test` | ✓ **95/95** (MEASURED_ABOUT pin updated in place) |
| Build (baseline) | `npm run build` | ✓ 445.63 KB / gzip 118.43 kB → post-fix 445.63 KB (markup/class deltas only — no byte growth) |
| E2E (baseline) | `npx playwright test` | ✓ 212/212 (after `npx playwright install chromium` — stale sandbox cache, documented infra excursion) |
| E2E (post-fix) | `npx playwright test` | ✓ **214/214** (107 tests × 2 projects; +1 R8 anatomy pin, R7-04 name loop updated to measured casing) |
| TDD RED | content unit pin + new e2e pin pre-fix | ✓ RED observed (unit 1 failed; e2e 2 failed across projects) |
| Live probe | agent-browser vs `vite preview` + reference | ✓ §5 evidence |
| Dependency health | `npm audit` | ✓ 0 vulnerabilities |
| Security scan | DOM-sink / secret / placeholder greps over `src/` `scripts/` `tests/` | ✓ clean (password matches = documented test-pinned demo seeds) |
| CI check (R7 §7 ①) | GitHub Actions runs 39346664055 (`87f26aa`), 39350394228 (`b068c7c`) | ✓ both success |
| DB projection | unchanged this round (`featuredIn` is page copy, not catalog data — no re-materialization needed) | ✓ n/a |
| Captures | `docs/screenshots/` 39–41 | ✓ about light/dark (new band/CTA) + home light (5286px, unchanged) |
| Work tree | `git status` after builds | ✓ sitemap lastmod drift handled per R8-03 (regenerated artifact shipped) |

## 7. Decisions & Open Questions

1. **The strip name color stays AA-correct (`text-ink-soft`), not the measured ink/30** — the reference's `rgba(26,26,26,0.3)` computes to ≈2.2:1 on cream, far below AA for 24px text; the settled R6-04 doctrine (match intent, correct the math) applies. Ledger row added alongside the anatomy fix.
2. **The eyebrow color on the band stays muted-foreground** — the reference's gold `rgb(156,139,122)` eyebrow fails AA (2.97:1); same doctrine, already ledgered R6/R7.
3. **The CTA button keeps the shared `CtaLink` component** — its measured padding (32/16px vs the reference's 40/20px) is a pre-existing, cross-page accepted delta (all five CTA surfaces share it; R1–R7 sweeps accepted the component); un-boxing and centering are this round's parity fixes, button churn is not.
4. **`featuredIn` casing is a data-level fix, not CSS** — the reference ships uppercase DOM text (no `text-transform`); matching the DOM keeps the accessible name identical ("VOGUE") and avoids a transform that screen readers would read differently.
5. **The gallery caption treatment stays always-visible** — the reference's hover-only overlay hides information on touch devices (its own mobile view shows no captions); the standing doctrine forbids hover-gated information. Formalized as a ledger row (R8-02) rather than "fixed".
6. **No db re-materialization this round** — `featuredIn` is About-page copy and does not flow through the SQLite projection (services/add-ons/works/users only); the catalog is untouched.
7. **Single-commit push** — one atomic commit (R8 plan + code fixes + tests + captures + docs/status alignment) to `main`, per the operator's standing instruction.
