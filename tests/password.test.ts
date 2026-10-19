import { describe, expect, it } from "vitest";
import {
  hashPassword,
  isHashedPassword,
  randomSalt,
  verifyPassword,
} from "@/lib/password";

/**
 * Password hashing contract (session 5, R5-01 — downgrades F-10).
 *
 * The demo store is client-only, so passwords cannot receive a server-side
 * KDF; they no longer have to sit in localStorage as plaintext either. The
 * contract:
 *
 *   stored format  `s1$<32-hex-salt>$<64-hex-sha256(salt:password)>`
 *   salt           16 CSPRNG bytes, hex — unique per record
 *   verify         recomputes with the stored salt; ALSO accepts legacy
 *                  plaintext records (upgrade-on-login migrates them)
 *
 * WebCrypto SHA-256 is available in every modern browser and in the node
 * test env (globalThis.crypto) — no dependency added.
 */
describe("password hashing contract", () => {
  it("randomSalt returns 32 hex chars and is unique per call", () => {
    const a = randomSalt();
    const b = randomSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(b).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });

  it("hashPassword returns the s1$salt$digest format", async () => {
    const stored = await hashPassword("Demo1234!");
    const parts = stored.split("$");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("s1");
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for a fixed salt (salt:password digest)", async () => {
    const salt = "0123456789abcdef0123456789abcdef";
    const a = await hashPassword("Demo1234!", salt);
    const b = await hashPassword("Demo1234!", salt);
    expect(a).toBe(b);
    expect(a).toBe(`s1$${salt}$${a.split("$")[2]}`);
  });

  it("different salts yield different digests for the same password", async () => {
    const a = await hashPassword("Demo1234!");
    const b = await hashPassword("Demo1234!");
    expect(a).not.toBe(b);
  });

  it("isHashedPassword accepts only well-formed s1 records", async () => {
    const stored = await hashPassword("Demo1234!");
    expect(isHashedPassword(stored)).toBe(true);
    expect(isHashedPassword("Demo1234!")).toBe(false);
    expect(isHashedPassword("s1$short$stuff")).toBe(false);
    expect(isHashedPassword("")).toBe(false);
  });

  it("verifyPassword round-trips the correct password and rejects wrong ones", async () => {
    const stored = await hashPassword("Demo1234!");
    expect(await verifyPassword("Demo1234!", stored)).toBe(true);
    expect(await verifyPassword("demo1234!", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("verifyPassword keeps accepting legacy plaintext records (upgrade-on-login path)", async () => {
    expect(await verifyPassword("Demo1234!", "Demo1234!")).toBe(true);
    expect(await verifyPassword("wrong", "Demo1234!")).toBe(false);
  });

  it("never embeds the plaintext password in the stored record", async () => {
    const stored = await hashPassword("Demo1234!");
    expect(stored).not.toContain("Demo1234!");
    // The record is only ever: prefix, hex salt, hex digest, separators.
    expect(stored).toMatch(/^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  });
});
