import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_USERS, PRODUCTS } from "../src/data/catalog";
import { DATABASE_URL, dbPathFromRepoRoot } from "../src/lib/db-path";

/**
 * db scripts contract (session 26 — R26-03).
 *
 * `npm run db:setup` (scripts/db-setup.mjs, node:sqlite, zero dependencies)
 * materializes the ADR-002 `DATABASE_URL` contract as a REAL SQLite database:
 * schema init + catalog seed, idempotent. The SPA keeps persisting to
 * localStorage (ADR-001 — Prisma/the server stack stay rejected); the scripts
 * are tooling parity for the standing mandate ("add db scripts to package.json
 * for database initialization and data seeding", ecommerce-store naming
 * convention) and leave the PAD §6.3 server workstream a live database.
 *
 * Like tests/sitemap.test.ts, this gate cross-checks the SCRIPT's extraction
 * of src/data/catalog.ts against the real catalog import — any drift between
 * the regex projection and the module fails here, not in production.
 */

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SCRIPT = join(ROOT, "scripts", "db-setup.mjs");

let workdir: string;
let dbFile: string;

function runScript(mode?: string, env: Record<string, string> = {}) {
  const args = mode ? [SCRIPT, mode] : [SCRIPT];
  return execFileSync(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), "homenest-db-test-"));
  dbFile = join(workdir, "custom.db");
});

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

describe("db:setup script (init + seed)", () => {
  it("materializes a SQLite database at the DATABASE_URL-resolved path", () => {
    const out = runScript(undefined, { DATABASE_URL: `file:${dbFile}` });
    expect(out).toContain("db:setup");
    expect(existsSync(dbFile)).toBe(true);
  });

  it("seeds the full catalog — row counts match the real catalog import", () => {
    const db = new DatabaseSync(dbFile, { readOnly: true });
    const products = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
    const users = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    const categories = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
    db.close();

    expect(products.n).toBe(PRODUCTS.length);
    expect(users.n).toBe(DEMO_USERS.length);
    expect(categories.n).toBe(8);
  });

  it("projects product fields faithfully (cross-check against the module)", () => {
    const db = new DatabaseSync(dbFile, { readOnly: true });
    const row = db
      .prepare("SELECT slug, name, category, price_cents, rating, visible FROM products WHERE id = ?")
      .get("p-knife-set") as Record<string, string | number>;
    db.close();

    const source = PRODUCTS.find((p) => p.id === "p-knife-set");
    expect(source).toBeDefined();
    if (!source) return;
    expect(row.slug).toBe(source.slug);
    expect(row.name).toBe(source.name);
    expect(row.category).toBe(source.category);
    expect(row.price_cents).toBe(source.priceCents);
    expect(row.rating).toBe(source.rating);
    expect(row.visible).toBe(source.visible ? 1 : 0);
  });

  it("seeds demo users with their password digests and roles", () => {
    const db = new DatabaseSync(dbFile, { readOnly: true });
    const row = db
      .prepare("SELECT email, role, password_hash FROM users WHERE id = ?")
      .get("u-john") as Record<string, string>;
    db.close();

    expect(row.email).toBe("john@example.com");
    expect(row.role).toBe("customer");
    // Digest at rest (session 5) — never a plaintext password.
    expect(row.password_hash).toMatch(/^s1\$[0-9a-f]+\$[0-9a-f]{64}$/);
  });

  it("is idempotent — re-running keeps counts stable (no duplicate rows)", () => {
    runScript(undefined, { DATABASE_URL: `file:${dbFile}` });
    const db = new DatabaseSync(dbFile, { readOnly: true });
    const products = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
    const users = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
    db.close();
    expect(products.n).toBe(PRODUCTS.length);
    expect(users.n).toBe(DEMO_USERS.length);
  });
});

describe("db script modes", () => {
  it("db:init creates the schema without seeding", () => {
    const initFile = join(workdir, "init-only.db");
    runScript("--init", { DATABASE_URL: `file:${initFile}` });
    const db = new DatabaseSync(initFile, { readOnly: true });
    const products = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
    db.close();
    expect(existsSync(initFile)).toBe(true);
    expect(products.n).toBe(0);
  });

  it("db:seed fills an initialized database", () => {
    const seedFile = join(workdir, "seed-only.db");
    runScript("--init", { DATABASE_URL: `file:${seedFile}` });
    runScript("--seed", { DATABASE_URL: `file:${seedFile}` });
    const db = new DatabaseSync(seedFile, { readOnly: true });
    const products = db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
    db.close();
    expect(products.n).toBe(PRODUCTS.length);
  });
});

describe("default URL contract (ADR-002)", () => {
  it("the documented default still resolves to the repo-root db/ folder", () => {
    expect(DATABASE_URL).toBe("file:../db/custom.db");
    expect(dbPathFromRepoRoot()).toBe("db/custom.db");
  });

  it("package.json wires db:init / db:seed / db:setup scripts", async () => {
    const pkg = JSON.parse(
      (await import("node:fs")).readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts["db:init"]).toContain("db-setup.mjs");
    expect(pkg.scripts["db:seed"]).toContain("db-setup.mjs");
    expect(pkg.scripts["db:setup"]).toContain("db-setup.mjs");
  });
});
