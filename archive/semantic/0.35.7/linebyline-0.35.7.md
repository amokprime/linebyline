# LineByLine 0.35.7 — Chat Log

## Turn 1

**Prompt:**

Bugs:
- Tabbing to the first Settings hotkey no longer trips the reserved hotkey warning, but still bounces back to the search field instead of navigating to the next Settings hotkey
- Shift+Tab from Settings search field first goes to main window checkboxes, then Settings window Reset defaults

---

Two root causes identified.

**Bug 1 — capture input Tab bounce:** The capture input's keydown handler called `revertAndExit()` on Tab, which called `inp.blur()`. The global focus trap then ran with `document.activeElement` already detached (blurred to body), giving index `-1`. With forward Tab, `next = (-1 >= focusable.length-1 ? 0 : 0) = 0` — always landing on the first element (search field). Fix: remove the `revertAndExit()` call; just `return` and let the blur fire naturally when the focus trap moves focus to the next element.

**Bug 2 — search field Shift+Tab escape:** `inp.onkeydown` in `initSettingsSearch` called `e.stopPropagation()` unconditionally in the non-hkMode branch, preventing the global Tab focus trap from ever seeing the event. Fix: add an early `if(e.key==='Tab') return;` before the `stopPropagation` call so Tab always reaches the global handler.

---

## Turn 2

**Prompt:**

Bugs:
- Regular Tab still bounces: tabbing to first hotkey shows '...', next Tab focuses nothing visible, next Tab lands on search field
- Shift+Tab through hotkeys then switching back to Tab causes the same bounce

---

Root cause: the capture input's Tab handler called `return` without `e.preventDefault()`. This meant the browser's native Tab fired first (moving focus outside the Settings window), and then the global trap's `e.preventDefault()` and `focusable[next].focus()` also ran — double navigation. Shift+Tab worked because a different code path happened to block native tab in that direction.

Fix: add `e.preventDefault()` to the capture input's Tab early-return, so the browser's native Tab is blocked and only the global trap moves focus.

---

## Turn 3

**Prompt:**

Regular Tab still bouncing. Debug console logs provided. Close button should be excluded from Tab focus.

---

Root cause from logs: when Tab lands on a capture input, the input enters '...' state (focus handler), which sets the hk-clear button to `display:flex` (visible). The focus trap then moves focus to index+1 — the now-visible hk-clear button. The capture input's blur handler then fires and hides hk-clear again (`display:none`), removing it from layout. On the next Tab, the focusable list rebuilds without the clear button (offsetParent===null), document.activeElement is the detached clear button, indexOf returns -1, and the trap snaps to index 0 (search field).

Fix: exclude `.hk-clear`, `.hk-reset`, `.hk-replace`, and `#settings-close` from the focusable list in the trap filter. These are all transient or utility elements that shouldn't be Tab stops.

---

## Turn 4

**Prompt:**

Continue (syntax check, deliver, then Stage 2 scoping).

---

Syntax check passed. Four patches verified present:

**Spinner focus highlight** — `.fs-tick` now has `outline:none` and `.fs-tick:focus-visible` uses `box-shadow:inset 0 0 0 2px var(--accent)`. The inset shadow stays within the `overflow:hidden` boundary of `.fs-spinner`, eliminating the clipped midline artefact.

**Panel collapse focus + inert** — `applyPanelCollapse(transferFocus)` now sets `panel.inert=true/false` when collapsing/expanding, removing all left-panel children from the Tab order while collapsed. User-initiated clicks pass `transferFocus=true`, which calls `.focus()` on the counterpart button (collapse→expand, expand→collapse). `autoCollapseIfNeeded` and the init call pass no argument (undefined = falsy), so startup and resize don't steal focus.

**`Ctrl+`` panel toggle hotkey** — added to `DEFAULT_CFG.hotkeys`, `HK_SECTIONS` Menu, `HK_LABELS`, `loadCfg` migration guard, `CTRL_ACTIONS`, and the global KD handler. Remappable from Settings → Hotkeys → Menu.

**Esc focus order in Settings** — global KD Esc handler now: capture focused → ignore; search focused with text → clear text; search focused empty → `blur()`; anything else → `closeSettings()`. Duplicate Esc branch removed from search field's own `onkeydown`.

SECTIONS index updated for shifted line numbers.

---

## Turn 5

**Prompt:**

Stage 2: reset_defaults hotkey + confirm dialog, Backspace→Default, Shift+Backspace→Clear, Enter→Replace+advance. Enter/Backspace/Esc dismiss confirm. Ctrl+\ default. reset_defaults last in Menu section.

---

**`reset_defaults` hotkey** — added to `DEFAULT_CFG.hotkeys` (`Ctrl+\`), `HK_SECTIONS` Menu (last position), `HK_LABELS`, `loadCfg` migration guard, `CTRL_ACTIONS`, and global KD handler. Works when Settings is closed (opens Settings then shows confirm) or open (shows confirm directly). Restricted from collision same as other hotkeys.

**Inline confirm dialog** — footer HTML gains `s-confirm-msg` span and `s-confirm-yes`/`s-confirm-no` buttons (hidden by default). `showResetConfirm()` hides the Reset defaults button and shows the confirm trio, focusing Yes. `hideResetConfirm()` reverses this and returns focus to search. `closeSettings()` now calls `hideResetConfirm()` if pending to clean state. Global KD handles: `Enter`=Yes, `Backspace`=No, `Esc`=No (before the normal Esc staged-close logic). `_doResetDefaults()` extracted as a standalone function used by both Yes-click and Enter-key paths.

**Capture input shortcuts** — `Shift+Backspace`→Clear (replaces old plain `Backspace`→clear); plain `Backspace`→clicks Default button if visible (no-op otherwise); `Enter`→clicks Replace if visible, then captures all `.hk-capture` elements by index at time of press, fires `rep.click()` (which calls `buildHkRows()` rebuilding the DOM), then re-queries captures and focuses `currentIndex+1`, falling back to search field if at end. `Delete` key removed from clear shortcut (was `Backspace||Delete`). Clear button title updated to "Clear (Shift+Backspace)".

SECTIONS index updated.

---
