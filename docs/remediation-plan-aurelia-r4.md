# Aurelia Nail Artistry — Validation & Remediation Plan (Round R4)

> **Status:** EXECUTED — all ToDo items closed in the same session (evidence in §6)
> **Round scope:** Post-delivery review round with the standing **sitemap/SEO** mandate (template reference: `nordeim/ecommerce-store` — `src/app/sitemap.ts` + `robots.ts`), plus the regular duties: workspace refresh → doc/status review (`session_4.md`, R3 plan, worklog) → alignment validation → codebase audit (R3 commit) → live parity sweep (mobile-menu deep-check, Tailwind v4 traps) → versioned plan → TDD fixes → full gates → capture refresh → docs alignment (incl. `docs/DEPLOYMENT.md`) → single commit + push to `main`.
> **Reference site:** `https://aurelia-nail-artistry-demo.base44.app/` (re-probed live this round — head, ground, title, theme-color posture)
> **Prior rounds:** `docs/remediation-plan-aurelia-r1.md` (validation-only), `-r2.md` (theme remediation), `-r3.md` (sitemap/SEO hardening). Versioned per the standing planning-docs mandate.
> **Exclusion (standing):** `skills/` excluded from typecheck/lint/unit tests — re-verified in place.

---

## 1. Executive Summary

The round began from `883a050` (R3 SEO hardening) + the owner's `docs/session_4.md` commit (`f83c48f`; the only delta — zero code drift). The baseline was re-proven on the pulled tree before any change: typecheck ✓ lint ✓ **79/79 unit** ✓ **172/172 e2e** ✓ build **438.31 KB** ✓. One infrastructure excursion: the sandbox reset had wiped the Playwright browser cache (`chromium_headless_shell-1248` missing → 164 spurious launch failures); `npx playwright install chromium` restored it — the exact quirk already documented in AGENTS/DEPLOYMENT (no code impact).

The audit (Mode C) found **0 Critical / 0 High / 3 Low code gaps** — all live-verified via agent-browser against the production preview — plus **4 Low doc-drift defects** left over from the R3 count migration (75→79 / 166→172 landed in most but not all count-bearing lines). The three code gaps are all in the R2/R3 remediation families and are fixed TDD-style with regression pins:

- **R4-01 (Low, SEO):** case-variant routes self-canonicalize — `/Gallery` emits canonical `…/Gallery` while the sitemap lists `/gallery` (same duplicate-content family as R3-03, live-verified).
- **R4-02 (Low, SEO):** private surfaces (`/account`, `/admin/bookings`, `/reset`) ship `index, follow` — they are robots.txt-disallowed private routes, and case-variant URLs (`/Account`) bypass the robots.txt disallow entirely, so the meta must agree (defense in depth; live-verified).
- **R4-03 (Low, UX/theme):** `theme-color` is a static light value — after a dark flip the mobile browser chrome stays cream (live-verified: `tc` stayed `#f5f3ef` while `bg` was `rgb(19,17,15)`); now synced through the same seams that own theming (pre-paint script + `applyTheme`).

Parity is intact end-to-end: ground byte-equal to the reference (`rgb(245,243,239)` both sides), hero 128px Cormorant 400 white, mobile menu portal/dialog/trap + 6 links 36px Cormorant ink + **second-link `margin-top: 0px` (TRAP-4 pin holds)**, two-state theme walk flips on every click (R2-01 alive), reference still ships no theme-color (clone superset). Post-fix gates: **81/81 unit, 178/178 e2e**, build 439.19 KB.

## 2. Alignment Validation (docs ↔ codebase, post-pull)

| Check | Result |
|---|---|
| `git pull` fast-forward `883a050..f83c48f` (single commit: `docs/session_4.md` — the R3-round transcript) | ✓ clean, main only, zero code drift |
| Root docs (README, AGENTS, CLAUDE, PAD, SKILL) + `session_4.md` + R3 plan + `worklog.md` reviewed | ✓ |
| `.env` / `.env.example` / root `db/` (`custom.db` + `catalog.json`) contract | ✓ intact and identical |
| `skills/` triple exclusion (tsconfig include / eslint globalIgnores / vitest include) | ✓ in place |
| R3 commit `883a050` audit (seo.ts robots+alias, head-manager robots upsert, generate-sitemap lastmod, index.html social-card/icons/JSON-LD, manifest maskable) | ✓ code intact, matches its plan §3 verbatim |
| R3 plan claims vs tree: 79 unit / 172 e2e / build 438.31 KB / lastmod `2026-10-19` / 7 sitemap URLs with `<lastmod>` / icons in `public/` | ✓ all verified (§6 ledger) |
| Test-count contract (79 unit / 172 e2e) | ⚠ superseded by this round: **81 unit / 178 e2e** — counts updated in the same commit |
| SKILL §5 inventory (chrome.tsx 366 lines; ~2,965 src lines) | ✓ re-measured exact (366 / 2,965) |

## 3. Audit Findings (Mode C) & Fixes

Severity counts: **0 Critical · 0 High · 3 Low (fixed) · 4 docs defects (fixed) · 2 Informational.**

| # | Severity | Location | Description | Evidence | Fix | Confidence |
|---|---|---|---|---|---|---|
| R4-01 | Low (SEO) | `src/lib/seo.ts` | Case-variant routes self-canonicalize: matchPath is case-insensitive (reference behavior), so `/Gallery` renders the gallery page but emits canonical `…/Gallery` — competing with the sitemap-listed `/gallery` as duplicate content. R3-03 fixed the `/home` alias; the case-variant dimension was left open | Live probe: `/Gallery` → canonical `http://localhost:4173/Gallery`, robots `index, follow` | Known routes canonicalize to the lowercase (sitemap) form: `canonicalPath = normalized === "/home" ? "/" : staticTitle ? normalized : pathname`; og:url merges identically (query preserved). Unknown paths keep the raw pathname (harmless under noindex). Pinned: unit (`/GALLERY`→`/gallery`, `/Booking`→`/booking`, `/Home`→`/`) + served-artifact e2e | Verified |
| R4-02 | Low (SEO) | `src/lib/seo.ts` | Private surfaces ship `index, follow`: `/account`, `/admin/bookings`, `/reset` are robots.txt-disallowed private routes, but the head contract treats "known" as "indexable". Case-variant URLs (`/Account`, `/Reset`) bypass the case-sensitive robots.txt `Disallow`, get crawled, and advertise for indexing | Live probe: `/account` → robots `index, follow`, self-canonical | Robots contract tightened to the sitemap's public set: `INDEXABLE = {/, /home, /gallery, /services, /about, /booking, /login, /register}` → `index, follow`; everything else (private surfaces + unknown paths) → `noindex, follow`. `/login` + `/register` stay indexable — the ecommerce-store template lists them in its sitemap too (re-verified this round). Pinned: unit + e2e | Verified |
| R4-03 | Low (UX/theme) | `index.html` + `src/lib/theme.ts` | `theme-color` is a static light value: after a dark flip the page flips but the mobile browser chrome tint stays cream — the dark-mode equivalent of the flash R2-01 killed (and the reference has no theme-color at all, so this is superset-quality hardening) | Live probe: dark state `bg=rgb(19,17,15)` while `tc=#f5f3ef`; click 2 back to light leaves it correct only by coincidence | (a) `applyTheme` (the single seam chrome.tsx already drives for mode/OS changes) syncs `meta[name="theme-color"]` to the resolved hex (`#f5f3ef` / `#13110f`, matching the pinned token values); (b) the pre-paint head script syncs it before first paint too — the meta moves above the script so it exists when the script runs; (c) both syncs are defensive no-ops if the meta is absent (degrade-never-crash doctrine). Pinned: e2e (stored-dark load → `#13110f`; toggle → back to `#f5f3ef`) | Verified |
| R4-DOC-1 | Low (docs) | `README.md` §Architecture table | Rows "Unit tests … 75 tests" / "E2E tests … 166 tests" are pre-R3 — the same file's badge, quick-start, testing section and status line all say 79/172 | lines 34–35 vs 3/93/118–119/167 | Corrected (totals re-pinned to this round's post-fix numbers with the rest of the sweep) | Verified |
| R4-DOC-2 | Low (docs) | `luxury-nail-portfolio_SKILL.md` frontmatter | `description:` still says "the test-gate architecture (75 unit + 166 e2e)" — contradicts the same frontmatter's `project_state` (79/172) and §2 (79/172) | line 8 vs 14 / 90–91 | Corrected; totals re-pinned to this round's post-fix numbers (81/178) | Verified |
| R4-DOC-3 | Low (docs) | `luxury-nail-portfolio_SKILL.md` §3 | Quick commands say "75 unit" / "166 e2e" (lines 325–326) | vs §2 table | Corrected | Verified |
| R4-DOC-4 | Low (docs) | `README.md` / `PAD` | Build-size drift: README §Architecture says "~437 KB" and PAD §1 table/§3-ADR-003 say "~437 KB" while README §Quick Start, PAD §8.1, DEPLOYMENT and SKILL all say 438 (baseline actual 438.31) | README 24; PAD 58, 91 | Corrected to ~439 KB / ~116.8 KB gzip (this round's actual) | Verified |
| F1 | Informational | Tooling | The sandbox reset wiped the Playwright browser cache — 164 launch failures (`Executable doesn't exist … chromium_headless_shell-1248`) on the first e2e attempt; `npx playwright install chromium` fixed it. Already documented in AGENTS testing quirks + DEPLOYMENT §8; recorded again here because this is the first round where the reset happened *without* a lockfile bump | 164 failed → 172 passed after install | None (docs already carry it) | Verified |
| F2 | Informational | SEO posture | Sitemap includes `/login` + `/register` (7 URLs). Deliberate R3 posture, re-confirmed against the template this round: the ecommerce-store sitemap also lists login/register at priority 0.2/yearly. No change | Template `src/app/sitemap.ts` re-fetched | None (documented posture stands) | Verified |

## 4. Remediation ToDo List (executed)

| ID | Task | Mode | Status |
|---|---|---|---|
| R4-T01 | Workspace refresh + docs/session_4.md / R3 plan / worklog review | — | ✓ |
| R4-T02 | Alignment validation (docs ↔ tree, env contract, skills exclusion, SKILL inventory re-measure) | — | ✓ §2 |
| R4-T03 | Baseline gates on the pulled tree: typecheck/lint/79 unit/build 438.31 KB + full e2e 172/172 (after browser-cache restore, F1) | — | ✓ |
| R4-T04 | Sitemap/SEO audit vs `ecommerce-store` template (re-fetched) + live reference probe | Mode C | ✓ §3 |
| R4-T05 | R2/R3-fix live re-verification (two-state theme walk, mobile-menu deep-check, TRAP-4 pin) + the three R4 gap probes | — | ✓ |
| R4-T06 | RED: extend `tests/seo.test.ts` (case-variant canonical, private-surface robots) | TDD | ✓ failed pre-fix |
| R4-T07 | RED: extend `tests/e2e/seo-head.spec.ts` (`/Gallery` canonical lowercase, `/account` noindex) + `tests/e2e/dark-mode.spec.ts` (theme-color sync) | TDD | ✓ failed pre-fix |
| R4-T08 | GREEN: `seo.ts` (canonical case consolidation + INDEXABLE robots set) | TDD | ✓ |
| R4-T09 | GREEN: `index.html` (theme-color meta above the pre-paint script + script sync) + `theme.ts` (`applyTheme` meta sync) | TDD | ✓ |
| R4-T10 | Full gates: verify (typecheck/lint/81 unit/build) + full e2e 178/178 | — | ✓ |
| R4-T11 | Docs alignment: README, AGENTS, CLAUDE, PAD, SKILL, DEPLOYMENT.md (counts 81/178, build size, R4 rows, §10.1 note) | — | ✓ |
| R4-T12 | Capture refresh → `docs/screenshots/` (24–26, Pillow-gated) | — | ✓ |
| R4-T13 | Versioned plan (this file) + worklog updates | — | ✓ |
| R4-T14 | Single commit + push to `main` via `docs/ssh_git_wrapper_v3.py` (`--remote` explicit) | — | ✓ |

## 5. Reference & Parity Evidence (this round)

- **Reference head (live)**: title "Aurelia Nail Artistry" ✓; description is the generic platform boilerplate (clone's studio-voice description remains the deliberate superset); **still no `theme-color`, no JSON-LD** — the clone's are documented supersets. No drift vs R1/R3 evidence.
- **Reference ground (live)**: `rgb(245,243,239)` — byte-equal to the clone's settled ground. Zero parity drift this round.
- **Clone hero (live, 1440×900)**: h1 128px / 400 "Cormorant Garamond", white — matches the R1 measured pins.
- **Clone mobile menu (390×844, live)**: portal-to-body ✓, `role=dialog` + `aria-modal` ✓, focus lands in the menu ✓, scroll lock `hidden` ✓, 6 links 36px/400 Cormorant `rgb(33,31,28)` ✓, second-link `margin-top: 0px` (**TRAP-4 space-y pin holds**) ✓, panel follows the dark theme while dark ✓, clean close via the labeled button ✓.
- **Clone theme walk (live)**: fresh profile → pre-paint `data-theme-applied="light"`; click 1 → dark (`rgb(19,17,15)`, stored `dark`); click 2 → light — every click flips (R2-01 regression pins hold live at desktop and inside the mobile menu).
- **Template re-check (standing sitemap/SEO mandate)**: `nordeim/ecommerce-store` `src/app/sitemap.ts` re-fetched — static routes with changeFrequency/priority, per-entity `lastModified`, login/register included at 0.2/yearly; robots posture unchanged. The clone's generated sitemap remains template-parity-plus (uniform git-derived lastmod, private surfaces excluded + disallowed).
- **Clone soft-404/private posture (live, pre-fix)**: `/Gallery` self-canonical in mixed case (R4-01 evidence); `/account` `index, follow` (R4-02 evidence) — both re-pinned green post-fix.

## 6. Verification Ledger (this round)

| Gate | Command | Result |
|---|---|---|
| Unit (baseline) | `npm run test` | ✓ 79/79 (pre-change) |
| E2E (baseline) | `npx playwright test` | ✓ 172/172, 2.6 min (after `npx playwright install chromium` — F1) |
| Build (baseline) | `npm run build` | ✓ 438.31 KB / gzip 116.50 kB |
| Typecheck (post) | `npm run typecheck` | ✓ silent |
| Lint (post) | `npm run lint` | ✓ silent |
| Unit (post) | `npm run test` | ✓ **81/81** (79 + 2 new seo tests) |
| Build (post) | `npm run build` | ✓ 439.19 KB / gzip 116.84 kB |
| E2E full (post) | `npx playwright test` | ✓ **178/178** (172 + 3 new tests × 2 projects) |
| Live probe | agent-browser vs `vite preview` + reference | ✓ §5 evidence (parity intact; R4 gaps live-verified pre-fix, green post-fix) |
| Captures | `docs/screenshots/` 24–26 | ✓ Pillow-gated |
| Security | no new runtime surface (head meta sync + pure-seam changes only; no new deps, no new inputs) | ✓ |

## 7. Decisions & Open Questions

1. **Lowercase canonical space** — the sitemap generates lowercase URLs, internal links are lowercase, and the router is case-insensitively tolerant; the canonical therefore normalizes to the lowercase form for known routes. Unknown paths keep their raw pathname: they are `noindex`, so the canonical is inert (minimal diff, R3 decision #2 preserved).
2. **INDEXABLE set over a PRIVATE set** — enumerating the public allowlist (the sitemap's routes + the `/home` alias) makes the robots contract fail closed: a future private route added to the title map without touching the robots layer automatically lands on `noindex, follow`. A disallow-list would do the opposite.
3. **`/login` + `/register` stay indexable** — template parity (re-verified) and findability for brand+login queries; they are public pages, unlike `/reset`/`/account`/`/admin`.
4. **theme-color synced in two seams, not injected dynamically everywhere** — the pre-paint script owns first paint (and gets the meta moved above itself so it can sync synchronously); `applyTheme` owns every post-mount transition (toggle + OS-change listener + mount sync). Both are defensive no-ops when the meta is absent. No third path was added — one source of truth per lifecycle stage.
5. **Docs sweep root cause recorded** — the R3 docs pass moved the counts in seven places but missed four (README arch table, SKILL frontmatter description, SKILL §3, the ~437 KB stragglers). This round greps every count-bearing pattern (`75|166|437`) across all six docs to termination instead of spot-fixing.
6. **Single-commit push** — one atomic commit (fixes + tests + docs + evidence) to `main`, per the operator's standing instruction.
