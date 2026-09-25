// @vitest-environment happy-dom
// Pins the useTheme composable (monolith "Theme" section port): lbl_theme
// persistence, .dark class toggle (port delta from [data-theme]), cycleTheme
// semantics, icon map. The composable reads localStorage at module import, so
// each test re-imports it fresh after seeding storage.
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function loadTheme() {
  const mod = await import('@/composables/useTheme')
  return mod.useTheme()
}

describe('useTheme init', () => {
  it('defaults to light and applies no .dark class when storage is empty', async () => {
    const { themeMode, applyTheme } = await loadTheme()
    expect(themeMode.value).toBe('light')
    applyTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('picks up a stored dark theme at import', async () => {
    localStorage.setItem('lbl_theme', 'dark')
    const { themeMode, applyTheme } = await loadTheme()
    expect(themeMode.value).toBe('dark')
    applyTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('treats a garbage stored value as light (monolith parity)', async () => {
    localStorage.setItem('lbl_theme', 'sepia')
    const { themeMode } = await loadTheme()
    expect(themeMode.value).toBe('light')
  })
})

describe('applyTheme / cycleTheme', () => {
  it('cycleTheme flips the mode, persists it, and toggles the .dark class', async () => {
    const { themeMode, cycleTheme, applyTheme } = await loadTheme()
    applyTheme()
    expect(themeMode.value).toBe('light')
    cycleTheme()
    expect(themeMode.value).toBe('dark')
    expect(localStorage.getItem('lbl_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    cycleTheme()
    expect(themeMode.value).toBe('light')
    expect(localStorage.getItem('lbl_theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('exposes the monolith icon map: the button shows the mode you would switch to', async () => {
    const { THEME_ICONS } = await import('@/composables/useTheme')
    expect(THEME_ICONS.light).toBe('🌙')
    expect(THEME_ICONS.dark).toBe('☀️')
  })
})
