import { describe, expect, it } from "vitest";
import { SERVICES } from "../src/data/studio";
import { SITE_DESCRIPTION, SITE_URL, buildRouteMeta } from "../src/lib/seo";

/**
 * Per-route head contract (docs/reference-investigation.md §4 — the title
 * pattern was Verified live: "Aurelia Nail Artistry" on "/", "<Page> |
 * Aurelia Nail Artistry" on "/Gallery" and "/Booking").
 *
 * The map extends to every clone route (services, about, auth, account,
 * admin, not-found) — the same superset posture the scaffold took.
 *
 * The seam is pure so it stays unit-testable in the node environment —
 * HeadManager (App.tsx) merely applies what this returns.
 */

const SUFFIX = "Aurelia Nail Artistry";

describe("seo constants", () => {
  it("exposes the Aurelia site description", () => {
    expect(SITE_DESCRIPTION).toContain("Aurelia Nail Artistry");
    expect(SITE_DESCRIPTION).toContain("Los Angeles");
  });

  it("exposes a SITE_URL with no trailing slash", () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("buildRouteMeta — route title map", () => {
  const cases: Array<[string, string]> = [
    ["/", SUFFIX],
    ["/home", SUFFIX],
    ["/gallery", `Gallery | ${SUFFIX}`],
    ["/services", `Services | ${SUFFIX}`],
    ["/about", `About | ${SUFFIX}`],
    ["/booking", `Booking | ${SUFFIX}`],
    ["/login", `Sign In | ${SUFFIX}`],
    ["/register", `Create Account | ${SUFFIX}`],
    ["/reset", `Reset Password | ${SUFFIX}`],
    ["/account", `Account | ${SUFFIX}`],
    ["/admin/bookings", `Booking Requests | ${SUFFIX}`],
    ["/nowhere", `Page Not Found | ${SUFFIX}`],
  ];

  it.each(cases)("%s → %s", (path, title) => {
    expect(buildRouteMeta(path).title).toBe(title);
  });

  it("is case-insensitive (reference router normalizes — Verified)", () => {
    expect(buildRouteMeta("/GALLERY").title).toBe(`Gallery | ${SUFFIX}`);
    expect(buildRouteMeta("/Booking").title).toBe(`Booking | ${SUFFIX}`);
  });

  it("canonical drops query and hash; og:url preserves the query (hash is meaningless in og:url)", () => {
    const meta = buildRouteMeta("/gallery?utm=x#top");
    expect(meta.canonicalUrl).toBe(`${SITE_URL}/gallery`);
    expect(meta.ogUrl).toBe(`${SITE_URL}/gallery?utm=x`);
  });

  it("carries the site description on every route", () => {
    expect(buildRouteMeta("/booking").description).toBe(SITE_DESCRIPTION);
  });

  it("describes the real service catalog in canonical meta only (no price invention)", () => {
    // Durations render on the site; the reference shows no prices and the
    // clone preserves that — the description never invents one either.
    expect(SITE_DESCRIPTION).not.toMatch(/\$/);
    expect(SERVICES.every((service) => service.durationMin > 0)).toBe(true);
  });
});
