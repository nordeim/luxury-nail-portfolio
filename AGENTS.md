# AGENTS.md — Aurelia Nail Artistry

Luxury nail-studio marketing + booking SPA: Vite 7 · React 19 · TypeScript strict · Tailwind CSS 4 (CSS-first) · Vitest + Playwright, built to a single HTML file via `vite-plugin-singlefile`. Clone (functional superset) of `aurelia-nail-artistry-demo.base44.app`.

Read this file fresh before working. Full engineering reference: `Project_Architecture_Document.md`. Onboarding: `README.md`. Reference evidence: `docs/reference-investigation.md`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run verify` | The local CI: `typecheck && lint && test && build` — run before every commit |
| `npm run e2e` | Playwright (178 tests, 2 projects) against `vite preview` of the **production build** — rebuild first if `dist/` is stale |
| `npm run test` | Vitest unit suite (81 tests, node env) |
| `npm run db:setup` | Materialize + seed `db/custom.db` — **requires Node ≥ 22.5** (`node:sqlite`) |
| `npx playwright test tests/e2e/<spec>.spec.ts --project=mobile` | One spec, one profile |

**Environment gotcha:** if an ambient `DATABASE_URL` leaks into your shell from a parent workspace, `db:setup`/e2e can target the wrong file. Use `env -u DATABASE_URL npm run db:setup`. The script's containment audit hard-fails relative URLs that would land outside the repo root — that failure means your env, not the code.

## Architecture in one screen

- **Zero-server SPA** (ADR-001): runtime state lives in `localStorage` (`aurelia:v1`, store in `src/lib/store.tsx`). `DATABASE_URL` is a **tooling-only** contract (ADR-002): `file:../db/custom.db` resolves schema-relative (Prisma-style `prisma/` anchor) to `<repoRoot>/db/custom.db`. Nothing in `src/` reads it at runtime.
- **Layer rule:** pages → store/router → pure seams (`src/lib/booking.ts`, `password.ts`, `seo.ts`, `theme.ts`, `db-path.ts`) → data (`src/data/studio.ts`) → tokens (`src/index.css`). Layer-2 modules never import from Layer 4 — that's what keeps them unit-testable in bare Node.
- **`src/data/studio.ts` is the single catalog source** (services, gallery works, time slots, nav links, demo users). Never duplicate its data.
- **Routing:** custom history router (`src/lib/router.tsx`), case-insensitive `matchPath` (reference behavior: `/Gallery` ≡ `/gallery`). Pages never touch `window.history` directly.
- **Build:** `vite build` → one `dist/index.html` (~439 KB). `prebuild` regenerates `public/sitemap.xml` (with git-derived `lastmod`) + `robots.txt`; the served file carries the pre-paint theme script (R2-01) — do not strip `<head>` scripts when templating. The `theme-color` meta sits ABOVE that script (R4-03: the script tints the browser chrome in the same synchronous pass; `applyTheme` keeps it synced afterwards) — don't move it below the script or delete it.

## Tailwind v4 traps (non-negotiable pins — full report: `docs/Tailwind-V4-Validation-Report.md`)

1. **`space-y-*` has zero specificity in v4** (`:where()`). A child's explicit `mt-*` inside a `space-y-*` container now WINS and changes the layout v3 produced. Rule: **never combine `space-y-*` with child `mt-*`** — use `gap-*` flex/grid (the mobile menu does this structurally; `tests/e2e/mobile-navigation.spec.ts` pins it).
2. **`backdrop-filter` creates a containing block** that clips `position: fixed` descendants. The mobile menu is a `createPortal(document.body)` overlay for this reason. Don't add backdrop filters above fixed elements.
3. **hsl→rgb conversion drifts 1 unit per engine.** Any color an e2e test asserts must be a **hex literal** in `src/index.css` (light ground `#f5f3ef`, dark ground `#13110f`, bands `#1a1a1a`) with a comment carrying its measured rgb triple. Don't "simplify" them back to hsl.
4. **CSS block comments must not contain `*/`-forming sequences** — a comment containing `bg-*/text-*` once terminated the comment early and silently swallowed the `:root` block from the production build while the build "succeeded". Spell out `background-*/text-*` if you must name utilities in comments.
5. **Dark mode is class-based**: `@custom-variant dark (&:where(.dark, .dark *))`. Semantic tokens flip under `.dark`; components consume semantics only. **Hero tokens (`--hero-*`) never flip** — hero copy sits on photography in both themes.
6. **`@media (hover:hover)` gating**: hover styles don't apply in headless touch emulation. Use the `@custom-variant hover` (`src/index.css`) for hover-only affordances and never hide information behind hover alone (gallery has touch captions).

## Design-system rules

- **Gold is hover/border only** — it fails WCAG AA at eyebrow sizes on cream. Static gold text is forbidden (contrast sweep remediation, e2e-pinned).
- **Theme toggle is two-state** — every activation flips the RESOLVED theme (`nextThemeMode(mode, resolved) !== resolved`, unit-pinned); fresh profiles start in OS-following `system` mode until the first click pins a choice. The pre-paint head script in `index.html` applies the stored/OS theme before first paint — don't remove it (e2e-pinned via `data-theme-applied`). Theme persists under `aurelia.theme`.
- Animations: one entrance (`animate-fade-up`); `prefers-reduced-motion` disables it. No new keyframes without a reduced-motion story.

## Testing quirks (things the suite will punish you for)

- **e2e tests the shipped artifact**: `npm run build` before `npm run e2e` (Playwright's webServer runs `vite preview`). It starts its own server on :4173 — don't run one manually.
- **`toBeRequired` does not exist in Playwright** (it's jest-dom). Use `toHaveAttribute("required", "")`.
- **A `<legend>` does not label controls.** Every form control needs a programmatic name (`aria-labelledby`/`aria-label`/wrapping `label` **without extra helper text inside** — helper text inside the `<label>` aggregates into the accessible name and breaks `getByLabel(..., { exact: true })`; the password field pins this with an explicit `aria-label`).
- **Native constraints preempt custom validation.** The booking date input deliberately has **no** `min` so the custom "Choose a date in the future." alert is reachable; required-field UX stays native. Don't add native constraints that shadow a unit-pinned custom message.
- **Viewports have different affordances.** Desktop nav (`aria-label="Primary"`) is `hidden` on mobile; the menu is the `Site menu` dialog with a `Mobile` nav. Any e2e touching nav/account links must branch on `getByRole("button", { name: "Open menu" }).isVisible()`. The suite encodes this — copy the pattern.
- **Demo-user digests are test-pinned.** `tests/password.test.ts` verifies the seeds in `src/data/studio.ts` against the documented passwords. Never hand-write a digest — generate it (`hashPassword`) or compute `sha256(salt:password)`.
- **Auth redirects to `/`** on success (reference behavior), `replace: true`. Post-login assertions should target the viewport-aware session affordance.
- Unit suite: 81 · e2e: 178. If your change moves those totals, the README/AGENTS/PAD counts move with it.
- After a lockfile bump that moves Playwright, run `npx playwright install chromium` before the first e2e run (the cache pins a headless-shell revision per version).

## Tooling contracts

- **`scripts/db-setup.mjs`** mirrors `src/lib/db-path.ts` resolution rules — change both together or the pinned tests fail (`tests/db-path.test.ts`, `tests/db-scripts.test.ts`).
- **`db/` holds a `catalog.json` marker** so the gitignored-DB folder stays tracked. `db/*.db` is build output — never commit it.
- **`VITE_SITE_URL` changes** require `npm run seo:generate` + committing refreshed `public/` artifacts. The sitemap's `<lastmod>` is derived from the latest commit date across content paths (`src/data/studio.ts`, `src/pages/`, `src/index.css`, `index.html`, `public/images/`) — it is omitted loudly when git metadata is unavailable (tarball builds). Soft-404s AND private surfaces (`/account`, `/admin/*`, `/reset`) ship `noindex, follow` via the HeadManager robots upsert (the indexable set is an allowlist: the sitemap's public routes + the `/home` alias); `/home` AND case variants (`/Gallery`, `/Home`) canonicalize to the sitemap's lowercase form — keep that contract when touching `src/lib/seo.ts`.
- **Pushes go to `main` only** via the deploy-key wrapper (`docs/ssh_git_wrapper_v3.py`, procedure in `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`). Keys live outside the repo. Verify is green before push; working tree clean.

## Docs contract

Root docs (`README.md`, `AGENTS.md`, `CLAUDE.md`, `Project_Architecture_Document.md`) describe the current tree — update them in the same commit as the change that invalidates them. `docs/reference-investigation.md` is an evidence document: don't edit its observations; add deviations to `docs/implementation-plan.md`'s ledger.
