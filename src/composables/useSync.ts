// Phase D Tranche 5 — sync/timestamp, ported from the monolith "── Sync /
// timestamp ──" + "── Render / line UI ──" sections. Owns:
//  - renderMainLines + _handleLineClick + _handleLineClickPlain
//  - syncLine / insertEndLine / _insertSyncTrailing / _advanceAfterSplit
//  - adjustTs / markAsTranslation
//  - seekPrevLine / seekNextLine / replayActiveLine
//  - updateActiveLineFromTime / scrollToActive / scrollToPlaying
//  - doSyncFile / tickSeekOffset / setOffsetMode
//  - onMainInput / onMainPaste — textarea @input / @paste handlers
//  - onSeekOffsetChange — seek-offset input @change (LeftPanel wires the
//    arrow buttons and sync-file button to these via @click)
//
// PORT DELTAS from the monolith:
//  - **State reads come from useAppState refs**, not module-level `let`s.
//    `activeLine.value` instead of `activeLine = …`; `selectedLines.value`
//    instead of the monolith's `Set` mutation (the ref holds a Set, callers
//    mutate it in place — Vue tracks via reassignment in some places; we
//    keep `selectedLines.value.add(…)` for parity with the Set semantics
//    and reassign only when needed for reactivity, matching useUndoRedo).
//  - **getTA() / _setTA() / setMainText() are callbacks**. The monolith
//    reads `document.getElementById('main-textarea').value` and writes via
//    `_setTA(t); renderMainLines(); checkLineCounts(); updateMergeBtn();
//    updateTitleFromText(); doAutosave(); pushSnapshot();` — that whole
//    chain is `setMainText(t)` here, owned by App.vue (which wires all the
//    cross-composable side-effects in one place).
//  - **DOM elements reached via Ref<HTMLElement | null>**. `#main-lines`
//    and `#main-textarea` are template refs EditorArea registers; this
//    composable reads them at call time and no-ops if null (pre-mount,
//    pure-node tests).
//  - **Pure helpers extracted to src/utils/timestampSync.ts**. The
//    monolith's `_peelLastParen`, `_findNextTimestampMs`, `_assignInterpolatedTs`,
//    `batchSplitParens`, `_findPrevTsMs`, `_findNextTsMs`, `_findRunEnd`,
//    `_findNextUnprocessedSplit`, `_findNextNonMetaFromIdx` are now imports.
//    The stateful wrappers (`_advanceAfterSplit`, `_insertSyncTrailing`,
//    `markAsTranslation`) stay here — they mutate `activeLine` /
//    `syncAutoAdvanced` and call `renderMainLines` / `scrollToActive`.
//  - **suppressAuto is now a closure timer, not a module-level `let`**.
//    The monolith's `arrowNavTimer` and `suppressAutoLine` globals are
//    module-level here too (singleton pattern), so they share one timer
//    across all useSync consumers — same semantics as the monolith.
//  - **renderMainLines uses Vue refs instead of innerHTML strings** for
//    the line list. The monolith builds `.lrc-line` divs via
//    `document.createElement` and attaches click handlers; the Vue port
//    still uses innerHTML-style DOM manipulation here because the line
//    list is rebuilt from scratch on every render (potentially hundreds
//    of lines — Vue's diff is overkill, and the click handlers come from
//    a single delegated handler at the container). The `#main-lines`
//    container is `<ul>` and the lines are `<li role="listitem">` per
//    the existing EditorArea template.
//
// Singleton pattern (matches useAppState / useAudio / useModeSwitch):
// initSync(refs, callbacks) called once in App.vue setup. Action functions
// are module-level exports. vi.resetModules() in tests gives a fresh module.

import type { Ref } from 'vue'
import { useAppState, MAX_LINES } from './useAppState'
import {
  META_RE,
  TS_RE,
  hasLyricContent,
  hasTrailingTimestamp,
  isEndTs,
  msToTs,
  replaceTs,
  tsToMs,
  findLastMetaIdx,
  normalizeLrcTimestamps,
} from '@/utils/lrcParser'
import {
  batchSplitParens,
  findNextNonMetaFromIdx,
  findNextTimestampMs,
  findNextUnprocessedSplit,
  peelLastParen,
} from '@/utils/timestampSync'
import { cleanGenius } from '@/utils/geniusExtractor'
import { cleanPaste, mergeLrcMeta } from '@/utils/pasteHandlers'

// ── Refs + callbacks (set by initSync) ──────────────────────────────────────
export interface SyncRefs {
  // #main-lines — the <ul> container that renderMainLines populates.
  mainLines: Ref<HTMLElement | null>
  // #main-textarea — the raw textarea. Used by markAsTranslation's typing-mode
  // branch (reads selectionStart to find the target line) and by onMainPaste's
  // typing-mode branch (inserts cleaned text at the caret).
  mainTextarea: Ref<HTMLTextAreaElement | null>
  // #main-scroll — the .lyric-scroll container around #main-lines. scrollToActive
  // / scrollToPlaying query its descendant .lrc-line.cursor/.active elements.
  // (Not strictly needed since querySelector works document-wide, but kept for
  // parity with the monolith's structure.)
  mainScroll: Ref<HTMLElement | null>
}

export interface SyncCallbacks {
  // Owned by App.vue — the full setMainText side-effect chain (renderMainLines
  // + checkLineCounts + updateMergeBtn + updateTitleFromText + doAutosave +
  // pushSnapshot). The monolith inlines this chain everywhere; here it's a
  // single callback so the composable's setMainText calls are one-liners.
  setMainText: (t: string) => void
  getMainText: () => string
  // Persistence (Tranche 2)
  doAutosave: (pathHint?: string) => void
  updateTitleFromText: () => void
  // Line counts / merge button — Tranche 6 owns these, but checkLineCounts
  // is called from setMainText's chain (App wires the stub for now).
  checkLineCounts: () => void
  updateMergeBtn: () => void
  // Secondary fields — Tranche 6 owns syncSecScroll (called when playback
  // advances so secondary fields scroll to match the main view).
  syncSecScroll: () => void
  // a11y announcer — _announce writes to #a11y-announcer (the App owns the element).
  announce: (msg: string) => void
  // Audio — needed by useSync's seekPrevLine/seekNextLine/replayActiveLine
  // (these call el.play() if not playing + update lastPlayingLine). Kept as
  // callbacks because useAudio owns the audioEl ref.
  getCurrentMs: () => number
  seekToMs: (ms: number) => void
  playIfNotPlaying: () => void
  setLastPlayingLine: (i: number) => void
  getAudioDurationMs: () => number | null
  isAudioReady: () => boolean
}

// EditorArea-owned refs (main editor DOM). Set by initSync.
const _refs: { current: SyncRefs | null } = {
  current: null,
}
// LeftPanel-owned ref (the #seek-offset input). Set by setSeekOffsetRef so
// LeftPanel can register it without EditorArea having to pass it through.
// useAudio already owns the same ref via its initAudio({ seekOffset }) call —
// this is a second consumer that reads the input value via getSeekOffset().
let _seekOffsetRef: Ref<HTMLInputElement | null> | null = null

const _callbacks: SyncCallbacks = {
  setMainText: () => {},
  getMainText: () => '',
  doAutosave: () => {},
  updateTitleFromText: () => {},
  checkLineCounts: () => {},
  updateMergeBtn: () => {},
  syncSecScroll: () => {},
  announce: () => {},
  getCurrentMs: () => 0,
  seekToMs: () => {},
  playIfNotPlaying: () => {},
  setLastPlayingLine: () => {},
  getAudioDurationMs: () => null,
  isAudioReady: () => false,
}

export function initSync(refs: SyncRefs, callbacks: Partial<SyncCallbacks> = {}) {
  _refs.current = refs
  Object.assign(_callbacks, callbacks)
}

// LeftPanel calls this to register its #seek-offset input ref. Kept separate
// from initSync because LeftPanel owns the ref, not EditorArea. Idempotent —
// safe to call multiple times (tests that re-mount rely on this).
export function setSeekOffsetRef(ref: Ref<HTMLInputElement | null>) {
  _seekOffsetRef = ref
}

// Separate callback setter — App.vue can wire callbacks at any time without
// needing to re-pass the DOM refs. Same pattern as useAudio.setAudioCallbacks.
export function setSyncCallbacks(callbacks: Partial<SyncCallbacks>) {
  Object.assign(_callbacks, callbacks)
}

// ── Internal helpers ──────────────────────────────────────────────────────
function getMainText(): string {
  return _callbacks.getMainText()
}

function getSeekOffset(): number {
  return Number.parseInt(_seekOffsetRef?.value?.value || '') || 0
}

// Suppress auto-line-follow for 1.5s after manual navigation (monolith parity).
// Module-level timer — singleton semantics across all useSync consumers.
// `_suppressAutoLine` is read by the future Tranche 9 keyboard handler
// (_handleTypingModeArrowKeys), but kept here so the singleton timer + flag
// live with the rest of the sync state. Reading it from outside this module
// happens via the export below.
let _arrowNavTimer: ReturnType<typeof setTimeout> | null = null
let _suppressAutoLine = false
export function isAutoLineSuppressed(): boolean {
  return _suppressAutoLine
}

function suppressAuto() {
  _suppressAutoLine = true
  const { syncAutoAdvanced } = useAppState()
  syncAutoAdvanced.value = -1 // any explicit navigation clears the sync-auto-advance state
  if (_arrowNavTimer) {
    clearTimeout(_arrowNavTimer)
  }
  _arrowNavTimer = setTimeout(() => {
    _suppressAutoLine = false
  }, 1500)
}

// First/last lyric line index — used by seekPrevLine/seekNextLine's boundary
// check (return early if activeLine is already at the first/last lyric line).
function firstLyricLine(): number {
  const lines = getMainText().split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') {
      return i
    }
  }
  return -1
}

function lastLyricLine(): number {
  const lines = getMainText().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') {
      return i
    }
  }
  return -1
}

// ── Render / line UI ───────────────────────────────────────────────────────
// Strip the [mm:ss.cc] timestamp prefix from a line for the a11y announce
// message. Uses string indexOf instead of regex to avoid S8786 (super-linear
// backtracking). The timestamp is always 10 chars ([mm:ss.cc]) optionally
// followed by spaces; the rest is the lyric content.
function _stripTsPrefix(line: string): string {
  if (line.startsWith('[') && line.length >= 10 && line[10] === ']') {
    return line.slice(11).replace(/^\s+/, '')
  }
  return line
}

function _announce(msg: string) {
  _callbacks.announce(msg)
}

function _handleLineClickPlain(i: number, line: string) {
  const { activeLine, selectedLines, playing, cfg } = useAppState()
  selectedLines.value.clear()
  activeLine.value = i
  const ms = tsToMs(line)
  if (ms !== null && _callbacks.isAudioReady()) {
    _callbacks.seekToMs(Math.max(0, ms + (cfg.value.replay_play_other ? getSeekOffset() : 0)))
    _callbacks.setLastPlayingLine(i)
    if (!playing.value) {
      _callbacks.playIfNotPlaying()
    }
  }
  renderMainLines()
  scrollToActive()
}

function _handleLineClick(e: MouseEvent, i: number, line: string, lines: string[]) {
  const { activeLine, selectedLines } = useAppState()
  if (e.shiftKey && activeLine.value >= 0) {
    const lo = Math.min(activeLine.value, i)
    const hi = Math.max(activeLine.value, i)
    for (let j = lo; j <= hi; j++) {
      if (!META_RE.test(lines[j]!)) {
        selectedLines.value.add(j)
      }
    }
    activeLine.value = i
    renderMainLines()
  } else if (e.ctrlKey) {
    if (selectedLines.value.has(i)) {
      selectedLines.value.delete(i)
    }
    else selectedLines.value.add(i)
    activeLine.value = i
    renderMainLines()
  } else {
    _handleLineClickPlain(i, line)
  }
}

// Whether a line should be skipped in hotkey-mode rendering. Meta lines are
// always skipped; blank lines are skipped unless they follow a non-meta line
// (preserves blank separators between lyric sections). Extracted from
// renderMainLines to keep its cognitive complexity under 15.
function _shouldSkipLine(line: string, prev: string | undefined, hotkeyMode: boolean): boolean {
  if (hotkeyMode && META_RE.test(line)) {
    return true
  }
  if (hotkeyMode && line.trim() === '') {
    if (prev === undefined || META_RE.test(prev)) {
      return true
    }
  }
  return false
}

// Build the class list for a rendered line. Extracted from renderMainLines.
function _buildLineClasses(
  line: string,
  i: number,
  playingLine: number,
  activeLine: number,
  selectedLines: Set<number>,
): string[] {
  const classes = ['lrc-line']
  if (isEndTs(line)) {
    classes.push('end-ts')
  }
  if (i === playingLine) {
    classes.push('active')
  }
  if (i === activeLine) {
    classes.push('cursor')
  }
  if (selectedLines.has(i)) {
    classes.push('selected')
  }
  return classes
}

// Build the inner HTML for a rendered line. Timestamped lines get a ts span +
// rest span; blank lines get &nbsp;; other lines get escaped text. Extracted
// from renderMainLines.
function _buildLineInner(line: string, classes: string[]): string {
  const ms = tsToMs(line)
  if (ms !== null) {
    const tsText = line.slice(0, 10)
    const restText = line.slice(10)
    return `<span class="ts">${_escapeHtml(tsText)}</span><span>${_escapeHtml(restText)}</span>`
  }
  if (line.trim() === '') {
    classes.push('blank-line')
    return '&nbsp;'
  }
  return _escapeHtml(line)
}

export function renderMainLines() {
  const container = _refs.current?.mainLines.value
  if (!container) {
    return // pre-mount or pure-node test
  }
  const { hotkeyMode, playingLine, activeLine, selectedLines } = useAppState()
  const lines = getMainText().split('\n')

  // Build the inner HTML string. The monolith uses createElement per line +
  // appendChild — same semantics, this is faster for large lists. Each line
  // gets a data-idx attribute so the delegated click handler can recover the
  // index without a closure (avoids one addEventListener per line).
  const parts: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const prev = lines[i - 1]
    if (_shouldSkipLine(line, prev, hotkeyMode.value)) {
      continue
    }
    const classes = _buildLineClasses(line, i, playingLine.value, activeLine.value, selectedLines.value)
    const inner = _buildLineInner(line, classes)
    parts.push(
      `<li class="${classes.join(' ')}" data-idx="${i}" role="listitem">${inner}</li>`,
    )
  }
  container.innerHTML = parts.join('')
}

// Click delegation — attached once to #main-lines by EditorArea. Recovers
// the line index from the data-idx attribute and dispatches to
// _handleLineClick. Matches the monolith's per-line mousedown handler.
export function onMainLinesMouseDown(e: MouseEvent) {
  if (e.button !== 0) {
    return
  }
  const target = e.target as HTMLElement | null
  const li = target?.closest('.lrc-line') as HTMLElement | null
  if (!li) {
    return
  }
  e.preventDefault()
  const i = Number.parseInt(li.dataset.idx || '')
  if (Number.isNaN(i)) {
    return
  }
  const lines = getMainText().split('\n')
  if (i < 0 || i >= lines.length) {
    return
  }
  _handleLineClick(e, i, lines[i]!, lines)
}

// Block the browser's native context menu on the line list (the monolith
// attaches contextmenu preventDefault per line; the delegated version does
// the same single-attach).
export function onMainLinesContextMenu(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('.lrc-line')) {
    e.preventDefault()
  }
}

// Escape HTML special chars to prevent XSS in the innerHTML-assembled line list.
// The monolith uses textContent (XSS-safe) per line; the innerHTML path here
// needs explicit escaping for the text content (the structural tags are static).
function _escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function scrollToActive() {
  const el = _refs.current?.mainLines.value?.querySelector('.lrc-line.cursor') as HTMLElement | null
  el?.scrollIntoView({ block: 'nearest' })
}

export function scrollToPlaying() {
  const el = _refs.current?.mainLines.value?.querySelector('.lrc-line.active') as HTMLElement | null
  el?.scrollIntoView({ block: 'nearest' })
}

// ── Sync / timestamp dispatch ──────────────────────────────────────────────
export function syncLine() {
  const { activeLine, playingLine, cfg, syncAutoAdvanced } = useAppState()
  const ms = _callbacks.getCurrentMs()
  const lines = getMainText().split('\n')
  if (activeLine.value < 0 || activeLine.value >= lines.length) {
    return
  }
  if (!hasLyricContent(getMainText())) {
    return
  }
  const hadContentTs = lines.some(
    (l, i) => tsToMs(l) !== null && !isEndTs(l) && i !== activeLine.value,
  )
  lines[activeLine.value] = replaceTs(lines[activeLine.value]!, ms)
  playingLine.value = activeLine.value
  // Append trailing ts in the same atomic operation if this is the first content timestamp
  if (!hadContentTs && _callbacks.isAudioReady() && _callbacks.getAudioDurationMs() !== null && !hasTrailingTimestamp(lines)) {
    const durMs = _callbacks.getAudioDurationMs()!
    lines.push(msToTs(durMs))
  }
  _callbacks.setMainText(lines.join('\n'))
  if (cfg.value.replay_after_sync) {
    replayActiveLine(false)
  } else {
    const allLines = getMainText().split('\n')
    let next = activeLine.value + 1
    while (next < allLines.length && (META_RE.test(allLines[next]!) || allLines[next]!.trim() === '')) next++
    if (next < allLines.length) {
      const prevLine = activeLine.value
      activeLine.value = next
      suppressAuto()
      // remember the synced line for T trailing-ts (must be after suppressAuto
      // which clears it)
      syncAutoAdvanced.value = prevLine
      renderMainLines()
      scrollToActive()
    }
  }
}

// Insert a trailing ts after the line synced via syncLine's auto-advance.
// Returns true if it handled the insert (so insertEndLine returns early).
function _insertSyncTrailing(lines: string[], ms: number): boolean {
  const { activeLine, syncAutoAdvanced } = useAppState()
  if (syncAutoAdvanced.value < 0) {
    return false
  }
  const prevIdx = syncAutoAdvanced.value
  syncAutoAdvanced.value = -1
  let hasTrailingAfterPrev = false
  for (let i = prevIdx + 1; i < lines.length; i++) {
    if (META_RE.test(lines[i]!) || lines[i]!.trim() === '') {
      continue
    }
    if (isEndTs(lines[i]!)) {
      hasTrailingAfterPrev = true
    }
    break
  }
  if (!hasTrailingAfterPrev && prevIdx < lines.length) {
    const insertIdx = prevIdx + 1
    lines.splice(insertIdx, 0, msToTs(ms))
    _callbacks.setMainText(lines.join('\n'))
    const updated = getMainText().split('\n')
    let next = insertIdx + 1
    while (
      next < updated.length &&
      (META_RE.test(updated[next]!) || updated[next]!.trim() === '' || isEndTs(updated[next]!))
    ) {
      next++
    }
    activeLine.value = next < updated.length ? next : insertIdx
    suppressAuto()
    renderMainLines()
    scrollToActive()
    return true
  }
  return false
}

export function insertEndLine() {
  const { activeLine } = useAppState()
  if (!hasLyricContent(getMainText())) {
    return
  }
  const ms = _callbacks.getCurrentMs()
  const lines = getMainText().split('\n')
  if (_insertSyncTrailing(lines, ms)) {
    return
  }
  // If activeLine is itself a trailing timestamp, update it in place
  if (activeLine.value >= 0 && isEndTs(lines[activeLine.value]!)) {
    lines[activeLine.value] = replaceTs(lines[activeLine.value]!, ms)
    _callbacks.setMainText(lines.join('\n'))
    renderMainLines()
    scrollToActive()
    return
  }
  // Find the next non-blank non-meta line after activeLine
  let nextIdx = -1
  for (let i = activeLine.value >= 0 ? activeLine.value + 1 : 0; i < lines.length; i++) {
    if (lines[i]!.trim() === '' || META_RE.test(lines[i]!)) {
      continue
    }
    nextIdx = i
    break
  }
  // If that next line is already a trailing timestamp, update it in place
  if (nextIdx >= 0 && isEndTs(lines[nextIdx]!)) {
    lines[nextIdx] = replaceTs(lines[nextIdx]!, ms)
    _callbacks.setMainText(lines.join('\n'))
    activeLine.value = nextIdx
    renderMainLines()
    scrollToActive()
    return
  }
  // Otherwise insert a new trailing timestamp after activeLine
  const idx = activeLine.value >= 0 ? activeLine.value + 1 : lines.length
  lines.splice(idx, 0, msToTs(ms))
  _callbacks.setMainText(lines.join('\n'))
  activeLine.value = idx
  renderMainLines()
  scrollToActive()
}

export function adjustTs(delta: number) {
  const { activeLine, selectedLines, cfg } = useAppState()
  const lines = getMainText().split('\n')
  const targets = selectedLines.value.size > 0 ? [...selectedLines.value] : [activeLine.value]
  let changed = false
  for (const i of targets) {
    if (i < 0 || i >= lines.length) {
      continue
    }
    const ms = tsToMs(lines[i]!)
    if (ms === null) {
      continue
    }
    lines[i] = replaceTs(lines[i]!, ms + delta)
    changed = true
  }
  if (!changed) {
    return
  }
  _callbacks.setMainText(lines.join('\n'))
  if (cfg.value.replay_after_ts) {
    replayActiveLine(false)
  }
}

// Advance activeLine to next unprocessed line after a split-mode mark-as-translation.
// Delegates to findNextUnprocessedSplit + findNextNonMetaFromIdx (pure helpers).
function _advanceAfterSplit(updatedLines: string[], afterInserted: number) {
  let nextUnprocessed = findNextUnprocessedSplit(updatedLines, afterInserted)
  if (nextUnprocessed < 0) {
    nextUnprocessed = findNextNonMetaFromIdx(updatedLines, afterInserted)
  }
  if (nextUnprocessed >= 0) {
    const { activeLine } = useAppState()
    activeLine.value = nextUnprocessed
    suppressAuto()
    renderMainLines()
    scrollToActive()
  }
}

// Split-mode mark-as-translation: peel trailing parenthesized groups into
// separate lines with interpolated timestamps. Extracted from
// markAsTranslation to reduce its cognitive complexity. Returns true if the
// split was handled (so the caller returns early).
function _markAsTranslationSplit(
  lines: string[],
  targetIdx: number,
  hotkeyMode: boolean,
): boolean {
  let content = TS_RE.test(lines[targetIdx]!)
    ? lines[targetIdx]!.slice(10).replace(/^ /, '')
    : lines[targetIdx]!
  const ts = TS_RE.test(lines[targetIdx]!) ? lines[targetIdx]!.slice(0, 10) : ''
  const groups: string[] = []
  let peeled: [string, string] | null
  while ((peeled = peelLastParen(content)) !== null) {
    const [before, group] = peeled
    groups.push(group)
    content = before
  }
  if (groups.length === 0) {
    return false
  }
  lines[targetIdx] = ts + (content ? ' ' + content : content)
  const toInsert = groups.slice().reverse()
  lines.splice(targetIdx + 1, 0, ...toInsert)
  const nextMs = findNextTimestampMs(lines, targetIdx + toInsert.length)
  if (nextMs !== null) {
    toInsert.forEach((g, k) => {
      const idx = targetIdx + 1 + k
      lines[idx] = msToTs(Math.max(0, nextMs - (toInsert.length - k) * 10)) + (g ? ' ' + g : '')
    })
  }
  _callbacks.setMainText(lines.join('\n'))
  if (hotkeyMode) {
    _advanceAfterSplit(getMainText().split('\n'), targetIdx + 1 + toInsert.length)
  }
  return true
}

// Normal mark-as-translation: stamp the next timestamp minus 10ms onto the
// target line, optionally wrapping content in parens. Extracted from
// markAsTranslation to reduce its cognitive complexity.
function _markAsTranslationNormal(
  lines: string[],
  targetIdx: number,
  useParens: boolean,
  hotkeyMode: boolean,
) {
  const { activeLine } = useAppState()
  const nextMs = findNextTimestampMs(lines, targetIdx)
  if (nextMs === null) {
    return
  }
  const content = TS_RE.test(lines[targetIdx]!)
    ? lines[targetIdx]!.slice(10).replace(/^ /, '')
    : lines[targetIdx]!
  let newContent = content
  if (useParens && newContent.trim() && !newContent.trim().startsWith('(')) {
    newContent = '(' + newContent.trim() + ')'
  }
  lines[targetIdx] = msToTs(nextMs - 10) + (newContent ? ' ' + newContent : '')
  _callbacks.setMainText(lines.join('\n'))
  if (hotkeyMode) {
    const updatedLines = getMainText().split('\n')
    for (let j = targetIdx + 1; j < updatedLines.length; j++) {
      if (!META_RE.test(updatedLines[j]!) && updatedLines[j]!.trim() !== '') {
        activeLine.value = j
        suppressAuto()
        renderMainLines()
        scrollToActive()
        break
      }
    }
  }
}

export function markAsTranslation() {
  const { activeLine, hotkeyMode } = useAppState()
  if (!hasTrailingTimestamp(getMainText().split('\n'))) {
    return
  }
  const lines = getMainText().split('\n')
  let targetIdx: number
  if (hotkeyMode.value) {
    targetIdx = activeLine.value >= 0 ? activeLine.value : -1
  } else {
    const ta = _refs.current?.mainTextarea.value
    if (!ta) {
      return
    }
    const pos = ta.selectionStart
    targetIdx = ta.value.slice(0, pos).split('\n').length - 1
  }
  if (targetIdx < 0 || targetIdx >= lines.length) {
    return
  }
  if (META_RE.test(lines[targetIdx]!)) {
    return
  }

  // Read the split + paren checkboxes from the DOM (EditorArea owns them).
  const splitMode = (document.getElementById('main-split-check') as HTMLInputElement | null)?.checked ?? false
  const useParens = (document.getElementById('main-paren-check') as HTMLInputElement | null)?.checked ?? false

  if (splitMode) {
    if (_markAsTranslationSplit(lines, targetIdx, hotkeyMode.value)) {
      return
    }
  }

  _markAsTranslationNormal(lines, targetIdx, useParens, hotkeyMode.value)
}

// ── Seek offset / sync file ─────────────────────────────────────────────────
export function tickSeekOffset(delta: number) {
  const { cfg } = useAppState()
  const el = _seekOffsetRef?.value
  if (!el) {
    return
  }
  el.value = String((Number.parseInt(el.value) || 0) + delta)
  cfg.value.seek_offset = Number.parseInt(el.value)
  // Persist cfg — the monolith calls saveCfg(). App.vue owns cfg persistence
  // (localStorage.setItem('lbl_cfg', JSON.stringify(cfg.value))). The Tranche
  // 8 settings dialog will wire this more cleanly; for now, save inline.
  try {
    localStorage.setItem('lbl_cfg', JSON.stringify(cfg.value))
  } catch {
    // localStorage may be unavailable — silent fail (monolith parity)
  }
  if (cfg.value.replay_after_offset) {
    replayActiveLine(false)
  }
}

export function setOffsetMode(isSeek: boolean) {
  const { offsetSeekMode } = useAppState()
  offsetSeekMode.value = isSeek
  // No rebuildHkPanel() — Vue's reactivity re-renders ControlsPanel.
}

export function doSyncFile() {
  const delta = getSeekOffset()
  if (!delta) {
    return
  }
  const lines = getMainText().split('\n')
  const updated = lines.map((l) => {
    const ms = tsToMs(l)
    return ms !== null ? replaceTs(l, ms + delta) : l
  })
  _callbacks.setMainText(updated.join('\n'))
}

// Seek-offset input @change handler — parse, NaN revert, persist cfg.
export function onSeekOffsetChange(e: Event) {
  const { cfg } = useAppState()
  const target = e.target as HTMLInputElement
  const v = Number.parseInt(target.value)
  if (Number.isNaN(v)) {
    target.value = String(cfg.value.seek_offset)
    return
  }
  cfg.value.seek_offset = v
  try {
    localStorage.setItem('lbl_cfg', JSON.stringify(cfg.value))
  } catch {
    // silent fail
  }
}

// ── Playback navigation ────────────────────────────────────────────────────
export function seekPrevLine() {
  const { activeLine, cfg } = useAppState()
  if (activeLine.value >= 0 && activeLine.value === firstLyricLine()) {
    return
  }
  const lines = getMainText().split('\n')
  for (let i = activeLine.value - 1; i >= 0; i--) {
    if (META_RE.test(lines[i]!) || lines[i]!.trim() === '') {
      continue
    }
    const ms = tsToMs(lines[i]!)
    activeLine.value = i
    suppressAuto()
    if (ms !== null && cfg.value.replay_prev_line) {
      _callbacks.seekToMs(Math.max(0, ms + getSeekOffset()))
      if (_callbacks.isAudioReady() && !useAppState().playing.value) {
        _callbacks.playIfNotPlaying()
        _callbacks.setLastPlayingLine(i)
      }
    }
    renderMainLines()
    scrollToActive()
    return
  }
}

export function seekNextLine() {
  const { activeLine, cfg } = useAppState()
  if (activeLine.value >= 0 && activeLine.value === lastLyricLine()) {
    return
  }
  const lines = getMainText().split('\n')
  for (let i = activeLine.value + 1; i < lines.length; i++) {
    if (META_RE.test(lines[i]!) || lines[i]!.trim() === '') {
      continue
    }
    const ms = tsToMs(lines[i]!)
    activeLine.value = i
    suppressAuto()
    if (ms !== null && cfg.value.replay_next_line) {
      _callbacks.seekToMs(Math.max(0, ms + getSeekOffset()))
      if (_callbacks.isAudioReady() && !useAppState().playing.value) {
        _callbacks.playIfNotPlaying()
        _callbacks.setLastPlayingLine(i)
      }
    }
    renderMainLines()
    scrollToActive()
    return
  }
}

export function replayActiveLine(seekEnd: boolean) {
  const { activeLine } = useAppState()
  if (activeLine.value < 0 || !_callbacks.isAudioReady()) {
    return
  }
  const lines = getMainText().split('\n')
  let ms = tsToMs(lines[activeLine.value]!)
  if (seekEnd) {
    for (let i = activeLine.value + 1; i < lines.length; i++) {
      const nm = tsToMs(lines[i]!)
      if (nm !== null) {
        ms = nm
        break
      }
    }
  }
  if (ms !== null) {
    _callbacks.seekToMs(Math.max(0, ms + getSeekOffset()))
    if (!useAppState().playing.value) {
      _callbacks.playIfNotPlaying()
    }
  }
}

// ── timeupdate handler — port of updateActiveLineFromTime ──────────────────
export function updateActiveLineFromTime(posMs: number) {
  const { playingLine } = useAppState()
  const lines = getMainText().split('\n')
  let best = -1
  for (let i = 0; i < lines.length; i++) {
    const ms = tsToMs(lines[i]!)
    if (ms !== null && ms <= posMs) {
      best = i
    }
  }
  if (best === -1) {
    return
  }
  if (best === playingLine.value) {
    return
  }
  const playingHasTs = playingLine.value >= 0 && tsToMs(lines[playingLine.value]!) !== null
  if (!playingHasTs && playingLine.value > best) {
    return
  }
  playingLine.value = best
  renderMainLines()
  scrollToPlaying()
  _callbacks.syncSecScroll()
  _announce('Playing line ' + (best + 1) + ': ' + _stripTsPrefix(lines[best]!).trim())
}

// ── Main textarea @input handler ───────────────────────────────────────────
// The monolith's input handler runs renderMainLines + checkLineCounts +
// updateMergeBtn + updateTitleFromText + doAutosave, then (if typing mode
// and not a paste) debounces a snapshot push. Tranche 5 owns renderMainLines
// + doAutosave + checkLineCounts + updateMergeBtn + updateTitleFromText via
// the App.vue wired setMainText chain (the simpler path: the textarea's
// @input just sets mainText.value, and a watcher in App.vue runs the
// side-effect chain). The undo debounce timer is owned by useUndoRedo.
//
// Two-way binding caveat: Vue's v-model on a textarea handles the input →
// ref sync automatically. But we DON'T want v-model because the side-effect
// chain (renderMainLines etc.) should only run when the user types, not when
// programmatic code sets mainText.value. So we use :value + @input, and the
// @input handler sets mainText.value + runs the side-effects + schedules the
// undo debouncer (unless a paste just happened — paste has its own push).
export function onMainInput(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  const { mainText, hotkeyMode, pasteJustHappened } = useAppState()
  mainText.value = ta.value
  // Side-effects: renderMainLines (cheap — re-renders the list), then
  // checkLineCounts + updateMergeBtn + updateTitleFromText + doAutosave.
  renderMainLines()
  _callbacks.checkLineCounts()
  _callbacks.updateMergeBtn()
  _callbacks.updateTitleFromText()
  _callbacks.doAutosave()
  // Undo debounce — only in typing mode + only if a paste didn't just happen
  // (paste pushes its own snapshot via setMainText).
  if (!hotkeyMode.value) {
    if (pasteJustHappened.value) {
      pasteJustHappened.value = false
      return
    }
    // The actual debounce timer is owned by useUndoRedo — App.vue wires
    // this handler to call scheduleInputSnapshot. To keep the composable
    // decoupled from useUndoRedo, we expose an onInputCallback slot that
    // App.vue can override. Default: no-op.
    _onInputCallback()
  }
}

// Hook for App.vue to wire the undo debounce without useSync depending on
// useUndoRedo (avoids a circular import).
let _onInputCallback: () => void = () => {}
export function setOnInputCallback(cb: () => void) {
  _onInputCallback = cb
}

// ── Main textarea @paste handler (typing mode) ─────────────────────────────
// Port of the monolith's main-textarea paste handler. Hotkey-mode paste
// goes to #main-lines (onMainLinesPaste below) — it always overwrites.
// Typing-mode paste inserts at the caret + runs the input chain + pushes
// a snapshot.
export function onMainPaste(e: ClipboardEvent) {
  const { hotkeyMode, pasteJustHappened } = useAppState()
  if (hotkeyMode.value) {
    return // typing-mode-only handler
  }
  e.preventDefault()
  const raw = e.clipboardData?.getData('text/plain') || ''
  if (!raw) {
    return
  }
  if (raw.split('\n').length > MAX_LINES) {
    alert(`Paste exceeds ${MAX_LINES} line limit.`)
    return
  }
  const geniusCleaned = cleanGenius(raw)
  // If pasted content has metadata fields, treat like an lrc import (merge + overwrite)
  const hasMeta = !geniusCleaned && raw.split('\n').some((l) => META_RE.test(l))
  if (hasMeta) {
    const normalized = normalizeLrcTimestamps(raw)
    let mergedMeta = mergeLrcMeta(normalized, useAppState().cfg.value.default_meta)
    let lines = normalized.split('\n').filter((l) => !META_RE.test(l))
    let text = mergedMeta + '\n' + lines.join('\n').trim()
    if ((document.getElementById('main-split-check') as HTMLInputElement | null)?.checked) {
      text = batchSplitParens(text)
    }
    pasteJustHappened.value = true
    _callbacks.setMainText(text)
    const ta = _refs.current?.mainTextarea.value
    if (ta) {
      ta.setSelectionRange(text.length, text.length)
      // Trigger an input event so the textarea's :value syncs to mainText
      // (setMainText already wrote mainText, but the textarea's own value
      // was set by the user's paste action — re-sync from mainText).
      ta.value = text
    }
    return
  }
  const cleaned = geniusCleaned || cleanPaste(raw, 'paste')
  const ta = e.target as HTMLTextAreaElement
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const v = ta.value
  const strippedCleaned = cleaned.split('\n').map((l) => l.trimEnd()).join('\n')
  const finalCleaned = (document.getElementById('main-split-check') as HTMLInputElement | null)?.checked
    ? batchSplitParens(strippedCleaned)
    : strippedCleaned
  pasteJustHappened.value = true
  const newVal = v.slice(0, start) + finalCleaned + v.slice(end)
  ta.value = newVal
  ta.setSelectionRange(start + finalCleaned.length, start + finalCleaned.length)
  // Run the side-effect chain + push a snapshot via setMainText
  _callbacks.setMainText(newVal)
  if (geniusCleaned) {
    // markGeniusSource + extractGeniusMeta — Tranche 6 owns these (they
    // write to secondary fields + the [re:] tag). For now, no-op.
  }
}

// Non-Genius hotkey-mode paste: merge meta if present, replace lyrics.
// Extracted from onMainLinesPaste to reduce its cognitive complexity.
function _onMainLinesPasteNonGenius(raw: string, cfg: { default_meta: string }) {
  const { activeLine } = useAppState()
  const normalized = normalizeLrcTimestamps(raw)
  const hasMeta = normalized.split('\n').some((l) => META_RE.test(l))
  let mergedMeta: string
  if (hasMeta) {
    mergedMeta = mergeLrcMeta(normalized, cfg.default_meta)
  } else {
    // Preserve the current meta block exactly (including trailing blank separator)
    const taLines = getMainText().split('\n')
    const lmi = findLastMetaIdx(taLines)
    mergedMeta = lmi >= 0 ? taLines.slice(0, lmi + 1).join('\n') : cfg.default_meta.trimEnd()
  }
  const lines = normalized.split('\n').filter((l) => !META_RE.test(l))
  let text = (mergedMeta ? mergedMeta.trimEnd() + '\n\n' : '') + lines.join('\n').trim()
  // Rebuild with default meta block if nothing meaningful survived
  if (!mergedMeta) {
    text = cfg.default_meta.trimEnd() + '\n\n' + lines.join('\n').trim()
  }
  if ((document.getElementById('main-split-check') as HTMLInputElement | null)?.checked) {
    text = batchSplitParens(text)
  }
  _callbacks.setMainText(text)
  activeLine.value = -1
  const ls = getMainText().split('\n')
  for (let i = 0; i < ls.length; i++) {
    if (!META_RE.test(ls[i]!) && ls[i]!.trim() !== '') {
      activeLine.value = i
      break
    }
  }
  renderMainLines()
  scrollToActive()
}

// Genius hotkey-mode paste: overwrite lyrics, preserve existing meta.
// Extracted from onMainLinesPaste to reduce its cognitive complexity.
function _onMainLinesPasteGenius(geniusCleaned: string, cfg: { default_meta: string }) {
  const { activeLine } = useAppState()
  const cleanedTrimmed = geniusCleaned.split('\n').map((l) => l.trimEnd()).join('\n')
  const finalTrimmed = (document.getElementById('main-split-check') as HTMLInputElement | null)?.checked
    ? batchSplitParens(cleanedTrimmed)
    : cleanedTrimmed
  const taLines = getMainText().split('\n')
  const lmi = findLastMetaIdx(taLines)
  const existingMeta = lmi >= 0 ? taLines.slice(0, lmi + 1).join('\n') : cfg.default_meta.trimEnd()
  _callbacks.setMainText((existingMeta ? existingMeta.trimEnd() + '\n\n' : '') + finalTrimmed.trimStart())
  // markGeniusSource + extractGeniusMeta — Tranche 6 owns these
  if (activeLine.value < 0) {
    const lines = getMainText().split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (!META_RE.test(lines[i]!) && lines[i]!.trim() !== '') {
        activeLine.value = i
        renderMainLines()
        scrollToActive()
        break
      }
    }
  }
}

// ── #main-lines paste handler (hotkey mode) ────────────────────────────────
// Port of the monolith's #main-lines paste handler. Always overwrites in
// hotkey mode — use the lrc-import path (merge meta if present, replace lyrics).
// Genius paste overwrites lyrics + preserves existing meta.
export function onMainLinesPaste(e: ClipboardEvent) {
  const { hotkeyMode, cfg } = useAppState()
  if (!hotkeyMode.value) {
    return // hotkey-mode-only handler
  }
  e.preventDefault()
  const raw = e.clipboardData?.getData('text/plain') || ''
  if (!raw) {
    return
  }
  const geniusCleaned = cleanGenius(raw)
  if (!geniusCleaned) {
    _onMainLinesPasteNonGenius(raw, cfg.value)
    return
  }
  _onMainLinesPasteGenius(geniusCleaned, cfg.value)
}

// ── Exported for App.vue / EditorArea / LeftPanel ──────────────────────────
export function useSync() {
  return {
    initSync,
    setSyncCallbacks,
    setSeekOffsetRef,
    setOnInputCallback,
    renderMainLines,
    scrollToActive,
    scrollToPlaying,
    onMainLinesMouseDown,
    onMainLinesContextMenu,
    onMainInput,
    onMainPaste,
    onMainLinesPaste,
    onSeekOffsetChange,
    syncLine,
    insertEndLine,
    adjustTs,
    markAsTranslation,
    seekPrevLine,
    seekNextLine,
    replayActiveLine,
    updateActiveLineFromTime,
    tickSeekOffset,
    setOffsetMode,
    doSyncFile,
  }
}