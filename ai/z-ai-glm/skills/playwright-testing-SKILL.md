---
name: playwright-testing
description: Write and maintain Playwright tests for the LineByLine single-file HTML app. Use this skill whenever writing or modifying test files (*.spec.js), when the user mentions Playwright, tests, snapshots, screenshots, axe-scan, test failures, or when making code changes that could affect existing tests. Also use proactively — whenever you modify the app's HTML/JS, check if any test expectations need updating. This skill covers snapshot strategy, test helpers, common patterns, and the impact of code changes on test validity.
---

This project uses Playwright with a custom test helper (`tests/helpers/index.js`) that provides fixtures for file import, media resolution, and version auto-detection. Tests run against the highest semver HTML file found in `archive/semantic/`.

---

Test infrastructure

File structure:
```
tests/
├── helpers/
│   └── index.js          — Custom fixtures (media, readMedia, importSecondary, tabUntilFocused)
├── media/                 — Test fixture files (LRC, audio, mock data)
│   ├── audio.mp3
│   ├── synced_english.lrc
│   ├── plain_french.lrc
│   ├── plain_spanish.lrc
│   ├── plain_spanish_mismatch.lrc
│   ├── plain_english.lrc
│   ├── no_trailing.lrc
│   ├── translation_inline.lrc
│   ├── translation_split.lrc
│   ├── corrupted.lrc
│   ├── mock.txt           — Genius paste mock
│   ├── naughty-strings.json
│   └── 10k_lines.lrc
├── prompts/               — Previous AI chats about test writing
├── MANUAL.md              — Manual tests not automated by Playwright
├── accessibility.spec.js  — axe-core scans (landing, lyrics, settings)
├── fields-merge.spec.js   — Secondary field import, hide, merge
├── import-paste.spec.js   — File import and paste (hotkey + typing modes)
├── intervals.spec.js      — Timestamp interval/offset
├── keyboard-nav.spec.js   — Keyboard navigation and focus
├── key-guard.spec.js      — Hotkey restriction/conflict
├── logic.spec.js          — Core LRC logic (sync, adjust, undo)
├── mark.spec.js           — Mark-as-translation, split-parens
├── playback.spec.js       — Audio playback controls
├── settings.spec.js       — Settings panel (aria snapshot, search, reset)
├── smoke.spec.js          — Landing page smoke test
├── sync-adjust.spec.js    — Sync line, adjust timestamp
├── theme-font.spec.js     — Theme cycling, font selection
├── typing-mode.spec.js    — Typing mode keystroke behavior
└── undo-redo.spec.js      — Undo/redo stack behavior
```

Custom fixtures (from helpers/index.js):
- `media(filename)` — resolves filename to absolute path in `tests/media/`
- `readMedia(filename)` — reads file contents as UTF-8
- `importSecondary(nth, filename)` — opens the nth import button and sets files
- `tabUntilFocused(page, selector, options)` — presses Tab until element is focused

All test files import from `@linebyline/test-helpers` which resolves to `helpers/index.js` via `package.json`.

---

Snapshot strategy — three assertion types

1. `toMatchAriaSnapshot()` — preferred for structure

Captures the ARIA tree structure. Best for verifying layout and component hierarchy.

Advantages: preserves blank lines (as empty `listitem`); captures ARIA roles and labels; no CSS color fragility; one assertion replaces multiple `innerText` + `inputValue` + visibility checks.

Limitations: no metadata lines in snapshot (meta lines are hidden in hotkey mode, so aria tree skips them); timestamps are regex-obfuscated (`/\[\d+:\d+\.\d+\]/`) — can't verify exact time values; secondary textarea content is a single string — newlines are lost, so blank-line structure can't be verified.

Common scopes: `page.getByLabel("Lyric lines")` for main field only; `page.locator("#editor-area")` for main + secondary fields + checkboxes + warnings + import buttons; `page.locator("#left-panel")` for Now Playing + Controls; `page.locator("#settings-body")` for Settings content.

Shared snapshot names: when multiple tests expect the same content, use the `name:` option:
```js
expect(page.getByLabel("Lyric lines")).toMatchAriaSnapshot({ name: "synced_english.yml" });
```

2. `inputValue().toMatchSnapshot()` — for exact textarea content

Use when you need to verify exact metadata values, exact timestamps, or newline structure that `toMatchAriaSnapshot` can't capture.

```js
expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("import-plain-textarea.txt");
```

3. `toHaveScreenshot()` — for visual regression

Use sparingly — screenshots are fragile (depend on font rendering, DPI, theme). Prefer aria snapshots for structural checks. Reserve screenshots for visual layout that can't be expressed structurally.

```js
await expect(page).toHaveScreenshot("font-hotkey.png");
```

---

When code changes require snapshot/screenshot regen

You must proactively identify these before the user runs tests. When you modify the app code, check every test that could be affected:

| Type of code change | Tests likely affected | Action needed |
|---|---|---|
| Changed HTML structure (added/removed elements, changed roles) | All tests using `toMatchAriaSnapshot` on affected scope | Regenerate `.aria.yml` snapshots |
| Changed visible text (labels, button names, error messages) | Tests using `toMatchAriaSnapshot` or `innerText` snapshots | Regenerate affected snapshots |
| Changed CSS that affects layout | Tests using `toHaveScreenshot` | Regenerate screenshot PNGs |
| Added/removed DOM elements | Tests using `toBeVisible()`, `toBeDisabled()`, role-based selectors | Update assertions |
| Changed aria-label or role attributes | All tests using `getByRole()`, `getByLabel()`, aria snapshots | Update selectors and regenerate |
| Changed default config values | Tests that rely on default hotkey assignments | Update key press sequences |
| Changed timestamp format | Tests using `inputValue` snapshots of timestamps | Regenerate `.txt` snapshots |
| Changed merge/secondary behavior | `fields-merge.spec.js`, `import-paste.spec.js` | Regenerate affected snapshots |
| Added new checkbox or UI toggle | Tests that snapshot the editor area | Regenerate `.aria.yml` snapshots |
| Changed Settings panel layout | `settings.spec.js` aria snapshot | Regenerate `settings-window-1.aria.yml` |

After making code changes: always tell the user which test snapshots will need regeneration, and which specific snapshot files are affected.

---

Common test patterns

Importing files:
```js
// Import audio + LRC together
await page.locator("#file-picker").setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);

// Import LRC only
await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);

// Import into secondary field
await importSecondary(1, "plain_french.lrc");
```

Pasting content via clipboard:
```js
await page.evaluate((text) => {
  navigator.clipboard.writeText(text);
}, readMedia("plain_english.lrc"));
await page.keyboard.press("Control+v");
```

Switching modes:
```js
// Enter typing mode
await page.keyboard.press("Backquote"); // or the toggle_mode hotkey

// Enter hotkey mode (already default)
// just don't press Backquote
```

Checking for warnings:
```js
await expect(page.getByText("⚠ Line count mismatch (4 vs 5)")).toBeVisible();
```

Save/download testing — Chromium/WebKit:
```js
const downloadPromise = page.waitForEvent("download");
await page.keyboard.press("Control+'");
const download = await downloadPromise;
const content = await download.path().then(p => require("fs").readFileSync(p, "utf-8"));
expect(download.suggestedFilename()).toBe("ExpectedTitle.lrc");
```

Save/download testing — Firefox (workaround for `browserContext.close` protocol error):
```js
await page.evaluate(() => {
  window.__saveCapture = null;
  const origSave = window.doSave;
  window.doSave = function(...args) {
    window.__saveCapture = { content: args[0], filename: args[1] };
  };
});
await page.keyboard.press("Control+'");
const captured = await page.evaluate(() => window.__saveCapture);
expect(captured.filename).toBe("ExpectedTitle.lrc");
```

---

Writing new tests

Import from `@linebyline/test-helpers`, not directly from `@playwright/test`. Use `media()` / `readMedia()` / `importSecondary()` fixtures, not hardcoded paths. Prefer `toMatchAriaSnapshot()` for structural assertions. Use `inputValue().toMatchSnapshot()` when exact content matters (timestamps, metadata, newlines). Use `toHaveScreenshot()` only when visual layout must be verified. Use `getByRole()` and `getByLabel()` selectors, not CSS selectors, when possible. Don't test for exact timestamp values in aria snapshots — they're regex-obfuscated. If testing across browsers, handle Firefox-specific limitations (download events, context teardown). Name shared snapshots with the `name:` option when multiple tests expect identical content.
