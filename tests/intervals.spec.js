const { test, expect } = require("@linebyline/test-helpers");

test("intervals-large", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Large" }).fill("2000");
  await page.keyboard.press("Escape");
  await expect(page.getByText("+2000ms timeC")).toBeVisible();
  await page.keyboard.press("c");
  await expect(page.getByText("[00:02.00] I wish I could")).toBeVisible();
});

test("seek-increment", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Seek increment" }).fill("10");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("0:100:13")).toBeVisible();
});

test("speed-ratio", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Speed ratio" }).fill("1.50");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+1");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("0.67");
  await page.keyboard.press("Control+3");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("1");
  await page.keyboard.press("Control+2");
  await expect(
    page.getByRole("spinbutton", { name: "Playback speed" }),
  ).toHaveValue("1.50");
});

test("volume-increment", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Volume increment" }).fill("20");
  await page.keyboard.press("Escape");
  await page.locator("#vol-slider").hover();
  await page.mouse.wheel(0, 120);
  await expect(page.locator("#vol-slider")).toHaveValue("0.8");
});

test("typing-debounce-1", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.keyboard.press("Control+,");
  await page.getByRole("spinbutton", { name: "Undo window" }).fill("1");
  await page.keyboard.press("Escape");
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  await page.keyboard.press("a");
  await page.keyboard.press("b");
  await page.keyboard.press("c");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\na",
  );
});
