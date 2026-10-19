# Aurelia Nail Artistry — Validation & Remediation Plan (Round R2)

> **Status:** EXECUTED — all ToDo items closed in the same session (evidence in §6)
> **Round scope:** Post-delivery review round (`docs/prompt-to-review-4.md`) with an operator-reported defect: **"the dark and light mode switching is not working as expected."** Workspace refresh → doc/status review → dependency-bump audit → Mode B root-cause analysis → TDD fixes → full gates → live sweep → evidence + docs alignment (incl. `docs/DEPLOYMENT.md`, stale HomeNest text) → single commit + push to `main`.
> **Reference site:** `https://aurelia-nail-artistry-demo.base44.app/` (unchanged; no drift re-confirmed where re-probed)
> **Prior round:** `docs/remediation-plan-aurelia-r1.md` (validation-only, zero defects). Versioned per the standing planning-docs mandate.
> **Exclusion (standing):** `skills/` excluded from typecheck/lint/unit tests — re-verified in place.

---

## 1. Executive Summary

The round began with a workspace refresh that surfaced the owner's dependency bump (`18f7846 update package versions`: **Tailwind CSS 4.1.17 → 4.3.3**, React 19.2.6 → 19.3.1, Vite 7.3.2 → 7.3.7, Playwright 1.64.0 → 1.64.1, axe-core 4.13 → 4.14, et al.). Two consequences:

1. **The reported theme defect** — investigated per Mode B. The theme ENGINE (Tailwind `@custom-variant dark`, token flips, persistence, system-mode resolution) was re-proven correct on both the dev server and the production build **with the new deps** (dark-mode e2e 18/18 after a browser-cache install — the 14 "failures" were an infrastructure artifact: Playwright 1.64.1 needs chromium-headless-shell-1248). The real root causes of "switching not working as expected" were two shipped UX/structural defects:
   - **R2-01a (High, UX):** the toggle's fixed cycle `system → light → dark` makes the FIRST click from a fresh profile a **visual no-op on light-OS machines** (the majority audience) — literally "clicking the theme button does nothing."
   - **R2-01b (High, structural):** no **pre-paint theme application** — the served HTML carries only light `:root` tokens, so dark users (stored dark, or dark OS with no choice) paint light first and flip after React mounts; with a ~437 KB single-file bundle that flash is seconds on slow links. Both the toggle behavior and the reload behavior read as "switching doesn't work."
2. **A latent a11y defect surfaced by the axe-core 4.14 upgrade** — `label-content-name-mismatch` (WCAG 2.5.3 Label-in-Name) on the four home portfolio cards, mobile project only. Isolated with a controlled in-page variant experiment (§5.2) to a genuinely interesting root cause (R2-02).

Both defects are fixed TDD-style with regression pins; all gates are green (75 unit / 166 e2e).

## 2. Alignment Validation (docs ↔ codebase, post-pull)

| Check | Result |
|---|---|
| `git pull` fast-forward `c8ab2c3..33bf173` (7 commits: session logs, doc cleanup, `18f7846` package versions, `prompt-to-review-4.md`, `session_2.md`) | ✓ clean, main only |
| Local mode-only diff noise (sandbox chmod'ed everything 755) | ✓ resolved via `git config core.fileMode false` |
| `docs/session_2.md` | ✓ read — it is the transcript of the previous round (R1); no new owner observations beyond the dependency bump |
| `.env` / `.env.example` / root `db/` contract | ✓ unchanged and intact |
| Test-count contract in docs (69 unit / 162 e2e) | ⚠ superseded by this round: **75 unit / 166 e2e** — counts updated in the same commit |

## 3. Audit Findings (Mode C) & Debugging Findings (Mode B)

Severity counts: **0 Critical · 2 High (fixed) · 1 Medium (fixed) · 0 new Low · 2 Informational.**

| # | Severity | Location | Description | Evidence | Fix | Confidence |
|---|---|---|---|---|---|---|
| R2-01a | High (UX defect) | `src/components/chrome.tsx` (`ThemeToggle.cycle`) | Fixed cycle `["light","dark","system"]` starting from a fresh profile's `system` mode: the first click lands on `light`, which on a light-OS machine resolves to the SAME rendered theme — a no-op activation | Live repro (dev + preview, controlled `media light`): fresh → click 1 → bg stays `rgb(245,243,239)` | Two-state cycle: `nextThemeMode(mode, resolved)` returns the OPPOSITE of the currently resolved theme — every activation flips the screen; `system` remains the fresh-profile initial mode (honored, OS-reactive) until the first interaction pins a choice. Unit-pinned invariant: `nextThemeMode(mode, resolved) !== resolved` | Verified |
| R2-01b | High (structural) | `index.html` `<head>` | No pre-paint theme application; dark users get a light first paint on every load/reload (FOUC), reading as "my choice didn't stick" | Structural: served HTML has no theme script; `.dark` class applied only by `ThemeToggle`'s post-mount effect | Synchronous head script mirroring the store's `readStoredMode` contract (any stored value ≠ "light" resolves through the OS preference), setting `html.dark` + `colorScheme` + test-facing `data-theme-applied` before first paint. Idempotent with the in-app toggle's post-mount sync | Verified |
| R2-02 | Medium (a11y, surfaced by axe 4.14) | `src/pages/home.tsx` portfolio cards (touch caption) | `label-content-name-mismatch` (serious) on all four cards, **mobile project only** — the accessible name must contain the visible caption text (WCAG 2.5.3) | axe smoke failure; controlled variant experiment (§5.2) | Whitespace text node between the caption spans (see §5.2) + space-joined `aria-label` | Verified |
| F1 | Informational | Tooling | `npm install` after the lockfile bump requires `npx playwright install chromium` (headless shell 1248) before the first e2e run; 14 spurious failures without it | Playwright launch error, then 18/18 after install | Recorded in AGENTS testing quirks + DEPLOYMENT §8 | Verified |
| F2 | Informational | `docs/DEPLOYMENT.md` | Was still the prior-project (HomeNest) document wholesale — stale sizes, routes, storage key, checklists | Read of the file pre-rewrite | Full rewrite for Aurelia (this commit) | Verified |

Out-of-scope observations (not fixed, by audit discipline): none new — the R1 standing watch list is unchanged.

## 4. Remediation ToDo List (executed)

| ID | Task | Mode | Status |
|---|---|---|---|
| R2-T01 | Workspace refresh + status/mode-noise cleanup | — | ✓ |
| R2-T02 | Root docs + `session_2.md` + R1 plan + worklog review | — | ✓ |
| R2-T03 | Dependency-bump audit: install per lockfile; verify Tailwind 4.3.3/React 19.3.1 under typecheck + unit + build | Mode C | ✓ all green |
| R2-T04 | Reproduce the theme defect systematically (dev server, production preview, controlled `set media`, cycle walk, persistence) | Mode B | ✓ engine correct; defect = R2-01a/b |
| R2-T05 | Unit tests RED: `tests/theme.test.ts` — `nextThemeMode` contract + no-op impossibility invariant | TDD | ✓ 3 failed pre-fix → 6/6 post-fix |
| R2-T06 | E2E RED: fresh-first-click pin + pre-paint `data-theme-applied` pin + rewritten system-mode test | TDD | ✓ fail pre-fix (observed live pre-fix behavior) → pass post-fix |
| R2-T07 | Implement R2-01a: `nextThemeMode` in `src/lib/theme.ts` + two-state `cycle()` in `chrome.tsx` | TDD | ✓ |
| R2-T08 | Implement R2-01b: pre-paint script in `index.html` | TDD | ✓ |
| R2-T09 | Isolate R2-02 to root cause via in-page variant experiment; implement the whitespace fix | Mode B/TDD | ✓ (§5.2) |
| R2-T10 | Full gates: verify (typecheck/lint/75 unit/build) + full e2e 166/166 | — | ✓ |
| R2-T11 | Live verification on the production preview: one-click flip, no-op impossibility, mobile-menu traps + theme following | — | ✓ |
| R2-T12 | Capture refresh → `docs/screenshots/` (18–20, Pillow-gated) | — | ✓ |
| R2-T13 | Docs alignment: README, AGENTS, CLAUDE, PAD, SKILL (counts, cycle contract, troubleshooting), DEPLOYMENT.md rewrite | — | ✓ |
| R2-T14 | Versioned plan (this file) + worklog updates | — | ✓ |
| R2-T15 | Single commit + push to `main` via `docs/ssh_git_wrapper_v3.py` (`--remote` explicit) | — | ✓ |

## 5. Root-Cause Records

### 5.1 R2-01 — theme switching (the operator-reported defect)

**Reproduction matrix (before fixes):** dev server AND production preview behave identically — the engine was never broken: fresh/system resolution ✓, cycle steps ✓ (with the no-op first step), reload persistence ✓, live OS-preference re-resolution ✓ (verified with `set media dark/light`), dark-OS system resolution ✓. The defect was the UX contract, and it reproduced 100% of the time for light-OS fresh profiles (one visible-dead click) and 100% for dark users on every reload (light flash).

**Hypotheses enumerated → systematically isolated:** (H1) system mode ignores `matchMedia` — DISPROVEN (live media emulation re-resolves); (H2) Tailwind 4.3.3 dropped `@custom-variant dark` or the `.dark` block from the build — DISPROVEN (build contains `:root`, `.dark` block, 20 `where(.dark` utilities; dark spec 18/18); (H3) React 19.3 broke controlled state — DISPROVEN (labels/stores update); (H4) first-click no-op cycle — CONFIRMED live; (H5) missing pre-paint application — CONFIRMED structurally.

**Fix contract (deliberate, documented):** the toggle is now a two-state light ↔ dark switch; `system` is the fresh-profile INITIAL mode — honored and OS-reactive until the first interaction pins an explicit choice. Tradeoff (stated, not silent): explicit re-entry to "system" after interacting is intentionally removed — every click must visibly flip (the shipped fixed-order cycle could not guarantee that in either direction without keeping a no-op step). This matches the industry-standard toggle convention (name-from-content semantics of moon/sun iconography); the deviations ledger in `docs/implementation-plan.md` records it.

### 5.2 R2-02 — Label-in-Name (axe 4.14)

**Isolation experiment** (in-page axe 4.14, cloned card, one variable per run): as-is FAIL · remove-touch-caption **PASS** · remove-overlay FAIL · remove-aria-label **PASS** · alt-empty FAIL · alt-no-dash FAIL · aria-label containing ALL inner text FAIL · **inserting one whitespace text node between the caption spans PASS**.

**Root cause:** JSX strips inter-element whitespace, so the caption's two spans render as `…Essence</span><span>Editorial…` — `textContent` = `"Pearl EssenceEditorial"`. axe 4.14's `visible()` + `Intl.Segmenter` word segmentation tokenize that as `["pearl", "essenceeditorial"]` — the fused token can never appear in the accessible name, so ANY `aria-label` wording fails (including one containing every visible word — verified). axe < 4.14 either didn't run this rule here or segmented differently, which is why the suite was green on 4.13.

**Fix:** a whitespace text node (`{" "}` in JSX) between the spans — invisible in the flex row (they sit at opposite ends), restores the `"name category"` token sequence so the space-joined `aria-label` contains it. The a11y smoke spec is the standing regression pin (failed pre-fix, passes post-fix, re-runs on every gate).

## 6. Verification Ledger (this round)

| Gate | Command | Result |
|---|---|---|
| Install per lockfile | `npm install` | ✓ tailwind 4.3.3, react 19.3.1, vite 7.3.7, playwright 1.64.1 |
| Playwright cache | `npx playwright install chromium` | ✓ headless shell 1248 (F1) |
| Typecheck | `npm run typecheck` | ✓ silent |
| Lint | `npm run lint` | ✓ silent |
| Unit | `npm run test` | ✓ **75/75** (7 files; 69 + 6 new theme tests) |
| Build | `npm run build` | ✓ `dist/index.html` 437.01 KB (gzip 116.07 kB) |
| E2E full | `npx playwright test` | ✓ **166/166** (2.6 min; 162 + 2 new pins × 2 projects) |
| Dark spec | `tests/e2e/dark-mode.spec.ts` | ✓ 18/18 incl. the two R2-01 regression pins |
| A11y spec | `tests/e2e/a11y-smoke.spec.ts` | ✓ 20/20 post-R2-02 (was 1 failure pre-fix) |
| Live preview | production preview + agent-browser | ✓ first click flips; mobile menu traps + theme following intact |
| Captures | `docs/screenshots/` 18–20 | ✓ Pillow-gated (§ capture refresh) |
| Security | unchanged from R1 (no new surface; the pre-paint script reads only `localStorage`/`matchMedia`) | ✓ |

## 7. Decisions & Open Questions

1. **Two-state toggle over a reordered three-state cycle** — a dynamic "system → opposite(resolved) → …" cycle still leaves the final `dark → system` step visually inert on dark-OS machines. The two-state contract is the only shape with ZERO no-op transitions for every user, forever. System-following remains as the initial default. (§5.1)
2. **Whitespace fix over label/alt rewording** — the experiment proved no wording passes with the fused caption token; only real whitespace (or dropping the aria-label and accepting a verbose content-derived name) fixes it. Whitespace is invisible, zero-risk, and keeps the crafted accessible name. (§5.2)
3. **`data-theme-applied` attribute** — kept in the served HTML as permanent, e2e-pinned evidence that the pre-paint script ran; no runtime consumer.
4. **Single-commit push** — one atomic commit (fixes + tests + docs + evidence) to `main`, per the operator's standing instruction; the commit message carries the root-cause summary per the traceability doctrine.
