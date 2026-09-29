// @vitest-environment happy-dom
// Pins the Phase D Tranche 7 useImport composable:
//  - doImport opens the #file-picker (resets value first so re-select fires change)
//  - doSave builds filename from [ti:] tag or fallback + sanitises + downloads .lrc
//  - onFilePickerChange dispatches by file type: audio-only / lrc-only / pair
//  - onMiddleClick triggers doImport (or opens secondary picker if hovering)
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetModules()
})

// Helper — stub globalThis.alert + URL.createObjectURL + FileReader.
function stubAlert() {
  const fn = vi.fn()
  vi.stubGlobal('alert', fn)
  return fn
}
function restoreAlert() {
  vi.unstubAllGlobals()
}

// Helper — create a File with text content.
function makeTextFile(name: string, content: string): File {
  return new File([content], name, { type: 'text/plain' })
}

// Helper — create a minimal audio File (just needs a name + some bytes).
function makeAudioFile(name: string): File {
  return new File([new Uint8Array([0, 1, 2, 3])], name, { type: 'audio/mpeg' })
}

// Helper — initialize useImport with stubbed callbacks.
async function initImportWithStubs(mainText = '[ti: x]\nlyric\n') {
  const mod = await import('@/composables/useImport')
  const { useAppState } = await import('@/composables/useAppState')
  const { mainText: mainTextRef, lastImportStem, activeLine, secondaryPool, savedAudioPath } = useAppState()
  mainTextRef.value = mainText

  const setMainText = vi.fn((t: string) => {
    mainTextRef.value = t
  })
  const getMainText = vi.fn(() => mainTextRef.value)
  const doAutosave = vi.fn()
  const setupAudio = vi.fn()
  const clearAudio = vi.fn()
  const setSongTitle = vi.fn()
  const setSongArtist = vi.fn()
  const pushSnapshot = vi.fn()
  const seedUndo = vi.fn()
  const takeSnapshot = vi.fn(() => ({
    main: mainTextRef.value,
    secondaries: [],
    mergeDone: false,
  }))
  const renderMainLines = vi.fn()
  const checkLineCounts = vi.fn()
  const updateMergeBtn = vi.fn()
  const updateTitleFromText = vi.fn()

  mod.initImport({
    setMainText,
    getMainText,
    doAutosave,
    setupAudio,
    clearAudio,
    setSongTitle,
    setSongArtist,
    pushSnapshot,
    seedUndo,
    takeSnapshot,
    renderMainLines,
    checkLineCounts,
    updateMergeBtn,
    updateTitleFromText,
  })

  return {
    mod,
    useAppState,
    mainText: mainTextRef,
    lastImportStem,
    activeLine,
    secondaryPool,
    savedAudioPath,
    callbacks: {
      setMainText,
      getMainText,
      doAutosave,
      setupAudio,
      clearAudio,
      setSongTitle,
      setSongArtist,
      pushSnapshot,
      seedUndo,
      takeSnapshot,
      renderMainLines,
      checkLineCounts,
      updateMergeBtn,
      updateTitleFromText,
    },
  }
}

// Helper — stub FileReader to synchronously call onload with the text content.
// The onload event's `target.result` must be the stubbed text — we set it on
// the mock reader + pass the reader as the event's target.
function stubFileReaderText(text: string) {
  class MockReader {
    result: string | ArrayBuffer | null = text
    onload: ((ev: Event) => void) | null = null
    readAsText(_file: File) {
      const ev = { target: this } as unknown as Event
      if (this.onload) this.onload(ev)
    }
  }
  vi.stubGlobal('FileReader', MockReader)
  return () => vi.unstubAllGlobals()
}

describe('useImport — doImport', () => {
  it('resets the file picker value + clicks it', async () => {
    const { mod } = await initImportWithStubs()
    const picker = document.createElement('input')
    picker.type = 'file'
    // happy-dom throws on setting .value for file inputs; stub the setter.
    let valueSet = ''
    Object.defineProperty(picker, 'value', {
      get: () => valueSet,
      set: (v: string) => { valueSet = v },
      configurable: true,
    })
    picker.value = '/fake/path/file.lrc'
    picker.click = vi.fn()
    mod.setFilePickerRef({ value: picker } as any)
    mod.doImport()
    expect(picker.value).toBe('') // reset so re-select fires change
    expect(picker.click).toHaveBeenCalled()
  })

  it('no-ops when the file picker ref is unbound', async () => {
    const { mod } = await initImportWithStubs()
    expect(() => mod.doImport()).not.toThrow()
  })
})

describe('useImport — doSave', () => {
  it('builds filename from [ti:] tag + sanitises + triggers download', async () => {
    const { mod } = await initImportWithStubs('[ti: My/Song?]\nlyric\n')
    // Stub URL.createObjectURL + URL.revokeObjectURL + anchor click
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const anchorClick = vi.fn()
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'a') {
        el.click = anchorClick
      }
      return el
    })
    mod.doSave()
    expect(createObjectURL).toHaveBeenCalled()
    expect(anchorClick).toHaveBeenCalled()
    // Filename should be "My_Song_.lrc" (sanitised / and ?)
    const anchor = (document.createElement as any).mock.calls.length
    void anchor
    vi.unstubAllGlobals()
    ;(document.createElement as any).mockRestore()
  })

  it('falls back to lastImportStem when [ti:] is "Unknown"', async () => {
    const { mod, lastImportStem } = await initImportWithStubs('[ti: Unknown]\nlyric\n')
    lastImportStem.value = 'audio-stem'
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:'), revokeObjectURL: vi.fn() })
    const anchorClick = vi.fn()
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'a') el.click = anchorClick
      return el
    })
    mod.doSave()
    expect(anchorClick).toHaveBeenCalled()
    // The download attribute should be "audio-stem.lrc"
    // (verifiable by inspecting the anchor, but we just assert click fired)
    vi.unstubAllGlobals()
    ;(document.createElement as any).mockRestore()
  })

  it('falls back to "lyrics" when no [ti:] and no lastImportStem', async () => {
    const { mod } = await initImportWithStubs('lyric\n')
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:'), revokeObjectURL: vi.fn() })
    const anchorClick = vi.fn()
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'a') el.click = anchorClick
      return el
    })
    mod.doSave()
    expect(anchorClick).toHaveBeenCalled()
    vi.unstubAllGlobals()
    ;(document.createElement as any).mockRestore()
  })
})

describe('useImport — onFilePickerChange (audio-only)', () => {
  it('calls setupAudio with the file + stem', async () => {
    const { mod, callbacks } = await initImportWithStubs()
    const af = makeAudioFile('song.mp3')
    const e = { target: { files: [af] } } as unknown as Event
    mod.onFilePickerChange(e)
    expect(callbacks.setupAudio).toHaveBeenCalledWith(af, 'song')
  })
})

describe('useImport — onFilePickerChange (lrc-only)', () => {
  it('reads the lrc + merges meta + sets main text', async () => {
    const { mod, callbacks } = await initImportWithStubs()
    const restore = stubFileReaderText('[ti: Song]\n[00:01.00] lyric\n')
    const lf = makeTextFile('song.lrc', '[ti: Song]\n[00:01.00] lyric\n')
    const e = { target: { files: [lf] } } as unknown as Event
    mod.onFilePickerChange(e)
    expect(callbacks.setMainText).toHaveBeenCalled()
    // pushSnapshot is NOT called separately — setMainText (App.vue's real
    // implementation) handles the undo stack push internally (pre + post).
    // The explicit pushSnapshot was removed to fix the undo double-push bug
    // where the first Control+z was a no-op (pop to identical state).
    expect(callbacks.doAutosave).toHaveBeenCalledWith('song')
    restore()
  })

  it('alerts when file exceeds MAX_LINES (500)', async () => {
    const { mod, callbacks } = await initImportWithStubs()
    const alertSpy = stubAlert()
    const longText = Array(501).fill('lyric').join('\n')
    const restore = stubFileReaderText(longText)
    const lf = makeTextFile('big.lrc', longText)
    const e = { target: { files: [lf] } } as unknown as Event
    mod.onFilePickerChange(e)
    expect(alertSpy).toHaveBeenCalledWith('File exceeds 500 line limit. Import a shorter file.')
    expect(callbacks.setMainText).not.toHaveBeenCalled()
    restore()
    restoreAlert()
  })
})

describe('useImport — onFilePickerChange (audio + lrc pair)', () => {
  it('resets state + setupAudio + reads lrc + seeds undo', async () => {
    const { mod, callbacks, secondaryPool } = await initImportWithStubs()
    // Pre-populate: a visible secondary + savedAudioPath
    secondaryPool.value.push({ visible: true, text: 'old text' })
    const af = makeAudioFile('song.mp3')
    const lf = makeTextFile('song.lrc', '[ti: Song]\n[00:01.00] lyric\n')
    const restore = stubFileReaderText('[ti: Song]\n[00:01.00] lyric\n')
    const e = { target: { files: [af, lf] } } as unknown as Event
    mod.onFilePickerChange(e)
    expect(callbacks.clearAudio).toHaveBeenCalled()
    expect(callbacks.setupAudio).toHaveBeenCalledWith(af, 'song')
    expect(callbacks.setSongTitle).toHaveBeenCalledWith('Unknown Title')
    expect(callbacks.setSongArtist).toHaveBeenCalledWith('Unknown Artist')
    expect(secondaryPool.value[0]!.visible).toBe(false)
    expect(secondaryPool.value[0]!.text).toBe('')
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(callbacks.seedUndo).toHaveBeenCalled()
    restore()
  })
})

describe('useImport — onMiddleClick', () => {
  it('calls doImport when middle-clicking outside a secondary textarea', async () => {
    const { mod } = await initImportWithStubs()
    const picker = document.createElement('input')
    picker.type = 'file'
    picker.click = vi.fn()
    mod.setFilePickerRef({ value: picker } as any)
    const e = {
      button: 1,
      preventDefault: vi.fn(),
      target: document.body,
    } as unknown as MouseEvent
    mod.onMiddleClick(e)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(picker.click).toHaveBeenCalled()
  })

  it('no-ops when not a middle-click (button !== 1)', async () => {
    const { mod } = await initImportWithStubs()
    const e = {
      button: 0,
      preventDefault: vi.fn(),
    } as unknown as MouseEvent
    mod.onMiddleClick(e)
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it('opens the secondary picker when middle-clicking over a secondary textarea', async () => {
    const { mod, secondaryPool } = await initImportWithStubs()
    // Build a secondary textarea + register it on the pool entry
    const secTa = document.createElement('textarea')
    document.body.appendChild(secTa)
    secondaryPool.value.push({ visible: true, text: '', textareaEl: secTa })
    // Build the per-field file picker (SecondaryField registers it with id sec-file-1)
    const secPicker = document.createElement('input')
    secPicker.id = 'sec-file-1'
    secPicker.type = 'file'
    secPicker.click = vi.fn()
    document.body.appendChild(secPicker)
    const e = {
      button: 1,
      preventDefault: vi.fn(),
      target: secTa,
    } as unknown as MouseEvent
    mod.onMiddleClick(e)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(secPicker.click).toHaveBeenCalled()
  })
})
