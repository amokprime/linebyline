// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Container-vs-host detection.
 *
 * The Podman fish functions (tst / tsta) set PW_CONTAINER=1 so we can
 * branch here without filesystem heuristics. Inside the container the
 * image is ubuntu-24.04 + all browser deps preinstalled, so we enable
 * the webkit project (which is flaky/unsupported on Fedora host).
 *
 * CI (GitHub Actions ubuntu-latest) sets CI=1 — same effect for the
 * webkit project, but with stricter settings (workers=1, retries=2,
 * forbidOnly=true) which we don't want when running locally in the
 * container.
 */
 /* istanbul ignore next -- env-detection at config-load time; PW_CONTAINER and CI env vars are exercised manually, not by unit tests */
 const inCI = !!process.env.CI;
 /* istanbul ignore next */
 const enableWebkit = !!process.env.PW_CONTAINER || inCI;

/**
 * Phase E Tranche 2 — Vite-target mode.
 *
 * Two modes coexist during Phase E (pre-cutover):
 *   - Default (monolith): `npx serve . -l 3004` serving docs/index.html.
 *   - Vite-target (opt-in): `npx vite preview --port 5173` serving dist/.
 *
 * Vite-target mode is activated by `LBL_VITE_TARGET=1` env var only.
 * No auto-detect via `dist/index.html` existence — that was too aggressive
 * in the SSH+Syncthing workflow (dist/ syncs to the server and persists,
 * so every tst run would auto-detect Vite-target, making monolith tests
 * impossible without rm -rf dist/ first).
 *
 * Env var propagation through SSH + Podman:
 *   - The PC's `tst` abbr is `ssh Server tst` — SSH doesn't forward env
 *     vars by default, so `LBL_VITE_TARGET=1 tst` on the PC does NOT reach
 *     the server. Use `ssh Server "LBL_VITE_TARGET=1 tst"` or a `tst-vite`
 *     abbr instead (see tests/PLAYWRIGHT_SETUP.md).
 *   - The server's `tst` fish function must pass `-e LBL_VITE_TARGET=1` to
 *     Podman (see PLAYWRIGHT_SETUP.md tst function).
 *
 * After Tranche 6 (monolith deletion), the env-var branch goes away and
 * this always uses Vite preview.
 */
const viteTarget = process.env.LBL_VITE_TARGET === "1";

const baseURL = viteTarget
  ? "http://localhost:5173"
  : "http://localhost:3004";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  // Playwright specs are *.spec.js; *.test.ts under tests/unit/ belongs to the
  // vitest unit bridge (npm run test:unit) and must not be collected here —
  // the default testMatch would pick *.test.ts up and fail on the vitest import.
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 2 : 0,
  workers: inCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  outputDir: "./trash",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    ...(enableWebkit
      ? [{ name: "webkit", use: { ...devices["Desktop Safari"] } }]
      : []),
  ],

  webServer: {
    command: viteTarget
      ? "npx vite preview --port 5173 --strictPort"
      : "npx serve . -l 3004",
    url: baseURL,
    // Reuse existing server when running locally (host OR container).
    // CI never reuses — each run boots its own.
    reuseExistingServer: !inCI,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    },
  },
});
