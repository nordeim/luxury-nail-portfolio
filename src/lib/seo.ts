import { STUDIO } from "@/data/studio";

/**
 * Per-route head seam (scaffold session-8 pattern, re-measured for Aurelia).
 *
 * Observed reference contract (docs/reference-investigation.md, Verified):
 *   "/"        → "Aurelia Nail Artistry"
 *   "/Gallery" → "Gallery | Aurelia Nail Artistry"
 *   "/Booking" → "Booking | Aurelia Nail Artistry"
 * The clone extends the map to every route (services, about, auth, account,
 * admin, not-found) — the same superset posture the scaffold took.
 *
 * This module is the PURE seam: `buildRouteMeta` maps a location to head
 * values. `HeadManager` applies them; purity keeps it unit-pinnable in the
 * node environment (tests/seo.test.ts).
 */

type Env = Record<string, string | undefined>;

const env = (import.meta as unknown as { env?: Env }).env;

/** Absolute site origin used by canonical/og:url/sitemap. Override with
 *  `VITE_SITE_URL` (see .env.example); scripts/generate-sitemap.mjs reads
 *  the same variable and must be re-run after changing it. */
export const SITE_URL = (env?.VITE_SITE_URL ?? "http://localhost:4173").replace(/\/+$/, "");

export const SITE_DESCRIPTION =
  "Aurelia Nail Artistry — bespoke luxury nail design in Los Angeles. Editorial, bridal, and avant-garde nail artistry by Aurelia Chen.";

const SUFFIX = STUDIO.fullName;

export interface RouteMeta {
  title: string;
  description: string;
  /** Absolute canonical URL — pathname only, query/hash dropped. */
  canonicalUrl: string;
  /** Absolute og:url — query preserved. */
  ogUrl: string;
  /** Robots directive — the sitemap's public routes (+ the /home alias)
   *  are indexable; private surfaces and unknown paths (soft-404s) are
   *  not (R3-04 soft-404s, R4-02 private surfaces). */
  robots: string;
}

// The indexable set — the sitemap's public routes plus the /home alias.
// Deliberately an ALLOWLIST (fails closed): a future route added to the
// title map without touching this set lands on noindex, not on the index.
// /login + /register stay indexable — the ecommerce-store template lists
// its auth pages in the sitemap too (re-verified 2026-10-19, R4 plan §3 F2).
const INDEXABLE = new Set([
  "/",
  "/home",
  "/gallery",
  "/services",
  "/about",
  "/booking",
  "/login",
  "/register",
]);

const STATIC_TITLES: Record<string, string> = {
  "/": SUFFIX,
  "/home": SUFFIX,
  "/gallery": "Gallery",
  "/services": "Services",
  "/about": "About",
  "/booking": "Booking",
  "/login": "Sign In",
  "/register": "Create Account",
  "/reset": "Reset Password",
  "/account": "Account",
  "/admin/bookings": "Booking Requests",
};

function splitLocation(path: string): { pathname: string; search: string } {
  const hashAt = path.indexOf("#");
  const withoutHash = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const queryAt = withoutHash.indexOf("?");
  const pathname = queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash;
  const search = queryAt >= 0 ? withoutHash.slice(queryAt) : "";
  return { pathname: safeDecode(pathname), search };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildRouteMeta(path: string): RouteMeta {
  const { pathname, search } = splitLocation(path);
  const normalized = pathname.toLowerCase();
  const staticTitle = STATIC_TITLES[normalized];
  const title = staticTitle
    ? staticTitle === SUFFIX
      ? staticTitle
      : `${staticTitle} | ${SUFFIX}`
    : `Page Not Found | ${SUFFIX}`;

  // The canonical space has ONE spelling per page (R3-03 alias, R4-01 case
  // axis): /home merges into "/", and every other known route canonicalizes
  // to the lowercase form the sitemap generates — matchPath renders /Gallery
  // and /gallery identically, so a mixed-case self-canonical would compete
  // as duplicate content. Unknown paths keep their raw pathname: they are
  // noindex, so the canonical is inert there.
  const canonicalPath = normalized === "/home" ? "/" : staticTitle ? normalized : pathname;

  return {
    title,
    description: SITE_DESCRIPTION,
    canonicalUrl: `${SITE_URL}${canonicalPath}`,
    ogUrl: `${SITE_URL}${canonicalPath}${search}`,
    robots: INDEXABLE.has(normalized) ? "index, follow" : "noindex, follow",
  };
}
