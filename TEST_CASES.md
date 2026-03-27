### Assumptions
- Default settings
- LibreWolf or Firefox with uBlock Origin and ✅Enable ResistFingerprinting
- Not in Incognito mode
- "Can be adjusted" or "adjustable" for a number field includes both arrow buttons and selecting the number, editing to a specific value, and pressing Enter
- ✅ means a checkbox is checked
- ❌ means a checkbox is unchecked
- 📝 means an editable Settings (non-lyrics) text field

#### Opening files
- [ ] `Ctrl+O` hotkey opens file picker
- [ ] `Middle click` hotkey opens file picker
- [ ] 📂button clicked opens file picker
- [ ] Audio and .lrc file can be added together
- [ ] Title is extracted from audio and .lrc file added together
- [ ] Title is extracted from audio filename added first and not overridden by lyrics filename
- [ ] Title is extracted from lyrics filename added first
- [ ] Title extraction updates both metadata field and Now Playing panel
- [ ] Audio is reset when new audio file is added
- [ ] Lyrics are reset for main field when new .lrc file is added
- [ ] Lyrics are reset for secondary field when new .lrc file is added

#### Saving files
- [ ] `Ctrl+,` hotkey opens save file picker
- [ ] 💾button clicked opens save file picker
- [ ] .lrc files are shown in the file picker
- [ ] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Middle click`, or clicking the top-right corner X button or reloading with `F5` or the refresh button should open a warning and snap the cursor to Leave Page

#### Undo
- [ ] Works in main field in Typing mode
- [ ] Works in secondary field in Typing mode
- [ ] Works in secondary field in Hotkey mode

#### Redo
- [ ] Works in main field in Typing mode
- [ ] Works in secondary field in Typing mode
- [ ] Works in secondary field in Hotkey mode

#### Font
- [ ] Contains known fonts System Sans and System Serif
- [ ] Font type and size affects text in main and secondary fields
- [ ] Font size can be adjusted

#### Theme
- [ ] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey
- [ ] Theme is toggled light → dark with 🌙button
- [ ] Button icon is inverted:🌙 in light mode and ☀️in dark mode

#### Help
- [ ] Opens with `Ctrl+/` hotkey
- [ ] Opens with "?" button
- [ ] Closes with `Esc`
- [ ] Closes when clicking outside window
- [ ] Appears under Settings if opened first and over if opened second
- [ ] Scrolling to bottom and back to top works
- [ ] Contents match [HELP.md](https://github.com/honeypotfields/linebyline/blob/main/HELP.md)

#### Settings
##### Operation
- [ ] Opens with `Ctrl+,` hotkey
- [ ] Opens with ⚙️ button
- [ ] Searching for hotkeys by name (focus search field with `Tab`) works
- [ ] Searching for hotkeys by hotkey using ⌨️ button or `Tab` in search field works
- [ ] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [ ] Settings window closes with `Esc`
- [ ] Settings window closes when clicking outside window
- [ ] Scrolling to bottom and back to top works
- [ ] All hotkeys are remappable
- [ ] Clicking a hotkey to remap it highlights its field blue with a "..." and an X button that allows clearing the hotkey
- [ ] Clicking outside blue-highlighted "..." field or pressing Esc cancels remapping
- [ ] Each hotkey's Default button appears when remapped or cleared
- [ ] Reset defaults button works for all settings in the Settings window
- [ ] Remapping hotkeys to restricted hotkey brings up warning
- [ ] All Settings persist when reloading or restarting browser

##### Auto strip
- [ ] ✅Metadata and On .lrc file import: replaces metadata with defaults when importing lyrics
- [ ] ✅Metadata and On lyrics paste: replaces metadata with defaults when pasting lyrics
- [ ] ❌Metadata: only falls back to defaults when missing
- [ ] ✅Sections and On .lrc file import: removes Genius stanza sections when importing lyrics
- [ ] ✅Sections and On lyrics paste: removes Genius stanza sections when pasting lyrics
- [ ] ❌Sections: does not remove Genius stanza sections

##### Instant replay
- [ ] ✅Moving to previous line: plays with configured Seek offset instead of navigating when using `Q`, `E`, `Up`, and `Down` keys
- [ ] ✅Moving to next line: plays with configured Seek offset instead of navigating when using `Q`, `E`, `Up`, and `Down` keys
- [ ] ✅Resuming currently playing line: replays with configured Seek offset instead of resuming when unpausing with `Space`
- [ ] ✅Playing another line: plays with configured Seek offset instead of from start when clicking another line
- [ ] ✅Adjusting seek offset: replays with configured Seek offset instead of continuing to play
- [ ] ✅Syncing line: replays with configured Seek offset instead of continuing to play
- [ ] ✅Adjusting timestamp: replays with configured Seek offset instead of continuing to play

##### Intervals
- [ ] 📝Tiny is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Small is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Medium is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Large is adjustable, updates in Controls, and changes timestamp by configured amount
- [ ] 📝Seek increment is adjustable and changes seek interval by configured amount
- [ ] 📝Default Speed ratio is adjustable and applied to -/+ speed changes in Controls
- [ ] 📝Volume increment is adjustable and applies when scrolling over volume slider
- [ ] 📝Undo window is adjustable and buckets changes made within configured window

##### Default metadata tags
- [ ] Changes apply to metadata fields when reloading or restarting browser

##### Playback
- [ ] Play/pause is triggered by `Space` in Hotkey mode
- [ ] Reduce speed is triggered by `Ctrl+1`
- [ ] Increase speed is triggered by `Ctrl+2`
- [ ] Reset speed is triggered by `Ctrl+3`
- [ ] Seek back is triggered by `Ctrl+A`
- [ ] Seek forward is triggered by `Ctrl+D`

##### Sync
- [ ] Toggle offset mode is triggered by `` ` ``
- [ ] Sync file is triggered by ``Ctrl+` ``
- [ ] Sync line start is triggered by `W` in Hotkey mode
- [ ] Sync line end is triggered by `T` in Hotkey mode
- [ ] Previous line is triggered by `Q` in Hotkey mode
- [ ] Next line is triggered by `E` in Hotkey mode
- [ ] Replay only is triggered by `R` in Hotkey mode

##### Adjustments
- [ ] Back tiny amount is triggered by `Z` in Hotkey mode
- [ ] Forward tiny amount is triggered by `V` in Hotkey mode
- [ ] Back small amount is triggered by `A` in Hotkey mode
- [ ] Forward small amount is triggered by `F` in Hotkey mode
- [ ] Back medium amount is triggered by `S` in Hotkey mode
- [ ] Forward medium amount is triggered by `D` in Hotkey mode
- [ ] Back large amount is triggered by `X` in Hotkey mode
- [ ] Forward large amount is triggered by `C` in Hotkey mode

##### Text
- [ ] Toggle mode is triggered by `Tab`
- [ ] Add field is triggered by `Ctrl+4`
- [ ] Hide field is triggered by `Ctrl+5
- [ ] Merge fields is triggered by `Ctrl+6

#### Main field
- [ ] Timestamps but not metadata fields are visible in Hotkey mode
- [ ] Newlines between stanzas are visible in Hotkey mode
- [ ] Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode
- [ ] Lyrics can be pasted in either Hotkey or Typing mode when the field is focused and extract lyrics and metadata from Genius correctly
- [ ] `(` and `[` autocomplete the second half like `()` and `[]` in Typing mode

#### Now playing
- [ ] Unknown Artist updates when `[ar: ]` metadata is added from Genius extraction in either Hotkey or Typing mode, or manually typed or pasted in Typing mode
- [ ] Song seeks by any amount when seek slider is dragged with mouse and live updates time
- [ ] Song seeks by configured seek interval when `Ctrl+A` or `Ctrl+D` are used
- [ ] Seek offset field is adjustable and offsets seek when `R` is pressed
- [ ] Sync file button batch adjusts timestamps when clicked in Offset seek mode
- [ ] Speed control is adjustable and reset button works when clicked
- [ ] Volume button toggles mute

#### Controls
- [ ] Offset time button toggles to Offset seek and back
- [ ] Hotkey mode button toggles to Offset seek and back
- [ ] Play/pause button works in Hotkey mode
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

#### Secondary fields
- [ ] Add field is triggered by clicking button
- [ ] Hide field is triggered by clicking button
- [ ] Merge fields is triggered by clicking button
- [ ] .lrc file picker opens with the 📂button or `Middle click` while cursor is hovered over secondary field
- [ ] Lyrics paste extract Genius metadata and lyrics
- [ ] Auto strip settings are followed
- [ ] Warning appears when main and secondary fields have different amounts of lyrics
- [ ] Newlines and the final end timestamp are not counted as lyric lines
- [ ] Merge fields button is grayed out when lyric lines don't match or the main field lacks timestamps or a final end timestamp
- [ ] Merging fields produces expected timestamp pattern in repo README
- [ ] Merging fields can be undone and redone