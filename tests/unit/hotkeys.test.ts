
import { describe, expect, it } from 'vitest'

import { DEFAULT_CFG, ensureDefaultHotkeys, migrateHotkeys, migrateLegacyHotkeys } from '@/config'
import { hkMatch, keyStr, normKey } from '@/hotkeys/keyUtils'
import { isRestrictedForAll, isRestrictedForKey, RESTRICTED_ALL } from '@/hotkeys/restrictedKeys'

describe('keyStr / normKey', () => {
  it('builds Ctrl/Shift/Alt-prefixed strings with normalized keys', () => {
    expect(keyStr({ ctrlKey: false, shiftKey: false, altKey: false, key: 'q' })).toBe('Q')
    expect(keyStr({ ctrlKey: true, shiftKey: false, altKey: false, key: 's' })).toBe('Ctrl+S')
    expect(keyStr({ ctrlKey: true, shiftKey: true, altKey: false, key: 'r' })).toBe('Ctrl+Shift+R')
    expect(keyStr({ ctrlKey: true, shiftKey: false, altKey: true, key: 'ArrowLeft' })).toBe('Ctrl+Alt+ArrowLeft')
  })

  it('normalizes Shift+ArrowUp', () => {
    expect(keyStr({ ctrlKey: false, shiftKey: true, altKey: false, key: 'ArrowUp' })).toBe('Shift+ArrowUp')
  })

  it('maps Space and Escape (monolith quirk: Escape becomes Esc)', () => {
    expect(keyStr({ ctrlKey: true, shiftKey: false, altKey: false, key: ' ' })).toBe('Ctrl+Space')
    expect(keyStr({ ctrlKey: false, shiftKey: false, altKey: false, key: 'Escape' })).toBe('Esc')
    expect(normKey('Escape')).toBe('Esc')
    expect(normKey(' ')).toBe('Space')
    expect(normKey('F5')).toBe('F5')
  })

  it('uppercases single characters via normKey', () => {
    expect(normKey('a')).toBe('A')
  })

  it('passes multi-char keys through unchanged via normKey', () => {
    expect(normKey('ArrowUp')).toBe('ArrowUp')
  })

  it('normalizes bare Space (no modifiers) to "Space"', () => {
    expect(keyStr({ ctrlKey: false, shiftKey: false, altKey: false, key: ' ' })).toBe('Space')
  })

  it('drops bare modifier presses', () => {
    expect(keyStr({ ctrlKey: true, shiftKey: false, altKey: false, key: 'Control' })).toBe('Ctrl')
    expect(keyStr({ ctrlKey: false, shiftKey: false, altKey: false, key: 'Shift' })).toBe('')
  })
})

describe('hkMatch', () => {
  it('matches exact strings and keeps the Escape special case', () => {
    expect(hkMatch('Esc', 'Esc')).toBe(true)
    expect(hkMatch('Q', 'Q')).toBe(true)
    expect(hkMatch('Q', 'E')).toBe(false)
    expect(hkMatch('Escape', 'Escape')).toBe(true)
    expect(hkMatch('Esc', 'Escape')).toBe(false)
  })
})

describe('restricted hotkey rules', () => {
  it('blocks browser-reserved keys for all actions', () => {
    expect(isRestrictedForAll('F5')).toContain('reserved by the browser')
    expect(isRestrictedForAll('Ctrl+R')).toContain('reserved by the browser')
    expect(isRestrictedForAll('Escape')).toContain('reserved by the browser')
    expect(isRestrictedForAll('Q')).toBeNull()
    expect(RESTRICTED_ALL.has('Ctrl+Shift+I')).toBe(true)
  })

  it('blocks Ctrl+C, Tab, and Alt combos as browser-reserved', () => {
    expect(isRestrictedForAll('Ctrl+C')).toContain('reserved by the browser')
    expect(isRestrictedForAll('Tab')).toContain('reserved by the browser')
    expect(isRestrictedForAll('Alt+F')).toContain('reserved by the browser')
  })

  it('allows non-reserved Ctrl+; and ArrowDown', () => {
    expect(isRestrictedForAll('Ctrl+;')).toBeNull()
    expect(isRestrictedForAll('ArrowDown')).toBeNull()
  })

  it('blocks letters/digits/Space only for toggle_mode and offset_mode_toggle', () => {
    expect(isRestrictedForKey('Q', 'toggle_mode')).toContain('Letters, numbers, and Space')
    expect(isRestrictedForKey('5', 'toggle_mode')).toContain('Letters, numbers, and Space')
    expect(isRestrictedForKey('Space', 'toggle_mode')).toContain('Letters, numbers, and Space')
    expect(isRestrictedForKey('Shift+A', 'toggle_mode')).toContain('Letters, numbers, and Space')
    expect(isRestrictedForKey('Shift+A', 'offset_mode_toggle')).toContain('Letters, numbers, and Space')
    expect(isRestrictedForKey('`', 'toggle_mode')).toBeNull()
    expect(isRestrictedForKey('Shift+~', 'offset_mode_toggle')).toBeNull()
    expect(isRestrictedForKey('Q', 'sync')).toBeNull()
    expect(isRestrictedForKey('Ctrl+9', 'seek_back')).toBeNull()
  })

  it('allows Ctrl+; for toggle_mode (Ctrl combos bypass the alpha/num/Space block)', () => {
    expect(isRestrictedForKey('Ctrl+;', 'toggle_mode')).toBeNull()
  })

  it('allows non-alpha non-numeric keys like BracketLeft for toggle_mode', () => {
    expect(isRestrictedForKey('BracketLeft', 'toggle_mode')).toBeNull()
  })
})

describe('hotkey migration (config.ts)', () => {
  it('maps legacy hotkey values to their new defaults', () => {
    const cfg = structuredClone(DEFAULT_CFG)
    const stored = { hotkeys: { seek_back: 'Ctrl+A', save: 'Ctrl+S' } }
    migrateLegacyHotkeys(stored, cfg.hotkeys)
    expect(cfg.hotkeys.seek_back).toBe('Ctrl+9')
    expect(cfg.hotkeys.save).toBe("Ctrl+'")
    expect(cfg.hotkeys.sync).toBe('W') // untouched default
  })

  it('leaves non-legacy values alone', () => {
    const cfg = structuredClone(DEFAULT_CFG)
    cfg.hotkeys.seek_back = 'KEEP'
    migrateLegacyHotkeys({ hotkeys: { seek_back: 'Ctrl+7' } }, cfg.hotkeys)
    expect(cfg.hotkeys.seek_back).toBe('KEEP')
  })

  it('fills in hotkeys added after old stored configs', () => {
    const cfg = structuredClone(DEFAULT_CFG)
    cfg.hotkeys = { sync: 'W' }
    ensureDefaultHotkeys(cfg)
    expect(cfg.hotkeys.theme_toggle).toBe('Ctrl+.')
    expect(cfg.hotkeys.replay_end).toBe('Shift+R')
    expect(cfg.hotkeys.reset_defaults).toBe('Ctrl+\\')
  })

  it('removes the removed mute action', () => {
    const cfg = structuredClone(DEFAULT_CFG)
    cfg.hotkeys.mute = 'Ctrl+8'
    ensureDefaultHotkeys(cfg)
    expect('mute' in cfg.hotkeys).toBe(false)
  })

  it('runs both migrations from migrateHotkeys', () => {
    const cfg = structuredClone(DEFAULT_CFG)
    cfg.hotkeys = {}
    migrateHotkeys({ hotkeys: { seek_fwd: 'Alt+W' } }, cfg)
    expect(cfg.hotkeys.seek_fwd).toBe('Ctrl+0')
    expect(cfg.hotkeys.replay_only).toBe('R')
    expect(cfg.hotkeys.issues).toBe('Ctrl+[')
  })
})
