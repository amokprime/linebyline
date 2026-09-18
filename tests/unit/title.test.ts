// @vitest-environment happy-dom
// Pins the Phase D Tranche 2 useTitle composable:
//  - updateTitleFromText parses [ti:] and [ar:] tags, updates songTitle/songArtist
//  - "Unknown" or blank tags fall back to "Unknown Title" / "Unknown Artist"
//  - setSongTitle sets the title directly (used by useAudio.setupAudio)
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
})

describe('useTitle — updateTitleFromText', () => {
  it('parses [ti:] and [ar:] tags into songTitle/songArtist', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle, songArtist } = useTitle()
    updateTitleFromText('[ti: My Song]\n[ar: My Artist]\nLyric line\n')
    expect(songTitle.value).toBe('My Song')
    expect(songArtist.value).toBe('My Artist')
  })

  it('trims whitespace from tag values', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle, songArtist } = useTitle()
    updateTitleFromText('[ti:   Spaced Title   ]\n[ar:   Spaced Artist   ]\n')
    expect(songTitle.value).toBe('Spaced Title')
    expect(songArtist.value).toBe('Spaced Artist')
  })

  it('falls back to "Unknown Title" when [ti:] is "Unknown"', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle } = useTitle()
    updateTitleFromText('[ti: Unknown]\n[ar: Real Artist]\n')
    expect(songTitle.value).toBe('Unknown Title')
  })

  it('falls back to "Unknown Title" when [ti:] is blank', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle } = useTitle()
    updateTitleFromText('[ti:   ]\n[ar: Real Artist]\n')
    expect(songTitle.value).toBe('Unknown Title')
  })

  it('falls back to "Unknown Title" when [ti:] is missing', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle } = useTitle()
    updateTitleFromText('[ar: Real Artist]\nLyric line\n')
    expect(songTitle.value).toBe('Unknown Title')
  })

  it('falls back to "Unknown Artist" when [ar:] is "Unknown"', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songArtist } = useTitle()
    updateTitleFromText('[ti: Real Title]\n[ar: Unknown]\n')
    expect(songArtist.value).toBe('Unknown Artist')
  })

  it('falls back to "Unknown Artist" when [ar:] is missing', async () => {
    const { useTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songArtist } = useTitle()
    updateTitleFromText('[ti: Real Title]\nLyric line\n')
    expect(songArtist.value).toBe('Unknown Artist')
  })

  it('defaults to "Unknown Title" / "Unknown Artist" at module load', async () => {
    const { useTitle } = await import('@/composables/useTitle')
    const { songTitle, songArtist } = useTitle()
    expect(songTitle.value).toBe('Unknown Title')
    expect(songArtist.value).toBe('Unknown Artist')
  })
})

describe('useTitle — setSongTitle', () => {
  it('sets the song title directly (for useAudio.setupAudio filename fallback)', async () => {
    const { useTitle, setSongTitle } = await import('@/composables/useTitle')
    const { songTitle } = useTitle()
    setSongTitle('My Song File')
    expect(songTitle.value).toBe('My Song File')
  })

  it('updateTitleFromText overwrites setSongTitle if [ti:] tag exists', async () => {
    const { useTitle, setSongTitle, updateTitleFromText } = await import('@/composables/useTitle')
    const { songTitle } = useTitle()
    setSongTitle('Filename Stem')
    expect(songTitle.value).toBe('Filename Stem')
    updateTitleFromText('[ti: Real Title]\n')
    expect(songTitle.value).toBe('Real Title')
  })
})
