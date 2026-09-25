import { describe, expect, it } from 'vitest'

import { DEFAULT_META } from '@/config'
import { cleanPaste, ensureReTagDefault, mergeLrcMeta } from '@/utils/pasteHandlers'

describe('cleanPaste', () => {
  it('normalizes 3-decimal timestamps and strips section headers on paste', () => {
    const text = '[00:01.123]one\n[Chorus]\ntwo\n[00:02.456]three'
    expect(cleanPaste(text, 'paste')).toBe('[00:01.12]one\ntwo\n[00:02.45]three')
  })

  it('keeps headers for non-paste contexts', () => {
    const text = '[Chorus]\n[00:01.123]one'
    expect(cleanPaste(text, 'import')).toBe('[Chorus]\n[00:01.12]one')
  })

  it('never strips metadata tags', () => {
    expect(cleanPaste('[ti: Song]\n[Verse]\nlyric', 'paste')).toBe('[ti: Song]\nlyric')
  })
})

describe('ensureReTagDefault', () => {
  const url = 'https://amokprime.github.io/linebyline/'

  it('appends the configured [re:] value to an existing tag', () => {
    expect(ensureReTagDefault('[re: Genius]\nlyric', DEFAULT_META)).toBe(`[re: Genius, ${url}]\nlyric`)
  })

  it('fills an empty [re:] tag with no space (the [re:\\s* prefix eats it)', () => {
    expect(ensureReTagDefault('[re:]\nlyric', DEFAULT_META)).toBe(`[re:${url}]\nlyric`)
  })

  it('leaves text alone when the value is already present', () => {
    expect(ensureReTagDefault(`[re: Genius, ${url}]`, DEFAULT_META)).toBe(`[re: Genius, ${url}]`)
    expect(ensureReTagDefault(`[re: ${url}]`, DEFAULT_META)).toBe(`[re: ${url}]`)
  })

  it('adds nothing when the text has no [re:] tag', () => {
    expect(ensureReTagDefault('[ti: Song]\nlyric', DEFAULT_META)).toBe('[ti: Song]\nlyric')
  })

  it('adds nothing when the configured meta has no [re:]', () => {
    expect(ensureReTagDefault('[re: Genius]', '[ti: X]')).toBe('[re: Genius]')
  })
})

describe('mergeLrcMeta', () => {
  it('overrides defaults with LRC values, keeps the rest, appends extra fields', () => {
    const lrc = '[ti: Real Song]\n[by: Someone]\n[00:01.00] lyric'
    expect(mergeLrcMeta(lrc, DEFAULT_META)).toBe(
      '[ti: Real Song]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n[by: Someone]\n',
    )
  })

  it('drops empty LRC tag values in favor of defaults', () => {
    const lrc = '[ti: ]\n[ar: Real Artist]'
    expect(mergeLrcMeta(lrc, DEFAULT_META)).toBe(
      '[ti: Unknown]\n[ar: Real Artist]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n',
    )
  })

  it('is case-insensitive on tag keys', () => {
    expect(mergeLrcMeta('[TI: Caps Song]', DEFAULT_META)).toBe(
      '[ti: Caps Song]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n',
    )
  })
})
