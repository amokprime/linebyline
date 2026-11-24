const {
  test,
  expect,
  waitForImport,
  beforeUnloadPrevented,
} = require("@linebyline/test-helpers");

// Tranche 4.5 — reset behaviors: reload, new tab, beforeunload.
// Tranche 9 — mechanism-pinning assertions: the storage pins below observe
// lbl_autosave directly (write on import, clear on init) instead of relying
// only on the user-facing reset outcomes.

test("reload-clears-lyrics-audio", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await expect(page.locator("#main-textarea")).not.toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: amokprime.github.io/linebyline]\n",
  );
  await expect(page.locator("#time-dur")).not.toHaveText("0:00");
  await expect(
    await page.evaluate(() => sessionStorage.getItem("lbl_autosave")),
  ).not.toBeNull();
  await page.reload();
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: amokprime.github.io/linebyline]\n",
  );
  await expect(page.locator("#time-dur")).toHaveText("0:00");
  // App.vue onMounted removes lbl_autosave before loadAutosave (monolith
  // parity) — the null storage is the direct effect of that removeItem.
  await expect(
    await page.evaluate(() => sessionStorage.getItem("lbl_autosave")),
  ).toBeNull();
});

test("new-tab-starts-fresh", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  // Same context = a real "new tab": localStorage is shared across tabs,
  // sessionStorage is per-tab. (browser.newPage() would open a fresh context
  // whose empty localStorage masks any lyric leak, letting the assertions
  // below pass unconditionally.)
  const newPage = await page.context().newPage();
  await newPage.goto(await page.url());
  await expect(newPage.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: amokprime.github.io/linebyline]\n",
  );
  await expect(newPage.locator("#time-dur")).toHaveText("0:00");
  await expect(
    await newPage.evaluate(() => sessionStorage.getItem("lbl_autosave")),
  ).toBeNull();
  // Shared-context sanity: localStorage state must be identical in both tabs
  // (lbl_panel_collapsed/lbl_speed persist there), and no entry may carry
  // lyric content — LRC timestamps never appear in the config storage keys.
  const lsOld = await page.evaluate(() =>
    JSON.stringify(Object.entries(localStorage)),
  );
  const lsNew = await newPage.evaluate(() =>
    JSON.stringify(Object.entries(localStorage)),
  );
  expect(lsNew).toBe(lsOld);
  expect(lsNew).not.toContain("[00:");
  await newPage.close();
});

// Partial coverage for MANUAL.md "Clicking the browser close button" — the
// actual button click is manual (headless chromium suppresses beforeunload
// dialogs). Verify the handler is registered and calls preventDefault when
// content is dirty.
test("beforeunload-on-close-dirty", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  expect(await beforeUnloadPrevented(page)).toBe(true);
});
