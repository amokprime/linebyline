# LineByLine 0.35.9 — Chat Log

## Turn 1

**Prompt:**

Bugs:
- Holding Ctrl+O after defocusing the window can open multiple file picker dialogs

Refinements:
- Add ArrowUp badge to Previous line control, ArrowDown to Next line control
- Widen panel if needed to prevent two-row badge wrapping
- Tab/Shift+Tab in Settings should stop at first/last element, not loop
- Mute button/Ctrl+M: keep as-is; volume slider should visibly move to 0 when muted and back to pre-mute level on unmute
- Semantic HTML audit (high-priority fixes only): dialog role on Settings, aria-labels on icon buttons, label-for on Settings inputs

---

**Bug (Ctrl+O repeat):** `doImport` had no re-entry guard. Added `_importPending` flag set on click, cleared on `window focus` (fires when the OS file dialog closes, whether the user picks a file or cancels) and also immediately on the `file-picker` `change` event. This covers all dismissal paths without relying on a timeout.

**Arrow badges:** Added `prev_line` and `next_line` as special cases in `rebuildHkPanel` alongside `sync`, using the same `display:flex;gap:3px` dual-badge pattern. Arrows rendered as ↑ / ↓ Unicode characters to match the compact badge style.

**Panel width:** Widened `#left-panel` from `310px` to `330px` to give the two-badge cells comfortable room without wrapping.

**Tab no-loop:** Replaced circular wrap logic `idx<=0?focusable.length-1:idx-1` / `idx>=focusable.length-1?0:idx+1` with `Math.max(0,idx-1)` / `Math.min(focusable.length-1,idx+1)`. Focus stops at the boundary element and stays there.

**Volume slider on mute:** `applyVolume` now sets `vol-slider.value` to `0` when `masterMuted` is true, and to `masterVolume` when unmuted — slider always reflects the audible state. The percentage display continues to show the real volume level so users know what it will return to. `updateMuteIcon` also updates `vol-mute-btn`'s `aria-label` to "Unmute" / "Mute" dynamically.

**A11y — Settings dialog:** Added `role="dialog" aria-modal="true" aria-labelledby="settings-heading"` to `#settings-win`; added `id="settings-heading"` to the title `<span>`. Screen readers will now announce "Settings, dialog" when it opens and confine virtual cursor to the dialog.

**A11y — Icon buttons:** Added `aria-label` to: `btn-undo`, `btn-redo`, `btn-collapse-panel`, `btn-expand-panel`, `btn-seek-back`, `btn-play-pause` (dynamically updated to "Play"/"Pause" via `updatePlayBtn`), `btn-seek-fwd`, `vol-mute-btn` (dynamically updated to "Mute"/"Unmute"), `settings-close`, `s-search-kbd`. All decorative SVGs inside these buttons received `aria-hidden="true"`.

**A11y — Label-for:** Added `for` attributes to all eight `<label>` elements in the Intervals section of Settings, linking each to its corresponding `<input id>`.

---

## Turn 2

**Prompt:**

Bugs:
- Panel width increase was unnecessary; ↑/↓ fit in original space fine — make width adaptive
- Vol-pct shows 100% even when muted (should show 0%)
- Tab/Shift+Tab still loops in Settings — revert if not confident
- Ctrl+O spam still possible — revert if not confident
- Conflict-then-reset: replacing key A with key B's value, then clicking Default on B restores B's value without clearing A, causing both A and B to share the same binding

Refinements:
- Stop reserving Menu hotkeys

---

**Panel width:** Switched from hardcoded `330px` to `width:fit-content;min-width:310px` so the panel grows naturally with content and won't need manual adjustment again.

**Vol-pct 0% on mute:** `applyVolume` computed `displayVol` (0 when muted, real value when not) for the slider, but still passed `masterVolume` to `vol-pct`. Changed to `Math.round(displayVol*100)+'%'` so both slider position and percentage label track the audible state.

**Tab no-loop:** Added `if(e.repeat){e.preventDefault();return;}` at the top of the Settings Tab focus-trap handler. Held Tab is now consumed silently at whatever element focus lands on — no looping, no marching.

**Ctrl+O spam:** Refined the `_importPending` guard: `_importOpenTime` is recorded on each `doImport` call; the `window focus` reset only fires if at least 800ms have elapsed since opening — this prevents the guard from resetting during the brief window-focus/blur cycle that occurs as the OS dialog opens, while still resetting correctly after the dialog is dismissed.

**Conflict-then-reset:** In `rst.click()`, before assigning the default value, a conflict check scans `cfg.hotkeys` for any other key already holding that default. If found, that key is blanked first — consistent with how Replace works — so restoring a default can never silently create a duplicate binding.

**Menu hotkey reservations removed:** Deleted the per-key guards in `isRestrictedForKey` (`Ctrl+;` for Save, `Ctrl+O` for Open, `Ctrl+,` for Settings, `Ctrl+.` for Toggle theme, `Ctrl+/` for Help, `Ctrl+'` for Issues, `Ctrl+ArrowLeft` for Mark line as translation). All Menu-section hotkeys are now freely reassignable like any other; conflicts are handled through the normal Replace/blank flow.

---

## Turn 3

**Prompt:**

Bugs:
- Ctrl+O still spams — revert all fix attempts, add Ctrl+O to reserved keys
- Tab no-loop felt more annoying — revert
- Conflict-then-reset: after Replace→Enter, focusing Save and pressing Backspace→Default left both fields visually showing Ctrl+; (Open should have been blanked immediately)
- Change defaults: open→Ctrl+;, save→Ctrl+', issues→Ctrl+[; update migrations

---

**Ctrl+O spam revert:** Removed `_importPending`, `_importOpenTime`, `window focus` listener, and `_importPending=false` in the change handler. `doImport` is back to its original one-liner. Added `'Ctrl+O'` to `RESTRICTED_ALL` so it can no longer be assigned as a hotkey.

**Tab no-loop revert:** Removed `if(e.repeat){e.preventDefault();return;}` from the Settings Tab focus-trap handler, restoring original wrap behaviour.

**Conflict-then-reset root cause:** `rst.click()` was blanking the conflicting holder in `cfg` but not calling `buildHkRows()`, so the other field's DOM input still showed the old value. Fixed by setting `holderBlanked=true` when a holder is cleared, then calling `buildHkRows()` and returning early — the full rebuild updates all affected rows at once.

**Default hotkey changes:** `open` `Ctrl+O`→`Ctrl+;`, `save` `Ctrl+;`→`Ctrl+'`, `issues` `Ctrl+'`→`Ctrl+[`. Migrations added: `open` from both `Ctrl+M` and `Ctrl+O`→`Ctrl+;`; `save` from both `Ctrl+S` and `Ctrl+;`→`Ctrl+'`; `issues` from `Ctrl+'`→`Ctrl+[`.

---
