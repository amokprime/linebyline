## Assumptions
- Version is 0.34.7+ with default settings
- LibreWolf with uBlock Origin and ✅Enable ResistFingerprinting
- Not in Incognito mode
- OS is Windows 11
- The `html.security.audit.missing-integrity.missing-integrity` warning is a false positive; see [/tests/security/0_abandoned-0.34.7/Semgrep.md](https://github.com/amokprime/linebyline/tree/main/tests/security/0_abandoned-0.34.7/Semgrep.md) 
- "Can be adjusted" or "adjustable" for a number field includes both arrow buttons and selecting the number, editing to a specific value, and pressing Enter
- If unspecified, test all possible control methods (hotkey press, button click, etc.)
- Audio is listened to for playback tests to ensure the controls are actually working and not just updating the GUI
- Music files are provided in [/tests/music](https://github.com/amokprime/linebyline/tree/main/tests/music)
- To test Genius lyrics extraction, one might visit a song's webpage and `Ctrl+A` → `Ctrl+C` → `Ctrl_V` to a text file manually (to reduce repeat requests). Not provided due to legal concerns.
- ✅ means a checkbox is checked
- ❌ means a checkbox is unchecked
- 📝 means an editable Settings (non-lyrics) text field

### Security
- [ ] Opengrep is up to date
- [ ] `opengrep scan --config auto --taint-intrafile --exclude-rule html.security.audit.missing-integrity.missing-integrity` from project root folder with provided `.semgrepignore` finds nothing new
- [ ] Mozilla Observatory finds nothing new for app GitHub Page: https://developer.mozilla.org/en-US/observatory

### Elements
- [ ] Each main window button tints gray on hover
- [ ] Each main window button shows feedback on click (darker tint and downward nudge)

### Opening files
- [ ] `Ctrl+O` hotkey opens file picker
- [ ] `Middle click` hotkey opens file picker
- [ ] 📂button clicked opens file picker
- [ ] Audio and .lrc file can be added together
- [ ] Audio and .lrc file can be added separately
- [ ] Adding lyrics from file or paste can be undone
- [ ] Adding lyrics from file or paste can be redone
- [ ] Adding lyrics also appends a final trailing timestamp if none exists (set to song duration)
- [ ] Title is extracted from audio and .lrc file added together
- [ ] Title is extracted from audio filename added first and not overridden by lyrics filename
- [ ] Title is extracted from lyrics filename added first
- [ ] Title matches same case as filename (i.e. no title case → lower case)
- [ ] Title extraction updates both metadata field and Now Playing panel
- [ ] Audio is replaced when new audio file is added
- [ ] Lyrics are replaced for main field when new .lrc file is added
- [ ] Lyrics are replaced for secondary field when new .lrc file is added

### Saving files
- [ ] `Ctrl+;` hotkey opens save file picker
- [ ] 💾button clicked opens save file picker
- [ ] .lrc files are shown in the file picker
- [ ] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Alt+F4`, `Middle click` on browser tab, or clicking the top-right corner X button or tab X button or reloading with `F5` or the refresh button should open a warning and snap the cursor to Leave Page
- [ ] Lyrics file saves as the name of the metadata title in the `[ti: ]` field
- [ ] Saved lyrics contents match Typing mode window contents

### Undo and redo
- [ ] Undo (i.e. type letter "a") in main field in Typing mode
- [ ] Undo in secondary field in Typing mode
- [ ] Undo in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys
- [ ] Redo in main field in Typing mode
- [ ] Redo in secondary field in Typing mode
- [ ] Redo in secondary field in Hotkey mode and does not trigger Hotkey mode exclusive hotkeys

### Font and theme
- [ ] Both fonts (System Sans and System Serif) affect text in main and secondary fields
- [ ] Font type and size affects text in main and secondary fields
- [ ] Font size can be adjusted
- [ ] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey
- [ ] Theme is toggled light → dark with 🌙button
- [ ] Theme button icon is inverted:🌙 in light mode and ☀️in dark mode

### Help and Issues
- [ ] Preview HELP.md [URL](https://github.com/amokprime/linebyline/blob/main/HELP.md) on "?" button hover and Issues [URL](https://github.com/amokprime/linebyline/issues) on bug button hover
- [ ] Open HELP.md with "?" button click
- [ ] Open HELP.md with `Ctrl+/` hotkey
- [ ] Open Issues with bug button click
- [ ] Open Issues with `Ctrl+'` hotkey

### Settings
#### Operation
- [ ] Opens with `Ctrl+,` hotkey
- [ ] Opens with ⚙️ button
- [ ] Search field focuses when Settings window opened
- [ ] Searching for hotkeys by name (i.e. "Small") works
- [ ] Searching for hotkeys by hotkey (i.e. "Space") using ⌨️ button or `Tab` in search field works
- [ ] Searching for another hotkey by hotkey (i.e. "X") immediately refreshes results
- [ ] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [ ] Settings window closes with `Esc`
- [ ] Settings window closes when clicking outside window
- [ ] Scrolling to bottom and back to top works
- [ ] Clicking a hotkey to remap it highlights its field blue with a "..." and an X button that allows clearing the hotkey
- [ ] All hotkeys are remappable (i.e. to NumPadMinus) and Default button appears and works
- [ ] Clicking outside blue-highlighted "..." field or pressing Esc cancels remapping and does not assign Esc as a hotkey
- [ ] Each hotkey's Default button appears when cleared
- [ ] Reset defaults button works for all settings in the Settings window
- [ ] Remapping hotkeys to a restricted hotkey (i.e. to Ctrl+R) brings up warning and shows Default button
- [ ] Settings changes persist (i.e. adjust Seek increment) when reloading browser

#### Instant replay
- [ ] ✅Moving to previous line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [ ] ✅Moving to next line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [ ] ✅Resuming currently playing line: replays with configured Seek offset instead of resuming when unpausing with `Space`
- [ ] ✅Playing another line: plays with configured Seek offset instead of from start when clicking another line
- [ ] ✅Adjusting seek offset: replays with configured Seek offset instead of continuing to play
- [ ] ✅Syncing line: replays with configured Seek offset instead of continuing to play
- [ ] ✅Adjusting timestamp: replays with configured Seek offset instead of continuing to play

#### Intervals
- [ ] 📝Tiny is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Small is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Medium is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Large is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Seek increment is adjustable and changes seek interval by configured amount
- [ ] 📝Default Speed ratio is adjustable and applied to -/+ speed changes in Controls
- [ ] 📝Volume increment is adjustable and applies when scrolling over volume slider
- [ ] 📝Undo window is adjustable and buckets changes made within configured window (i.e. 1ms)
- [ ] Selecting any single value in a field, pressing Backspace, and pressing Enter reverts to last value and does not show a blank field

#### Default metadata tags
- [ ] Changes apply to metadata fields when reloading or restarting browser

#### Playback
- [ ] Play/pause with `Space` in Hotkey mode and `Ctrl+Space` in any mode
- [ ] Reduce speed with `Ctrl+1`
- [ ] Increase speed with `Ctrl+2`
- [ ] Reset speed with `Ctrl+3`
- [ ] Seek back with `ArrowLeft` in Hotkey mode
- [ ] Seek back with `Ctrl+A` in any mode
- [ ] Seek forward with `ArrowRight` in Hotkey mode
- [ ] Seek forward with `Ctrl+D`in any mode

#### Sync
- [ ] Toggle offset mode with `` ` ``
- [ ] Sync file with ``Ctrl+` ``
- [ ] Sync line start with `W` in Hotkey mode
- [ ] Sync line end with `T` in Hotkey mode
- [ ] Navigate to previous line with `Q` in Hotkey mode
- [ ] Navigate to previous line with `ArrowUp` in any mode
- [ ] Navigate to next line with `E` in Hotkey mode
- [ ] Navigate to next line with `ArrowDown` in any mode
- [ ] Navigation skips lines with no lyrics text
- [ ] Replay only with `R` in Hotkey mode
- [ ] Replay end with `Shift+R` in Hotkey mode

#### Adjustments
- [ ] Back tiny amount with `Z` in Hotkey mode
- [ ] Forward tiny amount with `V` in Hotkey mode
- [ ] Back small amount with `A` in Hotkey mode
- [ ] Forward small amount with `F` in Hotkey mode
- [ ] Back medium amount with `S` in Hotkey mode
- [ ] Forward medium amount with `D` in Hotkey mode
- [ ] Back large amount with `X` in Hotkey mode
- [ ] Forward large amount with `C` in Hotkey mode

#### Text
- [ ] Toggle mode with `Tab`
- [ ] Add field with `Ctrl+4`
- [ ] Hide field with `Ctrl+5
- [ ] Merge fields with `Ctrl+6
- [ ] Mark line as translation with `Ctrl+ArrowLeft` and works in both Typing and Hotkey modes
- [ ] Mark line as translation can be undone and redone

### Main field
- [ ] Timestamps but not metadata fields are visible in Hotkey mode
- [ ] Newlines between stanzas are visible in Hotkey mode
- [ ] Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode
- [ ] Lyrics can be pasted in either Hotkey or Typing mode when the field is focused and extract lyrics and metadata from Genius correctly
- [ ] `(` and `[` autocomplete the second half like `()` and `[]` in Typing mode
- [ ] `(` typed at the beginning of a line autocompletes a `)` at the end of that line
- [ ] `(` typed while lines are selected wraps them in `( )` instead of replacing them
- [ ] "( )" checkbox wraps lines marked as translations with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode

### Now playing
- [ ] Unknown Artist updates when `[ar: ]` metadata is added from Genius extraction in either Hotkey or Typing mode, or manually typed or pasted in Typing mode
- [ ] Song seeks by any amount when seek slider is dragged with mouse and live updates time
- [ ] Song seeks by configured seek interval when `Ctrl+A` or `Ctrl+D` are used
- [ ] Seek offset field is adjustable and offsets seek when `R` or `Shift+R` are pressed
- [ ] Sync file button batch adjusts timestamps when clicked in Offset seek mode
- [ ] Speed control is adjustable
- [ ] Volume button toggles mute
- [ ] Hardcoded `Ctrl+M` hotkey toggles mute

### Controls
- [ ] Offset time button toggles to Offset seek and back
- [ ] Hotkey mode button toggles to Typing mode and back
- [ ] Play/pause button works in any mode
- [ ] Previous line button works in Hotkey mode
- [ ] Replay only button works in Hotkey mode
- [ ] Sync line button works in Hotkey mode
- [ ] Next line button works in Hotkey mode
- [ ] End line button syncs a trailing timestamp in Hotkey mode
- [ ] +100ms time button works in Offset time mode
- [ ] +200ms time button works in Offset time mode
- [ ] +400ms time button works in Offset time mode
- [ ] +1000ms time button works in Offset time mode
- [ ] -100ms time button works in Offset time mode
- [ ] -200ms time button works in Offset time mode
- [ ] -400ms time button works in Offset time mode
- [ ] -1000ms time button works in Offset time mode
- [ ] +100ms seek button works in Offset seek mode
- [ ] +200ms seek button works in Offset seek mode
- [ ] +400ms seek button works in Offset seek mode
- [ ] +1000ms seek button works in Offset seek mode
- [ ] -100ms seek button works in Offset seek mode
- [ ] -200ms seek button works in Offset seek mode
- [ ] -400ms seek button works in Offset seek mode
- [ ] -1000ms seek button works in Offset seek mode

### Secondary fields
- [ ] Add field with clicking button
- [ ] Hide field with clicking button
- [ ] Merge fields with clicking button
- [ ] .lrc file picker opens with the 📂button or `Middle click` while cursor is hovered over secondary field
- [ ] Lyrics paste extract Genius metadata and lyrics
- [ ] Warning appears when main and secondary fields have different amounts of lyrics
- [ ] Newlines and the final end timestamp are not counted as lyric lines
- [ ] Merge fields button is grayed out when lyric lines don't match
- [ ] Merge fields button is grayed out when the main field lacks any timestamps
- [ ] Merge fields button is grayed out when the main field lacks a final end timestamp
- [ ] Unsaved work warning is not bypassed by skipping merge fields and reloading page
- [ ] Merge fields button is grayed out on app startup if skipped
- [ ] Merging fields produces expected timestamp pattern in repo README
- [ ] Merging fields can be undone and redone