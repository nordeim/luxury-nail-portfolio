/**
 * Password-at-rest primitives (session 5, R5-01 — downgrades F-10).
 *
 * The demo store is client-only, so there is no server to run a proper KDF
 * (argon2/bcrypt). That constraint does NOT force plaintext at rest: records
 * store a salted WebCrypto SHA-256 digest,
 *
 *     s1$<32-hex-salt>$<64-hex-sha256-of("salt:password")>
 *
 * - The salt is 16 CSPRNG bytes (`crypto.getRandomValues`, same doctrine as
 *   `generateGuestToken` in commerce.ts) and is unique per record.
 * - SHA-256 is fast by design — it is NOT a KDF. This is defense-in-depth
 *   against casual localStorage disclosure, not a substitute for the
 *   server-backed auth workstream (registered divergence, PAD §Security).
 * - Legacy plaintext records (pre-session-5 persisted users and the old
 *   demo seed) still verify: `verifyPassword` falls back to a direct
 *   comparison when the stored value is not an `s1$` record, and the store
 *   migrates such records to hashes on successful login (upgrade-on-login).
 *
 * WebCrypto (`crypto.subtle`) is available in every modern browser and in
 * the node test environment — no dependency added.
 */

const HASH_PREFIX = "s1";
const SALT_BYTES = 16;

const SALT_PATTERN = /^[0-9a-f]{32}$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;

export function isHashedPassword(value: string): boolean {
  const parts = value.split("$");
  return (
    parts.length === 3 &&
    parts[0] === HASH_PREFIX &&
    SALT_PATTERN.test(parts[1]) &&
    DIGEST_PATTERN.test(parts[2])
  );
}

export function randomSalt(): string {
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function digestHex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string = randomSalt()): Promise<string> {
  if (!SALT_PATTERN.test(salt)) {
    throw new Error("password salt must be 32 hex chars");
  }
  const digest = await digestHex(`${salt}:${password}`);
  return `${HASH_PREFIX}$${salt}$${digest}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isHashedPassword(stored)) {
    // Legacy plaintext record (or a plain equal check) — the caller migrates
    // these to a salted hash on successful login.
    return stored === password;
  }
  const [, salt, expected] = stored.split("$");
  const digest = await digestHex(`${salt}:${password}`);
  // Length check + early exit; comparing hex strings, not secrets in raw form.
  if (digest.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < digest.length; index += 1) {
    mismatch |= digest.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}
