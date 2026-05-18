const { test, expect } = require("@linebyline/test-helpers");

test("controls-disabled", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Backquote");
  await expect(page.locator("#left-panel")).toMatchAriaSnapshot({
    name: "controls-disabled.yml",
  });
  await page.keyboard.press("Space");
  await page.keyboard.press("w");
  await page.keyboard.press("q");
  await page.keyboard.press("r");
  await page.keyboard.press("t");
  await page.keyboard.press("z");
  await page.keyboard.press("v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot();
});

test("arrow-nav-skip", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await expect(page.getByText("plain_english")).toBeVisible();
  for (let i = 0; i < 2; i++) await page.keyboard.press("ArrowDown");
  await expect(page).toHaveScreenshot("arrow-down.png");
  await page.keyboard.press("ArrowUp");
  await expect(page).toHaveScreenshot("arrow-up.png");
});

test("meta-playing-update", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page
    .locator("#main-textarea")
    .fill(
      "[ti: TestTitle]\n[ar: TestArtist]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
    );
  await page.keyboard.press("Backquote");
  await expect(page.getByText("TestTitle")).toBeVisible();
  await expect(page.getByText("TestArtist")).toBeVisible();
});

test("meta-save-update", async ({ page }) => {
  await page.keyboard.press("Backquote");
  const META =
    "[ti: TestTitle]\n[ar: TestArtist]\n[al: TestAlbum]\n[re: TestTool]\n";
  await page.locator("#main-textarea").fill(META);
  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download
    .path()
    .then((p) => require("fs").readFileSync(p, "utf-8"));
  const filename = download.suggestedFilename();
  expect(content).toMatch(META);
  expect(filename).toBe("TestTitle.lrc");
});

test("paren-close", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.keyboard.press("(");
  await page.keyboard.press("Backquote");
  await expect(page.getByText("()")).toBeVisible();
});

test("brackets-close", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.keyboard.press("[");
  await page.keyboard.press("Backquote");
  await expect(page.getByText("[]")).toBeVisible();
});

test("paren-wrap", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await page.keyboard.press("Backquote");
  await page.keyboard.press("(");
  await page.keyboard.press("Backquote");
  await expect(
    page.getByText("(I wish I could identify that smell)"),
  ).toBeVisible();
});

test("paren-wrap-select", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await page.keyboard.press("Backquote");
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.up("Shift");
  await page.keyboard.press("(");
  await page.keyboard.press("Backquote");
  await expect(page.getByText("(I wish I could identify that")).toBeVisible();
  await expect(page.getByText("That smell)")).toBeVisible();
});
