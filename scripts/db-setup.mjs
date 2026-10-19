#!/usr/bin/env node
/**
 * db:setup — materialize the ADR-002 DATABASE_URL contract as a REAL SQLite
 * database (session 26 — R26-03).
 *
 *   npm run db:init   → schema only (CREATE TABLE IF NOT EXISTS …)
 *   npm run db:seed   → catalog seed only (assumes db:init ran)
 *   npm run db:setup  → init + seed (default when run without a flag)
 *
 * Zero dependencies: Node ≥ 22.5 ships node:sqlite. Prisma stays rejected
 * (ADR-001 — this is a zero-server SPA; runtime state still lives in
 * localStorage). The script names follow the ecommerce-store reference's
 * package.json convention; the implementation deliberately does not.
 *
 * The URL resolution mirrors src/lib/db-path.ts (schema-relative against a
 * prisma/ anchor, pinned there by tests/db-path.test.ts — 8 tests). The
 * catalog projection reuses the generate-sitemap.mjs extraction pattern; the
 * tests/db-scripts.test.ts gate cross-checks every row count and the pinned
 * product fields against the real catalog import, so extraction drift fails
 * CI, not production.
 *
 * Users seed carries password DIGESTS only (session 5, R5-01) — the script
 * never logs or transforms them.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_DIR = "prisma";
const DEFAULT_URL = "file:../db/custom.db";

// ── ADR-002 resolution rules (mirror of src/lib/db-path.ts) ──────────────────

function joinPath(base, relative) {
  const segments = `${base}/${relative}`.split("/");
  const stack = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      stack.pop();
      continue;
    }
    stack.push(segment);
  }
  return stack.join("/");
}

function resolveDbPath(url) {
  const trimmed = url.trim();
  const raw = trimmed.startsWith("file:") ? trimmed.slice("file:".length) : trimmed;
  if (raw.startsWith("/")) return raw;
  return joinPath(SCHEMA_DIR, raw);
}

function targetFile(url) {
  const resolved = resolveDbPath(url);
  if (isAbsolute(resolved)) return resolved;
  // Relative URLs anchor to the repo root the same way the Prisma CLI's
  // schema-relative resolution does (prisma/ sits at the repo root).
  return join(ROOT, resolved);
}

/**
 * Containment audit — the ADR-002 contract pins the database to
 * <repoRoot>/db/custom.db. A RELATIVE file: URL that resolves outside the
 * repo root is a misconfiguration (wrong anchor): fail loudly instead of
 * silently materializing a stray database in a parent workspace. ABSOLUTE
 * URLs are intentional overrides (CI temp workspaces, ops tooling) and stay
 * allowed, but they earn a prominent notice so the operator sees exactly
 * where the file landed.
 */
function auditContainment(url, file) {
  const rel = relative(ROOT, file);
  const escapesRepo = rel.startsWith("..") || isAbsolute(rel);
  if (!escapesRepo) return;
  const rawPath = url.trim().replace(/^file:/, "");
  if (!isAbsolute(rawPath)) {
    throw new Error(
      `[db] DATABASE_URL="${url}" resolves to ${file}, which is OUTSIDE the repo root (${ROOT}). ` +
        `Relative file: URLs anchor to the repo root and must land inside it (contract: db/custom.db). ` +
        `Fix the URL or unset the ambient DATABASE_URL.`,
    );
  }
  console.warn(
    `[db] NOTICE: DATABASE_URL="${url}" is an absolute override landing OUTSIDE the repo root:\n` +
      `[db]   → ${file}\n` +
      `[db] repo contract would be: ${join(ROOT, "db", "custom.db")}`,
  );
}

// ── Studio data projection (flat-object scan + brace-matched users) ─────────────

function str(obj, key) {
  return new RegExp(`${key}:\\s*"([^"]*)"`).exec(obj)?.[1] ?? null;
}

function num(obj, key) {
  const match = new RegExp(`${key}:\\s*(\\d+(?:\\.\\d+)?)`).exec(obj);
  return match ? Number(match[1]) : null;
}

function extractStudio() {
  const source = readFileSync(join(ROOT, "src", "data", "studio.ts"), "utf8");
  // Flat objects (services, gallery works): bodies contain strings but no
  // nested braces, so the flat-object scan is safe — same posture as
  // generate-sitemap.mjs.
  const flat = source.match(/\{[^{}]*\}/gs) ?? [];
  const services = [];
  const works = [];
  for (const obj of flat) {
    if (/durationMin:/.test(obj) && /serviceId|category:/.test(obj) && !/featuredOrder:/.test(obj)) {
      services.push({
        id: str(obj, "id"),
        name: str(obj, "name"),
        description: str(obj, "description") ?? "",
        durationMin: num(obj, "durationMin") ?? 0,
        category: str(obj, "category") ?? "signature",
      });
    } else if (/featuredOrder:/.test(obj) && /image:/.test(obj)) {
      const orderMatch = /featuredOrder:\s*(\d+|null)/.exec(obj);
      works.push({
        id: str(obj, "id"),
        name: str(obj, "name"),
        category: str(obj, "category") ?? "classic",
        image: str(obj, "image") ?? "",
        featuredOrder: orderMatch && orderMatch[1] !== "null" ? Number(orderMatch[1]) : null,
      });
    }
  }

  // Users nest address objects (braces), so the flat scan cannot capture a
  // whole user — brace-match the top-level objects inside the DEMO_USERS block.
  const users = [];
  const marker = /export const DEMO_USERS[\s\S]*?=\s*\[/.exec(source);
  if (marker) {
    const start = marker.index + marker[0].length;
    const end = source.indexOf("\n];", start);
    const block = source.slice(start, end < 0 ? source.length : end);
    let depth = 0;
    let objStart = -1;
    for (let i = 0; i < block.length; i += 1) {
      if (block[i] === "{") {
        if (depth === 0) objStart = i;
        depth += 1;
      } else if (block[i] === "}") {
        depth -= 1;
        if (depth === 0 && objStart >= 0) {
          const obj = block.slice(objStart, i + 1);
          if (/passwordHash:/.test(obj)) {
            users.push({
              id: str(obj, "id"),
              email: str(obj, "email"),
              name: str(obj, "name"),
              role: str(obj, "role") ?? "customer",
              passwordHash: str(obj, "passwordHash") ?? "",
            });
          }
          objStart = -1;
        }
      }
    }
  }

  return { services, works, users };
}

// ── Schema + seed ────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  category TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gallery_works (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  featured_order INTEGER
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS booking_requests (
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
`;

function init(db) {
  db.exec(SCHEMA);
}

function seed(db, studio) {
  const insertService = db.prepare(
    "INSERT OR REPLACE INTO services (id, name, description, duration_min, category) VALUES (?, ?, ?, ?, ?)",
  );
  const insertWork = db.prepare(
    "INSERT OR REPLACE INTO gallery_works (id, name, category, image, featured_order) VALUES (?, ?, ?, ?, ?)",
  );
  const insertUser = db.prepare(
    "INSERT OR REPLACE INTO users (id, email, name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
  );

  db.exec("BEGIN");
  try {
    for (const s of studio.services) {
      insertService.run(s.id, s.name, s.description, s.durationMin, s.category);
    }
    for (const w of studio.works) {
      insertWork.run(w.id, w.name, w.category, w.image, w.featuredOrder);
    }
    // Password digests at rest — inserted as-is, never logged.
    for (const u of studio.users) {
      insertUser.run(u.id, u.email, u.name, u.role, u.passwordHash);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    services: studio.services.length,
    works: studio.works.length,
    users: studio.users.length,
  };
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2] ?? "";
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;

  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    console.error(
      "[db] node:sqlite is unavailable — use Node.js >= 22.5 (the repo requires Node >= 20 for the SPA; db scripts need the newer runtime).",
    );
    process.exit(1);
  }

  const file = targetFile(url);
  auditContainment(url, file);
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);

  try {
    if (mode === "--init") {
      init(db);
      console.log(`db:init → ${file} (schema created; seed with npm run db:seed)`);
      return;
    }
    if (mode === "--seed") {
      if (!existsSync(file)) {
        console.error("[db] no database at the resolved path — run npm run db:init first.");
        process.exit(1);
      }
      const counts = seed(db, extractStudio());
      console.log(
        `db:seed → ${file} — ${counts.services} services, ${counts.works} gallery works, ${counts.users} users`,
      );
      return;
    }
    init(db);
    const counts = seed(db, extractStudio());
    console.log(
      `db:setup → ${file} (${url}) — ${counts.services} services, ${counts.works} gallery works, ${counts.users} users`,
    );
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("[db] setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
