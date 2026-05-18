## 0.36.1

- **SonarQube S6819 (6 instances → semantic HTML)**: `role="region"` → `<section>` on `#audio-box`; `role="group"` → `<fieldset>` on `#hk-grid`; `role="list"` → `<ul>` on `#main-lines`; `role="status"` → `<output>` on `#settings-conflict`; `role="contentinfo"` → `<footer>` on `#settings-footer`. CSS resets added: `.lyric-area{list-style:none;margin:0}`, `.hk-grid{border:none;margin:0;padding:0;min-inline-size:0}`. `role="slider"` on `#progress-wrap` Won't Fix — custom mousedown/drag/wheel interaction model can't be replicated with `<input type="range">`
- **SonarQube S7927 (3 instances → accessible name matches visible label)**: `#btn-add-sec` aria-label changed from "Add secondary field" to "Add field"; `#btn-remove-sec` from "Hide last secondary field" to "Hide field"; `#merge-btn` already matched
- **SonarQube S6825 (1 instance → aria-hidden on focusable)**: Removed `aria-hidden="true"` from `#file-picker` — `display:none` already removes from a11y tree
- **Undo/redo single-push model**: Replaced double-push pattern (`pushSnapshot(); mutate; pushSnapshot()`) with single post-change push (`mutate; pushSnapshot()`). The pre-change state is already on the stack from the previous operation. Double-push created a duplicate that caused sync/adjust to require two Ctrl+Z to undo. Applied to `setMainText`, `mergeTranslations`, both paste paths, and LRC-only import
- **Secondary import undo fix**: `applySnapshot` now clears secondary textareas beyond what the snapshot captured: `for(let i=snap.secondaries.length;i<secondaryCols.length;i++){secondaryCols[i].linesEl.value='';}`. Root cause: adding a field didn't push a snapshot, so undoing to a pre-add snapshot had an empty `secondaries` array and the forEach skipped the still-visible textarea
- **Unsaved work warning for secondaries**: `beforeunload` handler now checks `secondaryCols.some(c=>c.linesEl.value.trim()!=='')` in addition to main textarea
- **Speed field persistence**: `currentSpeed` loaded from `localStorage.getItem('lbl_speed')` on init; saved in `changeSpeed()` and speed-val change handler. Init section restores display value
- **Reset defaults resets speed**: `_doResetDefaults()` now resets `currentSpeed=1`, updates `#speed-val` display, resets `audioEl.playbackRate`, and persists to localStorage
- **↩ split-parens always on**: Removed `#main-split-check` checkbox and label from main field header. All `document.getElementById('main-split-check').checked` replaced with unconditional `batchSplitParens()` calls. `markAsTranslation` split-mode guard removed — always attempts peel first
- **Esc blurs focused UI**: Added `if(isFocusedUI&&e.key==='Escape'){e.preventDefault();ae.blur();return;}` before the `isFocusedUI` early-return guard in global keydown. Lets users press Esc to return to content area after Tab-navigating to buttons/inputs
- **Left panel ARIA regions**: Now Playing wrapped in `<section id="audio-box">`, Controls wrapped in new `<section id="controls-box" aria-labelledby="controls-label">`. Playwright can target `#controls-box` separately
- **beforeunload dialog focus**: Known limitation — browser-native dialog button focus is not controllable from JavaScript

## 0.36.0

- **axe fixes (Turn 3)**: `role="banner"` removed from field headers — `banner` landmark must be top-level, not nested inside `<main>`. Retained `aria-label` for accessible naming. `--text-faint` (#9198a1) on `.ts` and `.end-ts` changed to `--text-muted` (#656d76) — 2.73:1 contrast was below 4.5:1 AA minimum
- **Playwright test strategy shift to `toMatchAriaSnapshot`** (Turn 4): replaced most `innerText().toMatchSnapshot()` on `#main-lines` with `toMatchAriaSnapshot()` on `getByLabel("Lyric lines")` or `#editor-area`. Key advantages over `innerText`: preserves blank lines (empty `listitem`), captures ARIA structure, no CSS color fragility. Three limitations discovered: (1) no metadata lines in snapshot — meta lines are hidden in hotkey mode so aria tree skips them; (2) timestamps are regex-obfuscated (`/\[\d+:\d+\.\d+\]/`) — can't verify exact time values; (3) secondary textarea content is a single string — newlines are lost so blank-line structure can't be verified. Where exact metadata/timestamp/newline content matters, tests still use `inputValue().toMatchSnapshot()` or `innerText().toMatchSnapshot()` alongside the aria snapshot
- **`#editor-area` aria scope**: `expect(page.locator("#editor-area")).toMatchAriaSnapshot()` captures not just secondary fields but also main field lyric lines, editor area checkboxes (`( )` and `↩`), inline warnings (`role="alert"` for trailing timestamp, line count mismatch text in secondary headers), and secondary import buttons. This makes it a comprehensive structural snapshot for merged-field tests — a single assertion replaces `innerText` + `inputValue` + visibility checks across both main and secondary fields
- **Test-by-test conversion details** (old → new):
  - **smoke.spec.js**: landing test — removed `#menu-bar` visibility, `#left-panel` visibility, `#hk-grid .hk-cell` count (16) — all superseded by whole-page `page.locator("body").toMatchAriaSnapshot({ name: "landing.yml" })`. Kept: error checking, `toHaveScreenshot()`, `#editor-wrapper` visibility, `#file-picker` CSS check
  - **import-paste.spec.js**: `import-plain`, `import-synced`, `import-replace`, `import-corrupted-lyrics` — `#main-lines.innerText().toMatchSnapshot()` replaced with `getByLabel("Lyric lines").toMatchAriaSnapshot()`. `inputValue().toMatchSnapshot()` kept alongside for exact metadata/timestamp content. `paste-plain-hotkey`, `paste-synced-hotkey` kept `innerText` snapshots (hotkey-mode paste path). `paste-*-typing` and `paste-secondary` kept `inputValue` snapshots (typing mode)
  - **fields-merge.spec.js**: `hide-secondary`, `replace-secondary`, `paste-secondary-genius` — `inputValue().toMatchSnapshot()` on `getByRole("textbox")` replaced with `#editor-area.toMatchAriaSnapshot()`. `merge-one`, `merge-two`, `merge-no-trailing` — `innerText` + `inputValue` pair replaced with single `#editor-area.toMatchAriaSnapshot()`. `merge-no-timestamps` — `toHaveScreenshot()` replaced with `getByLabel("Lyric lines").toMatchAriaSnapshot()`. `merge-line-mismatch` — `toHaveScreenshot()` replaced with `getByLabel("Lyric lines").toMatchAriaSnapshot({ name: "synced_english.yml" })` (shared snapshot name). `merge-block-reload` — `toHaveScreenshot()` replaced with same shared snapshot. `reload-merge-disabled` — `toHaveScreenshot()` on merge button replaced with `toBeDisabled()` role assertion
  - **sync-adjust.spec.js**: `sync-empty` — `innerText` + `inputValue` pair replaced with single `getByLabel("Lyric lines").toMatchAriaSnapshot()`
  - **typing-mode.spec.js**: `controls-gray` screenshot test removed entirely (replaced by `controls-disabled` with `#left-panel.toMatchAriaSnapshot({ name: "controls-disabled.yml" })`). `controls-disabled` — kept `inputValue().toMatchSnapshot()` for typing-mode keystroke verification (aria can't verify textarea content changes in typing mode)
  - **settings.spec.js**: `settings-window` — `page.evaluate()` CSS override hack (maxHeight/overflow/flex) + `toHaveScreenshot()` replaced with `#settings-body.toMatchAriaSnapshot()` — no more fragile CSS hacks needed. Settings structure fully captured in `settings-window-1.aria.yml`
- **Snapshot naming convention**: when multiple tests share the same expected main-field content, they use `name:` option to share a yml file (e.g. `merge-line-mismatch` and `merge-block-reload` both use `synced-english.yml`). Auto-named snapshots use default Playwright convention (`testname-N.aria.yml`)
- Accessibility overhaul: `<nav role="toolbar">` for menu-bar, `role="region"` + `aria-labelledby` for Now Playing / Controls, `role="slider"` + `aria-valuetext` on progress-wrap, `role="button"` + `tabindex="0"` + `aria-disabled` on hk-grid cells, `aria-label` on all interactive and informational elements
- `_announce(msg)` helper: writes to hidden `#a11y-announcer` `aria-live="polite"` region; wired into `updateActiveLineFromTime` for auto-advance announcements
- `aria-disabled` synchronized alongside `disabled` in `updateMergeBtn` and `mergeTranslations`
- `buildHkRows` assigns `id="hk-capture-{key}"` and `for="hk-capture-{key}"` — Playwright can now use `locator('#hk-capture-play_pause')` instead of positional selectors
- `#main-lines` gets `role="list"`, each `.lrc-line` gets `role="listitem"` — Playwright can count items via `getByRole('listitem')`
- Secondary field import button gets `aria-label`; secondary textarea gets `aria-label="Secondary N lyrics"`
- `#main-warn` gets `role="alert"` for screen reader announcement of line-count warnings
- `#settings-conflict` gets `role="status" aria-live="polite"` for conflict message announcement

## 0.35.19

- SonarQube pass: `_handleSecKeydown` extracted to outer scope, braceless-if fixed in `setupAudio` and `_handleSettingsKeys`, 5 S2681 and 2 S2486 and 11 S3776 marked Won't Fix/deferred
- CC reductions deferred to next major version — out of scope for patch releases

## 0.35.18

- SonarQube pass: `structuredClone` replaced `JSON.parse(JSON.stringify)`, `for-of` converted in `_restoreSecondaryPool` and `_filterYmal` only (3 other `for` loops skipped — index used), `replaceAll` used in `normalizeLrcTimestamps`, zero-fraction cleanup `1.0` → `1`

## 0.35.17

- SonarQube medium-sev: `Number.parseFloat/parseInt/isNaN`, `.remove()` over `removeChild()`, object spread over `Object.assign` (mutating `Object.assign(c,d)` left as-is — spread breaks reference chain)
- Nested ternary flattening: extracted `_normKey(k)` and `_hkDisp(v)` helpers; S2681 braceless-if (14 flags) all Won't Fix, `<dialog>` deferred

## 0.35.16

- CC reduction via extraction: `_handleSettingsSearchKeydown`, `_handleTextareaEnterTrim`, `_handleTextareaParenBracket`, `_handleSecKeydown`, `_buildMergedResult`, `_handleSettingsKeys`, `_handleGlobalHotkeys`, `_handleHotkeyModeKeys`
- Global keydown decomposed to 15-line dispatcher: flags → `_handleSettingsKeys` → guard settingsOpen → repeat-suppress → focused-UI guard → `_handleGlobalHotkeys` → guard !hotkeyMode → `_handleHotkeyModeKeys`

## 0.35.15

- Accidental function deletion risk: `_peelLastParen` deleted during Stage C refactoring, breaking `batchSplitParens` and `markAsTranslation` at runtime — audit all pre-existing callees after extracting helpers
- String assembly bug: `tsPrefix + ' ' + content` with `.replace(/^ /,'')` stripped space from `[mm:ss.cc] text` when `content` non-empty but no paren groups. Fix: conditional `tsPrefix+(tsPrefix&&content?' '+content:content)`

## 0.35.14

- SonarQube staged fix plan: A (`.dataset`+nesting) → B (easy CC wins) → C (medium CC) → D (hard CC, global keydown at 138)
- Cleared hotkeys not persisting: `_migrateHotkeys` used `!c.hotkeys.X` which treats `''` as falsy — changed to `=== undefined`
- Line click always seeking with offset: `_handleLineClick` unconditionally applied offset; fixed to check `cfg.replay_play_other`

## 0.35.13

- `activeLine` (navigation cursor, `.cursor` class) / `playingLine` (audio highlight, `.active` class) split: two separate state variables. `playingLine` only set immediately on sync/play/click; all other navigation lets `updateActiveLineFromTime` place the highlight when audio reaches `lineTs`
- `insertEndLine` three-tier logic: (1) activeLine is trailing ts → update in place (2) next non-blank line after activeLine is trailing ts → update in place (3) neither → insert new
- `suppressAutoLine` removed from `updateActiveLineFromTime` — was incorrectly blocking `playingLine` after navigation

## 0.35.12

- `batchSplitParens` second-pass interpolation: un-timestamped lines after split get interpolated timestamps (same offset-10ms logic as `markAsTranslation`)
- Seek offset persistence: `doSyncFile` never resets seek offset — reverted snapshot-based approach (snapshot was taken after reset, capturing wrong value)
- Helper extraction: `suppressAuto()`, `collapseBlanks()`, `findLastMetaIdx()`, `lrcHasTi()`, `doSeek(dir)`

## 0.35.11

- Paste overwrite vs append: Hotkey mode paste always overwrites; Genius paste still appends (intentional edge case). `mergeLrcMeta` handles metadata; non-meta path preserves current meta and replaces lyric body
- `hasLyricContent()` guard: prevents `syncLine`/`insertEndLine`/`maybeAppendTrailingTs` from inserting useless `[00:00.00]` when no line has text content
- Newline convention: all four assembly sites must use `mergedMeta.trimEnd() + '\n\n' + lyrics` for exactly one blank separator

## 0.35.10

- Single-source volume model: `masterVolume` is always actual volume (0 when muted); `toggleMute()` stores pre-mute in `_preMuteVolume`. No separate `masterMuted` flag
- Undo/redo fix in `setMainText`: was pushing only pre-mutation snapshot so redo always restored pre-state. Added `pushSnapshot()` at end of `setMainText`
- `_volWheeling` flag: wheel sets true, clears on next animation frame; input handler bails if flag set — prevents synthetic input event from clobbering volume during scroll

## 0.35.9

- Default hotkey migration chain: `open` Ctrl+O→Ctrl+;, `save` Ctrl+;→Ctrl+', `issues` Ctrl+'→Ctrl+[. `loadCfg` handles both old default and custom remaps
- Conflict-then-reset: `rst.click()` blanking a holder must also call `buildHkRows()` to update DOM — otherwise other field still shows old value
- Ctrl+O spam: reverted all fix attempts; added to `RESTRICTED_ALL` instead — reserve browser-conflicting keys rather than fight browser behavior

## 0.35.8

- Settings search Tab/Escape: add `if(e.key==='Tab')return;` before `e.stopPropagation()` so Tab propagates to global focus trap. Esc in text-mode → direct `closeSettings()`
- Dedicated `--hk-key-bg` CSS variable: light `#dde1e6`, dark `#484f58` — don't reuse `--border-mid` for badge backgrounds

## 0.35.7

- Settings focus trap: exclude `.hk-clear`, `.hk-reset`, `.hk-replace`, `#settings-close` from focusable list — transient/utility elements shouldn't be Tab stops
- Capture input Tab: `e.preventDefault()` on Tab early-return so browser native Tab is blocked, only global trap moves focus
- `Ctrl+\` reset_defaults: works when Settings closed (opens then confirms) or open (confirms directly). Inline confirm replaces native `confirm()`

## 0.35.5–0.35.6

- Keyboard accessibility overhaul: Tab/Shift+Tab focus trap in Settings, `e.repeat` guard for key-repeat prevention (navigation keys still repeat), `Ctrl+D` added to RESTRICTED_ALL, `seek_back`/`seek_fwd` defaults changed to `Ctrl+9`/`Ctrl+0`
- Tab passthrough in hotkey capture: Tab key checked before `e.preventDefault()` so focus trap can handle it
- Enter-syncs-toolbar fix: suppress global Enter→syncLine when a focusable non-lyric element has focus

## 0.35.4

- Dynamic config reads: `ensureReTagDefault` was reading `DEFAULT_META` (hardcoded constant) instead of `cfg.default_meta` (live value) — always read from `cfg`
- `Ctrl+M` added to `RESTRICTED_ALL`: was hardcoded in global keydown but missing from restriction set

## 0.35.3

- `batchSplitParens` must strip timestamp prefix before peeling: old guard `if(tsToMs(l)!==null)` skipped all timestamped lines. Fix: strip, peel, re-prepend
- `normalizeLrcTimestamps` at top of `cleanPaste`: ms-precision `[00:00.000]` didn't match `TS_RE`, causing `isHeader` to strip them — truncate third decimal early

## 0.35.2

- `batchSplitParens(text)` for batch conversion on import: walks every line, peels trailing `(...)` groups, inserts as plain lines. Wired into all four entry points when ↩ is checked
- ↩ checkbox default changed to checked

## 0.35.1

- `_peelLastParen` loops all groups in one pass: inserts with timestamps `nextMs - N*10` through `nextMs - 10`
- `normalizeLrcTimestamps()`: truncate three-decimal timestamps to two rather than supporting ms-precision throughout

## 0.35.0

- `↩` split-mode checkbox: `_peelLastParen` + `batchSplitParens` for splitting inline translations to separate lines
- `markAsTranslation` split-mode path: peels trailing paren groups, inserts as separate lines with interpolated timestamps
- Merge fields requires `hasTs` + `hasTrailingTimestamp()`: not just line count parity. `mergeTranslations` line-count mismatch guard added

## 0.34.10

- Trailing timestamp timing: moved `maybeAppendTrailingTs()` from paste/import handlers to `syncLine()` — fires only after first real sync, not when lyrics are first added without timestamps
- `allLyricLinesHaveTs()` helper: gates `updateMergeBtn` and `mergeTranslations` early-return

## 0.34.9

- `updateMergeBtn` rewrite: checks `hasTs` (non-trailing content timestamp) + `hasTrailingTimestamp()` before enabling
- Left panel collapse: `height:100dvh` for mobile browser chrome; auto-collapses when viewport < 640px; state persists to `localStorage`

## 0.34.8

- Enter in speed/seek fields: `e.stopPropagation()` + `e.target.blur()` on Enter so global keydown never fires `syncLine`
- Panel collapse with `localStorage` persistence: `applyPanelCollapse(transferFocus)` sets `panel.inert=true/false`

## 0.34.7

- ArrowLeft/ArrowRight hardcoded seek in Hotkey mode only: two checks after `if(!hotkeyMode)return` guard, before remappable `actions` dispatch. Not shown in Settings
- `maybeAppendTrailingTs` guard removal: now fires whenever audio duration known and no trailing ts — fixes plain lyric paste
- Double-`pushSnapshot` pattern: one before mutation (undo), one after (redo) — applied to `mergeTranslations`

## 0.34.6

- Help window removal: `openHelp`→`window.open`, `_topmostOverlay`/`_bringToFront`/`_overlayZ` removed. Only Settings remains as overlay
- Skip empty lines: seek/sync/advance all skip `trim()===''` in Hotkey mode
- `RESTRICTED_ALL` expansion: Ctrl+Shift+K/N/O/P/T/W/Delete, all Meta+[A-Z0-9/Arrow/Shift]

## 0.34.5

- Python port abandoned, reverted to web: all future work is single-file HTML app
- `stemOf` preserves filename casing: removed `.toLowerCase()` so `[ti:]` and save filename respect original case
- Auto Strip Settings reverted: `cleanPaste` hardcoded to strip sections on paste, never strip metadata
- Google Fonts removed: no external font dependencies. `--font-mono` → `ui-monospace,monospace`

## 0.34.4

- Custom `fs-spinner` over native `<input type="number">` spinners: native spinners are inconsistent across browsers and ignore CSS variables
- Save filename uses only `[ti:]`: removed `ar - ti` branch. External labels ("ms") always separate `<span>` elements
- Number field invalid input: reset display to current stored value instead of leaving field blank

## 0.34.2–0.34.3

- Media buttons: pure geometric SVG primitives (polygon/rect), no copyright concern. Styled via CSS variables
- `play_pause_alt` (Ctrl+Space): remappable hotkey added to Settings > Playback. Works outside hotkey mode

## 0.34.1

- Esc added to `RESTRICTED_ALL`: `hk-capture` keydown checks `e.key==='Escape'` before key-building and calls `revertAndExit()`
- `markAsTranslation` single-line only in Hotkey mode: always uses `[activeLine]` regardless of `selectedLines`
- Volume slider `step` attribute is cosmetic: removed `step` mutation from `saveSettingsNow` — input/wheel handlers read `cfg.vol_increment` live

## 0.34.0

- `mark_translation` hotkey (`Ctrl+ArrowLeft`): Hotkey mode applies to `selectedLines`; Typing mode to cursor line. Computes `nextMs - 10ms`
- Trailing timestamp warning: `checkLineCounts()` calls `hasTrailingTimestamp()` — warns when main field has timestamps but no trailing end-timestamp
- Paren/bracket autocomplete: selected text wraps; `(` at line start wraps rest of line; otherwise inserts `()` with cursor inside

## 0.33.3

- Secondary field header layout: `justify-content:flex-start` with `hdrRight` div — exactly two flex children
- `replay_end` hotkey (Shift+R): added to DEFAULT_CFG, HK_SECTIONS (Sync), SEC_BLOCKED for secondary fields
- `_topmostOverlay()`: compares live `style.zIndex` — Escape closes whichever overlay has higher z-index

## Pre-semantic

- All Alt+* and F-key hotkeys replaced with Ctrl+* equivalents due to LibreWolf/Firefox resist-fingerprinting. Mute removed (browser Ctrl+M mutes tab)
- Web app chosen over Python/PyQt: zero install, cross-platform. Tradeoff: re-pick audio each session, no file watching, no system media keys
- Genius scraping delegated to browser extension: cross-origin blocks prevent in-app fetching; scraping breaks silently when site changes
- Undo/redo model: discrete snapshot stack for Hotkey mode; browser native `execCommand('undo'/'redo')` for Typing mode
- Multi-select: right-click toggles, Shift+right-click range, Shift+arrow extends, `adjustTs` operates on all `selectedLines`
- App named "LineByLine": checked GitHub for uniqueness — no existing LRC/lyrics tool using the name
