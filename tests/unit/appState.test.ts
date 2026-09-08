// @vitest-environment happy-dom
// Pins the useAppState composable (Tranche 1 Phase D foundation):
//  - loadCfg reads lbl_cfg, deep-merges with defaults, runs migrateHotkeys
//  - cfg is reactive; provide/inject round-trips through CFG_KEY
//  - useCfg throws outside a provider
//  - secondaryCols is a computed over the visible subset of secondaryPool
//  - module-level singleton state defaults match the monolith State section
//  - MAX_LINES / MAX_SECONDARIES invariants pinned
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effect, nextTick } from 'vue'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function loadAppState() {
  const mod = await import('@/composables/useAppState')
  return mod.useAppState()
}

describe('useAppState — cfg loading', () => {
  it('defaults to DEFAULT_CFG when localStorage is empty', async () => {
    const { cfg } = await loadAppState()
    expect(cfg.value.tiny_ms).toBe(100)
    expect(cfg.value.seek_offset).toBe(-600)
    expect(cfg.value.hotkeys.toggle_mode).toBe('`')
    expect(cfg.value.hotkeys.theme_toggle).toBe('Ctrl+.')
  })

  it('reads stored lbl_cfg and overlays it on defaults', async () => {
    localStorage.setItem(
      'lbl_cfg',
      JSON.stringify({ tiny_ms: 250, hotkeys: { toggle_mode: 'CapsLock' } }),
    )
    const { cfg } = await loadAppState()
    expect(cfg.value.tiny_ms).toBe(250)
    expect(cfg.value.hotkeys.toggle_mode).toBe('CapsLock')
    // untouched keys keep their defaults
    expect(cfg.value.hotkeys.play_pause).toBe('Space')
    expect(cfg.value.small_ms).toBe(200)
  })

  it('runs migrateHotkeys — legacy seek_back value is rewritten to the new default', async () => {
    // LEGACY_HOTKEY_MAP.seek_back maps 'Ctrl+A' → 'Ctrl+9'. A user with the
    // old stored config should see the new default on load.
    localStorage.setItem(
      'lbl_cfg',
      JSON.stringify({ hotkeys: { seek_back: 'Ctrl+A' } }),
    )
    const { cfg } = await loadAppState()
    expect(cfg.value.hotkeys.seek_back).toBe('Ctrl+9')
  })

  it('ensureDefaultHotkeys fills in theme_toggle / replay_end / replay_only if absent', async () => {
    localStorage.setItem('lbl_cfg', JSON.stringify({ hotkeys: { save: "Ctrl+'" } }))
    const { cfg } = await loadAppState()
    expect(cfg.value.hotkeys.theme_toggle).toBe('Ctrl+.')
    expect(cfg.value.hotkeys.replay_end).toBe('Shift+R')
    expect(cfg.value.hotkeys.replay_only).toBe('R')
    // ensureDefaultHotkeys deletes a stale `mute` key
    expect(cfg.value.hotkeys.mute).toBeUndefined()
  })

  it('falls back to defaults when stored JSON is corrupt', async () => {
    localStorage.setItem('lbl_cfg', 'not json')
    const { cfg } = await loadAppState()
    expect(cfg.value.tiny_ms).toBe(100)
    expect(cfg.value.hotkeys.toggle_mode).toBe('`')
  })

  it('cfg is reactive — mutations trigger effects', async () => {
    const { cfg } = await loadAppState()
    let observed = cfg.value.tiny_ms
    effect(() => {
      observed = cfg.value.tiny_ms
    })
    cfg.value.tiny_ms = 500
    await nextTick()
    expect(observed).toBe(500)
  })
})

describe('useAppState — provide/inject', () => {
  it('useCfg throws when called outside a Vue component setup (no active instance)', async () => {
    const mod = await import('@/composables/useAppState')
    expect(() => mod.useCfg()).toThrow(/provideCfg.*missing/)
  })

  it('provideCfg + useCfg round-trips the same ref inside a component tree', async () => {
    const mod = await import('@/composables/useAppState')
    const { defineComponent, h } = await import('vue')
    const { mount } = await import('@vue/test-utils')

    // A child component that injects the cfg and exposes it via a ref
    // captured outside the wrapper, so the test can assert identity.
    let injected: unknown = null
    const Child = defineComponent({
      setup() {
        const c = mod.useCfg()
        injected = c
        return () => h('div', 'child')
      },
    })
    const Parent = defineComponent({
      setup() {
        mod.provideCfg()
        return () => h(Child)
      },
    })
    mount(Parent)
    expect(injected).toBe(mod.useAppState().cfg)
  })

  it('useCfg throws when called from a child with no provider', async () => {
    const mod = await import('@/composables/useAppState')
    const { defineComponent, h } = await import('vue')
    const { mount } = await import('@vue/test-utils')

    const Child = defineComponent({
      setup() {
        // Should throw — no provider in any ancestor
        expect(() => mod.useCfg()).toThrow(/provideCfg.*missing/)
        return () => h('div', 'child')
      },
    })
    mount(Child)
  })

  it('CFG_KEY is a Symbol (unique across modules)', async () => {
    const mod = await import('@/composables/useAppState')
    expect(typeof mod.CFG_KEY).toBe('symbol')
    // Re-importing should give the same symbol (module singleton)
    const mod2 = await import('@/composables/useAppState')
    expect(mod2.CFG_KEY).toBe(mod.CFG_KEY)
  })
})

describe('useAppState — secondary fields single source of truth', () => {
  it('secondaryCols is empty by default', async () => {
    const { secondaryCols, secondaryPool } = await loadAppState()
    expect(secondaryPool.value).toEqual([])
    expect(secondaryCols.value).toEqual([])
  })

  it('secondaryCols is a computed over the visible subset of secondaryPool', async () => {
    const { secondaryPool, secondaryCols } = await loadAppState()
    secondaryPool.value = [
      { visible: true, text: 'a' },
      { visible: false, text: 'b' },
      { visible: true, text: 'c' },
    ]
    expect(secondaryCols.value.map((e) => e.text)).toEqual(['a', 'c'])
    // toggling visibility re-renders the computed
    secondaryPool.value[0]!.visible = false
    expect(secondaryCols.value.map((e) => e.text)).toEqual(['c'])
  })

  it('secondaryPool is reactive — adding entries propagates to secondaryCols', async () => {
    const { secondaryPool, secondaryCols } = await loadAppState()
    let seen = 0
    effect(() => {
      seen = secondaryCols.value.length
    })
    expect(seen).toBe(0)
    secondaryPool.value.push({ visible: true, text: 'x' })
    await nextTick()
    expect(seen).toBe(1)
  })
})

describe('useAppState — singleton state defaults match the monolith', () => {
  it('hotkeyMode defaults to true, offsetSeekMode to false', async () => {
    const { hotkeyMode, offsetSeekMode } = await loadAppState()
    expect(hotkeyMode.value).toBe(true)
    expect(offsetSeekMode.value).toBe(false)
  })

  it('activeLine / playingLine default to -1 (no line selected)', async () => {
    const { activeLine, playingLine } = await loadAppState()
    expect(activeLine.value).toBe(-1)
    expect(playingLine.value).toBe(-1)
  })

  it('selectedLines defaults to an empty Set', async () => {
    const { selectedLines } = await loadAppState()
    expect(selectedLines.value.size).toBe(0)
    expect(selectedLines.value instanceof Set).toBe(true)
  })

  it('mergeDone / playing default to false; suppressScrollSync false', async () => {
    const { mergeDone, playing, suppressScrollSync } = await loadAppState()
    expect(mergeDone.value).toBe(false)
    expect(playing.value).toBe(false)
    expect(suppressScrollSync.value).toBe(false)
  })

  it('syncAutoAdvanced defaults to -1 (no auto-advance marker)', async () => {
    const { syncAutoAdvanced } = await loadAppState()
    expect(syncAutoAdvanced.value).toBe(-1)
  })

  it('geniusDetectedThisSession / pasteJustHappened / isDirty default to false', async () => {
    const { geniusDetectedThisSession, pasteJustHappened, isDirty } =
      await loadAppState()
    expect(geniusDetectedThisSession.value).toBe(false)
    expect(pasteJustHappened.value).toBe(false)
    expect(isDirty.value).toBe(false)
  })

  it('savedAudioPath defaults to null; lastImportStem to empty string', async () => {
    const { savedAudioPath, lastImportStem } = await loadAppState()
    expect(savedAudioPath.value).toBeNull()
    expect(lastImportStem.value).toBe('')
  })
})

describe('useAppState — invariants', () => {
  it('MAX_LINES is 500', async () => {
    const mod = await import('@/composables/useAppState')
    expect(mod.MAX_LINES).toBe(500)
  })

  it('MAX_SECONDARIES is 10 (the monolith addSecondary cap)', async () => {
    const mod = await import('@/composables/useAppState')
    expect(mod.MAX_SECONDARIES).toBe(10)
  })

  it('all module-level refs are singletons — re-importing returns the same ref instances', async () => {
    const mod1 = await import('@/composables/useAppState')
    const mod2 = await import('@/composables/useAppState')
    // Without vi.resetModules, the second import returns the cached module.
    // We tested above that the symbol is the same; here we confirm the
    // exported useAppState() returns the same ref instances.
    const a = mod1.useAppState()
    const b = mod2.useAppState()
    expect(a.cfg).toBe(b.cfg)
    expect(a.hotkeyMode).toBe(b.hotkeyMode)
    expect(a.activeLine).toBe(b.activeLine)
  })
})
