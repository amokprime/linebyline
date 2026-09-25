#### AI transcription
1. Unreliable transcription. Maybe useful for syncing if the vocals have clear beginnings and endings
2. Out of scope for current architecture of this app. I could imagine a Bring Your Own AI but I don't have experience with MCP
#### Word-by-word syncing
1. LRCGET has this
2. Would need to refactor LineByLine (enhanced .lrc support and more hotkey modes)
	1. Per-line without trailing timestamp
	2. Per-line with trailing timestamp
	3. Per-word with trailing timestamp
3. Can't [dogfood](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) the output (I use Navidrome/Feishin which don't highlight per word yet)
#### Desktop app
1. Unreliable AI oneshot output
2. Fewer free QA/UI resources
#### Mobile PWA - see 2.2, 2.3 (I don't listen to music on my phone)
#### Publish directly to LRCLIB - see 2.1 and 3
#### Find and Replace popup
- **LRCGET already has this (even Regex!) and is needed anyway for linting/publishing**
- Hardcoded to `Ctrl+F` and flat rather than tall and hug the bottom of the viewport to avoid blocking lyrics or titlebar elements. Like  Firefox's `Ctrl+F` Find popup
- It should have the typical fields and buttons of find-and-replace. Remind me if I left anything out:
	- "Find" text input field
	- "Replace" text input field 
	- "⌃" button (tooltip: "Find previous") that doesn't replace
	- "⌄" button (tooltip: "Find next") that doesn't replace
	- "Replace" button that replaces next match (in order left → right and top → down)
	- "Replace all button" that replaces all matches
- `Ctrl+H` should open the Find and Replace popup as long as
	- The app is focused and thus able to receive hotkeys in general. Hotkey/Typing or Offset time/seek should not matter.
	- Main and secondary fields with lyrics exist
- Typing in the "Find" and "Replace with" fields should not trigger hotkeys in Hotkey mode
#### Convert between .lrc and .srt
- For adding lyrics to music videos or extracting lyrics from obscure songs only available as videos with subtitles
- Allow adding .mp4 and .srt filetypes and audio playback of .mp4
- Convert .srt to .lrc on import
- Extra "Save as .srt" dropdown button beside 💾 to save lyrics in that format
- Add trailing timestamps to .lrc from .srt
- Insert trailing timestamps for each line of .srt when saving .lrc file without them, offset -0.01s from timestamp of next line (the mark line as translation pattern but applied to blank newline without parentheses)
- Where the .srt has two lines in one timestamp range, add a Main field checkbox ".srt ↩"
	- When checked, the two lines are imported as separate .lrc lines and the second one gets a placeholder starting timestamp at the midpoint of the original start and end time
	- When unchecked, the two lines are imported as one line with a starting and trailing timestamp, and the first word of the second line is converted to lowercase if not a proper noun