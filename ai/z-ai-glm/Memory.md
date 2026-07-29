0.37.2

- SonarCloud post-push remediation (cumulative across two rounds, 27 issues total, version held constant across all remediation turns per user request — single patch release). Round 1 (Turns 2–4): S2486 (4 empty-catch at L509/970/1060/1141): `catch(_){}` and `catch(e){return …}` → `catch(e){console.warn(context,e);…}`. S2486 fires on empty/comment-only bodies regardless of optional catch binding; `console.warn` surfaces suppressed exceptions to devtools without changing observable behavior. S2310 (L1389 in `_assignInterpolatedTs`): `for` → `while` — the `i=runEnd` reassignment was load-bearing (skips past processed runs to avoid re-interpolation), deletion wasn't an option, while-loop cursor isn't subject to S2310; all 4 `continue` paths wrapped with `{i++;continue;}` to preserve for-loop increment-on-continue semantics. S3776 (11 CC issues, range 17-63): helper extraction across 8 sections, ~27 new helpers — `_handleHotkeyModeKeys` 63→8, `_handleSettingsKeys` 47→9, `_migrateHotkeys` 38→0 (table-driven `_LEGACY_HOTKEY_MAP`), `_handleGlobalHotkeys` 22→6 (computed-key dispatch table). See code-quality-SKILL.md "Dispatch-table CC reduction" section for the pattern. Helper-extraction safety audit: all 14 pre-existing `_`-prefixed helpers verified present after extraction. Section index updated in linebyline-section-index-SKILL.md. Round 2 (Turn 10): 11 more findings + 1 coverage gap. S8786 (regex super-linear backtracking ×3): `(.*?)`→`([^\]]*)` in `[re:...]` extractor (L937), `\[.*?\]`→`\[[^\]]*\]` in `_announce` line stripper (L1171) — negated character class is linear, same match set; `\s+Lyrics$`→`\sLyrics$` (L957) drops `+` quantifier, single whitespace + `.trim()` handles multi-space. S3776 (CC ×2): `_handleSettingsHotkeyDispatch` 16→14 via `_toggleSettingsOpen(open)` extraction (L2559, removes inline if/else); `_handleHotkeyModeNav` 17→10 via `_handlePageKeys(e, allLines)` extraction (L2649, removes PageUp/PageDown block from parent). S3626 (redundant `return;` ×2): L2183 last statement in `_handleSearchHkMode` after toggle_mode if-block; L2675 last statement in `_handleHotkeyModeNav` ArrowUp/ArrowDown block — both removed (function returns naturally anyway). S7766 (L2640): `activeLine<0?0:activeLine`→`Math.max(0,activeLine)` — mathematically identical. S2681 (L2644): braceless-if inside `if(e.shiftKey)` block — added braces around inner `if(selectedLines.size===0&&activeLine>=0)selectedLines.add(activeLine)` to make intent explicit (only `selectedLines.add(activeLine)` is conditional; `selectedLines.add(clamped);activeLine=clamped;` always run on shift+arrow). Web:InputWithoutLabelCheck (L349): `#file-picker` hidden file input — added `aria-label="File picker"` (input is `display:none` and triggered programmatically via `click()`, but the rule still fires without a label). githubactions:S7637 (`.github/workflows/sonarcloud.yml` L43): replace `@v1` tag with full 40-char commit SHA — workflow file not in workspace, instructions only; pinning prevents tag-retagging supply-chain attacks. playwright.config.js coverage gap: 3 lines `inContainer`/`inCI`/`enableWebkit` env-detection uncovered — collapse to single line `const enableWebkit = !!process.env.PW_CONTAINER || !!process.env.CI;` with `/* istanbul ignore next -- env-detection at config-load time, exercised via PW_CONTAINER/CI env vars */` comment — config file not in workspace, instructions only; env-detection at module-load time can't be unit-tested (stubbing `process.env` after load doesn't re-evaluate).
- Internal `<title>` tag bumped 0.37.1 → 0.37.2 — Turns 2–4 patched only `<script>` body and missed `<head>`. Single-line replacement.
- Genius paste cleanup (`cleanGenius`). `_findGeniusLyricStart` second loop changed `!META_RE.test()` → `/^\[[A-Z]/.test()`: META_RE `/^\[[a-zA-Z]+:/` matches both LRC tags (`[ti:..]` lowercase) and capitalized Genius section headers (`[Intro: All]`, `[Chorus:..]`, `[Bridge:..]`), causing intro lines like `[intro vocalization]` to be dropped. NOT a global META_RE change (30+ usages treat META_RE-matching lines as metadata to skip — changing it would break cursor advancement, line counts, isHeader, hasMeta); fix is local to Genius extraction. `_findGeniusLyricEnd` extended with a fifth stop boundary — `t==='Embed' && i>start && /^\d+$/.test(lines[i-1].trim())` returns `i-1`, stripping the trailing `<digits>\nEmbed` Genius page embed widget that lives between the last lyric and `About`; `/^\d+$/` guard is the false-positive defense against songs that legitimately contain the word "Embed" in their lyrics. New `_stripSectionHeaders(lines)` helper replaces inline `.filter()` in `cleanGenius` — inserts a blank line when stripping a `[Section: ...]` header between two non-blank lyric lines (`.filter()` can only remove elements); guards `out.length && out[out.length-1].trim()!==''` so headers at slice start or preceded by existing blank don't trigger the insert. Verified byte-for-byte against user-confirmed expected lyric body (57 lines); confirmed a better baseline across multiple Genius pages. LIMITATIONS.md embed-widget workaround entry removed (no longer needed); MANUAL.md Genius manual-test entry simplified (intermediate editor step no longer needed).
- Test suite hardening (no app patch). `tests/media/mock.txt` doesn't exercise the new embed-widget code path — `download/mock-v2.txt` is a drop-in replacement that inserts `\n\n42\nEmbed\n` before the `About` heading. Verified via `scripts/verify-enhanced-mock.js`: D-round branch fires (end = digits line index), output byte-identical to original mock.txt (1013 bytes both), no leakage; **no snapshot update needed** — fix is correctly scoped. Flaky `tab-settings` in `tests/keyboard-nav.spec.js:33-40` — 5s timeout on `getByRole('checkbox', { name: 'Moving to previous line' })`. 5s timeout rules out "50ms too short" (toBeChecked already auto-retries); real cause is focus-timing race under host load — `tabUntilFocused` returns when target reports focused but if Tab dispatches started before `openSettings()` finished layout-painting the overlay, focus can land on body/`#main-textarea` first. Recommended test-level fix: add `await expect(page.locator("#settings-overlay")).toHaveClass(/open/)` after `Control+,`, add `await expect(page.locator("#s-replay-prev")).toBeFocused()` before Space, remove the dead `waitForTimeout(50)`. Both items are test-suite changes, out of scope for the 0.37.2 patch; documented for follow-up.
- Dependabot scheduled security scan failed with `path_dependencies_not_reachable: @linebyline/test-helpers` (Turn 11, no app patch). Root `package.json` declares `"@linebyline/test-helpers": "file:./tests/helpers"`; `tests/helpers/` had `index.js` but no `package.json`. Node's runtime CommonJS resolver is lenient (falls back to `index.js` when no manifest present, so the test suite runs fine — 540 tests pass), but Dependabot's file-fetcher is strict and aborts the entire job before update-resolution. Fix: added `tests/helpers/package.json` with `name:"@linebyline/test-helpers"` (must match the root's `devDependencies` key exactly), `version:"1.0.0"` (arbitrary semver for a `private:true` package — does not track app version, root version, or any file version), `main:"index.js"`, `private:true`. Two `package.json` files in one repo is the standard pattern for `file:` path-deps — each defines a separate npm package, versions are per-package, `main` is relative to each package's own directory, no conflicts. Dependabot `ignore` rules do NOT fix this — they apply at update-selection time (which PRs to open), not at file-fetch time (which deps to scan); the error fires before any ignore rule is consulted. Alternative remediation: drop the path-dep entirely, switch all 15 spec files from `require("@linebyline/test-helpers")` → `require("./helpers")`, remove the root `devDependencies` entry — 15 file edits vs. 1 new file, not recommended unless helpers grows beyond one file. Secondary gap: `brace-expansion` and `fast-uri` ReDoS CVEs (transitive via `@playwright/test` → `micromatch` → `braces` → `brace-expansion`) were not patched while Dependabot was blocked — either wait for the next scheduled run post-fix to auto-PR, or run `npm update brace-expansion fast-uri` manually and re-run the Playwright suite.
- Dependabot post-fix cascade (Turns 12–13, no app patch). After Turn 11's `tests/helpers/package.json` fix landed, Dependabot opened PR #8 (fast-uri 3.1.2 → 3.1.4) successfully, but the PR's branch HEAD advanced past the SHA SonarCloud #60 analyzed → merge blocked by SHA-mismatch race ("Code scanning is waiting for results from SonarCloud for the commits 8ae6621 or 29c71b3"). Safe to bypass — SonarCloud passed on the prior SHA against the same changeset, CodeQL passed on current HEAD, post-merge SonarCloud run on main closes the loop. Two stuck brace-expansion alerts (18h+ "creating security update" spinner) from before the Turn 11 fix — the path-dep error had held them in pending state; the fix didn't auto-requeue them. Turn 13 attempted `overrides: { "brace-expansion": "5.0.7" }` in root package.json — correct approach for forcing nested versions, but discovered brace-expansion has TWO separate CVEs: (1) exponential recursion O(2ⁿ) patched in 5.0.7 (Dependabot alerts), (2) unbounded expansion OOM (GHSA-mh99-v99m-4gvg) with affected range `<=5.0.7` and NO patch available yet. Override closes CVE #1 but not #2 — `npm audit` still shows 4 high. **`npm audit fix --force` is a footgun**: it downgraded `serve` from v14 (current) to v6.5.8 (2017-era) to escape the brace-expansion dep tree, but serve 6.x brought its own pile of worse CVEs — handlebars (4 critical: RCE, prototype pollution, DoS, AST injection), minimist (critical: prototype pollution), ip (high: SSRF), send (high: XSS), cross-spawn (high: ReDoS). Vuln count went 4 high → 13 (1 low, 8 high, 4 critical). Fix: `git checkout HEAD -- package.json package-lock.json` to revert everything, then either accept the 4-high state (dev-only deps, no attacker-controlled input reaches brace-expansion) or re-add ONLY the overrides block and run `npm install` (NOT `npm audit fix`, NOT `--force`). Never run `npm audit fix --force` for this issue — plain `npm audit fix` (no `--force`) only applies non-breaking updates and would have refused to touch serve. Lesson: `--force` ignores SemVer and will downgrade packages to escape vulnerable dep trees, trading theoretical dev-only DoS for critical RCE.
- Detailed turn-by-turn build log (Turns 2–13) in `linebyline-0.37.2.md` companion file.
- Companion file format rules (added Turn 9, codified in project-workflow-SKILL.md "Companion .md file" section): (1) Never quote potentially licensed lyrics or metadata — replace with functional placeholders (`[intro vocalization]`, `[final lyric line]`, `[Verse 1: singers]`, `[real artist] — [real song]`). The companion file lives in `download/` and may be visible to GitHub contributors. (2) Number turns sequentially with integers throughout — do not switch to letter labels (Turn A, Turn B) mid-session. Turn counter continues across companion files if a session spans versions. (3) Drop `## Deliverables this turn` — the reader cannot see the agent's sandbox. (4) Drop `## Awaiting` — redundant with the next turn's verbatim user prompt. (5) Wrap the `summary` frontmatter field in single quotes when it contains YAML-special characters (`:`, backticks, etc.) — added Turn 10 after the unquoted summary caused parsing ambiguity.

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
