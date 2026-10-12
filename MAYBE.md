This has random ideas I don't feel like working on yet. Ordered top to bottom roughly in order of my current willingness to spend time vibecoding/dogfooding them:
### Find and Replace popup
- LRCGET already has this (even Regex!) and is needed anyway for linting/publishing
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
### Convert between .lrc and .srt
- For adding lyrics to music videos or extracting lyrics from obscure songs only available as videos with subtitles
- Allow adding .mp4 and .srt filetypes and audio playback of .mp4
- Convert .srt to .lrc on import
- Extra "Save as .srt" dropdown button beside 💾 to save lyrics in that format
- Add trailing timestamps to .lrc from .srt
- Insert trailing timestamps for each line of .srt when saving .lrc file without them, offset -0.01s from timestamp of next line (the mark line as translation pattern but applied to blank newline without parentheses)
- Where the .srt has two lines in one timestamp range, add a Main field checkbox ".srt ↩"
	- When checked, the two lines are imported as separate .lrc lines and the second one gets a placeholder starting timestamp at the midpoint of the original start and end time
	- When unchecked, the two lines are imported as one line with a starting and trailing timestamp, and the first word of the second line is converted to lowercase if not a proper noun
### Auto skip long lines
- Still not sure if this is even a real issue yet. Basically waiting for songs with large gaps between lines to progress naturally and drag the cursor down to sync the next line might be too slow. The existing setting Instant Replay -> check "Moving to next line" and using `E` to skip the wait works and is fastest, but also manual and must be spammed a number of times equal to lines of lyrics. A more automated compromise:
- Add new settings section "Misc" at the top with a checkbox "Auto skip long lines", default unchecked.
- Add new number field under "Intervals" section (same type and inline tick arrows as the others there) to control "Auto skip grace period" between "Large" and "Seek increment", default value `1` and unit label "s" (aka 1 second). Allow a floor of 0 (at which point the seek offset is the grace period), hundredth position decimal values, and some reasonable ceiling.
- When the difference between the current line timestamp and the next timestamp ≥ grace period + seek offset (i.e. 1.6 seconds with default settings), play the current line for the grace period and if not already ≤ seek offset amount of time from next timestamp, jump there. Edge case handling:
	- If Instant Replay -> Syncing line is unchecked, the grace period is available to hit `R` if I want to re-sync the current line.
	- If either current or next line timestamp doesn't exist this feature should no-op locally. If the whole song has no timestamps, no-op the whole song. If some lines have no timestamps and others do in the same song, the feature should work when both ends of the difference exist locally (relative to current position), and no-op locally otherwise.
### AI transcription
- Need to look into some local models and whether syncing is viable
### Word-by-word syncing
- LRCGET has this
- Would need to refactor LineByLine (enhanced .lrc support and more hotkey modes)
	- Per-line without trailing timestamp
	- Per-line with trailing timestamp
	- Per-word with trailing timestamp
- Can't [dogfood](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) the output (I use Navidrome/Feishin which don't highlight per word yet)
### Desktop app
- Expensive to iterate a good GUI, ideally this would involve some local or API model with computer use (which is terrible on Wayland Linux AFAIK)
- On top of that need to pick some architecture with solid equivalent to Playwright that works on Wayland Linux
### Mobile PWA
- I don't listen to music on my phone. I was originally tempted to skip most buttons and make LineByLine hotkey-only at one point because it was the most efficient interface on PC. I could see giving buttons on a smaller screen another pass
### Publish directly to LRCLIB
- Not my project and I'm hesitant to touch any kind of auth