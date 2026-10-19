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
}

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
  const staticTitle = STATIC_TITLES[pathname.toLowerCase()];
  const title = staticTitle
    ? staticTitle === SUFFIX
      ? staticTitle
      : `${staticTitle} | ${SUFFIX}`
    : `Page Not Found | ${SUFFIX}`;

  return {
    title,
    description: SITE_DESCRIPTION,
    canonicalUrl: `${SITE_URL}${pathname}`,
    ogUrl: `${SITE_URL}${pathname}${search}`,
  };
}
