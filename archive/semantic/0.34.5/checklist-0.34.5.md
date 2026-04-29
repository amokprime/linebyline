## Assumptions
- Version is 0.34.4 with default settings
- LibreWolf with uBlock Origin and ✅Enable ResistFingerprinting
- Not in Incognito mode
- OS is Windows 11
- "Can be adjusted" or "adjustable" for a number field includes both arrow buttons and selecting the number, editing to a specific value, and pressing Enter
- Audio is listened to for playback tests to ensure the controls are actually working and not just updating the GUI
- ✅ means a checkbox is checked
- ❌ means a checkbox is unchecked
- 📝 means an editable Settings (non-lyrics) text field

### Opening files
- [x] `Ctrl+O` hotkey opens file picker
- [x] `Middle click` hotkey opens file picker
- [x] 📂button clicked opens file picker
- [x] Audio and .lrc file can be added together
- [x] Audio and .lrc file can be added separately
- [x] Title is extracted from audio and .lrc file added together
- [x] Title is extracted from audio filename added first and not overridden by lyrics filename
- [ ] Title is extracted from lyrics filename added first
- [x] Title extraction updates both metadata field and Now Playing panel
- [x] Audio is replaced when new audio file is added
- [x] Lyrics are replaced for main field when new .lrc file is added
- [x] Lyrics are replaced for secondary field when new .lrc file is added

### Saving files
- [x] `Ctrl+;` hotkey opens save file picker
- [x] 💾button clicked opens save file picker
- [x] .lrc files are shown in the file picker
- [x] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Middle click`, or clicking the top-right corner X button or reloading with `F5` or the refresh button should open a warning and snap the cursor to Leave Page
- [x] Lyrics file saves as the name of the metadata title in the `[ti: ]` field
- [x] Saved lyrics contents match Typing mode window contents

### Undo
- [x] Works in main field in Typing mode
- [x] Works in secondary field in Typing mode
- [x] Works in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys

### Redo
- [x] Works in main field in Typing mode
- [x] Works in secondary field in Typing mode
- [x] Works in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys

### Font
- [x] Both fonts (System Sans and System Serif) affect text in main and secondary fields
- [x] Font size can be adjusted
- [x] Font type and size affects text in main and secondary fields

### Theme
- [x] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey
- [x] Theme is toggled light → dark with 🌙button
- [x] Button icon is inverted:🌙 in light mode and ☀️in dark mode

### Help
- [x] Opens with `Ctrl+/` hotkey
- [x] Opens with "?" button
- [x] Closes with `Esc`
- [x] Closes when clicking outside window
- [x] Appears under Settings if opened first and over if opened second
- [x] Scrolling to bottom and back to top works
- [x] Contents match [HELP.md](https://github.com/amokprime/linebyline/blob/main/HELP.md)

### Settings
#### Operation
- [x] Opens with `Ctrl+,` hotkey
- [x] Opens with ⚙️ button
- [x] Searching for hotkeys by name (focus search field with `Tab`) works
- [x] Searching for hotkeys by hotkey using ⌨️ button or `Tab` in search field works
- [x] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [x] Settings window closes with `Esc`
- [x] Settings window closes when clicking outside window
- [x] Scrolling to bottom and back to top works
- [x] Clicking a hotkey to remap it highlights its field blue with a "..." and an X button that allows clearing the hotkey
- [x] All hotkeys are remappable (i.e. to NumPadMinus) and Default button appears
- [x] Clicking outside blue-highlighted "..." field or pressing Esc cancels remapping and does not assign Esc as a hotkey
- [x] Each hotkey's Default button appears when remapped or cleared
- [x] Reset defaults button works for all settings in the Settings window
- [x] Remapping hotkeys to restricted hotkey (i.e. to Ctrl+R) brings up warning and shows Default button
- [x] Settings changes persist (i.e. adjust Seek increment) when reloading browser

#### Auto strip
- [ ] ✅Metadata and On .lrc file import: replaces metadata with defaults when importing lyrics
- [ ] ✅Metadata and On lyrics paste: replaces metadata with defaults when pasting lyrics
- [x] ❌Metadata: only falls back to defaults when missing
- [ ] ✅Sections and On .lrc file import: removes Genius stanza sections when importing lyrics
- [x] ✅Sections and On lyrics paste: removes Genius stanza sections when pasting lyrics
- [ ] ❌Sections: does not remove Genius stanza sections

#### Instant replay
- [x] ✅Moving to previous line: plays with configured Seek offset instead of navigating when using `Q` and `E` keys
- [x] ✅Moving to next line: plays with configured Seek offset instead of navigating when using `Q` and `E` keys
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
- [x] Selecting any single value in a field, pressing Backspace, and pressing Enter reverts to last value and does not show a blank field

#### Default metadata tags
- [x] Changes apply to metadata fields when reloading or restarting browser

#### Playback
- [x] Play/pause is triggered by `Space` in Hotkey mode and `Ctrl+Space` in any mode
- [x] Reduce speed is triggered by `Ctrl+1`
- [x] Increase speed is triggered by `Ctrl+2`
- [x] Reset speed is triggered by `Ctrl+3`
- [x] Seek back is triggered by `Ctrl+A`
- [x] Seek forward is triggered by `Ctrl+D`

#### Sync
- [x] Toggle offset mode is triggered by `` ` ``
- [x] Sync file is triggered by ``Ctrl+` ``
- [x] Sync line start is triggered by `W` in Hotkey mode
- [x] Sync line end is triggered by `T` in Hotkey mode
- [x] Previous line is triggered by `Q` in Hotkey mode
- [x] Next line is triggered by `E` in Hotkey mode
- [x] Replay only is triggered by `R` in Hotkey mode
- [x] Replay end is triggered by `Shift+R` in Hotkey mode

#### Adjustments
- [x] Back tiny amount is triggered by `Z` in Hotkey mode
- [x] Forward tiny amount is triggered by `V` in Hotkey mode
- [x] Back small amount is triggered by `A` in Hotkey mode
- [x] Forward small amount is triggered by `F` in Hotkey mode
- [x] Back medium amount is triggered by `S` in Hotkey mode
- [x] Forward medium amount is triggered by `D` in Hotkey mode
- [x] Back large amount is triggered by `X` in Hotkey mode
- [x] Forward large amount is triggered by `C` in Hotkey mode

#### Text
- [x] Toggle mode is triggered by `Tab`
- [x] Add field is triggered by `Ctrl+4`
- [x] Hide field is triggered by `Ctrl+5
- [x] Merge fields is triggered by `Ctrl+6
- [x] Mark line as translation is triggered by `Ctrl+ArrowLeft` and works in both Typing and Hotkey modes

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
- [x] Play/pause button works in Hotkey mode
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
- [x] Add field is triggered by clicking button
- [x] Hide field is triggered by clicking button
- [x] Merge fields is triggered by clicking button
- [x] .lrc file picker opens with the 📂button or `Middle click` while cursor is hovered over secondary field
- [x] Lyrics paste extract Genius metadata and lyrics
- [ ] Auto strip settings are followed
- [x] Warning appears when main and secondary fields have different amounts of lyrics
- [x] Newlines and the final end timestamp are not counted as lyric lines
- [x] Merge fields button is grayed out when lyric lines don't match or the main field lacks timestamps or a final end timestamp
- [x] Merging fields produces expected timestamp pattern in repo README
- [x] Merging fields can be undone and redone
