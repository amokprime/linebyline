###### Bugs
The speed increment jump still feels very drastic. For example 0.05 feels almost the same, 0.10 noticeably slower, 0.25 dramatically slower - so a linear scale quickly outpaces my attention span! Try multiplicative ratio with default 1.10 and rename Speed increment to Speed ratio for consistency.
###### Changes
Add checkboxes starting at top of INSTANT REPLAY above "After adjusting seek offset" checkbox to make the opinionated instant replay behavior fully opt-in:
- [ ] Moving to previous line
- [ ] Moving to next line
- [ ] Resuming currently playing line
- [ ] Playing another line

Table of intended behavior:

| Setting                         | Resume paused song | Just move selection, don't play | Play from selected line start without seek offset | Play from selected line start + seek offset (aka Instant Replay) |
| ------------------------------- | ------------------ | ------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Moving to previous line         | N/A                | If unchecked                    | N/A                                               | If checked                                                       |
| Moving to next line             | N/A                | If unchecked                    | N/A                                               | If checked                                                       |
| Resuming currently playing line | If unchecked       | N/A                             | N/A                                               | If checked                                                       |
| Playing another line            | N/A                | N/A                             | If unchecked                                      | If checked                                                       |
Further clarification: keep the current Up / Down arrow behavior (the unchecked behavior of moving to previous/next line) regardless of whether those settings are checked or not

###### Refinements
Remove Sync line (alt) from Settings (but keep the hotkey)

Rename the Control button name "Prev line" to "Previous line", there's enough space now

Expose Seek offset in Settings under INTERVALS/Large with the same type of style, number field, and unit label

Add Genius to re if Genius lyrics are pasted into *any* field for the first time in a session, both main and secondary

Add my icon.svg as brand icon to show in browser tab before the brand name "LineByLine"
___
icon.svg
```
<svg width="512" height="512" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"> <g> <title>Layer 1</title> <rect id="svg_6" fill="#000000" height="24" width="24"/> <path d="m13,5l8,0" id="svg_1" stroke="#ffff00"/> <path d="m13,12l8,0" id="svg_2" stroke="#ffff00"/> <path d="m13,19l8,0" id="svg_3" stroke="#ffff00"/> <path d="m3,17l2,2l4,-4" id="svg_4" stroke="#00ff00"/> <path d="m3,7l2,2l4,-4" id="svg_5" stroke="#00ff00"/> </g> </svg>
```
Let me know if you have any concerns
___
A few quick clarifications before building:

**1. "Resuming currently playing line" — what counts as the "currently playing line"?** My understanding: the line whose timestamp the playhead is currently within (i.e. `activeLine` as set by `updateActiveLineFromTime`). So if the song is paused at line 5, pressing Space resumes from where it stopped. If "Resuming currently playing line" is checked and you press Space, it instead seeks to line 5's timestamp + seek offset first, then plays. Correct?

**2. "Playing another line" — triggered by what actions exactly?**

- Left-clicking a line that is _not_ the currently active line → if unchecked: seek to its timestamp (no offset), play; if checked: seek to timestamp + seek offset, play
- Q/E (prev/next line) are covered by their own checkboxes
- What about clicking the _currently active_ line while paused — is that "Resuming currently playing line" (Space behavior) or "Playing another line"?

**3. "Moving to previous/next line" with Q/E — does the instant replay also autoplay if the song was paused?** The table says "Play from selected line start + seek offset if checked" — so yes, Q/E would start playing even if previously paused when those boxes are checked?

**4. Speed ratio — confirming the math:** `currentSpeed *= ratio` on up, `currentSpeed /= ratio` on down, reset to 1.0. Steps from 1.0 with ratio 1.10: 1.10, 1.21, 1.33, 0.91, 0.83, 0.75. The Settings field would show the ratio value (1.10) not the additive amount. Confirm?

**5. "Add Genius to re if Genius lyrics are pasted into any field for the first time in a session"** — "first time in a session" means once per page load (tracked by a flag), and subsequent Genius pastes don't re-update? Or does it update every time?

**6. The INSTANT REPLAY timestamp sub-options** — these were in the previous prompt but weren't built yet. Still wanted here or deferred?
___
1. Yes, line 5's start timestamp to be precise; that is the currently hardcoded behavior I am trying to change to opt-in. It is possible for the user to use arrow keys or Q/E (with instant replay for previous/next line disabled) to navigate to a different line than the one currently playing in the song. So whatever line would be targeted for sync if the user pressed Enter is the "selected line", which can be the same or different than than the "currently playing line".
2. Playing another line refers to Play/pause, so triggered by Space or left click, when the selected line is NOT the currently playing line. If selected and current line are the same line (i.e. clicking the currently active line or pressing Space to unpause), this setting does not apply - "Resuming currently playing line" would apply instead.
3. Yes, if there was a currently playing line that did not finish, abandon it to autoplay the other lines with Q/E if checked. Otherwise if not checked the user must press Space or left click to start playing the other line manually (the current line would keep playing while they navigate).
4. Yes and make sure it's still an editable number field with the side tick arrows like before.
5. Per page load. So reloading page or closing tab and reopening should reset it.
6. No, abandon those unfinished builds - there was a Claude outage yesterday and I changed my prompt offline. Build if no more concerns
___
No more concerns. Let me read all the sections I need before touching anything.Good, I have everything. Let me read the icon file then build.
**1. Favicon + title tag:\*\*
\*\*2. DEFAULT_CFG — rename speed_increment→speed_ratio, default 1.10, add new replay flags, seek_offset in settings:\*\*
\*\*3. Remove `replay_line` (Sync line alt) from HK_LABELS so it doesn't appear in Settings:\*\*
\*\*4. Add migration for speed_increment→speed_ratio in loadCfg:\*\*
\*\*5. Update changeSpeed to multiplicative:\*\*
\*\*6. Update togglePlay to respect new replay flags, and update renderMainLines click handler, seekPrevLine, seekNextLine:**
Now update the renderMainLines click handler for line clicks (same logic — current vs other):
Now update seekPrevLine and seekNextLine for new replay flags:
**7. Add session-level Genius flag, update both paste handlers and secondary field paste:**
Now add a helper to update `[re:]` only on first Genius detection per session:
Now update the three paste handlers to use `markGeniusSource()` and remove the old inline `[re:]` update:**Completed edits to `/home/claude/linebyline_27.html`:**
- ✅ Favicon (inline data URI from icon.svg)
- ✅ `speed_ratio:1.10` replaces `speed_increment:0.25` in DEFAULT_CFG
- ✅ New replay flags: `replay_prev_line`, `replay_next_line`, `replay_resume_current`, `replay_play_other` (all false)
- ✅ `changeSpeed` now multiplicative (`× ratio` / `÷ ratio`)
- ✅ `togglePlay` — current vs other line logic
- ✅ Click handler in `renderMainLines` — current vs other line logic
- ✅ `seekPrevLine`/`seekNextLine` — replay flag respected
- ✅ `_geniusDetectedThisSession` flag + `markGeniusSource()` helper
- ✅ Both main-field paste handlers use `markGeniusSource()`
- ✅ `replay_line` removed from HK_LABELS (Settings hotkeys)
- ✅ Migration for `speed_increment` → `speed_ratio`

**Still needed:**
1. Secondary field paste handler — call `markGeniusSource()` when Genius detected
2. Settings HTML — add 4 new checkboxes to INSTANT REPLAY, rename "Speed increment" → "Speed ratio", add Seek offset row to INTERVALS
3. `openSettings` — populate new fields
4. `saveSettingsNow` — read new fields, use `speed_ratio`
5. Event listeners & reset block — new fields
6. `prev_line` panel label → "Previous line"
___
Now I have all the context I need. Let me apply all remaining edits:Now verify and build:Only the migration comment remains. Good.Here's what changed in v27:

**Bugs fixed:**

- **Speed ratio** — `changeSpeed` now multiplies/divides by `cfg.speed_ratio` (default 1.10) instead of adding/subtracting a fixed amount. Steps from 1.0 with 1.10: 0.91, 0.83, 0.75 down / 1.10, 1.21, 1.33 up — each step is perceptually equal. Renamed throughout to "Speed ratio". The Settings field accepts values from 1.01–2.00.

**Changes:**

- **Four new INSTANT REPLAY checkboxes** (all off by default) above the existing three:
    - _Moving to previous line_ — Q/E/prev navigates and instant-replays if checked; otherwise just moves selection while playback continues
    - _Moving to next line_ — same for next
    - _Resuming currently playing line_ — Space or clicking the active line while paused seeks to timestamp+offset if checked; otherwise resumes from the paused position (standard music player behavior)
    - _Playing another line_ — Space or clicking a different line seeks to timestamp+offset if checked; otherwise seeks to timestamp only (no offset)
- `lastPlayingLine` tracks which line was last started so "current vs other" is determined correctly even when the user navigates away with arrow keys

**Refinements:**

- **Seek offset in Settings** — added under Intervals between Large and Speed ratio, with the same number field style. Changing it there syncs the left-panel field immediately.
- **"Previous line"** — panel button label updated from "Prev line"
- **`replay_line` (Sync line alt)** removed from Settings hotkeys rows (key still works)
- **Genius `[re:]`** — now tracked with a per-session flag (`_geniusDetectedThisSession`). The first Genius paste in any field (main or secondary) during a session updates `[re:]` to `Genius, LineByLine`; subsequent pastes don't re-update it. Reloading the page resets the flag.
- **Favicon** — your icon.svg embedded as an inline data URI in the `<link rel="icon">` tag
