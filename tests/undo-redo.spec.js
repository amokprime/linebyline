const {
  test,
  expect,
  waitForImport,
  waitForLyrics,
} = require("@linebyline/test-helpers");
const META =
  "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";

test("import-main", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
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
  await page.keyboard.press("Control+z");
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.keyboard.press("Control+y");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
    "import-one-after.txt",
  );
});

test("import-two-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+4");
  await importSecondary(2, "plain_french.lrc");
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("textbox", { name: "Secondary 2 lyrics" }),
  ).toHaveValue("");
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("textbox", { name: "Secondary 1 lyrics" }),
  ).toHaveValue("");
  await page.keyboard.press("Control+y");
  expect(
    await page
      .getByRole("textbox", { name: "Secondary 1 lyrics" })
      .inputValue(),
  ).toMatchSnapshot("import-two-1.txt");
  await page.keyboard.press("Control+y");
  expect(
    await page
      .getByRole("textbox", { name: "Secondary 2 lyrics" })
      .inputValue(),
  ).toMatchSnapshot("import-two-2.txt");
});

test("paste-main", async ({
  page,
  readMedia,
  workaroundPaste: _workaroundPaste,
}) => {
  await page.locator("#main-lines").click();
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "paste-main.txt",
  );
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "paste-main.txt",
  );
});

test("sync-rapid", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
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
  await waitForLyrics(page);
  for (let i = 0; i < 3; i++) await page.keyboard.press("w");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Control+z");
  await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
});

test("typing-debounce", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").pressSequentially("abc");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
  await page.waitForTimeout(250);
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
});

test("merge", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-after-textarea.txt",
  );
  await page.keyboard.press("Control+z");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-before-textarea.txt",
  );
  await page.keyboard.press("Control+y");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "merge-after-textarea.txt",
  );
});
