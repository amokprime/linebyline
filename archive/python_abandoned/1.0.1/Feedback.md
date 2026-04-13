### Your recommended first-run sequence
⚠️Open an audio file → verify title/artist appear, playback works: Opening new song audio file does not reset any metadata fields or now playing, not even the song title
⚠️Open an LRC file → verify lines render in hotkey mode: Highlighted text on the current line is illegible in dark mode due to poor contrast with the highlighting
⚠️ Tab → verify typing mode, paste Genius page: Genius paste only works in Typing mode
⚠️Ctrl+, → verify settings dialog opens, hotkey capture works: Hard to see Settings elements in dark mode
⚠️Ctrl+. → verify theme toggles: The theme button shows the generic orange/purple light/dark switcher icon instead of the 🌙 icon in light mode
❌Arrow keys in hotkey mode → verify navigation: Up/Down don't navigate although Q/E do
⚠️Add field, paste translation, Merge fields → Merge fields can only be undone with Ctrl+Z in Hotkey mode (the Undo GUI button isn't affected by this limitation)
### Missing elements
- System sans/System serif dropdown

### Other functional regressions
- Middle click to open no longer works in either main or secondary fields...are alternate hotkeys no longer being defined properly in general? 
- Python app always opens in windowed mode and doesn't remember last position and size
- Tab actually sends Tab in Typing mode instead of switching back to Hotkey mode
- F5 to refresh page (resetting song+lyrics) no longer works
- Scrolling over volume slider no longer adjusts it
- Clicking on another line bounces back to highlighting original line and doesn't play the other line
- X button that appears as an option next to hotkey fields no longer clear hotkeys; Backspace and Del do

### New behavior
- On startup, the first available text field is focused (the speed control number field). Instead, since apparently the Python app has the power to focus elements, make it focus the Main window area instead.
- There is now an always-on scrollbar with an ugly Windows 95 aesthetic in light mode

### Aesthetic regressions
- The Now Playing and Controls used to be white with the player controls rectangle a very light gray color, now they're inverted and the controls rectangle is white
- The Pause icon in the play/pause button is now a markdown pause icon ⏸️that clashes with the solid black geometric ones nearby
- The Main titlebar used to be white and is gray now, hard to tell it apart from the other gray elements like Controls and the Main lyrics field itself. Contrast issues are more obvious in dark mode
- The Main "( )" and secondary checkboxes are right aligned and look stripped down in dark mode
- Fonts, icons, and buttons everywhere are noticeably smaller, and menu bar fonts and buttons especially so (they used to be somewhat larger than body elements and so felt more like a menu)
- Spinner buttons are broken up and spilled out horizontally. In fact there is a redundant set of ^ v spinner buttons for main window speed and seek offset that hide the numbers. These are horizontal too. Settings just has the alternate ^ v style and it also hides buttons. I prefer the simpler caret arrow style but vertically stacked (like .html screenshot) not horizontally spilled out or definitely not covering field text, and somewhat narrower than in the .html Settings.
- Overlay hotkey text like `Space` is converted into literal brackets like [Space] and looks like plain text instead of highlighted. Sync file's overlay isn't showing at all.
- Python app has no taskbar or title icon, at least on Windows 11
- Control button numbers don't update anymore when Settings Intervals are changed