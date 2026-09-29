// @vitest-environment happy-dom
// Pins the Phase D Tranche 5 useSync composable:
//  - renderMainLines builds the .lrc-line <li> children from mainText
//  - onMainLinesMouseDown recovers the line index via data-idx + dispatches
//  - onMainInput writes mainText + runs the side-effect chain
//  - onMainPaste (typing mode) inserts cleaned text at the caret
//  - onMainLinesPaste (hotkey mode) overwrites with merged-meta + lyrics
//  - syncLine stamps the current time onto activeLine; auto-advances
//  - insertEndLine uses the three-tier logic (trailing-ts in place / next ts in place / insert new)
//  - adjustTs offsets selected or active line's ts by delta
//  - markAsTranslation (normal mode) stamps next ts - 10ms + optionally wraps in parens
//  - markAsTranslation (split mode) peels trailing parens into separate lines
//  - doSyncFile applies seek_offset to all timestamps then resets to 0
//  - tickSeekOffset increments cfg.seek_offset + persists
//  - onSeekOffsetChange parses + NaN reverts + persists
//  - seekPrevLine/seekNextLine navigate + optionally replay
//  - replayActiveLine seeks to active line's ts + offset + plays
//  - updateActiveLineFromTime sets playingLine from audio position
//  - setOnInputCallback decouples useSync from useUndoRedo
//  - isAutoLineSuppressed + suppressAuto timer (1.5s window)
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.resetModules()
})

// Helper: mount a fake editor + wire useSync with stub callbacks.
async function setupSync(opts: {
  mainText?: string
  hotkeyMode?: boolean
  audioReady?: boolean
  audioDurationMs?: number | null
  currentMs?: number
} = {}) {
  const mod = await import('@/composables/useSync')
  const appState = await import('@/composables/useAppState')
  const { mainText, hotkeyMode, activeLine, playingLine, cfg } = appState.useAppState()
  mainText.value = opts.mainText ?? '[ti: song]\n[00:00.00]\nlyric one\nlyric two\n[00:05.00]\n'
  hotkeyMode.value = opts.hotkeyMode ?? true

  // Track every setMainText call so tests can assert the resulting text.
  const setMainText = vi.fn((t: string) => {
    mainText.value = t
  })
  const doAutosave = vi.fn()
  const updateTitleFromText = vi.fn()
  const checkLineCounts = vi.fn()
  const updateMergeBtn = vi.fn()
  const syncSecScroll = vi.fn()
  const announce = vi.fn()
  const seekToMs = vi.fn()
  const playIfNotPlaying = vi.fn()
  const setLastPlayingLine = vi.fn()
  const getCurrentMs = vi.fn(() => opts.currentMs ?? 5000)
  const getAudioDurationMs = vi.fn(() => opts.audioDurationMs ?? 10000)
  const isAudioReady = vi.fn(() => opts.audioReady ?? true)

  // EditorArea-shaped refs — mainLines is the <ul> we render into.
  const mainLines: Ref<HTMLElement | null> = ref(null)
  const mainTextarea: Ref<HTMLTextAreaElement | null> = ref(null)
  const mainScroll: Ref<HTMLElement | null> = ref(null)
  const seekOffset: Ref<HTMLInputElement | null> = ref(null)

  mod.initSync({ mainLines, mainTextarea, mainScroll }, {
    setMainText,
    getMainText: () => mainText.value,
    doAutosave,
    updateTitleFromText,
    checkLineCounts,
    updateMergeBtn,
    syncSecScroll,
    announce,
    getCurrentMs,
    seekToMs,
    playIfNotPlaying,
    setLastPlayingLine,
    getAudioDurationMs,
    isAudioReady,
  })
  mod.setSeekOffsetRef(seekOffset)

  // Mount a fake editor shell so renderMainLines has a real <ul> to write to.
  const Shell = defineComponent({
    setup() {
      const { provideCfg } = appState
      provideCfg()
      return () =>
        h('div', [
          h('ul', { ref: mainLines, id: 'main-lines' }),
          h('textarea', { ref: mainTextarea, id: 'main-textarea' }),
          h('div', { ref: mainScroll, id: 'main-scroll' }),
          h('input', { ref: seekOffset, id: 'seek-offset', type: 'number', value: '0' }),
          h('input', { id: 'main-split-check', type: 'checkbox' }),
          h('input', { id: 'main-paren-check', type: 'checkbox', checked: true }),
        ])
    },
  })
  mount(Shell, { attachTo: document.body })

  return {
    mod,
    appState,
    mainText,
    hotkeyMode,
    activeLine,
    playingLine,
    cfg,
    mainLines,
    mainTextarea,
    seekOffset,
    callbacks: {
      setMainText,
      doAutosave,
      updateTitleFromText,
      checkLineCounts,
      updateMergeBtn,
      syncSecScroll,
      announce,
      seekToMs,
      playIfNotPlaying,
      setLastPlayingLine,
      getCurrentMs,
      getAudioDurationMs,
      isAudioReady,
    },
  }
}

describe('useSync — renderMainLines', () => {
  it('builds .lrc-line <li> children from mainText', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[ti: song]\n[00:05.00] lyric one\n[00:10.00] lyric two\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    expect(lis.length).toBeGreaterThan(0)
    // The meta line is skipped in hotkey mode.
    const texts = Array.from(lis).map((li) => li.textContent || '')
    expect(texts.some((t) => t.includes('lyric one'))).toBe(true)
    expect(texts.some((t) => t.includes('lyric two'))).toBe(true)
    expect(texts.some((t) => t.includes('[ti:'))).toBe(false)
  })

  it('skips blank lines that follow meta lines (preserves separators)', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[ti: song]\n\n[00:05.00] lyric',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    // The meta line + the blank that follows it are both skipped.
    // The visible lyric line is the only one rendered.
    expect(lis.length).toBe(1)
  })

  it('preserves blank lines that follow non-meta lines', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[00:05.00] lyric one\n\n[00:10.00] lyric two',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    // lyric one + blank separator + lyric two = 3 lis.
    expect(lis.length).toBe(3)
  })

  it('no-ops when mainLines ref is unbound (pre-mount, pure-node)', async () => {
    const mod = await import('@/composables/useSync')
    // Don't call initSync — _refs.current is null.
    expect(() => mod.renderMainLines()).not.toThrow()
  })

  it('assigns data-idx attribute to each line', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    expect(lis[0]?.getAttribute('data-idx')).toBe('0')
    expect(lis[1]?.getAttribute('data-idx')).toBe('1')
  })

  it('marks the active line with the .cursor class', async () => {
    const { mod, mainLines, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    activeLine.value = 1
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    expect(lis[0]?.classList.contains('cursor')).toBe(false)
    expect(lis[1]?.classList.contains('cursor')).toBe(true)
  })

  it('marks the playing line with the .active class', async () => {
    const { mod, mainLines, playingLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    playingLine.value = 0
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    expect(lis[0]?.classList.contains('active')).toBe(true)
    expect(lis[1]?.classList.contains('active')).toBe(false)
  })

  it('marks selected lines with the .selected class', async () => {
    const { mod, mainLines, appState } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    appState.useAppState().selectedLines.value.add(1)
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    expect(lis[1]?.classList.contains('selected')).toBe(true)
  })

  it('marks end-ts lines with the .end-ts class', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[00:05.00] lyric\n[00:10.00]\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    // The trailing [00:10.00] line is an end-ts (no content after the ts).
    const endTsLi = Array.from(lis).find((li) => li.textContent?.trim() === '[00:10.00]')
    expect(endTsLi?.classList.contains('end-ts')).toBe(true)
  })
})

describe('useSync — onMainLinesMouseDown (delegated click handler)', () => {
  it('recovers the line index via data-idx + sets activeLine', async () => {
    const { mod, mainLines, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e = new MouseEvent('mousedown', { button: 0, bubbles: true })
    Object.defineProperty(e, 'target', { value: lis[1] })
    mod.onMainLinesMouseDown(e)
    expect(activeLine.value).toBe(1)
  })

  it('no-ops for non-left button', async () => {
    const { mod, mainLines, activeLine } = await setupSync({
      mainText: '[00:05.00] line\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e = new MouseEvent('mousedown', { button: 2, bubbles: true })
    Object.defineProperty(e, 'target', { value: lis[0] })
    mod.onMainLinesMouseDown(e)
    expect(activeLine.value).toBe(-1)
  })

  it('no-ops when the click target is not a .lrc-line', async () => {
    const { mod, mainLines, activeLine } = await setupSync({
      mainText: '[00:05.00] line\n',
    })
    mod.renderMainLines()
    const e = new MouseEvent('mousedown', { button: 0, bubbles: true })
    Object.defineProperty(e, 'target', { value: mainLines.value })
    mod.onMainLinesMouseDown(e)
    expect(activeLine.value).toBe(-1)
  })

  it('seeks + plays when the clicked line has a timestamp + audio is ready', async () => {
    const { mod, mainLines, callbacks } = await setupSync({
      mainText: '[00:05.00] line one\n',
      audioReady: true,
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e = new MouseEvent('mousedown', { button: 0, bubbles: true })
    Object.defineProperty(e, 'target', { value: lis[0] })
    mod.onMainLinesMouseDown(e)
    expect(callbacks.seekToMs).toHaveBeenCalledWith(5000)
    expect(callbacks.playIfNotPlaying).toHaveBeenCalled()
  })

  it('shift-click extends selection (adds range to selectedLines)', async () => {
    const { mod, mainLines, activeLine, appState } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n[00:15.00] line three\n',
    })
    activeLine.value = 0
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e = new MouseEvent('mousedown', { button: 0, shiftKey: true, bubbles: true })
    Object.defineProperty(e, 'target', { value: lis[2] })
    mod.onMainLinesMouseDown(e)
    const selected = appState.useAppState().selectedLines.value
    expect(selected.size).toBe(3)
    expect(selected.has(0)).toBe(true)
    expect(selected.has(1)).toBe(true)
    expect(selected.has(2)).toBe(true)
  })

  it('ctrl-click toggles individual line selection', async () => {
    const { mod, mainLines, activeLine, appState } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    activeLine.value = 0
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e1 = new MouseEvent('mousedown', { button: 0, ctrlKey: true, bubbles: true })
    Object.defineProperty(e1, 'target', { value: lis[1] })
    mod.onMainLinesMouseDown(e1)
    expect(appState.useAppState().selectedLines.value.has(1)).toBe(true)
    // Second ctrl-click toggles it off.
    const e2 = new MouseEvent('mousedown', { button: 0, ctrlKey: true, bubbles: true })
    Object.defineProperty(e2, 'target', { value: lis[1] })
    mod.onMainLinesMouseDown(e2)
    expect(appState.useAppState().selectedLines.value.has(1)).toBe(false)
  })
})

describe('useSync — onMainLinesContextMenu', () => {
  it('prevents the browser context menu on .lrc-line targets', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[00:05.00] line\n',
    })
    mod.renderMainLines()
    const lis = mainLines.value!.querySelectorAll('.lrc-line')
    const e = new MouseEvent('contextmenu', { bubbles: true })
    Object.defineProperty(e, 'target', { value: lis[0] })
    const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
    mod.onMainLinesContextMenu(e)
    expect(pd).toHaveBeenCalled()
  })

  it('does NOT preventDefault when the target is not a .lrc-line', async () => {
    const { mod, mainLines } = await setupSync({
      mainText: '[00:05.00] line\n',
    })
    mod.renderMainLines()
    const e = new MouseEvent('contextmenu', { bubbles: true })
    Object.defineProperty(e, 'target', { value: mainLines.value })
    const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
    mod.onMainLinesContextMenu(e)
    expect(pd).not.toHaveBeenCalled()
  })
})

describe('useSync — syncLine', () => {
  it('stamps the current time onto activeLine + sets playingLine', async () => {
    const { mod, mainText, activeLine, playingLine, callbacks } = await setupSync({
      mainText: '[ti: song]\n[00:00.00]\nlyric one\nlyric two\n[00:05.00]\n',
      currentMs: 7000,
    })
    activeLine.value = 2 // "lyric one"
    mod.syncLine()
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(mainText.value.split('\n')[2]).toBe('[00:07.00] lyric one')
    expect(playingLine.value).toBe(2)
  })

  it('no-ops when activeLine is out of range', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
    })
    activeLine.value = -1
    mod.syncLine()
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })

  it('no-ops when mainText has no lyric content', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[ti: song]\n[ar: artist]\n',
    })
    activeLine.value = 0
    mod.syncLine()
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })

  it('auto-advances activeLine to the next non-meta non-blank line when replay_after_sync is false', async () => {
    const { mod, activeLine, cfg, callbacks } = await setupSync({
      mainText: '[ti: song]\n[00:00.00]\nlyric one\nlyric two\n[00:05.00]\n',
      currentMs: 7000,
    })
    cfg.value.replay_after_sync = false
    activeLine.value = 2 // "lyric one"
    mod.syncLine()
    expect(activeLine.value).toBe(3) // advanced to "lyric two"
    expect(callbacks.setMainText).toHaveBeenCalled()
  })

  it('replays instead of advancing when cfg.replay_after_sync is true', async () => {
    const { mod, activeLine, cfg } = await setupSync({
      mainText: '[ti: song]\n[00:00.00]\nlyric one\nlyric two\n[00:05.00]\n',
      currentMs: 7000,
    })
    cfg.value.replay_after_sync = true
    activeLine.value = 2
    mod.syncLine()
    // replayActiveLine was called — activeLine stays at 2 (the synced line).
    expect(activeLine.value).toBe(2)
  })
})

describe('useSync — insertEndLine', () => {
  it('inserts a new trailing timestamp after activeLine', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric one\nlyric two\n',
      currentMs: 8000,
    })
    activeLine.value = 0
    mod.insertEndLine()
    expect(callbacks.setMainText).toHaveBeenCalled()
    const lines = mainText.value.split('\n')
    expect(lines[1]).toBe('[00:08.00]')
    expect(activeLine.value).toBe(1)
  })

  it('updates an existing trailing timestamp in place when activeLine is itself a trailing ts', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n[00:10.00]\n',
      currentMs: 8000,
    })
    activeLine.value = 1 // the existing trailing ts
    mod.insertEndLine()
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(mainText.value.split('\n')[1]).toBe('[00:08.00]')
    expect(activeLine.value).toBe(1)
  })

  it('updates the next trailing ts in place if activeLine is followed by one', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n[00:10.00]\n',
      currentMs: 8000,
    })
    activeLine.value = 0
    mod.insertEndLine()
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(mainText.value.split('\n')[1]).toBe('[00:08.00]')
  })

  it('no-ops when mainText has no lyric content', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[ti: meta]\n',
    })
    activeLine.value = 0
    mod.insertEndLine()
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })
})

describe('useSync — adjustTs', () => {
  it('offsets active line\'s ts by delta', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
    })
    activeLine.value = 0
    mod.adjustTs(100)
    expect(callbacks.setMainText).toHaveBeenCalled()
    expect(mainText.value.split('\n')[0]).toBe('[00:05.10] lyric')
  })

  it('offsets selected lines\' ts by delta when there is a selection', async () => {
    const { mod, mainText, activeLine, appState, callbacks } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    activeLine.value = 0
    // Add line 1 to the selection — adjustTs only modifies selected lines when
    // there is a selection (activeLine is NOT touched).
    appState.useAppState().selectedLines.value.add(1)
    mod.adjustTs(-100)
    expect(callbacks.setMainText).toHaveBeenCalled()
    const lines = mainText.value.split('\n')
    expect(lines[0]).toBe('[00:05.00] line one') // unchanged (not in selection)
    expect(lines[1]).toBe('[00:09.90] line two') // adjusted by -100ms
  })

  it('no-ops when active line has no timestamp', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: 'plain line\n',
    })
    activeLine.value = 0
    mod.adjustTs(100)
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })

  it('replays when cfg.replay_after_ts is true', async () => {
    const { mod, activeLine, cfg, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
    })
    cfg.value.replay_after_ts = true
    activeLine.value = 0
    mod.adjustTs(100)
    // replayActiveLine seeks to the active line's ts + offset.
    expect(callbacks.seekToMs).toHaveBeenCalled()
  })
})

describe('useSync — doSyncFile', () => {
  it('applies seek_offset to all timestamps', async () => {
    const { mod, mainText, seekOffset, callbacks } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    seekOffset.value!.value = '500'
    mod.doSyncFile()
    expect(callbacks.setMainText).toHaveBeenCalled()
    const lines = mainText.value.split('\n')
    expect(lines[0]).toBe('[00:05.50] line one')
    expect(lines[1]).toBe('[00:10.50] line two')
  })

  it('no-ops when seek_offset is 0', async () => {
    const { mod, callbacks } = await setupSync({
      mainText: '[00:05.00] line\n',
    })
    mod.doSyncFile()
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })
})

describe('useSync — tickSeekOffset / onSeekOffsetChange', () => {
  it('tickSeekOffset increments cfg.seek_offset + persists', async () => {
    const { mod, seekOffset, cfg } = await setupSync({})
    seekOffset.value!.value = '0'
    mod.tickSeekOffset(1000)
    expect(cfg.value.seek_offset).toBe(1000)
    expect(seekOffset.value!.value).toBe('1000')
    expect(localStorage.getItem('lbl_cfg')).toContain('"seek_offset":1000')
  })

  it('onSeekOffsetChange parses + persists', async () => {
    const { mod, seekOffset, cfg } = await setupSync({})
    const target = seekOffset.value!
    target.value = '-300'
    mod.onSeekOffsetChange({ target } as unknown as Event)
    expect(cfg.value.seek_offset).toBe(-300)
    expect(localStorage.getItem('lbl_cfg')).toContain('"seek_offset":-300')
  })

  it('onSeekOffsetChange reverts to cfg on NaN', async () => {
    const { mod, seekOffset, cfg } = await setupSync({})
    cfg.value.seek_offset = -600
    const target = seekOffset.value!
    target.value = 'not-a-number'
    mod.onSeekOffsetChange({ target } as unknown as Event)
    expect(target.value).toBe('-600') // reverted
  })
})

describe('useSync — seekPrevLine / seekNextLine', () => {
  it('seekPrevLine moves activeLine to the previous non-meta non-blank line', async () => {
    const { mod, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n[00:15.00] line three\n',
    })
    activeLine.value = 2
    mod.seekPrevLine()
    expect(activeLine.value).toBe(1)
  })

  it('seekNextLine moves activeLine to the next non-meta non-blank line', async () => {
    const { mod, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n[00:15.00] line three\n',
    })
    activeLine.value = 0
    mod.seekNextLine()
    expect(activeLine.value).toBe(1)
  })

  it('seekPrevLine no-ops at the first lyric line', async () => {
    const { mod, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    activeLine.value = 0
    mod.seekPrevLine()
    expect(activeLine.value).toBe(0)
  })

  it('seekNextLine no-ops at the last lyric line', async () => {
    const { mod, activeLine } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    activeLine.value = 1
    mod.seekNextLine()
    expect(activeLine.value).toBe(1)
  })

  it('seekPrevLine replays when cfg.replay_prev_line is true', async () => {
    const { mod, activeLine, cfg, callbacks } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    cfg.value.replay_prev_line = true
    activeLine.value = 1
    mod.seekPrevLine()
    expect(callbacks.seekToMs).toHaveBeenCalledWith(5000)
    expect(callbacks.playIfNotPlaying).toHaveBeenCalled()
  })

  it('seekNextLine replays when cfg.replay_next_line is true', async () => {
    const { mod, activeLine, cfg, callbacks } = await setupSync({
      mainText: '[00:05.00] line one\n[00:10.00] line two\n',
    })
    cfg.value.replay_next_line = true
    activeLine.value = 0
    mod.seekNextLine()
    expect(callbacks.seekToMs).toHaveBeenCalledWith(10000)
  })
})

describe('useSync — replayActiveLine', () => {
  it('seeks to the active line\'s ts + seek offset + plays', async () => {
    const { mod, activeLine, seekOffset, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
      audioReady: true,
    })
    activeLine.value = 0
    seekOffset.value!.value = '-600'
    mod.replayActiveLine(false)
    expect(callbacks.seekToMs).toHaveBeenCalledWith(Math.max(0, 5000 - 600))
    expect(callbacks.playIfNotPlaying).toHaveBeenCalled()
  })

  it('seeks to the next line\'s ts when seekEnd is true', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric one\n[00:10.00] lyric two\n',
      audioReady: true,
    })
    activeLine.value = 0
    mod.replayActiveLine(true)
    expect(callbacks.seekToMs).toHaveBeenCalledWith(10000)
  })

  it('no-ops when activeLine is -1', async () => {
    const { mod, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
    })
    mod.replayActiveLine(false)
    expect(callbacks.seekToMs).not.toHaveBeenCalled()
  })

  it('no-ops when audio is not ready', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
      audioReady: false,
    })
    activeLine.value = 0
    mod.replayActiveLine(false)
    expect(callbacks.seekToMs).not.toHaveBeenCalled()
  })
})

describe('useSync — updateActiveLineFromTime', () => {
  it('sets playingLine to the last line whose ts <= posMs', async () => {
    const { mod, playingLine } = await setupSync({
      mainText: '[00:05.00] one\n[00:10.00] two\n[00:15.00] three\n',
    })
    mod.updateActiveLineFromTime(12000)
    expect(playingLine.value).toBe(1)
  })

  it('no-ops when no line has ts <= posMs', async () => {
    const { mod, playingLine } = await setupSync({
      mainText: '[00:05.00] one\n',
    })
    mod.updateActiveLineFromTime(3000)
    expect(playingLine.value).toBe(-1)
  })

  it('no-ops when the best line is already the playing line', async () => {
    const { mod, playingLine, callbacks } = await setupSync({
      mainText: '[00:05.00] one\n[00:10.00] two\n',
    })
    playingLine.value = 0
    mod.updateActiveLineFromTime(7000)
    expect(callbacks.announce).not.toHaveBeenCalled()
  })
})

describe('useSync — onMainInput (typing mode)', () => {
  it('writes mainText + runs the side-effect chain', async () => {
    const { mod, mainText, mainTextarea, callbacks, hotkeyMode } = await setupSync({
      hotkeyMode: false,
    })
    hotkeyMode.value = false
    mainTextarea.value!.value = 'new content'
    mod.onMainInput({ target: mainTextarea.value } as unknown as Event)
    expect(mainText.value).toBe('new content')
    expect(callbacks.doAutosave).toHaveBeenCalled()
    expect(callbacks.checkLineCounts).toHaveBeenCalled()
    expect(callbacks.updateMergeBtn).toHaveBeenCalled()
    expect(callbacks.updateTitleFromText).toHaveBeenCalled()
  })

  it('skips undo debounce when a paste just happened', async () => {
    const { mod, mainTextarea, appState } = await setupSync({
      hotkeyMode: false,
    })
    const cb = vi.fn()
    mod.setOnInputCallback(cb)
    appState.useAppState().pasteJustHappened.value = true
    mainTextarea.value!.value = 'pasted content'
    mod.onMainInput({ target: mainTextarea.value } as unknown as Event)
    expect(cb).not.toHaveBeenCalled()
    expect(appState.useAppState().pasteJustHappened.value).toBe(false)
  })
})

describe('useSync — setOnInputCallback', () => {
  it('decouples useSync from useUndoRedo (no circular import)', async () => {
    const { mod } = await setupSync({})
    const cb = vi.fn()
    mod.setOnInputCallback(cb)
    expect(() => mod.setOnInputCallback(cb)).not.toThrow()
  })
})

describe('useSync — isAutoLineSuppressed / suppressAuto', () => {
  it('isAutoLineSuppressed returns false initially', async () => {
    const { mod } = await setupSync({})
    expect(mod.isAutoLineSuppressed()).toBe(false)
  })

  it('isAutoLineSuppressed returns true after seekPrevLine (which calls suppressAuto)', async () => {
    const { mod, activeLine } = await setupSync({
      mainText: '[00:05.00] one\n[00:10.00] two\n',
    })
    activeLine.value = 1
    mod.seekPrevLine()
    expect(mod.isAutoLineSuppressed()).toBe(true)
  })
})

describe('useSync — markAsTranslation', () => {
  it('no-ops when there is no trailing timestamp', async () => {
    const { mod, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric\n',
    })
    activeLine.value = 0
    mod.markAsTranslation()
    expect(callbacks.setMainText).not.toHaveBeenCalled()
  })

  it('normal mode stamps the next ts - 10ms onto the target line', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric one\n[00:10.00]\n',
    })
    activeLine.value = 0
    mod.markAsTranslation()
    expect(callbacks.setMainText).toHaveBeenCalled()
    // nextMs = 10000 (the trailing [00:10.00]); stamp = 10000 - 10 = 9990.
    expect(mainText.value.split('\n')[0]).toBe('[00:09.99] (lyric one)')
  })

  it('split mode peels trailing parens into separate lines', async () => {
    const { mod, mainText, activeLine, callbacks } = await setupSync({
      mainText: '[00:05.00] lyric (translation)\n[00:10.00]\n',
    })
    activeLine.value = 0
    // Enable split mode via the #main-split-check checkbox.
    const split = document.getElementById('main-split-check') as HTMLInputElement
    split.checked = true
    mod.markAsTranslation()
    expect(callbacks.setMainText).toHaveBeenCalled()
    const lines = mainText.value.split('\n')
    expect(lines[0]).toBe('[00:05.00] lyric')
    expect(lines[1]).toMatch(/^\[00:09\.99\] \(translation\)$/)
  })
})
