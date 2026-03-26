# LineByLine

### AI Disclosure
Design and documentation are by me and reviewed with 🤖Claude Sonnet 4.6.
Chat history and older versions are in /archive. AHK scripts are by me.
The actual app is 🚨🌈VIBECODED🌈🚨 — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️
### About
**LineByLine is an opinionated web app for manual line-by-line lyrics syncing.** It was created to improve my workflow for publishing lyrics to LRCLIB:
1. Find original lyrics on Genius or LRCLIB
2. Extract clean lyrics from Genius with GeniusLyricCopier
3. Strip sections with https://www.lrcgenerator.com/
4. Add song and lyrics to https://seinopsys.dev/lrc
5. Use AutoHotkey to workaround hotkey limitations (see archive/autohotkey)
6. Go back to Genius or DuckDuckGo for metadata and translations
7. Review in LRCGET and Publish

LineByLine combines 2-4 and eliminates 5, maybe 6 if no translations are required.
### Features
**Extensive hotkey support**
- Traditional play/pause and seek controls with configurable increment (default 5s)
- Speed controls with configurable ratio that multiplies against the current speed
- Timestamps can be offset forwards or backwards by four different configurable amounts with eight different single-letter hotkeys.
- Use Tab to toggle between Hotkey mode → Typing mode.
- Remap almost every hotkey in Settings. All Settings persist in browser localStorage.
- See LIMITATIONS.md for known browser restrictions.

**Enhanced LRCGET-style replay**

- LineByLine can jump to the start of a line with a configurable seek offset (default `R` key). The default is -600ms before to give you more reaction time. Adjustable by the same keys that normally offset timestamps by toggling Offset time → Offset sync mode with the Backtick key.
- Optional triggers for more frequent replays
	- Play every line with the seek offset
	- Batch offset all timestamps by the seek offset
	- Jump to the end of lines with `Shift+Space`
	- Replay after every sync or offset to check timing

**Lyrics and metadata extraction**
- Get song title from filename (prioritizing audio file then .lrc file)
- Get song title, artist, album, and lyrics from raw pasting Genius webpage
- Preserve existing populated metadata fields
- Configure default metadata fields as a fallback

**Merging translations**

How I used to add translations:
- Translations are parenthesized inline and wrap if the viewer is too narrow.
- Every line gets highlighted

[00:05.00] **Hello, how are you? (Hola, ¿cómo estás?) (Bonjour, comment ça va ?)**

[00:06.00] **What is your name? (¿Cómo te llamas?) (Comment t'appelles-tu ?)**

[00:07.00]


The current method used in LineByLine:
- Translations go on their line so every line is a sane length and alignment
- Music players highlight the 0.01s duration translations for a split second or not at all

[00:05.00] **Hello, how are you?**

[00:05.89] (Hola, ¿cómo estás?)

[00:05.99] (Bonjour, comment ça va ?)

[00:06.00] **What is your name?**

[00:06.89] (¿Cómo te llamas?)

[00:06.99] (Comment t'appelles-tu ?)

[00:07.00]


### Getting started
Visit this repo's GitHub Page or download the latest [Release](https://github.com/honeypotfields/linebyline/releases). Also see the HELP.md file or the "?" button in the app.

### Contributing
Any human web developers willing to review vibe code are welcome🧡. Or even Python developers! This was originally going to be a Python app [archive/0_abandoned](https://github.com/honeypotfields/linebyline/tree/main/archive/0_abandoned). There are advantages to a real desktop program (LIMITATIONS.md); the problem is figuring out dependencies.
See TEST_CASES.md for a checklist of everything that's supposed to work.

### In progress
- CREDITS.md, LIMITATIONS.md, TEST_CASES.md
- Public repo with GitHub code scanning
- GitHub Page

### Maybe someday
- PyAutoGUI scripts to detect regressions before merging Claude code
- Python port with more supported hotkeys

### Not planned for now
- AI transcription - beyond the scope of a single-file .html web app
- Word-by-word syncing - hard to imagine doing that manually
- Mobile PWA - would need a radically different UI and have maybe 0.3 global users
