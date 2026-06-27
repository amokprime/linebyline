const {
  test,
  expect,
  waitForImport,
  waitForLyrics,
  waitForAudio,
} = require("@linebyline/test-helpers");

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

test("import-plain", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await waitForImport(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-plain-textarea.txt",
  );
});

test("import-synced", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-synced-textarea.txt",
  );
});

test("import-replace", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await waitForImport(page);
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-replace-textarea.txt",
  );
});

test("import-lyrics-first", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  await waitForLyrics(page);
  await expect(page.getByText("plain_english")).toBeVisible();
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await waitForAudio(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "import-lyrics-textarea.txt",
  );
});

test("import-corrupted-lyrics", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("corrupted.lrc")]);
  await waitForLyrics(page);
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "corrupted-textarea.txt",
  );
});

test("paste-plain-hotkey", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "paste-plain-hotkey.txt",
  );
});

test("paste-synced-hotkey", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("synced_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
    "paste-synced-hotkey.txt",
  );
});

test("paste-plain-typing", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-plain-typing.txt",
  );
});

test("paste-synced-typing", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("synced_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-synced-typing.txt",
  );
});

test("paste-secondary", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.keyboard.press("Control+4");
  await page.getByRole("textbox").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_french.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
    "paste-secondary.txt",
  );
});

test("paste-genius-hotkey", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("mock.txt"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-genius-hotkey.txt",
  );
});

test("paste-genius-typing", async ({ page, context, readMedia }) => {
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("mock.txt"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
    "paste-genius-typing.txt",
  );
});

test("save", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("synced_english.lrc")]);
  await waitForLyrics(page);
  const TITLE = "I Wish I Could Identify That Smell";
  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download
    .path()
    .then((p) => require("fs").readFileSync(p, "utf-8"));
  const filename = download.suggestedFilename();
  const savedTitle = content.match(/\[ti: (.+?)\]/)?.[1];
  expect(savedTitle).toEqual(TITLE);
  expect(content).toContain("[ar: The Jazz Kissingers]");
  expect(content).toMatchSnapshot();
  expect(filename).toBe(`${TITLE}.lrc`);
});

test("naughty-strings", async ({ page }) => {
  // Targets paste-path edge cases NOT covered by import-corrupted-lyrics:
  //  import-corrupted-lyrics already tests: 3/4-decimal timestamps,
  //  non-numeric [X:X.X], missing brackets, trailing end timestamps.
  const NAUGHTY = [
    "[ar: <script>alert(1)</script>]", // META_RE match with HTML in value
    "[123: numeric key]", // bracket+colon but NOT META_RE (digits)
    "[]", // empty brackets
    "[[[nested]]]", // triple brackets
    "\ufeffBOM prefix", // BOM character
    "zero\u200bwidth", // zero-width space
    "line1\rline2", // carriage return (not split by \n)
    "A".repeat(10000), // extremely long single line
  ];

  await page.locator("#main-lines").click();
  for (const [i, naughty] of NAUGHTY.entries()) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press("Control+v");
    await expect(page.locator("#main-lines")).toBeVisible();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
  }
});
