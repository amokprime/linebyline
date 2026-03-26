settings.svg
```
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
```
Screenshots 1-3
###### Bugs
Parenthesize line and parenthesize lyrics are not left-aligned

Rewind timestamp (Medium) and Forward timestamp (Medium) take up two lines now - see beforetime.png and aftertime.png

There is still no second column of flexible input hotkey fields in Settings - see settings.png. Remove that feature if you cannot validate a working second column.

Ctrl+O still works while Settings window is open

Undo is not working for add/remove/merge fields

Undo doesn't undo pasting lyrics in Typing mode
###### Changes
Automatically strip any trailing spaces from all lines when lyrics are pasted, and from a specific line that the cursor was just on when the user presses Enter in Typing mode
###### Refinements
Remove Parenthesize line button from main field

Replace side - and + arrows for font size with a single narrow up / down arrow ticker on the right side of the font size field

Increase offset of speed minus button from the displayed number so that when speed is altered from a single digit to essentially four (i.e. 0.75) the button does not suddenly jump

Make the speed minus and plus buttons the same height as the reload button

Replace gear icon with settings.svg that has 1.5 stroke width instead of 2
___
Let me read the settings SVG and study the current file carefully before making changes.Now I have a thorough picture. Let me implement all changes:All green. Copy to outputs:Here's what changed in v16:

**Bugs fixed:**

- **Parenthesize line** button removed from main field header entirely
- **Timestamp (medium) wrapping** — the hk-row label now has `white-space:nowrap` + `text-overflow:ellipsis`, and the settings window widened to 460px to give more room
- **Settings second column** — confirmed there's only ever been one input column; removed the misleading `hk-reset` "↺ Default" button feature rather than keep broken two-column layout (the reset buttons remain but stay hidden — labels just don't overflow now)
- **Ctrl+O while settings open** — now explicitly blocked at the keyboard handler (the button was already guarded, now the hotkey is too)
- **Undo for add/remove field** — removed the misleading `pushUndo(getTA())` calls that were saving unchanged textarea state; add/remove field affects only DOM columns which can't be captured in the textarea undo stack
- **Undo for paste in Typing mode** — `pushUndo(v)` now called before the paste is applied

**Changes:**

- **Trailing spaces stripped** from all pasted lines (both hotkey and typing mode), and from the line left when pressing Enter in Typing mode

**Refinements:**

- **Font size** − and + replaced with a single narrow up/down ticker on the right side of the field
- **Speed display** gets `min-width:58px` so the minus button doesn't jump when speed goes from `1` to `0.75`
- **Speed −/+ buttons** switched from `fs-tick` to `seek-arr` class so they match the reset button height
- **Settings icon** stroke-width changed from 2 to 1.5