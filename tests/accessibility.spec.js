const { test, expect } = require("@linebyline/test-helpers");
import AxeBuilder from "@axe-core/playwright";

test("axe-scan-landing", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-lyrics", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
