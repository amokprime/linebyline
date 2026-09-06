# LineByLine — durable memory seed

Harness-agnostic, git-tracked memory for AI coding agents. ZCode bootstraps its machine-local memory from this file; OMP's frozen snapshot of the same content lives at `ai/omp/learned.md`. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update this file.

## Architectural decisions

- Modular stack scaffold (item 3 Phase A, Sep 2026): Vite 8 + Vue 3.5 + TS 6 + Tailwind v4 + shadcn-vue 2.8 (reka-nova style, neutral base) scaffolded at repo root — src/, vite.config.mts, tsconfig{,.app,.node}.json, components.json, deploy.yml (workflow_dispatch ONLY until the Phase E cutover). package.json keeps "type": "commonjs" until item 4 converts the CJS Playwright tests, hence vite.config.mts (ESM per-file). shadcn init's Google Fonts (Geist) import was removed — no external fonts; re-delete it if `shadcn-vue add` re-adds one. The shadcn-vue CLI (devDep) carries 7 moderate npm-audit findings via vue-metamorph→stylus→decode-uri-component — dismiss Dependabot alerts on it as dev dependency. Status + gotchas: archive/modular/plan/0-Roadmap.md item 3, "Phase A implementation notes".
- activeLine / playingLine split (0.35.13): activeLine = navigation cursor (.cursor class), playingLine = audio highlight (.active class). Navigation moves the cursor; only sync, play, and click set the playing highlight. updateActiveLineFromTime places the highlight when audio reaches lineTs.
- insertEndLine three-tier logic (0.35.13): (1) if activeLine is a trailing ts, update in place; (2) if the next non-blank line after activeLine is a trailing ts, update in place; (3) otherwise insert new.
- TYPING_AVAILABLE set (0.37.0): keeps play_pause, prev_line, next_line enabled in Typing mode with mode-specific hotkey displays. play_pause shows Space in hotkey mode, Ctrl+Space (from play_pause_alt) in typing mode. prev_line shows Q ↑ in hotkey mode, ↑ only in typing mode. next_line shows E ↓ in hotkey mode, ↓ only in typing mode.
- Swap-button conflict resolution (0.37.0): when a conflict is detected, the Swap button swaps hotkeys between the current action and the conflicting action — no blank hotkeys left over. Reset-to-default uses the same swap pattern (gives any holder of that default its own default back).
- hasLyricContent() guard (0.35.11): prevents syncLine, insertEndLine, maybeAppendTrailingTs from inserting useless [00:00.00] lines when no line has text content.
- All assembly-site newline convention (0.35.11): all four LRC assembly sites (import, paste, merge, sync) use exactly one blank separator line. The shared helper is mergedMeta.trimEnd() + '\n\n' + lyrics.

## Bug patterns

Fix once, audit after every refactor.

- Helper extraction can delete callees. _peelLastParen was deleted during Stage C refactoring (0.35.15) and broke batchSplitParens at runtime. After extracting any helper, audit all pre-existing callees in the refactored section. Codified in code-quality skill.
- String assembly with conditional separator: tsPrefix + ' ' + content with .replace(/^ /,'') strips the space from [mm:ss.cc] text when content is non-empty but no paren groups. Fix: tsPrefix + (tsPrefix && content ? ' ' + content : content). Codified in code-quality skill.
- Dynamic config reads vs hardcoded constants. Reading DEFAULT_META (constant) instead of cfg.default_meta (live value) means UI changes have no effect. Codified in code-quality skill.
- Braceless-if ambiguity (S2681). A single-line if(x)y; makes the following statement look conditional. Always use braces. Codified in code-quality skill.
- META_RE false positive on Genius headers. /^\[[a-zA-Z]+:/ matches both LRC tags ([ti:..]) and capitalized Genius headers ([Intro: All], [Chorus:..]). Fix is local to _findGeniusLyricStart using /^\[[A-Z]/.test() — do NOT change META_RE globally, 30+ other usages depend on it.
- State variable disagreement. When two variables track the same concept (e.g. masterVolume + masterMuted), they can disagree, causing subtle bugs. Pick one as authoritative; derive the rest. Codified in code-quality skill.

## Critical constraints

Do not violate.

- MAX_LINES=500. Import and paste handlers reject content over the limit with alert. addSecondary() enforces a 10-field cap.
- Test entry point is agent-tst, never raw npx playwright. The wrapper hides the SSH test infrastructure; bypassing it triggers a master-key path. See AGENTS.md.
- Underscore prefix on auto-setup fixtures. Renaming workaroundPaste to _workaroundPaste silences tsserver TS6133.
- SonarQube S3776 CC threshold = 15 per function. Helper extraction and dispatch tables are the durable mitigations. See code-quality skill.
- Undo/redo single-push model (post-change only), except for wholesale content replacement (import, merge, paste) which needs pre + post. See code-quality skill.
- applySnapshot must clear extra secondaries beyond snapshot's secondaries.length, or undoing to a pre-add snapshot leaves stale content in still-visible textareas.
- beforeunload must check all secondary textareas, not just the main one, or secondary work is lost without warning.
- All four LRC assembly sites (import, paste, merge, sync) use mergedMeta.trimEnd() + '\n\n' + lyrics for exactly one blank separator. Inconsistent separator counts cause blank-line mismatches between main and secondary fields.

## CI & repo automation

- sync-staging.yml (Sep 2026) auto-merges main into staging: fires on workflow_run completion of the three CI workflows (Playwright Tests, CodeQL Advanced, SonarCloud analysis), gates on all three succeeding for the same head_sha (plus a compare-API check that the SHA is on main), then merges that verified SHA into staging. Safe by construction: a workflow_run workflow only ever fires from its default-branch copy (staging's copy is inert), the bot's GITHUB_TOKEN push to staging triggers no CI (no recursion), and staging runs never influence the gate.
- Gate semantics (reworked after its first 6 runs all false-failed): only KNOWN failure conclusions (failure, cancelled, timed_out, startup_failure, stale, action_required) go red; anything unsettled or unreadable — in_progress, missing, empty string — defers green (ready=false), relying on the completing workflow's own completion event to re-trigger. workflow_run fires once per completing CI workflow, so each push produces up to 3 sync runs (defer, defer, merge) — that pattern is normal, not failures.
- Bug pattern that caused those false reds: `jq -r --argjson data "$x" '…'` without `-n` reads STDIN — in a GitHub Actions run step stdin is empty, so the filter never executes: exit 0, zero output, silent empty string. Any jq invocation whose input comes from --argjson/--arg must use `-n`. shellcheck and YAML parsing did not catch it; validate workflow run steps by executing them (against live or fixture data), not just linting them.
- sonarcloud.yml fails the build on a red quality gate (sonarqube-quality-gate-action, pinned v1.2.1, added Sep 2026) — that is how "Sonar failed" reaches the staging sync gate; the scan action alone exits 0 regardless of gate state. Two separate "Sonar" indicators exist: the Actions workflow conclusion (immutable, gate-blocking since this change) and the SonarCloud GitHub App's commit check "SonarCloud Code Analysis" (retroactive — recomputed when issues are resolved, no new scan needed; the sync gate does not read it). Consequence of gate-blocking: a main push with uncurated new issues fails the workflow and blocks sync; after fixing/marking the issues, re-run the SonarCloud workflow (workflow_dispatch is enabled) or push again to sync staging.
- The gate's workflow-name list must track the CI workflows' `name:` fields — renaming one makes the gate defer forever (staging silently stops syncing) until the list is updated.

## SonarQube dispositions (non-app-code)

- githubactions:S8264/S8233/S6505 ×4 (deploy.yml, PR #11, Sep 2026): all fixed, none Won't Fix — workflow-level permissions split to job level (build: `contents: read`; deploy: `pages: write` + `id-token: write`), `npm ci --ignore-scripts` with the Vite build verified to work without lifecycle scripts locally. Unverified until first real run: whether configure-pages/upload-pages-artifact in the build job need more than `contents: read` — if the Phase E smoke test 403s there, add `pages: write` to the build job (job-level stays rule-compliant).
- S7682 explicit-return ×5 (ai/chat.z.ai/scripts/*.sh, 0.37.2 export, Sep 2026): Won't Fix — .base.sh runs `set -e` then calls snippet; the function's exit status is intentionally its last command's (repomix), and an explicit `return 0` would mask a repomix failure and zip/copy missing output.
- githubactions:S7631 fork-code (sync-staging.yml, 0.37.2 export): hardened with a compare-API on-main check (`repos/…/compare/main...$HEAD_SHA` must be `behind|identical`) before merging — closes the edge where a fork PR with head branch named `main` passes the branches filter and its own PR CI. Residual flag is Won't Fix: the workflow never checks out or executes the event SHA, it only merges commits verified to be on main. Marked False Positive in the SonarCloud UI (Sep 2026) — the UI offers False Positive/Accept, no "Won't Fix" label; a resolved security issue plus this marking flipped the retroactively-computed quality gate green.
- S7679/S7688/S1066 in ai/zcode/transcript.sh and ai/chat.z.ai/scripts/blank.sh: fixed mechanically (positional params → locals, `[` → `[[`, folded nested if); verified with shellcheck + live smoke runs.

## Project invariants

- All app code lives at docs/index.html until the item-3 modular cutover (Phase E); src/ is scaffold-only until Phase C. No external font dependencies, no Python/PyQt port. The Python port was abandoned in 0.34.5; web is the only forward path.
- The app version is encoded in title, not in the filename. Patching script alone is incomplete — the version bump must land in both title and the script body.
- The app is LRC-focused, but has Genius paste. Genius scraping is delegated to a browser extension (cross-origin blocks prevent in-app fetching); in-app extraction is structural parsing of pasted text.
- No external fonts. Google Fonts was removed in 0.34.5. system-ui, sans-serif resolves differently across OSes and is the source of font-fragile screenshot tests.
