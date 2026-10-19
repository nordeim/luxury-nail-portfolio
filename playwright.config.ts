import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

// E2E runs against the PRODUCTION build (vite preview), mirroring the
// ecommerce-store reference convention: `npm run build` before `npm run e2e`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // iPhone 14 profile on the chromium engine: keeps viewport, touch, and
      // mobile UA emulation while avoiding a WebKit install dependency
      // (WebKit needs host libs that slim CI images often lack).
      name: "mobile",
      use: { ...devices["iPhone 14"], browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort --host 127.0.0.1",
    url: BASE_URL,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
