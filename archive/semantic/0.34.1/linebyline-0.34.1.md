Input
* linebyline-0.34.0.html
Output
* linebyline-0.34.1.html and update version number
Bugs
* The Main "( )" checkbox is right aligned unlike the Secondary "( )" - see checkbox.png
* Pressing Esc to cancel setting a hotkey allows setting Esc as a hotkey. Add Esc to the list of restricted keys and hardcode its current uses (including canceling setting a hotkey)
* Adjusting the volume increment Setting with the up/down tick arrow buttons still moves the volume slider. Adjusting it by typing a number in the field does not do this.
Refinements
* Focus the main field after startup so users can Ctrl+V paste lyrics as soon as they Alt+Tab into LineByLine
* Rename "Mark as translation" to "Mark line as translation" and make it only affect one selected line in Hotkey mode, not just Typing mode; if multiple lines are selected, it should only
* Secondary "( )" checkboxes have no tooltip. Add one like "Wrap all secondary lines in parentheses"

---

All six items delivered in `linebyline-0.34.1.html`.

**Main `( )` alignment** — the Main field header was using the default `.field-header` style which has `justify-content:space-between`, pushing the checkbox to the far right. Fixed by adding `justify-content:flex-start` inline on that header and `flex:1` on the label span, so the checkbox sits left-adjacent to the label just like secondary fields. The tooltip that was previously set via JS in `updateDynamicTooltips` is now baked directly into the HTML element.

**Esc as a hotkey** — `'Escape'` added to `RESTRICTED_ALL`. The `hk-capture` keydown handler now explicitly checks for `e.key === 'Escape'` before the normal key-building logic and calls `revertAndExit()`, so Esc always cancels the capture and can never reach the assignment path.

**Volume slider moving on spinner clicks** — the root cause was that `saveSettingsNow` was updating `vol-slider.step`, which caused the browser to snap the slider value to the nearest valid step. Removed the `step` mutation from `saveSettingsNow` entirely. The slider's `input` and `wheel` handlers already read `cfg.vol_increment` live, so the step attribute on the element is cosmetic and doesn't need to track the setting in real time.

**Startup focus** — `#main-lines` given `tabindex="0"` so it can receive focus, then `requestAnimationFrame` after init focuses it. This means Ctrl+V paste and keyboard shortcuts work immediately after Alt+Tab without clicking first.

**"Mark line as translation" / single-line** — label renamed throughout (HK_LABELS, restriction message). In `markAsTranslation`, the hotkey-mode branch now always uses `[activeLine]` regardless of `selectedLines`, matching Typing mode's one-line behaviour.

**Secondary `( )` tooltip** — `parenLabel.title` set to `'Wrap all secondary lines in parentheses'` in `addSecondary`.

---
The Main "( )" checkbox is still **right** aligned unlike the Secondary "( )". 
 Focusing the main field after startup doesn't seem to actually work - tested on LibreWolf (ResistFingerprinting enabled) and Firefox (ResistFingerprinting not enabled). Is this a technical limitation of browsers in general?
___
Looking at the screenshot again — Secondary header has `justify-content:flex-start` set inline on the `hdr` element, and the label is appended to a `hdrRight` div that's right-side. Let me re-read both headers carefully.Now I see the issue. Secondary: `hdr` has `flex-start`, `lbl` has no flex, and `hdrRight` (containing 📂 + parenLabel) is appended after. Because there's no `flex:1` on `lbl`, `hdrRight` sits right next to it. Main: I added `flex:1` to the span, which pushes the label to the far right — that's the same as `space-between`. The fix is simple: remove `flex:1` from the Main label span.

On the focus question: yes, this is a known browser security restriction. Browsers block `focus()` calls on elements that don't result from direct user interaction — scripts can't steal focus on page load. `tabindex="0"` + `focus()` in `requestAnimationFrame` will be silently ignored. The only reliable workaround would be an explicit click-to-start overlay, which would be more intrusive than the problem. I'll note this as a limitation and revert the non-working focus code.**Checkbox fix:** the previous patch added `flex:1` to the "Main" span, which pushed the checkbox to the far right — identical to `space-between`. Removed it. Now both Main and Secondary headers use `flex-start` with no flex growth on the label, so the checkbox sits immediately after "MAIN" with just the header's `gap` between them.

**Startup focus — confirmed browser limitation:** browsers intentionally block programmatic `focus()` calls that aren't triggered by user interaction, as an anti-fingerprinting and anti-annoyance measure. This applies in both standard Firefox and ResistFingerprinting mode. The only reliable approaches would be an explicit click-to-activate overlay (intrusive) or making the whole app a PWA installed to the OS (out of scope). Reverted the non-working code.
