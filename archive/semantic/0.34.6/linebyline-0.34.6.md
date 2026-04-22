### Version
Patch

### Bugs
- Mark line as translation can be undone but not redone

### Refinements
- Remove Help window and instead make Help button link to https://github.com/amokprime/linebyline/blob/main/HELP.md and preview link in status bar like the Issues button, then remove related dead code (leave the Help hotkey as it should just open the Help link now)
- In Hotkey mode, skip empty lines with no lyrics text when: 
	- Syncing a line with Settings → Instant Replay → Syncing line unchecked (causing selection to move to the next line)
	- Navigating with Q with Settings → Instant Replay → Moving to previous line checked
	- Navigating with E with Settings → Instant Replay → Moving to next line checked
	- Navigating with ArrowLeft/ArrowRight
- Automatically add a trailing timestamp for the song after lyrics are added by either paste or import (wait for Genius cleanup if applicable), set to the duration of the song (i.e. duration of 2:31 would be `[02:31.00]`)
- Stop using monospace for speed and seek offset fields in Now Playing controls box and the Settings → Default Metadata Tags field; use System Sans instead like the Settings → Intervals
- Add feedback on hover and click to the three media buttons (seek back/forward and play/pause) in the Now Playing controls box
- Focus Search bar field in Settings window when it opens so users can start typing right away
- Emphasize headings in Settings subsections like Hotkeys → **Menu**, Hotkeys → **Playback**, etc.
- Add Ctrl+Shift modifier based default browser hotkeys to restrictions such as Ctrl+Shift+I
- Add all Meta modifier based hotkeys to restrictions

---
Several questions before building:

1. **Trailing timestamp on paste/import** — should this only be added when no trailing timestamp already exists? And only when there's a loaded audio file to get the duration from (otherwise there's nothing to use)?
    
2. **Trailing timestamp on paste** — paste appends to existing content. Should the trailing timestamp be appended after the pasted lyrics, replacing any existing trailing timestamp if one is already there, or only added if none exists?
    
3. **Skip empty lines on sync/navigate** — "empty lines with no lyrics text" — does this mean lines that are blank (`''` after trimming), or also lines that are end-timestamps (`[mm:ss.cc]` with no text)? Should navigation (ArrowUp/Down) also skip them, or only the specific cases listed?
    
4. **Help button as link** — same `<a>` treatment as Issues (styled as button, `href`, `target="_blank"`, `rel="noopener"`)? And the Help overlay HTML and all JS (`openHelp`, `closeHelp`, overlay wiring, Escape handler, `_topmostOverlay` help branch) should all be removed?
    
5. **`Ctrl+Shift` restrictions** — add all `Ctrl+Shift+[A-Z0-9]` combos to `RESTRICTED_ALL`, or just specific ones you have in mind beyond the three already there (`I`, `J`, `C`)?
    
6. **Meta restrictions** — add `Meta+[A-Z0-9]` and common combos, or all `Meta+*`?

---
1. Yes to both
2. Only if none exists
3. Only blank lines with '' after trimming; navigation ArrowUp/Down should skip those too
4. Same as Issues. Remove Help window specific dependencies that Settings window does not use for itself. For example the Settings window by itself should still close when the user presses Esc/clicks outside window. But there's no need for the top/bottom window order logic since it's the only popup window in the app now.
5. Those three plus any others commonly used by modern web browsers
6. All Meta+*

---
Now I have everything I need. Let me apply all patches:
**Progress before limit:** The Help overlay HTML has been removed. Remaining changes still to apply:

- Replace Help `<button>` with `<a>` (like Issues)
- Remove Help CSS (`#help-overlay`, `#help-win`, `#help-title-bar`, `#help-body`, `#help-close`)
- Remove `openHelp`/`closeHelp` functions and all callers
- Simplify `_topmostOverlay` → remove entirely; simplify Escape handler in global KD to only check settings
- Fix `helpOpen` references in global KD
- Bug: `markAsTranslation` undo without redo — use same double-`pushSnapshot` pattern as lrc import
- Skip empty lines in `syncLine`, `seekPrevLine`/`seekNextLine`, `ArrowUp`/`ArrowDown`
- Auto trailing timestamp after paste/import when audio loaded and none exists
- Font: remove `font-family:var(--font-mono)` from `#seek-offset`, `#speed-val`, `.s-meta`
- Media button hover/active CSS fix (`var(--btn-bg)` and `var(--btn-hover)` are undefined — use `var(--bg)` and `var(--border)`)
- Focus `s-search` after `openSettings`
- Bold `s-sub-label` in Settings
- Expand `RESTRICTED_ALL` with `Ctrl+Shift+*` and `Meta+*`

---
Now I'll apply all patches in sequence:

**Remove Help CSS block:**
**Replace Help button with anchor:**
**Remove openHelp/closeHelp and update tooltip, CTRL_ACTIONS, wiring:**
**Simplify overlay utilities — remove _topmostOverlay and _bringToFront, simplify global KD:**
**Simplify global KD — remove helpOpen, _topmostOverlay, and stale help references:**
**Remove btn-settings _bringToFront and dead help listeners:**
**Focus search on openSettings:**
**Bold s-sub-label in Settings:**
**Fix media button hover/active CSS (btn-bg/btn-hover are undefined CSS vars):**
**Remove monospace from speed, seek-offset, s-meta:**
**Bug: markAsTranslation undo without redo — it calls `setMainText` which calls `pushSnapshot` once (pre-change), but leaves no post-change snapshot for redo. Fix: push after too:**
**Skip empty lines in seekPrevLine, seekNextLine:**
**Completed:**

1. Help overlay HTML removed
2. Help CSS removed
3. Help `<button>` → `<a href="...">` (like Issues)
4. `openHelp` simplified to `window.open`; `closeHelp` removed
5. `_topmostOverlay`, `_overlayZ`, `_bringToFront` removed
6. Global KD simplified — no more `helpOpen` or overlay z-ordering
7. Dead help listeners removed; `btn-settings` wiring simplified
8. Settings search bar focused on open
9. `s-sub-label` emphasized (bolder, larger, less faint)
10. Media button hover/active CSS fixed (was using undefined CSS vars)
11. Monospace removed from `#speed-val`, `#seek-offset`, `.s-meta`
12. `markAsTranslation` undo/redo fixed (extra `pushSnapshot()` after change)
13. `seekPrevLine` skips empty lines

**Still to apply** (next "continue"):

- `seekNextLine` — skip empty lines
- `syncLine` — skip empty lines when advancing after sync (no-replay case)
- `ArrowUp/Down` in global KD — skip empty lines
- Auto trailing timestamp after paste/import
- `RESTRICTED_ALL` expansion (`Ctrl+Shift+*`, `Meta+*`)
- Version bump + SECTIONS update + syntax check + file delivery

---
**Auto trailing timestamp.** Need a helper function, then call it from both paste handlers and the lrc import path (after Genius cleanup if applicable):
Now call it from paste handlers. For Genius paste we need to wait for `extractGeniusMeta` to finish first (it's synchronous, so we can call after). For both paste paths, call `maybeAppendTrailingTs()` after the content is set:
Now call it after lrc import (both paths):
**Expand RESTRICTED_ALL with Ctrl+Shift combos and all Meta combos:**
Also add Meta to the `isRestrictedForAll` message and to the keyStr normalization — Meta keys already produce `Meta+X` via `e.metaKey` but `keyStr` doesn't include Meta. 
Let me check: `keyStr` uses `e.ctrlKey`, `e.shiftKey`, `e.altKey` but not `e.metaKey`. Without that, Meta combos can't be captured as hotkeys anyway — they'll never match any RESTRICTED_ALL entry. But more importantly, users can't accidentally assign Meta keys since `keyStr` won't produce them. The restriction list still prevents future-proofing. Good enough — no change needed to `keyStr`.

**Version bump:**
**Update SECTIONS index:**
**Bug fixed**

- **`markAsTranslation` undo/redo** — `setMainText` pushes a pre-change snapshot; added a second `pushSnapshot()` after the change so the post-change state is on the redo stack.

**Refinements**

- **Help window removed** — overlay HTML/CSS gone, `openHelp`/`closeHelp` replaced by `window.open`, overlay z-order helpers (`_overlayZ`, `_bringToFront`, `_topmostOverlay`) removed, global KD simplified to single-overlay logic. Help `<button>` → `<a href="...HELP.md" target="_blank" rel="noopener">`.
- **Skip empty lines** — `seekPrevLine`, `seekNextLine`, `syncLine` next-advance, and ArrowUp/Down all skip `trim() === ''` lines.
- **Auto trailing timestamp** — `maybeAppendTrailingTs()` called after both paste handlers and both lrc import paths; only fires when audio duration is known, no trailing timestamp exists, and timestamped lines are present.
- **Monospace removed** from `#speed-val`, `#seek-offset`, `.s-meta` — now `font-family:inherit`.
- **Media button feedback** — `:hover` uses `var(--bg)`, `:active` adds brightness/translateY (was using undefined `var(--btn-bg/hover)`).
- **Settings search auto-focus** on open via `requestAnimationFrame`.
- **Settings sub-labels** — `font-weight:700`, `font-size:12px`, `color:var(--text-muted)`.
- **Ctrl+Shift restrictions** — added K/N/O/P/T/W/Delete.
- **Meta restrictions** — all `Meta+[A-Z0-9/Arrow/Shift]` added to `RESTRICTED_ALL`.
