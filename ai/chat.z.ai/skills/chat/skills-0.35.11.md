Chats.zip has condensed chat history since the last time you updated your skills (0.35.4) to present (0.35.10). Based on their content and code changes, what changes would you make to existing skills?

---
## Skill update recommendations

### 1. `browser-hotkey-system/SKILL.md` — Several substantive gaps exposed by 0.35.5–0.35.10

**A. RESTRICTED_ALL is out of date** The skill's `RESTRICTED_ALL` is missing keys that were added during this period: `Tab`, `Enter`, `Ctrl+D`, `Ctrl+O`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+X`, `Ctrl+C`, `Ctrl+V`, `Ctrl+E`, `Ctrl+K`, and a large block of extended Ctrl+Shift and Meta combos. The current app's set is significantly more comprehensive. The skill should either reference the full app set or note that the list is illustrative and needs app-specific expansion.

**B. Capture input `keydown` is missing Tab handling** The skill shows `e.preventDefault()` unconditionally at the top of the capture `keydown` handler. This was the root cause of the 0.35.6–0.35.7 multi-turn Tab bounce bug. The correct pattern — discovered through three debugging turns — is: **check for `Tab` first, call `e.preventDefault()` then return, letting the event propagate to the focus trap**. The skill needs this as an explicit note.

**C. Focus trap for modal Settings is absent entirely** The skill has no section on modal/overlay focus traps. The bugs in 0.35.6 and 0.35.7 were almost entirely caused by the absence of a proper trap, taking 5+ turns to resolve. This is important enough to warrant a dedicated subsection covering: enumerate focusable elements, exclude transient UI (`.hk-clear`, `.hk-reset`, `.hk-replace`), handle Tab/Shift+Tab with `Math.max`/`Math.min` stops (not circular wrap), and set `panel.inert=true` on hidden regions.

**D. "Reset to default" has a conflict collision bug the skill doesn't warn about** The 0.35.9 Turn 2 patch fixed: when restoring a default value, first check if any other action currently holds that default value and blank it. The skill's `resetBtn` code doesn't show this step and will produce silent duplicate bindings.

**E. Focus retention after conflict-free assignment changed** The skill shows `input.blur()` after a clean save. The real app now keeps focus on the capture input until the user Tabs away (0.35.8 Bug 2). The skill's code will feel wrong to users who expect to tab through all hotkeys.

**F. Backspace/Shift+Backspace distinction** The skill says `Backspace || Delete = unassign`. The app now uses `Shift+Backspace` for clear, plain `Backspace` for "click Default if visible" (with focus advance). This is a meaningful UX pattern worth documenting.

**G. Key-repeat prevention** The skill has no mention of `e.repeat`. LineByLine discovered held hotkeys spam actions and the fix (`if (e.repeat && !isNavKey) return;` with `e.preventDefault()` for mode-toggle keys even on repeat) is a pattern worth including in the global handler section.

**H. Per-action restrictions should note "no app-level fixed key guards"** The skill still shows `isRestrictedForKey` with per-key guards like `'Ctrl+; is reserved for Save'`. The 0.35.9 decision was to remove all such guards — conflicts are handled by the Replace flow, not pre-emptive reservation. The skill should note that app-level fixed-key guards are usually unnecessary and create unexpected friction.

---

### 2. `linebyline-section-index/SKILL.md` — Minor updates only

**A. Sections list is stale for new sections** "Confirm dialog" was listed as `(empty stub section)` in 0.35.4. It now contains `_resetConfirmPending`, `showResetConfirm`, `hideResetConfirm`, `_doResetDefaults`. The description should be updated.

**B. Prompt-to-section map missing new patterns** Two new change types emerged:

- "Add/change confirmation dialog" → `Confirm dialog + Settings + Keyboard → Global KD`
- "Fix Settings focus trap / Tab navigation" → `Settings search + Keyboard → Global KD`
- "Fix panel collapse/expand focus" → `Button wiring + Init`

**C. The "Fix collapse/expand panel button" row in the map is imprecise** It pointed to `Button wiring + Init` but the `applyPanelCollapse` function and `panelCollapsed` state also live in `Button wiring`. The `inert` logic introduced in 0.35.7 is in the same section. Worth noting that `applyPanelCollapse` is in Button wiring, not Init.

---

### 3. `single-file-html-app/SKILL.md` — One addition

The volume state model bugs (three sessions, three root-cause revisions in 0.35.10) revealed a general principle: **when you have two representations of the same state (e.g. `masterVolume` + `masterMuted` as separate variables, or `slider.value` as both display and source of truth), pick a single source of truth and derive everything else**. This is worth adding as a pitfall note in the State / Persistence section.

---

### Summary of priority

|Skill|Change|Priority|
|---|---|---|
|browser-hotkey-system|Add Tab passthrough in capture keydown|High — caused 3+ debug turns|
|browser-hotkey-system|Add focus trap subsection|High — caused 5+ debug turns across two sessions|
|browser-hotkey-system|Fix reset-to-default collision bug|High — subtle correctness bug|
|browser-hotkey-system|Update RESTRICTED_ALL completeness note|Medium|
|browser-hotkey-system|Document focus retention after clean save|Medium|
|browser-hotkey-system|Add e.repeat guard pattern|Medium|
|browser-hotkey-system|Remove per-key app-level restriction guards|Low|
|browser-hotkey-system|Backspace/Shift+Backspace distinction|Low|
|linebyline-section-index|Update Confirm dialog description|Low|
|linebyline-section-index|Add new prompt-to-section map rows|Low|
|single-file-html-app|Single source of truth pitfall note|Low|

Want me to apply all of these, or start with just the high-priority ones?

---
All of these from high to medium to low, splitting into stages if you feel it would be too much for one turn

---
All three skills updated in one pass — no second stage needed. Here's what changed in each:

**`browser-hotkey-system`** (most changes):

- **High — Tab in capture keydown**: Added `if (e.key === 'Tab') { e.preventDefault(); return; }` at the very top, before `e.preventDefault()`, with an explanation of the index -1 / snap-to-first-element failure mode that caused 3+ debug turns
- **High — Modal focus trap**: New dedicated section covering: enumerate at Tab-time not open-time, exclude transient buttons from the focusable list, `Math.max`/`Math.min` stops (not circular wrap), `panel.inert` for collapsed regions, search field Tab leak fix, and `role="dialog" aria-modal` semantics
- **High — Reset collision bug**: `resetBtn` now scans for any other holder of the default value and blanks it first, then calls `rebuildHkRows()` for a full DOM refresh
- **Medium — RESTRICTED_ALL**: Expanded to the full app set (`Tab`, `Enter`, `Ctrl+D`, `Ctrl+O`, edit ops, full Meta block, extended Ctrl+Shift block) with an explanatory note
- **Medium — Focus retention**: Removed `input.blur()` after clean save; added comment explaining why (confirms the key landed, lets user Tab naturally)
- **Medium — `e.repeat` guard**: Added to the global handler pattern with note about mode-toggle keys needing `e.preventDefault()` even on repeat
- **Medium — Focused-UI guard**: Added `isFocusedUI` check to suppress hotkey dispatch when a toolbar button/input/select/a has focus (the Enter-on-toolbar-syncs-line root cause)
- **Low — App-level reservations**: Removed per-key guards, explained why the conflict Replace flow makes them unnecessary
- **Low — Backspace/Shift+Backspace/Enter**: Updated capture `keydown` to match the current refined pattern
- **Checklist**: Fully rewritten to reflect all of the above

**`linebyline-section-index`**: Updated Confirm dialog description from `(empty stub)` to its actual contents; fixed `applyPanelCollapse` location note; added two new prompt-to-section rows for confirmation dialog and Settings focus trap work

**`single-file-html-app`**: Added single-source-of-truth pitfall to Common pitfalls, with the volume model as the concrete example

---
The output linebyline-section-index-SKILL seems to have outdated examples such as "The app HTML is ~2200 lines (it's ~2500 now)" ( and the SECTIONS line example: The SECTIONS line looks like:

```
// SECTIONS: Config~437 | Hotkey rules~500 | Theme~581 | ... | Keyboard~2045 [Key norm~2046 | Main textarea KD~2054 | Overlay utils~2113 | Global KD~2125] | ...
```

Actual SECTIONS code:

```
// SECTIONS: Config~346 | Hotkey rules~415 | Theme~510 | Font~523 | Tooltips~538 | State~567 | Persistence~583 | Undo/redo~621 | Mode switching~639 | Auto mode~699 | Helpers~702 [LRC parse~703 | Paste/meta~722 | Genius~778 | Render/UI~875] | Audio~960 | Sync/timestamp~1148 | Secondary~1340 | Line counts~1448 | Title~1528 | Import~1536 | Controls~1648 | Settings~1746 | Settings search~1812 | Confirm~2164 | Keyboard~2200 [Key norm~2201 | Main textarea KD~2209 | Overlay utils~2268 | Global KD~2270] | Unload~2428 | Button wiring~2434 | Init~2451
```

---
Good catches. Two targeted fixes.
Also update the "as of v0.35.4" reference in the section list since those line numbers are now stale anyway:
Three fixes applied: line count updated to ~2500, SECTIONS example replaced with the actual current value from v0.35.10, and the "as of v0.35.4" reference updated to v0.35.10.