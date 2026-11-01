// Phase D Tranche 1 — snapshot-based undo/redo, ported from the monolith
// "── Snapshot-based undo/redo ──" section.
//
// The monolith's takeSnapshot/applySnapshot/pushSnapshot/doUndo/doRedo
// operate directly on DOM (the main textarea + the secondary textareas).
// To keep Tranche 1 dependency-free and unit-testable in pure node, this
// composable is **shape-only**: callers pass a `takeSnapshot` factory and
// an `applySnapshot` callback to the `useUndoRedo` factory. The composable
// manages the stacks + the input-debounce timer; the caller owns the DOM
// writes. Tranche 2 wires real take/apply once useAutosave and the
// #main-textarea ref exist.
//
// PORT DELTAS from the monolith:
//  - Stacks are `ref<Snapshot[]>` so Vue re-renders undo/redo button disabled
//    state reactively. The monolith's `undoStack.length < 2` guard becomes
//    a computed `canUndo`.
//  - Single-push model preserved: `pushSnapshot` pushes post-change and
//    clears `redoStack`. Wholesale-replacement ops call `pushSnapshot`
//    before AND after — the code-quality skill documents why.
//  - Input debounce: `scheduleInputSnapshot(debounceMs)` clears any pending
//    timer and sets a new one. The monolith's `_undoDebounceTimer` is a
//    module-level `let`; here it's a closure variable inside the composable
//    so multiple `useUndoRedo` instances don't share one timer (a real risk
//    in tests that mount the composable twice).
//  - `applySnapshot` must clear extra secondaries beyond the snapshot's
//    `secondaries.length` (the documented invariant — undoing to a
//    pre-add snapshot must not leave stale text in still-visible columns).
//    The composable enforces this by passing the snapshot to the caller's
//    apply callback; the caller is responsible for the clear. A comment
//    in the Snapshot type reminds the caller.

import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface Snapshot {
  // Main textarea content.
  main: string
  // Secondary-field text content, in pool order. May be shorter than the
  // current pool — applySnapshot must clear any extra entries (see the
  // code-quality skill: "applySnapshot must clear extra secondaries beyond
  // the snapshot's secondaries.length, or undoing to a pre-add snapshot
  // leaves stale content in still-visible textareas").
  secondaries: string[]
  // Whether mergeTranslations has been run. The monolith tracks mergeDone
  // as a top-level state; the snapshot captures it so undo/redo also
  // reverts the merge state (otherwise the merge button would stay
  // disabled after undoing a merge).
  mergeDone: boolean
}

export interface UndoRedoApi {
  // Stack of snapshots. undoStack[undoStack.length - 1] is the current
  // state. Seeded with one snapshot at init (the monolith does this in
  // loadAutosave: `undoStack = [takeSnapshot()]`).
  undoStack: Ref<Snapshot[]>
  redoStack: Ref<Snapshot[]>
  // Computed disabled-state for the menu-bar buttons. `canUndo` requires
  // at least 2 entries (the seed + one change); `canRedo` requires at
  // least 1 entry. Matches the monolith's guards.
  canUndo: ComputedRef<boolean>
  canRedo: ComputedRef<boolean>
  // Push the current state. Single-push: clears redoStack. Caps undoStack
  // at 100 entries (the monolith's `if(undoStack.length>100) shift()`).
  pushSnapshot: () => void
  // Pop undo → push redo → apply. No-op if canUndo is false.
  doUndo: () => void
  // Pop redo → push undo → apply. No-op if canRedo is false.
  doRedo: () => void
  // Replace the entire undo stack with a single seed snapshot. Used at
  // init (after loadAutosave) and after wholesale imports that should not
  // be undoable past the import point.
  seed: (snap: Snapshot) => void
  // Debounced push for the textarea `input` event. Clears any pending
  // timer and sets a new one with `debounceMs`. The monolith's value is
  // `cfg.undo_debounce_ms || 100`; the caller passes the configured value.
  scheduleInputSnapshot: (debounceMs: number) => void
  // Cancel any pending debounced push. Useful before a wholesale-replace
  // op (which calls pushSnapshot directly) to avoid a stale timer firing
  // after the push.
  cancelPendingInput: () => void
}

export interface UndoRedoOptions {
  // Returns the current state as a Snapshot. Called by pushSnapshot and
  // seed. The caller is responsible for reading the DOM (main textarea
  // + secondary textareas) — this composable doesn't know about elements.
  takeSnapshot: () => Snapshot
  // Applies a snapshot to the DOM. Called by doUndo and doRedo. The
  // caller is responsible for: writing the main textarea, writing each
  // secondary textarea up to snapshot.secondaries.length, CLEARING any
  // extra secondary textareas beyond that, setting mergeDone, and
  // triggering re-render + autosave. The composable only manages the
  // stack ordering.
  applySnapshot: (snap: Snapshot) => void
}

export function useUndoRedo(opts: UndoRedoOptions): UndoRedoApi {
  const undoStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])
  let inputTimer: ReturnType<typeof setTimeout> | null = null

  const canUndo = computed(() => undoStack.value.length >= 2)
  const canRedo = computed(() => redoStack.value.length >= 1)

  function pushSnapshot() {
    const snap = opts.takeSnapshot()
    undoStack.value.push(snap)
    if (undoStack.value.length > 100) undoStack.value.shift()
    redoStack.value = []
  }

  function doUndo() {
    if (undoStack.value.length < 2) return
    const popped = undoStack.value.pop()!
    redoStack.value.push(popped)
    const current = undoStack.value[undoStack.value.length - 1]
    if (current) opts.applySnapshot(current)
  }

  function doRedo() {
    if (redoStack.value.length === 0) return
    const popped = redoStack.value.pop()!
    undoStack.value.push(popped)
    const current = undoStack.value[undoStack.value.length - 1]
    if (current) opts.applySnapshot(current)
  }

  function seed(snap: Snapshot) {
    undoStack.value = [snap]
    redoStack.value = []
    cancelPendingInput()
  }

  function scheduleInputSnapshot(debounceMs: number) {
    if (inputTimer !== null) clearTimeout(inputTimer)
    inputTimer = setTimeout(() => {
      inputTimer = null
      pushSnapshot()
    }, Math.max(0, debounceMs))
  }

  function cancelPendingInput() {
    if (inputTimer !== null) {
      clearTimeout(inputTimer)
      inputTimer = null
    }
  }

  return {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    pushSnapshot,
    doUndo,
    doRedo,
    seed,
    scheduleInputSnapshot,
    cancelPendingInput,
  }
}
