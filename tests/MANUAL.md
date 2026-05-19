#### Comments
- This is a list of tests I couldn't automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before updating index.html and/or tagging any version as a new release

#### Test files
1. Latest /archive/semantic/X.XX.X/linebyline-X.XX.X.html
2. /tests/media/audio.mp3
3. /tests/media/synced_english.lrc

#### File picker window
- [ ] Open test file 1 and verify that clicking the 📂 button opens a normal looking file picker window

#### Playback
- Open test files and play the song. Verify that its audio:
- [ ] Sounds "normal"
- [ ] Moves the seek bar steadily
- [ ] Plays when muted and then unmuted
- [ ] Sounds quieter or louder depending on volume changes
- [ ] Slows down when pressing `Ctrl+1`
- [ ] Speeds up when pressing `Ctrl+2`

#### Instant Replay
- Open test files and check all the Instant Replay options in Settings. Verify that: 
	- −600 ms is visible over the speaker icon
	- Audio starts playing from the end of the previous line for about 0.6 seconds (instead of the exact start of the current line) when:
- [ ] Pressing `R`
- [ ] Moving to previous line
- [ ] Moving to next line
- [ ] Resuming currently playing line
- [ ] Playing another line
- [ ] Syncing line
- [ ] Adjusting timestamp
- [ ] Adjusting seek offset

#### Genius
- [ ] Visit the Genius website and test pasting a real page in case the website layout changed

#### Undo debounce
- Open test file 1 and verify in Typing mode that:
- [ ] Typing "abc" very quickly (as fast as possible) inline gets undone and redone in one step
- [ ] Typing "abc" slowly (about 1-2 letters/second) inline gets undone and redone in three steps
- [ ] Typing "a", then Enter, then "b", then Enter, then "c" very quickly on newlines get undone and redone in one step
- [ ] Typing "a", then Enter, then "b", then Enter, then "c" slowly on newlines get undone and redone in five steps

#### Unsaved work warning
- Open test files and check the popup is triggered by:
- [ ] `Ctrl+W` / `Alt+F4` (some OSes might intercept this before the browser)
- [ ] Middle click on LineByLine browser tab
- [ ] Clicking the browser tab `x` close button
- [ ] Clicking the browser close button