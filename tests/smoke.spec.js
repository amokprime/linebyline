
const { test, expect } = require("@linebyline/test-helpers");

test("title", async ({ page }) => {
  await expect(page).toHaveTitle(/LineByLine/);
});

test("favicon", async ({ page }) => {
  const href = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(href).toContain("image/svg+xml");
  expect(href).toContain("%23ffff00"); // yellow strokes
  expect(href).toContain("%2300ff00"); // green checkmarks
});

test("landing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`Uncaught: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  // Visual snapshot
  await expect(page).toHaveScreenshot();
  // ARIA snapshot to check elements
  await expect(page.locator("body")).toMatchAriaSnapshot({
    name: "landing.yml",
  });
  // No JS errors on load
  expect(errors).toEqual([]);
  await expect(page.locator("#editor-wrapper")).toBeVisible();
  // File picker exists but is hidden
  await expect(page.locator("#file-picker")).toHaveCSS("display", "none");
});

test("button-tint", async ({ page }) => {
  const button = page.getByRole("button", { name: "Play", exact: true });
  await button.hover();
  await expect(button).toHaveScreenshot();
});

test("button-feedback", async ({ page }) => {
  const button = page.getByRole("button", { name: "Play", exact: true });
  await button.click();
  await expect(button).toHaveScreenshot();
});

// Phase E Tranche 3 — window.doSave exposure (cross-browser regression guard).
// The monolith exposed doSave implicitly (top-level function declaration).
// The Vue port imports doSave from useImport; App.vue must register it on
// window explicitly so the global hotkey handler can dispatch through the
// runtime-resolved reference — allowing Playwright tests to monkeypatch
// window.doSave on Firefox (which blocks the download event chromium/webkit
// use). The companion test in typing-mode.spec.js (meta-save-update) only
// exercises the Firefox capture path; this test verifies the exposure + hotkey
// dispatch on ALL browsers.
test("doSave-exposed", async ({ page }) => {
  // After app load, window.doSave must be a function (registered by App.vue
  // onMounted). This catches regressions where the exposure is removed or
  // the onMounted ordering changes.
  const isFunction = await page.evaluate(
    () => typeof window.doSave === "function",
  );
  expect(isFunction).toBe(true);
});

test("doSave-dispatch", async ({ page }) => {
  // Monkeypatch window.doSave to capture the call, then press the save hotkey
  // (Ctrl+' by default). The monkeypatch must fire — if the hotkey handler
  // calls the imported doSave directly (bypassing window.doSave), the capture
  // stays empty. This is the cross-browser version of typing-mode.spec.js's
  // meta-save-update Firefox-only test.
  await page.evaluate(() => {
    window.__doSaveCalled = false;
    window.doSave = () => {
      window.__doSaveCalled = true;
    };
  });
  await page.keyboard.press("Control+'");
  const called = await page.evaluate(() => window.__doSaveCalled);
  expect(called).toBe(true);
});
