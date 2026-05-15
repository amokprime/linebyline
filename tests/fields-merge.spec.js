const { test, expect } = require("@linebyline/test-helpers");

test("hide-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+5");
  await page.keyboard.press("Control+4");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot();
});

test("replace-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await importSecondary(1, "plain_french.lrc");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot();
});

test("paste-secondary-genius", async ({ page, readMedia }) => {
  await page.keyboard.press("Control+4");
  await page.getByRole("textbox").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("mock.txt"));
  await page.keyboard.press("Control+v");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot();
});

test("font", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  const fontSelect = page.getByRole("combobox", { name: "Editor font" });
  await fontSelect.selectOption("serif");
  for (let i = 0; i < 5; i++)
    await page.getByTitle("Increase font size").click();
  await expect(page).toHaveScreenshot("font-hotkey.png");
  await page.locator("#left-panel-header").click();
  await page.keyboard.press("Backquote");
  await expect(page).toHaveScreenshot("font-typing.png");
});

test("merge-one", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-one-lines.txt",
  );
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-one-textarea.txt",
  );
});

test("merge-two", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+4");
  await importSecondary(2, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-two-lines.txt",
  );
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-two-textarea.txt",
  );
});

test("merge-no-timestamps", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  await expect(page).toHaveScreenshot();
});

test("merge-no-trailing", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("no_trailing.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.locator("#left-panel-header").click();
  await page.keyboard.press("Backquote");
  await page.keyboard.press("Control+6");
  await expect(page).toHaveScreenshot();
});

test("merge-line-mismatch", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish_mismatch.lrc");
  await page.keyboard.press("Control+6");
  await expect(page).toHaveScreenshot();
});

test("merge-block-reload", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("F5");
  await expect(page).toHaveScreenshot();
});

test("reload-merge-disabled", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toHaveScreenshot();
});
