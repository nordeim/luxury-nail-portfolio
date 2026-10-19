// Versioned storage key: bump when PersistedState's shape or the seed catalog
// changes so stale client data re-seeds instead of shadowing the new catalog.
//
// This lives in its own dependency-free module so the contract test
// (`tests/catalog-hash.test.ts`) can import it in the node env without
// pulling React. The catalog-hash test enforces the pairing between this key
// and the seed catalog: change `src/data/catalog.ts` without bumping this key
// and the gate fails.
export const STORAGE_KEY = "homenest.v4";
