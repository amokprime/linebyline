---
model: GLM-5.1
summary: SonarQube accessibility fixes, undo/redo overhaul, secondary field bugs, speed persistence, split-parens default, Esc-blur, panel regions
---

### Version
Patch

### Bugs
1. Address latest SonarQube Cloud issues
2. Lyrics imported with secondary field button📂or middle click on secondary field cannot be undone, let alone redone. I had only tested pasting in secondary field previously-that could be undone and redone.
3. Secondary field lyrics with a blank main field are not protected by the unsaved work warning
4. Syncing or adjusting lyrics requires two `Ctrl+Z` presses to undo (one press if a timestamp would revert to `[00:00.00]`). These should always be one keypress just like clicking the Undo/Redo buttons.
5. Reset defaults does not reset the playback speed input field in Now Playing, even after reloading the page. This seems to be a visual bug-actually changing speed seems to pick up from 1 as expected
6. Possibly related to bug 5: Speed input field does not persist across page reloads
### Refinements
- Make ↩ a default behavior and remove that checkbox
- Escape `Tab` selection with `Esc` to allow normal hotkey usage
- The unsaved work warning popup only snaps cursor to "Leave page" button on Firefox, not Chromium ("Reload") or Webkit (not sure what) browsers
- ARIA nitpick: left panel should be further divided into two areas: Now Playing and Controls. That way I don't have to take a snapshot of the whole panel for the controls-disabled test.

---

User prompts verbatim (including Prompt.md contents):

> Before doing anything else:
> 1. Read Index.md to understand the relative location of files I uploaded.
> 2. **Follow all applicable rules in these files in every turn of this chat:**
> 	1. All skill files in linebyline/skills/
> 	2. Project.md
> 3. Read Memory.md to understand the app's development history
> 4. Read linebyline/app/linebyline-X.X.X.md for what happened last session
> 5. Read Prompt.md (if it exists) or the rest of this chat for next steps

---

### Turn 1: All Prompt.md items

Changes made:

1. **SonarQube S6819 — `role="region"` → `<section>`**: Changed `<div id="audio-box" role="region">` to `<section id="audio-box" aria-labelledby="now-playing-label">`. Added `#controls-box` CSS for new section.

2. **SonarQube S6819 — `role="group"` → `<fieldset>`**: Changed `<div class="hk-grid" id="hk-grid" role="group">` to `<fieldset class="hk-grid" id="hk-grid">`. Added `border:none;margin:0;padding:0;min-inline-size:0` to `.hk-grid` CSS for fieldset reset.

3. **SonarQube S6819 — `role="list"` → `<ul>`**: Changed `<div class="lyric-area" id="main-lines" role="list">` to `<ul class="lyric-area" id="main-lines">`. Added `list-style:none;margin:0` to `.lyric-area` CSS.

4. **SonarQube S6819 — `role="status"` → `<output>`**: Changed `<span id="settings-conflict" role="status">` to `<output id="settings-conflict">`. The `<output>` element has implicit role "status".

5. **SonarQube S6819 — `role="contentinfo"` → `<footer>`**: Changed `<div id="settings-footer" role="contentinfo">` to `<footer id="settings-footer">`. Added matching `</footer>` closing tag.

6. **SonarQube S6819 — `role="slider"` → Won't Fix**: `#progress-wrap` uses custom div with mousedown/drag/wheel handlers for click-to-seek, drag, and scroll seeking. Converting to `<input type="range">` would require significant refactoring of the custom interaction model. Marked as Won't Fix.

7. **SonarQube S7927 — accessible name/visible label mismatch (3 instances)**: Fixed `aria-label` on `#btn-add-sec` from "Add secondary field" to "Add field" (matching visible text). Fixed `aria-label` on `#btn-remove-sec` from "Hide last secondary field" to "Hide field" (matching visible text). `#merge-btn` already matched ("Merge fields" = "Merge fields").

8. **SonarQube S6825 — `aria-hidden="true"` on focusable element**: Removed `aria-hidden="true"` from `#file-picker`. The element already has `style="display:none"` which removes it from the accessibility tree; the `aria-hidden` was redundant.

9. **Bug fix — undo/redo double snapshot**: Changed `setMainText(t)` from double-push (`pushSnapshot(); _setTA(t); ...; pushSnapshot()`) to single post-change push (`_setTA(t); ...; pushSnapshot()`). The pre-change state is already on the undo stack from the previous operation, so the first push created a duplicate. This caused sync/adjust operations to require two Ctrl+Z presses to undo. Applied the same fix to `mergeTranslations` (removed pre-change push), paste handlers (both meta-paste and plain-paste), and the LRC-only import path.

10. **Bug fix — secondary import undo**: Added secondary textarea clearing in `applySnapshot` for secondaries not present in the snapshot: `for(let i=snap.secondaries.length;i<secondaryCols.length;i++){secondaryCols[i].linesEl.value='';}`. Root cause: when a secondary field was added after the last snapshot was taken, undoing would restore a snapshot with an empty `secondaries` array, but the forEach over that array wouldn't clear the textarea — it just skipped. Now extra secondaries are explicitly cleared.

11. **Bug fix — unsaved work warning for secondary fields**: Changed `beforeunload` handler to also check `secondaryCols.some(c=>c.linesEl.value.trim()!=='')`. Previously only the main textarea was checked, so secondary-only work was lost without warning.

12. **Bug fix — speed field reset on Reset Defaults**: Added `currentSpeed=1; document.getElementById('speed-val').value='1'; if(audioEl)audioEl.playbackRate=1; localStorage.setItem('lbl_speed','1');` to `_doResetDefaults()`. The function previously didn't reset the speed field.

13. **Bug fix — speed field persistence**: Changed `currentSpeed` initialization from `let currentSpeed=1` to load from `localStorage.getItem('lbl_speed')`. Added `localStorage.setItem('lbl_speed',currentSpeed)` to `changeSpeed()` and the speed-val change handler. Added speed display restoration in the init section.

14. **Refinement — ↩ split-parens always on**: Removed the `#main-split-check` checkbox and its label from the main field header HTML. Replaced all `document.getElementById('main-split-check').checked` references with unconditional `batchSplitParens()` calls. Simplified `markAsTranslation` by removing the `splitMode` variable and `if(splitMode)` guard.

15. **Refinement — Esc blurs focused UI elements**: Added `if(isFocusedUI&&e.key==='Escape'){e.preventDefault();ae.blur();return;}` before the `isFocusedUI` guard in the global keydown handler. This lets users press Esc to return focus to the content area after Tab-navigating to a button/input.

16. **Refinement — left panel ARIA regions**: Wrapped the Controls section in `<section id="controls-box" aria-labelledby="controls-label">`. The Now Playing section was already a `<section>` from the SonarQube fix (item 1). Playwright can now target `#controls-box` separately from `#audio-box`.

17. **Known limitation — beforeunload dialog focus**: The unsaved work warning popup cursor behavior is entirely browser-native. We cannot control which button receives focus in the `beforeunload` dialog. Firefox focuses "Leave page", Chromium focuses "Reload" — this is by design in each browser and cannot be overridden from JavaScript.

18. **SECTIONS re-indexed** after all patches.

Skills updated: `linebyline-section-index-SKILL.md` — SECTIONS reference updated to v0.36.1.

---

| #   | Rule  | Fix                                                     | Status                                    |
| --- | ----- | ------------------------------------------------------- | ----------------------------------------- |
| 1   | S6819 | `role="region"` → `<section>` on `#audio-box`           | ✅ Fixed                                   |
| 2   | S6819 | `role="group"` → `<fieldset>` on `#hk-grid`             | ✅ Fixed                                   |
| 3   | S6819 | `role="list"` → `<ul>` on `#main-lines`                 | ✅ Fixed                                   |
| 4   | S6819 | `role="status"` → `<output>` on `#settings-conflict`    | ✅ Fixed                                   |
| 5   | S6819 | `role="contentinfo"` → `<footer>` on `#settings-footer` | ✅ Fixed                                   |
| 6   | S6819 | `role="slider"` on `#progress-wrap`                     | ❌ Won't Fix — custom mousedown/drag/wheel |
| 7-9 | S7927 | Accessible name ≠ visible label (3×)                    | ✅ Fixed                                   |
| 10  | S6825 | `aria-hidden` on focusable `#file-picker`               | ✅ Fixed                                   |
