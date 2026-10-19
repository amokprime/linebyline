---
model: GLM-5.1
---
Read contents of linebyline.zip for context, starting with INDEX.md (/linebyline parent folder represents repo root). Check for:
- [ ] Playwright or MANUAL.md tests that are
	- [ ] Missing and worth including
	- [ ] Unnecessary
	- [ ] Too simple
	- [ ] Too complex or written inefficiently
- [ ] Inadequate instructions in CONTRIBUTING.md

---
Let me read all the key files in parallel:
Now let me read all the critical files. I'll batch-read the spec files, helpers, MANUAL.md, CONTRIBUTING.md, CHECKLIST.md, and config files:
Now let me read all the Playwright spec files:
Let me also check the remaining files:
Now let me also read the prompt/suggestions file and the media test files to have the full picture:
I've now read every file in the repo. Here is my comprehensive review:

---

## Playwright & MANUAL.md Test Review

### 1. Tests That Are MISSING and Worth Including

#### A. **Save/Export test** — completely absent from Playwright
The CHECKLIST (manual) verifies saving: "`Ctrl+'` hotkey and 💾 button open save file picker", "Saved lyrics contents match Typing mode window contents". The suggestions doc (`1.1-suggestions.md`) even explicitly recommended using `page.waitForEvent('download')`. No spec file tests saving at all. This is a core user workflow.

**Recommendation**: Add a `save.spec.js` (or add cases to `import-paste.spec.js`) that:
- Verifies `Ctrl+'` triggers a download
- Intercepts the download and validates the `.lrc` content matches what's in the textarea
- Verifies the filename matches the `[ti: ]` metadata field

#### B. **localStorage/sessionStorage persistence tests** — only one superficial test exists
`settings.spec.js` has a `persistence` test that only checks theme persistence via a screenshot after reload. The CHECKLIST's "Persistence" section has ~10 items: font changes, default speed, default seek offset, default metadata fields, hotkey clearing, and the `Ctrl+\` reset flow. Only theme persistence is tested. Missing:
- Font type/size persistence across reload
- Speed/seek offset changes persist
- Default metadata fields persist
- `Ctrl+\` reset-all behavior

**Recommendation**: Expand `settings.spec.js` with a proper persistence test that changes multiple settings, reloads, and verifies each persisted.

#### C. **Mark-as-translation tests** — completely absent
The CHECKLIST has an entire section "Mark as translation" testing `( )` checkbox, `↩` checkbox, inline-to-split conversion, and `Ctrl+ArrowLeft`. None of this appears in any spec file. The `translation_split.lrc` and `translation_inline.lrc` media files exist but are unused.

**Recommendation**: Add tests for:
- `( )` checkbox wrapping lines with `Ctrl+ArrowLeft`
- `↩` checkbox converting inline translations on paste
- `↩` checked before import causing batch conversion

#### D. **Navigation skip-empties test** — missing
CHECKLIST says "Navigation skips lines with no lyrics text in Hotkey mode". No test verifies `Q`/`E` skips blank lines.

#### E. **Non-navigation hotkey repeat suppression test** — missing
CHECKLIST says "Non-navigation hotkeys and buttons don't spam when held". The browser-hotkey-system SKILL documents an `e.repeat` guard, but no test verifies it works.

#### F. **Instant Replay — "Resuming currently playing line"** — tested by settings checkbox but not by the actual replay behavior
`sync-adjust.spec.js` tests "Moving to next line" and "Adjusting timestamp" replay triggers, but doesn't test "Resuming currently playing line" or "Playing another line" replay triggers. The MANUAL.md also mentions these.

#### G. **Intervals tests** — missing
The CHECKLIST has extensive interval testing (Tiny 100ms→200ms, etc., Seek increment changes, Speed ratio changes, Volume increment changes, Undo window changes). No Playwright test verifies any interval setting change affects the main window controls.

#### H. **Metadata field editing in Typing mode** — partially tested but thin
`typing-mode.spec.js` tests `artist-update-typing` (deleting one character from `[ar:]`), but doesn't test:
- Typing in `[ti:]`, `[al:]`, `[re:]` fields updates the corresponding Now Playing info
- Title extraction from filename prioritization (audio first vs. lyrics first)

#### I. **Empty/error state tests** — almost entirely missing
The suggestions doc explicitly recommended testing:
- No audio loaded — do playback controls gracefully no-op?
- Corrupt .lrc file — malformed timestamps, missing brackets
- Concurrent rapid actions

The `sync-empty` test in `sync-adjust.spec.js` is a good start but isolated. There's no test for what happens when you press play with no audio, or import a malformed file.

---

### 2. Tests That Are UNNECESSARY

#### A. **`test-files.js` is dead code**
`tests/helpers/test-files.js` defines a `FILES` object and `loadFiles()` function, but:
- The `FILES` object references paths that don't exist (`'media/I Wish I Could Identify That Smell.lrc'`, `'media/spanish.lrc'`)
- The `loadFiles()` function body is just a comment: `// Use page.locator('#file-picker').setInputFiles(...)`
- No spec file imports or uses it

**Recommendation**: Either delete it or finish implementing it. Currently it's misleading cruft.

#### B. **Duplicate file-import boilerplate across spec files**
Every spec file that needs test data repeats the same 3-4 line `setInputFiles` + `waitForEvent('filechooser')` pattern. The `test-files.js` helper was clearly intended to eliminate this but was never completed. This isn't "unnecessary" per se, but the *duplication* is unnecessary.

#### C. **`import-audio-update` test in `playback.spec.js`** — questionable value
This test presses play/seek/speed keys *before* importing audio, then imports audio and checks the display. It's testing a bizarre edge case (manipulating playback state on an empty app before loading files). The CHECKLIST never mentions this scenario and the test doesn't map to any user workflow.

---

### 3. Tests That Are TOO SIMPLE

#### A. **`accessibility.spec.js` — single axe scan on empty page**
The axe scan runs on the initial landing page with no content loaded. This misses:
- Accessibility violations that only appear with lyrics loaded (dynamic content)
- Settings dialog a11y (focus trap, `aria-modal`, labeled regions)
- Secondary field a11y
- Error dialogs a11y

**Recommendation**: Add at least 2 more scans:
1. After loading synced lyrics + secondary field
2. With Settings overlay open

#### B. **`smoke.spec.js` — minimal landing test**
The `landing` test just does `toHaveScreenshot()` on the initial page. It doesn't verify:
- Console errors on load (`page.on('pageerror', ...)`)
- All expected UI elements are present (controls panel, buttons, etc.)
- The file picker input exists and is hidden

The `button-tint` and `button-feedback` tests only check the Play button. They should verify at least one more button to confirm the pattern works generally.

#### C. **`control-time` and `control-seek` in `sync-adjust.spec.js`** — just visibility checks
These tests only verify text labels are *visible* on the page. They don't verify the labels match the correct interval values, or that the buttons actually trigger adjustments when clicked.

#### D. **`persistence` test in `settings.spec.js`** — just a screenshot
As noted above, this only checks theme persistence via screenshot comparison. It doesn't programmatically verify any specific settings values survived the reload.

---

### 4. Tests That Are TOO COMPLEX or WRITTEN INEFFICIENTLY

#### A. **`naughty-strings` test in `import-paste.spec.js`** — extremely slow and fragile
This test iterates through the entire Big List of Naughty Strings (hundreds of items), pasting each one individually with a 120-second timeout. Problems:
- It's testing the *browser's* ability to handle weird strings in clipboard/textarea, not LineByLine's logic
- Each iteration requires clipboard write → paste → visibility check, taking ~1-2 seconds per string
- The visibility check (`toBeVisible()`) is nearly meaningless — it just checks the container div exists
- If any one string crashes the app, you get no useful diagnostic about *which* string

**Recommendation**: Either:
1. Reduce to a curated subset of ~10 strings that are most likely to trigger LRC parsing bugs (Unicode, zero-width chars, extremely long strings, HTML-like content)
2. Or at minimum, add the current string index to error messages so failures are diagnosable

#### B. **`merge-no-trailing` test in `fields-merge.spec.js`** — overly fragile keystroke sequence
This test deletes the trailing end timestamp through an elaborate sequence: click header → toggle typing mode → `Ctrl+End` → `Shift` + 10× `ArrowLeft` → `Backspace` → release `Shift`. This is:
- Brittle: any change to the LRC content length breaks the arrow-key count
- Hard to understand: the intent is "delete the final end timestamp" but it's encoded as 10 arrow-left presses
- A more robust approach: use `page.locator('#main-textarea').evaluate()` to directly manipulate the textarea value, then trigger an `input` event

#### C. **`tab-settings` test in `keyboard-nav.spec.js`** — magic Tab counts
The test uses `for (let i = 0; i < 7; i++) await page.keyboard.press('Tab')` and similar hardcoded Tab counts. If any element is added/removed/reordered in Settings, these numbers silently break. A more robust approach:
- Tab until the target element is focused (`page.locator('#target').waitFor({ state: 'focused' })`)
- Or use `page.locator('#target').focus()` for the initial positioning, then verify Tab advances correctly from there

#### D. **Repeated `setInputFiles` + `waitForEvent('filechooser')` pattern for secondary fields**
The `fields-merge.spec.js` file repeats this 4-line pattern for every secondary field import:
```js
const [fileChooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.getByRole('button', { name: '📂' }).nth(1).click(),
]);
await fileChooser.setFiles([media('plain_french.lrc')]);
```

**Recommendation**: Extract a helper function:
```js
async function importToSecondary(page, media, buttonIndex, filename) {
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(buttonIndex).click(),
  ]);
  await fc.setFiles([media(filename)]);
}
```

#### E. **`undo-redo.spec.js` — snapshot-heavy approach**
The `import-main` test takes 8 snapshots (before/after × lines/textarea × undo/redo). The same test structure is repeated for `paste-main` (another 8) and `merge` (another 8). That's 24 snapshots for 3 tests. Consider:
- Using `toMatchSnapshot` with named snapshots more selectively
- For undo verification, checking that the *diff* between before and after is correct rather than snapshotting both representations
- The `lines()` and `lyrics()` helper functions at the top of each test are good but could be shared

#### F. **`toggle-scroll` test in `typing-mode.spec.js`** — uses `page.evaluate()` to bypass the UI
This test directly sets `ta.value = t` and dispatches an `input` event, then toggles mode and snapshots. This bypasses the actual import/paste pathway entirely. While it's valid for testing mode-toggle scroll position with a large file, it's fragile because:
- It depends on internal DOM structure (`main-textarea` ID, `input` event name)
- It doesn't test the actual user workflow (importing/pasting a large file)
- The `nmbr0001`-style content is synthetic and doesn't test real LRC handling

---

### 5. MANUAL.md Review

#### Well-done aspects:
- Correctly identifies what can't be automated (audio quality, native file picker, browser-level close events)
- The "Undo debounce" section is appropriately manual since timing thresholds are subjective
- The "Unsaved work warning" section correctly identifies browser-chrome events that Playwright can't test

#### Issues:

**A. Missing manual tests from CHECKLIST that should be in MANUAL.md:**
- "Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode" — this is subjective but listed only in CHECKLIST, not MANUAL.md
- Instant Replay "feel" for each trigger (MANUAL.md only lists "Check all the Instant Replay options" but doesn't replicate the specific triggers from CHECKLIST)

**B. The "Playback" section in MANUAL.md duplicates what's already in Playwright:**
- "Stops when paused", "Resumes when resumed", "Mutes when muted", "Plays when unmuted" — `playback.spec.js` already tests play/pause and mute toggling. The manual test should focus only on the *auditory* aspect ("Sounds normal", "Sounds quieter or louder"), not the state transitions.

**C. Missing: file picker multi-select**
- CHECKLIST says "Select test files 2 and 3 at the same time and verify opening both together works". MANUAL.md has "Select test files 2 and 3 at the same time" but it's under "File picker window" which is about the visual appearance of the picker. The functional test of multi-file import should be automated (and `import-paste.spec.js`'s `import-plain` already does this!).

**D. Undo debounce tests should be more specific:**
- "Typing 'abc' very quickly inline gets undone and redone in one step each" — what counts as "very quickly"? Since this is manual, specify the timing (e.g., "type each letter within 100ms of the previous" vs "wait 300ms between each").

---

### 6. CONTRIBUTING.md Review

#### Issues:

**A. No mention of Playwright test commands or workflow**
CONTRIBUTING.md says "every version gets Playwright tests" but doesn't tell a contributor how to:
- Install dependencies (`npm install`)
- Run the tests (`npx playwright test`)
- Run a single test file
- Generate snapshots (first-time contributors need `--update-snapshots`)
- What to do when snapshots fail (update them? file a bug?)

The setup instructions exist in `PLAYWRIGHT_SETUP.md` (bash aliases, fnm, etc.) but CONTRIBUTING.md doesn't link to it. A contributor would have to discover it independently.

**B. No description of the test architecture**
A contributor needs to understand:
- The `@linebyline/test-helpers` custom fixture (auto-navigates to latest version, provides `media`/`readMedia`)
- Why `findLatestVersion()` exists and how the archive directory structure works
- The snapshot pattern (`.txt` snapshots for text content, `.png` screenshots for visuals)
- That snapshots are browser-specific (`-firefox-win32`, `-chromium-win32`)

**C. Links to deprecated content**
- "Starting with PR version 0.35.14, every version gets partial tests suggested by Claude from the checklist" — this is in the "Deprecated" section but still references CHECKLIST.md as the primary test source
- The link to CHECKLIST.md in the non-deprecated section should point to the Playwright tests instead
- The Obsidian Share Note link for "what's planned" is an external dependency that may break

**D. No contribution guidelines for test changes**
If a contributor changes app behavior, they need to know:
- How to update snapshots
- Whether to add new spec files or extend existing ones
- The naming convention for test files
- That `test-files.js` exists (even though it's currently dead code)

**E. No PR/review process for test results**
CONTRIBUTING.md mentions semantic versioning for the `.html` file but doesn't require test results with PRs. It should state whether contributors need to:
- Run the full Playwright suite before submitting
- Include updated snapshots
- Run MANUAL.md tests

**F. The vibe-coding workflow is too specific to the owner**
Steps 1-6 in CONTRIBUTING.md describe the owner's claude.ai + Obsidian workflow. This isn't a contribution guide for *others* — it's the owner's personal process. A genuine contributor using a different AI tool or no AI at all would find steps like "Add latest claude_instructions" and "Delete project files that Claude duplicated as Artifacts" confusing and irrelevant.

**G. Missing: how to report bugs found by tests**
No guidance on whether to file GitHub Issues, what information to include, or how to differentiate between test bugs and app bugs.

---

### Summary Table

| Category                    | Finding                                                                | Severity |
| --------------------------- | ---------------------------------------------------------------------- | -------- |
| **Missing Playwright test** | Save/export workflow (`Ctrl+'`, download verification)                 | High     |
| **Missing Playwright test** | Mark-as-translation (`( )`, `↩`, `Ctrl+ArrowLeft`)                     | High     |
| **Missing Playwright test** | localStorage persistence (font, speed, metadata, hotkeys)              | High     |
| **CONTRIBUTING.md**         | No Playwright install/run/update-snapshots instructions                | High     |
| **CONTRIBUTING.md**         | No test architecture documentation                                     | High     |
| **Unnecessary**             | `test-files.js` — dead code with wrong paths                           | Low      |
| **Unnecessary**             | `import-audio-update` — tests no real user workflow                    | Low      |
| **Too simple**              | `smoke.spec.js` — no console error check, one button tested            | Low      |
| **Too simple**              | `control-time`/`control-seek` — just visibility, no value verification | Low      |
| **Too complex**             | Repeated secondary-file-import boilerplate across tests                | Low      |
| **MANUAL.md**               | Missing subjective tests from CHECKLIST (scroll position on toggle)    | Low      |
| **MANUAL.md**               | Duplicates automated state-transition tests                            | Low      |
| **CONTRIBUTING.md**         | No bug reporting guidance                                              | Low      |
| **Missing Playwright test** | Interval settings affecting controls                                   | Medium   |
| **Missing Playwright test** | Navigation skip empty lines                                            | Medium   |
| **Missing Playwright test** | Hotkey repeat suppression                                              | Medium   |
| **Missing Playwright test** | Error/empty states (no audio, malformed LRC)                           | Medium   |
| **Missing Playwright test** | a11y scan with content loaded & Settings open                          | Medium   |
| **Too simple**              | `accessibility.spec.js` — only scans empty page                        | Medium   |
| **Too simple**              | `persistence` — screenshot only, no programmatic value checks          | Medium   |
| **Too complex**             | `naughty-strings` — hundreds of iterations, poor diagnostics           | Medium   |
| **Too complex**             | `merge-no-trailing` — fragile keystroke count for deletion             | Medium   |
| **Too complex**             | `tab-settings` — hardcoded Tab counts that silently break              | Medium   |
| **CONTRIBUTING.md**         | Links to deprecated CHECKLIST instead of Playwright tests              | Medium   |
| **CONTRIBUTING.md**         | Vibe-coding workflow is owner-specific, not contributor-facing         | Medium   |
| **CONTRIBUTING.md**         | No PR test-result requirements                                         | Medium   |
The review is complete. The three biggest gaps to address are:

1. **Missing Playwright tests for Save/Export, Mark-as-Translation, and full Persistence** — these are core user workflows with test media already present but unused.
2. **CONTRIBUTING.md doesn't tell contributors how to actually run the tests** — no install steps, no run commands, no snapshot update guidance, no link to `PLAYWRIGHT_SETUP.md`.
3. **Several tests are brittle** — hardcoded Tab counts, arrow-key-based deletion, and the unbounded naughty-strings loop will cause maintenance headaches on any UI change.

Let me know if you'd like me to generate specific test code for any of the missing cases, or draft an improved CONTRIBUTING.md.

---
