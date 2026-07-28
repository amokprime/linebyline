---
name: linebyline-section-index
description: Efficient section-targeted reading of linebyline-*.html to avoid loading the entire file unnecessarily. Use this skill at the start of every LineByLine coding session, and before reading any part of the app HTML. Contains the protocol for locating relevant sections by name, reading only those sections, and patching the file with minimal token cost.
---

The app HTML is about 2700 lines. Loading it whole costs about 50k tokens. Most prompts only touch 1–4 sections. This skill tells you how to read only what you need.

---

Step 1: Read the section markers — grep for `// ──`

The app no longer embeds a SECTIONS index comment. Instead, grep for section markers:

```bash
rg -n "^// ──|^  // ──" /path/to/linebyline-*.html
```

This gives you every section name and its start line number. Use this output to find the sections you need.

---

Step 2: Read only the relevant section(s)

Once you have start lines from the grep, read the range from that line to just before the next section's start:

```bash
sed -n '826,922p' /path/to/linebyline-*.html
```

Read the minimum set of sections needed. Use the prompt-to-section map below as a guide.

---

Prompt-to-section map

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
| Fix collapse/expand panel button | Button wiring (applyPanelCollapse lives here, not Init) |
| Add/change confirmation dialog | Confirm dialog + Settings + Keyboard → Global KD |
| Fix Settings focus trap / Tab navigation | Settings search + Keyboard → Global KD |

For cross-cutting changes (e.g. new hotkey = Config + Hotkey rules + Controls + Global KD), read all listed sections before patching. Reading 4 sections of about 80 lines each (about 320 lines) is still about 6x cheaper than the full file.

---

Step 3: After patching — re-extract the index

Any patch that inserts or deletes lines shifts all subsequent line numbers. After writing a patched file, re-run the section grep:

```bash
rg -n "^// ──|^  // ──" /path/to/linebyline-*.html
```

---

Section list (reference)

This is the current section structure as of v0.37.2. Actual line numbers must be found by grepping the file — this list documents the section structure and contents, not exact line numbers.

```
Config               — DEFAULT_CFG, HK_SECTIONS, HK_LABELS, _LEGACY_HOTKEY_MAP (table-driven
                       hotkey migration: old value → new default, keyed by action)
Hotkey rules         — RESTRICTED_ALL (no arrow keys), ALPHA_NUM_SPACE_RE, isRestrictedForKey
                       (arrow keys NOT restricted — handled for Settings navigation instead)
Persistence          — loadCfg, saveCfg, _migrateHotkeys (delegates to _migrateLegacyHotkeys +
                       _ensureDefaultHotkeys), _migrateLegacyHotkeys (iterates _LEGACY_HOTKEY_MAP),
                       _ensureDefaultHotkeys (sets defaults for keys undefined in stored cfg),
                       loadAutosave, doAutosave, _restoreSecondaryPool, takeSnapshot init
Theme                — themeMode, cycleTheme, applyTheme
Font settings        — editorFont/Size, saveEditorFont, applyEditorFont
Dynamic tooltips     — updateDynamicTooltips
State                — MAX_LINES (500), all let/const mutable state declarations
                       (_syncAutoAdvanced tracks sync→T trailing-ts flow)
Undo/redo            — pushSnapshot, doUndo, doRedo, applySnapshot
                       (single-push model: only post-change push; applySnapshot clears
                       extra secondaries beyond snapshot data)
Mode switching       — applyMode, hotkeyMode toggle logic
Auto mode            — secondary field focus → auto switch to typing mode
Helpers
  LRC parse          — TS_RE, META_RE, tsToMs, msToTs, isEndTs, replaceTs,
                       normalizeLrcTimestamps, getSeekOffset, stripSecLine,
                       maybeAppendTrailingTs,
                       _findPrevTsMs/_findNextTsMs/_findRunEnd (extracted from
                       _assignInterpolatedTs in 0.37.2 — reusable timestamp scans)
  Paste/meta         — cleanPaste, ensureReTagDefault, mergeLrcMeta
  Genius             — cleanGenius, markGeniusSource, extractGeniusMeta,
                       _findGeniusLyricBounds (delegates to _findGeniusLyricStart +
                       _findGeniusLyricEnd), _findGeniusLyricStart, _findGeniusLyricEnd,
                       _filterYmal, _extractGeniusFields (delegates to
                       _extractGeniusTitleAndArtist + _extractGeniusAlbum),
                       _extractGeniusTitleAndArtist, _findArtistAfterTitle,
                       _extractGeniusAlbum
                       (markGeniusSource prepends "Genius" to [re:] value, then
                       ensureReTagDefault appends the configured default)
  Render/UI          — renderMainLines, scrollToActive, main-lines paste handler,
                       _announce, _handleLineClick (delegates plain-click branch to
                       _handleLineClickPlain), _handleLineClickPlain
Audio                — audio element setup, playback controls, volume, seekbar
                       (auto-play on seek: doSeek and seekbar mouseup start playback)
Sync/timestamp       — syncLine, insertEndLine, seekPrev/NextLine, replayActiveLine,
                       adjustTs, _peelLastParen, batchSplitParens, markAsTranslation,
                       doSyncFile, tickSeekOffset, setOffsetMode,
                       _assignInterpolatedTs (uses _findPrevTsMs/_findNextTsMs/_findRunEnd;
                       while-loop cursor advanced past processed runs without S2310),
                       _advanceAfterSplit (delegates to _findNextUnprocessedSplit +
                       _findNextNonMetaFromIdx), _findNextUnprocessedSplit,
                       _findNextNonMetaFromIdx
                       (insertEndLine: T after W auto-advance sets prev line's trailing ts)
Secondary fields     — addSecondary (max 10 fields), removeSecondary, secondary textarea keydown,
                       secondary import (file picker, middle-click)
Line counts/merge    — getSecLines, checkLineCounts, updateMergeBtn, mergeTranslations
Title                — updateTitleFromText
Import               — doImport, doSave, file-picker handler, multi-file handling
Controls panel       — rebuildHkPanel, _renderHkCellContent, CTRL_ACTIONS, HOTKEY_ONLY, TYPING_AVAILABLE,
                       changeSpeed
                       (currentSpeed persisted to localStorage 'lbl_speed')
                       (Typing-mode overlays: play_pause shows play_pause_alt,
                       prev_line shows ↑ only, next_line shows ↓ only)
Settings             — openSettings, closeSettings, saveSettingsNow, buildHkRows
                       (Swap button swaps hotkeys; Reset gives holder its default back)
Settings search      — setSearchHkMode, applySettingsFilter, initSettingsSearch,
                       _handleSettingsSearchKeydown (delegates to _handleSearchHkMode or
                       _handleSearchNormalMode based on _sSearchHkMode flag),
                       _handleSearchHkMode, _handleSearchNormalMode
                       (reset_defaults hotkey fires from search field)
                       (arrow keys pass through to global handler for navigation)
Confirm dialog       — _resetConfirmPending, showResetConfirm, hideResetConfirm,
                       _doResetDefaults; inline Yes/No confirm UI in settings footer
Keyboard
  Key normalization  — keyStr, hkMatch
  Main textarea KD   — Enter trim, bracket/paren autocomplete,
                       _handleTextareaEnterTrim, _handleTextareaParenBracket (delegates to
                       _wrapSelectionWith + _handleParenAtLineStart), _wrapSelectionWith,
                       _handleParenAtLineStart
  Overlay utilities  — arrowNavTimer declaration,
                       _getSettingsFocusable, _handleSettingsTabArrows (Tab + ArrowUp/Down),
                       _handleSettingsHotkeyDispatch (settings/help/issues/theme/panel/reset),
                       _handleSettingsEscape, _handleSettingsKeys (dispatcher)
                       (ArrowUp/ArrowDown navigate all Settings elements, not just captures)
  Global KD          — document keydown handler (all hotkey dispatch),
                       _isRepeatAllowed, _handleRepeatGuard: repeat key guard,
                       _handleTypingModeArrowKeys: arrow keys for prev/next in Typing mode,
                       _isFocusedUIElement, _isPrevNextReplay,
                       _handleGlobalHotkeys (delegates to _handleGlobalHotkeyDispatch for
                       table-driven action dispatch), _handleGlobalHotkeyDispatch,
                       _handleHotkeyModeKeys (delegates to _handleHotkeyModeNav +
                       _handleHotkeyModeReplay), _handleHotkeyModeNav (Home/End/PageUp/PageDown/
                       ArrowUp/ArrowDown; delegates ArrowUp/Down to _handleHotkeyModeArrows),
                       _handleHotkeyModeArrows (uses _findNextNonMetaLine + _isAtBoundary),
                       _handleHotkeyModeReplay (replay_line/replay_only/replay_end/shift+Enter/
                       shift+Space), _findNextNonMetaLine, _isAtBoundary
                       (Esc blurs focused UI elements before isFocusedUI guard)
                       (Typing mode: ↑/↓ for prev/next line when no textarea focused)
Unload warning       — beforeunload dirty check (includes secondary fields)
Button wiring        — all addEventListener calls for toolbar/panel buttons
                       (Now Playing / Controls buttons don't steal focus via
                       mousedown preventDefault on button clicks)
Init                 — startup sequence: theme, font, autosave, render, tooltips,
                       speed restore, panel collapse state
```
