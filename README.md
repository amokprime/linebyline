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
- LineByLine can jump to the start (`R`) or end (`Shift+R`) of a line with a seek offset
	- The default is -600ms before to give you more reaction time. 
	- Toggle Offset time → Offset sync mode with the Backtick key to adjust seek offset with the same keys that offset timestamps
- Optional triggers for more frequent replays
	- Play every line with the seek offset
	- Batch offset all timestamps by the seek offset
	- Replay after every timestamp sync or seek offset adjustment to check timing

**Lyrics and metadata extraction**
- Get song title from filename (prioritizing audio file then .lrc file)
- Get song title, artist, album, and lyrics from raw pasting Genius webpage
- Preserve existing populated metadata fields
- Configure default metadata fields as a fallback

**Adding translations**

How I used to add translations:
- Translations are parenthesized inline and wrap if the viewer is too narrow.
- Every line gets highlighted (marked here with `**`)

```
[00:00.00] **I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)**
[00:03.06] **That smell (Cette odeur) (Ese olor)**
[00:06.35]
```

How LineByLine merges translations:
- Translations go on their line so every line is a sane length and alignment
- Music players highlight the 0.01s duration translations for a split second or not at all

```
[00:00.00] **I wish I could identify that smell**
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06] **That smell**
[00:06.33] (Cette odeur)
[00:06.34] (Ese olor)
[00:06.35]
```

Sometimes songs intersperse other languages for dramatic effect. Mark translations for such lines individually with `Ctrl+ArrowLeft`:

```
[00:00.00] **I wish I could identify that smell**
[00:03.06] **That smell**
[00:06.35] **Cela perturbe ma concentration**
It disturbs my concentration #Before
[00:08.08]
---
[00:00.00] **I wish I could identify that smell**
[00:03.06] **That smell**
[00:06.35] **Cela perturbe ma concentration**
[00:08.07] (It disturbs my concentration) #After
[00:08.08]
```

### Getting started
Visit this repo's GitHub Page or download the latest [Release](https://github.com/honeypotfields/linebyline/releases). Also see the [HELP](https://github.com/honeypotfields/linebyline/blob/main/HELP.md) file or the "?" button in the app.

### Contributing
See my [TODO](https://github.com/honeypotfields/linebyline/issues/1) for the most recent list of things I am already working on.

Any human web developers willing to review vibe code are welcome🧡. Or even Python developers! This was originally going to be a [Python](https://github.com/honeypotfields/linebyline/tree/main/archive/pre-semantic/0_abandoned) app. There are [advantages](https://github.com/honeypotfields/linebyline/blob/main/LIMITATIONS.md) to a real desktop program; the problem is figuring out dependencies.

If you are also vibe coding and want to reproduce my Claude project setup, see latest [claude_instructions](https://github.com/honeypotfields/linebyline/tree/main/archive/claude_instructions) (including skills), add the latest app version to project files, and share your prompts & Claude output as I have. I would prefer people went ahead and vibe coded their own forks for merging this way. After the recent usage limits, a single version (off peak hours, on a weekend) blows through an entire 5-hour window on a free account!

### Maybe someday
- Playwright to automate QA tests
- Nicer UI from Penpot
- Python port with desktop powers like more supported hotkeys and live editing lyrics

### Not planned for now
- AI transcription - beyond the scope of a single-file .html web app
- Word-by-word syncing - hard to imagine doing that manually
- Mobile PWA - would need a radically different UI and have maybe 0.3 global users
