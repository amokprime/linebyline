const { test, expect } = require("@linebyline/test-helpers");

test("import-main", async ({ page, media }) => {
  const lines = () => page.locator("#main-lines").innerText();
  const lyrics = () => page.locator("#main-textarea").inputValue();
  expect(await lines()).toMatchSnapshot("import-before-lines.txt");
  expect(await lyrics()).toMatchSnapshot("import-before-textarea.txt");
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  expect(await lines()).toMatchSnapshot("import-after-lines.txt");
  expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt");
  await page.keyboard.press("Control+z");
  expect(await lines()).toMatchSnapshot("import-before-lines.txt");
  expect(await lyrics()).toMatchSnapshot("import-before-textarea.txt");
  await page.keyboard.press("Control+y");
  expect(await lines()).toMatchSnapshot("import-after-lines.txt");
  expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt");
});

test("import-one-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  const lyrics = () => page.getByRole("textbox").inputValue();
  expect(await lyrics()).toMatchSnapshot("import-one-before.txt");
  await importSecondary(1, "plain_spanish.lrc");
  expect(await lyrics()).toMatchSnapshot("import-one-after.txt");
  await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  expect(await lyrics()).toMatchSnapshot("import-one-before.txt");
  await page.keyboard.press("Control+y");
  expect(await lyrics()).toMatchSnapshot("import-one-after.txt");
});

//Placeholder for when one secondary is fixed

test("paste-main", async ({ page, readMedia }) => {
  const lines = () => page.locator("#main-lines").innerText();
  const lyrics = () => page.locator("#main-textarea").inputValue();
  expect(await lines()).toMatchSnapshot("paste-main-lines-before.txt");
  expect(await lyrics()).toMatchSnapshot("paste-main-lyrics-before.txt");
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await lines()).toMatchSnapshot("paste-main-lines-after.txt");
  expect(await lyrics()).toMatchSnapshot("paste-main-lyrics-after.txt");
  await page.keyboard.press("Control+z");
  expect(await lines()).toMatchSnapshot("paste-main-lines-before.txt");
  expect(await lyrics()).toMatchSnapshot("paste-main-lyrics-before.txt");
  await page.keyboard.press("Control+y");
  expect(await lines()).toMatchSnapshot("paste-main-lines-after.txt");
  expect(await lyrics()).toMatchSnapshot("paste-main-lyrics-after.txt");
});

test("sync-rapid", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await page.keyboard.press("w");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
  await page.keyboard.press("Control+Y");
  await expect(page.locator("#main-lines")).toContainText(/\d{2}:\d{2}/);
});

test("sync-repeat", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  for (let i = 0; i < 3; i++) await page.keyboard.press("w");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
});

test("typing-debounce", async ({ page }) => {
  await page.keyboard.press("Backquote");
  const lyrics = () => page.locator("#main-textarea").inputValue();
  await page.locator("#main-textarea").pressSequentially("abc");
  expect(await lyrics()).toMatchSnapshot("typing-debounce-before.txt");
  await page.keyboard.press("Control+z");
  expect(await lyrics()).toMatchSnapshot("typing-debounce-after.txt");
});

test("merge", async ({ page, media, importSecondary }) => {
  const lines = () => page.locator("#main-lines").innerText();
  const lyrics = () => page.locator("#main-textarea").inputValue();
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  expect(await lines()).toMatchSnapshot("merge-before-lines.txt");
  expect(await lyrics()).toMatchSnapshot("merge-before-textarea.txt");
  await page.keyboard.press("Control+6");
  expect(await lines()).toMatchSnapshot("merge-after-lines.txt");
  expect(await lyrics()).toMatchSnapshot("merge-after-textarea.txt");
  await page.keyboard.press("Control+z");
  expect(await lines()).toMatchSnapshot("merge-before-lines.txt");
  expect(await lyrics()).toMatchSnapshot("merge-before-textarea.txt");
  await page.keyboard.press("Control+y");
  expect(await lines()).toMatchSnapshot("merge-after-lines.txt");
  expect(await lyrics()).toMatchSnapshot("merge-after-textarea.txt");
});
