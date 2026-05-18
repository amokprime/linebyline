const { test, expect } = require("@linebyline/test-helpers");

test("sync-time", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("w");
  await expect(page.getByText("[00:00.00] That smell")).toBeVisible();
});

test("sync-time-end", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("t");
  await expect(
    page.locator("div").filter({ hasText: /^\[00:00\.00\]$/ }),
  ).toBeVisible();
});

test("adjust-time", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("v");
  await expect(page.getByText("[00:00.10] I wish I could")).toBeVisible();
  await page.keyboard.press("z");
  await expect(page.getByText("[00:00.00] I wish I could")).toBeVisible();
});

test("adjust-seek", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Shift+Backquote");
  await page.keyboard.press("v");
  await expect(
    page.getByRole("spinbutton", { name: "Seek offset in milliseconds" }),
  ).toHaveValue("-500");
  await page.keyboard.press("Control+i");
  await expect(page.getByText("[00:02.56] That smell")).toBeVisible();
  await page.keyboard.press("z");
  await expect(
    page.getByRole("spinbutton", { name: "Seek offset in milliseconds" }),
  ).toHaveValue("-600");
});

test("replay-r", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("r");
  await expect(
    page.getByText(
      "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
    ),
  ).toHaveScreenshot();
});

test("replay-shift+r", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Shift+Backquote");
  await page.keyboard.press("d");
  await page.keyboard.press("f");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Shift+r");
  await expect(
    page.getByText(
      "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
    ),
  ).toHaveScreenshot();
});

test("replay-moving-next", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+,");
  await page.getByText("Moving to next line").check();
  await page.keyboard.press("Escape");
  await page.keyboard.press("e");
  await expect(
    page.getByText(
      "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
    ),
  ).toHaveScreenshot();
});

test("replay-sync-time", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+,");
  await page.getByText("Adjusting timestamp").check();
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("c");
  await expect(
    page.getByText(
      "[00:00.00] I wish I could identify that smell[00:04.06] That smell [00:06.35]",
    ),
  ).toHaveScreenshot();
});

test("replay-resume", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+,");
  await page
    .getByRole("checkbox", { name: "Resuming currently playing" })
    .check();
  await page.keyboard.press("Escape");
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  await page.keyboard.press("Space");
  await expect(page.locator("#audio-box")).toContainText("0:01");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});

test("replay-another-line", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+,");
  await page.getByRole("checkbox", { name: "Playing another line" }).check();
  await page.keyboard.press("Escape");
  await page.getByText("[00:03.06] That smell").click();
  await expect(page).toHaveScreenshot();
});

test("sync-empty", async ({ page }) => {
  await page.locator("#main-lines").pressSequentially("asdfzxcvt");
  expect(page.getByLabel("Lyric lines")).toMatchAriaSnapshot();
});
