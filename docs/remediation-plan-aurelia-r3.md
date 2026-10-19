# Aurelia Nail Artistry — Validation & Remediation Plan (Round R3)

> **Status:** EXECUTED — all ToDo items closed in the same session (evidence in §6)
> **Round scope:** Post-delivery review round with a standing mandate to **check the Sitemap implementation and SEO optimization** (template reference: `nordeim/ecommerce-store` — `src/app/sitemap.ts` + `src/app/robots.ts`), plus the regular review-round duties: workspace refresh → doc/status review → codebase audit (recent changes) → live parity sweep (mobile-menu deep-check, Tailwind v4 traps) → versioned plan → TDD fixes → full gates → capture refresh → docs alignment (incl. `docs/DEPLOYMENT.md`) → single commit + push to `main`.
> **Reference site:** `https://aurelia-nail-artistry-demo.base44.app/` (re-probed live this round — head, robots, sitemap, mobile menu)
> **Prior rounds:** `docs/remediation-plan-aurelia-r1.md` (validation-only), `docs/remediation-plan-aurelia-r2.md` (theme remediation). Versioned per the standing planning-docs mandate.
> **Exclusion (standing):** `skills/` excluded from typecheck/lint/unit tests — re-verified in place.

---

## 1. Executive Summary

The round began from `65aacf8` (R2 theme remediation) + the owner's `docs/session_3.md` commit (`7784b62`; the only delta — zero code drift). The R2 fixes were re-verified **live** before any change: two-state toggle flips on every click at both viewports, pre-paint `data-theme-applied` pins first paint, mobile-menu traps all hold, and the full gate chain is green (75/75 unit, 166/166 e2e, build 437.01 KB).

The round's mandate — **sitemap + SEO** — was audited against the `ecommerce-store` template and the live reference. The foundation is verified in place and tested (generated `sitemap.xml` + `robots.txt` gated by `tests/sitemap.test.ts`, per-route head contract by `tests/seo.test.ts` + `tests/e2e/seo-head.spec.ts`, JSON-LD `NailSalon` + `WebSite`, PWA manifest + icons). Six hardening gaps were identified and fixed TDD-style (§3): sitemap `<lastmod>`, social-card meta completeness, the `/home` canonical alias, **noindex on soft-404s** (the one Medium), iOS/Android icon surfaces, and structured-data enrichment. One documentation drift defect was found and fixed (R3-DOC-1). All gates green post-fix: **79/79 unit, 172/172 e2e**.

## 2. Alignment Validation (docs ↔ codebase, post-pull)

| Check | Result |
|---|---|
| `git pull --ff-only` fast-forward `65aacf8..7784b62` (single commit: `docs/session_3.md` — the R2-round transcript) | ✓ clean, main only, zero code drift |
| Root docs (`README`, `AGENTS`, `CLAUDE`, `PAD`, SKILL) + `session_3.md` + R2 plan + `worklog.md` reviewed | ✓ |
| `.env` / `.env.example` / root `db/` (`custom.db` + `catalog.json`) contract | ✓ intact and identical |
| Test-count contract (75 unit / 166 e2e) | ⚠ superseded by this round: **79 unit / 172 e2e** — counts updated in the same commit |
| R2 fix commit `65aacf8` audit (theme.ts `nextThemeMode`, chrome.tsx two-state cycle, index.html pre-paint script, home.tsx whitespace node) | ✓ code intact — the `[m`-swallowing tool-display artifact (`ode, setMode]`) re-confirmed byte-level, no real defect |
| `skills/` triple exclusion (tsconfig include / eslint globalIgnores / vitest include) | ✓ in place |

## 3. Audit Findings (Mode C) & Fixes

Severity counts: **0 Critical · 0 High · 1 Medium (fixed) · 5 Low (fixed) · 1 docs defect (fixed) · 2 Informational.**

| # | Severity | Location | Description | Evidence | Fix | Confidence |
|---|---|---|---|---|---|---|
| R3-01 | Low (SEO) | `scripts/generate-sitemap.mjs` | Sitemap entries carry no `<lastmod>` — the template's `sitemap.ts` ships `lastModified`; crawlers use lastmod for recrawl scheduling | sitemap.xml has loc/changefreq/priority only; template maps `lastModified` | Deterministic git-derived lastmod (latest `Y-m-d` commit date across content-affecting paths: `src/data/studio.ts`, `src/pages/`, `src/index.css`, `index.html`, `public/images/`); `<lastmod>` omitted entirely when git metadata is unavailable (valid sitemap, loud notice); pinned by `tests/sitemap.test.ts` (presence, W3C date form, not-in-future, single content date) | Verified |
| R3-02 | Low (SEO/social) | `index.html` | Social-card meta incomplete: no `og:image:width/height/alt`, no `twitter:image:alt`, no `og:locale` — crawlers must fetch+decode the 1344×768 JPEG to size the card | Live probe: all five fields null (reference also null — superset-quality hardening, not parity debt) | Static head gains `og:image:width=1344`, `og:image:height=768`, `og:image:alt`, `twitter:image:alt`, `og:locale=en_US`; pinned by a new seo-head e2e test | Verified |
| R3-03 | Low (SEO) | `src/lib/seo.ts` | `/home` is a reachable route (`matchPath` maps it to home, Verified) but its canonical resolved to `/home` itself — a duplicate-canonical of `/` | `buildRouteMeta("/home").canonicalUrl === SITE_URL + "/home"` | The landing alias canonicalizes to `/` (title stays the site name; og:url merges to `/` too, query preserved); pinned in `tests/seo.test.ts` + a served-artifact e2e | Verified |
| R3-04 | **Medium (SEO)** | `src/lib/seo.ts` + `head-manager.tsx` | **Soft-404s advertise for indexing**: unknown paths ship `robots: index, follow` + a self-canonical to the garbage URL (e.g. `/nonexistent-page` canonicalizes itself) | Live probe `/nonexistent-page`: `robots=index, follow`, `canonical=.../nonexistent-page` | `RouteMeta` gains `robots`; unknown paths → `noindex, follow` (known routes stay `index, follow`); `HeadManager` upserts `meta[name=robots]` (the static head keeps `index, follow` as the first-paint default); pinned by unit + served-artifact e2e | Verified |
| R3-05 | Low (PWA/social) | `index.html` + `public/manifest.webmanifest` | No `apple-touch-icon` (iOS home-screen falls back to a page snapshot); manifest icons lack a maskable-purpose entry (Android adaptive icons) | Live probe: `appleTouchIcon=null`; manifest has only `purpose:"any"` | `public/icon-180.png` (apple-touch) + `public/icon-512-maskable.png` (content padded into the safe zone) generated from the committed ink-monogram icon; link + manifest entries added; assets committed | Verified |
| R3-06 | Low (SEO/structured data) | `index.html` JSON-LD | `NailSalon` lacks `sameAs` (the Instagram handle `@aurelia.nails` is documented catalog data) and the structured `openingHoursSpecification` (hours exist only as the legacy string) | JSON-LD block in index.html; `STUDIO_INFO.instagram` / `hoursLine1/2` | `sameAs: ["https://www.instagram.com/aurelia.nails"]` + `openingHoursSpecification` (Tu–Sa 10:00–18:00, matching `hoursLine1/2` and the retained `openingHours` string); JSON-LD e2e extended | Verified |
| R3-DOC-1 | Medium (docs) | `luxury-nail-portfolio_SKILL.md` §2 | Tech-stack table is pre-R2: React 19.2.6/19.2.7, Vite 7.3.2, singlefile 2.3.0 + 407.9/106.9 KB, Tailwind 4.1.17, tailwind-merge 3.4.0 vs actual 19.3.1 / 7.3.7 / 2.3.4 + 437.01/116.07 KB / 4.3.3 / 3.7.0 | `package.json` vs SKILL lines 79–87 | §2 updated to the lockfile truth; R2's docs sweep had missed this table (its log lists SKILL count/theme/§15.4 updates only) | Verified |
| F1 | Informational | Tooling | Sandbox background processes do not survive across tool calls (`setsid`+`nohup`+`disown` all die) — dev-server probes must complete within a single call, or re-start per call | curl 000 vs 200 across calls | Recorded here + SKILL §10.1 row | Verified |
| F2 | Informational | Probe tooling | agent-browser CSS selectors match **hidden** DOM nodes (unlike `getByRole`, which uses the a11y tree): at mobile viewports `button[data-theme-mode]` first matches the display-none desktop toggle, so raw-selector clicks silently no-op. The e2e suite was never affected (it is role-based) | Two `[{"vis":false},{vis:true}]` toggles at 390px | Probe pattern: filter by `offsetWidth` (SKILL §10.1 row) | Verified |

## 4. Remediation ToDo List (executed)

| ID | Task | Mode | Status |
|---|---|---|---|
| R3-T01 | Workspace refresh + docs/session_3.md / R2 plan / worklog review | — | ✓ |
| R3-T02 | Alignment validation (docs ↔ tree, env contract, skills exclusion) | — | ✓ §2 |
| R3-T03 | Baseline gates on the pulled tree: typecheck/lint/75 unit/build 437.01 KB + full e2e 166/166 | — | ✓ |
| R3-T04 | Sitemap/SEO audit vs `ecommerce-store` template + live reference (head, robots, sitemap probed) | Mode C | ✓ §3 |
| R3-T05 | R2-fix live re-verification (theme two-state + pre-paint, both viewports) + mobile-menu deep-check (TRAP-4 `mt: 0px` pin) | — | ✓ |
| R3-T06 | RED: extend `tests/seo.test.ts` (alias canonical, robots contract) + `tests/sitemap.test.ts` (lastmod) | TDD | ✓ failed pre-fix |
| R3-T07 | RED: extend `tests/e2e/seo-head.spec.ts` (404 noindex, static-head social meta, /home alias) | TDD | ✓ failed pre-fix |
| R3-T08 | GREEN: `seo.ts` (robots + alias) + `head-manager.tsx` (robots upsert) + `generate-sitemap.mjs` (lastmod) | TDD | ✓ |
| R3-T09 | GREEN: `index.html` (og:image dims/alt, twitter alt, og:locale, apple-touch-icon, JSON-LD sameAs + openingHoursSpecification) | TDD | ✓ |
| R3-T10 | Icon assets: `icon-180.png` + `icon-512-maskable.png` (PIL, from the committed monogram) + manifest entries | — | ✓ |
| R3-T11 | Full gates: verify (typecheck/lint/79 unit/build) + full e2e 172/172 | — | ✓ |
| R3-T12 | Capture refresh → `docs/screenshots/` (21–23, Pillow-gated) | — | ✓ |
| R3-T13 | Docs alignment: README, AGENTS, CLAUDE, PAD, SKILL (counts, SEO layer rows, §10.1 probe rows, §2 versions), DEPLOYMENT.md SEO section | — | ✓ |
| R3-T14 | Versioned plan (this file) + worklog updates | — | ✓ |
| R3-T15 | Single commit + push to `main` via `docs/ssh_git_wrapper_v3.py` (`--remote` explicit) | — | ✓ |

## 5. Reference & Parity Evidence (this round)

- **Reference head (live)**: title/canonical/OG/Twitter shape parity; the reference ships **no JSON-LD** and **no theme-color** — the clone's are a documented superset. Reference description is generic platform boilerplate; the clone's studio-voice description is a deliberate superset (meta description is not in the copy-parity pin list).
- **Reference robots.txt (live)**: `User-agent: * / Allow: /` + sitemap directive, disallows nothing. Clone disallows `/admin`, `/account`, `/reset` — the documented superset posture (generated header comment).
- **Reference sitemap.xml (live)**: 5 URLs (`/`, `/Gallery`, `/Services`, `/About`, `/Booking`), `changefreq=weekly` throughout, priorities 1.0/0.8, **no lastmod**. Clone: 7 URLs (adds auth surfaces), granular priorities per the ecommerce-store template, and (post-R3-01) an honest git-derived lastmod — superset.
- **Clone mobile menu (390×844, live)**: portal-to-body ✓, `aria-modal` ✓, focus inside ✓, scroll-lock ✓, 6 links at 36px Cormorant `rgb(33,31,28)` ✓, second-link `margin-top: 0px` (**TRAP-4 space-y pin holds**) ✓, theme follows the two-state toggle inside the menu ✓.
- **Clone theme re-verification (live)**: fresh profile → `data-theme-applied="light"`; click 1 → dark (`#13110f`, stored `dark`); click 2 → light — every click visibly flips at both 390px and 1440px (R2-01 regression pins hold live).
- **Reference mobile menu (live, settled)**: ground cream `rgb(245,243,239)`, Cormorant Garamond family — no drift vs the R1 byte-level evidence.

## 6. Verification Ledger (this round)

| Gate | Command | Result |
|---|---|---|
| Baseline unit | `npm run test` | ✓ 75/75 (pre-change) |
| Baseline e2e | `npx playwright test` | ✓ 166/166, 2.6 min (pre-change) |
| Baseline build | `npm run verify` | ✓ 437.01 KB / gzip 116.07 kB |
| Typecheck (post) | `npm run typecheck` | ✓ silent |
| Lint (post) | `npm run lint` | ✓ silent |
| Unit (post) | `npm run test` | ✓ **79/79** (75 + 2 seo + 2 sitemap) |
| Build (post) | `npm run build` | ✓ `dist/index.html` ~437 KB + refreshed sitemap/robots artifacts |
| E2E full (post) | `npx playwright test` | ✓ **172/172** (166 + 3 new tests × 2 projects) |
| Captures | `docs/screenshots/` 21–23 | ✓ Pillow-gated |
| Security | no new runtime surface (static head meta + generated artifacts only; JSON-LD data from the documented catalog) | ✓ |

## 7. Decisions & Open Questions

1. **Git-derived lastmod over build-date lastmod** — a build timestamp churns on every rebuild and trains crawlers to distrust the signal; the latest content-commit date is deterministic per content state and honest. Omitted (valid XML) when git metadata is unavailable (tarball builds).
2. **`noindex, follow` over a hard canonical for soft-404s** — the garbage URL must not be indexed and its links should still be followed; a self-canonical under noindex is harmless, so the canonical contract stays untouched (minimal diff).
3. **`/home` merges into `/` in canonical space, stays in the title map** — the route renders identically (reference-verified case-insensitive matching); one canonical for one landing page.
4. **Dedicated maskable icon file over re-purposing the existing icons** — maskable icons need safe-zone padding; a padded 512 variant guarantees the monogram survives Android's circular mask.
5. **`sameAs` uses the documented Instagram handle only** — no invented social profiles; `openingHoursSpecification` mirrors `hoursLine1/2` (Tue–Sat 10:00–18:00) and the existing string is retained for consumers of the legacy field.
6. **Single-commit push** — one atomic commit (fixes + tests + assets + docs + evidence) to `main`, per the operator's standing instruction.
