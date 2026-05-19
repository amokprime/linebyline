0.36.2

- SonarQube S3776 (CC 16→14): Extracted `_isFocusedUIElement(ae)` and `_isPrevNextReplay(ks,hk)` helpers from global keydown. `_insertSyncTrailing(lines,ms)` extracted from `insertEndLine` (CC 29→11)
- ↩ checkbox restored: Reverted 0.36.1's always-on `batchSplitParens` back to checkbox-gated. Default unchecked (matching 0.36.0)
- Genius paste metadata: `markGeniusSource` now prepends "Genius" to existing `[re:]` value instead of mechanically replacing it with "Genius, LineByLine". `ensureReTagDefault` then appends the configured default
- Now Playing focus stealing: `mousedown` `preventDefault` on `<button>` clicks inside `#audio-box`/`#controls-box` prevents mouse-initiated focus without breaking keyboard Tab
- Reserved hotkey focus loss: Restriction handler in capture input keeps focus instead of calling `revertAndExit()` (which blurs and causes Tab to snap to search field)
- Ctrl+\ in search field: Added `reset_defaults` hotkey check in `_handleSettingsSearchKeydown` before `e.stopPropagation()`
- SECTIONS comment removed from code: Authoritative section index now maintained in `linebyline-section-index-SKILL.md` via grep protocol
- Auto-play on seek: `doSeek()` starts playback if paused; seekbar `mouseup` after drag starts playback
- T after W trailing-ts: `_syncAutoAdvanced` state variable tracks auto-advance from `syncLine()`. `insertEndLine()` uses it to insert trailing timestamp for the previous line, then advances `activeLine` to next content line. `suppressAuto()` resets on manual navigation
- S2681 braceless-if: Added braces to `if(audioEl)audioEl.playbackRate=1;` — the following `localStorage.setItem` was unconditional by design but ambiguous
- Checkbox order fix: `( )` and `↩` labels swapped back to 0.36.0 order (0.36.1 had silently reversed them)
- Firefox Playwright download bug: `browserContext.close: Protocol error` during context teardown after download events. Firefox path in `meta-save-update` now overrides `window.doSave` via `page.evaluate()` to capture save data without triggering download

---

0.36.1

- SonarQube S6819 (6 instances → semantic HTML): `<section>` for `#audio-box`, `<fieldset>` for `#hk-grid` (CSS resets: `border:none;margin:0;padding:0;min-inline-size:0`), `<ul>` for `#main-lines` (`list-style:none;margin:0`), `<output>` for `#settings-conflict`, `<footer>` for `#settings-footer`. `role="slider"` on `#progress-wrap` Won't Fix — custom mousedown/drag/wheel interaction can't use `<input type="range">`
- SonarQube S7927 (3 instances): `#btn-add-sec` aria-label → "Add field"; `#btn-remove-sec` → "Hide field"; `#merge-btn` already matched
- SonarQube S6825: Removed `aria-hidden="true"` from `#file-picker` — `display:none` already removes from a11y tree
- Undo/redo single-push model: Replaced double-push (`pushSnapshot(); mutate; pushSnapshot()`) with single post-change push (`mutate; pushSnapshot()`). Pre-change state is already on the stack from previous operation. Applied to `setMainText`, `mergeTranslations`, both paste paths, LRC-only import
- Secondary import undo fix: `applySnapshot` now clears secondary textareas beyond snapshot's `secondaries.length` — `for(let i=snap.secondaries.length;i<secondaryCols.length;i++){secondaryCols[i].linesEl.value='';}`. Root cause: adding a field didn't push a snapshot, so undoing to pre-add snapshot had empty `secondaries` array and forEach skipped still-visible textarea
- Unsaved work warning: `beforeunload` now also checks `secondaryCols.some(c=>c.linesEl.value.trim()!=='')`
- Speed field persistence: `currentSpeed` loaded from `localStorage.getItem('lbl_speed')` on init; saved in `changeSpeed()` and speed-val change handler
- Reset defaults resets speed: `_doResetDefaults()` resets `currentSpeed=1`, `#speed-val` display, `audioEl.playbackRate`, persists to localStorage
- Left panel ARIA regions: Now Playing in `<section id="audio-box">`, Controls in `<section id="controls-box" aria-labelledby="controls-label">`
- beforeunload dialog focus: Known limitation — browser-native dialog button focus is not controllable from JS

---

0.36.0

- axe fixes: `role="banner"` removed from field headers (banner landmark must be top-level, not nested in `<main>`). `--text-faint` (#9198a1, 2.73:1 contrast) on `.ts`/`.end-ts` changed to `--text-muted` (#656d76) — below 4.5:1 AA minimum
- Playwright `toMatchAriaSnapshot` strategy: replaced most `innerText().toMatchSnapshot()` with `toMatchAriaSnapshot()` on `getByLabel("Lyric lines")` or `#editor-area`. Preserves blank lines, captures ARIA structure, no CSS color fragility. Three limitations: (1) no metadata lines in snapshot (hidden in hotkey mode so aria tree skips); (2) timestamps regex-obfuscated; (3) secondary textarea content is single string (newlines lost). Where exact content matters, `inputValue().toMatchSnapshot()` used alongside
- `#editor-area` aria scope: Single `toMatchAriaSnapshot()` assertion captures secondary fields, main field lines, checkboxes, inline warnings, and import buttons — replaces multiple `innerText`+`inputValue`+visibility checks
- Snapshot naming: Multiple tests sharing same expected content use `name:` option to share a yml file (e.g. `merge-line-mismatch` and `merge-block-reload` both use `synced-english.yml`)
- Settings window Playwright: `#settings-body.toMatchAriaSnapshot()` replaces fragile CSS override hack + `toHaveScreenshot()`

---

0.35.19

- SonarQube pass: `_handleSecKeydown` extracted to outer scope, braceless-if fixes. CC reductions deferred to next major
- `structuredClone` replaced `JSON.parse(JSON.stringify)`, `for-of` selective, `replaceAll`, zero-fraction cleanup

---

0.35.18

- SonarQube easy-pass: `Number.parseFloat/parseInt/isNaN`, `.remove()` over `removeChild()`, object spread over `Object.assign` (mutating `Object.assign(c,d)` left as-is — spread breaks reference chain)

---

0.35.17

- SonarQube medium-sev pass. Nested ternary flattening: extracted `_normKey(k)` and `_hkDisp(v)` helpers. S2681 braceless-if (14 flags) Won't Fix, `<dialog>` deferred

---

0.35.16

- CC reduction via extraction: `_handleSettingsSearchKeydown`, `_handleTextareaEnterTrim`, `_handleTextareaParenBracket`, `_handleSecKeydown`, `_buildMergedResult`, `_handleSettingsKeys`, `_handleGlobalHotkeys`, `_handleHotkeyModeKeys`
- Global keydown decomposed to 15-line dispatcher

---

0.35.15

- Accidental function deletion risk: `_peelLastParen` deleted during Stage C refactoring, breaking `batchSplitParens` and `markAsTranslation` — audit all pre-existing callees after extracting helpers
- String assembly bug: `tsPrefix + ' ' + content` with `.replace(/^ /,'')` stripped space from `[mm:ss.cc] text` when content non-empty but no paren groups. Fix: conditional `tsPrefix+(tsPrefix&&content?' '+content:content)`

---

0.35.14

- SonarQube staged fix plan: A (`.dataset`+nesting) → B (easy CC wins) → C (medium CC) → D (hard CC, global keydown at 138)
- Line click always seeking with offset: `_handleLineClick` unconditionally applied offset; fixed to check `cfg.replay_play_other`

---

0.35.13

- activeLine/playingLine split: `activeLine` = navigation cursor (`.cursor` class), `playingLine` = audio highlight (`.active` class). `playingLine` only set immediately on sync/play/click; all other navigation lets `updateActiveLineFromTime` place highlight when audio reaches `lineTs`
- insertEndLine three-tier logic: (1) activeLine is trailing ts → update in place (2) next non-blank line after activeLine is trailing ts → update in place (3) neither → insert new
- `suppressAutoLine` removed from `updateActiveLineFromTime` — was incorrectly blocking `playingLine` after navigation

---

0.35.12

- `batchSplitParens` second-pass interpolation: un-timestamped lines after split get interpolated timestamps (same offset-10ms logic as `markAsTranslation`)
- Seek offset persistence: `doSyncFile` never resets seek offset — reverted snapshot-based approach (snapshot was taken after reset, capturing wrong value)
- Helper extraction: `suppressAuto()`, `collapseBlanks()`, `findLastMetaIdx()`, `lrcHasTi()`, `doSeek(dir)`

---

0.35.11

- Paste overwrite vs append: Hotkey mode paste always overwrites; Genius paste still appends (intentional edge case). `mergeLrcMeta` handles metadata; non-meta path preserves current meta and replaces lyric body
- `hasLyricContent()` guard: prevents `syncLine`/`insertEndLine`/`maybeAppendTrailingTs` from inserting useless `[00:00.00]` when no line has text content
- Newline convention: all four assembly sites use `mergedMeta.trimEnd() + '\n\n' + lyrics` for exactly one blank separator

---

0.35.10

- Undo/redo fix in `setMainText`: was pushing only pre-mutation snapshot so redo always restored pre-state. Added `pushSnapshot()` at end of `setMainText`
- `_volWheeling` flag: wheel sets true, clears on next animation frame; input handler bails if flag set — prevents synthetic input event from clobbering volume during scroll

---

0.35.9–0.35.7

- ↩ checkbox default changed to checked (later reverted in 0.36.2)
- Settings focus trap: exclude `.hk-clear`, `.hk-reset`, `.hk-replace`, `#settings-close` from focusable list — transient elements shouldn't be Tab stops
- `Ctrl+\` reset_defaults: works when Settings closed (opens then confirms) or open (confirms directly). Inline confirm replaces native `confirm()`
- Keyboard accessibility: `e.repeat` guard, `Ctrl+D` added to RESTRICTED_ALL, seek defaults changed to `Ctrl+9`/`Ctrl+0`
- Enter-syncs-toolbar fix: suppress global Enter→syncLine when a focusable non-lyric element has focus

---

0.35.4

- Dynamic config reads: `ensureReTagDefault` was reading `DEFAULT_META` (hardcoded constant) instead of `cfg.default_meta` (live value)

---

0.35.3

- `batchSplitParens` must strip timestamp prefix before peeling: old guard `if(tsToMs(l)!==null)` skipped all timestamped lines. Fix: strip, peel, re-prepend
- `normalizeLrcTimestamps`: ms-precision `[00:00.000]` didn't match `TS_RE`, causing `isHeader` to strip them — truncate third decimal early

---

0.35.0

- ↩ split-mode checkbox: `_peelLastParen` + `batchSplitParens` for splitting inline translations to separate lines
- Merge fields requires `hasTs` + `hasTrailingTimestamp()`: not just line count parity. Line-count mismatch guard added to `mergeTranslations`

---

0.34.10

- Trailing timestamp timing: moved `maybeAppendTrailingTs()` from paste/import handlers to `syncLine()` — fires only after first real sync, not when lyrics are first added without timestamps
- `allLyricLinesHaveTs()` helper: gates `updateMergeBtn` and `mergeTranslations` early-return

---

0.34.9

- `updateMergeBtn` rewrite: checks `hasTs` + `hasTrailingTimestamp()` before enabling
- Left panel collapse: `height:100dvh` for mobile browser chrome; auto-collapses when viewport < 640px; state persists to `localStorage`

---

0.34.8

- Panel collapse with `localStorage` persistence: `applyPanelCollapse(transferFocus)` sets `panel.inert=true/false`

---

0.34.7

- ArrowLeft/ArrowRight hardcoded seek in Hotkey mode only: two checks after `if(!hotkeyMode)return` guard, before remappable `actions` dispatch. Not shown in Settings
- `maybeAppendTrailingTs` guard removal: now fires whenever audio duration known and no trailing ts

---

0.34.6

- Help window removal: `openHelp`→`window.open`, `_topmostOverlay`/`_bringToFront`/`_overlayZ` removed. Only Settings remains as overlay
- Skip empty lines: seek/sync/advance all skip `trim()===''` in Hotkey mode

---

0.34.5

- Python port abandoned, reverted to web: all future work is single-file HTML app
- `stemOf` preserves filename casing: removed `.toLowerCase()` so `[ti:]` and save filename respect original case
- Auto Strip Settings reverted: `cleanPaste` hardcoded to strip sections on paste, never strip metadata
- Google Fonts removed: no external font dependencies. `--font-mono` → `ui-monospace,monospace`

---

0.34.4

- Save filename uses only `[ti:]`: removed `ar - ti` branch. External labels ("ms") always separate `<span>` elements

---

0.34.2–0.34.3

- Media buttons: pure geometric SVG primitives (polygon/rect), no copyright concern
- `play_pause_alt` (Ctrl+Space): remappable hotkey added to Settings > Playback. Works outside hotkey mode

---

0.34.0

- `mark_translation` hotkey (`Ctrl+ArrowLeft`): Hotkey mode applies to `selectedLines`; Typing mode to cursor line. Computes `nextMs - 10ms`
- Paren/bracket autocomplete: selected text wraps; `(` at line start wraps rest of line; otherwise inserts `()` with cursor inside

---

0.33.3

- Secondary field header layout: `justify-content:flex-start` with `hdrRight` div — exactly two flex children
- `replay_end` hotkey (Shift+R): added to DEFAULT_CFG, HK_SECTIONS (Sync), SEC_BLOCKED for secondary fields

---

Pre-semantic

- Web app chosen over Python/PyQt: zero install, cross-platform. Tradeoff: re-pick audio each session, no file watching, no system media keys
- Genius scraping delegated to browser extension: cross-origin blocks prevent in-app fetching; scraping breaks silently when site changes
- Multi-select: right-click toggles, Shift+right-click range, Shift+arrow extends, `adjustTs` operates on all `selectedLines`
- App named "LineByLine": checked GitHub for uniqueness — no existing LRC/lyrics tool using the name
