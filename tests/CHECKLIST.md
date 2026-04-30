## Assumptions
- LineByLine version being tested is 0.35.13+ with default settings on Windows 11
- Browser is LibreWolf with: uBlock Origin + Enable ResistFingerprinting, not in Incognito mode
- The webpage is focused (click in an empty area near) when testing hotkeys
- `- [ ]` are checked with Obsidian or an 'x' in a text editor
- CodeQL GitHub Action found nothing concerning in pull requests or draft pull requests
- Each check is only complete if all of its conditions pass
- Audio is listened to for playback tests
- Music files are available in [/tests/music](https://github.com/amokprime/linebyline/tree/main/tests/music) and the files in a referenced folder are used for tests. All timestamps are in milliseconds to passively test import/paste truncation.
- To test Genius lyrics extraction, one might visit a song's webpage and `Ctrl+A` → `Ctrl+C` → `Ctrl+V` in a text file for future local tests. And not share it in case of legal issues.
- "Navigation" refers to moving focus or selection of buttons or lyric lines with `Tab`, `Shift+Tab`, arrow keys, or `Q`/`E`

## Main window first pass
- [ ] Each main window button tints or displays pointer cursor on hover
- [ ] Preview HELP.md [URL](https://github.com/amokprime/linebyline/blob/main/HELP.md) on "?" button hover and Issues [URL](https://github.com/amokprime/linebyline/issues) on bug button hover
- [ ] Open HELP.md with `Ctrl+/` hotkey and "?" button
- [ ] Open Issues with `Ctrl+[` hotkey and bug button click
- [ ] Each main window button shows feedback on click (darker tint and downward nudge)
- [ ] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey and button
	- [ ] Default theme is light with 🌙 button
	- [ ] Theme button icon is ☀️in dark mode
- [ ] Active modes are Offset time and Hotkey mode (blue buttons)
- [ ] Every visible element other than Controls buttons can be focused with `Tab`/`Shift+Tab`
	- [ ] Font can be changed with arrow keys

## Main window second pass

#### Adding and pasting lyrics: folder 1
- [ ] `Ctrl+;`/`Middle click` hotkeys and 📂button open file picker
- [ ] Title is extracted from audio and .lrc file added together and updates Unknown Artist in Now playing box and metadata field
- [ ] Reloading the page with content loaded brings up a warning and snaps cursor to dialog box
- [ ] Title is extracted from audio filename added first and adding lyrics file updates Unknown Artist
- [ ] Title is extracted from lyrics filename added first and adding audio file updates song duration
- [ ] Title matches same case as filename (i.e. no title case → lower case)
- [ ] Adding lyrics from file can be undone and redone
- [ ] Timestamps but not metadata fields are visible in Hotkey mode
- [ ] Newlines between stanzas are visible in Hotkey mode
- [ ] Non-navigation hotkeys and buttons don't spam when held

#### Playback: folder 1
- [ ] Play/pause with `Space` and button in Hotkey mode
- [ ] Seek back with `ArrowLeft` and button in Hotkey mode
- [ ] Seek forward with `ArrowRight` and button in Hotkey mode
- [ ] Reduce speed with `Ctrl+1` and button in Hotkey mode
- [ ] Increase speed with `Ctrl+2` and button in Hotkey mode
- [ ] Reset speed with `Ctrl+3` in Hotkey mode
- [ ] Song seeks by any amount when seek slider is dragged with mouse and live updates time; scroll seeks by 5s instead
- [ ] `Ctrl+M` hotkey and volume button toggles mute and snaps slider to 0 when muted and 100 when unmuted
- [ ] Volume slider seeks by 10% when scrolled or dragged

#### Syncing lyrics: folder 2
- [ ] Lyrics and audio are replaced for main field when new files are added from folder 2
- [ ] Sync line start with `W` and button in Hotkey mode
- [ ] Syncing lyrics also appends a final trailing timestamp if none exists (set to song duration if there is an audio file)
- [ ] Sync line end with `T` and button in Hotkey mode
- [ ] Navigate to previous line with `Q` and button in Hotkey mode
- [ ] Navigate to next line with `E` and button in Hotkey mode
- [ ] Navigation skips lines with no lyrics text in Hotkey mode
- [ ] Replay only with `R` and button in Hotkey mode
- [ ] Replay is offset by -600ms Seek offset field
- [ ] Replay end with `Shift+R` in Hotkey mode

#### Adjustments: folder 2
- [ ] Timestamp `[-00:00.10]` with `Z` and button in Hotkey mode
- [ ] Timestamp `[+00:00.10]` with `V`  and button in Hotkey mode
- [ ] Timestamp `[-00:00.20]` with `A`  and button in Hotkey mode
- [ ] Timestamp `[+00:00.20]` with `F`  and button in Hotkey mode
- [ ] Timestamp `[-00:00.40]` with `S`  and button in Hotkey mode
- [ ] Timestamp `[+00:00.40]` with `D`  and button in Hotkey mode
- [ ] Timestamp `[-00:01.00]` with `X`  and button in Hotkey mode
- [ ] Timestamp `[+00:01.00]` with `C`  and button in Hotkey mode
- [ ] Toggle offset mode with `Shift+~` and button
- [ ] Adjustments in Offset mode change -600ms Seek offset instead of timestamps
- [ ] Sync file with `Ctrl+I` and button; can also be undone and redone

#### Typing mode main field: Genius text file, folder 2
- [ ] Toggle Hotkey/Typing mode with `` ` `` and button
- [ ] Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode
- [ ] Lyrics can be pasted in both Hotkey and Typing mode when the field is focused
	- [ ] Genius lyrics and metadata are extracted correctly even if ↩ is checked
	- [ ] Pasting can be undone and redone
- [ ] Lyrics paste and typing manually in `[ar: ]` metadata field updates Unknown Artist in Now Playing box
- [ ] Navigate to previous line with `ArrowUp` in any mode
- [ ] Navigate to next line with `ArrowDown` in any mode
- [ ] Play/pause with `Ctrl+Space` and button in Typing mode
- [ ] Seek back with `Ctrl+9` in Typing mode
- [ ] Seek forward with `Ctrl+0`in Typing mode
- [ ] Reduce speed with `Ctrl+1` and button in Typing mode
- [ ] Increase speed with `Ctrl+2` and button in Typing mode
- [ ] Reset speed with `Ctrl+3`  in Typing mode
- [ ] `(` and `[` autocomplete the second half like `()` and `[]` in Typing mode
- [ ] `(` typed at the beginning of a line autocompletes a `)` at the end of that line
- [ ] `(` typed while lines are selected wraps them in `( )` instead of replacing them

#### Mark as translation: folder 3.X
- [ ] "( )" checkbox wraps lines marked as translations with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode, matching example.txt (folder 3.1)
- [ ] "↩" checkbox checked after import causes `Ctrl+ArrowLeft` to convert inline lyrics and then navigate to the next line (folder 3.2)
- [ ] "↩" checkbox checked *before* import batch converts inline lyrics on both open and paste, matching example.txt (folder 3.2)

#### Secondary fields: folder 4
- [ ] Add field with `Ctrl+4` and button
- [ ] .lrc file picker opens with `Middle click` in secondary field and 📂button
- [ ] Lyrics are replaced for secondary field when new .lrc file is added
- [ ] Lyrics paste in secondary fields extract Genius metadata and lyrics
- [ ] Hide field with `Ctrl+5` and button hides the field without deleting lyrics
- [ ] Newlines and the final end timestamp are not counted as lyric lines
- [ ] Merge fields button is grayed out and `Ctrl+6` throws warning popup when
	- [ ] Lyric lines don't match
	- [ ] The main field lacks any timestamps (import english.lrc)
	- [ ] The main field lacks a final end timestamp (delete it)
	- [ ] Webpage is reloaded without merging fields when it's allowed
- [ ] Unsaved work warning is not bypassed by skipping merge fields and reloading page
- [ ] Merging fields matches sample.txt
- [ ] Merging fields can be undone and redone

#### Typing mode both fields: any file
- [ ] Typing and backspacing letters inline quickly can be batch undone and redone
- [ ] Typing and backspacing letters inline slowly one at a time can be individually undone and redone
- [ ] Typing and backspacing letters on newlines quickly can be batch undone and redone and doesn't count `Enter`
- [ ] Typing and backspacing letters on newlines slowly one at a time can be batch undone and redone and does count `Enter`
- [ ] Undo and redo in secondary field in Hotkey mode does not trigger Hotkey mode exclusive hotkeys
- [ ] Font type and size affects text in main and secondary fields in both Hotkey and Typing mode

#### Saving files: folder 4
- [ ] `Ctrl+'` hotkey and 💾button open save file picker
- [ ] .lrc and .txt files are shown in the file picker
- [ ] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Alt+F4`, `Middle click` on browser tab, or clicking the top-right corner X button or tab X button or reloading with `F5` or the refresh button should either do nothing or open a warning and snap the cursor to Leave Page
- [ ] Lyrics file saves as the name of the metadata title in the `[ti: ]` field
- [ ] Saved lyrics contents match Typing mode window contents

### Settings
#### First pass
- [ ] Opens with `Ctrl+,` hotkey and ⚙️ button
- [ ] Closes with  `Esc` or clicking outside the window
- [ ] Search field focuses when Settings window opened
- [ ] Every visible element can be focused with `Tab`/`Shift+Tab`
- [ ] Holding down `Tab`/`Shift+Tab` does not loop forever and stops at first or last element
- [ ] Searching for settings by name (i.e. "Moving", "Tiny", "Default", "Open") works
	- [ ] `Tab` from search field to the search results
		- [ ] `Spacebar` checks checkboxes
		- [ ] `ArrowUp`/`ArrowDown` makes minute adjustments to number fields
		- [ ] `Enter` assigns hotkeys
		- [ ] `Backspace` reverts to Default hotkey
		- [ ] `Shift+Backspace` clears hotkey
		- [ ] `Esc` resets focus back to search field
- [ ] Searching for hotkeys by hotkey (i.e. "Space") using ⌨️ button or `Tab` in search field works
	- [ ] `Tab` from hotkey search mode to search results
	- [ ] Hotkeys enter "..." state when tabbed to and can be remapped immediately
- [ ] Searching for another hotkey by hotkey (i.e. "F") immediately refreshes results
- [ ] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [ ] Scrolling to bottom and back to top works

#### Instant replay: folder 1
-   Check everything in this Settings section for testing convenience
- [ ] Moving to previous line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [ ] Moving to next line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [ ] Resuming currently playing line: replays with configured Seek offset instead of resuming when unpausing with `Space`
- [ ] Playing another line: plays with configured Seek offset instead of from start when clicking another line
- [ ] Adjusting seek offset: replays with configured Seek offset instead of continuing to play
- [ ] Syncing line: replays with configured Seek offset instead of continuing to play
- [ ] Adjusting timestamp: replays with configured Seek offset instead of continuing to play

#### Intervals: folder 1
- [ ] Main window Control buttons and both Offset modes update when changing
	- [ ] Tiny 100ms → 200ms
	- [ ] Small 200ms → 400ms
	- [ ] Medium 400ms → 800ms
	- [ ] Large 1000ms → 2000ms
- [ ] Seek increment seeks faster when changed from 5s → 10s
- [ ] Speed ratio changes speed faster when changed from 1.10x → 1.50x
- [ ] Volume increment changes volume faster when changed from 10% → 20%
- [ ] Undo window tracks each individual change when changed from 150ms → 1ms (the minimum)
- [ ] Selecting any single value in a field, pressing Backspace, and pressing Enter reverts to last value and does not show a blank field

#### Persistence
- [ ] Change main window font to System Serif and font size to 15
- [ ] Bump default speed up by one increment
- [ ] Bump default seek offset up by one increment
- [ ] Make dummy changes to each default metadata field↩ and remove the newline:
```
[ti: Lalala]
[ar: Me]
[al: Myself]
[re: And I]
```

- [ ] Click each hotkey field and click the "X" to clear it
- [ ] Refresh webpage (F5) and confirm each change made in this section persisted and the placeholder metadata fields are altered
- [ ] Press `Ctrl+\` when Settings window is closed opens Settings window dialog
	- [ ] Clicking No or pressing `Backspace` keeps changes
	- [ ] Clicking Yes or pressing `Enter` reverts to defaults

#### Hotkey assignment
- [ ] Click each hotkey field and click outside or press `Esc` to cancel assignment
- [ ] Click each hotkey field and assign to `NumPadMinus`
	- [ ] Each hotkey after the first shows a Replace button
		- [ ] Clicking that button assigns that hotkey
	- [ ] Each hotkey also shows a Default button
		- [ ] Clicking that button resets the hotkey to default
	- [ ] Each hotkey also shows an "X" button
		- [ ] Clicking that button clears the hotkey
- [ ] `Tab` to each hotkey field and assign to `NumPadMinus`
	- [ ] The three buttons appear when expected
	- [ ] Pressing `Enter` assigns that hotkey and tabs down to the next hotkey
	- [ ] Pressing `Backspace` resets the hotkey to default
	- [ ] Pressing `Shift+Backspace` clears the hotkey
- [ ] Click or `Tab` to each hotkey field and assign to restricted `Ctrl+R`
	- [ ] Each field shows a warning and Default button but not the Replace button
- [ ] `Ctrl+\` and `Enter` resets hotkeys