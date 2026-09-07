// @vitest-environment happy-dom
// Pins the SettingsDialog shell (monolith settings overlay port onto the
// shadcn-vue Dialog): title bar, body sections rendered from DEFAULT_CFG,
// hotkey rows grouped by HK_SECTIONS, and the footer with the hidden reset
// confirm. The dialog teleports to body (reka-ui portal), so assertions run
// against the mounted document.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import { DEFAULT_CFG, DEFAULT_META, HK_SECTIONS } from '@/config'

let wrapper: ReturnType<typeof mount> | null = null

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

async function mountOpen() {
  const mod = await import('@/components/SettingsDialog.vue')
  wrapper = mount(mod.default, { props: { open: true }, attachTo: document.body })
  await vi.dynamicImportSettled()
  return wrapper
}

describe('SettingsDialog shell', () => {
  it('renders nothing visible while closed', async () => {
    const mod = await import('@/components/SettingsDialog.vue')
    wrapper = mount(mod.default, { props: { open: false }, attachTo: document.body })
    await vi.dynamicImportSettled()
    expect(document.querySelector('#settings-title-bar')).toBeNull()
  })

  it('opens with the title bar, search field, and heading', async () => {
    await mountOpen()
    const heading = document.querySelector('#settings-heading')
    expect(heading?.textContent).toContain('Settings')
    expect(document.querySelector('#s-search')?.getAttribute('aria-label')).toBe('Search settings')
    expect(document.querySelector('#s-search-kbd')).not.toBeNull()
    expect(document.querySelector('#settings-conflict')?.getAttribute('aria-live')).toBe('polite')
  })

  it('renders the 7 instant-replay checkboxes with DEFAULT_CFG values', async () => {
    await mountOpen()
    const checks = [...document.querySelectorAll('.s-check input')] as HTMLInputElement[]
    expect(checks).toHaveLength(7)
    expect((checks[0] as HTMLInputElement).id).toBe('s-replay-prev')
    expect(checks[0].checked).toBe(DEFAULT_CFG.replay_prev_line)
    expect((checks[6] as HTMLInputElement).id).toBe('s-replay-offset')
    expect(checks[6].checked).toBe(DEFAULT_CFG.replay_after_offset)
  })

  it('renders the interval rows with DEFAULT_CFG values and units', async () => {
    await mountOpen()
    const tiny = document.querySelector('#s-tiny') as HTMLInputElement
    expect(tiny.value).toBe('100')
    const ratio = document.querySelector('#s-speed-ratio') as HTMLInputElement
    expect(ratio.value).toBe((DEFAULT_CFG.speed_ratio ?? 1.1).toFixed(2))
    const vol = document.querySelector('#s-vol-inc') as HTMLInputElement
    expect(vol.value).toBe(String(Math.round(DEFAULT_CFG.vol_increment * 100)))
    expect(document.querySelector('#s-tiny')?.closest('.s-row')?.textContent).toContain('ms')
  })

  it('fills the metadata textarea from DEFAULT_META', async () => {
    await mountOpen()
    expect((document.querySelector('#s-default-meta') as HTMLTextAreaElement).value).toBe(DEFAULT_META)
  })

  it('renders hotkey rows grouped by HK_SECTIONS with read-only capture inputs', async () => {
    await mountOpen()
    const subLabels = [...document.querySelectorAll('#hk-settings-rows .s-sub-label')]
    expect(subLabels.map((s) => s.textContent)).toEqual(HK_SECTIONS.map((s) => s.label))
    const totalKeys = HK_SECTIONS.reduce((n, s) => n + s.keys.length, 0)
    const captures = [...document.querySelectorAll('.hk-capture')] as HTMLInputElement[]
    expect(captures).toHaveLength(totalKeys)
    // capture inputs show raw values (blank stays blank, unlike panel hkDisp)
    expect(captures.every((c) => c.readOnly)).toBe(true)
    const toggle = document.querySelector('#hk-capture-toggle_mode') as HTMLInputElement
    expect(toggle.value).toBe(DEFAULT_CFG.hotkeys.toggle_mode)
    // clear/swap/reset buttons start hidden (monolith .visible-less state)
    expect(document.querySelector('.hk-clear.visible')).toBeNull()
    expect(document.querySelector('.hk-reset.visible')).toBeNull()
    expect(document.querySelector('.hk-replace.visible')).toBeNull()
  })

  it('has the footer with reset and the hidden inline confirm (monolith parity)', async () => {
    await mountOpen()
    expect(document.querySelector('#s-reset-defaults')?.textContent).toContain('Reset defaults')
    const msg = document.querySelector('#s-confirm-msg') as HTMLElement
    const yes = document.querySelector('#s-confirm-yes') as HTMLElement
    expect(msg.style.display).toBe('none')
    expect(yes.style.display).toBe('none')
  })

  it('hides the dialog content when open flips to false', async () => {
    const mod = await import('@/components/SettingsDialog.vue')
    wrapper = mount(mod.default, { props: { open: true }, attachTo: document.body })
    await vi.dynamicImportSettled()
    expect(document.querySelector('#settings-title-bar')).not.toBeNull()
    wrapper.setProps({ open: false })
    await vi.dynamicImportSettled()
    expect(document.querySelector('#settings-title-bar')).toBeNull()
  })
})
