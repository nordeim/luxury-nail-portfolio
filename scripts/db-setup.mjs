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
import { dirname, isAbsolute, join } from "node:path";
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

// ── Catalog projection (flat-object scan + brace-matched users) ──────────────

function str(obj, key) {
  return new RegExp(`${key}:\\s*"([^"]*)"`).exec(obj)?.[1] ?? null;
}

function num(obj, key) {
  const match = new RegExp(`${key}:\\s*(\\d+(?:\\.\\d+)?)`).exec(obj);
  return match ? Number(match[1]) : null;
}

function bool(obj, key) {
  const match = new RegExp(`${key}:\\s*(true|false)`).exec(obj);
  return match ? match[1] === "true" : null;
}

function extractCatalog() {
  const source = readFileSync(join(ROOT, "src", "data", "catalog.ts"), "utf8");
  // Flat objects (products, categories, addresses, carousel, nav links…):
  // product/category bodies contain arrays but no nested braces, so the
  // flat-object scan is safe — same posture as generate-sitemap.mjs.
  const flat = source.match(/\{[^{}]*\}/gs) ?? [];
  const products = [];
  const categories = [];
  for (const obj of flat) {
    if (/priceCents:/.test(obj) && /slug:/.test(obj)) {
      products.push({
        id: str(obj, "id"),
        slug: str(obj, "slug"),
        name: str(obj, "name"),
        category: str(obj, "category"),
        priceCents: num(obj, "priceCents"),
        compareAtCents: num(obj, "compareAtCents"),
        rating: num(obj, "rating"),
        reviewCount: num(obj, "reviewCount"),
        stock: num(obj, "stock"),
        visible: bool(obj, "visible") ?? true,
        featured: bool(obj, "featured") ?? false,
        isNew: bool(obj, "isNew") ?? false,
        image: str(obj, "image") ?? "",
        description: str(obj, "description") ?? "",
        shippingNote: str(obj, "shippingNote") ?? "",
      });
    } else if (/blurb:/.test(obj) && !/priceCents:/.test(obj)) {
      categories.push({
        id: str(obj, "id"),
        name: str(obj, "name"),
        blurb: str(obj, "blurb") ?? "",
        image: str(obj, "image") ?? "",
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

  return { products, categories, users };
}

// ── Schema + seed ────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blurb TEXT NOT NULL,
  image TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  compare_at_cents INTEGER,
  rating REAL NOT NULL,
  review_count INTEGER NOT NULL,
  stock INTEGER NOT NULL,
  visible INTEGER NOT NULL,
  featured INTEGER NOT NULL,
  is_new INTEGER NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  shipping_note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL
);
`;

function init(db) {
  db.exec(SCHEMA);
}

function seed(db, catalog) {
  const insertCategory = db.prepare(
    "INSERT OR REPLACE INTO categories (id, name, blurb, image) VALUES (?, ?, ?, ?)",
  );
  const insertProduct = db.prepare(
    `INSERT OR REPLACE INTO products
     (id, slug, name, category, price_cents, compare_at_cents, rating,
      review_count, stock, visible, featured, is_new, image, description, shipping_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertUser = db.prepare(
    "INSERT OR REPLACE INTO users (id, email, name, role, password_hash) VALUES (?, ?, ?, ?, ?)",
  );

  db.exec("BEGIN");
  try {
    for (const c of catalog.categories) {
      insertCategory.run(c.id, c.name, c.blurb, c.image);
    }
    for (const p of catalog.products) {
      insertProduct.run(
        p.id,
        p.slug,
        p.name,
        p.category,
        p.priceCents,
        p.compareAtCents,
        p.rating,
        p.reviewCount,
        p.stock,
        p.visible ? 1 : 0,
        p.featured ? 1 : 0,
        p.isNew ? 1 : 0,
        p.image,
        p.description,
        p.shippingNote,
      );
    }
    // Password digests at rest (R5-01) — inserted as-is, never logged.
    for (const u of catalog.users) {
      insertUser.run(u.id, u.email, u.name, u.role, u.passwordHash);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    categories: catalog.categories.length,
    products: catalog.products.length,
    users: catalog.users.length,
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
      const counts = seed(db, extractCatalog());
      console.log(
        `db:seed → ${file} — ${counts.products} products, ${counts.categories} categories, ${counts.users} users`,
      );
      return;
    }
    init(db);
    const counts = seed(db, extractCatalog());
    console.log(
      `db:setup → ${file} (${url}) — ${counts.products} products, ${counts.categories} categories, ${counts.users} users`,
    );
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("[db] setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
