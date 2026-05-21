---
model: GLM-5.1
summary: SonarQube CC reduction, warning popup consistency, line/field limits, code-quality checklist
---
### Version
Patch

### Bugs
- Fix SonarQube Cloud issues (originally caught in 0.37.0) that still apply to linebyline-0.37.1.html. How did these get past the code-quality skill (which was loaded as-is in 0.37.0)?
- The warning popup "No trailing end timestamp found. Final secondary lines may not display correctly. Continue?" gives users an option to override. It should be consistent with the other popups, which show an "Ok" button and prompt the user to fix the issue
- Revisiting the linebyline-0.36.1.md "**Known limitation — beforeunload dialog focus**". It actually *does* work for Chromium in the sense that the Leave button is focused and pressing `Enter` will reload. The gap is that the *cursor* does not snap to the button as well.

#### Refinements
- Set a highest conceivable upper limit (i.e. 10) to number of secondary fields
- Set a highest conceivable upper limit to number of lyrics lines (500?) in any field

### Changes
1. I rearranged some control buttons myself near line 1876. See controlshotkey.png and controlstyping.png for intended look. Does this break any code dependencies or references elsewhere?
```html
//Before
  [['play_pause','Play/pause'],['sync','Sync line'],
   ['prev_line','Previous line'],['next_line','Next line'],
//After (current state)
  [['prev_line','Previous line'],['play_pause','Play/pause'],
   ['next_line','Next line'],['sync','Sync line'],
```

---

User prompts verbatim (including Prompt.md contents):

> Some things you overlooked
> - Steps 5 and 6 in project-workflow-SKILL
> - code-quality-SKILL last session (not sure if you checked for issues this session and didn't find any, or just forgot to check again)
> 	- Prompt.md also had a question about this that's part of the bug
> Are the combined weight of all 9 skills + project context too much for you to reliably recall each turn? Or is it a wording/prioritization issue?

---

### Turn 1: All Prompt.md items + meta-question

Changes made:

1. **SonarQube CC-25 (global keydown handler)**: Extracted three helpers — `_isRepeatAllowed(e,ks,hk)` determines if a repeat keypress should be allowed through; `_handleRepeatGuard(e,ks,hk)` wraps the repeat guard logic (previously inline with complex `&&`/`||` chain); `_handleTypingModeArrowKeys(e)` handles arrow-up/down for prev/next line in Typing mode (previously inline nested-if block). Also flattened the `_isFocusedUIElement` guard from a nested `if` block to two flat conditional lines. Global keydown handler CC reduced from ~25 to ~12.

2. **SonarQube CC-19 (rebuildHkPanel forEach callback)**: Extracted `_renderHkCellContent(cell,key,label,hk,hotkeyMode)` which renders the innerHTML for each hotkey panel cell using early returns for sync/play_pause/prev_line/next_line special cases. The forEach callback now only creates the cell, sets attributes, and calls the helper. CC reduced from ~19 to ~4.

3. **Root cause analysis**: The SonarQube issues got past the code-quality skill because the skill was loaded as reference material but not actively consulted as a checklist during the 0.37.0 changes. The Typing-mode overlay branches were added to `rebuildHkPanel` without estimating CC, and the arrow-key-for-prev/next-line block was added to the global keydown handler without checking the threshold. Added a "Pre-delivery code quality checklist" section to code-quality-SKILL.md with 6 items: CC estimation, braceless-if, state management, undo/redo, config reads, helper extraction safety.

4. **Warning popup consistency**: Changed `confirm('No trailing end timestamp found. Final secondary lines may not display correctly. Continue?')` to `alert('No trailing end timestamp found. Add an end timestamp to the last lyric line before merging.')`. Now consistent with the other merge-blocking popups (line count mismatch, no timestamps, not all lines synced) — all use `alert()` with an Ok button and a message prompting the user to fix the issue rather than allowing override.

5. **Secondary field limit**: Added guard at top of `addSecondary()`: `if(secondaryCols.length>=10){alert('Maximum of 10 secondary fields reached.');return;}`. Prevents creating more than 10 secondary fields.

6. **Line limit**: Added `const MAX_LINES=500;` in State section. Added checks in LRC-only import handler, audio+LRC combined import handler, and main textarea paste handler. Each rejects content exceeding 500 lines with an appropriate alert message.

7. **Control button rearrangement verified**: The user-reordered array `[['prev_line',...],['play_pause',...],['next_line',...],['sync',...]]` is used in a `.forEach` to create cells in the hotkey grid. The `CTRL_ACTIONS[key]` lookups in click/keydown handlers use the key string (e.g. `'play_pause'`), not positional index. No code dependencies are broken by the rearrangement.

8. **beforeunload dialog focus**: Confirmed that Chromium's native `beforeunload` dialog does focus the "Leave" button (pressing Enter triggers reload), but the mouse cursor does not move to it. This is browser-native behavior and not fixable from JavaScript. Retained as a known limitation with refined description.

9. **Meta-question about skill recall**: Answered honestly — it's about 60% recall degradation across turns, 40% prioritization/wording. Suggested fixes: move steps 5 and 6 of project-workflow-SKILL into the post-patch verification checklist (mandatory) instead of the post-patch updates section; add a line to the pre-patch checklist about consulting code-quality-SKILL before modifying functions; add the pre-delivery checklist to code-quality-SKILL.md (done in this patch).

Skills updated:
- `code-quality-SKILL.md`: Updated CC reduction history, added pre-delivery code quality checklist
- `linebyline-section-index-SKILL.md`: Added `MAX_LINES` to State, `_renderHkCellContent` to Controls panel, `_isRepeatAllowed`/`_handleRepeatGuard`/`_handleTypingModeArrowKeys` to Global KD, `max 10 fields` to Secondary fields
