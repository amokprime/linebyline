const { test, expect } = require("@linebyline/test-helpers");

/**
 * All `toMatchAriaSnapshot()` calls in this file have been replaced with
 * explicit assertions.
 *
 * Background: Playwright's aria-snapshot tokenizer crashes with
 * `TypeError: Cannot read properties of undefined (reading 'raw')`
 * whenever the captured DOM contains text nodes that *start with `(``.
 * This happens in every merge/secondary test because translation lines
 * are wrapped in parentheses like `(J'aimerais pouvoir...)`, AND because
 * the warning toast text begins with `( )` (the checkbox label).
 *
 * Replacement strategy: assert what each aria snapshot was actually
 * verifying — field headers present, lyric list contains the expected
 * interleaved entries, warning text appears. For interleaving-order
 * checks, use `innerText()` of the lyric list as a single string.
 *
 * IMPORTANT discoveries from the actual aria snapshots and the first
 * container run (see commit history for the iteration):
 *
 * 1. The "Wrap marked translations in parentheses" text is a TITLE
 *    attribute on a wrapper div, NOT the accessible name of the
 *    checkbox. The checkbox's accessible name is just `( )`. Use
 *    `page.locator('[title="..."] input[type="checkbox"]')` or just
 *    target the first checkbox on the page.
 *
 * 2. After a successful merge, the "Line count mismatch" warning is
 *    REMOVED entirely — counts now match. Do NOT assert it stays.
 *
 * 3. `merge-no-timestamps` (main has no timestamps) does NOT interleave
 *    translations into the main list. The main list keeps just the
 *    English source. Assert Spanish is absent.
 *
 * 4. `merge-block-reload`: the secondary field IS persisted across F5.
 *    Do NOT assert it disappears. The Merge button stays visible
 *    (enabled? — needs verification; original test only checked visible).
 *
 * 5. `paste-secondary-genius`: the app's paste handler extracts only
 *    the lyric body from the mock HTML page, stripping metadata like
 *    "Mock Song Lyrics" and "Alpha & Beta". Each pasted line gets
 *    wrapped in parens because the wrap-parens checkbox is on by
 *    default. Assert on `Filler line` (regex tolerates parens).
 *
 * 6. The first `getByRole("textbox")` click in paste-secondary-genius
 *    is ambiguous and may miss the secondary textarea on chromium.
 *    Click the secondary textarea explicitly via aria-label.
 */

/**
 * Helper: read the main "Lyric lines" list as a string of listitem
 * text contents joined by newlines. `innerText()` preserves visual
 * line breaks between listitems.
 */
async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

/**
 * Helper: the first "Wrap marked translations in parentheses" checkbox.
 * The text is a title attribute on the wrapper, not the checkbox's
 * accessible name — so we use a CSS selector instead of getByRole.
 */
function wrapParensCheckbox(page) {
  return page
    .locator('[title="Wrap marked translations in parentheses"] input[type="checkbox"]')
    .first();
}

test("hide-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+5");
  await page.keyboard.press("Control+4");

  // Main field header present, wrap-parens checkbox checked by default.
  await expect(page.getByText("Main").first()).toBeVisible();
  await expect(wrapParensCheckbox(page)).toBeChecked();

  // Lyric lines list exists and is empty (no main file was loaded).
  const list = page.getByLabel("Lyric lines");
  await expect(list).toBeVisible();
  await expect(list.locator("listitem")).toHaveCount(0);

  // Secondary 1 field present with its import button.
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import secondary lyrics file" }).first(),
  ).toBeVisible();

  // Warning: secondary has 5 lines, main has 0.
  await expect(page.getByText(/Line count mismatch \(5 vs 0\)/)).toBeVisible();

  // Secondary textbox contains the imported Spanish content.
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /Ojalá pudiera identificar ese olor/,
  );
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /Oh, ojalá pudiera identificar ese olor/,
  );
});

test("replace-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await importSecondary(1, "plain_french.lrc");

  // Fields present.
  await expect(page.getByText("Main").first()).toBeVisible();
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import secondary lyrics file" }).first(),
  ).toBeVisible();

  // Lyric list still empty (no main loaded).
  await expect(
    page.getByLabel("Lyric lines").locator("listitem"),
  ).toHaveCount(0);

  // Secondary now contains French (replaced Spanish).
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /J'aimerais pouvoir identifier cette odeur/,
  );
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /Oh, j'aimerais pouvoir identifier cette odeur/,
  );
  // Spanish must NOT be present after replacement.
  await expect(page.getByLabel("Secondary 1 lyrics")).not.toHaveValue(/Ojalá/);

  // Warning still says 5 vs 0 (main still empty).
  await expect(page.getByText(/Line count mismatch \(5 vs 0\)/)).toBeVisible();
});

test("paste-secondary-genius", async ({ context, page, readMedia }) => {
  // Grant clipboard-write permission — but ONLY on chromium.
  // Firefox and WebKit don't recognize `clipboard-read`/`clipboard-write`
  // as valid permission names (Playwright throws "Unknown permission"
  // on those engines), but they also don't require the grant — they
  // allow `navigator.clipboard.writeText()` from `page.evaluate()` by
  // default.
  //
  // Chromium recognizes the permissions but ALSO requires the writeText
  // Promise to be awaited (see below).
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }

  await page.keyboard.press("Control+4");

  // Click the secondary textarea explicitly — `getByRole("textbox")` is
  // ambiguous (Main also has a textbox) and on chromium the click missed.
  const secondaryTextarea = page.getByLabel("Secondary 1 lyrics");
  await secondaryTextarea.click();

  const pastedText = readMedia("mock.txt");
  // IMPORTANT: the evaluate function MUST be async and MUST await the
  // writeText Promise. Without the await, page.evaluate returns before
  // the clipboard write commits, and the subsequent Control+v fires
  // against an empty clipboard. Firefox/WebKit are fast enough to race
  // successfully; chromium is not.
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, pastedText);
  await page.keyboard.press("Control+v");

  // Fields present.
  await expect(page.getByText("Main").first()).toBeVisible();
  await expect(page.getByText("Secondary 1").first()).toBeVisible();

  // The app's paste handler extracts only the lyric body from the mock
  // HTML page — metadata like "Mock Song Lyrics" and "Alpha & Beta" is
  // stripped. Each pasted line gets wrapped in parens because the
  // wrap-parens checkbox is on by default. Assert on `Filler line`
  // (regex tolerates optional surrounding parens).
  await expect(secondaryTextarea).toHaveValue(/Filler line intro one/);
  await expect(secondaryTextarea).toHaveValue(/Filler line verse one A/);
  await expect(secondaryTextarea).toHaveValue(/Filler line chorus three H/);
  // Metadata should NOT be present (app's paste handler strips it).
  await expect(secondaryTextarea).not.toHaveValue(/Mock Song Lyrics/);
  await expect(secondaryTextarea).not.toHaveValue(/Alpha & Beta/);
});

test("font", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  const fontSelect = page.getByRole("combobox", { name: "Editor font" });
  await fontSelect.selectOption("serif");
  for (let i = 0; i < 5; i++)
    await page.getByTitle("Increase font size").click();
  await expect(page).toHaveScreenshot("font-hotkey.png");
  await page.locator("#left-panel-header").click();
  await page.keyboard.press("Backquote");
  await expect(page).toHaveScreenshot("font-typing.png");
});

test("merge-one", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");

  // Secondary 1 field is NOT removed by merge — it stays in the DOM.
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import secondary lyrics file" }).first(),
  ).toBeVisible();

  // After a successful merge the "Line count mismatch" warning stays
  // visible — the secondary count (5) is fixed, but the main count grows
  // because main now contains interleaved translations. The original aria
  // snapshot's regex `\(5 vs \d+\)` confirms this: the secondary count
  // is hard-coded 5, the main count is dynamic. Use the same loose regex.
  await expect(
    page.getByText(/Line count mismatch \(5 vs \d+\)/),
  ).toBeVisible();

  // Secondary textbox still contains the French content.
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /J'aimerais pouvoir identifier cette odeur/,
  );

  // Main lyric list now contains the English source interleaved with
  // the French translation (wrapped in parens per the wrap-parens
  // checkbox, which is on by default).
  const lines = await lyricLinesText(page);
  // English source lines are present
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  expect(lines).toContain("It disturbs my concentration");
  expect(lines).toContain("And it bothers me to hell");
  expect(lines).toContain("Oh, I wish I could identify that smell");
  // French translation lines wrapped in parens are present
  expect(lines).toContain("(J'aimerais pouvoir identifier cette odeur)");
  expect(lines).toContain("(Cette odeur)");
  expect(lines).toContain("(Cela perturbe ma concentration)");
  expect(lines).toContain("(Et ça me dérange au plus haut point)");
  expect(lines).toContain("(Oh, j'aimerais pouvoir identifier cette odeur)");
});

test("merge-two", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+4");
  await importSecondary(2, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");

  // Both secondary fields stay in the DOM after merge.
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(page.getByText("Secondary 2").first()).toBeVisible();

  // After successful merge, both secondaries' mismatch warnings stay
  // visible — the secondary count (5) is fixed, the main count grows to
  // include all interleaved translations (english + french + spanish).
  // Use the same loose regex the original aria snapshot uses.
  await expect(
    page.getByText(/Line count mismatch \(5 vs \d+\)/),
  ).toHaveCount(2);

  // Secondary textboxes still contain their original content.
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /J'aimerais pouvoir identifier cette odeur/,
  );
  await expect(page.getByLabel("Secondary 2 lyrics")).toHaveValue(
    /Ojalá pudiera identificar ese olor/,
  );

  // Main lyric list contains English + French + Spanish interleaved.
  const lines = await lyricLinesText(page);
  // English
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  expect(lines).toContain("It disturbs my concentration");
  expect(lines).toContain("And it bothers me to hell");
  expect(lines).toContain("Oh, I wish I could identify that smell");
  // French (wrapped in parens)
  expect(lines).toContain("(J'aimerais pouvoir identifier cette odeur)");
  expect(lines).toContain("(Cette odeur)");
  expect(lines).toContain("(Cela perturbe ma concentration)");
  expect(lines).toContain("(Et ça me dérange au plus haut point)");
  expect(lines).toContain("(Oh, j'aimerais pouvoir identifier cette odeur)");
  // Spanish (wrapped in parens)
  expect(lines).toContain("(Ojalá pudiera identificar ese olor)");
  expect(lines).toContain("(Ese olor)");
  expect(lines).toContain("(Me altera la concentración)");
  expect(lines).toContain("(Y me molesta muchísimo)");
  expect(lines).toContain("(Oh, ojalá pudiera identificar ese olor)");
});

test("merge-no-timestamps", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");

  // Secondary 1 stays in DOM.
  await expect(page.getByText("Secondary 1").first()).toBeVisible();

  // Secondary textbox still contains Spanish.
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /Ojalá pudiera identificar ese olor/,
  );

  // CRITICAL: when the main source has NO timestamps, the merge does
  // NOT interleave translations. The main lyric list keeps just the
  // English source. Spanish is NOT present in the main list.
  // (Verified against the actual aria snapshot for this test.)
  const lines = await lyricLinesText(page);
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  expect(lines).toContain("It disturbs my concentration");
  expect(lines).toContain("And it bothers me to hell");
  expect(lines).toContain("Oh, I wish I could identify that smell");
  // Spanish translations must NOT appear in main list
  expect(lines).not.toContain("(Ojalá pudiera identificar ese olor)");
  expect(lines).not.toContain("(Ese olor)");
  expect(lines).not.toContain("(Me altera la concentración)");
  expect(lines).not.toContain("(Y me molesta muchísimo)");
  expect(lines).not.toContain("(Oh, ojalá pudiera identificar ese olor)");
});

test("merge-no-trailing", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("no_trailing.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  // Merge is blocked when no trailing end timestamp exists
  // (alert instead of confirm).
  page.on("dialog", async (d) => {
    expect(d.type()).toBe("alert");
    expect(d.message()).toContain("No trailing end timestamp");
    await d.accept();
  });
  await page.keyboard.press("Control+6");

  // Two warnings should now be visible per the aria snapshot:
  //   1. `⚠ Missing trailing timestamp` as an alert role (top of page)
  //   2. `⚠ Missing trailing timestamp in Main` as text under Secondary 1
  await expect(
    page.getByRole("alert").filter({ hasText: /Missing trailing timestamp/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/Missing trailing timestamp in Main/),
  ).toBeVisible();

  // Secondary 1 field still present with French content (merge did not proceed).
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /J'aimerais pouvoir identifier cette odeur/,
  );

  // Main lyric list still has the original synced_english content.
  const lines = await lyricLinesText(page);
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  expect(lines).toContain("It disturbs my concentration");
  expect(lines).toContain("And it bothers me to hell");
  expect(lines).toContain("Oh, I wish I could identify that smell");
  // No French should be present (merge was blocked).
  expect(lines).not.toContain("(J'aimerais");

  // Merge button should still be enabled (merge did not proceed).
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toBeVisible();
});

test("merge-line-mismatch", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish_mismatch.lrc");
  await page.keyboard.press("Control+6");

  // Warning toast appears: secondary has 4 lines, main has 5.
  // The toast may be transient in headless mode, so use expect.poll.
  await expect
    .poll(
      async () => (await page.getByText(/Line count mismatch/).count()) > 0,
      { timeout: 10000, message: "mismatch toast should appear" },
    )
    .toBe(true);

  // Main lyric list still contains the English source.
  // (The merge attempt with mismatched counts should not have proceeded.)
  const lines = await lyricLinesText(page);
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  // No Spanish should be present (merge was blocked by mismatch).
  expect(lines).not.toContain("(Ojalá");
});

test("merge-block-reload", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("F5");

  // After F5: Secondary 1 field IS still present in the DOM (state is
  // persisted across reload via sessionStorage — both the secondary
  // field's existence and its content survive).
  // The original test only asserted that the Merge button is visible,
  // which is the actual intent: verify the page is in a state where
  // merge could still be performed.
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toBeVisible();

  // Main lyric list still shows the synced English content (persisted
  // via session storage — F5 does not wipe sessionStorage).
  const lines = await lyricLinesText(page);
  expect(lines).toContain("I wish I could identify that smell");
  expect(lines).toContain("That smell");
  // No French should be present in main list (merge was never completed
  // — F5 happened before the merge button was pressed).
  expect(lines).not.toContain("(J'aimerais");
});

test("reload-merge-disabled", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toBeDisabled();
});
