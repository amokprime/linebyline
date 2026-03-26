Screenshots 1, 2
Bugs Song-only and lyric-only imports are still aggressively resetting everything. When closing the file there is a prompt near the seek bar to reimport the song manually (which resets everything). In Settings, New (Middle click) should just be called New like in the main window, and the hotkey for it should be a flexible field like the other hotkeys instead of hardcoded

Refinements Increase default font size from 13 to 14 Change settings icon to three horizontal bars and move it all the way to the left before New Sync file button's Ctrl+Grave overlay is well outside the button but it should be inside exactly like the Controls buttons. Fix this and move it right next to the <> arrows instead of beneath them. Move the Offset time button under Controls next to Hotkey mode button; shrink the Hotkey mode button so they each take half the space. Give Hotkey mode button the same yellow color change for Typing mode that Offset time has for Offset seek. Increase left panel width again if necessary so no single-line names bleed into a second line. In Settings expose the Enter hotkey for replaying the current line +- seek offset and call it **Replay line** (no control button). Don't hardcode it but have a flexible hotkey field like the other hotkeys. Make Spacebar behave like Enter when unpausing the song. Make Sync line behave like Enter too after the timestamp is created to give the user instant feedback for the line they just synced
___
The screenshots give me a clear picture of what needs fixing. Let me read the current file before making changes.
Now I have the full picture. Let me apply everything in one careful Python pass.
Here's everything in this version:

**Bugs fixed:**

- **Aggressive import reset** — imports now check the incoming file's stem against `savedAudioPath`. If the stem matches what's already loaded (or was previously loaded), no reset occurs — the new file just replaces its half (audio or lyrics). Only truly new/different stems trigger a full reset. The "Reload" hint prompt is removed since it was a symptom of the old aggressive reset
- **New / hotkey in Settings** — "New (Middle click)" is now just "New" in both the label and Settings, and it's a fully remappable hotkey field like all others (defaulting to `Ctrl+O`)

**Refinements:**

- **Default font size** — bumped from 13 to 14px
- **Settings icon** — changed to ☰ (hamburger) and moved to the leftmost position in the menu bar, before New
- **Sync file hotkey badge** — now lives inline inside the seek row, directly to the right of the ◀▶ arrows, rendered as a bordered badge matching the Controls cell style
- **Offset time / Offset seek** — removed from the audio box entirely; now lives in the Controls grid as a half-width cell next to Hotkey mode / Typing mode. Both cells take equal half-width. Typing mode gets the same amber warning color as Offset seek, so both mode deviations are visually flagged
- **Left panel** widened from 281 to 310px to prevent label wrapping
- **Replay line** — new configurable hotkey (default `Enter`) exposed in Settings under that name; seeks to active line with seek offset applied and autoplays
- **Spacebar** — now also seeks to the active line before unpausing (same behavior as Enter/Replay line), so pressing Space on a paused song always gives you the correct playback position
- **Sync line** — after stamping the timestamp, immediately calls `replayActiveLine()` so the user hears the result at the exact time that was just set
___
Screenshot 3
Something broke and all the controls are gone, most buttons and hotkeys seem unreponsive
___
The error is `Cannot read properties of null (reading 'addEventListener')` — something is trying to wire up a DOM element that no longer exists. Let me diagnose.Found it. `setOffsetMode` still tries to get `#om-toggle` (removed from HTML), and there's still a wiring call for it. `setOffsetMode` no longer needs to update a button since the toggle is now a Controls cell rebuilt dynamically. Let me fix both issues:No more missing IDs. Copy to outputs:The crash was caused by two leftover references to `#om-toggle` — the button that was moved out of the HTML audio box into the Controls grid (where it's now created dynamically by `rebuildHkPanel`). The `setOffsetMode` function was still trying to grab it by ID to update its text/class, and a wiring call was trying to attach a click listener to it, both failing immediately on load and crashing the entire script before any controls could render.

Both references are now removed. `setOffsetMode` simply calls `rebuildHkPanel()` which rebuilds the Controls grid including the new half-width Offset time/seek cell.