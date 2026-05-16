const { test, expect } = require("@linebyline/test-helpers");
const META =
  "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";
const ta = (page) => page.locator("#main-textarea");

test("import-main", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-main-after.txt",
  );
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-main-after.txt",
  );
});

test("import-one-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
    "import-one-after.txt",
  );
  await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.keyboard.press("Control+y");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
    "import-one-after.txt",
  );
});

//Placeholder for when one secondary is fixed

test("paste-main", async ({ page, readMedia }) => {
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-main-after.txt",
  );
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-main-after.txt",
  );
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
  await page.locator("#main-textarea").pressSequentially("abc");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
});

test("merge", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-after-textarea.txt",
  );
  await page.keyboard.press("Control+z");
  // Pre-merge state is synced_english — can't use META since import changed it
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-before-textarea.txt",
  );
  await page.keyboard.press("Control+y");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-after-textarea.txt",
  );
});
