# LineByLine

### AI Disclosure
I am not a developer. This is my first major🚨🌈VIBECODED🌈🚨project and first GitHub repo, featuring 🤖Claude Sonnet 4.6 — ⚠️USE AT YOUR OWN RISK🗣️🗣️🗣️. Prompt history and older versions are shared in [/archive](https://github.com/amokprime/linebyline/tree/main/archive); Opengrep scans in [/tests/security](https://github.com/amokprime/linebyline/tree/main/tests/security).
Features are designed by me and reviewed with AI. AHK scripts, some markup edits, and documentation like this README are written by me.
### About
**LineByLine is an opinionated web app for manual line-by-line lyrics syncing.** It was created to improve my workflow for publishing lyrics to LRCLIB:
1. Find original lyrics from Genius or LRCLIB, or DuckDuckGo if really obscure
2. Extract clean lyrics from Genius with GeniusLyricCopier extension
3. Strip sections with https://www.lrcgenerator.com/
4. Add song and lyrics to https://seinopsys.dev/lrc
5. Use AutoHotkey to workaround hotkey limitations (see [/archive/autohotkey](https://github.com/amokprime/linebyline/tree/main/archive/autohotkey))
6. Go back to Genius or DuckDuckGo for metadata and translations
7. Review in LRCGET and Publish

LineByLine combines 2-4 and eliminates 5, maybe 6 if no translations are required.
### Features
**Extensive hotkey support**
- Traditional play/pause and seek controls
- Speed controls with configurable ratio that multiplies against the current speed
- Timestamps can be offset forwards or backwards by four different configurable amounts with eight different single-letter hotkeys
- Use `Tab` to toggle between Hotkey mode → Typing mode
- Remap almost every hotkey in Settings. All Settings persist in browser `localStorage`
- See [LIMITATIONS.md](https://github.com/amokprime/linebyline/tree/main/LIMITATIONS.md) for known browser restrictions

**Enhanced LRCGET-style replay**
- LineByLine can jump to the start (`R`) or end (`Shift+R`) of a line with a seek offset
	- The default is -600ms before to give you more reaction time
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
- Translations are parenthesized inline and wrap if the viewer is too narrow
- Every line gets highlighted (marked below with `**`)

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
Visit the app's GitHub Page or download from the [Releases](https://github.com/amokprime/linebyline/releases) page or [/app/linebyline.html](https://github.com/amokprime/linebyline/tree/main/app/linebyline.html). Also see the [HELP](https://github.com/amokprime/linebyline/blob/main/HELP.md) file (linked to with the "?" button in the app).

### Contributing
[This](https://share.note.sx/9wimmaly) Obsidian Share Note has the most recent list of things planned for the next version.

Any human developers willing to review vibe code are welcome🧡.

If you are also vibe coding: I use free plan [claude.ai](https://claude.ai/login) Projects and request many small changes in one prompt (drafted in [Obsidian](https://obsidian.md/)). Steps to reproduce a typical workflow:
1. Add latest [claude_instructions](https://github.com/amokprime/linebyline/tree/main/archive/claude_instructions) (including skills)
2. Add the latest app version to project files and enable memory if using claude.ai
3. Draft Prompt.md in Obsidian if you have a lot of requests and might fatfinger `Enter`.
4. PR Claude's output .html file and Chat.md in a new [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic) subfolder numbered with semantic versioning: Patches=+0.00.1, Minor (features that fit well into existing app)=+0.01.0, Major (refactors that break existing app)=+1.00.0. If Claude doesn't update the output file version you can just rename the app's filename and the title element: `<title>LineByLine 0.34.7</title>`.
Starting with version 0.34.7, *all* releases come with [QA test](https://github.com/amokprime/linebyline/blob/main/tests/CHECKLIST.md) results. It's a manual checklist and I may put it off by:
- Committing minor changes to their own subfolders in [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic) without releasing until several versions later
- Noting minor bugs caught by QA tests as Known Issues rather than patching right away (and immediately obligating a retest for bugs introduced by the patch)

### Maybe someday
- Cross-platform automated QA tests that recognize browser elements (i.e. Playwright)
- UI refactor to look nicer (i.e. Penpot, shadcn/ui, Radix)

### Not planned for now
1. AI transcription - unreliable and maybe out of scope for current architecture of this app
2. Word-by-word syncing - don't know anyone willing to do that manually
3. Desktop app - unreliable AI oneshot output, fewer free QA/UI resources
4. Mobile PWA - see 2 and 3; would also need UI refactor
5. Publish directly to LRCLIB - see 3, safer to keep LRCGET as a final check
