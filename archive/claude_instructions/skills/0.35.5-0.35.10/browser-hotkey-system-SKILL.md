---
name: browser-hotkey-system
description: Build a remappable hotkey system for browser-based apps. Use this skill whenever a web app needs keyboard shortcuts, especially when those shortcuts should be user-configurable, need conflict detection, must avoid browser-reserved keys, or involve modifier combos (Ctrl, Shift, Alt). Covers key normalization, restriction rules, capture inputs, conflict detection, and a Settings UI for remapping. Pairs with single-file-html-app for tool/utility apps.
---

# Browser Hotkey System

A complete, remappable hotkey system for single-file HTML apps. Covers everything from key normalization to a Settings UI with conflict detection.

---

## Key normalization

All key handling runs through a single `keyStr(e)` function that produces a canonical string from any `KeyboardEvent`. This string is what gets stored in config and compared everywhere.

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

**Format examples**: `'W'`, `'Ctrl+S'`, `'Shift+ArrowUp'`, `'Space'`, `'Escape'`, `` '`' ``, `'Ctrl+\`'`

**Matching stored hotkeys**: Stored values use the same format. One special case — `'Escape'` may be stored as `'Escape'` but displayed as `'Esc'`:

```js
function hkMatch(ks, stored) {
  return ks === stored || (stored === 'Escape' && ks === 'Escape');
}
```

---

## Config structure

Store hotkeys as a flat object inside the main app config:

```js
const DEFAULT_CFG = {
  // ...other settings...
  hotkeys: {
    toggle_mode:    'Tab',
    play_pause:     'Space',
    save:           'Ctrl+S',
    undo:           'Ctrl+Z',
    redo:           'Ctrl+Y',
    settings:       'Ctrl+,',
    // add all actions here
  },
};
```

Keys are action names (snake_case). Values are canonical keyStr strings or `''` for unassigned.

**Human-readable labels** (for Settings UI display):

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

## Restriction rules

Browsers reserve many key combos. Attempting to intercept them silently fails or causes browser actions. Maintain explicit sets of what to block.

### Keys blocked for all hotkeys

```js
const RESTRICTED_ALL = new Set([
  'MouseLeft', 'MouseRight',
  'Escape', // reserved for overlay close / cancel — never remappable
  // Ctrl combos browsers always intercept
  'Ctrl+R', 'Ctrl+F', 'Ctrl+Q', 'Ctrl+W', 'Ctrl+L',
  'Ctrl+T', 'Ctrl+N', 'Ctrl+P', 'Ctrl+H', 'Ctrl+J', 'Ctrl+U',
  'Ctrl+B', 'Ctrl+G',
  'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C',
  // All Alt combos — fingerprinting-resistant browsers remap many of these;
  // blanket-block is safer than trying to enumerate safe ones
  'Alt+A','Alt+B','Alt+C','Alt+D','Alt+E','Alt+F','Alt+G','Alt+H','Alt+I','Alt+J',
  'Alt+K','Alt+L','Alt+M','Alt+N','Alt+O','Alt+P','Alt+Q','Alt+R','Alt+S','Alt+T',
  'Alt+U','Alt+V','Alt+W','Alt+X','Alt+Y','Alt+Z',
  'Alt+0','Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6','Alt+7','Alt+8','Alt+9',
  'Alt+Left','Alt+Right','Alt+Up','Alt+Down',
  // Navigation / system
  'Home', 'End', 'Insert', 'Delete', 'Backspace',
  'NumLock', 'ScrollLock', 'Meta', 'PrintScreen', 'ContextMenu',
  // Ctrl+M: browsers and OS-level audio mute; hardcoded in many apps — always block
  'Ctrl+M',
  // All F-keys
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);
```

### App-level reserved keys

Some keys are fixed by your app (not user-remappable for safety). The exact guards are **app-specific** — replace the examples below with whatever your app hardcodes:

```js
function isRestrictedForAll(ks) {
  if (RESTRICTED_ALL.has(ks)) return `"${ks}" is reserved by the browser`;
  return null;
}

function isRestrictedForKey(ks, actionKey) {
  const allMsg = isRestrictedForAll(ks);
  if (allMsg) return allMsg;
  // Guard any hotkeys your app treats as fixed (adjust to your actual actions):
  if (ks === 'Ctrl+;' && actionKey !== 'save')      return 'Ctrl+; is reserved for Save';
  if (ks === 'Ctrl+,' && actionKey !== 'settings')  return 'Ctrl+, is reserved for Settings';
  if (ks === 'Ctrl+/' && actionKey !== 'help')      return 'Ctrl+/ is reserved for Help';
  return null;
}
```

### Special restrictions per action

Some actions should not be plain alphanumeric keys (e.g. mode toggles that activate while typing):

```js
// Matches A-Z, 0-9, Space, Shift+letter — bare letters that conflict with typing
const ALPHA_NUM_SPACE_RE = /^(([A-Z]|[0-9]|Space)$|Shift\+[A-Z0-9]$)/;

// In isRestrictedForKey, add:
if ((actionKey === 'toggle_mode' || actionKey === 'offset_mode_toggle')
    && ALPHA_NUM_SPACE_RE.test(ks)) {
  return 'Letters, numbers, and Space are not allowed for this action';
}
```

---

## Settings UI — hotkey capture rows

Each action gets a row: `[label] [capture input] [clear button] [replace button] [reset button] [warning]`

### Capture input behavior

The input is `readonly` and intercepts `keydown` rather than accepting typed text:

```js
// HTML: <input class="hk-capture" data-hk-key="save" readonly>

input.addEventListener('focus', () => {
  input.value = '…'; // placeholder while awaiting keypress
  prevVal = cfg.hotkeys[key] || '';
});

input.addEventListener('blur', () => {
  if (input.value === '…') input.value = prevVal; // revert if no key pressed
});

input.addEventListener('keydown', e => {
  e.preventDefault();

  if (e.key === 'Backspace' || e.key === 'Delete') {
    clearHotkey(); return; // Backspace/Delete = unassign
  }
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return; // modifier only, ignore

  const newVal    = keyStr(e);
  const newStored = newVal === 'Esc' ? 'Escape' : newVal;

  // Check restriction
  const restrictMsg = isRestrictedForKey(newStored, key);
  if (restrictMsg) {
    showRestrictionWarning(restrictMsg);
    revertAndExit(); return;
  }

  // Check conflict
  const conflict = Object.entries(cfg.hotkeys).find(([k2, v]) => k2 !== key && v === newStored);
  if (conflict) {
    showConflict(conflict[0]); // show "Replace" button
    pendingVal = newStored;
    return; // don't save yet, wait for Replace or another key
  }

  // All clear — save
  cfg.hotkeys[key] = newStored;
  input.value = newVal;
  saveCfg();
  updateHotkeyPanel();
  updateTooltips();
  input.blur();
});
```

### Conflict resolution

When a conflict is detected, show a "Replace" button that steals the key from the other action:

```js
replaceBtn.addEventListener('click', () => {
  if (!conflictKey) return;
  cfg.hotkeys[conflictKey] = ''; // unassign from the other action
  cfg.hotkeys[key] = pendingVal;
  saveCfg();
  rebuildHkRows(); // redraw all rows (the other one needs to update too)
  updateHotkeyPanel();
  updateTooltips();
});
```

### Reset to default

```js
resetBtn.addEventListener('click', () => {
  cfg.hotkeys[key] = DEFAULT_CFG.hotkeys[key] || '';
  saveCfg();
  input.value = cfg.hotkeys[key] === 'Escape' ? 'Esc' : cfg.hotkeys[key];
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

### Search in Settings

Settings panels often get long. Support filtering by:
- **Text search**: match setting label text against a query string
- **Hotkey search**: capture a key and highlight only the row(s) assigned to it

```js
let searchHkMode = false;

searchInput.addEventListener('keydown', e => {
  if (searchHkMode) {
    e.preventDefault();
    if (e.key === 'Escape' || e.key === 'Backspace') {
      exitHkSearch(); return;
    }
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

## Global keyboard handler

A single `document.addEventListener('keydown', ...)` dispatches all hotkeys. Structure it in layers:

```js
document.addEventListener('keydown', e => {
  const ks = keyStr(e);
  const hk = cfg.hotkeys;
  const settingsOpen = document.getElementById('settings-overlay').classList.contains('open');

  // Layer 1: Always-active (work even with overlays open)
  if (hkMatch(ks, hk.settings)) { e.preventDefault(); toggleSettings(); return; }
  if (e.key === 'Escape') {
    if (settingsOpen) { e.preventDefault(); closeSettings(); return; }
  }

  // Layer 2: Skip hotkeys when Settings (or other overlay) is open
  if (settingsOpen) return;

  // Layer 3: Skip hotkeys in typing mode
  if (!hotkeyMode) {
    // Only pass through non-hotkey-mode actions here (undo, save, etc.)
    if (hkMatch(ks, hk.undo))  { e.preventDefault(); doUndo(); return; }
    if (hkMatch(ks, hk.save))  { e.preventDefault(); doSave(); return; }
    return;
  }

  // Layer 4: Hotkey-mode-only actions
  if (hkMatch(ks, hk.play_pause)) { e.preventDefault(); togglePlay(); return; }
  // ...etc
});
```

### Hotkey-mode vs typing-mode

Many apps have a mode switch: in "hotkey mode" single letters fire actions; in "typing mode" the textarea has focus. Distinguish them with a boolean flag:

```js
let hotkeyMode = true;

function applyMode() {
  if (hotkeyMode) {
    textarea.classList.remove('active');
    // hide textarea, show rendered view
  } else {
    textarea.classList.add('active');
    textarea.focus();
  }
  rebuildHkPanel(); // update mode indicator in the UI
}
```

Define which actions are hotkey-mode-only:

```js
const HOTKEY_ONLY = new Set([
  'play_pause', 'sync', 'prev_line', 'next_line',
  'ts_back_small', 'ts_fwd_small', // etc.
]);
```

Dim these in the HK panel when in typing mode, and skip them in the keydown handler.

---

## Secondary textareas (multi-panel apps)

If the app has secondary `<textarea>` elements (not the main editing area), those textareas need their own keydown handling to:
1. Let the browser handle navigation keys (`ArrowUp`, `ArrowDown`, `Ctrl+A`, etc.)
2. Block hotkey-mode-only shortcuts from firing while the user is typing
3. Pass through general shortcuts (undo, save, add/remove panel)

```js
secTextarea.addEventListener('keydown', e => {
  // Always let textarea handle its own cursor movement
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End',
       'PageUp','PageDown'].includes(e.key)) {
    e.stopPropagation(); return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'A') {
    e.stopPropagation(); return;
  }
  // Block single printable characters from firing hotkeys
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
    e.stopPropagation(); return;
  }
  // Block Space/Enter/Tab/Escape — these have special roles in hotkey mode
  if ([' ', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
    e.stopPropagation(); return;
  }
  // Block hotkey-mode-only actions AND related actions that shouldn't fire in a textarea.
  // Include HOTKEY_ONLY plus any actions that navigate/modify the main content
  // (e.g. clear_sel, replay_line, toggle_mode, offset_mode_toggle in LineByLine):
  const SEC_BLOCKED = new Set([
    ...HOTKEY_ONLY,
    'toggle_mode', 'offset_mode_toggle', 'clear_sel', 'replay_line', 'replay_end'
    // Add any other action keys that must not fire while typing
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

## Controls panel (visual hotkey reference)

A sidebar grid showing all available actions with their current hotkeys is a major UX win. Rebuild it whenever config changes or mode switches.

```js
function rebuildHkPanel() {
  const grid = document.getElementById('hk-grid');
  grid.innerHTML = '';
  ACTIONS_TO_SHOW.forEach(([actionKey, label]) => {
    const cell = document.createElement('div');
    cell.className = 'hk-cell';
    const dimmed = !hotkeyMode && HOTKEY_ONLY.has(actionKey);
    if (dimmed) cell.style.opacity = '0.35';
    cell.innerHTML = `
      <span>${label}</span>
      <span class="hk-key">${cfg.hotkeys[actionKey] || '—'}</span>
    `;
    cell.addEventListener('click', () => {
      if (!dimmed && CTRL_ACTIONS[actionKey]) CTRL_ACTIONS[actionKey]();
    });
    grid.appendChild(cell);
  });
}
```

The panel doubles as a clickable button grid, so mouse users can trigger actions without knowing the hotkeys.

---

## Migration patterns

When you change a default hotkey between versions, users with old config will silently have the old key. Fix this in `loadCfg()`:

```js
// In loadCfg(), after merging:
if (d.hotkeys) {
  if (d.hotkeys.save === 'Ctrl+S') c.hotkeys.save = 'Ctrl+;'; // changed in v2
  if (d.hotkeys.open === 'Ctrl+M') c.hotkeys.open = 'Ctrl+O';
}
```

---

## Summary checklist

- [ ] `keyStr(e)` normalizes all key events to canonical strings
- [ ] `RESTRICTED_ALL` blocks browser-reserved keys in Settings capture
- [ ] Per-action restrictions (e.g. no letters for mode toggles)
- [ ] Conflict detection with "Replace" button
- [ ] "Reset to default" button on changed rows
- [ ] Optional hotkey search in Settings
- [ ] Global handler structured in layers (always-active → overlay guard → mode guard → actions)
- [ ] Secondary textarea `keydown` handlers block HOTKEY_ONLY actions from bubbling
- [ ] Controls panel rebuilt on every config or mode change
- [ ] Dynamic tooltips updated after every config change
- [ ] Migration logic in `loadCfg()` for any renamed/moved hotkeys
