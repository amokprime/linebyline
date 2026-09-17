const {
  test,
  expect,
  waitForLyrics,
  tabUntilFocused,
} = require("@linebyline/test-helpers");

test("persistence", async ({ page, media }) => {
  /** @param {string} name @param {string} v @param {boolean} [soft] */
  const exp = (name, v, soft) =>
    (soft ? expect.soft : expect)(
      page.getByLabel(name, { exact: true }),
    ).toHaveValue(v);
  const titlebar = page.getByText("📂 💾 System Sans System");
  const newmeta = "[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]";
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
  await page.getByLabel("Editor font", { exact: true }).selectOption("serif");
  await page.getByLabel("Font size", { exact: true }).fill("20");
  await page.getByLabel("Playback speed", { exact: true }).fill("1.5");
  await page
    .getByLabel("Seek offset in milliseconds", { exact: true })
    .fill("-400");
  await page.keyboard.press("Control+.");
  await page.keyboard.press("Control+,");
  await page
    .getByLabel("Moving to previous line", { exact: true })
    .check();
  await page.getByLabel("Tiny", { exact: true }).fill("99");
  await page.locator("#s-default-meta").fill(newmeta);
  await page.keyboard.press("Escape");
  await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  await page.reload();
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
  await exp("Editor font", "serif");
  await exp("Font size", "20");
  await exp("Playback speed", "1.50", true);
  await exp("Seek offset in milliseconds", "-400");
  await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  await page.keyboard.press("Control+,");
  await expect(
    page.getByLabel("Moving to previous line", { exact: true }),
  ).toBeChecked();
  await exp("Tiny", "99");
  await expect(page.locator("#s-default-meta")).toHaveValue(newmeta);
  await page.keyboard.press("Control+Backslash");
  await expect(
    page.getByRole("button", { name: "Confirm reset" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await exp("Editor font", "system-ui,sans-serif");
  await exp("Font size", "14");
  await exp("Playback speed", "1");
  await exp("Seek offset in milliseconds", "-600");
  await expect(
    page.getByLabel("Moving to previous line", { exact: true }),
  ).not.toBeChecked();
  await exp("Tiny", "100");
  await expect(page.locator("#s-default-meta")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  );
});

test("settings-window", async ({ page }) => {
  await page.keyboard.press("Control+,");
  // shadcn-vue Dialog uses role="dialog" + data-state; the monolith's
  // #settings-overlay.open class no longer exists. The Dialog is teleported
  // to body via DialogPortal — toBeVisible matches the teleported element.
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#settings-body")).toMatchAriaSnapshot();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("search-check", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await page
    .getByRole("textbox", { name: "Search settings" })
    .pressSequentially("Moving to n");
  // Click the checkbox directly instead of Tab-walking — shadcn-vue Dialog's
  // focus trap + filter means the Tab order differs from the monolith.
  await page.getByRole("checkbox", { name: "Moving to next line" }).click();
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
  await expect(page.getByText(/⚠ "Ctrl\+C" is reserved by the/)).toBeVisible();
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toHaveValue("Shift+~");
  await page.getByRole("button", { name: "Reset hotkey for Toggle" }).click();
  await expect(
    page.locator("#hk-settings-rows").getByRole("textbox"),
  ).toHaveValue("Shift+~");
});

test("assign-conflict-tab", async ({ page }) => {
  await page.keyboard.press("Control+,");
  // Enter hotkey search mode + type "x" to filter to rows with X
  await page.getByRole("textbox", { name: "Search settings" }).press("`");
  await page.getByRole("textbox", { name: "Search settings" }).press("x");
  // Click the ts_back_large capture input directly (Tab navigation in
  // shadcn Dialog is unreliable — the focus trap includes close button)
  await page.locator("#hk-capture-ts_back_large").click();
  await page.keyboard.press("x");
  await expect(page.locator("#hk-capture-ts_back_large")).toHaveValue("X");
  // Exit hotkey search mode by clicking the ⌨ toggle button
  await page.getByRole("button", { name: "Switch to hotkey search mode" }).click();
  await expect(page.locator("#hk-capture-ts_fwd_large")).toBeVisible();
  await page.locator("#hk-capture-ts_fwd_large").click();
  await page.keyboard.press("c");
  await expect(page.locator("#hk-capture-ts_fwd_large")).toHaveValue("C");
  await page.keyboard.press("Shift+Backspace");
  await expect(page.locator("#hk-capture-ts_fwd_large")).toBeEmpty();
  await page.getByRole("button", { name: "Reset defaults" }).click();
  await page.getByRole("button", { name: "Confirm reset" }).click();
  await page.getByRole("textbox", { name: "Search settings" }).press("`");
  await page.getByRole("textbox", { name: "Search settings" }).press("x");
  await expect(page.locator("#hk-capture-ts_back_large")).toHaveValue("X");
});
