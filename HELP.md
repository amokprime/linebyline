This app is 🚨🌈VIBECODED🌈🚨 — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️
### Settings⚙️
- Default Settings hotkey (`Ctrl+,`)
- Changes apply immediately and persist to browser localStorage
- Search for a setting by name (`Tab`)
- Keyboard button (`Tab`) searches by hotkey; send a new hotkey in-place for a new search
- Reset hotkey search or clear selected hotkey fields (`Esc`, `Backspace`, `Del`)
- Click outside the hotkey field to cancel
- Keystrokes in the undo window (default 150 ms) are grouped into one undo step
### Working with lyric files
- 📂Open song and lyrics separately or together (`Middle Click`, `Ctrl+O`)
- 💾Save results as external `.lrc` file (`Ctrl+;`)
- Paste song Genius page into the **Main** field or a **Secondary** field to extract clean lyrics
- Toggle **Typing mode** (`Tab`) to edit lyrics and metadata
	- `[ti: ]` prioritizes existing value, song filename, `.lrc` filename, then Genius
	- `[ti: ]`, `[al: ]`, and `[ar: ]` are extracted from Genius pasted lyrics
	- Imported `.lrc` files keep metadata and fallback to default fields
	- Edit default metadata fields in ⚙️📝**Default metadata tags**
- Opening another song or `.lrc` file overwrites the existing one (pasting appends)
- Reloading or closing the tab resets song and lyrics from browser sessionStorage
### Playback controls
- **Seek increment** (default 5s) by scrolling over the seek bar or using `Ctrl+A` or `Ctrl+D`
- **Instant Replay** with `R` (start), `Shift+R` (end), or configurable triggers
	- Seek the start (`Click`, `Spacebar`) of a line
		- ⚙️✅Resuming currently playing line
		- ⚙️✅Playing another line
	- **Seek offset** (default -600ms) gives you more time to react
	- In **Offset seek** toggle mode (`` ` ``), Controls adjust **Seek offset** instead of timestamps
- **Sync file** (``Ctrl+` ``) adjusts all timestamps by the current **Seek offset**
- ⚙️📝**Speed ratio** (`Ctrl+1`, `Ctrl+1`, `Ctrl+3`) multiplies against current speed
- Scrolling over volume bar changes it by an interval (⚙️📝**Volume increment**)
### Syncing lyrics
- Sync a line (`W`, `Enter`) to move to the next line
	- ⚙️✅"After syncing line" replays the line instead
	- Replay it again with `R` or move to the next line with `E`, `ArrowDown`, or `Left Click`.
- Navigate with `Q`/`E` or `ArrowUp`/`ArrowDown` in **Hotkey mode**
	- ⚙️✅"Moving to previous line" replays on `Q`
	- ⚙️✅"Moving to next line" replays on `E`
- Adjust lines with **Controls** in **Offset time** mode
	- Select multiple lines with `Ctrl/Shift+Click` or `Shift+ArrowUp/ArrowDown`
	- The song keeps playing while timestamps are adjusted by default
	- ⚙️✅"After adjusting timestamp" replays after every change
### Adding translations
- **Add**/**Hide**/**Merge** fields (`Ctrl+4`, `Ctrl+5`, `Ctrl+6`)
	- Paste or 📂
	- Secondary "( )" wraps translations with parentheses to indicate "not main lyrics"
- Merged lyrics are offset 0.01 seconds from the next main field timestamp
- This prevents music players such as Feishin from highlighting them to reduce clutter
- **Merge fields** if:
	- Main lyrics have timestamps, including final trailing timestamp
	- Main and secondary fields have the same number of lyric lines
- You can also mark individual lines as translations with `Ctrl+Left`
- If the Main "( )" is checked, such lines will automatically be wrapped with parentheses

**License:** [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
