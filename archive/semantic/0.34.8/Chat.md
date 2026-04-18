See images.zip for images referenced below
Version
Minor
Bugs

* Pressing `Enter` in main window playback speed or seek offset fields syncs line instead of updating the field. Workaround by clicking outside to update fields instead.
* Deleting trailing timestamp does not show warning (deltrailingnowarn.png)
* Merge fields button is not grayed out when:
   * The main field final trailing timestamp is deleted/missing (deltrailingmerge.png). Clicking it grays it out.
   * The main lyrics have no timestamps (notimemerge.png). Clicking it triggers popup but does not gray it out when popup is closed (notimemergepopup.png). Deprecate the popup and instead fix the warnings under the Main/Secondary titlebars
   * The main lyrics lines don't match secondary lines either from deletion or at import time (mismatchmainmerge.png). This one is not a visual bug - merging fields is actually allowed despite the warning!
      * The only case where Merge fields is grayed out as expected is if secondary lines don't match main (mismatchsecmerge.png)
Refinements

* Increase reach of left panel scroll bar that appears when the screen is too small, like a phone. desktop.png shows Windows LibreWolf view. landing.jpg shows Android Chrome view; scrolldown.jpg as far down as it can go; scrollright.jpg as far right as it can go. I can't scroll all the way down and would have to rotate phone into portrait mode to show bottom Controls.
* Add a collapse button (panel-left.svg) for the left panel in the same row as "NOW PLAYING" and right-justified (closer to "MAIN" than to "NOW PLAYING"). If possible, auto-collapse if the left panel takes up too much horizontal space (i.e. in phone portrait mode)

---

**Bugs fixed:**

**Enter in speed/seek fields** — Added `keydown` listeners on `#speed-val` and `#seek-offset` that call `e.stopPropagation()` and `e.target.blur()` on Enter, so the global keydown handler (which would fire `syncLine`) never sees it. Blur triggers the existing `change` handler to commit the value.

**Merge fields button not graying out correctly** — Two root causes: (1) `updateMergeBtn()` was not called from the main textarea `input` event handler, so edits to the main field (deleting lines or timestamps) never re-evaluated the button state. Added `updateMergeBtn()` to that handler. (2) `updateMergeBtn` itself had no checks for whether timestamps or a trailing timestamp exist — it only checked line count parity. Rewrote it to also require `hasTs` (at least one non-trailing content timestamp) and `hasTrailingTimestamp()` before enabling the button. This covers the no-timestamps case, the deleted-trailing-ts case, and removes the need for the `alert()` popup path (left in as a dead-code safety net). The `mismatchmainmerge` case (editing main to have fewer lines than secondary) is now also caught because `updateMergeBtn` fires on every main field edit.

**Left panel on mobile** — Changed `height: 100vh` to `height: 100vh; height: 100dvh` (dynamic viewport height fallback) so the layout respects mobile browser chrome. Added a collapse button (your `panel-left.svg`) in the Now Playing header row, right-aligned. A matching expand button appears as a slim strip on the left edge of the editor area when the panel is collapsed. State persists to `localStorage`. Auto-collapses on load (and on resize) when viewport width is under 640px (portrait phone).

---
