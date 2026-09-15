// Phase D Tranche 9 — main textarea keydown handlers, ported from the monolith
// "── Keyboard → Main textarea KD ──" section. Owns:
//  - Enter trim trailing whitespace on the current line (typing-mode only)
//  - Bracket/paren autocomplete:
//    * `(` with a selection → wrap selection with `(...)`
//    * `(` at line start (after a timestamp prefix) → wrap rest of line in `()`
//    * `(` elsewhere → insert `()` and place caret between
//    * `[` with a selection → wrap selection with `[...]`
//    * `[` elsewhere → insert `[]` and place caret between
//
// PORT DELTAS from the monolith:
//  - The monolith attaches `document.getElementById('main-textarea').addEventListener
//    ('keydown', e => ...)`. Vue attaches via EditorArea's template `@keydown`.
//    This composable exports `onMainKeydown(e)` for the template binding.
//  - State reads come from useAppState (hotkeyMode ref). The monolith reads the
//    module-level `hotkeyMode` flag directly.
//  - The textarea's input event dispatch (the monolith's `ta.dispatchEvent(new
//    Event('input'))`) is replaced by directly calling the @input callback that
//    App.vue wires via setOnInputCallback (useSync). This avoids a synthetic
//    event round-trip and keeps the undo debounce timer in sync.
//
// Quirk pinned: only fires in typing mode (the monolith's `!hotkeyMode` guard).
// In hotkey mode the textarea is hidden and the global handler dispatches.

import { META_RE, TS_RE } from '@/utils/lrcParser'
import { useAppState } from './useAppState'
import { setOnInputCallback } from './useSync'

// Set by App.vue (or by useSync via setOnInputCallback). Called whenever the
// textarea's value is programmatically changed by these handlers — the
// monolith's `ta.dispatchEvent(new Event('input'))` becomes a direct call.
let _onProgrammaticInput: (() => void) | null = null

export function setProgrammaticInputCb(cb: (() => void) | null) {
  _onProgrammaticInput = cb
}

function fireInput(ta: HTMLTextAreaElement) {
  // The monolith dispatches a synthetic input event so the existing input
  // handler (which debounces undo snapshots) fires. Vue-side, we mirror that:
  // - First, run the @input handler directly (useSync.onMainInput) so the
  //   mainText ref + side-effect chain updates.
  // - Then call the optional programmatic-input callback so App.vue's undo
  //   debounce can schedule a snapshot push.
  // The dispatch path matches the monolith's `ta.dispatchEvent(new Event('input'))`.
  const event = new Event('input', { bubbles: true })
  ta.dispatchEvent(event)
  // The dispatched event reaches useSync.onMainInput (template-bound @input).
  // The programmatic-input callback is for App.vue's undo debounce (which
  // useSync's setOnInputCallback already wires to scheduleInputSnapshot).
  if (_onProgrammaticInput) _onProgrammaticInput()
}

// Trim trailing whitespace from the current line + insert newline. Only fires
// when the line had trailing whitespace to trim.
function handleEnterTrim(e: KeyboardEvent) {
  const ta = e.target as HTMLTextAreaElement
  const pos = ta.selectionStart
  const v = ta.value
  const lineStart = v.lastIndexOf('\n', pos - 1) + 1
  const curLine = v.slice(lineStart, pos)
  const trimmed = curLine.trimEnd()
  if (trimmed.length < curLine.length) {
    e.preventDefault()
    ta.value = v.slice(0, lineStart) + trimmed + '\n' + v.slice(pos)
    ta.setSelectionRange(lineStart + trimmed.length + 1, lineStart + trimmed.length + 1)
    fireInput(ta)
  }
}

// Wrap the current selection with `openKey` + `close`.
function wrapSelectionWith(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
  openKey: string,
  close: string,
) {
  const v = ta.value
  ta.value = v.slice(0, start) + openKey + v.slice(start, end) + close + v.slice(end)
  ta.setSelectionRange(start + 1, end + 1)
  fireInput(ta)
}

// Returns true if the "(" was handled as a line-start wrap (rest of line wrapped
// in parens). The monolith's _handleParenAtLineStart.
function handleParenAtLineStart(ta: HTMLTextAreaElement, start: number): boolean {
  const v = ta.value
  const lineStart = v.lastIndexOf('\n', start - 1) + 1
  const lineEnd = v.indexOf('\n', start)
  const lineText = v.slice(lineStart, lineEnd < 0 ? v.length : lineEnd)
  const posInContent = start - (lineStart + (TS_RE.test(lineText) ? 11 : 0))
  if (posInContent > 0 || META_RE.test(lineText)) return false
  const restEnd = lineEnd < 0 ? v.length : lineEnd
  const rest = v.slice(start, restEnd).trimEnd()
  ta.value = v.slice(0, start) + '(' + rest + ')' + (lineEnd < 0 ? '' : v.slice(lineEnd))
  ta.setSelectionRange(start + 1, start + 1)
  fireInput(ta)
  return true
}

// Bracket/paren autocomplete for `(` and `[`.
function handleParenBracket(e: KeyboardEvent) {
  const close = e.key === '(' ? ')' : ']'
  const ta = e.target as HTMLTextAreaElement
  const start = ta.selectionStart
  const end = ta.selectionEnd
  if (start !== end) {
    e.preventDefault()
    wrapSelectionWith(ta, start, end, e.key, close)
    return
  }
  if (e.key === '(') {
    e.preventDefault()
    if (handleParenAtLineStart(ta, start)) return
  } else {
    e.preventDefault()
  }
  const v = ta.value
  ta.value = v.slice(0, start) + e.key + close + v.slice(end)
  ta.setSelectionRange(start + 1, start + 1)
  fireInput(ta)
}

// Main textarea keydown. EditorArea binds `@keydown="onMainKeydown"`.
export function onMainKeydown(e: KeyboardEvent) {
  const { hotkeyMode } = useAppState()
  if (hotkeyMode.value) return
  if (e.key === 'Enter') handleEnterTrim(e)
  if (e.key === '(' || e.key === '[') handleParenBracket(e)
}

// Convenience export.
export function useTextareaKeys() {
  return {
    onMainKeydown,
    setProgrammaticInputCb,
  }
}

// Wire the programmatic-input callback to useSync's setOnInputCallback path.
// App.vue owns the actual undo-debounce wiring (useUndoRedo.scheduleInputSnapshot);
// this module just exposes the setter so App.vue can register it. The wire is
// intentionally lazy so the import graph stays acyclic (useTextareaKeys imports
// useSync; useSync doesn't import useTextareaKeys).
export function wireProgrammaticInput() {
  setOnInputCallback(() => {
    // No-op here — useSync's onMainInput will fire on the dispatched event,
    // and that handler already calls the App-wired scheduleInputSnapshot.
  })
}
