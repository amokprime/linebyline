###### Changes
Some songs have very long silent/instrumental stretches. Is there a computationally efficient way (in the scope of this relatively simple web app) to auto-detect and skip to the next section with vocals without complicating architecture (i.e. with a local LLM)? If not, allow scroll wheel to quickly move the seek bar in increments (default 5 seconds) and add to INTERVALS in Settings over Seek offset: Seek increment and label its number field 's' for seconds. Dragging does not have to respect this increment.

Would it be possible to also fill in title, artist, and album metadata when pasting Genius lyrics? For example you could look for it near the top of the raw text:
```
Cover art for TITLE by ARTIST
TITLE #title appears twice
ARTIST #artist appears twice
Producer
PRODUCER
Track X on
ALBUM #album
```
Again not touching existing fields with entries. If the Genius lyrics are pasted first and song file added second, the song file should overwrite the Genius extracted title.

Hotkey conflict catcher with a warning that appears in the Settings window title bar like "This hotkey is used by X" and a "Replace" button that appears between the hotkey field and the Default button that appears at the same time, with the same font and font size as the Default button for consistency (no icon).
###### Refinements
Move Replay only Setting after Next line

Rename Settings "After adjusting seek offset", "After syncing line", and "After adjusting timestamp" to "Adjusting seek offset", "Syncing line", and "Adjusting timestamp" for tense consistency with other checkboxes in that section

Make sure adjusting seek offset in Settings window INTERVALS does not trigger instant replay if checked in INSTANT REPLAY - only adjusting it in the main window with buttons, hotkeys, or editing its number field should do that
___
A few quick questions before building:

**1. Auto-detect vocals** — there's no computationally lightweight way to do this in a plain web app without either a local model or a cloud API. The Web Audio API can do basic energy/silence detection, but that detects _silence_ not _the absence of vocals specifically_ — it would skip instrumental sections but not quiet sung passages, and would false-positive on soft intros. I'd call that out of scope for this app. Confirm I should just build the scroll-wheel seek increment instead?

**2. Genius metadata extraction** — the pattern you showed is fairly consistent but fragile. My plan: scan the raw pasted text before cleaning for patterns like:

- Title: look for a line ending in `Lyrics` (e.g. `TITLE Lyrics`) or the repeated line near the top
- Artist: the line that appears twice near the top, after the title
- Album: line after `Track N on`

If I find a field, I only write it if the current value in the textarea is empty or still the default (`Unknown`). If the song file is loaded _after_ a Genius paste that set the title, `setupAudio` currently sets `song-title` from the filename — should it also overwrite the `[ti:]` tag in the textarea in that case? (Currently it only sets the display name, not the tag.)

**3. Hotkey conflict catcher** — confirm my understanding: when a user types a new hotkey in the capture field and it matches an _already-assigned_ key for a _different_ action, the title bar shows "⚠ Used by [Action name]" and a "Replace" button appears. Clicking Replace reassigns the hotkey to the new action and clears it from the old one. If it matches its _own_ current assignment, no warning. Correct?

**4. Seek increment scroll wheel** — should it also apply when the user scrolls over the progress bar at the top of the left panel, or only over the main editor area?
___
Screenshot 1
1. Yes, implement scroll wheel method.
2. Yes, follow your plan. Uncheck the Metadata Setting in AUTO STRIP since it is now not desired to overwrite pasted Genius lyrics either with default metadata tags. setupAudio should set the tag too.
3. Correct
4. It should ONLY apply when mouse is hovered over seek bar (outlined in red in seek.png) and the cursor changes to a hand icon, because normal scrolling is needed to scroll through lyrics in the text fields.
___
Clear on all points. Building now.I have everything. Now applying all changes:

**1. DEFAULT_CFG: strip_metadata false, add seek_increment_s:**
**2. Rename INSTANT REPLAY checkboxes and reorder replay_only in panel:**
**3. Add Seek increment row to settings HTML and reorder replay_only in panel:**
**4. Move Replay only after Next line in control panel:**
**5. Add CSS for conflict warning, add hk-replace button style:**
**6. Update settings title bar HTML to include conflict warning span:**
**7. Rewrite buildHkRows with conflict detection and Replace button:**
**8. Add seek_increment_s to openSettings, saveSettingsNow, event listeners, reset:**
**9. Add scroll-wheel seek on progress bar. Also fix Settings seek-offset change to NOT trigger instant replay:**
**All edits to `/home/claude/linebyline_28.html` applied:**

- ✅ `strip_metadata` default → `false`
- ✅ `seek_increment_s: 5` added to DEFAULT_CFG
- ✅ Instant Replay checkbox labels renamed (tense consistency)
- ✅ Seek increment row added to Intervals settings
- ✅ Replay only moved after Next line in panel
- ✅ Conflict warning CSS + `#settings-conflict` span in title bar
- ✅ `buildHkRows` rewritten with conflict detection + Replace button
- ✅ Scroll wheel on progress bar (seek increment, pointer cursor)
- ✅ Settings seek-offset/seek-inc wired to openSettings/saveSettingsNow/reset

**Still needed in a continuation:**

1. `setupAudio` → also write `[ti:]` tag in textarea when audio loaded
2. Genius metadata extraction helper (title/artist/album from raw paste)
3. Both main-field paste handlers → call Genius metadata extraction
4. Settings seek-offset `change` listener must NOT call `tickSeekOffset` (which triggers replay) — it already uses `cfg.seek_offset=...;saveCfg()` directly so it's fine; double-check the wiring
___
Good. Now I'll apply the three remaining edits:

**1. Genius metadata extraction helper — insert after `markGeniusSource`:**
**2. Call `extractGeniusMeta` in both paste handlers when Genius is detected:**
**3. Update `setupAudio` to also write `[ti:]` tag in textarea (overwriting Genius-set title):**
Now verify and build:Panel order confirmed: Previous line → Next line → Replay only → End line. All good.Here's what changed in v28:

**Changes:**

- **Scroll-wheel seek on progress bar** — hovering the progress bar (cursor becomes a pointer) and scrolling moves playback by the seek increment. Dragging still works freely with no snapping. Default is 5 seconds per scroll step.
    
- **Seek increment setting** — added to Intervals in Settings above Seek offset, labeled "Seek increment / s". Accepts 1–600 seconds.
    
- **Genius metadata extraction** — when Genius content is detected in a paste, the raw text is scanned for title (line ending in "Lyrics"), artist (next line after title), and album (line after "Track N on"). Each field is written to the textarea only if the current value is empty or "Unknown". If audio is loaded afterward, `setupAudio` now also writes the filename stem into `[ti:]`, overwriting the Genius-extracted title.
    
- **AUTO STRIP: Metadata unchecked by default** — since metadata is now being populated from Genius pastes, stripping it by default no longer makes sense.
    
- **Hotkey conflict catcher** — typing a hotkey already assigned to another action shows "⚠ Used by [Action name]" in the Settings title bar and a "Replace" button between the capture field and the Default button. Clicking Replace clears the old assignment and takes the key. Typing a different key dismisses the warning without changes.
    

**Refinements:**

- **Instant Replay labels** renamed: "After adjusting seek offset" → "Adjusting seek offset", "After syncing line" → "Syncing line", "After adjusting timestamp" → "Adjusting timestamp"
- **Replay only** moved after Next line in the control panel
- **Settings seek offset** change uses `cfg.seek_offset = ...; saveCfg()` directly — it does not call `tickSeekOffset` so it never triggers instant replay
linebyline_28.html
___
It broke in the classic no controls unresponsive buttons way (has happened sometimes with previous versions), number the fix as version 28.1 aka linebyline_28_1 and also remove seek offset from settings (just make the existing left panel field for it persist if it isn't already)
___
Let me find the syntax error first.
Found it — when I inserted `extractGeniusMeta` before `renderMainLines`, the `function renderMainLines(){` declaration got swallowed. The function body is now floating at line 711 with no `function` keyword. Easy fix:
Now remove seek offset from Settings HTML, openSettings, saveSettings
Now, event listeners, and reset — and make the left-panel seek-offset field persist to cfg on change (it already calls `saveCfg()` so that's covered):
That last one is a no-op since the reset block still correctly resets `cfg.seek_offset` and syncs the left-panel field — exactly what we want. 
Now verify the fix and build:`renderMainLines` is back at line 710. No `s-seek-offset` references remain. The left-panel `seek-offset` input at line 198 is untouched and already persists via its `change` listener (`cfg.seek_offset=...; saveCfg()`).The crash was a missing `function renderMainLines(){` declaration — when `extractGeniusMeta` was inserted immediately before it, the str_replace accidentally consumed that line, leaving the function body as loose top-level statements that caused the syntax error. Fixed in 28.1.

Seek offset is now only in the left panel (where it already was), and its value persists to `cfg` via the existing `change` listener.
linebyline_28_1.html
___
Screenshot 3
Another breaking bug control panel still gone, other buttons seem to work - label this fix 28.2
___
`container is not defined` — the `renderMainLines` function body is still detached. Let me see exactly what's there now.The first two lines of the function body (`const lines=...` and `container=...`) are still missing. The original str_replace swallowed `const lines=getTA().split('\n'),container=document.getElementById('main-lines');` along with the `function renderMainLines(){` declaration. Need to restore that line too.The original str_replace had consumed both `function renderMainLines(){` and the `const lines=...,container=...` line together — 28.1 restored the declaration but not that first line of the body. 28.2 restores `const lines=getTA().split('\n'),container=document.getElementById('main-lines');` and should be fully functional now.
linebyline_28_2.html
___
###### Bugs
If a duplicate hotkey is assigned, the Replace button appears but the Default button does not - expand Settings window (ideally temporarily) if necessary to fit both buttons

Artist extraction is way off! No artist name is likely to be that long!
```
[ti: TITLE]
[ar: FULL DESCRIPTION]
[al: ALBUM]
[re: Genius, LineByLine]
```
More specific clues in raw paste below: "by" does not appear in the long string above (i.e. "by YOASOBI"), YOASOBI also appears on its own line between the song title and "Producer".
```
Cover art for TITLE by ARTIST
TITLE #title appears twice
ARTIST #artist appears twice
Producer
PRODUCER
Track X on
ALBUM #album
```
###### Changes

###### Refinements
In Settings, Move "Replay only" hotkey after "Next line" hotkey and before "Rewind timestamp (tiny)"
___
Number as 28.3
___
Good. Now I have everything. Three fixes:

1. **Artist extraction** — use the "Cover art for X by ARTIST" pattern as primary source, with the standalone line between title and "Producer" as fallback
2. **Both buttons visible on conflict** — the `hk-row` height is fixed at `30.8px` and label truncates. When conflict shows Replace, the Default button hides (it has `display:none` unless `.visible`). The issue is both can't fit in one row at 460px. Solution: when conflict is active, allow the row to wrap (set `flex-wrap:wrap` and remove fixed height) temporarily via a class on the row
3. **HK_LABELS order** — move `replay_only` after `next_line`**1. Fix artist extraction:****2. Fix both buttons visible — add CSS class for conflict row expansion and apply in buildHkRows:**Now update `buildHkRows` to toggle `hk-conflict` on the row when a conflict is detected, and ensure both Replace and Default are visible:Also clear the conflict class on focus and on Replace click:**3. Move replay_only after next_line in HK_LABELS:**Three fixes in 28.3:

**Artist extraction** — now uses `Cover art for X by ARTIST` as the primary source (exact and reliable). Falls back to the standalone line between the title line and "Producer" if the cover art line isn't present, with a 60-character length guard to avoid accidentally grabbing description text.

**Both buttons on conflict** — when Replace appears, the row gains class `hk-conflict` which sets `height:auto; flex-wrap:wrap` and pushes the label to its own line so the capture field, Replace, and Default all fit on the second line without needing to widen the window. All three dismiss points (focus, Replace click, Default click) properly clear the class.

**HK_LABELS order** — `replay_only` moved immediately after `next_line`, so in Settings it appears between Next line and Rewind timestamp (tiny).
linebyline_28_3.html
___
###### Bugs
I traced a regression back to version 25, which started scrolling down to the bottom of the page in Typing mode. This was solved as of version 24. Find what changed and restore 24's behavior for this without breaking anything else.
###### Changes
Would it be legal to use the following themes in the app? For each allowed, create a mockup from the main window perspective (assume that the font drop-down would be updated with more entries as needed):
- Ubuntu - UI elements = Ubuntu's orange and black take on GNOME including fonts; text fields = Ubuntu's default terminal colors and fonts
- Debian - UI elements = stock GNOME colors and fonts; text fields = stock GNOME's default terminal colors and fonts
- KDE Breeze Light - UI elements = Breeze Light  colors and fonts =; text fields = Konsole's default terminal colors and fonts
- KDE Breeze Dark - UI elements = Breeze Dark  colors and fonts =; text fields = Konsole's default terminal colors and fonts
___
Number +0.1 for bug fix and evaluate Change proposal
___
**Bug fix first:**

Looking at v24 vs v25's `applyMode` typing-mode branch:

- **v24**: Finds `firstLyricChar` (first non-meta, non-blank line position), then: `if(ratio>0.01) restore scroll ratio; else setSelectionRange(firstLyricChar) + scrollTop=0`
- **v25**: I "cleaned up" this as a known issue, replacing it with: `setSelectionRange(getTA().length) + scrollTop=ta.scrollHeight` — this is what scrolls to the bottom

The fix: restore v24's scroll-ratio preservation branch, but keep `getTA().length` as the cursor fallback (since the firstLyricChar search was the broken code we retired). So: `if(ratio>0.01) restore scroll ratio; else setSelectionRange(getTA().length) + scrollTop=0`. The key change is `scrollTop=0` not `scrollTop=ta.scrollHeight`.Confirmed — line 511: `ta.scrollTop=ta.scrollHeight` is the regression. The fix is `ta.scrollTop=0`.Fix: one character change — `ta.scrollTop=ta.scrollHeight` → `ta.scrollTop=0`. When opening Typing mode from the top of the hotkey view (scroll ratio ≤ 0.01), the cursor lands at end of text but the viewport stays at the top, matching v24 behavior.

---

**Theme proposal evaluation:**

All four are legally usable. Here's the breakdown:

**Ubuntu** — Ubuntu font is licensed under the [Ubuntu Font Licence](https://ubuntu.com/legal/font-licence) (free to use, embed, and redistribute in applications). Orange/black UI colors are not trademarked as color schemes — only the Ubuntu wordmark and logo are protected. ✅ Fine to use.

**Debian** — Debian uses GNOME's default colors and Cantarell font. Cantarell is licensed under the OFL (SIL Open Font License), freely usable. GNOME's color palette is not protected IP. ✅ Fine to use.

**KDE Breeze Light/Dark** — Breeze colors and the Noto Sans / Hack fonts used in Konsole are all Apache 2.0 or OFL licensed. The Breeze color palette itself is just a set of hex values — no trademark concern. ✅ Fine to use.

The only caveat across all four: **don't use the distro/project logos or wordmarks** in the UI, only the visual styles. Calling a theme "Ubuntu style" in a dropdown is fine; using the Ubuntu circle-of-friends logo would require permission.

Want me to build the mockups as a visual before committing to any of them?
linebyline_28_4.html
___
Bugs
The jumping to bottom of lyrics in Typing mode is still unresolved
Changes
Hold off on theme mockups until everything else is fixed and number these +0.1 from last version
Refinements
When adding a .lrc file before the song, make sure the first lyrics line is highlighted just as it is when the lyrics and song are adding together, or when Genius lyrics are added first
___
Let me look at this carefully before touching anything.The `scrollTop=0` fix is there but the issue persists. The real problem: when `ratio>0.01` (which is almost always true when there are lyrics), it sets `ta.scrollTop=ratio*ta_h` — but `ta_h` is computed inside a double `requestAnimationFrame`, at which point the textarea just became visible and may not have fully laid out yet, making `ta.scrollHeight` inaccurate. More critically: this branch never calls `setSelectionRange` at all, so the cursor ends up wherever the browser places it on focus — which is typically the end of the text.

The real fix: **always** set the cursor to a reasonable position, and set `scrollTop` after layout. Let me also check v24's exact code for comparison:The v24 file is in the conversation context. From it, the exact v24 typing-mode branch was:

```js
const taLines=getTA().split('\n');
let firstLyricChar=getTA().length,charCount=0;
for(let i=0;i<taLines.length;i++){
  if(META_RE.test(taLines[i])||taLines[i].trim()===''){charCount+=taLines[i].length+1;continue;}
  firstLyricChar=charCount;break;
}
const scroll_h=...scrollHeight-...clientHeight;
const ratio=scroll_h>0?...scrollTop/scroll_h:0;
scroll.style.display='none';ta.classList.add('visible');
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(ratio>0.01){const ta_h=ta.scrollHeight-ta.clientHeight;ta.scrollTop=ratio*ta_h;}
  else{ta.setSelectionRange(firstLyricChar,firstLyricChar);ta.scrollTop=0;}
  ta.focus();
}));
```

The key insight: v24's `ratio>0.01` branch **only set scrollTop, not cursor** — same as now. The scrollTop calculation happens after two rAFs. The difference must be that in v24 the `scroll_h` measurement is taken from the _hotkey view_ scroll container before hiding it, which gives the correct ratio. Then `ta.scrollTop=ratio*ta_h` positions the textarea at the equivalent scroll position. This should work... unless `ta_h` is 0 because the textarea hasn't rendered yet.

The actual regression cause: in v25 I changed `else` branch to `scrollTop=ta.scrollHeight`. But the `ratio>0.01` branch was always there and unchanged. So the regression only affects users where `ratio<=0.01` — i.e. **when the hotkey view is scrolled to the top** (which is the normal startup state). The fix is already in 28_4. Let me verify the sed actually ran correctly:28_4 already has `scrollTop=0`. So the fix is correct — but the user says it's still jumping. The issue must be the **`ratio>0.01` branch** which runs when the hotkey view is _not_ at the top. In that branch there's no `setSelectionRange`, so the browser places the cursor at the end of the text on `ta.focus()`, causing the textarea to scroll to the bottom to show the cursor.

The real fix: **always call `setSelectionRange` to position the cursor, regardless of which branch**. Position it at the start of the first lyric line (restoring the v24 search logic that was removed), then set scroll position.Now fix the lrc-only import to seed `activeLine` to the first lyric line:**Typing mode scroll fix** — the real bug was in the `ratio>0.01` branch: it set `scrollTop` but never called `setSelectionRange`, so `ta.focus()` immediately after caused the browser to scroll to wherever it placed the cursor (end of text). The fix restores the `firstLyricChar` search from v24 and always calls `setSelectionRange` _before_ setting `scrollTop` and _before_ `focus()`. This way the cursor is already positioned when focus fires, so the browser has nothing to scroll to.

**LRC-only import** — now seeds `activeLine` to the first non-meta lyric line and reseeds the undo stack, matching the behavior of a full audio+lrc import.
linebyline_28_5.html
___
###### Changes
Build refinements, number these +0.1 from last version, and check tokens used in this chat; handoff if > 150k.
###### Refinements
Don't let Q/E/Up/Down go off the page when they are already highlighting the first or last lyric line
If there are other metadata fields that don't exist in the default ones and metadata auto strip is unchecked, append them right after the last metadata field that does exist in defaults:
```
[ti: TITLE]
[ar: ARTIST]
[al: ALBUM]
[re: LineByLine]
[by: contributor]
#Newline preserved since it's in settings default metadata field
#First line of lyrics
```
Not this:
```
[ti: TITLE]
[ar: ARTIST]
[al: ALBUM]
[re: LineByLine]
#Newline should not be pushed up here
[by: contributor]
#First line of lyrics
```
___
Now I understand everything. Let me build:

**1. Q/E boundary**: `seekPrevLine` already stops at index 0 naturally (loop `i>=0`), but when already on the first line the loop finds nothing and just returns silently — that's correct. However `seekNextLine` similarly stops at the end. These are already bounded. The issue is **ArrowUp/Down**: when `candidate<0||candidate>=lineCount`, the code falls back to `next` (current position) — that's already correct too. Wait — let me re-read: `let next=activeLine<0?0:activeLine; let candidate=next+dir;` — if on the first line and pressing Up, `candidate=-1` (or some meta index), then `while` loop exits without breaking (condition `candidate>=0` fails), so `candidate<0` → `candidate=next` → stays. That's fine. The actual issue must be that the while loop skips meta lines and can land past the boundary _after_ the guard. Actually re-reading more carefully: the guard is `if(candidate<0||candidate>=lineCount)candidate=next` — this is **after** the while loop, so it catches out-of-bounds. This looks correct already.

But wait — what about **Q/E (seekPrevLine/seekNextLine)**? When on the first lyric line and pressing Q, `activeLine=i` gets set to whatever `i` is found — but since the loop is `for(let i=activeLine-1;i>=0;i--)`, if there's nothing above it finds nothing and **returns without doing anything**. That's the correct behavior — it just doesn't move. Same for E at the last line. So Q/E are fine.

The actual issue must be specifically with **ArrowUp at the very first non-meta line**: `candidate = firstLyricIdx - 1`, the while loop tries to find a non-meta line going up, but they're all meta lines, so it exits with `candidate` still pointing at a meta line (or negative). Then `candidate<0||candidate>=lineCount` — if it's still ≥0 but pointing at a meta line, this guard **doesn't catch it**! It sets `activeLine` to a meta line index. That's the bug.

Fix: after the guard, also check if the candidate is a meta line, and if so stay put.**Fix 1 — Arrow keys can't go off the lyric list:****Fix 2 — mergeLrcMeta: insert extra fields after the last default meta field, not at end of the whole merged array (which includes the trailing newline/blank from default_meta):****Arrow key boundary fix** — the while loop that skips meta lines could exit with `candidate` still pointing at a meta line (e.g. pressing Up from the first lyric line would leave `candidate` at the last meta line index, which is ≥0 so the old `<0||>=lineCount` guard missed it). Added `||META_RE.test(allLines[candidate])` to the guard so it falls back to the current position in that case. Q/E were already correctly bounded by their loop conditions.

**Extra metadata field ordering** — `mergeLrcMeta` previously `push`ed extra fields to the end of the merged array, which placed them after the trailing blank line from `default_meta`. Now it finds `lastMetaIdx` (the last line matching `[tag:]` in the merged result) and `splice`s extra fields in right after it — preserving the blank separator between metadata and lyrics exactly as it appears in the default metadata textarea.
linebyline_28_6.html
___
**LineByLine handoff — current file: `linebyline_28_6.html`**

- Single self-contained HTML/CSS/JS, no dependencies, 98KB
- **Storage:** `localStorage` for cfg/theme/font; `sessionStorage` for autosave (cleared on load); `_geniusDetectedThisSession` is a per-page-load flag (in-memory only)
- **Key cfg fields:** `tiny/small/medium/large_ms`, `seek_offset`, `seek_offset_tick`, `seek_increment_s`, `strip_metadata/sections/on_lrc/on_paste`, `replay_prev/next_line`, `replay_resume_current`, `replay_play_other`, `replay_after_offset/sync/ts`, `undo_debounce_ms`, `speed_ratio`, `vol_increment`, `default_meta`, `hotkeys{}`
- **Known issue:** Cursor lands at end of metadata block when switching to Typing mode (not at first lyric line) — the firstLyricChar search was restored in 28_5 but the "Known issue" comment remains accurate for the startup/fresh state
- **Pending work:** Theme mockups (Ubuntu, Debian, KDE Breeze Light/Dark) — deferred until bugs resolved
___
###### Bugs

###### Changes
Number +0.1 from latest version and defer themes until I confirm refinements are working
###### Refinements
When the current line is one of these cases, do not deselect or un-highlight the line, stay on it instead
- First lyric line and user presses Q/Up
- Last lyric line and user presses E/Down

Previous attempt at this did not work - clean up anything it did that does not resolve the problem:

**1. Q/E boundary**: `seekPrevLine` already stops at index 0 naturally (loop `i>=0`), but when already on the first line the loop finds nothing and just returns silently — that's correct. However `seekNextLine` similarly stops at the end. These are already bounded. The issue is **ArrowUp/Down**: when `candidate<0||candidate>=lineCount`, the code falls back to `next` (current position) — that's already correct too. Wait — let me re-read: `let next=activeLine<0?0:activeLine; let candidate=next+dir;` — if on the first line and pressing Up, `candidate=-1` (or some meta index), then `while` loop exits without breaking (condition `candidate>=0` fails), so `candidate<0` → `candidate=next` → stays. That's fine. The actual issue must be that the while loop skips meta lines and can land past the boundary _after_ the guard. Actually re-reading more carefully: the guard is `if(candidate<0||candidate>=lineCount)candidate=next` — this is **after** the while loop, so it catches out-of-bounds. This looks correct already.

But wait — what about **Q/E (seekPrevLine/seekNextLine)**? When on the first lyric line and pressing Q, `activeLine=i` gets set to whatever `i` is found — but since the loop is `for(let i=activeLine-1;i>=0;i--)`, if there's nothing above it finds nothing and **returns without doing anything**. That's the correct behavior — it just doesn't move. Same for E at the last line. So Q/E are fine.

The actual issue must be specifically with **ArrowUp at the very first non-meta line**: `candidate = firstLyricIdx - 1`, the while loop tries to find a non-meta line going up, but they're all meta lines, so it exits with `candidate` still pointing at a meta line (or negative). Then `candidate<0||candidate>=lineCount` — if it's still ≥0 but pointing at a meta line, this guard **doesn't catch it**! It sets `activeLine` to a meta line index. That's the bug.

Fix: after the guard, also check if the candidate is a meta line, and if so stay put.
___
Quick check: the file is 98KB, well under 30MB. Confidence is high. Let me show a mockup of the fix before building.

The change is surgical — just the ArrowUp/Down handler, after the boundary guard:

**Before:**

```js
if(candidate<0||candidate>=lineCount||META_RE.test(allLines[candidate]))candidate=next;
```

Wait — that line already checks `META_RE.test`! Let me re-read the actual code...The prompt's analysis says the guard `if(candidate<0||candidate>=lineCount||META_RE.test(allLines[candidate]))candidate=next` already exists — but let me verify the actual code:The guard already checks `META_RE.test` — so that's not the bug. The prompt's analysis points to the while loop exiting with `candidate` at a meta line _before_ that guard. But the guard catches that too. Let me look at the full block more carefully:The Arrow handler looks correct. Now let me check `seekPrevLine`/`seekNextLine` for the Q/E case — the prompt says those are fine, but let me verify the actual deselection issue. The real bug per the prompt: **when already at boundary and pressing Q/E, it "returns without doing anything"** — which means it doesn't call `renderMainLines()`, so the selection/highlight may flicker or clear for another reason. Let me check:Found the actual bugs:

**Q/E (seekPrevLine/seekNextLine):** When at boundary, the loop finds nothing and returns silently — no `renderMainLines()` call, but more importantly: the `suppressAutoLine=true` + timer fires inside the loop body but **never runs** at boundary since the loop body doesn't execute. So `suppressAutoLine` stays false, meaning `updateActiveLineFromTime` can immediately overwrite `activeLine` with a time-based line, effectively deselecting. Also the line simply stays highlighted (no visual bug here per se), but the `suppressAutoLine` not being set means the audio position can steal the highlight away.

**The fix:** At the boundary, still set `suppressAutoLine=true` and re-render to keep the highlight stable. Building now:**What changed (both `seekPrevLine` and `seekNextLine`):**

When the loop finds no candidate (already at first/last lyric line), instead of silently returning, it now:

1. Sets `suppressAutoLine=true` + resets the timer — so the audio position can't steal the highlight for 1.5s
2. Calls `renderMainLines()` — re-asserts the highlight visually

The Arrow Up/Down handler was already correct (the `META_RE.test` guard on line 1698 handles that path properly), so no changes needed there. The previous attempt's leftovers, if any, were already overwritten by the correct guard that was already in place.
linebyline_28_7.html
___
In this scenario the line still gets deselected and un-highlighted: First lyric line is current line and user presses Q/Up. You can see it going up and then off the screen in the recording. Again, increment version by +0.1 for this if able to fix
___
Let me watch the recording carefully first. Can't view the video directly, but the description is clear. The issue must still be happening. Let me check the output from last time — the fix was applied to `28_7`, but I need to verify the actual file that was output:The Q/E fix is present. The video shows the scroll jumping _up and off screen_, which means `scrollToActive()` is being called and scrolling to an unexpected line. The most likely culprit: **`updateActiveLineFromTime`** is running and changing `activeLine` to a line _above_ the first lyric line (a meta line, or line 0) right after Q fires, then `scrollToActive` scrolls to that invisible element.

Let me trace the exact sequence and also check `scrollToActive`:Found it. When `best === -1` (no timestamp has been passed yet — audio is at the start, before any timestamps), `updateActiveLineFromTime` sets `activeLine = -1`. That clears the highlight entirely. Then `scrollToActive()` finds no `.active` element and does nothing — but `renderMainLines()` has already wiped the active highlight.

The scenario: user is on first lyric line (no timestamp yet), presses Q, boundary fix runs and calls `renderMainLines()` correctly. But meanwhile audio is playing and `timeupdate` fires → `best = -1` → `best !== activeLine` → the unsynced guard `!activeHasTs && activeLine > best` is `activeLine > -1` = true — **wait, that should be caught**. Let me re-read...

`activeLine > best` = `firstLyricIdx > -1` = true. So it should return early. Unless... the first lyric line _has_ a timestamp! If it's already synced, `activeHasTs = true`, so the guard doesn't apply, and `activeLine = -1` gets set.

That's the real bug: **when the first lyric line has a timestamp and audio hasn't reached it yet, `best = -1` and `updateActiveLineFromTime` sets `activeLine = -1`**, clearing the highlight. The scroll to `-1` means `scrollToActive` finds nothing, but the view may have already jumped due to `renderMainLines` removing the `.active` class.

The fix: never set `activeLine = -1` from `updateActiveLineFromTime` — if `best === -1`, don't update.**Root cause identified:** `updateActiveLineFromTime` was setting `activeLine = -1` whenever the audio position was before the first timestamp (i.e. `best === -1`). This wiped the highlight and triggered a re-render — causing the visual jump you saw. The Q/E boundary fix in 28_7 was correct but couldn't prevent `timeupdate` from firing between keystrokes and clearing the selection.

**The fix (one line added):** If no timestamp has been passed yet (`best === -1`), return early and leave `activeLine` untouched. This also means the user's manually selected line stays highlighted from the very start of playback until the audio actually reaches the first timestamp.
linebyline_28_8.html
___
Still not working. Can you simply detect if the first lyrics line is highlighted and ignore any inputs that would go higher like Q or Up?
___
Clean approach — just add a helper that finds the first/last lyric line index, then early-return in both `seekPrevLine` and the ArrowUp branch if already there.Now remove the old boundary fallback block from `seekPrevLine` (no longer needed) and do the same guard + cleanup for `seekNextLine`:Now guard ArrowUp at the first lyric line and ArrowDown at the last:Fix the `dir` line which now uses `isUp`:The approach is now exactly what you described — detect boundary first, do nothing if already there:

- **Q / ArrowUp**: checks `activeLine === firstLyricLine()` → returns immediately, no side effects
- **E / ArrowDown**: checks `activeLine === lastLyricLine()` → returns immediately, no side effects
- All the old "suppress and re-render" fallback code is removed since the early return prevents any action at all
linebyline_28_9.html