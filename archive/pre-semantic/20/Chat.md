Screenshot 1
###### Bugs
Open hotkey field in Settings is in fact disabled and cannot remapped despite cosmetically appearing a little more like a normal hotkey field, see open.png. Make sure it's not hardcoded as the UI implies.

When removing a field and then removing some text in main field, undoing the text removal also undoes field removal in the same step - but field removal should be an earlier step. 
###### Changes

###### Refinements
Get rid of volume slider dragging shape entirely

Get rid of F2/F3 hotkeys entirely since they don't work

Reduce width of font size field - it just needs to hold two digits

###### Known issues (Claude: read for context but don't attempt to fix these)
Some native browser commands like Ctrl + O cannot be overridden
Global volume hotkeys don't work, manually focusing or clicking some element is required
___
Let me read everything relevant before touching the file.
Now I see the undo bug clearly. The issue is the **debounced snapshot**: when the user removes a field, `pushSnapshot()` fires immediately. Then when the user types/deletes text in the main field, the debounced timer fires 800ms later and pushes _another_ snapshot — but since it calls `pushSnapshot()` which captures the _current_ state (already with fewer columns), that snapshot looks identical to the one that was pushed for the field removal. So undoing text deletion pops back to the field-removal state instead of just the text state.

The fix: the debounced typing snapshot should **only** push if the main text has actually changed since the last snapshot, not just any time. Also need to properly handle `vol_down`/`vol_up` removal and `open` as a real remappable hotkey with `Middle click` as default display.Now I have everything. Let me implement all changes:It's there on line 323 — the check's split logic was off. All 13 checks are passing.Here's what changed in v20:

**Bugs fixed:**

- **Open field now fully remappable** — `open` is now a real entry in `DEFAULT_CFG.hotkeys` with an empty string default (no keyboard shortcut by default). The Settings row is a standard editable `hk-capture` input like all others. When empty it shows "Middle click" as a CSS placeholder (styled in muted text to distinguish it from a real assignment). If the user assigns a key, it fires `doImport()` via the keyboard handler. Middle click always works regardless.
    
- **Undo granularity for field removal + typing** — the debounced snapshot in typing mode now checks whether the main text has actually changed from the top of the undo stack before pushing. This means if you remove a field (which immediately pushes a snapshot) and then type, the debounce won't overwrite that snapshot with a collapsed version — field removal and subsequent text edits stay as separate undo steps.
    

**Refinements:**

- **Volume slider** — reverted to native browser appearance (`accent-color` only), removing all custom `-webkit-slider-thumb` / `-moz-range-thumb` CSS.
    
- **F2/F3 hotkeys removed** — `vol_down` and `vol_up` removed from `DEFAULT_CFG`, `HK_LABELS`, `CTRL_ACTIONS`, and the keyboard handler entirely.
    
- **Font size field** — narrowed from 42px to 30px (comfortably holds two digits).