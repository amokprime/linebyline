#### Comments
- This is a list of tests I couldn't automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before updating index.html and/or tagging any version as a new release

#### Test files
1. Latest /archive/semantic/X.XX.X/linebyline-X.XX.X.html
2. /tests/media/audio.mp3
3. /tests/media/synced_english.lrc
#### File picker window
- [x] Open test file 1 and verify that clicking the 📂 button opens a normal looking file picker window

#### Genius
- [x] Visit the Genius website and test pasting a real page in case the website layout changed

#### Playback
- Open test files and play the song. Verify that its audio:
- [x] Sounds "normal"
- [x] Moves the seek bar steadily
- [x] Plays when muted and then unmuted
- [x] Sounds quieter or louder depending on volume changes
- [x] Slows down when pressing `Ctrl+1`
- [x] Speeds up when pressing `Ctrl+2`

#### Instant Replay
- Check all the Instant Replay options in Settings. Verify that: 
	- −600 ms is visible over the speaker icon
	- Audio starts playing from the end of the previous line for about 0.6 seconds (instead of the exact start of the current line) when:
- [x] Pressing `R`
- [x] Moving to previous line
- [x] Moving to next line
- [x] Resuming currently playing line
- [x] Playing another line
- [x] Adjusting seek offset
- [x] Syncing line
- [x] Adjusting timestamp

#### Undo debounce
- Open test file 1 and verify in Typing mode that:
- [x] Typing "abc" very quickly (as fast as possible) inline gets undone and redone in one step
- [x] Typing "abc" slowly (about 1-2 letters/second) inline gets undone and redone in three steps
- [x] Typing "a", then "b", then "c" very quickly on newlines get undone and redone in one step
- [x] Typing "a", then "b", then "c" slowly on newlines get undone and redone in five steps

#### Unsaved work warning
- Open test files and check the popup is triggered by:
- [x] `Ctrl+W` / `Alt+F4` (some OSes might intercept this before the browser)
- [x] Middle click on LineByLine browser tab
- [x] Clicking the browser tab `x` close button
- [x] Clicking the browser close button