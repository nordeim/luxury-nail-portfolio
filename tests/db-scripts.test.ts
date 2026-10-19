import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { GALLERY_WORKS, SERVICES } from "../src/data/studio";

/**
 * db:setup tooling contract (ADR-002) — the script materializes
 * DATABASE_URL="file:../db/custom.db" as a real SQLite file at
 * <repoRoot>/db/custom.db and seeds the Aurelia catalog into it.
 *
 * The gate runs the REAL script against a temp DATABASE_URL, then
 * cross-checks every row count against the true studio import — so
 * extraction drift in the zero-dep projection fails CI, not production.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const workspace = mkdtempSync(join(tmpdir(), "aurelia-db-"));
const dbFile = join(workspace, "custom.db");
process.env.DATABASE_URL = `file:../db/custom.db`;
process.env.AURELIA_DB_OVERRIDE_DIR = workspace;

afterAll(() => {
  rmSync(workspace, { recursive: true, force: true });
});

function runSetup(): void {
  execFileSync("node", [join(ROOT, "scripts", "db-setup.mjs")], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
    stdio: "pipe",
  });
}

describe("scripts/db-setup.mjs — the DATABASE_URL tooling contract", () => {
  it("materializes schema + seed at the resolved path", () => {
    runSetup();
    const db = new DatabaseSync(dbFile);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name as string);
    // R6-01: add_on_services joins the projection (catalog tracks the live
    // reference's ENHANCEMENTS band).
    expect(tables).toEqual([
      "add_on_services",
      "booking_requests",
      "gallery_works",
      "services",
      "users",
    ]);
    db.close();
  });

  it("seeds row counts that match the real studio import", () => {
    const db = new DatabaseSync(dbFile);
    const serviceCount = db.prepare("SELECT COUNT(*) AS n FROM services").get()?.n as number;
    const workCount = db.prepare("SELECT COUNT(*) AS n FROM gallery_works").get()?.n as number;
    const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get()?.n as number;
    expect(serviceCount).toBe(SERVICES.length);
    expect(workCount).toBe(GALLERY_WORKS.length);
    expect(userCount).toBeGreaterThanOrEqual(2);

    // Spot-check the pinned service fields (name + duration are the
    // reference-verified contract — docs/reference-investigation.md §3.3).
    const bridal = db
      .prepare("SELECT name, duration_min FROM services WHERE id = ?")
      .get("bridal-collection") as { name: string; duration_min: number } | undefined;
    expect(bridal?.name).toBe("Bridal Collection");
    expect(bridal?.duration_min).toBe(180);
    db.close();
  });

  it("projects the measured prices and the add-on catalog (R6-01)", () => {
    const db = new DatabaseSync(dbFile);
    const bespoke = db
      .prepare("SELECT price FROM services WHERE id = ?")
      .get("bespoke-nail-art") as { price: string } | undefined;
    expect(bespoke?.price).toBe("$200+");
    const addOns = db.prepare("SELECT id, name, price FROM add_on_services ORDER BY id").all() as Array<{
      id: string;
      name: string;
      price: string;
    }>;
    expect(addOns).toEqual([
      { id: "design-consultation", name: "Design Consultation", price: "Complimentary" },
      { id: "hand-massage", name: "Hand Massage", price: "$20" },
      { id: "nail-repair", name: "Nail Repair (per nail)", price: "$15" },
      { id: "paraffin-treatment", name: "Paraffin Treatment", price: "$25" },
    ]);
    db.close();
  });

  it("seeds password DIGESTS only — never plaintext", () => {
    const db = new DatabaseSync(dbFile);
    const hashes = db.prepare("SELECT password_hash FROM users").all() as Array<{
      password_hash: string;
    }>;
    for (const row of hashes) {
      expect(row.password_hash).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    }
    db.close();
  });

  it("projects featuredOrder NULL for gallery works outside the portfolio teaser", () => {
    const db = new DatabaseSync(dbFile);
    const featured = db
      .prepare("SELECT COUNT(*) AS n FROM gallery_works WHERE featured_order IS NOT NULL")
      .get()?.n as number;
    const nullOrder = db
      .prepare("SELECT COUNT(*) AS n FROM gallery_works WHERE featured_order IS NULL")
      .get()?.n as number;
    expect(featured).toBe(4);
    expect(nullOrder).toBe(GALLERY_WORKS.length - 4);
    db.close();
  });

  it("is idempotent — a second setup run keeps counts stable", () => {
    runSetup();
    const db = new DatabaseSync(dbFile);
    const serviceCount = db.prepare("SELECT COUNT(*) AS n FROM services").get()?.n as number;
    expect(serviceCount).toBe(SERVICES.length);
    db.close();
  });

  it("upgrades a pre-R6 database in place (price column backfill path)", () => {
    // Regression pin for the R6-01 schema evolution: a db materialized by
    // the pre-R6 script has services WITHOUT price and no add_on_services
    // table — db:setup must ALTER + create + seed, not fail seed.
    rmSync(dbFile, { force: true });
    const legacy = new DatabaseSync(dbFile);
    legacy.exec(`
      CREATE TABLE services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        category TEXT NOT NULL
      );
      CREATE TABLE gallery_works (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT NOT NULL,
        featured_order INTEGER
      );
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL
      );
      CREATE TABLE booking_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        service_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        notes TEXT NOT NULL,
        user_id TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    legacy.close();
    runSetup();
    const db = new DatabaseSync(dbFile);
    const columns = db.prepare("PRAGMA table_info(services)").all().map((row) => row.name as string);
    expect(columns).toContain("price");
    const bespoke = db
      .prepare("SELECT price FROM services WHERE id = ?")
      .get("bespoke-nail-art") as { price: string } | undefined;
    expect(bespoke?.price).toBe("$200+");
    const addOns = db.prepare("SELECT COUNT(*) AS n FROM add_on_services").get()?.n as number;
    expect(addOns).toBe(4);
    db.close();
  });
});

describe(".env — the operator-facing DATABASE_URL contract", () => {
  it("pins file:../db/custom.db (schema-relative → <repoRoot>/db/custom.db)", () => {
    // .env is the operator's local contract (gitignored); .env.example is the
    // committed template a fresh clone starts from. The contract must hold in
    // BOTH, so the gate reads whichever exists.
    const envPath = existsSync(join(ROOT, ".env"))
      ? join(ROOT, ".env")
      : join(ROOT, ".env.example");
    const env = readFileSync(envPath, "utf8");
    expect(env).toContain('DATABASE_URL="file:../db/custom.db"');
  });
});

describe("db-setup containment audit — the DB can never silently escape the repo", () => {
  it("clamps RELATIVE DATABASE_URLs inside the repo root even with excess '..'", () => {
    // The prisma/ anchor absorbs one '..', and the resolver's stack clamps at
    // empty — so relative URLs can only ever land INSIDE the repo root. This
    // pins that structural property (the misconfiguration class is impossible,
    // not merely rejected): excess '..' must NOT escape above <ROOT>.
    const clamped = join(ROOT, ".aurelia-clamp-tmp", "custom.db");
    rmSync(dirname(clamped), { recursive: true, force: true });
    execFileSync("node", [join(ROOT, "scripts", "db-setup.mjs")], {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: "file:../../.aurelia-clamp-tmp/custom.db" },
      stdio: "pipe",
    });
    expect(existsSync(clamped)).toBe(true);
    rmSync(dirname(clamped), { recursive: true, force: true });
  });

  it("runs with an ABSOLUTE override outside the repo but prints a prominent notice on stderr", () => {
    const outside = join(mkdtempSync(join(tmpdir(), "aurelia-db-outside-")), "custom.db");
    const result = spawnSync("node", [join(ROOT, "scripts", "db-setup.mjs")], {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: `file:${outside}` },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("OUTSIDE the repo root");
    expect(existsSync(outside)).toBe(true);
    rmSync(dirname(outside), { recursive: true, force: true });
  });
});
