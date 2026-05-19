---
name: code-quality
description: Proactively avoid code quality issues and silent regressions in the LineByLine single-file HTML app. Use this skill whenever writing or modifying JavaScript in the app, especially when adding new functions, changing state management, modifying undo/redo behavior, altering config migration, or building new features. Also use when the user mentions SonarQube, cognitive complexity, S3776, S2004, S2681, code smells, or when reviewing code for potential regressions. This skill prevents issues before they reach SonarQube scans and catches subtle bugs that have historically caused silent regressions in this project.
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
- Global keydown handler: 138 → 14 (multiple rounds of extraction)
- `insertEndLine`: 29 → 11 (extracted `_insertSyncTrailing`)
- `buildHkRows`: 40 → ~15 (extracted `_handleSecKeydown`)
- Multiple handlers extracted to outer scope: `_handleSettingsSearchKeydown`, `_handleTextareaEnterTrim`, `_handleTextareaParenBracket`, `_handleGlobalHotkeys`, `_handleHotkeyModeKeys`

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
