---
name: modular-app
description: LineByLine modular app architecture — the prompt-to-file map for src/ (which composable or component owns which concern) plus the durable patterns of the Vite + Vue 3 + Tailwind + shadcn-vue stack (storage layers, init sequence, reactive DOM sync, file import/export, vite-plugin-singlefile build constraints, scoped-CSS gotchas, singleton composables). Use this skill at the start of every LineByLine coding session and before reading any part of src/, and whenever writing or modifying Vue components, composables, src/config.ts, or the build output. Consolidates the retired linebyline-section-index and single-file-html-app skills (Phase E Tranche 8). Pairs with code-quality (bug patterns), browser-hotkey-system (hotkey architecture), aria-accessibility (a11y rules).
---

LineByLine is a modular Vite + Vue 3 + Tailwind v4 + shadcn-vue app. All active code lives in `src/` — the pre-refactor monolith (`docs/index.html`, ~2800 lines) was deleted in Phase E Tranche 6 (Nov 23, 2026); Vite is the only build target. This skill tells you which files a change touches and which architecture patterns the ported code follows. Bug-pattern rules (undo/redo push model, config migration, braceless ifs, CC threshold) live in `code-quality-SKILL.md` — this skill documents structure, that skill documents behavior rules.

---

## Part 1 — Find the files: prompt-to-file map

Look up the change type in the table. Read only the listed files; for cross-cutting changes, read all listed files before patching.

| Type of change | `src/` files to read |
|---|---|
| New remappable hotkey action | `config.ts` (DEFAULT_CFG, HK_SECTIONS, HK_LABELS) + `composables/useGlobalHotkeys.ts` (dispatch) + `components/ControlsPanel.vue` (hotkey grid UI) + `hotkeys/restrictedKeys.ts` |
| Fix hotkey restriction / conflict logic | `hotkeys/restrictedKeys.ts` (RESTRICTED_ALL, isRestrictedForKey) + `hotkeys/keyUtils.ts` (keyStr, hkMatch) |
| Change Settings UI layout or search | `components/SettingsDialog.vue` + `composables/useSettings.ts` (row state, search query, conflict msg) |
| Fix undo/redo behaviour | `composables/useUndoRedo.ts` (snapshot stack) + `composables/usePersistedState.ts` |
| Change autosave / session restore | `composables/useAutosave.ts` + `composables/usePersistedState.ts` + `App.vue` (init sequence) |
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
| Change theme or font | `composables/useTheme.ts` (themeMode, cycleTheme) + `composables/useEditorFont.ts` + `App.vue` (init) |
| Change init sequence or startup state | `App.vue` + `composables/usePersistedState.ts` + `composables/useAutosave.ts` |
| Fix unload / dirty warning | `App.vue` (beforeunload handler) + `composables/useAppState.ts` (isDirty watch) |
| Fix button wiring | `components/ControlsPanel.vue` + `components/LeftPanel.vue` + `components/MenuBar.vue` |
| Fix collapse/expand panel button | `composables/usePanelCollapse.ts` + `components/ControlsPanel.vue` |
| Add/change confirmation dialog | `components/SettingsDialog.vue` + `composables/useGlobalHotkeys.ts` (handleResetConfirmKeys) |
| Fix Settings focus trap / Tab navigation | `composables/useSettings.ts` + `composables/useGlobalHotkeys.ts` (handleSettingsTabArrows) |

---

## Part 2 — `src/` file reference

Each file and what it owns. Use this to find a file when the prompt doesn't match a table row directly.

```
Root
  App.vue               — root component: mounts panels, beforeunload dirty check,
                          wires composables via init/callback setters, window.doSave
                          exposure, sessionStorage autosave restore
  main.ts               — entry point: createApp + ThemeProvider + style.css import
  config.ts             — DEFAULT_CFG, HK_SECTIONS, HK_LABELS, LEGACY_HOTKEY_MAP,
                          migrateHotkeys/ensureDefaultHotkeys (table-driven migration)
  style.css             — Tailwind entry + design tokens (shadcn :root/.dark blocks +
                          app tokens as deliberately separate blocks)
  globals.d.ts          — ambient type declarations (window.doSave augmentation)

components/
  ControlsPanel.vue     — hotkey grid, sync buttons, speed/seek-offset controls,
                          panel collapse button
  EditorArea.vue        — main textarea, line click handling, render of lyric lines
                          (carries the global <style> block for .lrc-line rules —
                          see "Scoped CSS vs innerHTML" below)
  FontSelector.vue      — font family/size selector UI (fs-spinner number fields)
  HotkeyCell.vue        — single hotkey capture cell (native <button>, used in the
                          Settings grid)
  LeftPanel.vue         — audio controls (play/pause, volume, seek bar, speed),
                          song title/artist display, progress slider, :inert on collapse
  MenuBar.vue           — top bar: theme toggle, settings button, help/issues links
  SecondaryField.vue    — secondary translation textarea + label
  SettingsDialog.vue    — Settings overlay (shadcn-vue Dialog): hotkey remap grid,
                          search filter, reset confirm dialog, default-meta editor
  ThemeProvider.vue     — theme injection wrapper
  ui/                   — generated shadcn-vue primitives (button/, dialog/, lib/utils).
                          Treat as vendored: extend via wrapper props/slots rather than
                          editing internals, so a future `shadcn-vue add` regen can't
                          clobber hand edits

composables/
  useAppState.ts        — central reactive state (cfg, mainText, activeLine,
                          hotkeyMode, playing, refs to DOM elements, isDirty watch)
  useAudio.ts           — audio element setup, playback, volume, seek, speed,
                          progress drag + wheel (mountProgressDrag, doSeek,
                          togglePlayFromSlider, pauseIfPlaying)
  useAutosave.ts        — autosave timer + restore (sessionStorage 'lbl_autosave')
  useEditorFont.ts      — editor font family/size persistence
  useGlobalHotkeys.ts   — global keydown dispatcher, settings keyboard nav,
                          hotkey-mode arrows/replay, repeat guard, reset confirm,
                          updateDynamicTooltips
  useImport.ts          — file open/save, file picker, middle-click import
  useMerge.ts           — secondary fields, line counts, merge translations,
                          secondary paste/keydown handlers
  useModeSwitch.ts      — applyMode, hotkey/typing toggle, offset-seek toggle
  usePanelCollapse.ts   — panel collapse state + button refs (persisted)
  usePersistedState.ts  — generic localStorage-backed ref factory
                          (useVolume/useMuted/useSpeed + panel-collapsed)
  useSettings.ts        — settings row state, search query, conflict detection,
                          reset-confirm visibility, display/stored conversion
  useSync.ts            — syncLine, insertEndLine, markAsTranslation,
                          seek prev/next, replay, adjustTs, _capitalizeFirstLetter,
                          markGeniusSource, renderMainLines (innerHTML line DOM)
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

## Part 3 — Reading protocol

Read the minimum set of files the map lists. For a single-function fix, grep for the function name first to get the line range, then read just that range:

```bash
grep -n "^export function markAsTranslation" src/composables/useSync.ts
# → returns line number, then sed/Read that range only.
```

If your patch changes line counts, any line references you noted earlier shift — re-grep the function you touched to verify the patch landed. If the patch creates, renames, or moves `src/` files (or changes which file owns a concern), update this skill's map. Pure line-number shifts don't affect the map.

---

## Part 4 — Architecture patterns

### Storage layers — three tiers, pick by data shape

| What | Where | Key / factory | Cleared |
|---|---|---|---|
| User settings + hotkeys (cfg) | localStorage | `'lbl_cfg'`, read/written via `useAppState().cfg` | Only on reset-to-default |
| Display prefs (volume, muted, speed, panel-collapsed) | localStorage, individual keys | `usePersistedState` factory (`useVolume`/`useMuted`/`useSpeed`…) | Never |
| Work in progress (lyrics + audio state) | sessionStorage | `'lbl_autosave'` via `useAutosave` | Cleared on tab close AND removed before load on refresh (monolith parity — `App.vue` calls `sessionStorage.removeItem` before `loadAutosave`, so a refresh starts clean by design) |

Display prefs live outside cfg so they persist independently and never need config-migration handling. When adding a persisted display pref, use the `usePersistedState` factory — don't inline another `localStorage.getItem` call. Config-key migration rules: `code-quality-SKILL.md` → "Config migration patterns".

### Init sequence — order matters

`main.ts` (createApp → ThemeProvider → style.css) → `App.vue` setup (composable instantiation + callback wiring: setSyncCallbacks, initMerge, initImport, setFilePickerRef) → `App.vue` `onMounted` (setupAudio + setAudioCallbacks, sessionStorage cleanup + initAutosave restore, initGlobalHotkeys + document-level keydown listener, beforeunload listener, `window.doSave` exposure, updateDynamicTooltips) → `onBeforeUnmount` removes the document/beforeunload listeners (HMR safety). Two ordering constraints: audio callbacks must be wired before the first play attempt, and tooltips must be updated after cfg is loaded (App.vue also watches cfg and re-runs updateDynamicTooltips).

### Reactive DOM sync replaces imperative sync

The monolith's `getElementById().value =` / `.textContent =` pattern becomes Vue `:value` / `{{ }}` / `:style` reactive bindings, with a `watch` only for non-template targets (e.g. `watch([masterVolume, masterMuted])` syncing `audioEl.volume`). Prefer reactive bindings over new imperative DOM-sync functions; the reactivity system IS the sync mechanism. Exception: `renderMainLines()` in `useSync.ts` builds line DOM via `innerHTML` for performance — it must manually maintain the classes/attributes a template would give for free.

### Scoped CSS vs innerHTML — the silent-failure gotcha

Vue scoped CSS tags only template-rendered elements with the `data-v-*` attribute. DOM built at runtime through `innerHTML` (the `.lrc-line` rows from `renderMainLines`) never gets that attribute, so `.lrc-line[data-v-*]` selectors silently match nothing — no cursor border, no active highlight. Any CSS targeting innerHTML-created elements must live in a non-scoped (global) `<style>` block; `EditorArea.vue` carries one for exactly this reason. Container/textarea rules that target template elements stay scoped. If styling added for a runtime-built element "does nothing", check the style block's scoping first.

### Singleton composables — no provide/inject

State composables (`useAppState` etc.) are module-level singletons: refs live at module scope, `init*()` is called once from the owning component, other modules import functions directly. No injection keys, no provider component — matches how the monolith's top-level `let` state worked. Unit tests get a fresh module per test via `vi.resetModules()`.

### vite-plugin-singlefile build constraints

The production build (`build:single`) inlines JS and CSS into one HTML file but does NOT inline external assets. Therefore: inline SVG icons only (no icon font or image files), system font stacks only (no webfont imports). If `shadcn-vue init`/`add` re-adds its Google Fonts `@import` (Geist) to `style.css`, delete it again — remote assets would 404 in the single-file artifact and in offline use.

### Dialogs — shadcn-vue Dialog owns the modal mechanics

Settings and its confirm sub-dialog are shadcn-vue `Dialog` components (reka-ui primitives under `components/ui/dialog/`): focus trap, `aria-modal`, Esc-to-close, and overlay stacking are handled by the primitive — do not hand-roll overlay z-index management or focus traps for new modals. The inline reset-confirm stays as `v-show` on original elements by design (tests assert its `display` toggling). Keyboard handling inside the dialog (capture inputs, Tab/arrow navigation) is app code: `useSettings.ts` + `useGlobalHotkeys.ts` — see `browser-hotkey-system-SKILL.md`.

### File import/export

Hidden `#file-picker` input at the App root (`display:none`, never `aria-hidden` — see `aria-accessibility-SKILL.md` Rule 3), triggered programmatically; middle-click opens it too. Multi-file selection branches by extension (audio-only / lrc-only / audio+lrc pair). Save uses a Blob URL + temporary `<a download>` click + `URL.revokeObjectURL`. `doSave` is also exposed as `window.doSave` in `App.vue` `onMounted` (declared in `src/globals.d.ts`) — the save hotkey dispatches through the window reference so Playwright can monkeypatch it on Firefox.

### Number inputs with custom spinners

Native `<input type="number">` spin buttons are browser-inconsistent and can't be styled. The app pattern (FontSelector, LeftPanel): suppress native spinners via CSS (`.num-field`), pair the field with ▲/▼ buttons, keep unit labels as external `<span>` elements (never inside the field value — breaks parseFloat), and on empty-then-Enter change events resync the display from the stored value instead of returning silently.

### CSS quick pitfalls

`min-height: 0` on flex children (nested flex containers overflow instead of scrolling without it); `box-sizing: border-box` reset on everything; `overflow: hidden` on the app shell so the page never scrolls instead of internal panels; `user-select: none` on chrome, selectively re-enabled on content areas.

### Cross-references for behavior rules

- `code-quality-SKILL.md` — undo/redo single-push model, config migration, single source of truth, braceless-if, CC ≤ 15, beforeunload checking all content areas.
- `browser-hotkey-system-SKILL.md` — key normalization, restriction sets, capture-input interactions, conflict swap, HK_SECTIONS manifest, dynamic tooltips.
- `aria-accessibility-SKILL.md` — semantic HTML, accessible names, dialog/labels, live regions, `inert` panels.
- `playwright-testing-SKILL.md` — how the app is tested (Vite `dist/` is the only target).

---

## Part 5 — Parity checks against the monolith (historical)

The monolith lived in the working tree until Phase E Tranche 6 deleted it. For a parity check (verifying a ported function matches the original), read it from git history — the Tranche 6 deletion commit's parent has the last live copy:

```bash
git show <sha>:docs/index.html | grep -n "^// ──"           # section markers
git show <sha>:docs/index.html | grep -n "function <name>"  # specific function
```

The monolith's `// ──` sections map roughly onto `src/` files: `// ── Audio ──` → `useAudio.ts`; `// ── Sync / timestamp ──` → `useSync.ts` + `timestampSync.ts`; `// ── Settings ──` → `useSettings.ts` + `SettingsDialog.vue`; the `// ──` grep protocol itself is obsolete — file boundaries are the section index now.
