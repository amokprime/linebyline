const {
  test,
  expect,
  waitForImport,
  waitForAudio,
} = require("@linebyline/test-helpers");

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

test("play-pause-hotkey", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Space");
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[1-3]$/);
  await expect(page.locator("#time-dur")).toHaveText(/^0:1[2-4]$/);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});

test("play-pause-typing", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Backquote");
  await page.keyboard.press("Control+Space");
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[1-3]$/);
  await expect(page.locator("#time-dur")).toHaveText(/^0:1[2-4]$/);
  await page.keyboard.press("Control+Space");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});

test("seek-click", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  async function seekTo(page, fraction) {
    const box = await page.locator("#progress-wrap").boundingBox();
    await page.mouse.click(
      box.x + box.width * fraction,
      box.y + box.height / 2,
    );
  }
  await seekTo(page, 1 / 13);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[1-3]$/);
});

test("seek-scroll", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.locator("#progress-wrap").hover();
  await page.mouse.wheel(0, -120);
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[4-6]$/);
});

test("seek-typing", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Backquote");
  await page.keyboard.press("Control+0");
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[4-6]$/);
  await expect(page.locator("#time-pos")).toHaveText(/^0:0[5-9]$/);
});

test("speed-typing", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Backquote");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Control+1");
  await expect(page.locator("#speed-val")).toHaveValue("0.83");
  await page.keyboard.press("Control+2");
  await expect(page.locator("#speed-val")).toHaveValue("0.91");
  await page.keyboard.press("Control+3");
  await expect(page.locator("#speed-val")).toHaveValue("1");
});

test("volume-mute-up", async ({ page }) => {
  await page.locator("#vol-slider").hover();
  await page.keyboard.press("Control+m");
  await page.mouse.wheel(0, -120);
  await expect(page.locator("#vol-slider")).toHaveValue("0.1");
});

test("volume-mute-down", async ({ page }) => {
  await page.locator("#vol-slider").hover();
  for (let i = 0; i < 2; i++) await page.keyboard.press("Control+m");
  await page.mouse.wheel(0, 120);
  await expect(page.locator("#vol-slider")).toHaveValue("0.9");
});

test("audio-missing-noop", async ({ page, media }) => {
  await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
    "audio-missing-load.png",
  );
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+1");
  await page.locator("#progress-wrap").click();
  await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
    "audio-missing-play.png",
  );
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  await expect(page.locator("#time-pos")).toHaveText("0:00");
  await expect(page.locator("#time-dur")).toHaveText(/^0:1[2-4]$/);
  await expect(
    page.getByText("audio Unknown Artist"),
  ).toHaveScreenshot("audio-import-reset.png");
});
