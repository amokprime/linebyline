
// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * Container-vs-host detection.
 *
 * The Server's `tst` bash script sets PW_CONTAINER=1 inside Podman so we can
 * branch here without filesystem heuristics. Inside the container the image is
 * ubuntu-24.04 + all browser deps preinstalled, so we enable the webkit project
 * (which is flaky/unsupported on Fedora host).
 *
 * CI (GitHub Actions ubuntu-latest) sets CI=1 — same effect for the webkit
 * project, but with stricter settings (workers=1, retries=2, forbidOnly=true)
 * which we don't want when running locally in the container.
 */
 /* istanbul ignore next -- env-detection at config-load time; PW_CONTAINER and CI env vars are exercised manually, not by unit tests */
 const inCI = !!process.env.CI;
 /* istanbul ignore next */
 const enableWebkit = !!process.env.PW_CONTAINER || inCI;

/**
 * Post-Phase E cutover (Tranche 6): the monolith (docs/index.html) is deleted,
 * the env-var branch is gone, and the suite always runs against the Vite build
 * (`dist/`, served by `npx vite preview --port 5173`).
 *
 * CI (playwright.yml) builds `dist/` via `npm run build` before running tests.
 * The server-side `tst` script + the user's `tst`/`tsta` fish functions do the
 * same. See tests/PLAYWRIGHT_SETUP.md for the SSH+Podman workflow.
 */
const baseURL = "http://localhost:5173";

/**
 * Artifact retention — failure traces + screenshots only.
 *
 * Playwright writes artifacts into `outputDir` (`./trash`). The HTML report
 * bundles these (as zips) into `playwright-report/data/`. Both folders are
 * gitignored but sync to the Server via Syncthing, where unbounded
 * accumulation tripped sync errors (see tests/SSH_SETUP.md → "Syncthing +
 * Playwright artifacts").
 *
 * Settings below retain artifacts ONLY for failed tests — passing tests'
 * artifacts are discarded after the run. This caps per-run growth at the
 * number of failures (~5-15 typically) rather than the full suite (~540).
 *
 * Values are inlined in the `use` block (not extracted to a const) because
 * .js files with `// @ts-check` don't support `as const` (TypeScript syntax).
 * Inlining lets TypeScript's contextual typing infer the literal union types
 * ("retain-on-failure", "only-on-failure") from the `use` property's type
 * definition — extracting to a `const` variable widens them to `string`,
 * which fails the type check.
 *
 *   - trace: "retain-on-failure" — record a trace for every test, then
 *     delete the trace for passing tests after the run ends.
 *   - screenshot: "only-on-failure" — only capture screenshots for
 *     failed tests. Cheap (no overhead for passing tests).
 *   - video: NOT set (defaults to "off"). Video recording for every test
 *     (`retain-on-failure`) was tried and caused 30s timeouts on
 *     firefox/webkit — real-time WebM encoding for 342 tests × 3 browsers
 *     added enough per-test overhead to trip the timeout. Traces +
 *     screenshots give sufficient debugging context without the overhead.
 */

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
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
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
    command: "npx vite preview --port 5173 --strictPort",
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
