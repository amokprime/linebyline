# LineByLine 0.35.10

## Session 1 — Patch

### Prompt (Prompt.md)

**Comments:** Outdated memory: I changed /docs/linebyline.html to /docs/index.html last version

**Bugs:**
- The backtick key actually types the backtick symbol in Typing mode when held and repeats
- Pasting lyrics can be undone but not redone
- When the song is muted, scrolling over the volume slider jumps the volume from 0% to 100% (dragging the slider isn't affected)
- Settings "X" close button has no visual feedback when clicked. Remove the button as it's redundant anyway, and list any other buttons without feedback
- Clicking the first line of lyrics with timestamps (and audio loaded) is subtly broken

---

**Backtick repeat in Typing mode** — The global keydown e.repeat early-return guard skipped e.preventDefault(), so held backtick typed characters into the textarea before bubbling. Fixed by calling e.preventDefault() for toggle_mode and offset_mode_toggle even on repeat, before returning.

**Paste undo/redo** — The paste handler pushed a pre-paste snapshot, mutated the textarea, then suppressed the debounce via _pasteJustHappened. This left no post-paste snapshot on the stack, so after undoing the paste, redo would restore to pre-paste rather than post-paste. Fixed by adding a second pushSnapshot() call immediately after the paste mutation and input dispatch.

**Muted volume wheel jump** — applyVolume set slider.value = 0 when muted, so the browser's native range-wheel scroll (which can fire input alongside the custom wheel handler) read 0 as the new raw volume, bypassing masterVolume. Fixed by always setting slider.value = masterVolume; the muted state is now reflected only by the icon and the % label (which still shows 0%), not the slider thumb position.

**Settings X close button** — Removed the X button from the HTML (Escape already closes Settings). Also removed its CSS rule, event listener, and the focus-trap exclusion filter entry.

Other toolbar buttons audited — all have either :hover/:active CSS or browser-native feedback; no other removals needed.

**Click first line not seeking** — When clicking a timestamped line while audio was playing, activeLine was updated but suppressAutoLine was not set. The very next timeupdate fired updateActiveLineFromTime, which found best at the current playback position and overrode activeLine back. Fixed by setting suppressAutoLine = true (with 1500 ms timer) at the start of any timestamped-line click, matching the same pattern used by arrow-key navigation.

---

## Session 2 — Same

### Prompt (Prompt.md)

**Bugs:**
- Pasting lyrics -> undo -> redo restores [ti: ] and title in Now Playing, but not other metadata or lyrics
- Muting the song now does not move the volume slider at all — visually same position even though number reads 0%; scroll/drag show it functionally stayed at same position
- If you can detect buttons without feedback, list any that still don't have it, otherwise warn that you cannot
- Clicking the first line of lyrics is still broken (highlight bounces back; audio does not seek; workaround case broke too)

---

**Paste undo/redo (root cause)** — The fix in session 1 only addressed the textarea paste handler. The real root cause was setMainText itself: it pushed only a pre-mutation snapshot, so undo could step back but redo would restore only to the pre-mutation state (not post). This affected every call path: Hotkey-mode paste via main-lines, sync, timestamp adjustments, etc. Fixed by adding pushSnapshot() at the end of setMainText. Removed the now-redundant manual post-pushes that had been added to markAsTranslation (both branches).

**Volume slider visual + wheel** — Session 1's fix (always slider.value = masterVolume) removed the visual mute feedback on the slider thumb. Reverted to slider.value = displayVol (0 when muted) to restore the visual. The wheel jump is fixed instead by a _volWheeling flag: the wheel handler sets it true, updates masterVolume correctly, calls applyVolume, then clears the flag on the next animation frame. The input handler bails early if _volWheeling is set, preventing the browser's synthetic input event (fired by native range-scroll) from clobbering masterVolume with the stale muted value of 0.

**Click first line (root cause)** — Session 1's suppressAutoLine fix was correct but incomplete. The deeper bug: lastPlayingLine was only updated when playback was manually started (not when auto-advancing via timeupdate). So clicking back to the line that originally started playback hit isCurrentLine = true, which skipped the seek when replay_resume_current = false. Fixed by removing the isCurrentLine/replay_play_other conditional entirely from the click handler — clicks are always an explicit seek, unlike auto-advance. audioEl.currentTime is now unconditionally set to the clicked line's timestamp, and lastPlayingLine is always updated.

**Buttons without :active feedback** — btn-collapse-panel, btn-expand-panel, and s-search-kbd had :hover but no :active styles. Added filter:brightness(0.88) + transform to each. CSS gaps are detectable reliably; pixel-level rendering cannot be verified without visual output.

---

## Session 3 — Same

### Prompt

Volume slider behavior clarification:
- Mute sets slider and audio to 0%, saves pre-mute volume for restore
- Unmute (toggle) restores saved pre-mute volume
- Wheel/drag while muted unmutes and increments from 0 (not from pre-mute volume)

---

**Volume model redesign** — The prior two-variable model (masterVolume = real level, masterMuted = flag, slider shows 0 when muted) was the root cause of all volume bugs. Replaced with a single-source-of-truth model: masterVolume is always the actual volume (0 when muted). toggleMute() stores masterVolume into _preMuteVolume before zeroing, and restores it on unmute. All slider input/wheel handlers operate on masterVolume directly — since it is already 0 while muted, scrolling up increments from 0 as desired. applyVolume() now passes masterVolume straight to slider.value and audioEl.volume with no conditional display branching. The _volWheeling flag from session 2 is retained to suppress browser-synthesised input events during wheel scroll. Init code updated to set masterVolume=0 on page load if lbl_muted was saved as 1, while restoring _preMuteVolume from lbl_vol for the unmute path.

---
