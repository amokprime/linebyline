
// Tests for src/utils/timestampSync.ts — Phase D Tranche 5 pure helpers.
// Pure functions; no DOM, no happy-dom pragma needed.
import { describe, expect, it } from 'vitest'

import {
  assignInterpolatedTs,
  batchSplitParens,
  findNextNonMetaFromIdx,
  findNextTimestampMs,
  findNextTsMs,
  findNextUnprocessedSplit,
  findPrevTsMs,
  findRunEnd,
  peelLastParen,
  type Peeled,
} from '@/utils/timestampSync'

describe('findNextTimestampMs', () => {
  it('returns the ms of the next timestamped line after fromIdx', () => {
    const lines = ['plain', '[00:05.00]', 'plain', '[00:10.00]']
    expect(findNextTimestampMs(lines, 0)).toBe(5000)
    expect(findNextTimestampMs(lines, 2)).toBe(10000)
  })

  it('returns null when no timestamped line follows', () => {
    const lines = ['plain', '[00:05.00]', 'plain']
    expect(findNextTimestampMs(lines, 0)).toBe(5000)
    expect(findNextTimestampMs(lines, 2)).toBeNull()
  })

  it('does NOT skip meta/blank lines (differs from findNextTsMs)', () => {
    // markAsTranslation relies on this — it finds the next timestamp regardless
    // of intervening structure.
    const lines = ['[ti: song]', '[ar: artist]', '[00:05.00]']
    expect(findNextTimestampMs(lines, 0)).toBe(5000)
  })

  it('returns null for fromIdx beyond the array', () => {
    expect(findNextTimestampMs([], 5)).toBeNull()
    expect(findNextTimestampMs(['plain'], 0)).toBeNull()
  })
})

describe('peelLastParen', () => {
  it('peels a top-level parenthesized group from the end', () => {
    expect(peelLastParen('hello (world)')).toEqual<Peeled>(['hello', '(world)'])
    expect(peelLastParen('a (b) (c)')).toEqual<Peeled>(['a (b)', '(c)'])
  })

  it('returns null when the string does not end with )', () => {
    expect(peelLastParen('hello')).toBeNull()
    expect(peelLastParen('hello (world) extra')).toBeNull()
  })

  it('returns null when there are no parens', () => {
    expect(peelLastParen('plain text')).toBeNull()
    expect(peelLastParen('')).toBeNull()
  })

  it('handles nested parens correctly', () => {
    expect(peelLastParen('outer (inner (nested))')).toEqual<Peeled>([
      'outer',
      '(inner (nested))',
    ])
  })

  it('handles unbalanced parens by tracking depth', () => {
    // Unbalanced open paren — depth never reaches 0; returns null.
    expect(peelLastParen('(unclosed')).toBeNull()
    // Unbalanced close (extra close at the start) — depth goes negative.
    // The function returns null when the scan completes without depth reaching 0
    // AFTER a close. Let's verify with ')' alone:
    expect(peelLastParen(')')).toBeNull()
  })

  it('trims trailing whitespace before checking for )', () => {
    expect(peelLastParen('hello (world)   ')).toEqual<Peeled>(['hello', '(world)'])
  })

  it('returns the inner content + the trimmed before', () => {
    const result = peelLastParen('[00:05.00] hello (translation)')
    expect(result).not.toBeNull()
    expect(result![0]).toBe('[00:05.00] hello')
    expect(result![1]).toBe('(translation)')
  })

  it('returns empty before-group for paren-only content', () => {
    expect(peelLastParen('(only)')).toEqual<Peeled>(['', '(only)'])
  })

  it('peels the last group when an unbalanced close paren precedes the open', () => {
    // "a ) b (c)" — the stray ) before the open ( is tracked by depth and
    // does not prevent the balanced (c) from being peeled.
    expect(peelLastParen('a ) b (c)')).toEqual<Peeled>(['a ) b', '(c)'])
  })
})

describe('findPrevTsMs', () => {
  it('scans backwards from fromIdx-1 for the first timestamped non-meta non-blank line', () => {
    const lines = ['[00:05.00]', 'plain', '[00:10.00]', 'plain']
    expect(findPrevTsMs(lines, 3)).toBe(10000)
    expect(findPrevTsMs(lines, 1)).toBe(5000)
  })

  it('skips blank lines', () => {
    const lines = ['[00:05.00]', '', '', '[00:10.00]']
    expect(findPrevTsMs(lines, 3)).toBe(5000)
  })

  it('skips meta lines', () => {
    const lines = ['[00:05.00]', '[ti: song]', '[ar: artist]', '[00:10.00]']
    expect(findPrevTsMs(lines, 3)).toBe(5000)
  })

  it('returns null when no timestamped line precedes', () => {
    const lines = ['plain', 'plain', '[00:10.00]']
    expect(findPrevTsMs(lines, 2)).toBeNull()
  })
})

describe('findNextTsMs', () => {
  it('scans forwards from fromIdx for the first timestamped non-meta non-blank line', () => {
    const lines = ['plain', '[00:05.00]', 'plain', '[00:10.00]']
    expect(findNextTsMs(lines, 0)).toBe(5000)
    expect(findNextTsMs(lines, 2)).toBe(10000)
  })

  it('skips blank and meta lines', () => {
    const lines = ['[ti: song]', '', '[00:05.00]']
    expect(findNextTsMs(lines, 0)).toBe(5000)
  })

  it('returns null when no timestamped line follows', () => {
    const lines = ['plain', 'plain']
    expect(findNextTsMs(lines, 0)).toBeNull()
  })
})

describe('findRunEnd', () => {
  it('extends runEnd forwards while subsequent lines are un-timestamped content', () => {
    const lines = ['[00:05.00]', 'a', 'b', 'c', '[00:10.00]']
    expect(findRunEnd(lines, 1)).toBe(3)
  })

  it('stops at a meta line', () => {
    const lines = ['[00:05.00]', 'a', '[ti: meta]', 'b', '[00:10.00]']
    expect(findRunEnd(lines, 1)).toBe(1)
  })

  it('stops at a blank line', () => {
    const lines = ['[00:05.00]', 'a', '', 'b', '[00:10.00]']
    expect(findRunEnd(lines, 1)).toBe(1)
  })

  it('stops at a timestamped line', () => {
    const lines = ['a', '[00:05.00]', 'b', '[00:10.00]']
    expect(findRunEnd(lines, 0)).toBe(0)
  })

  it('returns startIdx when no extension is possible', () => {
    const lines = ['a', '[00:05.00]']
    expect(findRunEnd(lines, 0)).toBe(0)
  })

  it('handles startIdx at end of array', () => {
    expect(findRunEnd(['a'], 0)).toBe(0)
    expect(findRunEnd([], 0)).toBe(0)
  })
})

describe('assignInterpolatedTs', () => {
  it('assigns interpolated timestamps to un-timestamped runs between two timestamped lines', () => {
    const out = ['[00:05.00]', 'a', 'b', '[00:10.00]']
    assignInterpolatedTs(out)
    // count=2, nextMs=10000, so line 1 = 10000 - 2*10 = 9980, line 2 = 10000 - 1*10 = 9990
    expect(out[1]).toBe('[00:09.98] a')
    expect(out[2]).toBe('[00:09.99] b')
  })

  it('skips meta and blank lines', () => {
    const out = ['[ti: meta]', '', '[00:05.00]', 'a', '[00:10.00]']
    assignInterpolatedTs(out)
    expect(out[0]).toBe('[ti: meta]')
    expect(out[1]).toBe('')
    expect(out[3]).toBe('[00:09.99] a')
  })

  it('skips already-timestamped lines', () => {
    const out = ['[00:05.00]', '[00:06.00]', '[00:07.00]']
    assignInterpolatedTs(out)
    expect(out[0]).toBe('[00:05.00]')
    expect(out[1]).toBe('[00:06.00]')
    expect(out[2]).toBe('[00:07.00]')
  })

  it('skips un-timestamped runs with no previous timestamp', () => {
    const out = ['a', 'b', '[00:05.00]']
    assignInterpolatedTs(out)
    expect(out[0]).toBe('a')
    expect(out[1]).toBe('b')
  })

  it('skips un-timestamped runs with no next timestamp', () => {
    const out = ['[00:05.00]', 'a', 'b']
    assignInterpolatedTs(out)
    expect(out[1]).toBe('a')
    expect(out[2]).toBe('b')
  })

  it('handles multi-line runs with correct interpolation', () => {
    const out = ['[00:00.00]', 'a', 'b', 'c', '[00:01.00]']
    assignInterpolatedTs(out)
    // count=3, nextMs=1000, prevMs=0
    // line 1 = 1000 - 3*10 = 970, line 2 = 1000 - 2*10 = 980, line 3 = 1000 - 1*10 = 990
    expect(out[1]).toBe('[00:00.97] a')
    expect(out[2]).toBe('[00:00.98] b')
    expect(out[3]).toBe('[00:00.99] c')
  })

  it('mutates the array in place (caller must pass a fresh copy)', () => {
    const out = ['[00:05.00]', 'a', '[00:10.00]']
    const original = [...out]
    assignInterpolatedTs(out)
    expect(out).not.toEqual(original)
  })
})

describe('findNextUnprocessedSplit', () => {
  it('finds the next line with a peelable paren after fromIdx', () => {
    const lines = ['plain', 'with (paren)', 'plain']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(1)
  })

  it('falls back to the first non-meta line if no paren line is found', () => {
    // The function tracks the first non-meta line as the fallback target.
    // Even when no line has a peelable paren, it returns that fallback index
    // (not -1) — markAsTranslation's split-mode path uses this to advance
    // to a "good enough" next target when no peelable paren exists.
    const lines = ['plain', 'plain']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(0)
  })

  it('returns -1 when there are no non-meta non-blank lines', () => {
    const lines = ['[ti: meta]', '', '[ar: artist]']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(-1)
  })

  it('skips meta and blank lines', () => {
    const lines = ['[ti: meta]', '', 'with (paren)']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(2)
  })

  it('handles timestamped lines with parens', () => {
    const lines = ['[00:05.00] line (translation)']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(0)
  })

  it('prefers a line with a peelable paren over a plain line', () => {
    const lines = ['plain', 'plain', 'with (paren)']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(2)
  })

  it('returns the first non-meta line index when no peelable paren exists', () => {
    // Distinct from the "falls back" case above: verifies the fallback returns
    // 0 (the first non-meta line) rather than -1 when no paren is found.
    const lines = ['plain', 'plain']
    expect(findNextUnprocessedSplit(lines, 0)).toBe(0)
  })
})

describe('findNextNonMetaFromIdx', () => {
  it('finds the first non-meta non-blank line from fromIdx', () => {
    const lines = ['[ti: meta]', '', 'plain', 'plain']
    expect(findNextNonMetaFromIdx(lines, 0)).toBe(2)
  })

  it('returns -1 when no non-meta non-blank line follows', () => {
    const lines = ['[ti: meta]', '', '']
    expect(findNextNonMetaFromIdx(lines, 0)).toBe(-1)
  })

  it('returns fromIdx itself if it is non-meta non-blank', () => {
    const lines = ['plain', 'plain']
    expect(findNextNonMetaFromIdx(lines, 0)).toBe(0)
  })
})

describe('batchSplitParens', () => {
  it('splits trailing parenthesized groups into separate lines', () => {
    const text = 'line one (translation one)\nline two (translation two)'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual([
      'line one',
      '(translation one)',
      'line two',
      '(translation two)',
    ])
  })

  it('handles multiple trailing parens on one line', () => {
    const text = 'line (a) (b)'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual(['line', '(a)', '(b)'])
  })

  it('preserves timestamp prefixes on the parent line', () => {
    const text = '[00:05.00] line (translation)'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual(['[00:05.00] line', '(translation)'])
  })

  it('assigns interpolated timestamps to inserted groups when surrounding lines are timestamped', () => {
    const text = '[00:05.00] line (translation)\n[00:10.00] next'
    const result = batchSplitParens(text)
    const lines = result.split('\n')
    expect(lines[0]).toBe('[00:05.00] line')
    // The inserted translation should get an interpolated ts:
    // nextMs=10000, count=1 (just the inserted group), so 10000 - 1*10 = 9990
    expect(lines[1]).toMatch(/^\[00:09\.99\] \(translation\)$/)
    expect(lines[2]).toBe('[00:10.00] next')
  })

  it('skips meta lines (preserves them as-is)', () => {
    const text = '[ti: song]\nline (translation)'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual(['[ti: song]', 'line', '(translation)'])
  })

  it('skips blank lines (preserves them as-is)', () => {
    const text = 'line (translation)\n\nline two'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual(['line', '(translation)', '', 'line two'])
  })

  it('handles a single-line input with no parens (no-op)', () => {
    expect(batchSplitParens('plain line')).toBe('plain line')
  })

  it('handles a single-line input with no parens but with a trailing newline', () => {
    expect(batchSplitParens('plain line\n')).toBe('plain line\n')
  })

  it('does not split parens that are not at the end of the line', () => {
    const text = 'line (with) paren in middle'
    const result = batchSplitParens(text)
    expect(result).toBe('line (with) paren in middle')
  })

  it('handles nested parens (only peels the outermost top-level group)', () => {
    const text = 'line (outer (inner))'
    const result = batchSplitParens(text)
    expect(result.split('\n')).toEqual(['line', '(outer (inner))'])
  })

  it('leaves lines without parens unchanged', () => {
    const text = 'line one\nline two\nline three'
    expect(batchSplitParens(text)).toBe('line one\nline two\nline three')
  })

  it('handles an empty input', () => {
    expect(batchSplitParens('')).toBe('')
  })

  it('handles an input of only meta + blank lines', () => {
    const text = '[ti: meta]\n\n[ar: artist]'
    expect(batchSplitParens(text)).toBe('[ti: meta]\n\n[ar: artist]')
  })

  it('does not collapse consecutive blank lines (preserves blank separators)', () => {
    const text = 'line\n\n\nline two'
    const result = batchSplitParens(text)
    expect(result).toBe('line\n\n\nline two')
  })

  it('handles lines that already have a timestamp prefix + paren', () => {
    const text = '[00:05.00] line (translation) (second)'
    const result = batchSplitParens(text)
    const lines = result.split('\n')
    expect(lines[0]).toBe('[00:05.00] line')
    expect(lines[1]).toBe('(translation)')
    expect(lines[2]).toBe('(second)')
  })

  it('preserves the original timestamp on the parent line', () => {
    const text = '[00:05.00] line (translation)'
    const result = batchSplitParens(text)
    expect(result.split('\n')[0]).toBe('[00:05.00] line')
  })
})
