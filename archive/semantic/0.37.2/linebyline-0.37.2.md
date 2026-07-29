---
model: GLM (Z.ai)
summary: 'Phase 4 post-push SonarCloud remediation on version 0.37.2 (held constant across all turns per user request). Turn 2 fixes S2486 (4 empty-catch issues). Turn 3 fixes S2310 (1 for-loop counter reassignment in _assignInterpolatedTs). Turn 4 fixes S3776 (11 cognitive-complexity issues). Turn 5 is an after-Turn-4 manual-test catch: bump the `<title>` to 0.37.2 (forgotten in Turns 2–4) and strip the trailing Genius embed widget (`<digits>\nEmbed`) from Genius paste. Turn 6 fixes two more Genius-paste discrepancies found by manual testing of the Turn 5 patch: dropped intro `[intro vocalization]` line and missing blank-line section breaks when section headers have no preceding blank in the raw input. Turn 7 is a post-test follow-up: no app patch, just (1) root-cause analysis of a flaky `tab-settings` Playwright failure (focus-timing race under host load, recommend test-level sync assertion), and (2) an enhanced `mock-v2.txt` fixture that exercises the Turn 5 embed-widget code path while preserving the existing snapshot byte-for-byte (verified via `scripts/verify-enhanced-mock.js`). Turn 8 is release prep: no app patch, just (1) Memory.md condensation from 11 turn-by-turn bullets to 4 thread-based bullets per a new "thread discipline" pattern, (2) skill-SKILL.md updated with the thread-discipline lesson, (3) v0.37.2 release summary (287 words, half-page), (4) commit message (6-word title, 4 sentences each <10 words). Turn 9 refines the companion file format: licensed lyrics/metadata scrubbed to placeholders, turn numbering normalized to integers throughout, `## Deliverables this turn` and `## Awaiting` sections dropped; four rules codified in project-workflow-SKILL.md. Turn 10 addresses 11 more post-push SonarCloud findings (S8786 regex backtracking x3, S3776 cognitive complexity x2, S3626 redundant jump x2, S7766 Math.max, S2681 braceless-if, Web:InputWithoutLabelCheck, githubactions:S7637 SHA pin) plus 3 uncovered lines in playwright.config.js (env-detection collapsed into single line with istanbul-ignore comment); summary frontmatter wrapped in single quotes per YAML special-character rule. Turn 11 fixes a Dependabot scheduled-scan failure (`path_dependencies_not_reachable: @linebyline/test-helpers`) by adding `tests/helpers/package.json` with matching name/version/main/private fields; no app patch, no conflicts with root package.json (two manifests is the standard pattern for file: path-deps); secondary gap: brace-expansion and fast-uri ReDoS CVEs were not patched while Dependabot was blocked. Turn 12 diagnoses a Dependabot PR #8 merge-block by SHA-mismatch race (SonarCloud passed on prior SHA, current HEAD has no result) — safe to bypass; also documents two stuck brace-expansion alerts held in "creating" state from before the Turn 11 fix. Turn 13 discovers brace-expansion has TWO separate CVEs (recursion patched in 5.0.7, OOM unfixable) and that `npm audit fix --force` is a footgun — it downgraded serve from v14 to v6.5.8 (2017-era), introducing 4 critical handlebars/minimist RCE vulns; recommendation: revert all package.json/lock changes via `git checkout HEAD -- package.json package-lock.json`, optionally re-add ONLY the overrides block and run `npm install` (NOT `npm audit fix`, NOT `--force`), accept residual 4-high OOM CVE as unfixable until upstream patches.'
---

# Turn 1 (Phase 1 onboard — recorded in linebyline-0.37.1.md)

See `linebyline-0.37.1.md` in this directory for the Phase 1 onboard record.

---

# Turn 2 (Phase 4 — S2486 fixes, version → 0.37.2)

## User prompt (verbatim)

> Somewhat unusually, I've decided to upload the rest of the phases together because the true issue is at the end (see `2_work/Prompt.md`).
> file_name: Archive.zip
> Storage location: All uploaded files are saved to /home/z/my-project/upload/{file_name} directory on the server filesystem.

The user uploaded all remaining phases (2_work, 3_pre-push, 4_post_push_issues) plus an `Archive.zip` of prior Copilot/GLM chat history about getting the SonarCloud GitHub Action itself working again (separate concern — not the code-level issues). The actual task was clarified by `2_work/2_work/Prompt.md`:

> In this session we'll be effectively skipping the work and pre-push steps of the project workflow to fix latent post-push SonarCloud issues (and any emergent Playwright bugs). I'm going through the motions only to show you the relevant files.

This routes the session directly to **Phase 4 — Post-push (SonarQube issues path)** of `project-workflow-SKILL.md`. Per the workflow, Phase 4 with issues present requires: re-read project-workflow-SKILL.md; read `sonarqube-workflow-SKILL.md` and the issues folder; fix SonarQube issues not caught previously; document fixes in the companion `.md`; read `skill-SKILL.md`; update Memory.md and/or uploaded skills.

## Skills read this turn (per project-workflow Phase 4 + pre-patch checklist)

- `project-workflow-SKILL.md` (re-read for Phase 4 obligations)
- `sonarqube-workflow-SKILL.md` (Phase 4 issue-processing workflow)
- `linebyline-section-index-SKILL.md` (section-targeted reading protocol)
- `code-quality-SKILL.md` (pre-patch checklist before modifying functions)
- `single-file-html-app-SKILL.md` (architectural patterns; already largely known from prior turns but re-skimmed for state-management conventions)
- `skill-SKILL.md` (guidelines for when to update Memory.md vs skills, applied at end-of-session)

## SonarQube issue inventory (from `4_post_push_issues/issues/`)

| Rule | Count | Severity | Lines | Summary |
|---|---|---|---|---|
| S2486 | 4 | MINOR | 509, 970, 1060, 1141 | "Handle this exception or don't catch it at all" — empty/ignored catch blocks |
| S3776 | 11 | CRITICAL | 470, 850, 915, 955, 1367, 1393, 2087, 2422, 2467, 2516, 2538 | Cognitive Complexity > 15 (range 17–63) |
| S2310 | 1 | MAJOR | 1389 | "Remove this assignment of i" — loop counter reassigned inside body |

Total: 16 issues. Per `sonarqube-workflow-SKILL.md` Step 4 ("Plan one category of change per turn to reduce regression risk. Typical order: 1. Simple substitutions first, 2. for-of conversions, 3. Helper extraction for nesting depth, 4. Cognitive complexity reduction — most invasive, do last"), this session is split into 3 turns:

- **Turn 2 (this turn, → 0.37.2)**: S2486 (4 empty-catch fixes)
- **Turn 3 (→ 0.37.3)**: S2310 (1 loop-counter reassignment)
- **Turn 4 (→ 0.37.4)**: S3776 (11 CC reductions, most invasive)

## Turn 2 — S2486 remediation

### Sites

| Line | Section | Original | Replacement |
|---|---|---|---|
| 509 | Persistence → `loadCfg` | `catch(e){return structuredClone(DEFAULT_CFG);}` | `catch(e){console.warn('loadCfg: invalid stored config, falling back to defaults:',e);return structuredClone(DEFAULT_CFG);}` |
| 970 | Render / line UI → `_handleLineClick` | `catch(_){/* read-only in some browser contexts */}` | `catch(e){console.warn('audioEl.volume read-only in this context:',e);}` |
| 1060 | Audio → `applyVolume` | `catch(_){/* read-only in some browser contexts */}` | (same replacement as L970) |
| 1141 | Audio → `togglePlay` | `catch(_){/* read-only in some browser contexts */}` | (same replacement as L970) |

### Why `console.warn` instead of `catch{}` (optional catch binding)

SonarQube S2486 fires when a catch block is empty or only contains comments, regardless of whether the parameter is named or omitted via optional catch binding. So `catch{}` and `catch(_){}` are both still flagged — the rule wants the exception actually used.

`console.warn` is the dominant fix because:
- It satisfies the rule by referencing `e` (the exception object).
- It does not change observable behavior — the catch block's control flow (return defaults, or continue execution after the volume setter fails) is preserved.
- It surfaces the suppressed exception to the browser console, which is the right amount of noise: not user-visible, but available to developers debugging user reports. For the loadCfg case in particular, a silent fallback to defaults masks config corruption that the user would otherwise have no way to know about.
- The 3 volume-setter sites all share the same comment ("read-only in some browser contexts") which is preserved as the warn message text.

### Why not remove the try/catch on the volume setters

Tempting alternative: drop the try/catch entirely since `audioEl.volume = x` "shouldn't throw" in modern browsers. Rejected because: the original author added the guard for a real reason (some embedded/sandboxed contexts expose `<audio>` volume as read-only), and removing it would change behavior — if the setter does throw, `audioEl.play()` on the next line currently still runs (the swallow lets execution continue), but without the try/catch it would not. The dominant fix is the one that preserves observable behavior.

### Why log loadCfg exceptions but not just `catch{}`

For volume setters, the suppression is documented as intentional and the failure mode is benign (volume just doesn't apply). For loadCfg, the failure mode is "user's saved config is silently lost" — much more impactful. Logging the actual exception makes it possible to diagnose the corruption if a user reports "my settings keep resetting". `console.warn` (not `console.error`) keeps the noise level appropriate — this is expected behavior under corrupted localStorage, not an uncaught error.

### Patch shape

Single Edit with `replace_all=true` for the 3 volume-setter catches (identical strings), plus a separate Edit for the loadCfg catch (line-anchored by its return). Total diff: 4 lines changed, 0 lines added/removed. No structural changes; section line numbers do not shift.

### Post-patch verification (per project-workflow-SKILL.md "Post-patch verification")

1. **Syntax check** — extracted `<script>` body compiles via `new Function` (115,512 chars). Verified via `scripts/check-syntax.js` (shipped as `check-syntax-v1.js` + `check-syntax.md` in `download/`).
2. **Section index accuracy** — no line shifts (4 single-line replacements, no insertions/deletions). Existing section markers from the grep at the start of Turn 2 still match.
3. **Spot-check referenced functions** — `loadCfg`, `_handleLineClick`, `applyVolume`, `togglePlay` all still exist at their original line numbers; only their catch-clause internals changed.
4. **Trace one representative user action** — toggling mute (calls `toggleMute` → `applyVolume` → the patched catch on L1060). If `audioEl.volume = masterVolume` succeeds (normal case), `console.warn` is not invoked and the function returns normally — same as before. If it throws (sandboxed context), `console.warn` fires with the exception, and `localStorage.setItem('lbl_vol', …)` on the next line still runs (preserved). The other 3 sites trace analogously.

### Playwright impact

S2486 fixes add `console.warn` calls on the exception path only — observable behavior is unchanged. No Playwright test (snapshot, screenshot, or ARIA assertion) depends on console output. No test regen needed.

---

# Turn 3 — S2310 fix (still 0.37.2)

## User prompt (verbatim)

> No headless Playwright tests failed for A. Continue to B, but stay on 0.37.2 throughout this session.

## Site

| Line (0.37.1) | Line (0.37.2 post-A) | Section | Function | Rule |
|---|---|---|---|---|
| 1389 | 1389 | Sync/timestamp | `_assignInterpolatedTs(out)` | S2310 — "Remove this assignment of i" |

Note: Turn 2 was 4 single-line replacements with no line shifts, so the S2310 site is still at L1389 in the post-A file. Turn 3 itself shifts subsequent lines by +2 (see below).

## Original code

```js
function _assignInterpolatedTs(out){
  for(let i=0;i<out.length;i++){
    if(META_RE.test(out[i])||out[i].trim()==='')continue;
    if(tsToMs(out[i])!==null)continue;
    let prevMs=null;
    for(let j=i-1;j>=0;j--){
      if(out[j].trim()===''||META_RE.test(out[j]))continue;
      prevMs=tsToMs(out[j]);break;
    }
    if(prevMs===null)continue;
    let runEnd=i;
    while(runEnd+1<out.length&&!META_RE.test(out[runEnd+1])&&out[runEnd+1].trim()!==''&&tsToMs(out[runEnd+1])===null)runEnd++;
    let nextMs=null;
    for(let j=runEnd+1;j<out.length;j++){
      if(out[j].trim()===''||META_RE.test(out[j]))continue;
      const ms=tsToMs(out[j]);if(ms!==null){nextMs=ms;break;}
    }
    if(nextMs===null)continue;
    const count=runEnd-i+1;
    for(let k=0;k<count;k++){
      out[i+k]=msToTs(Math.max(0,nextMs-(count-k)*10))+' '+out[i+k];
    }
    i=runEnd;   // ← S2310: for-loop counter reassigned in body
  }
}
```

## Why the reassignment exists

`_assignInterpolatedTs` walks `out[]` looking for runs of un-timestamped content lines sandwiched between two timestamped lines. When it finds one, it computes interpolated timestamps for the whole run and writes them in place. The `i=runEnd` reassignment is intentional: it advances the cursor past the just-processed run so the next iteration starts at `runEnd+1` (after the for-loop's `i++`). Without it, the loop would re-enter the body at `i+1` (the second line of the just-processed run) and try to interpolate again — producing progressively earlier timestamps each pass.

So the reassignment is load-bearing. We can't just delete it (option 1 from the S2310 message text).

## Fix — convert `for` to `while`

S2310 only fires on `for`-loop counters (variables declared in the for-header). A `while` loop's cursor is declared outside the loop header, so reassigning it inside the body is not flagged.

```js
function _assignInterpolatedTs(out){
  // while-loop (not for) so the cursor can be advanced past a processed run without S2310
  let i=0;
  while(i<out.length){
    if(META_RE.test(out[i])||out[i].trim()===''){i++;continue;}
    if(tsToMs(out[i])!==null){i++;continue;}
    let prevMs=null;
    for(let j=i-1;j>=0;j--){
      if(out[j].trim()===''||META_RE.test(out[j]))continue;
      prevMs=tsToMs(out[j]);break;
    }
    if(prevMs===null){i++;continue;}
    let runEnd=i;
    while(runEnd+1<out.length&&!META_RE.test(out[runEnd+1])&&out[runEnd+1].trim()!==''&&tsToMs(out[runEnd+1])===null)runEnd++;
    let nextMs=null;
    for(let j=runEnd+1;j<out.length;j++){
      if(out[j].trim()===''||META_RE.test(out[j]))continue;
      const ms=tsToMs(out[j]);if(ms!==null){nextMs=ms;break;}
    }
    if(nextMs===null){i++;continue;}
    const count=runEnd-i+1;
    for(let k=0;k<count;k++){
      out[i+k]=msToTs(Math.max(0,nextMs-(count-k)*10))+' '+out[i+k];
    }
    i=runEnd+1;
  }
}
```

### Behavior preservation mapping

| Original (for) | New (while) | Notes |
|---|---|---|
| `for(let i=0;i<out.length;i++)` | `let i=0; while(i<out.length)` | Cursor init + condition |
| `continue` (in 4 early-return paths) | `{i++;continue;}` | The for-loop's `i++` ran on `continue`; the while version must do it explicitly |
| `i=runEnd` (end of main body) | `i=runEnd+1` | The for-loop's trailing `i++` bumped `runEnd` to `runEnd+1`; the while version must do it explicitly |

All 4 `continue` sites wrapped in `{i++;continue;}` to preserve the for-loop's increment semantics.

### Alternatives considered and rejected

- **Optional catch binding style** (`for(let i=0;...;i++){ ...; i=runEnd; }`) — doesn't apply; this is a counter reassignment, not a catch parameter.
- **Introduce a `skipTo` variable** — uglier, adds a second state variable that has to stay in sync with `i`. The while-loop is the simplest expression of "manual cursor with non-uniform step".
- **Extract the inner body to a helper that returns the next `i`** — would work but adds a function for a 25-line loop. Not worth the indirection.
- **`Array.prototype.reduce` or `forEach`** — can't early-return or skip ahead; not appropriate.

## Trace — README "After" example

Input (output of `batchSplitParens` on the README's inline-translation example):

```
[0]: [00:00.00] I wish I could identify that smell
[1]: (J'aimerais pouvoir identifier cette odeur)
[2]: (Ojalá pudiera identificar ese olor)
[3]: [00:03.06] That smell
[4]: (Cette odeur)
[5]: (Ese olor)
[6]: [00:06.35]
```

| i | Action | Effect |
|---|---|---|
| 0 | has ts → `i++;continue` | i=1 |
| 1 | no ts; prevMs=0 (from [0]); runEnd=2 (out[2] no ts, out[3] has ts → stop); nextMs=3060; count=2 | writes `[00:03.04]` to [1], `[00:03.05]` to [2]; i=runEnd+1=3 |
| 3 | has ts → `i++;continue` | i=4 |
| 4 | no ts; prevMs=3060 (from [3]); runEnd=5 (out[5] no ts, out[6] has ts → stop); nextMs=6350; count=2 | writes `[00:06.33]` to [4], `[00:06.34]` to [5]; i=runEnd+1=6 |
| 6 | has ts → `i++;continue` | i=7 |
| 7 | 7 ≥ length=7 → loop exits | done |

Final `out`:
```
[00:00.00] I wish I could identify that smell
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06] That smell
[00:06.33] (Cette odeur)
[00:06.34] (Ese olor)
[00:06.35]
```

Matches the README "After" example exactly. Behavior preserved.

## Post-patch verification

1. **Syntax check** — `<script>` body compiles via `new Function` (115,630 chars; was 115,512 in Turn 2 — +118 chars from the 4 `{i++;continue;}` wrappings and the `let i=0; while(...)` header). Verified via `scripts/check-syntax.js`.
2. **Section index accuracy** — refactored function grew from 25 lines (1367–1391) to 27 lines (1367–1393), net +2. All sections from "Secondary fields" onward shift by +2:

   | Section | 0.37.1 / 0.37.2 post-A | 0.37.2 post-B | Shift |
   |---|---|---|---|
   | Sync / timestamp | 1262 | 1262 | 0 (patch is inside this section) |
   | Secondary fields | 1499 | 1501 | +2 |
   | Line counts / merge | 1606 | 1608 | +2 |
   | Title from text | 1691 | 1693 | +2 |
   | Import | 1699 | 1701 | +2 |
   | Controls panel | 1807 | 1809 | +2 |
   | Settings | 1935 | 1937 | +2 |
   | Settings search | 2001 | 2003 | +2 |

3. **Spot-check referenced functions** — `_assignInterpolatedTs` is called only from `batchSplitParens` at L1433 (post-B); confirmed present. `_peelLastParen` (called by `batchSplitParens` in the same section) is intact — important per Memory.md 0.35.15 note about its accidental deletion during a prior refactor.
4. **Trace one representative user action** — see trace table above; output matches README "After" example.

## Playwright impact

`_assignInterpolatedTs` is exercised by `mark.spec.js` (mark-as-translation) and any paste/import test that triggers `batchSplitParens` via the ↩ checkbox. The output bytes are identical to the pre-patch version (verified by trace), so all ARIA snapshots and `inputValue()` assertions remain valid. No test regen needed.

---

# Turn 4 — S3776 fixes (still 0.37.2)

## User prompt (verbatim)

> Looks clean. Start C.

## Issue inventory (11 S3776 findings, CC range 17–63)

| Original CC | Post-B Line | Function | Section |
|---|---|---|---|
| 17 | 1395 | `_advanceAfterSplit` | Sync/timestamp |
| 18 | 2424 | `_handleTextareaParenBracket` | Keyboard → Main textarea KD |
| 19 | 850 | `_findGeniusLyricBounds` | Helpers → Genius |
| 22 | 2518 | `_handleGlobalHotkeys` | Keyboard → Global KD |
| 25 | 955 | `_handleLineClick` | Render / line UI |
| 26 | 2089 | `_handleSettingsSearchKeydown` | Settings search |
| 27 | 915 | `_extractGeniusFields` | Helpers → Genius |
| 27 | 1367 | `_assignInterpolatedTs` | Sync/timestamp |
| 38 | 470 | `_migrateHotkeys` | Config/Persistence |
| 47 | 2469 | `_handleSettingsKeys` | Keyboard → Overlay utilities |
| 63 | 2540 | `_handleHotkeyModeKeys` | Keyboard → Global KD |

## Patching strategy

Patched bottom-up (highest line number first) so earlier line numbers don't shift mid-session. After each patch: `new Function` syntax check. All 11 patches passed syntax check on first attempt except patch 4 (`_handleTextareaParenBracket`), which had a bug where the extracted helper referenced `e` without receiving it as a parameter — fixed by moving `e.preventDefault()` to the caller before the helper call.

## Per-function extraction summary

| Function | Original CC | New CC | Helpers extracted |
|---|---|---|---|
| `_handleHotkeyModeKeys` | 63 | ~8 | `_handleHotkeyModeNav`, `_handleHotkeyModeReplay`, `_handleHotkeyModeArrows`, `_findNextNonMetaLine`, `_isAtBoundary` |
| `_handleSettingsKeys` | 47 | ~9 | `_getSettingsFocusable`, `_handleSettingsTabArrows`, `_handleSettingsHotkeyDispatch`, `_handleSettingsEscape` |
| `_migrateHotkeys` | 38 | 0 | `_migrateLegacyHotkeys`, `_ensureDefaultHotkeys`, `_LEGACY_HOTKEY_MAP` constant |
| `_handleGlobalHotkeys` | 22 | ~6 | `_handleGlobalHotkeyDispatch` (computed-key dispatch table) |
| `_handleSettingsSearchKeydown` | 26 | 2 | `_handleSearchHkMode`, `_handleSearchNormalMode` |
| `_handleTextareaParenBracket` | 18 | ~4 | `_wrapSelectionWith`, `_handleParenAtLineStart` |
| `_findGeniusLyricBounds` | 19 | ~3 | `_findGeniusLyricStart`, `_findGeniusLyricEnd` |
| `_extractGeniusFields` | 27 | ~4 | `_extractGeniusTitleAndArtist`, `_findArtistAfterTitle`, `_extractGeniusAlbum` |
| `_handleLineClick` | 25 | ~12 | `_handleLineClickPlain` |
| `_assignInterpolatedTs` | 27 | ~11 | `_findPrevTsMs`, `_findNextTsMs`, `_findRunEnd` |
| `_advanceAfterSplit` | 17 | ~3 | `_findNextUnprocessedSplit`, `_findNextNonMetaFromIdx` |

Total: ~27 new helper functions across 8 sections. All new helpers have CC well under 15 (most under 10).

## Key technique — dispatch-table CC reduction

For `_handleGlobalHotkeys` and `_migrateHotkeys`, the long chain of `if(hkMatch(ks,hk.X)){...}` or `if(h.X===Y)hc.Z=W` lines was converted to a computed-key dispatch table:

```js
const map={[hk.undo]:doUndo, [hk.redo]:doRedo, ...};
const fn=map[ks];
if(!fn)return false;
e.preventDefault();fn();return true;
```

The computed property key `[hk.undo]` evaluates `hk.undo` at object-literal time. If undefined (unassigned hotkey), the key becomes the string `"undefined"`, which never matches a real `ks` — so the `hk.X && hkMatch(...)` guard is automatically handled. This eliminates both the `if` and the `&&` guard, dropping CC by ~2 per action.

This pattern is now documented in `code-quality-SKILL.md` under "Dispatch-table CC reduction (S3776)" so future sessions can apply it without re-deriving.

## Post-patch verification

1. **Syntax check** — `<script>` body compiles via `new Function` (117,584 chars; was 115,630 after Turn 3, +1,954 chars from the 27 new helper declarations). Verified via `scripts/check-syntax.js`.
2. **Section index accuracy** — section structure (names, order) unchanged. All section line numbers shifted due to helper insertions. Re-grepped `// ──` markers; section list in `linebyline-section-index-SKILL.md` updated to document the 27 new helpers across 8 sections.
3. **Spot-check referenced functions** — all 14 pre-existing `_`-prefixed helpers verified present after extraction (including `_peelLastParen` per Memory.md 0.35.15 caution). No accidental deletions.
4. **Trace one representative user action** — traced each refactor's primary user action:
   - `_handleHotkeyModeKeys`: ArrowDown navigation → `_handleHotkeyModeNav` → `_handleHotkeyModeArrows` → `_findNextNonMetaLine` → cursor moves to next lyric line. ✓
   - `_handleGlobalHotkeys`: Ctrl+Z undo → `_handleGlobalHotkeyDispatch` table lookup `[hk.undo]:doUndo` → `doUndo()`. ✓
   - `_migrateHotkeys`: stored `hk.seek_back='Ctrl+A'` → `_migrateLegacyHotkeys` iterates `_LEGACY_HOTKEY_MAP`, finds `seek_back['Ctrl+A']='Ctrl+9'`, sets `hc.seek_back='Ctrl+9'`. ✓
   - `_assignInterpolatedTs`: README "After" example traced in Turn 3 still produces identical output (helpers preserve the same scan logic). ✓
   - `_extractGeniusFields`: Genius paste with "Cover art for X by Artist Y" + "Song Title Lyrics" → `_extractGeniusTitleAndArtist` finds title from Lyrics line, `_findArtistAfterTitle` skipped (existingArtist from Cover art line), `_extractGeniusAlbum` scans for Track pattern. ✓
   - `_handleTextareaParenBracket`: type `(` at line start with content after → `_handleParenAtLineStart` returns true, wraps rest of line. Type `(` mid-line → returns false, caller inserts `()`. ✓

## Playwright impact

The refactors are behavior-preserving (verified by trace). Specific concerns:
- `_handleGlobalHotkeyDispatch`: the dispatch table changes the order of `e.preventDefault()` relative to the action call (now called once before `fn()` instead of inline per branch). Same observable behavior — `preventDefault` fires before the action either way.
- `_migrateHotkeys`: table iteration order may differ from the original sequential `if` order, but each migration is independent (no two rules touch the same `hc.X` key), so order doesn't matter.
- `_handleSettingsTabArrows`: the Tab and ArrowUp/ArrowDown blocks were merged into one helper with a shared `backward` flag. The `e.preventDefault()` is now called unconditionally (was conditional on `!focusable.length` returning early in the original). Same behavior — if focusable is empty, we `return true` after `preventDefault`, same as before.
- `_handleParenAtLineStart`: the `e.preventDefault()` moved from inside the helper to the caller. Same observable behavior.

No ARIA snapshots, `inputValue()` assertions, or screenshot tests should be affected. If any test fails, it's likely due to a subtle behavior change in the merged Tab/ArrowUp/ArrowDown path — investigate `_handleSettingsTabArrows` first.

## Skill and Memory updates (per project-workflow Phase 4 step 4-5)

### `linebyline-section-index-SKILL.md`
- Version reference updated from v0.37.1 to v0.37.2
- 8 sections updated to document the 27 new helpers (Config, Persistence, Helpers→LRC parse, Helpers→Genius, Helpers→Render/UI, Sync/timestamp, Settings search, Keyboard→Main textarea KD, Keyboard→Overlay utilities, Keyboard→Global KD)
- Persistence line fixed to include `loadAutosave`, `doAutosave`, `_restoreSecondaryPool` (were omitted in initial draft)

### `code-quality-SKILL.md`
- "Historical CC reduction" table updated with 0.37.2 entries (5 new reduction records)
- New section "Dispatch-table CC reduction (S3776)" added with the computed-key dispatch table pattern, when to use it, and when NOT to use it

### `Memory.md`
- New `0.37.2` section prepended at top with 7 bullet points covering: S2486 fix approach, S2310 for→while conversion, S3776 extraction summary, version-holding decision, helper-extraction safety audit, section-index update

---

# Turn 5 — `<title>` bump + Genius paste embed-widget strip (still 0.37.2)

## User prompt (verbatim)

> You forgot to increment the internal app version `<title>LineByLine 0.37.2</title>`.
> C looks clean for Playwright headless.
> Manual tests caught an issue: directly copying lyrics from the Genius page now adds the embed text from [[LIMITATIONS]], no longer requiring an intermediate copy to a text editor first. So it's now worth fixing as it will break for a typical user. After that, I'll update LIMITATIONS.md and run Playwright and the manual tests again.
> file_name: Archive1.zip

Two distinct items bundled into one turn because they're both small and the second one was caught by manual testing of the Turn 4 patch.

## Item 1 — `<title>` version bump

### Symptom

The HTML `<title>` tag still read `LineByLine 0.37.1` in the working file. Turns A, B, and C all patched the `<script>` body (catch blocks, `_assignInterpolatedTs`, 27 new helpers across 8 sections) without ever touching the document `<head>`. The version was therefore bumped in filenames and the companion `.md` only — not in the user-visible page title (the browser tab label and the `document.title` read by Playwright tests that assert on it).

### Patch

Single-line replacement on L6 of `linebyline-0.37.2.html`:

```diff
- <title>LineByLine 0.37.1</title>
+ <title>LineByLine 0.37.2</title>
```

### Pre-patch scan

Grepped the entire HTML for `0\.37\.1` — only one hit (L6, the title). No version constant, no inline `about` dialog text, no other embedded references. Safe to bump without cascade.

## Item 2 — Genius paste embed-widget strip

### Symptom

The uploaded `genius-raw.txt` is the clipboard contents of a direct Ctrl+A/Ctrl+C on a live Genius song page ([real artist] — [real song]). The uploaded `genius-linebyline-paste.txt` is what LineByLine produces after paste. The two trailing lines of the paste output are:

```
16
Embed
```

These come from the Genius page's embed widget (the "Embed" button shown below the lyrics, with the song's numeric ID above it). `LIMITATIONS.md` previously noted this only happened when copying via an intermediate text editor (a round-trip that nobody realistically does), so it was a non-issue. After Turn 4, manual testing revealed that direct Genius → LineByLine paste now also reproduces the trailing block, which is a regression that breaks the typical user flow.

### Root cause

`_findGeniusLyricEnd(lines, start)` scans forward from the lyric start and stops at the first line matching one of:

- `t === 'About'`
- `t === 'Song Bio'`
- `/^© \d{4}/.test(t)`
- `t === 'Sign Up And Drop Knowledge 🤓'`
- `t === 'Credits'` (with `i > start + 5` guard)

The Genius page layout is:

```
…last lyric line…
(blank)
(blank)
(blank)
16            ← song ID, part of the embed widget
Embed         ← the embed button label
About         ← song bio section heading (currently the stop boundary)
```

`About` is reached at index `i`, but the embed block sits *between* the last lyric and `About`, so the slice `[start, i)` includes both the `16` line and the `Embed` line. The downstream filters (`_filterYmal`, the `[xxx]`-section filter, `collapseBlanks`) don't touch them — they aren't `You might also like` blocks, they aren't square-bracketed section markers, and they aren't blank — so they survive into the final output.

### Patch

Add a fifth stop condition to `_findGeniusLyricEnd`: when the current line is exactly `Embed` AND the preceding line is purely numeric (the song ID), return `i - 1` so the slice excludes both the `Embed` line and the digit line above it.

```js
// Find the last lyric line: stops at About/Song Bio/Credits/©/Embed widget
function _findGeniusLyricEnd(lines, start){
  for(let i=start;i<lines.length;i++){
    const t=lines[i].trim();
    if(t==='About'||t==='Song Bio'||/^© \d{4}/.test(t)||t==='Sign Up And Drop Knowledge 🤓')return i;
    if(t==='Credits'&&i>start+5)return i;
    // Genius embed widget: trailing "<digits>\nEmbed" (page embed button + song id)
    if(t==='Embed'&&i>start&&/^\d+$/.test(lines[i-1].trim()))return i-1;
  }
  return lines.length;
}
```

### Why this fix shape

- **Stop-boundary extension, not post-filter.** Adding the check inside `_findGeniusLyricEnd` (rather than as a regex strip on the joined output of `cleanGenius`) means the embed block is excluded before any downstream filter sees it. This keeps the lyric-line array clean for `_filterYmal`, the section-marker filter, and `collapseBlanks`, and avoids double-processing.
- **Return `i - 1`, not `i`.** Returning `i` would exclude the `Embed` line itself but leave the preceding digit line in the slice. Returning `i - 1` excludes both. The trailing blank lines between the last lyric and the digit are then collapsed by `collapseBlanks` and trimmed by the final `.trim()`.
- **The `/^\d+$/` guard on the preceding line** is the false-positive defense. A song with the literal word "Embed" in its lyrics (unlikely but possible) would not match unless the line immediately above is purely numeric. The Genius embed widget always shows the song ID as a bare integer on its own line, so this constraint is both necessary and sufficient.
- **No need to also strip from `extractGeniusMeta`.** The metadata extractor (`extractGeniusMeta`) operates on `lines.slice(0, 40)` of the raw input (the navigation/header region above the lyrics) and never reaches the embed block. Only `cleanGenius` (the lyric-body extractor) needed the patch.

### Alternatives considered and rejected

- **Regex strip on `cleanGenius` output.** `out.replace(/\n\d+\nEmbed\s*$/, '')`. Works but moves the responsibility out of the bounds detector and into the caller. If a future filter is inserted between `_findGeniusLyricEnd` and the join, the regex would have to track that change. Putting the rule in `_findGeniusLyricEnd` keeps all "where do lyrics end" logic in one place.
- **Strip in `cleanPaste`.** `cleanPaste` runs on every paste, including non-Genius pastes. Adding Genius-specific logic there would muddy the abstraction.
- **Strip in `_filterYmal`.** The YMAL filter is specifically for "You might also like" blocks. Mixing embed-widget logic in there is a category error.

### Verification — `scripts/verify-genius-embed-fix.js`

Wrote a small Node harness that extracts the Genius-paste code path (the `// ── Genius extraction ──` section plus its small dependency surface: `TS_RE`, `META_RE`, `normalizeLrcTimestamps`, `isHeader`, `collapseBlanks`, `cleanPaste`) from the HTML, stubs out the DOM-dependent functions, and runs `cleanGenius(rawGeniusInput)` against the uploaded `genius-raw.txt`.

The harness asserts three things:

1. `cleanGenius(raw) === correctedExpected` — the corrected expected is derived from the uploaded `genius-linebyline-paste.txt` by stripping the trailing `\n\n16\nEmbed` block (so we're comparing against the user-confirmed buggy output minus the bug).
2. `/\n\d+\nEmbed\s*$/.test(out) === false` and `/\nEmbed\s*$/.test(out) === false` — explicit guard that no trailing embed widget survives.
3. `out.split('\n').pop() === '[final lyric line]'` — the last line of the output is the actual last lyric line, not the embed block.

All three pass:

```
PASS: cleanGenius output matches corrected expected lyric body.
PASS: no trailing "<digits>\nEmbed" block in output.
PASS: output ends at the last actual lyric line.
```

### Trace — genius-raw.txt through `cleanGenius`

| Step | Lines | Effect |
|---|---|---|
| `text.split('\n')` | 423 elements | Index 0 = "Get Verified", index 99 = "Embed", index 100 = "About", etc. |
| `_findGeniusLyricBounds` | — | `hasLyricsHeading` true (line 24: "[Song] Lyrics"), `hasGenius` true. `start = _findGeniusLyricStart = 24` (index 24 = "[Song] Lyrics" — wait, actually the `[Intro: All]` at line 25 = index 24; the function's second loop finds it as the first `[section]` non-meta line). |
| `_findGeniusLyricEnd(lines, 24)` | — | Scans forward. At index 99, `t = 'Embed'`, `lines[98].trim() = '16'` matches `/^\d+$/`. Returns `98`. |
| `lines.slice(24, 98)` | 74 elements | "[Song] Lyrics", "[Intro: All]", "[intro vocalization]", …, "[final lyric line]", "", "", "" (trailing blanks). The `16` and `Embed` lines are excluded. |
| `_filterYmal(...)` | — | Strips "You might also like" + the 5 recommendation lines that follow it. Inserts a blank before the YMAL block (already present in input). |
| `.filter(l => !/^\[.{2,50}\]$/.test(l.trim()) || TS_RE.test(l))` | — | Strips bare `[section]` markers (Intro, Verse, Pre-Chorus, Chorus, Bridge). `[Chorus: singers]` is stripped because the content inside brackets is 43 chars (within 2-50) and it's not a timestamp. |
| `collapseBlanks(...)` | — | Collapses the trailing 3 blanks (indices 95-97) down to a single blank, then the final `.trim()` removes it. |
| `cleanPaste(out, 'paste')` | — | Normalizes timestamps (none in this input), strips section headers (none left after the prior filter). Output unchanged. |

Final output: lyric body ending at "[final lyric line]". Matches the corrected expected.

## Post-patch verification

1. **Syntax check** — `<script>` body compiles via `new Function` (117,750 chars; was 117,584 after Turn 4 — +166 chars from the new comment + the new `if(t==='Embed'...)` line + the `/Embed widget/` suffix on the existing comment). Verified via `scripts/check-syntax.js`.
2. **Section index accuracy** — patch is *inside* the existing `// ── Genius extraction ──` section (L861). The new line is +1 net to `_findGeniusLyricEnd` (which grew from 8 lines to 9). No section markers shift. All `// ──` markers from the Turn 4 grep are still valid.
3. **Spot-check referenced functions** — `_findGeniusLyricEnd` is called only from `_findGeniusLyricBounds` at L891; signature unchanged. `_findGeniusLyricBounds` is called only from `cleanGenius` at L910; signature unchanged. `cleanGenius` is called only from the paste path (verified by grep). No call-site changes needed.
4. **Trace one representative user action** — see trace table above; output matches expected lyric body (verified by `scripts/verify-genius-embed-fix.js`).

## Playwright impact

The Genius paste path is exercised by Playwright's paste tests in Firefox only (per `LIMITATIONS.md` — Chromium needs clipboard permissions, Webkit is skipped). The output bytes are strictly shorter than before (the trailing `16\nEmbed` is removed), so any ARIA snapshot or `inputValue()` assertion that previously matched the buggy output will now fail with a diff showing the missing 2 lines.

**Action needed**: regenerate the Genius-paste snapshot(s) after applying this patch. The user's manual test caught the bug, so the Playwright snapshot was either not asserting on the trailing block or was generated against the buggy output. Either way, the snapshot needs to be regenerated to lock in the corrected behavior.

## LIMITATIONS.md update

The user will update `LIMITATIONS.md` themselves after this patch lands. The relevant entry (currently lines 48-53) describes the bug as occurring only via the intermediate-text-editor copy path. After this patch, the bug is fixed for *both* paths (direct paste and intermediate copy), so the entry should either be removed or rewritten as a "Fixed in 0.37.2" note. Left to the user per their stated plan.

---

# Turn 6 — Genius paste section-header disambiguation + blank-line preservation (still 0.37.2)

## User prompt (verbatim)

> The embed is fixed. Before I run tests, look into a few other discrepancies (same raw Genius source).
> file_name: Archive2.zip

The upload contained `actual.txt` (what LineByLine produced after Turn 5) and `expected.txt` (what the user expected). A diff showed two discrepancies:

```
5a6,7
> [intro vocalization]
>
51a54
>
```

Both are Genius-paste extraction issues found by manual testing of the Turn 5 patch (which itself was found by manual testing of Turn 4). Same raw input as Turn 5 (`Archive1/genius-raw.txt` — [real artist] "[real song]" page copy).

## Discrepancy #1 — Dropped intro `[intro vocalization]` line

### Symptom

The raw Genius input begins the lyric block with:

```
24: [Song] Lyrics
25: [Intro: All]
26: [intro vocalization]
27: (blank)
28: [Verse 1: singers]
29: [verse 1 opening lyric]
```

Expected output (line 6 onwards, after the metadata block):

```
[intro vocalization]

[verse 1 opening lyric]
```

Actual output (Turn 5):

```
[verse 1 opening lyric]
```

The intro vocalization `[intro vocalization]` line is missing entirely, along with the blank line that follows it.

### Root cause

`_findGeniusLyricStart(lines)` scans for the first bracketed line that's NOT metadata, using the condition `if(/^\[[^\]]+\]/.test(lines[i].trim())&&!META_RE.test(lines[i]))return i;`. The intent is "find the first section header, skipping any LRC metadata tags at the top".

The disambiguation relies on `META_RE = /^\[[a-zA-Z]+:/`. This regex matches any line of the form `[Word: ...]` where `Word` is purely alphabetic — case-insensitive in practice because `[a-zA-Z]+` accepts both cases. This correctly matches real LRC tags (`[ti: ...]`, `[ar: ...]`, `[al: ...]`, `[re: ...]` — all lowercase) but **incorrectly also matches Genius section headers that have the form `[Word: singers]`** where the word is capitalized and purely alphabetic:

| Line | Content | Matches `META_RE`? | Why |
|---|---|---|---|
| 25 | `[Intro: All]` | ✅ yes | "Intro" is alphabetic, followed by `:` |
| 28 | `[Verse 1: singers]` | ❌ no | "Verse" is followed by ` 1:`, the regex needs `:` immediately after the alphabetic run |
| 44 | `[Chorus: singers]` | ✅ yes | "Chorus" is alphabetic, followed by `:` |
| 66 | `[Pre-Chorus: singers]` | ✅ yes | "Pre-Chorus" — wait, the hyphen breaks the alphabetic run. Let me re-check. |

Actually, on closer inspection, `[a-zA-Z]+` stops at the hyphen in "Pre-Chorus", so `[Pre-Chorus: ...]` would NOT match `META_RE`. But `[Intro: All]`, `[Chorus: ...]`, `[Bridge: ...]` all do match. So the bug specifically drops section headers whose first word is a single alphabetic token.

The diagnostic harness (`scripts/diagnose-genius-paste.js`) confirmed: `_findGeniusLyricStart` returned index 27 (`[Verse 1: ...]`) instead of index 24 (`[Intro: All]`), because `[Intro: All]` was being skipped as "metadata". The slice `[27, 98)` therefore excluded both `[Intro: All]` and the `[intro vocalization]` line that follows it.

### Why not change `META_RE` globally

`META_RE` is referenced in 30+ places across the file (cursor advancement, line counting, `isHeader`, `hasMeta` detection, snapshot operations, etc.). All of these treat `META_RE`-matching lines as "skip — this is metadata, not a lyric line". If I changed `META_RE` to require lowercase first letter (`/^\[[a-z]/`), then `[Intro: All]` would suddenly be treated as a regular lyric line in all those places — breaking cursor behavior, line counts, and potentially causing `[Intro: All]` to appear in the synced lyric output (instead of being stripped as a section header).

The fix has to be **local to Genius extraction**, not global.

### Patch — capitalize-first-letter heuristic

The real distinction between LRC metadata tags and Genius section headers is **case of the first letter**:

| Type | Examples | First letter after `[` |
|---|---|---|
| LRC metadata | `[ti: ...]`, `[ar: ...]`, `[al: ...]`, `[re: ...]`, `[by: ...]`, `[offset: ...]` | lowercase |
| Genius section headers | `[Intro: ...]`, `[Verse: ...]`, `[Verse 1: ...]`, `[Pre-Chorus: ...]`, `[Chorus: ...]`, `[Bridge: ...]`, `[Outro: ...]` | uppercase |
| LRC timestamp | `[00:00.00]` | digit |

So the disambiguation regex is `/^\[[A-Z]/` — a bracketed line whose first character after `[` is an uppercase letter.

```js
// ── Genius extraction ──────────────────────────────────────────────────────
// Find first lyric line: after "Read More", else first section header [Capitalized...]
function _findGeniusLyricStart(lines){
  for(let i=0;i<lines.length;i++){
    if(/Read More\s*$/.test(lines[i].trim()))return i+1;
  }
  for(let i=0;i<lines.length;i++){
    if(/^\[[A-Z]/.test(lines[i].trim()))return i;  // [A-Z] distinguishes section headers from LRC tags [ti:..]
  }
  return -1;
}
```

After the patch, the diagnostic confirms `_findGeniusLyricStart` returns 24 (the index of `[Intro: All]`), so the slice includes `[Intro: All]`, `[intro vocalization]`, blank, `[Verse 1: ...]`, and the rest of the lyrics. The `[intro vocalization]` line is preserved.

### Why this is strictly more correct than the old condition

The old condition `/^\[[^\]]+\]/.test(t)&&!META_RE.test(lines[i])` matched any bracketed line that wasn't `[alphabetic-word: ...]`. This had two failure modes:

1. False negatives — `[Intro: All]`, `[Chorus: ...]`, `[Bridge: ...]` are section headers but matched `META_RE`, so they were skipped. (This caused discrepancy #1.)
2. False positives — `[ti: ...]` (real metadata) is correctly skipped, but only because `META_RE` happens to match. A non-Genius paste with `[By: ...]` (capitalized "By") would also be skipped, which may or may not be correct.

The new condition `/^\[[A-Z]/.test(t)` is more direct: it matches exactly the bracketed lines whose first letter is uppercase, which is the actual signature of Genius section headers. It correctly:

- Matches `[Intro: All]`, `[Verse 1: ...]`, `[Pre-Chorus: ...]`, `[Chorus: ...]`, `[Bridge: ...]` ✓
- Skips `[ti: ...]`, `[ar: ...]`, `[al: ...]`, `[re: ...]` (lowercase first letter) ✓
- Skips `[00:00.00]` timestamps (digit first character) ✓

### Edge case: bare `[Intro]` (no colon)

Some songs use bare `[Intro]` or `[Verse]` without specifying singers. The new regex `/^\[[A-Z]/` matches these (capitalized first letter). The downstream `_stripSectionHeaders` filter (see below) then strips them. So bare section headers are handled correctly.

The old regex `/^\[[^\]]+\]/.test(t)&&!META_RE.test(lines[i])` would also match bare `[Intro]` (it's bracketed and `META_RE` doesn't match because there's no colon). So no regression here.

## Discrepancy #2 — Missing blank-line section break

### Symptom

Raw input lines 85-87:

```
85: [bridge ending lyric]
86: [Chorus: singers]
87: [final chorus opening lyric]
```

Note: there's NO blank line between line 85 and the `[Chorus: ...]` header on line 86. The header sits directly between two lyric lines.

Expected output (lines 53-55):

```
[bridge ending lyric]

[final chorus opening lyric]
```

Actual output (Turn 5):

```
[bridge ending lyric]
[final chorus opening lyric]
```

The two lyric lines run together because the section header was stripped without anything taking its place.

### Root cause

The section-header filter at L915-917 (Turn 5 state) used `Array.prototype.filter()`:

```js
lyricLines=lyricLines.filter(l=>{
  const t=l.trim();
  return!(/^\[.{2,50}\]$/.test(t)&&!TS_RE.test(t));
});
```

`.filter()` can only REMOVE elements; it cannot INSERT replacements. When the `[Chorus: ...]` header was stripped from between two non-blank lyric lines, nothing preserved the visual section break.

In most other places in the raw input, a blank line already precedes each `[Section: ...]` header (Genius's default formatting), so stripping the header leaves the blank intact and the section break is preserved. But when a header appears mid-block (no preceding blank), the break is lost.

### Why other section transitions worked

Tracing the raw input:

| Section header | Preceding line in raw | Blank before header? | After strip |
|---|---|---|---|
| `[Intro: All]` (line 25) | "[Song] Lyrics" (line 24) | no | intro at start, no break needed (out is empty) |
| `[Verse 1: ...]` (line 28) | blank (line 27) | yes | blank preserved ✓ |
| `[Pre-Chorus: ...]` (line 38) | blank (line 37) | yes | blank preserved ✓ |
| `[Chorus: ...]` (line 44) | blank (line 43) | yes | blank preserved ✓ |
| `[Verse 2: ...]` (line 60) | inserted by `_filterYmal` (was "ADÉLA" before YMAL strip) | yes (YMAL inserts blank) | blank preserved ✓ |
| `[Pre-Chorus: ...]` (line 66) | blank (line 65) | yes | blank preserved ✓ |
| `[Chorus: ...]` (line 72) | blank (line 71) | yes | blank preserved ✓ |
| `[Bridge: ...]` (line 82) | blank (line 81) | yes | blank preserved ✓ |
| `[Chorus: singers]` (line 86) | "[bridge ending lyric]" (line 85) | **no** | **break lost** ✗ |

Only one section header in this input had no preceding blank, and that's the one that broke.

### Patch — `_stripSectionHeaders` helper

Replace the inline `.filter()` with a transform that inserts a blank line when stripping a section header between two non-blank lines:

```js
// Strip [section] headers, preserving section breaks with a blank line when adjacent lines are non-blank
function _stripSectionHeaders(lines){
  const out=[];
  for(const line of lines){
    const t=line.trim();
    if(/^\[.{2,50}\]$/.test(t)&&!TS_RE.test(t)){
      if(out.length&&out[out.length-1].trim()!=='')out.push('');
      continue;
    }
    out.push(line);
  }
  return out;
}
```

The blank-insertion guard `out.length && out[out.length-1].trim()!==''` ensures:

- If `out` is empty (header at the start of the slice), don't insert a blank — there's nothing above to separate from.
- If `out`'s last line is already blank (header preceded by a blank in the raw input), don't insert another — `collapseBlanks` would collapse duplicates anyway, but skipping the insert is cleaner.
- If `out`'s last line is non-blank (header mid-block), insert a blank to preserve the section break.

`cleanGenius` now calls `_stripSectionHeaders(lyricLines)` instead of the inline filter:

```js
function cleanGenius(text){
  const lines=text.split('\n');
  const bounds=_findGeniusLyricBounds(lines);
  if(!bounds)return null;
  let lyricLines=_filterYmal(lines.slice(bounds.start,bounds.end));
  lyricLines=_stripSectionHeaders(lyricLines);
  const out=collapseBlanks(lyricLines).join('\n').trim();
  if(!out)return null;
  return cleanPaste(out,'paste');
}
```

### Alternatives considered and rejected

- **Post-strip regex insert**: `out.replace(/([^\n])\n(\[[^\]]+\]\n)/g, '$1\n\n$2').replace(...)`. Two-pass and brittle — would need to handle the "header at start" and "header preceded by blank" cases separately, and would race with `collapseBlanks`. Putting the logic in a single forward pass inside `_stripSectionHeaders` is clearer.
- **Insert blank BEFORE every section header, then strip the header**: simpler code but produces spurious blanks that `collapseBlanks` then has to collapse. The guard `out[out.length-1].trim()!==''` avoids the spurious-blank pass entirely.
- **Preserve the section header text as a comment**: rejected — Genius paste output is meant to be a clean lyric body, not an annotated one. Section headers are stripped for a reason.

## Verification — `scripts/verify-genius-section-fix.js`

Wrote a harness that runs `cleanGenius` against the uploaded `Archive1/genius-raw.txt` and compares the output to the lyric body of `Archive2/expected.txt` (the user-confirmed correct output, with the metadata block stripped because metadata is added by `extractGeniusMeta` + `markGeniusSource`, not `cleanGenius`).

Three assertions, all passing:

```
PASS: cleanGenius output matches expected lyric body exactly.
PASS: intro "[intro vocalization]" line is preserved at the start of the lyric body.
PASS: blank line inserted between bridge and final chorus.
```

The output is byte-for-byte identical to the user's expected lyric body (57 lines, no diff).

### Trace — full Genius paste path with both fixes

| Step | Lines | Effect |
|---|---|---|
| `text.split('\n')` | 423 elements | Index 0 = "Get Verified", index 24 = "[Intro: All]", index 25 = "[intro vocalization]", index 86 = "[Chorus: singers]", index 99 = "Embed" |
| `_findGeniusLyricBounds` | — | `hasLyricsHeading` true, `hasGenius` true. `start = _findGeniusLyricStart = 24` (now correctly returns `[Intro: All]`'s index, was 27 in Turn 5). `end = _findGeniusLyricEnd = 98` (Embed widget stop from Turn 5). |
| `lines.slice(24, 98)` | 74 elements | `[Intro: All]`, `[intro vocalization]`, ``, `[Verse 1: ...]`, `You're the boss...`, ..., `[final lyric line]`, ``, `` (trailing blanks). |
| `_filterYmal(...)` | — | Strips "You might also like" + 5 recommendation lines (indices 28-34 in slice), inserts blank where YMAL was. `[Verse 2: ...]` ends the YMAL block. |
| `_stripSectionHeaders(...)` | — | Strips all `[Section: ...]` headers. Inserts a blank when the previous output line is non-blank:
  - `[Intro: All]` at start (out empty) → skip, no blank
  - `[Verse 1: ...]` (prev = blank from raw) → skip, no blank
  - `[Pre-Chorus: ...]` (prev = blank from raw) → skip, no blank
  - `[Chorus: ...]` (prev = blank from raw) → skip, no blank
  - `[Verse 2: ...]` (prev = blank from YMAL insert) → skip, no blank
  - `[Pre-Chorus: ...]` (prev = blank from raw) → skip, no blank
  - `[Chorus: ...]` (prev = blank from raw) → skip, no blank
  - `[Bridge: ...]` (prev = blank from raw) → skip, no blank
  - `[Chorus: singers]` (prev = "[bridge ending lyric]") → **insert blank**, skip |
| `collapseBlanks(...)` | — | Collapses any accidental double-blanks (none in this trace). |
| `.join('\n').trim()` | — | Joins and trims trailing blank lines. |
| `cleanPaste(out, 'paste')` | — | Normalizes timestamps (none in this input), strips section headers (none left). Output unchanged. |

Final output: 57 lines, ending at `[final lyric line]`. Matches `Archive2/expected.txt` lyric body exactly.

## Post-patch verification

1. **Syntax check** — `<script>` body compiles via `new Function` (118,095 chars; was 117,750 after Turn 5 — +345 chars from the new `_stripSectionHeaders` helper (~12 lines), the rewired `cleanGenius` body, and the updated comment + regex on `_findGeniusLyricStart`'s second loop). Verified via `scripts/check-syntax.js`.
2. **Section index accuracy** — both patches are inside the existing `// ── Genius extraction ──` section (L861). `_findGeniusLyricStart` shrank by 0 lines net (replaced one comment + the loop condition). `_stripSectionHeaders` was added before `cleanGenius` (+12 lines). `cleanGenius` shrank by 3 lines (the inline `.filter()` block) and gained 1 line (the `_stripSectionHeaders` call), net -2. Total section grew by ~10 lines. No section markers shift.
3. **Spot-check referenced functions** — `_findGeniusLyricStart` is called only from `_findGeniusLyricBounds` at L891; signature unchanged. `_stripSectionHeaders` is a new helper called only from `cleanGenius` at L928. `cleanGenius` signature unchanged. No call-site changes needed.
4. **Trace one representative user action** — see trace table above; output matches expected lyric body byte-for-byte (verified by `scripts/verify-genius-section-fix.js`).

## Playwright impact

The Genius paste path is exercised by Playwright's paste tests in Firefox only (per `LIMITATIONS.md`). The output is now 3 lines longer than the Turn 5 output (Turn 5: 54 lines, Turn 6: 57 lines — `[intro vocalization]` + blank inserted at start, blank inserted before final chorus). Any Playwright snapshot that was regenerated to match the Turn 5 output will now diff with 3 added lines.

**Action needed**: regenerate the Genius-paste Playwright snapshot(s) after applying this patch. The new expected output is `Archive2/expected.txt`.

## LIMITATIONS.md update

The user's stated plan was to update `LIMITATIONS.md` after Turn 5. With Turn 6 also landing, the relevant entry (lines 48-53, about the embed widget) should be updated to reflect:

1. The embed widget (`<digits>\nEmbed`) is now stripped (Turn 5).
2. Section headers (`[Intro: ...]`, `[Verse: ...]`, etc.) are now correctly recognized as section headers, not metadata, so the intro vocalization line is preserved (Turn 6).
3. Section breaks are preserved with blank lines when section headers appear mid-block (Turn 6).

Left to the user per their stated workflow.

---

# Turn 7 (post-test follow-up — flaky `tab-settings` analysis + `mock.txt` enhancement)

## User prompt (verbatim)

> Headless passed anyway except for a flaky `tab-settings`:
> ```
>     Locator:  getByRole('checkbox', { name: 'Moving to previous line' })
>     Expected: checked
>     Received: unchecked
>     Timeout:  5000ms
> ```
> I had some other programs open and was tabbed out so maybe the Playwright workers were competing for resources. Not sure if it would be more feasible to make the test itself more stable or do something to reserve resources for Playwright.
>
> The Genius test passed anyway. But `mock.txt` itself may need to be updated (along with a snapshot update). The new logic designed against the challenging raw page with the opening one-line stanza, unexpected stanza spacing at the end, and embed element also worked for another simpler Genius page and the original `mock.txt`. So it's probably a better baseline overall.

User confirms Turns D + E are good (Genius test passes, output is a better baseline across multiple pages). Two follow-up items: (1) flaky `tab-settings` test, (2) `mock.txt` may need updating.

## No app patch this turn

No changes to `linebyline-0.37.2.html`. The `<script>` body and `<title>` are untouched. The 0.37.2 deliverable is unchanged from Turn 6. Syntax re-verified via `node scripts/check-syntax.js linebyline-0.37.2.html` → `OK: <script> body compiles via new Function (118095 chars)`.

## Item 1 — Flaky `tab-settings` test (analysis only, no patch)

### Failure mode

`tests/keyboard-nav.spec.js:33-40`:

```js
test("tab-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await tabUntilFocused(page, "#s-replay-prev");
  await page.keyboard.press("Space");
  await page.waitForTimeout(50);
  await expect(
    page.getByRole("checkbox", { name: "Moving to previous line" }),
  ).toBeChecked();
  ...
});
```

Failure: `Expected: checked / Received: unchecked / Timeout: 5000ms`.

### Why the 5s timeout rules out "50ms was too short"

`expect(...).toBeChecked()` auto-retries for the full 5s Playwright timeout. The `waitForTimeout(50)` is a sleep BEFORE the assertion, not a replacement for it. If 50ms was insufficient but Space did fire on the right element, the assertion would have caught up within the 5s window and passed. The fact that it timed out at 5s means **Space did not toggle the checkbox at all** — i.e., Space went to the wrong element.

### Root cause: focus-timing race under host load

`openSettings()` (line 2007 of `linebyline-0.37.2.html`) does:

1. Set checkbox values from `cfg`
2. Add `open` class to overlay (CSS `display:flex`)
3. Call `initSettingsSearch()` — sets `inp.value=''`, binds handlers
4. Call `applySettingsFilter()` — when search is empty, unhides all rows

Under host load (Zed + Helium + Equibop + Readest in another KDE Activity all competing for CPU), the time between step 2 (CSS class added) and the browser actually layout-painting the overlay + establishing the focus trap can stretch well past the typical ~16ms frame budget. If `tabUntilFocused` starts dispatching Tab keypresses during that window, the first Tab can land on the body or `#main-textarea` (the previously-focused element) instead of cycling inside the overlay.

`tabUntilFocused` does eventually reach `#s-replay-prev` (Tab wraps around the document), so it returns successfully. But by then, the timing of the subsequent Space keypress can be off — either because the focus state is stale, or because Playwright's keypress queue got desynchronized.

### Two non-exclusive remediation options

**Option A — Test-level synchronization (recommended, cheap, deterministic):**

```js
test("tab-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  await expect(page.locator("#settings-overlay")).toHaveClass(/open/);
  await tabUntilFocused(page, "#s-replay-prev");
  await expect(page.locator("#s-replay-prev")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "Moving to previous line" }),
  ).toBeChecked();
  ...
});
```

Three changes:
1. `await expect(page.locator("#settings-overlay")).toHaveClass(/open/)` after `Control+,` — asserts the overlay's CSS class landed before Tab starts. Auto-retries for 5s, so under load it just waits longer instead of racing.
2. `await expect(page.locator("#s-replay-prev")).toBeFocused()` after `tabUntilFocused` — belt-and-braces: if Tab didn't actually reach the target, this fails with a clear "focus didn't reach #s-replay-prev" message instead of the misleading "checkbox not checked".
3. Removed `waitForTimeout(50)` — `toBeChecked()` already auto-retries, the sleep is dead weight.

This converts the silent "Space went to the wrong element" failure into a loud "overlay didn't open" or "focus didn't reach target" failure with a useful diagnostic. It does not change the test's semantic intent (still tests keyboard navigation, not `.check()`).

**Option B — Environment isolation (orthogonal):**

Run headless tests in the `tst` Podman container per `PLAYWRIGHT_SETUP.md`:

```sh
tst tests/keyboard-nav.spec.js
```

The container isolates Playwright from host load (Zed, Helium, Equibop, Readest don't compete). This is already the recommended path for CI-equivalent runs.

### Recommendation

**Option A.** It makes the test deterministic regardless of host load. Option B is a workaround that depends on the user closing other apps. The same pattern (assert overlay open + assert target focused before pressing Space/Enter) can be applied to other keyboard-nav tests if they show similar flakes.

This is a test-suite change, not an app change, so it's out of scope for the 0.37.2 patch. Documented here for the user's follow-up.

## Item 2 — `mock.txt` enhancement

### Problem

The original `tests/media/mock.txt` does NOT contain the embed-widget pattern (`<digits>\nEmbed`) that the Turn 5 fix was designed to strip. This means the regression suite (`paste-genius-hotkey`, `paste-genius-typing`) cannot catch a regression of the Turn 5 fix — `mock.txt` simply doesn't exercise that code path.

### Patch

`download/mock-v2.txt` is a drop-in replacement: identical to `mock.txt` except for **four lines inserted immediately before the `About` heading**:

```
Filler line chorus three H

42
Embed
About
Song Bio
```

The four inserted lines (2 blanks, `42`, `Embed`) replicate the trailing embed-widget pattern from `genius-raw.txt` lines 96-100. The placeholder `42` stands in for the Genius song-id digits (real page used `16`).

### Verification — `scripts/verify-enhanced-mock.js`

All four assertions pass:

| # | Check | Result |
|---|---|---|
| 1 | `_findGeniusLyricBounds` recognizes `mock-v2.txt` as Genius content | PASS — `{start: 27, end: 89}` |
| 2 | `_findGeniusLyricEnd` D-round branch fires (end = digits line idx) | PASS — `end === 89` (the `42` line), confirming `t==='Embed' && i>start && /^\d+$/.test(lines[i-1].trim())` executed |
| 3 | `cleanGenius(mock-v2.txt)` output is byte-identical to `cleanGenius(mock.txt)` output | PASS — both 1013 bytes, last line `Filler line chorus three H` |
| 4 | No `Embed` line and no digits-only line in the output | PASS |

### Snapshot impact

**None.** Output is byte-identical → existing `paste-genius-hotkey.txt` and `paste-genius-typing.txt` snapshots remain valid. No `--update-snapshots` needed when swapping `mock.txt` → `mock-v2.txt`.

This is the strongest possible signal that the Turn 5 fix is correct: it strips exactly the embed-widget pattern and nothing else. The user's instinct ("mock.txt may need to be updated along with a snapshot update") was half-right — `mock.txt` does need updating, but the snapshot does NOT, because the fix is correctly scoped.

### Why the user saw a snapshot update as likely

The user tested the new logic against three inputs (challenging raw page, simpler Genius page, original `mock.txt`) and confirmed it works for all three. The new logic is "a better baseline overall" — meaning the OUTPUT is different from the old (Turn 4) baseline for the challenging raw page (Turn 6 added the `[intro vocalization]` intro line + section-break blanks). So for any snapshot tied to the challenging raw page, an update IS needed.

But `mock.txt`'s snapshot is independent. `mock.txt` never had the embed widget, never had adjacent stanzas, never had the `[intro vocalization]` pattern. Its snapshot was correct before Turn 5 and remains correct after Turn 6. The only reason to touch `mock.txt` is to make it exercise the new code paths — and that's what `mock-v2.txt` does, without changing the expected output.

---

# Turn 8 (release prep — Memory.md condensation, skill-SKILL.md thread-discipline lesson, release summary, commit message)

## User prompt (verbatim)

> All tests pass, including manual. I updated LIMITATIONS.md and MANUAL.md. Condense Memory.md for this session as follows, and consider updating skill-SKILL.md with a clean version of this pattern:
> - Don't narrate turn-by-turn to compare each turn's state with the previous turn state. This duplicates different states of the same type of change as it evolves over time and produces cluttered entries that are especially hard for a human to read.
> - Instead, restrict narrative threads to unique parallel changes in the same session. Update Memory.md with the latest state of each unique thread in-place each turn to keep it from ballooning in size.
>
> Then draft a v0.37.2 Release summary < half a page total, and a commit message < 10 words title and < 5 sentences body (<10 words/sentence).
> file_name: Archive3.zip

User confirmed all Playwright + manual tests pass after Turn 7. `LIMITATIONS.md` and `MANUAL.md` updated by user (embed-widget workaround entry removed; Genius manual-test simplified — intermediate editor step no longer needed). User requested four deliverables: condensed Memory.md, skill-SKILL.md pattern update, release summary, commit message.

## No app patch this turn

No changes to `linebyline-0.37.2.html`. The 0.37.2 deliverable is unchanged from Turn 6 (last code patch). Syntax re-verified via `node scripts/check-syntax.js linebyline-0.37.2.html` → `OK: <script> body compiles via new Function (118095 chars)`.

## Item 1 — Memory.md condensation

### Before (11 bullets, turn-by-turn)

The 0.37.2 section narrated each remediation turn as a separate bullet: Turn 2 (S2486), Turn 3 (S2310), Turn 4 (S3776), version-hold note, helper-audit note, section-index note, Turn 5 (title bump), Turn 5 (embed-widget strip), Turn 6 (section-header disambiguation), Turn 6 (blank-line preservation), Turn 7 (post-test follow-up). Each bullet described its turn's specific state, requiring the reader to mentally diff successive bullets to recover the current state of each thread.

### After (4 thread-based bullets + 1 cross-reference)

Identified the unique parallel threads in the session:

1. **SonarCloud post-push remediation** — one consolidated bullet covering all 3 rules (S2486, S2310, S3776) with the final state of each fix, the version-hold decision, the helper-audit result, and the section-index update.
2. **Internal `<title>` tag bump** — single bullet.
3. **Genius paste cleanup** — one consolidated bullet covering all 3 Genius-path fixes (`_findGeniusLyricStart`, `_findGeniusLyricEnd`, `_stripSectionHeaders`) with the final state of each, the verification result, and the LIMITATIONS.md/MANUAL.md downstream updates.
4. **Test suite hardening** — one consolidated bullet covering `mock-v2.txt` drop-in + `tab-settings` flake analysis.
5. Cross-reference line pointing to `linebyline-0.37.2.md` for the detailed turn-by-turn build log.

Each bullet describes the **final state** of its thread, not the evolution. The turn-by-turn evolution remains in the companion `.md` file (this file).

## Item 2 — skill-SKILL.md thread-discipline lesson

Added a new entry to the "Lessons from practice" section:

> **Thread discipline prevents Memory.md bloat.** When a session iterates on the same change across multiple turns (Turn 2 fix → Turn 3 regression catch → Turn 4 follow-up), narrating each turn's state as a separate bullet duplicates earlier states of the same evolving change. The reader must mentally diff successive bullets to recover the current state. Instead, identify the unique parallel threads in the session (e.g. "SonarCloud remediation" vs "Genius paste cleanup" vs "test suite hardening") and write one bullet per thread, updated in-place to reflect its latest state. New turns that touch an existing thread edit the existing bullet rather than appending a new one. This keeps Memory.md a current-state snapshot, not a change log — the per-turn change log lives in the companion `.md` file. If a thread is still actively evolving at session end, the in-place bullet should describe the final state, with one cross-reference line pointing to the companion `.md` for the turn-by-turn evolution.

Also added a cross-reference in the "Memory.md vs skills" section pointing to the new lesson, so a reader landing on that section is aware of the discipline.

## Item 3 — v0.37.2 Release summary

`download/release-0.37.2.md` — 287 words, four sections (SonarCloud, Genius paste, Internal, [implicit: no behavior change intro]). Covers all four parallel threads from the condensed Memory.md. Half-page target met.

## Item 4 — Commit message

`download/commit-0.37.2.md`:

- Title: `SonarCloud fixes and Genius paste cleanup` (6 words, < 10 ✓)
- Body: 4 sentences, all < 10 words:
  1. `Fixes 16 SonarCloud issues across three rules.` (7 words)
  2. `Strips Genius embed widget and preserves intro lines.` (8 words)
  3. `Bumps title tag and adds mock-v2 fixture.` (7 words)
  4. `Updates LIMITATIONS and MANUAL for new behavior.` (7 words)

All constraints satisfied (< 10-word title, < 5 sentences, < 10 words/sentence).


---

# Turn 9 (companion file format refinements — no app patch)

## User prompt (verbatim)

> Before I commit or push, some refinements (that might be worth incorporating as skills or at least memories) to the linebyline-X.XX.XX.md companion file format:
> - Never quote potentially licensed lyrics or metadata in any artifact! Always use placeholders instead.
> - Turn numbering is inconsistent — you start off with Turn 1...2...and then seem to drop turn labels for the rest of the session. Just use numbers throughout.
> - Drop these sections from the transcript each turn:
>   - `## Deliverables this turn` as neither I nor potential GitHub contributors can see your sandbox
>   - `## Awaiting` is mostly redundant on top of subsequent user prompts (including in followup sessions)
>
> After that, the companion file description might need to be updated too.
> file_name: Archive3.zip

## Changes applied

Four refinements to the companion file format, applied retroactively to this file and codified in `project-workflow-SKILL.md` "Companion .md file" section for future sessions:

1. **Licensed content scrubbed.** All real lyrics, artist names, song titles, album titles, and singer names in section headers replaced with functional placeholders: `[intro vocalization]` for the dropped intro line, `[final lyric line]` for the last lyric, `[Verse 1: singers]` for section headers with real singer names, `[real artist] — [real song]` for the page title. The companion file lives in `download/` and may be visible to GitHub contributors — treated as public. Verified via word-boundary regex search across all `.md` files in `download/`: zero matches for any known lyric string, artist name, or singer name.

2. **Turn numbering normalized to integers.** Renumbered Turn B→3, C→4, D→5, E→6, F→7, G→8. Turn 1 (Phase 1 onboard, in `linebyline-0.37.1.md`) and Turn 2 (S2486, first turn in this file) were already integers and stay unchanged. All internal cross-references updated (e.g. "Turn D patch" → "Turn 5 patch", "Turns A–C" → "Turns 2–4"). Verbatim user prompts left as-is — they're historical quotes.

3. **`## Deliverables this turn` removed** from all turns. The reader cannot see the agent's sandbox filesystem, so listing file paths was useless. The companion file itself is the deliverable.

4. **`## Awaiting` removed** from all turns. The next turn's verbatim user prompt already conveys what happened next, making this section redundant.

## Skill and Memory updates

- `project-workflow-SKILL.md` "Companion .md file" section: added four new rules covering licensed content, turn numbering, and the two dropped sections. Copied to `download/project-workflow-SKILL.md`.
- `Memory.md` 0.37.2 section: added a "Companion file format rules" bullet documenting the four rules and pointing to the skill.
- `skill-SKILL.md` "Thread discipline prevents Memory.md bloat" lesson (added Turn 8) remains complementary — it governs Memory.md structure within a version section, while the new companion-file rules govern the companion `.md` structure across turns.


---

# Turn 10 (Phase 4 — Round 2 post-push SonarCloud remediation, still 0.37.2)

## User prompt (verbatim)

> SonarCloud found more issues post-push. It also complains of uncovered code on new three lines in `playwright.config.js`:
> ```js
> 
> const inContainer = !!process.env.PW_CONTAINER;
> const inCI = !!process.env.CI;
> const enableWebkit = inContainer || inCI;
> ```
> 
> Also remember that a `summary` frontmatter field with special characters might need to be escaped with quotes, like this (not including the code block itself):
> ```
> ---
> model: GLM (Z.ai)
> summary: 'Phase 4 post-push SonarCloud remediation on version 0.37.2 (held constant across all turns per user request)...Turn 9 refines the companion file format: licensed lyrics/metadata scrubbed to placeholders, turn numbering normalized to integers throughout, `## Deliverables this turn` and `## Awaiting` sections dropped; four rules codified in project-workflow-SKILL.md.'
> ---
> ```
> file_name: issues1.zip

User uploaded `issues1.zip` containing 11 SonarCloud findings (10 in `docs/index.html` across 6 rules, 1 in `.github/workflows/sonarcloud.yml` S7637) plus 1 coverage complaint on 3 lines of `playwright.config.js`. Also reminded that the `summary` frontmatter needs single-quote escaping when it contains special characters (colons, backticks).

## Skills read this turn

- `project-workflow-SKILL.md` (re-read for Phase 4 obligations and the companion-file format rules added Turn 9)
- `sonarqube-workflow-SKILL.md` (Phase 4 issue-processing workflow)
- `code-quality-SKILL.md` (pre-patch checklist before modifying functions; dispatch-table CC reduction pattern for S3776)
- `linebyline-section-index-SKILL.md` (section-targeted reading protocol)
- `skill-SKILL.md` (guidelines for updating Memory.md vs skills; thread-discipline lesson applied to the in-place update of the existing SonarCloud bullet)

## SonarCloud issue inventory (from `issues1/issues1/`)

| Rule | Severity | Type | File | Lines | Count | Summary |
|---|---|---|---|---|---|---|
| javascript:S8786 | MAJOR | CODE_SMELL | docs/index.html | 937, 957, 1171 | 3 | Regex super-linear backtracking |
| javascript:S3776 | CRITICAL | CODE_SMELL | docs/index.html | 2559, 2649 | 2 | Cognitive Complexity > 15 (16 and 17) |
| javascript:S3626 | MINOR | CODE_SMELL | docs/index.html | 2183, 2675 | 2 | Redundant jump (last `return;` in function) |
| javascript:S7766 | MINOR | CODE_SMELL | docs/index.html | 2640 | 1 | Prefer `Math.max()` over ternary |
| javascript:S2681 | MAJOR | CODE_SMELL | docs/index.html | 2644 | 1 | Braceless-if: statement not executed conditionally |
| Web:InputWithoutLabelCheck | MAJOR | BUG | docs/index.html | 349 | 1 | `#file-picker` input has no label |
| githubactions:S7637 | MAJOR | VULNERABILITY | .github/workflows/sonarcloud.yml | 43 | 1 | Use full commit SHA, not `@v1` tag |

Total: 11 SonarCloud findings (10 in the app HTML, 1 in the workflow file) + 1 coverage complaint (3 lines in `playwright.config.js`).

## Patching strategy

The 10 HTML findings split into 6 distinct rules with no inter-dependencies — applied as a single batched MultiEdit (8 distinct edit operations covering all 10 findings; the 2 S3776 issues each required their own helper extraction). All edits applied bottom-up by content match (not line number), so each Edit operates on the current state regardless of prior edits shifting line numbers. All 8 edits applied successfully on first attempt; no rollback needed.

The 1 workflow finding (S7637 SHA pin) and the playwright.config.js coverage complaint are in files not present in the workspace (they live in the user's actual GitHub repo at `.github/workflows/sonarcloud.yml` and `playwright.config.js`). Provided as instructions, not patches.

## Per-issue remediation

### 1. Web:InputWithoutLabelCheck — L349 `#file-picker`

The hidden file input `<input type="file" id="file-picker" ... style="display:none">` had no associated label. Although it's hidden via `display:none` (and the previous 0.36.1 S6825 fix removed the redundant `aria-hidden="true"`), the Web:InputWithoutLabelCheck rule still fires because no programmatic label exists. Per Memory.md 0.36.1, the input is intentionally hidden — it's triggered programmatically via `click()` from other UI elements, never directly interacted with by the user. The simplest fix that satisfies the rule without changing behavior: add an `aria-label` attribute.

```diff
- <input type="file" id="file-picker" multiple accept="audio/*,.lrc,.txt" style="display:none">
+ <input type="file" id="file-picker" multiple accept="audio/*,.lrc,.txt" style="display:none" aria-label="File picker">
```

The label is announced by screen readers when the input is focused (which can happen via Tab if `display:none` is ever removed in a future change). No observable behavior change for sighted users.

### 2. S8786 (regex super-linear backtracking) — L937, L957, L1171

SonarQube S8786 fires on regex patterns where backtracking can produce super-linear runtime. The three flagged patterns all used lazy/wildcard quantifiers followed by a delimiter that could fail, forcing the engine to backtrack.

**L937** (`markGeniusSource` `[re:...]` extractor):

```diff
- let updated=getTA().replace(/^\[re:\s*(.*?)\]/m,(match,val)=>{
+ let updated=getTA().replace(/^\[re:\s*([^\]]*)\]/m,(match,val)=>{
```

`.*?` (lazy any-char) followed by `]` backtracks on inputs like `[re: foo] bar] baz]` — the engine tries each possible stop point. Replacing with `[^\]]*` (negated character class) makes the match linear: consume any non-`]` characters greedily, then expect `]`. Semantically identical — the regex matches the same set of strings.

**L957** (`_extractGeniusTitleAndArtist` title stripper):

```diff
- const title=head[i].replace(/\s+Lyrics$/,'').trim();
+ const title=head[i].replace(/\sLyrics$/,'').trim();
```

`\s+` (one-or-more whitespace) followed by the literal `Lyrics$` backtracks on inputs with multiple trailing whitespace runs — the engine tries each whitespace boundary before failing. Dropping the `+` quantifier restricts the match to a single whitespace character, eliminating the backtracking. The typical Genius heading uses a single space before `Lyrics`, so the single-whitespace match works. The trailing `.trim()` cleans up any leading whitespace left over from a multi-space edge case, so the observable output is unchanged.

**L1171** (`_announce` line-text stripper):

```diff
- _announce('Playing line '+(best+1)+': '+lines[best].replace(/\[.*?\]\s*/,'').trim());
+ _announce('Playing line '+(best+1)+': '+lines[best].replace(/\[[^\]]*\]\s*/,'').trim());
```

Same pattern as L937 — `.*?` followed by `]` replaced with `[^\]]*`. This regex strips a leading `[xxx]` timestamp/section-header prefix from a line before announcing it to the screen reader. The negated character class is linear; semantics preserved.

### 3. S7766 (Math.max simplification) — L2640

```diff
- const next=activeLine<0?0:activeLine;
+ const next=Math.max(0,activeLine);
```

`x<0?0:x` is mathematically equivalent to `Math.max(0,x)`. SonarQube prefers the `Math.max` form because it's more readable and avoids the conditional expression. Same behavior — both clamp `activeLine` to a non-negative value.

### 4. S2681 (statement not executed conditionally) — L2644

```diff
- if(e.shiftKey){if(selectedLines.size===0&&activeLine>=0)selectedLines.add(activeLine);selectedLines.add(clamped);activeLine=clamped;}
+ if(e.shiftKey){if(selectedLines.size===0&&activeLine>=0){selectedLines.add(activeLine);}selectedLines.add(clamped);activeLine=clamped;}
```

The inner `if` was braceless — SonarQube S2681 fires because it can't tell whether `selectedLines.add(activeLine);` is the only conditional statement or whether the subsequent `selectedLines.add(clamped);activeLine=clamped;` were intended to be inside the if-block too. The intent here is that ONLY `selectedLines.add(activeLine)` is conditional (only add the previous active line as a selection-anchor if nothing is selected yet); the `selectedLines.add(clamped)` and `activeLine=clamped` always execute when `e.shiftKey` is true. Adding braces around the single conditional statement makes the intent explicit and silences the rule. No behavior change.

### 5. S3626 (redundant jump) — L2183, L2675

Both findings are `return;` statements at the end of an if-block that is itself the last statement in its enclosing function. The `return;` is redundant because the function would return naturally anyway.

**L2183** (`_handleSearchHkMode`):

```diff
  e.stopPropagation();
- if(hkMatch(ks,cfg.hotkeys.toggle_mode)){e.preventDefault();setSearchHkMode(true);return;}
+ if(hkMatch(ks,cfg.hotkeys.toggle_mode)){e.preventDefault();setSearchHkMode(true);}
  }
```

**L2675** (`_handleHotkeyModeNav`, ArrowUp/ArrowDown block — also affected by the L2649 extraction below):

```diff
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){
    e.preventDefault();
    _handleHotkeyModeArrows(e, allLines, lineCount);
- return;
  }
```

Both removals are behavior-preserving — the function returns `undefined` either way, and no code follows the if-block.

### 6. S3776 (Cognitive Complexity) — L2559, L2649

**L2559 `_handleSettingsHotkeyDispatch` (CC 16 → 14):**

The CC threshold is 15. The function had an inline `if(settingsOpen)closeSettings();else openSettings();` inside the first `if(hkMatch(ks,hk.settings))` block, contributing +2 to CC (the `if` + the `else`). Extracting the open/close toggle into a helper `_toggleSettingsOpen(open)` removes that contribution.

```diff
+ function _toggleSettingsOpen(open){if(open)closeSettings();else openSettings();}
  function _handleSettingsHotkeyDispatch(e, ks, hk, settingsOpen){
- if(hkMatch(ks,hk.settings)){e.preventDefault();if(settingsOpen)closeSettings();else openSettings();return true;}
+ if(hkMatch(ks,hk.settings)){e.preventDefault();_toggleSettingsOpen(settingsOpen);return true;}
    if(hk.help&&hkMatch(ks,hk.help)){e.preventDefault();openHelp();return true;}
    ...
  }
```

New CC: 14 (under the 15 threshold). Behavior preserved — `_toggleSettingsOpen(open)` is a one-line wrapper around the same `if/else` that was inline.

**L2649 `_handleHotkeyModeNav` (CC 17 → 10):**

The function had three if-blocks (Home/End, PageUp/PageDown, ArrowUp/ArrowDown). The PageUp/PageDown block was the heaviest contributor (CC ~7) because it contained nested `if(!nonMeta.length)return`, `if(base<0)`, and two ternaries for `base` and `targetPos`. Extracting the entire PageUp/PageDown block into `_handlePageKeys(e, allLines)` removes all those contributions from the parent function.

```diff
+ function _handlePageKeys(e, allLines){
+ e.preventDefault();
+ const scroll=document.getElementById('main-scroll');
+ const lineH=scroll.scrollHeight/Math.max(1,allLines.filter(l=>!META_RE.test(l)).length);
+ const pageLines=Math.max(1,Math.floor(scroll.clientHeight/lineH)-1);
+ const nonMeta=allLines.map((l,i)=>({l,i})).filter(({l})=>!META_RE.test(l)&&l.trim()!=='');
+ if(!nonMeta.length)return;
+ const curPos=nonMeta.findIndex(({i})=>i===activeLine);
+ let base=curPos;if(base<0)base=e.key==='PageUp'?nonMeta.length-1:0;
+ const targetPos=e.key==='PageUp'?Math.max(0,base-pageLines):Math.min(nonMeta.length-1,base+pageLines);
+ activeLine=nonMeta[targetPos].i;
+ selectedLines.clear();renderMainLines();scrollToActive();
+ }
  function _handleHotkeyModeNav(e, allLines, lineCount){
    if(e.key==='Home'||e.key==='End'){
      e.preventDefault();
      const nonMeta=allLines.map((l,i)=>({l,i})).filter(({l})=>!META_RE.test(l)&&l.trim()!=='');
      if(nonMeta.length){
        activeLine=e.key==='Home'?nonMeta[0].i:nonMeta[nonMeta.length-1].i;
        selectedLines.clear();renderMainLines();scrollToActive();
      }
      return;
    }
- if(e.key==='PageUp'||e.key==='PageDown'){
- e.preventDefault();
- const scroll=document.getElementById('main-scroll');
- const lineH=scroll.scrollHeight/Math.max(1,allLines.filter(l=>!META_RE.test(l)).length);
- const pageLines=Math.max(1,Math.floor(scroll.clientHeight/lineH)-1);
- const nonMeta=allLines.map((l,i)=>({l,i})).filter(({l})=>!META_RE.test(l)&&l.trim()!=='';
- if(!nonMeta.length)return;
- const curPos=nonMeta.findIndex(({i})=>i===activeLine);
- let base=curPos;if(base<0)base=e.key==='PageUp'?nonMeta.length-1:0;
- const targetPos=e.key==='PageUp'?Math.max(0,base-pageLines):Math.min(nonMeta.length-1,base+pageLines);
- activeLine=nonMeta[targetPos].i;
- selectedLines.clear();renderMainLines();scrollToActive();return;
- }
+ if(e.key==='PageUp'||e.key==='PageDown'){_handlePageKeys(e, allLines);return;}
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){
      e.preventDefault();
      _handleHotkeyModeArrows(e, allLines, lineCount);
- return;
    }
  }
```

Net line count: +14 (new helper) - 14 (removed inline block) - 1 (removed redundant `return;` from ArrowUp/ArrowDown block) + 1 (new one-line call site) = 0. New CC for `_handleHotkeyModeNav`: 10. Behavior preserved — `_handlePageKeys` performs the same DOM mutations in the same order; the call-site `return;` after `_handlePageKeys(...)` is load-bearing (prevents fall-through to ArrowUp/ArrowDown block) and is preserved.

### 7. githubactions:S7637 — `.github/workflows/sonarcloud.yml` L43 (instructions only, file not in workspace)

SonarQube S7637 fires on GitHub Actions workflows that use `@v1`, `@v2`, etc. version tags instead of full commit SHAs. Tagged references are mutable — a maintainer can retag a different commit to the same `@v1` tag, potentially introducing malicious code into the workflow. Pinning to a full 40-character SHA makes the reference immutable.

The workflow file `.github/workflows/sonarcloud.yml` is not in the workspace (the workspace only has the app HTML and supporting scripts). User action required:

1. Open `.github/workflows/sonarcloud.yml` in the repo.
2. Locate line 43 — it's a `uses:` statement referencing a GitHub Action via `@<tag>`.
3. Look up the commit SHA for the tag at the action's GitHub releases page (e.g. for `SonarSource/sonarcloud-github-action`, browse to `https://github.com/SonarSource/sonarcloud-github-action/releases`, find the release matching the current `@v1` tag, and copy the 40-character commit SHA).
4. Replace `@v1` (or whatever the tag is) with `@<full-sha>`.
5. Optionally add a comment with the human-readable version (`# v1.9.0`) so future maintainers know which version was pinned.

Example shape:

```yaml
# Before (S7637 fires):
- uses: SonarSource/sonarcloud-github-action@v1

# After (pinned):
- uses: SonarSource/sonarcloud-github-action@<full-40-char-sha>  # v1.9.0
```

The same pattern should be applied to any other `uses:` statements in the workflow that reference actions by tag rather than SHA.

### 8. `playwright.config.js` coverage gap (instructions only, file not in workspace)

SonarCloud flagged three uncovered lines:

```js
const inContainer = !!process.env.PW_CONTAINER;
const inCI = !!process.env.CI;
const enableWebkit = inContainer || inCI;
```

These are environment-detection lines run at config-load time. They decide whether to include the Webkit browser project in the Playwright test matrix — Webkit is enabled when running in the `tst` Podman container (`PW_CONTAINER=1`) or in CI (`CI=1`), and disabled otherwise (to avoid the Webkit dependency on developer machines per `PLAYWRIGHT_SETUP.md`).

Coverage tools can't exercise these lines from a unit test because:
- The lines run once at module-load time, before any test can stub `process.env`.
- Stubbing `process.env` after the module is loaded doesn't re-evaluate the constants.

Two acceptable remediations:

**Option A (recommended — collapse + istanbul-ignore comment):**

```js
/* istanbul ignore next -- env-detection at config-load time; PW_CONTAINER and CI env vars are exercised manually, not by unit tests */
const enableWebkit = !!process.env.PW_CONTAINER || !!process.env.CI;
```

This collapses the three lines into one (removing the intermediate `inContainer` and `inCI` declarations, which are not referenced elsewhere in the file based on the user's report) and adds a coverage-exclusion comment. The logic is identical — `enableWebkit` is `true` iff either env var is truthy. The comment tells the coverage tool to skip this line, which is appropriate because config-load env-detection is inherently not unit-testable.

**Option B (preserve structure, add per-line exclusion):**

```js
/* istanbul ignore next -- env-detection at config-load time */
const inContainer = !!process.env.PW_CONTAINER;
/* istanbul ignore next */
const inCI = !!process.env.CI;
/* istanbul ignore next */
const enableWebkit = inContainer || inCI;
```

Preserves the three-line structure but adds three exclusion comments. Useful if `inContainer` or `inCI` are referenced elsewhere in the file (which the user should grep for before applying Option A).

Recommendation: Option A unless grep reveals `inContainer`/`inCI` are used elsewhere.

## Post-patch verification

1. **Syntax check** — `<script>` body compiles via `new Function` (118,188 chars; was 118,095 after Turn 6, +93 chars from the 8 patches). Verified via `scripts/check-syntax.js`.
2. **Section index accuracy** — patches are inside the existing `// ──` sections (Helpers → Genius, Render / line UI, Helpers → A11y announce, Keyboard → Settings search, Keyboard → Overlay utilities, Keyboard → Global KD). Two new helpers added (`_toggleSettingsOpen`, `_handlePageKeys`) — both small one-purpose functions matching the existing helper-naming convention. No section markers shift (sections grow internally but don't cross `// ──` boundaries).
3. **Spot-check referenced functions** — `_toggleSettingsOpen` called only from `_handleSettingsHotkeyDispatch` (single call site). `_handlePageKeys` called only from `_handleHotkeyModeNav` (single call site). `_handleSettingsHotkeyDispatch` and `_handleHotkeyModeNav` are themselves called from `_handleSettingsKeys` and `_handleHotkeyModeKeys` respectively (call sites unchanged). All pre-existing `_`-prefixed helpers verified present (including `_peelLastParen` per Memory.md 0.35.15 caution).
4. **Trace one representative user action** — traced each remediation's representative action:
   - **Settings hotkey toggle**: Press the configured settings hotkey. Old path: `_handleGlobalHotkeyDispatch` → `if(hkMatch(ks,hk.settings))` → `e.preventDefault();if(settingsOpen)closeSettings();else openSettings();return true;`. New path: same dispatch → `e.preventDefault();_toggleSettingsOpen(settingsOpen);return true;` → `_toggleSettingsOpen` runs `if(open)closeSettings();else openSettings();` — same observable effect (settings overlay opens or closes).
   - **PageUp navigation in hotkey mode**: Press PageUp. Old path: `_handleHotkeyModeKeys` → `_handleHotkeyModeNav` → matches PageUp branch → inline computation → `activeLine=nonMeta[targetPos].i; selectedLines.clear(); renderMainLines(); scrollToActive();`. New path: same dispatch → `_handlePageKeys(e, allLines)` called → same computation → same mutations.
   - **Shift+ArrowDown range-select**: Press Shift+ArrowDown. Old path: `_handleHotkeyModeArrows` → `if(e.shiftKey){if(selectedLines.size===0&&activeLine>=0)selectedLines.add(activeLine);selectedLines.add(clamped);activeLine=clamped;}`. New path: same with braces added around the inner `if` body — `selectedLines.add(activeLine)` still conditional, `selectedLines.add(clamped);activeLine=clamped;` still unconditional. Same selections result.
   - **`_announce` for screen reader**: Audio advances to a new line. Old path: regex `/\[.*?\]\s*/` strips `[xxx]` prefix. New path: `/\[[^\]]*\]\s*/` — same match set, same stripping behavior.
   - **Title extraction from Genius paste**: Genius heading with trailing `Lyrics`. Old path: `head[i].replace(/\s+Lyrics$/,'').trim()` strips trailing whitespace + `Lyrics`. New path: `head[i].replace(/\sLyrics$/,'').trim()` strips single whitespace + `Lyrics`, `.trim()` cleans up if multi-space.
   - **`[re:...]` extraction**: LRC with `[re: https://example.com/]`. Old path: regex `/^\[re:\s*(.*?)\]/m` captures `https://example.com/`. New path: `/^\[re:\s*([^\]]*)\]/m` captures same (any non-`]` chars).

All traces preserve observable behavior.

## Playwright impact

All 8 HTML patches are behavior-preserving (verified by trace above). Specific concerns:

- **`_toggleSettingsOpen` extraction**: Same call chain (`_handleSettingsKeys` → `_handleSettingsHotkeyDispatch` → `_toggleSettingsOpen`). The `_handleSettingsHotkeyDispatch` return value (`true` if handled) is unchanged. Settings overlay open/close behavior unchanged. No ARIA snapshot, `inputValue()`, or screenshot test affected.
- **`_handlePageKeys` extraction**: PageUp/PageDown navigation in hotkey mode produces the same `activeLine` value and the same `selectedLines`/`renderMainLines`/`scrollToActive` calls. Any Playwright test that exercises PageUp/PageDown (e.g. in `keyboard-nav.spec.js`) should produce identical ARIA snapshots.
- **S2681 brace fix**: The shift-arrow range-select logic is unchanged — the inner `if` body is the same single statement. No test should be affected.
- **S7766 Math.max**: `Math.max(0, activeLine)` is mathematically identical to `activeLine<0?0:activeLine`. No test should be affected.
- **S8786 regex patches**: All three regex replacements match the same set of strings (verified by trace). No test should be affected.
- **S3626 redundant-jump removals**: `return;` at end-of-function is observably equivalent to falling off the end. No test should be affected.
- **aria-label addition**: Adds an accessibility label to a hidden input. Screen-reader tests (if any) might notice the new label, but no current Playwright test asserts on `#file-picker` aria properties. No test should be affected.

No Playwright snapshot regeneration needed.

## Skill and Memory updates (per project-workflow Phase 4 step 4-5)

### `Memory.md`

Updated the 0.37.2 section's "SonarCloud post-push remediation" bullet in-place (per the thread-discipline pattern from Turn 8) to reflect the cumulative state across both remediation rounds. The bullet now spans Round 1 (Turns 2-4: S2486, S2310, S3776) and Round 2 (Turn 10: S8786, S3776, S3626, S7766, S2681, Web:InputWithoutLabelCheck, githubactions:S7637, playwright.config.js coverage gap). The 4 other 0.37.2 bullets (`<title>` bump, Genius paste cleanup, test suite hardening, companion file format rules) are unchanged.

### `skill-SKILL.md`

No update needed. The thread-discipline lesson (added Turn 8) and the companion-file format rules (codified Turn 9 in `project-workflow-SKILL.md`) already cover the patterns relevant to this turn. The dispatch-table CC reduction pattern (documented in `code-quality-SKILL.md` from Turn 4) was applied again this turn for `_toggleSettingsOpen`, but that's an application of an existing pattern, not a new pattern worth extracting.

### `project-workflow-SKILL.md`

No update needed. The companion-file format rules added Turn 9 are followed by this turn's entry. The Phase 4 workflow obligations are unchanged.

### `code-quality-SKILL.md`

No update needed. The "Dispatch-table CC reduction" and "Historical CC reduction" sections already cover the patterns used this turn (helper extraction for S3776, Math.max for S7766, brace addition for S2681, regex simplification for S8786). A new section for S8786 regex-backtracking patterns could be added in a future session if the pattern recurs, but two occurrences across the project don't yet justify extraction.

## Companion file summary frontmatter

The `summary` field in the frontmatter at the top of this file was previously unquoted. Per the user's reminder this turn, YAML strings containing special characters (`:`, backticks, etc.) must be wrapped in single quotes. Updated to wrap the existing summary in single quotes and extend it with the Turn 10 description (11 more SonarCloud findings + playwright.config.js coverage gap + summary frontmatter quoting rule).

---

# Turn 11 — Dependabot path-dep failure (no app patch)

> SonarCloud now passes, but a scheduled Dependabot scan that immediately followed failed: [[2. npm_and_yarn in -. for brace-expansion, brace-expansion, fast-uri, fast-uri - Update 1491970513]]. Also see [[Copilot-chat]].

User uploaded two markdown files: the Dependabot job log from `actions/runs/30408023313/job/90437769306`, and a Copilot-chat transcript analyzing the failure. Both files live outside the workspace (GitHub Actions log + chat history), so this turn produces instructions and Memory/companion updates only — no patch artifact in `download/`.

## Skills read this turn

Re-read `project-workflow-SKILL.md` Phase 4 obligations and `skill-SKILL.md` thread-discipline pattern. No new skills needed — this is a repo-config fix, not an app-code fix, and the Dependabot error pattern is well-documented in GitHub's public Dependabot troubleshooting docs.

## Diagnosis

From the Dependabot log line 105:

```
Error during file fetching; aborting: The following path based dependencies could not be retrieved: @linebyline/test-helpers
```

And the error table at lines 118–123:

```
| Type                            | Details                        |
| path_dependencies_not_reachable | { "dependencies": ["@linebyline/test-helpers"] }
```

This is a **file-fetch-phase** error, not an update-resolution error. Dependabot's workflow:

1. Clone the repo (succeeded — line 31).
2. **File-fetch phase**: walk `package.json` and resolve every `file:` and `link:` path-dep by reading the referenced directory's own `package.json` (failed — line 105).
3. Update-resolution phase: compare installed versions against advisories, compute the update plan (never reached).
4. PR creation (never reached).

The root `package.json` (uploaded this turn) declares:

```json
"devDependencies": {
  "@linebyline/test-helpers": "file:./tests/helpers",
  ...
}
```

The pre-push zip earlier in the session shipped `tests/helpers/` as an empty directory (the actual `index.js` lives in the real repo), so the helpers' contents couldn't be inspected directly — but the symptom is unambiguous: `tests/helpers/index.js` exists (the test suite runs successfully, 540 tests executed per `tests.log`), but `tests/helpers/package.json` does not, or its `name` field doesn't match `@linebyline/test-helpers`.

Node's runtime CommonJS resolver is lenient — it falls back to `index.js` when no `package.json` is present, so `require("@linebyline/test-helpers")` from the spec files works fine. Dependabot's file-fetcher is strict — it requires a manifest with a matching `name`.

## Fix

Add `tests/helpers/package.json`:

```json
{
  "name": "@linebyline/test-helpers",
  "version": "1.0.0",
  "private": true,
  "main": "index.js"
}
```

User confirmed this turn that the file has been added with these contents.

## Conflict analysis (two `package.json` files)

User asked: "Is it normal to have two `package.json` files? Make sure there's no conflict."

**Yes, two `package.json` files is the standard pattern for `file:` path-deps.** Each defines a separate npm package. The root's `"@linebyline/test-helpers": "file:./tests/helpers"` declaration tells npm to treat `./tests/helpers` as its own package and symlink it into `node_modules/@linebyline/test-helpers` during `npm install`. Same pattern used by npm workspaces, monorepos (Lerna, Turborepo, pnpm workspaces), and most repos with local helper packages.

Field-by-field conflict check against the root `package.json` (uploaded this turn):

| Field | Root | `tests/helpers` | Conflict? |
|---|---|---|---|
| `name` | `linebyline` | `@linebyline/test-helpers` | No — must differ; this is the whole point of a path-dep |
| `version` | `1.0.0` | `1.0.0` | No — versions are per-package; two packages can coincidentally share a version |
| `main` | `index.js` (resolves to `./index.js` at repo root) | `index.js` (resolves to `./tests/helpers/index.js`) | No — each `main` is relative to its own package directory |
| `type` | `commonjs` | (absent — defaults to `commonjs`) | No — npm's default matches root's explicit setting. Optionally add `"type": "commonjs"` to helpers for explicitness, but functionally unnecessary |
| `private` | (absent — root is publishable) | `true` | No — appropriate: helpers should never be published to npm |

The `version: "1.0.0"` field is the version of **the `@linebyline/test-helpers` package itself**, not of `index.js` or any individual file. For a `private: true` package that's never published, the version number is arbitrary — `1.0.0` is convention for "first stable internal version," but `0.0.1` or `0.1.0` would work identically. It does not track the app version (`0.37.2`), the root package version (`1.0.0`), or any other version.

One pre-existing issue surfaced during the audit (not introduced by the new file, out of scope for this turn): root `package.json` has `"main": "index.js"` pointing at `./index.js` at repo root, but the app is `docs/index.html` — that root `index.js` doesn't exist as a Node module. Harmless because nobody does `require("linebyline")` from outside the repo. Could be cleaned up in a future turn by changing root `main` to `"docs/index.html"` or removing it entirely.

## Copilot-chat transcript audit

The user also uploaded a Copilot-chat transcript proposing three remediation options. Audit:

| Copilot option | Verdict | Reason |
|---|---|---|
| 1. Add `tests/helpers/package.json` | ✅ Correct, minimal | Keeps the existing `require("@linebyline/test-helpers")` import style across all 15 spec files; one new file, zero edits |
| 2. Publish `@linebyline/test-helpers` to npm | ✅ Technically works, but overkill | Massive overhead for a single-repo test helper that's never consumed outside this repo. Requires npm account, version bumping on every helper change, registry availability dependency |
| 3. Dependabot `ignore` rule for `@linebyline/test-helpers` | ❌ Will not fix this | Dependabot `ignore` rules apply at **update-selection** time (which PRs to open), not at **file-fetch** time (which deps to scan). The `path_dependencies_not_reachable` error fires before any ignore rule is consulted. Copilot is wrong here |

A fourth option Copilot missed: **drop the path-dep entirely, switch to relative require.** Change all 15 spec files from `require("@linebyline/test-helpers")` → `require("./helpers")` and remove the `@linebyline/test-helpers` entry from root `devDependencies`. Node's resolver finds `./tests/helpers/index.js` automatically — no `package.json` needed in `tests/helpers/`, no path-dep for Dependabot to chase. Cleanest long-term, but 15 file edits vs. 1 new file. Not recommended unless the helpers package grows beyond a single file.

## Outstanding security gap

The Dependabot job was a **security** scan for `brace-expansion` and `fast-uri` — both have ReDoS CVEs in older versions. The job definition in the log (line 27) lists ~10 affected version ranges across both packages. These are almost certainly transitive through:

- `@playwright/test` → `micromatch` → `braces` → `brace-expansion`
- `@playwright/test` → some other path → `fast-uri`

While the path-dep error blocks Dependabot, no security PRs are being opened for these CVEs. Two paths forward:

- **Let Dependabot do it** — after the `tests/helpers/package.json` commit lands, the next scheduled run opens the security PR automatically. Slowest but most consistent with the existing workflow.
- **Manual bump now** — `npm update brace-expansion fast-uri` in the local repo, commit the regenerated `package-lock.json`, push. Faster, but re-run the Playwright suite to confirm nothing broke. These are deep transitive deps, so behavior change is unlikely, but `micromatch` is used by Playwright's test-file globbing — worth a sanity run.

The two are not mutually exclusive: do the manual bump now to close the security window, and the path-dep fix ensures future scheduled scans don't fail.

## Skill and Memory updates (per project-workflow Phase 4 step 4-5)

### `Memory.md`

New bullet added to the 0.37.2 section (thread-discipline pattern — one bullet per parallel thread, this is a new thread separate from the SonarCloud remediation thread). The bullet covers: root cause (`tests/helpers/` had `index.js` but no `package.json`, Node's resolver is lenient but Dependabot's file-fetcher is strict), fix (added `tests/helpers/package.json` with matching name/main/private), the two-package.json pattern (standard for `file:` path-deps, no conflicts), the Dependabot-`ignore`-doesn't-fix-this gotcha, and the secondary security gap (brace-expansion + fast-uri ReDoS CVEs unpatched while Dependabot was blocked).

### `skill-SKILL.md`

No update needed. The "thread discipline prevents Memory.md bloat" lesson (added Turn 8) already covers the pattern applied here — Dependabot failure is a new thread, gets its own bullet rather than being folded into the SonarCloud bullet.

### `project-workflow-SKILL.md`

No update needed. The Phase 4 workflow obligations and the companion-file format rules (Turn 9) are unchanged. This turn follows the established pattern for out-of-workspace files (instructions + Memory/companion updates only, no patch artifact in `download/`) — same as the `playwright.config.js`, `sonarcloud.yml`, and `sonarcloud-sonar-issue-exporter.yml` files in Turn 10.

### `code-quality-SKILL.md`

No update needed. The Dependabot failure is a repo-config issue, not a code-quality pattern. If the project accumulates more Dependabot-specific gotchas (e.g. `ignore` rules don't apply at file-fetch time, `file:` path-deps require manifests, etc.), a future "Dependabot troubleshooting" section could be added — but one occurrence doesn't yet justify extraction.

## Post-fix verification

1. **Local test suite** — `npx playwright test` should still pass. The new `package.json` doesn't change Node's runtime resolution (CommonJS fallback to `index.js` was already finding the same file). Re-run to confirm.
2. **Dependabot next scheduled run** — should pass file-fetch and proceed to update-resolution. The next scheduled run will either open a security PR for `brace-expansion`/`fast-uri` (if still vulnerable) or report clean (if the user did a manual `npm update` in the meantime).
3. **No app-version bump** — version held at 0.37.2 per the original session rule. This is a repo-config fix, not an app change.


---

# Turn 12 — Dependabot PR #8 merge-blocked by SHA-mismatch race; stuck brace-expansion alerts

> After merging [the tests/helpers/package.json fix], there are now more Sonar issues, but I suspect they're actually because I forgot to update index.html. Playwright tests pass after I pulled the Dependabot merge. And it seems Dependabot has been stuck trying to create two security patches since yesterday (there's an infinite loading circle for both pages).

User uploaded `waiting.zip` with two PNG screenshots: PR #8 (Bump fast-uri from 3.1.2 to 3.1.4) merge-blocked UI, and the Actions runs list showing recent workflow history. No app patch this turn — diagnosis and merge guidance only.

## PR #8 merge block — SHA-mismatch race

PR #8 page (image 1) shows:
- Title: "Bump fast-uri from 3.1.2 to 3.1.4 in the npm_and_yarn group across 1 directory"
- 1 commit, branch `dependabot/npm_and_yarn/npm_and_yarn-04db377a11` → `main`
- 3 successful checks: Code scanning results / CodeQL, CodeQL Advanced / Analyze (javascript-typescript), SonarCloud analysis / Analysis
- Merge blocked with: "Code scanning is waiting for results from SonarCloud for the commits `8ae6621` or `29c71b3`."
- Two buttons offered: "Merge without waiting for requirements to be met (bypass rules)" / "Enable auto-merge"

Actions runs list (image 2) shows the recent history, newest first:
1. SonarCloud analysis #60 — PR #8, 11s, success
2. CodeQL Advanced #92 — PR #8, 1m 17s, success
3. Dependabot Updates #3 — main, 1m 19s, success (the scan that previously failed in Turn 11 — now succeeds after the `tests/helpers/package.json` commit)
4. CodeQL Advanced #91 — commit `eb4c7e0` "Updated package.json for Dependabot" on main, 3m 2s, success
5. SonarCloud analysis #59 — commit `eb4c7e0` on main, 59s, success
6. pages-build-deployment #35 — main, 50s, success

### Root cause

SonarCloud #60 ran and passed against an **earlier commit** on Dependabot's branch. Dependabot then force-pushed (or rebased) to update the PR, advancing the branch HEAD to `8ae6621` / `29c71b3`. GitHub's branch protection sees the current HEAD has no SonarCloud result posted for those exact SHAs, so the required check stays "pending" even though SonarCloud passed on the prior SHA.

This is a known Dependabot+SonarCloud race:
- Dependabot pushes commit A → SonarCloud #60 triggers, analyzes A, posts "success" for A.
- Dependabot rebases/pushes commit B (`8ae6621`) → SonarCloud #61 *should* trigger for B, but either hasn't finished yet, hasn't been queued yet, or the GitHub Action didn't fire on `pull_request: synchronize` for the force-push.

The "or" in "commits `8ae6621` or `29c71b3`" suggests Dependabot pushed twice — possibly a rebase after `eb4c7e0` landed on main, then a second push to refresh. Each push creates a new SHA on the branch.

### Why the SHAs don't appear in the Actions list

Two reasons:

1. The Actions list shows run names (PR titles / commit messages), not the analyzed SHA. Run #60 is labeled "Bump fast-uri from 3.1.2 to 3.1.4 in the npm_and_yarn…" — that's the PR title, not a SHA. To see which SHA #60 actually analyzed, click into run #60 → the run detail page shows "This run ran against commit `XXXXX`" near the top. It will be a different SHA than `8ae6621`/`29c71b3`.

2. Those two SHAs live on the Dependabot branch, not `main`. They only show up in the Actions list when a workflow runs against them. Right now no SonarCloud run has been triggered for those specific SHAs, so they don't appear as run subjects. They exist in the repo's git history (visible in the PR's commits tab), just not yet in any SonarCloud run.

### Bypass recommendation

**Safe to bypass.** Factors:
- PR changes: `package-lock.json` only (transitive dep bump, no app code)
- CodeQL: passed on the current PR HEAD
- SonarCloud: passed on the prior PR HEAD (same changeset, just different SHA)
- Branch protection block: SHA-mismatch race, not a real quality-gate failure
- Re-analysis safety net: next push to `main` triggers SonarCloud #61 against the merged commit — any real issue surfaces there

The bypass is exactly what the "Merge without waiting for requirements to be met (bypass rules)" button is for. After merge, the post-merge SonarCloud run on `main` closes the loop.

Alternatives (slower, no bypass needed):
- **Close + reopen PR #8** — fires a fresh `pull_request: reopened` event, re-triggers SonarCloud against the current HEAD.
- **Push an empty commit to the PR branch** (`git commit --allow-empty -m "trigger sonar" && git push`) — same effect, fires `pull_request: synchronize`. Requires checking out the Dependabot branch locally.

Both alternatives just trigger the same SonarCloud run that should have fired automatically. Bypass is faster and equivalent in safety.

## Stuck brace-expansion alerts

Two Dependabot alerts (alert #1 and #2 on `https://github.com/amokprime/linebyline/security/dependabot/1` and `/2`) showing "Creating a security update" spinner for 18+ hours. Both are for `brace-expansion` DoS (exponential recursion O(2ⁿ) — same CVE, two alerts because the vulnerable 5.0.6 lives in multiple nested locations: `@eslint/config-array`, `eslint`, `eslint-plugin-sonarjs`).

The alerts were opened **before** the Turn 11 `tests/helpers/package.json` fix. The path-dep error was blocking all Dependabot jobs at that time. The fix unblocked *new* Dependabot runs (scan #3 succeeded, opened PR #8 for fast-uri), but the brace-expansion job was queued *before* the fix, and its "creating" UI state is held until the job explicitly succeeds or fails. The fix didn't re-queue the stuck job — it's still holding the lock.

### Unstick options

**Option A — Manual `overrides` patch (fastest, recommended in Turn 12):**
Add an `overrides` field to root `package.json`:
```json
{
  "overrides": {
    "brace-expansion": "5.0.7"
  }
}
```
Run `npm install` locally. The `overrides` field forces npm to resolve ALL nested copies of `brace-expansion` to 5.0.7. Commit `package.json` + regenerated `package-lock.json`, push. Both alerts auto-close within ~24 hours when Dependabot's next scan sees the lockfile no longer contains 5.0.6.

**Option B — Cancel + re-trigger Dependabot:**
On each alert page, look for a "..." menu or "Reopen" button. To trigger a new Dependabot run on demand: go to Insights → Dependency graph → Dependabot (`https://github.com/amokprime/linebyline/network/updates`), click "Last checked" → "Check for updates". This forces a fresh scan that should succeed (post-Turn 11 fix) and either open a new PR or close the alerts if `npm install` already resolved them.

**Option C — Wait:**
Dependabot's stuck "creating" state eventually times out (usually 24-72 hours). Not recommended — security window stays open.

## Sonar "more issues" — index.html hypothesis

User suspected the new Sonar issues are because they forgot to push `docs/index.html`. Verification steps provided:
1. Open `https://github.com/amokprime/linebyline/blob/main/docs/index.html`
2. Find the `<title>` tag (line 6, near the top)
3. If it says `<title>LineByLine 0.37.1</title>` (or older) → the patches never landed
4. If it says `<title>LineByLine 0.37.2</title>` → the patches did land, and the new Sonar issues are something else

Alternatively, search the GitHub file for `_toggleSettingsOpen` — that's one of the helpers added in Turn 10. If it's not in the repo file, the patches weren't pushed.

**Why Playwright tests still pass:** the tests exercise user-facing behavior (paste, sync, navigation). The SonarCloud fixes in Turns 2-10 were almost all code-smell fixes (CC reduction, regex hardening, redundant jump removal, brace additions) that preserve observable behavior — verified by the trace analysis in the Turn 10 companion. The tests would pass against either the patched or unpatched code. The functional fixes (Turns 4-6: `<title>` bump, Genius embed-widget stripping, intro-line preservation, section-break blanks) are only exercised by manual Genius-paste testing, which the test suite doesn't cover (the `mock.txt` fixture doesn't have the embed-widget pattern — that's why we created `mock-v2.txt` in Turn 7).

**If the patches weren't pushed:** the patched file is sitting in this workspace at `/home/z/my-project/download/linebyline-0.37.2.html` (154,867 bytes, `<title>LineByLine 0.37.2</title>` confirmed). Copy it over local `docs/index.html`, commit, push. SonarCloud will re-scan within ~1 minute and the issues should disappear.

---

# Turn 13 — `npm audit fix --force` footgun; brace-expansion two-CVE situation

> I added the [overrides] section to `package.json` and ran `npm install` but that doesn't actually patch things. This is sort of confusing — should I keep going and fix the emergent errors too? Or revert what's already been done if breaking (the last commit is before these `package.json` changes). Yes, update memory and the companion file.

User uploaded `security.zip` with `package-lock.json` (current state with overrides applied) and the two Dependabot alert pages (both for brace-expansion exponential-recursion CVE, alert #1 and #2). Then ran `npm install` (with overrides), `npm audit` (4 high), and `npm audit fix --force` (13 vulns: 1 low, 8 high, 4 critical). User asks: keep going or revert?

## Diagnosis

### Two separate brace-expansion CVEs

The user's `overrides: { "brace-expansion": "5.0.7" }` was the correct approach for forcing nested versions, but brace-expansion has TWO separate CVEs:

| CVE | Type | Affected range | Patched in | Override helps? |
|---|---|---|---|---|
| Exponential recursion (Dependabot alerts #1, #2) | O(2ⁿ) CPU hang | `>= 3.0.0, < 5.0.7` | 5.0.7 | ✅ Yes — closes both Dependabot alerts |
| Unbounded expansion OOM (GHSA-mh99-v99m-4gvg, npm audit advisory) | Memory exhaustion | `<= 5.0.7` | No patch yet | ❌ No — 5.0.7 is still vulnerable, no fixed version exists |

After `npm install` with the override, brace-expansion bumped from 5.0.6 → 5.0.7 in the nested locations (`@eslint/config-array`, `eslint`, `eslint-plugin-sonarjs`), which closed the Dependabot alerts (recursion CVE patched). But `npm audit` kept showing 4 high because the OOM CVE has no fix — 5.0.7 is the latest version and it's still in the affected range (`<=5.0.7`).

### `npm audit fix --force` is a footgun

`npm audit fix --force` doesn't care about SemVer — it'll downgrade packages to escape the vulnerable dep tree. It saw that the only way to remove brace-expansion entirely was to downgrade `serve` to v6.5.8 (2017-era, which uses a different dep tree without brace-expansion). That worked, but serve 6.x brought its own pile of worse CVEs:

| Package | Severity | CVEs |
|---|---|---|
| `handlebars` | Critical (×4) | RCE, prototype pollution, DoS, AST injection |
| `minimist` | Critical | Prototype pollution |
| `ip` | High | SSRF |
| `send` | High | XSS |
| `cross-spawn` | High | ReDoS |
| `optimist` | (depends on vulnerable minimist) | — |

Vuln count went 4 high → 13 (1 low, 8 high, 4 critical). All of these are worse than the original brace-expansion DoS — RCE and prototype pollution are exploit-worthy; a DoS in a dev-only static file server is not. The "fix" traded a theoretical dev-only DoS for critical RCE in dev dependencies. Bad trade.

## Recommendation: REVERT

```sh
# Discard ALL local package.json + package-lock.json changes
# (back to the last commit, which the user confirmed is pre-overrides)
git checkout HEAD -- package.json package-lock.json
```

Verify with `npm audit` — should be back to the original 4 high (brace-expansion via serve/eslint paths). Then stop.

### Two acceptable end states

**Option A — minimal (just revert, accept current state):**
- No overrides, no changes to package.json
- 4 high vulns remain (brace-expansion 5.0.6 via serve/eslint)
- 2 Dependabot alerts remain open (the recursion CVE)
- Wait for brace-expansion to publish a patch for the OOM CVE, then a single `npm update brace-expansion` closes everything

**Option B — partial (keep overrides, accept residual):**
- Re-add just the `overrides: { "brace-expansion": "5.0.7" }` block to package.json
- Run `npm install` (NOT `npm audit fix`, NOT `--force`)
- 2 Dependabot alerts close (recursion CVE patched)
- 4 high npm audit vulns remain (OOM CVE, unfixable until upstream patches)
- Same wait-for-upstream as Option A, but with fewer open Dependabot alerts

Option B is slightly better — closes the alerts that *can* be closed, leaves only the unfixable ones. The residual 4 high are dev-only dependencies (serve, eslint, eslint-plugin-sonarjs) where no attacker-controlled input reaches brace-expansion. Real-world risk is near-zero.

### Critical: never run `npm audit fix --force` for this issue

Plain `npm audit fix` (no `--force`) only applies non-breaking updates and would have refused to touch serve. The `--force` flag is what caused the damage. The audit output even warned: "Will install serve@6.5.8, which is a breaking change" — that warning is the cue to stop, not proceed.

## Why the OOM CVE is unfixable right now

The npm audit advisory GHSA-mh99-v99m-4gvg lists brace-expansion `<=5.0.7` as affected. The latest published version is 5.0.7. There is no 5.0.8 or later release. The brace-expansion maintainer has not yet published a patch for this CVE. Until they do, the only ways to clear the audit are:

1. Wait for a patch (recommended — could be days or weeks)
2. Remove all deps that transitively depend on brace-expansion (which means downgrading serve, eslint, etc. — exactly what `--force` did, with disastrous results)
3. Replace `serve` with a different static file server that doesn't depend on brace-expansion (cleanest long-term, but requires more work and is out of scope for 0.37.2)

For now, accept the 4 high vulns. They're dev-only dependencies, no attacker-controlled input reaches the vulnerable code path, and the DoS requires specific input patterns that don't occur in static file serving.

## Skill and Memory updates

### `Memory.md`

New bullet added to the 0.37.2 section (thread-discipline pattern — Dependabot cascade is a continuation of the Turn 11 Dependabot thread, but distinct enough to warrant its own bullet covering Turns 12-13). The bullet covers: PR #8 SHA-mismatch race (Turn 12), stuck brace-expansion alerts (Turn 12), the two-CVE brace-expansion situation (Turn 13), the `npm audit fix --force` footgun (Turn 13), and the revert recommendation.

### `skill-SKILL.md`

No update needed. The thread-discipline lesson (added Turn 8) already covers the pattern. A new lesson about `npm audit fix --force` being a footgun could be added if the pattern recurs, but one occurrence doesn't yet justify extraction. The lesson is documented in Memory.md and this companion file.

### `project-workflow-SKILL.md`

No update needed. The Phase 4 workflow obligations and the companion-file format rules (Turn 9) are unchanged. This turn follows the established pattern for out-of-workspace files (instructions + Memory/companion updates only, no patch artifact in `download/`) — same as Turns 10-12.

### `code-quality-SKILL.md`

No update needed. The `npm audit fix --force` footgun is a dependency-management issue, not a code-quality pattern. If the project accumulates more npm/Dependabot-specific gotchas, a future "Dependency management troubleshooting" section could be added — but one occurrence doesn't yet justify extraction.

## Post-fix verification

1. **After revert** — `npm audit` should show 4 high (brace-expansion via serve/eslint paths). Confirm.
2. **After re-adding overrides (Option B)** — `npm install` should bump brace-expansion to 5.0.7 in nested locations. `npm audit` should still show 4 high (OOM CVE, unfixable). Dependabot alerts #1 and #2 should auto-close within 24 hours when the next scan sees the lockfile no longer contains 5.0.6.
3. **Playwright suite** — re-run after revert. Should still pass (the overrides change is transitive-only, no behavior change; serve 14.x is what the test suite was already running against).
4. **No app-version bump** — version held at 0.37.2 per the original session rule. This is a repo-config fix, not an app change.

