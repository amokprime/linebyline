// @vitest-environment happy-dom
// Pins the Phase D Tranche 2 useAutosave composable:
//  - doAutosave writes {main, poolTexts, visibleCount, mergeDone, audioPath} to sessionStorage
//  - loadAutosave restores main text + secondaries + mergeDone + audioPath
//  - loadAutosave computes initial activeLine (first non-meta non-blank line)
//  - loadAutosave seeds the undo stack via the seedUndo callback
//  - loadAutosave falls back to cfg.default_meta when no autosave exists
//  - _restoreSecondaryPool pushes entries with visible flags from visibleCount
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetModules()
})

async function initAutosaveWithCallbacks(overrides: Partial<Record<string, unknown>> = {}) {
  const mod = await import('@/composables/useAutosave')
  const { useAppState } = await import('@/composables/useAppState')
  const { mainText, secondaryPool, mergeDone, activeLine, playingLine, savedAudioPath, cfg } = useAppState()
  const takeSnapshot = vi.fn(() => ({
    main: mainText.value,
    secondaries: secondaryPool.value.map((e: { text: string }) => e.text),
    mergeDone: mergeDone.value,
  }))
  const seedUndo = vi.fn()
  const renderMainLines = vi.fn()
  const checkLineCounts = vi.fn()
  const updateTitleFromText = vi.fn()
  mod.initAutosave({
    getMainText: () => mainText.value,
    setMainText: (t: string) => { mainText.value = t },
    renderMainLines,
    checkLineCounts,
    updateTitleFromText,
    takeSnapshot,
    seedUndo,
    ...overrides,
  })
  return { mod, useAppState, mainText, secondaryPool, mergeDone, activeLine, playingLine, savedAudioPath, cfg, takeSnapshot, seedUndo, renderMainLines, checkLineCounts, updateTitleFromText }
}

describe('useAutosave — doAutosave', () => {
  it('writes the current state to sessionStorage as lbl_autosave', async () => {
    const { mod, useAppState } = await initAutosaveWithCallbacks()
    const { mainText, secondaryPool, mergeDone, savedAudioPath } = useAppState()
    mainText.value = '[ti: Song]\nLyric line\n'
    secondaryPool.value = [
      { visible: true, text: 'Translation 1' },
      { visible: false, text: 'Hidden translation' },
    ]
    mergeDone.value = true
    savedAudioPath.value = '/path/to/audio.mp3'

    mod.doAutosave()
    const raw = sessionStorage.getItem('lbl_autosave')
    expect(raw).not.toBeNull()
    const d = JSON.parse(raw!)
    expect(d.main).toBe('[ti: Song]\nLyric line\n')
    expect(d.poolTexts).toEqual(['Translation 1', 'Hidden translation'])
    expect(d.visibleCount).toBe(1)
    expect(d.mergeDone).toBe(true)
    expect(d.audioPath).toBe('/path/to/audio.mp3')
  })

  it('updates savedAudioPath when audioPath argument is provided', async () => {
    const { mod, useAppState } = await initAutosaveWithCallbacks()
    const { savedAudioPath } = useAppState()
    mod.doAutosave('/new/path.mp3')
    expect(savedAudioPath.value).toBe('/new/path.mp3')
    const d = JSON.parse(sessionStorage.getItem('lbl_autosave')!)
    expect(d.audioPath).toBe('/new/path.mp3')
  })

  it('omits audioPath from the saved data when savedAudioPath is null', async () => {
    const { mod } = await initAutosaveWithCallbacks()
    mod.doAutosave()
    const d = JSON.parse(sessionStorage.getItem('lbl_autosave')!)
    expect(d.audioPath).toBeUndefined()
  })
})

describe('useAutosave — loadAutosave', () => {
  it('restores main text, mergeDone, audioPath from sessionStorage', async () => {
    const { mod, useAppState, mainText, mergeDone, savedAudioPath } = await initAutosaveWithCallbacks()
    const { cfg } = useAppState()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Saved]\nSaved lyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: true,
      audioPath: '/saved/path.mp3',
    }))

    mod.loadAutosave()
    expect(mainText.value).toBe('[ti: Saved]\nSaved lyric\n')
    expect(mergeDone.value).toBe(true)
    expect(savedAudioPath.value).toBe('/saved/path.mp3')
    // cfg is not modified — loadAutosave reads cfg.default_meta only as fallback
    expect(cfg.value.tiny_ms).toBe(100)
  })

  it('falls back to cfg.default_meta when no autosave exists', async () => {
    const { mod, mainText } = await initAutosaveWithCallbacks()
    mod.loadAutosave()
    expect(mainText.value).toContain('[ti: Unknown]')
    expect(mainText.value).toContain('[ar: Unknown]')
  })

  it('falls back to cfg.default_meta on JSON parse error', async () => {
    const { mod, mainText } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', '{not valid json')
    mod.loadAutosave()
    expect(mainText.value).toContain('[ti: Unknown]')
  })

  it('restores secondary pool with visible flags from visibleCount', async () => {
    const { mod, secondaryPool } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Song]\n',
      poolTexts: ['Translation A', 'Translation B', 'Translation C'],
      visibleCount: 2,
      mergeDone: false,
    }))

    mod.loadAutosave()
    expect(secondaryPool.value).toHaveLength(3)
    expect(secondaryPool.value[0]!.text).toBe('Translation A')
    expect(secondaryPool.value[0]!.visible).toBe(true)
    expect(secondaryPool.value[1]!.text).toBe('Translation B')
    expect(secondaryPool.value[1]!.visible).toBe(true)
    expect(secondaryPool.value[2]!.text).toBe('Translation C')
    expect(secondaryPool.value[2]!.visible).toBe(false) // beyond visibleCount
  })

  it('computes initial activeLine as the first non-meta non-blank line', async () => {
    const { mod, activeLine } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Song]\n[ar: Artist]\n\nFirst lyric\nSecond lyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: false,
    }))

    mod.loadAutosave()
    // Lines: 0=[ti:Song] (meta), 1=[ar:Artist] (meta), 2='' (blank), 3=First lyric
    expect(activeLine.value).toBe(3)
  })

  it('seeds the undo stack via seedUndo callback', async () => {
    const { mod, seedUndo, takeSnapshot } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Song]\nLyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: false,
    }))

    mod.loadAutosave()
    expect(takeSnapshot).toHaveBeenCalled()
    expect(seedUndo).toHaveBeenCalled()
    const seededSnap = seedUndo.mock.calls[0]![0]
    expect(seededSnap.main).toBe('[ti: Song]\nLyric\n')
    expect(seededSnap.mergeDone).toBe(false)
  })

  it('resets playingLine to -1', async () => {
    const { mod, playingLine } = await initAutosaveWithCallbacks()
    playingLine.value = 5
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Song]\nLyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: false,
    }))

    mod.loadAutosave()
    expect(playingLine.value).toBe(-1)
  })

  it('calls renderMainLines, checkLineCounts, updateTitleFromText after restore', async () => {
    const { mod, renderMainLines, checkLineCounts, updateTitleFromText } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Song]\nLyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: false,
    }))

    mod.loadAutosave()
    expect(renderMainLines).toHaveBeenCalled()
    expect(checkLineCounts).toHaveBeenCalled()
    expect(updateTitleFromText).toHaveBeenCalled()
  })

  it('does not clear sessionStorage before loading (port delta from monolith)', async () => {
    // The monolith's Init has `sessionStorage.removeItem('lbl_autosave')` before
    // loadAutosave — meaning autosave never restores. The Vue port does NOT
    // clear. This test verifies the data persists across a loadAutosave call.
    const { mod, mainText } = await initAutosaveWithCallbacks()
    sessionStorage.setItem('lbl_autosave', JSON.stringify({
      main: '[ti: Persisted]\nPersisted lyric\n',
      poolTexts: [],
      visibleCount: 0,
      mergeDone: false,
    }))

    mod.loadAutosave()
    expect(mainText.value).toBe('[ti: Persisted]\nPersisted lyric\n')
    // The autosave data is still in sessionStorage after loadAutosave
    const raw = sessionStorage.getItem('lbl_autosave')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).main).toBe('[ti: Persisted]\nPersisted lyric\n')
  })
})
