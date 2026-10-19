// @vitest-environment happy-dom
// Pins the useEditorFont composable (monolith "Font settings" section port):
// lbl_font/lbl_fsize persistence, the size-input || 14 quirk (0/NaN become the
// default before clamping), the one-sided tick clamps, and the inline CSS vars
// on <html>. Module state initializes from localStorage at import, so each
// test re-imports fresh.
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function loadFont() {
  const mod = await import('@/composables/useEditorFont')
  return mod.useEditorFont()
}

describe('useEditorFont init', () => {
  it('defaults to System Sans at 14px (13.2px CSS token is only the pre-JS fallback)', async () => {
    const { editorFont, editorSize, applyEditorFont } = await loadFont()
    expect(editorFont.value).toBe('system-ui,sans-serif')
    expect(editorSize.value).toBe(14)
    applyEditorFont()
    expect(document.documentElement.style.getPropertyValue('--editor-font')).toBe('system-ui,sans-serif')
    expect(document.documentElement.style.getPropertyValue('--editor-size')).toBe('14px')
  })

  it('picks up stored font and size at import', async () => {
    localStorage.setItem('lbl_font', 'serif')
    localStorage.setItem('lbl_fsize', '20')
    const { editorFont, editorSize } = await loadFont()
    expect(editorFont.value).toBe('serif')
    expect(editorSize.value).toBe(20)
  })
})

describe('size clamping', () => {
  it('setSizeFromInput applies || 14 before clamping (monolith input-handler quirk)', async () => {
    const { editorSize, setSizeFromInput } = await loadFont()
    setSizeFromInput(Number.parseFloat('15'))
    expect(editorSize.value).toBe(15)
    setSizeFromInput(Number.parseFloat('100'))
    expect(editorSize.value).toBe(32)
    setSizeFromInput(Number.parseFloat('3'))
    expect(editorSize.value).toBe(8)
    setSizeFromInput(Number.parseFloat('0'))
    expect(editorSize.value).toBe(14)
    setSizeFromInput(Number.NaN)
    expect(editorSize.value).toBe(14)
  })

  it('sizeUp/sizeDown clamp only the side they step toward (monolith tick quirk)', async () => {
    const { editorSize, sizeUp, sizeDown } = await loadFont()
    sizeUp()
    expect(editorSize.value).toBe(15)
    sizeDown()
    expect(editorSize.value).toBe(14)
    editorSize.value = 32
    sizeUp()
    expect(editorSize.value).toBe(32)
    editorSize.value = 8
    sizeDown()
    expect(editorSize.value).toBe(8)
    // a stored out-of-range value survives downward ticks until it re-enters
    // the clamp range — verbatim monolith behavior
    editorSize.value = 100
    sizeDown()
    expect(editorSize.value).toBe(99)
  })
})

describe('persistence', () => {
  it('setFont and setSizeFromInput write lbl_font / lbl_fsize and apply the CSS vars', async () => {
    const { setFont, setSizeFromInput } = await loadFont()
    setFont('serif')
    setSizeFromInput(Number.parseFloat('12'))
    expect(localStorage.getItem('lbl_font')).toBe('serif')
    expect(localStorage.getItem('lbl_fsize')).toBe('12')
    expect(document.documentElement.style.getPropertyValue('--editor-font')).toBe('serif')
    expect(document.documentElement.style.getPropertyValue('--editor-size')).toBe('12px')
  })
})
