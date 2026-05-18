---
name: linebyline-section-index
description: Efficient section-targeted reading of linebyline-*.html to avoid loading the entire file unnecessarily. Use this skill at the start of every LineByLine coding session, and before reading any part of the app HTML. Contains the protocol for locating relevant sections by name, reading only those sections, and patching the file with minimal token cost.
---

# LineByLine Section Index

The app HTML is ~2600 lines. Loading it whole costs ~50k tokens. Most prompts only touch 1–4 sections. This skill tells you how to read only what you need.

---

## Step 1: Read the section markers — grep for `// ──`

The app no longer embeds a SECTIONS index comment. Instead, grep for section markers:

```bash
rg -n "^// ──|^  // ──" /path/to/linebyline-*.html
```

This gives you every section name and its start line number. Use this output to find the sections you need.

---

## Step 2: Read only the relevant section(s)

Once you have start lines from the grep, read the range from that line to just before the next section's start:

```bash
# Read lines N through M (e.g. section starting at 826, next section at 923)
sed -n '826,922p' /path/to/linebyline-*.html
```

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

Any patch that **inserts or deletes lines** shifts all subsequent line numbers. After writing a patched file, re-run the section grep:

```bash
rg -n "^// ──|^  // ──" /path/to/linebyline-*.html
```

Update the section reference below if the structure changes.

---

## Section list (reference)

This is the current section structure as of v0.36.2. Actual line numbers must be found by grepping the file — this list documents the section structure and contents, not exact line numbers.

```
Config               — DEFAULT_CFG, HK_SECTIONS, HK_LABELS
Hotkey rules         — RESTRICTED_ALL, ALPHA_NUM_SPACE_RE, isRestrictedForKey
Theme                — themeMode, cycleTheme, applyTheme
Font settings        — editorFont/Size, saveEditorFont, applyEditorFont
Dynamic tooltips     — updateDynamicTooltips
State                — all let/const mutable state declarations
                       (_syncAutoAdvanced tracks sync→T trailing-ts flow)
Persistence          — loadAutosave, doAutosave, takeSnapshot init
Undo/redo            — pushSnapshot, doUndo, doRedo, applySnapshot
                       (single-push model: only post-change push; applySnapshot clears
                       extra secondaries beyond snapshot data)
Mode switching       — applyMode, hotkeyMode toggle logic
Auto mode            — secondary field focus → auto switch to typing mode
Helpers
  LRC parse          — TS_RE, META_RE, tsToMs, msToTs, isEndTs, replaceTs,
                       normalizeLrcTimestamps, getSeekOffset, stripSecLine,
                       maybeAppendTrailingTs
  Paste/meta         — cleanPaste, ensureReTagDefault, mergeLrcMeta
  Genius             — cleanGenius, markGeniusSource, extractGeniusMeta
                       (markGeniusSource prepends "Genius" to [re:] value, then
                       ensureReTagDefault appends the configured default)
  Render/UI          — renderMainLines, scrollToActive, main-lines paste handler,
                       _announce
Audio                — audio element setup, playback controls, volume, seekbar
                       (auto-play on seek: doSeek and seekbar mouseup start playback)
Sync/timestamp       — syncLine, insertEndLine, seekPrev/NextLine, replayActiveLine,
                       adjustTs, _peelLastParen, batchSplitParens, markAsTranslation,
                       doSyncFile, tickSeekOffset, setOffsetMode
                       (insertEndLine: T after W auto-advance sets prev line's trailing ts)
Secondary fields     — addSecondary, removeSecondary, secondary textarea keydown,
                       secondary import (file picker, middle-click)
Line counts/merge    — getSecLines, checkLineCounts, updateMergeBtn, mergeTranslations
Title                — updateTitleFromText
Import               — doImport, doSave, file-picker handler, multi-file handling
Controls panel       — rebuildHkPanel, CTRL_ACTIONS, HOTKEY_ONLY, changeSpeed
                       (currentSpeed persisted to localStorage 'lbl_speed')
Settings             — openSettings, closeSettings, saveSettingsNow, buildHkRows
Settings search      — setSearchHkMode, applySettingsFilter, initSettingsSearch
                       (reset_defaults hotkey fires from search field)
Confirm dialog       — _resetConfirmPending, showResetConfirm, hideResetConfirm,
                       _doResetDefaults; inline Yes/No confirm UI in settings footer
Keyboard
  Key normalization  — keyStr, hkMatch
  Main textarea KD   — Enter trim, bracket/paren autocomplete
  Overlay utilities  — arrowNavTimer declaration
  Global KD          — document keydown handler (all hotkey dispatch)
                       (Esc blurs focused UI elements before isFocusedUI guard)
Unload warning       — beforeunload dirty check (includes secondary fields)
Button wiring        — all addEventListener calls for toolbar/panel buttons
                       (Now Playing / Controls buttons don't steal focus via
                       mousedown preventDefault on button clicks)
Init                 — startup sequence: theme, font, autosave, render, tooltips,
                       speed restore, panel collapse state
```
