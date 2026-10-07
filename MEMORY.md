# LineByLine — durable memory seed

Harness-agnostic, git-tracked memory for AI coding agents. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update this file. The web-channel agent edits its sandbox copy and produces it in `download/` for the user to apply to the repo.

## Context loading

Context files are loaded via the Espanso snippets in `scripts/espanso/linebyline.yml`. Each trigger expands to a clone + read instruction. If `scripts/.setup-sandbox.sh` has been run, project skills auto-load into `available_skills` — the agent invokes them via `Skill(command="name")` instead of reading the SKILL.md explicitly. The snippets list only the non-skill context files (`AGENTS.md`, `MEMORY.md`, `ROADMAP.md`, `package.json`, `README.md`, source/test code). See `ai/README.md` for the current trigger list.

## Knowledge map

Skill pointers below describe each skill's scope. Onboard-essential skills (`linebyline`, `skill`, `delivery`) should be re-read at the start of each step; the others are invoked on-demand via `Skill(command="name")` when their `description` matches the current task.

- `linebyline-SKILL.md` — project structure, context loading, workflow steps (Onboard / Code / Skills / Propose), pre/post-patch checklists, post-turn updates, versioning, deliver-zip pattern. The canonical onboarding + workflow skill.
- `delivery-SKILL.md` — chat.z.ai web channel behavioral rules (download visibility, input handling, output format, comment density, context compaction) + the delivery workflow (prepare → zip → deploy) and the five packaged scripts.
- `skill-SKILL.md` — when to create or update skills vs. MEMORY.md entries; skill anatomy and writing style.
- `linebyline-section-index-SKILL.md` — section-name grep protocol + prompt-to-section map for `docs/index.html`.
- `single-file-html-app-SKILL.md` — file structure, CSS architecture, snapshot undo/redo, file import/export, init sequence, common pitfalls.
- `browser-hotkey-system-SKILL.md` — key normalization, restriction rules, capture-input behavior, conflict swap, modal focus trap, typing-mode overlays.
- `aria-accessibility-SKILL.md` — Rules 1–9 covering semantic HTML, accessible names, dialog/modals, live regions, `inert` panels.
- `code-quality-SKILL.md` — code quality patterns, bug classes, undo/redo, config migration, Bash workflow script rules.
- `sonarqube-workflow-SKILL.md` — `sie` report format, sandbox SonarCloud API protocol, per-rule triage table (with false-positive summary), taint-analysis rules.
- `playwright-testing-SKILL.md` — test infrastructure, snapshot strategy, font-fragile screenshots, TS diagnostics setup.

## Architectural decisions

The full architectural state for the modular refactor — Phase A scaffold, Phase B theme tokens, Phase C tranches (all done), Phase D tranches 1–9 (Tranche 9 done), Phase E Tranche 1 done (beforeunload/isDirty wiring), Tranche 2 done (Playwright retarget to Vite preview), Tranche 3 done (local-test checkpoint passed), Tranche 4 done (`logic.spec.js` consolidated + `assign-conflict-tab` rewritten), Tranches 5–8 planned, deploy pattern — lives in `ROADMAP.md`. The roadmap is the single source of truth; MEMORY.md no longer duplicates it. The roadmap carries implementation-level detail (test infrastructure quirks, port deltas per tranche, file lists per tranche) that this file previously condensed into a parallel summary, creating a synchronization burden.

The roadmap's Phase D section contains implementation notes for every tranche (1–9). The roadmap's Phase E section contains an 8-tranche cutover plan (Tranche 1 = `beforeunload`/isDirty wiring; Tranche 2 = Playwright retarget to Vite preview; Tranche 3 = local-test checkpoint — the gate where the user tests in Playwright Codegen + real browser before merging; Tranche 4 = `tests/logic.spec.js` consolidation; Tranche 5 = the cutover itself, Pages source flip + deploy.yml trigger; Tranche 6 = monolith deletion + archive cleanup; Tranche 7 = stale-docs sweep; Tranche 8 = skills update for modular architecture). Each tranche summary links to its implementation notes subsection within the roadmap; no tranche relies on a "See MEMORY.md" pointer anymore.

## Sync behavior invariants

App-behavior contracts tied to specific versions. Useful for regression investigation — if a sync behavior changes unexpectedly, check whether the version that introduced it is the baseline.

- `activeLine` / `playingLine` split (0.35.13): `activeLine` = navigation cursor (`.cursor` class), `playingLine` = audio highlight (`.active` class). Navigation moves the cursor; only sync, play, and click set the playing highlight. `updateActiveLineFromTime` places the highlight when audio reaches `lineTs`.
- `insertEndLine` three-tier logic (0.35.13):
  1. if `activeLine` is a trailing ts, update in place;
  2. if the next non-blank line after `activeLine` is a trailing ts, update in place;
  3. otherwise insert new.
- `TYPING_AVAILABLE` set (0.37.0) — first version with Typing-mode overlays in the Controls panel. General pattern in `browser-hotkey-system-SKILL.md` (Build bundle) → "Typing-mode overlays in Controls panel".
- Swap-button conflict resolution (0.37.0) — first version with the swap pattern (no blanks left over). General pattern in `browser-hotkey-system-SKILL.md` (Build bundle) → "Conflict resolution" + "Reset to default" subsections.
- `hasLyricContent()` guard (0.35.11): prevents `syncLine`, `insertEndLine`, `maybeAppendTrailingTs` from inserting useless `[00:00.00]` lines when no line has text content.
- All-assembly-site newline convention (0.35.11) — see `code-quality-SKILL.md` (Review bundle) → "Newline convention in LRC assembly" for the rule.
- `beforeunload` dirty check + `isDirty` bridge (Phase E Tranche 1, pre-cutover): the monolith's `beforeunload` (docs/index.html lines 2766–2770) reads `getTA()` + `secondaryCols[].linesEl.value` directly.
    - The Vue port wires a `watch` in `useAppState` that mirrors the same check into the `isDirty` ref (`flush: 'sync'`, `deep: true`, `immediate: true`).
    - `App.vue`'s `onMounted` adds a `beforeunload` listener that re-reads `mainText.value` + `secondaryPool.value` directly (so a stale `isDirty` can never suppress the warning).
    - Port delta: `cfg.default_meta` → `cfg.value.default_meta`; the secondary check reads `secondaryPool` (all entries, including hidden) — not `secondaryCols` (visible-only computed) — so hidden entries with text from a previous session still trigger the warning.
    - 13 new Vitest specs in `tests/unit/appState.test.ts` (9 isDirty watch + 4 App.vue beforeunload integration via happy-dom); 473/473 specs green post-patch; `vue-tsc -b` clean. No Playwright snapshot regen (runtime behavior, not DOM structure).
- Playwright Vite-target mode (Phase E Tranche 2, pre-cutover): `LBL_VITE_TARGET=1` env var branches three files:
    - `tests/helpers/index.js` `getAppUrl()` returns `/` instead of `/docs/index.html`.
    - `playwright.config.js` `webServer.command` runs `npx vite preview --port 5173 --strictPort` instead of `npx serve . -l 3004`, and `use.baseURL` switches to `http://localhost:5173`.
    - `tests/PLAYWRIGHT_SETUP.md` documents the SSH+Syncthing workflow.
    - The `tst` is a **server-side bash script** at `~/.local/bin/tst` (not a PC fish function) — the repo's section-4 bash script is the template.
    - The Server copy lives outside the synced repo (per SSH_SETUP.md §"Deliberately NOT in a synced folder") and must be updated manually to propagate `LBL_VITE_TARGET` into Podman via `-e LBL_VITE_TARGET=1`.
    - The human runs `ssh Server "LBL_VITE_TARGET=1 tst"` (master key); the agent's `agent-tst` restricted-key path routes through `tst-locked` (allowlists Playwright args, does NOT pass env-var prefixes) — Tranche 3 uses the master key interactively.
    - **Auto-detect via `dist/index.html` existence was removed** — too aggressive in the SSH+Syncthing workflow (dist/ syncs to the server and persists, so every `tst` run would auto-detect Vite-target).
    - Syncthing sync check (per MEMORY.md → "Delivery script hardening"):
        - REST API pattern: trigger rescan via `curl -X POST -H "X-API-Key: $KEY" "http://127.0.0.1:8384/rest/db/scan?folder=$LBL_ID"`, then poll `/rest/db/completion?folder=$LBL_ID&device=$SERVER_ID` until `.completion == 100`.
        - Simpler: `ssh Server 'stat -c %Y ~/GitHub/linebyline/dist/index.html'` to compare mtimes.
    - **Expect `.aria.yml` snapshot regen** on first Vite-target run: Vue produces different DOM structure (shadcn-vue `Dialog` vs custom overlay, `<button>` vs `<div role=button>` in HotkeyCell) — same ARIA semantics, different element tree.
    - **`[INEFFECTIVE_DYNAMIC_IMPORT]` Vite build warnings** (`useMerge` in `SecondaryField.vue`, `useSync` in `useGlobalHotkeys.ts`) were fixed (Sep 16, 2026): the dynamic imports were redundant — the same modules were already statically imported elsewhere in the same files.
    - `SecondaryField.vue` now statically imports `syncScrollFrom` from `useMerge` (was a dynamic `import().then()` in `onScroll`); `useGlobalHotkeys.ts` now statically imports `renderMainLines` + `scrollToActive` from `useSync` (were 4 dynamic `import().then()` calls in the navigation handlers).
    - The original comment claiming a circular dependency was wrong — `useAppState` does not import `useMerge`, so there was no cycle to break. `vite-plugin-singlefile` inlines everything for production anyway.

## Bug patterns

General bug patterns (helper-extraction can delete callees, string assembly with conditional separator, dynamic config vs hardcoded constants, braceless-if ambiguity, state-variable disagreement, useless `|| {}` after spread) have been extracted to `code-quality-SKILL.md` (Review bundle). Read that skill before patching `src/**` or `docs/index.html` to avoid re-discovering them.

App-specific bugs not yet generalizable:

- `META_RE` false positive on Genius headers: `/^\[[a-zA-Z]+:/` matches both LRC tags (`[ti:..]`) and capitalized Genius headers (`[Intro: All]`, `[Chorus:..]`). Fix is local to `_findGeniusLyricStart` using `/^\[[A-Z]/.test()` — do NOT change `META_RE` globally; 30+ other usages depend on it.

## Critical constraints

Do not violate.

- `MAX_LINES=500`. Import and paste handlers reject content over the limit with `alert`. `addSecondary()` enforces a 10-field cap (`MAX_SECONDARIES=10`).
- The remaining critical constraints are codified with full rationale in `code-quality-SKILL.md` (Review bundle) and `playwright-testing-SKILL.md` (Test bundle) — read those skills before patching. Includes:
    - single-source-of-truth for state refs
    - undo/redo single-push model
    - `applySnapshot` clearing extra secondaries
    - `beforeunload` checking all secondary textareas
    - the S3776 CC threshold of 15
    - the newline convention in LRC assembly
    - the underscore-prefix on auto-setup fixtures

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
- `sie` (sonar-issue-exporter, https://github.com/amokprime/sonar-issue-exporter) is the consolidated local CLI for fetching SonarCloud issues AND CodeQL code-scanning alerts as a single Markdown report. The `sie` report is the canonical input the user uploads after each push.
    - See `AGENTS.md` → "SonarCloud & CodeQL" for the sandbox's relationship to `sie`.
    - See `sonarqube-workflow-SKILL.md` (Review bundle) for the report format + sandbox API fallback.
    - The `sie` report goes in `archive/semantic/<version>/issues.md` (auto-increments to `issues1.md`, `issues2.md`, …). Use `sie -c` / `--clean` to drop the licensed Sonar Why/How sections before committing to a GPL-3 repo.
- The gate's workflow-name list must track the CI workflows' `name:` fields — renaming one makes the gate defer forever (staging silently stops syncing) until the list is updated.

## SonarQube / CodeQL dispositions (non-app-code)

Per-version Accept / Won't-Fix / False-Positive decisions. Read alongside `sonarqube-workflow-SKILL.md` (Review bundle) → "False positive summary" table for the general rules; entries below are the specific instances.

- Sonar gate "Coverage on New Code" (PR #11, Sep 2026): the 80%-on-new-code condition had no teeth while new code was only `.yml`/`.sh` (not coverable languages) — the modular scaffold's `src/` was the first countable JS/TS and went 0.0%, failing the gate.
    - Fixed with `-Dsonar.coverage.exclusions=src/**,vite.config.mts` in `sonarcloud.yml` (coverage measurement only — issue analysis on `src/` continues).
    - REVISIT when a coverage pipeline exists (vitest or Playwright v8 coverage, realistically Phase E or later): narrow the exclusions then; the project has never had line-coverage measurement.
- `githubactions:S8264/S8233/S6505` ×4 (deploy.yml, PR #11, Sep 2026): all fixed — workflow-level permissions split to job level (build: `contents: read`; deploy: `pages: write` + `id-token: write`), `npm ci --ignore-scripts` with the Vite build verified to work without lifecycle scripts locally.
    - Unverified until first real run: whether `configure-pages`/`upload-pages-artifact` in the build job need more than `contents: read`.
- `S7682` explicit-return ×5 (`scripts/*.sh`, 0.37.2 export, Sep 2026): Won't Fix — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: shelldre:S7682" for the snippet-caller rationale.
- `githubactions:S7631` fork-code (sync-staging.yml, 0.37.2 export): hardened with a compare-API on-main check (`repos/…/compare/main...$HEAD_SHA` must be `behind|identical`) before merging. Residual flag is Won't Fix — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: githubactions:S7631".
- `css:S4666` ×2 (`src/style.css:146/:159`, PR #11, Sep 2026): "Duplicate selector `:root`/`.dark`" — intentional. Non-blocking (maintainability code smell).
    - The shadcn-generated token blocks are deliberately separate from the LineByLine app-token blocks so a future `shadcn-vue` regeneration rewrites only its own tokens, never the app's.
    - Recommend marking False Positive; merging the blocks would remove the protection.
- Verbatim monolith port Accepts (PR #11, Sep 2026, 18 issues): `typescript:S8786` ×7, `typescript:S6594` ×7, `typescript:S6557` ×1, `typescript:S7755` ×2, `typescript:S4138` ×1 across `src/utils/lrcParser.ts`, `src/utils/pasteHandlers.ts`, `src/utils/geniusExtractor.ts`. Accept per verbatim-port rationale — modernization belongs to the post-Phase-E cutover pass (roadmap item 5).
    - `S8786` = same Won't-Fix family as the eslint-off `sonarjs/super-linear-regex` (inputs bounded by `MAX_LINES=500`).
    - `S6594` (`.match` → `.exec`) is safe for non-global regexes but diverges from verbatim bodies.
    - `S6606` (×7 in `src/config.ts`) is NOT equivalent — it coalesces `null` too, while `ensureDefaultHotkeys` checks `=== undefined` explicitly; converting would change semantics on corrupted-config edge cases.
    - `S4138` in `geniusExtractor.ts:122` — verbatim port, index used; Accept.
- `web:S7927` (`src/components/MenuBar.vue:118`, PR #11): False Positive — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: Web:S7927" for the icon-only-button rationale.
- `web:S6819` (`src/components/LeftPanel.vue`, PR #11): Accept — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: Web:S6819" (custom seek bar with mousedown+drag, the aria-accessibility skill Rule 1 documented exception). Re-flagged at `:82` then `:149`/`:151` after the tranche-4 audio wiring shifted the line — same finding.
- `web:S6819` (`src/components/HotkeyCell.vue:33`, PR #11): Fixed (Sep 2026) — a native `<button type=button>` fully covers the cell's interaction. See `code-quality-SKILL.md` (Review bundle) → "Cognitive Complexity" historical notes for the replacement.
- `typescript:S7721` ×2 (`src/composables/usePanelCollapse.ts:30/:33`, PR #11): Fixed (Sep 2026) — `setExpandRef`/`setCollapseRef` only touch module-level refs, moved to module scope.
- `web:InputWithoutLabelCheck` (`src/components/SecondaryField.vue:43`, PR #11): Fixed (Sep 2026) — `id="sec-file-${index}"` + `aria-label` "Secondary N lyrics file", mirroring the App-level `#file-picker` pattern.
- `shelldre:S7688` ×9 (`skills/delivery/scripts/{deploy,prepare,unpack}.sh`, PR #11): Fixed (Sep 2026) — `[` → `[[`. See `code-quality-SKILL.md` (Review bundle) → "Bash workflow scripts" + `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: shelldre:S7688".
- `typescript:S8786` ×2 in `src/composables/useTitle.ts:32/34` (PR #11, post-build-1): Accept — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: S8786 verbatim port" for the rationale.
- PR #11 SonarCloud remediation (Sep 2026, multi-turn): 50 → 29 OPEN issues. 21 fixed via 6 source patches + 9 delivery-script `[` → `[[` fixes.
    - useTitle: S6594×2 + S8786×2 attempted + S6582×2
    - useAppState: S6661 + S7784 + S7744
    - useAutosave: S4138 + S3776 + S6582
    - useModeSwitch: S4138
    - useAudio: S6582
    - LeftPanel.vue: S3735
    - Remaining 29 are all Accept/FP per the entries above (no blocking issues). 231/231 Vitest specs green post-patch; `vue-tsc -b` clean.
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
    - **S7927** ×1 (`MenuBar.vue` theme toggle — False Positive, icon-only button with `aria-label`). 351/351 Vitest specs green post-patch; `vue-tsc -b` clean.
- `sonarjs/void-use` ×4 (Phase E Tranche 1 session, Sep 2026): the monolith uses `void el.play()` to suppress floating-promise warnings in 4 locations — the Vue port copied these verbatim, but `eslint-plugin-sonarjs`'s `void-use` rule now catches them.
    - Locations: `App.vue:193` `playIfNotPlaying` callback, `useAudio.ts:245`/`266`/`313` in `replayActiveLine`/`doSeek`/`mountProgressDrag`.
    - Fixed by removing `void` — `no-floating-promises` is NOT enabled in the ESLint config (only `sonarjs/void-use` fired), so the bare `el.play()` is accepted by the gate.
    - The `void` operator was never functionally necessary (it just evaluated to `undefined` after the promise was already floating); removing it doesn't change runtime behavior.
    - 473/473 Vitest specs green post-fix; `vue-tsc -b` clean.

- Phase E Tranche 3 (Sep 2026, session 8): root cause found for the earlier "patches didn't work" — `deploy.sh` was missing `npm run build`. The `vite preview` server serves `dist/`; if `dist/` isn't rebuilt after source patches, Playwright tests run against the stale build.
    - Every session-8 patch (SettingsDialog watch, LeftPanel seek-offset, useGlobalHotkeys offset mode, useImport undo fix, index.html favicon) was deployed to source but never built into `dist/`.
    - Fix: `deploy.sh` now runs `npm run build` after the Vitest suite.
    - `tst-vite-log` fish function fixed: (1) `\d` → `[0-9]` (Perl regex not supported in `grep -E` — caused "stray \ before d" warning); (2) simplified grep to numbered errors + Error/Expected/Received + final counts (dropped `[N/540]` progress noise).
    - `import.test.ts` fixed: removed `pushSnapshot` assertion (the explicit push was removed from `useImport.ts` to fix the undo double-push bug; `setMainText` handles it internally).
    - `prepare.sh` ESLint + Vitest gates added: the sandbox `prepare.sh` copies patched `src/` + `tests/` into the sandbox tree and runs ESLint (autofix + gate) → vue-tsc → Vitest before zipping. If any gate fails, the zip is blocked.
    - `--update-snapshots` note: only writes baselines for `toMatchSnapshot`/`toHaveScreenshot`/`toMatchAriaSnapshot` — NOT for `toHaveValue`/`toBeVisible`/`toBeChecked` (most of our failures).
        - Tests that timeout (favicon, sync-adjust checkboxes) never reach the snapshot assertion, so `--update-snapshots` can't fix them.
- Phase E Tranche 3 (Sep 2026, session 9 — Test step): session 8's `deploy.sh` `npm run build` fix dropped Playwright failures from 307 → 254 (categories 7–12 all green). Two non-logic failures fixed this session:
    - **`typing-mode.spec.js:52 › meta-save-update` (firefox-only)**: the test monkeypatches `window.doSave` on Firefox (which blocks the download event chromium/webkit use). The Vue port's `doSave` was called via the imported reference, so the monkeypatch was never invoked.
        - **Fix**: `App.vue` exposes `window.doSave = doSave` in `onMounted` (cleared in `onBeforeUnmount` for HMR safety); `useGlobalHotkeys.ts` dispatches through `window.doSave` when set, falling back to the imported `doSave` in node unit tests (happy-dom doesn't set `window.doSave`).
        - New `src/globals.d.ts` uses `export {}` + `declare global { interface Window { doSave: () => void } }`. The `export {}` is required because `@vue/tsconfig` sets `moduleDetection: "force"` — without it, `interface Window` would be module-scoped and wouldn't merge with the global Window type.
        - `tsconfig.vitest.json` updated to include `src/globals.d.ts` so the augmentation is visible when type-checking test files importing from `src/**` (the vitest project's `include: tests/unit/**/*.ts` overrides the inherited `src/**` include, so `src/globals.d.ts` wouldn't be seen otherwise).
    - **`intervals.spec.js:79 › typing-debounce-1` (chromium-only)**: the Settings save-on-close watch (Vue async flush: `'pre'`) may not have committed `undo_debounce_ms=1` to `cfg` before the first keystroke.
        - With the stale default (150ms), the first keystroke's `scheduleInputSnapshot` timer was still pending when the second keystroke canceled it, leaving the undo stack one entry short — 2× `Control+z` went back too far (actual value was `META` instead of `META+"a"`).
        - **Fix**: added a 50ms wait after pressing Escape (to let the watch fire) + bumped the inter-keystroke wait from 20ms to 50ms (to cover the HTML5 timer clamp ~4ms + microtask queue drain + safety margin).
    - Sample test added to `tests/unit/globalHotkeys.test.ts`: verifies `window.doSave` dispatch + fallback (when unset, imported mock fires; when set, override takes precedence; after cleanup, imported mock fires again).
    - 475/475 Vitest specs green post-patch; `vue-tsc -b` clean; ESLint gate clean.
    - Remaining 254 Playwright failures: 252 × `logic.spec.js` (84 unique × 3 browsers, all `ReferenceError: X is not defined` — the LRC parsing helpers aren't exposed as window globals in the Vue port).
        - Deferred to Tranche 4, which will consolidate `logic.spec.js` into Vitest unit tests that import the functions directly.
    - Sonar transient HTTP 500 — user declined automated retry, will click "Re-run failed jobs" if it recurs.
    - `prepare.sh` awk fix: the prior `grep -oP 'deploy_file\s+\K\S+'` captured quoted filenames WITH the quotes (e.g. `"src-App.vue"`), causing the expected-files check to fail.
        - Replaced with `awk '/^deploy_file/ { gsub(/["'"'"']/, "", $2); print $2 }'` which strips quotes.
- Phase E Tranche 4 (Sep 2026, Test session): `tests/logic.spec.js` deleted — all 84 unique test cases consolidated into the Vitest unit suite.
    - 26 missing edge cases ported before deletion: `lrcParser.test.ts` (tsToMs/msToTs/isEndTs/replaceTs/stripSecLine/normalizeLrcTimestamps/collapseBlanks), `hotkeys.test.ts` (normKey/keyStr/isRestrictedForAll/isRestrictedForKey), `geniusExtractor.test.ts` (cleanGenius YMAL+section-headers), `timestampSync.test.ts` (peelLastParen paren-only+unbalanced-close-before-open).
    - Also fixed a pre-existing `sonarjs/no-duplicate-test-title` in `timestampSync.test.ts`.
    - Full suite 501/501 green (was 475 + 26 new); `vue-tsc -b` clean; `eslint src/` clean.
    - The 4 unique-to-`logic.spec.js` functions (`peelLastParen`, `batchSplitParens`, `findNextTimestampMs`, `assignInterpolatedTs`) were already covered by `tests/unit/timestampSync.test.ts` (Phase D Tranche 5). The 10 shadowed functions were already covered by existing Vitest specs.
    - `settings.spec.js:assign-conflict-tab` (webkit-only timeout) rewritten: the button-click path ("Reset defaults" → "Confirm reset") timed out because the shadcn-vue Dialog's focus trap + `v-show` reactivity (`display:none` toggle on `#s-confirm-yes`) delayed the confirm button's actionability past 30s on webkit.
        - The rewrite uses the global hotkey (`Control+Backslash`) instead, matching the `persistence` test pattern.
        - One subtlety: the capture input `stopPropagation`s on all keydown events (`useSettings.ts` line 354), so the test clicks the search field first to blur the capture input before pressing `Control+Backslash`.
        - Verified on chromium in-sandbox; webkit verification pending the user's `LBL_VITE_TARGET=1 tst` run.
    - `build-test.sh` review (the first test of the rewritten script): found a missing-comma bug on line 6 — `include+="skills/playwright-testing/SKILL.md"` lacks the leading comma, concatenating two skill paths into a single non-existent path. Both `browser-hotkey-system-SKILL.md` and `playwright-testing-SKILL.md` are missing from the bundle.
        - The fix is `include+=",skills/playwright-testing/SKILL.md"`.
        - Also: the workflow-scripts `README.md` documents `onboard.sh`/`build.sh`/`review.sh`/`test.sh`/`skills.sh` but NOT `build-test.sh` — needs a section.
        - `linebyline-SKILL.md` has no mention of the Build-Test bundle either.
        - The `AGENTS.md` path reference `scripts/build-test.sh` is correct (verified against the Onboard bundle's directory structure).
- Fish function consolidation (Sep 22, 2026, post-Tranche-4 Test session): `tst-vite` and `tst-vite-log` dropped; client `tst` is now the single headless-test function. `cgn` and `tsta` updated to Vite preview.
    - Client `tst` always targets Vite (`LBL_VITE_TARGET=1`), SSHes to Server, filters output via grep (numbered errors + Error/Expected/Received + final counts), streams live to terminal (no log file). Replaces both `tst-vite` (raw streaming) and `tst-vite-log` (buffered to `scratch/tst-vite.log` then catted).
    - `tsta` updated: builds `dist/` if missing, starts `vite preview --port 5173 --strictPort` on demand, sets `LBL_VITE_TARGET=1`, shuts down server on exit. Was previously running `npx playwright test --ui` with no server management (relied on config webServer targeting monolith `:3004`).
    - `cgn` updated: same on-demand `vite preview` pattern, targets `http://localhost:5173/linebyline/` (Vite base for GitHub Pages). Was previously targeting `http://localhost:3004/docs/index.html` (monolith).
    - Both `tsta` and `cgn` follow the user's preferred "start on demand, shut down on exit" pattern (replaces the old dedicated `srv` function).
    - `playwright.config.js` comment updated: removed `tst-vite` abbreviation reference; now documents the client `tst` fish function directly.
    - `tests/PLAYWRIGHT_SETUP.md` rewritten: section 3 (old local podman `tst` fish function) replaced with the SSH+Syncthing workflow; UI mode section updated with the new `tsta`/`cgn` functions; `tst-vite` abbreviation references removed; `findLatestVersion` references removed (was deleted from helpers, replaced by `getAppUrl()`).
    - Server `tst` bash script (`~/.local/bin/tst`) unchanged — already handles `LBL_VITE_TARGET` propagation into Podman.
- UI bug fix session (Sep 22, 2026, post-fish-consolidation): fixed Genius paste metadata extraction + active line highlighting; added `srv` fish function; documented remaining UI bugs for investigation.
    - **Genius paste metadata extraction** — `markGeniusSource()` + `extractGeniusMeta(raw)` were stubbed out as "Tranche 6 owns these" during the Phase D port but never implemented. The `paste-genius-hotkey` / `paste-genius-typing` Playwright tests caught the gap (4 failures across chromium + firefox).
        - Root cause: `_onMainLinesPasteGenius` (hotkey mode) and `onMainPaste` (typing mode) in `useSync.ts` both detected Genius content via `cleanGenius()` but only pasted the cleaned lyrics — they never extracted title/artist/album from the raw paste or appended "Genius" to the `[re:]` tag.
        - Fix: ported `markGeniusSource()` (appends "Genius" to `[re:]` once per session via `_geniusDetectedThisSession` flag) + `extractGeniusMeta(raw)` (extracts title/artist/album via `extractGeniusFields` and replaces `[ti:]`/`[ar:]`/`[al:]` only if the current value is empty or "Unknown"). Both call `setMainText` + `updateTitleFromText` to mutate the main text.
        - Also wired `markGeniusSource` as a standalone export from `useSync.ts` → `App.vue` → `useMerge.ts` callback, so secondary-field Genius paste also marks the source (matching the monolith's behavior).
        - Verified: `paste-genius-hotkey` + `paste-genius-typing` pass on chromium in-sandbox. 501/501 Vitest green; `vue-tsc -b` clean; `eslint src/` clean.
    - **Active line highlighting (blue bar)** — the `.lrc-line` CSS rules (`.cursor`, `.active`, `.end-ts`, etc.) were in `EditorArea.vue`'s `<style scoped>` block. Vue's scoped CSS adds a `data-v-*` attribute to template-rendered elements only; `renderMainLines()` in `useSync.ts` builds the `<li class="lrc-line">` children via `innerHTML`, so they don't get the scoped attribute. The scoped `.lrc-line[data-v-*]` selectors silently failed to match — no blue cursor border, no active-line background.
        - Fix: moved all `.lrc-line` rules from `<style scoped>` to a separate `<style>` (global) block in `EditorArea.vue`. Container/textarea rules stay scoped (they're template-rendered).
        - This is a general Vue gotcha: any CSS that targets innerHTML-created elements must be in a non-scoped style block. Document in `single-file-html-app-SKILL.md` (Build bundle) if this recurs.
    - **`srv` fish function** — added for MANUAL.md testing. Builds `dist/` if missing, starts `vite preview --port 5173 --strictPort` in the foreground (Ctrl+C to stop). Checks if server is already running before starting a new one.
    - **Remaining UI bugs** (observed in Codegen browser, may be Codegen-specific or real browser issues — need investigation in a future session):
        - Click-to-seek on `slider[role="Playback position"]` only seeks to halfway — likely a `useAudio.ts` `mountProgressDrag` issue with click position calculation.
        - `Ctrl`-based hotkeys (Ctrl+', Ctrl+,, Ctrl+., Ctrl+\) don't work in real browser but pass in Playwright — Playwright's `keyboard.press` dispatches synthetic events that the page intercepts; real browser Ctrl combos may be consumed by the browser/OS before reaching the page. Needs investigation of `useGlobalHotkeys.ts` event listener attachment (window vs document vs element).
        - Tab + Enter on buttons doesn't activate them — only the font dropdown worked. Likely a focus/keydown issue with shadcn-vue components.
        - Refresh doesn't reset loaded lyrics — likely `useAutosave.ts` restoring from sessionStorage on load, which is correct behavior (not a bug). Needs verification against monolith.
        - Scrolling in hotkey/typing mode at 100% zoom doesn't show all lines (need 33% zoom) — Codegen-specific; `srv` + real browser scrolls fine at 100%.
- UI regression fix session (Sep 22, 2026, second pass): fixed refresh-persists-lyrics + NOW PLAYING panel focus stealing; documented Ctrl+` browser-level issue; re-enabled Playwright in deploy.sh.
    - **Refresh persists lyrics** — the Vue port intentionally did NOT clear `sessionStorage` before `loadAutosave()` (citing "survive accidental refresh"), but the monolith DOES clear (`sessionStorage.removeItem('lbl_autosave')` at line 2821). This diverged from monolith behavior and broke the HELP.md contract: "Reloading or closing the tab resets song and lyrics from browser sessionStorage". Fix: added `sessionStorage.removeItem('lbl_autosave')` before `loadAutosave()` in `App.vue` onMounted, matching the monolith.
    - **NOW PLAYING panel buttons steal focus** — clicking speed/seek/play/seek-offset/sync-file/mute buttons gave them focus; the `isFocusedUIElement()` guard in `useGlobalHotkeys.ts` then blocked ArrowUp/ArrowDown from navigating lyric lines. Fix: added `@mousedown.prevent` to all NOW PLAYING panel buttons in `LeftPanel.vue` (matching the collapse button pattern). `@mousedown.prevent` prevents the button from receiving focus on click — the `@click` handler still fires normally. The font-size buttons in `FontSelector.vue` and the MenuBar buttons already had this or weren't reported as failing.
    - **Ctrl+` toggle panel** — works in Firefox, does nothing in Helium (Chromium-based). This is a browser-level issue: Chromium-based browsers may intercept Ctrl+` before the page receives the keydown event. Not fixable at the app level — the user would need to remap the hotkey to something else. Documented as a known limitation.
    - **Slider seek, Enter activation, hotkeys** — all work fine in real browser (Helium). The Codegen-specific failures were Playwright/Codegen browser quirks, not app bugs.
    - **MANUAL.md** expanded with new test sections: Seek bar (click position accuracy), Active line highlighting (blue border + active background), Hotkeys (real browser verification of each Ctrl combo), Refresh behavior (lyrics + audio should reset). All checkboxes reset to `[ ]` for re-verification against the Vite build.
    - **deploy.sh Playwright section re-enabled** — uncommented the Syncthing wait (`sleep 60`) + `ssh Server "LBL_VITE_TARGET=1 tst"` section in the repo's `skills/delivery/scripts/deploy.sh`. This runs the full Playwright suite against the Vite build after every deploy, catching regressions before they reach CI. The user will also re-enable `playwright.yml` by removing `if: false` after this session.
    - **Test coverage gaps** — each regression suggests a gap in automated test coverage. The missing highlighter/border was not caught by any Playwright test (screenshot tests were dropped). The nonfunctional hotkeys were not caught because Playwright's synthetic `keyboard.press` events bypass browser-level interception. The refresh-persistence was not caught because no Playwright test reloads the page and checks that lyrics are gone. These gaps should be addressed in a future Test session — add Playwright tests that: (a) verify `.lrc-line.cursor` has a visible border, (b) reload the page and verify the editor is empty, (c) verify Genius paste extracts metadata (already covered by `paste-genius-*` tests).
- **Playwright snapshot regeneration rule** (learned Sep 22, 2026): NEVER manually edit Playwright snapshot baselines. Always regenerate with `tst -g testname --update-snapshots`. Manual edits risk byte-level mismatches (trailing newlines, encoding, leading artifacts from extraction). The `--update-snapshots` flag writes the app's actual output directly to the baseline file, preserving the exact byte format. After regenerating, verify with `tst -g testname` (without `--update-snapshots`). Note: `--update-snapshots` only writes baselines for `toMatchSnapshot` / `toHaveScreenshot` / `toMatchAriaSnapshot` — NOT for `toHaveValue` / `toBeVisible` / `toBeChecked` (those are value assertions with hardcoded expected values in the test source, not snapshot files). The `tst` fish function strips a leading `--` so `tst -- --update-snapshots` also works. Document in `playwright-testing-SKILL.md` (Test bundle) when that skill is next updated.

- **Phase E Tranche 4.5 — MANUAL.md automation + Playwright test additions** (Sep 24, 2026, multi-turn session). The full implementation notes live in `ROADMAP.md` Tranche 4.5 section (the canonical home per the consolidation direction).
    - This entry records only the session-specific outcomes + the gotchas that should be extracted to `playwright-testing-SKILL.md` when that skill is next updated.
    - **Tests delivered** (16 new tests across 5 spec files, all sandbox-verified via standalone Playwright scripts against `vite preview` + chromium): `tests/playback.spec.js` (enhanced `seek-click` multi-position + new `seek-drag` + `focus-not-stolen` + `focus-not-stolen-collapse-toggle`); `tests/theme-font.spec.js` (enhanced `theme-toggle` with structural `html.dark` class assertion); `tests/sync-adjust.spec.js` (`cursor-moves-with-q-e` + `highlight-moves-with-w-enter` + `active-line-cursor-border` with `toHaveCSS` in light + dark themes); `tests/keyboard-nav.spec.js` (`toggle-panel-ctrl-shift-tilde`); `tests/settings.spec.js` (`hotkey-search-mode-toggle`); `tests/import-paste.spec.js` (`import-10k-blocking`); `tests/undo-redo.spec.js` (4 typing-debounce tests); `tests/reset.spec.js` (merged `beforeunload` + `refresh-behavior` — `reload-clears-lyrics-audio` + `new-tab-starts-fresh` + `beforeunload-on-close-dirty`).
    - **MANUAL.md pruned**: automated items removed; kept real-browser-only items (file picker OS dialog, playback audio output, instant replay timing, Ctrl+;/Ctrl+O file picker, real Genius paste, unsaved work warning actual clicks). File reduced from 97 to 52 lines.
    - **ESLint scope extended** in `prepare.sh`/`deploy.sh` from `src/` to `src/ tests/`. `eslint.config.mjs` updated: turned off `sonarjs/no-fixed-wait-in-tests` + `sonarjs/no-skipped-tests` for `tests/**/*.spec.js` (intentional for clipboard/debounce timing + webkit skip); `sonarjs/no-floating-point-equality` + `sonarjs/parameterized-tests` off for `tests/unit/**/*.ts` (intentional audio comparisons + style preference); `sonarjs/prefer-specific-assertions` + `sonarjs/void-use` left as warnings for Tranche 4.7 triage.
    - **S7630 fix delivered**: `playwright-snapshot-regen (fixed).yml` → `.github/workflows/playwright-snapshot-regen.yml`. Pattern: move `${{ inputs.* }}` in `run:` blocks to `env:` + `$VAR` shell expansion. Skill update added to `sonarqube-workflow-SKILL.md` (rules table + Step 3 + false-positive summary).
    - **Tranche 4.6/4.7/4.8 added to ROADMAP**: 4.6 = git-based context loading + context-file refactor (the Repomix-vs-git-clone decision + the context-file consolidation sketch — git clone wins); 4.7 = Sonar remediation + ARIA label coverage (target OPEN ≤10, `aria-label` on all `title=`-only buttons); 4.8 = mutation testing (optional — alternative is stronger assertions like `sessionStorage.getItem('lbl_autosave')` null check).
    - **Gotchas to extract to `playwright-testing-SKILL.md`** (Test bundle) when that skill is next updated: (1) audio element NOT in DOM (`new Audio()` without append) — use `#time-pos`/`#time-dur`/`#vol-slider`/`#speed-val` display elements + `waitForTimeout(100)` to settle, NOT `document.querySelector("audio")` (returns null) or `triggerTimeUpdate` (no-op); (2) buttons with `title=` but no `aria-label` have accessible name from text content (`▲`/`▼`) — use `button[title="..."]` or `#id` for dynamic-title buttons, NOT `getByRole("button", { name: ... })`; (3) `triggerTimeUpdate` is a no-op when audio is not in DOM — use real playback (Space + 300ms wait + Space) to fire real `timeupdate` for `.active` class assignment; (4) headless chromium suppresses beforeunload dialogs — verify handler via synthetic `new Event('beforeunload', { cancelable: true })` dispatch + `preventDefault` check; (5) hotkey search mode: `` ` `` enters hk mode in normal mode, but Escape (not `` ` ``) exits — `` ` `` in hk mode sets the search query to `` ` ``.
    - **Mutation-testing finding** (documented in ROADMAP Tranche 4.5 + 4.8 + LIMITATIONS.md): the `reload-clears-lyrics-audio` test passes whether or not `sessionStorage.removeItem('lbl_autosave')` is present — the test verifies behavior but doesn't pin the mechanism. The autosave isn't written during the fast test import cycle, so `removeItem`'s presence/absence doesn't change the outcome. The cheaper alternative to a mutation framework is adding `expect(page.evaluate(() => sessionStorage.getItem('lbl_autosave'))).toBeNull()` to pin the mechanism.
    - **Root `index.html` IS in the staging branch** (correction to an earlier wrong claim): the staging branch has a root `index.html` (the Vite entry point with the favicon + `<div id="app">` + `/src/main.ts` script). My earlier "should NOT be pushed" advice was about the SANDBOX-only `index.html` I created as a workaround for the Repomix bundle's missing entry — that was wrong; the repo's root `index.html` is the real Vite entry and MUST be preserved. The user trashed it (following my wrong advice) which broke the Vite build. This turn delivers the correct root `index.html` from staging to restore the build.

- **Phase E Tranche 4.5 — second dogfooding pass** (Oct 7, 2026 session): fixed 2 regressions + 3 latent issues discovered while dogfooding the Vite build. App version bumped 1.0.0 → 1.0.1. The full implementation notes live in `ROADMAP.md` Tranche 4.5 section (canonical home per the consolidation direction); this entry records session-specific outcomes + gotchas.
    - **Regression 1: highlight row hidden when cursor on same line** — `.lrc-line.cursor` (background: var(--background)) overrode `.lrc-line.active` (background: var(--active-bg)) on equal specificity (0,2,0) since `.cursor` is later in source order. When a line had BOTH classes (cursor + active coincide — e.g., `togglePlay` sets `playingLine = activeLine` on Space), the cursor's background won, hiding the highlight row. Fix: added `background: var(--active-bg); color: var(--active-text); font-weight: 600;` to the `.lrc-line.active.cursor` rule in `EditorArea.vue`'s global `<style>` block. The monolith has the same CSS specificity but the user didn't notice because `syncLine` auto-advances the cursor separately so cursor + active rarely coincided; the Vue port's `togglePlay` immediately puts both on the same line, surfacing the bug.
    - **Regression 2: app version missing from browser tab title** — `index.html` had `<title>LineByLine</title>` (no version), vs the monolith's `<title>LineByLine 0.37.2</title>`. Fix: hardcoded the version in `index.html` (matches the monolith convention — bump `package.json` + `index.html` together). 1.0.0 → 1.0.1.
    - **Latent 1+2: Ctrl+Space did nothing useful / no way to play from slider position** — the dispatch table had `[hk.play_pause_alt]: togglePlay`, but `togglePlay` seeks to activeLine's ts. The user wanted a way to start playback from current audio slider position (whatever they dragged to) instead of jumping to the focused line's timestamp. Fix: added `togglePlayFromSlider()` to `useAudio.ts` (plays from `audioEl.currentTime` without seeking, then calls `updateActiveLineFromTime(currentTime * 1000)` to sync `playingLine`); rebound `Ctrl+Space` to it (was `togglePlay`). `Space` stays bound to `togglePlay` (existing seek-to-activeLine behavior). `lastPlayingLine` follows `activeLine` so a subsequent Space at the same line resumes from current audio position (togglePlay's isCurrentLine branch).
    - **Latent 3: cursor doesn't follow highlighter during playback** — `updateActiveLineFromTime` only updated `playingLine` (.active), not `activeLine` (.cursor). The user had to manually follow the progressing song while syncing. Fix: in `updateActiveLineFromTime`, after `playingLine.value = best`, also set `activeLine.value = best` IF `best > activeLine.value` AND `!isAutoLineSuppressed()`. Edge cases per the user's spec: (1) song start, no highlighter yet — `best === -1` returns early, cursor stays; (2) re-syncing a line above cursor — `syncLine` sets `playingLine` directly, bypassing this fn, no race; (3) manual nav during playback auto-pauses (see next bullet).
    - **Latent 3 edge 3: auto-pause on first nav key press during playback** — added `pauseIfPlaying()` to `useAudio.ts` (pauses + returns true if was playing, no-op + returns false if already paused). Called at the top of `handleHotkeyModeNav` in `useGlobalHotkeys.ts` (covers Home/End/PageUp/PageDown + delegates ArrowUp/Down to `handleHotkeyModeArrows`). Called in `seekPrevLine`/`seekNextLine` (Q/E) only when their respective `replay_prev_line`/`replay_next_line` flags are off — when replay is on, the user wants seek+play at the new line, not auto-pause. After auto-pause, the cursor is decoupled from the highlighter; `Space` resumes via `togglePlay`'s existing logic (seek to activeLine's ts if activeLine !== lastPlayingLine, else resume from current audio position). The existing `togglePlay` already implements the user's "navigate back + Space to cancel move and resume at previous position" path: `isCurrentLine = (activeLine === lastPlayingLine)` → no seek.
    - **Tests delivered**: Vitest 515/515 green (was 501 + 14 new); `vue-tsc -b` clean; ESLint clean; sandbox sample Playwright 10/10 green against `vite preview` dist/. Vitest additions — `audio.test.ts` +5 (`pauseIfPlaying`, `togglePlayFromSlider`); `useSync.test.ts` +5 (cursor-follows-highlighter down/up/suppressed/no-highlighter + 5 auto-pause-on-nav scenarios); `globalHotkeys.test.ts` mock updated to expose `togglePlayFromSlider` + `pauseIfPlaying`. Playwright additions — `smoke.spec.js:title has app version`; `sync-adjust.spec.js`: `highlight-row-visible-when-cursor-on-same-line` (toHaveCSS on .active background), `cursor-follows-highlighter-down`, `auto-pause-on-arrow-down-during-playback`, `space-resumes-at-new-cursor-after-auto-pause`, `space-resumes-at-paused-position-when-cursor-unchanged`; `playback.spec.js:ctrl-space-plays-from-slider-position`. All structural assertions (`toHaveCSS`, `toHaveText`, `toHaveClass`) — no new snapshots to regenerate.
    - **Gotcha — `fmtTime` always pads seconds to 2 digits**: assertions like `/^0:[67]$/` (single-digit seconds) fail; use `/^0:0[67]$/` instead. The first sample-test pass caught this on the `ctrl-space-plays-from-slider-position` and `space-resumes-at-new-cursor-after-auto-pause` tests.
    - **Gotcha — `togglePlayFromSlider`'s `updateActiveLineFromTime` call triggers cursor-follows-highlighter**: when the audio is at a different line than the cursor (slider dragged elsewhere), the cursor will jump to the audio's current line on `Shift+Space`. This is desired (cursor tracks playback) but surprised the test flow — the `cursor-follows-highlighter-down` test needed a `Home` reset before each sub-test to keep the cursor predictable.
    - **Files touched**: `index.html`, `package.json`, `src/components/EditorArea.vue`, `src/composables/useAudio.ts`, `src/composables/useGlobalHotkeys.ts`, `src/composables/useSync.ts`, `tests/unit/audio.test.ts`, `tests/unit/useSync.test.ts`, `tests/unit/globalHotkeys.test.ts`, `tests/smoke.spec.js`, `tests/sync-adjust.spec.js`, `tests/playback.spec.js`.

- **Ruff not detected in bwrap sandbox** (Oct 7, 2026, resolved by OMP agent): the lint gate reported "ruff not installed" inside bwrap despite `~/.local/bin/ruff` existing on the host. Root cause: `~/.local/bin/ruff` is a **symlink** to `~/.local/share/uv/tools/ruff/bin/ruff` (installed via `uv`). `unpack.sh` bound only `~/.local/bin` into bwrap — the bind cloned the symlink but NOT its target, so the symlink dangled inside the sandbox. `command -v ruff`, `test -x`, and `test -f` all failed (`ENOENT` via the dangling symlink), but `ls -l` still showed the entry (which is why debug output said "missing" instead of "dangling"). Fix: bind all of `~/.local` read-only (`--ro-bind "$HOME/.local" "$HOME/.local"`) so symlink targets under `~/.local/share/` resolve. Also added dangling-symlink detection in `lint_gate.sh` debug output (`-L` + `! -e` → "DANGLING symlink -> `<target>`"). The handoff + mockup tests are at `scratch/ruff-mockup/` + `archive/modular/plan/3-Modular-Stack-Refactor/14.1.md`.
    - **Lesson**: bwrap `--ro-bind` of a directory containing symlinks does NOT carry the symlink targets if they live outside the bound path. Bind the parent directory that contains both the symlinks and their targets. General rule for `~/.local`: bind `~/.local` (not `~/.local/bin`) so `pip install --user` / `uv tool install` symlinks resolve.
    - **Latent bug flagged (not fixed)**: the lint gate returns rc=0 ("PASSED") when Ruff is skipped. A repo expecting Python linting gets a silent pass. The user may want to make Ruff a blocking requirement (rc=1 if Ruff is expected but not found) in a future tranche.

## Delivery script hardening (Sep 2026)

- **S2083 path-traversal fix (split_bullets.py + lint_markdown.py, Sep 2026)** — SonarCloud's `python:S2083` rule flags CLI scripts that pass `sys.argv` to `open()`/`Path.read_text()`/`Path.write_text()` without visible path validation.
    - See `sonarqube-workflow-SKILL.md` (Review bundle) → "Taint analysis rules" for the canonical fix pattern: inline `os.path.realpath` derivation + guard + I/O in the same function body.
    - Taint analysis does not cross function boundaries or recognize module-level constants.
- `deploy.sh` cleanup loop replaced `find . -maxdepth 1 -type f ! -name deploy.sh ! -name deliver.zip` with the zip's own file list via `unzip -Z1` (or a `.deliver-files.list` manifest written before extraction). Pre-existing `scratch/` files like `scratch.md` are NOT touched. General rule in `code-quality-SKILL.md` (Review bundle) → "Bash workflow scripts → Scoped cleanup".
- `unpack.sh` trap changed from `trap cleanup INT TERM` to `trap cleanup EXIT` (Sep 2026, Phase E Tranche 1 session).
    - Previous design left `deliver.zip` + `deploy.sh` behind on `set -e` failure ("for debugging"), but this caused stale-file collisions: the next `deliver.zip` download got autonamed `deliver(1).zip` by the KDE file picker, requiring manual rename before `dpl`.
    - The EXIT trap cleans up on ALL exits (success, failure, signal) — `deploy.sh` is regenerated each session and `deliver.zip` is re-downloaded from the chat, so there's no debugging value in leaving them behind.
    - The `echo "Done."` at the end of `unpack.sh` only prints on success (on failure, `set -e` exits before reaching it, but the EXIT trap still fires cleanup).
- Syncthing `sleep 60` + Playwright `ssh Server tst` blocks in `unpack.sh` are commented out for `src/**` patches — Playwright targets `docs/index.html` until Phase E (per "Project invariants"), so running it on `src/**` patches is ~8.3 minutes wasted per deploy.
    - Re-enable both post-Phase E (replace `sleep 60` with Syncthing REST API polling: trigger rescan via `curl -X POST -H "X-API-Key: $KEY" "http://127.0.0.1:8384/rest/db/scan?folder=$LBL_ID"`, poll `/rest/db/completion?folder=$LBL_ID&device=$SERVER_ID` until `.completion == 100`).
- The prior "unpack.sh hung" report was actually 8.3 minutes of Playwright tests, not a real hang — the user's Ctrl+C during the (then-commented-out) test line was actually during the `sleep 60` Syncthing wait. Trap kept as defensive.
- A `known_dupes=()` cleanup section in each per-session `deploy.sh` auto-removes legacy misdeploy folders from the build-2 era.
    - The build-2 root cause was an `issue_folder_name.py` "conservative extension" that stripped bash-unsafe chars (single quote, backtick, dollar, parens, double quote — regex `r'[<>:"/\|?*\'$()]'`) from folder names, breaking the match with `export_sonar_issue.py`'s convention (which preserves these chars — its regex is just `r'[<>:"/\|?*]'`).
    - Build-3 reverted the helper + added `shlex.quote()` for bash safety.
    - The `KNOWN_DUPES` list is persistent — append future misdeploys to `generate_deploy_v2.py` so cleanup runs every deploy.

## Vitest unit suite in-sandbox

Required files for the Build Repomix bundle (so the agent can run `npm install && npm run test:unit` after patching `src/` modules):

`package.json`, `package-lock.json` (if not gitignored), `eslint.config.mjs`, `vite.config.mts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json`, `src/**`, `tests/unit/**`, `tests/helpers/index.js`, `tests/helpers/package.json`.

Gotcha: the `.gitignore` `*genius*` pattern excludes `src/utils/geniusExtractor.ts` from Repomix — the user must add a negation pattern or include it explicitly.

**ESLint in-sandbox** (Sep 2026, Phase E Tranche 1 session): `eslint.config.mjs` is now included in the Build Repomix bundle. Run `./node_modules/.bin/eslint src/ --fix` (autofix) then `./node_modules/.bin/eslint src/` (gate) in-sandbox BEFORE `npm run test:unit` — this catches `sonarjs/*` rule violations early and reduces back-and-forth turns (the `deploy.sh` ESLint gate would otherwise fail on the user's machine, leaving stale `deliver.zip` + `deploy.sh` in `scratch/`). The sandbox ESLint run mirrors the `deploy.sh` gate exactly: same config, same `src/` scope, same `--fix` then gate pattern. If the sandbox ESLint passes, the `deploy.sh` ESLint gate will pass too (the only difference is the sandbox doesn't have `node_modules/.bin/eslint` until `npm install` runs — run `npm install --ignore-scripts` first, then ESLint, then Vitest).

For the workflow (when to run the suite, scope of coverage) see the `playwright-testing` skill → "Sandbox-side sample tests" and `linebyline-SKILL.md` → "Post-patch verification".

## AI scaffolding refactor (Tranche 4.6, Sep 29, 2026)

- **Scope**: dropped legacy claude.ai / OMP / ZCode harness scaffolding; flattened chat.z.ai context files to repo root; packaged delivery scripts as a `skills/delivery/` skill; added `scripts/.setup-sandbox.sh` for auto-loading project skills into `/home/z/my-project/skills/`; fixed references to user-side-only tools so a fresh sandbox agent knows which commands run in-sandbox vs. user-side; replaced Repomix-bundle workflow with Espanso-snippet pointer-based workflow (`scripts/espanso/linebyline.yml`).
- **Deleted**: `.omp/`, `.zcode/`, `ai/claude.ai/`, `ai/omp/`, `ai/zcode/`, `ai/chat.z.ai/` (after extracting its files to root), `skills/web-channel/` (merged into `skills/delivery/`), Repomix workflow scripts (`scripts/{onboard,build,test,review,skills,build-test}.sh` — kept `.base.sh` + `blank.sh` as pure-zip utility).
- **Moved to root**: `AGENTS.md`, `MEMORY.md`.
- **Moved to `skills/<name>/SKILL.md`**: 9 skills + new `delivery` skill (10 total). Delivery scripts packaged at `skills/delivery/scripts/`.
- **Moved to `scripts/`**: fish functions + `.base.sh` + `blank.sh` + `.setup-sandbox.sh` + `espanso/linebyline.yml`.
- **Moved to `ai/`**: `Vibecoding workflow.md` (kept space in filename), `Diagrammo-flowcharts.md`, `README.md`.
- **Moved to `archive/`**: `archive/skills-chat/`, `archive/scripts-chat/`, `archive/tests/` (from `tests/chat/`), `archive/scripts/autohotkey/` (from `archive/autohotkey/`).
- **Linter fix**: `lint_markdown.py` now skips YAML frontmatter and warns-only for `[[wikilink]]` (does NOT auto-wrap — `[[...]]` is intentional Obsidian syntax). Previously broke real wikilinks in frontmatter `links:` and body text.
- **Shellcheck added to prepare.sh**: catches future bash script issues in `deploy.sh` + `*.sh` deliverables.
- **Deferred to Tranche 4.6.1**: git clone + `deliver.zip` → `git push` replacement. The `deliver.zip` + `dpl` workflow remains in place.
- **deliver-checklist audit**: `.zcode/skills/deliver-checklist/SKILL.md` was largely duplicated by `linebyline-SKILL.md`'s Pre-patch/Post-patch/Post-turn sections. NOT migrated — deleted with `.zcode/`. Unique bits should be merged into `linebyline-SKILL.md` in a future session if desired.
- **Detailed plan + status**: `ROADMAP.md` → "Tranche 4.6" section.
- **Setup script**: `scripts/.setup-sandbox.sh` copies project skills into `/home/z/my-project/skills/` at session start so their `description` frontmatter auto-loads into `available_skills`. Run once per session (sandboxes expire after 2h). Idempotent.

## Project invariants

- All app code lives at `docs/index.html` until the item-3 modular cutover (Phase E); `src/` is scaffold-only until Phase C. No external font dependencies, no Python/PyQt port. The Python port was abandoned in 0.34.5; web is the only forward path.
- App version is encoded in `<title>` (not the filename) — see `linebyline-SKILL.md` → "Versioning" for the semver rules and where to apply the bump. The HTML file is always `docs/index.html` — overwrite it in place, don't create a versioned copy.
- The app is LRC-focused, but has Genius paste. Genius scraping is delegated to a browser extension (cross-origin blocks prevent in-app fetching); in-app extraction is structural parsing of pasted text.

## TypeScript / tooling config

- `tsconfig.vitest.json` (Sep 2026): all `@/*` alias imports live in `tests/unit/*.test.ts` (src uses relative imports), but `tsconfig.app.json` includes only `src/**` — the test files belonged to no TS project, so Zed's language server type-checked them as an inferred project without the paths alias or `vite/client` types → ts2307 "Cannot find module `@/components/…'".
    - Fixed by adding `tsconfig.vitest.json` (extends `tsconfig.app.json`, `include: tests/unit/**/*.ts`) referenced from the root `tsconfig.json` — same solution pattern create-vue ships.
    - Builds via `vue-tsc -b` now type-check the unit tests too (they are strict-clean).
- `tsconfig.node.json` is referenced from root `tsconfig.json` but is for Vite's own config file (`vite.config.mts`). Must be included in the Build Repomix or Vitest fails with "Failed to load tsconfig 'tsconfig.node.json'".
