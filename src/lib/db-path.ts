/**
 * Database URL contract — mirrors the ecommerce-store reference convention.
 *
 * DATABASE_URL is SCHEMA-RELATIVE: `file:../db/custom.db` resolves the way the
 * Prisma CLI does, i.e. against a `prisma/` schema directory sitting at the repo
 * root. One URL therefore points at the same physical file (`<repoRoot>/db/custom.db`)
 * no matter which working directory a command runs from.
 *
 * The SPA itself is browser-only (state lives in localStorage); this module is
 * consumed by tooling (tests, docs, admin copy) and pinned by tests/db-path.test.ts.
 * Pinned by tests — do not simplify the resolution rules.
 */

export const DATABASE_URL = "file:../db/custom.db";

/** Directory (relative to repo root) that file: URLs resolve against, like a Prisma schema. */
export const SCHEMA_DIR = "prisma";

export function isLocalFileUrl(url: string): boolean {
  return url.trim().startsWith("file:");
}

/** Minimal POSIX path join (no node: imports so browser bundles stay clean). */
function joinPath(base: string, relative: string): string {
  const segments = `${base}/${relative}`.split("/");
  const stack: string[] = [];
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

/**
 * Resolve a `file:` URL the way Prisma does: relative paths anchor to the schema
 * directory; absolute paths pass through. Returns the plain filesystem path.
 */
export function resolveDbPath(url: string = DATABASE_URL, schemaDir: string = SCHEMA_DIR): string {
  const trimmed = url.trim();
  const raw = isLocalFileUrl(trimmed) ? trimmed.slice("file:".length) : trimmed;
  if (raw.startsWith("/")) {
    return raw;
  }
  return joinPath(schemaDir, raw);
}

/**
 * Path of the database file relative to the repo root. For the default URL this
 * is `db/custom.db` — the db/ folder at the root of the homenest-store-g repo.
 */
export function dbPathFromRepoRoot(url: string = DATABASE_URL): string {
  const resolved = resolveDbPath(url);
  const schemaPrefix = `${SCHEMA_DIR}/`;
  if (resolved.startsWith(schemaPrefix)) {
    return resolved.slice(schemaPrefix.length);
  }
  return resolved;
}

/** Human-readable location line for the admin settings surface. */
export function describeDbLocation(url: string = DATABASE_URL): string {
  return `SQLite file at repo root: ${dbPathFromRepoRoot(url)} (${url})`;
}
