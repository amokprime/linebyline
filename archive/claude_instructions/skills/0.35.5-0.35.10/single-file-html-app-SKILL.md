---
name: single-file-html-app
description: Build self-contained single-file web apps delivered as a single .html file with no build step, no external dependencies (except optional CDN scripts), and no server. Use this skill whenever the user wants a desktop-style tool, utility app, editor, or workflow app that runs by opening an HTML file locally in a browser — especially when they mention things like "no install", "just open it", "download and use", "single file", or when the app needs persistent settings, undo/redo, hotkeys, file import/export, or multiple UI panels. Also use for apps that will be hosted as a single static page on GitHub Pages or similar. This skill complements frontend-design (aesthetics) and browser-hotkey-system (remappable hotkeys) — read those skills too when relevant.
---

# Single-File HTML App

A self-contained web app is everything in one `.html` file: markup, CSS, and JS together, no bundler, no framework, no server. The browser IS the runtime. This constraint shapes every architectural decision.

## When to use this pattern

- The user wants to "just open a file" or share something by sending one file
- A tool or utility that doesn't need a backend
- Productivity apps, editors, configurators, games, converters
- Apps that need to persist settings across sessions (localStorage)
- Apps that need to persist work within a session but not across reloads (sessionStorage)

---

## File Structure

All code lives in one file in this order:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AppName</title>
  <!-- favicon as inline SVG data URI — no external file needed -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">
  <style>
    /* ALL CSS here */
  </style>
</head>
<body>
  <!-- ALL HTML here -->
  <script>
    'use strict';
    // ALL JS here
  </script>
</body>
</html>
```

Always open with `'use strict';` in the script block.

### External dependencies (CDN only, use sparingly)

If a library is genuinely needed (e.g. a parser, a charting lib), load it from a CDN inside `<head>`. Do not use npm or bundlers. Prefer zero dependencies — vanilla JS covers most UI needs.

---

## CSS Architecture

### CSS Variables for theming

Define all colors, spacing, and type sizes as CSS variables on `:root`. This makes light/dark theming a one-line swap and avoids magic numbers everywhere.

```css
:root {
  --bg: #f6f8fa;
  --surface: #ffffff;
  --border: #d0d7de;
  --text: #24292f;
  --text-muted: #656d76;
  --accent: #0969da;
  --accent-bg: #ddf4ff;
  --radius: 6px;
  --font-mono: 'Courier New', Courier, monospace;
}
[data-theme="dark"] {
  --bg: #161b22;
  --surface: #0d1117;
  --border: #30363d;
  --text: #e6edf3;
  --accent: #58a6ff;
  --accent-bg: #121d2f;
}
```

Toggle dark mode with: `document.documentElement.setAttribute('data-theme', 'dark')` and persist to `localStorage`.

### Layout skeleton

Most tool/editor apps use this pattern:

```css
body { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
#menu-bar { flex-shrink: 0; /* fixed height toolbar */ }
#main    { display: flex; flex: 1; overflow: hidden; min-height: 0; }
#sidebar { width: 280px; flex-shrink: 0; overflow-y: auto; }
#content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
```

`min-height: 0` on flex children is required to prevent overflow in nested flex containers — a very common source of layout bugs.

### Box-sizing reset

Always include:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
```

---

## JS Architecture

### Config and defaults

Define a `DEFAULT_CFG` object at the top with every setting. This serves as both documentation and the reset target. Store user config separately in `localStorage`.

```js
const DEFAULT_CFG = {
  // feature flags
  some_option: true,
  // numeric settings
  delay_ms: 200,
  // nested
  hotkeys: {
    action_name: 'Ctrl+S',
  },
};

function loadCfg() {
  try {
    const stored = localStorage.getItem('app_cfg');
    // Use JSON round-trip for deep clone — more broadly compatible than structuredClone
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_CFG));
    const d = JSON.parse(stored);
    const c = JSON.parse(JSON.stringify(DEFAULT_CFG));
    Object.assign(c, d);
    c.hotkeys = Object.assign({}, DEFAULT_CFG.hotkeys, d.hotkeys || {});
    // Migration: fix renamed/moved/removed keys here (see pattern below)
    return c;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_CFG));
  }
}
function saveCfg() { localStorage.setItem('app_cfg', JSON.stringify(cfg)); }
let cfg = loadCfg();
```

**Migration pattern**: When you rename, remove, or restructure a config key between versions, add explicit migration logic in `loadCfg()`. Users with old `localStorage` values should get a sane result, not a crash or a stale value.

```js
// Inside loadCfg(), after Object.assign:

// Rename: old key → new key
if (d.old_key !== undefined && c.new_key === undefined) c.new_key = d.old_key;

// Hotkey rename or reset to new default
if (d.hotkeys?.save === 'Ctrl+S') c.hotkeys.save = 'Ctrl+;';

// Remove deprecated key entirely
if (c.hotkeys.mute) delete c.hotkeys.mute;

// Add missing key that didn't exist in old config
if (!c.hotkeys.theme_toggle) c.hotkeys.theme_toggle = 'Ctrl+.';
```

### Non-config state storage

Some state is simple enough to store directly as individual `localStorage` items at declaration time, separate from `cfg`. This avoids having to version-migrate them and keeps `loadCfg` smaller:

```js
let themeMode = localStorage.getItem('app_theme') || 'light';
let editorFont = localStorage.getItem('app_font') || 'system-ui, sans-serif';
let editorSize = parseFloat(localStorage.getItem('app_fsize')) || 14;
let masterVolume = parseFloat(localStorage.getItem('app_vol') ?? '1');
let masterMuted = localStorage.getItem('app_muted') === '1';

// Save individually when changed:
function saveEditorFont() {
  localStorage.setItem('app_font', editorFont);
  localStorage.setItem('app_fsize', editorSize);
}
```

Use this for display preferences (theme, font, volume) that change independently, have simple scalar values, and don't need to be reset together with `cfg`.

### State variables

Declare all mutable state at the top level, grouped and commented:

```js
// ── UI state ─────────────────────────────────────────────────────────────────
let activePanel = 'main';
let isDirty = false;

// ── Data state ───────────────────────────────────────────────────────────────
let currentFile = null;
let items = [];
```

### Session vs persistent storage

| What | Where | When cleared |
|---|---|---|
| User settings/preferences (`cfg`) | `localStorage` under one key | Never (until user resets) |
| Display prefs (theme, font, volume) | `localStorage` as separate individual keys | Never |
| Current work in progress | `sessionStorage` | On tab close |
| Loaded file content | `sessionStorage` | On tab close |

Store display preferences as separate `localStorage` items (not inside `cfg`) so they can be read and written independently without re-serializing all settings. See "Non-config state storage" above.

Always autosave work-in-progress to `sessionStorage` on every meaningful change, and reload it on init. This survives accidental refresh without surprising the user with stale data on next launch.

```js
function doAutosave() {
  sessionStorage.setItem('app_autosave', JSON.stringify({ content: getContent() }));
}
function loadAutosave() {
  try {
    const s = sessionStorage.getItem('app_autosave');
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}
```

### Snapshot-based undo/redo

Simpler and more robust than diff-based undo for most tool apps. Push a full snapshot of all mutable content state to a stack on every user action.

```js
let undoStack = [], redoStack = [];

function takeSnapshot() {
  return { content: getContent() }; // whatever state needs to be undoable
}
function pushSnapshot() {
  undoStack.push(takeSnapshot());
  if (undoStack.length > 100) undoStack.shift(); // cap memory
  redoStack = [];
  doAutosave();
}
function applySnapshot(snap) {
  setContent(snap.content);
  // re-render everything
  doAutosave();
}
function doUndo() {
  if (undoStack.length < 2) return;
  redoStack.push(undoStack.pop());
  applySnapshot(undoStack[undoStack.length - 1]);
}
function doRedo() {
  if (!redoStack.length) return;
  undoStack.push(redoStack.pop());
  applySnapshot(undoStack[undoStack.length - 1]);
}
// Init: seed the stack with the initial state
undoStack = [takeSnapshot()];
```

**Wholesale content replacement (import, merge, paste)**: When an operation replaces all content at once rather than editing incrementally, call `pushSnapshot()` *before* the change (saves pre-change state for undo) and again *after* (saves post-change state so redo works). Using only a pre-change push leaves the redo stack empty — the user can undo but not redo.

```js
function doImportOrMerge(newContent) {
  pushSnapshot();          // pre-change: undo restores this
  setContent(newContent);
  pushSnapshot();          // post-change: redo restores this
}
```

**Debounce for text input**: Grouping rapid keystrokes into one undo step prevents the user having to undo character by character.

```js
let _undoTimer = null;
textarea.addEventListener('input', () => {
  clearTimeout(_undoTimer);
  _undoTimer = setTimeout(pushSnapshot, cfg.undo_debounce_ms || 150);
});
```

### File import and export

Browsers can open local files via `<input type="file">` (hidden, triggered programmatically) and save via a Blob URL. No server needed.

```js
// Import
const filePicker = document.getElementById('file-picker'); // hidden input
function doImport() { filePicker.value = ''; filePicker.click(); }
filePicker.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { handleFileContent(ev.target.result, file.name); };
  reader.readAsText(file, 'utf-8');
});

// Export
function doSave(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
```

**Middle-click to open**: A power-user shortcut — wire `document.addEventListener('mousedown', e => { if (e.button === 1) { e.preventDefault(); doImport(); } })`.

**Multiple file types**: Use `accept="audio/*,.lrc,.txt"` on the input and branch on file extension after selection.

### Number inputs with custom spinners

Native `<input type="number">` spin buttons are browser- and OS-inconsistent, ignore CSS variables, and can't be sized independently of the field. For any editable numeric field in a tool app, suppress native spinners and use a custom `fs-spinner` div pair instead:

```html
<!-- Suppress native arrows -->
<style>
  .num-field { -moz-appearance: textfield; }
  .num-field::-webkit-inner-spin-button,
  .num-field::-webkit-outer-spin-button { -webkit-appearance: none; }
</style>

<!-- Field + custom spinner pair -->
<input id="my-val" class="num-field" type="number" value="100">
<div class="fs-spinner">
  <button class="fs-tick" id="my-up">▲</button>
  <button class="fs-tick" id="my-down">▼</button>
</div>
<span>ms</span>  <!-- unit label OUTSIDE the field -->
```

```css
.fs-spinner { display:flex; flex-direction:column; width:16px; overflow:hidden; border:1px solid var(--border-mid); border-radius:var(--radius); }
.fs-tick    { flex:1; border:none; background:transparent; cursor:pointer; font-size:9px; display:flex; align-items:center; justify-content:center; }
.fs-tick:first-child { border-bottom:1px solid var(--border-mid); }
.fs-tick:hover { background:var(--border); }
```

**Unit labels must be external `<span>` elements**, never embedded inside the field value. Inline units (`"100 ms"` in the field) break `parseFloat()`, native number validation, and keyboard increment/decrement. The only exception is a read-only display element that is never parsed back.

**Empty-then-Enter revert**: When a user clears a number field and presses Enter, the `change` event fires with an empty/NaN value. Always resync the display from the stored variable rather than returning silently:

```js
myField.addEventListener('change', () => {
  const v = parseFloat(myField.value);
  if (isNaN(v)) { myField.value = currentVal; return; } // revert display
  currentVal = clamp(v);
  myField.value = currentVal; // resync after clamp too
});
```

### Overlay / modal management

For Settings, Help, and confirm dialogs, use fixed full-screen overlays with z-index stacking.

```js
// HTML pattern
// <div id="my-overlay" style="display:none;position:fixed;inset:0;...">
//   <div id="my-win">...</div>
// </div>

function openOverlay(id) {
  document.getElementById(id).classList.add('open'); // CSS: .open { display: flex }
}
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
}
// Close on backdrop click
document.getElementById('my-overlay').addEventListener('mousedown', e => {
  if (e.target === document.getElementById('my-overlay')) closeOverlay('my-overlay');
});
```

**Multiple overlays**: Track z-index manually when two overlays can be open at once (e.g. Settings + Help). Bring the last-opened one to front:

```js
let _topZ = 100;
function bringToFront(id) { document.getElementById(id).style.zIndex = ++_topZ; }
```

### Unload warning

Warn users before losing unsaved work:

```js
window.addEventListener('beforeunload', e => {
  if (isDirty) { e.preventDefault(); e.returnValue = ''; }
});
```

### Settings hotkey sections

When there are many remappable actions, group them into labeled sections in the Settings UI using a sections manifest. This keeps the Settings panel scannable:

```js
const HK_SECTIONS = [
  { label: 'Menu',        keys: ['open', 'save', 'settings', 'help', 'undo', 'redo'] },
  { label: 'Playback',    keys: ['play_pause', 'speed_down', 'speed_up', 'speed_reset'] },
  { label: 'Actions',     keys: ['sync', 'prev_line', 'next_line'] },
  { label: 'Text',        keys: ['toggle_mode', 'add_field', 'remove_field'] },
];

// Render by iterating sections, then keys within each section
HK_SECTIONS.forEach(section => {
  const header = document.createElement('div');
  header.className = 'hk-section-label';
  header.textContent = section.label;
  container.appendChild(header);
  section.keys.forEach(key => buildHkRow(key));
});
```

---

## Dynamic tooltips

When hotkeys are user-remappable, generate tooltips from config rather than hardcoding them:

```js
function updateTooltips() {
  document.getElementById('btn-save').title = `Save (${cfg.hotkeys.save || 'unassigned'})`;
}
// Call after every config change
```

---

## Init sequence

Run these in order at the bottom of the script, after all function declarations:

```js
// 1. Apply persisted display preferences (theme, font)
applyTheme();
applyFont();

// 2. Load autosaved work or show defaults
const saved = loadAutosave();
if (saved) restoreFromAutosave(saved);
else setContent(DEFAULT_CONTENT);

// 3. Seed undo stack
undoStack = [takeSnapshot()]; redoStack = [];

// 4. Render UI
render();

// 5. Apply config to UI inputs (Settings panel values, etc.)
syncSettingsUI();

// 6. Update tooltips
updateTooltips();
```

---

## Common pitfalls

- **`min-height: 0` on flex children** — without this, nested flex containers overflow instead of scroll
- **`box-sizing: border-box`** on everything — padding and border should not blow out element widths
- **`user-select: none` on the body** for tool apps where click-dragging shouldn't highlight text; selectively re-enable on content areas with `user-select: text`
- **`sessionStorage` vs `localStorage`**: always put the audio/file blob reference in sessionStorage (it can't survive reload anyway), settings in localStorage
- **`overflow: hidden` on body and main container** to prevent the page scrolling instead of internal panels
- **Config migration**: if you rename a key in DEFAULT_CFG, old localStorage will have the old key. Add explicit migration in loadCfg or users silently lose their settings
- **Avoid `innerHTML` with user content** — use `textContent` or build DOM nodes to prevent XSS if any user-supplied text is rendered
