Bugs It's very strange how Offset time and Typing Mode keep appearing as they do in the actual app: | Offset time `Grave`| | Hotkey mode `Tab` | | Play `Space` | | Sync line `W` | Instead of like this: | Offset time `Grave` | | Hotkey mode `Tab` | | Play `Space` | | Sync line `W` |

Changes Add individual button to reset a hotkey to default that appears when a hotkey is changed, for each hotkey in Settings. Add left-aligned button in Settings bottom bar where Cancel is called Reset defaults that resets all default settings in Settings window. Remove Cancel and Save button in Settings and simply always autosave settings in the Settings window immediately Refinements Play should be disabled in Typing Mode Add some visual feedback to all buttons when they are clicked (not when hotkey activated though as that might be distracting)
___
Let me read the current file before making changes.Good — now I'll apply everything in one Python pass.All 13 checks pass, no missing IDs.Here's everything in this version:

**Bugs fixed:**

- **Offset time / Hotkey mode side-by-side** — the root cause was that `.hk-cell.mode` has `grid-column:span 2` in CSS, which was overriding the inner sub-grid and forcing each cell to take a full row. Fixed by adding a `.hk-cell.mode.half` class with `grid-column:span 1`, applied to the two cells inside the mode sub-row.

**Changes:**

- **Per-key reset button** — each hotkey row in Settings now has a `↺ Default` button that appears only when the current value differs from the default. Clicking it immediately resets that hotkey and saves
- **Reset defaults button** — left-aligned in the Settings footer; resets all settings (strip options, intervals, metadata template, all hotkeys) to factory defaults and refreshes the Settings window
- **Settings autosave** — Cancel and Save buttons removed. All settings changes take effect immediately: checkboxes and number fields save on `change`, the metadata textarea saves on `input`, hotkeys save the moment a key combination is captured

**Refinements:**

- **Play disabled in Typing mode** — `play_pause` added to `HOTKEY_ONLY`; the Play cell grays out to 35% opacity in Typing mode just like the timestamp and sync controls
- **Click visual feedback** — `transform:translateY(1px)` + `filter:brightness(0.85–0.88)` `:active` states added to: `.mb-btn`, `.hk-cell`, `.hk-cell.mode`, `.fh-btn`, `.fs-tick`, `.seek-arr`, `.s-btn`, `#sync-file-btn`, `#vol-mute-btn` (scale instead of translate), and `#btn-theme`. These only fire on actual mouse clicks, not on hotkey activation.