// @vitest-environment happy-dom
// Pins the Phase D Tranche 6 useMerge composable:
//  - addSecondary pushes a new pool entry (visible=true); caps at MAX_SECONDARIES
//  - addSecondary reuses a hidden pool entry when available
//  - removeSecondary hides the last visible entry (pool entry stays for reuse)
//  - checkLineCounts updates warn-bar state on visible entries + main warn bar
//  - computeMergeBtnDisabled returns true when preconditions aren't met
//  - mergeTranslations builds the merged LRC with interpolated timestamps
//  - onSecInput collapses 3+ consecutive newlines + writes to pool entry
//  - onSecPaste cleans + paren-wraps clipboard content + inserts at caret
//  - onSecFileImport reads .lrc/.txt files + cleans + paren-wraps
//  - syncScrollFrom syncs scroll position across main + secondary fields
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetModules()
})

async function initMergeWithStubs(mainText = '[ti: x]\nlyric1\nlyric2\n') {
  const mod = await import('@/composables/useMerge')
  const { useAppState } = await import('@/composables/useAppState')
  const { mainText: mainTextRef, secondaryPool, mergeDone, mainWarnText, mainWarnVisible } = useAppState()
  mainTextRef.value = mainText

  const setMainText = vi.fn((t: string) => {
    mainTextRef.value = t
  })
  const getMainText = vi.fn(() => mainTextRef.value)
  const doAutosave = vi.fn()
  const pushSnapshot = vi.fn()
  const scheduleSecInputSnapshot = vi.fn()
  const markGeniusSource = vi.fn()

  mod.initMerge({
    setMainText,
    getMainText,
    doAutosave,
    pushSnapshot,
    scheduleSecInputSnapshot,
    markGeniusSource,
  })

  return {
    mod,
    useAppState,
    mainText: mainTextRef,
    secondaryPool,
    mergeDone,
    mainWarnText,
    mainWarnVisible,
    callbacks: {
      setMainText,
      getMainText,
      doAutosave,
      pushSnapshot,
      scheduleSecInputSnapshot,
      markGeniusSource,
    },
  }
}

// Helper — stub globalThis.alert (happy-dom may not provide it). vi.stubGlobal
// is the canonical way to mock globals in Vitest; the returned spy is
// accessible via vi.mocked or directly via globalThis.alert.
function stubAlert(): ReturnType<typeof vi.fn> {
  const fn = vi.fn()
  vi.stubGlobal('alert', fn)
  return fn
}

// Helper — restore globalThis.alert after stubAlert.
function restoreAlert() {
  vi.unstubAllGlobals()
}

describe('useMerge — addSecondary / removeSecondary', () => {
  it('addSecondary pushes a new visible pool entry', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    expect(secondaryPool.value).toHaveLength(0)
    mod.addSecondary()
    expect(secondaryPool.value).toHaveLength(1)
    expect(secondaryPool.value[0]!.visible).toBe(true)
    expect(secondaryPool.value[0]!.text).toBe('')
  })

  it('addSecondary caps at MAX_SECONDARIES (10)', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    const alertSpy = stubAlert()
    for (let i = 0; i < 10; i++) mod.addSecondary()
    expect(secondaryPool.value).toHaveLength(10)
    expect(secondaryPool.value.filter((e) => e.visible)).toHaveLength(10)
    // 11th add — should alert + return false
    expect(mod.addSecondary()).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith('Maximum of 10 secondary fields reached.')
    restoreAlert()
  })

  it('addSecondary reuses a hidden pool entry when available', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary() // pool[0] visible
    mod.addSecondary() // pool[1] visible
    mod.removeSecondary() // hide pool[1] (last visible)
    expect(secondaryPool.value).toHaveLength(2)
    expect(secondaryPool.value[1]!.visible).toBe(false)
    mod.addSecondary() // reuse pool[1]
    expect(secondaryPool.value).toHaveLength(2) // no new entry pushed
    expect(secondaryPool.value[1]!.visible).toBe(true)
  })

  it('removeSecondary hides the last visible entry', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary()
    mod.addSecondary()
    expect(secondaryPool.value.filter((e) => e.visible)).toHaveLength(2)
    mod.removeSecondary()
    expect(secondaryPool.value.filter((e) => e.visible)).toHaveLength(1)
    expect(secondaryPool.value[1]!.visible).toBe(false)
  })

  it('removeSecondary returns false when no visible entry exists', async () => {
    const { mod } = await initMergeWithStubs()
    expect(mod.removeSecondary()).toBe(false)
  })
})

describe('useMerge — checkLineCounts', () => {
  it('shows line count mismatch warning when secondary has different count', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2\ntrans3' // 3 lines vs 2 main lyric lines
    mod.checkLineCounts()
    expect(secondaryPool.value[0]!.warnVisible).toBe(true)
    expect(secondaryPool.value[0]!.warnText).toContain('Line count mismatch')
  })

  it('shows missing trailing timestamp warning when main has ts but no trailing', async () => {
    const { mod, secondaryPool, mainWarnText, mainWarnVisible } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2' // matches count (2)
    mod.checkLineCounts()
    // Main has ts but no trailing — main warn bar should show
    expect(mainWarnVisible.value).toBe(true)
    expect(mainWarnText.value).toContain('Missing trailing timestamp')
    // Secondary warn bar should also show the "Missing trailing timestamp in Main" message
    expect(secondaryPool.value[0]!.warnVisible).toBe(true)
    expect(secondaryPool.value[0]!.warnText).toContain('Missing trailing timestamp in Main')
  })

  it('clears warnings when counts match + trailing ts present', async () => {
    const { mod, secondaryPool, mainWarnVisible } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2' // matches count (2)
    mod.checkLineCounts()
    expect(secondaryPool.value[0]!.warnVisible).toBe(false)
    expect(mainWarnVisible.value).toBe(false)
  })

  it('resets mergeDone when no visible secondaries exist', async () => {
    const { mod, mergeDone } = await initMergeWithStubs()
    mergeDone.value = true
    mod.checkLineCounts() // no visible secondaries → resets mergeDone
    expect(mergeDone.value).toBe(false)
  })
})

describe('useMerge — computeMergeBtnDisabled', () => {
  it('returns true when main has no timestamps', async () => {
    const { mod } = await initMergeWithStubs('[ti: x]\nlyric1\nlyric2\n')
    mod.addSecondary()
    expect(mod.computeMergeBtnDisabled()).toBe(true)
  })

  it('returns true when no visible secondary has content', async () => {
    const { mod } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    // secondary is empty
    expect(mod.computeMergeBtnDisabled()).toBe(true)
  })

  it('returns true when line counts mismatch', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2\ntrans3' // 3 vs 2
    expect(mod.computeMergeBtnDisabled()).toBe(true)
  })

  it('returns false when all preconditions are met', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2' // 2 vs 2
    expect(mod.computeMergeBtnDisabled()).toBe(false)
  })

  it('returns true when mergeDone is true', async () => {
    const { mod, mergeDone, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2'
    mergeDone.value = true
    expect(mod.computeMergeBtnDisabled()).toBe(true)
  })
})

describe('useMerge — mergeTranslations', () => {
  it('alerts when main has no timestamps', async () => {
    const { mod, callbacks } = await initMergeWithStubs('[ti: x]\nlyric1\n')
    const alertSpy = stubAlert()
    expect(mod.mergeTranslations()).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith('No timestamps in main field.')
    expect(callbacks.setMainText).not.toHaveBeenCalled()
    restoreAlert()
  })

  it('alerts when not all lyric lines have timestamps', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\nlyric2 (no ts)\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2'
    const alertSpy = stubAlert()
    expect(mod.mergeTranslations()).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith(
      'Not all main lyric lines have timestamps. Finish syncing before merging.',
    )
    restoreAlert()
  })

  it('alerts when secondary line count mismatches', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]\n',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2\ntrans3' // 3 vs 2
    const alertSpy = stubAlert()
    expect(mod.mergeTranslations()).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith(
      'Line count mismatch between main and secondary fields. Fix counts before merging.',
    )
    restoreAlert()
  })

  it('alerts when no trailing timestamp exists', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n', // no trailing
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2'
    const alertSpy = stubAlert()
    expect(mod.mergeTranslations()).toBe(false)
    expect(alertSpy).toHaveBeenCalledWith(
      'No trailing end timestamp found. Add an end timestamp to the last lyric line before merging.',
    )
    restoreAlert()
  })

  it('merges secondary lines with interpolated timestamps', async () => {
    // Note: no trailing \n in mainText so split('\n') gives exactly 4 lines.
    const { mod, secondaryPool, callbacks, mergeDone } = await initMergeWithStubs(
      '[ti: x]\n[00:01.00] lyric1\n[00:02.00] lyric2\n[00:05.00]',
    )
    mod.addSecondary()
    secondaryPool.value[0]!.text = 'trans1\ntrans2'
    expect(mod.mergeTranslations()).toBe(true)
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(mergeDone.value).toBe(true)
    const newText = callbacks.setMainText.mock.calls[0]![0] as string
    const lines = newText.split('\n')
    // Main has 4 lines (meta + 2 lyrics + trailing). After merge:
    //   [ti: x]
    //   [00:01.00] lyric1
    //   [00:01.99] trans1  (interpolated: 2000 - 10 = 1990ms = [00:01.99])
    //   [00:02.00] lyric2
    //   [00:04.99] trans2  (interpolated: 5000 - 10 = 4990ms = [00:04.99])
    //   [00:05.00]
    expect(lines.length).toBe(6)
    expect(lines[2]).toBe('[00:01.99] trans1')
    expect(lines[4]).toBe('[00:04.99] trans2')
  })
})

describe('useMerge — onSecInput', () => {
  it('writes the cleaned text to the pool entry', async () => {
    const { mod, secondaryPool, callbacks } = await initMergeWithStubs()
    mod.addSecondary()
    const ta = document.createElement('textarea')
    ta.value = 'hello\nworld'
    mod.onSecInput(0, { target: ta } as unknown as Event)
    expect(secondaryPool.value[0]!.text).toBe('hello\nworld')
    expect(callbacks.scheduleSecInputSnapshot).toHaveBeenCalled()
  })

  it('collapses 3+ consecutive newlines to 2', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary()
    const ta = document.createElement('textarea')
    ta.value = 'a\n\n\n\nb'
    mod.onSecInput(0, { target: ta } as unknown as Event)
    expect(secondaryPool.value[0]!.text).toBe('a\n\nb')
    expect(ta.value).toBe('a\n\nb') // DOM textarea was also updated
  })

  it('no-ops when the pool index is out of bounds', async () => {
    const { mod, callbacks } = await initMergeWithStubs()
    const ta = document.createElement('textarea')
    mod.onSecInput(99, { target: ta } as unknown as Event)
    expect(callbacks.scheduleSecInputSnapshot).not.toHaveBeenCalled()
  })
})

describe('useMerge — onSecPaste', () => {
  it('cleans clipboard + inserts at the caret + pushes snapshot', async () => {
    const { mod, secondaryPool, callbacks } = await initMergeWithStubs()
    mod.addSecondary()
    const ta = document.createElement('textarea')
    ta.value = 'before\nafter'
    // Caret at position 6 = right after "before" (before the \n).
    // slice(0, 6) = "before", slice(6) = "\nafter".
    // Inserted: "(pasted)\n(text)" (parenChecked=true).
    // Result: "before" + "(pasted)\n(text)" + "\nafter" = "before(pasted)\n(text)\nafter"
    ta.selectionStart = 6
    ta.selectionEnd = 6
    const e = {
      preventDefault: vi.fn(),
      target: ta,
      clipboardData: { getData: vi.fn(() => 'pasted\ntext') },
    } as unknown as ClipboardEvent
    mod.onSecPaste(0, e, true)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(secondaryPool.value[0]!.text).toBe('before(pasted)\n(text)\nafter')
    expect(callbacks.pushSnapshot).toHaveBeenCalled()
  })

  it('strips meta lines + headers from pasted content', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary()
    const ta = document.createElement('textarea')
    ta.value = ''
    ta.selectionStart = 0
    ta.selectionEnd = 0
    const e = {
      preventDefault: vi.fn(),
      target: ta,
      clipboardData: {
        getData: vi.fn(() => '[ti: Song]\n[Chorus]\nlyric line'),
      },
    } as unknown as ClipboardEvent
    mod.onSecPaste(0, e, false) // parenChecked=false
    // Meta [ti:] stripped, [Chorus] header stripped, only "lyric line" remains
    expect(secondaryPool.value[0]!.text).toBe('lyric line')
  })

  it('paren-wraps when the checkbox is checked', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary()
    const ta = document.createElement('textarea')
    ta.value = ''
    ta.selectionStart = 0
    ta.selectionEnd = 0
    const e = {
      preventDefault: vi.fn(),
      target: ta,
      clipboardData: { getData: vi.fn(() => 'line1\nline2') },
    } as unknown as ClipboardEvent
    mod.onSecPaste(0, e, true) // parenChecked=true
    expect(secondaryPool.value[0]!.text).toBe('(line1)\n(line2)')
  })
})

describe('useMerge — onSecKeydown (stub)', () => {
  it('stops propagation on navigation keys', async () => {
    const { mod } = await initMergeWithStubs()
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
      const e = { key, stopPropagation: vi.fn() } as unknown as KeyboardEvent
      mod.onSecKeydown(e)
      expect(e.stopPropagation).toHaveBeenCalled()
    }
  })

  it('stops propagation on space / enter / tab / escape', async () => {
    const { mod } = await initMergeWithStubs()
    for (const key of [' ', 'Enter', 'Tab', 'Escape']) {
      const e = { key, stopPropagation: vi.fn() } as unknown as KeyboardEvent
      mod.onSecKeydown(e)
      expect(e.stopPropagation).toHaveBeenCalled()
    }
  })

  it('stops propagation on single-character keys (no modifier)', async () => {
    const { mod } = await initMergeWithStubs()
    const e = {
      key: 'a',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent
    mod.onSecKeydown(e)
    expect(e.stopPropagation).toHaveBeenCalled()
  })

  it('does NOT stop propagation on Ctrl+A (select all)', async () => {
    const { mod } = await initMergeWithStubs()
    const e = {
      key: 'a',
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent
    // Ctrl+A stops propagation (the monolith's behavior — blocks select-all
    // from bubbling to the global handler).
    mod.onSecKeydown(e)
    expect(e.stopPropagation).toHaveBeenCalled()
  })
})

describe('useMerge — syncScrollFrom', () => {
  it('syncs scroll position from src to all other scrollable fields', async () => {
    const { mod, secondaryPool } = await initMergeWithStubs()
    mod.addSecondary()
    // Build a minimal DOM with #main-scroll + the secondary textarea
    const mainScroll = document.createElement('div')
    mainScroll.id = 'main-scroll'
    Object.defineProperty(mainScroll, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(mainScroll, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(mainScroll, 'scrollTop', { value: 50, configurable: true, writable: true })
    document.body.appendChild(mainScroll)

    const secTa = document.createElement('textarea')
    Object.defineProperty(secTa, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(secTa, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(secTa, 'scrollTop', { value: 0, configurable: true, writable: true })
    secondaryPool.value[0]!.textareaEl = secTa

    // Sync from main-scroll — secTa should get scrollTop = 50/100 * (200-100) = 50
    mod.syncScrollFrom(mainScroll)
    expect(secTa.scrollTop).toBe(50)
  })

  it('no-ops when suppressScrollSync is true', async () => {
    const { mod, useAppState } = await initMergeWithStubs()
    useAppState().suppressScrollSync.value = true
    const src = document.createElement('div')
    Object.defineProperty(src, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(src, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(src, 'scrollTop', { value: 50, configurable: true, writable: true })
    // No-op — should not throw + should not change anything
    expect(() => mod.syncScrollFrom(src)).not.toThrow()
  })
})
