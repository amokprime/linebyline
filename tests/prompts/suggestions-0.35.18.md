AI used: [GLM-5.1](https://chat.z.ai)

---

I am sharing some project files for context in uploads.zip:
1. skills folder - a little outdated but has critical information about the app architecture
2. linebyline-0.35.18.html itself - latest version sitting in a PR, not yet merged pending testing
3. HELP.md - user facing instructions for how to use the app
4. CHECKLIST.md - entirely manual tests for me to run
5. music folder - used by CHECKLIST.md
6. Automated Tests.md - plan to transition to Playwright tests. A copy of CHECKLIST.md I just started to modify while working on the tests.

Based on the context, what would you recommend for Automated Tests.md? Specifically:
1. Are any tests entirely skippable or safely reducible from exhaustive to sample-based in scope?
2. Do any tests need to be significantly refactored or merged for Playwright test files?
3. Are there any important types of tests that I never did, even in CHECKLIST.md?
4. What types of Playwright tests should I learn for questions 1-3?
5. What tests should remain manual?
6. How should surviving automated tests be packaged into Playwright test files?
	1. Monolithic file?
	2. Multiple files?
		1. What order should they be run in?

---

Now let me read the HTML file to understand the app structure and look for key features that affect testability:
Now I have a thorough understanding of the app. Let me deliver a comprehensive analysis.
Here's my full analysis based on the CHECKLIST, Automated Tests, HTML source, skills docs, and HELP.md:

---

## 1. Tests that are skippable or safely reducible to sample-based

### SKIP entirely (redundant or covered by a better technique)

| Test                                                    | Why skip                                                                                                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Each button tints on hover**                          | Already replaced by screenshot visual comparison ✓                                                                                                         |
| **Each button shows feedback on click**                 | Already replaced by screenshot visual comparison ✓                                                                                                         |
| **Open HELP.md/Issues by clicking button**              | These open external GitHub URLs — per Playwright best practices, don't test third-party dependencies. `toHaveAttribute('href', ...)` covers the wiring     |
| **Open HELP.md with `Ctrl+/` and Issues with `Ctrl+[`** | Same — the hotkey just opens the same external URL. Test the hotkey dispatches correctly (doesn't crash, doesn't open a dialog), but don't follow the link |

### REDUCE from exhaustive to sample

| Test area                                                                           | Original                                 | Recommended sample                                                                                                   | Rationale                                                                                                       |
| ----------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **8 timestamp adjustments** (`Z`/`V`/`A`/`F`/`S`/`D`/`X`/`C`)                       | All 8 individually                       | Test 2: one forward (e.g. `V`) and one backward (e.g. `Z`) + verify the Controls panel shows all 8 correct intervals | Same code path (`adjustTs`), different `cfg` values. If one size works and the config is loaded, they all work  |
| **Hotkey + button for every action**                                                | Test both input methods for every action | Test hotkey for most actions, button for a sample (play/pause, sync, theme)                                          | Buttons call the same function as hotkeys. If 3 buttons work, the wiring pattern works for all                  |
| **Typing mode playback duplicates** (`Ctrl+9`/`Ctrl+0`, `Ctrl+1`/`Ctrl+2`/`Ctrl+3`) | All individually                         | Test `Ctrl+Space` (play/pause) + `Ctrl+9` (seek) in Typing mode only; skip `Ctrl+0`/`Ctrl+1`/`Ctrl+2`/`Ctrl+3`       | Same underlying functions as Hotkey mode versions, just different key bindings. Verified already in Hotkey mode |
| **Tab through every visible element**                                               | Every element                            | Test 4-5 Tab stops covering: menu bar → font select → lyric area → Controls cells                                    | If the first 4-5 Tab stops hit the right elements and Shift+Tab reverses, the focus order is correct            |
| **Seek by dragging slider**                                                         | Full drag interaction                    | Test click on seek bar (sets position) + verify scroll increments 5s                                                 | Drag testing is fragile and click+scroll exercise the same code paths                                           |
| **Volume slider seek by scroll**                                                    | Full interaction                         | Test mute/unmute snaps slider to 0/100; skip individual scroll ticks                                                 | Mute snap is the only complex behavior; scroll increments are trivial                                           |
| **Settings search by name**                                                         | Multiple search terms                    | Test "Moving" and "Default" — one checkbox result, one number-field result                                           | Covers both setting types                                                                                       |
| **Instant Replay: 7 triggers**                                                      | All 7                                    | Test "Moving to previous line" + "Syncing line" — one navigation trigger, one action trigger                         | Same `replayActiveLine` call, just different callers                                                            |
| **Intervals: all 4 size changes**                                                   | Tiny/Small/Medium/Large                  | Test Tiny (100→200) — the rest use the same `adjustTs` code path with different `cfg` values                         | Already covered by the sample timestamp adjustment test                                                         |
| **Hotkey assignment: click AND Tab for each field**                                 | Both input methods for every field       | Test click for 2 fields + Tab for 1 field                                                                            | Covers both input paths without combinatorial explosion                                                         |

### Summary: from ~100 granular checks → ~40 meaningful automated tests

---

## 2. Tests needing refactor or merge for Playwright

### Merge: timestamp adjustments + offset mode

The CHECKLIST separates "Adjustments" (8 individual timestamp adjustments) and "Offset mode" into different sections. In Playwright, merge into a single `describe`:

```js
test.describe('timestamp and offset adjustments', () => {
  test.beforeEach(async ({ page }) => { /* load folder 2 files */ });

  test('tiny adjustment: Z backs, V forwards', async ({ page }) => { ... });
  test('offset mode redirects adjustments to seek offset', async ({ page }) => { ... });
  test('sync file adjusts all timestamps', async ({ page }) => { ... });
});
```

### Merge: Hotkey mode + Typing mode playback

Don't test Typing mode playback keys (`Ctrl+Space`, `Ctrl+9`, `Ctrl+0`) separately from Hotkey mode. Instead, one test that toggles mode and verifies the alternate binding works:

```js
test('play/pause works in both modes', async ({ page }) => {
  // Hotkey mode: Space
  await page.keyboard.press('Space');
  await expect(page.locator('#media-pause-icon')).toBeVisible();
  // Toggle to Typing mode
  await page.keyboard.press('`');
  // Typing mode: Ctrl+Space
  await page.keyboard.press('Control+Space');
  await expect(page.locator('#media-play-icon')).toBeVisible();
});
```

### Refactor: "folder 1/2/3/4" → named fixtures

The CHECKLIST references music folders. In Playwright, create a helper that sets up the right files instead of manually tracking folder numbers:

```js
// tests/helpers/test-files.js
const path = require('path');
const FILES = {
  basic: { audio: 'music/1/I Wish I Could Identify That Smell.mp3', lrc: 'music/1/I Wish I Could Identify That Smell.lrc' },
  synced: { audio: 'music/2/...', lrc: 'music/2/...' },
  translationInline: { lrc: 'music/3.1/...', txt: 'music/3.1/example.txt' },
  translationSplit: { lrc: 'music/3.2/...', txt: 'music/3.2/example.txt' },
  bilingual: { lrc: 'music/4/I Wish I Could Identify That Smell.lrc', translation: 'music/4/spanish.lrc', sample: 'music/4/sample.txt' },
};

function loadFiles(page, key) {
  const files = FILES[key];
  // Use page.locator('#file-picker').setInputFiles(...)
}
```

---

## 3. Important test types missing from CHECKLIST entirely

### A. Accessibility (a11y) testing

Your CHECKLIST tests Tab order manually, but never checks:
- **Screen reader semantics** — `aria-label`, `role="dialog"`, `aria-modal` (your Settings dialog has these, but do they work?)
- **Focus visibility** — `:focus-visible` outlines on all interactive elements
- **Color contrast** — especially in both light and dark themes
- **Keyboard traps** — can Tab escape the Settings modal? (Your skill docs show a focus trap, but is it tested?)

**Tool**: `@axe-core/playwright` — one scan catches all of the above:

```js
import AxeBuilder from '@axe-core/playwright';

test('no accessibility violations', async ({ page }) => {
  await page.goto(latestPath);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### B. localStorage/sessionStorage persistence

The CHECKLIST's "Persistence" section tests it manually. Automate it:

```js
test('settings persist across reload', async ({ page }) => {
  await page.goto(latestPath);
  // Change theme
  await page.keyboard.press('Control+.');
  await page.reload();
  // Verify dark theme persisted
  await expect(page.locator('#btn-theme')).toHaveText('☀️');
});

test('autosave survives refresh', async ({ page }) => {
  await page.goto(latestPath);
  // Load files, sync some lines...
  await page.reload();
  // Verify lyrics are still there
  await expect(page.locator('#main-lines')).toContainText('I Wish');
});
```

### C. Visual regression testing (beyond button screenshots)

You test button hover/click states, but not:
- **Theme consistency** — does every element look correct in dark mode?
- **Layout integrity** — does the secondary field column render correctly alongside main?
- **Settings panel** — does it look right when scrolled?

```js
test('dark mode layout', async ({ page }) => {
  await page.goto(latestPath);
  await page.keyboard.press('Control+.');
  await expect(page).toHaveScreenshot('dark-mode.png');
});
```

### D. Error/edge case testing

The CHECKLIST only tests happy paths. Missing:
- **Empty lyrics** — what happens when you sync with no lines?
- **No audio loaded** — do playback controls gracefully no-op?
- **Corrupt .lrc file** — malformed timestamps, missing brackets
- **Oversized paste** — pasting 10,000 lines of text
- **Concurrent rapid actions** — pressing sync + undo simultaneously

### E. Download verification

The CHECKLIST says "Saved lyrics contents match Typing mode window contents" but this is hard to verify manually. Playwright can intercept downloads:

```js
test('save produces correct .lrc file', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download.createReadStream().then(s => s.read().toString());
  expect(content).toContain('[ti:');
  expect(content).toContain('[ar:');
});
```

---

## 4. Playwright test types to learn

| Type                         | What it is                                       | Use it for                                | Learn from                                                                 |
| ---------------------------- | ------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------- |
| **Locator assertions**       | `toHaveText`, `toBeVisible`, `toHaveAttribute`   | 90% of your tests                         | [Docs: assertions](https://playwright.dev/docs/test-assertions)            |
| **Keyboard input**           | `page.keyboard.press()`, `page.keyboard.type()`  | All hotkey tests, typing mode, Tab nav    | [Docs: keyboard](https://playwright.dev/docs/input)                        |
| **File upload**              | `locator.setInputFiles()`                        | Import audio/.lrc files                   | [Docs: file upload](https://playwright.dev/docs/input#upload-files)        |
| **Download interception**    | `page.waitForEvent('download')`                  | Save .lrc file verification               | [Docs: downloads](https://playwright.dev/docs/downloads)                   |
| **Dialog handling**          | `page.on('dialog')`                              | beforeunload warning, confirm dialogs     | [Docs: dialogs](https://playwright.dev/docs/dialogs)                       |
| **Visual comparison**        | `toHaveScreenshot()`                             | Theme, layout, button states              | [Docs: screenshots](https://playwright.dev/docs/test-snapshots)            |
| **localStorage inspection**  | `page.evaluate(() => localStorage.getItem(...))` | Persistence tests                         | [Docs: evaluate](https://playwright.dev/docs/evaluating)                   |
| **`test.describe` grouping** | Organize related tests with shared setup         | All your test files                       | [Docs: describe](https://playwright.dev/docs/api/class-describe)           |
| **`test.beforeEach` hooks**  | Shared setup (navigate, load files)              | Every file — avoids repeating `page.goto` | [Docs: hooks](https://playwright.dev/docs/api/class-test#test-before-each) |
| **Accessibility**            | `@axe-core/playwright`                           | a11y scan                                 | [npm: axe-core](https://www.npmjs.com/package/@axe-core/playwright)        |

Priority learning order: locators → keyboard → file upload → `beforeEach` hooks → downloads → dialogs → screenshots → localStorage → axe-core

---

## 5. Tests that should remain manual

| Test                                          | Why manual                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Audio quality / correct playback position** | Playwright can verify `#time-pos` advances but can't confirm the audio actually sounds right at the seek offset                                                                                  |
| **Native file picker appearance**             | OS dialog — Playwright can't see it. You can verify the *result* of `setInputFiles()` but not that the picker opened                                                                             |
| **Beforeunload on browser-level close**       | `Ctrl+W`, `Alt+F4`, middle-click tab, X button — these are browser chrome, not page-level events. Playwright can test `page.close()` and `page.reload()` with `beforeunload`, but not the others |
| **Instant Replay timing feel**                | Does the replay offset "feel right"? 600ms offset can only be judged by ear                                                                                                                      |
| **Undo debounce window perception**           | "Batch undo" vs "individual undo" at 150ms threshold — the timing boundary is subjective. You can test that rapid keystrokes produce fewer undo steps, but not that the threshold *feels* right  |
| **Lyrics scroll position after mode toggle**  | "About the same position" is subjective — close enough for visual inspection but fragile as a pixel assertion                                                                                    |

---

## 6. Test file packaging

### Multiple files, not monolithic

A single file would be 500+ tests. Multiple files give you:
- Parallel execution (Playwright runs files in parallel by default)
- Focused failures — test name tells you the area
- Faster iteration — run just the file you're working on

### Recommended file structure

```
tests/
  helpers/
    package.json         ← @linebyline/test-helpers
    index.js             ← findLatestVersion + test file paths
  smoke.spec.js          ← Title, favicon, loads without errors
  theme-font.spec.js     ← Theme toggle, font select, font size
  import-paste.spec.js   ← File import, paste, Genius extraction, metadata
  playback.spec.js       ← Play/pause, seek, speed, volume, mute
  sync-adjust.spec.js    ← Sync lines, timestamps, offset mode, sync file
  typing-mode.spec.js    ← Mode toggle, autocomplete, Typing-mode playback keys
  fields-merge.spec.js   ← Add/hide secondary fields, merge, translations
  settings.spec.js       ← Settings UI, search, intervals, persistence, hotkey assignment
  undo-redo.spec.js      ← Undo/redo across import, sync, typing, merge
  keyboard-nav.spec.js   ← Tab/Shift+Tab, arrow keys, focus management
  accessibility.spec.js  ← axe-core scan
```

### Run order

**No required order** — every test file is independent (each gets a fresh `page`). But for developer convenience during iteration, run in this order:

| Priority | File                    | Why first                                  |
| -------- | ----------------------- | ------------------------------------------ |
| 1        | `smoke.spec.js`         | 5 seconds, catches "app doesn't load"      |
| 2        | `theme-font.spec.js`    | Quick, catches CSS regression              |
| 3        | `import-paste.spec.js`  | Foundation — other tests need files loaded |
| 4-9      | All functional tests    | Can run in parallel                        |
| 10       | `accessibility.spec.js` | Runs last since it's a full-page scan      |

To enforce order only when running all tests together:

```js
// playwright.config.js
metainfo: {
  smoke: { file: 'smoke.spec.js' },
  // ...
}
```

Or more simply, just run smoke first during development:

```bash
npx playwright test smoke              # quick sanity check
npx playwright test --project=firefox   # full suite on one browser
npx playwright test                     # full suite, all browsers
```

### Test count estimate

| File | Estimated tests |
|---|---|
| smoke | 3 |
| theme-font | 4 |
| import-paste | 8 |
| playback | 8 |
| sync-adjust | 6 |
| typing-mode | 7 |
| fields-merge | 6 |
| settings | 8 |
| undo-redo | 4 |
| keyboard-nav | 3 |
| accessibility | 1 |
| **Total** | **~58** |

Down from ~100 granular manual checks, but covering the same ground more reliably.
The full analysis is above. The biggest takeaways:

1. **Cut 8 timestamp adjustment tests to 2** — biggest single reduction, same code path
2. **Don't test external link navigation** — `toHaveAttribute` covers it, per Playwright best practices
3. **Add axe-core** — it catches a11y issues you never manually tested for (and your Settings dialog already has the right ARIA attributes, so it should pass)
4. **Use `setInputFiles()`** to bypass native file pickers — your import tests can be fully automated
5. **Use `waitForEvent('download')`** to verify save output — replaces manual file comparison
6. **11 test files, ~58 tests** — each independent, each focused on one feature area