/**
 * Ambient declarations for app globals defined in docs/index.html.
 *
 * These functions are loaded into the browser's global scope when Playwright
 * navigates to the app. They are callable inside `page.evaluate()` callbacks
 * but tsserver cannot see them (no import, no local definition), so it reports
 * TS2304 "Cannot find name". This file declares them as ambient globals so
 * Zed Project Diagnostics and other tsserver-based tools stop flagging them.
 *
 * Keep this file in sync with the function definitions in docs/index.html.
 * If you add a new app function referenced in tests, add its signature here too.
 */

// ── LRC parsing ─────────────────────────────────────────────────────────────
/** Parse a leading LRC timestamp `[MM:SS.cc]` from a line. Returns ms or null. */
declare function tsToMs(line: string): number | null;
/** Convert milliseconds to an LRC timestamp `[MM:SS.cc]`. Clamps negative to 0, truncates centiseconds. */
declare function msToTs(ms: number): string;
/** Replace (or prepend) the leading timestamp on a line. */
declare function replaceTs(line: string, ms: number): string;
/** True if the line is just a timestamp (no trailing lyric text). */
declare function isEndTs(line: string): boolean;
/** Normalize 3-decimal timestamps `[MM:SS.ccc]` → `[MM:SS.cc]` across a block of text. */
declare function normalizeLrcTimestamps(text: string): string;
/** Strip the leading timestamp (and one space) from a line. */
declare function stripSecLine(line: string): string;

// ── Paste / metadata helpers ────────────────────────────────────────────────
/** Clean pasted text: normalize timestamps, strip sections, preserve metadata. Context "paste" strips section headers; any other value (e.g. "import") preserves them. */
declare function cleanPaste(text: string, context: string): string;
/** Ensure the `[re:]` tag contains the configured default value. */
declare function ensureReTagDefault(text: string): string;
/** Merge LRC metadata from lrcText into the configured default_meta block. */
declare function mergeLrcMeta(lrcText: string): string;
/** Extract clean lyric text from a pasted Genius page. Returns null if not detected. */
declare function cleanGenius(text: string): string | null;
/** Collapse runs of 2+ blank lines into a single blank line. */
declare function collapseBlanks(lines: string[]): string[];

// ── Paren / split helpers ───────────────────────────────────────────────────
/** Peel the last top-level parenthesized group from end of string. Returns [before, group] or null. */
declare function _peelLastParen(s: string): [string, string] | null;
/** Split trailing parenthesized groups into new translation lines. */
declare function batchSplitParens(text: string): string;
/** Find the next timestamped line's ms from a given index. Returns null if none. */
declare function _findNextTimestampMs(lines: string[], fromIdx: number): number | null;
/** Assign interpolated timestamps to untimestamped lines between two timestamped lines (in place). */
declare function _assignInterpolatedTs(out: string[]): void;

// ── Hotkey helpers ──────────────────────────────────────────────────────────
/** Normalize a KeyboardEvent.key value for hotkey display (e.g. " " → "Space", "a" → "A"). */
declare function _normKey(k: string): string;
/** Build a hotkey string ("Ctrl+Shift+A") from a KeyboardEvent. */
declare function keyStr(e: KeyboardEvent): string;
/** Returns a restriction message if the hotkey string is reserved by the browser, else null. */
declare function isRestrictedForAll(ks: string): string | null;
/** Returns a restriction message if the hotkey string is restricted for the given action key, else null. */
declare function isRestrictedForKey(ks: string, key: string): string | null;

// ── Settings UI helpers ─────────────────────────────────────────────────────
/** Toggle the settings search between "find by name" and "find by hotkey" mode. */
declare function setSearchHkMode(on: boolean): void;

// ── File save helper ────────────────────────────────────────────────────────
/** Save the current lyrics to a .lrc file (app global). Tests stub this on Firefox. */
declare function doSave(): void;

// ── Test-injected window properties ─────────────────────────────────────────
// typing-mode.spec.js meta-save-update stubs window.doSave on Firefox to capture
// the save output (since Firefox can't intercept the download event reliably).
interface Window {
  /** Set by meta-save-update test's Firefox branch to capture save output. */
  __saveCapture: { text: string; filename: string } | null;
  /** App global; reassigned by the test's Firefox branch to a capture stub. */
  doSave: () => void;
}
