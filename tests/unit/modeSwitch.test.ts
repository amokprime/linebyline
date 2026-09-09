// @vitest-environment happy-dom
// Pins the Phase D Tranche 3 useModeSwitch composable:
//  - toggleMode flips hotkeyMode and runs applyMode
//  - toggleOffsetSeek flips offsetSeekMode (no applyMode — orthogonal axis)
//  - applyMode no-ops gracefully when refs are unbound (pre-init / pure tests)
//  - applyMode in hotkey mode: hides textarea (.visible removed), shows scroll,
//    calls renderMainLines, schedules rAF scrollIntoView
//  - applyMode in typing mode: hides scroll, shows textarea (.visible added),
//    double-rAF places caret at first non-meta non-blank line + focuses
//  - setHotkeyMode is idempotent (no applyMode when value unchanged)
//  - setOffsetSeekMode sets directly (no applyMode)
//
// The rAF double-tap in typing mode is mocked via vi.useFakeTimers + a
// requestAnimationFrame mock that fires synchronously, so the test can assert
// the post-rAF DOM state without async waits.
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

// Build a fresh DOM with the three elements applyMode touches. Returns the
// elements + a renderMainLines spy so the test can assert it was called.
function mountDom(textareaValue = '[ti:Song]\n[ar:Artist]\nFirst lyric line\nSecond line\n') {
  document.body.innerHTML = ''
  const scroll = document.createElement('div')
  scroll.id = 'main-scroll'
  scroll.style.display = ''
  const lines = document.createElement('ul')
  lines.id = 'main-lines'
  // populate with a few .lrc-line children so scrollIntoView has a target
  for (let i = 0; i < 5; i++) {
    const li = document.createElement('li')
    li.className = 'lrc-line'
    li.textContent = `line ${i}`
    lines.appendChild(li)
  }
  const ta = document.createElement('textarea')
  ta.id = 'main-textarea'
  ta.value = textareaValue
  scroll.appendChild(lines)
  document.body.appendChild(scroll)
  document.body.appendChild(ta)
  // Tranche 2: useModeSwitch reads mainText from useAppState (not the DOM).
  // Sync the ref so applyMode sees the same text as the DOM textarea.
  // This is async (dynamic import) but tests await it at call sites.
  return { scroll, lines, ta, text: textareaValue }
}

// Sync mainText from useAppState with the test's textarea value. Tranche 2
// changed useModeSwitch to read from the reactive ref instead of the DOM.
async function syncMainText(text: string) {
  const { useAppState } = await import('@/composables/useAppState')
  useAppState().mainText.value = text
}

// Hook the rAF double-tap: vi.useFakeTimers doesn't cover rAF, so mock it
// with a synchronous flush. Each call runs the callback immediately; the
// double-rAF pattern becomes two synchronous calls.
function mockRaf() {
  const orig = globalThis.requestAnimationFrame
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0)
    return 0
  }) as typeof requestAnimationFrame
  return () => { globalThis.requestAnimationFrame = orig }
}

describe('useModeSwitch — toggleMode / toggleOffsetSeek', () => {
  it('toggleMode flips hotkeyMode and runs applyMode (hotkey→typing hides scroll, shows textarea)', async () => {
    const { scroll, ta } = mountDom()
    const restoreRaf = mockRaf()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    expect(hotkeyMode.value).toBe(true) // default

    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    mod.toggleMode()
    expect(hotkeyMode.value).toBe(false)
    // typing mode: scroll hidden, textarea visible
    expect(scroll.style.display).toBe('none')
    expect(ta.classList.contains('visible')).toBe(true)
    restoreRaf()
  })

  it('toggleOffsetSeek flips offsetSeekMode without calling applyMode (scroll/textarea unchanged)', async () => {
    const { scroll, ta } = mountDom()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { offsetSeekMode, hotkeyMode } = useAppState()
    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    const scrollDisplayBefore = scroll.style.display
    mod.toggleOffsetSeek()
    expect(offsetSeekMode.value).toBe(true)
    // hotkeyMode unchanged, view unchanged — offset seek is orthogonal
    expect(hotkeyMode.value).toBe(true)
    expect(scroll.style.display).toBe(scrollDisplayBefore)
  })
})

describe('useModeSwitch — applyMode view transitions', () => {
  it('hotkey mode: shows scroll, hides textarea, calls renderMainLines, rAF scrollIntoView', async () => {
    const { scroll, ta, lines, text } = mountDom()
    await syncMainText(text)
    const restoreRaf = mockRaf()
    const renderSpy = vi.fn()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    hotkeyMode.value = true
    ta.classList.add('visible') // pretend we were in typing mode
    scroll.style.display = 'none'

    // happy-dom has no layout — stub scrollHeight so lineH > 0 and topLine
    // resolves to 0 (the first .lrc-line). Without this, lineH = 0 and
    // topLine = NaN, so elems[NaN] is undefined and scrollIntoView is a no-op.
    Object.defineProperty(ta, 'scrollHeight', { value: 100, configurable: true })

    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: lines } as any,
      },
      renderSpy,
    )
    // Spy on the first .lrc-line's scrollIntoView (the computed topLine=0
    // target since scrollTop=0). Spying on the instance avoids relying on
    // happy-dom's Element.prototype chain.
    const firstLine = lines.querySelector('.lrc-line') as HTMLElement
    const scrollIntoViewSpy = vi.spyOn(firstLine, 'scrollIntoView')

    mod.applyMode()
    expect(scroll.style.display).toBe('')
    expect(ta.classList.contains('visible')).toBe(false)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ block: 'start' })
    restoreRaf()
  })

  it('typing mode: hides scroll, shows textarea, places caret at first lyric line, focuses', async () => {
    const text = '[ti:Song]\n[ar:Artist]\nFirst lyric line\nSecond line\n'
    const { scroll, ta, lines } = mountDom(text)
    await syncMainText(text)
    const restoreRaf = mockRaf()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    hotkeyMode.value = false

    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: lines } as any,
      },
      () => {},
    )
    const setSelectionSpy = vi.spyOn(ta, 'setSelectionRange')
    const focusSpy = vi.spyOn(ta, 'focus')
    mod.applyMode()
    expect(scroll.style.display).toBe('none')
    expect(ta.classList.contains('visible')).toBe(true)
    // firstLyricChar = length of '[ti:Song]\n' + '[ar:Artist]\n' = 10 + 12 = 22
    // (charCount accumulates line.length + 1 for the newline)
    const expectedCaret = '[ti:Song]\n[ar:Artist]\n'.length
    expect(setSelectionSpy).toHaveBeenCalledWith(expectedCaret, expectedCaret)
    expect(focusSpy).toHaveBeenCalled()
    restoreRaf()
  })

  it('typing mode caret falls back to end of text when all lines are meta/blank', async () => {
    const text = '[ti:Song]\n[ar:Artist]\n\n'
    const { scroll, ta, lines } = mountDom(text)
    await syncMainText(text)
    const restoreRaf = mockRaf()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    useAppState().hotkeyMode.value = false
    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: lines } as any,
      },
      () => {},
    )
    const setSelectionSpy = vi.spyOn(ta, 'setSelectionRange')
    mod.applyMode()
    // firstLyricChar stays at text.length (the loop never breaks)
    expect(setSelectionSpy).toHaveBeenCalledWith(text.length, text.length)
    restoreRaf()
  })

  it('applyMode is a no-op before initModeSwitch (no crash, no DOM access)', async () => {
    const mod = await import('@/composables/useModeSwitch')
    expect(() => mod.applyMode()).not.toThrow()
  })

  it('applyMode is a no-op when refs are present but elements are null (post-unmount)', async () => {
    const mod = await import('@/composables/useModeSwitch')
    mod.initModeSwitch(
      {
        mainScroll: { value: null } as any,
        mainTextarea: { value: null } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    expect(() => mod.applyMode()).not.toThrow()
  })
})

describe('useModeSwitch — direct setters', () => {
  it('setHotkeyMode applies when value differs', async () => {
    const { scroll, ta } = mountDom()
    const restoreRaf = mockRaf()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    mod.setHotkeyMode(false)
    expect(hotkeyMode.value).toBe(false)
    expect(ta.classList.contains('visible')).toBe(true)
    restoreRaf()
  })

  it('setHotkeyMode is idempotent — no applyMode when value unchanged', async () => {
    const { scroll, ta } = mountDom()
    const restoreRaf = mockRaf()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    hotkeyMode.value = true
    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    // ensure starting view matches hotkey mode (no .visible on textarea)
    ta.classList.remove('visible')
    mod.setHotkeyMode(true)
    expect(hotkeyMode.value).toBe(true)
    // textarea stays hidden — applyMode didn't run
    expect(ta.classList.contains('visible')).toBe(false)
    restoreRaf()
  })

  it('setOffsetSeekMode sets directly without applyMode', async () => {
    const { scroll, ta } = mountDom()
    const mod = await import('@/composables/useModeSwitch')
    const { useAppState } = await import('@/composables/useAppState')
    const { offsetSeekMode } = useAppState()
    mod.initModeSwitch(
      {
        mainScroll: { value: scroll } as any,
        mainTextarea: { value: ta } as any,
        mainLines: { value: null } as any,
      },
      () => {},
    )
    const scrollDisplayBefore = scroll.style.display
    mod.setOffsetSeekMode(true)
    expect(offsetSeekMode.value).toBe(true)
    expect(scroll.style.display).toBe(scrollDisplayBefore)
  })
})
