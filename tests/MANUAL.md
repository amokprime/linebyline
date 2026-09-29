#### Comments
- This is a list of tests I couldn't fully automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before a new release
- The browser will be reloaded between tests (and between items for undo debounce)
- Start the server with `srv` and open `http://localhost:5173/linebyline/` in a real browser

#### Test files
1. /tests/media/audio.mp3
2. /tests/media/synced_english.lrc
3. /tests/media/10k_lines.lrc

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
- [ ] `Tab` several times and press `Esc` to escape tab selection, then press `ArrowUp` or `ArrowDown` to verify hotkeys work again

#### Instant Replay
- Open `audio.mp3` and `synced_english.lrc` and check all the Instant Replay options in Settings. Verify that:
    - −600 ms is visible over the speaker icon
    - Audio starts playing from the end of the previous line for about 0.6 seconds (instead of the exact start of the current line) when:
- [ ] Moving to previous line
- [ ] Moving to next line
- [ ] Resuming currently playing line
- [ ] Playing another line
- [ ] Syncing line
- [ ] Adjusting timestamp
- [ ] Adjusting seek offset

#### Hotkeys (real browser)
- [ ] `Ctrl+;` (open) opens the file picker
- [ ] `Ctrl+O`/`Middle click` (open) opens the file picker

#### Genius paste
- Visit the Genius website and test copy-pasting a real page in case the website layout changed
    - [ ] Paste a Genius page in Hotkey mode — verify `[ti:]`, `[ar:]`, `[al:]` are extracted and `[re:]` includes "Genius"
    - [ ] Paste a Genius page in Typing mode — verify same metadata extraction

#### Unsaved work warning
- Open `audio.mp3` and `synced_english.lrc` and verify the popup is triggered by:
	- [ ] `Ctrl+W` (some OSes might intercept this before the browser)
	- [ ] Middle click on LineByLine browser tab
	- [ ] Clicking the browser tab `x` close button
	- [ ] Clicking the browser close button
