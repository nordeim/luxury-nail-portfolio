// Versioned storage key: bump when PersistedState's shape or the seed data
// changes so stale client data re-seeds instead of shadowing the new seed.
//
// Dependency-free module so node-env contract tests can import it without
// pulling React. Owned by tests/storage-key.test.ts alongside the seed data.
export const STORAGE_KEY = "aurelia.v1";
