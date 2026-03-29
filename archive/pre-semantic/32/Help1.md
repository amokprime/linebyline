License: Placeholder
###### Disclaimer
This help file, workflow design, and most UI decisions were written by me and reviewed with Claude Sonnet 4.6. A few icons use Lucide.
Everything else is 🚨🌈VIBECODED🌈🚨 — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️
###### About/TL;DR:
LineByLine is an opinionated web app for manually syncing song lyrics...line by line. It features:
- Remappable hotkey-driven workflow
- Batch offset timestamps
- Genius lyrics extraction from raw paste
- Configurable instant replay with offset and triggers
- Merging translations without highlighting
###### Importing files
- Open a song and/or .lrc file (Open button, Middle click, Ctrl + O)
- ⚠️*External .lrc files are edited in place immediately*. Edit a copy to be safe.
- Or paste a Genius webpage (Ctrl + A → Ctrl + C → Alt + Tab → Ctrl + V) into the Main field to import clean lyrics. I used to do this with GeniusLyricCopier, lrcgenerator.com Strip Sections, and manual cleanup.
- Or toggle **Typing mode** for the main text field with Tab
	- Use this mode to correct imported typos, write your own lyrics, or edit metadata fields
		- [ti: ] (Title) is pulled from song or .lrc filename (prioritizing song) if missing
		- [ti: ], [al: ], and [ar: ] (Title, Album, and Artist) are extracted from Genius pasted lyrics. If a song is added second, its filename will overwrite the Genius-extracted [ti: ].
		- Imported .lrc files keep their metadata by default, falling back to each default field if missing
		- Pasted lyric metadata is removed by default
		- Genius stanza sections are also removed by default because they are not supported by .lrc format
	- Change the default metadata tags in Settings
- Opening a different song or .lrc file will overwrite the existing one (pasting appends instead)
- Reloading or closing the browser tab will reset song and lyrics but persist settings
###### Instant replay and seek offset
- Seek the traditional way by scrolling over the seek bar (default 5s increment)
- Seek the start of a line when played (Click, Spacebar) like LRCGET
- Seek the end of a line with Shift + Spacebar (requires trailing timestamp)
- Offset this by **Seek offset** (default -600ms) to give you more time to react (aka "instant replay")
- Trigger instant replay on demand with R
	- This is the only way to activate it by default
	- Integrate with common hotkeys in Settings → INSTANT REPLAY
		- ⚠️That will trigger it whenever those hotkeys are used
- Adjust the seek offset by:
	- Changing the default in Settings → INTERVALS → Seek offset and reloading the page
	- Temporarily adjusting it with
		- Black left/right arrow buttons
		- A specific value in the field
		- The ms seek keys in **Offset seek** mode (Grave key):
- Batch offset all lyrics with:
	- The **Sync file** button (Ctrl + Grave), which offsets all lines by the current seek offset. Works in any mode
	- Ctrl + A to select all lines. Only works in **Offset time** mode
###### Syncing lyrics
- If the lyrics are unsynced, sync one line at a time (W, Enter)
	- By default this will automatically move to the next line
	- You can configure Settings → INSTANT REPLAY → ✅After syncing line. This will replay the line instead of moving on. You can then replay it again with R or move to the next line with E, Down, or left click.
- If the lyrics are synced but incorrect, adjust them with Controls in **Offset time** mode
	- By default the song keeps playing while you do this
	- Configure Settings → INSTANT REPLAY → ✅After adjusting timestamp → ✅ Interval(s) of your choice. This will replay the line whenever you adjust it by those intervals. Replay it again with R or move to the next line with E, Down, or left click.
###### Merging translations
- Add/remove secondary text fields with buttons or hotkeys (Ctrl + 1 Add field, Ctrl + 2 Remove field, Ctrl + 3 Merge fields)
	- Secondary field content persists for the browser session
	- Either paste lyrics or add a .lrc file
	- Timestamps are offset from the main lyrics
	- Secondary lyrics are wrapped in parentheses by default to indicate "not main lyrics". This can be unchecked per field.
- Merge fields if: 
	- ✅Main lyrics have timestamps, including end time
	- ✅Main and secondary fields have the same number of lyric lines
- An example of what this looks like is provided below from 怪物 by YOASOBI. The secondary lyrics are offset 0.01 seconds from the next timestamp to avoid being highlighted (at least to human eyes) in music players. This can reduce clutter in songs with multiple translations. Which version counts as "main" and "secondary" is arbitrary.
```
#Main
[00:18.19] Me wo samasu honnou no mama
[00:20.05] Kyou wa dare no ban da?
[00:22.94]
#Secondary 1
(目を覚ます本能のまま)
(今日は誰の番だ?)
#Secondary 2
(And as my eyes and instincts snap awake)
(I wonder, whose turn is it today?)
#Merged result in Main; undo with Ctrl+Z
[00:18.19] Me wo samasu honnou no mama
[00:20.03] (目を覚ます本能のまま)
[00:20.04] (And as my eyes and instincts snap awake)
[00:20.05] Kyou wa dare no ban da?
[00:22.92] (今日は誰の番だ?)
[00:22.93] (I wonder, whose turn is it today?)
[00:22.94]
```
###### Misc
- Adjust song speed with buttons or hotkeys (Alt + 1 Reduce speed, Alt + 2 Increase speed up, Alt + 3 Reset). This uses a multiplicative scale (each new speed is multiplied against the speed ratio) to make speed changes feel less extreme.
- Adjust song volume by scrolling over it. See Settings → INTERVALS → Volume increment
- Undo window controls the undo debounce interval (default 150 ms). Actions within this interval are counted as one action on the undo stack.