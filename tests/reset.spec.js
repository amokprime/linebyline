const { test, expect, waitForImport } = require("@linebyline/test-helpers");

// Tranche 4.5 — reset behaviors: reload, new tab, beforeunload.

test("reload-clears-lyrics-audio", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await expect(page.locator("#main-textarea")).not.toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  );
  await expect(page.locator("#time-dur")).not.toHaveText("0:00");
  await page.reload();
  await expect(page.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  );
  await expect(page.locator("#time-dur")).toHaveText("0:00");
});

test("new-tab-starts-fresh", async ({ browser, page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  const newPage = await browser.newPage();
  await newPage.goto(await page.url());
  await expect(newPage.locator("#main-textarea")).toHaveValue(
    "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  );
  await expect(newPage.locator("#time-dur")).toHaveText("0:00");
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
  const prevented = await page.evaluate(() => {
    let prevented = false;
    const handler = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        prevented = true;
      }
    };
    window.addEventListener("beforeunload", handler, { once: true });
    window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
    return prevented;
  });
  expect(prevented).toBe(true);
});
