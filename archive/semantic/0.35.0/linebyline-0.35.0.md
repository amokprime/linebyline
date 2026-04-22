# LineByLine 0.35.0 — Chat log

## Prompt

Version
Minor

Bugs
* Line count mismatch warning has no popup which allows a user to ignore the warning and press `Ctrl+6` unlimited times
* The collapse panel icon was again vertically centered on the bar like 0.34.8. Keep the bar - but also keep the icon at the same height as when the panel was expanded

Changes
* Main field "↩" checkbox to the right of the "( )" checkbox but left-aligned
   * Helps users migrate from inline style translations to merged style translations. Since translations in the same lyrics as main language are niche to begin with, uncheck ↩ by default
   * When checked and `Ctrl+ArrowLeft` is used
      * Move the last part of a line wrapped in "( )" to a newline and mark that newline as translation
      * Whether the "( )" checkbox is checked doesn't matter
      * Lyrics that do not end in ")" like "I wish I could identify that smell" or "I wish I could (identify) that smell" should be marked as translation normally
   * Example progression below: [see original prompt]

---

**Follow-up (Prompt.md + images.zip):**

Bug: Line count mismatch "no popup" — See popup.png - example of a popup that also has an associated warning which appears when there are timestamps but no trailing timestamp. I want a popup like that for mismatched timestamps too.
Case 1: (1) The Merge fields BUTTON is disabled. (2) The Merge fields HOTKEY has no associated blocking popup. Although the warning is up, I was able to merge fields anyway. (3) I can do it again seemingly unlimited times.

Change: ↩ checkbox behaviour — (1) Yes. (2) The manual equivalent is to position the cursor right before the last parenthesized group's "(" and pressing Enter. (3) Move the parenthesized group to a newline without any additional processing (just don't generate any new trailing spaces). Then reuse the existing logic to mark that line as translation normally. Steps 2-5 appear to be one step from the user's perspective (loop through the line to find all trailing parenthesized groups in one hotkey press). Step 6 is an acceptable fail state.

---

## Response

Three bugs fixed and the ↩ split-translation feature added in **0.35.0** (minor bump for the new feature).

**Bug: merge hotkey bypassed validation** — `mergeTranslations()` had `alert` guards for missing timestamps and incomplete sync, but not for line-count mismatch. Added a guard that fires `alert('Line count mismatch...')` before proceeding, matching the existing pattern. The hotkey path goes through the same function so it's blocked identically to the button.

**Bug: expand panel button vertically centered** — The 0.34.10 CSS had `height:100%` on `#btn-expand-panel`, making it fill the full editor height. Restored the 0.34.9 values: `height:28px`, `align-self:flex-start`, `margin-top:2px`, `border-radius:0 var(--radius) var(--radius) 0`.

**Change: ↩ checkbox + split logic** — Added an unchecked-by-default ↩ checkbox in the main field header. When checked, `Ctrl+ArrowLeft` on a line ending in `(...)` peels the last top-level parenthesised group off the end, inserts it as a bare line immediately below, then runs the existing mark-as-translation logic on it (which assigns a timestamp offset from the next line, stacking at -10ms, -20ms, etc. for multiple presses). Lines without a trailing top-level `(...)` fall through to the original mark-as-translation behaviour unchanged. A helper `_peelLastParen()` handles balanced-paren scanning from the end of the string.

---
