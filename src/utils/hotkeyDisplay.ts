// Controls-panel cell display logic — ported from the monolith "Controls
// panel" section (_hkDisp, _renderHkCellContent's per-action key layout,
// rebuildHkPanel's ordered action list, HOTKEY_ONLY / TYPING_AVAILABLE).
// Pure functions so the display rules are unit-testable without mounting;
// ControlsPanel.vue consumes them with reactive cfg/mode state.
import type { AppConfig, HotkeyMap } from '../config'

// Actions dimmed in Typing mode unless also listed as typing-available.
export const HOTKEY_ONLY = new Set([
  'play_pause', 'play_pause_alt', 'sync', 'end_line', 'prev_line', 'next_line', 'replay_only',
  'ts_back_tiny', 'ts_fwd_tiny', 'ts_back_small', 'ts_fwd_small',
  'ts_back_medium', 'ts_fwd_medium', 'ts_back_large', 'ts_fwd_large',
  'sync_file',
])

// Actions that remain usable in Typing mode (with different hotkeys)
export const TYPING_AVAILABLE = new Set(['play_pause', 'prev_line', 'next_line'])

export function hkDisp(v: string | undefined): string {
  if (v === 'Escape') return 'Esc'
  return v || '—'
}

// Key badges per cell, verbatim from _renderHkCellContent: sync shows the
// sync key plus the replay_line key (default 'Enter'); play_pause shows
// play_pause_alt in Typing mode; prev/next gain an arrow badge in Hotkey mode
// and show only the arrow in Typing mode.
export function hkCellKeys(key: string, hk: HotkeyMap, hotkeyMode: boolean): string[] {
  if (key === 'sync') {
    const replayKey = hk.replay_line || 'Enter'
    return [hk[key] || '—', replayKey === 'Escape' ? 'Esc' : replayKey]
  }
  if (key === 'play_pause') {
    return [hkDisp(hotkeyMode ? hk[key] : (hk.play_pause_alt || hk[key]))]
  }
  if (key === 'prev_line') {
    return hotkeyMode ? [hkDisp(hk[key]), '↑'] : ['↑']
  }
  if (key === 'next_line') {
    return hotkeyMode ? [hkDisp(hk[key]), '↓'] : ['↓']
  }
  return [hkDisp(hk[key])]
}

// The panel's ordered action cells with ms labels from cfg; the ts label
// reads "seek" in offset-seek mode, "time" otherwise.
export function hkPanelActions(cfg: AppConfig, offsetSeekMode: boolean): { key: string; label: string }[] {
  const { tiny_ms: tn, small_ms: sm, medium_ms: med, large_ms: lg } = cfg
  const tsLabel = offsetSeekMode ? 'seek' : 'time'
  return [
    ['prev_line', 'Previous line'], ['play_pause', 'Play/pause'],
    ['next_line', 'Next line'], ['sync', 'Sync line'],
    ['replay_only', 'Replay only'], ['end_line', 'End line'],
    ['ts_back_tiny', `\u2212${tn}ms ${tsLabel}`], ['ts_fwd_tiny', `+${tn}ms ${tsLabel}`],
    ['ts_back_small', `\u2212${sm}ms ${tsLabel}`], ['ts_fwd_small', `+${sm}ms ${tsLabel}`],
    ['ts_back_medium', `\u2212${med}ms ${tsLabel}`], ['ts_fwd_medium', `+${med}ms ${tsLabel}`],
    ['ts_back_large', `\u2212${lg}ms ${tsLabel}`], ['ts_fwd_large', `+${lg}ms ${tsLabel}`],
  ].map(([key, label]) => ({ key, label }))
}
