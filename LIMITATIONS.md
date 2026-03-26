##### These apply to the .html app as of version 0.33.2
- No direct filesystem access due to browser security restrictions
	- Can't read audio file metadata tags
	- Audio file doesn't persist if page is reloaded
	- Can't live edit .lrc file in place, must work with a copy in localStorage or sessionStorage and save it manually elsewhere
- No system media keys - cannot even assign volume up or down hotkeys as workarounds, only mute
- Cursor is positioned one line too high in **Typing mode** on startup. Worked around by pasting in lyrics in **Hotkey mode** first which adds the expected newline, or changing ⚙️**Default metadata tags** to not include a newline.
- Many hotkey restrictions (copied from [v0.33.2](https://github.com/honeypotfields/linebyline/blob/main/archive/33/linebyline_33_2.html)):
```
// ── Restricted hotkey rules ──────────────────────────────────────────────────
// Keys blocked for ALL remappable hotkeys (browser-reserved or destructive)
const RESTRICTED_ALL=new Set([
  'MouseLeft','MouseRight',
  // Ctrl combos browsers reserve
  'Ctrl+R','Ctrl+F','Ctrl+Q','Ctrl+W','Ctrl+L',
  'Ctrl+T','Ctrl+N','Ctrl+P','Ctrl+H','Ctrl+J','Ctrl+U',
  'Ctrl+B','Ctrl+G',
  'Ctrl+Shift+I','Ctrl+Shift+J','Ctrl+Shift+C',
  // All Alt combos (fingerprinting-resistant browsers remap many; blanket block)
  'Alt+A','Alt+B','Alt+C','Alt+D','Alt+E','Alt+F','Alt+G','Alt+H','Alt+I','Alt+J',
  'Alt+K','Alt+L','Alt+M','Alt+N','Alt+O','Alt+P','Alt+Q','Alt+R','Alt+S','Alt+T',
  'Alt+U','Alt+V','Alt+W','Alt+X','Alt+Y','Alt+Z',
  'Alt+0','Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6','Alt+7','Alt+8','Alt+9',
  'Alt+Left','Alt+Right','Alt+Up','Alt+Down',
  // Navigation / system keys
  'Home','End','Insert','Delete','Backspace',
  'NumLock','ScrollLock','Meta','PrintScreen','ContextMenu',
  // All F-keys
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);

// Keys that only allow non-alphanumeric/Space (for toggle_mode and offset_mode_toggle)
const ALPHA_NUM_SPACE_RE=/^(([A-Z]|[0-9]|Space)$|Shift\+[A-Z0-9]$)/;
```