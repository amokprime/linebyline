// @vitest-environment happy-dom
// Pins the tranche-3 layout shells: LeftPanel (audio-box + controls-box
// structure, collapse wiring) and EditorArea (main field column structure).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('LeftPanel', () => {
  async function mountPanel() {
    const mod = await import('@/components/LeftPanel.vue')
    return mount(mod.default)
  }

  it('renders the audio-box structure with the monolith defaults', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('#now-playing-label').text()).toBe('Now playing')
    expect(wrapper.find('#song-title').text()).toBe('Unknown Title')
    expect(wrapper.find('#song-artist').text()).toBe('Unknown Artist')
    const progress = wrapper.find('#progress-wrap')
    expect(progress.attributes('role')).toBe('slider')
    expect(progress.attributes('aria-valuemax')).toBe('100')
    expect(progress.attributes('aria-valuetext')).toBe('0:00 of 0:00')
    expect(wrapper.find('#btn-play-pause').exists()).toBe(true)
    expect(wrapper.find('#vol-slider').attributes('aria-label')).toBe('Volume')
    expect(wrapper.find('#vol-pct').text()).toBe('100%')
    expect(wrapper.find('#sync-file-btn').text()).toContain('Sync file')
    // rebuildHkPanel appends the sync_file hotkey badge to the button
    expect(wrapper.find('#sync-file-btn .hk-key').text()).toBe('Ctrl+I')
  })

  it('renders the controls-box with the hotkey grid (ControlsPanel fills it)', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('#controls-label').text()).toBe('Controls')
    const grid = wrapper.find('#hk-grid')
    // the mode row is the first grid child, then the 14 action cells
    expect((grid.element as HTMLElement).firstElementChild?.className).toContain('mode-row')
    expect(grid.findAll('.hk-cell')).toHaveLength(16)
    expect(grid.findAll('.hk-cell.mode')).toHaveLength(2)
  })

  it('collapses via the header button: .collapsed class + inert + persisted', async () => {
    const wrapper = await mountPanel()
    const panel = wrapper.find('#left-panel')
    expect(panel.classes()).not.toContain('collapsed')
    await wrapper.find('#btn-collapse-panel').trigger('click')
    expect(panel.classes()).toContain('collapsed')
    expect(panel.attributes('inert')).toBeDefined()
    expect(localStorage.getItem('lbl_panel_collapsed')).toBe('1')
  })
})

describe('EditorArea', () => {
  async function mountArea() {
    const mod = await import('@/components/EditorArea.vue')
    return mount(mod.default)
  }

  it('renders the main field column with header toggles and an empty lyric area', async () => {
    const wrapper = await mountArea()
    expect(wrapper.find('.field-header-label').text()).toBe('Main')
    const paren = wrapper.find('#main-paren-check')
    const split = wrapper.find('#main-split-check')
    expect((paren.element as HTMLInputElement).checked).toBe(true)
    expect((split.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.find('#main-warn').attributes('role')).toBe('alert')
    expect(wrapper.find('#main-lines').element.children).toHaveLength(0)
    expect(wrapper.find('#main-textarea').attributes('aria-label')).toBe('Main lyric text')
  })

  it('checkboxes stay unbound until Phase D wires config state', async () => {
    const wrapper = await mountArea()
    await wrapper.find('#main-paren-check').setValue(false)
    // the shell has no handler: the DOM value flips but no persistence occurs
    expect((wrapper.find('#main-paren-check').element as HTMLInputElement).checked).toBe(false)
    expect(localStorage).toHaveLength(0)
  })
})
