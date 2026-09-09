// Ported from docs/index.html "── Genius extraction ──" (roadmap item 3
// Phase C, tranche 1). Only the pure helpers moved: markGeniusSource and
// extractGeniusMeta read/write the main textarea and re-render, so they stay
// in the monolith until the Phase D app-state composable. Verbatim bodies;
// cleanGenius delegates to cleanPaste like the monolith.

import { TS_RE, collapseBlanks } from './lrcParser';
import { cleanPaste } from './pasteHandlers';

// Find first lyric line: after "Read More", else first section header [Capitalized...]
export function findGeniusLyricStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (/Read More\s*$/.test(lines[i]!.trim())) return i + 1;
  }
  for (let i = 0; i < lines.length; i++) {
    if (/^\[[A-Z]/.test(lines[i]!.trim())) return i; // [A-Z] distinguishes section headers from LRC tags [ti:..]
  }
  return -1;
}

// Find the last lyric line: stops at About/Song Bio/Credits/©/Embed widget
export function findGeniusLyricEnd(lines: string[], start: number): number {
  for (let i = start; i < lines.length; i++) {
    const t = lines[i]!.trim();
    if (t === 'About' || t === 'Song Bio' || /^© \d{4}/.test(t) || t === 'Sign Up And Drop Knowledge 🤓') return i;
    if (t === 'Credits' && i > start + 5) return i;
    // Genius embed widget: trailing "<digits>\nEmbed" (page embed button + song id)
    if (t === 'Embed' && i > start && /^\d+$/.test(lines[i - 1]!.trim())) return i - 1;
  }
  return lines.length;
}

// Returns {start, end} or null if not Genius content
export function findGeniusLyricBounds(lines: string[]): { start: number; end: number } | null {
  const hasLyricsHeading = lines.some((l) => /Lyrics$/.test(l.trim()));
  const hasGenius = lines.some((l) => /Genius\.com|genius\.com|ML Genius|Genius is the/.test(l));
  const hasReadMore = lines.some((l) => /Read More\s*$/.test(l.trim()));
  if (!hasLyricsHeading && !hasGenius && !hasReadMore) return null;
  const start = findGeniusLyricStart(lines);
  if (start < 0) return null;
  const end = findGeniusLyricEnd(lines, start);
  return { start, end };
}

export function filterYmal(lyricLines: string[]): string[] {
  const out: string[] = [];
  let inYmal = false;
  for (const line of lyricLines) {
    const t = line.trim();
    if (t === 'You might also like') {
      if (out.length && out[out.length - 1]!.trim() !== '') out.push('');
      inYmal = true;
      continue;
    }
    if (inYmal) {
      if (t === '' || (/^\[[^\]]+\]$/.test(t) && !TS_RE.test(t))) inYmal = false;
      else continue;
    }
    out.push(line);
  }
  return out;
}

// Strip [section] headers, preserving section breaks with a blank line when adjacent lines are non-blank
export function stripSectionHeaders(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^\[.{2,50}\]$/.test(t) && !TS_RE.test(t)) {
      if (out.length && out[out.length - 1]!.trim() !== '') out.push('');
      continue;
    }
    out.push(line);
  }
  return out;
}

export function cleanGenius(text: string): string | null {
  const lines = text.split('\n');
  const bounds = findGeniusLyricBounds(lines);
  if (!bounds) return null;
  let lyricLines = filterYmal(lines.slice(bounds.start, bounds.end));
  lyricLines = stripSectionHeaders(lyricLines);
  const out = collapseBlanks(lyricLines).join('\n').trim();
  if (!out) return null;
  return cleanPaste(out, 'paste');
}

// Find artist in the lines immediately following the "...Lyrics" heading
export function findArtistAfterTitle(head: string[], fromIdx: number): string {
  for (let j = fromIdx; j < Math.min(fromIdx + 4, head.length); j++) {
    if (/^Producer$/i.test(head[j]!)) break;
    if (head[j] && head[j]!.length < 60) return head[j]!;
  }
  return '';
}

// Find title (from "...Lyrics" line) and artist (if not already known)
export function extractGeniusTitleAndArtist(
  head: string[],
  existingArtist: string,
): { title: string; artist: string } {
  for (let i = 0; i < head.length; i++) {
    if (/\s+Lyrics$/.test(head[i]!)) {
      const title = head[i]!.replace(/\sLyrics$/, '').trim();
      const artist = existingArtist || findArtistAfterTitle(head, i + 1);
      return { title, artist };
    }
  }
  return { title: '', artist: existingArtist || '' };
}

export function extractGeniusAlbum(head: string[]): string {
  for (let i = 0; i < head.length - 1; i++) {
    if (/^Track\s+\d+\s+(on|[-–])/i.test(head[i]!)) return head[i + 1]!.trim();
  }
  return '';
}

export function extractGeniusFields(head: string[]): { title: string; artist: string; album: string } {
  let artist = '';
  for (let i = 0; i < head.length; i++) {
    const m = head[i]!.match(/^Cover art for .+ by (.+)$/i);
    if (m) {
      artist = m[1]!.trim();
      break;
    }
  }
  const { title, artist: resolvedArtist } = extractGeniusTitleAndArtist(head, artist);
  if (!artist) artist = resolvedArtist;
  const album = extractGeniusAlbum(head);
  return { title, artist, album };
}
