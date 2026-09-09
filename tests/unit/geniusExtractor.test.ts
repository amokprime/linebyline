import { describe, expect, it } from 'vitest'

import {
  cleanGenius,
  extractGeniusFields,
  filterYmal,
  findGeniusLyricBounds,
  findGeniusLyricStart,
  stripSectionHeaders,
} from '@/utils/geniusExtractor'

const GENIUS_PASTE = [
  'The Sound of Silence Lyrics',
  'Cover art for Single by Simon & Garfunkel',
  'Read More',
  '[Verse 1]',
  'Hello darkness, my old friend',
  '',
  'You might also like',
  '[Chorus]',
  'fa la la',
  '1234',
  'Embed',
  'About',
  '© 1964 Some Publisher',
].join('\n')

describe('findGeniusLyricBounds', () => {
  it('finds lyrics after "Read More" and stops at the embed widget', () => {
    const lines = GENIUS_PASTE.split('\n')
    expect(findGeniusLyricBounds(lines)).toEqual({ start: 3, end: 9 })
  })

  it('returns null for non-Genius content', () => {
    expect(findGeniusLyricBounds(['[ti: Song]', '[00:01.00] lyric'])).toBeNull()
    expect(findGeniusLyricBounds(['plain text'])).toBeNull()
  })

  it('returns null when the content is Genius-like but has no lyric start', () => {
    expect(findGeniusLyricBounds(['genius.com page', 'no headers here'])).toBeNull()
  })
})

describe('findGeniusLyricStart', () => {
  it('prefers the line after "Read More", else the first [Capitalized header', () => {
    expect(findGeniusLyricStart(['intro', 'Read More', '[Verse]'])).toBe(2)
    expect(findGeniusLyricStart(['[ti: meta]', '[Chorus]', 'lyric'])).toBe(1)
    expect(findGeniusLyricStart(['nothing'])).toBe(-1)
  })
})

describe('filterYmal / stripSectionHeaders', () => {
  it('drops the "You might also like" block until a non-timestamp tag line', () => {
    const lines = ['one', '', 'You might also like', 'junk', '[Chorus]', 'two']
    expect(filterYmal(lines)).toEqual(['one', '', '[Chorus]', 'two'])
  })

  it('strips section headers, keeping one blank separator', () => {
    // no double blank: the [Chorus] header follows an already-blank line
    expect(stripSectionHeaders(['[Verse 1]', 'a', '', '[Chorus]', 'b'])).toEqual(['a', '', 'b'])
    expect(stripSectionHeaders(['[Verse 1]', 'a', '[Chorus]', 'b'])).toEqual(['a', '', 'b'])
  })
})

describe('cleanGenius', () => {
  it('extracts cleaned lyrics from a full Genius paste', () => {
    expect(cleanGenius(GENIUS_PASTE)).toBe('Hello darkness, my old friend\n\nfa la la')
  })

  it('returns null for non-Genius text', () => {
    expect(cleanGenius('[ti: Song]\n[00:01.00] lyric')).toBeNull()
  })
})

describe('extractGeniusFields', () => {
  it('pulls title from the "...Lyrics" heading, artist from cover-art line', () => {
    const head = GENIUS_PASTE.split('\n').slice(0, 40)
    expect(extractGeniusFields(head)).toEqual({
      title: 'The Sound of Silence',
      artist: 'Simon & Garfunkel',
      album: '',
    })
  })

  it('breaks the artist scan entirely on a Producer line (monolith quirk)', () => {
    // findArtistAfterTitle breaks on /^Producer$/i, so the track line after it
    // is never considered — the artist stays empty here
    const head = ['Artist Name Lyrics', 'Producer', 'Track 3 on Some Album']
    expect(extractGeniusFields(head)).toEqual({
      title: 'Artist Name',
      artist: '',
      album: '',
    })
  })

  it('reads the album from a "Track N on" line', () => {
    const head = ['Song Lyrics', 'Someone', 'Track 3 on Some Album', 'Album Name']
    expect(extractGeniusFields(head).album).toBe('Album Name')
  })
})
