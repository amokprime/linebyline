---
name: linebyline-section-index
description: Efficient section-targeted reading of linebyline-*.html to avoid loading the entire file unnecessarily. Use this skill at the start of every LineByLine coding session, and before reading any part of the app HTML. Contains the protocol for locating relevant sections by name, reading only those sections, and patching the file with minimal token cost.
---

# LineByLine Section Index

The app HTML is ~2500 lines. Loading it whole costs ~50k tokens. Most prompts only touch 1–4 sections. This skill tells you how to read only what you need.

---

## Step 1: Read the SECTIONS index first — not the whole file

The app has a one-line section index embedded near the top of the `<script>` block (around line 330, immediately below `'use strict';`). **Always read this line before anything else.** It is cheaper than grep and gives you every section name and its start line number.

```bash
sed -n '328,332p' /path/to/linebyline-*.html
```

The SECTIONS line looks like:
```
// SECTIONS: Config~346 | Hotkey rules~415 | Theme~510 | Font~523 | Tooltips~538 | State~567 | Persistence~583 | Undo/redo~621 | Mode switching~639 | Auto mode~699 | Helpers~702 [LRC parse~703 | Paste/meta~722 | Genius~778 | Render/UI~875] | Audio~960 | Sync/timestamp~1148 | Secondary~1340 | Line counts~1448 | Title~1528 | Import~1536 | Controls~1648 | Settings~1746 | Settings search~1812 | Confirm~2164 | Keyboard~2200 [Key norm~2201 | Main textarea KD~2209 | Overlay utils~2268 | Global KD~2270] | Unload~2428 | Button wiring~2434 | Init~2451
```

- Top-level sections: `Name~linenum`
- Sub-sections inside `[...]`: same format, indented one level under their parent

**Use this index to find start lines. Do not grep the file unless the SECTIONS line is missing or you need to verify line numbers after a patch that inserted or deleted lines.**

---

## Step 2: Read only the relevant section(s)

Once you have start lines from the index, read the range from that line to just before the next section's start:

```bash
# Read lines N through M (e.g. section starting at 826, next section at 923)
sed -n '826,922p' /path/to/linebyline-*.html
```

Using the Filesystem connector's `head`/`tail` parameters for a middle slice:
- Not directly supported for an arbitrary range — use `copy_file_user_to_claude` + `sed` on Claude's machine instead, or read the whole file only if the section is near the start or end.

**Read the minimum set of sections needed.** Use the prompt-to-section map below as a guide.

---

## Prompt-to-section map

| Type of change | Sections to read |
|---|---|
| New remappable hotkey action | Config + Hotkey rules + Controls + Keyboard → Global KD |
| Fix hotkey restriction / conflict logic | Hotkey rules + Keyboard → Key norm |
| Change Settings UI layout or search | Settings + Settings search |
| Fix undo/redo behaviour | Undo/redo + Persistence |
| Change autosave / session restore | Persistence + Init |
| Fix Genius extraction | Helpers → Genius |
| Fix paste / metadata cleaning | Helpers → Paste/meta |
| Fix LRC timestamp parsing | Helpers → LRC parse |
| Fix main field rendering or line selection | Helpers → Render/UI |
| Fix audio playback / seek / volume | Audio |
| Fix sync or timestamp offset | Sync/timestamp + Controls |
| Fix mark-as-translation / batch split parens | Sync/timestamp + Helpers → Paste/meta |
| Add / fix secondary field behaviour | Secondary fields + Line counts/merge |
| Fix merge translations | Line counts/merge + Helpers → Paste/meta |
| Fix title extraction from filename | Title |
| Fix file open / save | Import |
| Fix mode switching (hotkey/typing toggle) | Mode switching + Auto mode + Keyboard → Global KD |
| Fix overlay (Settings) open/close | Settings + Keyboard → Overlay utils |
| Fix bracket/autocomplete in typing mode | Keyboard → Main textarea KD |
| Change theme or font | Theme + Font + Init |
| Change init sequence or startup state | Init + Persistence + State |
| Fix unload / dirty warning | Unload + State |
| Fix button wiring | Button wiring |
| Fix collapse/expand panel button | Button wiring (`applyPanelCollapse` lives here, not Init) |
| Add/change confirmation dialog | Confirm dialog + Settings + Keyboard → Global KD |
| Fix Settings focus trap / Tab navigation | Settings search + Keyboard → Global KD |

For cross-cutting changes (e.g. new hotkey = Config + Hotkey rules + Controls + Global KD), read all listed sections before patching. Reading 4 sections of ~80 lines each (~320 lines) is still ~6x cheaper than the full file.

---

## Step 3: After patching — re-extract the index

Any patch that **inserts or deletes lines** shifts all subsequent line numbers. After writing a patched file, re-run the section grep and check whether the SECTIONS index line is still accurate:

```bash
grep -n "^// ──\|^  // ──\|^// SECTIONS" /path/to/linebyline-*.html
```

If numbers have shifted, update the SECTIONS line in the file before presenting it.

### Updating the SECTIONS line

The SECTIONS line is at the very top of the `<script>` block (2 lines below `<script>`). Update it with exact line numbers from the grep output. Format:

```
// SECTIONS: Name~N | Name~N | Parent~N [Sub~N | Sub~N] | ...
```

Sub-sections that belong to a parent section are grouped in `[...]` immediately after their parent's entry.

---

## Section list (reference)

This is the current section structure as of v0.35.10. Actual line numbers are in the embedded SECTIONS comment in the file — use that, not this list, since edits shift lines.

```
Config               — DEFAULT_CFG, HK_SECTIONS, HK_LABELS
Hotkey rules         — RESTRICTED_ALL, ALPHA_NUM_SPACE_RE, isRestrictedForKey
Theme                — themeMode, cycleTheme, applyTheme
Font settings        — editorFont/Size, saveEditorFont, applyEditorFont
Dynamic tooltips     — updateDynamicTooltips
State                — all let/const mutable state declarations
Persistence          — loadAutosave, doAutosave, takeSnapshot init
Undo/redo            — pushSnapshot, doUndo, doRedo, applySnapshot
Mode switching       — applyMode, hotkeyMode toggle logic
Auto mode            — secondary field focus → auto switch to typing mode
Helpers
  LRC parse          — TS_RE, META_RE, tsToMs, msToTs, isEndTs, replaceTs,
                       normalizeLrcTimestamps, getSeekOffset, stripSecLine,
                       maybeAppendTrailingTs
  Paste/meta         — cleanPaste, ensureReTagDefault, mergeLrcMeta
  Genius             — cleanGenius, markGeniusSource, extractGeniusMeta
  Render/UI          — renderMainLines, scrollToActive, main-lines paste handler
Audio                — audio element setup, playback controls, volume, seekbar
Sync/timestamp       — syncLine, insertEndLine, seekPrev/NextLine, replayActiveLine,
                       adjustTs, _peelLastParen, batchSplitParens, markAsTranslation,
                       doSyncFile, tickSeekOffset, setOffsetMode
Secondary fields     — addSecondary, removeSecondary, secondary textarea keydown
Line counts/merge    — getSecLines, checkLineCounts, updateMergeBtn, mergeTranslations
Title                — updateTitleFromText
Import               — doImport, doSave, file-picker handler, multi-file handling
Controls panel       — rebuildHkPanel, CTRL_ACTIONS, HOTKEY_ONLY, changeSpeed
Settings             — openSettings, closeSettings, saveSettingsNow, buildHkRows
Settings search      — setSearchHkMode, applySettingsFilter, initSettingsSearch
Confirm dialog       — _resetConfirmPending, showResetConfirm, hideResetConfirm,
                       _doResetDefaults; inline Yes/No confirm UI in settings footer
Keyboard
  Key normalization  — keyStr, hkMatch
  Main textarea KD   — Enter trim, bracket/paren autocomplete
  Overlay utilities  — arrowNavTimer declaration
  Global KD          — document keydown handler (all hotkey dispatch)
Unload warning       — beforeunload dirty check
Button wiring        — all addEventListener calls for toolbar/panel buttons
Init                 — startup sequence: theme, font, autosave, render, tooltips,
                       panel collapse state
```
