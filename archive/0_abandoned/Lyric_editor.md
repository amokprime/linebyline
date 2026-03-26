#### Summary
I want to build a per-line lyric syncing tool for .lrc files like https://seinopsys.dev/lrc but with a unified syncing/editing page, better hotkey workflow that depends less on cursor positioning, and customizable hotkeys. Simply refer to the app as 'the app' until I come up with a name that isn't taken.
##### Menu
- Combined **Import** button that allows adding the song and .lrc file together from the default system file picker (default Ctrl+O)
	- Edit the .lrc file in-place
	- Update any out-of-band changes to it (i.e. from notepad) in the app immediately
- **Export** button that saves text file as .lrc file whose filename is the metadata title (default Ctrl+P)
- New file button that clears and resets all text fields (default Ctrl+N)
- The usual min/max/close buttons in the top right corner and the usual window manipulation hotkeys (i.e. Meta+Arrows, Ctrl+W); these can be hard coded
- Undo/Redo buttons (default Ctrl+Z, Ctrl+Y)
- Autosave last open file so that closing the app does not lose progress
- Settings button that opens a settings window for persistent configs (default Ctrl+Comma)
	- Auto strip from lyrics
		- [ ] Headers
		- [ ] Metadata
	- Offsets
		- Rewind/forward: default `1000` ms
		- Timestamps back/forward
			- Large: default `1000` ms
			- Medium: default `400` ms
			- Small: default `200` ms
	- Metadata default tags to inject at the start of the text field
```
[ti: ]
[ar: ]
[al: ]
[re: Genius, GeniusLyricsCopier, lrcgenerator.com, thisappname]
[by: withinitself]

```
##### Main window
- One main text field for original language lyrics (supporting directly pasting raw lyrics) instead of each line on a separate field like seinopsys
	- Do not focus this field on startup
- Highlight the current line the song is playing
	- Change the current line and seek to beginning of song minus configured rewind offset if timestamp available (default Left Click)
- Support system media keys (mute, reduce volume, increase volume, play/pause); these can be hard coded
- Play/pause song (default Spacebar)
- A toggle button to switch between hotkey mode and typing mode (default Tab)
	- Hotkey mode: hotkeys that are simply a letter activate the hotkey instead of typing even if the text field is focused
	- Typing mode: Letters type when the text field is focused
- Sync highlighted line to time of current song (default W) like below example (this should never affect more than one line at a time!)
```
[00:00.00] Lyrics for this line
```
- Rewind song to beginning of current timestamped line minus configurable offset in settings (default Q)
- Forward song to beginning of next timestamped line minus same configurable offset (default E)
- Buttons to adjust timestamp of selected lines by 100ms
	- Back (Default Z
	- Forward (Default V)
	- "Selected lines" means the current line the song is on if no text is selected
- Offset timestamps for selected lines in text field back by configurable amount
	- Large (default X)
	- Medium (default S)
	- Small (default A)
- Offset timestamps for selected lines in text field forward by configurable amount
	- Large (default C)
	- Medium (default D)
	- Small (default F)
##### Secondary text fields for merging translations
- Buttons to the right side of the main text field that add (default Ctrl+"+") and remove (default Ctrl+"-") secondary text fields to the right
- Always strip secondary field metadata and headers, and timestamps as well (including the extra leading space after the bracket left over)
- Disable the sync highlighted line and offset timestamps hotkeys in secondary fields
- Allow typing in secondary fields
- Automatically "line up" lines in secondary fields to the same level as their main field counterparts
- Show a warning above each secondary text field if the number of their lines (excluding newlines) differs from that in the main text field
- Button to **Merge Translations**
	- Lights up if at least one secondary field is not empty and all secondary fields are either empty or have the same number of lines as the main field
	- Assume each line at a given relative position corresponds to the same lines in other fields
	- Copy the translations over (don't cut) to the main field line-under-line style in a top-to-bottom order corresponding to the field positions left-to-right
- Small text field over each text field to indicate what braces to wrap lyric lines in (empty → no braces and remove any that exist)
##### Translations example
Suppose I want the romanization of a song in the main field and add kanji in a secondary field and English to another secondary field.
The main field to the left might look like this:
```
[00:01.19] Redacted in case of copyright
[00:04.54] Redacted in case of copyright
```
First secondary field in the middle:
```
redacted in case of copyright
redacted in case of copyright
```
Second secondary field to the right (braces set to `()`):
```
(redacted in case of copyright)
(redacted in case of copyright)
```
Merged result pushed to the main field:
```
[00:01.19] Redacted in case of copyright
[00:04.52] redacted in case of copyright
[00:04.53] (redacted in case of copyright)
[00:04.54] Redacted in case of copyright
[00:07.26] redacted in case of copyright
[00:07.27] (redacted in case of copyright)
```
The main field's lines take precedent and keep the original timestamps; secondary field lines are offset against the original timestamps (in the relative order the text fields appear left to right) by 1/100 second increments to avoid highlighting in players. Warn if there is no trailing timestamp marking the end of the song vocals as that is also needed to finish the pattern (the final secondary lines are offset against it).