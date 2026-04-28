# LineByLine 0.35.13

## Turn 1

**Prompt (Patch):**

Navigation and clicking another line normally highlight it. When these are tied to Settings/Instant Replay triggers (Moving to previous line, Moving to next line, Playing another line), there is no highlighter shift to indicate when the starting timestamp plays for a line - because that line is already highlighted. Fix this systematically by changing the highlighter to distinguish between selected lines and actively playing line:
1. Indicate the actively playing line with the same highlighter. But don't move it in response to navigation like Q/E/↑/↓ anymore, otherwise same logic.
2. Indicate all currently user-selected lines independently of the highlighter with these qualities in both light and dark modes (see screenshots)
   1. Visually distinct from the highlighter
   2. Visually distinct from unselected + unhighlighted text
   3. Recognizable for color-blind/vision-impaired users
   4. Fitting the overall look of LineByLine
3. Some suggestions for 2: Arrow overlay right, Arrow overlay left, Underline overlay, Something else

---

Split `activeLine` (navigation cursor) from a new `playingLine` variable (audio-following highlight):

- **`activeLine`** — user's navigation cursor; moves with Q/E/↑/↓/click. Renders as `.cursor` class: left 3px accent border + subtle tinted background (dark mode only). The cursor ts span also gets the accent color.
- **`playingLine`** — tracks where audio currently is. Renders as `.active` class: existing blue highlight, unchanged visually. Moves only via `updateActiveLineFromTime` (audio time update), `syncLine`, `replayActiveLine`, `togglePlay`, and click-to-seek.
- **`.selected`** (multi-selection Set) — now renders as text-decoration underline with 3px offset. Shape-based, colorblind-safe, unambiguous against both the cursor and the active highlight.

Key changes:
- `renderMainLines`: applies `.active` to `playingLine`, `.cursor` to `activeLine`, `.selected` to `selectedLines`
- `updateActiveLineFromTime`: updates `playingLine` (not `activeLine`); uses new `scrollToPlaying()`
- `seekPrevLine`/`seekNextLine`: set `playingLine=i` only when the respective Instant Replay option is on
- `syncLine`: sets `playingLine=activeLine` before advancing the cursor
- `replayActiveLine`: sets `playingLine=activeLine`
- `togglePlay`: sets `playingLine=activeLine`
- Click-to-seek in `renderMainLines`: sets `playingLine=i`
- `applySnapshot` (undo/redo): resets `playingLine=-1`
- `loadAutosave`, import handler: reset `playingLine=-1`
- CSS: `.cursor` = left border + bg tint; `.selected` = underline; removed old outline/bg from `.selected`
- SECTIONS index updated for shifted line numbers

---

## Turn 2

**Prompt (Same):**

Bugs: highlighter suppressed on the line the left outline marks. (1) On first session open, first line marked but highlighter doesn't show unless navigating away first. (2) Navigating with arrows while paused then pressing Spacebar — highlighter stays at previous position.

---

Both bugs had the same root cause: `togglePlay` set `playingLine=activeLine` but never called `renderMainLines()`. The `.active` highlight therefore didn't appear until the next `timeupdate` event fired — which immediately hit the `if(best===playingLine)return` early-exit guard and skipped the render anyway, since `playingLine` was already correctly set.

Fix: add `renderMainLines()` at the end of the `togglePlay` play-start path, after `updatePlayBtn()`.

---

## Turn 3

**Prompt (Same):**

The line navigated to by Q, E, or Click is simultaneously marked and highlighted when Instant Replay is on. The left outline mark (cursor) should arrive offset-ms ahead of the highlight. If Seek offset=-1000ms, mark arrives 1 second before highlight. If Seek offset=1000ms, mark arrives 1 second later. Only at Seek offset=0ms should they appear simultaneously.

---

Two-part fix:

1. Removed `suppressAutoLine` guard from `updateActiveLineFromTime`. This flag was originally protecting `activeLine` from being overwritten by audio position during manual navigation — but `activeLine` and `playingLine` are now separate variables. The guard was incorrectly blocking `playingLine` from updating via audio position for 1.5 seconds after every navigation, which prevented the offset-timed highlight from ever arriving naturally.

2. Removed eager `playingLine=i` assignments from `seekPrevLine` and `seekNextLine`. Previously both functions set `playingLine=i` immediately alongside `activeLine=i`, making them appear simultaneously. Now `playingLine` is updated solely by `updateActiveLineFromTime` as audio progresses through time — so when audio is seeked to `lineTs + offset` (e.g. 600ms early), the cursor (`.cursor`) appears immediately on navigation, and the highlight (`.active`) only appears once `timeupdate` reports the audio position has reached `lineTs`.

Also removed eager `playingLine=activeLine` from `replayActiveLine` for the same reason.

`syncLine`, `togglePlay`, and click-to-seek in `renderMainLines` retain their immediate `playingLine` assignments — these are cases where audio is known to be at or starting from that line's position, not offset ahead of it.

---

## Turn 4

**Prompt (Same):**

Bugs:
- Spacebar play: mark and highlight appear simultaneously rather than respecting offset separation
- Click flicker: highlight briefly appears on the clicked line before snapping back to the previous line
- Can append multiple trailing timestamps instead of just one

---

Three independent fixes:

**Bug 1 (Space simultaneous):** `togglePlay` was still doing `playingLine=activeLine` unconditionally. Now it only sets `playingLine` immediately when no offset-seek occurred (either no seek was triggered by the replay settings, or `getSeekOffset()===0`). Otherwise it leaves `playingLine` unset and lets `updateActiveLineFromTime` place the highlight when audio reaches the line's actual timestamp.

**Bug 2 (click flicker):** The click handler was setting `playingLine=i` eagerly, then `updateActiveLineFromTime` immediately fired on the next `timeupdate` event, found that audio position was still before `lineTs` (because it seeked to `lineTs + offset`, not `lineTs`), and reset `playingLine` to the previous line — causing a one-frame flicker. Removed the eager `playingLine=i` and `suppressAuto()` from the click path entirely. Click now relies on `updateActiveLineFromTime` like all other navigation. Also removed the now-pointless `suppressAuto()` on click of a non-timestamped line.

**Bug 3 (multiple trailing timestamps):** `insertEndLine` had no guard against an existing trailing timestamp — it always inserted a new bare `[mm:ss.cc]` line at `activeLine+1`. Now it first scans backwards for an existing trailing timestamp; if found, updates it in place and navigates the cursor there. Only if none exists does it insert a new one.

---

## Turn 5

**Prompt (Same):**

`T` never appends trailing timestamp, just updates the final trailing timestamp for the whole song as if it were the trailing timestamp for the selected line.

---

The Turn 4 fix was too broad: the backwards scan found the global end-of-song trailing timestamp anywhere in the file and updated it in place, ignoring `activeLine` entirely.

Fixed: `insertEndLine` now looks *forward* from `activeLine` to find the next non-blank non-meta line. If that specific next line is already a trailing timestamp, it updates it in place (cursor lands there). Otherwise it inserts a new bare timestamp at `activeLine+1` as before. This preserves the multi-append guard for the true case (pressing `T` twice on the same line) while leaving all other trailing timestamps untouched.

---

## Turn 6

**Prompt (Same):**

Turn 5 fix reverted — `T` could still spam trailing timestamps. After inserting one, `activeLine` advances to the new bare timestamp line. The next `T` press starts its forward scan at `activeLine+1` (the next lyric line), doesn't see a trailing ts there, and falls through to insert — producing another bare timestamp immediately after the first.

---

Missing case: when `activeLine` itself is already a trailing timestamp, `T` should update it in place rather than look forward and insert. Added that check as the first branch in `insertEndLine`. The three-tier logic is now:

1. `activeLine` is itself a trailing ts → update in place, no cursor move
2. The next non-blank non-meta line after `activeLine` is a trailing ts → update it in place, cursor moves there
3. Neither → insert a new trailing ts at `activeLine+1`, cursor moves there

---
