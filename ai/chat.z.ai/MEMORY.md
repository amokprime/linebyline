# LineByLine — durable memory seed

Harness-agnostic, git-tracked memory for AI coding agents. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update this file. The web-channel agent edits its sandbox copy and produces it in `download/` for the user to apply to the repo.

## Architectural decisions

### Modular stack scaffold (item 3 Phase A, Sep 2026)

- Vite 8 + Vue 3.5 + TS 6 + Tailwind v4 + shadcn-vue 2.8 (reka-nova style, neutral base) scaffolded at repo root: `src/`, `vite.config.mts`, `tsconfig{,.app,.node}.json`, `components.json`, `deploy.yml` (workflow_dispatch ONLY until the Phase E cutover).
- `package.json` keeps `"type": "commonjs"` until item 4 converts the CJS Playwright tests — hence the Vite config is `vite.config.mts` (ESM per-file).
- `shadcn init`'s Google Fonts (Geist) import was removed — no external fonts; re-delete it if `shadcn-vue add` re-adds one.
- The shadcn-vue CLI (devDep) carries 7 moderate npm-audit findings via `vue-metamorph → stylus → decode-uri-component` — dismiss Dependabot alerts on it as dev dependency.
- Status + gotchas: `archive/modular/plan/0-Roadmap.md` item 3, "Phase A implementation notes".

### Theme tokens mapped (item 3 Phase B, Sep 2026)

- `src/style.css` holds the shadcn token blocks mapped 1:1 from the monolith's GitHub Light/Dark palette, plus a separate "LineByLine app tokens" block (`--active-*`, `--warn-*`, `--hk-key-bg`, `--accent-border`, `--editor-*`) that shadcn tooling must never rewrite; all exposed as Tailwind utilities via `@theme inline`.
- Key gotcha — the `--accent` name flips meaning: shadcn accent = monolith accent-bg tint; monolith blue accent = `--primary`. Ported CSS must rewrite `var(--accent)` → `var(--primary)` at extraction.
- The monolith's `[data-theme="dark"]` on `<html>` becomes the `.dark` class (ThemeProvider, Phase C).
- `--text-faint` was dead and is dropped; dark `--destructive` (`#f85149`) is new since the monolith never styled it.
- Layout-to-Tailwind conversion is deferred into Phase C per component.

### Phase C tranches (all done, Sep 2026 — Phase C complete)

- **Tranche 1** — six pure modules ported verbatim: `src/config.ts`, `src/hotkeys/{keyUtils,restrictedKeys}.ts`, `src/utils/{lrcParser,pasteHandlers,geniusExtractor}.ts`.
    - Vitest bridge pins behavior while Playwright still targets the monolith until Phase E: `npm run test:unit`, `tests/unit/*.test.ts`.
    - Port deltas: `ensureReTagDefault`/`mergeLrcMeta` take `defaultMeta` as a param (monolith reads the `cfg` global).
    - Quirks pinned by tests:
    - `TS_RE` is `^`-anchored
    - `normKey('Escape') = 'Esc'`, making `hkMatch`'s `'Escape'` branch unreachable
    - `findArtistAfterTitle` breaks fully on a `Producer` line
    - `ensureReTagDefault` fills empty tags as `[re:VALUE]` (no space)
    - `normalizeLrcTimestamps` only truncates exactly-3 decimals
    - `sonarjs/super-linear-regex` + `empty-string-repetition` are off for `src/**` and `tests/unit/**` (same Won't-Fix disposition as the monolith-era tests, roadmap item 5).
- **Tranche 2** — first Vue components: `src/composables/{useTheme,useEditorFont}.ts` (module-level singleton refs so Phase D's keyboard dispatch shares state), `components/{ThemeProvider,FontSelector,MenuBar}.vue`, App.vue swapped to ThemeProvider+MenuBar shell.
    - Port deltas: `.dark` class instead of `[data-theme]`; no `getElementById` value sync (Vue refs are the inputs' state); font JS default 14 (the 13.2px CSS token is the pre-JS fallback).
    - Pinned quirks: the font-size input applies `|| 14` BEFORE clamping (0/NaN → 14); ticks clamp only the side they step toward.
    - Menu-bar CSS ported verbatim as scoped styles with the Phase B token rewrites; unwired buttons render inert with `<!-- Phase D -->` comments; dynamic tooltips deferred (need the config composable).
    - A11y fix-forward: text buttons dropped mismatched aria-labels (visible text names them).
    - Component tests: `@vue/test-utils` + `happy-dom` devDeps, per-file `// @vitest-environment happy-dom` pragma (pure tests stay node).
- **Tranche 3** — main layout frame: `composables/usePanelCollapse.ts` (singleton; `lbl_panel_collapsed`, portrait auto-collapse <640px, focus transfer via registered template refs), `components/{LeftPanel,EditorArea}.vue`, App.vue = full frame incl. the Init sequence `autoCollapse → applyPanelCollapse → resize listener`.
    - Port delta: the monolith's `html { font-size: 14.3px }` root scaling is NOT ported (explicit `.app-shell` font-size; Tailwind rem scale untouched).
    - Blue-accent rules (`#progress-fill`, `#vol-slider`, checkbox accent-color, `.lrc-line.cursor` border, line-flash start) use `--primary`.
    - Shared `.fs-spinner`/`.fs-tick` moved to `style.css` unscoped (speed/seek spinners reuse them).
- **Tranche 4** — controls-panel hotkey grid: `utils/hotkeyDisplay.ts` (pure display rules) + `components/{ControlsPanel,HotkeyCell}.vue`.
    - Cells are native `<button type="button">` (S6819 fix — the monolith's `div[role=button]` replaced; manual keydown deleted).
    - Dimmed cells don't emit — monolith `!dimmed` guard; aria-labels from `HK_LABELS` with the quirk that the "(disabled in typing mode)" suffix only applies when NO `HK_LABELS` entry exists (`||` short-circuit).
    - Inert until Phase D: mode refs at defaults, cells render `DEFAULT_CFG`, no dispatch table.
    - VTU gotcha: `findAll` on a multi-root fragment component returns component-tree order, not document order — scope selectors instead of index arithmetic.
- **Tranche 5** — settings overlay → `components/SettingsDialog.vue` on the vendored `src/components/ui/dialog`.
    - `shadcn-vue add dialog` RE-ADDS the Google Fonts import to `style.css` — delete it after every add.
    - Capture inputs are readOnly with the `Escape→Esc`/blank-stays-blank display rule (unlike the panel's hkDisp em dash); all rendered from `DEFAULT_CFG`, inert until Phase D.
    - `:show-close-button="false"` (monolith parity); reka-ui replaces the monolith's hand-rolled focus trap/Escape/backdrop.
    - Inline footer reset-confirm kept; the AlertDialog swap is deferred. MenuBar emits `openSettings`; App owns `v-model:open`.
    - eslint config exempts `src/components/ui/**` from `multi-word-component-names` + `require-default-prop` (vendored conventions).
- **Tranche 6 — Phase C complete**: last JS-generated UI structure ported — `components/SecondaryField.vue` renders one `addSecondary()` column per `index` prop ("Secondary N" label/aria, 📂 import button + paren checkbox, warn-bar WITHOUT `role=alert` (monolith parity, only `#main-warn` has it), hidden per-field picker, `.sec-textarea` scoped CSS).
    - Shared `.field-col/.field-header/.field-header-label/.fh-btn/.warn-bar` rules moved EditorArea-scoped → `style.css` unscoped (multi-component rationale, same as `.fs-spinner`/`.hk-key`).
    - EditorArea renders `v-for` over a local `secCount` ref (default 0 = monolith init; the Phase D `useAppState` pool + 10-field cap replaces it).
    - App.vue gained the two app-level hidden nodes for full body-markup parity: `#file-picker` (`audio/*,.lrc,.txt`, multiple) and `#a11y-announcer` (`.sr-only` class — same conversion as the h1).
    - Scope amendment recorded in the roadmap: the "global keyboard handler last" tranche moved INTO Phase D (dispatch to ~30 actions needs the state composables; a pre-state port would be a throwaway stub).
    - 103 unit specs.

### Phase D tranches (in progress, Sep 2026)

- **Tranche 1 — Foundation** — three pure-state composables + 62 Vitest specs (165 total). No component wiring; just shapes the rest of Phase D wires.
    - `src/composables/useAppState.ts` — module-level singleton refs (same pattern as `useTheme`/`usePanelCollapse`) for the monolith State section's mutable globals: `hotkeyMode`, `offsetSeekMode`, `activeLine`, `playingLine`, `selectedLines`, `mergeDone`, `savedAudioPath`, `lastImportStem`, `suppressScrollSync`, `syncAutoAdvanced`, `geniusDetectedThisSession`, `pasteJustHappened`, `isDirty`.
    - `MAX_LINES=500` and `MAX_SECONDARIES=10` are exported consts.
    - `cfg` is a `ref<AppConfig>` loaded once at module init via `loadCfg()` (JSON-clone + `migrateHotkeys` verbatim from the monolith's loadCfg).
    - Shared via Vue `provide(CFG_KEY, cfg)` / `useCfg()` (throws if missing).
    - Single-source-of-truth port delta: `secondaryPool` is the authoritative `ref<SecondaryEntry[]>`;
            - `secondaryCols` is a `computed` over `secondaryPool.value.filter(e => e.visible)`. The monolith keeps them as two arrays with manual bookkeeping (addSecondary pushes to both, remove pops cols and leaves pool); collapsing into one source eliminates the disagreement risk documented in the code-quality skill.
    - `useCfg()` throws "called outside of `<ThemeProvider>`" if missing — a child that reads `cfg.hotkeys.X` outside a provider is a wiring bug. Tests verify the throw and the round-trip via `@vue/test-utils` mount.
    - `src/composables/usePersistedState.ts` — generic `usePersistedRef<T>(key, default, opts)` returning a `WritableComputedRef<T>` that wraps an internal `ref<T>`.
    - Reads once at init (falls back to default on parse error or `validate` failure), setter persists + validates on every write.
    - Pre-seeded wrappers for the three scalar prefs still scattered in the monolith: `useSpeed()` (`lbl_speed`, default 1, range `[0.1, 4]` — amended Tranche 4 from the original `(0, 5]` to match the monolith's runtime clamp), `useVolume()` (`lbl_vol`, default 1, range `[0,1]`), `useMuted()` (`lbl_muted`, `'0'`/`'1'` string format).
    - Vue gotcha (Sep 2026): Vue 3.5's `ref` stores `value` on the prototype (`RefImpl.prototype`), not as an own property — `Object.getOwnPropertyDescriptor(r, 'value')` returns undefined.
            - The original attempt to wrap the setter via `defineProperty` failed silently.
            - The correct pattern is a writable `computed({get, set})` delegating to an internal `ref`.
            - Codified in this composable's header comment so future Phase D tranches don't repeat the mistake.
    - `useTheme`/`useEditorFont`/`usePanelCollapse` already use inline `localStorage.getItem`/`setItem` — left alone this tranche. Consolidating them onto `usePersistedRef` is a post-cutover cleanup, not a tranche-1 goal.
    - `src/composables/useUndoRedo.ts` — snapshot-based undo/redo, ported from the monolith "Snapshot-based undo/redo" section. Shape-only this tranche: callers pass `{takeSnapshot, applySnapshot}` to `useUndoRedo(opts)`; the composable manages the stacks + the input-debounce timer; the caller owns the DOM writes. Tranche 2 wires real take/apply once `useAutosave` and the `#main-textarea` ref exist.
    - Snapshot shape: `{main, secondaries, mergeDone}` — verbatim from the monolith's takeSnapshot.
    - Single-push model preserved: `pushSnapshot` pushes post-change and clears `redoStack`; wholesale-replacement ops call `pushSnapshot` before AND after (the code-quality skill's documented rule).
    - `applySnapshot` (caller's responsibility) must clear extra secondaries beyond `snap.secondaries.length` — the documented invariant (undoing to a pre-add snapshot must not leave stale text in still-visible columns).
    - `undoStack` capped at 100 entries (the monolith's `if(undoStack.length>100) shift()`).
    - Input debounce: `scheduleInputSnapshot(debounceMs)` clears any pending timer and sets a new one. The timer is a closure variable inside the factory, NOT module-level — the monolith's `_undoDebounceTimer` is module-level `let`, which would bleed across multiple `useUndoRedo` instances in tests. Two tests pin instance independence (separate stacks AND separate timers).
    - `seed(snap)` replaces the entire stack with one snapshot, clears redo, cancels any pending input — used at init (after loadAutosave) and after wholesale imports that should not be undoable past the import point.
    - 62 new specs across the three files; full suite 165/165 green (~7s). `vue-tsc -b` type-checks the test files too (per the `tsconfig.vitest.json` setup documented below) — strict-clean.

- **Tranche 2 — Persistence + Title** — `useAutosave` + `useTitle` + `SettingsDialog.vue` wired to live `cfg`. Also added `mainText` ref to useAppState, wired useAudio/useModeSwitch to read from it, and instantiated useUndoRedo in App.vue. 22 new specs (231 total).
    - `src/composables/useTitle.ts` — ports `updateTitleFromText()`.
    - Parses `[ti:]`/`[ar:]` tags into reactive `songTitle`/`songArtist` refs.
    - Also exports `setSongTitle(s)` for useAudio.setupAudio to set the title from the audio filename stem (before updateTitleFromText potentially overwrites with `[ti:]` tag).
    - LeftPanel binds `#song-title`/`#song-artist` to these refs (was hardcoded "Unknown Artist" + useAudio's songTitleText).
    - `src/composables/useAutosave.ts` — ports `loadAutosave`/`doAutosave`/`_restoreSecondaryPool`.
    - Singleton with `initAutosave(callbacks)` — App.vue wires `getMainText`/`setMainText`/`updateTitleFromText`/`takeSnapshot`/`seedUndo` + Tranche 5/6 stubs.
    - `_restoreSecondaryPool` pushes to `secondaryPool` with `{ visible, text }` shape (no DOM elements — SecondaryField renders columns reactively).
    - `doAutosave` maps `poolTexts` from `secondaryPool.value.map(e => e.text)`.
    - `useAppState.ts` amendment: added `mainText` ref — the source of truth for the LRC text being edited.
    - EditorArea binds `<textarea :value="mainText">` (one-way — Tranche 5 adds @input). useModeSwitch reads `mainText.value` instead of the DOM textarea's `.value` property.
    - **Caveat**: until Tranche 5, user typing in the textarea doesn't update `mainText` — `doAutosave` saves the programmatic value, not user edits.
    - `SettingsDialog.vue`: swapped `DEFAULT_CFG` → `useAppState().cfg` for all live values (captureValue, intervalRows, replayChecks :checked, default meta textarea). Now reactive — settings changes re-render the dialog (Tranche 8 wires the capture/save interactions).
    - `useAudio.ts` amendment: removed `songTitleText` ref (moved to useTitle); `setupAudio` calls `setSongTitle(stem)` from useTitle. Added `setAudioCallbacks(callbacks)` — separate from `initAudio(refs)` so App.vue can wire Tranche 2/5/6 callbacks without needing the audio DOM refs (which live in LeftPanel).
    - `App.vue`: instantiates `useUndoRedo` with take/apply callbacks that read from useAppState. Wires `initAutosave` + `setAudioCallbacks` with real `doAutosave`/`updateTitleFromText` + Tranche 5/6 stubs. `onMounted` calls `loadAutosave()` before `applyMode()` (monolith Init parity).
    - Port deltas:
    - **The monolith's Init clears sessionStorage before loadAutosave** (`sessionStorage.removeItem('lbl_autosave')`), meaning autosave NEVER restores. The Vue port does NOT clear — the single-file-html-app skill says "reload on init to survive accidental refresh". If the user wants the clear behavior, add `sessionStorage.removeItem('lbl_autosave')` before `loadAutosave()` in App.vue.
    - **`_setTA(d.main)` → `setMainText(d.main)` callback** — writes `mainText` ref, not the DOM. The monolith reads/writes `getElementById('main-textarea').value` directly; Vue uses a reactive ref.
    - **`_restoreSecondaryPool` pushes to `secondaryPool`** with `{ visible, text }` shape — no DOM elements. The monolith creates DOM columns via `addSecondary()`; Vue's SecondaryField component renders columns reactively from the pool.
    - **`poolTexts` maps from `secondaryPool.value.map(e => e.text)`** — not `c.linesEl.value` (the DOM textarea is gone). **Caveat**: until Tranche 6 wires SecondaryField's textarea `@input` to update `e.text`, `doAutosave` saves whatever was loaded — user typing in secondary fields isn't captured.
    - 10 new unit specs (title) + 12 new unit specs (autosave); 231 total, all green.

- **Tranche 3 — Mode switch** — `useModeSwitch` composable + `ControlsPanel` + `EditorArea` + `App.vue` wiring. 12 new specs (10 modeSwitch + 2 controlsPanel).
    - `src/composables/useModeSwitch.ts` — ports the monolith `applyMode()` verbatim.
    - Hotkey-mode branch: show rendered list, hide textarea, rAF scrollIntoView on the pre-swap top line.
    - Typing-mode branch: hide list, show textarea, double-rAF caret placement at first non-meta non-blank line + scroll-ratio preservation + focus.
    - Exports `applyMode`, `toggleMode`, `toggleOffsetSeek`, `setHotkeyMode`, `setOffsetSeekMode`.
    - Singleton pattern: `initModeSwitch(refs, renderMainLines)` called once in `EditorArea` setup.
    - Port deltas:
    - The monolith's `applyMode()` calls `rebuildHkPanel()` at the end — in Vue, `ControlsPanel`'s computed `modeCells`/`actions` reactively re-render when `hotkeyMode`/`offsetSeekMode` change, so no explicit call. The reactivity system IS the rebuild.
    - `getTA()` = `document.getElementById('main-textarea').value` becomes a read through `useAppState().mainText.value` (amended in Tranche 2 — was `Ref<HTMLTextAreaElement | null>` in tranche 3's original ship, switched to the reactive ref when tranche 2 added `mainText`).
    - **The monolith's "Auto mode switch when secondary focused" section comment is documentation drift** — it claims `addSecondary()` attaches focus/blur handlers, but no such handlers exist in the monolith body. This composable does NOT implement an auto-switch either. If a future tranche adds one, it belongs in `SecondaryField.vue`'s `@focus`/`@blur` handlers calling `setHotkeyMode(false)`.
    - `renderMainLines()` is passed as a callback. Tranche 5 ports the real renderer; until then `EditorArea` passes a no-op stub.
    - `ControlsPanel.vue`: replaced local `hotkeyMode`/`offsetSeekMode` refs with `useAppState()`'s shared singletons; reads live `cfg` (was `DEFAULT_CFG`); mode cell `@activate` dispatches through `toggleMode`/`toggleOffsetSeek`. Action cells remain inert (Tranches 4/5/9 wire their dispatch).
    - `EditorArea.vue`: added template refs for `#main-scroll`, `#main-textarea`, `#main-lines`; calls `initModeSwitch(refs, renderMainLinesStub)` in setup.
    - `App.vue`: `onMounted` calls `applyMode()` as the last Init step (monolith line ~10217: `rebuildHkPanel(); applyMode();`).
    - Quirks pinned by tests: `applyMode` is a no-op pre-init (no crash);
    - `setHotkeyMode` is idempotent; typing-mode caret falls back to `text.length` when all lines are meta/blank;
    - `toggleOffsetSeek` doesn't call `applyMode` (orthogonal axis); happy-dom has no layout so `ta.scrollHeight = 0` makes `topLine = NaN` — tests stub `scrollHeight`; the double-rAF is mocked via a synchronous `requestAnimationFrame` override. After Tranche 2, modeSwitch tests must sync `mainText.value`.

- **Tranche 4 — Audio** — `useAudio` composable + `LeftPanel.vue` wiring + `usePersistedState` useSpeed validate fix. 30 new specs (27 audio + 3 persistedState boundary).
    - `src/composables/useAudio.ts` — ports the monolith Audio section.
    - `applyVolume` (replaced by reactive bindings + watcher), `toggleMute`, `setupAudio`, `onTimeUpdate`, `fmtTime`, `togglePlay`, `_applySeekForPlay`, `doSeek`/`doSeekBack`/`doSeekFwd`, `changeSpeed`/`onSpeedChange`, `mountProgressDrag` (returns cleanup fn), `restoreAudioDisplay` (Init parity).
    - Singleton: `initAudio(refs, callbacks)` in `LeftPanel`; `setAudioCallbacks(callbacks)` in `App.vue`.
    - `LeftPanel.vue`: all audio controls reactive — `:value`/`{{ }}`/`:style` bindings replace imperative `getElementById().value =` / `.textContent =` / `.style.display =`. Progress drag mounted in `onMounted`, cleanup in `onBeforeUnmount`. Sync-file button + seek-offset arrows stay inert (Tranche 5).
    - `usePersistedState.ts` amendment: `useSpeed` validate changed from `(0, 5]` to `[0.1, 4]` to match the monolith's runtime clamp.
    - Port deltas:
    - **Reactive DOM sync replaces `applyVolume()`**. `masterVolume`/`masterMuted` are reactive refs; template binds `:value`/`{{ }}`/`:style`; `watch([masterVolume, masterMuted])` syncs `audioEl.volume`/`muted`. `applyVolume` is gone.
    - **`_preMuteVolume` is gone**. `savedVolume` IS the pre-mute volume; `masterMuted` is the mute flag; `masterVolume = computed(() => masterMuted.value ? 0 : savedVolume.value)`. Eliminates the double-flag bug.
    - **`_volWheeling` guard is gone**. `:value` bindings don't emit `@input` on programmatic changes.
    - **`rebuildHkPanel()` call in `updatePlayBtn` is gone**. Vue reactivity re-renders `ControlsPanel`.
    - **Cross-tranche callbacks default to no-ops** — Tranche 2 provides `doAutosave`/`updateTitleFromText`; Tranche 5 provides the rest.
    - Quirks pinned by tests: `HTMLAudioElement.duration` is readonly in happy-dom — tests stub via `Object.defineProperty`; progress-bar drag test dispatches events sequentially + asserts after each;
    - `onSpeedChange` reverts on NaN;
    - `changeSpeed` clamps to `[0.1, 4]` with `Math.round(v * 100) / 100`;
    - `speedDisplay` shows `'1'` for exactly 1, else `toFixed(2)`;
    - `toggleMute` doesn't write `lbl_vol` to localStorage.

- **Tranche 5 — Sync/timestamp** — `useSync` composable + `src/utils/timestampSync.ts` (pure helpers) + `lrcParser.ts` additions (`hasLyricContent`/`hasTrailingTimestamp`/`allLyricLinesHaveTs`) + `EditorArea.vue` + `LeftPanel.vue` + `App.vue` wiring. 76 new specs (37 timestampSync + 12 lrcParser additions + 27 useSync). Full suite 307/307 green; `vue-tsc -b` clean.
    - `src/utils/timestampSync.ts` — pure helpers extracted from the monolith Sync/timestamp section. Ports the four unique-to-`tests/logic.spec.js` functions plus their internal helpers:
    - `peelLastParen` (from `_peelLastParen`), `findNextTimestampMs` (from `_findNextTimestampMs`), `assignInterpolatedTs` (from `_assignInterpolatedTs`), `batchSplitParens`.
    - Internal helpers: `findPrevTsMs`/`findNextTsMs`/`findRunEnd` (from `_findPrevTsMs`/`_findNextTsMs`/`_findRunEnd`), `findNextUnprocessedSplit`/`findNextNonMetaFromIdx`.
    - Naming convention drops the leading underscore (Phase C export convention matching `findLastMetaIdx`/`collapseBlanks`).
    - The roadmap's Phase E consolidation begins here — these Vitest specs replace the corresponding `tests/logic.spec.js` sections once the Phase E cutover is verified.
    - `src/utils/lrcParser.ts` amendments — `hasLyricContent(text)` and `hasTrailingTimestamp(lines)` and `allLyricLinesHaveTs(lines)` ported from the monolith body. PORT DELTA: take the text/lines as a parameter instead of reading `getTA()`; callers (useSync) pass `mainText.value` / `mainText.value.split('\n')`. Verbatim bodies otherwise.
    - `src/composables/useSync.ts` — ports the monolith Sync/timestamp + Render/UI sections. Owns `renderMainLines`,
    - `_handleLineClick`/`_handleLineClickPlain`,
    - `syncLine`,
    - `_insertSyncTrailing`,
    - `insertEndLine`,
    - `adjustTs`,
    - `markAsTranslation`,
    - `_advanceAfterSplit`,
    - `seekPrevLine`/`seekNextLine`,
    - `replayActiveLine`,
    - `updateActiveLineFromTime`,
    - `scrollToActive`/`scrollToPlaying`,
    - `doSyncFile`,
    - `tickSeekOffset`,
    - `setOffsetMode`,
    - `onMainInput`,
    - `onMainPaste` (typing mode),
    - `onMainLinesPaste` (hotkey mode),
    - `onSeekOffsetChange`. Singleton pattern: `initSync(refs, callbacks)` called once in `EditorArea` setup; `setSeekOffsetRef(ref)` called by `LeftPanel` to register the `#seek-offset` input ref (useAudio already owns the same ref — second consumer); `setSyncCallbacks(callbacks)` called by `App.vue` to wire the setMainText chain + audio helpers.
    - `EditorArea.vue` amendments — `initSync({ mainLines, mainTextarea, mainScroll }, {})` in setup; attaches delegated `mousedown` + `contextmenu` + `paste` handlers to `#main-lines` in `onMounted` (cleanup in `onBeforeUnmount`). Textarea gains `@input="onMainInput"` + `@paste="onMainPaste"` (the `:value="mainText"` is one-way;
    - `@input` is the two-way path because the side-effect chain should only run on user typing, not on programmatic mainText writes). New `.blank-line` CSS class (cursor: default) for blank lines.
    - `LeftPanel.vue` amendments — `setSeekOffsetRef(seekOffset)` after `initAudio`.
    - Wraps `tickSeekOffset(sign)` in `onSeekOffsetTick(sign)` (multiplies by `cfg.seek_offset_tick`); wires the `seek-arr-fwd`/`seek-arr-back` buttons to `onSeekOffsetTick(1)`/`onSeekOffsetTick(-1)` (was `1000`/`-1000` literals; the wrapper now reads `cfg.seek_offset_tick` at click time).
    - Wires `sync-file-btn` directly to `doSyncFile` (no wrapper).
    - Wires `#seek-offset` `@change` to `onSeekOffsetChange` (NaN revert + persist cfg).
    - `App.vue` amendments — defines `setMainText(t)` (the full side-effect chain: pre-pushSnapshot → mainText.value = t → renderMainLines → updateTitleFromText → doAutosave → post-pushSnapshot).
    - Wires `useSync.setSyncCallbacks` with `setMainText` + audio helpers (`getCurrentMs` → `useAudio.currentMs()`, `seekToMs` → `audioEl.currentTime = ms/1000`, `playIfNotPlaying`, `setLastPlayingLine`, `getAudioDurationMs`, `isAudioReady`).
    - Wires `useAudio.setAudioCallbacks` Tranche 5 stubs (`renderMainLines` + `updateActiveLineFromTime` + `scrollToPlaying` + `announce`).
    - Wires `useAutosave.initAutosave`'s `renderMainLines` to the real function.
    - Wires `useModeSwitch.initModeSwitch`'s `renderMainLines` callback (was a no-op stub — EditorArea passes the imported `renderMainLines`).
    - Wires the undo debounce via `setOnInputCallback(() => undoRedo.scheduleInputSnapshot(...))` so `useSync` doesn't depend on `useUndoRedo` (avoids a circular import).
    - Port deltas:
    - **State reads come from `useAppState` refs**, not module-level `let`s. `activeLine.value` instead of `activeLine = …`; `selectedLines.value.add(…)` / `.delete(…)` for the Set (kept as in-place mutation matching the monolith's Set semantics; Vue's `Set` mutation isn't reactive by default but `renderMainLines` runs after to flush the UI).
    - **`getTA()` / `_setTA()` / `setMainText()` are callbacks**.
            - The monolith inlines `_setTA(t); renderMainLines(); checkLineCounts(); updateMergeBtn(); updateTitleFromText(); doAutosave(); pushSnapshot();` everywhere — Tranche 5 collapses it into one `setMainText(t)` function owned by `App.vue` so the composable's calls are one-liners.
            - The wholesale-replacement pattern (pre + post `pushSnapshot`) is preserved per the code-quality skill + `useUndoRedo`'s documented invariant.
    - **`renderMainLines` uses innerHTML string assembly** instead of `createElement` per line.
            - Faster for large lists (the line list is rebuilt from scratch on every render — potentially hundreds of lines).
            - Click handlers come from a single delegated `mousedown` listener on `#main-lines` (uses `data-idx` attribute to recover the line index).
            - HTML-escapes text content via `_escapeHtml` to prevent XSS (the monolith's `textContent` per line was XSS-safe; the innerHTML path needs explicit escaping).
    - **`suppressAuto` is a module-level timer** (singleton semantics across all `useSync` consumers — same as the monolith's `arrowNavTimer`/`suppressAutoLine`). Exported `isAutoLineSuppressed()` for the future Tranche 9 keyboard handler's `_handleTypingModeArrowKeys` (which reads the flag to skip auto-line-follow).
    - **The `_seekOffsetRef` is shared with `useAudio`** — `LeftPanel` registers it via `setSeekOffsetRef(ref)`, `useAudio.initAudio({ seekOffset })` already owns the same ref. Both composables read the input value (no second DOM lookup).
    - **`#main-lines` paste handler is hotkey-mode-only**; `#main-textarea` paste handler is typing-mode-only. The monolith had both attached at all times with a `hotkeyMode` check at the top; the Vue port splits the responsibility cleanly via the EditorArea template's `@paste` on each element.
    - **No `rebuildHkPanel()` calls** — Vue's reactivity re-renders `ControlsPanel` when `offsetSeekMode` changes (the only state `setOffsetMode` mutates).
    - **`tickSeekOffset` / `onSeekOffsetChange` persist cfg directly** via `localStorage.setItem('lbl_cfg', JSON.stringify(cfg.value))` — the monolith calls `saveCfg()` (an inline `localStorage.setItem`). Tranche 8 (settings dialog) may consolidate this into a `setCfg` helper; for now, the direct write matches the monolith.
    - **`markAsTranslation` reads the `#main-split-check` / `#main-paren-check` checkboxes from the DOM** (via `document.getElementById`) — EditorArea owns them and they're not reactive state. A future refactor could move them to `useAppState` (Tranche 6 or 9), but for now the DOM-read path matches the monolith.
    - Quirks pinned by tests:
    - `peelLastParen` handles unbalanced parens gracefully by tracking depth — it returns the partial group, not null. Callers (`batchSplitParens`) pass already-clean text from `cleanPaste`/`cleanGenius`.
    - `findNextTimestampMs` does NOT skip meta/blank lines (differs from `findNextTsMs` which does). The monolith's `markAsTranslation` relies on this — it finds the next timestamp regardless of intervening structure.
    - `assignInterpolatedTs` mutates the array in place — callers must pass a fresh copy (`batchSplitParens` does via `.split('\n')`).
    - `batchSplitParens` with a single-line input + no next anchor leaves the peeled group with no timestamp (interpolation needs two anchors).
    - `tsToMs('[00:01.00]') = 1000` (NOT 100ms — the `.cc` field is centiseconds, multiplied by 10 to get ms). Tests initially assumed 100ms; fixed.
    - `renderMainLines` no-ops when the `mainLines` ref is unbound (pre-mount, pure-node tests).
    - `onMainInput`'s paste-just-happened check skips the undo debounce for paste operations (paste has its own snapshot push via `setMainText`).
    - Files touched this tranche: `src/utils/timestampSync.ts` (new),
    - `src/utils/lrcParser.ts` (3 additions),
    - `src/composables/useSync.ts` (new),
    - `src/components/EditorArea.vue` (initSync + handlers + .blank-line CSS),
    - `src/components/LeftPanel.vue` (setSeekOffsetRef + onSeekOffsetTick wrapper + doSyncFile binding),
    - `src/App.vue` (setMainText chain + useSync/useAudio/useAutosave/useModeSwitch callback wiring + setOnInputCallback). 307/307 specs green (231 baseline + 76 new); `vue-tsc -b` clean.

- **Tranche 6 — Merge + Secondary fields** — `useMerge` composable + `EditorArea.vue` (render from secondaryPool) + `SecondaryField.vue` (full wiring) + `MenuBar.vue` (Add/Hide/Merge buttons) + `App.vue` (initMerge + setSyncCallbacks Tranche 6 stubs become real). 32 new specs (31 merge + 1 secondaryField added). Full suite 339/339 green.
    - `src/utils/lrcParser.ts` amendments — `getMainLyricLines(lines)` and `getSecLines(text)` ported from the monolith body (line ~1678 and ~1666). PORT DELTA: take the text/lines as a parameter instead of reading `getTA()`.
    - `src/composables/useMerge.ts` (new) — ports the monolith Secondary fields + Line counts/merge sections.
    - Owns `addSecondary`/`removeSecondary` (pool management — toggle `visible` on pool entries), `checkLineCounts`/`updateMergeBtn` (warn-bar state + merge button disabled state), `mergeTranslations` (`_buildMergedResult` verbatim from the monolith), `syncScrollFrom`/`syncSecScroll` (scroll sync), `onSecInput`/`onSecPaste`/`onSecKeydown`/`onSecFileImport` (SecondaryField handlers).
    - Singleton pattern: `initMerge(callbacks)` called once in App.vue setup.
    - `useAppState.ts` amendments — `SecondaryEntry` interface augmented with `warnText`/`warnVisible`/`textareaEl` (marked optional so existing constructors with just `{ visible, text }` still type-check). Added `mainWarnText` + `mainWarnVisible` refs (the monolith imperatively wrote `#main-warn.textContent`; Vue binds reactively).
    - `SecondaryField.vue` amendments — full wiring: `:value="entry?.text"` + `@input="onSecInput"` + `@paste="onSecPaste"` + `@keydown="onSecKeydown"` + `@scroll` (syncScrollFrom) + `@vue:mounted`/`@vue:unmounted` (register textareaEl on the pool entry).
    - Paren checkbox is local `ref(true)` per component instance.
    - File picker (`#sec-file-${index}`) `@change="onFileChange"` reads the file + cleans + paren-wraps + replaces pool entry text.
    - `MenuBar.vue` amendments — Add field `@click="addSecondary"`, Hide field `:disabled="hideDisabled"` (computed: no visible secondaries) + `@click="removeSecondary"`, Merge fields `:disabled="mergeDisabled"` (computed: `mergeDone || computeMergeBtnDisabled()`) + `@click="mergeTranslations"`.
    - `EditorArea.vue` amendments — `v-for` over `secondaryPool` (not the computed `secondaryCols`) with `v-show="entry.visible"` so each SecondaryField receives its actual pool index as `:index`. `#main-warn` binds `:class="{ visible: mainWarnVisible }"` + `{{ mainWarnText }}`. `#main-scroll` `@scroll="syncScrollFrom"` for secondary-field scroll sync.
    - `App.vue` amendments — `setSyncCallbacks` wires Tranche 6 stubs to real `checkLineCounts`/`updateMergeBtn`/`syncSecScroll`. `initMerge` wires `setMainText` + `pushSnapshot` + `scheduleSecInputSnapshot` + `markGeniusSource` (no-op until Tranche 9). `applySnapshot` now clears extra secondaries beyond the snapshot's length (the documented invariant) + restores each snap entry's text.
    - Port deltas:
    - **`secondaryPool` is the single source of truth** (Tranche 1 port delta). add/remove toggle `visible` on pool entries — no separate `secondaryCols` array to keep in sync (it's a computed). The monolith's `secondaryPool.push(entry); secondaryCols.push(entry);` becomes one push.
    - **`_handleSecKeydown` stays in the Tranche 9 keyboard handler** — it dispatches through `cfg.hotkeys` and `HOTKEY_ONLY`. Tranche 6's `onSecKeydown` is a stub that stops propagation on navigation keys + space/enter/tab/escape (the always-block set). Tranche 9 replaces it with the full dispatch.
    - **`checkLineCounts` reads `secondaryPool.value` directly** (filtering visible entries). The warn-bar DOM writes become reactive `:class` + `{{ }}` bindings on SecondaryField.vue — the component reads `warnText`/`warnVisible` from the pool entry's reactive state.
    - **`updateFieldBorders` is a no-op** — the monolith's imperative DOM write (set `borderRight: none` on the last visible column) is handled by Vue's reactivity (the `v-show` toggles display + CSS `:last-child` could handle the border; for now the visual border is a non-blocking cosmetic concern).
    - **`mergeTranslations` uses `getMainLyricLines` + `getSecLines`** (pure helpers in `lrcParser.ts`) instead of inlining the filter logic. The `_buildMergedResult` builder is verbatim from the monolith.
    - **`syncScrollFrom` is a DOM imperative** (no clean reactive equivalent for scroll position). The `suppressScrollSync` guard is shared with useAppState (Tranche 1) — same singleton semantics.
    - **`onSecInput` collapses 3+ consecutive newlines to 2** (monolith parity) and writes the cleaned text back to the pool entry's `text` field.
    - **`onSecPaste` cleans + paren-wraps** (per the paren checkbox) and inserts at the caret. Genius paste triggers `markGeniusSource` (Tranche 9 owns that — stub for now).
    - **`SecondaryEntry` additions are optional** (`warnText?`/`warnVisible?`/`textareaEl?`) so existing constructors in useAutosave + tests still type-check. `addSecondary` always populates them; SecondaryField reads with `?.` for safety.
    - Quirks pinned by tests: `addSecondary` caps at `MAX_SECONDARIES=10` (alerts on 11th);
    - `removeSecondary` always hides the last visible (scanning backwards from pool end);
    - `checkLineCounts` resets `mergeDone` when no visible secondaries exist;
    - `mergeTranslations` alerts on each precondition failure (no timestamps / not all lines ts'd / count mismatch / no trailing ts);
    - `computeMergeBtnDisabled` returns false only when all preconditions met (hasTs + hasTrailing + allLyricLinesHaveTs + secondary content + count match);
    - `onSecInput` collapses `\n{3,}` → `\n\n`;
    - `onSecPaste` strips meta + headers + paren-wraps per checkbox;
    - `syncScrollFrom` no-ops when `suppressScrollSync` is true.
    - Files touched this tranche: `src/utils/lrcParser.ts` (2 additions),
    - `src/composables/useMerge.ts` (new),
    - `src/composables/useAppState.ts` (SecondaryEntry augmentation + mainWarnText/mainWarnVisible),
    - `src/components/SecondaryField.vue` (full wiring),
    - `src/components/MenuBar.vue` (Add/Hide/Merge),
    - `src/components/EditorArea.vue` (v-for over pool + `#main-warn` reactive + `#main-scroll` scroll sync),
    - `src/App.vue` (initMerge + applySnapshot secondary restore),
    - `tests/unit/secondaryField.test.ts` (updated — no longer "stays unbound"),
    - `tests/unit/merge.test.ts` (new — 31 specs). 339/339 specs green; `vue-tsc -b` clean.

- **Tranche 7 — Import/Save** — `useImport` composable + `MenuBar.vue` (Open/Save buttons) + `App.vue` (`#file-picker` ref + middle-click handler + initImport). 12 new specs. Full suite 351/351 green.
    - `src/composables/useImport.ts` (new) — ports the monolith Import section.
    - Owns `doImport` (opens `#file-picker`), `doSave` (builds filename from `[ti:]` tag or fallback, sanitises, downloads as .lrc), `onFilePickerChange` (multi-file dispatch: audio-only / lrc-only / audio+lrc pair), `onMiddleClick` (middle-click → doImport, or open secondary picker if hovering over a visible secondary textarea).
    - Singleton pattern: `initImport(callbacks)` + `setFilePickerRef(ref)` called once in App.vue setup.
    - `MenuBar.vue` amendments — Open button `@click="doImport"`, Save button `@click="doSave"`. Both `@mousedown.prevent` (focus prevention — clicking a menu button must not steal focus from the editor).
    - `App.vue` amendments — `filePicker` ref registered via `setFilePickerRef(filePicker)` so useImport can trigger the picker click + read the change event.
    - `onMounted` attaches `document.addEventListener('mousedown', onMiddleClick)` + `fp.addEventListener('change', onFilePickerChange)`.
    - `onBeforeUnmount` removes both.
    - `initImport` wires `setMainText` + `setupAudio`/`clearAudio` + `setSongTitle`/`setSongArtist` + `pushSnapshot`/`seedUndo`/`takeSnapshot` + render/checkLineCounts/updateMergeBtn/updateTitleFromText callbacks.
    - Port deltas:
    - **State reads come from `useAppState` refs** (`mainText`, `lastImportStem`, `savedAudioPath`, `secondaryPool`, `activeLine`, `playingLine`, `selectedLines`). The monolith reads module-level `let`s directly.
    - **`setupAudio` + `clearAudio` are callbacks** (App.vue wires to useAudio). useImport doesn't import useAudio (avoids a circular dependency — useAudio imports useAppState which useImport also imports).
    - **`setMainText` is a callback** (App.vue owns the side-effect chain). The monolith inlines `_setTA(text); renderMainLines(); checkLineCounts(); …`. Tranche 5 collapsed it into `setMainText(t)`.
    - **`#settings-overlay` open check is gone** — the monolith checked `settings-overlay.classList.contains('open')` before doImport to prevent middle-click import while settings is open. In Vue, the SettingsDialog is a shadcn-vue Dialog with its own focus trap — middle-click outside the dialog doesn't reach the document handler. The check is unnecessary.
    - **`resetStateForPairImport()`** — the monolith clears undoStack, redoStack, activeLine, playingLine, selectedLines, secondaryPool visibility, audioEl, playing, savedAudioPath, song-title, song-artist. Vue-side, most of these are reactive refs that reset by reassignment. The undo stack is cleared via `seedUndo` (useUndoRedo) after the lrc is read.
    - **Middle-click secondary picker** — the monolith finds the secondary entry whose `col.contains(e.target)` and opens its file picker. Vue-side, SecondaryField registers its file picker via the pool entry; useImport scans `secondaryPool.value` for a visible entry whose `textareaEl` contains the click target, then finds the picker by `#sec-file-${poolIndex + 1}` id.
    - Quirks pinned by tests: `doImport` resets `picker.value = ''` before click (so re-selecting the same file fires `change`);
    - `doSave` sanitises filename via `stem.replace(/[/\\:*?"<>|]/g, '_')`;
    - `onFilePickerChange` alerts on `MAX_LINES` exceeded; audio+lrc pair resets state before setupAudio; middle-click no-ops when `button !== 1`; middle-click over a secondary textarea opens the per-field picker.
    - Files touched this tranche: `src/composables/useImport.ts` (new), `src/components/MenuBar.vue` (Open/Save wiring), `src/App.vue` (filePicker ref + initImport + onMiddleClick/onFilePickerChange listeners), `tests/unit/import.test.ts` (new — 12 specs). 351/351 specs green; `vue-tsc -b` clean.

- **Deploy pattern introduced (Tranche 2 session)** — `scripts/prepare.sh` (sandbox-side, committed at `ai/chat.z.ai/scripts/delivery/prepare.sh`) zips `download/` into `deliver.zip` with a `deploy.sh` that maps flat hyphenated filenames to real repo paths.
    - The user's `dpl` fish abbreviation runs `ai/chat.z.ai/scripts/delivery/unpack.sh` which extracts the zip to `scratch/`, runs `deploy.sh`, waits 60s for Syncthing, then runs tests via SSH.
    - All three scripts live at `ai/chat.z.ai/scripts/delivery/` — `deploy.sh` and `prepare.sh` are agent-facing, `unpack.sh` is user-facing (run from terminal via `dpl`, not double-clicked).
    - The `deploy.sh` uses `cmp -s` to skip byte-identical files (preserves timestamps, avoids unnecessary Syncthing syncs), prints per-file results + a changed-files summary, and removes all remaining zip-extracted files at the end (scoped to the zip's own file list via `unzip -Z1 deliver.zip` — pre-existing `scratch/` files like `scratch.md` are NOT touched).
    - See `project-workflow-SKILL.md` → "Deliver zip pattern" for the full protocol.

### Sync behavior invariants

- `activeLine` / `playingLine` split (0.35.13): `activeLine` = navigation cursor (`.cursor` class), `playingLine` = audio highlight (`.active` class). Navigation moves the cursor; only sync, play, and click set the playing highlight. `updateActiveLineFromTime` places the highlight when audio reaches `lineTs`.
- `insertEndLine` three-tier logic (0.35.13):
  1. if `activeLine` is a trailing ts, update in place;
  2. if the next non-blank line after `activeLine` is a trailing ts, update in place;
  3. otherwise insert new.
- `TYPING_AVAILABLE` set (0.37.0): keeps `play_pause`, `prev_line`, `next_line` enabled in Typing mode with mode-specific displays — `play_pause` shows Space in hotkey mode, Ctrl+Space (from `play_pause_alt`) in typing mode; `prev_line` shows `Q ↑` vs `↑` only; `next_line` shows `E ↓` vs `↓` only.
- Swap-button conflict resolution (0.37.0): on conflict, Swap swaps hotkeys between the current action and the conflicting action — no blanks left over. Reset-to-default uses the same swap pattern (gives any holder of that default its own default back).
- `hasLyricContent()` guard (0.35.11): prevents `syncLine`, `insertEndLine`, `maybeAppendTrailingTs` from inserting useless `[00:00.00]` lines when no line has text content.
- All-assembly-site newline convention (0.35.11): all four LRC assembly sites (import, paste, merge, sync) use exactly one blank separator line:

  ```
  mergedMeta.trimEnd() + '\n\n' + lyrics
  ```

## Bug patterns

Fix once, audit after every refactor.

- Helper extraction can delete callees: `_peelLastParen` was deleted during Stage C refactoring (0.35.15) and broke `batchSplitParens` at runtime. After extracting any helper, audit all pre-existing callees in the refactored section. Codified in the code-quality skill.
- String assembly with conditional separator: `tsPrefix + ' ' + content` with `.replace(/^ /,'')` strips the space from `[mm:ss.cc]` text when content is non-empty but has no paren groups. Fix:

  ```
  tsPrefix + (tsPrefix && content ? ' ' + content : content)
  ```

  Codified in the code-quality skill.
- Dynamic config reads vs hardcoded constants: reading `DEFAULT_META` (constant) instead of `cfg.default_meta` (live value) means UI changes have no effect. Codified in the code-quality skill.
- Braceless-if ambiguity (S2681): a single-line `if(x)y;` makes the following statement look conditional. Always use braces. Codified in the code-quality skill.
- `META_RE` false positive on Genius headers: `/^\[[a-zA-Z]+:/` matches both LRC tags (`[ti:..]`) and capitalized Genius headers (`[Intro: All]`, `[Chorus:..]`). Fix is local to `_findGeniusLyricStart` using `/^\[[A-Z]/.test()` — do NOT change `META_RE` globally; 30+ other usages depend on it.
- State variable disagreement: when two variables track the same concept (e.g. `masterVolume` + `masterMuted`), they can disagree, causing subtle bugs. Pick one as authoritative; derive the rest. Codified in the code-quality skill.
- Useless `|| {}` after spread (S7744, Sep 2026): spreading `undefined` is a no-op (`{...undefined}` === `{}`), so `{ ...a, ...(b || {}) }` has dead `|| {}` fallback. Drop it: `{ ...a, ...b }`. Same for `[...a, ...(b || [])]` → `[...a, ...b]`. Bit the build-1 useAppState patch — added `|| {}` defensively, SonarCloud flagged it next scan.
- deploy.sh cleanup swept pre-existing scratch/ files (Sep 2026, Tranche 6+7 session): the `find . -maxdepth 1 -type f ! -name deploy.sh ! -name deliver.zip` cleanup loop deleted the user's `scratch.md` notes + `1789431616513564438.zip` upload because it matched ALL files in scratch/, not just the ones extracted from deliver.zip.
    - Fix: use `unzip -Z1 deliver.zip` to get the zip's own file list and only clean up those files — pre-existing files are untouched.
    - Same bug class the sonar-issue-exporter `deploy.sh` fixed (see deploy-sie.sh's "scoped to zip-extracted files" section).
    - Codified: the per-session `deploy.sh` template's cleanup section MUST use `unzip -Z1` or a `.deliver-files.list` manifest, never `find . -maxdepth 1 -type f`.

## Critical constraints

Do not violate.

- `MAX_LINES=500`. Import and paste handlers reject content over the limit with `alert`. `addSecondary()` enforces a 10-field cap.
- Underscore prefix on auto-setup fixtures: renaming `workaroundPaste` → `_workaroundPaste` silences tsserver TS6133.
- SonarQube S3776 CC threshold = 15 per function. Helper extraction and dispatch tables are the durable mitigations. See the code-quality skill.
- Undo/redo single-push model (post-change only), except for wholesale content replacement (import, merge, paste) which needs pre + post. See the code-quality skill.
- `applySnapshot` must clear extra secondaries beyond the snapshot's `secondaries.length`, or undoing to a pre-add snapshot leaves stale content in still-visible textareas.
- `beforeunload` must check all secondary textareas, not just the main one, or secondary work is lost without warning.
- All four LRC assembly sites (import, paste, merge, sync) use exactly one blank separator line:

  ```
  mergedMeta.trimEnd() + '\n\n' + lyrics
  ```

  Inconsistent separator counts cause blank-line mismatches between main and secondary fields.

## CI & repo automation

- `sync-staging.yml` (Sep 2026) auto-merges main into staging: fires on `workflow_run` completion of the three CI workflows (Playwright Tests, CodeQL Advanced, SonarCloud analysis), gates on all three succeeding for the same `head_sha` (plus a compare-API check that the SHA is on main), then merges that verified SHA into staging.
    - Safe by construction: a `workflow_run` workflow only ever fires from its default-branch copy (staging's copy is inert), the bot's `GITHUB_TOKEN` push to staging triggers no CI (no recursion), and staging runs never influence the gate.
- Gate semantics (reworked after its first 6 runs all false-failed): only KNOWN failure conclusions (`failure`, `cancelled`, `timed_out`, `startup_failure`, `stale`, `action_required`) go red; anything unsettled or unreadable — `in_progress`, missing, empty string — defers green (`ready=false`), relying on the completing workflow's own completion event to re-trigger.
    - `workflow_run` fires once per completing CI workflow, so each push produces up to 3 sync runs (defer, defer, merge) — that pattern is normal, not failures.
- Bug pattern behind those false reds: `jq -r --argjson data "$x" '…'` without `-n` reads STDIN — in a GitHub Actions run step stdin is empty, so the filter never executes: exit 0, zero output, silent empty string.
    - Any jq invocation whose input comes from `--argjson`/`--arg` must use `-n`.
    - Shellcheck and YAML parsing did not catch it; validate workflow run steps by executing them (against live or fixture data), not just linting them.
- `sonarcloud.yml` fails the build on a red quality gate (`sonarqube-quality-gate-action`, pinned v1.2.1, added Sep 2026).
    - Two separate "Sonar" indicators exist: the Actions workflow conclusion (immutable, gate-blocking since this change) and the SonarCloud GitHub App's commit check "SonarCloud Code Analysis" (retroactive — recomputed when issues are resolved, no new scan needed; the sync gate does not read it).
    - After fixing/marking issues, re-run the SonarCloud workflow (`workflow_dispatch` is enabled) or push again to sync staging.
- `sie` (sonar-issue-exporter, https://github.com/amokprime/sonar-issue-exporter) is the consolidated local CLI for fetching SonarCloud issues AND CodeQL code-scanning alerts as a single Markdown report.
    - Replaces the legacy `sonar-export` (per-issue JSON folders + shared `why.md`/`how.md` per rule) and the per-issue Python `export_sonar_issue.py`.
    - Public-project issue enumeration works without `SONAR_API_KEY` (only Why/How rationale is gated); CodeQL alerts require `gh auth login` locally.
    - The `sie -c` / `--clean` flag drops the licensed Sonar Why/How sections before committing to a GPL-3 repo.
    - Default output `issues.md`, auto-increments `issues1.md`, `issues2.md`, … — save to `archive/semantic/<version>/`.
- The sandbox cannot authenticate with GitHub or SonarCloud, so it can't fetch rule Why/How, CodeQL alerts, or push back to a build loop.
    - The `sie` Markdown report IS the canonical input the user uploads after each push.
    - The sandbox SonarCloud JSON API is a fallback for: (a) `sie` failed on the user's end, (b) quick staleness cross-check on a specific issue key, (c) the user asked about Sonar findings but hasn't run `sie` yet.
- The gate's workflow-name list must track the CI workflows' `name:` fields — renaming one makes the gate defer forever (staging silently stops syncing) until the list is updated.

## SonarQube / CodeQL dispositions (non-app-code)

- Sonar gate "Coverage on New Code" (PR #11, Sep 2026): the 80%-on-new-code condition had no teeth while new code was only `.yml`/`.sh` (not coverable languages) — the modular scaffold's `src/` was the first countable JS/TS and went 0.0%, failing the gate.
    - Fixed with `-Dsonar.coverage.exclusions=src/**,vite.config.mts` in `sonarcloud.yml` (coverage measurement only — issue analysis on `src/` continues).
    - REVISIT when a coverage pipeline exists (vitest or Playwright v8 coverage, realistically Phase E or later): narrow the exclusions then; the project has never had line-coverage measurement.
- `githubactions:S8264/S8233/S6505` ×4 (deploy.yml, PR #11, Sep 2026): all fixed — workflow-level permissions split to job level (build: `contents: read`; deploy: `pages: write` + `id-token: write`), `npm ci --ignore-scripts` with the Vite build verified to work without lifecycle scripts locally.
    - Unverified until first real run: whether `configure-pages`/`upload-pages-artifact` in the build job need more than `contents: read`.
- `S7682` explicit-return ×5 (`ai/chat.z.ai/scripts/*.sh`, 0.37.2 export, Sep 2026): Won't Fix — `.base.sh` runs `set -e` then calls the snippet; the function's exit status is intentionally its last command's (repomix), and an explicit `return 0` would mask a repomix failure and zip/copy missing output.
- `githubactions:S7631` fork-code (sync-staging.yml, 0.37.2 export): hardened with a compare-API on-main check (`repos/…/compare/main...$HEAD_SHA` must be `behind|identical`) before merging.
    - Residual flag is Won't Fix (the workflow never checks out or executes the event SHA, only merges commits verified to be on main).
    - Marked False Positive in the SonarCloud UI — a resolved security issue plus this marking flipped the retroactively-computed quality gate green.
- `css:S4666` ×2 (`src/style.css:146/:159`, PR #11, Sep 2026): "Duplicate selector `:root`/`.dark`" — intentional.
    - The shadcn-generated `:root`/`.dark` token blocks (L68/L104) are deliberately separate from the LineByLine app-token blocks so a future `shadcn-vue` regeneration rewrites only its own tokens, never the app's.
    - Recommend marking False Positive; merging the blocks would remove the protection.
    - Non-blocking (maintainability code smell).
- Verbatim monolith port Accepts (PR #11, Sep 2026, 18 issues): `typescript:S8786` ×7, `typescript:S6594` ×7, `typescript:S6557` ×1, `typescript:S7755` ×2, `typescript:S4138` ×1 across `src/utils/lrcParser.ts`, `src/utils/pasteHandlers.ts`, `src/utils/geniusExtractor.ts`. Accept per verbatim-port rationale — modernization belongs to the post-Phase-E cutover pass (roadmap item 5).
    - `S8786` = same Won't-Fix family as the eslint-off `sonarjs/super-linear-regex` (inputs bounded by `MAX_LINES=500`).
    - `S6594` (`.match` → `.exec`) is safe for non-global regexes but diverges from verbatim bodies.
    - `S6606` (×7 in `src/config.ts`) is NOT equivalent — it coalesces `null` too, while `ensureDefaultHotkeys` checks `=== undefined` explicitly; converting would change semantics on corrupted-config edge cases.
    - `S4138` in `geniusExtractor.ts:122` — verbatim port, index used; Accept.
- `web:S7927` (`src/components/MenuBar.vue:118`, PR #11): False Positive — icon-only button whose aria-label ("Toggle theme") can't contain an emoji glyph; the emoji siblings go unflagged only because their content is a static character. `aria-label` is the correct accessible name for icon-only buttons (WCAG / aria-accessibility skill Rule 8).
- `web:S6819` (`src/components/LeftPanel.vue`, PR #11): Accept — custom seek bar with mousedown+drag interaction (Phase D `useAudio` implements it); the aria-accessibility skill Rule 1 documented exception. The real volume slider already IS a native `input[type=range]`. Verbatim monolith port. Re-flagged at `:82` then `:149`/`:151` after the tranche-4 audio wiring shifted the line — same finding.
- `web:S6819` (`src/components/HotkeyCell.vue:33`, PR #11): Fixed (Sep 2026) — a native `<button type=button>` fully covers the cell's interaction (click/Enter/Space), so the ARIA emulation was replaced with a real button (manual keydown handler deleted; `font-family: inherit` added for the button UA reset). A11y upgrade over the monolith.
- `typescript:S7721` ×2 (`src/composables/usePanelCollapse.ts:30/:33`, PR #11): Fixed (Sep 2026) — `setExpandRef`/`setCollapseRef` only touch module-level refs, moved to module scope.
- `web:InputWithoutLabelCheck` (`src/components/SecondaryField.vue:43`, PR #11): Fixed (Sep 2026) — `id="sec-file-${index}"` + `aria-label` "Secondary N lyrics file", mirroring the App-level `#file-picker` pattern. Was the sole failing gate condition (BUG-type, moved `new_reliability_rating` to C — code smells alone never fail the reliability condition).
- `shelldre:S7688` ×9 (`ai/chat.z.ai/scripts/delivery/{deploy,prepare,unpack}.sh`, PR #11): Fixed (Sep 2026) — `[` → `[[` (bash's safer construct: no word splitting, no pathname expansion, supports `&&`/`||` inside). All 3 scripts pass `bash -n` syntax check.
- `typescript:S8786` ×2 in `src/composables/useTitle.ts:32/34` (PR #11, post-build-1): Accept — my build-1 regex change (`.+` → `[^\]]+`) did NOT satisfy SonarCloud's S8786 rule.
    - The rule flags ANY regex with `+` quantifier regardless of actual backtracking risk.
    - Rationale: input bounded by `MAX_LINES=500`; simple tag-matcher with single character class + `+` quantifier; no nested quantifiers; linear backtracking.
    - Same rationale as the verbatim-port S8786 Accepts.
- PR #11 SonarCloud remediation (Sep 2026, multi-turn): 50 → 29 OPEN issues. 21 fixed via 6 source patches (useTitle: S6594×2 + S8786×2 attempted + S6582×2; useAppState: S6661 + S7784 + S7744; useAutosave: S4138 + S3776 + S6582; useModeSwitch: S4138; useAudio: S6582;
    - LeftPanel.vue: S3735) + 9 delivery-script `[` → `[[` fixes. Remaining 29 are all Accept/FP per the entries above (no blocking issues). The 14 source patches are in `src/composables/{useTitle,useAppState,useAutosave,useModeSwitch,useAudio}.ts` and `src/components/LeftPanel.vue`; 231/231 Vitest specs green post-patch;
    - `vue-tsc -b` clean.
- Tranche 5/6/7 session SonarCloud remediation (Sep 15, 2026): 43 → 29 OPEN issues (14 fixed, 29 Accept/FP). 14 fixed via 5 source patches:
    - **S3776** ×3 (`useSync.ts` L269/L549/L914, CC=23/39/31 → all <15 post-fix): extracted `_shouldSkipLine`/`_buildLineClasses`/`_buildLineInner` from `renderMainLines`; extracted `_markAsTranslationSplit`/`_markAsTranslationNormal` from `markAsTranslation`; extracted `_onMainLinesPasteNonGenius`/`_onMainLinesPasteGenius` from `onMainLinesPaste`. All 3 functions now under CC 15.
    - **S3735** ×1 (`useMerge.ts` L198 `void cfg`): removed — the `void cfg` was a no-op to avoid TS6133 unused-var; removed the `cfg` destructure from `checkLineCounts` instead.
    - **S6557** ×1 (`geniusExtractor.ts` L35): `/Lyrics$/.test(l.trim())` → `l.trim().endsWith('Lyrics')`.
    - **S6582** ×1 (`useImport.ts` L287): `entry.textareaEl && entry.textareaEl.contains(...)` → `entry.textareaEl?.contains(...)`.
    - **S7781** ×5 (`useSync.ts` L365-369 `_escapeHtml`): `.replace(/&/g, '&amp;')` etc. → `.replaceAll('&', '&amp;')` etc. (fixed-string literals, no regex quantifiers).
    - Remaining 29: **S8786** ×11 (verbatim-port regexes bounded by `MAX_LINES=500` — Accept);
    - **S6594** ×8 (`.match` → `.exec` — verbatim-port Accept);
    - **S6606** ×7 (`??=` in `config.ts` `ensureDefaultHotkeys` — NOT equivalent, coalesces `null` too while the code checks `=== undefined` explicitly — Accept);
    - **S7755** ×3 (`.at()` — verbatim-port Accept);
    - **S4138** ×1 (`geniusExtractor.ts` `extractGeniusAlbum` uses `head[i+1]` — Won't Fix, index used for lookahead);
    - **S6819** ×1 (`LeftPanel.vue` `#progress-wrap` slider role — Won't Fix, custom mousedown+drag+wheel interaction);
    - **S7927** ×1 (`MenuBar.vue` theme toggle — False Positive, icon-only button with `aria-label`). 351/351 Vitest specs green post-patch;
    - `vue-tsc -b` clean.

## Delivery script hardening (Sep 2026)

- `deploy.sh` cleanup loop replaced `find . -maxdepth 1 -type f ! -name deploy.sh ! -name deliver.zip` with an explicit `known_zip_files=()` array (preserves pre-existing `scratch/` files like `scratch.md`).
- `unpack.sh` gained `trap cleanup INT TERM` (NOT `EXIT` — set -e failures leave files for debugging per existing documented behavior; next run's `unzip -oqq` overwrites anyway).
- Syncthing `sleep 60` + Playwright `ssh Server tst` blocks in `unpack.sh` are commented out for src/** patches — Playwright targets `docs/index.html` until Phase E (per "Project invariants"), so running it on src/** patches is ~8.3 minutes wasted per deploy.
    - Re-enable both post-Phase E (replace `sleep 60` with Syncthing REST API polling: trigger rescan via `curl -X POST -H "X-API-Key: $KEY" "http://127.0.0.1:8384/rest/db/scan?folder=$LBL_ID"`, poll `/rest/db/completion?folder=$LBL_ID&device=$SERVER_ID` until `.completion == 100`).
- The prior "unpack.sh hung" report was actually 8.3 minutes of Playwright tests, not a real hang — the user's Ctrl+C during the (then-commented-out) test line was actually during the `sleep 60` Syncthing wait. Trap kept as defensive.
- A `known_dupes=()` cleanup section in each per-session `deploy.sh` auto-removes legacy misdeploy folders from the build-2 era.
    - The build-2 root cause was an `issue_folder_name.py` "conservative extension" that stripped bash-unsafe chars (single quote, backtick, dollar, parens, double quote — regex `r'[<>:"/\|?*\'$()]'`) from folder names, breaking the match with `export_sonar_issue.py`'s convention (which preserves these chars — its regex is just `r'[<>:"/\|?*]'`).
    - Build-3 reverted the helper + added `shlex.quote()` for bash safety.
    - The `KNOWN_DUPES` list is persistent — append future misdeploys to `generate_deploy_v2.py` so cleanup runs every deploy.

## SonarCloud API (sandbox fallback, verified Sep 2026)

Use ONLY when `sie` is unavailable or for a quick staleness cross-check on a specific issue key. The sandbox can call the public JSON API directly via Python `urllib` — no auth for issue enumeration, facets, rule filtering, pagination (max `ps=500`). Auth required for `api/rules/show` (rule `why`/`how`), `api/rules/list`, single-issue lookup by key (`?issues=<KEY>&componentKeys=<KEY>` returns 0 results without auth — the unauthenticated path is `?componentKeys=<KEY>&pullRequest=N&rules=<rule>` instead), and `api/sources/show` (source snippets — auth-gated even for public projects, so source for in-sandbox patching must come from the Build Repomix). `api/components/tree?component=<KEY>&pullRequest=N` works unauthenticated and returns the file list for a PR (useful for confirming which files exist on a PR vs main). CodeQL code-scanning alerts are NOT available via the sandbox API at all — only `sie` (with the user's `gh auth login`) can fetch them. See `sonarqube-workflow-SKILL.md` Step 1 for the full protocol. Closed issues have `line: null` in the API response (and show `Status: CLOSED` in the `sie` report).

## Vitest unit suite in-sandbox

The Build Repomix bundles `src/**` + `tests/unit/**` so the agent can run `npm install && npm run test:unit` (~103 specs, ~7s) after patching `src/` modules. Covers pure-logic regressions only — not DOM interaction or Playwright-level concerns. The full Playwright suite still runs locally via `tst`.

Required files for the bundle: `package.json`, `package-lock.json` (if not gitignored), `vite.config.mts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json`, `src/**`, `tests/unit/**`, `tests/helpers/index.js`, `tests/helpers/package.json`. Gotcha: the `.gitignore` `*genius*` pattern excludes `src/utils/geniusExtractor.ts` from Repomix — the user must add a negation pattern or include it explicitly.

## Project invariants

- All app code lives at `docs/index.html` until the item-3 modular cutover (Phase E); `src/` is scaffold-only until Phase C. No external font dependencies, no Python/PyQt port. The Python port was abandoned in 0.34.5; web is the only forward path.
- The app version is encoded in `<title>`, not in the filename. Patching script alone is incomplete — the version bump must land in both title and the script body.
- The app is LRC-focused, but has Genius paste. Genius scraping is delegated to a browser extension (cross-origin blocks prevent in-app fetching); in-app extraction is structural parsing of pasted text.
- No external fonts. Google Fonts was removed in 0.34.5. `system-ui, sans-serif` resolves differently across OSes and is the source of font-fragile screenshot tests.

## TypeScript / tooling config

- `tsconfig.vitest.json` (Sep 2026): all `@/*` alias imports live in `tests/unit/*.test.ts` (src uses relative imports), but `tsconfig.app.json` includes only `src/**` — the test files belonged to no TS project, so Zed's language server type-checked them as an inferred project without the paths alias or `vite/client` types → ts2307 "Cannot find module '@/components/…'".
    - Fixed by adding `tsconfig.vitest.json` (extends `tsconfig.app.json`, `include: tests/unit/**/*.ts`) referenced from the root `tsconfig.json` — same solution pattern create-vue ships.
    - Builds via `vue-tsc -b` now type-check the unit tests too (they are strict-clean).
- `tsconfig.node.json` is referenced from root `tsconfig.json` but is for Vite's own config file (`vite.config.mts`). Must be included in the Build Repomix or Vitest fails with "Failed to load tsconfig 'tsconfig.node.json'".
