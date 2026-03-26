>Would building the app as a web app instead solve these installation issues? Would it be significantly harder for you to build or lack features?

**Short answer: yes it solves the install problem, but you lose audio playback.**

Here's the honest breakdown:

**Solved by going web:**

- Zero installation — just open `index.html` in a browser (or a bundled Electron/Tauri shell if you want a proper window)
- No Python, no pip, no version conflicts
- Runs identically on Windows and Linux today

**What you lose:**

- **Audio playback** — browsers can play audio fine, but they block filesystem access for security reasons. You can import an audio file via a file picker and the browser will hold it in memory for that session, but you can't read audio tags from it with a JS library as reliably as mutagen, and reopening the app next session means re-importing the file. The progress bar, seek-to-line, and play/pause all still work within a session.
- **File watching** — browsers can't watch a file on disk for external changes (the Notepad live-reload feature). You'd lose that.
- **Autosave of the audio path** — you can autosave the lyrics text to `localStorage`, but the browser can't reopen the audio file automatically on next launch without you picking it again.
- **System media keys** — not reliably available in a plain browser tab (the Media Session API works in Chrome but is limited).
- **Native window chrome** — you'd just get a browser tab unless you wrap it in Electron/Tauri, which adds complexity.

**What stays the same or gets easier:**

- All text editing, LRC parsing, timestamp syncing, merge logic, hotkeys, settings — all straightforward in JS, arguably simpler than PyQt
- The `.lrc` import/export works fine via file picker
- Easier for me to build, honestly — HTML/CSS/JS layout bugs are much easier to preview and fix than Qt stylesheet quirks

**My recommendation:** If you're okay with re-picking the audio file each session and losing file-watching, a plain single-file HTML app is strictly better for you — no install, no version drama, works forever. The core workflow (paste lyrics, sync timestamps, export .lrc) is entirely unaffected.

If audio persistence across sessions matters a lot, the cleanest path is still Python 3.12 + PyQt6, since that install is one command with zero complications on 3.12.

Which matters more to you?
___
>I'm leaning toward the web app - I don't want to install an older and maybe less secure Python just for one app. One change - since the browser can't read file tags, it becomes more important to have a clean fallback for those. Update the default metadata fields with explicit unknown names like this. And remove obsolete lrcgenerator.com reference since the app can strip headers and metadata on its own.

```
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: Genius, GeniusLyricsCopier, thisappname]
[by: me]
```

>Would it be possible to also do what GeniusLyricsCopier add-on does (get a relatively clean copy of Genius lyrics without the ads) in the app, either from genius.com link in clipboard or pasting in a field in the app?

Good call on the defaults. On the Genius scraping question — here's the honest answer:

**Technically yes, practically risky for longevity.** Genius's page structure changes periodically and any scraper breaks silently when it does, leaving you with garbage or nothing. Since you specifically want the app to survive without updates, this is a bad fit. GeniusLyricsCopier itself has broken and been patched multiple times over the years.

The deeper issue is that browsers block cross-origin requests, so a web app can't fetch `genius.com` directly — it would need a proxy server running locally, which reintroduces the Python dependency you're trying to avoid.

**What I'd suggest instead:** keep using GeniusLyricsCopier for the copy step (it's a browser extension, already installed, already working) and just paste the result into the app. The app can then handle stripping whatever headers/metadata GeniusLyricsCopier leaves behind via the existing strip-on-import settings. That way the scraping responsibility stays with the extension that's actively maintained for it.

**On the default metadata change** — ready to confirm before I carry it into the build: you want `thisappname` kept as a literal placeholder in `[re:]` that you'll replace once you have a name, correct? And do you want me to go ahead and build the web app version now with that change and the other confirmed design decisions from the mockups?
___
>Actually I need to think of a real name for the app. Is there a tool that can look up existing brand names, github/gitlab project names, etc.?

There's no single tool that checks all of those at once, but here's the practical workflow most people use:

**Domain/brand name:**

- [namecheckr.com](https://www.namecheckr.com/) — checks the name across dozens of platforms simultaneously (GitHub, Reddit, Twitter/X, Instagram, domain TLDs, etc.) in one search. This is probably the most useful single tool for your purpose.
- [instantdomainsearch.com](https://instantdomainsearch.com/) — faster for just checking domain availability if that matters to you.

**GitHub/GitLab specifically:**

- Just try `github.com/youridea` and `github.com?q=yourname` in a browser — GitHub's search will surface existing repos and orgs with that name. GitLab is the same pattern.
- Neither has an official "is this name taken" API for project names since anyone can have a repo called anything under their own account — what actually matters is whether the _username/org_ is taken.

**npm (if you ever publish the web app as a package):**

- [npmjs.com](https://npmjs.com/) search, or `npm info yourname` in a terminal.

**PyPI (less relevant now but if Python version ever gets published):**

- Same, just search pypi.org.

namecheckr.com is probably your one-stop-shop here. Once you have a name you like and it clears there, spot-check GitHub search for existing LRC-related projects with that name and you're good.
___
>https://www.namecheckr.com/ Error 503 - Service Unavailable We are currently down for maintenance. How well can you perform the check instead?

I can check GitHub and do a general web search, but I can't check domain registrars or most social platforms directly. Still, for an open source desktop-style tool where GitHub availability is what matters most, that covers the important bases.

What name(s) are you considering? Give me your candidates and I'll search them.
___
 >Order of preference:
>1. LineByLine
>2. LyricEdit
>3. LyricSync
>4. LyricMark

Here's the rundown:

- **LineByLine** — no GitHub project using this exact name as an LRC/lyrics tool. The phrase appears descriptively in several repos but nobody has claimed it as a project name. ✅ Clear
- **LyricEdit** — taken: [github.com/BYJRK/LyricEditor](https://github.com/BYJRK/LyricEditor) (C#/WPF, Chinese, active) and [github.com/kljzndx/Lyric-Editor](https://github.com/kljzndx/Lyric-Editor). Close enough that it would cause confusion. ❌ Avoid
- **LyricSync** — taken: [github.com/DBKarman/lyricsync](https://github.com/DBKarman/lyricsync) and [github.com/Dantescur/lyricsync](https://github.com/Dantescur/lyricsync) (two separate projects). ❌ Avoid
- **LyricMark** — no results at all. ✅ Clear

So your options in order of preference that are actually available are **LineByLine** first, **LyricMark** second. LineByLine is the stronger name for what the app does — it's descriptive, memorable, and distinctive from the existing field.
___
One more feature: Add a hotkey to insert a line end timestamp (default R) on a newline by itself. Wherever such a timestamp exists, it and not the next timestamp with an actual line of text should be used as the endpoint for any translations to offset from (since normally the next timestamp with a line of text would double as the end of the previous line). Then (if no concerns) build the web app with this default metadata for now:

```
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: Genius, GeniusLyricsCopier, LineByLine]
[by: me]

```

No concerns — this is a clean addition. The merge logic already looks ahead for the next timestamp to offset translations against; I just need to make it prefer a bare-timestamp line (no text after the bracket) over the next lyric line when one exists in between. The `R` hotkey inserts `[MM:SS.cc]` on a new line with nothing after it.

Building now.Single file, no install — just open `linebyline.html` in Chrome or Edge. Settings and lyrics autosave to `localStorage` so they persist across sessions.

**What's in this build:**

- All hotkeys including `R` for end timestamp, `Tab` for mode toggle
- Import audio + LRC (two file pickers in sequence), export named from `[ti:]`
- Audio playback with progress bar and seek-on-click
- Secondary fields with line count warnings, brace autocomplete, scroll sync, and merge with end-timestamp awareness
- Settings with live hotkey capture
- Undo/redo stack (up to 200 steps)
- Title bar and left panel update from `[ti:]`/`[ar:]`/`[al:]` metadata, falling back to "Unknown"

**Known gap to address next:** the main field is rendered as styled divs (for line highlighting) but direct in-place typing isn't wired up yet — currently you paste full lyrics in, use hotkeys to sync, and double-click a line to edit it individually. Full inline typing in the main field is the next thing to tackle.