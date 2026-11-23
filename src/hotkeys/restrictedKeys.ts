// Ported from docs/index.html "── Restricted hotkey rules ──" (roadmap item 3
// Phase C, tranche 1). Verbatim; exported without leading underscores.

// Keys blocked for ALL remappable hotkeys (browser-reserved or destructive)
export const RESTRICTED_ALL = new Set([
  'MouseLeft', 'MouseRight',
  'Escape', 'Tab', 'Enter',
  // Ctrl combos browsers reserve
  'Ctrl+R', 'Ctrl+F', 'Ctrl+Q', 'Ctrl+W', 'Ctrl+L',
  'Ctrl+O',
  'Ctrl+T', 'Ctrl+D', 'Ctrl+M', 'Ctrl+N', 'Ctrl+P', 'Ctrl+H', 'Ctrl+J', 'Ctrl+U',
  'Ctrl+B', 'Ctrl+G',
  'Ctrl+Z', 'Ctrl+Y', 'Ctrl+X', 'Ctrl+C', 'Ctrl+V', 'Ctrl+E', 'Ctrl+K',
  'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+Shift+C', 'Ctrl+Shift+K', 'Ctrl+Shift+N',
  'Ctrl+Shift+O', 'Ctrl+Shift+P', 'Ctrl+Shift+T', 'Ctrl+Shift+W', 'Ctrl+Shift+Delete',
  // All Meta (Cmd on Mac) combos
  'Meta+A', 'Meta+B', 'Meta+C', 'Meta+D', 'Meta+E', 'Meta+F', 'Meta+G', 'Meta+H', 'Meta+I', 'Meta+J',
  'Meta+K', 'Meta+L', 'Meta+M', 'Meta+N', 'Meta+O', 'Meta+P', 'Meta+Q', 'Meta+R', 'Meta+S', 'Meta+T',
  'Meta+U', 'Meta+V', 'Meta+W', 'Meta+X', 'Meta+Y', 'Meta+Z',
  'Meta+0', 'Meta+1', 'Meta+2', 'Meta+3', 'Meta+4', 'Meta+5', 'Meta+6', 'Meta+7', 'Meta+8', 'Meta+9',
  'Meta+Left', 'Meta+Right', 'Meta+Up', 'Meta+Down',
  'Meta+Shift+I', 'Meta+Shift+J', 'Meta+Shift+C',
  // All Alt combos (fingerprinting-resistant browsers remap many; blanket block)
  'Alt+A', 'Alt+B', 'Alt+C', 'Alt+D', 'Alt+E', 'Alt+F', 'Alt+G', 'Alt+H', 'Alt+I', 'Alt+J',
  'Alt+K', 'Alt+L', 'Alt+M', 'Alt+N', 'Alt+O', 'Alt+P', 'Alt+Q', 'Alt+R', 'Alt+S', 'Alt+T',
  'Alt+U', 'Alt+V', 'Alt+W', 'Alt+X', 'Alt+Y', 'Alt+Z',
  'Alt+0', 'Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5', 'Alt+6', 'Alt+7', 'Alt+8', 'Alt+9',
  'Alt+Left', 'Alt+Right', 'Alt+Up', 'Alt+Down',
  // Navigation / system keys
  'Home', 'End', 'Insert', 'Delete', 'Backspace',
  'NumLock', 'ScrollLock', 'Meta', 'PrintScreen', 'ContextMenu',
  // All F-keys
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);

// Keys that only allow non-alphanumeric/Space (for toggle_mode and offset_mode_toggle)
const ALPHA_NUM_SPACE_RE = /^(([A-Z]|\d|Space)$|Shift\+[A-Z0-9]$)/;

export function isRestrictedForAll(ks: string): string | null {
  if (RESTRICTED_ALL.has(ks)) return `"${ks}" is reserved by the browser`;
  return null;
}

export function isRestrictedForKey(ks: string, key: string): string | null {
  const allMsg = isRestrictedForAll(ks);
  if (allMsg) return allMsg;
  if ((key === 'toggle_mode' || key === 'offset_mode_toggle') && ALPHA_NUM_SPACE_RE.test(ks)) {
    return 'Letters, numbers, and Space are not allowed for this action';
  }
  return null;
}
