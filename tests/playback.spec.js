const {
  test,
  expect,
  waitForImport,
  waitForAudio,
} = require("@linebyline/test-helpers");

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

// Tranche 4.5 — multi-position seek-click catches the session-10 "click-to-seek halfway" bug.
// Uses #time-pos text (not audio.currentTime) because the audio element is not in the DOM.
test("seek-click", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  const box = await page.locator("#progress-wrap").boundingBox();
  async function seekAndCheck(fraction, expectedRegex) {
    await page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2);
    await page.waitForTimeout(100);
    await expect(page.locator("#time-pos")).toHaveText(expectedRegex);
  }
  await seekAndCheck(1 / 13, /^0:0[01]$/);
  await seekAndCheck(1 / 2, /^0:0[67]$/);
  await seekAndCheck(12 / 13, /^0:1[123]$/);
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
  await expect(page.getByText("Unknown Title")).toBeVisible();
  await expect(page.getByText("Unknown Artist")).toBeVisible();
  await expect(page.locator("#time-pos")).toHaveText("0:00");
  await expect(page.locator("#time-dur")).toHaveText("0:00");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+1");
  await page.locator("#progress-wrap").click();
  await expect(page.locator("#time-pos")).toHaveText("0:00");
  await expect(page.locator("#time-dur")).toHaveText("0:00");
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  await expect(page.locator("#time-pos")).toHaveText("0:00");
  await expect(page.locator("#time-dur")).toHaveText(/^0:1[2-4]$/);
  await expect(page.getByText("audio")).toBeVisible();
  await expect(page.getByText("Unknown Artist")).toBeVisible();
});

// Tranche 4.5 — seek-bar drag. Audio element is not in DOM; verify via #time-pos.
test("seek-drag", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  const box = await page.locator("#progress-wrap").boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  await expect(page.locator("#time-pos")).toHaveText(/^0:(09|1[0123])$/);
});

// Tranche 4.5 — focus-not-stolen. Uses button[title=...] and #id for buttons
// whose accessible name is ▲/▼ text or whose title is dynamic (play/pause, mute).
test("focus-not-stolen", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.locator("#main-lines").click();
  const buttons = [
    'button[title="Increase font size"]',
    'button[title="Decrease font size"]',
    'button[title="Increase speed (Ctrl+2)"]',
    'button[title="Reduce speed (Ctrl+1)"]',
    '#btn-seek-back',
    '#btn-seek-fwd',
    '#btn-play-pause',
    '#vol-mute-btn',
    'button[title="Increase seek offset"]',
    'button[title="Decrease seek offset"]',
  ];
  for (const sel of buttons) {
    await page.locator(sel).click();
  }
  await page.keyboard.press("Space");
  const cursorBefore = await page
    .locator(".lrc-line.cursor")
    .evaluate((el) => Array.from(el.parentNode.children).indexOf(el));
  await page.keyboard.press("ArrowDown");
  const cursorAfter = await page
    .locator(".lrc-line.cursor")
    .evaluate((el) => Array.from(el.parentNode.children).indexOf(el));
  expect(cursorAfter).toBe(cursorBefore + 1);
});

// Tranche 4.5 — focus-not-stolen on Collapse/Expand toggle.
test("focus-not-stolen-collapse-toggle", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.locator("#main-lines").click();
  await page.getByRole("button", { name: "Collapse panel" }).click();
  await page.getByRole("button", { name: "Expand panel" }).click();
  const cursorBefore = await page
    .locator(".lrc-line.cursor")
    .evaluate((el) => Array.from(el.parentNode.children).indexOf(el));
  await page.keyboard.press("ArrowDown");
  const cursorAfter = await page
    .locator(".lrc-line.cursor")
    .evaluate((el) => Array.from(el.parentNode.children).indexOf(el));
  expect(cursorAfter).toBe(cursorBefore + 1);
});
