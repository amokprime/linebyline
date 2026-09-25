// Pins the controls-panel display logic (monolith Controls panel port):
// _hkDisp, _renderHkCellContent's per-action key layouts, the ordered action
// list, and the typing-mode dimming sets.
import { describe, expect, it } from 'vitest'

import { DEFAULT_CFG } from '@/config'
import { hkCellKeys, hkDisp, hkPanelActions, HOTKEY_ONLY, TYPING_AVAILABLE } from '@/utils/hotkeyDisplay'

describe('hkDisp', () => {
  it('maps Escape to Esc and empty values to the em dash', () => {
    expect(hkDisp('Escape')).toBe('Esc')
    expect(hkDisp('')).toBe('—')
    expect(hkDisp(undefined)).toBe('—')
    expect(hkDisp('Space')).toBe('Space')
  })
})

describe('hkCellKeys', () => {
  const hk = DEFAULT_CFG.hotkeys

  it('sync shows the sync key plus the replay_line key (default Enter)', () => {
    expect(hkCellKeys('sync', hk, true)).toEqual(['W', 'Enter'])
    expect(hkCellKeys('sync', { ...hk, replay_line: 'Escape' }, true)).toEqual(['W', 'Esc'])
    expect(hkCellKeys('sync', { ...hk, sync: '' }, true)).toEqual(['—', 'Enter'])
  })

  it('play_pause shows play_pause_alt in Typing mode, the main key in Hotkey mode', () => {
    expect(hkCellKeys('play_pause', hk, true)).toEqual(['Space'])
    expect(hkCellKeys('play_pause', hk, false)).toEqual(['Ctrl+Space'])
    expect(hkCellKeys('play_pause', { ...hk, play_pause_alt: '' }, false)).toEqual(['Space'])
  })

  it('prev/next gain an arrow badge in Hotkey mode and show only the arrow in Typing mode', () => {
    expect(hkCellKeys('prev_line', hk, true)).toEqual(['Q', '↑'])
    expect(hkCellKeys('prev_line', hk, false)).toEqual(['↑'])
    expect(hkCellKeys('next_line', hk, true)).toEqual(['E', '↓'])
    expect(hkCellKeys('next_line', hk, false)).toEqual(['↓'])
  })

  it('ordinary actions show their key (or the em dash when unassigned)', () => {
    expect(hkCellKeys('end_line', hk, true)).toEqual(['T'])
    expect(hkCellKeys('end_line', { ...hk, end_line: '' }, true)).toEqual(['—'])
  })
})

describe('hkPanelActions', () => {
  it('lists the 14 action cells in the monolith order with ms labels', () => {
    const actions = hkPanelActions(DEFAULT_CFG, false)
    expect(actions.map((a) => a.key)).toEqual([
      'prev_line', 'play_pause', 'next_line', 'sync', 'replay_only', 'end_line',
      'ts_back_tiny', 'ts_fwd_tiny', 'ts_back_small', 'ts_fwd_small',
      'ts_back_medium', 'ts_fwd_medium', 'ts_back_large', 'ts_fwd_large',
    ])
    expect(actions[0].label).toBe('Previous line')
    expect(actions[6].label).toBe('−100ms time')
    expect(actions[13].label).toBe('+1000ms time')
  })

  it('labels read "seek" in offset-seek mode', () => {
    const actions = hkPanelActions(DEFAULT_CFG, true)
    expect(actions[6].label).toBe('−100ms seek')
    expect(actions[7].label).toBe('+100ms seek')
  })
})

describe('typing-mode dimming sets', () => {
  it('matches the monolith sets', () => {
    expect([...HOTKEY_ONLY]).toHaveLength(16)
    expect([...TYPING_AVAILABLE]).toEqual(['play_pause', 'prev_line', 'next_line'])
    // play_pause is hotkey-only-listed but typing-available, so never dimmed
    expect(TYPING_AVAILABLE.has('play_pause')).toBe(true)
  })
})
