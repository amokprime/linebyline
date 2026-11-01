// Phase D Tranche 2 — autosave, ported from the monolith's `loadAutosave`,
// `doAutosave`, and `_restoreSecondaryPool`. Owns the sessionStorage
// `lbl_autosave` round-trip: on load, restores main text + secondary pool +
// mergeDone + audioPath, computes the initial activeLine, and seeds the undo
// stack. On every meaningful change (called by useAudio and future tranches),
// writes the current state to sessionStorage.
//
// PORT DELTAS from the monolith:
//  - `_setTA(d.main)` → `setMainText(d.main)` callback (writes `mainText` ref
//    in useAppState). The monolith reads/writes `getElementById('main-textarea').value`
//    directly; Vue uses a reactive ref that the textarea binds to.
//  - `_restoreSecondaryPool(d)` pushes entries to `secondaryPool` (useAppState)
//    with `{ visible, text }` shape — no DOM elements. The monolith creates
//    DOM columns via `addSecondary()`; Vue's SecondaryField component renders
//    columns reactively from the pool. Entries beyond `visibleCount` get
//    `visible: false` (the monolith sets `col.style.display = 'none'`).
//  - `poolTexts` maps from `secondaryPool.value.map(e => e.text)` (not
//    `c.linesEl.value` — the DOM textarea is gone, text lives in the pool entry).
//    **Caveat**: until Tranche 6 wires SecondaryField's textarea `@input` to
//    update `e.text`, `doAutosave` saves whatever was loaded — user typing in
//    secondary fields isn't captured. Documented as a known Tranche 2 limitation.
//  - `renderMainLines()`, `checkLineCounts()` are callback stubs (Tranche 5/6).
//    `updateTitleFromText()` is wired to useTitle (Tranche 2).
//  - `takeSnapshot` + `seedUndo` are callbacks wired by App.vue to useUndoRedo
//    (Tranche 1). The monolith does `undoStack = [takeSnapshot()]; redoStack = [];`
//    — `seedUndo(snap)` does the same (replaces the stack with a single seed).
//  - **The monolith's Init clears sessionStorage before loadAutosave**:
//    `sessionStorage.removeItem('lbl_autosave')` runs before `loadAutosave()`,
//    which means autosave NEVER restores in the monolith — it's always cleared
//    on page load. This appears to be intentional (the user starts fresh each
//    time they open the app) or a leftover from debugging. The Vue port does
//    NOT clear — the single-file-html-app skill says "reload on init to survive
//    accidental refresh". If the user wants the clear behavior, they can add
//    `sessionStorage.removeItem('lbl_autosave')` before `loadAutosave()` in
//    App.vue. Documented as a port delta.
//  - `mainText` lives in useAppState (new this tranche). The monolith's
//    `getTA()`/`_setTA()` are replaced by `mainText.value` reads/writes.
//    EditorArea binds the textarea `:value="mainText"` (one-way — Tranche 5
//    adds `@input` for two-way). **Caveat**: until Tranche 5, user typing in
//    the textarea doesn't update `mainText` — `doAutosave` saves the
//    programmatic value, not user edits. This is fine for Tranche 2's scope
//    (loadAutosave + doAutosave after programmatic changes like setupAudio).

import { META_RE } from '@/utils/lrcParser'
import { useAppState, MAX_LINES } from './useAppState'
import type { Snapshot } from './useUndoRedo'

export interface AutosaveData {
  main: string
  poolTexts: string[]
  visibleCount: number
  mergeDone: boolean
  audioPath?: string
}

export interface AutosaveCallbacks {
  getMainText: () => string
  setMainText: (t: string) => void
  renderMainLines: () => void
  checkLineCounts: () => void
  updateTitleFromText: (text: string) => void
  takeSnapshot: () => Snapshot
  seedUndo: (snap: Snapshot) => void
}

const _callbacks: AutosaveCallbacks = {
  getMainText: () => '',
  setMainText: () => {},
  renderMainLines: () => {},
  checkLineCounts: () => {},
  updateTitleFromText: () => {},
  takeSnapshot: () => ({ main: '', secondaries: [], mergeDone: false }),
  seedUndo: () => {},
}

export function initAutosave(callbacks: Partial<AutosaveCallbacks>) {
  Object.assign(_callbacks, callbacks)
}

// Port of the monolith _restoreSecondaryPool(d). Pushes pool entries from
// the saved texts, then hides entries beyond visibleCount. The monolith
// creates DOM columns via addSecondary(); here, secondaryPool is the source
// of truth and SecondaryField renders columns reactively.
function _restoreSecondaryPool(d: AutosaveData) {
  const { secondaryPool } = useAppState()
  // Clear any existing pool entries (loadAutosave is an init-time call)
  secondaryPool.value = []
  // Index `i` was only used to read `d.poolTexts[i]` — for-of is safe per
  // code-quality-SKILL.md → for-of conversion safety (S4138).
  for (const text of d.poolTexts) {
    secondaryPool.value.push({ visible: true, text: text || '' })
  }
  const vis = d.visibleCount || 0
  for (let i = vis; i < secondaryPool.value.length; i++) {
    secondaryPool.value[i]!.visible = false
  }
}

// Compute the initial activeLine — the first non-meta non-blank line.
// Extracted from loadAutosave() so the parent function stays under the
// SonarQube cognitive-complexity threshold (S3776: 20 → ~12 post-extraction).
// The monolith's same loop lives inline; extracting it here is safe because
// the function is module-local and the only caller is loadAutosave().
function _computeInitialActiveLine(text: string): number {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length && i < MAX_LINES; i++) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') return i
  }
  return -1
}

// Port of the monolith loadAutosave(). Reads sessionStorage, restores state,
// computes initial activeLine, seeds undo stack. Called by App.vue onMounted.
export function loadAutosave() {
  const { cfg, mergeDone, savedAudioPath, activeLine, playingLine } = useAppState()
  let s: string | null = null
  try {
    s = sessionStorage.getItem('lbl_autosave')
  } catch {
    s = null
  }

  if (s) {
    try {
      const d = JSON.parse(s) as AutosaveData
      _callbacks.setMainText(d.main || cfg.value.default_meta)
      if (d.mergeDone) mergeDone.value = d.mergeDone
      if (d.audioPath) savedAudioPath.value = d.audioPath
      // Optional chaining replaces `d.poolTexts && d.poolTexts.length` (S6582).
      if (d.poolTexts?.length) _restoreSecondaryPool(d)
    } catch {
      _callbacks.setMainText(cfg.value.default_meta)
    }
  } else {
    _callbacks.setMainText(cfg.value.default_meta)
  }

  _callbacks.renderMainLines()
  _callbacks.checkLineCounts()
  _callbacks.updateTitleFromText(_callbacks.getMainText())

  // Compute initial activeLine — first non-meta non-blank line. Extracted
  // to _computeInitialActiveLine() to keep this function under CC 15.
  if (activeLine.value < 0) {
    activeLine.value = _computeInitialActiveLine(_callbacks.getMainText())
  }

  playingLine.value = -1

  // Seed undo stack — replaces the stack with a single snapshot of the
  // current state (monolith: `undoStack = [takeSnapshot()]; redoStack = [];`)
  _callbacks.seedUndo(_callbacks.takeSnapshot())
}

// Port of the monolith doAutosave(). Writes the current state to sessionStorage.
// Called by useAudio.setupAudio and future tranches after meaningful changes.
export function doAutosave(audioPath?: string) {
  const { mainText, secondaryPool, mergeDone, savedAudioPath } = useAppState()
  const d: AutosaveData = {
    main: mainText.value,
    poolTexts: secondaryPool.value.map((e) => e.text),
    visibleCount: secondaryPool.value.filter((e) => e.visible).length,
    mergeDone: mergeDone.value,
  }
  if (audioPath !== undefined) savedAudioPath.value = audioPath
  if (savedAudioPath.value) d.audioPath = savedAudioPath.value
  try {
    sessionStorage.setItem('lbl_autosave', JSON.stringify(d))
  } catch {
    // sessionStorage may be full or blocked — silent fail (monolith parity)
  }
}

export function useAutosave() {
  return { loadAutosave, doAutosave, initAutosave }
}