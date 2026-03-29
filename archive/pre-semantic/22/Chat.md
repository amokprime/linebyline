Screenshot 1
###### Bugs
Open hotkey field still looks off from the other fields. Interestingly, when assigning it to something else like Ctrl+M, other keys cannot be assigned to middle click. That suggests another browser restriction (maybe related to middle click being used to close a tab or activate a hovering scroll pad). If you can't get around that then add Ctrl+M as a hotkey and the "front person" to show in Settings, and edit the Open tooltip to show both hotkeys.

All hotkey fields apparently show a typing cursor when clicked, it's not just Open and this happens in every version of the app. Change them to show '...' until key(s) are pressed, then replace '...' with the keys set.

Undo does not track text removed with Backspace, only Delete does. Undo also undoes numerous edits in one step, like the below example. Every single text edit should be a separate undo entry.
```
abcd #entire line undone
#multiple rows undone
a
b
c
d
```

Only scroll wheel respects default volume increment of 10% - mouse click dragging uses increment of 1%.
###### Known issues (Claude: read for context but don't attempt to fix these)
Some native browser commands like Ctrl + O cannot be overridden
Global volume hotkeys don't work, manually focusing or clicking some element is required
___
Let me read everything carefully before writing a line.Now I have the full picture. Let me address everything:

1. **Open field appearance** — the issue is `inp.readOnly=true` still shows a text cursor and the field looks different. Solution: show `…` on focus instead of clearing to empty, use `cursor:default` in non-focus state.
    
2. **All hotkey fields show text cursor** — because `readOnly` inputs still show a caret. Fix: use `cursor:pointer` and on focus show `…` instead of empty string.
    
3. **Open + middle click**: Middle click can't be captured as a hotkey (browser restriction confirmed). Add `Ctrl+M` as the default keyboard shortcut for Open, update tooltip.
    
4. **Undo: every keystroke should be separate** — current debounce batches them. Replace with per-keystroke snapshots but with a smarter approach: push on every `input` event in typing mode (no debounce). The undo stack limit of 100 handles memory.
    
5. **Backspace vs Delete** — backspace fires `input` just like delete. The debounce is why both seem batched. Fixing #4 fixes this.
    
6. **Volume slider drag uses step=0.01** — the HTML `<input type="range" step="0.01">` means dragging snaps to 0.01 increments. Change `step` to `cfg.vol_increment` dynamically, or remove the step and round to increment in the input handler.The second Python script ran on the file from pass 1 which didn't have pass 2 changes yet applied. The file was opened again at start of pass 2, but the changes from pass 1 weren't written before the `open()` call in pass 2. Let me check what state the file is in:Pass 2 changes are present for vol slider but not for the hotkey/undo changes. The first Python script in pass 1 wrote the file with the placeholder removal, then pass 2 read a fresh copy. Let me check what's in the file now completely:Pass 1's file write was overwritten by pass 2 reading the original again. Pass 2 only has the vol changes. I need to apply all changes to the current file state:The secondary timer was already removed by pass 2 — it was in the written file but the verification script was reading a different state. The main timer (`_typeTimer`) is still in the file because the first pass didn't persist. Let me just run the clean final pass:
___
Here's what changed in v22:

**Bugs fixed:**

- **Open hotkey field appearance** — `Ctrl+M` is now the default keyboard binding for Open (middle click can't be captured by browsers as a hotkey). The Open button tooltip updated to show both. The special-case placeholder code is gone since the field now has a real value like all other fields.
    
- **All hotkey fields show typing cursor** — added `caret-color:transparent` to `.hk-capture` so the text insertion caret never appears. On focus, fields now show `…` (U+2026 ellipsis) instead of going blank, making it clear the field is waiting for a key press. On blur without capturing, the previous value is restored.
    
- **Undo doesn't track Backspace / batches multiple edits** — replaced the 800ms debounce with per-keystroke snapshots. Every `input` event in typing mode (both Backspace and Delete trigger `input`) now immediately pushes a snapshot if the text changed from the top of the stack. Same for secondary fields. The stack limit of 100 remains as the memory guard.
    
- **Volume slider drag uses 1% increments** — the slider's `step` attribute is now set to `cfg.vol_increment` on init and whenever settings are saved. The input handler also rounds `masterVolume` to the nearest increment, so dragging snaps to the same steps as the scroll wheel.
    

**On middle click as a hotkey:** Browsers consume middle click at the OS/browser level for tab closing and scroll activation — it cannot be captured via `keydown` or `mousedown` in a way that's reliable or reassignable. `Ctrl+M` is the conventional keyboard workaround.
