---
model: GLM-5.1
summary: Focus steal fix, arrow key navigation, dynamic Typing overlays, Swap hotkeys, Reset swap-pattern fix
---
### Version
Minor

#### Comments
- Consolidating Index.md and Project.md into a `project-workflow-SKILL.md` discussed but deferred to next session

### Bugs
1. Menu bar buttons, expand/collapse panel buttons steal focus from the editor area

### Refinements
1. Prevent standalone arrow keys from being assigned as hotkeys; allow arrow key navigation through Settings capture inputs (↑/↓ move between rows, ↑/↓ on number inputs left as-is)
2. Dynamic hotkey overlays: in Typing mode, play/pause shows Ctrl+Space instead of Space; prev/next line show only ↑/↓ instead of Q/E + arrows
3. Keep buttons right-aligned when Swap button or restriction warning appears — warning moved to left of capture input, removed hk-conflict flex-wrap
4. Rename "Replace" to "Swap" and swap hotkeys instead of blanking the conflicting one

---

User prompts verbatim (including Prompt.md contents):

> Before doing anything else, extract linebyline.zip and:
> 1. Read linebyline/Index.md to understand the relative location of files I uploaded.
> 2. **Follow all applicable rules in these files in every turn of this chat:**
>       1. All SKILL.md files in linebyline/skills/
>       2. linebyline/Project.md
> 3. Read linebyline/Memory.md to understand the app's development history
> 4. Read linebyline/app/~/linebyline-X.X.X.md for what happened last session(s)
> 5. Read linebyline/Prompt.md (if it exists) or the rest of this chat for next steps

> Address the comment then in order

---

### Turn 1: All Prompt.md items

Changes made:

1. **Bug — Focus stealing**: Extended the `mousedown` `preventDefault` pattern (already applied to `#audio-box` and `#controls-box`) to also cover `#menu-bar` and the expand/collapse panel buttons (`#btn-expand-panel`, `#btn-collapse-panel`). On `#menu-bar`, the handler only prevents default when `e.target.closest('button')` matches — `<select>`, `<input>`, and `<a>` elements still receive focus on click. The standalone panel buttons use a simpler `e.preventDefault()` since they have no child elements. Changed `applyPanelCollapse(true)` to `applyPanelCollapse(false)` in the panel button click handlers and in `CTRL_ACTIONS.panel_toggle` and `_handleSettingsKeys` panel_toggle — after clicking collapse/expand, focus stays in the editor rather than programmatically moving to the opposite panel button. Updated comment from "Prevent Now Playing / Controls buttons" to "Prevent toolbar / panel buttons."

2. **Refinement 1 — Arrow key restrictions + Settings nav**: Added `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` to `RESTRICTED_ALL` — standalone arrow keys can no longer be assigned as remappable hotkeys in Settings. Added arrow key navigation in `_handleSettingsKeys`: when Settings is open and focus is on a `.hk-capture` input, ↑/↓ moves to the previous/next visible capture input (filtered by `offsetParent !== null` and not inside `.s-hidden`). Number inputs retain their native ↑/↓ value-adjustment behavior since the handler only intercepts on `.hk-capture` elements.

3. **Refinement 2 — Dynamic hotkey overlays**: Modified `rebuildHkPanel` to change displayed hotkeys based on `hotkeyMode`:
   - Play/pause: shows `Space` in Hotkey mode, shows `Ctrl+Space` (the `play_pause_alt` value) in Typing mode
   - Previous line: shows `Q ↑` in Hotkey mode, shows only `↑` in Typing mode
   - Next line: shows `E ↓` in Hotkey mode, shows only `↓` in Typing mode

4. **Refinement 3 — Right-aligned buttons + warning repositioned**: Removed `.hk-row.hk-conflict` CSS rules that forced `flex-wrap:wrap` and pushed labels to a full-width line — this caused buttons to left-align on the wrapped row. Now all hotkey rows stay on one line with `flex-wrap:nowrap`, and the label's `flex:1` keeps buttons right-aligned. Moved `restrictWarn` before the capture input in the DOM order: `[label] [warning] [capture] [clear] [replace] [reset]`. Updated `restrictWarn` CSS to `display:inline-block;flex-shrink:0` when visible. Updated layout comment.

5. **Refinement 4 — Swap instead of Replace**: Renamed the conflict resolution button from "Replace" to "Swap". Changed the click handler behavior: instead of blanking the conflicting action's hotkey (`cfg.hotkeys[conflictKey]=''`), the swap gives this action's OLD key to the conflicting action (`cfg.hotkeys[conflictKey]=oldKey`) before assigning the new key. This means no hotkeys are left blank after a swap. Updated conflict message from `⚠ Used by "X"` to `⚠ "X" uses this key — press Swap or Enter`. Updated Enter-key handler comment from "Replace" to "Swap". CSS class remains `hk-replace` internally (no functional impact).

Skills that may need updating:
- `browser-hotkey-system-SKILL.md`: conflict resolution section still references "Replace" — should be updated to "Swap" with swap behavior
- `linebyline-section-index-SKILL.md`: line numbers shifted slightly, no structural changes

---

### Turn 2: Bug fixes from user testing of 0.37.0

User prompts verbatim:

> Play/pause, Previous line, and Next line show as disabled but should show as enabled with their Typing-mode-specific hotkey overlay (that was the original intent). See below ARIA snapshot and controls.png.
> Fix the many old instances of "Replace" in browser-hotkey-system-SKILL.md
> Arrow keys aren't working as intended (interchangeable with Tab/Shift+Tab as navigation method in Settings). It does not navigate between Settings elements and merely triggers the reserved hotkey warning when used to try to move between hotkey fields (arrowdown.png). For the edge case of losing the function of adjusting spinner boxes with ArrowUp/ArrowDown: I was willing to sacrifice that for the overall more intuitive flow of arrow key navigation.
> There is an edge case where I assign a key (i.e. Sync line end → W), tab down, then tab back up and Backspace to reset the key assigned to default. Then the assigned key reverts, but the key it swapped with (Sync line start in this case) gets blanked rather than also reverting back to its default (maintaining the swapping pattern whose underlying goal was to prevent any key from being silently unassigned).
> A few Playwright tests broke that can't be fixed by snapshot or screenshot regen: see axe-scan-lyrics.md and isRestrictedForAll allows ArrowDown.md.

Changes made:

1. **Typing-mode overlays shown as disabled → fixed**: The `rebuildHkPanel` dimming logic used `!hotkeyMode && HOTKEY_ONLY.has(key)` which dimmed ALL HOTKEY_ONLY actions in Typing mode, including play_pause/prev_line/next_line that have Typing-mode-specific overlays. Added `TYPING_AVAILABLE` set containing these three actions, and changed dimming to `!hotkeyMode && HOTKEY_ONLY.has(key) && !TYPING_AVAILABLE.has(key)`. These three buttons are now fully enabled with their Typing-mode overlays instead of dimmed with `aria-disabled="true"`.

2. **Arrow keys removed from RESTRICTED_ALL**: Previous session added `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` to `RESTRICTED_ALL`, which caused `isRestrictedForAll('ArrowDown')` to return a non-null "reserved by the browser" message — breaking the Playwright test and showing the restriction warning when pressing arrow keys in capture inputs. Removed all four arrow keys from RESTRICTED_ALL since they need to be available for Settings navigation.

3. **Arrow key navigation expanded to ALL Settings elements**: Previous implementation only navigated between `.hk-capture` inputs. Replaced with a general handler that enumerates all focusable elements in `#settings-win` (same list used for Tab focus trap) and moves focus with ↑/↓ like Tab/Shift+Tab. This also prevents ArrowUp/ArrowDown from adjusting number input values — the `e.preventDefault()` stops the browser's default increment/decrement, and focus moves to the next element instead.

4. **Arrow keys pass through capture input and search keydown**: Changed capture input keydown from `if(e.key==='Tab'){e.preventDefault();return;}` to also include arrow keys: `if(e.key==='Tab'||e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();return;}`. This lets arrow keys bubble up to the global handler where `_handleSettingsKeys` handles navigation. Similarly updated both branches of `_handleSettingsSearchKeydown` to pass arrow keys through. Arrow keys are thus prevented from being assigned as hotkeys (they never reach the assignment logic) but work for navigation.

5. **Reset edge case — swap pattern fix**: When resetting a hotkey to default, if another action currently holds that default value, the old code blanked the holder (`cfg.hotkeys[holder[0]]=''`). This violated the swap pattern's goal of never leaving blank hotkeys. Fixed by giving the holder its own default: `cfg.hotkeys[holder[0]]=DEFAULT_CFG.hotkeys[holder[0]]||''`. This ensures that when a swapped pair is reset, both actions get their defaults back instead of one being blanked.

6. **Typing-mode ↑/↓ for prev/next line**: Added a new code path in the global keydown handler between `_handleGlobalHotkeys` and the `!hotkeyMode` return: when in Typing mode, if no textarea has focus (`activeElement` is `body` or `documentElement`), ArrowUp triggers `seekPrevLine()` and ArrowDown triggers `seekNextLine()`. This supports the Controls panel overlay showing ↑/↓ for prev/next line in Typing mode.

7. **browser-hotkey-system-SKILL.md updated**: Replaced all "Replace" references with "Swap", updated the reset-to-default code example to use the swap pattern (give holder its default back instead of blanking), added arrow key navigation details (↑/↓ on all Settings elements, not just captures), added "Typing-mode overlays in Controls panel" section with the TYPING_AVAILABLE table, updated summary checklist.

8. **linebyline-section-index-SKILL.md updated**: Added notes about RESTRICTED_ALL lacking arrow keys, TYPING_AVAILABLE set, Swap button behavior, arrow key pass-through in search, arrow key navigation scope, and Typing-mode ↑/↓ in global keydown.

9. **project-workflow-SKILL.md created**: Consolidated Index.md and Project.md into a single skill file. Original files now redirect to the skill.

10. **Memory.md updated**: Added 0.37.0 entry documenting all changes.
