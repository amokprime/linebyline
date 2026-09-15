---
name: code-quality
description: Proactively avoid code quality issues and silent regressions in the LineByLine single-file HTML app. Use this skill whenever writing or modifying JavaScript in the app, especially when adding new functions, changing state management, modifying undo/redo behavior, altering config migration, or building new features. Also use when writing or modifying the Bash workflow scripts in ai/chat.z.ai/scripts. Also use when the user mentions SonarQube, cognitive complexity, S3776, S2004, S2681, code smells, ShellCheck, or when reviewing code for potential regressions. This skill prevents issues before they reach SonarQube scans and catches subtle bugs that have historically caused silent regressions in this project.
---

Documents the code quality patterns that SonarQube Cloud has flagged repeatedly and the silent regressions that have occurred during development. Following these rules proactively prevents issues rather than fixing them after SonarQube flags them or users discover them.

---

Cognitive Complexity (S3776) — threshold 15

The maximum allowed cognitive complexity per function is 15. SonarQube evaluates each function independently.

Primary reduction techniques, in order of preference:

1. Extract helper functions — method calls are free in CC calculation. The `_isFocusedUIElement(ae)` extraction removed 2 CC points from the global keydown handler by moving `&&`/`||` operator mixing into a separate function.
2. Early returns — process exceptional cases first and return, reducing nesting depth and avoiding `else` blocks.
3. Optional chaining — `obj?.prop?.method()` replaces null-check chains that add CC points.
4. Extract complex conditions — `if(isEligibleForDiscount(user))` instead of `if(user.hasMembership && user.orders > 10 && !user.hasDiscount || user.orders === 1)` — the `&&`/`||` mixing in a single condition adds +1 for each operator change.

CC accounting in SonarQube:
- `if`, `else if`, `else`: +1 each
- `for`, `while`: +1 each
- `&&`, `||`: +1 for each change of operator in a condition (i.e. `a && b && c` = +1, but `a && b || c` = +2)
- `? :` ternary: +1
- Nesting adds +1 per level for `if`/`for`/`while`/`catch`
- Method calls: 0 (free) — this is why extraction works

Historical CC reduction in this project:
- Global keydown handler: 138 → 14 → 25 (0.37.0 added Typing-mode arrow-key block) → 12 (0.37.1 extracted `_handleRepeatGuard`, `_handleTypingModeArrowKeys`) → 8 (0.37.2 extracted `_handleGlobalHotkeyDispatch` table)
- `insertEndLine`: 29 → 11 (extracted `_insertSyncTrailing`)
- `buildHkRows`: 40 → ~15 (extracted `_handleSecKeydown`)
- `rebuildHkPanel` forEach callback: 19 → ~4 (0.37.1 extracted `_renderHkCellContent`)
- `_handleHotkeyModeKeys`: 63 → 8 (0.37.2 extracted `_handleHotkeyModeNav` + `_handleHotkeyModeReplay` + `_handleHotkeyModeArrows` + `_findNextNonMetaLine` + `_isAtBoundary`)
- `_handleSettingsKeys`: 47 → 9 (0.37.2 extracted `_handleSettingsTabArrows` + `_handleSettingsHotkeyDispatch` + `_handleSettingsEscape` + `_getSettingsFocusable`)
- `_migrateHotkeys`: 38 → 0 (0.37.2 split into `_migrateLegacyHotkeys` table-driven + `_ensureDefaultHotkeys`)
- `_handleGlobalHotkeys`: 22 → 6 (0.37.2 extracted `_handleGlobalHotkeyDispatch` computed-key table)
- Multiple handlers extracted to outer scope: `_handleSettingsSearchKeydown`, `_handleTextareaEnterTrim`, `_handleTextareaParenBracket`, `_handleGlobalHotkeys`, `_handleHotkeyModeKeys`

---

Dispatch-table CC reduction (S3776)

When a function is a long chain of `if(hkMatch(ks,hk.X)){e.preventDefault();actionX();return true;}` lines, each `if` adds +1 CC (plus +1 for any `&&` guard like `hk.X && hkMatch(...)`). A 15-action dispatcher hits CC ~20-25.

Convert to a computed-key dispatch table:

```js
function _handleGlobalHotkeyDispatch(e,ks,hk){
  const map={
    [hk.undo]:doUndo,
    [hk.redo]:doRedo,
    [hk.add_field]:addSecondary,
    // ... more entries
    [hk.toggle_mode]:()=>{hotkeyMode=!hotkeyMode;applyMode();},
  };
  const fn=map[ks];
  if(!fn)return false;
  e.preventDefault();fn();return true;
}
```

The computed property key `[hk.undo]` evaluates `hk.undo` at object-literal time. If `hk.undo` is undefined (unassigned hotkey), the key becomes the string `"undefined"`, which will never match a real `ks` value — so the guard `hk.X && hkMatch(...)` is automatically handled. This is why the table approach eliminates both the `if` and the `&&` guard, dropping CC by ~2 per action.

The dispatch table trades CC for indirection: debugging requires knowing that `map[ks]` is the lookup, not grepping for `if(hkMatch(...))`. Document the helper name in the section-index skill so future sessions can find it.

When NOT to use this pattern:
- When actions have different signatures or need different `e` handling beyond a uniform `e.preventDefault()` — keep those as explicit `if` branches before the table lookup.
- When the number of actions is small (<5) — the table overhead isn't worth it.
- When actions have side-effectful guards that must short-circuit — the table evaluates all keys eagerly (harmless, but can mislead readers).

---

Braceless if statements (S2681)

Always add braces to single-line `if`/`else` bodies, even though JavaScript allows omitting them. SonarQube flags every instance.

The following code looks like two statements are conditional, but only the first is:
```js
if(audioEl)audioEl.playbackRate=1;
localStorage.setItem('lbl_speed','1'); // always executes
```

This ambiguity is the reason for the rule. Always write:
```js
if(audioEl){audioEl.playbackRate=1;}
```

---

State management — single source of truth

When two variables represent the same underlying state (e.g. `masterVolume` + `masterMuted`), they can disagree, causing subtle bugs. The fix: pick one as authoritative and derive everything else.

The pattern: `masterVolume` is always the actual volume (0 when muted). The mute button, slider position, and percentage label all read from it directly — no conditional branching, no state sync to forget.

Before (buggy):
```js
let masterVolume = 1;
let masterMuted = false; // can disagree with volume
```

After (correct):
```js
let masterVolume = 1; // always actual volume (0 when muted)
let _preMuteVolume = 1; // stored only during mute, not a parallel state
```

Apply this pattern to any UI state where two variables track the same concept.

---

Undo/redo — single-push model

The old pattern was `pushSnapshot(); mutate; pushSnapshot()` — one push before mutation (to save pre-change state for undo) and one after (to save post-change state for redo). This created a duplicate snapshot that caused `syncLine`/`adjustTs` to require two Ctrl+Z presses to undo.

The correct model: single post-change push.
```js
mutate();
pushSnapshot(); // only this push needed
```

The pre-change state is already on the stack from the previous operation's post-change push. Only push after the change.

Exception: for wholesale content replacement (import, merge, paste), push once before and once after:
```js
pushSnapshot();  // save pre-change for undo
setContent(newContent);
pushSnapshot();  // save post-change for redo
```

applySnapshot must clear extra secondaries — when undoing to a snapshot that had fewer secondary fields than currently visible, `applySnapshot` must clear the extra textareas:
```js
function applySnapshot(snap) {
  // ... restore main and captured secondaries ...
  for(let i=snap.secondaries.length; i<secondaryCols.length; i++){
    secondaryCols[i].linesEl.value='';
  }
}
```

Without this, undoing to a pre-add snapshot leaves stale content in the still-visible textarea.

---

Config migration patterns

When a config key is renamed between versions, users with old `localStorage` data won't have the new key. The old key sits unread, the new key falls back to default. Fix this with explicit migration in loadCfg:

```js
// Inside loadCfg(), after Object.assign:
if(d.hotkeys?.save === 'Ctrl+S') c.hotkeys.save = 'Ctrl+;';
if(d.old_key !== undefined && c.new_key === undefined) c.new_key = d.old_key;
if(c.hotkeys.mute) delete c.hotkeys.mute; // remove deprecated
if(!c.hotkeys.theme_toggle) c.hotkeys.theme_toggle = 'Ctrl+.'; // add missing
```

The cleared-hotkeys bug: `_migrateHotkeys` used `!c.hotkeys.X` which treats `''` (empty string, meaning deliberately unassigned) as falsy — resetting intentionally-cleared hotkeys back to defaults. Fix: check `=== undefined` instead of falsy:
```js
if(c.hotkeys[key] === undefined) c.hotkeys[key] = DEFAULT_CFG.hotkeys[key];
```

---

Dynamic config reads vs hardcoded constants

`ensureReTagDefault` was reading `DEFAULT_META` (a hardcoded constant) instead of `cfg.default_meta` (the live user-configured value). This meant changing the setting had no effect.

The rule: any setting that can be changed in the UI must be read from the `cfg` object at runtime, not from the `DEFAULT_CFG` constant. `DEFAULT_CFG` is only for initial values and reset-to-default.

---

for-of conversion safety (S4138)

Only convert `for` loops to `for-of` when the loop index is not used for:
- Accumulation: `result[i] = ...`
- Output assignment keyed to index
- Indexed mutation of a parallel array
- Any expression involving `i` other than `arr[i]`

When in doubt, keep the `for` loop. SonarQube's suggestion is often wrong for this codebase.

---

String.raw false positive (S6443)

SonarQube flags regex literals like `/\d+/` as needing `String.raw`. This is always a false positive — `String.raw` applies to template literals, not regex literal syntax. Mark as Won't Fix: "False positive: rule does not apply to regex literal syntax."

---

Helper extraction safety

When extracting helpers during refactoring, pre-existing callees can be accidentally deleted. In this project, `_peelLastParen` was deleted during Stage C refactoring, breaking `batchSplitParens` and `markAsTranslation` at runtime.

After extracting any helper function, audit all pre-existing callees that were in the section being refactored. Search the codebase for function names that should still exist.

---

String assembly with conditional content

`tsPrefix + ' ' + content` with `.replace(/^ /,'')` stripped the space from `[mm:ss.cc] text` when `content` was non-empty but there were no paren groups. Fix: conditional concatenation:
```js
tsPrefix + (tsPrefix && content ? ' ' + content : content)
```

This pattern applies whenever you conditionally prepend a prefix + separator to content that may be empty.

---

beforeunload must check all content areas

The dirty-work warning must check not just the main textarea but all secondary textareas:
```js
window.addEventListener('beforeunload', e => {
  if(mainTextarea.value.trim() !== '' ||
     secondaryCols.some(c => c.linesEl.value.trim() !== '')) {
    e.preventDefault(); e.returnValue = '';
  }
});
```

Forgetting secondaries means the user can lose secondary work without warning.

---

Speed and seek offset persistence

`currentSpeed` must be loaded from `localStorage.getItem('lbl_speed')` on init and saved in `changeSpeed()` and the speed-val change handler. `_doResetDefaults()` must reset speed: `currentSpeed=1`, update `#speed-val` display, reset `audioEl.playbackRate`, persist to localStorage. Seek offset must persist across sync operations — `doSyncFile` never resets it.

---

Newline convention in LRC assembly

All four assembly sites (import, paste, merge, sync) must use exactly one blank separator line:
```js
mergedMeta.trimEnd() + '\n\n' + lyrics
```

Inconsistent separator counts cause blank-line mismatches between main and secondary fields.

---

Bash workflow scripts (ai/chat.z.ai/scripts)

The same patterns apply to the Repomix zip scripts (`.base.sh` plus the `*.sh` wrappers). ShellCheck covers what SonarQube covers for JS here.

- Strict mode — `.base.sh` sets `set -euo pipefail` right after being sourced. Any failing command (repomix, zip, cd) aborts the script before the destructive `rm -rf "$upload"/*` cleanup runs. Never place an unchecked command before a cleanup: a failed zip used to be followed by deleting the upload folder and wl-copy receiving a path to a zip that was never created.
- Empty-variable guards on destructive globs — write `rm -rf "${upload:?}"/*` (ShellCheck SC2115) so an unset or empty variable can never expand the rm target to `/*`. Use the same `${var:?}` form on every rm whose path comes from a variable.
- Braceless compounds — `[ cond ] && exit` is the bash equivalent of the braceless `if` (S2681): a second statement appended later runs unconditionally. Write `if [ cond ]; then ...; fi`, with an explicit `exit 1` and a stderr message.
- Diagnostics and exit codes — error messages go to stderr (`echo "..." >&2`), and every `exit` carries an explicit status. A bare `exit` after a failed test exits 0 and silently hides the abort reason.
- Config over constants — derive paths from `$HOME` and the `LINEBYLINE_ROOT` override instead of hardcoding `/home/user/...` (same rule as runtime `cfg` vs `DEFAULT_CFG`).
- No line continuations inside quoted strings — `"...,\` + newline silently embeds the next line's leading indentation spaces into the value (`"a,\` + newline + `    b"` becomes `a,    b`). Build long `--include`/`--ignore` lists with `local` + `+=`, one pattern per line.
- Dynamic source linting — precede `. "$(dirname ...)/.base.sh"` with `# shellcheck source=.base.sh` so ShellCheck lints the base file in the caller's context. ShellCheck resolves the directive path relative to the current working directory (not the checked file's directory), so lint from inside the scripts dir: `cd ai/chat.z.ai/scripts && shellcheck -x *.sh .base.sh` — the `*.sh` glob skips dotfiles, hence the explicit `.base.sh`. Run from anywhere else, `-x` alone cannot find `.base.sh` (SC1091) and the wrappers report SC2154 for `upload`.
- Scoped cleanup — when a deploy/cleanup script removes files extracted from a zip, scope the cleanup to the zip's own file list (via `unzip -Z1 deliver.zip` or a `.deliver-files.list` manifest written before extraction), NEVER `find . -maxdepth 1 -type f ! -name deploy.sh ! -name deliver.zip`. The latter sweeps pre-existing destination files (e.g. user's `scratch.md` notes, prior session's upload zips). The `.deliver-files.list` pattern: `unpack.sh` snapshots the zip's contents to a hidden dotfile before extraction, then `deploy.sh`'s cleanup loop reads the dotfile and only removes files that came from the zip. Pre-existing files are untouched by construction.

---

Pre-delivery code quality checklist

Before delivering any patch, verify:

1. CC of modified functions — estimate the cognitive complexity of any function you changed. If it exceeds 15, extract helpers or use early returns before delivering. Do not wait for SonarQube to flag it.
2. Braceless-if — check every `if`/`else` in the patch for missing braces. Single-line bodies must still have `{}`.
3. State management — if the patch adds a new state variable, verify it does not duplicate an existing one that tracks the same concept (single source of truth).
4. Undo/redo — if the patch changes content-mutating logic, verify the pushSnapshot() call follows the single-push model (post-change only, except for wholesale replacement which needs pre + post).
5. Config reads — if the patch references a user-configurable setting, verify it reads from `cfg` at runtime, not `DEFAULT_CFG`.
6. Helper extraction safety — if the patch extracts a helper, search the codebase for all pre-existing callees to confirm none were accidentally deleted.
7. Existing Playwright test code does not conflict with new app code. Reconcile any conflicts found and warn the user of tests that require snapshot or screenshot regen.
8. New app features are covered by Playwright tests. Expand test coverage conservatively as needed with comments like `// Covers playback starting after seeking added in 0.36.2`. Favor expanding existing <20 LOC tests over creating new tests. Favor adding new tests to existing <200 LOC test files over creating new test files.
9. Bash scripts — for patches touching `ai/chat.z.ai/scripts/*.sh`: run `bash -n` on every touched file, then `cd ai/chat.z.ai/scripts && shellcheck -x *.sh .base.sh` (expect zero findings; note the glob skips dotfiles so `.base.sh` must be named explicitly), keep `${var:?}` guards on every rm with a variable path, keep error messages on stderr with explicit exit statuses, and never use line continuations inside double-quoted strings.
10. ESLint gate — the deploy pipeline (`ai/chat.z.ai/scripts/delivery/deploy.sh`) runs `eslint src/ --fix` (autofix) then `eslint src/` (gate) between `npm install` and `npm run test:unit`. The gate fails the deploy if any issues remain after autofix. This catches SonarQube-rule violations locally before they reach CI, reducing the back-and-forth of upload → SonarCloud scan → fix → re-upload. The pattern mirrors the sonar-issue-exporter deploy.sh (ruff --fix → ruff gate → pytest). If ESLint flags an issue the agent can't autofix, resolve it before delivering — do not skip the gate.

---

Blocking Sonar issues: comply, don't bypass

SonarCloud issues fall into two categories: **blocking** (fail the quality gate, block the merge) and **non-blocking** (code smells, maintainability issues that don't fail the gate). The disposition rules differ:

**Non-blocking issues** — it's fine to defer, mark Won't Fix, or mark False Positive. Examples: verbatim-port Accepts (S8786, S6594, S6557, S7755), intentional design decisions (S6819 custom interaction, S7682 snippet-caller), false positives (S6443 regex literals, S7927 icon-only buttons). These are documented per-version in MEMORY.md → "SonarQube / CodeQL dispositions" and in `sonarqube-workflow-SKILL.md` → "False positive summary".

**Blocking issues** — comply fully. Do not attempt regex workarounds, alternative patterns, or "almost compliant" approaches to preserve an original feature. SonarCloud's taint analysis (for security rules like S2083 path traversal) and cognitive complexity analysis (for S3776) are thorough — they will detect the workaround and the gate will stay red. Each workaround attempt costs a full upload → scan → triage cycle (often 10+ minutes of back-and-forth). The time spent trying to bypass a blocking issue is almost always greater than the time spent complying with it.

The S2083 path traversal saga (Sep 2026) is the cautionary example: the agent tried (1) a `safe_path()` helper function — taint analysis couldn't trace validation across the function boundary; (2) `os.path.realpath` + `startswith(_BASE_DIR + os.sep)` using a module-level constant — SonarCloud didn't recognize the module-level variable as trusted. Both failed. Full compliance — inline `base_dir` derivation + guard + I/O all in the same function body, with `open()` receiving the validated `resolved` path — was the only path that passed. See `sonarqube-workflow-SKILL.md` → "Taint analysis rules" for the canonical pattern.

**When to refactor features to pass checks**: after the modular architecture is stable (Phase E cutover complete, tests and delivery scripts all passing), the user is willing to consider refactoring features to pass checks OOTB rather than accepting Won't Fix dispositions. Until then, verbatim-port Accepts and documented exceptions are the right disposition for non-blocking issues — refactoring a feature mid-port risks behavioral regressions that are harder to catch than the SonarQube warning itself.
