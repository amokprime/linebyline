const { test, expect } = require("@linebyline/test-helpers");

test("key-suppress", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.down("w");
  for (let i = 0; i < 10; i++) {
    await page.evaluate((key) => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          repeat: true,
          bubbles: true,
        }),
      );
    }, "w");
  }
  await page.keyboard.up("w"); //w moves down a line each sync
  await expect(page.getByText("[00:00.00] I wish I could")).toBeVisible(); //If it spammed sync
  await expect(page.getByText("[00:03.06] That smell")).toBeVisible(); //This would be [00:00.00]
});

test("key-suppress-leak", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.down("Backquote");
  for (let i = 0; i < 10; i++) {
    await page.evaluate((key) => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          repeat: true,
          bubbles: true,
        }),
      );
    }, "Backquote");
  }
  await page.keyboard.up("Backquote");
  await expect(page.getByText("Typing mode`")).toBeVisible(); //even-numbered keypress spam → Hotkey mode
  await page.keyboard.press("Backquote");
  await expect(page.locator("#main-lines")).not.toContainText("`");
});

test("key-repeat", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await page.keyboard.down("ArrowDown");
  for (let i = 0; i < 4; i++) {
    await page.evaluate((key) => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          repeat: true,
          bubbles: true,
        }),
      );
    }, "ArrowDown");
  }
  await page.keyboard.up("ArrowDown");
  await page.keyboard.press("w");
  await expect(page.getByText("[00:00.00] Oh, I wish I could")).toBeVisible();
});
