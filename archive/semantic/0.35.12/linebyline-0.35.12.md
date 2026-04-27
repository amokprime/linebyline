# LineByLine 0.35.12

## Turn 1

### Prompt

Patch:
- Genius paste appends rather than overwriting existing lyrics in Hotkey mode
- When Sync file is undone, the Seek offset field does not revert to its previous value but stays at 0
- Batch converting a whole song does not work when import is done with checked - only the Ctrl+ArrowLeft method works

---

Three bugs fixed:

**Bug 1 — Genius paste overwrites in Hotkey mode**
The `main-lines` paste handler had a separate append path for Genius pastes. Changed it to follow the same overwrite logic as non-Genius pastes: preserve the existing meta block, replace all lyric content.

**Bug 2 — Undo restores seek offset**
`takeSnapshot` now includes `seekOffset` in the snapshot object. `applySnapshot` reads it back and updates both `cfg.seek_offset` and the `#seek-offset` input. `doSyncFile` already called `setMainText` which calls `pushSnapshot` before and after, so the pre-sync offset is captured and restored on undo.

**Bug 3 — batchSplitParens assigns timestamps on import**
`batchSplitParens` previously only split lines structurally with no timestamps on inserted groups. Added a second pass: after splitting, any run of un-timestamped non-meta lines that immediately follows a timestamped line gets interpolated timestamps toward the next timestamped line (same offset-10ms-per-group logic used by `markAsTranslation`). This makes import with checked produce the same result as the Ctrl+ArrowLeft workflow.

---

## Turn 2

### Prompt

Same version. Bugs:
- When Sync file is undone, the Seek offset field still does not revert. Revert the snapshot approach and instead just don't reset the Seek offset field after syncing.

Refinements:
- Audit for excessively long lines of code that could be shortened

---

**Bug fix — Seek offset not reset by doSyncFile**
Reverted the `takeSnapshot`/`applySnapshot` seekOffset approach (the snapshot was taken after the reset, so it never captured the pre-sync value). Instead, `doSyncFile` simply no longer resets the seek offset field or `cfg.seek_offset` at all. The offset value persists after syncing; the user can clear it manually if desired.

**Long-line audit**
Five lines over 200 chars shortened without any behaviour change:
- `msToTs`: extracted a `p()` pad helper to reduce template literal repetition
- `parenLabel` creation in `addSecondary`: split across two lines
- `addLrcBtn` creation in `addSecondary`: split across two lines
- Settings Tab focus trap `focusable` query: split the `.filter()` to a second line
- `font-size-inp` keydown handler: moved body to its own line

---

## Turn 3

### Prompt

Same version. Audit for repetitive code that could be condensed without breaking current functionality or blocking future extensibility.

---

Six helpers extracted, eliminating ~15 duplicate code blocks:

**`suppressAuto()`** — replaced 7 inline triplets of `suppressAutoLine=true; clearTimeout(arrowNavTimer); arrowNavTimer=setTimeout(...)` in `seekPrevLine`, `seekNextLine`, `syncLine`, `markAsTranslation` (×2), `renderMainLines` mousedown (×2), and the global KD arrow handler.

**`collapseBlanks(lines)`** — replaced 3 identical blank-dedup loops in `cleanGenius`, and both handlers in `addSecondary` (paste and file-load).

**`findLastMetaIdx(lines)`** — replaced 3 inline `let lastMetaIdx=-1; for(...)` loops in `mergeLrcMeta`, the hotkey-mode non-Genius paste handler, and the hotkey-mode Genius paste handler.

**`lrcHasTi(raw)`** — replaced 2 identical inline `.some(l=>l.match(/^\[ti:.../)...)` expressions in the lrcOnly and audio+lrc branches of the file-picker handler.

**`doSeek(dir)`** — merged `doSeekBack` and `doSeekFwd` into a single directional helper; both wrapper functions preserved for call-site compatibility. Also used in the progress bar wheel handler which had inlined the same arithmetic.

**`suppressAuto` definition location** — placed in the Helpers section alongside the other navigation utilities, keeping the State section clean.

---

## Turn 4

### Prompt

Same version. Genius extraction is completely broken again (both paste and import).

---

`cleanGenius` was calling `collapseBlanks(result)` but `result` no longer existed after the Turn 3 refactor — the variable holding the filtered lyric lines is `lyricLines`. Fixed to `collapseBlanks(lyricLines)`.

---

## Turn 5

### Prompt

Any other stale variables or references after the refactor? Also update the companion file for the line 884 fix and anything changed this turn.

---

Full audit of all refactored identifiers (`lastMetaIdx`, `lrcHasTi`, `suppressAutoLine`, `arrowNavTimer`, `blanks`, `collapsed`, `result`) found no further stale references. All remaining usages are either the helper definitions themselves or legitimate locals in unrelated functions.

---
