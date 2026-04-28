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
- [x] Each main window button tints or displays pointer cursor on hover
- [x] Preview HELP.md [URL](https://github.com/amokprime/linebyline/blob/main/HELP.md) on "?" button hover and Issues [URL](https://github.com/amokprime/linebyline/issues) on bug button hover
- [x] Open HELP.md with `Ctrl+/` hotkey and "?" button
- [x] Open Issues with `Ctrl+[` hotkey and bug button click
- [x] Each main window button shows feedback on click (darker tint and downward nudge)
- [x] Theme is toggled light → dark and dark → light with `Ctrl+.` hotkey and button
	- [x] Default theme is light with 🌙 button
	- [x] Theme button icon is ☀️in dark mode
- [x] Active modes are Offset time and Hotkey mode (blue buttons)
- [x] Every visible element other than Controls buttons can be focused with `Tab`/`Shift+Tab`
	- [x] Font can be changed with arrow keys

## Main window second pass

#### Adding and pasting lyrics: folder 1
- [x] `Ctrl+;`/`Middle click` hotkeys and 📂button open file picker
- [x] Title is extracted from audio and .lrc file added together and updates Unknown Artist in Now playing box and metadata field
- [x] Reloading the page with content loaded brings up a warning and snaps cursor to dialog box
- [x] Title is extracted from audio filename added first and adding lyrics file updates Unknown Artist
- [x] Title is extracted from lyrics filename added first and adding audio file updates song duration
- [x] Title matches same case as filename (i.e. no title case → lower case)
- [x] Adding lyrics from file can be undone and redone
- [x] Timestamps but not metadata fields are visible in Hotkey mode
- [x] Newlines between stanzas are visible in Hotkey mode
- [x] Non-navigation hotkeys and buttons don't spam when held

#### Playback: folder 1
- [x] Play/pause with `Space` and button in Hotkey mode
- [x] Seek back with `ArrowLeft` and button in Hotkey mode
- [x] Seek forward with `ArrowRight` and button in Hotkey mode
- [x] Reduce speed with `Ctrl+1` and button in Hotkey mode
- [x] Increase speed with `Ctrl+2` and button in Hotkey mode
- [x] Reset speed with `Ctrl+3` in Hotkey mode
- [x] Song seeks by any amount when seek slider is dragged with mouse and live updates time; scroll seeks by 5s instead
- [x] `Ctrl+M` hotkey and volume button toggles mute and snaps slider to 0 when muted and 100 when unmuted
- [x] Volume slider seeks by 10% when scrolled or dragged

#### Syncing lyrics: folder 2
- [x] Lyrics and audio are replaced for main field when new files are added from folder 2
- [x] Sync line start with `W` and button in Hotkey mode
- [x] Syncing lyrics also appends a final trailing timestamp if none exists (set to song duration if there is an audio file)
- [x] Sync line end with `T` and button in Hotkey mode
- [x] Navigate to previous line with `Q` and button in Hotkey mode
- [x] Navigate to next line with `E` and button in Hotkey mode
- [x] Navigation skips lines with no lyrics text in Hotkey mode
- [x] Replay only with `R` and button in Hotkey mode
- [x] Replay is offset by -600ms Seek offset field
- [x] Replay end with `Shift+R` in Hotkey mode

#### Adjustments: folder 2
- [x] Timestamp `[-00:00.10]` with `Z` and button in Hotkey mode
- [x] Timestamp `[+00:00.10]` with `V`  and button in Hotkey mode
- [x] Timestamp `[-00:00.20]` with `A`  and button in Hotkey mode
- [x] Timestamp `[+00:00.20]` with `F`  and button in Hotkey mode
- [x] Timestamp `[-00:00.40]` with `S`  and button in Hotkey mode
- [x] Timestamp `[+00:00.40]` with `D`  and button in Hotkey mode
- [x] Timestamp `[-00:01.00]` with `X`  and button in Hotkey mode
- [x] Timestamp `[+00:01.00]` with `C`  and button in Hotkey mode
- [x] Toggle offset mode with `Shift+~` and button
- [x] Adjustments in Offset mode change -600ms Seek offset instead of timestamps
- [x] Sync file with `Ctrl+I` and button; can also be undone and redone

#### Typing mode main field: Genius text file, folder 2
- [x] Toggle Hotkey/Typing mode with `` ` `` and button
- [x] Lyrics appear at about the same position onscreen when toggling Hotkey/Typing mode
- [x] Lyrics can be pasted in both Hotkey and Typing mode when the field is focused
	- [x] Genius lyrics and metadata are extracted correctly
	- [x] Pasting can be undone and redone
- [x] Lyrics paste and typing manually in `[ar: ]` metadata field updates Unknown Artist in Now Playing box
- [x] Navigate to previous line with `ArrowUp` in any mode
- [x] Navigate to next line with `ArrowDown` in any mode
- [ ] Play/pause with `Ctrl+Space` and button in Typing mode
- [x] Seek back with `Ctrl+9` in Typing mode
- [x] Seek forward with `Ctrl+0`in Typing mode
- [x] Reduce speed with `Ctrl+1` and button in Typing mode
- [x] Increase speed with `Ctrl+2` and button in Typing mode
- [x] Reset speed with `Ctrl+3`  in Typing mode
- [x] `(` and `[` autocomplete the second half like `()` and `[]` in Typing mode
- [x] `(` typed at the beginning of a line autocompletes a `)` at the end of that line
- [x] `(` typed while lines are selected wraps them in `( )` instead of replacing them

#### Mark as translation: folder 3.X
- [x] "( )" checkbox wraps lines marked as translations with `Ctrl+ArrowLeft` when checked and not otherwise, in both Hotkey mode and Typing mode, matching example.txt (folder 3.1)
- [x] "↩" checkbox checked after import causes `Ctrl+ArrowLeft` to convert inline lyrics and then navigate to the next line (folder 3.2)
- [x] "↩" checkbox checked *before* import batch converts inline lyrics on both open and paste, matching example.txt (folder 3.2)

#### Secondary fields: folder 4
- [x] Add field with `Ctrl+4` and button
- [x] .lrc file picker opens with `Middle click` in secondary field and 📂button
- [x] Lyrics are replaced for secondary field when new .lrc file is added
- [x] Lyrics paste extract Genius metadata and lyrics
- [x] Hide field with `Ctrl+5` and button hides the field without deleting lyrics
- [x] Newlines and the final end timestamp are not counted as lyric lines
- [x] Merge fields button is grayed out and `Ctrl+6` throws warning popup when
	- [x] Lyric lines don't match
	- [x] The main field lacks any timestamps (import english.lrc)
	- [x] The main field lacks a final end timestamp (delete it)
	- [x] Webpage is reloaded without merging fields when it's allowed
- [x] Unsaved work warning is not bypassed by skipping merge fields and reloading page
- [x] Merging fields matches sample.txt
- [x] Merging fields can be undone and redone

#### Typing mode both fields: any file
- [x] Typing and backspacing letters inline quickly can be batch undone and redone
- [x] Typing and backspacing letters inline slowly one at a time can be individually undone and redone
- [x] Typing and backspacing letters on newlines quickly can be batch undone and redone and doesn't count `Enter`
- [x] Typing and backspacing letters on newlines slowly one at a time can be batch undone and redone and does count `Enter`
- [x] Undo and redo in secondary field in Hotkey mode does not trigger Hotkey mode exclusive hotkeys
- [x] Font type and size affects text in main and secondary fields in both Hotkey and Typing mode

#### Saving files: folder 4
- [x] `Ctrl+'` hotkey and 💾button open save file picker
- [x] .lrc and .txt files are shown in the file picker
- [x] Closing tab with `Ctrl+Q`, `Ctrl+W`, `Alt+F4`, `Middle click` on browser tab, or clicking the top-right corner X button or tab X button or reloading with `F5` or the refresh button should either do nothing or open a warning and snap the cursor to Leave Page
- [x] Lyrics file saves as the name of the metadata title in the `[ti: ]` field
- [x] Saved lyrics contents match Typing mode window contents

### Settings
#### First pass
- [x] Opens with `Ctrl+,` hotkey and ⚙️ button
- [x] Closes with  `Esc` or clicking outside the window
- [x] Search field focuses when Settings window opened
- [x] Every visible element can be focused with `Tab`/`Shift+Tab`
- [x] Holding down `Tab`/`Shift+Tab` does not loop forever and stops at first or last element
- [x] Searching for settings by name (i.e. "Moving", "Tiny", "Default", "Open") works
	- [x] `Tab` from search field to the search results
		- [x] `Spacebar` checks checkboxes
		- [x] `ArrowUp`/`ArrowDown` makes minute adjustments to number fields
		- [x] `Enter` assigns hotkeys
		- [x] `Backspace` reverts to Default hotkey
		- [x] `Shift+Backspace` clears hotkey
		- [x] `Esc` resets focus back to search field
- [x] Searching for hotkeys by hotkey (i.e. "Space") using ⌨️ button or `Tab` in search field works
	- [x] `Tab` from hotkey search mode to search results
	- [x] Hotkeys enter "..." state when tabbed to and can be remapped immediately
- [x] Searching for another hotkey by hotkey (i.e. "F") immediately refreshes results
- [x] Pressing `Esc`, `Backspace`, or `Del` when searching by hotkey switches back to searching by name
- [x] Scrolling to bottom and back to top works

#### Instant replay: folder 1
-   Check everything in this Settings section for testing convenience
- [x] Moving to previous line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [x] Moving to next line: plays with configured Seek offset when navigating with `Q` and `E` keys
- [x] Resuming currently playing line: replays with configured Seek offset instead of resuming when unpausing with `Space`
- [x] Playing another line: plays with configured Seek offset instead of from start when clicking another line
- [x] Adjusting seek offset: replays with configured Seek offset instead of continuing to play
- [x] Syncing line: replays with configured Seek offset instead of continuing to play
- [x] Adjusting timestamp: replays with configured Seek offset instead of continuing to play

#### Intervals: folder 1
- [x] Main window Control buttons and both Offset modes update when changing
	- [x] Tiny 100ms → 200ms
	- [x] Small 200ms → 400ms
	- [x] Medium 400ms → 800ms
	- [x] Large 1000ms → 2000ms
- [x] Seek increment seeks faster when changed from 5s → 10s
- [x] Speed ratio changes speed faster when changed from 1.10x → 1.50x
- [x] Volume increment changes volume faster when changed from 10% → 20%
- [x] Undo window tracks each individual change when changed from 150ms → 1ms (the minimum)
- [x] Selecting any single value in a field, pressing Backspace, and pressing Enter reverts to last value and does not show a blank field

#### Persistence
- [x] Change main window font to System Serif and font size to 15
- [x] Bump default speed up by one increment
- [x] Bump default seek offset up by one increment
- [x] Make dummy changes to each default metadata field↩ and remove the newline:
```
[ti: Lalala]
[ar: Me]
[al: Myself]
[re: And I]
```

- [x] Click each hotkey field and click the "X" to clear it
- [x] Refresh webpage (F5) and confirm each change made in this section persisted and the placeholder metadata fields are altered
- [x] Press `Ctrl+\` when Settings window is closed opens Settings window dialog
	- [x] Clicking No or pressing `Backspace` keeps changes
	- [ ] Clicking Yes or pressing `Enter` reverts to defaults

#### Hotkey assignment
- [x] Click each hotkey field and click outside or press `Esc` to cancel assignment
- [x] Click each hotkey field and assign to `NumPadMinus`
	- [x] Each hotkey after the first shows a Replace button
		- [x] Clicking that button assigns that hotkey
	- [x] Each hotkey also shows a Default button
		- [x] Clicking that button resets the hotkey to default
	- [x] Each hotkey also shows an "X" button
		- [x] Clicking that button clears the hotkey
- [x] `Tab` to each hotkey field and assign to `NumPadMinus`
	- [x] The three buttons appear when expected
	- [x] Pressing `Enter` assigns that hotkey and tabs down to the next hotkey
	- [x] Pressing `Backspace` resets the hotkey to default
	- [x] Pressing `Shift+Backspace` clears the hotkey
- [x] Click or `Tab` to each hotkey field and assign to restricted `Ctrl+R`
	- [x] Each field shows a warning and Default button but not the Replace button
- [x] `Ctrl+\` and `Enter` resets hotkeys