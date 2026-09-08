// Phase D Tranche 1 — central app state, ported from the monolith "── State ──"
// section. Module-level singleton refs (same pattern as useTheme /
// usePanelCollapse) so the Phase D keyboard handler dispatch and every
// component share one source of truth. Provided via Vue's provide/inject
// through the CFG_KEY injection key — children read cfg.hotkeys.X reactively.
//
// PORT DELTAS from the monolith:
//  - The monolith keeps `secondaryPool` and `secondaryCols` as two separate
//    arrays with manual bookkeeping (addSecondary pushes to both, remove
//    pops cols and leaves pool). Single-source-of-truth: secondaryPool is the
//    authoritative ref; secondaryCols is a computed over visible entries.
//  - `cfg` was a module-level `let` set by loadCfg(); here it's a ref loaded
//    once at module init and shared via provide/inject so children's
//    `cfg.hotkeys.X` reads re-render when settings change.
//  - `masterVolume` / `masterMuted` / `_preMuteVolume` live in useAudio
//    (Tranche 4); not duplicated here.
//  - `undoStack` / `redoStack` / `_undoDebounceTimer` live in useUndoRedo.
//  - `audioEl` is an audio element ref owned by useAudio (Tranche 4).
//
// Quirk: secondaryPool entries are kept as a `SecondaryEntry` interface —
// shape is a port of the monolith's addSecondary() return value (the lines
// textarea element + the column wrapper). Vue-side, the textarea element
// becomes a template ref the SecondaryField component registers; the col
// wrapper is the component root. We keep the shape minimal so Tranche 6 can
// fill it in without re-touching this file.

import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import { DEFAULT_CFG, migrateHotkeys, type AppConfig, type HotkeyMap } from '@/config'

// Maximum number of LRC lines the editor accepts (monolith invariant).
export const MAX_LINES = 500
// Maximum number of secondary-field columns (monolith invariant).
export const MAX_SECONDARIES = 10

// Secondary-field entry shape. Tranche 6 fills in the textarea ref + handlers;
// the pool tracks visibility + per-field text content here so undo/redo and
// autosave can snapshot without reaching into the DOM.
export interface SecondaryEntry {
  visible: boolean
  text: string
}

// Reactive `cfg` shared via provide/inject. Components that read hotkeys or
// other config values reactively should `useCfg()` instead of importing
// DEFAULT_CFG directly — Settings writes go through this ref.
export const CFG_KEY: InjectionKey<Ref<AppConfig>> = Symbol('lbl-cfg')

// ── Module-level singleton state ────────────────────────────────────────────
// Loaded once at module import — the monolith does the same (let cfg = loadCfg()).
function loadCfg(): AppConfig {
  // localStorage may be unavailable (SSR, sandboxed tests). Fall back to a
  // deep clone of DEFAULT_CFG — matches the monolith's catch-block return.
  let stored: unknown = null
  try {
    stored = localStorage.getItem('lbl_cfg')
  } catch {
    stored = null
  }
  // Deep-clone DEFAULT_CFG so callers can mutate without aliasing the export.
  const base: AppConfig = JSON.parse(JSON.stringify(DEFAULT_CFG))
  if (!stored || typeof stored !== 'string') return base
  try {
    const d = JSON.parse(stored) as Partial<AppConfig> & { hotkeys?: HotkeyMap }
    Object.assign(base, d)
    // Hotkeys merge separately — Object.assign on a nested object replaces,
    // and we want missing keys to fall back to defaults (legacy localStorage
    // may predate theme_toggle / replay_end / etc.).
    base.hotkeys = Object.assign({}, DEFAULT_CFG.hotkeys, d.hotkeys || {})
    migrateHotkeys(d, base)
    return base
  } catch {
    return base
  }
}

const cfg = ref<AppConfig>(loadCfg())

// Monolith State section globals, ported verbatim. Names match the monolith.
const hotkeyMode = ref(true)
const offsetSeekMode = ref(false)
const playing = ref(false)
const activeLine = ref(-1)
const playingLine = ref(-1)
const selectedLines = ref<Set<number>>(new Set())

// Secondary-field pool — single source of truth. The monolith's `secondaryCols`
// is the visible subset; here it's a computed so add/remove just toggle
// `visible` on the pool entry and the column list re-renders.
const secondaryPool = ref<SecondaryEntry[]>([])
const secondaryCols = computed(() => secondaryPool.value.filter(e => e.visible))

const mergeDone = ref(false)
const savedAudioPath = ref<string | null>(null)
const lastImportStem = ref('')
const suppressScrollSync = ref(false)

// Internal flags from the monolith State section. Underscore-prefixed in the
// monolith; kept verbatim here (without the underscore, matching the Phase C
// export convention) since they are app-internal but cross-composable.
const syncAutoAdvanced = ref(-1)
const geniusDetectedThisSession = ref(false)
const pasteJustHappened = ref(false)

const isDirty = ref(false)

// ── provide/inject API ───────────────────────────────────────────────────────
// App.vue (Tranche 2) calls `provideCfg()` in setup; descendants call
// `useCfg()` to read the reactive cfg. Throws on missing inject — a child
// that reads cfg.hotkeys.X outside a provider is a wiring bug.
export function provideCfg() {
  provide(CFG_KEY, cfg)
}

export function useCfg(): Ref<AppConfig> {
  const c = inject(CFG_KEY)
  if (!c) throw new Error('useCfg() called outside of <ThemeProvider> — provideCfg() missing')
  return c
}

// Convenience for tests and Tranche 1 callers that need the cfg ref directly
// without a provider (the SettingsDialog Tranche 2 wiring will use this so
// the dialog can render live cfg without mounting under App.vue).
export function useAppState() {
  return {
    cfg,
    hotkeyMode,
    offsetSeekMode,
    playing,
    activeLine,
    playingLine,
    selectedLines,
    secondaryPool,
    secondaryCols,
    mergeDone,
    savedAudioPath,
    lastImportStem,
    suppressScrollSync,
    syncAutoAdvanced,
    geniusDetectedThisSession,
    pasteJustHappened,
    isDirty,
  }
}