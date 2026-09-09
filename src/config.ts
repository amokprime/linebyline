// Ported from docs/index.html "── Config ──" (roadmap item 3 Phase C, tranche 1).
// Pure data + hotkey migration helpers only: loadCfg/saveCfg stay in the
// monolith until the persistence composable lands (Phase D). Functions renamed
// without the leading underscore now that they are module exports.
// PORT DELTA: none — values and logic are verbatim.

export const DEFAULT_META =
  '[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n';

export type HotkeyMap = Record<string, string>;

export interface AppConfig {
  tiny_ms: number
  small_ms: number
  medium_ms: number
  large_ms: number
  seek_offset: number
  seek_offset_tick: number
  seek_increment_s: number
  default_meta: string
  replay_prev_line: boolean
  replay_next_line: boolean
  replay_resume_current: boolean
  replay_play_other: boolean
  replay_after_offset: boolean
  replay_after_sync: boolean
  replay_after_ts: boolean
  undo_debounce_ms: number
  hotkeys: HotkeyMap
  speed_ratio: number
  vol_increment: number
}

export const DEFAULT_CFG: AppConfig = {
  tiny_ms: 100, small_ms: 200, medium_ms: 400, large_ms: 1000,
  seek_offset: -600, seek_offset_tick: 1000, seek_increment_s: 5,
  default_meta: DEFAULT_META,
  replay_prev_line: false, replay_next_line: false, replay_resume_current: false, replay_play_other: false,
  replay_after_offset: false, replay_after_sync: false, replay_after_ts: false,
  undo_debounce_ms: 150,
  hotkeys: {
    toggle_mode: '`', play_pause: 'Space', play_pause_alt: 'Ctrl+Space', sync: 'W', end_line: 'T',
    prev_line: 'Q', next_line: 'E',
    ts_back_tiny: 'Z', ts_fwd_tiny: 'V',
    ts_back_small: 'A', ts_fwd_small: 'F',
    ts_back_medium: 'S', ts_fwd_medium: 'D',
    ts_back_large: 'X', ts_fwd_large: 'C',
    clear_sel: 'Escape',
    offset_mode_toggle: 'Shift+~', sync_file: 'Ctrl+I',
    add_field: 'Ctrl+4', remove_field: 'Ctrl+5', merge_fields: 'Ctrl+6',
    replay_line: 'Enter', replay_only: 'R', replay_end: 'Shift+R',
    open: 'Ctrl+;', settings: 'Ctrl+,',
    undo: 'Ctrl+Z', redo: 'Ctrl+Y',
    speed_down: 'Ctrl+1', speed_up: 'Ctrl+2', speed_reset: 'Ctrl+3',
    seek_back: 'Ctrl+9', seek_fwd: 'Ctrl+0',
    save: "Ctrl+'", help: 'Ctrl+/', theme_toggle: 'Ctrl+.',
    mark_translation: 'Ctrl+ArrowLeft',
    issues: 'Ctrl+[',
    panel_toggle: 'Ctrl+`',
    reset_defaults: 'Ctrl+\\',
  },
  speed_ratio: 1.1,
  vol_increment: 0.1,
};

// Subsection grouping for Settings display
export interface HotkeySection {
  label: string
  keys: string[]
}

export const HK_SECTIONS: HotkeySection[] = [
  { label: 'Menu', keys: ['open', 'save', 'undo', 'redo', 'settings', 'theme_toggle', 'help', 'issues', 'panel_toggle', 'reset_defaults'] },
  { label: 'Playback', keys: ['play_pause', 'play_pause_alt', 'speed_down', 'speed_up', 'speed_reset', 'seek_back', 'seek_fwd'] },
  { label: 'Sync', keys: ['offset_mode_toggle', 'sync_file', 'sync', 'end_line', 'prev_line', 'next_line', 'replay_only', 'replay_end'] },
  { label: 'Adjustments', keys: ['ts_back_tiny', 'ts_fwd_tiny', 'ts_back_small', 'ts_fwd_small', 'ts_back_medium', 'ts_fwd_medium', 'ts_back_large', 'ts_fwd_large'] },
  { label: 'Text', keys: ['toggle_mode', 'add_field', 'remove_field', 'merge_fields', 'mark_translation'] },
];

export const HK_LABELS: Record<string, string> = {
  toggle_mode: 'Toggle mode', play_pause: 'Play/pause', play_pause_alt: 'Play/pause (alternate)',
  sync: 'Sync line start', end_line: 'Sync line end',
  prev_line: 'Previous line', next_line: 'Next line',
  replay_only: 'Replay only', replay_end: 'Replay end',
  ts_back_tiny: 'Back tiny amount',
  ts_fwd_tiny: 'Forward tiny amount',
  ts_back_small: 'Back small amount',
  ts_fwd_small: 'Forward small amount',
  ts_back_medium: 'Back medium amount',
  ts_fwd_medium: 'Forward medium amount',
  ts_back_large: 'Back large amount',
  ts_fwd_large: 'Forward large amount',
  offset_mode_toggle: 'Toggle offset mode', sync_file: 'Sync file',
  add_field: 'Add field', remove_field: 'Hide field', merge_fields: 'Merge fields',
  open: 'Open', save: 'Save', help: 'Help', theme_toggle: 'Toggle theme',
  settings: 'Settings', undo: 'Undo', redo: 'Redo',
  speed_down: 'Reduce speed', speed_up: 'Increase speed', speed_reset: 'Reset speed',
  seek_back: 'Seek back', seek_fwd: 'Seek forward',
  mark_translation: 'Mark line as translation',
  issues: 'Issues',
  panel_toggle: 'Toggle panel',
  reset_defaults: 'Reset defaults',
};

// Map old hotkey values to their new defaults (keyed by hotkey action)
export const LEGACY_HOTKEY_MAP: Record<string, Record<string, string>> = {
  seek_back: { 'Ctrl+A': 'Ctrl+9', 'Ctrl+S': 'Ctrl+9' },
  seek_fwd: { 'Alt+W': 'Ctrl+0', 'Ctrl+D': 'Ctrl+0' },
  save: { 'Ctrl+S': "Ctrl+'", 'Ctrl+;': "Ctrl+'" },
  settings: { 'Alt+`': 'Ctrl+,' },
  help: { F2: 'Ctrl+/' },
  toggle_mode: { Tab: '`' },
  offset_mode_toggle: { '`': 'Shift+~' },
  sync_file: { 'Ctrl+`': 'Ctrl+I' },
  speed_down: { 'Alt+1': 'Ctrl+1' },
  speed_up: { 'Alt+2': 'Ctrl+2' },
  speed_reset: { 'Alt+3': 'Ctrl+3' },
  add_field: { 'Ctrl+1': 'Ctrl+4' },
  remove_field: { 'Ctrl+2': 'Ctrl+5' },
  merge_fields: { 'Ctrl+3': 'Ctrl+6' },
};

export function migrateLegacyHotkeys(d: { hotkeys?: HotkeyMap }, hc: HotkeyMap): void {
  if (!d.hotkeys) return;
  const h = d.hotkeys;
  for (const key in LEGACY_HOTKEY_MAP) {
    const replacements = LEGACY_HOTKEY_MAP[key]!;
    if (h[key] !== undefined && replacements[h[key]]) hc[key] = replacements[h[key]]!;
  }
}

export function ensureDefaultHotkeys(c: AppConfig): void {
  if (c.hotkeys.theme_toggle === undefined) c.hotkeys.theme_toggle = 'Ctrl+.';
  if (c.hotkeys.replay_end === undefined) c.hotkeys.replay_end = 'Shift+R';
  if (c.hotkeys.replay_only === undefined) c.hotkeys.replay_only = 'R';
  if (c.hotkeys.mark_translation === undefined) c.hotkeys.mark_translation = 'Ctrl+ArrowLeft';
  if (c.hotkeys.issues === undefined) c.hotkeys.issues = 'Ctrl+[';
  if (c.hotkeys.issues === "Ctrl+'") c.hotkeys.issues = 'Ctrl+[';
  if (c.hotkeys.panel_toggle === undefined) c.hotkeys.panel_toggle = 'Ctrl+`';
  if (c.hotkeys.reset_defaults === undefined) c.hotkeys.reset_defaults = 'Ctrl+\\';
  if (c.hotkeys.mute) delete c.hotkeys.mute;
}

export function migrateHotkeys(d: { hotkeys?: HotkeyMap }, c: AppConfig): void {
  migrateLegacyHotkeys(d, c.hotkeys);
  ensureDefaultHotkeys(c);
}
