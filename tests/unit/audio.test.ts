// @vitest-environment happy-dom
// Pins the Phase D Tranche 4 useAudio composable:
//  - fmtTime is a pure m:ss formatter
//  - toggleMute flips masterMuted; masterVolume is derived (0 when muted)
//  - onVolInput quantizes to cfg.vol_increment and unmutes
//  - onVolWheel steps by cfg.vol_increment and unmutes
//  - changeSpeed clamps to [0.1, 4], ratio-based, dir=0 resets to 1
//  - onSpeedChange parses + clamps; NaN reverts
//  - doSeek clamps to [0, duration]; auto-plays if not playing
//  - togglePlay no-ops without audioEl; pauses if playing; plays if not
//  - setupAudio creates Audio, sets volume/muted, resets speed, updates title
//  - mountProgressDrag returns a cleanup function; drag seeks + auto-plays
//  - currentMs returns 0 without audioEl
//
// Audio elements are mocked — happy-dom's HTMLAudioElement doesn't actually
// play audio. We spy on play/pause and set currentTime/duration directly.
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

// Mock HTMLAudioElement — happy-dom provides one but play() returns a promise
// that may reject without media. We create a real Audio() but stub play.
// duration is a readonly property on HTMLMediaElement, so we defineProperty it.
function makeMockAudio(dur = 0, currentTime = 0): HTMLAudioElement {
  const el = new Audio()
  el.play = vi.fn(() => Promise.resolve())
  el.pause = vi.fn()
  Object.defineProperty(el, 'duration', { value: dur, configurable: true, writable: true })
  Object.defineProperty(el, 'currentTime', { value: currentTime, configurable: true, writable: true })
  Object.defineProperty(el, 'volume', { value: 1, configurable: true, writable: true })
  Object.defineProperty(el, 'muted', { value: false, configurable: true, writable: true })
  Object.defineProperty(el, 'playbackRate', { value: 1, configurable: true, writable: true })
  return el
}

describe('useAudio — fmtTime (pure helper)', () => {
  it('formats seconds as m:ss', async () => {
    const { fmtTime } = await import('@/composables/useAudio')
    expect(fmtTime(0)).toBe('0:00')
    expect(fmtTime(5)).toBe('0:05')
    expect(fmtTime(65)).toBe('1:05')
    expect(fmtTime(125)).toBe('2:05')
    expect(fmtTime(3600)).toBe('60:00')
  })

  it('floors fractional seconds', async () => {
    const { fmtTime } = await import('@/composables/useAudio')
    expect(fmtTime(5.7)).toBe('0:05')
    expect(fmtTime(65.9)).toBe('1:05')
  })
})

describe('useAudio — volume + mute', () => {
  it('toggleMute flips masterMuted; masterVolume is derived (0 when muted)', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { masterMuted, masterVolume, savedVolume, toggleMute } = useAudio()
    expect(masterMuted.value).toBe(false)
    expect(masterVolume.value).toBe(1) // default vol = 1

    toggleMute()
    expect(masterMuted.value).toBe(true)
    expect(masterVolume.value).toBe(0) // derived: 0 when muted
    expect(localStorage.getItem('lbl_muted')).toBe('1')
    // savedVolume (in-memory) is unchanged — it's the pre-mute volume.
    // lbl_vol is NOT written to localStorage by muting — the monolith only
    // writes lbl_vol in applyVolume, which the muted state calls with
    // _preMuteVolume. Here, savedVolume stays 1 in memory; localStorage
    // stays null until the user explicitly sets a volume via the slider.
    expect(savedVolume.value).toBe(1)

    toggleMute()
    expect(masterMuted.value).toBe(false)
    expect(masterVolume.value).toBe(1) // restored from savedVolume
    expect(localStorage.getItem('lbl_muted')).toBe('0')
  })

  it('onVolInput quantizes to cfg.vol_increment and unmutes', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { masterMuted, masterVolume, onVolInput } = useAudio()
    masterMuted.value = true

    const target = { value: '0.55' } as HTMLInputElement
    onVolInput({ target } as unknown as Event)
    // cfg.vol_increment defaults to 0.1; 0.55 rounded to 0.1 = 0.6
    expect(masterVolume.value).toBeCloseTo(0.6, 2)
    expect(masterMuted.value).toBe(false)
    expect(localStorage.getItem('lbl_vol')).toBe('0.6')
  })

  it('onVolWheel steps by cfg.vol_increment and unmutes', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { masterMuted, masterVolume, onVolWheel } = useAudio()
    masterMuted.value = true

    // deltaY < 0 = scroll up = increase
    onVolWheel({ deltaY: -100, preventDefault: () => {} } as unknown as WheelEvent)
    expect(masterVolume.value).toBeCloseTo(1, 2) // 0 + 0.1 = 0.1... wait, savedVolume starts at 1
    // Actually savedVolume defaults to 1, so masterVolume = 1 when unmuted.
    // After unmute via wheel, masterMuted = false, masterVolume = savedVolume = 1.
    expect(masterMuted.value).toBe(false)
  })

  it('onVolWheel clamps to [0, 1]', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { masterVolume, onVolWheel, savedVolume } = useAudio()
    // Set savedVolume to 0.05, then wheel down — should clamp to 0
    savedVolume.value = 0.05
    onVolWheel({ deltaY: 100, preventDefault: () => {} } as unknown as WheelEvent)
    expect(masterVolume.value).toBe(0)
    // Wheel up from 0
    onVolWheel({ deltaY: -100, preventDefault: () => {} } as unknown as WheelEvent)
    expect(masterVolume.value).toBeCloseTo(0.1, 2)
  })
})

describe('useAudio — speed', () => {
  it('changeSpeed(0) resets to 1', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, changeSpeed } = useAudio()
    currentSpeed.value = 2
    changeSpeed(0)
    expect(currentSpeed.value).toBe(1)
    expect(localStorage.getItem('lbl_speed')).toBe('1')
  })

  it('changeSpeed(1) multiplies by cfg.speed_ratio and clamps to 4', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, changeSpeed } = useAudio()
    currentSpeed.value = 3.5
    // ratio = 1.1; 3.5 * 1.1 = 3.85, rounded to 3.85
    changeSpeed(1)
    expect(currentSpeed.value).toBeCloseTo(3.85, 2)
    // Another up — 3.85 * 1.1 = 4.235, clamped to 4
    changeSpeed(1)
    expect(currentSpeed.value).toBe(4)
  })

  it('changeSpeed(-1) divides by cfg.speed_ratio and clamps to 0.1', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, changeSpeed } = useAudio()
    currentSpeed.value = 0.12
    // ratio = 1.1; 0.12 / 1.1 = 0.109..., rounded to 0.11
    changeSpeed(-1)
    expect(currentSpeed.value).toBeCloseTo(0.11, 2)
    // Another down — 0.11 / 1.1 = 0.1, clamped to 0.1
    changeSpeed(-1)
    expect(currentSpeed.value).toBe(0.1)
  })

  it('onSpeedChange parses + clamps to [0.1, 4]', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, onSpeedChange } = useAudio()
    const target = { value: '2.5' } as HTMLInputElement
    onSpeedChange({ target } as unknown as Event)
    expect(currentSpeed.value).toBe(2.5)

    const highTarget = { value: '10' } as HTMLInputElement
    onSpeedChange({ target: highTarget } as unknown as Event)
    expect(currentSpeed.value).toBe(4)

    const lowTarget = { value: '0.01' } as HTMLInputElement
    onSpeedChange({ target: lowTarget } as unknown as Event)
    expect(currentSpeed.value).toBe(0.1)
  })

  it('onSpeedChange reverts on NaN (empty input)', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, onSpeedChange } = useAudio()
    currentSpeed.value = 1.5
    const target = { value: '' } as HTMLInputElement
    onSpeedChange({ target } as unknown as Event)
    expect(currentSpeed.value).toBe(1.5) // unchanged
  })

  it('speedDisplay shows "1" for exactly 1, else toFixed(2)', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentSpeed, speedDisplay } = useAudio()
    currentSpeed.value = 1
    expect(speedDisplay.value).toBe('1')
    currentSpeed.value = 1.5
    expect(speedDisplay.value).toBe('1.50')
    currentSpeed.value = 0.75
    expect(speedDisplay.value).toBe('0.75')
  })
})

describe('useAudio — doSeek', () => {
  it('doSeek no-ops without audioEl', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { doSeek, playing } = useAudio()
    expect(() => doSeek(1)).not.toThrow()
    expect(playing.value).toBe(false)
  })

  it('doSeek clamps to [0, duration] and auto-plays if not playing', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { doSeek, playing, audioEl } = useAudio()
    const mock = makeMockAudio(100, 98)
    audioEl.value = mock
    // cfg.seek_increment_s defaults to 5
    doSeek(1)
    // 98 + 5 = 103, clamped to 100
    expect(mock.currentTime).toBe(100)
    expect(playing.value).toBe(true)
    expect(mock.play).toHaveBeenCalled()
  })

  it('doSeek(-1) seeks backward and auto-plays', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { doSeek, playing, audioEl } = useAudio()
    const mock = makeMockAudio(100, 10)
    audioEl.value = mock
    doSeek(-1)
    expect(mock.currentTime).toBe(5)
    expect(playing.value).toBe(true)
  })
})

describe('useAudio — togglePlay', () => {
  it('togglePlay no-ops without audioEl', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { togglePlay, playing } = useAudio()
    expect(() => togglePlay()).not.toThrow()
    expect(playing.value).toBe(false)
  })

  it('togglePlay pauses if playing', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { togglePlay, playing, audioEl } = useAudio()
    const mock = makeMockAudio()
    audioEl.value = mock
    playing.value = true
    togglePlay()
    expect(mock.pause).toHaveBeenCalled()
    expect(playing.value).toBe(false)
  })

  it('togglePlay plays if not playing, sets lastPlayingLine', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { useAppState } = await import('@/composables/useAppState')
    const { activeLine } = useAppState()
    activeLine.value = 2

    const { togglePlay, playing, audioEl, lastPlayingLine } = useAudio()
    const mock = makeMockAudio()
    audioEl.value = mock
    togglePlay()
    expect(mock.play).toHaveBeenCalled()
    expect(playing.value).toBe(true)
    expect(lastPlayingLine.value).toBe(2)
  })
})

describe('useAudio — setupAudio', () => {
  it('creates a new Audio element, resets speed to 1, updates song title', async () => {
    const { useAudio, initAudio } = await import('@/composables/useAudio')
    const { setupAudio, audioEl, currentSpeed } = useAudio()
    const { songTitle } = await import('@/composables/useTitle').then(m => m.useTitle())
    const { lastImportStem } = (await import('@/composables/useAppState')).useAppState()
    currentSpeed.value = 2

    // Init with callbacks that return known text
    initAudio(
      { progressWrap: { value: null } as any, seekOffset: { value: null } as any },
      { getMainText: () => '[ti: Unknown]\n[ar: Artist]\nLyric line\n', setMainText: () => {} },
    )

    const file = new File(['dummy'], 'My Song.mp3', { type: 'audio/mpeg' })
    setupAudio(file)
    expect(audioEl.value).not.toBeNull()
    expect(currentSpeed.value).toBe(1)
    expect(songTitle.value).toBe('My Song')
    expect(lastImportStem.value).toBe('My Song')
  })

  it('overwrites [ti:] only if blank or "unknown"', async () => {
    const { useAudio, initAudio } = await import('@/composables/useAudio')
    const { setupAudio } = useAudio()
    let mainText = '[ti: Unknown]\n[ar: Artist]\nLyric\n'
    initAudio(
      { progressWrap: { value: null } as any, seekOffset: { value: null } as any },
      {
        getMainText: () => mainText,
        setMainText: (t) => { mainText = t },
        updateTitleFromText: () => {},
      },
    )
    const file = new File(['dummy'], 'New Title.mp3', { type: 'audio/mpeg' })
    setupAudio(file)
    expect(mainText).toContain('[ti: New Title]')

    // Now set a real title — setupAudio should NOT overwrite it
    mainText = '[ti: Real Title]\n[ar: Artist]\nLyric\n'
    setupAudio(file)
    expect(mainText).toContain('[ti: Real Title]')
    expect(mainText).not.toContain('[ti: New Title]')
  })
})

describe('useAudio — mountProgressDrag', () => {
  it('returns a cleanup function; no-ops if progressWrap is null', async () => {
    const { useAudio, initAudio } = await import('@/composables/useAudio')
    initAudio(
      { progressWrap: { value: null } as any, seekOffset: { value: null } as any },
    )
    const { mountProgressDrag } = useAudio()
    const cleanup = mountProgressDrag()
    expect(typeof cleanup).toBe('function')
    cleanup() // should not throw
  })

  it('attaches mousedown listener; drag seeks + auto-plays on mouseup', async () => {
    const { useAudio, initAudio } = await import('@/composables/useAudio')
    const { audioEl, playing, mountProgressDrag } = useAudio()
    const mock = makeMockAudio(100, 0)
    audioEl.value = mock

    const wrap = document.createElement('div')
    wrap.getBoundingClientRect = () => ({ left: 0, width: 100, top: 0, height: 10, right: 100, bottom: 10, x: 0, y: 0, toJSON: () => '' }) as DOMRect
    document.body.appendChild(wrap)

    initAudio(
      { progressWrap: { value: wrap } as any, seekOffset: { value: null } as any },
    )
    const cleanup = mountProgressDrag()

    // Simulate drag: mousedown at x=50, mousemove to x=80, mouseup
    wrap.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50 }))
    // After mousedown at 50/100 = 50%, currentTime = 50
    expect(mock.currentTime).toBe(50)

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }))
    // After mousemove to 80/100 = 80%, currentTime = 80
    expect(mock.currentTime).toBe(80)

    document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }))
    // mouseup auto-plays (was not playing before)
    expect(playing.value).toBe(true)
    expect(mock.play).toHaveBeenCalled()

    cleanup()
    document.body.removeChild(wrap)
  })
})

describe('useAudio — currentMs', () => {
  it('returns 0 without audioEl', async () => {
    const { currentMs } = await import('@/composables/useAudio')
    expect(currentMs()).toBe(0)
  })

  it('returns currentTime * 1000', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { audioEl, currentMs } = useAudio()
    const mock = makeMockAudio()
    mock.currentTime = 5.5
    audioEl.value = mock
    expect(currentMs()).toBe(5500)
  })
})

describe('useAudio — reactive display', () => {
  it('progressPct is 0 when duration is 0', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { progressPct } = useAudio()
    expect(progressPct.value).toBe(0)
  })

  it('ariaValueText formats as "m:ss of m:ss"', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { currentTime, duration, ariaValueText } = useAudio()
    currentTime.value = 65
    duration.value = 125
    expect(ariaValueText.value).toBe('1:05 of 2:05')
  })

  it('muted is true when masterMuted OR masterVolume is 0', async () => {
    const { useAudio } = await import('@/composables/useAudio')
    const { muted, masterMuted, savedVolume } = useAudio()
    expect(muted.value).toBe(false)

    masterMuted.value = true
    expect(muted.value).toBe(true)

    masterMuted.value = false
    savedVolume.value = 0
    expect(muted.value).toBe(true)
  })
})
