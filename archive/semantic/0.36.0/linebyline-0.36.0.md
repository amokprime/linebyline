---
model: GLM-5.1
summary: Accessibility overhaul — ARIA roles, labels, live regions, aria-disabled states, progress slider values, consistent Settings hotkey selectors, keyboard-activatable control cells; plus axe violation fixes — removed role=banner from field headers, fixed timestamp color contrast
---

### Version
Minor

### Bugs
- See latest axe-core accessibility scans
- Improve Playwright visibility. All these items currently rely on screenshot checks or snapshots:
        - Controls are not real buttons and look like `getByText('Play/pauseSpace')`
        - Highlighter and border cursor are not exposed at all
        - `locator('#progress-wrap')` slider doesn't have a time value the way volume slider has a volume value
        - Buttons don't expose their enabled/disabled states
        - Many UI sections are only identifiable via `getByText`
                - Main window menu bar: `getByText('📂 💾 System Sans System')`
                - Now Playing, Controls: `getByText('Now playing Unknown Title')`
                - Media playback controls inside Now Playing: `getByText('Unknown Title Unknown Artist')`
                - Main field title bar: `getByText('Main ( ) ↩')`
                - Secondary field title bar: `getByText('Secondary 1📂( )')`
                - Settings title bar: `getByText('Settings ⌨')`
                - Settings bottom bar: `getByText('Reset defaults Reset all')`
        - Main field raw text field is not exposed to `getByText` and `getbyValue` is useless for spot checking specific lines of text, so a snapshot was needed to check for the Typing mode specific scroll bug
        - Secondary field has no equivalent to `file-picker` and required a less efficient import strategy in `fields-merge.spec.js` for the hide-secondary test
        - Settings hotkeys are inconsistent
                - Menu section hotkeys look like `getByRole('textbox').nth(3)`
                - Other section hotkeys look like `locator('div:nth-child(13) > .hk-capture')`

---

User prompts verbatim (including Prompt.md contents):

> Yes-all items in Prompt.md.

---

Changes made:

1. **Menu bar**: Changed `<div id="menu-bar">` to `<nav role="toolbar" aria-label="Main toolbar">`. Added `aria-label` to all menu bar buttons (import, save, undo, redo, add-sec, remove-sec, merge, settings, theme, font-select, font-size-inp).

2. **Now Playing section**: Added `id="now-playing-label"` to the "Now playing" label, `role="region" aria-labelledby="now-playing-label"` to `#audio-box`, `aria-label` to `#song-title`, `#song-artist`, `#time-pos`, `#time-dur`.

3. **Progress slider**: Added `role="slider"`, `aria-label="Playback position"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow`, `aria-valuetext` to `#progress-wrap`. JS `onTimeUpdate` now updates `aria-valuenow` and `aria-valuetext` with current position and duration on every timeupdate.

4. **Playback controls**: Already `<button>` elements — added `aria-label` to speed-val, vol-slider, vol-pct, seek-offset, sync-file-btn.

5. **Controls panel (hk-grid)**: Added `id="controls-label"` to the "Controls" label, `role="group" aria-labelledby="controls-label"` to `#hk-grid`. Each `hk-cell` div now gets `role="button"`, `tabindex="0"`, `aria-label` (with "(disabled in typing mode)" suffix when dimmed), `aria-disabled="true"` when dimmed, and `keydown` handler for Enter/Space activation.

6. **Highlighter/cursor exposure**: Added `_announce(msg)` helper function in Render/UI section that writes to a visually-hidden `#a11y-announcer` `aria-live="polite"` region. `updateActiveLineFromTime` now announces the playing line text when it auto-advances.

7. **Button enabled/disabled states**: `updateMergeBtn` now sets `aria-disabled` alongside `disabled` on `#btn-remove-sec` and `#merge-btn`. `mergeTranslations` sets `aria-disabled` on merge-btn after merge. Initial HTML includes `aria-disabled="true"` on the two disabled buttons.

8. **Field headers**: `#main-col .field-header` gets `role="banner" aria-label="Main field header"`. Secondary field headers (dynamically created) get `role="banner" aria-label="Secondary N field header"`.

9. **Main textarea/lines**: `#main-textarea` gets `aria-label="Main lyric text"`. `#main-lines` gets `role="list" aria-label="Lyric lines"`. Each rendered `.lrc-line` div gets `role="listitem"`. `#main-warn` gets `role="alert"`.

10. **Secondary field import**: `addSecondary`'s `📂` button gets `aria-label="Import secondary lyrics file"`. The secondary textarea gets `aria-label="Secondary N lyrics"`. The hidden `<input type="file">` for the main import gets `aria-hidden="true"`.

11. **Settings hotkeys consistent selectors**: `buildHkRows` now assigns `id="hk-capture-{key}"` to each capture input and `for="hk-capture-{key}"` to its label. This makes Playwright selectors consistent: `locator('#hk-capture-play_pause')` works regardless of section position. Also added `aria-label` to clear, replace, and reset buttons with the action name for context.

12. **Settings UI**: `#settings-conflict` gets `role="status" aria-live="polite"`. `#settings-footer` gets `role="contentinfo" aria-label="Settings actions"`. `#s-search` gets `aria-label="Search settings"`. `#s-reset-defaults`, `#s-confirm-yes`, `#s-confirm-no` get `aria-label`.

13. **SECTIONS index re-indexed** to reflect line number shifts from all patches.

Skills updated: `linebyline-section-index-SKILL.md` — SECTIONS reference updated to v0.36.0, Render/UI description updated to include `_announce`.

---

### Turn 2: Playwright test fix-up after accessibility changes

28 tests broke systematically after the Turn 1 accessibility overhaul. Root causes were accessible-name changes that made old Playwright selectors fail.

#### HTML fixes (axe violations + contrast)

14. **Removed `role="toolbar"` from `<nav>`**: `<nav>` cannot have `role="toolbar"` per ARIA spec (axe: `aria-allowed-role`). The `<nav>` element already provides a navigation landmark; `aria-label="Main toolbar"` remains.

15. **Changed `<div id="main">` to `<main id="main">`**: Adds a proper `<main>` landmark (fixes axe: `landmark-one-main` and `region` violations for content inside `#main`). The CSS uses `#main` (ID selector) so no style change.

16. **Added visually-hidden `<h1>LineByLine</h1>`** inside `<main>`: Fixes axe: `page-has-heading-one`. Uses the standard clip-rect technique for screen-reader-only text.

17. **Fixed `#vol-pct` color contrast**: Changed `color:var(--text-faint)` to `color:var(--text-muted)`. The `--text-faint` (#9198a1) on `--bg` (#f6f8fa) gave 2.73:1 ratio — below the 4.5:1 AA minimum. `--text-muted` (#656d76) gives ~4.9:1.

18. **Fixed `.hk-cell.mode .hk-key` color contrast**: Changed `color:var(--accent)` to `color:var(--active-text)`. The `--accent` (#0969da) on `rgba(9,105,218,0.15)` computed background gave 3.73:1. `--active-text` (#0550ae) gives ~5.4:1.

19. **Added `aria-label="Default metadata tags"` to `#s-default-meta`**: The `<textarea>` had no label, title, or aria-label (axe: `label` violation, impact: critical).

#### Test file fixes

20. **`tests/helpers/index.js` — `importSecondary` fixture**: Changed from `getByRole("button", { name: "📂" }).nth(nth)` to `getByRole("button", { name: "Import secondary lyrics file" }).nth(nth - 1)`. The 📂 buttons now have `aria-label` attributes which override text content as the accessible name, so the old emoji-based selector found zero matches. Also corrected the index to be 0-based (`nth - 1`) since there's no longer a toolbar 📂 to skip. **Affects 12 tests** across `fields-merge.spec.js`, `undo-redo.spec.js`, `accessibility.spec.js`.

21. **`playback.spec.js`, `smoke.spec.js`, `sync-adjust.spec.js` — Play button**: Added `exact: true` to `getByRole("button", { name: "Play" })`. The media button (`aria-label="Play"`) and the controls grid cell (`aria-label="Play/pause"`) both matched the substring "Play", causing strict-mode violations. **Affects 6 tests**.

22. **`settings.spec.js` — Search textbox**: Changed `{ name: "Search…" }` to `{ name: "Search settings" }`. The `aria-label` attribute now provides the accessible name (overriding the `placeholder`). **Affects 4 tests**.

23. **`settings.spec.js`, `sync-adjust.spec.js` — Seek offset spinbutton**: Changed `{ name: "Seek offset (ms): shifts" }` to `{ name: "Seek offset in milliseconds" }`. The `aria-label` was updated in Turn 1. **Affects 2 tests**.

#### Not fixed (known broken)

- **`sync-repeat`**: Test comment says "Confirmed broken, fixing in next version." Undo does not remove timestamps after multiple syncs.

#### Tests requiring screenshot regeneration

The color contrast CSS changes (items 17–18) alter visual appearance. Tests using `toHaveScreenshot()` that capture the volume percentage or mode-cell hotkey badges need new baselines:

| Test | Why |
|------|-----|
| `smoke` → `landing` | Full page includes controls panel |
| `fields-merge` → `font` | Two full-page screenshots include controls |
| `fields-merge` → `merge-no-timestamps` | Full page screenshot |
| `fields-merge` → `merge-no-trailing` | Full page screenshot |
| `fields-merge` → `merge-line-mismatch` | Full page screenshot |
| `fields-merge` → `merge-block-reload` | Full page screenshot |
| `fields-merge` → `reload-merge-disabled` | May include controls panel |
| `settings` → `persistence` | Titlebar screenshots (verify) |
| `settings` → `settings-window` | Settings body screenshot (verify) |

#### SECTIONS re-indexed again after Turn 2 HTML patches.

---

### Turn 3: Fix playwright-2 axe violations

User prompts verbatim:

> See playwright-2 issues; keep the same version.

---

Three axe-core violations across all three accessibility tests (axe-scan-landing, axe-scan-lyrics, axe-scan-settings):

24. **Removed `role="banner"` from main field header** (HTML): `role="banner"` on `.field-header` inside `<main>` violated `landmark-banner-is-top-level` — banner landmarks must be top-level, not nested inside other landmarks. The `aria-label="Main field header"` is retained for accessible naming without landmark semantics.

25. **Removed `hdr.setAttribute('role','banner')` from `addSecondary()`** (JS): Secondary field headers had the same `role="banner"` issue, plus caused `landmark-no-duplicate-banner` when multiple secondary fields existed. `aria-label` is retained.

26. **Fixed `.ts` timestamp color contrast**: Changed `.lrc-line .ts` from `color:var(--text-faint)` to `color:var(--text-muted)`. `--text-faint` (#9198a1) on `--bg` (#f6f8fa) gave 2.73:1 — below the 4.5:1 AA minimum. `--text-muted` (#656d76) gives about 4.9:1.

27. **Fixed `.lrc-line.end-ts` color contrast**: Same change from `--text-faint` to `--text-muted` for end-timestamp lines (same contrast failure).

No SECTIONS re-index needed — edits only removed text from existing lines, no line numbers shifted.

---
I changed this test in playback.spec.js to be less flaky. It was hitting Space before the lyrics even loaded (apparently something only Playwright can do):
```js
test("play-pause-hotkey", async ({ page, media }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await expect(page.getByText("[00:00.00] I wish I could")).toBeVisible(); //Not needed in a real browser; Playwright can press Space before lyrics finish loading
  await page.keyboard.press("Space");
  await expect(page.locator("#audio-box")).toContainText("0:01");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});
```
(This note was not sent as a prompt)

---
Can you copy the zip file to downloads too?

---
Done — `linebyline.zip` is now in `/home/z/my-project/download/` alongside the other files.

---
Just zip the changed files without any other subfolders next time. Btw, I have the option now of changing virtually every textarea toMatchSnapshot and some screenshots to toMatchAriaSnapshot. Is that a good idea?
```js
test("merge-no-timestamps", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  await expect(page.getByLabel("Lyric lines")).toMatchAriaSnapshot();
});
```

---
Good note on the zip — I'll do flat zips of just the changed files from now on.

On `toMatchAriaSnapshot`: **I'd be cautious.** It's a powerful tool but has significant tradeoffs for your test suite. Here's my thinking:

### The problem: over-broad matching

`toMatchAriaSnapshot()` captures the **entire** accessibility subtree. Your `merge-no-timestamps` example would snapshot everything inside `#main-lines` — every `listitem`, every `.ts` span, every line's text content, plus all ARIA attributes. That means:

- Adding an `aria-label` to a lyrics line breaks the merge test
- Changing `.ts` rendering (like we just did with `--text-muted`) could change the aria tree
- Any future accessibility improvement to the lyrics area breaks every merge/undo/import test that uses this pattern

The test is called "merge-no-timestamps" but it would fail on an unrelated ARIA change. That's the definition of a brittle test.

### When aria snapshots *are* good

- **One dedicated structural test**: "the landing page has the correct ARIA shape" — one snapshot, one test, update it when you intentionally change structure
- **Complex widget state**: verifying the settings dialog structure after opening it

### What I'd recommend instead

For merge/output verification, use **targeted text assertions** that check exactly what the test name promises:

```js
test("merge-no-timestamps", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("plain_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  await page.keyboard.press("Control+6");
  // Verify merge actually combined both fields
  await expect(page.getByLabel("Lyric lines")).toContainText("(Hola)");
  await expect(page.getByLabel("Lyric lines")).toContainText("Hello");
});
```

This way:
- The test breaks only if the merge logic breaks
- Adding ARIA attributes never breaks it
- You can read the test and immediately know what it checks
- No snapshot file to blindly update

### For the existing screenshot tests

The ones that use `toHaveScreenshot()` are already fragile (fonts, DPI, color changes). If you want to replace them, **targeted text/role assertions** are almost always better than either screenshot or aria-snapshot for functional tests. Keep axe scans for accessibility, keep `toHaveScreenshot` only for genuine visual-regression needs.

**TL;DR**: `toMatchAriaSnapshot` is the right tool for maybe 1–2 structural tests. For everything else, targeted assertions (`toContainText`, `toHaveValue`, `toBeVisible`) give you the same confidence with far less brittleness.

---
I was concerned about a bug causing the logic to break in a way that allowed some lines to be merged. Then, for cases where a snapshot is assumed worthwhile, I wondered if the aria snapshot should be considered a general upgrade as it captures an extra newline.

###### toMatchAriaSnapshot
```js
expect(page.getByLabel('Lyric lines')).toMatchAriaSnapshot();
```
Resulting in:
```yml
- list "Lyric lines":
  - listitem: I wish I could identify that smell
  - listitem: That smell
  - listitem
  - listitem: It disturbs my concentration
  - listitem: And it bothers me to hell
  - listitem: Oh, I wish I could identify that smell
```

###### toMatchSnapshot
```js
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot();
```
Resulting in:
```txt
I wish I could identify that smell
That smell
It disturbs my concentration
And it bothers me to hell
Oh, I wish I could identify that smell
```

---
That's a really good observation. You've identified a real bug in the existing snapshot strategy — `innerText` silently drops blank lines, which means a merge that collapses verse breaks would pass the test undetected. The aria snapshot correctly captures the empty `listitem`, so it would catch that regression.

For cases where you're already committed to snapshot testing, **yes, `toMatchAriaSnapshot` is a genuine upgrade over `innerText().toMatchSnapshot()`** for this specific reason. It's not just "extra newline" — it's that blank lines are semantically meaningful in LRC content, and the aria tree preserves them while `innerText` does not.

The brittleness concern I raised still applies, but it's worth being more precise about when it matters:

| Snapshot type | Drops blank lines? | Breaks on ARIA changes? | Breaks on CSS color changes? |
|---|---|---|---|
| `innerText().toMatchSnapshot()` | **Yes** — real bug | No | No |
| `toMatchAriaSnapshot()` | No — fixed | Yes | No |
| `toHaveScreenshot()` | No | No | **Yes** |

So aria snapshots sit in a useful middle ground — more semantically faithful than `innerText`, less fragile than screenshots. The tradeoff is clear: you gain blank-line fidelity and lose some insulation from ARIA attribute changes.

Given that you just went through a round of ARIA additions and had to fix 28 tests, you've already felt that cost. If you convert to aria snapshots now, future ARIA changes would require snapshot updates again. But those updates are mechanical (re-run with `--update-snapshots`), and the alternative — silently missing a blank-line bug — is worse.

**My revised take**: Convert the merge/import/undo tests that verify lyrical content output to `toMatchAriaSnapshot`. Keep `innerText` snapshots only if you have tests where ARIA structure is irrelevant. And the single dedicated axe-scan test continues to be the right place for pure accessibility verification.

---
Do you think the new ARIA snapshots I added here supersede any of the original smoke landing tests:
```js
test("landing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`Uncaught: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  // Visual snapshot (already exists)
  await expect(page).toHaveScreenshot();
  expect(page.locator("#left-panel")).toMatchAriaSnapshot({
    name: "landing-left-panel",
  });
  // New ARIA snapshots
  expect(page.getByLabel("Main toolbar")).toMatchAriaSnapshot({
    name: "landing-main-toolbar",
  });
  expect(page.getByLabel("Main field header")).toMatchAriaSnapshot({
    name: "landing-main-header",
  });
  // No JS errors on load
  expect(errors).toEqual([]);
  // Layout structure
  await expect(page.locator("#menu-bar")).toBeVisible();
  await expect(page.locator("#left-panel")).toBeVisible();
  await expect(page.locator("#editor-wrapper")).toBeVisible();
  // Controls grid rendered (rebuildHkPanel ran)
  await expect(page.locator("#hk-grid .hk-cell")).toHaveCount(16);
  // File picker exists but is hidden
  await expect(page.locator("#file-picker")).toHaveCSS("display", "none");
});
```

---
Yes — two of them are now redundant:

| Assertion | Superseded? | Why |
|---|---|---|
| `toBeVisible()` on `#menu-bar` | **Yes** | If `landing-main-toolbar` ARIA snapshot passes, the `<nav aria-label="Main toolbar">` exists and is in the accessibility tree, which means it's rendered. A separate visibility check adds nothing. |
| `toHaveCount(16)` on `#hk-grid .hk-cell` | **Yes** | All 16 cells appear as `button` roles inside `landing-left-panel`. If one disappeared, the snapshot would fail. The count is implicitly verified. |
| `toBeVisible()` on `#left-panel` | **Yes** | Same logic — `landing-left-panel` snapshot passing means it's there. |

And three that are **not** superseded:

| Assertion | Why keep it |
|---|---|
| `toEqual([])` on errors | ARIA structure says nothing about JS errors |
| `toHaveScreenshot()` | Visual layout, colors, spacing — not captured by ARIA tree |
| `toHaveCSS("display", "none")` on `#file-picker` | It's `aria-hidden="true"`, so it's invisible to the ARIA tree entirely. The snapshot can't confirm something that doesn't appear in it. |
| `toBeVisible()` on `#editor-wrapper` | Not inside any of your three ARIA snapshot scopes — it's the wrapper between the panel and the field header |

So you could simplify to:

```js
test("landing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`Uncaught: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await expect(page).toHaveScreenshot();

  expect(page.locator("#left-panel")).toMatchAriaSnapshot({
    name: "landing-left-panel",
  });
  expect(page.getByLabel("Main toolbar")).toMatchAriaSnapshot({
    name: "landing-main-toolbar",
  });
  expect(page.getByLabel("Main field header")).toMatchAriaSnapshot({
    name: "landing-main-header",
  });

  expect(errors).toEqual([]);

  await expect(page.locator("#editor-wrapper")).toBeVisible();
  await expect(page.locator("#file-picker")).toHaveCSS("display", "none");
});
```

Three assertions removed, same coverage, less noise.

---
I had originally wanted to simply ARIA snapshot the whole page but couldn't record such an action with Codegen browser

---
You can do it — Codegen just doesn't have a button for it. Write it manually:

```js
await expect(page.locator('body')).toMatchAriaSnapshot({ name: 'landing' });
```

That replaces all three of your scoped snapshots with one. The resulting `.yml` file is bigger but entirely readable — it's the same tree you'd see in the accessibility tab of DevTools.

**Whether you should** depends on whether you want one broad smoke test or a few targeted ones:

| Approach | Pro | Con |
|---|---|---|
| One `body` snapshot | Single assertion, can't miss anything | Any change anywhere breaks it; harder to read the diff |
| Three scoped snapshots | Failure message tells you which region broke | Three files to maintain, could miss something outside the scopes |

For a **landing smoke test** whose job is "does the whole page render correctly," I'd go with the single `body` snapshot. It's the structural equivalent of your `toHaveScreenshot()` — a broad "nothing is obviously broken" check. When it fails, you read the diff, decide if it's intentional, and re-run with `--update-snapshots`.

Save the scoped snapshots for tests that care about a specific region's structure — like verifying the settings dialog shape after opening it, where you don't want the rest of the page polluting the diff.

---
No HTML changes in this turn — analysis only of user's test file changes.

#### Summary of test changes

**files-merge.spec.js**: Replaced `innerText().toMatchSnapshot()` and `inputValue().toMatchSnapshot()` pairs with `toMatchAriaSnapshot()` on `#editor-area` or `getByLabel("Lyric lines")`. Removed `toHaveScreenshot()` from merge-line-mismatch, merge-block-reload, reload-merge-disabled — replaced with targeted `toBeVisible()`/`toBeDisabled()` assertions plus aria snapshots. `merge-no-timestamps` keeps a dual strategy: aria snapshot for rendered output + `innerText` snapshot for exact content. `font` test still uses `toHaveScreenshot()` (visual layout verification).

**import-paste.spec.js**: Replaced `innerText().toMatchSnapshot()` with `toMatchAriaSnapshot()` on `getByLabel("Lyric lines")` for import-plain, import-synced, import-replace, import-corrupted-lyrics. Kept `inputValue().toMatchSnapshot()` alongside for textarea content (metadata, exact timestamps). Paste and save tests unchanged.

**sync-adjust.spec.js**: Replaced `innerText` + `inputValue` snapshot pair in sync-empty with single `toMatchAriaSnapshot()` on `getByLabel("Lyric lines")`.

**settings.spec.js**: Replaced `page.evaluate()` CSS override hack + `toHaveScreenshot()` on settings-body with `toMatchAriaSnapshot()` — much cleaner, no DOM manipulation needed.

**smoke.spec.js**: Added `page.locator("body").toMatchAriaSnapshot({ name: "landing.yml" })` as full-page structural check. Removed redundant `toBeVisible()` on `#menu-bar` and `#left-panel`, and `toHaveCount(16)` on `#hk-grid .hk-cell` — all implicitly verified by the aria snapshot.

**typing-mode.spec.js**: Replaced `controls-gray` test (text-based `toHaveScreenshot()`) with `controls-disabled` test using `toMatchAriaSnapshot()` on `#left-panel`. Aria snapshot shows `[disabled]` state on dimmed controls directly — more robust than screenshot comparison.

**playback.spec.js**: Minor reformatting. Changed focus fix from `#left-panel-header` click to `getByText("[00:00.00]").toBeVisible()` — waits for content load instead of manual focus hack.

#### Aria snapshot limitations discovered

1. **No metadata lines**: `[ti:]`, `[ar:]` etc. are hidden in hotkey mode via `renderMainLines()` filter (`if(hotkeyMode&&(META_RE.test(line)))return`), so they don't appear in the aria tree. Tests that need to verify metadata must use `inputValue().toMatchSnapshot()` on `#main-textarea`.

2. **Regex-obfuscated timestamps**: Timestamps like `[00:03.06]` appear as `/\[\d+:\d+\.\d+\]/` in aria snapshots — Playwright normalizes them to regex patterns. Can't verify exact time values from aria snapshots alone.

3. **Secondary textarea newline loss**: Secondary textarea content appears as a single flat string (e.g. `(line1) (line2) (line3)`) — newlines between lines are not preserved in the aria tree. Blank-line structure in secondary fields can't be verified via aria snapshots.

#### Where aria snapshots are kept alongside text snapshots

- `import-paste.spec.js`: aria snapshot for rendered output + `inputValue()` snapshot for raw textarea content (metadata, timestamps)
- `fields-merge.spec.js` merge-no-timestamps: aria snapshot for blank-line verification + `innerText` snapshot for exact content