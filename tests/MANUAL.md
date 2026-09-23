#### Comments
- This is a list of tests I couldn't automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before updating index.html and/or tagging any version as a new release
- The browser will be reloaded between tests (and between items for undo debounce)
- Start the server with `srv` and open `http://localhost:5173/linebyline/` in a real browser

#### Test files
1. /tests/media/audio.mp3
2. /tests/media/synced_english.lrc
3. /tests/media/10k_lines.lrc

#### File picker window
- `[ ]` Open/reload just the app and verify that clicking the 📂 button opens a normal looking file picker window

#### Playback and focus
- Open `audio.mp3` and `synced_english.lrc` and play the song. Verify that its audio:
    - `[ ]` Sounds "normal"
    - `[ ]` Moves the seek bar steadily
    - `[ ]` Still plays when mute button is toggled on and off
    - `[ ]` Sounds quieter or louder depending on volume slider changes
    - `[ ]` Slows down when pressing `Ctrl+1`
    - `[ ]` Speeds up when pressing `Ctrl+2`
- Verify that clicking the following buttons does not steal focus from main field by pressing `ArrowUp` or `ArrowDown` immediately after clicking:
    - `[ ]` Increase font size or Decrease font size
    - `[ ]` Increase speed or Decrease speed
    - `[ ]` Collapse panel or Expand panel
    - `[ ]` Seek back or Seek forward
    - `[ ]` Play/pause
    - `[ ]` Mute/unmute
    - `[ ]` Sync file
    - `[ ]` Seek offset increase or decrease
- `[ ]` `Tab` several times and press `Esc` to escape tab selection, then press `ArrowUp` or `ArrowDown` to verify hotkeys work again

#### Seek bar
- `[ ]` Clicking the seek bar at different positions seeks to the correct time (not just the halfway mark)
- `[ ]` Dragging the seek bar seeks to the dragged position (audio should pause during drag, not play staccato)
- `[ ]` Scrolling over the seek bar seeks by the seek increment

#### Instant Replay
- Open `audio.mp3` and `synced_english.lrc` and check all the Instant Replay options in Settings. Verify that:
    - −600 ms is visible over the speaker icon
    - Audio starts playing from the end of the previous line for about 0.6 seconds (instead of the exact start of the current line) when:
- `[ ]` Moving to previous line
- `[ ]` Moving to next line
- `[ ]` Resuming currently playing line
- `[ ]` Playing another line
- `[ ]` Syncing line
- `[ ]` Adjusting timestamp
- `[ ]` Adjusting seek offset

#### Active line highlighting
- `[ ]` The active line (cursor) has a blue left border visible in both light and dark themes
- `[ ]` The playing line has a highlighted background (active-bg)
- `[ ]` Navigating with `Q`/`E` (Hotkey mode) or `ArrowUp`/`ArrowDown` (any mode) moves the blue border to the new active line
- `[ ]` Syncing a line with `W`/`Enter` moves the highlight to the synced line

#### Hotkeys (real browser)
- `[ ]` `Ctrl+'` (save) triggers a download
- `[ ]` `Ctrl+;` (open) opens the file picker
- `[ ]` `Ctrl+,` (settings) opens the Settings dialog
- `[ ]` `Ctrl+.` (theme toggle) cycles the theme
- `[ ]` `Ctrl+\` (reset defaults) opens Settings and shows the reset confirm flow (Yes/No dialog)
- `[ ]` `Ctrl+Shift+~` (toggle panel) collapses/expands the NOW PLAYING panel
- `[ ]` `Ctrl+O`/`Middle click` (open) opens the file picker
- `[ ]` `Ctrl+4`/`Ctrl+5`/`Ctrl+6` (add/hide/merge fields) work

#### Settings dialog
- `[ ]` Clicking the ⌨ icon toggles hotkey search mode and returns focus to the search field
- `[ ]` Pressing `` ` `` toggles hotkey search mode and keeps focus on the search field
- `[ ]` Clicking "Reset defaults" button then "Yes" (or `Enter`) resets all settings

#### Refresh behavior
- `[ ]` Import `audio.mp3` + `synced_english.lrc`, then refresh the page — both lyrics and audio should be reset (empty editor, no audio loaded)
- `[ ]` Open `http://localhost:5173/linebyline/` in a new tab — should start fresh (no lyrics, no audio)

#### Genius paste
- Visit the Genius website and test copy-pasting a real page in case the website layout changed
    - `[ ]` Paste a Genius page in Hotkey mode — verify `[ti:]`, `[ar:]`, `[al:]` are extracted and `[re:]` includes "Genius"
    - `[ ]` Paste a Genius page in Typing mode — verify same metadata extraction

#### Undo debounce
- Open/reload just the app and verify the following in Typing mode, reloading the page after each item:
- `[ ]` Typing "abc" very quickly (as fast as possible) inline gets undone and redone in one step
- `[ ]` Typing "abc" slowly (about 1-2 letters/second) inline gets undone and redone in three steps
- `[ ]` Typing "a", then Enter, then "b", then Enter, then "c" very quickly on newlines get undone and redone in one step
- `[ ]` Typing "a", then Enter, then "b", then Enter, then "c" slowly on newlines get undone and redone in five steps

#### Unsaved work warning
- Open `audio.mp3` and `synced_english.lrc` and verify the popup is triggered by:
- `[ ]` `Ctrl+W` (some OSes might intercept this before the browser)
- `[ ]` Middle click on LineByLine browser tab
- `[ ]` Clicking the browser tab `x` close button
- `[ ]` Clicking the browser close button

#### Huge file import
- `[ ]` Open `10k_lines.lrc` and verify a blocking popup appears and does not allow importing the 10,000 lines of lyrics
