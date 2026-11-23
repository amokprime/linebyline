---
name: linebyline-section-index
description: Efficient section-targeted reading of the LineByLine Vite app's src/ tree to avoid loading entire files unnecessarily. Use this skill at the start of every LineByLine coding session and before reading any part of the app source. Contains the prompt-to-file map (which src/ file owns which concern) and the protocol for reading only the files a given change touches.
---

The Vite app source lives in `src/` — 36 files across `components/`, `composables/`, `hotkeys/`, `utils/`, and root. Loading every file for a single change wastes tokens. Most prompts touch 1–4 files. This skill tells you which files those are.

The pre-modular-refactor monolith (`docs/index.html`, ~2800 lines) is restored in the working tree (Tranche 4.9) and stays until Phase E Tranche 6 deletes it post-cutover. **`src/` is the active code.** For parity checks against the monolith, read `docs/index.html` directly (or `git show <sha>:docs/index.html` for a specific historical version).

---

## Step 1: Find the files you need — use the prompt-to-file map

Look up the change type in the table below. Read only the listed files. For cross-cutting changes, read all listed files before patching.

| Type of change | `src/` files to read |
|---|---|
| New remappable hotkey action | `config.ts` (DEFAULT_CFG, HK_SECTIONS, HK_LABELS) + `composables/useGlobalHotkeys.ts` (dispatch) + `components/ControlsPanel.vue` (hotkey grid UI) + `hotkeys/restrictedKeys.ts` |
| Fix hotkey restriction / conflict logic | `hotkeys/restrictedKeys.ts` (RESTRICTED_ALL, isRestrictedForKey) + `hotkeys/keyUtils.ts` (keyStr, hkMatch) |
| Change Settings UI layout or search | `components/SettingsDialog.vue` + `composables/useSettings.ts` (row state, search query, conflict msg) |
| Fix undo/redo behaviour | `composables/useUndoRedo.ts` (snapshot stack) + `composables/usePersistedState.ts` |
| Change autosave / session restore | `composables/useAutosave.ts` + `composables/usePersistedState.ts` + `main.ts` (init sequence) |
| Fix Genius extraction | `utils/geniusExtractor.ts` (cleanGenius, extractGeniusTitleAndArtist, extractGeniusAlbum) |
| Fix paste / metadata cleaning | `utils/pasteHandlers.ts` (cleanPaste, ensureReTagDefault) |
| Fix LRC timestamp parsing | `utils/lrcParser.ts` (META_RE, TI_RE, tsToMs, msToTs, normalizeLrcTimestamps) + `utils/timestampSync.ts` (syncLine, adjustTs, _assignInterpolatedTs) |
| Fix main field rendering or line selection | `components/EditorArea.vue` (main textarea + line click handling) |
| Fix audio playback / seek / volume | `composables/useAudio.ts` (playback, seek, volume, progress drag) + `components/LeftPanel.vue` (audio controls UI) |
| Fix sync or timestamp offset | `composables/useSync.ts` (syncLine, insertEndLine, markAsTranslation, seek offset) + `components/ControlsPanel.vue` (sync buttons) |
| Fix mark-as-translation / batch split parens | `composables/useSync.ts` (_capitalizeFirstLetter, markAsTranslation) + `utils/pasteHandlers.ts` |
| Add / fix secondary field behaviour | `components/SecondaryField.vue` + `composables/useMerge.ts` (addSecondary, removeSecondary, onSecInput, onSecPaste, onSecKeydown) |
| Fix merge translations | `composables/useMerge.ts` (mergeTranslations, _buildMergedResult, checkLineCounts) + `utils/pasteHandlers.ts` |
| Fix title extraction from filename | `composables/useTitle.ts` (updateTitleFromText) |
| Fix file open / save | `composables/useImport.ts` (doImport, doSave, onFilePickerChange, onMiddleClick) |
| Fix mode switching (hotkey/typing toggle) | `composables/useModeSwitch.ts` (applyMode, toggleMode, toggleOffsetSeek) + `composables/useGlobalHotkeys.ts` |
| Fix overlay (Settings) open/close | `components/SettingsDialog.vue` + `composables/useGlobalHotkeys.ts` (handleSettingsKeys, handleSettingsEscape) |
| Fix bracket/autocomplete in typing mode | `composables/useTextareaKeys.ts` (onMainKeydown, handleEnterTrim, handleParenBracket, handleAsterisk) |
| Change theme or font | `composables/useTheme.ts` (themeMode, cycleTheme) + `composables/useEditorFont.ts` + `main.ts` (init) |
| Change init sequence or startup state | `main.ts` + `composables/usePersistedState.ts` + `App.vue` |
| Fix unload / dirty warning | `App.vue` (beforeunload handler) |
| Fix button wiring | `components/ControlsPanel.vue` + `components/LeftPanel.vue` + `components/MenuBar.vue` |
| Fix collapse/expand panel button | `composables/usePanelCollapse.ts` + `components/ControlsPanel.vue` |
| Add/change confirmation dialog | `components/SettingsDialog.vue` + `composables/useGlobalHotkeys.ts` (handleResetConfirmKeys) |
| Fix Settings focus trap / Tab navigation | `composables/useSettings.ts` + `composables/useGlobalHotkeys.ts` (handleSettingsTabArrows) |

---

## Step 2: Read only the relevant file(s)

```bash
# Read the whole file if it's small (<300 lines):
sed -n '1,$p' src/composables/useTitle.ts

# Or read a specific range (use after grepping for a function):
grep -n "^export function markAsTranslation" src/composables/useSync.ts
# → returns line number, then sed the range around it.
```

Read the minimum set of files needed. The map above tells you which. For a single-function fix, grep for the function name first to get the line range, then read just that range.

---

## Step 3: After patching — re-grep if you inserted/deleted lines

If your patch changes line counts in a file, any line references you noted earlier shift. Re-grep for the function/section you touched if you need to verify the patch landed:

```bash
grep -n "^export function <name>" src/composables/useSync.ts
```

---

## `src/` file reference

Each file and what it owns. Use this to find a file when the prompt doesn't match a table row directly.

```
Root
  App.vue               — root component: mounts panels, beforeunload dirty check,
                          wires composables via init callbacks
  main.ts               — entry point: createApp, init sequence (theme, font,
                          autosave, persistence, global hotkeys, audio callbacks)
  config.ts             — DEFAULT_CFG, HK_SECTIONS, HK_LABELS, LEGACY_HOTKEY_MAP,
                          migrateHotkeys/ensureDefaultHotkeys (table-driven migration)
  style.css             — Tailwind entry + design tokens
  globals.d.ts          — ambient type declarations

components/
  ControlsPanel.vue     — hotkey grid, sync buttons, speed/seek-offset controls,
                          panel collapse button
  EditorArea.vue        — main textarea, line click handling, render of lyric lines
  FontSelector.vue      — font family/size selector UI
  HotkeyCell.vue        — single hotkey capture cell (used in the Settings grid)
  LeftPanel.vue         — audio controls (play/pause, volume, seek bar, speed),
                          song title/artist display, progress slider
  MenuBar.vue           — top bar: theme toggle, settings button, help/issues links
  SecondaryField.vue    — secondary translation textarea + label
  SettingsDialog.vue    — Settings overlay: hotkey remap grid, search filter,
                          reset confirm dialog, default-meta editor
  ThemeProvider.vue     — theme injection wrapper

composables/
  useAppState.ts        — central reactive state (cfg, mainText, activeLine,
                          hotkeyMode, playing, refs to DOM elements)
  useAudio.ts           — audio element setup, playback, volume, seek, speed,
                          progress drag + wheel (mountProgressDrag, doSeek)
  useAutosave.ts        — autosave timer + restore
  useEditorFont.ts      — editor font family/size persistence
  useGlobalHotkeys.ts   — global keydown dispatcher, settings keyboard nav,
                          hotkey-mode arrows/replay, repeat guard, reset confirm
  useImport.ts          — file open/save, file picker, middle-click import
  useMerge.ts           — secondary fields, line counts, merge translations,
                          secondary paste/keydown handlers
  useModeSwitch.ts      — applyMode, hotkey/typing toggle, offset-seek toggle
  usePanelCollapse.ts   — panel collapse state + button refs
  usePersistedState.ts  — generic localStorage-backed ref factory
                          (used by volume, muted, speed, panel-collapsed)
  useSettings.ts        — settings row state, search query, conflict detection,
                          reset-confirm visibility, display/stored conversion
  useSync.ts            — syncLine, insertEndLine, markAsTranslation,
                          seek prev/next, replay, adjustTs, _capitalizeFirstLetter,
                          markGeniusSource, timestamp offset logic
  useTextareaKeys.ts    — main textarea keydown: Enter trim, paren/bracket
                          autocomplete, asterisk expansion
  useTheme.ts           — themeMode ref, cycleTheme, applyTheme
  useTitle.ts           — updateTitleFromText (parses [ti:]/[ar:] tags)
  useUndoRedo.ts        — snapshot-based undo/redo stack

hotkeys/
  keyUtils.ts           — keyStr (normalizes KeyboardEvent → hotkey string),
                          hkMatch (compares against stored hotkey)
  restrictedKeys.ts     — RESTRICTED_ALL set, isRestrictedForKey, isRestrictedForAll

utils/
  geniusExtractor.ts    — cleanGenius, extractGeniusTitleAndArtist,
                          extractGeniusAlbum, findArtistAfterTitle, _filterYmal
  hotkeyDisplay.ts      — stored→display conversion for hotkey cells
  lrcParser.ts          — META_RE, TI_RE, tsToMs, msToTs, isEndTs, replaceTs,
                          normalizeLrcTimestamps, findLastMetaIdx, lrcHasTi
  pasteHandlers.ts      — cleanPaste, ensureReTagDefault (RE_DEFAULT_RE,
                          RE_TAG_LINE, RE_TAG_KEY, RE_TAG_REPLACE)
  timestampSync.ts      — syncLine, adjustTs, _peelLastParen, batchSplitParens,
                          _assignInterpolatedTs, _findPrevTsMs/_findNextTsMs
  lib/utils.ts          — shadcn-vue cn() class merge helper
```

---

## Parity checks against the monolith (historical)

The pre-modular-refactor monolith (`docs/index.html`, ~2800 lines) is in the working tree (restored in Tranche 4.9 until Phase E Tranche 6 deletes it). For a parity check (verifying a ported function matches the original), grep it directly:

```bash
grep -n "^// ──" docs/index.html   # section markers
grep -n "function <name>" docs/index.html   # specific function
git show <sha>:docs/index.html | grep -n "function <name>"   # a specific historical version
```

The monolith's section structure mapped roughly to the `src/` files above — e.g. the monolith's `// ── Audio ──` section → `composables/useAudio.ts`; the monolith's `// ── Sync / timestamp ──` section → `composables/useSync.ts` + `utils/timestampSync.ts`.
