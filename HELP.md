LineByLine is 🚨🌈VIBECODED🌈🚨 — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️

### Settings⚙️
- Default Settings hotkey (`Ctrl+,`)
- Keyboard navigation
	- `Tab` to walk down through Settings options and `Shift+Tab` to walk up
	- `Esc` to reset focus to search field
	- `Spacebar` checks checkboxes
	- Assign hotkeys with `Enter`
	- Reset to default with `Backspace`
	- Clear with `Shift+Backspace`
- The search field lists matching settings by name
- The ⌨️ button searches by hotkey instead. Send a new hotkey in-place for a new search.
- Reset hotkey search or clear selected hotkey fields (`Esc`, `Backspace`, `Del`)
- Press `Esc` or click outside the hotkey field to cancel
- Changes apply immediately and persist across sessions to browser `localStorage`
- **Reset defaults** (`Ctrl+\`) affects *all* settings, even input fields in the main window
### Working with lyric files
- 📂Open song and lyrics separately or together (`Middle Click`, `Ctrl+O`)
- 💾Save results as external `.lrc` file (`Ctrl+;`) with name of current `[ti: ]` tag
- Paste a song Genius page into the **Main** field to extract clean lyrics
- Toggle **Typing mode** (`` ` ``) to edit lyrics and metadata (⚙️📝**Default metadata tags**)
	- `[ti: ]` prioritizes existing value, song filename, `.lrc` filename, then Genius
	- `[ti: ]`, `[al: ]`, and `[ar: ]` are extracted from Genius pasted lyrics
	- Imported `.lrc` files keep metadata and fallback to default fields
- Opening another song or `.lrc` file overwrites the existing one (pasting appends)
- Reloading or closing the tab resets song and lyrics from browser `sessionStorage`
### Playback controls
- Seek (default **Seek increment** 5s) by
	- Clicking, dragging, or scrolling over the seek bar
	- Using `←`/`ArrowRight` in **Hotkey mode** or `Ctrl+9`/`Ctrl+0` in any mode
	- Clicking the left/right media buttons
- Click a line to jump to it and play from timestamp
- Play/pause with `Space` in **Hotkey mode** or `Ctrl+Space` in any mode
- Adjust playback speed with `Ctrl+1`/`Ctrl+2` and reset speed to 1 with `Ctrl+3` 
	- Each adjustment multiplies the current speed by the⚙️📝**Speed ratio** 
- Scrolling over volume bar changes it by the ⚙️📝**Volume increment**
### Syncing and reviewing lyrics
- Sync a line (`W`, `Enter`) to move to the next line
- Navigate with `Q`/`E` in **Hotkey mode** or `ArrowUp`/`ArrowDown` keys in any mode
- Adjust timestamps of selected line(s) in **Offset time** mode
	- Four ⚙️**Intervals**: large `X`/`C`, medium `S`/`D`, small `A`/`F`, and tiny `Z`/`V
	- Select multiple lines with `Ctrl/Shift+Click` or `Shift+↑/↓`
- Review timestamps with `R`/`Shift+R` and **Seek offset** (-600ms default)
	- In **Offset seek** toggle mode (``Shift+` ``), Controls adjust **Seek offset** instead of timestamps
	- **Sync file** (``Ctrl+` ``) adjusts all timestamps by the current **Seek offset**
- Automatically replay lines to review-in-place with ⚙️**Instant Replay** triggers
	- ⚙️✅"Moving to previous line" (`Q` | `↑` to navigate only)
	- ⚙️✅"Moving to next line" (`E` | `↓` to navigate only)
	- ⚙️✅"Resuming currently playing line" (`Space`)
	- ⚙️✅"Playing another line" (`Click`)
	- ⚙️✅"Syncing line" (`W`, `Enter`)
	- ⚙️✅"Adjusting timestamp" (`A`,`S`,`D`,`F`,`Z`,`X`,`C`,`V`)
- Reduce the ⚙️📝**Undo window** (default 150 ms) if too many edits are undone in one step
### Adding translations
- **Add**/**Hide**/**Merge** fields (`Ctrl+4`, `Ctrl+5`, `Ctrl+6`)
	- Paste Genius lyrics into a **Secondary** field to extract clean lyrics
	- `Middle click` a secondary field or click its 📂 button to open a `.lrc` file
	- Secondary ✅"( )" wraps translations with parentheses to indicate "not main lyrics"
- Merged lyrics are offset 0.01 seconds from the next main field timestamp
- This prevents music players like Feishin from highlighting them to reduce clutter
- **Merge fields** if:
	- Main lyrics have timestamps, including final trailing timestamp
	- Main and secondary fields have the same number of lyric lines
- Mark individual lines as translations with `Ctrl+ArrowLeft`
	- Main ✅"( )" automatically wraps these with parentheses
	- Main ✅"↩"
		- Moves existing inline translations that are in parentheses to new lines
		- Marks them as translations. 
	- Lyrics added while ↩ is checked will be batch converted.

**License:** [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
