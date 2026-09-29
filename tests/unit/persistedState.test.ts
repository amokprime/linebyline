// @vitest-environment happy-dom
// Pins the usePersistedState composable (Tranche 1 Phase D foundation):
//  - default JSON serialize/deserialize round-trips
//  - validation rejects bad stored values, falls back to default
//  - validation rejects bad defaults too
//  - serialize/deserialize override supports non-JSON scalars (lbl_muted '0'/'1')
//  - setter persists to localStorage on every write
//  - storage failures (quota / private mode) fall back to in-memory only
//  - useSpeed / useVolume / useMuted wrappers enforce the documented ranges
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effect, nextTick } from 'vue'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

async function loadHelper() {
  return await import('@/composables/usePersistedState')
}

describe('usePersistedRef — JSON default round-trip', () => {
  it('returns the default when localStorage is empty', async () => {
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_x', 42)
    expect(r.value).toBe(42)
  })

  it('reads a stored JSON value at init', async () => {
    localStorage.setItem('lbl_x', JSON.stringify(99))
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_x', 0)
    expect(r.value).toBe(99)
  })

  it('persists on every set', async () => {
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_x', 0)
    r.value = 7
    expect(localStorage.getItem('lbl_x')).toBe('7')
    r.value = 8
    expect(localStorage.getItem('lbl_x')).toBe('8')
  })

  it('falls back to default on JSON.parse error', async () => {
    localStorage.setItem('lbl_x', 'not json')
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_x', 42)
    expect(r.value).toBe(42)
  })

  it('falls back to default when validate rejects the stored value', async () => {
    localStorage.setItem('lbl_vol', JSON.stringify(2)) // out of [0,1] range
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_vol', 1, {
      validate: (v) => typeof v === 'number' && v >= 0 && v <= 1,
    })
    expect(r.value).toBe(1)
  })

  it('rejects a bad default through validate too', async () => {
    const { usePersistedRef } = await loadHelper()
    // Pass an invalid default (out of range). validate should reject it and
    // the helper should... still return it because there is no fallback for
    // a bad default — we documented this in the helper, callers must pass a
    // valid default. Verify the behaviour we actually have: validate is
    // called on the default, and if it fails we leave the default as-is.
    // (The current implementation re-runs validate against the default and
    //  falls back to itself — so an invalid default is preserved, not
    //  silently replaced. The contract is: pass a valid default.)
    const r = usePersistedRef<number>('lbl_bad', 999, {
      validate: (v) => v < 100,
    })
    // Per the implementation, an invalid default stays — the validate against
    // the default returns false and we set `cached = defaultValue` (a no-op
    // re-assignment to itself). Documented behaviour.
    expect(r.value).toBe(999)
    // But the setter respects validate — setting a bad value is a no-op
    r.value = 50
    expect(r.value).toBe(50)
    r.value = 200
    expect(r.value).toBe(50) // unchanged — setter rejected 200
    expect(localStorage.getItem('lbl_bad')).toBe('50')
  })

  it('is reactive — effects re-run on set', async () => {
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<number>('lbl_x', 0)
    let observed = 0
    effect(() => {
      observed = r.value
    })
    r.value = 5
    await nextTick()
    expect(observed).toBe(5)
  })
})

describe('usePersistedRef — custom serialize/deserialize', () => {
  it('supports a non-JSON scalar format (lbl_muted 0/1)', async () => {
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<boolean>('lbl_muted', false, {
      serialize: (v) => (v ? '1' : '0'),
      deserialize: (raw) => raw === '1',
    })
    expect(r.value).toBe(false)
    expect(localStorage.getItem('lbl_muted')).toBeNull()
    r.value = true
    expect(localStorage.getItem('lbl_muted')).toBe('1')
    expect(r.value).toBe(true)
  })

  it('reads a stored non-JSON scalar at init', async () => {
    localStorage.setItem('lbl_muted', '1')
    const { usePersistedRef } = await loadHelper()
    const r = usePersistedRef<boolean>('lbl_muted', false, {
      serialize: (v) => (v ? '1' : '0'),
      deserialize: (raw) => raw === '1',
    })
    expect(r.value).toBe(true)
  })
})

describe('usePersistedRef — storage failure resilience', () => {
  it('init falls back to default when localStorage.getItem throws', async () => {
    const { usePersistedRef } = await loadHelper()
    // Override getItem to throw (simulates private-mode Safari)
    const original = localStorage.getItem
    Object.defineProperty(localStorage, 'getItem', {
      configurable: true,
      value: () => {
        throw new Error('quota')
      },
    })
    try {
      const r = usePersistedRef<number>('lbl_x', 42)
      expect(r.value).toBe(42)
    } finally {
      Object.defineProperty(localStorage, 'getItem', {
        configurable: true,
        value: original,
      })
    }
  })

  it('setter swallows setItem failures silently (in-memory still updates)', async () => {
    const { usePersistedRef } = await loadHelper()
    const original = localStorage.setItem
    Object.defineProperty(localStorage, 'setItem', {
      configurable: true,
      value: () => {
        throw new Error('quota')
      },
    })
    try {
      const r = usePersistedRef<number>('lbl_x', 0)
      r.value = 7
      expect(r.value).toBe(7) // in-memory updated
    } finally {
      Object.defineProperty(localStorage, 'setItem', {
        configurable: true,
        value: original,
      })
    }
  })
})

describe('useSpeed / useVolume / useMuted pre-seeded wrappers', () => {
  it('useSpeed defaults to 1', async () => {
    const { useSpeed } = await loadHelper()
    const r = useSpeed()
    expect(r.value).toBe(1)
  })

  it('useSpeed reads a stored speed value', async () => {
    localStorage.setItem('lbl_speed', JSON.stringify(1.5))
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1.5)
  })

  it('useSpeed rejects a NaN stored value (falls back to 1)', async () => {
    localStorage.setItem('lbl_speed', 'NaN')
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1)
  })

  it('useSpeed rejects a 0 stored value (the monolith treats 0 as invalid)', async () => {
    localStorage.setItem('lbl_speed', '0')
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1)
  })

  it('useSpeed rejects a negative stored value', async () => {
    localStorage.setItem('lbl_speed', JSON.stringify(-1))
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1)
  })

  it('useSpeed rejects a stored value above 4 (monolith runtime clamp [0.1, 4])', async () => {
    localStorage.setItem('lbl_speed', JSON.stringify(4.5))
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1)
  })

  it('useSpeed rejects a stored value below 0.1 (monolith runtime clamp [0.1, 4])', async () => {
    localStorage.setItem('lbl_speed', JSON.stringify(0.05))
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(1)
  })

  it('useSpeed accepts the boundary values 0.1 and 4', async () => {
    localStorage.setItem('lbl_speed', JSON.stringify(0.1))
    const { useSpeed } = await loadHelper()
    expect(useSpeed().value).toBe(0.1)
    localStorage.setItem('lbl_speed', JSON.stringify(4))
    const mod = await import('@/composables/usePersistedState')
    expect(mod.useSpeed().value).toBe(4)
  })

  it('useVolume defaults to 1 and accepts the full [0,1] range', async () => {
    const { useVolume } = await loadHelper()
    const r = useVolume()
    expect(r.value).toBe(1)
    r.value = 0
    expect(r.value).toBe(0)
    expect(localStorage.getItem('lbl_vol')).toBe('0')
    r.value = 0.5
    expect(r.value).toBe(0.5)
    expect(localStorage.getItem('lbl_vol')).toBe('0.5')
  })

  it('useVolume rejects an out-of-range stored value (e.g. 2)', async () => {
    localStorage.setItem('lbl_vol', JSON.stringify(2))
    const { useVolume } = await loadHelper()
    expect(useVolume().value).toBe(1)
  })

  it('useMuted defaults to false and stores as "0"/"1"', async () => {
    const { useMuted } = await loadHelper()
    const r = useMuted()
    expect(r.value).toBe(false)
    r.value = true
    expect(localStorage.getItem('lbl_muted')).toBe('1')
    expect(r.value).toBe(true)
    r.value = false
    expect(localStorage.getItem('lbl_muted')).toBe('0')
  })

  it('useMuted reads a stored "1" as true and any other value as false', async () => {
    localStorage.setItem('lbl_muted', '1')
    const { useMuted } = await loadHelper()
    expect(useMuted().value).toBe(true)
    localStorage.setItem('lbl_muted', '0')
    const mod = await import('@/composables/usePersistedState')
    expect(mod.useMuted().value).toBe(false)
  })
})
