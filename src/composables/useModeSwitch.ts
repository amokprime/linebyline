// Phase D Tranche 3 — mode switch, ported from the monolith "── Mode switching ──"
// section. The state refs (hotkeyMode, offsetSeekMode) already live in
// useAppState; this composable owns the DOM synchronization that fires when
// they change — the applyMode() function and the toggle_mode /
// offset_mode_toggle dispatch wrappers.
//
// PORT DELTAS from the monolith:
//  - The monolith's applyMode() calls rebuildHkPanel() at the end. In Vue,
//    ControlsPanel's computed modeCells/actions reactively re-render when
//    hotkeyMode.value / offsetSeekMode.value change, so no explicit call is
//    needed. The reactivity system is the rebuild.
//  - The monolith reads getTA() = document.getElementById('main-textarea').value.
//    Here the textarea is reached through a Ref<HTMLTextAreaElement | null>
//    registered by EditorArea. applyMode() no-ops if the ref isn't populated
//    yet (pre-mount, SSR, pure-node unit tests).
//  - The monolith's "Auto mode switch when secondary focused" section comment
//    claims focus/blur handlers are attached in addSecondary() — they are NOT
//    (no such handlers exist in the monolith's addSecondary body). The comment
//    is documentation drift. This composable does NOT implement an auto-switch
//    either; if a future tranche adds one, it belongs in SecondaryField.vue's
//    @focus/@blur handlers calling setHotkeyMode(false). Documented here so a
//    future session doesn't mistake the absence for a regression.
//  - renderMainLines() is passed in as a callback. Tranche 5 ports the real
//    function; until then App.vue passes a no-op. The call site is preserved
//    so Tranche 5 just swaps in the real function without re-touching this
//    composable.
//
// Singleton pattern (matches useAppState): App.vue calls initModeSwitch() once
// in setup with EditorArea's template refs. ControlsPanel and the Tranche 9
// keyboard handler import toggleMode / toggleOffsetSeek directly. vi.resetModules()
// in tests gives a fresh module each run.

import type { Ref } from 'vue'
import { META_RE } from '@/utils/lrcParser'
import { useAppState } from './useAppState'

export interface ModeSwitchRefs {
  // #main-scroll — the .lyric-scroll container around #main-lines. Toggles
  // display '' / 'none' depending on mode.
  mainScroll: Ref<HTMLElement | null>
  // #main-textarea — the raw textarea behind the rendered line list. Toggles
  // the .visible class; also read for scroll-position math and caret placement.
  mainTextarea: Ref<HTMLTextAreaElement | null>
  // #main-lines — the <ul> holding .lrc-line children. Used by the rAF
  // scrollIntoView in hotkey-mode branch.
  mainLines: Ref<HTMLElement | null>
}

// Module-level — set once by App.vue via initModeSwitch(). Stays null in pure
// unit tests that exercise toggleMode without DOM; applyMode no-ops then.
let _refs: ModeSwitchRefs | null = null
let _renderMainLines: () => void = () => {}

// Initialize the composable with EditorArea's template refs + the
// renderMainLines callback. Called once by App.vue in setup. Idempotent —
// re-init overwrites the previous binding (tests that re-mount the app
// rely on this).
export function initModeSwitch(refs: ModeSwitchRefs, renderMainLines: () => void = () => {}) {
  _refs = refs
  _renderMainLines = renderMainLines
}

// Internal — reads mainText from useAppState (Tranche 2 added this ref).
// Was: _refs?.mainTextarea.value?.value — DOM read. Now: reactive ref read.
// The textarea element ref is still needed for DOM operations (focus,
// setSelectionRange, classList, scrollHeight) but not for content access.
function getMainText(): string {
  return useAppState().mainText.value
}

// Port of the monolith applyMode(). Reads hotkeyMode.value; toggles element
// visibility, scroll position, and textarea selection. No-ops if the main
// scroll/textarea refs aren't populated (pre-mount, tests, SSR).
export function applyMode() {
  const scroll = _refs?.mainScroll.value ?? null
  const ta = _refs?.mainTextarea.value ?? null
  if (!scroll || !ta) return
  const { hotkeyMode } = useAppState()

  if (hotkeyMode.value) {
    // Hotkey mode: show the rendered line list, hide the raw textarea.
    // Capture scroll position in line units before the swap so the same
    // line stays at the top after re-render.
    const lineH = ta.scrollHeight / Math.max(1, getMainText().split('\n').length)
    const topLine = Math.round(ta.scrollTop / lineH)
    scroll.style.display = ''
    ta.classList.remove('visible')
    _renderMainLines()
    requestAnimationFrame(() => {
      const elems = _refs?.mainLines.value?.querySelectorAll('.lrc-line') ?? []
      elems[topLine]?.scrollIntoView({ block: 'start' })
    })
  } else {
    // Typing mode: hide the rendered list, show the raw textarea, place the
    // caret at the first non-meta non-blank line, preserve scroll ratio.
    const text = getMainText()
    const taLines = text.split('\n')
    let firstLyricChar = text.length
    let charCount = 0
    for (let i = 0; i < taLines.length; i++) {
      if (META_RE.test(taLines[i]!) || taLines[i]!.trim() === '') {
        charCount += taLines[i]!.length + 1
        continue
      }
      firstLyricChar = charCount
      break
    }
    const scrollH = scroll.scrollHeight - scroll.clientHeight
    const ratio = scrollH > 0 ? scroll.scrollTop / scrollH : 0
    scroll.style.display = 'none'
    ta.classList.add('visible')
    // Double rAF — the monolith's pattern. The first rAF lets the browser
    // apply the display:none / .visible class change; the second ensures
    // layout is settled before setSelectionRange + focus. setSelectionRange
    // on a hidden textarea is a no-op on some browsers, hence the wait.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ta.setSelectionRange(firstLyricChar, firstLyricChar)
      if (ratio > 0.01) {
        const taH = ta.scrollHeight - ta.clientHeight
        ta.scrollTop = ratio * taH
      } else {
        ta.scrollTop = 0
      }
      ta.focus()
    }))
  }
  // Monolith calls rebuildHkPanel() here — Vue's reactivity re-renders
  // ControlsPanel automatically when hotkeyMode/offsetSeekMode change.
}

// Toggle hotkeyMode and apply. Bound to the toggle_mode hotkey (Tranche 9
// keyboard handler) and the ControlsPanel mode cell @activate.
export function toggleMode() {
  const { hotkeyMode } = useAppState()
  hotkeyMode.value = !hotkeyMode.value
  applyMode()
}

// Toggle offsetSeekMode. Bound to the offset_mode_toggle hotkey and the
// ControlsPanel offset cell @activate. No applyMode — offset seek is
// orthogonal to which view (rendered list vs raw textarea) is shown; it
// only changes how the ts-adjust hotkeys behave (Phase D Tranche 5 wires
// that dispatch).
export function toggleOffsetSeek() {
  const { offsetSeekMode } = useAppState()
  offsetSeekMode.value = !offsetSeekMode.value
}

// Direct setters — for use by settings reset (Tranche 8) and any future
// feature that needs to force a specific mode (e.g. the aspirational
// secondary-focus auto-switch; see port-delta note above).
export function setHotkeyMode(v: boolean) {
  const { hotkeyMode } = useAppState()
  if (hotkeyMode.value !== v) {
    hotkeyMode.value = v
    applyMode()
  }
}

export function setOffsetSeekMode(v: boolean) {
  const { offsetSeekMode } = useAppState()
  offsetSeekMode.value = v
}
