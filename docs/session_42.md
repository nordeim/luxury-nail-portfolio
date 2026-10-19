Session-42 execution record — twentieth sweep (Task 30)

Pulled `5f585da` (owner-added `docs/session_44.md` — the prior round's raw
transcript; zero code drift). Re-reviewed the root docs, remediation
§1–§30, worklog Tasks 1–29; environment verified (deps, agent-browser
0.39.0, `.env` contract, repo-root `db/`); Playwright chromium re-installed
(reset environment cache — a known reset quirk, hit once before in
session 39).

Baseline gate reproduced exactly: typecheck ✓ lint ✓ 104/104 unit ✓ build
528.73 KB ✓ 290/290 E2E (5.2 min) ✓.

Twentieth bidirectional sweep (agent-browser, logged into the reference,
390×844 + 1440×900). Standing pins all held: **trigger bare (measurement
12, no flip)**, account/cart plain dark glyphs, header glass
`rgba(255,255,255,0.8)` + `blur(24px)` + hairline, brand Playfair 20px/700
+ 20px glyph, footer `rgb(29,24,22)`, Inter + Playfair live, body
`rgb(251,250,249)`, mobile menu opens with all 5 links + search,
robots/sitemap/manifest live.

Then the watch-list surfaces (never measured): a fresh order was placed on
the reference (`ORD-MV8ZOL1T`, logged-in COD flow at both viewports) and
the account page was re-measured with TWO orders. Measured in full: the
order-success wrapper/rhythm (max-w-2xl py-12 space-y-8), the header (NO
icon disc — the v1 80px accent disc was a clone invention), the order
pill (bg-primary/5 + border-primary/20 + px-5 py-2 + Package 16px), the
LARGE amber COD variant (16px radius, p-5, flex gap-4, 40px amber-100
disc with a 20px amber-600 Banknote, 16px/600 amber-900 title, 14px
amber-700 body with the amount in a `<strong>`), the Order Details card
(16px radius, hairline, no shadow, bg-muted/30 header band, Playfair
16px/600 h2, 48px square images, 14px/500 names, muted totals with a
16px/700 Total row, FOUR delivery rows incl. the phone row, bg-border
dividers), the 36px pill buttons (outline shadow-sm + primary v3 shadow),
and the account orders list — which exposed the s41 "ONE card" reading as
a single-order artifact: the reference is a space-y-3 wrapper of ONE CARD
PER ORDER, each row a button that expands in place (accordion).

Wrote remediation plan §31 (F42-01…F42-15, D1–D6) under the
validate-then-execute doctrine, cross-checking every finding against
checkout-flow.tsx (OrderSuccessPage, CodNotice) and account-pages.tsx
(OrderRow).

TDD: 7 new visual-parity spec blocks appended first; RED observed (14
failing runs on the pre-change build, both projects). GREEN: 4 new tokens
in index.css (`--color-primary-line`, `--color-cod-disc`,
`--color-cod-disc-icon`, `--color-cod-title-strong`), the optional
additive `Order.phone?: string` (types + placeOrder input + the checkout
call — no seed change, no STORAGE_KEY bump), the OrderSuccessPage rewrite
(SuccessCodNotice — the measured large amber variant replacing the retired
badge-based CodNotice; card chrome + gallery band; square images; muted
totals; the phone row; 36px Link pills), and the per-order account cards
(space-y-3 list, the li IS the card). GREEN-side spec corrections: the
button shadow pins assert v3 geometry via containment (the reference
composes 2 leading transparent shadow layers, this build's v4 composes 4 —
exact strings can never match across engines); one collateral update —
the s36 success-CTA pin superseded (48px shared button → the measured
36px link, double-pinned).

Full gate green: typecheck ✓ lint ✓ 104/104 unit ✓ 529.56 KB ✓ **304/304
E2E (152 specs × 2, 5.6 min, zero collateral beyond the one superseded
pin)**.

Post-change re-sweep (agent-browser live, both viewports): every
remediated surface reference-exact — the success wrapper/py-48/rhythm,
no disc, pill alphas, the amber COD box with its disc/title/body, the
card band + square images + muted totals + 4 delivery rows, the 36px
pills, and the desktop geometry byte-for-byte (x=384/w=672); the account
list renders 2 per-order cards with the 12px seam; the mobile menu
re-checked (modal dialog, all links).

Captures under `docs/screenshots/`: 3 reference evidence
(_ref-sweep42-success-desktop/mobile, account-orders-expanded-mobile) + 2
clone before + 4 after (success mobile/desktop, account orders, mobile
menu).

Docs: remediation §31 checked-off + §31.4 gate, session_42.md (the prior
raw transcript preserved in git at `7ec9a15`), AGENTS pins + trap note,
CLAUDE counts, PAD §5.6 #20 update + #21, README badge/rows/session rows,
SKILL ledger, DEPLOYMENT.md size figure, both worklogs (repo Task 30 +
workspace). `.env.example` unchanged in sync.

Committed on main; pushed via `docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/homenest-store-g.git` (dry-run first; remote
verified; key materialized outside the repo, shredded after).

**Session-42 is fully closed.** Next watch list: the accordion stays a
registered divergence (function exceeds via the detail page); remaining
unmeasured surfaces are admin-only (superset, no reference counterpart);
tile entrance animations (transient, D8); reference drift watch; ADR-001
(server-backed auth) remains an owner decision.
