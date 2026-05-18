// @ts-check
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { test: base, expect } = require("@playwright/test");

/**
 * Scans archive/semantic/ for the highest semver directory
 * and returns the URL path to the matching linebyline HTML file.
 *
 * Pattern: archive/semantic/X.X.X/linebyline-X.X.X.html
 * where each X is a non-negative integer.
 *
 * @param {string} [archiveRoot='archive/semantic'] - Relative path from project root
 * @returns {string} URL path like /archive/semantic/0.35.18/linebyline-0.35.18.html
 */
function findLatestVersion(archiveRoot = "archive/semantic") {
  const absRoot = path.resolve(process.cwd(), archiveRoot);

  if (!fs.existsSync(absRoot)) {
    throw new Error(`Archive directory not found: ${absRoot}`);
  }

  const entries = fs.readdirSync(absRoot, { withFileTypes: true });

  const versions = entries
    .filter((d) => d.isDirectory() && /^\d+\.\d+\.\d+$/.test(d.name))
    .map((d) => {
      const [major, minor, patch] = d.name.split(".").map(Number);
      return { name: d.name, major, minor, patch };
    })
    .sort(
      (a, b) => b.major - a.major || b.minor - a.minor || b.patch - a.patch,
    );

  if (versions.length === 0) {
    throw new Error(`No semver directories (X.X.X) found in ${absRoot}`);
  }

  const latest = versions[0].name;
  const htmlFile = `linebyline-${latest}.html`;
  const htmlAbsPath = path.resolve(
    process.cwd(),
    archiveRoot,
    latest,
    htmlFile,
  );

  if (!fs.existsSync(htmlAbsPath)) {
    throw new Error(
      `Version directory ${latest} exists but expected file not found: ${htmlAbsPath}`,
    );
  }

  return `/${archiveRoot}/${latest}/${htmlFile}`;
}

const MEDIA_DIR = path.join(__dirname, "..", "media");
/**
 * @typedef {object} CustomFixtures
 * @property {(filename: string) => string} media - Resolves a media filename to an absolute path
 * @property {(filename: string) => string} readMedia - Reads a media file's contents as UTF-8
 * @property {(nth: number, filename: string) => Promise<void>} importSecondary - Opens nth 📂 button and sets files
 */

const test =
  /** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & CustomFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
    base.extend({
      page: async ({ page }, use) => {
        await page.goto(findLatestVersion());
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
              page.getByRole("button", { name: "Import secondary lyrics file" }).nth(nth - 1).click(),
            ]);
            await fc.setFiles([media(filename)]);
          },
        );
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
module.exports = { findLatestVersion, test, expect, tabUntilFocused };
