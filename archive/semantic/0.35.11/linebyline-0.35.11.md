# LineByLine 0.35.11

## Turn 1

**Prompt:**

> Patch
> ### Bugs
> 1. It is possible to insert a useless trailing timestamp of `[00:00.00]` before any lyrics exist. Adding a .lrc file will overwrite this. But pasting lyrics appends a blank newline and then the new lyrics.
>    - Fix: Don't allow adding timestamps without lyrics
> 2. When pasting lyrics with metadata fields, they get appended redundantly under default metadata fields.
>    - Fix: Overwrite existing lyrics when pasting lyrics instead of appending, like importing lyric files does. Don't break Genius paste extraction.

---

**Bug 1 — `maybeAppendTrailingTs` guard:**
Added a check that at least one non-meta, non-timestamped lyric line exists before appending a trailing timestamp. Prevents the `[00:00.00]` insertion when the editor contains only metadata.

**Bug 2 — Paste with metadata fields overwrites instead of appending:**
Both paste handlers (`main-lines` for Hotkey mode, `main-textarea` for Typing mode) now detect whether the pasted text contains META_RE lines. If so, they run the same lrc-import path as the file picker: `mergeLrcMeta` merges metadata tags, non-meta lines replace the lyric body, and `batchSplitParens` is applied if enabled. Genius paste is unaffected.

SECTIONS index updated.

---

## Turn 2

**Prompt:**

> Same
> ### Bugs
> - In Hotkey mode, it's still possible to insert any amount of useless trailing timestamps of `[00:00.00]` before any lyrics exist.
> ### Refinements
> - Overwrite lyrics when pasting in Hotkey mode even if they don't come with metadata tags
>   - Genius paste still appends as before (edge-case intentional)
>   - Caveat accepted: nonsense clipboard paste overwrites, but one Undo reverts

---

**Bug — `syncLine`/`insertEndLine` stamped blank lines before any lyric text existed:**
The previous guard ran after stamping, so it didn't prevent the initial stamps. Fixed by adding a `hasLyricContent()` helper (true if any non-meta line has text content after stripping a possible timestamp prefix) and guarding both `syncLine` and `insertEndLine` with it. `maybeAppendTrailingTs` also updated to use the same helper.

**Refinement — Hotkey mode paste always overwrites:**
`main-lines` paste handler now always replaces content. If the pasted text has META_RE lines, `mergeLrcMeta` is used; otherwise the current meta block is preserved and only the lyric body is replaced. Genius paste still appends as before.

SECTIONS index updated.

---

## Turn 3

**Prompt:**

> Same
> ### Bugs
> - Pasting a song with no metadata tags in Hotkey mode ignores the blank newline in default metadata settings that separates metadata and lyrics

---

In the non-meta overwrite path, `mergedMeta` was built by filtering the textarea for meta/blank lines then calling `trimEnd()`, which stripped the trailing blank separator. Then `mergedMeta + '\n'` only added one newline, merging meta and lyrics. Fixed by slicing the current textarea up to the last META_RE line (preserving the exact current meta block without the blank), then joining with `'\n\n'` to restore the blank separator. SECTIONS index updated.

---

## Turn 4

**Prompt:**

> Same version. Audit every section of LineByLine for dead code or easy+safe LOC savings.

---

Full read of all sections. Removed:

- `stemOfLower()` in Import — defined but never called anywhere
- `HK_LABELS.mute` — label entry for a hotkey removed in a past migration
- Redundant ternary in `updateDynamicTooltips`: `k===''?'(unassigned)':'(unassigned)'` simplified to `k||'(unassigned)'`
- `afterTs` variable in the bracket autocomplete handler (Main textarea KD) — computed but never read
- `THEMES` array + `indexOf/modulo` cycle replaced with direct `themeMode=themeMode==='dark'?'light':'dark'`
- `panel.inert` if/else branch replaced with `panel.inert=panelCollapsed`

Intentionally kept:
- `_savedVol` — needed for both `_preMuteVolume` and `masterVolume`; inlining would duplicate `parseFloat`
- `savedAudioPath` — written to sessionStorage, never used to restore audio (browser limitation), kept for potential future use
- `clear_sel` in DEFAULT_CFG — not in HK_SECTIONS so never shown in Settings, but correctly reflects the Escape binding for code that reads `cfg.hotkeys.clear_sel`
- `isHeader()` — called in secondary paste/lrc-load handlers

SECTIONS index updated.

---

## Turn 5

**Prompt:**

> Same
> ### Bugs
> When pasting lyrics in Hotkey mode with metadata, an extra newline is added between metadata and lyrics.

---

`mergeLrcMeta` returns a string that already ends with `\n` (inherited from `DEFAULT_META`). All four call sites that assembled `mergedMeta + '\n' + lyrics` or `mergedMeta + '\n\n' + lyrics` were inconsistent and at least one produced a double blank line. Fixed all four sites to `mergedMeta.trimEnd() + '\n\n' + lyrics`, giving exactly one blank separator line regardless of what `mergeLrcMeta` returns. The four sites are: typing-mode paste handler, hotkey-mode paste handler, lrc-only file import, and audio+lrc file import.

---

## Turn 6

**Prompt:**

> Same
> ### Bugs
> - Regression: In Hotkey mode pasting Genius lyrics does not seem to process the text at all in latest 0.35.11 (works in Typing mode for 0.35.11, and in both modes for 0.35.10).
> - When the first line is synced and then undone, the final trailing timestamp is undone but the synced starting timestamp remains, triggering the 'Missing trailing timestamp' warning
> ### Refinements
> - Q and E are left out of the general navigation exemption for spam-while-held, and should be included. Q/E or other navigation spam should only be prevented if it would trigger intensive external triggers (i.e. instant-replay for prev/next line being checked in Settings).

---

**Bug 1 — Genius paste regression in Hotkey mode:**
The Turn 1/2 rewrite of the hotkey-mode paste handler correctly gates on `geniusCleaned` but the Genius branch mistakenly called `cleanPaste(raw,'paste')` (discarding the already-cleaned result) instead of using `geniusCleaned` directly. One-line fix: replace `const cleaned=cleanPaste(raw,'paste');const cleanedTrimmed=cleaned.split(...)` with `const cleanedTrimmed=geniusCleaned.split(...)`.

**Bug 2 — Undo after first sync leaves orphaned timestamp:**
`syncLine` called `setMainText` (pushes two snapshots) then separately called `maybeAppendTrailingTs` which called `setMainText` again (two more). One undo only unwound the trailing-ts snapshot, leaving the synced line timestamp in place and triggering the "Missing trailing timestamp" warning. Fixed by inlining the trailing-ts logic directly into `syncLine`: after stamping the active line, if this was the first content timestamp and audio duration is known, the trailing ts is appended to the same `lines` array before the single `setMainText` call. `maybeAppendTrailingTs` is no longer called from `syncLine`.

**Refinement — Q/E key-repeat exemption:**
Added `isPrevNext` (true when the pressed key matches `prev_line` or `next_line` hotkeys) and `prevNextReplayActive` (true only when the relevant instant-replay setting is enabled). The repeat guard now allows Q/E to repeat freely unless `prevNextReplayActive` is true, in which case repeat is suppressed to prevent spastic audio seeking.

SECTIONS index updated.

---

## Turn 7

**Prompt:**

> Same version. Genius paste in Hotkey mode is fixed, but the extra newline bug when pasting lyrics in Hotkey mode (like lyrics.txt example) addressed in Turn 5 has returned. Make sure that fixing one does not break the other.

---

The Turn 6 Genius fix left the non-Genius overwrite path's `hasMeta` branch assembling `mergedMeta+'\n\n'` without `.trimEnd()`. Since `mergeLrcMeta` returns a string ending in `\n` (from `DEFAULT_META`), this produced a double blank separator. The Turn 5 fix had correctly applied `.trimEnd()` at all four assembly sites, but the Turn 6 diff only touched the Genius branch and left this one unchanged. One-character fix: `mergedMeta+'\n\n'` → `mergedMeta.trimEnd()+'\n\n'` in the `hasMeta` path. The non-meta path (which builds `mergedMeta` from a raw `taLines.slice` with no trailing newline) was already correct and untouched.

---
