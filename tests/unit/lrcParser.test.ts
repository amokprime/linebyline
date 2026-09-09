import { describe, expect, it } from 'vitest'

import {
  collapseBlanks,
  findLastMetaIdx,
  isEndTs,
  isHeader,
  lrcHasTi,
  msToTs,
  normalizeLrcTimestamps,
  replaceTs,
  stripSecLine,
  tsToMs,
} from '@/utils/lrcParser'

describe('tsToMs / msToTs', () => {
  it('parses [mm:ss.cc] to milliseconds', () => {
    expect(tsToMs('[01:23.45]')).toBe(83450)
    expect(tsToMs('[00:00.00]')).toBe(0)
  })

  it('returns null without a leading timestamp (TS_RE is ^-anchored)', () => {
    expect(tsToMs('plain line')).toBeNull()
    expect(tsToMs('[ti: meta]')).toBeNull()
    expect(tsToMs('lyrics [00:05.01]')).toBeNull()
  })

  it('formats milliseconds back to [mm:ss.cc]', () => {
    expect(msToTs(83450)).toBe('[01:23.45]')
    expect(msToTs(0)).toBe('[00:00.00]')
    expect(msToTs(599990)).toBe('[09:59.99]')
  })

  it('clamps negative values to zero', () => {
    expect(msToTs(-7)).toBe('[00:00.00]')
  })

  it('does not wrap minutes past 59 (monolith quirk)', () => {
    expect(msToTs(3600000)).toBe('[60:00.00]')
  })

  it('round-trips', () => {
    expect(msToTs(tsToMs('[42:07.81]')!)).toBe('[42:07.81]')
  })
})

describe('isEndTs / replaceTs / stripSecLine', () => {
  it('detects timestamp-only lines', () => {
    expect(isEndTs('[01:23.45]')).toBe(true)
    expect(isEndTs('[01:23.45] lyrics')).toBe(false)
    expect(isEndTs('[ti: x]')).toBe(false)
  })

  it('replaces timestamps, preserving or introducing the space separator', () => {
    expect(replaceTs('[00:10.00]abc', 5000)).toBe('[00:05.00]abc')
    expect(replaceTs('hello', 5000)).toBe('[00:05.00] hello')
    expect(replaceTs('[00:10.00] lyric', 0)).toBe('[00:00.00] lyric')
  })

  it('strips timestamps and the separator space from secondary-field lines', () => {
    expect(stripSecLine('[00:01.00] lyric')).toBe('lyric')
    expect(stripSecLine('plain')).toBe('plain')
  })
})

describe('isHeader', () => {
  it('flags [Section]-style headers but not meta tags or timestamps', () => {
    expect(isHeader('[Chorus]')).toBe(true)
    expect(isHeader('[Verse 2]')).toBe(true)
    expect(isHeader('[ti: Song]')).toBe(false)
    expect(isHeader('[01:02.03]')).toBe(false)
    expect(isHeader('plain text')).toBe(false)
  })
})

describe('normalizeLrcTimestamps', () => {
  it('truncates exactly-3-decimal timestamps to 2 decimals (4 decimals untouched)', () => {
    expect(normalizeLrcTimestamps('[00:01.123]lyric')).toBe('[00:01.12]lyric')
    expect(normalizeLrcTimestamps('[00:01.12]lyric')).toBe('[00:01.12]lyric')
    expect(normalizeLrcTimestamps('a\n[01:02.3456]b\n[03:04.567]c')).toBe('a\n[01:02.3456]b\n[03:04.56]c')
  })
})

describe('collapseBlanks', () => {
  it('collapses consecutive blank lines to at most one', () => {
    expect(collapseBlanks(['a', '', '', 'b', '', '', '', 'c'])).toEqual(['a', '', 'b', '', 'c'])
    expect(collapseBlanks(['', '', 'x'])).toEqual(['', 'x'])
  })
})

describe('findLastMetaIdx', () => {
  it('finds the last meta line, or -1', () => {
    expect(findLastMetaIdx(['[ti: x]', 'lyric', '[al: y]'])).toBe(2)
    expect(findLastMetaIdx(['[ti: x]', '[00:01.00] lyric'])).toBe(0)
    expect(findLastMetaIdx(['no meta'])).toBe(-1)
  })
})

describe('lrcHasTi', () => {
  it('accepts a meaningful [ti:] only', () => {
    expect(lrcHasTi('[ti: My Song]\n[ar: x]')).toBe(true)
    expect(lrcHasTi('[TI: My Song]')).toBe(true)
    expect(lrcHasTi('[ti: Unknown]')).toBe(false)
    expect(lrcHasTi('[ti:]')).toBe(false)
    expect(lrcHasTi('[ar: someone]')).toBe(false)
  })
})
