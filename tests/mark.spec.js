const { test, expect, waitForImport } = require("@linebyline/test-helpers");

test("inline-paren-arrow", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("translation_inline.lrc")]);
  await waitForImport(page);
  await expect(page.getByRole("checkbox", { name: "( )" })).toBeChecked();
  await page.getByRole("checkbox", { name: "↩" }).check();
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown"); //This also tests blank line skip (i < 3 vs i < 4)
  await page.keyboard.press("Control+ArrowLeft");
  await expect(
    page.getByText("[00:08.07] (It disturbs my concentration)"),
  ).toBeVisible();
});

test("inline-plain-arrow", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("translation_inline.lrc")]);
  await waitForImport(page);
  await page.getByRole("checkbox", { name: "( )" }).uncheck();
  await page.getByRole("checkbox", { name: "↩" }).check();
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown"); //This also tests blank line skip (i < 3 vs i < 4)
  await page.keyboard.press("Control+ArrowLeft");
  await expect(
    page.getByText("[00:08.07] It disturbs my concentration"),
  ).toBeVisible();
});

test("inline-paren-e", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("translation_inline.lrc")]);
  await waitForImport(page);
  await expect(page.getByRole("checkbox", { name: "( )" })).toBeChecked();
  await page.getByRole("checkbox", { name: "↩" }).check();
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  for (let i = 0; i < 3; i++) await page.keyboard.press("e"); //This also tests blank line skip (i < 3 vs i < 4)
  await page.keyboard.press("Control+ArrowLeft");
  await expect(
    page.getByText("[00:08.07] (It disturbs my concentration)"),
  ).toBeVisible();
});

test("split-paren", async ({ page, media }) => {
  await expect(page.getByRole("checkbox", { name: "( )" })).toBeChecked();
  await page.getByRole("checkbox", { name: "↩" }).check();
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("translation_split.lrc")]);
  await waitForImport(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "split-paren-textarea.txt",
  );
});

test("split-plain", async ({ page, media }) => {
  await page.getByRole("checkbox", { name: "( )" }).uncheck();
  await page.getByRole("checkbox", { name: "↩" }).check();
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("translation_split.lrc")]);
  await waitForImport(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "split-plain-textarea.txt",
  );
});
