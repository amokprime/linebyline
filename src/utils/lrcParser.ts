// Ported from docs/index.html "── LRC parsing utilities ──" (roadmap item 3
// Phase C, tranche 1). Only the pure functions moved here; getSeekOffset,
// hasLyricContent, maybeAppendTrailingTs, suppressAuto and advanceActiveLine
// read DOM/state globals and stay in the monolith until the Phase D
// composables. Verbatim bodies.

export const TS_RE = /^\[(\d{2}):(\d{2})\.(\d{2})\]/;
export const META_RE = /^\[[a-zA-Z]+:/;

export function tsToMs(l: string): number | null {
  const m = TS_RE.exec(l);
  if (!m) return null;
  return +m[1]! * 60000 + +m[2]! * 1000 + +m[3]! * 10;
}

export function msToTs(ms: number): string {
  ms = Math.max(0, ms);
  const min = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000), cent = Math.floor((ms % 1000) / 10);
  const p = (n: number) => String(n).padStart(2, '0');
  return `[${p(min)}:${p(sec)}.${p(cent)}]`;
}

export function isEndTs(l: string): boolean {
  return TS_RE.test(l) && l.replace(TS_RE, '').trim() === '';
}

export function isHeader(l: string): boolean {
  return l.startsWith('[') && !META_RE.test(l) && !TS_RE.test(l);
}

export function replaceTs(l: string, ms: number): string {
  return TS_RE.test(l) ? msToTs(ms) + l.slice(10) : msToTs(ms) + ' ' + l;
}

// Truncate 3-decimal timestamps ([mm:ss.000]) to 2-decimal ([mm:ss.00]) on import
export function normalizeLrcTimestamps(text: string): string {
  return text.replaceAll(/\[(\d{2}):(\d{2})\.(\d{2})\d\]/g, '[$1:$2.$3]');
}

export function stripSecLine(l: string): string {
  return l.replace(TS_RE, '').replace(/^ /, '');
}

// Collapse consecutive blank lines to at most one
export function collapseBlanks(lines: string[]): string[] {
  const out: string[] = [];
  let blanks = 0;
  for (const l of lines) {
    if (l.trim() === '') {
      blanks++;
      if (blanks <= 1) out.push(l);
    } else {
      blanks = 0;
      out.push(l);
    }
  }
  return out;
}

// Find the last line index whose content matches META_RE, or -1
export function findLastMetaIdx(lines: string[]): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (META_RE.test(lines[i]!)) idx = i;
  }
  return idx;
}

// Check if an imported LRC raw text has a meaningful [ti:] tag
export function lrcHasTi(raw: string): boolean {
  return raw.split('\n').some((l) => {
    const m = l.match(/^\[ti:\s*(.*)\]$/i);
    return m !== null && m[1]!.trim() !== '' && m[1]!.trim().toLowerCase() !== 'unknown';
  });
}
