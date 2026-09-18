
// Phase D Tranche 7 — import + save, ported from the monolith's
// "── Import ──" section. Owns:
//  - doImport (opens #file-picker)
//  - doSave (builds filename from [ti:] tag or fallback, downloads as .lrc)
//  - onFilePickerChange (handles multi-file selection — audio + lrc pairs)
//  - onMiddleClick (middle-click anywhere → doImport, or open secondary
//    picker if hovering over a visible secondary textarea)
//
// PORT DELTAS from the monolith:
//  - **State reads come from `useAppState` refs** (mainText, lastImportStem,
//    savedAudioPath, secondaryPool, activeLine, playingLine, selectedLines).
//    The monolith reads module-level `let`s directly.
//  - **`setupAudio` is a callback** (App.vue wires it to useAudio.setupAudio).
//    useImport doesn't import useAudio (avoids a circular dependency — useAudio
//    imports useAppState which useImport also imports).
//  - **`setMainText` is a callback** (App.vue owns the side-effect chain).
//    The monolith inlines `_setTA(text); renderMainLines(); checkLineCounts();
//    updateMergeBtn(); updateTitleFromText(); pushSnapshot(); doAutosave(stem);`.
//    Tranche 5 collapsed it into `setMainText(t)`; useImport calls that + the
//    extra `doAutosave(stem)` + `pushSnapshot()` for the wholesale replacement.
//  - **`#file-picker` is a Ref<HTMLInputElement | null>** registered by App.vue
//    (the picker is a hidden element at the app root). useImport reads it via
//    `setFilePickerRef(ref)`.
//  - **`#settings-overlay` open check is gone** — the monolith checked
//    `settings-overlay.classList.contains('open')` before doImport to prevent
//    middle-click import while settings is open. In Vue, the SettingsDialog is
//    a shadcn-vue Dialog with its own focus trap — middle-click outside the
//    dialog doesn't reach the document handler. The check is unnecessary.
//  - **`resetState()` for audio+lrc pairs** — the monolith clears undoStack,
//    redoStack, activeLine, playingLine, selectedLines, secondaryPool, audioEl,
//    playing, savedAudioPath, song-title, song-artist, time-pos, time-dur,
//    progress-fill. Vue-side, most of these are reactive refs that reset by
//    reassignment. The undo stack is cleared via `seedUndo` (useUndoRedo).
//  - **Middle-click secondary picker** — the monolith finds the secondary
//    entry whose `col.contains(e.target)` and opens its file picker. Vue-side,
//    SecondaryField registers its file picker with the pool entry; useImport
//    scans `secondaryPool.value` for a visible entry whose `textareaEl` or
//    file picker contains the click target.
//
// Singleton pattern (matches useSync/useMerge): initImport(callbacks) called
// once in App.vue setup. Action functions are module-level exports.

import type { Ref } from 'vue'
import { useAppState, MAX_LINES } from './useAppState'
import {
  META_RE,
  lrcHasTi,
  normalizeLrcTimestamps,
} from '@/utils/lrcParser'
import { mergeLrcMeta } from '@/utils/pasteHandlers'
import { batchSplitParens } from '@/utils/timestampSync'
import { type Snapshot } from './useUndoRedo'

// ── Refs + callbacks (set by initImport) ───────────────────────────────────
export interface ImportCallbacks {
  // Owned by App.vue — the setMainText side-effect chain (Tranche 5).
  setMainText: (t: string) => void
  getMainText: () => string
  doAutosave: (pathHint?: string) => void
  // Audio — App.vue wires to useAudio.setupAudio + useAudio.clearAudio.
  setupAudio: (file: File, pathHint?: string) => void
  clearAudio: () => void
  // Title — App.vue wires to useTitle.setSongTitle + setSongArtist.
  setSongTitle: (s: string) => void
  setSongArtist: (s: string) => void
  // Undo — App.vue wires to useUndoRedo.pushSnapshot + seedUndo.
  pushSnapshot: () => void
  seedUndo: (snap: Snapshot) => void
  takeSnapshot: () => Snapshot
  // Render + line counts — Tranche 5/6 composables.
  renderMainLines: () => void
  checkLineCounts: () => void
  updateMergeBtn: () => void
  updateTitleFromText: () => void
}

const _callbacks: ImportCallbacks = {
  setMainText: () => {},
  getMainText: () => '',
  doAutosave: () => {},
  setupAudio: () => {},
  clearAudio: () => {},
  setSongTitle: () => {},
  setSongArtist: () => {},
  pushSnapshot: () => {},
  seedUndo: () => {},
  takeSnapshot: () => ({ main: '', secondaries: [], mergeDone: false }),
  renderMainLines: () => {},
  checkLineCounts: () => {},
  updateMergeBtn: () => {},
  updateTitleFromText: () => {},
}

let _filePickerRef: Ref<HTMLInputElement | null> | null = null

export function initImport(callbacks: Partial<ImportCallbacks> = {}) {
  Object.assign(_callbacks, callbacks)
}

export function setImportCallbacks(callbacks: Partial<ImportCallbacks>) {
  Object.assign(_callbacks, callbacks)
}

export function setFilePickerRef(ref: Ref<HTMLInputElement | null>) {
  _filePickerRef = ref
}

// ── Helpers ──────────────────────────────────────────────────────────────
function stemOf(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

// Reset state for an audio+lrc pair import. The monolith clears undoStack,
// redoStack, activeLine, playingLine, selectedLines, secondaryPool visibility,
// audioEl, playing, savedAudioPath, song-title, song-artist, time-pos/dur,
// progress-fill. Vue-side, the reactive refs reset by reassignment; the undo
// stack is cleared via seedUndo.
function resetStateForPairImport() {
  const { activeLine, playingLine, selectedLines, secondaryPool, savedAudioPath } = useAppState()
  activeLine.value = -1
  playingLine.value = -1
  selectedLines.value.clear()
  // Hide all visible secondary entries + clear their text (the monolith sets
  // `col.style.display = 'none'; e.linesEl.value = '';` then `secondaryCols = []`).
  // Pool entries stay for reuse — the text is cleared so the next add starts fresh.
  for (const entry of secondaryPool.value) {
    entry.visible = false
    entry.text = ''
  }
  savedAudioPath.value = null
  _callbacks.clearAudio()
  _callbacks.setSongTitle('Unknown Title')
  _callbacks.setSongArtist('Unknown Artist')
}

// Compute the initial activeLine — the first non-meta non-blank line.
function computeInitialActiveLine(text: string): number {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') {
      return i
    }
  }
  return -1
}

// Shared lrc processing — extracted from onFilePickerChange's lrc-only + pair
// branches to keep onFilePickerChange under CC 15. Reads the raw text, merges
// meta, optionally preserves the [ti:] stem, sets main text, computes the
// initial activeLine, and calls the post-import callbacks. The `stemForTi`
// param controls which stem to use for the [ti:] tag (lfStem for lrc-only,
// lastImportStem for pair import where the audio sets the stem first).
function processImportedLrc(
  raw: string,
  stemForTi: string | null,
  lfStem: string | null,
  useLastImportStemForTi: boolean,
) {
  if (raw.split('\n').length > MAX_LINES) {
    alert(`File exceeds ${MAX_LINES} line limit. Import a shorter file.`)
    return
  }
  const { lastImportStem, activeLine } = useAppState()
  let mergedMeta = mergeLrcMeta(raw, useAppState().cfg.value.default_meta)
  if (!lrcHasTi(raw)) {
    const stemToUse = useLastImportStemForTi
      ? lastImportStem.value
      : (lastImportStem.value || stemForTi)
    if (stemToUse) {
      mergedMeta = mergedMeta.replace(/^\[ti:.*\]/m, `[ti: ${stemToUse}]`)
    }
  }
  if (!lastImportStem.value && lfStem) {
    lastImportStem.value = lfStem
  }
  const lines = raw.split('\n').filter((l) => !META_RE.test(l))
  let text = mergedMeta + '\n' + lines.join('\n').trim()
  if ((document.getElementById('main-split-check') as HTMLInputElement | null)?.checked) {
    text = batchSplitParens(text)
  }
  _callbacks.setMainText(text)
  if (activeLine.value < 0) {
    activeLine.value = computeInitialActiveLine(_callbacks.getMainText())
    _callbacks.renderMainLines()
  }
}

// ── doImport / doSave ─────────────────────────────────────────────────────
export function doImport() {
  const picker = _filePickerRef?.value
  if (!picker) {
    return
  }
  picker.value = '' // reset so re-selecting the same file fires 'change'
  picker.click()
}

export function doSave() {
  const { lastImportStem } = useAppState()
  const text = _callbacks.getMainText()
  // Parse [ti:] tag via string indexOf (avoids S8786 regex backtracking +
  // S6594 .match → .exec). Same logic as useTitle.ts but without regex.
  let ti = ''
  const tiIdx = text.indexOf('[ti:')
  if (tiIdx >= 0) {
    const closeIdx = text.indexOf(']', tiIdx + 4)
    if (closeIdx > tiIdx + 4) {
      ti = text.slice(tiIdx + 4, closeIdx).trim()
    }
  }
  let stem = 'lyrics'
  if (ti && ti.toLowerCase() !== 'unknown') {
    stem = ti
  }
  else if (lastImportStem.value) stem = lastImportStem.value
  // Sanitise filename — strip filesystem-unsafe chars
  stem = stem.replace(/[/\\:*?"<>|]/g, '_')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = stem + '.lrc'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ── File picker change handler ────────────────────────────────────────────
// Handles multi-file selection: finds the audio file + the lrc/txt file,
// then dispatches to one of three paths:
//  1. audio only → setupAudio + return
//  2. lrc only → read + merge meta + set main text + push snapshot + doAutosave
//  3. audio + lrc → reset state + setupAudio + read lrc + merge + set + seed undo
export function onFilePickerChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files.length) {
    return
  }
  const audioExts = /\.(mp3|flac|ogg|wav|m4a|aac|opus)$/i
  const lrcExts = /\.(lrc|txt)$/i
  const af = files.find((f) => audioExts.test(f.name))
  const lf = files.find((f) => lrcExts.test(f.name))
  const afStem = af ? stemOf(af.name) : null
  const lfStem = lf ? stemOf(lf.name) : null
  const audioOnly = af && !lf
  const lrcOnly = lf && !af

  if (audioOnly) {
    _callbacks.setupAudio(af!, afStem || undefined)
    return
  }

  if (lrcOnly) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = normalizeLrcTimestamps((ev.target?.result as string) || '')
      processImportedLrc(raw, lfStem, lfStem, false)
      // setMainText (called by processImportedLrc) already pushes a pre +
      // post snapshot. The extra pushSnapshot here would add a duplicate
      // top entry, making the first undo a no-op (pop to identical state).
      // The monolith's flow uses _setTA (no push) + one explicit pushSnapshot;
      // the Vue port's setMainText replaces both, so the explicit push is gone.
      _callbacks.doAutosave(lfStem || undefined)
    }
    reader.readAsText(lf!, 'utf-8')
    return
  }

  // audio + lrc pair — reset state + setupAudio + read lrc
  resetStateForPairImport()
  _callbacks.setupAudio(af!, afStem || undefined)
  const reader = new FileReader()
  reader.onload = (ev) => {
    const raw = normalizeLrcTimestamps((ev.target?.result as string) || '')
    processImportedLrc(raw, null, lfStem, true)
    // Seed undo with the post-import snapshot (the monolith does
    // `undoStack = [takeSnapshot()]; redoStack = [];`)
    _callbacks.seedUndo(_callbacks.takeSnapshot())
    _callbacks.doAutosave(lfStem || undefined)
  }
  reader.readAsText(lf!, 'utf-8')
}

// ── Middle-click handler ───────────────────────────────────────────────────
// Middle-click anywhere → doImport, UNLESS hovering over a visible secondary
// textarea (in which case open that field's per-field .lrc picker). The
// monolith checks `secondaryPool.find(en => en.col.contains(e.target) && …)`.
// Vue-side, SecondaryField registers its file picker via the pool entry, so we
// scan for a visible entry whose `textareaEl` contains the click target.
export function onMiddleClick(e: MouseEvent) {
  if (e.button !== 1) {
    return
  }
  e.preventDefault()
  const { secondaryPool } = useAppState()
  for (const entry of secondaryPool.value.filter((en) => en.visible)) {
    if (entry.textareaEl?.contains(e.target as Node)) {
      // Open the per-field picker — SecondaryField's 📂 button click handler.
      // The picker element lives in the SecondaryField component; we trigger it
      // via a custom event the component listens for, OR by finding the input
      // directly. The simplest path: find the picker by its id pattern.
      const picker = document.getElementById(`sec-file-${secondaryPool.value.indexOf(entry) + 1}`) as HTMLInputElement | null
      if (picker) {
        picker.value = ''
        picker.click()
        return
      }
    }
  }
  doImport()
}

// ── Exported for App.vue / MenuBar ─────────────────────────────────────────
export function useImport() {
  return {
    initImport,
    setImportCallbacks,
    setFilePickerRef,
    doImport,
    doSave,
    onFilePickerChange,
    onMiddleClick,
  }
}
