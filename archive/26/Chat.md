###### Bugs
The first lyrics line is not highlighted when I paste lyrics in Hotkey mode into the Main field - I have to manually press E or Down once or twice or click on the line once.

Enter is not syncing lyrics like W is.

An undo window of 0 is allowed but does not work and silently resets back to default. Correct it to 1 immediately in the field where the user can see it.

The speed offset seems a bit strong - is there any way for you to validate that, for example, 0.75 really is making the song 25% slower?
###### Changes
Remove Clear button from Control panel and Settings - I need to free up a slot and Esc is one of those universal hotkeys anyway. Move End line button in its place and change its default hotkey to T. Add 'Replay only' button where End line button originally was and set its default hotkey to R in Settings. As implied, this should only replay a line (respecting seek offset interval), not sync or adjust it.

| Diagram to clarify relative vertical position | Comment                   |
| --------------------------------------------- | ------------------------- |
| Sync line `W` `Enter`                         |                           |
| Replay only `R`                               | ← Previously End line `R` |
| End line `T`                                  | ← Previously Clear `Esc`  |
###### Refinements
Rename Play everywhere to Play/pause - the panel should be wide enough now to contain that and the `Space` overlay on one line; widen it again if not.

Rename REPLAY LINE in Settings to INSTANT REPLAY which users may be more likely to immediately understand from sports

Change default undo debounce from 100ms → 150ms

Don't replay these by default anymore:
- [ ] After adjusting seek offset
- [ ] After syncing line
- [ ] After adjusting timestamp

Stop assuming lyrics are from Genius. Instead, use default [re: LineByLine] and append Genius at the start automatically when Genius-pasted lyrics are detected: [re: Genius, LineByLine]
___
Now I have everything I need. Let me plan all changes precisely:

**Bugs:**

1. First line not highlighted after paste in hotkey mode → after `setMainText` in the paste handler, seed `activeLine` to first lyric line if still -1 (or always after paste)
2. Enter not syncing → `hk.replay_line` defaults to `Enter`, but `syncLine` is only mapped to `hk.sync` (`W`). Need to also map `hk.replay_line` to `syncLine()` when used as sync. **Re-reading the design**: Enter and W are both shown on the Sync line panel cell. So Enter should call `syncLine()`, not `replayActiveLine()`. The `replay_line` key is now being repurposed as a second sync trigger. The new "Replay only" button gets hotkey `R`, which was previously `end_line`. Need to untangle: rename `replay_line` → `sync2` or just wire Enter to sync in the actions map alongside W.
3. Undo window 0 → clamp to minimum 1 and update field immediately in `saveSettingsNow`

**Speed validation:** `audioEl.playbackRate = 0.75` is standard HTML5 — 0.75 genuinely means 75% speed (25% slower). This is spec-defined, confirmed correct.

**Changes:**

- Remove `clear_sel` from panel and settings hotkeys entirely; keep Escape working in keyboard handler but without a panel button or settings row
- Add `replay_only` hotkey (default `R`) — just calls `replayActiveLine(false)`
- Rename `end_line` default from `R` → `T`
- Panel order: Sync line [W][Enter], Replay only [R], End line [T], ...
- Rename `Play` → `Play/pause` everywhere

**Refinements:**

- Rename REPLAY LINE section → INSTANT REPLAY
- Default undo debounce 100ms → 150ms
- Default replay flags all `false`
- DEFAULT_META: `[re: LineByLine]` base; `cleanGenius` prepends `Genius,` when detected — need to update `[re:]` in textarea after Genius paste is confirmed

**`[re:]` Genius detection:** `cleanGenius` returns non-null when Genius content is detected. So in the paste handler, if `cleanGenius(raw)` returned something, update the `[re:]` field in the textarea to `[re: Genius, LineByLine]`.
Now update CTRL_ACTIONS to add replay_only:
Now update rebuildHkPanel — remove clear_sel from panel, swap in replay_only, rename Play, fix panel order:Update HOTKEY_ONLY set to include replay_only and remove clear_sel:
Now fix the keyboard handler: wire `replay_line` (Enter) to `syncLine()` instead of `replayActiveLine()`, add `replay_only` action, keep Escape for clear_sel:
Fix undo window validation (clamp to min 1):
Also update the default value in the HTML input and openSettings:Rename REPLAY LINE → INSTANT REPLAY in settings HTML:
Now fix the paste handler to: (1) seed activeLine to first lyric after paste, (2) update `[re:]` to `Genius, LineByLine` when Genius detected:Also fix the typing-mode textarea paste handler the same way (Genius detection → [re:] update, activeLine seed):**Speed validation answer:** `playbackRate = 0.75` is correct — it's part of the HTML5 `HTMLMediaElement` spec and is directly proportional. 0.75 is literally 75% of normal speed (25% slower). The browser's audio pipeline handles pitch correction. No bug there.

**Still needed to complete v26** (all prior edits are applied):

1. **Textarea paste handler** (line 506–522) — add Genius detection + `[re:]` update, same pattern as the main-lines handler
    
2. **Settings migration in `loadCfg`** — add migration for old `end_line:'R'` → `'T'` and seed `replay_only:'R'` if missing from saved config
    
3. **`loadCfg` new fields** — `replay_only` hotkey and `replay_after_*` booleans need to survive `Object.assign` correctly (they will since they're in `DEFAULT_CFG`, but verify `replay_only` hotkey migrates if user had old save)
    
4. **`openSettings` / `saveSettingsNow` / reset** — add `replay_only` to the hotkeys section (it appears in HK_LABELS so `buildHkRows` will pick it up automatically). The replay flags and undo debounce default updates need the reset block updated (already has them from v25).
    
5. **`s-undo-debounce` openSettings** — update to show `cfg.undo_debounce_ms??150`
    

The partial file at `/home/claude/linebyline_26.html` has all edits except items 1–5 above. Items 2–5 are small; item 1 is the most important for the "first line not highlighted" bug in typing mode.
___
Good. Now I'll apply the remaining four edits in sequence:
Now verify everything looks right and build:`clear_sel` is absent from `HK_LABELS` (so it won't appear in Settings hotkeys rows) and absent from the panel array, but the Escape key still clears selection in the keyboard handler. **Speed validation:** `playbackRate = 0.75` is correct by the HTML5 spec — it's a direct multiplier on the media clock, so 0.75 is exactly 75% speed (25% slower). No bug there.

Here's what changed in v26:

**Bugs fixed:**

- **First line not highlighted after paste** — both paste handlers (hotkey view and typing mode) now seed `activeLine` to the first lyric line if it's unset after the paste. The hotkey-mode view paste already called `setMainText` which triggers `renderMainLines`, but `activeLine` stayed `-1`; it's now set immediately before the re-render.
    
- **Enter not syncing** — `hk.replay_line` (Enter) was wired to `replayActiveLine()`. It's now wired to `syncLine()` instead, matching the W behavior. Shift+Enter still seeks to line end (replay end boundary). The old "Replay line" action is now the separate **Replay only** button (R).
    
- **Undo window 0** — clamped to minimum 1 in `saveSettingsNow`, and the field is immediately updated to show the corrected value so the user sees it take effect.
    

**Changes:**

- **Clear button removed** from control panel and Settings hotkeys — Escape still clears selection via the keyboard handler but has no panel cell or settings row
- **Replay only** button added (default `R`) — replays current line respecting seek offset, no sync or timestamp change
- **End line** default hotkey changed `R` → `T`; panel order is now Sync line / Replay only / End line
- **Play/pause** renamed from "Play" everywhere (panel, HK_LABELS)
- Migration: users with saved `end_line: R` and no `replay_only` get auto-migrated to `end_line: T` / `replay_only: R`

**Refinements:**

- **INSTANT REPLAY** section (was REPLAY LINE)
- **Defaults now all unchecked**: After adjusting seek offset ☐, After syncing line ☐, After adjusting timestamp ☐
- **Undo window default** 100ms → 150ms
- **`[re:]` is now `LineByLine`** by default; pasting Genius content auto-updates it to `Genius, LineByLine` in both hotkey and typing mode
- **`[re: Genius, LineByLine]`** was the previous hardcoded default — now it's dynamic and only appears when Genius content is actually detected