# CLAUDE.md — Aurelia Nail Artistry

This file is read fresh for every conversation. Be brief and practical. The exhaustive rulebook (command table, v4 trap pins, testing quirks) is `AGENTS.md`; the full engineering reference (ADRs, topology, data architecture) is `Project_Architecture_Document.md`; onboarding is `README.md`; verified reference evidence is `docs/reference-investigation.md`.

## 1. Core Identity

**Aurelia Nail Artistry** — a production-grade luxury nail-studio marketing + booking SPA and functional superset of `aurelia-nail-artistry-demo.base44.app`. Stack: Vite 7 · React 19 · TypeScript strict · Tailwind CSS 4.1 (CSS-first) · Vitest + Playwright → single-file production build. Zero-server: runtime state in `localStorage`; SQLite (`db/custom.db`) is a tooling-only contract. Every image asset is independently generated (IP boundary — never copy reference assets).

Working agreements:

- `main` is the only branch. `npm run verify` green before every commit; `npm run e2e` green before a push (pushes go through the SSH wrapper — see `AGENTS.md § Tooling contracts`).
- Parity targets and evidence labels live in `docs/reference-investigation.md`; deliberate extensions go to the deviations ledger in `docs/implementation-plan.md`. Supersets already shipped: dark mode, accounts + role-gated admin, focus-trapped mobile menu.
- Node ≥ 20 for the SPA; Node ≥ 22.5 for `npm run db:*` (`node:sqlite`).

## 2. Six-Phase Workflow (per task)

1. **ANALYZE** — read the touched seams' pins first (`src/index.css` trap comments, `AGENTS.md § Tailwind v4 traps`). Check `docs/reference-investigation.md` before changing anything user-visible.
2. **PLAN** — name the files, the seams, and which tests move (unit 75 / e2e 166 totals).
3. **VALIDATE** — for contract-level changes (tokens, DB resolution, auth), state the before/after contract explicitly before coding.
4. **IMPLEMENT** — small diffs; layer rule (pages → store → seams → data → tokens) never inverts.
5. **VERIFY** — `npm run verify` + affected e2e specs; computed-style assertions are ground truth over eyeballing.
6. **DELIVER** — update root docs in the same commit when a contract changed; note deviations in the ledger.

## 3. Non-negotiables (fast list — details in AGENTS.md)

- No `space-y-*` with child `mt-*` (v4 specificity trap); mobile menu is a portal + focus trap; gap-based spacing only.
- e2e-asserted colors are hex literals in `index.css` (hsl drifts 1 unit); gold is hover/border only; hero tokens never flip.
- Theme toggle is **two-state** (every click flips the resolved theme); fresh profiles start in OS-following `system` mode; the pre-paint head script in `index.html` owns first-paint theming (e2e-pinned).
- Every form control has a programmatic accessible name; `<legend>` doesn't label; helper text stays out of `<label>`.
- Native constraints must not shadow unit-pinned custom validation messages.
- Never hand-write a password digest — `tests/password.test.ts` verifies the seeds.
- `env -u DATABASE_URL npm run db:setup` if an ambient `DATABASE_URL` lurks; relative URLs may not resolve outside the repo root (containment audit).

## 4. Verification Loop

```bash
npm run verify                                   # typecheck → lint → 75 unit → build
npm run e2e                                      # 166 e2e vs production preview (rebuild first)
npx playwright test tests/e2e/visual-parity.spec.ts   # parity gate alone
env -u DATABASE_URL npm run db:setup             # tooling DB at <repoRoot>/db/custom.db
```

Debugging order for a failing parity/color assertion: computed value in the test → token in `src/index.css` → hex pin present? → rebuilt `dist/`? (e2e serves the build, not the dev server.)

## 5. Error Handling Doctrine

Store/hydration failures degrade, never crash: private-mode `localStorage` rejection is non-fatal (session-only demo, e2e-pinned); validation errors render inline with `role="alert"`; auth failures keep the user signed out and show the reference-shaped message. New failure modes follow the same rule — catch, degrade, surface a readable message.

## 6. Success Criteria

You are done when: verify + e2e are green; visual output matches the measured reference (or a logged deviation); a11y contract holds (axe smoke, landmarks, labels, keyboard); docs still describe the tree; nothing in `docs/reference-investigation.md` was silently contradicted.
