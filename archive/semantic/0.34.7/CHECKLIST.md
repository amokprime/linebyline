## Assumptions
- Version is 0.34.7 with default settings
- LibreWolf with uBlock Origin and ✅Enable ResistFingerprinting
- Not in Incognito mode
- OS is Windows 11
- "Can be adjusted" or "adjustable" for a number field includes both arrow buttons and selecting the number, editing to a specific value, and pressing Enter
- If unspecified, test all possible control methods (hotkey press, button click, etc.)
- Audio is listened to for playback tests to ensure the controls are actually working and not just updating the GUI
- Music files are provided in [/tests/music](https://github.com/amokprime/linebyline/tree/main/tests/music)
- To test Genius lyrics extraction, one might visit a song's webpage and `Ctrl+A` → `Ctrl+C` → `Ctrl_V` to a text file manually (to reduce repeat requests). Not provided due to legal concerns.
- ✅ means a checkbox is checked
- ❌ means a checkbox is unchecked
- 📝 means an editable Settings (non-lyrics) text field

### Elements
- [x] Each main window button tints gray on hover
- [x] Each main window button shows feedback on click (darker tint and downward nudge)

### Opening files
- [x] `Ctrl+O` hotkey opens file picker
- [x] `Middle click` hotkey opens file picker
- [x] 📂button clicked opens file picker
- [x] Audio and .lrc file can be added together
- [x] Audio and .lrc file can be added separately
- [x] Adding lyrics from file or paste can be undone
- [x] Adding lyrics from file or paste can be redone
- [x] Adding lyrics also appends a final trailing timestamp if none exists (set to song duration)
- [x] Title is extracted from audio and .lrc file added together
- [x] Title is extracted from audio filename added first and not overridden by lyrics filename
- [x] Title is extracted from lyrics filename added first
- [x] Title matches same case as filename (i.e. no title case → lower case)
- [x] Title extraction updates both metadata field and Now Playing panel
- [x] Audio is replaced when new audio file is added
- [x] Lyrics are replaced for main field when new .lrc file is added
- [x] Lyrics are replaced for secondary field when new .lrc file is added

### Saving files
- [x] `Ctrl+;` hotkey opens save file picker
- [x] 💾button clicked opens save file picker
- [x] .lrc files are shown in the file picker
- [x] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Alt+F4`, `Middle click` on browser tab, or clicking the top-right corner X button or tab X button or reloading with `F5` or the refresh button should open a warning and snap the cursor to Leave Page
- [x] Lyrics file saves as the name of the metadata title in the `[ti: ]` field
- [x] Saved lyrics contents match Typing mode window contents

### Undo and redo
- [x] Undo (i.e. type letter "a") in main field in Typing mode
- [x] Undo in secondary field in Typing mode
- [x] Undo in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys
- [x] Redo in main field in Typing mode
- [x] Redo in secondary field in Typing mode
- [x] Redo in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys

### Font and theme
- [x] Both fonts (System Sans and System Serif) affect text in main and secondary fields
- [x] Font type and size affects text in main and secondary fields
- [x] Font size can be adjusted
- [x] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey
- [x] Theme is toggled light → dark with 🌙button
- [x] Theme button icon is inverted:🌙 in light mode and ☀️in dark mode

### Help and Issues
- [x] Preview HELP.md [URL](https://github.com/amokprime/linebyline/blob/main/HELP.md) on "?" button hover and Issues [URL](https://github.com/amokprime/linebyline/issues) on bug button hover
- [x] Open HELP.md with "?" button click
- [x] Open HELP.md with `Ctrl+/` hotkey
- [x] Open Issues with bug button click
- [x] Open Issues with `Ctrl+'` hotkey

### Settings
#### Operation
- [x] Opens with `Ctrl+,` hotkey
- [x] Opens with ⚙️ button
- [x] Search field focuses when Settings window opened
- [x] Searching for hotkeys by name (i.e. "Small") works
- [x] Searching for hotkeys by hotkey (i.e. "Space") using ⌨️ button or `Tab` in search field works
- [x] Searching for another hotkey by hotkey (i.e. "X") immediately refreshes results
- [x] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [x] Settings window closes with `Esc`
- [x] Settings window closes when clicking outside window
- [x] Scrolling to bottom and back to top works
- [x] Clicking a hotkey to remap it highlights its field blue with a "..." and an X button that allows clearing the hotkey
- [x] All hotkeys are remappable (i.e. to NumPadMinus) and Default button appears and works
- [x] Clicking outside blue-highlighted "..." field or pressing Esc cancels remapping and does not assign Esc as a hotkey
- [x] Each hotkey's Default button appears when cleared
- [x] Reset defaults button works for all settings in the Settings window
- [x] Remapping hotkeys to a restricted hotkey (i.e. to Ctrl+R) brings up warning and shows Default button
- [x] Settings changes persist (i.e. adjust Seek increment) when reloading browser

#### Instant replay
- [x] ✅Moving to previous line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [x] ✅Moving to next line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [x] ✅Resuming currently playing line: replays with configured Seek offset instead of resuming when unpausing with `Space`
- [x] ✅Playing another line: plays with configured Seek offset instead of from start when clicking another line
- [x] ✅Adjusting seek offset: replays with configured Seek offset instead of continuing to play
- [x] ✅Syncing line: replays with configured Seek offset instead of continuing to play
- [x] ✅Adjusting timestamp: replays with configured Seek offset instead of continuing to play

#### Intervals
- [x] 📝Tiny is adjustable, updates in Controls, and changes timestamp by configured amount
- [x] 📝Small is adjustable, updates in Controls, and changes timestamp by configured amount
- [x] 📝Medium is adjustable, updates in Controls, and changes timestamp by configured amount
- [x] 📝Large is adjustable, updates in Controls, and changes timestamp by configured amount
- [x] 📝Seek increment is adjustable and changes seek interval by configured amount
- [x] 📝Default Speed ratio is adjustable and applied to -/+ speed changes in Controls
- [x] 📝Volume increment is adjustable and applies when scrolling over volume slider
- [x] 📝Undo window is adjustable and buckets changes made within configured window (i.e. 1ms)
- [ ] Selecting any single value in a field, pressing Backspace, and pressing Enter reverts to last value and does not show a blank field

#### Default metadata tags
- [x] Changes apply to metadata fields when reloading or restarting browser

#### Playback
- [x] Play/pause with `Space` in Hotkey mode and `Ctrl+Space` in any mode
- [x] Reduce speed with `Ctrl+1`
- [x] Increase speed with `Ctrl+2`
- [x] Reset speed with `Ctrl+3`
- [x] Seek back with `ArrowLeft` in Hotkey mode
- [x] Seek back with `Ctrl+A` in any mode
- [x] Seek forward with `ArrowRight` in Hotkey mode
- [x] Seek forward with `Ctrl+D`in any mode

#### Sync
- [x] Toggle offset mode with `` ` ``
- [x] Sync file with ``Ctrl+` ``
- [x] Sync line start with `W` in Hotkey mode
- [x] Sync line end with `T` in Hotkey mode
- [x] Navigate to previous line with `Q` in Hotkey mode
- [x] Navigate to previous line with `ArrowUp` in any mode
- [x] Navigate to next line with `E` in Hotkey mode
- [x] Navigate to next line with `ArrowDown` in any mode
- [x] Navigation skips lines with no lyrics text
- [x] Replay only with `R` in Hotkey mode
- [x] Replay end with `Shift+R` in Hotkey mode

#### Adjustments
- [x] Back tiny amount with `Z` in Hotkey mode
- [x] Forward tiny amount with `V` in Hotkey mode
- [x] Back small amount with `A` in Hotkey mode
- [x] Forward small amount with `F` in Hotkey mode
- [x] Back medium amount with `S` in Hotkey mode
- [x] Forward medium amount with `D` in Hotkey mode
- [x] Back large amount with `X` in Hotkey mode
- [x] Forward large amount with `C` in Hotkey mode

#### Text
- [x] Toggle mode with `Tab`
- [x] Add field with `Ctrl+4`
- [x] Hide field with `Ctrl+5
- [x] Merge fields with `Ctrl+6
- [x] Mark line as translation with `Ctrl+ArrowLeft` and works in both Typing and Hotkey modes
- [x] Mark line as translation can be undone and redone

### Main field
- [x] Timestamps but not metadata fields are visible in Hotkey mode
- [x] Newlines between stanzas are visible in Hotkey mode
- [x] Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode
- [x] Lyrics can be pasted in either Hotkey or Typing mode when the field is focused and extract lyrics and metadata from Genius correctly
- [x] `(` and `[` autocomplete the second half like `()` and `[]` in Typing mode
- [x] `(` typed at the beginning of a line autocompletes a `)` at the end of that line
- [x] `(` typed while lines are selected wraps them in `( )` instead of replacing them
- [x] "( )" checkbox wraps lines marked as translations with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode

### Now playing
- [x] Unknown Artist updates when `[ar: ]` metadata is added from Genius extraction in either Hotkey or Typing mode, or manually typed or pasted in Typing mode
- [x] Song seeks by any amount when seek slider is dragged with mouse and live updates time
- [x] Song seeks by configured seek interval when `Ctrl+A` or `Ctrl+D` are used
- [x] Seek offset field is adjustable and offsets seek when `R` or `Shift+R` are pressed
- [x] Sync file button batch adjusts timestamps when clicked in Offset seek mode
- [x] Speed control is adjustable
- [x] Volume button toggles mute
- [x] Hardcoded `Ctrl+M` hotkey toggles mute

### Controls
- [x] Offset time button toggles to Offset seek and back
- [x] Hotkey mode button toggles to Typing mode and back
- [x] Play/pause button works in any mode
- [x] Previous line button works in Hotkey mode
- [x] Replay only button works in Hotkey mode
- [x] Sync line button works in Hotkey mode
- [x] Next line button works in Hotkey mode
- [x] End line button syncs a trailing timestamp in Hotkey mode
- [x] +100ms time button works in Offset time mode
- [x] +200ms time button works in Offset time mode
- [x] +400ms time button works in Offset time mode
- [x] +1000ms time button works in Offset time mode
- [x] -100ms time button works in Offset time mode
- [x] -200ms time button works in Offset time mode
- [x] -400ms time button works in Offset time mode
- [x] -1000ms time button works in Offset time mode
- [x] +100ms seek button works in Offset seek mode
- [x] +200ms seek button works in Offset seek mode
- [x] +400ms seek button works in Offset seek mode
- [x] +1000ms seek button works in Offset seek mode
- [x] -100ms seek button works in Offset seek mode
- [x] -200ms seek button works in Offset seek mode
- [x] -400ms seek button works in Offset seek mode
- [x] -1000ms seek button works in Offset seek mode

### Secondary fields
- [x] Add field with clicking button
- [x] Hide field with clicking button
- [x] Merge fields with clicking button
- [x] .lrc file picker opens with the 📂button or `Middle click` while cursor is hovered over secondary field
- [x] Lyrics paste extract Genius metadata and lyrics
- [x] Warning appears when main and secondary fields have different amounts of lyrics
- [x] Newlines and the final end timestamp are not counted as lyric lines
- [x] Merge fields button is grayed out when lyric lines don't match
- [ ] Merge fields button is grayed out when the main field lacks any timestamps
- [ ] Merge fields button is grayed out when the main field lacks a final end timestamp
- [x] Unsaved work warning is not bypassed by skipping merge fields and reloading page
- [x] Merge fields button is grayed out on app startup if skipped
- [x] Merging fields produces expected timestamp pattern in repo README
- [x] Merging fields can be undone and redone