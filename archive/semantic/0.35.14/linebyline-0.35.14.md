Here's a first batch, starting with high severity as rated by SonarQube Cloud. Read the index first.

---

Got it all. Here's the summary:

**3 unique issue types, all Maintainability / Code Smell:**

**1. Prefer `.dataset` over `setAttribute(…)` (line 518)** A style/convention rule — `element.dataset.foo` instead of `element.setAttribute('data-foo', ...)`. Functionally identical, purely a readability preference. Easy mechanical fix if you want the green checkmark, but zero functional impact.

**2. Refactor: functions nested more than 4 levels deep (5 instances, lines ~2082–2163 area)** Flags callbacks or handlers nested inside loops/conditionals inside other functions beyond 4 levels. Common in event handler code. Fixable by extracting inner logic into named helper functions.

**3. Cognitive Complexity too high (13 instances, scores ranging from 16 up to 138)** The 138-score one at line 2407 is the standout — that's almost certainly the main keyboard handler (`handleKey` or similar). SonarQube wants it broken into smaller functions. The lower ones (16, 27, 28, etc.) are borderline and arguably fine for a single-developer project.

**My take for LineByLine:**

- The `.dataset` one is a quick win worth doing — it's a clean, safe mechanical substitution.
- The nesting and complexity findings are real but architectural — the hotkey dispatcher _is_ inherently a large switch/if tree. These are "accept the debt" candidates unless you're planning a broader refactor. Marking them **Won't Fix** with a note like "intentional monolithic handler" is reasonable.

Want me to look at which specific function the complexity-138 flag is on before you decide?

---
Plan fixes for all three unique issues. If necessary, do it in stages to avoid doing too much in one turn or one chat.

---
Let me check the exact locations first before planning anything.Good, I have a complete picture now. Here's the plan:

---

## Fix Plan

### Issue 1 — `.dataset` (1 instance, line 518, trivial)

`document.documentElement.setAttribute('data-theme', ...)` → `document.documentElement.dataset.theme = ...`

One line. Can be done alongside any other stage.

---

### Issue 2 — Nesting depth (5 instances, all inside `buildHkRows`)

All 5 flagged lines are inside the `inp.addEventListener('keydown', ...)` handler within `buildHkRows`. The nesting chain is: `buildHkRows` → `keys.forEach` → `inp.addEventListener` → `if(e.key==='Enter')` → inner `allCaptures()` arrow function (that's level 5). Fix: extract a `getHkCaptures()` helper that returns the NodeList, called from the top level instead of being re-declared inline three times. This also removes the duplication.

**Stage A** — `.dataset` fix + nesting fix (both small, both in `buildHkRows`/`applyTheme`)

---

### Issue 3 — Cognitive Complexity (13 instances)

Grouped by difficulty:

**Stage B — Easy wins (scores 16–32, functions that just need early returns or small extractions):**

- `loadCfg` (52) — extract a `_migrateHotkeys(d, c)` helper for the migration block
- `loadAutosave` (27) — minor restructure
- `togglePlay` (16) — borderline, one early-return refactor
- `main-lines mousedown` handler (30) — extract click branch logic

**Stage C — Medium (scores 30–40, larger functions):**

- `cleanGenius` (28)
- `extractGeniusMeta` (30 — actually `main-lines paste handler`)
- `batchSplitParens` (34)
- `markAsTranslation` (40)

**Stage D — Hard (scores 52–138, the big handlers):**

- `buildHkRows` `inp.keydown` handler (38) — already touched in Stage A
- `initSettingsSearch` `inp.onkeydown` (31)
- `main-textarea keydown` (32)
- `mergeTranslations`/`addSecondary` area (89)
- Global `document keydown` handler (138) — the hardest; split into `_handleSettingsKeys`, `_handleGlobalHotkeys`, `_handleHotkeyModeKeys`

---
**Recommended execution order:** A → B → C → D, one stage per turn. Stage D (the global keydown at 138) is the highest-risk and should be its own turn with careful testing. Want to start with Stage A?

---
# LineByLine 0.35.14

## Stage A — SonarQube fixes: `.dataset` + nesting depth

### My prompt
Sure

---

Two SonarQube issues addressed, no functional changes:

**1. `Prefer .dataset over setAttribute` (line 518)**
`document.documentElement.setAttribute('data-theme', ...)` replaced with `document.documentElement.dataset.theme = ...` in `applyTheme()`.

**2. Nesting depth > 4 levels (5 flags, all inside `buildHkRows` → `inp.keydown` handler)**
Three identical inline `const allCaptures = () => Array.from(...)` arrow declarations were extracted into a single named `function getHkCaptures()` defined just before the `inp.addEventListener('keydown', ...)` call. All three call sites updated to use it. Net line change: zero (one declaration replaces one inline, two others simplified in-place).

---

---

## Stage B — SonarQube fixes: cognitive complexity easy wins

### My prompt
Same version, Stage B

---

Four cognitive complexity reductions, all by extracting helper functions. No functional changes.

**`loadCfg` (52 → ~15): extracted `_migrateHotkeys(d, c)`**
The entire `if(d.hotkeys){...}` migration block plus the trailing fill-in-missing-defaults lines moved to a dedicated helper. Two consecutive `if(c.hotkeys.open===...)` checks collapsed to one with `||`. `loadCfg` now just parses, merges, runs three legacy guards, then delegates to `_migrateHotkeys`.

**`loadAutosave` (27 → ~12): extracted `_restoreSecondaryPool(d)`**
The `if(d.poolTexts&&d.poolTexts.length){...}` block moved to a helper. Call site becomes a single-line conditional.

**`togglePlay` (16 → ~10): extracted `_applySeekForPlay(lineMs, isCurrentLine)`**
The nested `if(isCurrentLine)/else` seek-position logic moved to a helper. The `else if / else` inside the old else branch was also flattened to a single ternary expression.

**`mousedown` handler inside `renderMainLines` (30 → ~5): extracted `_handleLineClick(e, i, line, lines)`**
The three-branch shift/ctrl/plain-click logic moved to a named function declared just above `renderMainLines`. The handler body is now a single delegating line.

SECTIONS index updated for shifted line numbers.

---

---

## Bug fixes (latent, pre-Stage A)

### My prompt

### Version
Patch

### Comments
- Continue with Stage B after addressing bugs

### Bugs
- Both are latent failures from before Stages A and B, but fix them anyway
	- `- [ ] Refresh webpage (F5) and confirm each change made in this section persisted and the placeholder metadata fields are altered`
		- Many hotkeys don't stay blank after reloading the page: Toggle theme, Issues, Toggle panel, Reset defaults, Replay only, Replay end, Mark line as translation
	- `- [ ] Playing another line: plays with configured Seek offset instead of from start when clicking another line`
		- Clicking another line *always* plays with configured Seek offset instead of from start, regardless of whether the setting is checked

---

Two latent bugs fixed before continuing to Stage C.

**Bug 1 — Cleared hotkeys not persisting across reload**
The fill-in-missing guards in `_migrateHotkeys` used `!c.hotkeys.X`, which treats an intentionally-cleared `''` as falsy and restores the default on every load. Changed all seven affected guards (`theme_toggle`, `replay_end`, `replay_only`, `mark_translation`, `issues`, `panel_toggle`, `reset_defaults`) to `=== undefined`. The redundant `!c.hotkeys.replay_only` guard in `loadCfg` was also removed since `_migrateHotkeys` now owns it.

**Bug 2 — Line click always seeking with offset regardless of setting**
`_handleLineClick` unconditionally applied `ms + getSeekOffset()` when clicking a timestamped line. Fixed to `ms + (cfg.replay_play_other ? getSeekOffset() : 0)`, matching the intent of the "Playing another line" instant-replay setting.

---
