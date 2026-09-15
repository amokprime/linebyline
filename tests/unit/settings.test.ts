// @vitest-environment happy-dom
// Tests for useSettings — Phase D Tranche 8.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { DEFAULT_CFG, DEFAULT_META, HK_SECTIONS } from '@/config'
import type { SettingsFormValues } from '@/composables/useSettings'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

afterEach(() => {
  document.body.innerHTML = ''
})

async function makeProvider() {
  const { provideCfg } = await import('@/composables/useAppState')
  return defineComponent({
    setup() {
      provideCfg()
      return () => h('div', [h('div', { id: 'settings-win', class: 'settings-win' })])
    },
  })
}

// Each test dynamically imports useSettings + useAppState so vi.resetModules
// gives a fresh module instance (otherwise cfg state leaks across tests).
async function freshState() {
  const settings = await import('@/composables/useSettings')
  const appState = await import('@/composables/useAppState')
  return { settings, appState }
}

function makeForm(overrides: Partial<SettingsFormValues> = {}): SettingsFormValues {
  return {
    replay_prev_line: false,
    replay_next_line: false,
    replay_resume_current: false,
    replay_play_other: false,
    replay_after_offset: false,
    replay_after_sync: false,
    replay_after_ts: false,
    tiny_ms: 100,
    small_ms: 200,
    medium_ms: 400,
    large_ms: 1000,
    seek_increment_s: 5,
    speed_ratio: 1.1,
    vol_increment: 10,
    undo_debounce_ms: 150,
    default_meta: DEFAULT_META,
    ...overrides,
  }
}

describe('useSettings — display helpers', () => {
  it('captureDisplay returns the stored value (Esc for stored Escape)', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    cfg.value.hotkeys.toggle_mode = '`'
    expect(settings.captureDisplay('toggle_mode')).toBe('`')
    cfg.value.hotkeys.clear_sel = 'Escape'
    expect(settings.captureDisplay('clear_sel')).toBe('Esc')
    cfg.value.hotkeys.save = ''
    expect(settings.captureDisplay('save')).toBe('')
  })

  it('isClearVisible is true while focused, false otherwise', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    expect(settings.isClearVisible('toggle_mode')).toBe(false)
    settings.onCaptureFocus('toggle_mode')
    expect(settings.isClearVisible('toggle_mode')).toBe(true)
    settings.onCaptureBlur('toggle_mode')
    expect(settings.isClearVisible('toggle_mode')).toBe(false)
  })

  it('isResetVisible is true when live value differs from default', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    cfg.value.hotkeys.toggle_mode = 'A'
    expect(settings.isResetVisible('toggle_mode')).toBe(true)
    cfg.value.hotkeys.toggle_mode = '`'
    expect(settings.isResetVisible('toggle_mode')).toBe(false)
  })

  it('isResetVisible is true when a restriction warning is active', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    cfg.value.hotkeys.toggle_mode = '`'
    // 'F1' is in RESTRICTED_ALL.
    const e = new KeyboardEvent('keydown', { key: 'F1' })
    settings.onCaptureKeydown('toggle_mode', e)
    expect(settings.isResetVisible('toggle_mode')).toBe(true)
    expect(settings.restrictWarnText('toggle_mode')).not.toBe('')
  })

  it('isReplaceVisible is true only when a conflict is pending', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    // Press 'Ctrl+;' on save → conflicts with open (default 'Ctrl+;').
    const e = new KeyboardEvent('keydown', { key: ';', ctrlKey: true })
    settings.onCaptureKeydown('save', e)
    expect(settings.isReplaceVisible('save')).toBe(true)
    expect(settings.conflictMessage()).toContain('Open')
  })
})

describe('useSettings — capture input keydown', () => {
  it('Tab is preventDefaulted and not stopPropagation-blocked (focus trap moves focus)', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
    const sp = vi.spyOn(e, 'stopPropagation').mockImplementation(() => {})
    settings.onCaptureKeydown('toggle_mode', e)
    expect(pd).toHaveBeenCalled()
    expect(sp).not.toHaveBeenCalled()
  })

  it('ArrowUp/Down/Left/Right are preventDefaulted + not stopPropagated', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      const e = new KeyboardEvent('keydown', { key })
      const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
      const sp = vi.spyOn(e, 'stopPropagation').mockImplementation(() => {})
      settings.onCaptureKeydown('toggle_mode', e)
      expect(pd).toHaveBeenCalled()
      expect(sp).not.toHaveBeenCalled()
    }
  })

  it('Shift+Backspace clears the hotkey (unassigns)', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    expect(cfg.value.hotkeys.toggle_mode).toBe('`')
    const e = new KeyboardEvent('keydown', { key: 'Backspace', shiftKey: true })
    settings.onCaptureKeydown('toggle_mode', e)
    expect(cfg.value.hotkeys.toggle_mode).toBe('')
  })

  it('Escape reverts to last good value (clears conflict)', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    // Trigger a conflict first (save + Ctrl+; → open conflict).
    const conflictE = new KeyboardEvent('keydown', { key: ';', ctrlKey: true })
    settings.onCaptureKeydown('save', conflictE)
    expect(settings.conflictMessage()).not.toBe('')
    // Escape should clear.
    const escE = new KeyboardEvent('keydown', { key: 'Escape' })
    settings.onCaptureKeydown('save', escE)
    expect(settings.conflictMessage()).toBe('')
    expect(settings.isReplaceVisible('save')).toBe(false)
  })

  it('A clean key (no conflict) updates cfg.hotkeys and persists', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // '=' is unassigned + not restricted for save.
    const e = new KeyboardEvent('keydown', { key: '=' })
    settings.onCaptureKeydown('save', e)
    expect(cfg.value.hotkeys.save).toBe('=')
    expect(localStorage.getItem('lbl_cfg')).toContain('"save":"="')
  })

  it('A conflict sets the Swap button visible and stores the pending key', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // 'Ctrl+;' conflicts with open (default).
    const e = new KeyboardEvent('keydown', { key: ';', ctrlKey: true })
    settings.onCaptureKeydown('save', e)
    expect(cfg.value.hotkeys.save).toBe("Ctrl+'") // unchanged
    expect(settings.isReplaceVisible('save')).toBe(true)
    expect(settings.conflictMessage()).toContain('Open')
  })

  it('A restricted key sets the warning without changing the stored value', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // 'F1' is in RESTRICTED_ALL.
    const e = new KeyboardEvent('keydown', { key: 'F1' })
    settings.onCaptureKeydown('toggle_mode', e)
    expect(cfg.value.hotkeys.toggle_mode).toBe('`') // unchanged
    expect(settings.restrictWarnText('toggle_mode')).not.toBe('')
    expect(settings.isResetVisible('toggle_mode')).toBe(true)
  })

  it('Plain letters trigger restriction for toggle_mode (ALPHA_NUM_SPACE_RE)', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    const e = new KeyboardEvent('keydown', { key: 'T' })
    settings.onCaptureKeydown('toggle_mode', e)
    expect(cfg.value.hotkeys.toggle_mode).toBe('`') // unchanged (restriction)
    expect(settings.restrictWarnText('toggle_mode')).not.toBe('')
  })

  it('Modifier-only keys (Ctrl/Shift/Alt alone) do nothing', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    for (const key of ['Control', 'Shift', 'Alt', 'Meta']) {
      const e = new KeyboardEvent('keydown', { key })
      settings.onCaptureKeydown('toggle_mode', e)
      expect(cfg.value.hotkeys.toggle_mode).toBe('`') // unchanged
    }
  })
})

describe('useSettings — clear/reset/swap actions', () => {
  it('clearHotkey unassigns + persists', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    settings.clearHotkey('toggle_mode', false)
    expect(cfg.value.hotkeys.toggle_mode).toBe('')
    expect(localStorage.getItem('lbl_cfg')).toContain('"toggle_mode":""')
  })

  it('resetHotkey restores the default + persists', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    cfg.value.hotkeys.toggle_mode = '='
    settings.resetHotkey('toggle_mode')
    expect(cfg.value.hotkeys.toggle_mode).toBe('`')
  })

  it('resetHotkey uses the swap pattern when another action holds the default', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // Set toggle_mode to the value save uses by default ("Ctrl+'").
    cfg.value.hotkeys.toggle_mode = "Ctrl+'"
    settings.resetHotkey('save')
    expect(cfg.value.hotkeys.save).toBe("Ctrl+'")
    expect(cfg.value.hotkeys.toggle_mode).toBe('`')
  })

  it('swapHotkey exchanges the conflicting hotkeys (no blanks)', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // Press 'Ctrl+;' on save → conflict with open.
    const e = new KeyboardEvent('keydown', { key: ';', ctrlKey: true })
    settings.onCaptureKeydown('save', e)
    settings.swapHotkey('save')
    expect(cfg.value.hotkeys.save).toBe('Ctrl+;')
    expect(cfg.value.hotkeys.open).toBe("Ctrl+'")
    expect(settings.conflictMessage()).toBe('')
  })
})

describe('useSettings — search/filter', () => {
  it('empty query shows everything', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchQuery('')
    expect(settings.isRowHidden('toggle_mode')).toBe(false)
    expect(settings.isSectionHidden('Hotkeys', HK_SECTIONS.flatMap((s) => s.keys))).toBe(false)
    expect(settings.isNonHkRowHidden('Instant Replay')).toBe(false)
  })

  it('text search hides rows whose label does not contain the query', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(false)
    settings.setSearchQuery('toggle')
    expect(settings.isRowHidden('toggle_mode')).toBe(false) // label "Toggle mode" matches
    expect(settings.isRowHidden('play_pause')).toBe(true)
  })

  it('hotkey mode hides all non-hotkey rows but keeps the Hotkeys section', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(true)
    settings.setSearchQuery('`')
    expect(settings.isNonHkRowHidden('Instant Replay')).toBe(true)
    expect(settings.isNonHkRowHidden('Intervals')).toBe(true)
    expect(settings.isSectionHidden('Hotkeys', HK_SECTIONS.flatMap((s) => s.keys))).toBe(false)
    expect(settings.isSectionHidden('Instant Replay', [])).toBe(true)
  })

  it('hotkey mode shows only rows whose stored hotkey matches', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(true)
    settings.setSearchQuery('`')
    expect(settings.isRowHidden('toggle_mode')).toBe(false) // stored '`' matches
    expect(settings.isRowHidden('play_pause')).toBe(true) // stored 'Space' does not match
  })

  it('SearchKeydown Escape exits hk mode', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(true)
    const e = new KeyboardEvent('keydown', { key: 'Escape' })
    const pd = vi.spyOn(e, 'preventDefault').mockImplementation(() => {})
    settings.onSearchKeydown(e)
    expect(settings.searchHkMode()).toBe(false)
    expect(pd).toHaveBeenCalled()
  })

  it('SearchKeydown toggle_mode key switches to hk mode', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(false)
    // toggle_mode's default is '`'.
    const e = new KeyboardEvent('keydown', { key: '`' })
    settings.onSearchKeydown(e)
    expect(settings.searchHkMode()).toBe(true)
  })

  it('SearchKeydown reset_defaults key shows the reset confirm', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchHkMode(false)
    // reset_defaults default is 'Ctrl+\\'.
    const e = new KeyboardEvent('keydown', { key: '\\', ctrlKey: true })
    settings.onSearchKeydown(e)
    expect(settings.isResetConfirmVisible()).toBe(true)
  })
})

describe('useSettings — saveSettingsNow', () => {
  it('writes form values to cfg + persists', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    settings.saveSettingsNow(makeForm({ tiny_ms: 50, small_ms: 100, default_meta: '[ti: Test]' }))
    expect(cfg.value.tiny_ms).toBe(50)
    expect(cfg.value.small_ms).toBe(100)
    expect(cfg.value.default_meta).toBe('[ti: Test]')
    expect(localStorage.getItem('lbl_cfg')).toContain('"tiny_ms":50')
  })

  it('clamps speed_ratio to [1.01, 2]', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    settings.saveSettingsNow(makeForm({ speed_ratio: 5 }))
    expect(cfg.value.speed_ratio).toBe(2)
    settings.saveSettingsNow(makeForm({ speed_ratio: 0.5 }))
    expect(cfg.value.speed_ratio).toBe(1.01)
  })

  it('falls back to default 5 for seek_increment_s when input is 0 (monolith parity)', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    // The monolith's `+value || 5` falls back to 5 when the input is 0/blank.
    settings.saveSettingsNow(makeForm({ seek_increment_s: 0 }))
    expect(cfg.value.seek_increment_s).toBe(5)
  })
})

describe('useSettings — reset confirm flow', () => {
  it('showResetConfirm sets the visible flag', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    expect(settings.isResetConfirmVisible()).toBe(false)
    settings.showResetConfirm()
    expect(settings.isResetConfirmVisible()).toBe(true)
    settings.hideResetConfirm()
    expect(settings.isResetConfirmVisible()).toBe(false)
  })

  it('doResetDefaults restores DEFAULT_CFG', async () => {
    const { settings, appState } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const { cfg } = appState.useAppState()
    cfg.value.tiny_ms = 999
    cfg.value.hotkeys.toggle_mode = '='
    settings.doResetDefaults()
    expect(cfg.value.tiny_ms).toBe(DEFAULT_CFG.tiny_ms)
    expect(cfg.value.hotkeys.toggle_mode).toBe(DEFAULT_CFG.hotkeys.toggle_mode)
  })

  it('doResetDefaults fires the registered callbacks (font, speed, seek-offset)', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    const calls: string[] = []
    settings.setResetCallbacks({
      resetEditorFont: () => calls.push('font'),
      resetSpeed: () => calls.push('speed'),
      resetSeekOffsetDisplay: () => calls.push('seek'),
    })
    settings.doResetDefaults()
    expect(calls).toEqual(['font', 'speed', 'seek'])
  })
})

describe('useSettings — initSettings', () => {
  it('initSettings resets search query, hk mode, conflict, confirm, row states', async () => {
    const { settings } = await freshState()
    mount(await makeProvider())
    settings.initSettings()
    settings.setSearchQuery('foo')
    settings.setSearchHkMode(true)
    settings.showResetConfirm()
    // Trigger a conflict to populate row state.
    const e = new KeyboardEvent('keydown', { key: ';', ctrlKey: true })
    settings.onCaptureKeydown('save', e)
    settings.initSettings()
    expect(settings.searchQuery()).toBe('')
    expect(settings.searchHkMode()).toBe(false)
    expect(settings.conflictMessage()).toBe('')
    expect(settings.isResetConfirmVisible()).toBe(false)
    expect(settings.isReplaceVisible('save')).toBe(false)
  })
})
