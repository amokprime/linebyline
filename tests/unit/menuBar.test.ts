// @vitest-environment happy-dom
// Pins the MenuBar shell: full monolith button set, initial disabled states,
// help/issues links, theme toggle wiring, the focus-prevention mousedown
// (clicking a menu button must not steal focus from the editor), and the
// embedded FontSelector.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function mountBar() {
  const mod = await import('@/components/MenuBar.vue')
  return mount(mod.default)
}

describe('menu bar shell', () => {
  it('renders the full monolith button set with accessible names', async () => {
    const wrapper = await mountBar()
    for (const sel of ['#btn-import', '#btn-save', '#btn-undo', '#btn-redo', '#btn-settings', '#btn-theme']) {
      expect(wrapper.find(sel).exists(), sel).toBe(true)
    }
    expect(wrapper.find('#btn-import').attributes('aria-label')).toBe('Open file')
    expect(wrapper.find('#btn-save').attributes('aria-label')).toBe('Save')
    expect(wrapper.find('#btn-undo').attributes('aria-label')).toBe('Undo')
    expect(wrapper.find('#btn-redo').attributes('aria-label')).toBe('Redo')
    expect(wrapper.find('#btn-settings').attributes('aria-label')).toBe('Settings')
    // text buttons take their accessible name from their visible text
    expect(wrapper.text()).toContain('Add field')
    expect(wrapper.text()).toContain('Hide field')
    expect(wrapper.text()).toContain('Merge fields')
    expect(wrapper.find('nav#menu-bar').attributes('aria-label')).toBe('Main toolbar')
  })

  it('starts with Hide field and Merge fields disabled (monolith initial state)', async () => {
    const wrapper = await mountBar()
    const buttons = wrapper.findAll('button')
    const hideField = buttons.find((b) => b.text() === 'Hide field')!
    const merge = buttons.find((b) => b.text() === 'Merge fields')!
    expect(hideField.attributes('disabled')).toBeDefined()
    expect(hideField.attributes('aria-disabled')).toBe('true')
    expect(merge.attributes('disabled')).toBeDefined()
    expect(merge.attributes('aria-disabled')).toBe('true')
  })

  it('links Help and Issues to GitHub with noopener', async () => {
    const wrapper = await mountBar()
    const help = wrapper.find('#btn-help')
    const issues = wrapper.find('#btn-issues')
    expect(help.attributes('href')).toContain('linebyline/blob/main/HELP.md')
    expect(issues.attributes('href')).toContain('linebyline/issues')
    for (const a of [help, issues]) {
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener')
    }
  })

  it('embeds the FontSelector with both font options', async () => {
    const wrapper = await mountBar()
    const select = wrapper.find('#font-select')
    expect(select.exists()).toBe(true)
    expect(select.findAll('option')).toHaveLength(2)
    expect(wrapper.find('#font-size-inp').attributes('min')).toBe('8')
    expect(wrapper.find('#fs-up').exists()).toBe(true)
    expect(wrapper.find('#fs-down').exists()).toBe(true)
  })
})

describe('theme toggle', () => {
  it('shows the target-mode icon and cycles theme on click', async () => {
    const wrapper = await mountBar()
    const themeBtn = wrapper.find('#btn-theme')
    expect(themeBtn.text()).toBe('🌙')
    await themeBtn.trigger('click')
    expect(themeBtn.text()).toBe('☀️')
    expect(localStorage.getItem('lbl_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    await themeBtn.trigger('click')
    expect(themeBtn.text()).toBe('🌙')
    expect(localStorage.getItem('lbl_theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('mousedown focus prevention', () => {
  it('prevents default when the press starts on a button (editor keeps focus)', async () => {
    const wrapper = await mountBar()
    const btn = wrapper.find('#btn-import').element
    const onButton = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    btn.dispatchEvent(onButton)
    expect(onButton.defaultPrevented).toBe(true)
    const sep = wrapper.find('.mb-sep').element
    const onSep = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    sep.dispatchEvent(onSep)
    expect(onSep.defaultPrevented).toBe(false)
  })
})
