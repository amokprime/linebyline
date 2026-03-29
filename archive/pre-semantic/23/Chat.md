###### Bugs
Cursor is positioned one line too high on startup (in the newline that's supposed to be reserved between metadata tags and lyrics)
Undo doesn't trigger the first time Ctrl+Z or button are used
Undo doesn't work for the last character of lyrics
Example:
```
#type one letter at a time
abcde #e is undone after two undoes, a is never undone
```

Undo also needs double trigger for pasted text:
```
#paste one word at a time
needsdoubletrigger #each word needs two undoes to actually undo
```
###### Refinements
Change Ctrl+M Open shortcut back to Ctrl+O since it can't be removed anyway and its hotkey field font looks normal unlike Middle click; remember to update Open button tooltip
___
LineByLine v22 Handoff

- File: `linebyline_22.html` — single self-contained HTML/CSS/JS, no dependencies
- Storage: `localStorage` for config/theme/font; `sessionStorage` for autosave (cleared on page load for fresh start); `sessionStorage` also persists secondary field pool content across accidental navigation
- Key state: `hotkeyMode`, `offsetSeekMode`, `playing`, `audioEl`, `masterVolume`, `masterMuted`, `currentSpeed`, `secondaryCols[]` (visible), `secondaryPool[]` (all ever-created, never removed from DOM), `undoStack[]`/`redoStack[]` of `{main, secondaries[], mergeDone}` snapshots, `activeLine`, `selectedLines`, `lastImportStem`, `mergeDone`
- Undo: Full snapshot stack — every keystroke, paste, merge, hotkey edit is a separate entry. Add/remove field is outside the undo stack (fields are hidden/shown, content persists in pool)
- Volume: `masterVolume`/`masterMuted` are the source of truth; `applyVolume()` syncs slider + `audioEl`. `audioEl.volume` wrapped in try/catch due to browser autoplay policy
- Known issues: Ctrl+O triggers browser native file dialog regardless of JS; global volume hotkeys require prior user interaction with a page element
___
I'll work through the steps:

1. **Size check**: The file is ~47KB — well under 30MB. ✓
2. **Confidence check**: The undo bugs and cursor positioning are well-defined. The Ctrl+O change is straightforward. No hurdles. ✓
3. **No UI changes** — this is all logic/bug fixes, so no mockup needed. Proceeding to build.The document content is already in context, so I'll work directly from it. Let me analyze the three bugs carefully:

**Bug 1 — Cursor positioned one line too high on startup**: `loadAutosave` calls `_setTA(cfg.default_meta)` which ends with `\n`. Then `applyMode()` → typing mode logic tries to find the first non-meta line. The meta block is `[ti:...]\n[ar:...]\n[al:...]\n[re:...]\n[by:...]\n` — six lines ending with a trailing `\n`, making an empty string as the last "line". The blank line separator between meta and lyrics doesn't exist yet on fresh start, so `firstLyricChar` lands on the empty string after the last meta tag. Fix: ensure the default text has the blank separator, and the cursor-find logic skips blank lines too.

**Bug 2 — Undo doesn't trigger first time**: `pushSnapshot()` is called on `input` event only if `top.main !== getTA()`. But the very first keystroke: `undoStack` is empty after `loadAutosave` (which never calls `pushSnapshot`), so `top` is `null`, and we correctly push. Wait — re-reading: `if(!top||top.main!==getTA())pushSnapshot()` — this should work. The real issue: `loadAutosave` calls `renderMainLines()` etc. but never seeds `undoStack` with an initial snapshot. So the first undo pops the first typed character's snapshot, leaving nothing — giving the appearance it "didn't work." Fix: push an initial snapshot after load.

**Bug 3 — Undo needs double trigger for paste**: The paste handler calls `pushSnapshot()` then `ta.dispatchEvent(new Event('input'))` which calls `pushSnapshot()` again (since the text changed). Two snapshots for one paste = needs two undos. Fix: don't dispatch 'input' after paste (or suppress the snapshot in the input handler when paste just ran).

**Bug 4 — Last character never undone**: After typing, the snapshot at the bottom of `undoStack` IS the initial state, but since we never seeded it, the first undo restores to the state just before the last character. The initial "empty" state is never in the stack. Fix: same as Bug 2 — seed initial snapshot.

Now let me implement:I'll create the file directly from the document content in context while the container recovers.79KB — well under the limit.Here's what changed in v23:

**Undo rework** — the core issue was that the undo stack was never seeded, so the very first Ctrl+Z consumed a real edit snapshot instead of revealing an earlier state, and the initial state was never reachable. The fix:

- `loadAutosave()` now pushes the initial state as `undoStack[0]` right after setup
- `doUndo()` changed from "pop and apply" to "pop to redo, then apply the new top" — so the stack always keeps at least the baseline state and undo is a single press per action
- After a full import (both files), the stack is reseeded with the post-import state for the same reason

**Paste double-undo fix** — the paste handler was calling `pushSnapshot()` then firing `dispatchEvent('input')` which called `pushSnapshot()` again. Added `_pasteJustHappened` flag: paste sets it, the `input` handler skips its push if the flag is set and clears it.

**Cursor position on startup** — the mode-switch logic that finds the first lyric line was skipping meta lines but not blank lines, landing the cursor on the separator blank between meta and lyrics. Added `|| taLines[i].trim() === ''` to the skip condition so blank lines are also stepped over.

**Ctrl+O restored** — default hotkey updated from `Ctrl+M` to `Ctrl+O`, button tooltip updated. A migration in `loadCfg()` converts any saved `Ctrl+M` preference automatically on first load.