// Phase D Tranche 5 — pure timestamp/paren helpers extracted from the
// monolith "── Sync/timestamp ──" section (roadmap item 3, Phase D, Tranche 5).
// Naming drops the leading underscore per the Phase C export convention
// (matches findLastMetaIdx / collapseBlanks in lrcParser.ts).
//
// These helpers were unique to tests/logic.spec.js before the refactor —
// Phase E consolidation begins here: the corresponding logic.spec.js sections
// can be deleted once the Phase E cutover is verified.

import { META_RE, TS_RE, tsToMs, msToTs } from './lrcParser';

export type Peeled = [before: string, group: string];

// Find the next timestamped line after fromIdx; returns ms or null.
// PORT DELTA: monolith's _findNextTimestampMs — body verbatim, name drops the
// leading underscore. Does NOT skip meta/blank lines (differs from findNextTsMs
// which does — markAsTranslation relies on this).
export function findNextTimestampMs(lines: string[], fromIdx: number): number | null {
  for (let j = fromIdx + 1; j < lines.length; j++) {
    const ms = tsToMs(lines[j]!);
    if (ms !== null) return ms;
  }
  return null;
}

// Extract the last top-level parenthesized group from end of string.
// Returns [before, group] or null. Tracks depth so unbalanced parens return
// the partial group (not null) — callers (batchSplitParens) pass
// already-clean text so this never triggers in practice.
export function peelLastParen(s: string): Peeled | null {
  const t = s.trimEnd();
  if (!t.endsWith(')')) return null;
  let depth = 0, i = t.length - 1;
  while (i >= 0) {
    if (t[i] === ')') {
      depth++;
    } else if (t[i] === '(') {
      depth--;
      if (depth === 0) {
        const before = t.slice(0, i).trimEnd();
        const group = t.slice(i);
        return [before, group];
      }
    }
    i--;
  }
  return null;
}

// Scan backwards from fromIdx-1 for the first timestamped non-meta, non-blank line.
export function findPrevTsMs(out: string[], fromIdx: number): number | null {
  for (let j = fromIdx - 1; j >= 0; j--) {
    if (out[j]!.trim() === '' || META_RE.test(out[j]!)) continue;
    return tsToMs(out[j]!);
  }
  return null;
}

// Scan forwards from fromIdx for the first timestamped non-meta, non-blank line.
export function findNextTsMs(out: string[], fromIdx: number): number | null {
  for (let j = fromIdx; j < out.length; j++) {
    if (out[j]!.trim() === '' || META_RE.test(out[j]!)) continue;
    const ms = tsToMs(out[j]!);
    if (ms !== null) return ms;
  }
  return null;
}

// Extend runEnd forwards while subsequent lines are un-timestamped content.
export function findRunEnd(out: string[], startIdx: number): number {
  let runEnd = startIdx;
  while (
    runEnd + 1 < out.length &&
    !META_RE.test(out[runEnd + 1]!) &&
    out[runEnd + 1]!.trim() !== '' &&
    tsToMs(out[runEnd + 1]!) === null
  ) {
    runEnd++;
  }
  return runEnd;
}

// Assign interpolated timestamps to un-timestamped runs between two timestamped lines.
// MUTATES the array in place — callers must pass a fresh copy (batchSplitParens
// does via .split('\n')). while-loop (not for) so the cursor advances past a
// processed run without S2310.
export function assignInterpolatedTs(out: string[]): void {
  let i = 0;
  while (i < out.length) {
    if (META_RE.test(out[i]!) || out[i]!.trim() === '') { i++; continue; }
    if (tsToMs(out[i]!) !== null) { i++; continue; }
    const prevMs = findPrevTsMs(out, i);
    if (prevMs === null) { i++; continue; }
    const runEnd = findRunEnd(out, i);
    const nextMs = findNextTsMs(out, runEnd + 1);
    if (nextMs === null) { i++; continue; }
    const count = runEnd - i + 1;
    for (let k = 0; k < count; k++) {
      out[i + k] = msToTs(Math.max(0, nextMs - (count - k) * 10)) + ' ' + out[i + k]!;
    }
    i = runEnd + 1;
  }
}

// Find next line that still has a peelable paren (preferred target after a split).
// Returns the index, or -1 if none.
export function findNextUnprocessedSplit(updatedLines: string[], fromIdx: number): number {
  let nextUnprocessed = -1;
  for (let j = fromIdx; j < updatedLines.length; j++) {
    const ul = updatedLines[j]!;
    if (META_RE.test(ul) || ul.trim() === '') continue;
    const ulContent = TS_RE.test(ul) ? ul.slice(10).replace(/^ /, '') : ul;
    if (peelLastParen(ulContent) !== null) { nextUnprocessed = j; break; }
    if (nextUnprocessed < 0) nextUnprocessed = j;
  }
  return nextUnprocessed;
}

// Fallback: first non-meta, non-blank line from fromIdx. Returns index or -1.
export function findNextNonMetaFromIdx(updatedLines: string[], fromIdx: number): number {
  for (let j = fromIdx; j < updatedLines.length; j++) {
    if (!META_RE.test(updatedLines[j]!) && updatedLines[j]!.trim() !== '') return j;
  }
  return -1;
}

// Batch-split trailing parenthesized groups on all non-meta lines (including
// timestamped). Inserts peeled groups as plain lines immediately after their
// parent. Second pass: assigns interpolated timestamps to inserted groups when
// surrounding lines are timestamped.
export function batchSplitParens(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    if (META_RE.test(l) || l.trim() === '') { out.push(l); continue; }
    const hasTs = TS_RE.test(l);
    const tsPrefix = hasTs ? l.slice(0, 10) : '';
    let content = hasTs ? l.slice(10).replace(/^ /, '') : l;
    const groups: string[] = [];
    let peeled: Peeled | null;
    while ((peeled = peelLastParen(content)) !== null) {
      const [before, group] = peeled;
      groups.push(group);
      content = before;
    }
    out.push(tsPrefix + (tsPrefix && content ? ' ' + content : content));
    if (groups.length) out.push(...groups.slice().reverse());
  }
  assignInterpolatedTs(out);
  return out.join('\n');
}
