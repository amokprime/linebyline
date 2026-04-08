### Revisit recommended first-run sequence
✅Open an audio file → verify title/artist appear, playback works: Opening new song audio file now resets the song title
⚠️Open an LRC file → verify lines render in hotkey mode: Highlighted text on the current line remains illegible in dark mode (pythonmaindark.png) - it should simply have the same color as the timestamp which is legible
⚠️ Tab → verify typing mode, paste Genius page: Genius paste now works in both modes. However, Tab in Typing mode initially tabs over to focus the Offset time control button and on second keypress switches to Hotkey mode - it should switch the first time
⚠️Ctrl+, → verify settings dialog opens, hotkey capture works: (settingsdark.png) Settings has a redundant titlebar (the word "Settings" appears twice). Settings titlebar and bottom bar areas look like they're in in low contrast light mode while in dark mode; visibility of the original "Settings" title word, searchbar "Search..." hint text, the keyboard icon, and the X circle button are hard to see in dark mode
✅Ctrl+. → verify theme toggles: 🌙/☀️ are showing properly now (pythonmainlight.png, pythonmaindark.png)
❌Arrow keys in hotkey mode → verify navigation: Up/Down still don't navigate although Q/E do
⚠️Add field, paste translation, Merge fields → Merge fields can still only be undone with Ctrl+Z in Hotkey mode (the Undo GUI button isn't affected by this limitation)
### Missing elements
- Font size field and spinner controls
- 📂buttons in Main and Secondary fields

### Remaining functional regressions
- Middle click to open stops working over main field when there are lyrics in it
- Scrolling over volume slider no longer adjusts it
- X button that appears as an option next to hotkey fields shifts focus to next hotkey field below and puts that field in "..." state instead of clearing the original hotkey; Default button that appears next to original hotkey field does revert it to default but also has the same shift focus behavior
### Aesthetic regressions
Theming inconsistencies in table:

| App and theme        | Element                   | White | Light gray | Dull gray | Black | Dark gray |
| -------------------- | ------------------------- | ----- | ---------- | --------- | ----- | --------- |
| firefoxmainlight.png | Main window menu bar      | ✅     |            |           |       |           |
| firefoxmainlight.png | Main field title bar      | ✅     |            |           |       |           |
| firefoxmainlight.png | Main field lyrics area    |       | ✅          |           |       |           |
| firefoxmainlight.png | Now playing title/outline | ✅     |            |           |       |           |
| firefoxmainlight.png | Playback controls box     |       | ✅          |           |       |           |
| firefoxmainlight.png | Controls title/outline    | ✅     |            |           |       |           |
| firefoxmainlight.png | Control buttons           |       | ✅          |           |       |           |
| firefoxmaindark.png  | Main window menu bar      |       |            |           | ✅     |           |
| firefoxmaindark.png  | Main field title bar      |       |            |           | ✅     |           |
| firefoxmaindark.png  | Main field lyrics area    |       |            |           |       | ✅         |
| firefoxmaindark.png  | Now playing title/outline |       |            |           | ✅     |           |
| firefoxmaindark.png  | Playback controls box     |       |            |           |       | ✅         |
| firefoxmaindark.png  | Controls title/outline    |       |            |           | ✅     |           |
| firefoxmaindark.png  | Control buttons           |       |            |           |       | ✅         |
| pythonmainlight.png  | Main window menu bar      |       |            | ✅         |       |           |
| pythonmainlight.png  | Main field title bar      |       |            | ✅         |       |           |
| pythonmainlight.png  | Main field lyrics area    |       |            | ✅         |       |           |
| pythonmainlight.png  | Now playing title/outline |       |            | ✅         |       |           |
| pythonmainlight.png  | Playback controls box     | ✅     |            |           |       |           |
| pythonmainlight.png  | Controls title/outline    |       |            | ✅         |       |           |
| pythonmainlight.png  | Control buttons           |       |            | ✅         |       |           |
| pythonmaindark.png   | Main window menu bar      |       |            |           | ✅     |           |
| pythonmaindark.png   | Main field title bar      |       |            |           | ✅     |           |
| pythonmaindark.png   | Main field lyrics area    |       |            |           | ✅     |           |
| pythonmaindark.png   | Now playing title/outline |       |            |           | ✅     |           |
| pythonmaindark.png   | Playback controls box     |       |            |           | ✅     |           |
| pythonmaindark.png   | Controls title/outline    |       |            |           | ✅     |           |
| pythonmaindark.png   | Control buttons           |       |            |           | ✅     |           |

- The ugly scroll bar persists between main and secondary field 1 when that secondary field is visible
- The Pause icon is still markdown ⏸️ (pausebutton.png)
- The Main "( )" and secondary checkboxes are still right aligned and don't look stripped down in dark mode anymore but render as solid blue square boxes in pythonmaindark.png
- Lyrics font, menu bar fonts and buttons are still smaller than in firefoxmainlight.png and firefoxmaindark.png
- Spinner buttons are still broken
	- Buttons are stacked horizontally (pythonspinners.png) instead of vertically (firefoxspinners.png). 
		- Specifically, I wanted the Firefox Settings Intervals type of caret icon spinner except about 2/3 that width (like a vertical rectangle with two halves; the original Firefox Settings spinners were so wide as to be almost square).
		- I also never wanted the spinners to cover text, and prefer to increase field or window width to avoid any element to cover any over element in general
	- The playback controls box still has two different types of spinner buttons (pythonspinners.png), and there should only be the one type I wanted. I want one type of spinner everywhere in the app for consistency.
- See pythonmainlight.png and pythonmaindark.png again; Overlay hotkey text like `Space` is still converted into literal brackets like [Space] and looks like plain text instead of highlighted (more obvious in dark mode). Sync file's overlay isn't showing at all.
- Control button numbers are still not updating anymore when Settings Intervals are changed