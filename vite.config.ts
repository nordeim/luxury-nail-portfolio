import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * R18-01: viteSingleFile's recommended config forces `base: "./"`, which
 * rewrites the root-absolute manifest link to `./manifest.webmanifest`. On
 * a 2-segment SPA route (/products/<slug>) that relative href resolves to
 * /products/manifest.webmanifest — a 404. The single-file build carries no
 * other asset URLs, so restoring the root-absolute form post-transform is
 * safe and keeps the manifest discoverable at first paint on every route.
 */
const absoluteManifestLink = (): Plugin => ({
  name: "absolute-manifest-link",
  transformIndexHtml: {
    order: "post",
    handler: (html) =>
      html.replace(
        'href="./manifest.webmanifest"',
        'href="/manifest.webmanifest"',
      ),
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), absoluteManifestLink()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    // Limit dependency scanning to app sources; the vendored skills/ folder
    // contains reference HTML that breaks the scanner (imports like `three`).
    entries: ["index.html", "src/**/*.{ts,tsx}"],
  },
});
