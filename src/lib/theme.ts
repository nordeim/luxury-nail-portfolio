// Theme seam — dark mode is a clone superset (the reference has none;
// docs/implementation-plan.md Deviations Ledger). Class-based Tailwind v4
// strategy: `@custom-variant dark (&:where(.dark, .dark *))` in index.css.

import type { ThemeMode } from "@/types";

export const THEME_STORAGE_KEY = "aurelia.theme";

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

export function applyTheme(theme: "light" | "dark"): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
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
