# LineByLine

### AI Disclosure
I am not a developer. This is my first major🚨🌈VIBECODED🌈🚨project and first GitHub repo — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️.
Features are designed by me and reviewed with AI. AHK scripts, some markup edits, and documentation like this README are written by me.
Prompt history and older versions are shared in [/archive](https://github.com/amokprime/linebyline/tree/main/archive). See what I'm working on [here](https://share.note.sx/9wimmaly). 
### About
**LineByLine is an opinionated web app for manual line-by-line lyrics syncing.** It was created to improve my workflow for publishing lyrics to [LRCLIB](https://lrclib.net/):
1. Find original lyrics from [Genius](https://genius.com/) or LRCLIB, or DuckDuckGo if really obscure
2. Extract clean lyrics from Genius with GeniusLyricCopier extension
3. Strip sections with https://www.lrcgenerator.com/
4. Add song and lyrics to https://seinopsys.dev/lrc
5. Use AutoHotkey to workaround hotkey limitations (see [/archive/autohotkey](https://github.com/amokprime/linebyline/tree/main/archive/autohotkey))
6. Go back to Genius or DuckDuckGo for metadata and translations
7. Review in [LRCGET](https://github.com/tranxuanthang/lrcget) and Publish

LineByLine combines 2-4 and eliminates 5, maybe 6 if no translations are required.
### Features
**Extensive hotkey support**
- Traditional play/pause and seek controls
- Control speed gradually with a configurable multiplicative ratio
- Adjust timestamps forwards/backwards by 4 different amounts
- `Tab`/`Shift+Tab` through all buttons and settings
- Almost every button has a dedicated hotkey
- Persistently remap hotkeys in Settings
- See [LIMITATIONS.md](https://github.com/amokprime/linebyline/tree/main/LIMITATIONS.md) for known browser restrictions

**Enhanced LRCGET-style replay**
- LineByLine can jump to the start (`R`) or end (`Shift+R`) of a line with a seek offset
	- The default is -600ms before to give you more reaction time
	- Adjust seek offset with the same keys that offset timestamps by toggling from Offset time → Offset sync mode (``Shift+` ``) 
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
- Translations are parenthesized inline and wrap if the viewer is too narrow
- Every line gets highlighted (marked below with `**`)

```
[00:00.00] **I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)**
[00:03.06] **That smell (Cette odeur) (Ese olor)**
[00:06.35]
```

How LineByLine merges translations:
- Translations go on their own line so every line is a sane length and alignment
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
It disturbs my concentration ←Before
[00:08.08]
---
[00:00.00] **I wish I could identify that smell**
[00:03.06] **That smell**
[00:06.35] **Cela perturbe ma concentration**
[00:08.07] (It disturbs my concentration) ←After
[00:08.08]
```

Existing inline translations can be batch converted to the merged style by enabling the ↩ checkbox and importing the lyrics or using `Ctrl+ArrowLeft` on individual lines:
```
Before↓
[00:00.00] I wish I could identify that smell (J'aimerais pouvoir identifier cette odeur) (Ojalá pudiera identificar ese olor)
[00:03.06] That smell (Cette odeur) (Ese olor)
[00:06.35]
---
After↓
[00:00.00] I wish I could identify that smell
[00:03.04] (J'aimerais pouvoir identifier cette odeur)
[00:03.05] (Ojalá pudiera identificar ese olor)
[00:03.06] That smell
[00:06.33] (Cette odeur)
[00:06.34] (Ese olor)
[00:06.35]
```

### Getting started
Visit the app's GitHub Page or download from the [Releases](https://github.com/amokprime/linebyline/releases) page or [/docs/index.html](https://github.com/amokprime/linebyline/tree/main/docs/index.html). Also see the [HELP](https://github.com/amokprime/linebyline/blob/main/HELP.md) file (linked to with the "?" button in the app).

### Not planned for now
1. AI transcription
	1. Unreliable transcription. Maybe useful for syncing if the vocals have clear beginnings and endings
	2. Out of scope for current architecture of this app. I could imagine a Bring Your Own AI but I don't have experience with MCP
2. Word-by-word syncing
	1. LRCGET has this
	2. Would need to refactor LineByLine (enhanced .lrc support and more hotkey modes)
		1. Per-line without trailing timestamp
		2. Per-line with trailing timestamp
		3. Per-word with trailing timestamp
	3. Can't [dogfood](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) the output (I use Navidrome/Feishin which don't highlight per word yet)
3. Desktop app
	1. Unreliable AI oneshot output
	2. Fewer free QA/UI resources
4. Mobile PWA - see 2.2, 2.3 (I don't listen to music on my phone)
5. Publish directly to LRCLIB - see 2.1 and 3