const { test, expect } = require("@linebyline/test-helpers");

test("persistence", async ({ page, media }) => {
  const exp = (role, name, v, soft) =>
    (soft ? expect.soft : expect)(page.getByRole(role, { name })).toHaveValue(
      v,
    );
  const titlebar = page.getByText("📂 💾 System Sans System");
  const newmeta = "[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]";
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  // Set
  await page
    .getByRole("combobox", { name: "Editor font" })
    .selectOption("serif");
  await page.getByRole("spinbutton", { name: "Font size" }).fill("20");
  await page.getByRole("spinbutton", { name: "Playback speed" }).fill("1.5");
  await page
    .getByRole("spinbutton", { name: "Seek offset in milliseconds" })
    .fill("-400");
  await page.keyboard.press("Control+.");
  await page.keyboard.press("Control+,");
  await page.getByRole("checkbox", { name: "Moving to previous line" }).check();
  await page.getByRole("spinbutton", { name: "Tiny" }).fill("99");
  await page.locator("#s-default-meta").fill(newmeta);
  await page.keyboard.press("Escape");
  await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  // Reload
  await page.reload();
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await exp("combobox", "Editor font", "serif");
  await exp("spinbutton", "Font size", "20");
  await exp("spinbutton", "Playback speed", "1.5", true); // soft: confirmed broken
  await exp("spinbutton", "Seek offset (ms): shifts", "-400");
  await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  await page.keyboard.press("Control+,");
  await expect(
    page.getByRole("checkbox", { name: "Moving to previous line" }),
  ).toBeChecked();
  await exp("spinbutton", "Tiny", "99");
  await expect(page.locator("#s-default-meta")).toHaveValue(newmeta);
  // Reset
  await page.locator("#settings-body").focus();
  await page.locator("body").press("ControlOrMeta+\\");
  await page.keyboard.press("Enter");
  await exp("combobox", "Editor font", "system-ui,sans-serif");
  await exp("spinbutton", "Font size", "14");
  await exp("spinbutton", "Playback speed", "1"); // hard: reset should work even for broken-persist items
  await exp("spinbutton", "Seek offset (ms): shifts", "-600");
  await expect(
    page.getByRole("checkbox", { name: "Moving to previous line" }),
  ).not.toBeChecked();
  await exp("spinbutton", "Tiny", "100");
  await expect(page.locator("#s-default-meta")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  );
});

test("settings-window", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await expect(page.locator("#settings-overlay")).toHaveClass(/open/);
  await expect(page.locator("#settings-body")).toMatchAriaSnapshot();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settings-overlay")).not.toHaveClass(/open/);
});

test("search-check", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page
    .getByRole("textbox", { name: "Search settings" })
    .pressSequentially("Moving to n");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "Moving to next line" }),
  ).toBeChecked();
});

test("search-field", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page
    .getByRole("textbox", { name: "Search settings" })
    .pressSequentially("Default");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Tab");
  expect(await page.locator("#s-default-meta").inputValue()).toMatchSnapshot();
});

test("assign-ok-click", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page
    .getByRole("textbox", { name: "Search settings" })
    .pressSequentially("y/");
  await page.getByRole("textbox").nth(1).click();
  await page.keyboard.press("NumpadAdd");
  await expect(page.getByRole("textbox").nth(1)).toHaveValue("+");
});

test("assign-reserved-click", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page
    .getByRole("textbox", { name: "Search settings" })
    .pressSequentially("of");
  await page.locator("#hk-settings-rows").getByRole("textbox").click();
  await page.keyboard.press("Control+c");
  await expect(page.getByText('⚠ "Ctrl+C" is reserved by the')).toBeVisible();
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toHaveValue("Shift+~");
  await page.getByRole("button", { name: "Reset hotkey for Toggle" }).click();
  await expect(page.getByText("Hotkeys MenuOpen✕Replace↺")).toHaveScreenshot();
});

test("assign-conflict-tab", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page.keyboard.press("`");
  await page.keyboard.press("x");
  for (let i = 0; i < 2; i++) await page.keyboard.press("Tab");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toHaveValue("X");
  await page.keyboard.press("Tab");
  await page.keyboard.press("c");
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toHaveValue("C");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Backspace");
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toBeEmpty();
  await page.keyboard.press("Control+Backslash");
  await page.keyboard.press("Enter");
  await page.keyboard.press("`");
  await page.keyboard.press("x");
  await expect(page.getByText("Back large amount✕Replace↺")).toBeVisible();
});
