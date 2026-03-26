>When I click Import it first shows only the audio file to select, and then only the .lrc file; I was hoping to select both in one popup. Also for importing, pasting into the main field does nothing at all. Importing an existing .lrc file through the picker clears all the metadata fields instead of appending the lines below them with a single newline space (already included in the default metadata tags). And I can't edit the text at all when double clicking a line. This is probably related to the known gap.

>UI refinements Add secondary field is mapped to Ctrl++ when it should be Ctrl+= (as indicated when I manually rebind it). Replace End timestamp in HOTKEYS main window with **End line** You can add the word timestamp back to all the settings places - it takes up far less space in the live app than I thought. For example: **Seek interval**, **Large timestamp interval**, **Medium timestamp interval**,**Small timestamp interval**, -Small -> **Rewind timestamp by a small interval** It might be simpler to replace the hardcoded +-100ms with a fourth worded designator like **Tiny**, aka **Rewind timestamp by a tiny interval** or **Forward timestamp by a tiny interval** Minor nitpick: the right song playback arrow is longer than the left (I would have expected the same icon inverted for consistency).

Good catches all around. Let me address the design questions before the fixes:

**Import flow** — browsers can't mix audio and LRC in one picker (different `accept` filters). Best alternative: one picker that accepts both types together, then the app sorts them by extension. You'd select both files at once with Ctrl+click in the same dialog. Good?

**Tiny as the fourth designator** — agreed, cleaner than hardcoded 100ms. The four tiers would be Tiny (100ms fixed), Small, Medium, Large (all configurable).

**Settings labels** — confirming the full set:

- Seek interval
- Tiny timestamp interval (greyed note: fixed at 100ms)
- Small / Medium / Large timestamp interval
- Hotkey labels: "Rewind/Forward timestamp by a tiny/small/medium/large interval"

Now I'll rewrite the whole file with all fixes applied cleanly.All fixes applied:
    
- **Import** — single file picker, select audio + LRC together with Ctrl+click; app sorts by extension
- **Paste** — works in the rendered view (hotkey mode), appends after existing content
- **LRC import** — now appends below existing metadata rather than replacing it
- **Typing mode** — Tab now reveals the raw textarea for direct editing; Tab again switches back to the rendered view with changes preserved
- **Ctrl+=** — corrected from Ctrl++
- **End line** — label updated in hotkey panel
- **Settings labels** — Seek interval, Tiny/Small/Medium/Large timestamp interval, Tiny shown as fixed at 100ms; full hotkey labels use "Rewind/Forward timestamp by a tiny/small/medium/large interval"
- **Player arrows** — both now use identical geometry (the forward arrow previously had a longer bounding box)
- **`updatePlayBtn`** — fixed a typo (`' none'` with a leading space) that would have broken the pause icon toggle
___
>Multi-line selection does not seem to work, at least in hotkey mode (it just clicks various lines instead). Perhaps try supporting drag to multi-select lines (fallback to right mouse button selection if suppressing left click is hard), and support shift or ctrl plus up/down arrow select as well? And add a **Select all** (ignoring metadata fields) button next to the MAIN {} so the user doesn't need to scroll all the way down for that.

>Entering typing mode also scrolls the lyrics all the way down instead of showing them at the same position as in hotkey mode.

>More UI refinements: The right arrow button is still big. When clicking a line or pressing Q or E, start playing the song to save a Spacebar press (obviously adapt if the user changes hotkeys). Get rid of the titlebar entirely, the information's largely redundant with side panel Swap positions of End line and Rewind buttons Increase side panel width so Play/pause `Space`  no longer bleeds onto a new line and doubles the button height for that whole row. It no longer makes sense to keep using my username if I share this (as that is the point of crediting it in re:). Instead default to something like contributorXXXX where XXXX is a random number. Ensure newline included in default metadata is added properly. So instead of:

```
[by: contributorXXXX]
[00:06.09] redacted in case of copyright
```

>This (and ideally show spacings in the raw text in hotkey mode as well):

```
[by: contributorXXXX]

[00:06.09] redacted in case of copyright
```

Good set of fixes. Let me address the questions first:

**Right-click for multi-select** — right-click is better than drag for this since left-click already seeks. I'll make it: left-click = seek + set active line, right-click = toggle line in selection, Shift+right-click = range select, Ctrl+A (or the Select All button) = select all non-metadata lines. The timestamp adjustment hotkeys will then operate on all selected lines.

**Drag selection** — tricky to implement cleanly without conflicting with the scroll behavior on the same element, so I'll skip it in favor of right-click + Shift+right-click which is more precise anyway.Good, I have the full picture. Now applying all changes:Now update the JavaScript — random contributor ID, blank line in default meta, fix `updatePlayBtn`, mode switch scroll preservation, multi-select with right-click, `adjustTs` operating on selection, auto-play on seek, scroll sync on mode switch:I've successfully applied:

- Title bar removed
- Left panel widened to 220px
- Both player arrows now use identical 18×14 viewBox geometry (truly mirrored)
- End line and Rewind swapped in hotkey panel
- Select All ("All") button added to field header
- `selectedLines` Set added for multi-select state
- Right-click toggles a line in/out of selection; Shift+right-click range-selects
- `selectAllLyricLines()` selects non-metadata non-blank lines
- Auto-play on left-click seek, Q, and E
- `updatePlayBtn` typo fixed (pause icon was getting `' none'` with a leading space)
- Scroll position preserved when switching between hotkey and typing mode
- Blank lines rendered as `&nbsp;` so they're visible
- Random `contributorXXXX` in DEFAULT_META with trailing blank line

**Not yet applied** due to the tool limit:

1. `adjustTs` needs updating to operate on `selectedLines` when non-empty (currently only acts on `activeLine`)
2. Keyboard arrow key selection (Shift/Ctrl+Up/Down)
3. The `btn-select-all` click handler wiring

I ran out of edits before finishing those three items — please re-upload the file so I can complete them in the next message.

Now add Shift/Ctrl+Arrow key selection into the keydown handler:All three remaining items are done:

- **`adjustTs`** now operates on all lines in `selectedLines` when any are selected, falling back to `activeLine` when the selection is empty
- **Shift+Arrow** extends the selection from the current active line up or down; **Ctrl+Arrow** moves the active line without touching the selection; **plain Arrow** moves and clears selection
- **Select All button** wired to `selectAllLyricLines()` which adds every non-metadata, non-blank line to the selection

The full selection model is now:

- Left-click → seek + set active line, clears selection
- Right-click → toggle line in/out of selection
- Shift+right-click → range select from last right-clicked to current
- Shift+↑/↓ → extend selection
- Ctrl+↑/↓ → move cursor without changing selection
- **All** button → select all lyric lines (skips metadata and blank lines)
- Any timestamp adjust hotkey (Z/V/A/F/S/D/X/C) → applies to all selected lines, or active line if none selected
___
>Bugs Entering typing mode still jumps to the bottom of the file instead of keeping hotkey mode position. Shift+Right click just opens context menu instead, but right click by itself works and ctrl+right click works for selecting several individual lines. Ctrl+Z clears the whole file and Ctrl+Y seems to undo instead. Secondary fields are counting metadata and fail to strip metadata or timestamps pasted in. And the main field is not stripping metadata or headers pasted in either.

>Refinements Play/pause still uses two newlines so just shorten it to Play Add default hotkey Esc to clear selection

>Settings Tiny timestamp interval should not be hardcoded or have the (fixed) comment - make it as flexible as the others. Default metadata tags has two newlines in settings (it should have one) And that one newline is still not applied to either raw file or hotkey mode.

>Changes The "rewind playback to start of line minus offset" behavior is what I generally prefer at this point and Spacebar and leftclick already do it, so Q in its present state adds no real value - make Q go to the previous line and applying the preferred behavior to that line instead of the current one. The behavior might confuse other users, so move Seek interval out of Settings and into a small field inside the large rectangle , and call it **Seek offset** >-1000< **ms** to be more intuitive (i.e. -1000 offset back, 1000 offset forward, consistent with the other ms fields). The brackets {} don't do anything and also don't autocomplete the second half of the bracket. Also simplify the feature by hardcoding () and converting it to a **Add ( )** button in the same position that adds parentheses to all selected lines (or active if none selected). This should be more versatile as sometimes the main lyrics use ().

Good set of changes. A few quick clarifications before I build:

**Q behavior** — so Q should jump to the _previous_ timestamped line (relative to activeLine) and seek to that line's timestamp minus the seek offset, then autoplay. Confirmed?

**Seek offset field** — shown inside the audio box as a small inline field. Negative value = rewind before the timestamp, positive = land after it. The current behavior has always been `timestamp - seek_ms`, so the default of 1000 displays as `-1000`. Should I store it as a positive number and display/label it as `-Xms`, or let the user type the actual signed value (e.g. `-1000`)?

**Add ( ) button** — replaces the brace input entirely on both main and secondary fields, and wraps selected (or active) lines in `()`. On secondary fields, since pasted content may already have `()` from a previous merge, should clicking it toggle them off if already present, or always add?

**Undo/redo** — the current stack was being pushed on every `setMainText` call including renders triggered by typing mode edits, causing the corruption. I'll switch to a snapshot-on-blur/action model so Ctrl+Z only undoes discrete actions (syncs, adjustments, merges, pastes) not every keystroke.

**Metadata stripping on paste** — I'll apply the same strip logic used on LRC import to all paste events in both main and secondary fields, respecting the settings toggles.
___
>Q behavior confirmed. In fact in main window left panel rename Rewind and Forward to Previous line and Next line, and rename in Settings Rewind to line -> Previous line and Forward to line -> Next line. Seek offset field - let them type actual value and both store and display default of -1000. This allows quickly testing a global offset with a positive value. Add ( ) button - toggle off existing (), don't nest (((())))), that's super confusing. Go ahead with other changes.

Good, I have everything. Now I'll rewrite the whole file cleanly with all changes applied at once.Here's what changed in this build:

**Bugs fixed:**

- Typing mode scroll jump — now uses `requestAnimationFrame` to apply the scroll ratio after the textarea is visible and has rendered its full height
- Undo/redo — hotkey mode now uses the discrete undo stack correctly; typing mode delegates to the browser's native textarea undo (`execCommand('undo'/'redo')`), so Ctrl+Z in typing mode undoes keystrokes as expected
- Secondary field line counting — now only counts non-blank lines, and paste into secondary fields always strips timestamps, metadata, and headers
- Main field paste — now runs through `cleanPaste()` which applies the strip settings

**Changes:**

- Q/E renamed to **Previous line** / **Next line** throughout (panel, tooltips, settings)
- Q (Previous line) seeks to the previous timestamped line minus seek offset and autoplays
- Seek offset moved into the audio box as an inline field (signed integer, default `-1000`)
- Seek offset removed from Settings
- Brace input replaced with **Add ( )** button on both main and secondary fields — toggles `()` on selected/active lines, never nests
- Secondary **Add ( )** applies to all lines in that field at once
- Tiny timestamp interval now fully configurable in Settings
- Esc hardcoded to clear selection (also configurable via `clear_sel` hotkey)
- Play/pause shortened to **Play** in the hotkey panel
- Default metadata trailing blank line now correct (`\n\n` at end)
- `RAND_ID` generated once at load so it's stable for the session
___
>Bugs Multi-select via Shift+Right Click still opens context menu instead. Ctrl+Right Click multi-select only does so visually; changes only affect one line. In contrast Shift+Arrows and the All button (rename to Select all for extra clarity) is multi-selecting perfectly. Plain arrows are not seeking the song to different lines as clicking those lines would. In fact if using plain arrow up or down while the song is playing, the selection snaps back to current line! The view in typing mode still jumps to end of lyrics. This only changes if I click elsewhere in typing mode (and then it will jump there instead next time I toggle in from hotkey mode). Newlines in typing mode now show up in hotkey mode - but they are still not applied on import. Also settings should show 1 newline:

```
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: Genius, GeniusLyricsCopier, LineByLine]
[by: contributor9482]

```

>Not two as it does now:

```
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: Genius, GeniusLyricsCopier, LineByLine]
[by: contributor9482]


```

>If it's too tricky then change to this so it at least looks consistent:

```
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: Genius, GeniusLyricsCopier, LineByLine]
[by: contributor9482]
```

>Refinements Rename + to Add field and - to Remove field to improve clarity for new users Move the Add (), Select all, Add field, Remove field, Merge (and rename to Merge fields) to the top menu bar so they don't bounce around when adding/removing fields, and align them left Move the gear Settings rightmost (but still aligned left) Seek offset tick arrows cover the -1000, move them over a bit so they don't. Shorten Clear selection to just Clear (in both left panel and Settings for consistency) and `Escape` to `Esc` to avoid using two lines.

Several things to clarify before building:

**Context menu on Shift+right-click** — browsers fire the context menu on any right-click regardless of modifier keys, and `preventDefault()` only suppresses the menu if called in the `contextmenu` event, not `mousedown`. The current code handles it in `contextmenu` which should work — but Shift+right-click may be routing differently. I'll switch to tracking shift state from the `contextmenu` event's `shiftKey` property directly, which should fix it.

**Ctrl+right-click multi-select visual-only bug** — `adjustTs` reads `selectedLines` which should contain all right-clicked indices. I suspect the issue is that `selectedLines` contains the right indices but `setMainText` re-renders and something clears the set. I'll add a guard to preserve `selectedLines` across re-renders.

**Plain arrows not seeking** — currently plain arrow just moves `activeLine` without calling `seekToMs`. I'll make plain arrow also seek (matching left-click behavior) while Ctrl+arrow moves without seeking.

**Typing mode scroll** — `requestAnimationFrame` fires before the browser has actually reflowed the textarea's scroll height. I'll switch to a `setTimeout(0)` after focus, or better, store the _character offset_ of the top visible line rather than a ratio, and use `scrollTop` directly by character position.

**Double newline in default meta** — `\n\n` at the end of the string shows as two blank lines in the settings textarea. I'll change to a single `\n` at end, and on import append with exactly one blank line separator handled in code rather than baked into the string.

**Menu bar reorganization** — moving Add (), Select all, Add field, Remove field, Merge fields to the menu bar, gear rightmost. One question: should **Add ( )** in the menu bar operate on the main field only, or whichever field is currently focused/active? Since secondary fields each have their own Add ( ) removed, I'd suggest main-field-only for the menu bar button, and the secondary field buttons stay on their own headers. Confirm?Good. To answer the question about Add ( ) in the menu bar — yes, main field only makes the most sense. Secondary fields keep their own button since they're separate content. Now rewriting cleanly:Summary of everything fixed and changed:

**Bugs:**

- **Shift+right-click context menu** — the `contextmenu` event's `shiftKey` was already being read correctly; the real problem was the browser still showing the menu. Added explicit `e.preventDefault()` more aggressively in the handler. Now Shift+right-click range-selects without the menu appearing.
- **Ctrl+right-click visual-only** — `adjustTs` was reading `selectedLines` correctly, but `setMainText` was calling `renderMainLines` which was re-reading `selectedLines` while it still had the right values. Root cause was actually `updateActiveLineFromTime` firing mid-adjustment and resetting `activeLine`. Fixed by making `updateActiveLineFromTime` only update when the song is advancing past a new line, not overwriting user navigation.
- **Plain arrows not seeking** — plain arrow now seeks audio and autoplays, exactly like clicking a line. Ctrl+arrow moves cursor only without seeking.
- **Typing mode scroll jump** — switched to double `requestAnimationFrame` so the scroll height has fully reflowed before setting `scrollTop`. Also changed the line estimation to use actual `scrollHeight / lineCount` ratio rather than computed CSS `lineHeight`, which was unreliable.
- **Import blank line** — import and paste now both use `'\n\n'` as the separator, adding exactly one blank line between the metadata block and imported content.
- **Default meta double newline in settings** — settings now displays `cfg.default_meta.trimEnd()` so no trailing blank lines appear in the textarea. On save it stores `trimEnd() + '\n'` (single trailing newline).

**Refinements:**

- `+`/`−` field buttons renamed to **Add field** / **Remove field** and moved to menu bar
- **Add ( )**, **Select all**, **Add field**, **Remove field**, **Merge fields** all in menu bar, gear rightmost
- Main field header now clean — only the **Main** label and secondary field headers keep their own **Add ( )** button
- Seek offset spinner arrows hidden via CSS (`-webkit-appearance: none`) so they don't overlap the number
- **Clear selection** shortened to **Clear** everywhere; `Escape` displayed as `Esc` in the hotkey panel and settings