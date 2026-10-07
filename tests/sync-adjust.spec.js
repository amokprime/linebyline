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
  await page.getByRole("checkbox", { name: "Moving to next line" }).check();
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
  await page.getByRole("checkbox", { name: "Adjusting timestamp" }).check();
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
  await page.locator("#left-panel-header").click();
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
  await page.keyboard.press("Space");
  await waitForAudioPaused(page);
  await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.1 });
});

test("sync-empty", async ({ page }) => {
  await page.locator("#main-lines").pressSequentially("asdfzxcvt");
  const list = page.getByLabel("Lyric lines");
  await expect(list).toBeEmpty();
  await expect(list).toHaveRole("list");
});

// Tranche 4.5 (ROADMAP.md) — cursor moves with Q/E.
test("cursor-moves-with-q-e", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await expect(page.locator(".lrc-line.cursor")).toContainText("I wish I could identify that smell");
  await page.keyboard.press("e");
  await expect(page.locator(".lrc-line.cursor")).toContainText("That smell");
  await page.keyboard.press("q");
  await expect(page.locator(".lrc-line.cursor")).toContainText("I wish I could identify that smell");
});

// Tranche 4.5 (ROADMAP.md) — highlight moves with W/Enter. Audio is not in DOM so
// triggerTimeUpdate is a no-op; use real playback to fire timeupdate.
test("highlight-moves-with-w-enter", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await expect(page.locator(".lrc-line.active")).toContainText("I wish I could identify that smell");
  await page.keyboard.press("e");
  await expect(page.locator(".lrc-line.cursor")).toContainText("That smell");
  await expect(page.locator(".lrc-line.active")).toContainText("I wish I could identify that smell");
  await page.keyboard.press("w");
  await expect(page.locator(".lrc-line.active")).toContainText("That smell");
});

// Tranche 4.5 (ROADMAP.md) — active line cursor border (light + dark).
test("active-line-cursor-border", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator(".lrc-line.cursor")).toHaveCSS("border-left-color", "rgb(9, 105, 218)");
  await page.keyboard.press("Control+.");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".lrc-line.cursor")).toHaveCSS("border-left-color", "rgb(88, 166, 255)");
});

// Phase E Tranche 4.5 (ROADMAP.md) — highlight row (.active background) must show even when
// cursor (.cursor border) is on the same line (CSS specificity regression).
test("highlight-row-visible-when-cursor-on-same-line", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  // Start playback — togglePlay sets playingLine = activeLine = 0, so line 0
  // has BOTH .cursor and .active classes.
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await expect(page.locator(".lrc-line.active")).toHaveCSS(
    "background-color",
    "rgb(221, 244, 255)",
  );
  await expect(page.locator(".lrc-line.cursor")).toHaveClass(/\bactive\b/);
  await page.keyboard.press("Space");
});

// Phase E Tranche 4.5 (ROADMAP.md) — cursor follows highlighter DOWN as the song
// progresses (latent-issue fix).
test("cursor-follows-highlighter-down", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await expect(page.locator(".lrc-line.cursor")).toContainText("I wish I could identify that smell");
  // Need to wait long enough to cross line 1's ts ([00:03.06]).
  await page.keyboard.press("Space");
  await page.waitForTimeout(3500);
  await expect(page.locator(".lrc-line.active")).toContainText("That smell");
  await expect(page.locator(".lrc-line.cursor")).toContainText("That smell");
  await page.keyboard.press("Space");
});

// Phase E Tranche 4.5 (ROADMAP.md) — auto-pause on first nav key press during playback.
test("auto-pause-on-arrow-down-during-playback", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(page.locator(".lrc-line.cursor")).toContainText("That smell");
  await expect(page.locator(".lrc-line.active")).toContainText("I wish I could identify that smell");
});

// Phase E Tranche 4.5 (ROADMAP.md) — Space after auto-pause seeks to the new cursor position.
test("space-resumes-at-new-cursor-after-auto-pause", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("ArrowDown");
  // Resume — togglePlay seeks to activeLine's ts (line 1's ts = 3.06s).
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[2-9]$/);
  await page.keyboard.press("Space");
});

// Phase E Tranche 4.5 (ROADMAP.md) — Space at the same line after manual pause resumes
// from the audio's paused position (no seek back to line 0's ts).
test("space-resumes-at-paused-position-when-cursor-unchanged", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  // Resume — togglePlay sees activeLine === lastPlayingLine, no seek.
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  await expect(page.getByRole("button", { name: "Pause" }).first()).toBeVisible();
  await page.keyboard.press("Space");
});
