# Deployment Guide

Aurelia Nail Artistry ships as a **single-file Vite SPA** (`dist/index.html`,
~438 KB / ~116.5 KB gzip) with zero server and zero external services — one
static artifact plus its asset folder. This guide covers the supported
production paths and the environment contract.

## 1. Build

```bash
npm install
npm run build          # → dist/index.html (single file; SEO artifacts regenerate first)
```

The `prebuild` hook runs `npm run seo:generate`
(`scripts/generate-sitemap.mjs`), which rewrites `public/robots.txt` and
`public/sitemap.xml` from the studio catalog before Vite bundles. Every
sitemap URL carries a `<lastmod>` derived from the latest commit date
across content-affecting paths (`src/data/studio.ts`, `src/pages/`,
`src/index.css`, `index.html`, `public/images/`) — deterministic per
content state, never a build timestamp. Building from a tarball (no git
metadata) omits `<lastmod>` loudly instead of faking it. Vite then
inlines all JS/CSS into `dist/index.html` (`vite-plugin-singlefile`) and
copies `public/` — hero/studio/gallery imagery, PWA icons (including the
apple-touch and maskable variants), `robots.txt`, `sitemap.xml` —
alongside it. Never hand-edit the SEO artifacts:
`tests/sitemap.test.ts` gates the committed files against the catalog, and
the build regenerates them anyway.

The served `index.html` carries a synchronous **pre-paint theme script** in
`<head>` (remediation R2-01) that resolves the stored/OS theme before first
paint. It is dependency-free, reads only `localStorage` +
`matchMedia`, and needs no deploy-side consideration — it ships inside the
single file like everything else.

## 2. Run (serve)

There is no server process to run. Serve `dist/` from any static host:

| Context | How |
|---|---|
| Local check | `npm run preview` (vite preview, port 4173, SPA fallback) |
| Netlify / Vercel | Publish `dist/`; add an SPA rewrite (`/* → /index.html`) so deep links like `/gallery` resolve |
| GitHub Pages | Publish `dist/` with a 404.html copy of `index.html` (or a 404 → root redirect) — client routing takes over from there |
| nginx / any web server | Serve `dist/` with `try_files $uri $uri/ /index.html` |

The SPA never calls a backend: sessions, booking requests, toasts and the
admin console live in browser `localStorage` under the versioned key
`aurelia:v1`. Nothing to migrate, nothing to restart. Route matching is
case-insensitive (`/Gallery` ≡ `/gallery`, reference behavior), so hosts
that serve mixed-case deep links are safe.

## 3. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes (repo contract) | Schema-relative SQLite URL `file:../db/custom.db` — see §4. The deployed SPA never reads it; it pins the tooling storage layout (ADR-002). |
| `VITE_SITE_URL` | **Yes in production** | Absolute public origin for the SEO layer: canonical links, `og:url`, and `robots.txt`/`sitemap.xml` generation (e.g. `https://aurelia.example.com`). Defaults to `http://localhost:4173` — shipping that default to a real domain would emit wrong canonicals and sitemap URLs. |
| `E2E_PORT` / `E2E_BASE_URL` | No | Playwright preview port / base URL override (test-time only). |
| `CI` | No | Tightens Playwright (forbidOnly, 2 retries, no server reuse). |

## 4. Database location (§4 — the `.env.example` reference)

`DATABASE_URL` accepts two forms:

1. **Relative `file:` URL (the default, zero-config contract).**
   ```
   DATABASE_URL="file:../db/custom.db"
   ```
   The URL is **schema-relative** — it resolves the way the Prisma CLI
   would (against a `prisma/` anchor), so this string always points at
   `<repoRoot>/db/custom.db` regardless of the working directory. The
   resolution rules live in `src/lib/db-path.ts` and are pinned by
   `tests/db-path.test.ts` — do not simplify them.

2. **Absolute `file:` URL.**
   ```
   DATABASE_URL="file:/var/lib/aurelia/custom.db"
   ```
   Absolute paths pass through untouched. Point them at a persisted
   volume if a tool actually writes there.

`db/custom.db` is git-ignored; the repo ships `db/catalog.json` so the
folder stays tracked. Every fresh clone recreates whatever the tooling
needs from the pinned contract. The SPA's runtime state stays in
`localStorage` — see §2.

### 4.1 Materializing the contract db

```bash
npm run db:setup     # → db/custom.db — schema + services + gallery works + demo-user digests
npm run db:init      # schema only
npm run db:seed      # catalog seed only (needs db:init)
```

The scripts (`scripts/db-setup.mjs`) use Node's built-in `node:sqlite`
(Node ≥ 22.5) — zero dependencies, idempotent (`INSERT OR REPLACE`), and
deliberately Prisma-free per ADR-001: the deployed SPA still never reads
the file. They exist so the `DATABASE_URL` contract has a real referent
for tooling parity and so a future server workstream (PAD §6.3) starts
from a live, seeded database. The behavior is pinned by
`tests/db-scripts.test.ts`, including the containment audit (ADR-002):
relative URLs that would land outside the repo root hard-fail.

One caveat: a shell-level `DATABASE_URL` overrides the repo default, so
`env -u DATABASE_URL npm run db:setup` is the safe invocation when the
file must land inside the repo root.

## 5. Deploying to a different origin (SEO sync)

The committed SEO artifacts and the static head fallbacks in `index.html`
hardcode the documented default origin. When deploying to a real domain:

```bash
export VITE_SITE_URL="https://your-domain.example"
npm run build        # prebuild regenerates robots.txt + sitemap.xml with the new origin
# deploy dist/
```

The sync is test-gated: `tests/sitemap.test.ts` re-parses the committed
artifacts against the catalog, so a catalog edit without regenerating
fails the gate. `src/lib/seo.ts` reads `VITE_SITE_URL` at build time for
per-route canonicals and JSON-LD. Run the build from a git clone so the
sitemap's `<lastmod>` reflects real content history.

Note: `vite-plugin-singlefile` builds with `base: './'`, which rewrites
root-absolute `href`s in the head (manifest, apple-touch-icon) to
relative paths. That is by design and pinned in the e2e — do not
"fix" the head back to absolute paths.

## 6. Updating

```bash
git pull
npm install
npm run build
# redeploy dist/ (it is fully self-contained; no cache to warm, no process to restart)
```

Returning visitors' theme choice persists under `aurelia.theme`
(localStorage, resolved by the pre-paint script and the in-app toggle);
the demo store's data lives under the versioned `aurelia:v1` namespace. No
deploy-side migration is needed when either contract moves — the store
keys are namespaced and the pre-paint script reads the same key.

## 7. Verification checklist

```bash
npm run verify && npm run e2e    # typecheck + lint + 79 unit + build + 172 E2E runs
curl -s https://your-host/robots.txt        # admin disallowed + sitemap pointer
curl -s https://your-host/sitemap.xml       # 7 static URLs at your origin, each with a W3C <lastmod>
curl -s https://your-host/manifest.webmanifest # valid PWA manifest incl. the maskable icon entry
curl -s -o /dev/null -w "%{http_code}" https://your-host/icon-180.png  # 200 — apple-touch icon served
curl -s https://your-host/ | rg "data-theme-applied"   # pre-paint theme script present (R2-01)
curl -s https://your-host/ | rg "og:image:width"       # social-card meta present (R3-02)
curl -s -o /dev/null -w "%{http_code}" https://your-host/gallery   # 200 — SPA fallback serves index.html
```

In a browser: load the home page (hero renders in the resolved theme with
no light flash for dark users), open a deep link (`/gallery`) after a hard
refresh (SPA fallback works), submit a booking request and see the
"Request Received" confirmation, and check `document.title` changes per
route (head contract live).

## 8. Common production issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Deep links (e.g. `/gallery`, `/booking`) 404 on the host | Static host without SPA fallback | Add the rewrite/`try_files` rule from §2 — client routing owns every non-asset path |
| Wrong canonicals / sitemap URLs after deploying to a real domain | `VITE_SITE_URL` left at the default `http://localhost:4173` | Set `VITE_SITE_URL` and rebuild (§5); the prebuild hook rewrites the artifacts |
| Page paints light first, then flips dark | The pre-paint theme script is missing from the served HTML (hand-edited head or a templating layer stripped it) | Restore the synchronous `<head>` script from the repo's `index.html` (R2-01); the e2e `pre-paint` pin guards it |
| Theme toggle's first click does nothing visible | Pre-R2-01 bundle (the old `system → light → dark` cycle) | Rebuild from the current tree — the two-state cycle (R2-01) makes every activation flip the visible theme |
| `db:setup` writes outside the repo / fails with "OUTSIDE the repo root" | An ambient `DATABASE_URL` is overriding the repo contract | Run `env -u DATABASE_URL npm run db:setup` (the containment audit refuses escaping relative URLs by design, ADR-002) |
| `npm run e2e` fails to bind port 4173 | Stale preview server | `pkill -f "vite preview"`, or set `E2E_PORT` |
| Playwright wants a newer browser than the cache holds | The lockfile bumped Playwright | `npx playwright install chromium` before the first e2e run after an install |
| Sitemap has no `<lastmod>` after a build | Built from a tarball/non-git checkout | Build from a git clone — the generator omits lastmod loudly rather than guessing (§1) |
| Unknown URLs (e.g. `/garbage`) appear indexable | Pre-R3 bundle — soft-404s shipped `index, follow` | Rebuild from the current tree; unknown paths now get `noindex, follow` via the HeadManager robots upsert (R3-04) |
| Account/admin pages bounce to login after a hard refresh | You reintroduced the hydration race (navigation before the store's `ready` flag) | Gate on `ready` before redirecting — see AGENTS.md |
