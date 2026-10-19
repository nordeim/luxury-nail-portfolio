# Session 34 — 2026-10-14

**Mandate:** fourteenth sweep cadence (transcript: `docs/session_33.md`) —
refresh workspace, re-validate the ledger, run the bidirectional sweep,
remediate any drift via TDD, align docs, push to `main`.

## What happened

1. `git pull` fast-forwarded 3152aa5..eb33cb4 — the remote had added only
   `docs/session_33.md` (the raw session-32 transcript, the established
   even-record/odd-transcript cadence). Root docs, session_32/33 records,
   remediation §1–§24 and the worklog (Tasks 1–23) reviewed; the
   environment survived from session 32 (deps, Playwright browsers,
   preview :4173, agent-browser, paramiko ssh shim).
2. **Baseline gate reproduced exactly:** typecheck ✓ lint ✓ 104/104 unit
   ✓ build 506.85 KB ✓ 196/196 E2E (3.6 min) ✓.
3. **Fourteenth bidirectional sweep** (agent-browser, logged in with the
   owner-supplied account; 390×844 + 1440×900). All established pins held
   on both sides — trigger bare dark icon both states on `/` and
   `/products` (**no seventh flip**), panel `rgba(255,255,255,0.8)`,
   account plain glyph, body/primary/h1, catalog 8 (ref) / 24 (clone),
   reference robots allow-all + sitemap 22, clone SEO superset (robots 5
   disallows, sitemap 36, manifest 200, PDP head green), dialog contract
   intact. **But the footer's text layer — never measured by the 12 prior
   sweeps, which pinned only its background — diverged.** Three findings:
   - **F34-01 footer text layer**: the reference renders a "quiet"
     footer (full `text-background` modulated by element opacity — 70%
     links/tagline/contact, 50% bottom bar; Playfair h4 16px/600
     headings; 20px wordmark beside a bare 24px primary house glyph —
     no orange square; orange Mail/Phone/MapPin contact icons; contained
     1px `background/10` divider; equal 4-col grid; mt-16/py-12). The
     clone had the v1 port's louder treatment (white/60 color-alpha
     links rendering ~rgb(165,163,162) vs the reference's
     ~rgb(187,186,185); 18px/700 p headings; header-mirrored brand;
     full-bleed border-t; mt-20/py-14). The prior §23 audit's
     "both sides rgb(251,250,249)" note was wrong — it read computed
     `color` and missed the element-opacity composite.
   - **F34-02 header brand geometry**: reference mark = 36px, 12px
     radius, stroke-2, shadow-sm→md hover, 20px/700 Playfair wordmark,
     normal letter-spacing; clone had rounded-lg (8px), text-[1.4rem]
     (22.4px), tracking-tight, stroke 2.2, no shadow. The radius pin
     exposed a live scale-shift trap (reference v3-era `rounded-xl` =
     12px vs this build's v4 `--radius-xl` = 20px) → fixed with
     `rounded-[12px]`.
   - **F34-03 body typeface**: the reference self-hosts Inter
     (300–700) for all body text; the clone shipped the system sans
     stack → Inter now loads via Google Fonts (the established Playfair
     pattern) and leads `--font-sans`.
4. **TDD remediation** (RED observed first, then GREEN):
   `tests/e2e/visual-parity.spec.ts` +3 specs (quiet-footer layer, brand
   mark geometry, Inter body font — 12 new computed-style pins);
   `src/components/chrome.tsx` Footer rewrite + BrandMark correction;
   `src/index.css` `--font-sans` + new `--color-footer-rule`
   (alpha-baked, T-13 doctrine); `index.html` Inter link.
5. **Post-change gate:** typecheck ✓ lint ✓ 104/104 unit ✓ build
   **508.01 KB** ✓ **202/202 E2E** (101 specs × 2 projects, 3.9 min) ✓.
   Post-change re-sweep: footer link + heading rects **pixel-identical**
   to the reference (same geometry [16,157,59,17]/[16,79,358,24], same
   bright-pixel counts 204/456, same core colors rgb(185,182,181)/
   rgb(251,250,249)); Inter loaded and first in the body stack; trigger
   bare (44px superset posture); dialog contract intact; desktop pins
   green; db contract re-verified (`env -u DATABASE_URL npm run
   db:setup` → 24 products / 8 categories / 2 users).
6. Captures → `docs/screenshots/`: 5 session captures
   (`session34-home-desktop`, `session34-pdp-desktop`,
   `session34-mobile-home`, `session34-mobile-menu-open`,
   `session34-footer-clone`) + the sweep evidence set
   (`_ref-sweep34-mobile-menu-open`, `_ref-sweep34-home-desktop`,
   `_ref-sweep34-footer`, `_ref-sweep34-footer-clone` (pre-fix),
   `_ref-sweep34-footer-rects` / `_sweep34-footer-clone-rects` (pre-fix
   rects) / `_sweep34-footer-clone-post-rects`,
   `_sweep34-clone-mobile-menu-open-post`).
7. Docs aligned: remediation plan §25, this record, AGENTS.md
   parity-pin line + trap-log instance, PAD fonts row + §5.1/§5.2 +
   §5.6 note, README badge/feature/typography + Documentation rows,
   SKILL.md typography/token rows, CLAUDE.md E2E counts, both worklogs
   (repo Task 24 + workspace). `.env.example` unchanged and in sync
   (no env change this session). DEPLOYMENT.md needed no edits (no
   env/db/deploy change; the font link is documented in PAD/README).
8. Committed on `main`; pushed via `docs/ssh_git_wrapper_v3.py --remote
   git@github.com:nordeim/homenest-store-g.git` (dry-run first; remote
   verified; key materialized outside the repo, shredded after).

## Verification ledger

| Gate | Result |
|---|---|
| typecheck | ✓ |
| lint | ✓ |
| unit (Vitest) | 104/104 ✓ |
| build (single file) | 508.01 KB ✓ |
| E2E (Playwright, 2 projects) | 202/202 ✓ (101 specs, 3.9 min) |
| bidirectional sweep | 3 findings (footer text layer, brand mark, body font) — all remediated |
| post-change pixel parity | footer link/h4 rects identical to reference ✓ |
| db contract | 24 products / 8 categories / 2 users ✓ |

## Standing posture

- The footer joins the trigger as a repeatedly-restyled surface: bg
  (s30) + text layer (s34) both now follow measured pins; the corrected
  audit method (computed color + computed opacity + pixel-sampled rects)
  is the standing footer-check recipe.
- Brand treatments are per-surface: header (orange square + shadow) vs
  footer (bare orange glyph) — mirrored independently now.
- Body typography = Inter (Google Fonts, system fallback), matching the
  reference's rendered typeface.
- Candidate list stays retired; ADR-001 (server-backed auth on the
  seeded SQLite contract) remains an owner decision.
