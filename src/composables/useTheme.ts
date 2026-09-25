// Theme state — ported from the monolith "Theme" section. Behaviors verbatim:
// localStorage key lbl_theme (default light), cycleTheme toggles + persists,
// button icon shows the mode you'd switch TO (light shows 🌙). Port delta: the
// monolith sets [data-theme] on <html>; this toggles the .dark class the
// Phase B token CSS keys off. Module-level ref so the global keyboard handler
// (Phase D theme_toggle dispatch) and MenuBar share one source of truth.
import { ref } from 'vue'

export const THEME_ICONS = { light: '🌙', dark: '☀️' } as const

type ThemeMode = 'light' | 'dark'

const themeMode = ref<ThemeMode>(localStorage.getItem('lbl_theme') === 'dark' ? 'dark' : 'light')

// Module-level applyTheme + cycleTheme — exported directly so useGlobalHotkeys
// can call cycleTheme without the useTheme() factory (avoids the unused
// useTheme import that triggered S3735 void-operator). The factory still
// returns both for components that need them.
export function applyTheme() {
  document.documentElement.classList.toggle('dark', themeMode.value === 'dark')
}

export function cycleTheme() {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('lbl_theme', themeMode.value)
  applyTheme()
}

export function useTheme() {
  return { themeMode, applyTheme, cycleTheme }
}
