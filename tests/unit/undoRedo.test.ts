// Pins the useUndoRedo composable (Tranche 1 Phase D foundation):
//  - single-push model: pushSnapshot clears redoStack
//  - canUndo requires 2+ entries (seed + one change); canRedo requires 1+
//  - doUndo pops undo → pushes redo → applies the new top of undoStack
//  - doRedo pops redo → pushes undo → applies the new top of undoStack
//  - undoStack capped at 100 entries (shift oldest)
//  - seed() replaces the entire stack with one snapshot, clears redo, cancels pending input
//  - scheduleInputSnapshot debounces; cancelPendingInput cancels a pending push
//  - applySnapshot callback receives the snapshot — the caller owns DOM writes
//  - multiple useUndoRedo instances have independent timers (no shared state)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// Helper — a minimal in-memory take/apply pair. The real takeSnapshot reads
// DOM textareas; the composable is shape-only this tranche, so tests use a
// plain object as the "DOM state".
function makeFixture() {
  const state = { main: '', secondaries: [] as string[], mergeDone: false }
  const applied: string[] = []
  const takeSnapshot = () => ({
    main: state.main,
    secondaries: [...state.secondaries],
    mergeDone: state.mergeDone,
  })
  const applySnapshot = (snap: { main: string; secondaries: string[]; mergeDone: boolean }) => {
    state.main = snap.main
    state.secondaries = [...snap.secondaries]
    state.mergeDone = snap.mergeDone
    applied.push(snap.main)
  }
  return { state, applied, takeSnapshot, applySnapshot }
}

async function loadUndoRedo() {
  return await import('@/composables/useUndoRedo')
}

describe('useUndoRedo — initial state', () => {
  it('starts with empty stacks; canUndo and canRedo both false', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { undoStack, redoStack, canUndo, canRedo } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    expect(undoStack.value).toEqual([])
    expect(redoStack.value).toEqual([])
    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })

  it('seed sets undoStack to a single snapshot and clears redo', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    f.state.main = 'initial'
    const { undoStack, redoStack, seed, canUndo } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed(f.takeSnapshot())
    expect(undoStack.value).toHaveLength(1)
    expect(undoStack.value[0]!.main).toBe('initial')
    expect(redoStack.value).toEqual([])
    // canUndo requires 2 — seed alone does not enable undo
    expect(canUndo.value).toBe(false)
  })
})

describe('useUndoRedo — single-push model', () => {
  it('pushSnapshot adds to undoStack and clears redoStack', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    pushSnapshot()
    f.state.main = 'c'
    pushSnapshot()
    expect(undoStack.value.map((s) => s.main)).toEqual(['a', 'b', 'c'])
    expect(redoStack.value).toEqual([])
  })

  it('after an undo, a new push clears the redo stack (single-push model)', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, doUndo, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    pushSnapshot()
    f.state.main = 'c'
    pushSnapshot()
    doUndo() // c → b
    expect(redoStack.value.map((s) => s.main)).toEqual(['c'])
    f.state.main = 'd'
    pushSnapshot() // single-push: clears redo
    expect(redoStack.value).toEqual([])
    expect(undoStack.value.map((s) => s.main)).toEqual(['a', 'b', 'd'])
  })
})

describe('useUndoRedo — canUndo / canRedo', () => {
  it('canUndo is false with only the seed, true after one push', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, canUndo, canRedo, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    expect(canUndo.value).toBe(false)
    f.state.main = 'b'
    pushSnapshot()
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(false)
  })

  it('canRedo becomes true after an undo', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, doUndo, canRedo, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    pushSnapshot()
    doUndo()
    expect(canRedo.value).toBe(true)
  })
})

describe('useUndoRedo — doUndo / doRedo', () => {
  it('doUndo pops undo, pushes redo, applies the new top of undoStack', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, doUndo, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    pushSnapshot()
    f.state.main = 'c'
    pushSnapshot()
    f.state.main = 'd' // uncommitted change
    doUndo() // c → b (the last committed undo step)
    expect(undoStack.value.map((s) => s.main)).toEqual(['a', 'b'])
    expect(redoStack.value.map((s) => s.main)).toEqual(['c'])
    // applySnapshot was called with 'b' — the new top of undoStack
    expect(f.state.main).toBe('b')
    expect(f.applied[f.applied.length - 1]).toBe('b')
  })

  it('doUndo is a no-op when canUndo is false (only seed present)', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { doUndo, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    doUndo()
    expect(undoStack.value).toHaveLength(1)
    expect(redoStack.value).toEqual([])
  })

  it('doRedo pops redo, pushes undo, applies the new top of undoStack', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, doUndo, doRedo, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    pushSnapshot()
    doUndo()
    expect(redoStack.value.map((s) => s.main)).toEqual(['b'])
    doRedo()
    expect(redoStack.value).toEqual([])
    expect(undoStack.value.map((s) => s.main)).toEqual(['a', 'b'])
    expect(f.state.main).toBe('b')
  })

  it('doRedo is a no-op when canRedo is false (empty redoStack)', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { doRedo, undoStack, redoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    doRedo()
    expect(undoStack.value).toHaveLength(1)
    expect(redoStack.value).toEqual([])
  })
})

describe('useUndoRedo — undoStack cap', () => {
  it('caps undoStack at 100 entries (shifts the oldest)', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, undoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'seed', secondaries: [], mergeDone: false })
    for (let i = 1; i <= 100; i++) {
      f.state.main = `v${i}`
      pushSnapshot()
    }
    // 1 seed + 100 pushes = 101, but the cap is 100 — the seed is shifted off
    expect(undoStack.value).toHaveLength(100)
    expect(undoStack.value[0]!.main).toBe('v1') // seed shifted off
    expect(undoStack.value[99]!.main).toBe('v100')
    // one more push shifts v1 off
    f.state.main = 'v101'
    pushSnapshot()
    expect(undoStack.value).toHaveLength(100)
    expect(undoStack.value[0]!.main).toBe('v2')
    expect(undoStack.value[99]!.main).toBe('v101')
  })
})

describe('useUndoRedo — input debounce', () => {
  it('scheduleInputSnapshot debounces — push only fires after the delay', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { scheduleInputSnapshot, undoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    scheduleInputSnapshot(150)
    expect(undoStack.value).toHaveLength(1) // not yet
    vi.advanceTimersByTime(149)
    expect(undoStack.value).toHaveLength(1) // still not
    vi.advanceTimersByTime(2)
    expect(undoStack.value).toHaveLength(2)
    expect(undoStack.value[1]!.main).toBe('b')
  })

  it('rapid input resets the timer — only the last change is pushed', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { scheduleInputSnapshot, undoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    scheduleInputSnapshot(100)
    vi.advanceTimersByTime(50)
    f.state.main = 'c'
    scheduleInputSnapshot(100) // reset
    vi.advanceTimersByTime(50)
    expect(undoStack.value).toHaveLength(1) // still pending
    vi.advanceTimersByTime(50) // total 100 since the second call
    expect(undoStack.value).toHaveLength(2)
    expect(undoStack.value[1]!.main).toBe('c') // last value wins
  })

  it('cancelPendingInput cancels a scheduled push', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { scheduleInputSnapshot, cancelPendingInput, undoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    scheduleInputSnapshot(100)
    cancelPendingInput()
    vi.advanceTimersByTime(500)
    expect(undoStack.value).toHaveLength(1) // never pushed
  })

  it('seed cancels any pending input snapshot', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { scheduleInputSnapshot, seed, undoStack } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    f.state.main = 'pending'
    scheduleInputSnapshot(100)
    seed({ main: 'fresh-seed', secondaries: [], mergeDone: false })
    vi.advanceTimersByTime(500)
    expect(undoStack.value).toHaveLength(1)
    expect(undoStack.value[0]!.main).toBe('fresh-seed')
  })
})

describe('useUndoRedo — instance independence', () => {
  it('two useUndoRedo instances have independent stacks and timers', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f1 = makeFixture()
    const f2 = makeFixture()
    const a = useUndoRedo({ takeSnapshot: f1.takeSnapshot, applySnapshot: f1.applySnapshot })
    const b = useUndoRedo({ takeSnapshot: f2.takeSnapshot, applySnapshot: f2.applySnapshot })
    a.seed({ main: 'a-seed', secondaries: [], mergeDone: false })
    b.seed({ main: 'b-seed', secondaries: [], mergeDone: false })
    f1.state.main = 'a-v1'
    a.pushSnapshot()
    expect(a.undoStack.value).toHaveLength(2)
    expect(b.undoStack.value).toHaveLength(1) // independent
    // timer independence
    f1.state.main = 'a-v2'
    a.scheduleInputSnapshot(100)
    f2.state.main = 'b-v2'
    b.scheduleInputSnapshot(100)
    vi.advanceTimersByTime(100)
    expect(a.undoStack.value).toHaveLength(3) // a-v2 pushed
    expect(b.undoStack.value).toHaveLength(2) // b-v2 pushed
    // a's pending timer doesn't bleed into b
    a.cancelPendingInput()
    f2.state.main = 'b-v3'
    b.scheduleInputSnapshot(100)
    vi.advanceTimersByTime(100)
    expect(a.undoStack.value).toHaveLength(3) // unchanged
    expect(b.undoStack.value).toHaveLength(3) // b-v3 pushed
  })
})

describe('useUndoRedo — Snapshot shape contract', () => {
  it('applySnapshot receives the snapshot with main, secondaries, mergeDone', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const seen: unknown[] = []
    const f = makeFixture()
    const { pushSnapshot, doUndo, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: (snap) => seen.push(snap),
    })
    seed({ main: 'a', secondaries: ['s1'], mergeDone: false })
    f.state.main = 'b'
    f.state.secondaries = ['s1', 's2']
    f.state.mergeDone = true
    pushSnapshot()
    doUndo() // applies the seed snapshot
    expect(seen).toHaveLength(1)
    expect(seen[0]).toEqual({ main: 'a', secondaries: ['s1'], mergeDone: false })
  })

  it('secondaries is a fresh array on each snapshot (no aliasing)', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, undoStack, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    // Seed with one secondary; mirror that into state so subsequent pushes
    // build on top of it (seed itself does NOT mutate state — it only puts
    // the snapshot on the undoStack; this is the same shape as the monolith's
    // loadAutosave which seeds undoStack without going through applySnapshot).
    f.state.secondaries = ['s1']
    seed({ main: 'a', secondaries: ['s1'], mergeDone: false })
    f.state.secondaries.push('s2')
    pushSnapshot()
    f.state.secondaries.push('s3')
    pushSnapshot()
    // Each snapshot captured a copy — later mutation didn't change earlier snapshots
    expect(undoStack.value[0]!.secondaries).toEqual(['s1'])
    expect(undoStack.value[1]!.secondaries).toEqual(['s1', 's2'])
    expect(undoStack.value[2]!.secondaries).toEqual(['s1', 's2', 's3'])
  })

  it('mergeDone is captured in the snapshot', async () => {
    const { useUndoRedo } = await loadUndoRedo()
    const f = makeFixture()
    const { pushSnapshot, doUndo, seed } = useUndoRedo({
      takeSnapshot: f.takeSnapshot,
      applySnapshot: f.applySnapshot,
    })
    seed({ main: 'a', secondaries: [], mergeDone: false })
    f.state.main = 'b'
    f.state.mergeDone = true
    pushSnapshot()
    doUndo()
    expect(f.state.mergeDone).toBe(false)
  })
})
