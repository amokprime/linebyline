#### Comments
- This is a list of tests I couldn't automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before updating index.html and/or tagging any version as a new release
- The browser will be reloaded between tests (and between items for undo debounce)

#### Test files
1. Latest /archive/semantic/X.XX.X/linebyline-X.XX.X.html
2. /tests/media/audio.mp3
3. /tests/media/synced_english.lrc
4. /tests/media/10k_lines.lrc

#### File picker window
- [ ] Open/reload just the app and verify that clicking the 📂 button opens a normal looking file picker window

#### Playback and focus
- Open `audio.mp3` and `synced_english.lrc` and play the song. Verify that its audio:
	- [ ] Sounds "normal"
	- [ ] Moves the seek bar steadily
	- [ ] Still plays when mute button is toggled on and off
	- [ ] Sounds quieter or louder depending on volume slider changes
	- [ ] Slows down when pressing `Ctrl+1`
	- [ ] Speeds up when pressing `Ctrl+2`
- Verify that clicking the following buttons does not steal focus from main field by pressing `ArrowUp` or `ArrowDown` immediately after clicking:
	- [ ] Increase font size or Decrease font size
	- [ ] Increase speed or Decrease speed
	- [ ] Collapse panel or Expand panel
- [ ] `Tab` several times and press `Esc` to escape tab selection, then press `ArrowUp` or `ArrowDown` to verify hotkeys work again

#### Instant Replay
- Open `audio.mp3` and `synced_english.lrc` and check all the Instant Replay options in Settings. Verify that: 
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
- [ ] Visit the Genius website and test copy-pasting a real page in case the website layout changed

#### Undo debounce
- Open/reload just the app and verify the following in Typing mode, reloading the page after each item:
- [ ] Typing "abc" very quickly (as fast as possible) inline gets undone and redone in one step
- [ ] Typing "abc" slowly (about 1-2 letters/second) inline gets undone and redone in three steps
- [ ] Typing "a", then Enter, then "b", then Enter, then "c" very quickly on newlines get undone and redone in one step
- [ ] Typing "a", then Enter, then "b", then Enter, then "c" slowly on newlines get undone and redone in five steps

#### Unsaved work warning
- Open `audio.mp3` and `synced_english.lrc` and verify the popup is triggered by:
- [ ] `Ctrl+W` / `Alt+F4` (some OSes might intercept this before the browser)
- [ ] Middle click on LineByLine browser tab
- [ ] Clicking the browser tab `x` close button
- [ ] Clicking the browser close button

#### Huge file import
- [ ] Open `10k_lines.lrc` and verify a blocking popup appears and does not allow importing the 10,000 lines of lyrics