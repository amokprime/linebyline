---
name: browser-hotkey-system
description: Build a remappable hotkey system for browser-based apps. Use this skill whenever a web app needs keyboard shortcuts, especially when those shortcuts should be user-configurable, need conflict detection, must avoid browser-reserved keys, or involve modifier combos (Ctrl, Shift, Alt). Covers key normalization, restriction rules, capture inputs, conflict detection, and a Settings UI for remapping. Pairs with single-file-html-app for tool/utility apps.
---

A complete, remappable hotkey system for single-file HTML apps. Covers key normalization through a Settings UI with conflict detection.

---

Key normalization

All key handling runs through a single `keyStr(e)` function that produces a canonical string from any KeyboardEvent. This string is what gets stored in config and compared everywhere.

```js
function keyStr(e) {
  const parts = [];
  if (e.ctrlKey)  parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey)   parts.push('Alt');
  const k = e.key;
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(k)) {
    parts.push(k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k);
  }
  return parts.join('+');
}
```

Format examples: `'W'`, `'Ctrl+S'`, `'Shift+ArrowUp'`, `'Space'`, `'Escape'`, `` '`' ``, `'Ctrl+\\'`

Matching stored hotkeys — stored values use the same format. One special case: `'Escape'` may be stored as `'Escape'` but displayed as `'Esc'`:

```js
function hkMatch(ks, stored) {
  return ks === stored || (stored === 'Escape' && ks === 'Escape');
}
```

---

Config structure

Store hotkeys as a flat object inside the main app config:

```js
const DEFAULT_CFG = {
  hotkeys: {
    toggle_mode:    'Tab',
    play_pause:     'Space',
    save:           'Ctrl+S',
    undo:           'Ctrl+Z',
    redo:           'Ctrl+Y',
    settings:       'Ctrl+,',
  },
};
```

Keys are action names (snake_case). Values are canonical keyStr strings or `''` for unassigned.

Human-readable labels (for Settings UI display):

```js
const HK_LABELS = {
  toggle_mode: 'Toggle mode',
  play_pause:  'Play / pause',
  save:        'Save',
  undo:        'Undo',
  redo:        'Redo',
  settings:    'Settings',
};
```

---

Restriction rules

Browsers reserve many key combos. Attempting to intercept them silently fails or causes browser actions. Maintain explicit sets of what to block. Err on the side of over-blocking — a silently-intercepted browser shortcut is a worse user experience than an unavailable hotkey slot.

Keys blocked for all hotkeys:

```js
const RESTRICTED_ALL = new Set([
  'MouseLeft', 'MouseRight',
  'Escape', 'Tab', 'Enter',  // reserved for overlay/cancel/confirm flows
  // Ctrl combos browsers always intercept
  'Ctrl+R', 'Ctrl+F', 'Ctrl+Q', 'Ctrl+W', 'Ctrl+L', 'Ctrl+O',
  'Ctrl+T', 'Ctrl+D', 'Ctrl+M', 'Ctrl+N', 'Ctrl+P', 'Ctrl+H',
  'Ctrl+J', 'Ctrl+U', 'Ctrl+B', 'Ctrl+G',
  // Edit ops — users expect these to work natively everywhere
  'Ctrl+Z', 'Ctrl+Y', 'Ctrl+X', 'Ctrl+C', 'Ctrl+V', 'Ctrl+E', 'Ctrl+K',
  // Dev tools
  'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C', 'Ctrl+Shift+K',
  'Ctrl+Shift+N', 'Ctrl+Shift+O', 'Ctrl+Shift+P',
  'Ctrl+Shift+T', 'Ctrl+Shift+W', 'Ctrl+Shift+Delete',
  // All Meta (Cmd on Mac) combos
  'Meta+A','Meta+B','Meta+C','Meta+D','Meta+E','Meta+F','Meta+G','Meta+H',
  'Meta+I','Meta+J','Meta+K','Meta+L','Meta+M','Meta+N','Meta+O','Meta+P',
  'Meta+Q','Meta+R','Meta+S','Meta+T','Meta+U','Meta+V','Meta+W','Meta+X',
  'Meta+Y','Meta+Z',
  'Meta+0','Meta+1','Meta+2','Meta+3','Meta+4','Meta+5',
  'Meta+6','Meta+7','Meta+8','Meta+9',
  'Meta+Left','Meta+Right','Meta+Up','Meta+Down',
  'Meta+Shift+I','Meta+Shift+J','Meta+Shift+C',
  // All Alt combos — fingerprinting-resistant browsers remap many of these;
  // blanket-block is safer than enumerating safe ones
  'Alt+A','Alt+B','Alt+C','Alt+D','Alt+E','Alt+F','Alt+G','Alt+H','Alt+I','Alt+J',
  'Alt+K','Alt+L','Alt+M','Alt+N','Alt+O','Alt+P','Alt+Q','Alt+R','Alt+S','Alt+T',
  'Alt+U','Alt+V','Alt+W','Alt+X','Alt+Y','Alt+Z',
  'Alt+0','Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6','Alt+7','Alt+8','Alt+9',
  'Alt+Left','Alt+Right','Alt+Up','Alt+Down',
  // Navigation / system
  'Home', 'End', 'Insert', 'Delete', 'Backspace',
  'NumLock', 'ScrollLock', 'Meta', 'PrintScreen', 'ContextMenu',
  // All F-keys
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);
```

Tab, Enter, Escape are always blocked from being assigned as hotkeys because they serve as universal UI navigation primitives. Ctrl+O and Ctrl+D are blocked because Firefox/Chrome intercept them for open-file and bookmark before JS can. Ctrl+M is blocked at the OS audio mute level on many systems.

App-level reserved keys

Some apps pre-emptively reserve specific keys for fixed actions (isRestrictedForKey guards like "Ctrl+; is reserved for Save"). This pattern is usually not worth the friction — users who try to assign a key to action A and get a confusing "reserved for action B" error will be annoyed, even when they'd be fine with giving B a different key. Let the normal conflict flow (Replace button) handle it instead. The only exception is keys genuinely never remappable for any action (already handled by RESTRICTED_ALL).

```js
function isRestrictedForAll(ks) {
  if (RESTRICTED_ALL.has(ks)) return `"${ks}" is reserved by the browser`;
  return null;
}

function isRestrictedForKey(ks, actionKey) {
  const allMsg = isRestrictedForAll(ks);
  if (allMsg) return allMsg;
  // Per-action restrictions only for structural reasons (e.g. mode toggles
  // that activate while typing must not be plain letters):
  if ((actionKey === 'toggle_mode' || actionKey === 'offset_mode_toggle')
      && ALPHA_NUM_SPACE_RE.test(ks)) {
    return 'Letters, numbers, and Space are not allowed for this action';
  }
  return null;
}
```

Special restrictions per action — some actions should not be plain alphanumeric keys (e.g. mode toggles that activate while typing):

```js
const ALPHA_NUM_SPACE_RE = /^(([A-Z]|[0-9]|Space)$|Shift\+[A-Z0-9]$)/;
```

---

Settings UI — hotkey capture rows

Each action gets a row: [label] [capture input] [clear button] [replace button] [reset button] [warning]

Capture input behavior

The input is readonly and intercepts keydown rather than accepting typed text:

```js
input.addEventListener('focus', () => {
  input.value = '…'; // placeholder while awaiting keypress
  prevVal = cfg.hotkeys[key] || '';
});

input.addEventListener('blur', () => {
  if (input.value === '…') input.value = prevVal; // revert if no key pressed
});

input.addEventListener('keydown', e => {
  // Tab must reach the Settings focus trap BEFORE any other handling.
  // Calling e.preventDefault() here before the trap sees Tab causes
  // activeElement to detach, giving index -1, snapping focus to element 0
  // on every Tab. Fix: block native Tab, then return — the global focus-trap
  // handler moves focus.
  if (e.key === 'Tab') { e.preventDefault(); return; }

  e.preventDefault();

  // Shift+Backspace = clear (unassign) and stay focused
  if (e.key === 'Backspace' && e.shiftKey) { clearHotkey(true); return; }

  // Backspace = activate Default button if visible (advances focus to next capture),
  // no-op otherwise. Lets users "reset and move on" without the mouse.
  if (e.key === 'Backspace') {
    if (resetBtn.classList.contains('visible')) {
      const allCaptures = () => Array.from(
        document.getElementById('hk-settings-rows').querySelectorAll('.hk-capture')
      );
      const curIdx = allCaptures().indexOf(input);
      resetBtn.click();
      const next = allCaptures()[curIdx + 1];
      if (next) next.focus(); else searchInput.focus();
    }
    return;
  }

  // Enter = activate Replace button if visible (conflict pending), then advance focus.
  // If no conflict, just advance to next capture.
  if (e.key === 'Enter') {
    const allCaptures = () => Array.from(
      document.getElementById('hk-settings-rows').querySelectorAll('.hk-capture')
    );
    const curIdx = allCaptures().indexOf(input);
    if (replaceBtn.classList.contains('visible')) {
      replaceBtn.click();
      const next = allCaptures()[curIdx + 1];
      if (next) next.focus(); else searchInput.focus();
    } else {
      input.blur();
      const next = allCaptures()[curIdx + 1];
      if (next) next.focus(); else searchInput.focus();
    }
    return;
  }

  if (e.key === 'Escape') { revertAndExit(); return; }

  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

  const newVal    = keyStr(e);
  const newStored = newVal === 'Esc' ? 'Escape' : newVal;

  const restrictMsg = isRestrictedForKey(newStored, key);
  if (restrictMsg) {
    showRestrictionWarning(restrictMsg);
    revertAndExit(); return;
  }

  const conflict = Object.entries(cfg.hotkeys).find(([k2, v]) => k2 !== key && v === newStored);
  if (conflict) {
    showConflict(conflict[0]);
    pendingVal = newStored;
    return;
  }

  cfg.hotkeys[key] = newStored;
  input.value = newVal;
  saveCfg();
  updateHotkeyPanel();
  updateTooltips();
  // Do NOT call input.blur() here. Keeping focus lets the user Tab to the next
  // capture input naturally. Blurring gives no visual confirmation and forces re-Tab.
});
```

Conflict resolution — when a conflict is detected, show a "Replace" button that steals the key from the other action:

```js
replaceBtn.addEventListener('click', () => {
  if (!conflictKey) return;
  cfg.hotkeys[conflictKey] = '';
  cfg.hotkeys[key] = pendingVal;
  saveCfg();
  rebuildHkRows();
  updateHotkeyPanel();
  updateTooltips();
});
```

Reset to default:

```js
resetBtn.addEventListener('click', () => {
  const def = DEFAULT_CFG.hotkeys[key] || '';
  // If another action currently holds this default value, blank it first —
  // otherwise restoring the default silently creates a duplicate binding.
  if (def) {
    const holder = Object.entries(cfg.hotkeys).find(([k2, v]) => k2 !== key && v === def);
    if (holder) {
      cfg.hotkeys[holder[0]] = '';
      saveCfg();
      rebuildHkRows(); // full rebuild so the other field's DOM updates too
      return;          // rebuildHkRows will re-render this row with the default set
    }
  }
  cfg.hotkeys[key] = def;
  saveCfg();
  input.value = def === 'Escape' ? 'Esc' : def;
  updateHotkeyPanel();
  updateTooltips();
});
```

Show the reset button when the current value differs from the default, or when a restriction warning or unresolved conflict is active (those states require Reset to clear):

```js
function updateResetVisibility() {
  const live = cfg.hotkeys[key] || '';
  const def  = DEFAULT_CFG.hotkeys[key] || '';
  const nonDefault    = live !== def;
  const hasWarning    = restrictWarnEl.classList.contains('visible');
  const hasConflict   = !!conflictKey;
  resetBtn.classList.toggle('visible', nonDefault || hasWarning || hasConflict);
}
```

Search in Settings — settings panels often get long. Support filtering by text search (match setting label text against a query string) and hotkey search (capture a key and highlight only the row(s) assigned to it).

```js
let searchHkMode = false;
searchInput.addEventListener('keydown', e => {
  if (searchHkMode) {
    e.preventDefault();
    if (e.key === 'Escape' || e.key === 'Backspace') { exitHkSearch(); return; }
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    const ks = keyStr(e);
    searchInput.value = ks;
    filterRowsByHotkey(ks);
  }
});

function filterRowsByHotkey(ks) {
  document.querySelectorAll('[data-hk-key]').forEach(inp => {
    const stored = cfg.hotkeys[inp.dataset.hkKey] || '';
    const row = inp.closest('.hk-row');
    row.classList.toggle('hidden', stored !== ks);
  });
}
```

---

Modal focus trap

When a Settings overlay is open, Tab/Shift+Tab must stay inside the modal window. Without a trap, Tab escapes into background elements, and keyboard-only users can interact with things behind the overlay.

Enumerate focusable elements at trap time — query the modal window at the moment Tab fires, not at open time. Transient buttons (.hk-clear, .hk-reset, .hk-replace) appear and disappear as capture inputs are focused. A stale list will include detached elements whose offsetParent is null, causing indexOf to return -1 and snapping focus to element 0 on every Tab.

```js
document.addEventListener('keydown', e => {
  const settingsOpen = /* overlay is open */;
  if (settingsOpen && e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    const win = document.getElementById('settings-win');
    const focusable = Array.from(
      win.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
    ).filter(el =>
      !el.disabled &&
      el.offsetParent !== null &&
      !el.classList.contains('hk-clear') &&
      !el.classList.contains('hk-reset') &&
      !el.classList.contains('hk-replace')
    );
    if (!focusable.length) return;
    const idx  = focusable.indexOf(document.activeElement);
    const next = e.shiftKey
      ? Math.max(0, idx - 1)
      : Math.min(focusable.length - 1, idx + 1);
    focusable[next].focus();
    return;
  }
});
```

Use Math.max/Math.min (stopping at boundary) instead of circular wrap. Circular wrap means Shift+Tab from the first element lands on the last, which can disorient users.

Exclude hidden regions with inert — if a sidebar or panel can be collapsed, set `panel.inert = true` when collapsing and `panel.inert = false` when expanding. This removes all its children from the Tab order and from screen-reader navigation without manual enumeration.

```js
function applyPanelCollapse(transferFocus) {
  const panel = document.getElementById('left-panel');
  panel.classList.toggle('collapsed', panelCollapsed);
  panel.inert = panelCollapsed;
  if (transferFocus) {
    if (panelCollapsed) expandBtn.focus();
    else collapseBtn.focus();
  }
}
```

The search-field Tab leak — if your modal has a search input whose onkeydown calls e.stopPropagation() unconditionally, Tab will never reach the global trap handler. Add an early return for Tab in the search handler:

```js
searchInput.onkeydown = e => {
  if (e.key === 'Tab') return; // let the global focus trap handle it
  e.stopPropagation();
};
```

The same applies to hk-mode search: add `if (e.key === 'Tab') { return; }` before the e.preventDefault() / e.stopPropagation() block.

Accessibility — the JS focus trap helps keyboard users but does nothing for screen-reader virtual cursor. Add semantics to the modal element:

```html
<div id="settings-win" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
  <span id="settings-heading">Settings</span>
  ...
</div>
```

---

Global keyboard handler

A single `document.addEventListener('keydown', ...)` dispatches all hotkeys. Structure it in layers:

```js
document.addEventListener('keydown', e => {
  const ks = keyStr(e);
  const hk = cfg.hotkeys;
  const settingsOpen = document.getElementById('settings-overlay').classList.contains('open');

  // Key-repeat guard: suppress repeated firing of held hotkeys.
  // Navigation keys (arrows, Tab) are exempt — holding them should scroll/move.
  // Mode-toggle keys need e.preventDefault() even on repeat to stop characters
  // being typed into textareas while the key is held.
  const isNavKey = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.key);
  if (e.repeat && !isNavKey) {
    if (hkMatch(ks, hk.toggle_mode) || hkMatch(ks, hk.offset_mode_toggle)) {
      e.preventDefault();
    }
    return;
  }

  // Suppress hotkey dispatch when a focusable UI element outside the lyric/content
  // area has keyboard focus. Without this, pressing Enter on a focused toolbar
  // button fires both the button's click AND any Enter-bound hotkey (e.g. syncLine).
  // Allow Ctrl/Alt combos through — those are intentional shortcuts, not accidental Enter.
  const ae = document.activeElement;
  const inContentArea = ae && (
    ae === document.getElementById('main-textarea') ||
    ae === document.getElementById('main-lines') ||
    ae === document.body ||
    ae === document.documentElement
  );
  const isFocusedUI = ae && !inContentArea && (
    ae.tagName === 'BUTTON' || ae.tagName === 'INPUT' ||
    ae.tagName === 'SELECT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'A'
  );
  if (isFocusedUI && !e.ctrlKey && !e.altKey) return;

  // Layer 1: Always-active (work even with overlays open)
  if (hkMatch(ks, hk.settings)) { e.preventDefault(); toggleSettings(); return; }
  if (e.key === 'Escape') {
    if (settingsOpen) { e.preventDefault(); closeSettings(); return; }
  }

  // Layer 2: Skip hotkeys when Settings (or other overlay) is open
  if (settingsOpen) return;

  // Layer 3: Skip hotkeys in typing mode
  if (!hotkeyMode) {
    if (hkMatch(ks, hk.undo))  { e.preventDefault(); doUndo(); return; }
    if (hkMatch(ks, hk.save))  { e.preventDefault(); doSave(); return; }
    return;
  }

  // Layer 4: Hotkey-mode-only actions
  if (hkMatch(ks, hk.play_pause)) { e.preventDefault(); togglePlay(); return; }
});
```

Hotkey-mode vs typing-mode — many apps have a mode switch: in "hotkey mode" single letters fire actions; in "typing mode" the textarea has focus. Distinguish them with a boolean flag and define which actions are hotkey-mode-only:

```js
let hotkeyMode = true;
function applyMode() {
  if (hotkeyMode) {
    textarea.classList.remove('active');
  } else {
    textarea.classList.add('active');
    textarea.focus();
  }
  rebuildHkPanel();
}

const HOTKEY_ONLY = new Set([
  'play_pause', 'sync', 'prev_line', 'next_line',
  'ts_back_small', 'ts_fwd_small',
]);
```

Dim these in the HK panel when in typing mode, and skip them in the keydown handler.

---

Secondary textareas (multi-panel apps)

If the app has secondary textarea elements (not the main editing area), those need their own keydown handling to: (1) let the browser handle navigation keys, (2) block hotkey-mode-only shortcuts from firing while the user is typing, (3) pass through general shortcuts (undo, save, add/remove panel).

```js
secTextarea.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End',
       'PageUp','PageDown'].includes(e.key)) { e.stopPropagation(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'A') { e.stopPropagation(); return; }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) { e.stopPropagation(); return; }
  if ([' ', 'Enter', 'Tab', 'Escape'].includes(e.key)) { e.stopPropagation(); return; }

  const SEC_BLOCKED = new Set([
    ...HOTKEY_ONLY,
    'toggle_mode', 'offset_mode_toggle', 'clear_sel', 'replay_line', 'replay_end'
  ]);
  const ks = keyStr(e);
  const blockedHotkeys = Object.entries(cfg.hotkeys)
    .filter(([k]) => SEC_BLOCKED.has(k))
    .map(([, v]) => v)
    .filter(Boolean);
  if (blockedHotkeys.includes(ks)) { e.stopPropagation(); return; }
  // Let everything else (Ctrl+S, Ctrl+Z, etc.) bubble to the document handler
});
```

---

Controls panel (visual hotkey reference)

A sidebar grid showing all available actions with their current hotkeys is a major UX win. Rebuild it whenever config changes or mode switches. The panel doubles as a clickable button grid, so mouse users can trigger actions without knowing the hotkeys.

```js
function rebuildHkPanel() {
  const grid = document.getElementById('hk-grid');
  grid.innerHTML = '';
  ACTIONS_TO_SHOW.forEach(([actionKey, label]) => {
    const cell = document.createElement('div');
    cell.className = 'hk-cell';
    const dimmed = !hotkeyMode && HOTKEY_ONLY.has(actionKey);
    if (dimmed) cell.style.opacity = '0.35';
    cell.innerHTML = `<span>${label}</span><span class="hk-key">${cfg.hotkeys[actionKey] || '—'}</span>`;
    cell.addEventListener('click', () => {
      if (!dimmed && CTRL_ACTIONS[actionKey]) CTRL_ACTIONS[actionKey]();
    });
    grid.appendChild(cell);
  });
}
```

---

Migration patterns

When you change a default hotkey between versions, users with old config will silently have the old key. Fix this in loadCfg():

```js
if (d.hotkeys) {
  if (d.hotkeys.save === 'Ctrl+S') c.hotkeys.save = 'Ctrl+;';
  if (d.hotkeys.open === 'Ctrl+M') c.hotkeys.open = 'Ctrl+O';
}
```

---

Summary checklist

- keyStr(e) normalizes all key events to canonical strings
- RESTRICTED_ALL blocks browser-reserved keys in Settings capture (includes Tab, Enter, Ctrl+D, Ctrl+M, Ctrl+O, and all Meta/Alt combos)
- Per-action restrictions only for structural reasons (e.g. no letters for mode toggles); no pre-emptive per-key app reservations
- Conflict detection with Replace button
- Reset to default button blanks any other holder of that default first, then calls rebuildHkRows() for full DOM refresh
- Capture input keydown: Tab first (e.preventDefault(); return;), then Shift+Backspace=clear, Backspace=default+advance, Enter=replace+advance, Escape=revert
- Focus stays on capture input after clean save (no input.blur()); user Tabs away when ready
- Modal focus trap: enumerate focusable elements at Tab-time (not open-time), exclude transient buttons, use Math.max/Math.min stops (not circular wrap)
- Collapsed panels use panel.inert = true to remove children from Tab order
- Search field onkeydown has if (e.key === 'Tab') return; before any stopPropagation
- role="dialog" aria-modal="true" aria-labelledby on modal window element
- e.repeat guard in global handler: bail early for all non-nav keys; e.preventDefault() for mode-toggle keys even on repeat
- Focused-UI-element guard: suppress hotkey dispatch when a button/input/select/a outside the content area has focus (unless ctrlKey/altKey)
- Optional hotkey search in Settings
- Global handler structured in layers (repeat guard → focused-UI guard → always-active → overlay guard → mode guard → actions)
- Secondary textarea keydown handlers block HOTKEY_ONLY actions from bubbling
- Controls panel rebuilt on every config or mode change
- Dynamic tooltips updated after every config change
- Migration logic in loadCfg() for any renamed/moved hotkeys
