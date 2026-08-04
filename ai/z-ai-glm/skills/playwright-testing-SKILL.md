---
name: playwright-testing
description: Write and maintain Playwright tests for the LineByLine single-file HTML app. Use this skill whenever writing or modifying test files (*.spec.js), when the user mentions Playwright, tests, snapshots, screenshots, axe-scan, test failures, or when making code changes that could affect existing tests. Use proactively — whenever you modify the app's HTML/JS, check if any test expectations need updating. This skill covers snapshot strategy, test helpers, common patterns, the impact of code changes on test validity, and the TypeScript/diagnostics setup that keeps Zed Project Diagnostics clean.
---

This project uses Playwright with a custom test helper (`tests/helpers/index.js`) that provides fixtures for file import, media resolution, version auto-detection, and clipboard-paste workarounds. Tests run against `docs/index.html`.

---

## Test infrastructure

File structure:
```
tests/
├── helpers/
│   └── index.js          — Custom fixtures (media, readMedia, importSecondary, tabUntilFocused, workaroundPaste)
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
│   └── 10k_lines.lrc      — Manual test only (see MANUAL.md)
├── chat/                  — Previous AI chats about test writing
├── MANUAL.md              — Manual tests not automated by Playwright
├── app-globals.d.ts       — Ambient declarations for app functions called in page.evaluate()
├── jsconfig.json          — Tells tsserver to include .d.ts files in the project
├── accessibility.spec.js  — axe-core scans (landing, lyrics, settings)
├── fields-merge.spec.js   — Secondary field import, hide, merge
├── import-paste.spec.js   — File import and paste (hotkey + typing modes)
├── intervals.spec.js      — Timestamp interval/offset
├── keyboard-nav.spec.js   — Keyboard navigation and focus
├── key-guard.spec.js      — Hotkey restriction/conflict
├── logic.spec.js          — Core LRC logic unit tests (sync, adjust, undo)
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
- `workaroundPaste` — auto-setup fixture for clipboard-paste tests (see below)

All test files import from `@linebyline/test-helpers` which resolves to `helpers/index.js` via `package.json`.

---

## Running tests — two environments

The project uses two Playwright entry points that run in different OS environments. This matters because font rendering differs between them, which affects screenshot tests.

| Command | Environment | Env vars | Purpose |
|---|---|---|---|
| `tst` | Podman Ubuntu container | `PW_CONTAINER=1` | Headless CI-equivalent run; baselines live here |
| `tsta` | Fedora host | (none) | UI mode for interactive debugging |
| CI | GitHub Actions ubuntu-latest | `CI=1` | Same as `tst` but stricter (workers=1, retries=2) |

`playwright.config.js` uses `PW_CONTAINER` and `CI` to enable webkit (unstable on Fedora host) and tighten CI settings. Tests can gate on these env vars to skip font-fragile screenshots in UI mode (see "Font-fragile screenshots" below).

---

## Snapshot strategy — three assertion types

### 1. `toMatchAriaSnapshot()` — preferred for structure

Captures the ARIA tree structure. Best for verifying layout and component hierarchy.

Advantages: preserves blank lines (as empty `listitem`); captures ARIA roles and labels; no CSS color fragility; one assertion replaces multiple `innerText` + `inputValue` + visibility checks.

Limitations: no metadata lines in snapshot (meta lines are hidden in hotkey mode, so aria tree skips them); timestamps are regex-obfuscated (`/\[\d+:\d+\.\d+\]/`) — can't verify exact time values; secondary textarea content is a single string — newlines are lost, so blank-line structure can't be verified.

Common scopes: `page.getByLabel("Lyric lines")` for main field only; `page.locator("#editor-area")` for main + secondary fields + checkboxes + warnings + import buttons; `page.locator("#left-panel")` for Now Playing + Controls; `page.locator("#settings-body")` for Settings content.

Shared snapshot names: when multiple tests expect the same content, use the `name:` option:
```js
expect(page.getByLabel("Lyric lines")).toMatchAriaSnapshot({ name: "synced_english.yml" });
```

Known aria-snapshot parser bug: Playwright's aria tokenizer crashes (`TypeError: ... 'raw'` or `'regex'`) when captured DOM contains text starting with `(` (parenthesized translation lines, `( )` checkbox labels). If you hit this, migrate the test to explicit `toContainText` / `toHaveValue` assertions instead of `toMatchAriaSnapshot`.

### 2. `inputValue().toMatchSnapshot()` — for exact textarea content

Use when you need to verify exact metadata values, exact timestamps, or newline structure that `toMatchAriaSnapshot` can't capture.

```js
expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("import-plain-textarea.txt");
```

### 3. `toHaveScreenshot()` — for visual regression (font-fragile, read the next section)

Use sparingly — screenshots are fragile (depend on font rendering, DPI, theme). Prefer aria snapshots for structural checks. Reserve screenshots for visual layout that can't be expressed structurally.

```js
await expect(page).toHaveScreenshot("font-hotkey.png");
```

The project sets `maxDiffPixelRatio: 0.05` (5%) in `playwright.config.js` to tolerate minor rendering variance.

---

## Font-fragile screenshots — root cause and fixes

Screenshot tests that capture elements whose dimensions depend on text rendering will fail when run in a different OS environment, because `system-ui` and the `serif`/`sans-serif` CSS keywords resolve to different fonts on Ubuntu vs Fedora. This is the single most common source of "passes in `tst`, fails in `tsta`" discrepancies.

### What makes a screenshot font-fragile

The app uses `body{font-family:system-ui,sans-serif}`. Elements whose dimensions track text content are fragile:
- `#left-panel{width:fit-content;min-width:310px}` — widens when system-ui renders button labels wider → narrows `#main-textarea`
- `#audio-box` height — depends on text row heights (system-ui x-height/ascender)
- `.hk-row{min-height:30.8px}` — grows when system-ui text height exceeds the min-height

Elements with all-fixed-px dimensions (e.g. `#menu-bar{height:39.6px}`, `.mb-btn{height:28.6px}`) are immune — their screenshots pass across OSes.

### Firefox form-control font gotcha

Firefox's UA stylesheet gives `<button>`, `<input>`, and `<select>` their own font-family (`-moz-button`, `-moz-field`, `-moz-list`), which does NOT inherit from `body`. So `body { font-family: 'DejaVu Sans' !important }` alone leaves form controls using the OS system font. This is invisible in computed-style inspections of `body` but shows up in button/input text widths.

### Fix: Skip in UI mode (zero baseline regen)

If the screenshot is structurally verified by other means and you just want UI mode to stop flagging it:
```js
test("tab-font", async ({ page }) => {
  test.skip(
    !process.env.CI && !process.env.PW_CONTAINER,
    "Font-fragile: #main-textarea width depends on #left-panel fit-content, which varies with OS system-ui font. Skipped in UI mode on host; runs in CI and `tst` container.",
  );
  // ... rest of test
});
```
This runs the test in `tst` (container, `PW_CONTAINER=1`) and CI (`CI=1`), skips it in `tsta` (host UI mode). No baseline regen needed.

---

## When code changes require snapshot/screenshot regen

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

## Common test patterns

### Importing files
```js
// Import audio + LRC together
await page.locator("#file-picker").setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);

// Import LRC only
await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);

// Import into secondary field
await importSecondary(1, "plain_french.lrc");
```

### Pasting content via clipboard — use the `workaroundPaste` fixture

Clipboard paste tests need two things on every test: (1) skip on webkit (its clipboard `Control+v` is unreliable and produces empty snapshots), and (2) grant `clipboard-read`/`clipboard-write` permissions on chromium. The `workaroundPaste` auto-setup fixture handles both. Destructure it in the test args — its presence triggers setup.

```js
test("paste-plain-hotkey", async ({ page, readMedia, workaroundPaste: _workaroundPaste }) => {
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot("paste-plain-hotkey.txt");
});
```

The `workaroundPaste: _workaroundPaste` rename is important: the underscore prefix silences tsserver's "declared but its value is never read" (TS6133) warning, since the fixture has no value — its presence only triggers setup. See "TypeScript diagnostics setup" below.

If you write a new paste test, add `workaroundPaste: _workaroundPaste` to the destructured args. Do not inline the `context.grantPermissions` + `test.skip(webkit)` boilerplate — the fixture exists to keep that in one place.

### Switching modes
```js
// Enter typing mode
await page.keyboard.press("Backquote"); // or the toggle_mode hotkey

// Enter hotkey mode (already default)
// just don't press Backquote
```

### Checking for warnings
```js
await expect(page.getByText("⚠ Line count mismatch (4 vs 5)")).toBeVisible();
```

### Save/download testing — Chromium/WebKit
```js
const downloadPromise = page.waitForEvent("download");
await page.keyboard.press("Control+'");
const download = await downloadPromise;
const content = await download.path().then(p => require("fs").readFileSync(p, "utf-8"));
expect(download.suggestedFilename()).toBe("ExpectedTitle.lrc");
```

### Save/download testing — Firefox (workaround for `browserContext.close` protocol error)
```js
await page.evaluate(() => {
  window.__saveCapture = null;
  window.doSave = function () {
    const text = /** @type {HTMLInputElement} */ (document.getElementById("main-textarea")).value;
    const tiMatch = text.match(/^\[ti:\s*(.+)\]/m);
    const ti = tiMatch ? tiMatch[1].trim() : "";
    let stem = "lyrics";
    if (ti && ti.toLowerCase() !== "unknown") stem = ti;
    stem = stem.replace(/[/\\:*?"<>|]/g, "_");
    window.__saveCapture = { text, filename: stem + ".lrc" };
  };
});
await page.keyboard.press("Control+'");
const { text, filename } = await page.evaluate(() => window.__saveCapture);
expect(text).toMatch(META);
expect(filename).toBe("TestTitle.lrc");
```

Note: the old pattern captured `const orig = window.doSave` to restore later, but the restore never happened and the page is discarded after the test anyway — so the capture was dead code that triggered TS6133. Don't add it back.

### Calling app functions inside `page.evaluate()`

`logic.spec.js` is a unit-test suite for app functions (`tsToMs`, `msToTs`, `replaceTs`, etc.). These are top-level `function` declarations in `docs/index.html`, so they become `window.*` globals at runtime. Call them inside `page.evaluate()`:
```js
test("tsToMs parses standard timestamp", async ({ page }) => {
  const result = await page.evaluate(() => tsToMs("[01:23.45]"));
  expect(result).toBe(83450);
});
```
tsserver doesn't understand that `page.evaluate(fn)` runs `fn` in the browser, so it reports TS2304 "Cannot find name 'tsToMs'" for every app function reference. See "TypeScript diagnostics setup" below for the fix.

---

## TypeScript diagnostics setup

Zed Project Diagnostics (powered by tsserver) flags several classes of false positives in `.js` test files because it doesn't understand Playwright's runtime context. Two files in `tests/` keep diagnostics clean: `jsconfig.json` and `app-globals.d.ts`. Both must be present — neither works alone.

### `tests/jsconfig.json` — project discovery

Without a `jsconfig.json`, tsserver creates an "inferred project" for each opened file. Inferred projects do NOT auto-discover sibling `.d.ts` files — they only include the file + its imports. So `app-globals.d.ts` sitting next to `logic.spec.js` is invisible. The `jsconfig.json` tells tsserver "all `.js` and `.d.ts` files in `tests/` are one project":
```json
{
  "compilerOptions": {
    "target": "ES2020", "module": "commonjs",
    "allowJs": true, "checkJs": true, "noEmit": true,
    "skipLibCheck": true, "strict": false, "types": ["node"]
  },
  "include": ["**/*.js", "**/*.d.ts"]
}
```
Scoped to `tests/` (not project root) to avoid affecting `playwright.config.js` (which uses ESM `import`/`export`).

### `tests/app-globals.d.ts` — ambient declarations for app functions

Declares the app functions that tests call inside `page.evaluate()` callbacks. Without it, every `page.evaluate(() => tsToMs(...))` triggers TS2304. The file uses `declare function` for globals and `interface Window` augmentation for `window.*` properties:

```ts
// App functions called inside page.evaluate() — defined in docs/index.html
declare function tsToMs(line: string): number | null;
declare function msToTs(ms: number): string;
// ... 18 more functions

// Test-injected window properties (e.g. Firefox save workaround)
interface Window {
  __saveCapture: { text: string; filename: string } | null;
  doSave: () => void;
}
```

Keep this file in sync with `docs/index.html`. If you add a new app function referenced in tests, add its signature here too.

### Recurring TS diagnostic patterns and their fixes

| Error | Cause | Fix |
|---|---|---|
| TS6133 `'workaroundPaste' is declared but its value is never read` | Auto-setup fixture has no value; destructured for side-effect | Rename to `_workaroundPaste` — underscore prefix exempts from unused check |
| TS2304 `Cannot find name 'tsToMs'` | App function called inside `page.evaluate()` — tsserver doesn't see browser globals | Add `declare function tsToMs(...)` to `tests/app-globals.d.ts` |
| TS2339 `Property 'value' does not exist on type 'HTMLElement'` | `document.getElementById()` returns `HTMLElement`, `.value` needs `HTMLInputElement` | Cast: `/** @type {HTMLInputElement} */ (document.getElementById("s-search")).value` |
| TS2339 `Property '__saveCapture' does not exist on type 'Window'` | Test-injected window property not declared | Add `interface Window { __saveCapture: ...; }` augmentation to `app-globals.d.ts` |
| TS7044 `Parameter 'name' implicitly has an 'any' type` | Arrow function param has no type annotation | Add JSDoc: `/** @param {string} name */` before the arrow |
| TS6133 `'orig' is declared but its value is never read` | Local variable assigned but never used | Remove it (underscore prefix only works for parameters, not locals) |

---

## Writing new tests

Import from `@linebyline/test-helpers`, not directly from `@playwright/test`. Use `media()` / `readMedia()` / `importSecondary()` fixtures, not hardcoded paths. Prefer `toMatchAriaSnapshot()` for structural assertions. Use `inputValue().toMatchSnapshot()` when exact content matters (timestamps, metadata, newlines). Use `toHaveScreenshot()` only when visual layout must be verified — and read the "Font-fragile screenshots" section first. Use `getByRole()` and `getByLabel()` selectors, not CSS selectors, when possible. Don't test for exact timestamp values in aria snapshots — they're regex-obfuscated. If testing across browsers, handle Firefox-specific limitations (download events, context teardown). Name shared snapshots with the `name:` option when multiple tests expect identical content.

For any test that pastes via clipboard, add `workaroundPaste: _workaroundPaste` to the destructured args — don't inline the boilerplate.

For any test that calls app functions inside `page.evaluate()`, ensure the function is declared in `tests/app-globals.d.ts` — otherwise Zed diagnostics will flag it.

Don't add heavy comments to test files, especially ones that just remind a future agent of the tests' basic intended flow step by step which the user is already familiar with. Explain them in chat instead, and use plain English when changes made purely by you are grounded deeply in app code that the user would not be familiar with. Rule of thumb: 1-2 lines per comment focusing on the most critical insight and no more than 1 comment for every 10 LOC. Don't bother with multiple `//` for multiline comments — modern IDEs have word wrap.

---

## Known flaky test categories

These tests pass in `tst` (container) but may intermittently fail or need extra care:

- **`toHaveScreenshot` in UI mode** — font-fragile tests (see "Font-fragile screenshots"). Either skip with the `!CI && !PW_CONTAINER` guard or normalize font with `addStyleTag`.
- **`speed-ratio`, `seek-increment`, `volume-increment`** (intervals.spec.js) — settings-save race: `Escape` doesn't guarantee settings saved before the next hotkey. Anchor with `await expect(page.locator("#settings-overlay")).not.toHaveClass(/open/)` after Escape.
- **`typing-debounce-1`** (intervals.spec.js, chromium) — 1ms debounce + Playwright's <1ms keypresses → all letters land in one snapshot. Add `waitForTimeout(5)` between keypresses so the debounce fires separately for each.
- **`search-check`, `tab-settings`** (webkit) — checkbox state not settled when asserted. Add `waitForTimeout(50)` after `Space`.
- **`tab-lyrics`** (all browsers) — `Control+4` to add secondary field races with focus. Use `tabUntilFocused` to wait for the secondary textarea before typing.
