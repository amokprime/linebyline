const { test, expect, waitForImport } = require("@linebyline/test-helpers");

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

async function triggerTimeUpdate(page) {
  await page.evaluate(() => {
    const audio = document.querySelector("audio");
    if (audio) audio.dispatchEvent(new Event("timeupdate"));
  });
}

async function waitForAudioPlayback(page) {
  await expect(page.locator("#time-pos")).not.toHaveText("0:00");
}

async function waitForAudioPaused(page) {
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
}

test("sync-start-end", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("w");
  let lines = await lyricLinesText(page);
  expect(lines).toContain("[00:00.00] I wish I could");
  await page.keyboard.press("Space");
  // Covers seamless trailing timestamp sync added in 0.37.0
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[1-3]$/);
  await expect(page.locator("#time-dur")).toHaveText(/^0:1[2-4]$/);
  await page.keyboard.press("t");
  const endLines = (await lyricLinesText(page)).split("\n");
  expect(endLines.some((l) => /^\[00:0[1-3]\.\d{2}\]\s*$/.test(l))).toBe(true);
});

test("adjust-time", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("v");
  let lines = await lyricLinesText(page);
  expect(lines).toContain("[00:00.10] I wish I could");
  await page.keyboard.press("z");
  lines = await lyricLinesText(page);
  expect(lines).toContain("[00:00.00] I wish I could");
});

test("adjust-seek", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Shift+Backquote");
  await page.keyboard.press("v");
  await expect(
    page.getByRole("spinbutton", { name: "Seek offset in milliseconds" }),
  ).toHaveValue("-500");
  await page.keyboard.press("Control+i");
  const lines = await lyricLinesText(page);
  expect(lines).toContain("[00:02.56] That smell");
  await page.keyboard.press("z");
  await expect(
    page.getByRole("spinbutton", { name: "Seek offset in milliseconds" }),
  ).toHaveValue("-600");
});

test("replay-r", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("r");
  await triggerTimeUpdate(page);
  await expect(page.getByLabel("Lyric lines")).toHaveScreenshot();
});

test("replay-shift+r", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Shift+Backquote");
  await page.keyboard.press("d");
  await page.keyboard.press("f");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Shift+r");
  await triggerTimeUpdate(page);
  await expect(page.getByLabel("Lyric lines")).toHaveScreenshot({
    maxDiffPixelRatio: 0.1,
  });
});

test("replay-moving-next", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+,");
  await page.getByText("Moving to next line").check();
  await page.keyboard.press("Escape");
  await page.keyboard.press("e");
  await triggerTimeUpdate(page);
  await expect(page.getByLabel("Lyric lines")).toHaveScreenshot({
    maxDiffPixelRatio: 0.1,
  });
});

test("replay-sync-time", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+,");
  await page.getByText("Adjusting timestamp").check();
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("c");
  await triggerTimeUpdate(page);
  await expect(page.getByLabel("Lyric lines")).toHaveScreenshot({
    maxDiffPixelRatio: 0.1,
  });
});

test("replay-resume", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+,");
  await page
    .getByRole("checkbox", { name: "Resuming currently playing" })
    .check();
  await page.keyboard.press("Escape");
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  await page.keyboard.press("Space");
  await expect(page.locator("#audio-box")).toContainText("0:01");
  await page.keyboard.press("Space");
  await waitForAudioPaused(page);
});

test("replay-another-line", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("checkbox", { name: "Playing another line" }).check();
  await page.keyboard.press("Escape");
  await page.getByText("[00:03.06] That smell").click();
  await waitForAudioPlayback(page);
  await page.keyboard.press("Space"); //Not needed in real browser; purely to freeze state for screenshot
  await waitForAudioPaused(page);
  await expect(page).toHaveScreenshot({
    maxDiffPixelRatio: 0.1,
  });
});

test("sync-empty", async ({ page }) => {
  await page.locator("#main-lines").pressSequentially("asdfzxcvt");
  const list = page.getByLabel("Lyric lines");
  await expect(list).toBeEmpty();
  await expect(list).toHaveRole("list");
});
