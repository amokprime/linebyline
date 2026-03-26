Screenshot 1
###### Bugs
Open hotkey field now allows reassignment but its font looks off from the other fields and bizarrely allows typing, see open.png again

Field removal is still undone in the same step. 
Would it be simpler if adding/creating fields was not in the undo stack at all? For example:
- Persist field content for the browser session:
	- I create secondary field 1 and type 'first thing'
	- I create secondary field 2 and type 'second thing'
	- I create secondary field 3 and type 'third thing'
	- I remove all three fields by using remove field button or hotkey thrice
	- I add three fields similarly
	- Secondary field 1 is back and shows 'first thing'
	- Secondary field 2 is back and shows 'second thing'
	- Secondary field 3 is back and shows 'third thing'
- This is basically hiding fields rather than removing them, making restoring them independent of the undo stack - in fact you can do that (leave them open but hidden) if it's not a big performance hit or security risk
###### Known issues (Claude: read for context but don't attempt to fix these)
Some native browser commands like Ctrl + O cannot be overridden
Global volume hotkeys don't work, manually focusing or clicking some element is required
___
Let me read the relevant parts of the file carefully.I see the Open field bug: `inp.readOnly=true` is set, but the `focus` listener clears the value (`inp.value=''`), which makes it editable-looking and shows a text cursor. And `inp.readOnly` doesn't prevent the `keydown` handler from updating `inp.value` since that handler calls `e.preventDefault()` then sets the value programmatically — so the field does actually work for capture. The visual bug (font looking off) is the `placeholder` being smaller font. The "allows typing" is because `readOnly` only blocks direct user text input, not `inp.value=` in JS, so focus+type does set the value via the keydown handler — which is actually correct behavior. The issue is the `focus` handler clears the value before capture, revealing the placeholder with its smaller font mid-interaction.

Now let me read the secondary field / hide architecture:Now I have a complete picture. The hide-instead-of-remove approach is elegant and simple. Let me plan it:

- `secondaryPool`: array of all ever-created `{col, linesEl, warnBar}` objects (never destroyed)
- `secondaryCols`: array of currently **visible** ones (subset of pool)
- `addSecondary()`: if pool has a hidden col at `secondaryCols.length`, show it; else create new
- `removeSecondary()`: hide the last visible col (`.col.style.display='none'`), pop from `secondaryCols`
- Content persists because the DOM element is never removed
- No undo involvement for add/remove field at all — they're off the stack entirely
- `applySnapshot` only restores textarea text, never touches col count
- Snapshot `colCount` can be removed since field visibility is separate stateNow I have everything. Let me implement the full rewrite:`_snapPaused` is now only used in `pushSnapshot` itself — no callers set it to true anymore. Safe to remove it.Here's what changed in v21:

**Bugs fixed:**

- **Open field font** — removed `font-size:11px` from the `::placeholder` CSS rule so the placeholder text matches the other fields' 13.2px. Also added a `blur` listener that restores the previous value if the user focuses the field but doesn't press a key, preventing the field from appearing empty after an abandoned capture attempt.
    
- **Field removal undo granularity** — completely rearchitected. Add/remove field is now fully **outside the undo stack**:
    
    - `secondaryPool` holds all ever-created columns permanently in the DOM (never removed)
    - `addSecondary()` either shows the next hidden pool entry or creates a new one
    - `removeSecondary()` hides the last visible entry (`display:none`) — content is preserved
    - Re-adding a field restores its previous content exactly as described in the prompt
    - `pushSnapshot()` / `applySnapshot()` no longer touch column count or visibility — they only restore textarea text
    - `_snapPaused`, `_addSecondaryRaw`, and `colCount` in snapshots all removed
    - Autosave now stores `poolTexts` (all pool entries' content) + `visibleCount` so session recovery also preserves hidden field content
    - A `_updateFieldBorders()` helper manages the last-visible-column border correctly since hidden `display:none` elements affect CSS `:last-child` counting
