###### Bugs
Lyrics without timestamps have no target for Sync line (W, Enter). The first line of unsynced lyrics should be highlighted in Hotkey mode after being added.

An unsynced line keeps jumping back to the previous synced line while the song is playing, making it impossible to target the unsynced line for syncing without pausing the song.

Next line E does not work if the next line has no timestamp, only Down works. If there is no timestamp for a target line, Q and E should simply fall back to behaving like Up and Down, respectively - making it the active line but not attempting to replay since they have no timestamp reference. Same for left click on an unsynced line.
###### Changes
After the user syncs a line with W or Enter, a setting should control whether to immediately move on to the next line or replay the current one. Add a new REPLAY LINE section after AUTOSTRIP (rename to AUTO STRIP for syntax consistency) and put in:
- [x] After adjusting seek offset
- [x] After syncing line
- [x] After adjusting timestamp
In other words: by default (all three checked), the user gets an instant replay of the current line after offsetting seek, syncing a line in Hotkey mode, or adjusting its timestamp in Offset time mode. This assumes the user wants to get each line perfect before moving on, which they must do manually with E, Down, or left click.
If a user unchecks replaying after adjusting seek offset or timestamp, the song should keep playing after they adjust it.
If a user unchecks replaying after syncing line, the song should move to the next line - this is the typical non-blocking behavior of most lyric editors.
###### Refinements
The cursor is still after the metadata line but I don't add lyrics from scratch very often so it's not a big deal - clean up any code that exists purely to fix this and label as known issue.

Create a setting for undo debounce in bottom of INTERVALS section under Volume increment, called 'Undo window', and default it to 100ms down from 400ms. This field should look and function just like the Large [ ] ms field.

Add `Enter` overlay next to `W` overlay for Sync line control (move `W` left to prevent overlaps or extra newline)

Remove the by metadata field everywhere, including the line it occupies in settings default metadata - I used to use it to mark lyrics synced my way (especially translations) so I could go back to them, but the app is probably niche enough for that

Change default seek offset to -600ms
___
Let me read the current file carefully before making changes.Good, I have a complete picture. Now I'll work through everything systematically. Let me copy v24 and apply all changes:
**1. DEFAULT_META — remove `[by:]` line, change seek_offset_tick default to -600, add new cfg fields:\*\*
\*\*2. Fix UNDO_DEBOUNCE_MS to use cfg value instead of hardcoded constant:\*\*
\*\*3. Fix `syncLine`, `adjustTs`, `tickSeekOffset` to respect replay settings. Also fix `syncLine` to advance to next line when replay_after_sync is off:\*\*
\*\*4. Fix unsynced-line bugs — `updateActiveLineFromTime` must not override a manually-set active line that has no timestamp. Fix `seekPrevLine`/`seekNextLine` to fall back to simple navigation for lines without timestamps. Fix click on unsynced line:**Now fix click on unsynced line in `renderMainLines` — it currently only seeks if `ms!==null`. For unsynced lines it should just select and suppress auto-advance:
**5. Fix `syncLine` — if no active line is set when lyrics have no timestamps, select the first non-meta lyric line. Also handle `replayActiveLine` being called on an unsynced line gracefully (it already checks `ms!==null`, which is fine).**

Also need to handle `togglePlay` starting playback from an unsynced active line — currently it tries to seek to `ms` but only if non-null, so that's already safe.

**6. Update settings HTML — AUTO STRIP rename, add REPLAY LINE section, add Undo window to Intervals:**---

**⚠️ Tool limit reached — partial v25 at `/home/claude/linebyline_25.html`. Do not use yet.** Here's the complete handoff:

**Already applied:**
- ✅ `DEFAULT_META` — `[by:]` line removed
- ✅ `seek_offset` default changed to `-600`
- ✅ New cfg fields: `replay_after_offset`, `replay_after_sync`, `replay_after_ts`, `undo_debounce_ms:100`
- ✅ Undo debounce uses `cfg.undo_debounce_ms` instead of hardcoded constant
- ✅ `syncLine` — respects `replay_after_sync`; if off, advances to next line
- ✅ `adjustTs` — respects `replay_after_ts`; if off, keeps playing
- ✅ `tickSeekOffset` — respects `replay_after_offset`; if off, keeps playing
- ✅ `updateActiveLineFromTime` — won't override a manually-selected unsynced line
- ✅ `seekPrevLine`/`seekNextLine` — fall back to simple navigation for unsynced lines
- ✅ Click on unsynced line — selects it and suppresses auto-advance
- ✅ Settings HTML — AUTO STRIP rename, REPLAY LINE section added, Undo window row added

**Still needed:**
1. **`openSettings`** — add `s-replay-offset`, `s-replay-sync`, `s-replay-ts`, `s-undo-debounce` population
2. **`saveSettingsNow`** — read those same fields into `cfg`
3. **Event listeners** — add `change` listeners for the 3 replay checkboxes + `s-undo-debounce`
4. **Reset defaults** — add the 4 new fields to the reset handler
5. **Sync line panel cell** — add `Enter` key badge alongside `W` in `rebuildHkPanel`; the cell currently uses single `cell.innerHTML` with one `hk-key` span — needs two badges side-by-side for `sync`
6. **`loadCfg` migration** — add `seek_offset:-600` note (no migration needed since it's only a default change, not a key rename — existing users keep their saved value)
7. **Remove cursor-positioning dead code** — strip the `firstLyricChar` block from `applyMode` and add a `// Known issue: cursor lands at end of metadata on startup` comment
___
Now I have everything. Let me apply all remaining edits:Now fix the Sync line control panel cell to show both W and Enter badges:Now handle the first-line highlight bug — when there's no active line and user is in hotkey mode with unsynced lyrics, the first lyric line should be highlighted. Fix `loadAutosave` and the init sequence:Also seed first line after full import (both files):Now verify and build:Here's what changed in v25:

**Bugs fixed:**

- **Unsynced lines have no sync target** — on startup and after full import, `activeLine` is now seeded to the first non-meta lyric line, so W/Enter immediately have a target even with no timestamps present.
    
- **Unsynced line jumps back while playing** — `updateActiveLineFromTime` now checks whether the current `activeLine` is an unsynced line positioned _after_ the last matched timestamp. If so, it leaves it alone, preventing the jump-back that made it impossible to target for syncing while the song played.
    
- **Q/E don't work on unsynced lines** — `seekPrevLine`/`seekNextLine` now walk to any non-meta line, not just timestamped ones. If the target has a timestamp it seeks there; if not, it just moves the active highlight and sets `suppressAutoLine` so it holds.
    
- **Left-click on unsynced line** — now selects it and suppresses auto-advance for 1.5s, same as arrow navigation.
    

**Changes:**

- **Replay Line settings section** added (after Auto Strip): three checkboxes — After adjusting seek offset ☑, After syncing line ☑, After adjusting timestamp ☑. When "after syncing line" is off, W/Enter advances to the next line instead of replaying — matching the non-blocking mode of most lyric editors. When the other two are off, playback continues uninterrupted after offset/timestamp changes.
    
- **Sync line panel cell** now shows both `W` and `Enter` badges side by side.
    

**Refinements:**

- **Cursor positioning dead code removed** — the `firstLyricChar` loop in `applyMode` is gone. Replaced with a one-liner that puts the cursor at end of text (known issue noted in comment).
- **Undo window setting** added at the bottom of Intervals, defaulting to 100ms (down from the 400ms used in v24).
- **`[by:]` metadata field** removed from `DEFAULT_META` everywhere, including the default metadata textarea in Settings.
- **Default seek offset** changed to −600ms.
- **AUTO STRIP** renamed from "Autostrip" for syntax consistency.