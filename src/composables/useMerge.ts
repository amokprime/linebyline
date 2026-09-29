// Phase D Tranche 6 — merge + secondary fields, ported from the monolith's
// "── Secondary fields ──" + "── Line counts / merge ──" sections. Owns:
//  - addSecondary / removeSecondary (pool management — visible flags on the
//    secondaryPool entries; the monolith kept separate pool + cols arrays)
//  - checkLineCounts / updateMergeBtn (the warning bar + merge button logic)
//  - mergeTranslations (build merged LRC with interpolated timestamps)
//  - syncScrollFrom / syncSecScroll (scroll sync across main + secondary fields)
//  - onSecInput / onSecPaste / onSecScroll / onSecKeydown / onSecFileImport
//    (SecondaryField.vue's textarea + file picker handlers)
//
// PORT DELTAS from the monolith:
//  - **secondaryPool is the single source of truth** (Tranche 1 port delta).
//    add/remove just toggle `visible` on pool entries — no separate
//    `secondaryCols` array to keep in sync (it's a computed). The monolith's
//    `secondaryPool.push(entry); secondaryCols.push(entry);` becomes
//    `secondaryPool.value.push({ visible, text, warnText, warnVisible, textareaEl })`
//    — the computed `secondaryCols` re-renders the column list automatically.
//  - **`_handleSecKeydown` stays in the Tranche 9 keyboard handler** — it
//    dispatches through `cfg.hotkeys` and `HOTKEY_ONLY` which are
//    keyboard-handler concerns. Tranche 6's SecondaryField.vue attaches the
//    handler via `@keydown` but imports it from useKeyboard (Tranche 9). For
//    now, a stub `onSecKeydown` lives here that just stops propagation on
//    navigation keys + space/enter/tab/escape (the always-block set). Tranche
//    9 will replace it with the full dispatch.
//  - **`checkLineCounts` reads `secondaryPool.value` directly** (filtering
//    visible entries) instead of the monolith's separate `secondaryCols`
//    array. The warn-bar DOM writes become reactive `:class` + `{{ }}` bindings
//    on SecondaryField.vue — the component reads `warnText` + `warnVisible`
//    from the pool entry's reactive state (added this tranche via the
//    SecondaryEntry interface augmentation in useAppState.ts).
//  - **`updateFieldBorders` is a DOM helper** that EditorArea runs in a
//    `watch` callback on `secondaryCols`. The monolith called it after every
//    add/remove; Vue's reactivity makes the watch automatic.
//  - **`mergeTranslations` uses `getMainLyricLines` + `getSecLines`** (pure
//    helpers in `lrcParser.ts`) instead of inlining the filter logic. The
//    merged-result builder `_buildMergedResult` is verbatim from the monolith.
//  - **`syncScrollFrom` is a DOM imperative** (no clean reactive equivalent
//    for scroll position). Kept as a module-level function that reads the
//    `secondaryPool` computed at call time. The `suppressScrollSync` guard is
//    shared with useAppState (Tranche 1) — same singleton semantics as the
//    monolith's module-level `let`.
//  - **`onSecInput` collapses 3+ consecutive newlines to 2** (monolith parity)
//    and writes the cleaned text back to the pool entry's `text` field. The
//    monolith wrote `le.value = fixed` directly; Vue updates the pool entry
//    and the `:value` binding re-syncs the textarea.
//  - **`onSecPaste` cleans + paren-wraps** (per the paren checkbox) and
//    inserts at the caret. Genius paste triggers `markGeniusSource` (Tranche 9
//    owns that — stub for now).
//  - **`onSecFileImport` reads `.lrc`/`.txt` files** and replaces the
//    secondary textarea content with cleaned + paren-wrapped lines.
//
// Singleton pattern (matches useSync): initMerge(callbacks) called once in
// App.vue setup. Action functions are module-level exports.

import { useAppState, MAX_SECONDARIES } from './useAppState'
import {
  META_RE,
  allLyricLinesHaveTs,
  collapseBlanks,
  getMainLyricLines,
  getSecLines,
  hasTrailingTimestamp,
  isEndTs,
  isHeader,
  msToTs,
  stripSecLine,
  tsToMs,
} from '@/utils/lrcParser'
import { cleanGenius } from '@/utils/geniusExtractor'

// ── Callbacks (set by initMerge) ────────────────────────────────────────────
export interface MergeCallbacks {
  // Owned by App.vue — the setMainText side-effect chain (Tranche 5).
  setMainText: (t: string) => void
  getMainText: () => string
  doAutosave: () => void
  // Undo — App.vue wires to useUndoRedo.pushSnapshot / scheduleInputSnapshot.
  pushSnapshot: () => void
  scheduleSecInputSnapshot: () => void
  // Genius paste — Tranche 9 owns markGeniusSource (writes to [re:] tag).
  markGeniusSource: () => void
}

const _callbacks: MergeCallbacks = {
  setMainText: () => {},
  getMainText: () => '',
  doAutosave: () => {},
  pushSnapshot: () => {},
  scheduleSecInputSnapshot: () => {},
  markGeniusSource: () => {},
}

export function initMerge(callbacks: Partial<MergeCallbacks> = {}) {
  Object.assign(_callbacks, callbacks)
}

export function setMergeCallbacks(callbacks: Partial<MergeCallbacks>) {
  Object.assign(_callbacks, callbacks)
}

// ── Add / remove secondary fields ───────────────────────────────────────────
export function addSecondary(): boolean {
  const { secondaryPool } = useAppState()
  if (secondaryPool.value.filter((e) => e.visible).length >= MAX_SECONDARIES) {
    alert(`Maximum of ${MAX_SECONDARIES} secondary fields reached.`)
    return false
  }
  // Reuse a hidden pool entry if available (the monolith's "pool reuse" path).
  const hidden = secondaryPool.value.find((e) => !e.visible)
  if (hidden) {
    hidden.visible = true
    checkLineCounts()
    updateMergeBtn()
    return true
  }
  // Otherwise push a new entry. The pool index + 1 becomes the column label
  // (Secondary 1, Secondary 2, …) — matching the monolith's `idx = pool.length + 1`.
  // The label is derived from the pool position at render time (SecondaryField.vue
  // uses `:index` prop = pool position + 1) — no need to store it on the entry.
  secondaryPool.value.push({
    visible: true,
    text: '',
    warnText: '',
    warnVisible: false,
    textareaEl: null,
  })
  checkLineCounts()
  updateMergeBtn()
  return true
}

export function removeSecondary(): boolean {
  const { secondaryPool } = useAppState()
  // Find the last visible entry and hide it (pool entry stays for reuse).
  for (let i = secondaryPool.value.length - 1; i >= 0; i--) {
    if (secondaryPool.value[i]!.visible) {
      secondaryPool.value[i]!.visible = false
      checkLineCounts()
      updateMergeBtn()
      return true
    }
  }
  return false
}

// ── Line counts / merge button ──────────────────────────────────────────────
// Port of the monolith checkLineCounts(). Updates the warn-bar text + visible
// flag on each visible secondary field, plus the main warn bar (the #main-warn
// element owned by EditorArea). The merge button enable state is updated via
// updateMergeBtn() (separate function — the monolith calls both in tandem).
export function checkLineCounts() {
  const { secondaryPool, mergeDone } = useAppState()
  const mainText = _callbacks.getMainText()
  const mainLines = mainText.split('\n')
  const n = getMainLyricLines(mainLines).length
  const hasTs = mainLines.some((l) => tsToMs(l) !== null)
  const missingTrailing = hasTs && !hasTrailingTimestamp(mainLines)
  const partialTs = hasTs && !allLyricLinesHaveTs(mainLines)

  // Merge done + no secondaries → reset mergeDone (the monolith's guard).
  if (secondaryPool.value.filter((e) => e.visible).length === 0 && mergeDone.value) {
    mergeDone.value = false
  }

  // Update each visible secondary field's warn bar.
  for (const entry of secondaryPool.value.filter((e) => e.visible)) {
    const sn = getSecLines(entry.text).length
    if (sn && sn !== n) {
      entry.warnText = `\u26a0 Line count mismatch (${sn} vs ${n})`
      entry.warnVisible = true
    } else if (missingTrailing) {
      entry.warnText = '\u26a0 Missing trailing timestamp in Main'
      entry.warnVisible = true
    } else if (partialTs) {
      entry.warnText = '\u26a0 Not all main lines have timestamps yet'
      entry.warnVisible = true
    } else {
      entry.warnVisible = false
      entry.warnText = ''
    }
  }

  // Main warn bar — EditorArea owns the #main-warn element. The reactive
  // binding reads from useAppState's mainWarnText + mainWarnVisible refs
  // (added this tranche).
  const { mainWarnText, mainWarnVisible } = useAppState()
  if (missingTrailing) {
    mainWarnText.value = '\u26a0 Missing trailing timestamp'
    mainWarnVisible.value = true
  } else {
    mainWarnText.value = ''
    mainWarnVisible.value = false
  }

  // Field borders — the monolith's _updateFieldBorders. EditorArea's watch
  // on secondaryCols handles this reactively (the last visible column gets
  // borderRight: none). No imperative DOM write needed here.
}

// Port of the monolith updateMergeBtn(). Computes the merge button's disabled
// state from the current state. The MenuBar's Merge fields button binds
// `:disabled` to the `mergeBtnDisabled` computed (added this tranche to
// useAppState — actually a computed exported from useMerge).
export function computeMergeBtnDisabled(): boolean {
  const { secondaryPool, mergeDone } = useAppState()
  if (mergeDone.value) {
    return true
  }
  const mainText = _callbacks.getMainText()
  const mainLines = mainText.split('\n')
  const hasTs = mainLines.some((l) => tsToMs(l) !== null && !isEndTs(l))
  const hasTrailing = hasTrailingTimestamp(mainLines)
  const ok = hasTs && hasTrailing && allLyricLinesHaveTs(mainLines) &&
    secondaryPool.value.some((e) => e.visible && getSecLines(e.text).length > 0) &&
    secondaryPool.value.filter((e) => e.visible).every((e) => {
      const sn = getSecLines(e.text).length
      const n = getMainLyricLines(mainLines).length
      return sn === 0 || sn === n
    })
  return !ok
}

// Port of the monolith _buildMergedResult + mergeTranslations. Builds the
// merged LRC by inserting secondary-field lines after their corresponding
// main-field timestamped line, with interpolated timestamps (10ms before the
// next anchor). Verbatim from the monolith body.
export function mergeTranslations(): boolean {
  const { secondaryPool, mergeDone } = useAppState()
  const mainText = _callbacks.getMainText()
  const mainLines = mainText.split('\n')
  const tsLines = mainLines
    .map((l, i): [number, number | null] => [i, tsToMs(l)])
    .filter((pair): pair is [number, number] => pair[1] !== null)
  if (!tsLines.length) {
    alert('No timestamps in main field.')
    return false
  }
  if (!allLyricLinesHaveTs(mainLines)) {
    alert('Not all main lyric lines have timestamps. Finish syncing before merging.')
    return false
  }
  const secData = secondaryPool.value
    .filter((e) => e.visible)
    .map((e) => ({ lines: getSecLines(e.text) }))
    .filter((d) => d.lines.length > 0)
  if (!secData.length) {
    return false
  }
  const n = getMainLyricLines(mainLines).length
  if (secData.some((d) => d.lines.length > 0 && d.lines.length !== n)) {
    alert('Line count mismatch between main and secondary fields. Fix counts before merging.')
    return false
  }
  const lastLine = mainLines[tsLines.at(-1)![0]]!
  if (!isEndTs(lastLine)) {
    alert('No trailing end timestamp found. Add an end timestamp to the last lyric line before merging.')
    return false
  }
  const contentTs = tsLines.filter(([i]) => !isEndTs(mainLines[i]!))
  const result = _buildMergedResult(mainLines, tsLines, contentTs, secData)
  mergeDone.value = true
  _callbacks.setMainText(result.join('\n'))
  return true
}

// Verbatim from the monolith body. Inserts secondary lines after each content
// timestamp, with interpolated timestamps counting back from the next anchor.
function _buildMergedResult(
  mainLines: string[],
  tsLines: [number, number][],
  contentTs: [number, number][],
  secData: { lines: string[] }[],
): string[] {
  const result = [...mainLines]
  for (let ci = contentTs.length - 1; ci >= 0; ci--) {
    const [lineIdx] = contentTs[ci]!
    let nextMs: number | null = null
    for (const [i, ms] of tsLines) {
      if (i > lineIdx) {
        nextMs = ms
        break
      }
    }
    if (nextMs === null) {
      continue
    }
    const ins: string[] = []
    secData.forEach(({ lines }) => {
      if (ci < lines.length) {
        ins.push(lines[ci]!)
      }
    })
    const n = ins.length
    result.splice(lineIdx + 1, 0, ...ins.map((t, j) => `${msToTs(nextMs! - (n - j) * 10)} ${t}`))
  }
  return result
}

// ── Scroll sync ─────────────────────────────────────────────────────────────
// Port of the monolith syncScrollFrom + syncSecScroll. Reads the source
// element's scroll ratio and applies it to all other scrollable fields
// (main-scroll + visible secondary textareas). The `suppressScrollSync` guard
// prevents infinite loops (the programmatic scroll would re-fire the event).
export function syncScrollFrom(src: HTMLElement) {
  const { suppressScrollSync, secondaryPool } = useAppState()
  if (suppressScrollSync.value) {
    return
  }
  suppressScrollSync.value = true
  const h = src.scrollHeight - src.clientHeight
  const ratio = h > 0 ? src.scrollTop / h : 0
  // Targets: #main-scroll (unless src IS main-scroll) + visible secondary textareas.
  const targets: HTMLElement[] = []
  const mainScroll = document.getElementById('main-scroll')
  if (mainScroll && mainScroll !== src) {
    targets.push(mainScroll)
  }
  for (const e of secondaryPool.value.filter((e) => e.visible)) {
    if (e.textareaEl && e.textareaEl !== src) {
      targets.push(e.textareaEl)
    }
  }
  for (const el of targets) {
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
  }
  suppressScrollSync.value = false
}

export function syncSecScroll() {
  const mainScroll = document.getElementById('main-scroll')
  if (mainScroll) {
    syncScrollFrom(mainScroll)
  }
}

// ── Secondary textarea handlers ────────────────────────────────────────────
// Port of the monolith's secondary textarea input handler. Collapses 3+
// consecutive newlines to 2, writes the cleaned text back to the pool entry,
// then runs checkLineCounts + updateMergeBtn + schedules an undo snapshot.
export function onSecInput(idx: number, e: Event) {
  const ta = e.target as HTMLTextAreaElement
  const { secondaryPool } = useAppState()
  const entry = secondaryPool.value[idx]
  if (!entry) {
    return
  }
  let v = ta.value
  const fixed = v.replace(/\n{3,}/g, '\n\n')
  if (fixed !== v) {
    const pos = ta.selectionStart
    ta.value = fixed
    ta.setSelectionRange(pos, pos)
    v = fixed
  }
  entry.text = v
  checkLineCounts()
  updateMergeBtn()
  _callbacks.scheduleSecInputSnapshot()
}

// Port of the monolith's secondary textarea paste handler. Cleans the
// clipboard (Genius-aware), strips meta + headers, collapses blanks, optionally
// paren-wraps, inserts at the caret, and pushes a snapshot.
export function onSecPaste(idx: number, e: ClipboardEvent, parenChecked: boolean) {
  const { secondaryPool } = useAppState()
  const entry = secondaryPool.value[idx]
  if (!entry) {
    return
  }
  const ta = e.target as HTMLTextAreaElement
  e.preventDefault()
  const raw = e.clipboardData?.getData('text/plain') || ''
  if (!raw) {
    return
  }
  const geniusCleaned = cleanGenius(raw)
  const text = geniusCleaned || raw
  if (geniusCleaned) {
    _callbacks.markGeniusSource()
  }
  let lines = text.split('\n')
  lines = lines.map((l) => stripSecLine(l)).filter((l) => !META_RE.test(l) && !isHeader(l))
  const collapsed = collapseBlanks(lines)
  const toInsert = parenChecked
    ? collapsed.map((l) => {
        const t = l.trim()
        return t && !t.startsWith('(') ? '(' + t + ')' : l
      })
    : collapsed
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const v = ta.value
  const newText = v.slice(0, start) + toInsert.join('\n') + v.slice(end)
  ta.value = newText
  ta.setSelectionRange(start + toInsert.join('\n').length, start + toInsert.join('\n').length)
  entry.text = newText
  checkLineCounts()
  updateMergeBtn()
  _callbacks.pushSnapshot()
}

// Stub for the Tranche 9 keyboard handler's secondary textarea keydown guard.
// Stops propagation on navigation keys + space/enter/tab/escape (the
// always-block set). Tranche 9 will replace this with the full dispatch that
// also blocks HOTKEY_ONLY actions + cfg.hotkeys entries.
export function onSecKeydown(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
    e.stopPropagation()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'A') {
    e.stopPropagation()
    return
  }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
    e.stopPropagation()
    return
  }
  if ([' ', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
    e.stopPropagation()
  }
}

// Per-field file picker handler. Reads the .lrc/.txt file, strips meta +
// headers, collapses blanks, paren-wraps per the checkbox, replaces the
// textarea content, and pushes a snapshot.
export function onSecFileImport(idx: number, file: File, parenChecked: boolean) {
  const { secondaryPool } = useAppState()
  const entry = secondaryPool.value[idx]
  if (!entry) {
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    const result = (ev.target?.result as string) || ''
    let lines = result.split('\n')
    lines = lines.map((l) => stripSecLine(l)).filter((l) => !META_RE.test(l) && !isHeader(l))
    const collapsed = collapseBlanks(lines)
    const withParens = parenChecked
      ? collapsed.map((l) => {
          const t = l.trim()
          return t && !t.startsWith('(') ? '(' + t + ')' : l
        })
      : collapsed
    const newText = withParens.join('\n').trim()
    entry.text = newText
    if (entry.textareaEl) {
      entry.textareaEl.value = newText
    }
    checkLineCounts()
    updateMergeBtn()
    _callbacks.pushSnapshot()
  }
  reader.readAsText(file, 'utf-8')
}

// Convenience wrapper for the merge button disabled state — MenuBar reads this
// reactively via a computed. Re-computes on every state change (secondaryPool
// text, mainText, mergeDone).
export function useMerge() {
  const { secondaryPool, mergeDone } = useAppState()
  return {
    initMerge,
    setMergeCallbacks,
    addSecondary,
    removeSecondary,
    checkLineCounts,
    updateMergeBtn,
    mergeTranslations,
    syncScrollFrom,
    syncSecScroll,
    onSecInput,
    onSecPaste,
    onSecKeydown,
    onSecFileImport,
    // Reactive state for the MenuBar's disabled bindings
    secondaryPool,
    mergeDone,
  }
}

// Helper kept for parity with the monolith's `updateMergeBtn()` name (called
// in tandem with checkLineCounts). The actual disabled state is computed via
// `computeMergeBtnDisabled()`; this function is a no-op placeholder that
// exists so the call sites in useSync's setMainText chain don't need to
// change when the real reactive computed is wired. MenuBar reads the computed
// directly — this is kept for the callback interface.
export function updateMergeBtn() {
  // No-op — the MenuBar's `:disabled` binding reads `computeMergeBtnDisabled()`
  // reactively. This function exists so App.vue's callback chain (which calls
  // `updateMergeBtn()` after every setMainText) doesn't need to know that the
  // implementation is now reactive. The monolith's imperative DOM write is
  // replaced by Vue's reactivity.
}