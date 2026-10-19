import { describe, expect, it } from "vitest";

import { nextThemeMode, resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Theme seam contract.
 *
 * Cycle design (remediation R2-01, docs/remediation-plan-aurelia-r2.md):
 * the toggle is a TWO-STATE light ↔ dark switch. "system" is the INITIAL
 * mode for fresh profiles only — it is honored (and follows OS changes)
 * until the first interaction, which always pins an explicit choice.
 *
 * The invariant under test: `nextThemeMode` never returns the currently
 * RESOLVED theme. The reported defect ("dark and light mode switching is
 * not working as expected") root-caused to the shipped system → light
 * first step being a visual NO-OP on light-OS machines; a mode whose
 * resolved value equals the current one is exactly that failure shape.
 */
describe("resolveTheme", () => {
  it("resolves system via the media query", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("passes explicit modes through unchanged", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("nextThemeMode — every click flips the visible theme", () => {
  it("sends a fresh system profile straight to the opposite of what is on screen", () => {
    // Light-OS machine (the majority): system resolves light → first click goes DARK.
    expect(nextThemeMode("system", "light")).toBe("dark");
    // Dark-OS machine: system resolves dark → first click goes LIGHT.
    expect(nextThemeMode("system", "dark")).toBe("light");
  });

  it("flips explicit states", () => {
    expect(nextThemeMode("light", "light")).toBe("dark");
    expect(nextThemeMode("dark", "dark")).toBe("light");
  });

  it("never returns the resolved theme (no-op impossibility invariant)", () => {
    for (const mode of ["system", "light", "dark"] as const) {
      for (const resolved of ["light", "dark"] as const) {
        expect(nextThemeMode(mode, resolved)).not.toBe(resolved);
      }
    }
  });

  it("keys the choice under the persisted storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("aurelia.theme");
  });
});
