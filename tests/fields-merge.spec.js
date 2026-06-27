
const { test, expect, waitForImport } = require("@linebyline/test-helpers");

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

function wrapParensCheckbox(page) {
  return page
    .locator(
      '[title="Wrap marked translations in parentheses"] input[type="checkbox"]',
    )
    .first();
}

test("hide-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+5");
  await page.keyboard.press("Control+4");
  await expect(page.getByText("Main").first()).toBeVisible();
  await expect(wrapParensCheckbox(page)).toBeChecked();
  const list = page.getByLabel("Lyric lines");
  await expect(list).toBeVisible();
  await expect(list.locator("listitem")).toHaveCount(0);
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import secondary lyrics file" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Line count mismatch \(5 vs 0\)/)).toBeVisible();
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
  await expect(page.getByText("Main").first()).toBeVisible();
  await expect(page.getByText("Secondary 1").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import secondary lyrics file" }).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Lyric lines").locator("listitem")).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /J'aimerais pouvoir identifier cette odeur/,
  );
  await expect(page.getByLabel("Secondary 1 lyrics")).toHaveValue(
    /Oh, j'aimerais pouvoir identifier cette odeur/,
  );
  await expect(page.getByLabel("Secondary 1 lyrics")).not.toHaveValue(/Ojalá/);
  await expect(page.getByText(/Line count mismatch \(5 vs 0\)/)).toBeVisible();
});

test("paste-secondary-genius", async ({ page, readMedia, workaroundPaste }) => {
  await page.keyboard.press("Control+4");
  await page.getByRole("textbox").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("mock.txt"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "paste-secondary-genius.txt",
  );
});

test("font", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
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
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-one.txt",
  );
});

test("merge-two", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+4");
  await importSecondary(2, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-two.txt",
  );
});

test("merge-no-timestamps", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-no-timestamps.txt",
  );
});

test("merge-no-trailing", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("no_trailing.lrc")]);
  await waitForImport(page);
  await expect(page.getByText(/⚠.*Missing trailing timestamp/)).toBeVisible();
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await expect(
    page.getByText(/Missing trailing timestamp in Main/),
  ).toBeVisible();
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-no-trailing.txt",
  );
});

test("merge-line-mismatch", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish_mismatch.lrc");
  await expect(page.getByText("⚠ Line count mismatch (4 vs 5)")).toBeVisible();
  await page.keyboard.press("Control+6");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-timestamps.txt",
  );
});

test("merge-block-reload", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("F5");
  await expect(
    page.getByRole("button", { name: "Merge fields" }),
  ).toBeVisible();
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "merge-timestamps.txt",
  );
});

test("reload-merge-disabled", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
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
