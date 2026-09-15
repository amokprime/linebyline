// @vitest-environment happy-dom
// Tests for useGlobalHotkeys — Phase D Tranche 9.
// Verifies the document-level keydown handler dispatches to the right action
// based on cfg.hotkeys + the focused-UI guard + repeat-key guard + typing-mode
// arrow override + settings focus trap.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  // Reset the mocks between tests so call counts don't leak.
  for (const k of Object.keys(mocks)) {
    ;(mocks as Record<string, ReturnType<typeof vi.fn>>)[k]!.mockClear()
  }
})
afterEach(() => {
  document.body.innerHTML = ''
  // Remove the global keydown listener (otherwise it leaks across tests).
  if (_lastHandler) {
    document.removeEventListener('keydown', _lastHandler)
    _lastHandler = null
  }
})

let _lastHandler: ((e: KeyboardEvent) => void) | null = null

// Mocks for the composables that useGlobalHotkeys imports — we want to verify
// the dispatch happens, not that the action itself runs correctly.
const mocks = {
  togglePlay: vi.fn(),
  doSeekBack: vi.fn(),
  doSeekFwd: vi.fn(),
  toggleMute: vi.fn(),
  changeSpeed: vi.fn(),
  syncLine: vi.fn(),
  insertEndLine: vi.fn(),
  seekPrevLine: vi.fn(),
  seekNextLine: vi.fn(),
  replayActiveLine: vi.fn(),
  adjustTs: vi.fn(),
  markAsTranslation: vi.fn(),
  doSyncFile: vi.fn(),
  setOffsetMode: vi.fn(),
  toggleMode: vi.fn(),
  addSecondary: vi.fn(),
  removeSecondary: vi.fn(),
  mergeTranslations: vi.fn(),
  doImport: vi.fn(),
  doSave: vi.fn(),
  cycleTheme: vi.fn(),
  doUndo: vi.fn(),
  doRedo: vi.fn(),
}

vi.mock('@/composables/useAudio', () => ({
  togglePlay: mocks.togglePlay,
  doSeekBack: mocks.doSeekBack,
  doSeekFwd: mocks.doSeekFwd,
  toggleMute: mocks.toggleMute,
  changeSpeed: mocks.changeSpeed,
  useAudio: () => ({
    masterVolume: { value: 1 },
    muted: { value: false },
    speedDisplay: { value: '1' },
    progressPct: { value: 0 },
    timePosText: { value: '0:00' },
    timeDurText: { value: '0:00' },
    ariaValueNow: { value: 0 },
    ariaValueText: { value: '0:00 of 0:00' },
    playing: { value: false },
    togglePlay: mocks.togglePlay,
    toggleMute: mocks.toggleMute,
    onVolInput: vi.fn(),
    onVolWheel: vi.fn(),
    onSpeedChange: vi.fn(),
    changeSpeed: mocks.changeSpeed,
    doSeekBack: mocks.doSeekBack,
    doSeekFwd: mocks.doSeekFwd,
    mountProgressDrag: vi.fn(),
    initAudio: vi.fn(),
    setAudioCallbacks: vi.fn(),
    useAudio: () => ({}),
    restoreAudioDisplay: vi.fn(),
    setupAudio: vi.fn(),
    audioEl: { value: null },
    lastPlayingLine: { value: -1 },
    currentMs: () => 0,
  }),
}))

vi.mock('@/composables/useSync', () => ({
  syncLine: mocks.syncLine,
  insertEndLine: mocks.insertEndLine,
  seekPrevLine: mocks.seekPrevLine,
  seekNextLine: mocks.seekNextLine,
  replayActiveLine: mocks.replayActiveLine,
  adjustTs: mocks.adjustTs,
  markAsTranslation: mocks.markAsTranslation,
  doSyncFile: mocks.doSyncFile,
  setOffsetMode: mocks.setOffsetMode,
  isAutoLineSuppressed: () => false,
  renderMainLines: vi.fn(),
  scrollToActive: vi.fn(),
  scrollToPlaying: vi.fn(),
  updateActiveLineFromTime: vi.fn(),
  setOnInputCallback: vi.fn(),
  setSyncCallbacks: vi.fn(),
  setSeekOffsetRef: vi.fn(),
  onMainInput: vi.fn(),
  onMainPaste: vi.fn(),
  onMainLinesPaste: vi.fn(),
  onMainLinesMouseDown: vi.fn(),
  onMainLinesContextMenu: vi.fn(),
  onSeekOffsetChange: vi.fn(),
  tickSeekOffset: vi.fn(),
  initSync: vi.fn(),
  useSync: () => ({}),
}))

vi.mock('@/composables/useModeSwitch', () => ({
  toggleMode: mocks.toggleMode,
  toggleOffsetSeek: vi.fn(),
  applyMode: vi.fn(),
  initModeSwitch: vi.fn(),
  setModeSwitchRenderMainLines: vi.fn(),
}))

vi.mock('@/composables/useMerge', () => ({
  addSecondary: mocks.addSecondary,
  removeSecondary: mocks.removeSecondary,
  mergeTranslations: mocks.mergeTranslations,
  computeMergeBtnDisabled: () => false,
  checkLineCounts: vi.fn(),
  updateMergeBtn: vi.fn(),
  syncSecScroll: vi.fn(),
  syncScrollFrom: vi.fn(),
  initMerge: vi.fn(),
  onSecInput: vi.fn(),
  onSecPaste: vi.fn(),
  onSecKeydown: vi.fn(),
  onSecFileImport: vi.fn(),
  useMerge: () => ({}),
}))

vi.mock('@/composables/useImport', () => ({
  doImport: mocks.doImport,
  doSave: mocks.doSave,
  initImport: vi.fn(),
  setFilePickerRef: vi.fn(),
  onFilePickerChange: vi.fn(),
  onMiddleClick: vi.fn(),
  useImport: () => ({}),
}))

vi.mock('@/composables/useTheme', () => ({
  cycleTheme: mocks.cycleTheme,
  useTheme: () => ({
    themeMode: { value: 'light' },
    applyTheme: vi.fn(),
    cycleTheme: mocks.cycleTheme,
  }),
}))

async function freshSetup(opts: {
  settingsOpen?: boolean
  hotkeyMode?: boolean
} = {}) {
  const appState = await import('@/composables/useAppState')
  const gh = await import('@/composables/useGlobalHotkeys')
  const { cfg, hotkeyMode } = appState.useAppState()
  hotkeyMode.value = opts.hotkeyMode ?? true

  const settingsOpen = { value: opts.settingsOpen ?? false }
  gh.initGlobalHotkeys({
    isSettingsOpen: () => settingsOpen.value,
    toggleSettings: () => {
      settingsOpen.value = !settingsOpen.value
    },
    openHelp: vi.fn(),
    openIssues: vi.fn(),
    doUndo: mocks.doUndo,
    doRedo: mocks.doRedo,
  })

  // Attach the global keydown handler to document (App.vue does this in
  // onMounted; the test must mirror that wiring or the handler won't fire).
  _lastHandler = gh.onGlobalKeydown
  document.addEventListener('keydown', _lastHandler)

  // Mount a fake shell with #main-textarea + #main-lines + #main-scroll
  // so the focused-UI guard recognizes them as the lyric area.
  const Shell = defineComponent({
    setup() {
      const { provideCfg } = appState
      provideCfg()
      return () =>
        h('div', [
          h('textarea', { id: 'main-textarea' }),
          h('div', { id: 'main-lines' }),
          h('div', { id: 'main-scroll' }),
          h('div', { id: 'settings-win', class: 'settings-win' }, [
            h('input', { id: 's-search' }),
            h('button', { id: 's-confirm-yes' }),
          ]),
        ])
    },
  })
  mount(Shell, { attachTo: document.body })

  return { cfg, hotkeyMode, settingsOpen, gh }
}

function dispatch(key: string, opts: KeyboardEventInit = {}) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, ...opts })
  const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
  document.dispatchEvent(e)
  return { e, pd }
}

describe('useGlobalHotkeys — global hotkey dispatch (both modes)', () => {
  it('Ctrl+S default hotkey (Ctrl+\') triggers doSave', async () => {
    await freshSetup()
    const { pd } = dispatch("'", { ctrlKey: true })
    expect(mocks.doSave).toHaveBeenCalled()
    expect(pd).toHaveBeenCalled()
  })

  it('Ctrl+; triggers doImport (open hotkey)', async () => {
    await freshSetup()
    dispatch(';', { ctrlKey: true })
    expect(mocks.doImport).toHaveBeenCalled()
  })

  it('Ctrl+M triggers toggleMute (hardcoded, not remappable)', async () => {
    await freshSetup()
    dispatch('m', { ctrlKey: true })
    expect(mocks.toggleMute).toHaveBeenCalled()
  })

  it('Ctrl+Z triggers doUndo', async () => {
    await freshSetup()
    dispatch('z', { ctrlKey: true })
    expect(mocks.doUndo).toHaveBeenCalled()
  })

  it('Ctrl+Y triggers doRedo', async () => {
    await freshSetup()
    dispatch('y', { ctrlKey: true })
    expect(mocks.doRedo).toHaveBeenCalled()
  })
})

describe('useGlobalHotkeys — settings-layer hotkeys', () => {
  it('Ctrl+, toggles settings open', async () => {
    const { settingsOpen } = await freshSetup({ settingsOpen: false })
    dispatch(',', { ctrlKey: true })
    expect(settingsOpen.value).toBe(true)
  })

  it('Ctrl+, toggles settings closed', async () => {
    const { settingsOpen } = await freshSetup({ settingsOpen: true })
    dispatch(',', { ctrlKey: true })
    expect(settingsOpen.value).toBe(false)
  })

  it('Ctrl+. triggers cycleTheme even when settings is open', async () => {
    await freshSetup({ settingsOpen: true })
    dispatch('.', { ctrlKey: true })
    expect(mocks.cycleTheme).toHaveBeenCalled()
  })

  it('Escape closes settings when open', async () => {
    const { settingsOpen } = await freshSetup({ settingsOpen: true })
    // Focus the body (not a capture input) so Escape closes.
    document.body.focus()
    dispatch('Escape')
    expect(settingsOpen.value).toBe(false)
  })

  it('Reset_defaults hotkey shows the confirm even when settings is closed', async () => {
    const { settingsOpen } = await freshSetup({ settingsOpen: false })
    dispatch('\\', { ctrlKey: true })
    expect(settingsOpen.value).toBe(true)
  })
})

describe('useGlobalHotkeys — focused-UI guard', () => {
  it('Non-Ctrl hotkey dispatch is suppressed when a button outside lyric area has focus', async () => {
    await freshSetup({ hotkeyMode: true })
    // Create a button + focus it.
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    btn.focus()
    // W (sync) is a hotkey-mode action; it should NOT fire while a button is focused
    // (the focused-UI guard suppresses it because no Ctrl/Alt modifier).
    dispatch('w')
    expect(mocks.syncLine).not.toHaveBeenCalled()
  })

  it('Ctrl-key dispatch still fires even when a button has focus', async () => {
    await freshSetup()
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    btn.focus()
    dispatch("'", { ctrlKey: true })
    // doSave fires because e.ctrlKey is true (intentional shortcut).
    expect(mocks.doSave).toHaveBeenCalled()
  })

  it('Escape blurs the focused UI element', async () => {
    await freshSetup()
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    btn.focus()
    expect(document.activeElement).toBe(btn)
    dispatch('Escape')
    expect(document.activeElement).not.toBe(btn)
  })
})

describe('useGlobalHotkeys — hotkey-mode-only dispatch', () => {
  it('Space triggers togglePlay in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch(' ')
    expect(mocks.togglePlay).toHaveBeenCalled()
  })

  it('Space does NOT trigger togglePlay in typing mode (not bound)', async () => {
    await freshSetup({ hotkeyMode: false })
    dispatch(' ')
    expect(mocks.togglePlay).not.toHaveBeenCalled()
  })

  it('W triggers syncLine in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('w')
    expect(mocks.syncLine).toHaveBeenCalled()
  })

  it('T triggers insertEndLine in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('t')
    expect(mocks.insertEndLine).toHaveBeenCalled()
  })

  it('Q triggers seekPrevLine in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('q')
    expect(mocks.seekPrevLine).toHaveBeenCalled()
  })

  it('E triggers seekNextLine in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('e')
    expect(mocks.seekNextLine).toHaveBeenCalled()
  })

  it('A triggers adjustTs(-small_ms) in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('a')
    expect(mocks.adjustTs).toHaveBeenCalledWith(-200)
  })

  it('F triggers adjustTs(+small_ms) in hotkey mode', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch('f')
    expect(mocks.adjustTs).toHaveBeenCalledWith(200)
  })

  it('Enter triggers syncLine in hotkey mode when activeLine >= 0', async () => {
    await freshSetup({ hotkeyMode: true })
    const { activeLine } = (await import('@/composables/useAppState')).useAppState()
    activeLine.value = 0
    dispatch('Enter')
    expect(mocks.syncLine).toHaveBeenCalled()
  })

  it('R triggers replayActiveLine(false) in hotkey mode when activeLine >= 0', async () => {
    await freshSetup({ hotkeyMode: true })
    const { activeLine } = (await import('@/composables/useAppState')).useAppState()
    activeLine.value = 0
    dispatch('r')
    expect(mocks.replayActiveLine).toHaveBeenCalledWith(false)
  })
})

describe('useGlobalHotkeys — typing-mode arrow override', () => {
  it('ArrowUp triggers seekPrevLine in typing mode when body is focused', async () => {
    await freshSetup({ hotkeyMode: false })
    document.body.focus()
    dispatch('ArrowUp')
    expect(mocks.seekPrevLine).toHaveBeenCalled()
  })

  it('ArrowDown triggers seekNextLine in typing mode when body is focused', async () => {
    await freshSetup({ hotkeyMode: false })
    document.body.focus()
    dispatch('ArrowDown')
    expect(mocks.seekNextLine).toHaveBeenCalled()
  })

  it('ArrowUp does NOT trigger seekPrevLine when a textarea has focus', async () => {
    await freshSetup({ hotkeyMode: false })
    const ta = document.getElementById('main-textarea') as HTMLTextAreaElement
    ta.focus()
    dispatch('ArrowUp')
    expect(mocks.seekPrevLine).not.toHaveBeenCalled()
  })
})

describe('useGlobalHotkeys — repeat-key guard', () => {
  it('Repeat key for togglePlay (Space) is suppressed', async () => {
    await freshSetup({ hotkeyMode: true })
    dispatch(' ', { repeat: true })
    expect(mocks.togglePlay).not.toHaveBeenCalled()
  })

  it('Repeat key for arrow keys is allowed', async () => {
    await freshSetup({ hotkeyMode: false })
    document.body.focus()
    dispatch('ArrowUp', { repeat: true })
    expect(mocks.seekPrevLine).toHaveBeenCalled()
  })
})

describe('useGlobalHotkeys — updateDynamicTooltips', () => {
  it('writes title attributes to the menu-bar + left-panel buttons', async () => {
    const { gh } = await freshSetup()
    // Create the buttons that updateDynamicTooltips targets.
    const ids = [
      'btn-import', 'btn-save', 'btn-undo', 'btn-redo', 'btn-add-sec',
      'btn-remove-sec', 'merge-btn', 'btn-theme', 'btn-settings', 'btn-help',
      'btn-issues', 'sync-file-btn', 'speed-down-btn', 'speed-up-btn',
      'btn-seek-back', 'btn-seek-fwd', 'btn-play-pause', 'main-paren-label',
    ]
    for (const id of ids) {
      const el = document.createElement(id === 'main-paren-label' ? 'label' : 'button')
      el.id = id
      document.body.appendChild(el)
    }
    gh.updateDynamicTooltips()
    const save = document.getElementById('btn-save')
    expect(save?.title).toContain('Save')
    expect(save?.title).toContain("Ctrl+'")
    const undo = document.getElementById('btn-undo')
    expect(undo?.title).toContain('Undo')
    expect(undo?.title).toContain('Ctrl+Z')
  })
})
