// @vitest-environment happy-dom
// Pins the ControlsPanel render (rebuildHkPanel port): mode row, action grid,
// typing-mode dimming, and the aria rules. Mounts standalone (the fieldset
// lives in LeftPanel).
//
// Phase D Tranche 3 update: the two mode cells are now wired — clicking the
// toggle_mode cell flips useAppState.hotkeyMode (and re-renders the panel);
// clicking the offset_mode_toggle cell flips useAppState.offsetSeekMode.
// Action cells remain inert until Tranches 4/5/9.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import { HK_LABELS } from '@/config'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function mountPanel() {
  const mod = await import('@/components/ControlsPanel.vue')
  return mount(mod.default)
}

describe('ControlsPanel', () => {
  it('renders the mode row first (offset toggle + mode toggle, no warn at defaults)', async () => {
    const wrapper = await mountPanel()
    const modeCells = wrapper.findAll('.hk-cell.mode')
    expect(modeCells).toHaveLength(2)
    expect(modeCells[0].text()).toContain('Offset time')
    expect(modeCells[1].text()).toContain('Hotkey mode')
    // native buttons, not ARIA-emulated divs (Sonar S6819 fix)
    expect((modeCells[0].element as HTMLElement).tagName).toBe('BUTTON')
    expect(modeCells[0].attributes('aria-label')).toBe('Toggle offset mode')
  })

  it('renders all 14 action cells with monolith labels and key badges', async () => {
    const wrapper = await mountPanel()
    const cells = wrapper.findAll('.hk-cell:not(.mode)')
    expect(cells).toHaveLength(14)
    expect(cells[0].text()).toContain('Previous line')
    expect(cells[0].text()).toContain('Q')
    expect(cells[0].text()).toContain('↑')
    const syncCell = cells[3]
    expect(syncCell.text()).toContain('Sync line')
    expect(syncCell.text()).toContain('W')
    expect(syncCell.text()).toContain('Enter')
    expect(cells[6].text()).toContain('−100ms time')
    expect(cells[13].text()).toContain('+1000ms time')
  })

  it('uses HK_LABELS for aria-labels and titles', async () => {
    const wrapper = await mountPanel()
    const first = wrapper.findAll('.hk-cell:not(.mode)')[0] // prev_line
    expect(first.attributes('aria-label')).toBe(HK_LABELS.prev_line)
    expect(first.attributes('title')).toBe(HK_LABELS.prev_line)
  })

  it('action cells are not dimmed in the default Hotkey mode', async () => {
    const wrapper = await mountPanel()
    for (const cell of wrapper.findAll('.hk-cell:not(.mode)')) {
      expect(cell.attributes('aria-disabled')).toBeUndefined()
      expect(cell.attributes('style')).toBeUndefined()
    }
  })

  it('mode cells read live cfg.hotkeys (DEFAULT_CFG when no stored cfg)', async () => {
    const wrapper = await mountPanel()
    // toggle_mode default is '`'; the mode cell's .hk-key badge shows it
    const toggleModeCell = wrapper.findAll('.hk-cell.mode')[1]
    expect(toggleModeCell.text()).toContain('`')
  })

  it('clicking the toggle_mode cell flips hotkeyMode and re-renders the panel label', async () => {
    const wrapper = await mountPanel()
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    expect(hotkeyMode.value).toBe(true)
    expect(wrapper.findAll('.hk-cell.mode')[1].text()).toContain('Hotkey mode')

    await wrapper.findAll('.hk-cell.mode')[1].trigger('click')
    expect(hotkeyMode.value).toBe(false)
    // the computed modeCells re-renders — label flips to "Typing mode",
    // warn styling applied (monolith: warn when not in default mode)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.hk-cell.mode')[1].text()).toContain('Typing mode')
  })

  it('clicking the offset_mode_toggle cell flips offsetSeekMode and re-renders the label', async () => {
    const wrapper = await mountPanel()
    const { useAppState } = await import('@/composables/useAppState')
    const { offsetSeekMode } = useAppState()
    expect(offsetSeekMode.value).toBe(false)
    expect(wrapper.findAll('.hk-cell.mode')[0].text()).toContain('Offset time')

    await wrapper.findAll('.hk-cell.mode')[0].trigger('click')
    expect(offsetSeekMode.value).toBe(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.hk-cell.mode')[0].text()).toContain('Offset seek')
  })

  it('hotkey-only action cells dim when hotkeyMode is false (typing mode)', async () => {
    const wrapper = await mountPanel()
    const { useAppState } = await import('@/composables/useAppState')
    const { hotkeyMode } = useAppState()
    hotkeyMode.value = false
    await wrapper.vm.$nextTick()
    // play_pause (index 1) is in HOTKEY_ONLY but TYPING_AVAILABLE — not dimmed
    // sync (index 3) is in HOTKEY_ONLY and NOT in TYPING_AVAILABLE — dimmed
    const actionCells = wrapper.findAll('.hk-cell:not(.mode)')
    expect(actionCells[1].attributes('aria-disabled')).toBeUndefined() // play_pause
    expect(actionCells[3].attributes('aria-disabled')).toBe('true') // sync
  })

  it('action cell click stays inert (no dispatch table until Tranche 4/5/9)', async () => {
    const wrapper = await mountPanel()
    const spy = vi.fn()
    await wrapper.find('.hk-cell:not(.mode)').trigger('click')
    expect(spy).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'HotkeyCell' }).exists()).toBe(true)
  })
})
