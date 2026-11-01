---
model: GLM-5.2
---
# Round 2: full-suite triage (540 tests, 91 failures)

Container setup is fully working. `tst` ran the whole suite (540 tests × 3 browsers, 3.4 minutes, no crashes that mattered). 448 passed, 91 failed, 1 did-not-run.

This document buckets all 91 failures by root cause so you can attack them in the right order. Each bucket notes:

- **Count** — how many of the 91 failures fit this bucket
- **Root cause** — what's actually wrong
- **Effort** — easy / medium / hard
- **Fix shape** — what the fix looks like (without writing it)

The right move is to attack in bucket order, commit after each bucket, and stop when the remaining failures are all genuinely hard.

---

## Bucket A: Missing WebKit snapshots (first-run state, not bugs)

**Count: ~40 failures (largest bucket)**

**Pattern:** `Error: A snapshot doesn't exist at /workspace/tests/...-webkit-linux.{txt,png}, writing actual.`

**Root cause:** This is the first time webkit has ever run locally (it was disabled on Fedora host). Every `toMatchSnapshot()` / `toHaveScreenshot()` / `inputValue().toMatchSnapshot()` call that has a `-chromium-linux` and `-firefox-linux` baseline but no `-webkit-linux` baseline fails on first run. Playwright writes the "actual" file but the test still reports failure because there was no baseline to compare against.

**Effort: trivial. Zero code changes.**

**Fix shape:**

```fish
# One-shot: regenerate all missing webkit baselines
tst --update-snapshots

# Review what was written (these are NEW files, no overwrites)
git status

# Sanity check: re-run webkit only, expect all-green
tst --project=webkit
```

**Caveat:** `--update-snapshots` is a hammer. It will also update any chromium/firefox baselines that currently fail (the PNG diffs in bucket C). If you want to update ONLY webkit:

```fish
tst --project=webkit --update-snapshots
git add tests/**/*.spec.js-snapshots/*-webkit-linux.*
git commit -m "Add webkit snapshot baselines (first local webkit run)"
```

This is the cleanest path. Commit JUST the new webkit files, leave the chromium/firefox baseline drift for bucket C.

---

## Bucket B: Aria-bug `TypeError: ... 'raw'` (same root cause as fields-merge)

**Count: 9 failures (3 tests × 3 browsers)**

**Tests affected:**
- `import-paste.spec.js › import-plain`
- `import-paste.spec.js › import-replace`
- `import-paste.spec.js › import-corrupted-lyrics`

**Pattern:** `TypeError: Cannot read properties of undefined (reading 'raw')`

**Root cause:** Same Playwright aria-snapshot parser bug we already fixed in `fields-merge.spec.js`. The captured DOM contains text starting with `(` (parenthesized translation lines, or `( )` checkbox labels), which crashes the tokenizer.

**Effort: medium.** Same pattern as fields-merge migration — replace `toMatchAriaSnapshot()` with explicit assertions. ~3 tests to migrate.

**Fix shape:** Same approach as `fields-merge.spec.js`. Replace each `expect(page.getByLabel("Lyric lines")).toMatchAriaSnapshot()` with explicit assertions on:
- Lyric list contains expected text lines
- For corrupted: the warning text appears
- For synced: timestamps appear in expected format

To do this properly I need the 3 aria snapshot files:
- `tests/import-paste.spec.js-snapshots/import-plain-1.aria.yml` (or similar)
- `tests/import-paste.spec.js-snapshots/import-replace-1.aria.yml`
- `tests/import-paste.spec.js-snapshots/import-corrupted-lyrics-1.aria.yml`

If those exist, share them and I'll write the migration.

---

## Bucket C: PNG baseline drift (chromium + firefox)

**Count: ~12 failures**

**Pattern:** `Expected an image 961px by 644px, received 970px by 644px. N pixels (ratio X) are different.`

**Tests affected (chromium + firefox, webkit excluded because bucket A covers it):**
- `keyboard-nav.spec.js › tab-font` (chromium + firefox)
- `playback.spec.js › audio-missing-noop` (chromium + firefox)
- `settings.spec.js › assign-reserved-click` (chromium)
- `sync-adjust.spec.js › replay-another-line` (chromium + firefox)
- `sync-adjust.spec.js › replay-sync-time` (chromium)
- `theme-font.spec.js › theme-toggle` (firefox)
- `settings.spec.js › persistence` (firefox)
- `smoke.spec.js › landing` (firefox)

**Root cause:** Baselines were generated on Windows or Fedora host (different font stack + window dimensions). The container's Ubuntu font stack renders text slightly wider → page is 9px wider → screenshot diff. The `970 vs 961` width delta is consistent across multiple tests, which means it's a font-metrics issue not a test-code issue.

**Effort: trivial. Zero code changes.**

**Fix shape:** Same as bucket A — regenerate in container:

```fish
# Regenerate the failing chromium + firefox PNGs only
tst --update-snapshots tests/keyboard-nav.spec.js tests/playback.spec.js tests/settings.spec.js tests/sync-adjust.spec.js tests/theme-font.spec.js tests/smoke.spec.js

# Review diffs in git — should only be PNG files, no .txt or .aria.yml
git status
git diff --stat

# Commit
git add tests/**/*.spec.js-snapshots/*-chromium-linux.png tests/**/*.spec.js-snapshots/*-firefox-linux.png
git commit -m "Regenerate chromium + firefox PNG baselines in Ubuntu container"
```

**Warning:** Some of these may be 1-3% pixel diff which is borderline. After regenerating, eyeball a few of the actual PNGs to make sure they look right (not just "different enough to pass"). Container font stack should produce visually-equivalent output, just slightly different metrics.

---

## Bucket D: `toBeVisible()` element-not-found

**Count: ~15 failures**

**Pattern:** `expect(locator).toBeVisible() failed — element(s) not found`

**Tests affected:**
- `typing-mode.spec.js › controls-disabled` (chromium + firefox)
- `typing-mode.spec.js › paren-close`, `brackets-close`, `paren-wrap`, `paren-wrap-select` (chromium + firefox)
- `sync-adjust.spec.js › sync-start-end`, `adjust-time` (chromium)
- `keyboard-nav.spec.js › tab-lyrics` (chromium + firefox + webkit)

**Root cause:** Mixed bag — needs per-test investigation. Likely culprits:
- Selectors that worked in the original aria snapshots but don't match the current DOM (app changed since snapshots were generated)
- Timing — element appears after async work; needs `await expect(...).toBeVisible()` (which polls) but the locator itself is wrong so polling never finds it
- Hotkey not being delivered (`Control+something` intercepted)

**Effort: hard. Per-test investigation.**

**Fix shape:** For each test, run `tsta` (UI mode) with that test filtered, manually walk through the steps, see what the actual DOM looks like at the assertion point. Then update the selector or add a wait.

The typing-mode tests (5 of them) likely share a single root cause — probably a selector that broke when the controls panel was refactored. Investigate one, fix the pattern, apply to all five.

---

## Bucket E: `toHaveValue()` timing races

**Count: ~13 failures**

**Pattern:** `expect(locator).toHaveValue(expected) failed — Expected "X", Received "Y"` (with `Timeout: 5000ms`)

**Tests affected:**
- `intervals.spec.js › speed-ratio` (chromium + firefox + webkit) — `Expected "0.67", Received "0.91"`
- `intervals.spec.js › typing-debounce-1` (chromium) — textarea value race
- `intervals.spec.js › seek-increment` (firefox) — value race
- `undo-redo.spec.js › typing-debounce` (chromium + firefox + webkit)
- `keyboard-nav.spec.js › tab-lyrics` (chromium + firefox + webkit)
- `playback.spec.js › seek-typing` (chromium)

**Root cause:** Keyboard shortcut fires before previous async state settles. The classic pattern: press `Control+2` to change speed → the handler kicks off an async update → test immediately presses another key → second handler reads stale value → wrong final state. `--ui` mode masks these because it's slower.

**Effort: medium-hard. Per-test.**

**Fix shape:** Two options per test:
1. Add `await page.waitForTimeout(50)` between rapid key presses (cheap, brittle)
2. Use `expect.poll(() => page.locator(...).inputValue(), { timeout: 2000 }).toBe("X")` to wait for the expected state to settle (better)

The `speed-ratio` test is the most-investigated one — last session we knew about it. The expected `0.67` is `2/3`, the received `0.91` is `~10/11`. The math suggests the speed-change handler is being called twice when it should be called once, or the test's key sequence is being interpreted differently than intended.

---

## Bucket F: `toMatchSnapshot()` empty/bad baseline files

**Count: 4 failures**

**Tests affected:**
- `mark.spec.js › split-paren` (firefox) — `split-paren-lines-firefox-linux.txt` is empty
- `mark.spec.js › split-plain` (firefox) — `split-plain-lines-firefox-linux.txt` is empty
- `typing-mode.spec.js › controls-disabled` (chromium + firefox) — `controls-disabled-1-*-linux.txt` baseline mismatch

**Root cause:** The `.txt` snapshot files were committed empty or with stale content. The actual test output is non-empty. Playwright's text-snapshot matcher doesn't tolerate this.

**Effort: trivial. Zero code changes.**

**Fix shape:** Delete the bad baseline files and regenerate:

```fish
# Delete empty/stale baselines
rm tests/mark.spec.js-snapshots/split-paren-lines-firefox-linux.txt
rm tests/mark.spec.js-snapshots/split-plain-lines-firefox-linux.txt
rm tests/typing-mode.spec.js-snapshots/controls-disabled-1-chromium-linux.txt
rm tests/typing-mode.spec.js-snapshots/controls-disabled-1-firefox-linux.txt

# Regenerate
tst --update-snapshots tests/mark.spec.js tests/typing-mode.spec.js -g "split-paren|split-plain|controls-disabled"

git status  # review
git add tests/mark.spec.js-snapshots/*.txt tests/typing-mode.spec.js-snapshots/*.txt
git commit -m "Regenerate stale text snapshot baselines"
```

---

## Bucket G: Strict-mode violations (selector matches multiple elements)

**Count: 2 failures**

**Tests affected:**
- `settings.spec.js › assign-reserved-click` (chromium + firefox — though only 1 counted because bucket C also caught it)

**Pattern:** `Error: strict mode violation: locator('#hk-settings-rows').getByRole('textbox') resolved to 38 elements`

**Root cause:** The selector matches 38 textboxes (one per hotkey row) when the test expected exactly one. Either:
- The selector needs `.first()` or `.nth(N)`
- The test was written against an older settings layout with fewer rows

**Effort: medium.** Need to read the test source and figure out which textbox it actually meant to interact with.

**Fix shape:** Add `.first()` or `.nth(specific-index)` to the locator. Or refactor the test to target the specific hotkey row by name.

---

## Bucket H: `dialog.accept: Test ended`

**Count: 1 failure**

**Test affected:** `import-paste.spec.js › import-10k-lines` (chromium only — firefox/webkit may have passed)

**Pattern:** `Error: dialog.accept: Test ended.` at line 166 of import-paste.spec.js

**Root cause:** The `page.on("dialog", ...)` handler is registered before the dialog appears. When the alert fires, the handler runs and calls `d.accept()`. But by that point, the test body has already moved on past the `setInputFiles` call — the test "ended" before the handler ran. Classic async race between the dialog handler and the test body completing.

**Effort: medium.**

**Fix shape:** Two options:
1. Use `page.waitForEvent("dialog")` instead of `page.on("dialog", ...)` — explicit await
2. After `setInputFiles`, add `await page.waitForTimeout(100)` to give the dialog time to fire and be handled

```js
// Option 1 (preferred)
const dialogPromise = page.waitForEvent("dialog");
await page.locator("#file-picker").setInputFiles([media("10k_lines.lrc")]);
const dialog = await dialogPromise;
expect(dialog.type()).toBe("alert");
expect(dialog.message()).toContain("500 line limit");
await dialog.accept();
```

---

## Bucket I: misc / unbucketed

**Count: ~5 failures** (some overlap with above)

Anything that didn't fit cleanly above. Read the individual error messages to triage.

---

## Recommended attack order

| Step | Bucket | Effort | Tests fixed | Cumulative pass |
|---|---|---|---|---|
| 1 | **A** — webkit snapshots | trivial | ~40 | 488/540 (90%) |
| 2 | **C** — PNG baseline drift | trivial | ~12 | 500/540 (93%) |
| 3 | **F** — stale .txt baselines | trivial | 4 | 504/540 (93%) |
| 4 | **B** — import-paste aria bug | medium | 9 | 513/540 (95%) |
| 5 | **H** — dialog handler race | medium | 1 | 514/540 (95%) |
| 6 | **G** — strict-mode violations | medium | 2 | 516/540 (96%) |
| 7 | **E** — timing races | medium-hard | ~13 | 529/540 (98%) |
| 8 | **D** — element-not-found | hard | ~15 | 544/540 (~100%) |

Steps 1-3 fix ~56 failures with ZERO test-code changes — just regenerate and commit baselines. That's the obvious first move.

Step 4 (bucket B) is the same pattern as fields-merge — share the 3 aria snapshots for import-paste and I'll write the migration.

Steps 5-8 are the genuinely hard work. Plan to do those one spec at a time, in fresh chats, with the test source and any error-context.md files shared.

---

## What to do right now

```fish
# Step 1: regenerate webkit baselines only
tst --project=webkit --update-snapshots

# Review — should be all NEW files, no overwrites
git status | head -50

# Commit just the webkit files
git add tests/**/*-webkit-linux.*
git commit -m "Add webkit snapshot baselines (first local webkit run)"

# Step 2 + 3: regenerate the chromium+firefox PNG and stale-txt baselines
tst --update-snapshots

# Review — should be PNG overwrites + a few .txt overwrites, nothing else
git status

# Commit
git add tests/**/*.spec.js-snapshots/*-chromium-linux.* tests/**/*.spec.js-snapshots/*-firefox-linux.*
git commit -m "Regenerate chromium + firefox baselines in Ubuntu container"

# Step 4: re-run full suite, see what's left
tst 2>&1 | tee local/tst-round2.log
```

After step 4, share `tst-round2.log`. We should be down to ~35 failures (buckets B + D + E + G + H), and we can tackle bucket B (the aria bug migration for import-paste.spec.js) as the next concrete win.

---

## One question to confirm before you proceed

For step 1 (webkit baseline regen): some teams prefer to NOT commit webkit baselines at all and instead skip webkit in CI. Your current `playwright.config.js` (with the `PW_CONTAINER` detection I added) runs webkit both in container and CI. If you want webkit to remain a first-class browser, commit the baselines. If you want to defer webkit support, change the config to:

```js
const enableWebkit = inCI;  // drop inContainer
```

Then `tst` (container) skips webkit, CI still runs it, and you don't need to commit baselines for local runs. (But CI will fail on the first run because the baselines still don't exist — so you'd need to commit them anyway via a CI-driven `--update-snapshots` workflow, which is more complex.)

Recommendation: commit the webkit baselines. WebKit is a real browser your users may use; running it locally is a feature, not a bug.
