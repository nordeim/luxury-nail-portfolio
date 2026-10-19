# Session 36 — 2026-10-14

**Mandate:** fifteenth sweep cadence (transcript: `docs/session_35.md`) —
refresh workspace, re-validate the ledger, run the bidirectional sweep,
remediate any drift via TDD, align docs, push to `main`.

## What happened

1. `git pull` fast-forwarded 007329d..113bc57 — the remote had added only
   `docs/session_35.md` (the raw session-34 transcript, the established
   even-record/odd-transcript cadence). Root docs, session_34/35 records,
   remediation §1–§25 and the worklog (Tasks 1–24) reviewed; the
   environment survived from session 34 (deps, Playwright browsers,
   preview :4173, agent-browser, paramiko ssh shim, .env/.env.example in
   sync, repo-root db contract).
2. **Baseline gate reproduced:** typecheck ✓ lint ✓ 104/104 unit ✓ build
   508.20 KB (190-byte class micro-drift vs the 508.01 ledger; the parity
   gate is computed styles) ✓ 202/202 E2E (3.9 min) ✓.
3. **Fifteenth bidirectional sweep** (agent-browser, logged in with the
   owner-supplied account; 390×844 + 1440×900). All standing pins held on
   both sides — trigger bare in BOTH states (**no eighth flip**; footer
   bg + quiet text layer; brand mark; Inter body; account plain glyph;
   body/primary/h1; catalog 8/24; reference robots allow-all + sitemap 22;
   clone SEO superset (robots 5 disallows, sitemap 36, manifest 200);
   dialog contract). The sweep then extended the recipe one layer deeper
   — **hover states + translucency + interior action rows** — and found
   the v4 bug class the mandate called out:
   - **F36-01 v4 hover-variant gating**: v4 wraps every `hover:*` utility
     in `@media (hover: hover)`; the v3-era reference applies hover
     styles unconditionally. In no-hover contexts (mobile emulation) the
     clone's hovers silently never fired — initially mis-read as missing
     hover classes. Verified in-tree (the compiled CSS nests
     `.hover\:bg-muted:hover` under `@layer utilities >
     @media (hover: hover)`); fixed globally with
     `@custom-variant hover (&:hover);` (scratch-build verified before
     adopting). Measurement corollary recorded: a click leaves the
     pointer on the element — move the mouse away before asserting
     RESTING styles (the sweep's first hover reading was this artifact).
   - **F36-02 trigger hover spec**: reference trigger (both states) =
     accent-green disc `rgb(69,161,130)`, white glyph, 150ms,
     rounded-full at hover; resting stays bare. Clone had none.
   - **F36-03 panel body solidity**: the reference's panel body is SOLID
     `bg-card` (pixel-verified: 100,208 pure-white px; the clone bled the
     hero through at rgb(166,157,152) behind its white/80 body). The
     session-4 "translucent white/80" pin had measured the reference's
     NAV ROOT — the header row — the same container-vs-leaves miss as
     F34-01. Panel = solid + `border-border-soft` bottom hairline +
     px-4 py-4 container.
   - **F36-04 in-panel search pill**: reference = compact 40×28 muted
     pill (`px-3 py-1.5 rounded-full bg-muted`, label
     `hidden sm:inline` — icon-only at mobile); clone shipped a 40×40
     icon disc. Tap-to-expand superset kept.
   - **F36-05 header glass**: reference nav = rgba(255,255,255,0.8) +
     **blur(24px)** + 0.5-alpha hairline; clone shipped bg-card/95 +
     blur(8px) + solid border. `--color-panel` now backs the header
     (same alpha-baked value, re-documented).
   - **F36-06/07/08 hero text layer**: reference h1 `text-4xl
     md:text-6xl` (36→60px, leading-tight), p `text-lg md:text-xl
     text-white/80 max-w-lg`, CTA `h-10 px-8 text-base font-semibold
     hover:bg-primary/90`; clone shipped 2.4rem/5xl/6xl + 16px/85%/
     max-w-md + h-12/px-7/text-sm.
   - **F36-09/10 hero controls**: dots 32×6 white / 16×6 white/40 (clone
     28/10, /50); arrows 40px white/10 blur(12px) (clone 44px, /15,
     blur 8px).
   - **F36-11 PDP action row (real bug + parity)**: the reference ships
     `flex gap-3` (ROW at every width) — Add `h-10 px-8 flex-1
     font-medium shadow hover:bg-primary/90`, Buy `h-10 px-6` (no
     flex-1). The clone's `flex-col sm:flex-row` with both `flex-1 h-12`
     **collapsed the buttons to 20-22px on mobile** — the flex algorithm
     ignores `height` under `flex-basis: 0%` (verified by mutation test:
     removing flex-1 restored 48px). A real touch-target bug AND a
     resting-visual divergence.
   - **F36-12 order-success row collapse**: same `flex-1` + h-12-in-
     flex-col pattern (`checkout-flow.tsx:808`).
   - Watch list (measured, deferred): reference category-card quick-add
     buttons (36×36, white/90, blur 4px) — the card-chrome layer is a
     registered superset surface; candidate for a future session.
4. **TDD remediation** (all pins written and observed RED first, then
   GREEN): 5 new visual-parity tests (header glass, hero text layer,
   hero CTA/controls, PDP action row, + the updated mobile-nav resting
   test) + a trigger-hover test in the mobile project (doubles as the
   un-gating regression guard) + an order-success 48px height pin;
   `src/index.css` gained the `@custom-variant hover` override and four
   alpha-baked tokens (`--color-border-soft`, `--color-hero-body`,
   `--color-dot-idle`, `--color-frost`); `chrome.tsx` (header glass,
   trigger hover, solid panel + structure, text pill); `home.tsx` (hero
   h1/p/CTA/dots/arrows); `shop.tsx` (PDP row); `checkout-flow.tsx`
   (order-success row). One spec correction during GREEN: the bare-icon
   pin now moves the pointer off the trigger before asserting (the
   un-gated hover legitimately shows under the pointer, exactly like the
   reference).
5. **Post-change gate:** typecheck ✓ lint ✓ 104/104 unit ✓ build
   **508.72 KB** ✓ **212/212 E2E** (106 specs × 2 projects, 4.2 min) ✓.
   Post-change re-sweep: header glass exact; panel body solid (pixel
   band 118,270 pure-white px, zero bleed); pill 40×28; trigger hover
   live (green disc + white glyph + 150ms); hero 36→60px / 18→20px /
   CTA 40px; PDP row **pixel-identical** to the reference (Add 236×40
   flex-1 fw 500, Buy 110×40, same baseline); order-success buttons
   48px; dialog contract + focus trap + scroll lock all green.
6. Captures → `docs/screenshots/`: 5 session captures
   (`session36-home-desktop`, `session36-pdp-desktop`,
   `session36-mobile-home`, `session36-mobile-menu-open`,
   `session36-pdp-action-row-mobile`) + the sweep evidence set
   (`_ref-sweep36-mobile-menu-open`, `_ref-sweep36-menu-check`,
   `_sweep36-clone-mobile-menu-open` (pre-fix),
   `_sweep36-clone-menu-post` (post-fix, the pixel-sampled solid panel)).
7. Docs aligned: remediation plan §26 (this session's record), AGENTS.md
   trap log #9 + #5/#8 updates + parity-pin line + panel/trigger notes,
   CLAUDE.md E2E counts + Tailwind v4 hover note, PAD token rows (panel
   re-documented + 4 new tokens) + §5.6 #13 re-measurement, README
   badge/tokens/typography + Documentation rows, SKILL.md token table +
   Appendix C, both worklogs (repo Task 25 + workspace).
   `.env.example` unchanged and in sync (no env change). DEPLOYMENT.md
   needed no edits (no env/db/deploy change).
8. Committed on `main`; pushed via `docs/ssh_git_wrapper_v3.py --remote
   git@github.com:nordeim/homenest-store-g.git` (dry-run first; remote
   verified; key materialized outside the repo, shredded after).

## Verification ledger

| Gate | Result |
|---|---|
| typecheck | ✓ |
| lint | ✓ |
| unit (Vitest) | 104/104 ✓ |
| build (single file) | 508.72 KB ✓ |
| E2E (Playwright, 2 projects) | 212/212 ✓ (106 specs, 4.2 min) |
| bidirectional sweep | 12 findings (hover gating, trigger hover, panel body, pill, header glass, hero ×3, controls ×2, PDP row, order row) — all remediated |
| post-change pixel parity | panel band solid white (118,270 px, zero bleed); PDP row identical geometry (236/110/40) ✓ |
| db contract | 24 products / 8 categories / 2 users ✓ (re-verified pre-sweep) |

## Standing posture

- The corrected measurement recipe now covers four layers: computed
  color + element opacity (s34), pixel-sampled rects (s34), the
  painting ELEMENT vs an ancestor (s36 panel), and hover states
  (s36 — move the pointer away before reading resting styles).
- The trigger's oscillation count: 7 resting measurements, still bare;
  its hover treatment is now pinned (green disc).
- Tailwind v4 traps #1–#9 all live in AGENTS.md; the hover-gating trap
  (#9) is the session's named v4 bug per the mandate.
- The candidate list stays retired; the quick-add card-chrome layer is
  on the watch list; ADR-001 (server-backed auth) remains an owner
  decision.
