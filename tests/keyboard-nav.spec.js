const { test, expect, tabUntilFocused } = require("@linebyline/test-helpers");

test("tab-font", async ({ page }) => {
  await tabUntilFocused(page, "#font-select");
  await page.locator("#font-select").press("ArrowDown");
  await expect(page.locator("#font-select")).toHaveValue("serif");
  await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  await page.keyboard.press("Backquote");
  await expect(page.locator("#main-textarea")).toHaveScreenshot();
});

test("tab-lyrics", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.keyboard.press("1");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Control+4");
  await tabUntilFocused(page, ".sec-textarea", { index: 0 });
  await page.keyboard.press("2");
  await tabUntilFocused(page, ".sec-textarea", { index: 1 });
  await page.keyboard.press("3");
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n1",
  );
  await expect(page.locator(".sec-textarea").first()).toHaveValue("2");
  await expect(page.locator(".sec-textarea").nth(1)).toHaveValue("3");
});

test("tab-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  // Tab to first checkbox
  await tabUntilFocused(page, "#s-replay-prev");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "Moving to previous line" }),
  ).toBeChecked();
  // Tab to Tiny interval input
  await tabUntilFocused(page, "#s-tiny");
  await page.keyboard.press("Control+a");
  await page.getByRole("spinbutton", { name: "Tiny" }).fill("99");
  await expect(page.getByRole("spinbutton", { name: "Tiny" })).toHaveValue(
    "99",
  );
  // Tab to default metadata textarea
  await tabUntilFocused(page, "#s-default-meta");
  await page.keyboard.press("&");
  await expect(page.locator("#s-default-meta")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n&",
  );
  // Tab to first hotkey capture field
  await tabUntilFocused(page, ".hk-capture");
  await page.keyboard.press("i");
  await expect(page.locator(".hk-capture").first()).toHaveValue("I");
  await page.keyboard.press("Enter"); // accept assignment
  await page.keyboard.press("o");
  await expect(page.locator(".hk-capture").nth(1)).toHaveValue("O");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Backspace");
  await expect(page.locator(".hk-capture").first()).toHaveValue("Ctrl+;");
});

test("arrow-nav-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  // Search field has focus by default — ArrowDown must break out of it
  const search = page.getByRole("textbox", { name: "Search settings" });
  await expect(search).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(search).not.toBeFocused();
  // ArrowDown navigates through Settings elements like Tab
  // Arrow down until we reach a hotkey capture input
  const firstCapture = page.locator(".hk-capture").first();
  for (let i = 0; i < 50; i++) {
    if (await firstCapture.evaluate((el) => el === document.activeElement))
      break;
    await page.keyboard.press("ArrowDown");
  }
  await expect(firstCapture).toBeFocused();

  // ArrowDown on capture input navigates (doesn't assign arrow as hotkey)
  await page.keyboard.press("ArrowDown");
  await expect(firstCapture).not.toBeFocused();

  // ArrowUp navigates back (like Shift+Tab)
  await page.keyboard.press("ArrowUp");
  await expect(firstCapture).toBeFocused();
});
