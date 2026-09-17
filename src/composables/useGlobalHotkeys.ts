
// Phase D Tranche 9 — global keyboard handler, ported from the monolith
// "── Keyboard → Global KD ──" + "── Overlay utilities ──" sections. Owns:
//  - The document-level keydown handler that dispatches to ~30 actions via a
//    table-driven approach matching the monolith's _handleGlobalHotkeyDispatch.
//  - Repeat-key guard (e.repeat): bail early for non-nav keys; preventDefault
//    for mode-toggle keys even on repeat.
//  - Focused-UI-element guard: suppress hotkey dispatch when a button/input/
//    select/textarea/a outside the content area has focus (unless ctrlKey/
//    altKey — those are intentional shortcuts, not accidental Enter).
//  - Typing-mode arrow-key override: ↑/↓ for prev/next line when no textarea
//    is focused.
//  - Settings focus trap (Tab/ArrowUp/ArrowDown navigation) + Escape + the
//    hotkey dispatch that should fire even when Settings is open.
//  - Reset confirm Enter/Backspace shortcuts.
//  - Hotkey-mode-only dispatch (syncLine, insertEndLine, seekPrevLine/
//    seekNextLine, replayActiveLine, adjustTs, markAsTranslation, etc.).
//
// PORT DELTAS from the monolith:
//  - `cfg` is the reactive ref from useAppState (Tranche 1).
//  - State reads (hotkeyMode, offsetSeekMode, activeLine, selectedLines) come
//    from useAppState refs.
//  - Action functions are imported from their composables (useSync, useAudio,
//    useModeSwitch, useMerge, useImport, useUndoRedo via App callbacks).
//  - Settings open/close state lives on App.vue's `settingsOpen` ref. The
//    composable receives a `isSettingsOpen` callback + a `toggleSettings`
//    callback so it doesn't import App.vue.
//  - `rebuildHkPanel()` calls are gone — Vue's reactivity re-renders
//    ControlsPanel when hotkeyMode/offsetSeekMode change.
//  - `updateDynamicTooltips()` is now a separate export (no longer tied to the
//    global handler); App.vue calls it after cfg changes + on Init.
//  - `arrowNavTimer` / `suppressAutoLine` module-level state stays in useSync
//    (Tranche 5 port). This composable just imports `isAutoLineSuppressed`
//    for the typing-mode arrow override.
//
// Singleton pattern: initGlobalHotkeys(callbacks) called once in App.vue
// setup. The handler attaches in onMounted and detaches in onBeforeUnmount.

import { useAppState } from './useAppState'
import { hkMatch, keyStr } from '@/hotkeys/keyUtils'
import { META_RE } from '@/utils/lrcParser'
import {
  adjustTs,
  doSyncFile,
  insertEndLine,
  markAsTranslation,
  seekNextLine,
  seekPrevLine,
  replayActiveLine,
  setOffsetMode,
  syncLine,
  renderMainLines,
  scrollToActive,
  tickSeekOffset,
} from './useSync'
import { changeSpeed, doSeekBack, doSeekFwd, toggleMute, togglePlay } from './useAudio'
import { toggleMode } from './useModeSwitch'
import { addSecondary, mergeTranslations, removeSecondary } from './useMerge'
import { doImport, doSave } from './useImport'
import { cycleTheme } from './useTheme'
import { usePanelCollapse } from './usePanelCollapse'
import { useSettings, getSettingsFocusable, showResetConfirm, hideResetConfirm, doResetDefaults } from './useSettings'

// ── Callbacks (set by initGlobalHotkeys) ──────────────────────────────────
export interface GlobalHotkeyCallbacks {
  // Settings open state — App.vue owns the settingsOpen ref.
  isSettingsOpen: () => boolean
  toggleSettings: () => void
  // Help + Issues links open in a new tab.
  openHelp: () => void
  openIssues: () => void
  // Undo/redo — owned by useUndoRedo via App.vue's instance.
  doUndo: () => void
  doRedo: () => void
}

const _callbacks: { current: GlobalHotkeyCallbacks | null } = {
  current: null,
}

export function initGlobalHotkeys(callbacks: GlobalHotkeyCallbacks) {
  _callbacks.current = callbacks
}

// ── Repeat-key guard ──────────────────────────────────────────────────────
// Returns true if the event was a repeat that should be suppressed.
function _isRepeatAllowed(e: KeyboardEvent, ks: string, hk: Record<string, string>): boolean {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return true
  const { cfg } = useAppState()
  if (hkMatch(ks, hk.prev_line) && cfg.value.replay_prev_line) return true
  if (hkMatch(ks, hk.next_line) && cfg.value.replay_next_line) return true
  return false
}

function handleRepeatGuard(e: KeyboardEvent, ks: string, hk: Record<string, string>): boolean {
  if (!e.repeat) return false
  if (_isRepeatAllowed(e, ks, hk)) return false
  if (hkMatch(ks, hk.toggle_mode) || hkMatch(ks, hk.offset_mode_toggle)) {
    e.preventDefault()
  }
  return true
}

// ── Focused-UI-element guard ──────────────────────────────────────────────
// Suppress hotkey dispatch when a button/input/select/textarea/a outside the
// content area has focus (unless ctrlKey/altKey — those are intentional).
function isFocusedUIElement(ae: Element | null): boolean {
  if (!ae) return false
  const mainTextarea = document.getElementById('main-textarea')
  const mainLines = document.getElementById('main-lines')
  const inLyricArea =
    ae === mainTextarea || ae === mainLines || ae === document.body || ae === document.documentElement
  if (inLyricArea) return false
  return (
    ae.tagName === 'BUTTON' ||
    ae.tagName === 'INPUT' ||
    ae.tagName === 'SELECT' ||
    ae.tagName === 'TEXTAREA' ||
    ae.tagName === 'A'
  )
}

// ── Typing-mode arrow keys ────────────────────────────────────────────────
// ↑/↓ for prev/next line when no textarea has focus (the user has blurred all
// inputs). Returns true if handled.
function handleTypingModeArrowKeys(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.altKey || e.shiftKey) return false
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return false
  const ae = document.activeElement
  if (ae && ae !== document.body && ae !== document.documentElement) return false
  e.preventDefault()
  if (e.key === 'ArrowUp') seekPrevLine()
  else seekNextLine()
  return true
}

// ── Settings focus trap + overlay utilities ──────────────────────────────
// Tab/ArrowUp/ArrowDown navigation inside the settings dialog.
function handleSettingsTabArrows(e: KeyboardEvent, settingsOpen: boolean): boolean {
  if (!settingsOpen) return false
  if (e.key !== 'Tab' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return false
  if (e.ctrlKey || e.altKey) return false
  e.preventDefault()
  const focusable = getSettingsFocusable()
  if (!focusable.length) return true
  const idx = focusable.indexOf(document.activeElement as HTMLElement)
  const backward = e.shiftKey || e.key === 'ArrowUp'
  const next = backward ? Math.max(0, idx - 1) : Math.min(focusable.length - 1, idx + 1)
  focusable[next]?.focus()
  return true
}

// Settings-only hotkey dispatch: settings/help/issues/theme/panel/reset_defaults.
// These fire even when the dialog is open (except reset_defaults, which only
// fires when settings is closed — opens it first, then confirms).
function handleSettingsHotkeyDispatch(
  e: KeyboardEvent,
  ks: string,
  hk: Record<string, string>,
  settingsOpen: boolean,
): boolean {
  const cb = _callbacks.current
  if (!cb) return false
  if (hkMatch(ks, hk.settings)) {
    e.preventDefault()
    cb.toggleSettings()
    return true
  }
  if (hk.help && hkMatch(ks, hk.help)) {
    e.preventDefault()
    cb.openHelp()
    return true
  }
  if (hk.issues && hkMatch(ks, hk.issues)) {
    e.preventDefault()
    cb.openIssues()
    return true
  }
  if (hk.theme_toggle && hkMatch(ks, hk.theme_toggle)) {
    e.preventDefault()
    cycleTheme()
    return true
  }
  if (hk.panel_toggle && hkMatch(ks, hk.panel_toggle)) {
    e.preventDefault()
    const { panelCollapsed, applyPanelCollapse } = usePanelCollapse()
    panelCollapsed.value = !panelCollapsed.value
    applyPanelCollapse(false)
    return true
  }
  if (hk.reset_defaults && hkMatch(ks, hk.reset_defaults)) {
    e.preventDefault()
    if (!settingsOpen) cb.toggleSettings()
    showResetConfirm()
    return true
  }
  return false
}

// Escape inside settings: if confirm pending, hide it; if hk-capture focused,
// stay (revert path handled by capture's own keydown); if search focused +
// hk mode, exit hk mode; otherwise close.
function handleSettingsEscape(e: KeyboardEvent, settingsOpen: boolean): boolean {
  if (e.key !== 'Escape' || !settingsOpen) return false
  e.preventDefault()
  const { isResetConfirmVisible, setSearchHkMode, searchHkMode } = useSettings()
  if (isResetConfirmVisible()) {
    hideResetConfirm()
    return true
  }
  const focused = document.activeElement
  if (focused?.classList.contains('hk-capture')) return true
  const srch = document.getElementById('s-search')
  if (focused === srch) {
    if (searchHkMode()) {
      setSearchHkMode(false)
      return true
    }
    _callbacks.current?.toggleSettings()
    return true
  }
  _callbacks.current?.toggleSettings()
  return true
}

// Reset-confirm keyboard shortcuts: Enter confirms, Backspace cancels.
function handleResetConfirmKeys(e: KeyboardEvent, settingsOpen: boolean): boolean {
  if (!settingsOpen) return false
  const { isResetConfirmVisible } = useSettings()
  if (!isResetConfirmVisible()) return false
  if (e.key === 'Enter') {
    e.preventDefault()
    hideResetConfirm()
    doResetDefaults()
    return true
  }
  if (e.key === 'Backspace') {
    e.preventDefault()
    hideResetConfirm()
    return true
  }
  return false
}

// Settings keys dispatcher — called when settings is open.
function handleSettingsKeys(e: KeyboardEvent, ks: string, hk: Record<string, string>, settingsOpen: boolean): boolean {
  if (handleSettingsTabArrows(e, settingsOpen)) return true
  if (handleSettingsHotkeyDispatch(e, ks, hk, settingsOpen)) return true
  if (handleSettingsEscape(e, settingsOpen)) return true
  if (handleResetConfirmKeys(e, settingsOpen)) return true
  return false
}

// ── Global hotkey dispatch (table-driven) ──────────────────────────────────
// Map of canonical key string → action function. Returns true if dispatched.
function handleGlobalHotkeyDispatch(e: KeyboardEvent, ks: string, hk: Record<string, string>): boolean {
  const cb = _callbacks.current
  if (!cb) return false
  const map: Record<string, () => void> = {
    [hk.undo ?? '']: cb.doUndo,
    [hk.redo ?? '']: cb.doRedo,
    [hk.add_field ?? '']: addSecondary,
    [hk.remove_field ?? '']: removeSecondary,
    [hk.merge_fields ?? '']: mergeTranslations,
    [hk.mark_translation ?? '']: markAsTranslation,
    [hk.speed_down ?? '']: () => changeSpeed(-1),
    [hk.speed_up ?? '']: () => changeSpeed(1),
    [hk.speed_reset ?? '']: () => changeSpeed(0),
    [hk.seek_back ?? '']: doSeekBack,
    [hk.seek_fwd ?? '']: doSeekFwd,
    [hk.play_pause_alt ?? '']: togglePlay,
    [hk.toggle_mode ?? '']: () => {
      toggleMode()
    },
    [hk.offset_mode_toggle ?? '']: () => setOffsetMode(!useAppState().offsetSeekMode.value),
    [hk.sync_file ?? '']: doSyncFile,
  }
  const fn = map[ks]
  if (!fn) return false
  e.preventDefault()
  fn()
  return true
}

function handleGlobalHotkeys(e: KeyboardEvent, ks: string, hk: Record<string, string>): boolean {
  const cb = _callbacks.current
  if (!cb) return false
  if (hk.open && hkMatch(ks, hk.open)) {
    e.preventDefault()
    doImport()
    return true
  }
  if (hk.save && hkMatch(ks, hk.save)) {
    e.preventDefault()
    doSave()
    return true
  }
  if (handleGlobalHotkeyDispatch(e, ks, hk)) return true
  if (ks === 'Ctrl+M') {
    // Mute toggle isn't remappable (RESTRICTED_ALL blocks Ctrl+M); this is the
    // hardcoded dispatch the monolith kept alongside the table-driven map.
    e.preventDefault()
    toggleMute()
    return true
  }
  return false
}

// ── Hotkey-mode-only dispatch ─────────────────────────────────────────────
// Navigation: Home/End/PageUp/PageDown/ArrowUp/ArrowDown (with Shift/Ctrl
// modifiers for selection / cursor-only moves).
function findNextNonMetaLine(allLines: string[], candidate: number, dir: number, lineCount: number): number {
  while (candidate >= 0 && candidate < lineCount) {
    if (!META_RE.test(allLines[candidate]!) && allLines[candidate]!.trim() !== '') break
    candidate += dir
  }
  return candidate
}

// The first/last lyric line (non-meta, non-blank). Matches the monolith's
// firstLyricLine / lastLyricLine helpers.
function firstLyricLine(): number {
  const lines = useAppState().mainText.value.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') return i
  }
  return -1
}
function lastLyricLine(): number {
  const lines = useAppState().mainText.value.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') return i
  }
  return -1
}

function isAtBoundary(isUp: boolean): boolean {
  const { activeLine } = useAppState()
  if (isUp) return activeLine.value >= 0 && activeLine.value === firstLyricLine()
  return activeLine.value >= 0 && activeLine.value === lastLyricLine()
}

function handleHotkeyModeArrows(e: KeyboardEvent, allLines: string[], lineCount: number) {
  const { activeLine, selectedLines } = useAppState()
  const isUp = e.key === 'ArrowUp'
  if (!e.shiftKey && !e.ctrlKey && isAtBoundary(isUp)) return
  // Note: isAutoLineSuppressed is shared state from useSync — the typing-mode
  // arrow override won't fire here (we're in hotkey mode), but the flag
  // is consumed by handleTypingModeArrowKeys which reads it via the import.
  const dir = isUp ? -1 : 1
  const next = Math.max(0, activeLine.value)
  let candidate = findNextNonMetaLine(allLines, next + dir, dir, lineCount)
  if (
    candidate < 0 ||
    candidate >= lineCount ||
    META_RE.test(allLines[candidate]!) ||
    allLines[candidate]!.trim() === ''
  ) {
    candidate = next
  }
  const clamped = Math.max(0, Math.min(lineCount - 1, candidate))
  if (e.shiftKey) {
    if (selectedLines.value.size === 0 && activeLine.value >= 0) {
      selectedLines.value.add(activeLine.value)
    }
    selectedLines.value.add(clamped)
    activeLine.value = clamped
  } else if (e.ctrlKey) {
    activeLine.value = clamped
  } else {
    selectedLines.value.clear()
    activeLine.value = clamped
  }
  // Trigger a re-render of the line list — Vue's reactivity handles this
  // since activeLine is a ref consumed by renderMainLines.
  // (The monolith called renderMainLines() + scrollToActive() explicitly.)
  renderMainLines()
  scrollToActive()
}

function handlePageKeys(e: KeyboardEvent, allLines: string[]) {
  e.preventDefault()
  const { activeLine, selectedLines } = useAppState()
  const scroll = document.getElementById('main-scroll')
  if (!scroll) return
  const lineH = scroll.scrollHeight / Math.max(1, allLines.filter((l) => !META_RE.test(l)).length)
  const pageLines = Math.max(1, Math.floor(scroll.clientHeight / lineH) - 1)
  const nonMeta = allLines
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => !META_RE.test(l) && l.trim() !== '')
  if (!nonMeta.length) return
  const curPos = nonMeta.findIndex(({ i }) => i === activeLine.value)
  let base = curPos
  if (base < 0) base = e.key === 'PageUp' ? nonMeta.length - 1 : 0
  const targetPos =
    e.key === 'PageUp'
      ? Math.max(0, base - pageLines)
      : Math.min(nonMeta.length - 1, base + pageLines)
  activeLine.value = nonMeta[targetPos]!.i
  selectedLines.value.clear()
  renderMainLines()
  scrollToActive()
}

function handleHotkeyModeNav(e: KeyboardEvent, allLines: string[], lineCount: number) {
  const { activeLine, selectedLines } = useAppState()
  if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault()
    const nonMeta = allLines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => !META_RE.test(l) && l.trim() !== '')
    if (nonMeta.length) {
      activeLine.value = e.key === 'Home' ? nonMeta[0]!.i : nonMeta.at(-1)!.i
      selectedLines.value.clear()
      renderMainLines()
      scrollToActive()
    }
    return
  }
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    handlePageKeys(e, allLines)
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    handleHotkeyModeArrows(e, allLines, lineCount)
  }
}

function handleHotkeyModeReplay(e: KeyboardEvent, ks: string, hk: Record<string, string>): boolean {
  const { activeLine } = useAppState()
  if (hkMatch(ks, hk.replay_line) && activeLine.value >= 0) {
    e.preventDefault()
    syncLine()
    return true
  }
  if (hkMatch(ks, hk.replay_only) && activeLine.value >= 0) {
    e.preventDefault()
    replayActiveLine(false)
    return true
  }
  if (hk.replay_end && hkMatch(ks, hk.replay_end) && activeLine.value >= 0) {
    e.preventDefault()
    replayActiveLine(true)
    return true
  }
  if (e.shiftKey && e.key === 'Enter' && activeLine.value >= 0) {
    e.preventDefault()
    replayActiveLine(true)
    return true
  }
  if (e.shiftKey && hkMatch('Space', hk.play_pause) && e.key === ' ') {
    e.preventDefault()
    replayActiveLine(true)
    return true
  }
  return false
}

function handleHotkeyModeKeys(e: KeyboardEvent, ks: string, hk: Record<string, string>) {
  const { selectedLines } = useAppState()
  if (e.key === 'Escape' || hkMatch(ks, hk.clear_sel)) {
    e.preventDefault()
    selectedLines.value.clear()
    renderMainLines()
    return
  }
  const allLines = useAppState().mainText.value.split('\n')
  const lineCount = allLines.length
  if (['Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    handleHotkeyModeNav(e, allLines, lineCount)
    return
  }
  if (handleHotkeyModeReplay(e, ks, hk)) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    doSeekBack()
    return
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    doSeekFwd()
    return
  }
  const { cfg, offsetSeekMode } = useAppState()
  const om = offsetSeekMode.value
  const actions: Record<string, () => void> = {
    [hk.play_pause ?? '']: () => togglePlay(),
    [hk.sync ?? '']: () => syncLine(),
    [hk.end_line ?? '']: () => insertEndLine(),
    [hk.prev_line ?? '']: () => seekPrevLine(),
    [hk.next_line ?? '']: () => seekNextLine(),
    [hk.ts_back_tiny ?? '']: () => om ? tickSeekOffset(-cfg.value.tiny_ms) : adjustTs(-cfg.value.tiny_ms),
    [hk.ts_fwd_tiny ?? '']: () => om ? tickSeekOffset(cfg.value.tiny_ms) : adjustTs(cfg.value.tiny_ms),
    [hk.ts_back_small ?? '']: () => om ? tickSeekOffset(-cfg.value.small_ms) : adjustTs(-cfg.value.small_ms),
    [hk.ts_fwd_small ?? '']: () => om ? tickSeekOffset(cfg.value.small_ms) : adjustTs(cfg.value.small_ms),
    [hk.ts_back_medium ?? '']: () => om ? tickSeekOffset(-cfg.value.medium_ms) : adjustTs(-cfg.value.medium_ms),
    [hk.ts_fwd_medium ?? '']: () => om ? tickSeekOffset(cfg.value.medium_ms) : adjustTs(cfg.value.medium_ms),
    [hk.ts_back_large ?? '']: () => om ? tickSeekOffset(-cfg.value.large_ms) : adjustTs(-cfg.value.large_ms),
    [hk.ts_fwd_large ?? '']: () => om ? tickSeekOffset(cfg.value.large_ms) : adjustTs(cfg.value.large_ms),
  }
  const fn = actions[ks]
  if (fn) {
    e.preventDefault()
    fn()
  }
}

// ── Global keydown handler ──────────────────────────────────────────────────
// The document-level handler. App.vue attaches it in onMounted.
export function onGlobalKeydown(e: KeyboardEvent) {
  const cb = _callbacks.current
  if (!cb) return
  const { cfg, hotkeyMode } = useAppState()
  const hk = cfg.value.hotkeys
  const settingsOpen = cb.isSettingsOpen()
  const ks = keyStr(e)

  // Settings-layer keys: focus trap, hotkey dispatch that fires even with
  // settings open, Escape, reset-confirm shortcuts.
  if (handleSettingsKeys(e, ks, hk, settingsOpen)) return
  if (settingsOpen) return

  // Repeat-key guard (suppresses held-key spam except for nav keys).
  if (handleRepeatGuard(e, ks, hk)) return

  const ae = document.activeElement
  // Escape blurs focused UI elements before the focused-UI guard kicks in.
  if (isFocusedUIElement(ae) && e.key === 'Escape') {
    e.preventDefault()
    ;(ae as HTMLElement).blur()
    return
  }
  // Focused-UI guard: skip hotkey dispatch when a button/input/etc outside the
  // content area has focus (unless ctrlKey/altKey — intentional shortcuts).
  if (isFocusedUIElement(ae) && !e.ctrlKey && !e.altKey) return

  // Global hotkeys (work in both hotkey + typing mode).
  if (handleGlobalHotkeys(e, ks, hk)) return

  // Typing mode: only ↑/↓ for prev/next line override.
  if (!hotkeyMode.value) {
    if (handleTypingModeArrowKeys(e)) return
    return
  }

  // Hotkey-mode-only dispatch.
  handleHotkeyModeKeys(e, ks, hk)
}

// ── updateDynamicTooltips ──────────────────────────────────────────────────
// Ported from the monolith's updateDynamicTooltips. Reads cfg.hotkeys and
// writes the `title` attribute on the menu-bar + left-panel buttons. Called
// after every cfg change (Settings save, capture input commit, reset).
//
// Vue note: this is imperative DOM — the buttons already have static titles
// in their templates; this overlay updates them with the live hotkey labels.
// A reactive alternative (binding :title in each template) is a post-cutover
// cleanup, but the imperative path matches the monolith's behavior verbatim.
export function updateDynamicTooltips() {
  const { cfg } = useAppState()
  const hk = cfg.value.hotkeys
  const fmt = (k: string | undefined) => k || '(unassigned)'

  const set = (id: string, title: string) => {
    const el = document.getElementById(id)
    if (el) el.title = title
  }

  set('btn-import', `Open (${fmt(hk.open)} / Middle click)`)
  set('btn-save', `Save (${fmt(hk.save)})`)
  set('btn-undo', `Undo (${fmt(hk.undo)})`)
  set('btn-redo', `Redo (${fmt(hk.redo)})`)
  set('btn-add-sec', `Add secondary field (${fmt(hk.add_field)})`)
  set('btn-remove-sec', `Hide last secondary field (${fmt(hk.remove_field)})`)
  set('merge-btn', `Merge fields (${fmt(hk.merge_fields)})`)
  set('btn-theme', `Toggle theme (${fmt(hk.theme_toggle)})`)
  set('btn-settings', `Settings (${fmt(hk.settings)})`)
  set('btn-help', `Help (${fmt(hk.help)})`)
  set('btn-issues', `Issues (${fmt(hk.issues)})`)
  set('sync-file-btn', `Apply seek offset to all timestamps then reset to 0 (${fmt(hk.sync_file)})`)
  set('speed-down-btn', `Reduce speed (${fmt(hk.speed_down)})`)
  set('speed-up-btn', `Increase speed (${fmt(hk.speed_up)})`)
  const mtEl = document.getElementById('main-paren-label')
  if (mtEl) mtEl.title = 'Wrap marked translations in parentheses'
  const inc = cfg.value.seek_increment_s || 5
  set('btn-seek-back', `Seek back ${inc}s (${fmt(hk.seek_back)} / ArrowLeft in Hotkey mode)`)
  set('btn-seek-fwd', `Seek forward ${inc}s (${fmt(hk.seek_fwd)} / ArrowRight in Hotkey mode)`)
  set('btn-play-pause', `Play/pause (${fmt(hk.play_pause_alt)})`)
}

// ── Convenience export ────────────────────────────────────────────────────
export function useGlobalHotkeys() {
  return {
    initGlobalHotkeys,
    onGlobalKeydown,
    updateDynamicTooltips,
  }
}
