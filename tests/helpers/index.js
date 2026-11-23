// @ts-check
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");

/**
 * Returns the URL path to the main app entry point.
 *
 * Two modes coexist during Phase E (pre-cutover):
 *   - Default (monolith): targets /docs/index.html, served by `npx serve . -l 3004`.
 *   - Vite-target (opt-in): targets /, served by `npx vite preview --port 5173`.
 *
 * Vite-target mode is activated by `LBL_VITE_TARGET=1` env var only.
 * No auto-detect via `dist/index.html` existence — that was too aggressive
 * in the SSH+Syncthing workflow (dist/ syncs to the server and persists,
 * so every tst run would auto-detect Vite-target, making monolith tests
 * impossible without rm -rf dist/ first).
 *
 * After Phase E Tranche 6 (monolith deletion), the env-var branch goes away
 * and this always returns "/".
 *
 * @returns {string} URL path — "/" for Vite, "/docs/index.html" for monolith
 */
function getAppUrl() {
  if (process.env.LBL_VITE_TARGET === "1") {
    return "/";
  }

  const docsIndex = path.resolve(process.cwd(), "docs", "index.html");
  if (!fs.existsSync(docsIndex)) {
    throw new Error(
      `docs/index.html not found at ${docsIndex}. Set LBL_VITE_TARGET=1 to target the Vite build instead.`,
    );
  }

  return "/docs/index.html";
}

const MEDIA_DIR = path.join(__dirname, "..", "media");
/**
 * @typedef {object} CustomFixtures
 * @property {(filename: string) => string} media - Resolves a media filename to an absolute path
 * @property {(filename: string) => string} readMedia - Reads a media file's contents as UTF-8
 * @property {(nth: number, filename: string) => Promise<void>} importSecondary - Opens nth 📂 button and sets files, then waits for the textarea to be populated
 * @property {void} workaroundPaste - Auto-setup fixture for clipboard-paste tests. Grants `clipboard-read`/`clipboard-write` permissions on chromium and skips the test on webkit. Destructure as `{ workaroundPaste: _workaroundPaste }` — the underscore prefix silences tsserver's "declared but never read" (TS6133) warning, since the fixture has no value, its presence only triggers setup.
 */

const test =
  /** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & CustomFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
    base.extend({
      page: async ({ page }, use) => {
        await page.goto(getAppUrl());
        await use(page);
      },
      media: async ({}, use) => {
        await use((/** @type {string} */ filename) =>
          path.join(MEDIA_DIR, filename),
        );
      },
      readMedia: async ({}, use) => {
        await use((/** @type {string} */ filename) =>
          fs.readFileSync(path.join(MEDIA_DIR, filename), "utf-8"),
        );
      },
      importSecondary: async ({ page, media }, use) => {
        await use(
          async (/** @type {number} */ nth, /** @type {string} */ filename) => {
            const [fc] = await Promise.all([
              page.waitForEvent("filechooser"),
              page
                .getByRole("button", { name: "Import secondary lyrics file" })
                .nth(nth - 1)
                .click(),
            ]);
            await fc.setFiles([media(filename)]);
            // Use getByRole('textbox') — getByLabel('Secondary N lyrics')
            // also matches the file input ('Secondary N lyrics file').
            await expect(
              page.getByRole("textbox", { name: `Secondary ${nth} lyrics` }),
            ).toHaveValue(/./);
          },
        );
      },
      // Auto-setup fixture: include `workaroundPaste` in a test's destructured
      // args to (1) skip the test on webkit and (2) grant clipboard-read/write
      // permissions on chromium. See CustomFixtures typedef for details.
      workaroundPaste: async ({ context, browserName }, use) => {
        test.skip(
          browserName === "webkit",
          "Webkit always generates empty snapshot from Control+V paste",
        );
        if (browserName === "chromium") {
          await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        }
        await use();
      },
    })
  );
/**
 * Press Tab repeatedly until the element matching the selector receives focus.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector
 * @param {{ index?: number, maxTabs?: number }} [options]
 */
async function tabUntilFocused(page, selector, options = {}) {
  const { index = 0, maxTabs = 50 } = options;
  const locator = page.locator(selector).nth(index);
  for (let i = 0; i < maxTabs; i++) {
    if (
      await locator.evaluate(
        (/** @type {Element} */ el) => el === document.activeElement,
      )
    )
      return;
    await page.keyboard.press("Tab");
  }
  throw new Error(
    `tabUntilFocused: ${selector}[${index}] not focused after ${maxTabs} Tabs`,
  );
}

/**
 * Wait for lyrics import to settle (active line rendered).
 * @param {import('@playwright/test').Page} page
 */
async function waitForLyrics(page) {
  await expect(page.locator(".lrc-line.cursor")).toBeVisible();
}

/**
 * Wait for audio metadata to load (duration no longer 0:00).
 * @param {import('@playwright/test').Page} page
 */
async function waitForAudio(page) {
  await expect(page.locator("#time-dur")).not.toHaveText("0:00");
}

/**
 * Wait for both lyrics and audio import to settle.
 * @param {import('@playwright/test').Page} page
 */
async function waitForImport(page) {
  await waitForLyrics(page);
  await waitForAudio(page);
}

module.exports = {
  getAppUrl,
  test,
  expect,
  tabUntilFocused,
  waitForLyrics,
  waitForAudio,
  waitForImport,
};
