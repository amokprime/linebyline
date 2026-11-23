// Phase D Tranche 1 — generic localStorage-backed ref helper.
//
// Use this for scalar/JSON preferences that are read at startup and written
// on every change (theme already used the inline pattern in Phase C;
// useEditorFont and usePanelCollapse did the same). usePersistedRef
// formalizes that pattern so Tranche 4 (useAudio: lbl_vol, lbl_muted,
// lbl_speed) doesn't re-derive it.
//
// Not a replacement for the existing composables — they predate this helper
// and are left alone this tranche (consolidating them onto usePersistedRef
// is a post-cutover cleanup, not a Tranche 1 goal). The monolith's loadCfg
// also stays bespoke (it does the JSON-clone + migrateHotkeys dance which
// doesn't fit a generic helper).

import { computed, ref, type WritableComputedRef } from 'vue'

export interface PersistOptions<T> {
  // JSON.stringify by default. Override for non-JSON scalars (e.g. the
  // '0'|'1' string the monolith uses for lbl_muted — the helper stores it
  // as-is, not JSON-stringified, so a stored '1' round-trips to '1').
  serialize?: (value: T) => string
  // JSON.parse by default. Pair with a custom serialize.
  deserialize?: (raw: string) => T
  // Reject invalid stored values (e.g. NaN volume, out-of-range speed). On
  // failure the helper falls back to the default. Should not throw.
  validate?: (value: T) => boolean
}

// Read once at module load, fall back to `defaultValue` on any error or
// validation failure. Returns a `WritableComputedRef<T>` that delegates
// to an internal `ref<T>` for reactivity, with the setter persisting to
// localStorage on every write and silently rejecting invalid values.
//
// Using a writable computed that proxies an internal ref is the idiomatic
// Vue pattern — Vue's `ref` itself stores `value` on the prototype (not as
// an own property in Vue 3.5+), so overriding the descriptor with
// Object.defineProperty doesn't work. A writable computed wrapping an
// internal ref is the clean solution: the getter returns the internal
// ref's value (Vue tracks the dep), the setter validates + persists +
// updates the internal ref.
//
// Note: the returned ref does NOT re-sync if another tab writes the same
// key — the monolith doesn't listen for storage events either, so this is
// parity. If a future tranche needs cross-tab sync, swap this for a
// `storage` event listener.
export function usePersistedRef<T>(
  key: string,
  defaultValue: T,
  opts: PersistOptions<T> = {},
): WritableComputedRef<T> {
  const serialize = opts.serialize ?? ((v: T) => JSON.stringify(v))
  const deserialize = opts.deserialize ?? ((raw: string) => JSON.parse(raw) as T)
  const validate = opts.validate ?? (() => true)

  let initial: T
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === undefined) {
      initial = defaultValue
    } else {
      const parsed = deserialize(raw)
      initial = validate(parsed) ? parsed : defaultValue
    }
  } catch {
    initial = defaultValue
  }
  // Re-run validate against the default too — a bad default is preserved
  // (callers must pass a valid default; there is no fallback for a bad
  // default). Documented behaviour — see the test that pins it.
  if (!validate(initial)) initial = defaultValue

  // Internal reactive ref — the computed's getter reads this so Vue's
  // reactivity system tracks it. Direct external reads/writes go through
  // the computed's get/set below.
  const internal = ref<T>(initial) as { value: T }

  return computed<T>({
    get() {
      return internal.value
    },
    set(v: T) {
      if (!validate(v)) return
      try {
        localStorage.setItem(key, serialize(v))
      } catch {
        // Storage may be full or blocked (private mode). Silent failure —
        // the in-memory value still updates, the user just loses
        // persistence. The monolith has the same silent-fail behaviour.
      }
      internal.value = v
    },
  })
}

// Pre-seeded scalar refs for the three preferences still scattered across
// the monolith that are NOT yet owned by a composable. Each of these is a
// thin wrapper around usePersistedRef with the right type + validation.
//
// `lbl_speed` is the playback speed multiplier — default 1, valid (0, 5].
// `lbl_vol` is the master volume — default 1, valid [0, 1]. The monolith
//   stores the pre-mute volume and derives `masterMuted` from a 0 check
//   (single-source-of-truth); Tranche 4's useAudio formalizes that.
// `lbl_muted` is a separate '1'/'0' flag the monolith reads at init — kept
//   verbatim so existing localStorage round-trips.
// `lbl_speed` is the playback speed multiplier — default 1.
//   Monolith runtime clamp is [0.1, 4] (changeSpeed + Init both enforce it;
//   the HTML input's min=0.05 is a stale attr that has no effect since
//   changeSpeed clamps). Tranche 4 amended this validate from (0, 5] to
//   [0.1, 4] to match — a stored 4.5 or 0.05 now falls back to 1 at load
//   instead of sneaking through and getting silently clamped later.
export function useSpeed() {
  return usePersistedRef<number>('lbl_speed', 1, {
    validate: (v) => typeof v === 'number' && !Number.isNaN(v) && v >= 0.1 && v <= 4,
  })
}

export function useVolume() {
  return usePersistedRef<number>('lbl_vol', 1, {
    validate: (v) => typeof v === 'number' && !Number.isNaN(v) && v >= 0 && v <= 1,
  })
}

export function useMuted() {
  return usePersistedRef<boolean>('lbl_muted', false, {
    serialize: (v) => (v ? '1' : '0'),
    deserialize: (raw) => raw === '1',
  })
}
