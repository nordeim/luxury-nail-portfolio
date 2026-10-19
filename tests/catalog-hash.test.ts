import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../src/lib/storage-key";

/**
 * Catalog ↔ storage-key pairing contract (remediation follow-up #4).
 *
 * `src/data/catalog.ts` is the seed the client boots with; persisted state in
 * localStorage (`STORAGE_KEY`) shadows it on rehydrate. If the seed changes
 * without bumping `STORAGE_KEY`, returning visitors see the STALE catalog
 * (this bit the redesign — see AGENTS.md conventions).
 *
 * The registry pins each catalog revision to the storage key it was shipped
 * with. Editing the catalog without following the two-step procedure below
 * fails the gate.
 *
 * Procedure when `src/data/catalog.ts` changes intentionally:
 *   1. Bump `STORAGE_KEY` in `src/lib/storage-key.ts` (e.g. `homenest.v2` → `homenest.v3`).
 *   2. Re-run this test; copy the "observed hash" from the failure message
 *      into `tests/catalog-registry.json` mapped to the NEW storage key.
 */
const REGISTRY_PATH = join(dirname(fileURLToPath(import.meta.url)), "catalog-registry.json");

function catalogHash(): string {
  const raw = readFileSync(join(__dirname, "..", "src", "data", "catalog.ts"), "utf8");
  return createHash("sha256").update(raw.replace(/\r\n/g, "\n")).digest("hex");
}

describe("catalog ↔ storage-key registry", () => {
  it("maps the current catalog revision to the shipped STORAGE_KEY", () => {
    const hash = catalogHash();
    let registry: Record<string, string>;
    try {
      registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as Record<string, string>;
    } catch {
      throw new Error(
        `tests/catalog-registry.json is missing or unreadable. Register the current catalog hash "${hash}" → STORAGE_KEY.`,
      );
    }

    expect(
      hash in registry,
      `Unknown catalog revision (sha256 ${hash}).\n` +
        `If this change is intentional:\n` +
        `  1. bump STORAGE_KEY in src/lib/storage-key.ts,\n` +
        `  2. add "${hash}" → "<new key>" to tests/catalog-registry.json.`,
    ).toBe(true);

    expect(
      STORAGE_KEY,
      `STORAGE_KEY "${STORAGE_KEY}" does not match the registered key "${registry[hash]}" for catalog ${hash.slice(0, 12)}…. The seed and the storage key must move together.`,
    ).toBe(registry[hash]);
  });

  it("uses a versioned storage key (homenest.vN)", () => {
    expect(STORAGE_KEY).toMatch(/^homenest\.v\d+$/);
  });
});
