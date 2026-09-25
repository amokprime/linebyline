
// Ported from docs/index.html "── LRC parsing utilities ──" (roadmap item 3
// Phase C, tranche 1). Only the pure functions moved here; getSeekOffset,
// suppressAuto and advanceActiveLine read DOM/state globals and stay in the
// monolith until the Phase D composables. Verbatim bodies.
//
// Phase D Tranche 5 additions: hasLyricContent and hasTrailingTimestamp
// moved here from the monolith body, refactored to take the text as a
// parameter instead of reading getTA(). Callers (useSync) pass mainText.value.

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
const TI_RE = /^\[ti:\s*(.*)\]$/i;
export function lrcHasTi(raw: string): boolean {
  return raw.split('\n').some((l) => {
    const m = TI_RE.exec(l);
    return m !== null && m[1]!.trim() !== '' && m[1]!.trim().toLowerCase() !== 'unknown';
  });
}

// Phase D Tranche 5 — ported from monolith body (line ~758). PORT DELTA:
// the monolith reads getTA() (the textarea value); this version takes the
// text as a parameter so the composable can pass mainText.value without
// reaching into the DOM. Returns true if any non-meta, non-blank line has
// non-empty text content (after stripping the timestamp prefix if present).
// Used by syncLine / insertEndLine / maybeAppendTrailingTs to bail out
// when the editor has only metadata + blank lines (no point inserting a
// [00:00.00] timestamp for an empty lyric).
export function hasLyricContent(text: string): boolean {
  return text.split('\n').some((l) => {
    if (!l.trim() || META_RE.test(l)) return false;
    const content = TS_RE.test(l) ? l.slice(10).trim() : l.trim();
    return content !== '';
  });
}

// Phase D Tranche 5 — ported from monolith body (line ~1685). PORT DELTA:
// the monolith reads getTA(); this version takes the lines array directly.
// Returns true if the last non-empty, non-meta line is a trailing timestamp
// (a timestamp with no content after it). Used by checkLineCounts to show
// the "Missing trailing timestamp" warning and by insertEndLine to decide
// whether to insert a new end-timestamp or update an existing one.
export function hasTrailingTimestamp(lines: string[]): boolean {
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]!;
    if (l.trim() === '' || META_RE.test(l)) continue;
    return isEndTs(l);
  }
  return false;
}

// Phase D Tranche 5 — ported from monolith body (line ~1695). PORT DELTA:
// takes the lines array directly. Returns true if every non-meta, non-blank,
// non-trailing-ts line has a timestamp — the precondition for mergeTranslations.
// Used by updateMergeBtn to enable/disable the merge button.
export function allLyricLinesHaveTs(lines: string[]): boolean {
  return lines
    .filter((l) => l.trim() && !META_RE.test(l) && !isEndTs(l))
    .every((l) => tsToMs(l) !== null);
}

// Phase D Tranche 6 — ported from monolith body (line ~1678). PORT DELTA:
// takes the lines array directly. Returns the main-field lyric lines
// (non-meta, non-blank, non-trailing-ts). Used by checkLineCounts to compare
// against secondary field line counts and by mergeTranslations to build the
// merged result.
export function getMainLyricLines(lines: string[]): string[] {
  return lines.filter((l) => l.trim() && !META_RE.test(l) && !isEndTs(l));
}

// Phase D Tranche 6 — ported from monolith body (line ~1666). PORT DELTA:
// takes the textarea value as a string. Returns non-blank lines from a
// secondary field's content. Used by checkLineCounts + mergeTranslations to
// compare against the main field's lyric line count.
export function getSecLines(text: string): string[] {
  return text.split('\n').filter((l) => l.trim());
}
