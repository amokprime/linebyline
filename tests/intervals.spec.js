
const {
  test,
  expect,
  waitForImport,
  waitForAudio,
} = require("@linebyline/test-helpers");

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

test("intervals-large", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Large" }).fill("2000");
  await page
    .getByRole("spinbutton", { name: "Large" })
    .evaluate((e) => e.blur());
  await page.keyboard.press("Escape");
  await page.locator("#main-lines").click();
  await expect(
    page.getByRole("button", { name: /Back large amount/ }),
  ).toBeVisible();
  await page.keyboard.press("c");
  const lines = await lyricLinesText(page);
  expect(lines).toContain("[00:02.00] I wish I could");
});

test("seek-increment", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Seek increment" }).fill("13");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("#main-lines").click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("0:130:")).toBeVisible();
});

test("speed-ratio", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Speed ratio" }).fill("2");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("#main-lines").click();
  await page.keyboard.press("Control+1");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("0.50");
  await page.keyboard.press("Control+3");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("1");
  await page.keyboard.press("Control+2");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("2.00");
});

test("volume-increment", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Volume increment" }).fill("20");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("#vol-slider").hover();
  await page.mouse.wheel(0, 120);
  await expect(page.locator("#vol-slider")).toHaveValue("0.8");
});

test("typing-debounce-1", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Undo window" }).fill("1");
  await page.keyboard.press("Escape");
  // Wait for the Settings save-on-close watch (Vue async flush: 'pre') to
  // commit undo_debounce_ms=1 to cfg before typing. Without this, the first
  // keystroke's scheduleInputSnapshot may read the stale default (150ms),
  // causing its snapshot to still be pending when the next keystroke cancels
  // it — the undo stack ends up one entry short and 2x Control+z goes back
  // too far. 50ms covers the microtask queue drain + a safety margin.
  await page.waitForTimeout(50);
  await page.locator("#left-panel-header").click();
  await page.keyboard.press("Backquote");
  await expect(
    page.getByRole("textbox", { name: "Main lyric text" }),
  ).toBeVisible();
  await page.locator("#main-textarea").click();
  await page.keyboard.press("a");
  const before =
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\na";
  await expect(page.locator("#main-textarea")).toHaveValue(before);
  // Wait between keypresses so the 1ms undo debounce fires for each letter.
  // 50ms covers: HTML5 timer clamp (~4ms for setTimeout(1)) + Vue's microtask
  // queue + a safety margin for contended CI runners. The prior 20ms was
  // flaky on chromium — the first keystroke's snapshot could still be pending
  // when the second keystroke's scheduleInputSnapshot canceled it, leaving the
  // undo stack one entry short.
  await page.waitForTimeout(50);
  await page.keyboard.press("b");
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\nab",
  );
  await page.waitForTimeout(50);
  await page.keyboard.press("c");
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\nabc",
  );
  await page.waitForTimeout(50);
  for (let i = 0; i < 2; i++) await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(before);
});
