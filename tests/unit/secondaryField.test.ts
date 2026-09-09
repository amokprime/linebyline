// @vitest-environment happy-dom
// Pins the tranche-6 SecondaryField shell: one secondary field column ported
// from the monolith's addSecondary() DOM construction, inert until Phase D.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('SecondaryField', () => {
  async function mountField(index = 1) {
    const mod = await import('@/components/SecondaryField.vue')
    return mount(mod.default, { props: { index } })
  }

  it('renders the field column with the positional header label', async () => {
    const wrapper = await mountField(2)
    expect(wrapper.find('.field-header-label').text()).toBe('Secondary 2')
    expect(wrapper.find('.field-header').attributes('aria-label')).toBe(
      'Secondary 2 field header',
    )
  })

  it('renders the import button and paren toggle in the header right group', async () => {
    const wrapper = await mountField()
    const btn = wrapper.find('.fh-btn')
    expect(btn.text()).toBe('📂')
    expect(btn.attributes('aria-label')).toBe('Import secondary lyrics file')
    expect(btn.attributes('title')).toBe('Open (Middle click)')
    const paren = wrapper.find('.field-header input[type=checkbox]')
    expect((paren.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('.field-header label').attributes('title')).toBe(
      'Wrap all secondary lines in parentheses',
    )
  })

  it('renders the warn bar without a role attribute (monolith parity — only #main-warn has role=alert)', async () => {
    const wrapper = await mountField()
    const warn = wrapper.find('.warn-bar')
    expect(warn.exists()).toBe(true)
    expect(warn.attributes('role')).toBeUndefined()
  })

  it('renders the hidden per-field file picker with an accessible name (Sonar InputWithoutLabelCheck fix)', async () => {
    const wrapper = await mountField(3)
    const picker = wrapper.find('input[type=file]')
    expect(picker.attributes('id')).toBe('sec-file-3')
    expect(picker.attributes('aria-label')).toBe('Secondary 3 lyrics file')
    expect(picker.attributes('accept')).toBe('.lrc,.txt')
    expect(picker.attributes('style')).toContain('display: none')
    const ta = wrapper.find('textarea')
    expect(ta.classes()).toContain('sec-textarea')
    expect(ta.attributes('aria-label')).toBe('Secondary 3 lyrics')
    expect(ta.attributes('spellcheck')).toBe('false')
  })

  it('stays unbound until Phase D: interacting persists nothing', async () => {
    const wrapper = await mountField()
    await wrapper.find('.fh-btn').trigger('click')
    await wrapper.find('textarea').setValue('hello')
    await wrapper.find('.field-header input[type=checkbox]').setValue(false)
    expect(localStorage).toHaveLength(0)
  })
})
