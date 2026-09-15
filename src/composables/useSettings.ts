// Phase D Tranche 8 — Settings interactions, ported from the monolith
// "── Settings ──" + "── Settings search ──" + "── Confirm dialog ──" sections.
// Owns:
//  - Hotkey capture input keydown (Tab trap, Shift+Backspace=clear, Backspace=
//    reset+advance, Enter=swap+advance, Escape=revert)
//  - Conflict detection with Swap button (swaps hotkeys between actions)
//  - Reset-to-default with swap pattern (gives any holder of the default its
//    own default back)
//  - initSettingsSearch / applySettingsFilter (text + hotkey search modes)
//  - saveSettingsNow (reads DOM values, writes to cfg, persists)
//  - Reset confirm flow (inline footer Yes/No, not shadcn AlertDialog)
//  - The capture-input focus blur/revert dance (placeholder '…' while focused)
//
// PORT DELTAS from the monolith:
//  - State is reactive (Vue refs) so the SettingsDialog re-renders on changes.
//    The monolith imperatively toggled .visible classes on buttons; here we
//    expose per-row `isClearVisible / isResetVisible / isReplaceVisible /
//    restrictWarn` computeds that the template binds with :class.
//  - `cfg` is the reactive ref from useAppState (Tranche 1). Hotkey writes go
//    through cfg.value.hotkeys[key] = ... — the monolith's saveCfg() inline
//    becomes a `persistCfg()` helper that writes the ref to localStorage.
//  - Per-row state (conflictKey, lastGoodVal, prevVal) lives in a Map keyed
//    by action name. The monolith used closure variables inside buildHkRows;
//    here the Map persists across renders because the composable is a singleton.
//  - The capture input's "focus placeholder" ('…') is exposed via a `captureDisplay`
//    function — same monolith logic, but the template binds the result.
//  - The focus trap (Tab/ArrowUp/ArrowDown navigation) is owned by useGlobalHotkeys
//    (Tranche 9), not here. This composable just exposes the focusable-element
//    list helper for the global handler to call.
//
// Singleton pattern (matches useAppState / useSync / useAudio): initSettings()
// called once in SettingsDialog.vue setup. Action functions are module-level
// exports. vi.resetModules() in tests gives a fresh module.

import { ref } from 'vue'
import { DEFAULT_CFG, type AppConfig, type HotkeyMap, HK_LABELS, HK_SECTIONS } from '@/config'
import { useAppState } from './useAppState'
import { isRestrictedForAll, isRestrictedForKey } from '@/hotkeys/restrictedKeys'
import { normKey } from '@/hotkeys/keyUtils'

// ── Per-row state ──────────────────────────────────────────────────────────
// Mirrors the monolith's closure variables inside buildHkRows's forEach.
// Each row's state lives in the Map keyed by hotkey action name.
interface RowState {
  // The last accepted display value (for blur revert when '…' was shown).
  lastGoodVal: string
  // The previous value (set on focus, used to revert if '…' wasn't replaced).
  prevVal: string
  // The pending conflict key (the OTHER action that owns the captured key).
  // Empty string = no conflict pending.
  conflictKey: string
  // The restriction warning text (empty = no warning).
  restrictWarn: string
  // True while the capture input is focused and showing '…'.
  isFocused: boolean
  // True if blur should be skipped (after clear/restrict/swap click handlers
  // that programmatically change the value).
  skipBlurRevert: boolean
}

function makeRowState(): RowState {
  return {
    lastGoodVal: '',
    prevVal: '',
    conflictKey: '',
    restrictWarn: '',
    isFocused: false,
    skipBlurRevert: false,
  }
}

// ── Module-level singleton state ──────────────────────────────────────────
const _rowStates = new Map<string, RowState>()

function getRow(key: string): RowState {
  let r = _rowStates.get(key)
  if (!r) {
    r = makeRowState()
    _rowStates.set(key, r)
  }
  return r
}

// Initialize lastGoodVal for every hotkey action on first access.
// The monolith set this inside buildHkRows; here we initialize lazily.
function ensureRowInit(key: string, hk: HotkeyMap) {
  const r = getRow(key)
  if (r.lastGoodVal === '' && !r.isFocused) {
    const stored = hk[key] || ''
    r.lastGoodVal = stored === 'Escape' ? 'Esc' : stored
  }
}

// Search field state.
const _searchQuery = ref('')
const _searchHkMode = ref(false)

// Top-level conflict message (shown in title bar, e.g. "⚠ Save uses this key").
const _conflictMessage = ref('')

// Reset confirm flow state.
const _resetConfirmVisible = ref(false)

// Persist cfg to localStorage. Inline write (matches the monolith's saveCfg).
function persistCfg() {
  try {
    localStorage.setItem('lbl_cfg', JSON.stringify(useAppState().cfg.value))
  } catch {
    // localStorage may be unavailable (sandboxed tests); silently ignore.
  }
}

// ── Display helpers (consumed by SettingsDialog template) ──────────────────
// Stored 'Escape' → display 'Esc'; empty stays empty (unlike HotkeyCell's em dash).
function storedToDisplay(stored: string): string {
  return stored === 'Escape' ? 'Esc' : stored
}

// The capture input's visible value: '…' while focused, otherwise the current
// stored value (or empty). Matches the monolith's inp.value semantics.
export function captureDisplay(key: string): string {
  const { cfg } = useAppState()
  ensureRowInit(key, cfg.value.hotkeys)
  const r = getRow(key)
  if (r.isFocused) return '…'
  const stored = cfg.value.hotkeys[key] || ''
  return storedToDisplay(stored)
}

// Clear button is visible only while the capture shows '…' (focused, awaiting).
export function isClearVisible(key: string): boolean {
  return getRow(key).isFocused
}

// Default button is visible when value differs from default, OR a restriction
// warning is active, OR a conflict is pending (those states need Reset to clear).
export function isResetVisible(key: string): boolean {
  const { cfg } = useAppState()
  const live = cfg.value.hotkeys[key] || ''
  const def = DEFAULT_CFG.hotkeys[key] || ''
  const r = getRow(key)
  return live !== def || r.restrictWarn !== '' || r.conflictKey !== ''
}

// Swap button is visible only when a conflict is pending for this row.
export function isReplaceVisible(key: string): boolean {
  return getRow(key).conflictKey !== ''
}

export function restrictWarnText(key: string): string {
  return getRow(key).restrictWarn
}

export function isRowInConflict(key: string): boolean {
  return getRow(key).conflictKey !== ''
}

// ── Search helpers ──────────────────────────────────────────────────────────
export function searchQuery(): string { return _searchQuery.value }
export function searchHkMode(): boolean { return _searchHkMode.value }
export function setSearchQuery(q: string) { _searchQuery.value = q }
export function isSearchHkModeActive(): boolean { return _searchHkMode.value }

// Filter visibility: returns true if the row should be hidden by the current
// search query. The monolith toggled .s-hidden on .hk-row elements; here the
// template binds :class="{ 's-hidden': isRowHidden(key) }" reactively.
export function isRowHidden(key: string): boolean {
  const q = _searchQuery.value.trim()
  if (!q) return false
  const { cfg } = useAppState()
  if (_searchHkMode.value) {
    // Hotkey search: show only rows whose stored hotkey matches q.
    const stored = cfg.value.hotkeys[key] || ''
    const disp = storedToDisplay(stored)
    return disp !== q && stored !== q
  }
  // Text search: match label text.
  const label = HK_LABELS[key] || key
  return !label.toLowerCase().includes(q.toLowerCase())
}

// Section-level visibility. In hotkey-search mode, only the "Hotkeys" section
// is visible (its rows are filtered by isRowHidden). In text-search mode, a
// section is visible if its label matches OR any child row is visible.
export function isSectionHidden(sectionLabel: string, keys: string[]): boolean {
  const q = _searchQuery.value.trim()
  if (!q) return false
  if (_searchHkMode.value) {
    // Hotkey mode: only the Hotkeys section survives.
    return sectionLabel !== 'Hotkeys'
  }
  const labelMatch = sectionLabel.toLowerCase().includes(q.toLowerCase())
  const anyChildVisible = keys.some((k) => !isRowHidden(k))
  return !labelMatch && !anyChildVisible
}

// Non-hotkey row visibility (instant-replay checkboxes, interval rows, meta).
// In hotkey-search mode, all non-hotkey rows are hidden. In text-search mode,
// rows are hidden if their label doesn't match the query.
export function isNonHkRowHidden(label: string): boolean {
  const q = _searchQuery.value.trim()
  if (!q) return false
  if (_searchHkMode.value) return true
  return !label.toLowerCase().includes(q.toLowerCase())
}

// ── Action functions ────────────────────────────────────────────────────────

// Clear (unassign) the hotkey for `key`. If stayFocused, keep the input focused.
export function clearHotkey(key: string, stayFocused: boolean) {
  const { cfg } = useAppState()
  const r = getRow(key)
  r.skipBlurRevert = true
  cfg.value.hotkeys[key] = ''
  r.lastGoodVal = ''
  persistCfg()
  _conflictMessage.value = ''
  r.conflictKey = ''
  r.restrictWarn = ''
  // Stay focused = the input keeps focus (Shift+Backspace path). Otherwise blur.
  if (!stayFocused) {
    r.isFocused = false
  }
  r.skipBlurRevert = false
}

// Reset to default. Swap pattern: if another action currently holds the
// default value, give it its own default.
export function resetHotkey(key: string) {
  const { cfg } = useAppState()
  const def = DEFAULT_CFG.hotkeys[key] || ''
  const r = getRow(key)
  if (def) {
    const holder = Object.entries(cfg.value.hotkeys).find(
      ([k2, v]) => k2 !== key && v === def,
    )
    if (holder) {
      const holderDef = DEFAULT_CFG.hotkeys[holder[0]] || ''
      cfg.value.hotkeys[holder[0]] = holderDef
      const holderRow = getRow(holder[0])
      holderRow.lastGoodVal = storedToDisplay(holderDef)
    }
  }
  cfg.value.hotkeys[key] = def
  r.lastGoodVal = storedToDisplay(def)
  persistCfg()
  _conflictMessage.value = ''
  r.conflictKey = ''
  r.restrictWarn = ''
}

// Swap the conflicting hotkey with this row's pending value. Both sides get a
// real key (no blanks left).
export function swapHotkey(key: string) {
  const { cfg } = useAppState()
  const r = getRow(key)
  if (!r.conflictKey) return
  const oldKey = cfg.value.hotkeys[key] || ''
  cfg.value.hotkeys[r.conflictKey] = oldKey
  // The pending value is whatever the user just typed — tracked in lastGoodVal
  // (set during the keydown handler when the conflict was detected).
  cfg.value.hotkeys[key] = r.lastGoodVal === 'Esc' ? 'Escape' : r.lastGoodVal
  persistCfg()
  _conflictMessage.value = ''
  r.conflictKey = ''
}

// Called when the capture input gains focus.
export function onCaptureFocus(key: string) {
  const r = getRow(key)
  r.prevVal = r.lastGoodVal
  r.isFocused = true
  _conflictMessage.value = ''
  r.conflictKey = ''
  r.restrictWarn = ''
}

// Called when the capture input loses focus.
export function onCaptureBlur(key: string) {
  const r = getRow(key)
  if (r.skipBlurRevert) return
  r.isFocused = false
}

// Capture input keydown handler. Returns true if the event was handled (caller
// should preventDefault + stopPropagation); false otherwise.
//
// Special keys:
//   Tab/ArrowUp/ArrowDown/ArrowLeft/ArrowRight: preventDefault + return false
//     (the global focus trap moves focus; we just block the native behavior)
//   Shift+Backspace: clear (unassign) and stay focused
//   Backspace: if Reset visible, click it and advance focus to next capture
//   Enter: if Swap visible, click it and advance; else just advance
//   Escape: revert to last good value and blur
//   Modifier-only (Ctrl/Shift/Alt/Meta alone): return false (no action)
//   Otherwise: capture the key, check restriction + conflict, save or show Swap
export function onCaptureKeydown(key: string, e: KeyboardEvent): boolean {
  const { cfg } = useAppState()
  const r = getRow(key)
  ensureRowInit(key, cfg.value.hotkeys)

  // Tab and arrows bubble to the global focus trap (don't stopPropagation).
  if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    return false
  }
  e.preventDefault()
  e.stopPropagation()

  // Shift+Backspace = clear (unassign), stay focused.
  if (e.key === 'Backspace' && e.shiftKey) {
    clearHotkey(key, true)
    return true
  }

  // Backspace = activate Default if visible, then advance focus.
  if (e.key === 'Backspace') {
    if (isResetVisible(key)) {
      // The template's @click on the Default button will fire resetHotkey.
      // Focus advance is handled by the SettingsDialog component via a ref to
      // the captures list — we expose the action via a callback set below.
      _pendingAdvanceKey.value = key
    }
    return true
  }

  // Enter = activate Swap if visible, else just advance focus.
  if (e.key === 'Enter') {
    if (isReplaceVisible(key)) {
      _pendingAdvanceKey.value = key
    } else {
      _pendingAdvanceKey.value = key
    }
    return true
  }

  // Escape = revert + blur.
  if (e.key === 'Escape') {
    revertAndExit(key)
    return true
  }

  // Modifier-only: no action.
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return true

  // Capture the key.
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  parts.push(normKey(e.key))
  const newVal = parts.join('+')
  const newStored = newVal === 'Esc' ? 'Escape' : newVal

  // Restriction check.
  const restrictMsg = isRestrictedForKey(newStored, key)
  if (restrictMsg) {
    r.restrictWarn = `⚠ ${restrictMsg}`
    _conflictMessage.value = ''
    r.conflictKey = ''
    // Revert display but stay focused (user can try another key).
    r.skipBlurRevert = true
    r.isFocused = false
    r.skipBlurRevert = false
    return true
  }

  r.restrictWarn = ''
  r.isFocused = false // user accepted a value; show it instead of '…'

  // Conflict check.
  const conflict = Object.entries(cfg.value.hotkeys).find(
    ([k2, v]) => k2 !== key && v === newStored,
  )
  if (conflict) {
    const conflictLabel = HK_LABELS[conflict[0]] || conflict[0]
    _conflictMessage.value = `⚠ "${conflictLabel}" uses this key — press Swap or Enter`
    r.conflictKey = conflict[0]
    r.lastGoodVal = newVal // pending value (display form)
  } else {
    _conflictMessage.value = ''
    r.conflictKey = ''
    cfg.value.hotkeys[key] = newStored
    r.lastGoodVal = newVal
    persistCfg()
  }
  return true
}

// Internal: revert display to last good value, clear conflict/restrict UI, blur.
function revertAndExit(key: string) {
  const r = getRow(key)
  r.skipBlurRevert = true
  r.isFocused = false
  _conflictMessage.value = ''
  r.conflictKey = ''
  r.restrictWarn = ''
  r.skipBlurRevert = false
}

// The "pending advance key" — set when Enter or Backspace fires, consumed by
// SettingsDialog.vue's onCaptureKeydown handler to advance focus after the
// reset/swap click has been triggered.
const _pendingAdvanceKey = ref<string | null>(null)
export function consumePendingAdvance(): string | null {
  const k = _pendingAdvanceKey.value
  _pendingAdvanceKey.value = null
  return k
}

// ── Reset confirm flow ──────────────────────────────────────────────────────
export function isResetConfirmVisible(): boolean { return _resetConfirmVisible.value }
export function showResetConfirm() {
  _resetConfirmVisible.value = true
}
export function hideResetConfirm() {
  _resetConfirmVisible.value = false
}

// Apply the reset: deep-clone DEFAULT_CFG and overwrite every cfg field.
// Font + speed resets are handled by their own composables (useEditorFont,
// useAudio) — the caller (SettingsDialog) wires those via a callback.
export interface ResetCallbacks {
  resetEditorFont: () => void
  resetSpeed: () => void
  resetSeekOffsetDisplay: () => void
}
let _resetCallbacks: ResetCallbacks = {
  resetEditorFont: () => {},
  resetSpeed: () => {},
  resetSeekOffsetDisplay: () => {},
}
export function setResetCallbacks(cb: ResetCallbacks) {
  _resetCallbacks = cb
}

export function doResetDefaults() {
  const { cfg } = useAppState()
  const d: AppConfig = structuredClone(DEFAULT_CFG)
  cfg.value.replay_prev_line = d.replay_prev_line
  cfg.value.replay_next_line = d.replay_next_line
  cfg.value.replay_resume_current = d.replay_resume_current
  cfg.value.replay_play_other = d.replay_play_other
  cfg.value.replay_after_offset = d.replay_after_offset
  cfg.value.replay_after_sync = d.replay_after_sync
  cfg.value.replay_after_ts = d.replay_after_ts
  cfg.value.tiny_ms = d.tiny_ms
  cfg.value.small_ms = d.small_ms
  cfg.value.medium_ms = d.medium_ms
  cfg.value.large_ms = d.large_ms
  cfg.value.seek_offset = d.seek_offset
  cfg.value.seek_increment_s = d.seek_increment_s
  cfg.value.speed_ratio = d.speed_ratio
  cfg.value.vol_increment = d.vol_increment
  cfg.value.undo_debounce_ms = d.undo_debounce_ms
  cfg.value.default_meta = d.default_meta
  cfg.value.hotkeys = { ...d.hotkeys }
  // Reset per-row state to defaults so display values match.
  _rowStates.clear()
  persistCfg()
  _resetCallbacks.resetEditorFont()
  _resetCallbacks.resetSpeed()
  _resetCallbacks.resetSeekOffsetDisplay()
}

// ── Search mode ──────────────────────────────────────────────────────────────
export function setSearchHkMode(on: boolean) {
  _searchHkMode.value = on
  if (on) {
    _searchQuery.value = ''
  }
}

// Hotkey-search-mode keydown handler. Returns true if handled.
export function onSearchKeydown(e: KeyboardEvent): boolean {
  if (_searchHkMode.value) {
    if (['Tab', 'ArrowUp', 'ArrowDown'].includes(e.key)) return false
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') {
      setSearchHkMode(false)
      _searchQuery.value = ''
      return true
    }
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return true
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    parts.push(normKey(e.key))
    const ks = parts.join('+')
    const { cfg } = useAppState()
    const isAssigned = Object.values(cfg.value.hotkeys).some(
      (v) => v === ks || (ks === 'Esc' && v === 'Escape'),
    )
    if (isRestrictedForAll(ks) && !isAssigned) return true
    _searchQuery.value = ks
    return true
  }
  // Normal mode: toggle_mode hotkey switches to hk mode; reset_defaults shows
  // confirm; Escape and Tab/ArrowUp/ArrowDown pass through to the global handler.
  if (['Tab', 'ArrowUp', 'ArrowDown'].includes(e.key)) return false
  if (e.key === 'Escape') return false
  // Build the canonical key string for matching.
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    parts.push(normKey(e.key))
  }
  if (parts.length === 0) return false
  const ks = parts.join('+')
  const { cfg } = useAppState()
  const hk = cfg.value.hotkeys
  // Match stored 'Escape' against keyStr 'Esc' (the normKey quirk).
  const matches = (stored: string) => ks === stored || (stored === 'Escape' && ks === 'Escape')
  if (hk.reset_defaults && matches(hk.reset_defaults)) {
    e.preventDefault()
    showResetConfirm()
    return true
  }
  e.stopPropagation()
  if (hk.toggle_mode && matches(hk.toggle_mode)) {
    e.preventDefault()
    setSearchHkMode(true)
    return true
  }
  return false
}

// ── saveSettingsNow ─────────────────────────────────────────────────────────
// Reads DOM input values via the element IDs the template renders, then writes
// them to cfg + persists. The monolith's saveSettingsNow reads
// `document.getElementById('s-tiny').value` etc.; here we accept a values
// object so the composable doesn't reach into the DOM directly.
export interface SettingsFormValues {
  replay_prev_line: boolean
  replay_next_line: boolean
  replay_resume_current: boolean
  replay_play_other: boolean
  replay_after_offset: boolean
  replay_after_sync: boolean
  replay_after_ts: boolean
  tiny_ms: number
  small_ms: number
  medium_ms: number
  large_ms: number
  seek_increment_s: number
  speed_ratio: number
  vol_increment: number
  undo_debounce_ms: number
  default_meta: string
}

export function saveSettingsNow(v: SettingsFormValues) {
  const { cfg } = useAppState()
  cfg.value.replay_prev_line = v.replay_prev_line
  cfg.value.replay_next_line = v.replay_next_line
  cfg.value.replay_resume_current = v.replay_resume_current
  cfg.value.replay_play_other = v.replay_play_other
  cfg.value.replay_after_offset = v.replay_after_offset
  cfg.value.replay_after_sync = v.replay_after_sync
  cfg.value.replay_after_ts = v.replay_after_ts
  cfg.value.tiny_ms = v.tiny_ms || 100
  cfg.value.small_ms = v.small_ms || 200
  cfg.value.medium_ms = v.medium_ms || 400
  cfg.value.large_ms = v.large_ms || 1000
  cfg.value.seek_increment_s = Math.max(1, v.seek_increment_s || 5)
  cfg.value.speed_ratio = Math.max(1.01, Math.min(2, v.speed_ratio || 1.1))
  cfg.value.vol_increment = Math.max(0.01, Math.min(1, (v.vol_increment || 10) / 100))
  cfg.value.undo_debounce_ms = Math.max(1, v.undo_debounce_ms || 150)
  cfg.value.default_meta = v.default_meta
  persistCfg()
}

// ── initSettings ─────────────────────────────────────────────────────────────
// Called once when the SettingsDialog opens. Resets search + per-row state so
// the dialog renders from the current cfg (the monolith's openSettings does
// the same: inp.value=''; _sSearchHkMode=false; buildHkRows()).
export function initSettings() {
  _searchQuery.value = ''
  _searchHkMode.value = false
  _conflictMessage.value = ''
  _resetConfirmVisible.value = false
  _rowStates.clear()
}

// ── conflict message accessor ────────────────────────────────────────────────
export function conflictMessage(): string { return _conflictMessage.value }

// ── Settings focusable elements helper (consumed by Tranche 9's useGlobalHotkeys) ──
// Returns the live list of focusable elements inside #settings-win, mirroring
// the monolith's _getSettingsFocusable. Filters out hidden buttons (Clear/Reset/
// Swap) which are .visible-toggled and shouldn't be in the Tab order when hidden.
export function getSettingsFocusable(): HTMLElement[] {
  const win = document.querySelector('.settings-win')
  if (!win) return []
  return Array.from(
    win.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => {
    if (el instanceof HTMLButtonElement && el.disabled) return false
    if (el.offsetParent === null) return false
    if (el.classList.contains('hk-clear')) return false
    if (el.classList.contains('hk-reset')) return false
    if (el.classList.contains('hk-replace')) return false
    return true
  })
}

// ── useSettings() ──────────────────────────────────────────────────────────
// Convenience export: bundle everything the SettingsDialog component needs.
export function useSettings() {
  return {
    // Display helpers
    captureDisplay,
    isClearVisible,
    isResetVisible,
    isReplaceVisible,
    restrictWarnText,
    isRowInConflict,
    isRowHidden,
    isSectionHidden,
    isNonHkRowHidden,
    searchQuery,
    searchHkMode,
    conflictMessage,
    isResetConfirmVisible,
    // Actions
    onCaptureFocus,
    onCaptureBlur,
    onCaptureKeydown,
    onSearchKeydown,
    clearHotkey,
    resetHotkey,
    swapHotkey,
    setSearchHkMode,
    saveSettingsNow,
    showResetConfirm,
    hideResetConfirm,
    doResetDefaults,
    setResetCallbacks,
    initSettings,
    consumePendingAdvance,
    getSettingsFocusable,
  }
}

// Re-export HK_SECTIONS + HK_LABELS for the template's convenience.
export { HK_SECTIONS, HK_LABELS }
export type { AppConfig, HotkeyMap }
