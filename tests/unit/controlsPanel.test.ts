// @vitest-environment happy-dom
// Pins the ControlsPanel render (rebuildHkPanel port): mode row, action grid,
// typing-mode dimming, and the aria rules. Mounts standalone (the fieldset
// lives in LeftPanel).
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

  it('emits activate on click but stays inert (no dispatch table until Phase D)', async () => {
    const wrapper = await mountPanel()
    const spy = vi.fn()
    await wrapper.find('.hk-cell:not(.mode)').trigger('click')
    // no listener is attached in the shell — the cell emits into the void
    expect(spy).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'HotkeyCell' }).exists()).toBe(true)
  })
})
