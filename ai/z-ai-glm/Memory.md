0.37.2

- SonarCloud post-push remediation (27 issues across 2 rounds, version held constant — single patch release). Rule-by-rule breakdown in `archive/semantic/0.37.2/linebyline-0.37.2.md` companion. Patterns: S2486 empty-catch → `console.warn`; S2310 for-loop counter reassignment → `while` cursor; S3776 CC reduction via helper extraction + dispatch-table (see code-quality-SKILL.md "Dispatch-table CC reduction"); S8786 regex backtracking → negated character class (`.*?` → `[^\]]*`); S3626/S2681/S7766 trivial (remove redundant return, add braces, `Math.max`); Web:InputWithoutLabelCheck fires on `display:none` inputs too — add `aria-label`; githubactions:S7637 — pin actions to commit SHA, not `@v1` tag.
- playwright.config.js coverage gap: `inCI`/`enableWebkit` env-detection reads `process.env` at module-load — untestable by unit tests (stubbing `process.env` post-load doesn't re-evaluate). `/* istanbul ignore next */` comments not honored by SonarCloud (uses its own LCOV engine, not Istanbul). Proper mechanical fix is `sonar.coverage.exclusions` property in `sonarcloud.yml` (separate from `sonar.exclusions` which excludes from ALL analysis). User marked the 2 issues as False Positives with this rationale — accepted, no further action needed unless they recur post-engine-update.
- Internal `<title>` bumped 0.37.1 → 0.37.2. Initial patches targeted only `<script>` body and missed `<head>`; single-line fix applied to the `<title>` tag itself.
- Genius paste cleanup (`cleanGenius`). `_findGeniusLyricStart` regex `!META_RE.test()` → `/^\[[A-Z]/.test()` — META_RE `/^\[[a-zA-Z]+:/` matched both LRC tags (`[ti:..]`) and capitalized Genius headers (`[Intro: All]`, `[Chorus:..]`), so the negative test dropped intro lines. Fix is LOCAL to Genius extraction (NOT a global META_RE change — 30+ other usages treat META_RE-matching lines as metadata to skip). `_findGeniusLyricEnd` extended with fifth stop boundary: `t==='Embed' && i>start && /^\d+$/.test(lines[i-1].trim())` returns `i-1`, stripping trailing `<digits>\nEmbed` Genius page embed widget; `/^\d+$/` guard defends against songs that legitimately contain "Embed" in lyrics. New `_stripSectionHeaders(lines)` helper replaces inline `.filter()` — inserts a blank line when stripping a `[Section: ...]` header between two non-blank lyric lines (`.filter()` can only remove elements); guard `out.length && out[out.length-1].trim()!==''` so headers at slice start or preceded by existing blank don't trigger the insert. LIMITATIONS.md embed-widget workaround removed; MANUAL.md Genius manual-test entry simplified.
- Test suite hardening (no app patch). `download/mock-v2.txt` is drop-in replacement for `tests/media/mock.txt` exercising the embed-widget code path while preserving the existing snapshot byte-for-byte (verified via `scripts/verify-enhanced-mock.js`). Recurring webkit flaky tests under host load — `tab-settings` (`keyboard-nav.spec.js:33-40`), `intervals-large` (`intervals.spec.js:12`, 30s timeout on `.evaluate((e) => e.blur())` — browser JS thread starved, element resolved but RPC stalled), `search-check` (`settings.spec.js:73`, 5s timeout on `#s-replay-next` checkbox assertion — focus-timing race where keypress dispatches before target has focus). All three pass on retry; all three are exacerbated by webkit being more resource-sensitive than chromium. User's "Obsidian typing lagged during tests" observation confirms host contention. Recommended test-level hardening (out of scope for 0.37.2): assert `#settings-overlay.toHaveClass(/open/)` after `Control+,`, assert target `toBeFocused()` before keypress, remove dead `waitForTimeout(50)`, swap `.evaluate((e) => e.blur())` for native `.blur()`.
- Dependabot cascade (no app patch). (1) `tests/helpers/package.json` added — root `package.json` declares `"@linebyline/test-helpers": "file:./tests/helpers"` path-dep; `tests/helpers/` had `index.js` but no manifest. Node's runtime CommonJS resolver is lenient (falls back to `index.js`, so 540 tests pass), but Dependabot's file-fetcher is strict and aborts the entire job before update-resolution. Two `package.json` files in one repo is standard for `file:` path-deps. `ignore` rules do NOT fix this — they apply at update-selection, not file-fetch time. (2) After the manifest fix landed, Dependabot opened PR #8 (fast-uri 3.1.2 → 3.1.4), but branch HEAD advanced past SHA SonarCloud analyzed → merge blocked by SHA-mismatch race. Safe to bypass — SonarCloud passed on prior SHA against same changeset, post-merge SonarCloud run on main closes the loop. (3) Two separate brace-expansion CVEs: (a) exponential recursion O(2ⁿ) patched in 5.0.7 (Dependabot alerts), (b) unbounded expansion OOM (GHSA-mh99-v99m-4gvg) with affected range `<=5.0.7` and NO patch available yet. User chose Option A: revert `npm audit fix --force` damage (it downgraded `serve` v14→v6.5.8 [2017-era] to escape the brace-expansion dep tree, but serve 6.x brought 4 critical handlebars/minimist RCE + prototype-pollution vulns — vuln count went 4 high → 13 [1 low, 8 high, 4 critical]), accept 4 residual high (dev-only deps, no attacker-controlled input reaches brace-expansion). **Never run `npm audit fix --force` for this issue** — `--force` ignores SemVer and will downgrade packages to escape vulnerable dep trees, trading theoretical dev-only DoS for critical RCE. Plain `npm audit fix` (no `--force`) would have refused to touch serve.
- SonarQube supply-chain pass on `.github/workflows/playwright.yml`: 5 findings (S6505 x3, S8543 x2) on `npm ci` and `npx playwright` calls. Fixed by adding `--ignore-scripts` to `npm ci` and replacing `npx playwright` with `./node_modules/.bin/playwright` (direct binary, version pinned via package.json). No Won't Fix. No app code or test changes. Confirmed resolved in CI. See `archive/modular/plan/1-Playwright/2.md`. Rule added to `sonarqube-workflow-SKILL.md` v2.
- CI workers bump — declined: `ubuntu-latest` has 4 vCPUs; Playwright CI defaults to 1 worker. Feasible to bump to 2–3 via `--workers=N`, but declined to avoid amplifying Firefox flakiness. 1 worker at ~5 minutes is acceptable. See `archive/modular/plan/1-Playwright/2.md`.
- CI test failure pass (17 failed + 4 flaky → 0): 5 root causes across 6 spec files. (1) Clipboard race: `navigator.clipboard.writeText` async; `Control+v` reads empty clipboard on fast CI. Fixed with `waitForTimeout(50)` in all 8 paste tests. (2) Ambiguous `getByRole("textbox")` in `paste-secondary`/`paste-secondary-genius` after `Control+4` (2 textareas). Fixed with `getByLabel("Secondary 1 lyrics")`. (3) `typing-debounce-1`: 1ms undo window groups rapid keypresses into one snapshot. Fixed with `waitForTimeout(20)` between keypresses (5ms was flaky on CI; 20ms is above rAF interval and clock-tick resolution). (4) Font-fragile screenshots (`tab-font`, `audio-missing-noop`, `assign-reserved-click`): ubuntu-latest renders system-ui wider than Podman ubuntu-24.04 container. Replaced 15 `toHaveScreenshot` calls with structural assertions (`toHaveCSS`, `toBeVisible`, `toHaveText`, `toHaveValue`); removed `test.skip(!CI && !PW_CONTAINER)` guards. (5) `assign-reserved-click` initially patched with wrong default (`Ctrl+;` is `toggle_mode`'s default, not `offset_mode_toggle`'s which is `Shift+~`); corrected in a follow-up patch. `search-check` webkit flake fixed with `tabUntilFocused` instead of hardcoded Tab count. See `tests/chat/0.37.2/1.md`. Fixes documented in `playwright-testing-SKILL.md` v2.
- `.gitignore` `*genius*` blocked snapshot baselines: The "Offline" section's `*genius*` pattern (intended for local Genius notes) unintentionally matched 6 Playwright snapshot `.txt` baselines (test names contain "genius"). Fixed with negation pattern `!tests/*.spec.js-snapshots/*genius*.txt` — narrow enough to only un-ignore `.txt` snapshot baselines, leaving all other `*genius*` files ignored. Lesson: broad `.gitignore` patterns can catch test fixtures whose names happen to contain the same substring; use negation patterns rather than `git add -f` so future regenerations are tracked automatically. Documented in `playwright-testing-SKILL.md` v2.
- Skills meta-session: Applied 3 skill updates from the tests session (playwright-testing-SKILL v2: typing-debounce 5ms→20ms, `.gitignore` caution, font-fragile container divergence; sonarqube-workflow-SKILL v2: S6505/S8543 workflow-file rules). Refined `project-workflow-SKILL.md` to v2 — workflow-neutral stance (removed Build-bias), removed step numbering (steps usable in any order), documented transcript distribution scheme by topic (`archive/modular/X.XX.XX/linebyline-X.XX.XX.md` for build sessions, `archive/modular/plan/<step>/<N>.md` for plan sessions, `ai/z-ai-glm/skills/chat/skills-X.XX.XX.md` for skills sessions, `tests/chat/X.XX.XX/<N>.md` for test sessions), Onboard now reads Memory.md and doesn't create companion file. Dropped the Wrap Up section entirely (user may push at any moment without notifying the agent — the agent's defense is keeping artifacts current after every turn, not a special end-of-session step). Renamed Post-patch updates to Post-turn updates with companion file as the lowest-threshold every-turn item; mandated inline application of Memory/skill updates instead of propose-and-defer (user is a solo vibecoder, not a review board). Changed version discovery to grep the Onboard Repomix's `<directory_structure>` for the highest semver `archive/semantic/` or `archive/modular/` folder name instead of `docs/index.html` (that file arrives in `repomix-build.xml` and isn't available in non-build sessions). Added Memory.md discipline rule: no turn-number references (turn numbers are session-local and ambiguous across sessions sharing a version). Retroactively split monolithic `linebyline-0.37.2.md` companion by topic: CI-specific Review → `archive/modular/plan/1-Playwright/2.md`, Test step → `tests/chat/0.37.2/1.md`, this Skills session → `ai/z-ai-glm/skills/chat/skills-0.37.2.md`. See `ai/z-ai-glm/skills/chat/skills-0.37.2.md`.

---

0.37.1

- SonarQube S3776 CC reduction: Global keydown handler 25→12 (extracted `_isRepeatAllowed`, `_handleRepeatGuard`, `_handleTypingModeArrowKeys`; flattened focused-UI-element guards). `rebuildHkPanel` forEach callback 19→~4 (extracted `_renderHkCellContent` with early-return structure)
- Root cause of 0.37.0 SonarQube regressions: code-quality skill loaded but not actively consulted as a checklist during Typing-mode overlay additions. Added "Pre-delivery code quality checklist" section to code-quality-SKILL.md to prevent recurrence
- Warning popup consistency: `confirm('No trailing end timestamp found...')` changed to `alert()` matching other merge-block popups (Ok button, prompts fix instead of allowing override)
- Secondary field limit: `addSecondary()` now enforces maximum of 10 fields with alert
- Line limit: `MAX_LINES=500` constant; import and paste handlers reject content exceeding limit with alert
- Control button rearrangement verified: user-reordered array at line 1876 (prev/play/next/sync) is purely visual, `CTRL_ACTIONS[key]` lookups are string-based, no dependency breakage
- beforeunload dialog focus: confirmed that Chromium focuses Leave button (Enter works) but mouse cursor does not snap. Browser-native behavior, not fixable from JS. Known limitation retained

---

0.37.0

- Controls panel Typing-mode overlays: `TYPING_AVAILABLE` set keeps play_pause/prev_line/next_line enabled in Typing mode with mode-specific hotkey displays (play_pause → Ctrl+Space, prev_line → ↑ only, next_line → ↓ only). Other HOTKEY_ONLY actions remain dimmed
- Arrow keys removed from RESTRICTED_ALL: no longer flagged as "reserved by the browser" — arrow keys are for Settings navigation instead
- Arrow key Settings navigation: ↑/↓ moves between ALL focusable Settings elements (like Tab/Shift+Tab), not just capture inputs. ArrowUp/ArrowDown on number inputs navigates instead of adjusting values
- Arrow keys pass through: capture input and search keydown handlers let ↑/↓ bubble to global handler for navigation. ArrowLeft/ArrowRight also prevented from being assigned as hotkeys
- Swap button (was Replace): conflict resolution now swaps hotkeys between actions — no blank hotkeys left over. Reset to default gives any holder of that default its own default back (swap pattern), not blank
- Typing-mode ↑/↓ for prev/next line: when no textarea has focus in Typing mode, ArrowUp/ArrowDown triggers seekPrevLine/seekNextLine in the global keydown handler

---

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
