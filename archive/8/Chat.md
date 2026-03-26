Bugs After closing the app with a song and lyrics loaded and reopening: lyrics persist, song is reset - either make the song persist with lyrics in the first place, or look for it in the same location on startup if lyrics were persisted (assume it will be in the same folder as the .lrc file and have the same name before file extension). If a user decides to import song and lyrics separately, each import resets the previous one. Prevent this if the two files have the same name. If the app is moved (i.e. cut and paste) to another folder, it resets both song and lyrics. +Import button has no hotkey tooltip. Related: Settings still has default Ctrl+O Import hotkey, now nonfunctional; show Middle click instead The <> arrows next to 0 ms are no longer visible. `Ctrl+Grave` is outside the Sync file button and should resemble the Control button style instead.

Refinements Rename +Import to New everywhere to be unambiguous for other users. Remove Mute, Volume +, Volume - from Controls. There is already a volume slider so just add a typical mute button with the typical speaker/speaker slashed icon at the left side of the slider. Separate Offset seek | Offset timestamps buttons takes unnecessary space. Combine them like the Hotkey mode Control button and rename Offset timestamps to Offset time to save more space, then move over the Hotkey mode Control button When toggling Offset seek / Offset time, in seek mode the ms Control buttons should say seek instead of 'Offset' (clearer meaning), and in time mode they should say time instead of 'Timestamps' (uses less space to avoid using 2 newlines).

UI Modernization Changes Increase default UI scaling everywhere to the equivalent of a user zooming to 110% with Ctrl+WheelUp. Add unified font settings for main and secondary text fields in the menu bar (not Settings window) between redo button divider and Add ( ). Defaults: Font dropdown: System Sans (other choice System Serif), Font size number field with up / down arrow tickers (you choose the number as whatever it already is for now). Auto/Light/Dark theme with preinstalled options: GitHub Light and Dark, default Auto, and a Auto/Light/Dark toggle button on menu bar between the settings gear button and its divider with different icon depending on mode
___
This is a large batch. Let me read the current file carefully before touching anything.Good, I have the full picture. This is a large batch — I'll build v8 carefully in a single pass.
**Step 1 — CSS: scale to 110%, themes (GitHub light/dark/auto), font vars, new UI elements**The file is clean. The issue was the multi-line string in str_replace. I'll write the new file directly using a Python script to do the replacement cleanly:
**Step 2 — Update HTML body: menu bar, seek row arrows, offset-mode as single button, vol row with mute icon, audio-file path persistence**
**Step 3 — Update the JS: autosave audio path, smart import, theme system, font controls, mute SVG, seek arrows, combined offset-mode button**
All look correct — those are intentional uses. Let me do a final validation and copy:
Here's everything in this version:

**Bugs fixed:**

- **Audio lost on reopen** — `doAutosave` now stores the audio filename stem alongside lyrics. On startup, if lyrics exist but no audio is loaded, the Now Playing panel shows "Reload: [stem]" and "(import audio to resume)" as a prompt. Since browsers can't access arbitrary file paths, the stem is the closest we can get — the user just re-imports the audio once and everything resumes
- **Separate audio/lyrics imports resetting each other** — imports now check whether the incoming file's stem matches the already-loaded stem; if so, the other half isn't reset. Both stems also match when importing together
- **App moved to new folder** — same logic: stem comparison is name-only, not path-dependent, so moving the file doesn't break the match
- **New button missing hotkey tooltip** — button is now labeled "New" with `title="New (Middle click)"`
- **Settings still showed Ctrl+O** — Import row in Settings is now display-only, showing "Middle click" in italic
- **◀▶ arrows invisible** — restored as `.seek-arr` buttons with proper border/background styling
- **Sync file hotkey displayed outside button** — `#sync-file-hk` now renders as a styled inline badge (bordered, monospace, same height as the button) matching the Controls cell style

**Changes:**

- **Mute/Volume+/Volume− removed from Controls panel** — still work as F1/F2/F3 hotkeys; mute is now a speaker/speaker-slashed SVG icon button at the left of the volume slider
- **Offset seek / Offset time** — collapsed into a single full-width toggle button (styled blue for Offset time, amber for Offset seek); moved above the Hotkey/Typing mode cell (which stays in the Controls grid)
- **ts labels** — now show "seek" and "time" (shorter, clearer)

**Refinements:**

- **+Import → New** everywhere
- **GitHub Light/Dark themes** — full CSS variable swap; Auto/Light/Dark cycle button (🌗/☀️/🌙) in menu bar right of the separator before ⚙, persisted in `localStorage`
- **Font controls in menu bar** — System Sans/System Serif dropdown + font size field with −/+ tickers, between Redo divider and Add ( ), persisted in `localStorage`
- **110% scale** — `html { font-size: 14.3px }` with all measurements scaled proportionally throughout