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

import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import { DEFAULT_CFG, migrateHotkeys, type AppConfig, type HotkeyMap } from '@/config'

// Maximum number of LRC lines the editor accepts (monolith invariant).
export const MAX_LINES = 500
// Maximum number of secondary-field columns (monolith invariant).
export const MAX_SECONDARIES = 10

// Secondary-field entry shape. Tranche 6 augments with warn-bar state +
// the textarea ref for scroll sync. The pool tracks visibility + per-field
// text content here so undo/redo and autosave can snapshot without reaching
// into the DOM.
//
// The Tranche 6 additions (`warnText`/`warnVisible`/`textareaEl`) are marked
// optional so callers that construct entries with just `{ visible, text }`
// (useAutosave._restoreSecondaryPool, tests) still type-check. The fields are
// always populated by addSecondary() before the entry becomes visible, so
// SecondaryField.vue can read them without null guards at render time.
export interface SecondaryEntry {
  visible: boolean
  text: string
  // Tranche 6 additions — warn-bar state (reactive; SecondaryField binds
  // `:class="{ visible: entry.warnVisible }"` and `{{ entry.warnText }}`).
  warnText?: string
  warnVisible?: boolean
  // Textarea element ref — registered by SecondaryField.vue's setup so
  // useMerge.syncScrollFrom + onSecInput can reach the DOM. null in pure-node
  // tests + before mount.
  textareaEl?: HTMLTextAreaElement | null
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
  // structuredClone preserves `undefined` (JSON drops it) — the cfg schema uses
  // `=== undefined` and `??` checks, not `Object.keys().includes(...)`, so the
  // behavior is equivalent for this shape. Replaces JSON.parse(JSON.stringify())
  // per S7784.
  const base: AppConfig = structuredClone(DEFAULT_CFG)
  if (!stored || typeof stored !== 'string') return base
  try {
    const d = JSON.parse(stored) as Partial<AppConfig> & { hotkeys?: HotkeyMap }
    Object.assign(base, d)
    // Hotkeys merge separately — Object.assign on a nested object replaces,
    // and we want missing keys to fall back to defaults (legacy localStorage
    // may predate theme_toggle / replay_end / etc.). Spread replaces
    // Object.assign({}, ...) per S6661. The `|| {}` fallback is dropped per
    // S7744 — spreading undefined is a no-op ({...undefined} === {}), so
    // the empty object was useless.
    base.hotkeys = { ...DEFAULT_CFG.hotkeys, ...d.hotkeys }
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

// Main textarea content — the source of truth for the LRC text being edited.
// Tranche 2 adds this so useAutosave can read/write the main text without
// reaching into the DOM. EditorArea binds `<textarea :value="mainText">`
// (one-way — Tranche 5 adds @input for two-way). **Caveat**: until Tranche 5,
// user typing in the textarea doesn't update mainText — doAutosave saves the
// programmatic value, not user edits. This is fine for Tranche 2's scope
// (loadAutosave + doAutosave after setupAudio/import).
const mainText = ref('')

// Tranche 6 — main warn-bar state. The monolith imperatively writes
// `#main-warn.textContent` + toggles `.visible`. Vue binds `:class` + `{{ }}`
// reactively. checkLineCounts (useMerge) writes here; EditorArea's #main-warn
// template reads.
const mainWarnText = ref('')
const mainWarnVisible = ref(false)

// ── Phase E Tranche 1 — isDirty bridge ──────────────────────────────────────
// Reactively reflects whether the editor has unsaved content. The beforeunload
// handler in App.vue reads mainText + secondaryPool directly (always fresh, so
// a stale isDirty can never suppress the warning), but isDirty is exposed for
// other consumers (e.g. a future "unsaved changes" indicator in the UI).
//
// Port delta vs monolith (docs/index.html lines 2766-2770):
//   - getTA() → mainText.value (the Vue port's source of truth)
//   - cfg.default_meta → cfg.value.default_meta (cfg is now a ref)
//   - secondaryCols.some(c => c.linesEl.value.trim() !== '')
//       → secondaryPool.value.some(e => e.text.trim() !== '')
//   Per the roadmap quirk: the Vue port's secondaryCols is visible-only (it's
//   a computed over visible entries), so we read secondaryPool to also catch
//   hidden entries that may still hold text from a previous session.
//
// flush: 'sync' so tests can assert isDirty.value immediately after a mutation
// without awaiting nextTick. deep: true so per-entry .text mutations on
// secondaryPool trigger the watch. immediate: true so isDirty is correct on
// module init (matches the monolith's read-on-beforeunload semantics).
watch(
  [mainText, secondaryPool],
  () => {
    const hasMain =
      mainText.value.trim() !== cfg.value.default_meta.trim() &&
      mainText.value.trim() !== ''
    const hasSec = secondaryPool.value.some((e) => e.text.trim() !== '')
    isDirty.value = hasMain || hasSec
  },
  { immediate: true, deep: true, flush: 'sync' },
)

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
    mainText,
    mainWarnText,
    mainWarnVisible,
  }
}
