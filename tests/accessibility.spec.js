const { test, expect, waitForImport } = require("@linebyline/test-helpers");
import AxeBuilder from "@axe-core/playwright";

test("axe-scan-landing", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-lyrics", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  // Wait for the shadcn-vue Dialog open animation to complete before scanning.
  // Without this, axe scans during the CSS animation (data-open:animate-in)
  // and sees intermediate opacity values — the computed fgColor shifts from
  // #656d76 (defined, 5.05:1 contrast) to #707880 (mid-animation, 4.36:1),
  // failing WCAG AA's 4.5:1 threshold. The test passes locally (slower
  // hardware gives the animation time to finish) but fails in CI (faster
  // hardware → axe scans before the 200ms animation completes).
  await page.waitForTimeout(300);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
