Bugs Up down arrows snap back to current line while song is playing and move normally while song is paused. Ctrl+A does not work and just highlights all text elements in the browser-native way. Add ( ) is allowed in Typing Mode but only works for current line and cannot be undone until switching back to Hotkey Mode. Disallow but try to support autocompletion of ( to () and [ to [] in Typing Mode.

Changes Add volume slider under the seek offset controls that reflects current volume in-browser Remove seek offset buttons and hide media buttons, there's too many controls now that might scare away other users. Instead of offset buttons, reuse existing timestamp buttons for seek offset via a second toggle over Hotkey / Typing mode called Offset seek / Offset timestamps, default Offset timestamps and hotkey Grave key. Then add a new hotkey (default Ctrl+Grave) and control called **Sync file** (located next to the <> arrows) to offset all lyrics by the amount set in the Seek offset field and then reset the amount in there back to 0. Increase width of left panel if necessary to prevent **Sync file** `Ctrl+``   from using two newlines.

Refinements Go a step further: hide metadata tags and newline(s) included with them in hotkey mode. No need for preventing arrowing or clicking there if it doesn't exist! Similarly, remove new file everywhere (menu bar "New" button, Ctrl+M hotkey, settings, etc.) and instead make Import automatically reset things. Remove Export everywhere as well since the .lrc file is already being edited in place and autosaved. Rename Vol + and - to Volume + and Volume -. There's enough space. Make Esc and the Settings hotkey toggle close Settings window without saving Remap various hotkeys so left hand can stay on keyboard and right hand on mouse for an uninterrupted workflow:

- Add field Alt+1
- Remove field Alt+2
- Merge fields Alt+3
- Settings Alt+Grave
- Import Middle click
___
This is a substantial redesign. Let me read the current file carefully before making any changes.
Good — I have the full picture. 
This is a large set of changes. Let me build the new file carefully.
**1. Left panel width increase, volume slider CSS, offset mode indicator style:**
**2. Update the audio-box HTML — add vol slider, offset-mode toggle, sync-file button; remove seek tick buttons:**
**3. Update menu bar — remove New, Export, keep Import (middle-click handled in JS); update btn-add-sec/remove-sec/merge titles; remove settings from menu:**
**4. Update DEFAULT_CFG — new hotkeys, remove export/new/seek_offset_back/fwd, add sync_file/offset_mode_toggle:****5. Add `offsetSeekMode` state variable; update import to do full reset instead of append; remove export/new functions:**
**6. Update renderMainLines to hide meta lines in hotkey mode:**
**7. Update audio setup to sync vol slider; add vol slider logic; rewrite import as reset; remove export/new; add syncFile function; fix arrow snap bug:**

First fix the arrow snap bug — `updateActiveLineFromTime` overwrites `activeLine` every tick while playing. We need to not override it while user is navigating:Now update setupAudio to sync the vol slider, and add vol slider wiring:
Now update CTRL_ACTIONS vol/mute to also update slider display when no volumechange event fires (muted):
**8. Replace the seek tick wiring and add vol slider, offset mode, sync file, doSyncFile function:**
**9. Rewrite Import to reset state; remove old export/new handlers; add middle-click import on editor area:**
**10. Remove the old New handler:**
**11. Update rebuildHkPanel — show offset mode in labels, update HOTKEY_ONLY, add merge_fields/sync_file/offset_mode_toggle cells; update sync-file-hk display:**
**All edits are in `/home/claude/linebyline_7.html` but not yet copied to outputs.** Only a few things remain to complete in the next continuation:

1. **Update the keyboard handler** — remove `export`/`new` hotkeys, add `offset_mode_toggle`/`sync_file`/`merge_fields`/`settings→Alt+\`` hotkeys; update` settings`close to handle Esc; add`suppressAutoLine` timer to arrow key handler to fix the snap-back bug
    
2. **Update Settings HTML** — remove `seek-offset-tick` row (no longer needed as a separate control), remove `export`/`new` from HK_LABELS section, add `offset_mode_toggle`/`sync_file`/`merge_fields`; update close/Esc to not save
    
3. **Settings save handler** — remove `seek_offset_tick` read, remove `export`/`new` writes
    
4. **Add ( ) in typing mode** — disable the `btn-parens` button in typing mode; add `(→()` and `[→[]` autocomplete to the textarea keydown
    
5. **Ctrl+A fix** — intercept Ctrl+A in hotkey mode to call `selectAllLyricLines` instead
    
6. **Update button wiring** — remove `btn-new`/`btn-export` wires, add middle-click import already done
    
7. **Init** — update to call `rebuildHkPanel` which now sets `sync-file-hk` label
___
Now let me also check the Settings HTML to see what needs updating:Good. Now I'll apply all remaining changes in one pass.

**1. Remove seek-offset-tick from Settings HTML:**
**2. Update openSettings — remove seek_offset_tick read:**
**3. Update s-save handler — remove seek_offset_tick write:**
**4. Make Esc and settings hotkey close Settings without saving:**
**5. Rewrite the entire keyboard handler — fix arrow snap, remove old hotkeys, add new ones, fix Ctrl+A, add parens disable in typing mode, add ( and [ autocomplete:**
**6. Update button wiring — remove old new/export, disable parens in typing mode, add merge-btn wiring already in CTRL_ACTIONS:**
**7. Update applyMode to also update the parens button disabled state:**
**8. Update init line — remove seek_offset_tick, update rebuildHkPanel call (it now also sets sync-file-hk):
**Now verify no stale references remain:Just the orphaned CSS for `.seek-tick` — harmless but let's clean it up:Final checks:Clean. Copy to outputs:Full summary of everything in this version:

**Bugs fixed:**

- **Arrow snap while playing** — `suppressAutoLine` flag is set on any arrow keypress and cleared 1.5s after the last one, so `updateActiveLineFromTime` backs off while you're navigating and resumes shortly after you stop
- **Ctrl+A** — intercepted in hotkey mode to call `selectAllLyricLines` instead of browser select-all
- **Add ( ) in Typing mode** — button is grayed out (0.4 opacity) and clicks are blocked; as compensation, the textarea now autocompletes `(` → `()` and `[` → `[]` with cursor placed between them

**Changes:**

- **New/Export removed** — from menu bar, hotkeys, and all wiring; Import now fully resets state (audio, undo stack, secondary fields, active line)
- **Middle-click anywhere** → triggers Import
- **Offset seek / Offset timestamps toggle** — two-button row under seek offset; default is Offset timestamps; Grave key toggles; timestamp keys (Z/V/A/F/S/D/X/C) now route through `CTRL_ACTIONS` which checks `offsetSeekMode` and calls either `tickSeekOffset` or `adjustTs` accordingly; Controls panel labels update to show `Timestamps` or `Offset`
- **Sync file button** — next to seek offset row with hotkey label; applies current offset to all timestamps then resets offset to 0; hotkey `Ctrl+``
- **Volume slider** — range input below seek offset, labeled Volume, syncs with `audioEl.volume` and `volumechange` events
- **Media controls removed from Controls panel** — Mute/Vol+/Vol− still work as hotkeys but aren't shown as panel buttons since they're covered by the slider

**Refinements:**

- **Metadata hidden in hotkey mode** — meta lines and their trailing blank lines are skipped in `renderMainLines`; no arrow/click workarounds needed since they're simply not there
- **Vol − / Vol +** renamed to **Volume − / Volume +** in labels
- **Settings hotkey (Alt+`) and Esc both close settings without saving**
- **New hotkey mappings**: Add field `Alt+1`, Remove field `Alt+2`, Merge fields `Alt+3`, Settings `Alt+\``, Import` Ctrl+O` (middle-click also works)
- **Left panel widened** to 256px so Sync file + `Ctrl+`` fits on one line