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
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: inCI,
  retries: inCI ? 2 : 0,
  workers: inCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3004",
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
    command: "npx serve . -l 3004",
    url: "http://localhost:3004",
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
