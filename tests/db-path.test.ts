import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  DATABASE_URL,
  SCHEMA_DIR,
  dbPathFromRepoRoot,
  describeDbLocation,
  isLocalFileUrl,
  resolveDbPath,
} from "@/lib/db-path";

afterAll(() => {
  // No cleanup needed: mkdtemp dirs are intentionally left in the OS temp dir.
});

describe("DATABASE_URL contract", () => {
  it("pins the repo contract URL and db folder at the repo root", () => {
    expect(DATABASE_URL).toBe("file:../db/custom.db");
    expect(dbPathFromRepoRoot()).toBe("db/custom.db");
  });

  it("resolves relative file: URLs against the prisma schema dir (Prisma CLI rule)", () => {
    // ../db/custom.db from the schema anchor normalizes to repo-root db/custom.db.
    expect(resolveDbPath("file:../db/custom.db")).toBe("db/custom.db");
    expect(resolveDbPath("file:./db/local.db")).toBe("prisma/db/local.db");
    expect(resolveDbPath("../db/custom.db")).toBe("db/custom.db");
    expect(resolveDbPath("db/local.db")).toBe("prisma/db/local.db");
  });

  it("resolves to the repo-root db folder via the schema anchor", () => {
    expect(resolveDbPath("file:../db/custom.db", "prisma")).toBe("db/custom.db");
    expect(dbPathFromRepoRoot("file:../db/custom.db")).toBe("db/custom.db");
  });

  it("passes absolute paths through untouched", () => {
    expect(resolveDbPath("file:/var/data/store.db")).toBe("/var/data/store.db");
    expect(resolveDbPath("/var/data/store.db")).toBe("/var/data/store.db");
  });

  it("honors a custom schema anchor", () => {
    // prisma/schema/../db/custom.db normalizes to prisma/db/custom.db.
    expect(resolveDbPath("file:../db/custom.db", "prisma/schema")).toBe("prisma/db/custom.db");
  });

  it("classifies local file URLs", () => {
    expect(isLocalFileUrl("file:../db/custom.db")).toBe(true);
    expect(isLocalFileUrl("postgres://localhost:5432/db")).toBe(false);
    expect(isLocalFileUrl("  file:x.db ")).toBe(true);
  });

  it("writes a human-readable location line mentioning repo-root db", () => {
    const line = describeDbLocation();
    expect(line).toContain("db/custom.db");
    expect(line).toContain(DATABASE_URL);
  });

  it("matches a real repo layout where db/custom.db sits beside prisma/", () => {
    const repo = mkdtempSync(join(tmpdir(), "homenest-db-"));
    writeFileSync(join(repo, "package.json"), "{}\n");
    mkdirSync(join(repo, SCHEMA_DIR), { recursive: true });
    writeFileSync(join(repo, SCHEMA_DIR, "schema.prisma"), "datasource db {}\n");
    // The URL the .env pins must land in <repo>/db/custom.db regardless of CWD.
    expect(dbPathFromRepoRoot()).toBe("db/custom.db");
  });
});
