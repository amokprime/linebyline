// Ported from docs/index.html "── Paste and metadata cleaning ──" (roadmap
// item 3 Phase C, tranche 1). PORT DELTA: the monolith versions read
// cfg.default_meta (live global); these take the default-meta text as a
// parameter — the Phase D config composable binds the live value at call sites.
// Everything else verbatim. cleanPaste's `context` is only ever 'paste' in the
// current monolith (header stripping branch); 'import' callers no longer exist.

import { findLastMetaIdx, normalizeLrcTimestamps, isHeader } from './lrcParser';

export function cleanPaste(text: string, context: string): string {
  // Normalize 3-decimal timestamps before any processing
  text = normalizeLrcTimestamps(text);
  // Always strip sections on paste; never strip metadata; never strip on lrc import
  let lines = text.split('\n');
  if (context === 'paste') lines = lines.filter((l) => !isHeader(l));
  return lines.join('\n');
}

// Append the configured [re:] value to the [re:] tag if not already present
export function ensureReTagDefault(text: string, defaultMeta: string): string {
  const defReMatch = defaultMeta.match(/^\[re:\s*(.*)\]/m);
  const defReVal = defReMatch ? defReMatch[1]!.trim() : '';
  if (!defReVal) return text;
  return text.replace(/^(\[re:\s*)(.*?)(\]\s*)$/m, (match, pre, val, post) => {
    if (val.includes(defReVal)) return match;
    return pre + (val.trim() ? val.trim() + ', ' + defReVal : defReVal) + post;
  });
}

export function mergeLrcMeta(lrcText: string, defaultMeta: string): string {
  const defaultLines = defaultMeta.split('\n');
  const lrcLines = lrcText.split('\n');
  const lrcMeta: Record<string, string> = {};
  lrcLines.forEach((l) => {
    const m = l.match(/^\[([a-zA-Z]+):\s*(.*)\]$/);
    if (m) lrcMeta[m[1]!.toLowerCase()] = m[2]!.trim();
  });
  const merged = defaultLines.map((l) => {
    const m = l.match(/^\[([a-zA-Z]+):\s*(.*)\]$/);
    if (!m) return l;
    const key = m[1]!.toLowerCase();
    const lrcVal = lrcMeta[key];
    if (lrcVal !== undefined && lrcVal !== '') return `[${m[1]}: ${lrcVal}]`;
    return l;
  });
  const extraFields: string[] = [];
  lrcLines.forEach((l) => {
    const m = l.match(/^\[([a-zA-Z]+):\s*(.*)\]$/);
    if (!m) return;
    const key = m[1]!.toLowerCase();
    if (!defaultLines.some((dl) => dl.match(/^\[([a-zA-Z]+):/)?.[1]?.toLowerCase() === key)) {
      extraFields.push(l);
    }
  });
  if (extraFields.length) {
    const lastMetaIdx = findLastMetaIdx(merged);
    merged.splice(lastMetaIdx + 1, 0, ...extraFields);
  }
  let result = merged.filter((l) => l !== undefined).join('\n');
  result = ensureReTagDefault(result, defaultMeta);
  return result;
}
