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
    // Suppress Vue's own [Vue warn] from inject() being called outside setup —
    // the test deliberately triggers this path to verify useCfg() throws.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => mod.useCfg()).toThrow(/provideCfg.*missing/)
    warnSpy.mockRestore()
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

    // Suppress Vue's own [Vue warn] about the missing injection — the test
    // deliberately triggers this path to verify useCfg() throws.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const Child = defineComponent({
      setup() {
        // Should throw — no provider in any ancestor
        expect(() => mod.useCfg()).toThrow(/provideCfg.*missing/)
        return () => h('div', 'child')
      },
    })
    mount(Child)
    warnSpy.mockRestore()
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

// ── Phase E Tranche 1 — isDirty watch + beforeunload integration ────────────
// The monolith's beforeunload (docs/index.html lines 2766-2770) reads getTA()
// + secondaryCols directly. The Vue port wires a watch in useAppState that
// mirrors the same check into the isDirty ref (for observability), and App.vue
// adds a beforeunload listener that re-reads mainText + secondaryPool directly
// (so a stale isDirty can never suppress the warning). These specs pin both.
describe('useAppState — isDirty watch (Phase E Tranche 1)', () => {
  it('isDirty is false when mainText and secondaryPool are empty (default state)', async () => {
    const { isDirty, mainText, secondaryPool } = await loadAppState()
    expect(mainText.value).toBe('')
    expect(secondaryPool.value).toEqual([])
    expect(isDirty.value).toBe(false)
  })

  it('isDirty is true when mainText has non-default content', async () => {
    const { isDirty, mainText } = await loadAppState()
    mainText.value = '[00:01.00] some lyric\n'
    expect(isDirty.value).toBe(true)
  })

  it('isDirty is false when mainText equals cfg.default_meta (port-delta quirk — default-meta-only is "not dirty")', async () => {
    const { isDirty, mainText, cfg } = await loadAppState()
    mainText.value = cfg.value.default_meta
    expect(isDirty.value).toBe(false)
  })

  it('isDirty is false when mainText is empty string (even though it differs from default_meta)', async () => {
    const { isDirty, mainText, cfg } = await loadAppState()
    expect(cfg.value.default_meta).not.toBe('')
    mainText.value = ''
    expect(isDirty.value).toBe(false)
  })

  it('isDirty is true when any visible secondary has text', async () => {
    const { isDirty, secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: true, text: 'translation\n' })
    expect(isDirty.value).toBe(true)
  })

  it('isDirty is true when any hidden secondary has text (quirk preservation — hidden entries still count)', async () => {
    // The Vue port's secondaryCols is visible-only, but isDirty reads
    // secondaryPool (all entries) so hidden entries with text still flag dirty.
    // This preserves the monolith's intent: warn before losing any text.
    const { isDirty, secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: false, text: 'hidden translation\n' })
    expect(isDirty.value).toBe(true)
  })

  it('isDirty reactively updates when mainText changes (flush: sync — no nextTick needed)', async () => {
    const { isDirty, mainText } = await loadAppState()
    expect(isDirty.value).toBe(false)
    mainText.value = 'dirty content\n'
    expect(isDirty.value).toBe(true)
    mainText.value = ''
    expect(isDirty.value).toBe(false)
  })

  it('isDirty reactively updates on deep secondary .text mutation (deep watch catches per-entry changes)', async () => {
    const { isDirty, secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: true, text: '' })
    expect(isDirty.value).toBe(false)
    // Deep mutation — the watch has deep: true to catch this without replacing
    // the whole array.
    secondaryPool.value[0]!.text = 'now has content\n'
    expect(isDirty.value).toBe(true)
  })

  it('isDirty stays true when a secondary with text is hidden (removed from secondaryCols but kept in secondaryPool)', async () => {
    // Quirk preservation: hiding a secondary (visible=false) doesn't clear
    // its text from secondaryPool, so isDirty stays true.
    const { isDirty, secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: true, text: 'content\n' })
    expect(isDirty.value).toBe(true)
    secondaryPool.value[0]!.visible = false
    expect(isDirty.value).toBe(true)
  })
})

describe('App.vue — beforeunload integration (Phase E Tranche 1)', () => {
  async function mountApp() {
    const mod = await import('@/App.vue')
    const { mount } = await import('@vue/test-utils')
    return mount(mod.default)
  }

  it('does not preventDefault when mainText equals default_meta (not dirty after loadAutosave fallback)', async () => {
    const wrapper = await mountApp()
    // After mount, loadAutosave runs with no sessionStorage autosave →
    // mainText is set to cfg.default_meta (the fallback). This is not dirty.
    const { mainText, cfg } = await loadAppState()
    expect(mainText.value).toBe(cfg.value.default_meta)
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('prevents default when mainText has non-default content', async () => {
    const wrapper = await mountApp()
    const { mainText } = await loadAppState()
    mainText.value = '[00:01.00] custom lyric\n'
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('prevents default when a visible secondary has text', async () => {
    const wrapper = await mountApp()
    const { secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: true, text: 'translation\n' })
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('prevents default when a hidden secondary has text (quirk preservation via secondaryPool)', async () => {
    const wrapper = await mountApp()
    const { secondaryPool } = await loadAppState()
    secondaryPool.value.push({ visible: false, text: 'hidden translation\n' })
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })
})
