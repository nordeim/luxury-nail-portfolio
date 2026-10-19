// Theme seam — dark mode is a clone superset (the reference has none;
// docs/implementation-plan.md Deviations Ledger). Class-based Tailwind v4
// strategy: `@custom-variant dark (&:where(.dark, .dark *))` in index.css.

import type { ThemeMode } from "@/types";

export const THEME_STORAGE_KEY = "aurelia.theme";

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

/**
 * Next mode for a toggle activation.
 *
 * The toggle is a TWO-STATE light ↔ dark switch: "system" is the fresh-profile
 * initial mode (honored, OS-reactive) until the first interaction, which pins
 * an explicit choice. The next state is the OPPOSITE OF WHAT IS RESOLVED ON
 * SCREEN — not a fixed order — so every click is a visible flip. The shipped
 * fixed order (system → light → dark) made the first click a visual no-op on
 * light-OS machines (remediation R2-01, docs/remediation-plan-aurelia-r2.md);
 * the invariant `nextThemeMode(mode, resolved) !== resolved` is unit-pinned.
 */
export function nextThemeMode(_current: ThemeMode, resolved: "light" | "dark"): ThemeMode {
  return resolved === "dark" ? "light" : "dark";
}

export function applyTheme(theme: "light" | "dark"): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  syncThemeColorMeta(theme);
}

/** Hex mirrors of the pinned token grounds (index.css: #f5f3ef light /
 *  #13110f dark) — the mobile browser chrome tints from
 *  meta[name=theme-color], so it must follow the resolved theme (R4-03),
 *  not sit on a static light value while the page is dark. Defensive
 *  no-op when the meta is absent (degrade-never-crash doctrine). */
const THEME_COLOR: Record<"light" | "dark", string> = {
  light: "#f5f3ef",
  dark: "#13110f",
};

export function syncThemeColorMeta(theme: "light" | "dark"): void {
  try {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[theme]);
  } catch {
    // No document / parsing edge: the toggle stays live regardless.
  }
}

export function readStoredMode(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
  } catch {
    return "system";
  }
}

export function writeStoredMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Private-mode localStorage rejection is non-fatal; the toggle stays live.
  }
}
