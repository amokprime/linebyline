---
### Version 
Patch
### Bugs
- Case 4: Steadily syncing main plain lyrics does not update Merge fields button
	1. User adds main audio and then plain lyrics separately or together
	2. User adds secondary plain lyrics
	3. User syncs all lines in main field
	4. The Merge fields button stays grayed out, but Ctrl+6 works
- Case 5: Merging fields does not check for timestamps in ALL main lyrics lines
	1. Steps 1 and 2 from Case 4
	2. User syncs just the first line in main field
	3. User presses Ctrl+6 even though the button is grayed out. See code blocked examples of what ensues with plain English + French lyrics. Intercept Ctrl+6 with popup warning if not all lines in main field have timestamps, and add a clarifying warning in secondary field to inform users why Merge fields is disabled.
### Refinements
- Make the collapse panel button a bar again like 0.34.8 while keeping the icon at its expected height - the vertical bar is much easier to tap on a phone than a small button.

---

**Case 4 - sync doesn't update Merge button:** `setMainText()` was calling `renderMainLines(); checkLineCounts()` but not `updateMergeBtn()`. Since every hotkey-mode sync goes through `setMainText`, adding `updateMergeBtn()` there covers all sync paths in one place and fixes the stale button state.

**Case 5 - partial-timestamp merge:** Added `allLyricLinesHaveTs()` helper that checks every non-meta, non-trailing lyric line has a timestamp. This gates `updateMergeBtn` (button stays gray until all lines are synced) and `mergeTranslations` (early-return `alert` intercepts the `Ctrl+6` hotkey path when the button is disabled). Secondary field warn bar now also shows "Not all main lines have timestamps yet" as a new priority-3 message (below mismatch and missing-trailing-ts), so users know exactly why Merge is still disabled mid-sync.

**Expand bar:** Reverted `#btn-expand-panel` to `height:100%` (full-height bar, as in 0.34.8), removing the `align-self:flex-start` and fixed-height from 0.34.9. The SVG icon stays 16×16 and centers in the bar naturally via flex.

---
