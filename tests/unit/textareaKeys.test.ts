// @vitest-environment happy-dom
// Tests for useTextareaKeys — Phase D Tranche 9.
// Verifies the main textarea keydown behavior: Enter trim, bracket/paren
// autocomplete (typing-mode only).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

// Mock useSync so useTextareaKeys's fireInput doesn't try to call the real
// onMainInput (which needs the full EditorArea wiring). The mock must be
// hoisted to the top level.
vi.mock('@/composables/useSync', () => ({
  onMainInput: vi.fn(),
  setOnInputCallback: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
afterEach(() => {
  document.body.innerHTML = ''
})

async function freshSetup(initialText: string = '', hotkeyMode = false) {
  const appState = await import('@/composables/useAppState')
  const textareaKeys = await import('@/composables/useTextareaKeys')
  const { hotkeyMode: hm } = appState.useAppState()
  hm.value = hotkeyMode

  // Mount a textarea bound to the composable's onMainKeydown.
  const Provider = defineComponent({
    setup() {
      const { provideCfg } = appState
      provideCfg()
      return () =>
        h('div', [
          h('textarea', {
            id: 'main-textarea',
            onKeydown: (e: KeyboardEvent) => textareaKeys.onMainKeydown(e),
          }),
        ])
    },
  })
  const wrapper = mount(Provider, { attachTo: document.body })
  const ta = document.getElementById('main-textarea') as HTMLTextAreaElement
  ta.value = initialText
  return { ta, wrapper, hotkeyMode: hm, textareaKeys }
}

describe('useTextareaKeys — Enter trim', () => {
  it('trims trailing whitespace on Enter in typing mode', async () => {
    const { ta } = await freshSetup('line1   \nline2', false)
    ta.focus()
    // Caret at position 8 = after "line1   " (just before the existing newline).
    // Pressing Enter inserts a new \n at the caret position; the trim removes
    // the trailing whitespace first. Result: "line1\n\nline2" — the trimmed
    // "line1", the new Enter newline, and the original "line2".
    ta.setSelectionRange(8, 8)
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
    ta.dispatchEvent(e)
    expect(pd).toHaveBeenCalled()
    expect(ta.value).toBe('line1\n\nline2')
  })

  it('does nothing if line has no trailing whitespace', async () => {
    const { ta } = await freshSetup('line1\nline2', false)
    ta.focus()
    ta.setSelectionRange(5, 5) // caret at end of "line1"
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('line1\nline2')
  })

  it('does nothing in hotkey mode (textarea is hidden + handler skips)', async () => {
    const { ta } = await freshSetup('line1   \nline2', true)
    ta.focus()
    ta.setSelectionRange(6, 6)
    const e = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('line1   \nline2') // unchanged
  })
})

describe('useTextareaKeys — bracket/paren autocomplete', () => {
  it('inserts [] and places caret between when [ pressed (typing mode)', async () => {
    const { ta } = await freshSetup('hello', false)
    ta.focus()
    ta.setSelectionRange(0, 0)
    const e = new KeyboardEvent('keydown', { key: '[', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('[]hello')
    expect(ta.selectionStart).toBe(1)
  })

  it('wraps selection in [...] when [ pressed with selection', async () => {
    const { ta } = await freshSetup('hello', false)
    ta.focus()
    ta.setSelectionRange(1, 4) // "ell"
    const e = new KeyboardEvent('keydown', { key: '[', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('h[ell]o')
    expect(ta.selectionStart).toBe(2)
  })

  it('wraps rest of line in () when ( pressed at line start (typing mode)', async () => {
    const { ta } = await freshSetup('line1\nhello world\nline3', false)
    ta.focus()
    // Place caret at start of "hello world" (after the newline).
    const lineStartIdx = 'line1\n'.length
    ta.setSelectionRange(lineStartIdx, lineStartIdx)
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('line1\n(hello world)\nline3')
    expect(ta.selectionStart).toBe(lineStartIdx + 1)
  })

  it('inserts () at caret when ( pressed mid-line (typing mode)', async () => {
    const { ta } = await freshSetup('hello', false)
    ta.focus()
    ta.setSelectionRange(2, 2) // caret after "he"
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('he()llo')
    expect(ta.selectionStart).toBe(3)
  })

  it('does not trigger autocomplete in hotkey mode', async () => {
    const { ta } = await freshSetup('hello', true)
    ta.focus()
    ta.setSelectionRange(0, 0)
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('hello') // unchanged
  })

  it('handles ( after a timestamp prefix: wraps rest of line', async () => {
    const { ta } = await freshSetup('[00:01.00] hello world', false)
    ta.focus()
    // Place caret right after the timestamp + space (index 11).
    ta.setSelectionRange(11, 11)
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('[00:01.00] (hello world)')
  })

  it('does NOT wrap when ( is pressed mid-content (after the first char)', async () => {
    const { ta } = await freshSetup('hello world', false)
    ta.focus()
    ta.setSelectionRange(5, 5) // after "hello"
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    expect(ta.value).toBe('hello() world')
  })

  it('does NOT trigger autocomplete on a meta line (line starting with [ti:])', async () => {
    const { ta } = await freshSetup('[ti: song title]\nhello', false)
    ta.focus()
    // Place caret at the start of the meta line.
    ta.setSelectionRange(0, 0)
    const e = new KeyboardEvent('keydown', { key: '(', bubbles: true })
    ta.dispatchEvent(e)
    // The monolith's META_RE check skips the line-start wrap for meta lines.
    // ( should still insert () at caret.
    expect(ta.value).toBe('()[ti: song title]\nhello')
  })
})
