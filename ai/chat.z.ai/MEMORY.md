
# LineByLine — durable memory seed

Harness-agnostic, git-tracked memory for AI coding agents. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update this file. The web-channel agent edits its sandbox copy and produces it in `download/` for the user to apply to the repo.

## Bundle map

The chat.z.ai web channel workflow ships context in isolated Repomix bundles, one per vibecoding step (see `ai/chat.z.ai/Vibecoding workflow.md`, Skills bundle, and `ai/chat.z.ai/scripts/README.md`, Skills bundle, for the canonical step flow). A fresh chat session at Onboard has ONLY the Onboard bundle. Pointers to files in other bundles are annotated with the bundle name in parentheses — wait for that step's bundle upload (or ask the user to upload it explicitly) before reading the target.

| Bundle | Step | Files included |
|---|---|---|
| Onboard | every session start | `package.json`, `README.md`, `ai/chat.z.ai/{AGENTS,MEMORY}.md`, `ai/chat.z.ai/skills/{project-workflow,web-channel,skill}-SKILL.md`, `ai/chat.z.ai/scripts/delivery/{prepare,deploy,unpack}.sh`, `archive/modular/plan/**` (includes `0-Roadmap.md`) |
| Build | Build step | `ai/chat.z.ai/skills/{linebyline-section-index,single-file-html-app,browser-hotkey-system}-SKILL.md`, `docs/index.html`, `src/**`, `vite.config.mts`, `tsconfig*.json`, `tests/unit/**`, `tests/helpers/**` |
| Review | Review step | `ai/chat.z.ai/skills/{aria-accessibility,code-quality,sonarqube-workflow}-SKILL.md` |
| Test | Test step | `ai/chat.z.ai/skills/playwright-testing-SKILL.md`, `tests/**` (minus snapshots), `playwright.config.js` |
| Skills | Skills step | `CONTRIBUTING.md`, `ai/chat.z.ai/**` (excludes `project-workflow-SKILL.md`, `skill-SKILL.md`, `chat/`, `scripts/chat/`) |

## Knowledge map

Skill pointers below are annotated with the bundle that ships each skill. Onboard-bundle skills are immediately readable at Onboard step; the others require their step's bundle upload before they can be read.

- `project-workflow-SKILL.md` (Onboard bundle) — Repomix workflow steps (Onboard / Build / Review / Test / Skills / Propose), pre/post-patch checklists, post-turn updates, deliver-zip pattern.
- `web-channel-SKILL.md` (Onboard bundle) — chat.z.ai web channel rules (download visibility, input handling, output format, comment density).
- `skill-SKILL.md` (Onboard bundle) — when to create or update skills vs. MEMORY.md entries; skill anatomy and writing style.
- `linebyline-section-index-SKILL.md` (Build bundle) — section-name grep protocol + prompt-to-section map for `docs/index.html`.
- `single-file-html-app-SKILL.md` (Build bundle) — file structure, CSS architecture, snapshot undo/redo, file import/export, init sequence, common pitfalls.
- `browser-hotkey-system-SKILL.md` (Build bundle) — key normalization, restriction rules, capture-input behavior, conflict swap, modal focus trap, typing-mode overlays.
- `aria-accessibility-SKILL.md` (Review bundle) — Rules 1–9 covering semantic HTML, accessible names, dialog/modals, live regions, `inert` panels.
- `code-quality-SKILL.md` (Review bundle) — code quality patterns, bug classes, undo/redo, config migration, Bash workflow script rules.
- `sonarqube-workflow-SKILL.md` (Review bundle) — `sie` report format, sandbox SonarCloud API protocol, per-rule triage table (with false-positive summary), taint-analysis rules.
- `playwright-testing-SKILL.md` (Test bundle) — test infrastructure, snapshot strategy, font-fragile screenshots, TS diagnostics setup.

## Architectural decisions

The full architectural state for the modular refactor — Phase A scaffold, Phase B theme tokens, Phase C tranches (all done), Phase D tranches 1–9 (Tranche 9 done), Phase E Tranche 1 done (beforeunload/isDirty wiring), Tranche 2 done (Playwright retarget to Vite preview), Tranches 3–8 planned, deploy pattern — lives in `archive/modular/plan/0-Roadmap.md` (Onboard bundle). The roadmap is the single source of truth; MEMORY.md no longer duplicates it. The roadmap carries implementation-level detail (test infrastructure quirks, port deltas per tranche, file lists per tranche) that this file previously condensed into a parallel summary, creating a synchronization burden.

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
- `S7682` explicit-return ×5 (`ai/chat.z.ai/scripts/*.sh`, 0.37.2 export, Sep 2026): Won't Fix — see `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: shelldre:S7682" for the snippet-caller rationale.
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
- `shelldre:S7688` ×9 (`ai/chat.z.ai/scripts/delivery/{deploy,prepare,unpack}.sh`, PR #11): Fixed (Sep 2026) — `[` → `[[`. See `code-quality-SKILL.md` (Review bundle) → "Bash workflow scripts" + `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: shelldre:S7688".
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

For the workflow (when to run the suite, scope of coverage) see `AGENTS.md` → "Running LineByLine tests" and `project-workflow-SKILL.md` (Onboard bundle) → "Post-patch verification".

## Project invariants

- All app code lives at `docs/index.html` until the item-3 modular cutover (Phase E); `src/` is scaffold-only until Phase C. No external font dependencies, no Python/PyQt port. The Python port was abandoned in 0.34.5; web is the only forward path.
- App version is encoded in `<title>` (not the filename) — see `project-workflow-SKILL.md` (Onboard bundle) → "Versioning" for the semver rules and where to apply the bump. The HTML file is always `docs/index.html` — overwrite it in place, don't create a versioned copy.
- The app is LRC-focused, but has Genius paste. Genius scraping is delegated to a browser extension (cross-origin blocks prevent in-app fetching); in-app extraction is structural parsing of pasted text.

## TypeScript / tooling config

- `tsconfig.vitest.json` (Sep 2026): all `@/*` alias imports live in `tests/unit/*.test.ts` (src uses relative imports), but `tsconfig.app.json` includes only `src/**` — the test files belonged to no TS project, so Zed's language server type-checked them as an inferred project without the paths alias or `vite/client` types → ts2307 "Cannot find module `@/components/…'".
    - Fixed by adding `tsconfig.vitest.json` (extends `tsconfig.app.json`, `include: tests/unit/**/*.ts`) referenced from the root `tsconfig.json` — same solution pattern create-vue ships.
    - Builds via `vue-tsc -b` now type-check the unit tests too (they are strict-clean).
- `tsconfig.node.json` is referenced from root `tsconfig.json` but is for Vite's own config file (`vite.config.mts`). Must be included in the Build Repomix or Vitest fails with "Failed to load tsconfig 'tsconfig.node.json'".
