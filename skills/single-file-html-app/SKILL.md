---
name: single-file-html-app
description: Build self-contained single-file web apps delivered as a single .html file with no build step, no external dependencies (except optional CDN scripts), and no server. Use this skill whenever the user wants a desktop-style tool, utility app, editor, or workflow app that runs by opening an HTML file locally in a browser — especially when they mention things like "no install", "just open it", "download and use", "single file", or when the app needs persistent settings, undo/redo, hotkeys, file import/export, or multiple UI panels. Also use for apps that will be hosted as a single static page on GitHub Pages or similar. This skill complements browser-hotkey-system (remappable hotkeys) — read that skill too when relevant.
---

A self-contained web app is everything in one .html file: markup, CSS, and JS together, no bundler, no framework, no server. The browser is the runtime. This constraint shapes every architectural decision.

---

File structure

All code lives in one file in this order:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AppName</title>
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

Always open with `'use strict';` in the script block. If a library is genuinely needed, load it from a CDN inside `<head>`. Prefer zero dependencies.

---

CSS architecture

Define all colors, spacing, and type sizes as CSS variables on `:root` for light/dark theming. Toggle dark mode with `document.documentElement.setAttribute('data-theme', 'dark')` and persist to localStorage.

```css
:root {
  --bg: #f6f8fa;
  --surface: #ffffff;
  --border: #d0d7de;
  --text: #24292f;
  --text-muted: #656d76;
  --accent: #0969da;
  --radius: 6px;
  --font-mono: 'Courier New', Courier, monospace;
}
[data-theme="dark"] {
  --bg: #161b22;
  --surface: #0d1117;
  --border: #30363d;
  --text: #e6edf3;
  --accent: #58a6ff;
}
```

Layout skeleton for tool/editor apps:

```css
body { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
#menu-bar { flex-shrink: 0; }
#main    { display: flex; flex: 1; overflow: hidden; min-height: 0; }
#sidebar { width: 280px; flex-shrink: 0; overflow-y: auto; }
#content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
```

`min-height: 0` on flex children prevents overflow in nested flex containers — a very common source of layout bugs.

Always include the box-sizing reset:
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
```

---

JS architecture

Config and defaults

Define a `DEFAULT_CFG` object at the top with every setting. This serves as both documentation and the reset target. Store user config separately in `localStorage`.

```js
const DEFAULT_CFG = {
  some_option: true,
  delay_ms: 200,
  hotkeys: { action_name: 'Ctrl+S' },
};

function loadCfg() {
  try {
    const stored = localStorage.getItem('app_cfg');
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_CFG));
    const d = JSON.parse(stored);
    const c = JSON.parse(JSON.stringify(DEFAULT_CFG));
    Object.assign(c, d);
    c.hotkeys = Object.assign({}, DEFAULT_CFG.hotkeys, d.hotkeys || {});
    // Migration: fix renamed/moved/removed keys here
    return c;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_CFG));
  }
}
function saveCfg() { localStorage.setItem('app_cfg', JSON.stringify(cfg)); }
let cfg = loadCfg();
```

Migration pattern: when you rename, remove, or restructure a config key between versions, add explicit migration logic in loadCfg(). Users with old localStorage values should get a sane result, not a crash or a stale value.

```js
// Rename: old key → new key
if (d.old_key !== undefined && c.new_key === undefined) c.new_key = d.old_key;
// Hotkey rename or reset to new default
if (d.hotkeys?.save === 'Ctrl+S') c.hotkeys.save = 'Ctrl+;';
// Remove deprecated key entirely
if (c.hotkeys.mute) delete c.hotkeys.mute;
```

Non-config state storage

Some state is simple enough to store as individual localStorage items at declaration time, separate from cfg. This avoids version-migration overhead and keeps loadCfg smaller:

```js
let themeMode = localStorage.getItem('app_theme') || 'light';
let editorFont = localStorage.getItem('app_font') || 'system-ui, sans-serif';
let masterVolume = parseFloat(localStorage.getItem('app_vol') ?? '1');
```

Use this for display preferences (theme, font, volume) that change independently, have simple scalar values, and don't need to be reset together with cfg.

State variables — declare all mutable state at the top level, grouped and commented:

```js
// ── UI state ──────────────────────────────────────────────────────
let activePanel = 'main';
let isDirty = false;
// ── Data state ────────────────────────────────────────────────────
let currentFile = null;
let items = [];
```

Session vs persistent storage

| What | Where | When cleared |
|---|---|---|
| User settings/preferences (cfg) | localStorage under one key | Never (until user resets) |
| Display prefs (theme, font, volume) | localStorage as separate individual keys | Never |
| Current work in progress | sessionStorage | On tab close |

Store display preferences as separate localStorage items (not inside cfg) so they can be read and written independently without re-serializing all settings.

Always autosave work-in-progress to sessionStorage on every meaningful change, and reload it on init. This survives accidental refresh without surprising the user with stale data on next launch.

Single source of truth for stateful UI

When two variables represent the same underlying state (e.g. masterVolume + masterMuted as separate flags, or a range input whose .value is both a display source and an input source), pick one as the authoritative value and derive everything else from it. Having two representations that can disagree is a reliable source of subtle, hard-to-reproduce bugs. If masterVolume is always the actual volume (0 when muted), then the mute button, the slider position, and the percentage label all read from it directly — no conditional branching needed, no state sync to forget.

Snapshot-based undo/redo

Simpler and more robust than diff-based undo for most tool apps. Push a full snapshot of all mutable content state to a stack on every user action.

```js
let undoStack = [], redoStack = [];
function takeSnapshot() { return { content: getContent() }; }
function pushSnapshot() {
  undoStack.push(takeSnapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
  doAutosave();
}
function applySnapshot(snap) { setContent(snap.content); doAutosave(); }
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
undoStack = [takeSnapshot()]; // seed
```

Wholesale content replacement (import, merge, paste): when an operation replaces all content at once rather than editing incrementally, call pushSnapshot() before the change (saves pre-change state for undo) and again after (saves post-change state so redo works). Using only a pre-change push leaves the redo stack empty — the user can undo but not redo.

Debounce for text input — group rapid keystrokes into one undo step:

```js
let _undoTimer = null;
textarea.addEventListener('input', () => {
  clearTimeout(_undoTimer);
  _undoTimer = setTimeout(pushSnapshot, cfg.undo_debounce_ms || 150);
});
```

File import and export

Browsers can open local files via `<input type="file">` (hidden, triggered programmatically) and save via a Blob URL. No server needed.

```js
const filePicker = document.getElementById('file-picker');
function doImport() { filePicker.value = ''; filePicker.click(); }
filePicker.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { handleFileContent(ev.target.result, file.name); };
  reader.readAsText(file, 'utf-8');
});

function doSave(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
```

Middle-click to open: `document.addEventListener('mousedown', e => { if (e.button === 1) { e.preventDefault(); doImport(); } })`.

Multiple file types: use `accept="audio/*,.lrc,.txt"` on the input and branch on file extension after selection.

Number inputs with custom spinners

Native `<input type="number">` spin buttons are browser- and OS-inconsistent, ignore CSS variables, and can't be sized independently of the field. Suppress native spinners and use a custom fs-spinner div pair instead:

```html
<style>
  .num-field { -moz-appearance: textfield; }
  .num-field::-webkit-inner-spin-button,
  .num-field::-webkit-outer-spin-button { -webkit-appearance: none; }
</style>
<input id="my-val" class="num-field" type="number" value="100">
<div class="fs-spinner">
  <button class="fs-tick" id="my-up">▲</button>
  <button class="fs-tick" id="my-down">▼</button>
</div>
<span>ms</span>
```

Unit labels must be external `<span>` elements, never embedded inside the field value. Inline units ("100 ms" in the field) break parseFloat(), native number validation, and keyboard increment/decrement.

Empty-then-Enter revert: when a user clears a number field and presses Enter, the change event fires with an empty/NaN value. Always resync the display from the stored variable rather than returning silently:

```js
myField.addEventListener('change', () => {
  const v = parseFloat(myField.value);
  if (isNaN(v)) { myField.value = currentVal; return; }
  currentVal = clamp(v);
  myField.value = currentVal;
});
```

Overlay / modal management

For Settings, Help, and confirm dialogs, use fixed full-screen overlays with z-index stacking.

```js
function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
// Close on backdrop click
document.getElementById('my-overlay').addEventListener('mousedown', e => {
  if (e.target === document.getElementById('my-overlay')) closeOverlay('my-overlay');
});
```

Multiple overlays: track z-index manually when two overlays can be open at once (e.g. Settings + Help). Bring the last-opened one to front:

```js
let _topZ = 100;
function bringToFront(id) { document.getElementById(id).style.zIndex = ++_topZ; }
```

Unload warning

```js
window.addEventListener('beforeunload', e => {
  if (isDirty) { e.preventDefault(); e.returnValue = ''; }
});
```

Settings hotkey sections

When there are many remappable actions, group them into labeled sections in the Settings UI using a sections manifest:

```js
const HK_SECTIONS = [
  { label: 'Menu',        keys: ['open', 'save', 'settings', 'help', 'undo', 'redo'] },
  { label: 'Playback',    keys: ['play_pause', 'speed_down', 'speed_up', 'speed_reset'] },
  { label: 'Actions',     keys: ['sync', 'prev_line', 'next_line'] },
  { label: 'Text',        keys: ['toggle_mode', 'add_field', 'remove_field'] },
];
HK_SECTIONS.forEach(section => {
  const header = document.createElement('div');
  header.className = 'hk-section-label';
  header.textContent = section.label;
  container.appendChild(header);
  section.keys.forEach(key => buildHkRow(key));
});
```

Dynamic tooltips — when hotkeys are user-remappable, generate tooltips from config rather than hardcoding them:

```js
function updateTooltips() {
  document.getElementById('btn-save').title = `Save (${cfg.hotkeys.save || 'unassigned'})`;
}
// Call after every config change
```

---

Init sequence

Run these in order at the bottom of the script, after all function declarations:

1. Apply persisted display preferences (theme, font)
2. Load autosaved work or show defaults
3. Seed undo stack
4. Render UI
5. Apply config to UI inputs
6. Update tooltips

---

Common pitfalls

- Single source of truth for stateful UI — when two variables represent the same underlying state, they will eventually disagree. Pick one as authoritative and derive the rest.
- min-height: 0 on flex children — without this, nested flex containers overflow instead of scroll.
- box-sizing: border-box on everything — padding and border should not blow out element widths.
- user-select: none on the body for tool apps where click-dragging shouldn't highlight text; selectively re-enable on content areas.
- sessionStorage vs localStorage — put audio/file blob references in sessionStorage (can't survive reload anyway), settings in localStorage.
- overflow: hidden on body and main container — prevents the page scrolling instead of internal panels.
- Config migration — if you rename a key in DEFAULT_CFG, old localStorage will have the old key. Add explicit migration in loadCfg or users silently lose their settings.
- Avoid innerHTML with user content — use textContent or build DOM nodes to prevent XSS.
