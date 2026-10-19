/**
 * ESLint flat config — R16-01 (session 15/16).
 *
 * Closes the PAD §10 gap "No ESLint config" by wiring static analysis into
 * the standard gate: `npm run verify` = typecheck && lint && test && build.
 *
 * Shape follows the Vite react-ts template conventions, adapted to this repo:
 * - `skills/` is excluded from ALL checking/testing/compilation (standing
 *   operator mandate) — it is vendored documentation, not shipped code.
 * - `dist/`, `playwright-report/`, `test-results/` are build/CI artifacts.
 * - Build tooling (`vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`,
 *   `eslint.config.js`, `scripts/*.mjs`) runs in Node and gets Node globals;
 *   app/test sources run in the browser and get browser globals.
 * - Lint is NOT type-aware (tseslint `recommended`, not `recommendedTypeChecked`):
 *   the gate must stay fast and deterministic; `tsc --noEmit` already provides
 *   the type-level floor one block earlier in the verify chain.
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'skills/**',
    'docs/**',
    'public/**',
    'db/**',
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Node-side tooling and scripts: no browser globals, no React rules.
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'eslint.config.js',
      'scripts/**/*.mjs',
    ],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    // Provider+hook co-location is a deliberate architecture convention in
    // this codebase: store.tsx ships StoreProvider + useStore as one public
    // surface, router.tsx ships RouterProvider + useRouter/useQuery +
    // matchPath, chrome.tsx shares inputClass with its form components.
    // react-refresh/only-export-components exists to protect dev-time HMR
    // fast refresh; this app builds via vite-plugin-singlefile, where
    // refresh boundaries are irrelevant — so scope the rule off for exactly
    // these established modules rather than churning their import graphs
    // for zero user-facing gain. The rule stays ON for all new files.
    files: ['src/lib/store.tsx', 'src/lib/router.tsx', 'src/components/chrome.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
