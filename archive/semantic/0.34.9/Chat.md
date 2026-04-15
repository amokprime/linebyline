Version
You versioned '###Version\nPatch' with minor pattern last time (it was supposed to be 0.34.8 but was versioned as 0.35.0 instead). Was it because I pasted the prompt directly instead of uploading Prompt.md or unclear instructions? Are the updated instructions clear enough now that you would interpret "Patch" as 0.34.9 (i.e. 0.34.8 current -> 0.34.9) without this specific sentence?
Bugs (image filenames match case sub-numbers)

* Case 1: Deleting solo trailing timestamp in Typing mode does not show warning
   1. Audio and then unsynced (plain) main lyrics are added together or separately, generating a single final trailing timestamp.
   2. User removes that timestamp (i.e. select in Typing mode and hit Backspace)
   3. No yellow warning appears (it would if synced lyrics were added). This is inconsequential by itself as such a main lyrics cannot be merged anyway. But it does raise the question of how useful such an early trailing timestamp even is. I originally requested it be added at lyric add time because I thought it might be easier for you to build. It would actually make more sense to add it after the first real timestamp is added by the user (i.e. when they sync a line) and before the trailing timestamp warning would be triggered.
* Case 2: Synced -> unsynced main lyric replacement does not update Merge fields button:
   1. Audio and synced lyrics are added together or separately
   2. Plain lyrics are added to secondary field. Merge fields becomes highlighted.
   3. Plain lyrics are added to main field, replacing synced lyrics. Merge fields stays highlighted even though the only timestamp that exists is the auto-added final trailing one. So most lyric lines have no timestamp as the basis for secondary lines to offset from. This is a visual bug; clicking Merge fields grays it out.
   4. Plain lyrics are re-added to secondary field, repeating step 2. Merge fields becomes grayed out as it was supposed to do on its own in step 3.
* Case 3: Unsynced -> synced main lyric replacement does not update Merge fields button:
   1. Audio and unsynced lyrics are added together or separately
   2. Plain lyrics are added to secondary field.
   3. Synced lyrics are added to main field, replacing plain lyrics. Merge fields does not become highlighted and cannot be clicked.
   4. Plain lyrics are re-added to secondary field, repeating step 2. Merge fields becomes highlighted as it was supposed to do on its own in step 3.
* The new collapse button icon centers vertically on the expand strip when collapsed. Maintain the same vertical height.

---

**Versioning:** The mismatch happened because the prompt said "Version / Minor" and I matched that keyword to the 0.35.0 minor-bump pattern without cross-checking against the actual current file version (0.34.7 -> 0.34.8 is a patch, not a minor). The updated instructions with the explicit example "(i.e. 0.34.8 current -> 0.34.9)" are clear - I would correctly read "Patch" + current 0.34.8 as -> 0.34.9 without the clarifying sentence.

**Case 1 - trailing timestamp timing:** Removed `maybeAppendTrailingTs()` from the paste handlers (both typing-mode textarea paste and hotkey-mode lyric area paste) and from both lrc import paths. Added it to `syncLine()` instead, triggered only when this is the first content timestamp (checked by scanning lines for any existing non-trailing ts before the sync). This way the trailing ts appears exactly when it becomes meaningful - after the first real sync - and deleting it before any syncing is done simply leaves no timestamps, which needs no warning.

**Cases 2 & 3 - Merge button stale after lrc import:** Both lrc import paths (`lrcOnly` reader and `audio+lrc` reader) called `_setTA()` directly then `renderMainLines(); checkLineCounts()` but never `updateMergeBtn()`. Added `updateMergeBtn()` to both paths. Also removed the now-dead `maybeAppendTrailingTs()` calls from those paths (covered by Case 1 fix above).

**Expand strip height:** Changed `#btn-expand-panel` from `height:100%` (full editor height) to `height:28px` with `align-self:flex-start` and a small top margin, so the strip sits at the top of the editor area at the same visual height as the collapse button in the panel header.

---
