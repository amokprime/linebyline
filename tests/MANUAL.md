#### Comments
- This is a list of tests I couldn't automate with Playwright
- This file plus Playwright tests supersedes CHECKLIST.md
- I will run them in a real browser before updating index.html and/or tagging any version as a new Release

#### Test files
1. Latest /archive/semantic/X.XX.X/linebyline-X.XX.X.html
2. /tests/media/audio.mp3
3. /tests/media/synced_english.lrc

#### File picker window
- [ ] Open test file 1 and verify a normal looking file picker window appears
- [ ] Select test files 2 and 3 at the same time and verify opening both together works

#### Playback
- Open test files and play the song. Verify that its audio:
- [ ] Sounds "normal"
- [ ] Moves the seek bar steadily
- [ ] Stops when paused
- [ ] Resumes when resumed
- [ ] Mutes when muted
- [ ] Plays when unmuted
- [ ] Sounds quieter or louder depending on volume changes
- [ ] Slows down when pressing `Ctrl+1`
- [ ] Speeds up when pressing `Ctrl+2`

#### Instant Replay
- Check all the Instant Replay options in Settings. Verify that audio playback is offset for:
- [ ] Pressing `R`
- [ ] Moving to previous line
- [ ] Moving to next line
- [ ] Resuming currently playing line
- [ ] Playing another line
- [ ] Adjusting seek offset
- [ ] Syncing line
- [ ] Adjusting timestamp

#### Undo debounce
- Open test file 1 and verify that:
- [ ] Typing "abc" very quickly inline gets undone and redone in one step each
- [ ] Typing "abc" slowly inline gets undone and redone in three steps each
- [ ] Typing "a", then "b", then "c" very quickly on newlines get undone and redone in one step each
- [ ] Typing "a", then "b", then "c" slowly on newlines get undone and redone in five steps each

#### Unsaved work warning
- Open test files and check the popup is triggered by:
- [ ] `Ctrl+W`
- [ ] `Alt+F4`
- [ ] Middle click on LineByLine browser tab
- [ ] Clicking the tab `x` close button
- [ ] Clicking the browser close button