The markdown icons in this page are mostly real app icons. Checkmarks = checked boxes.
### Settings ⚙️
- Default Settings hotkey (`Ctrl+,`); close with `Esc` or clicking outside the window
- Keyboard navigation
    - `Tab` to walk down through Settings options and `Shift+Tab` to walk up
    - `Esc` to reset focus to search field
    - `Spacebar` checks checkboxes
    - Assign hotkeys with `Enter`
    - Reset to default with `Backspace`
    - Clear with `Shift+Backspace`
- The search field lists matching settings by name
- The ⌨️ button searches by hotkey instead.
    - Send a new hotkey in-place for a new search
- Reset hotkey search or clear selected hotkey fields (`Esc`, `Backspace`, `Del`)
- Press `Esc` or click outside the hotkey field to cancel
- Changes apply immediately and persist across sessions to browser `localStorage`
- **Reset defaults** (`Ctrl+\`) affects *all* settings, even input fields in the main window
### Working with lyric files
- 📂 Open song and lyrics separately or together (`Middle Click`, `Ctrl+O`)
- 💾 Save results as external `.lrc` file (`Ctrl+;`) with name of current `[ti: ]` tag
- Paste a song Genius page into the **Main** field to extract clean lyrics
- Toggle **Typing mode** (`` ` ``) to edit lyrics and metadata (⚙️📝**Default metadata tags**)
    - `[ti: ]` prioritizes existing value, song filename, `.lrc` filename, then Genius
    - `[ti: ]`, `[al: ]`, and `[ar: ]` are extracted from Genius pasted lyrics
    - Imported `.lrc` files keep metadata and fallback to default fields
    - Autocomplete in **Typing mode**: `(`, `[`, and `*` insert matching pairs with the caret between; selecting text first wraps the selection
- Opening or pasting another song or `.lrc` file generally overwrites the existing one
    - In **Typing mode**, pasting without metadata tags or Genius patterns appends
- Reloading or closing the tab resets song and lyrics from browser `sessionStorage`
### Playback controls
- Seek (default **Seek increment** 5s) by
    - Clicking, dragging, or scrolling over the seek bar
    - Using `←`/`→` in **Hotkey mode** or `Ctrl+1`/`Ctrl+2` in any mode
    - Clicking the left/right media buttons
- Click a line to jump to it and play from timestamp
- Play/pause with `Space` in **Hotkey mode** or `Shift+Space` in any mode
- Adjust playback speed with `Ctrl+ArrowDown`/`Ctrl+ArrowUp` and reset speed to 1 with `Ctrl+ArrowRight` 
    - Each adjustment multiplies the current speed by the⚙️📝**Speed ratio** 
- Scrolling over volume bar changes it by the ⚙️📝**Volume increment**
- Mute snaps the volume slider to 0; unmute restores its previous position
### Syncing and reviewing lyrics
- The **playing line** is highlighted for the duration of a synced line
- | The active line has a blue left border
    - It's the target of syncing and timestamp adjustments
    - It moves when
        - Navigating with `Q`/`E` in **Hotkey mode** or `↑`/`↓` in any mode
        - The line is synced with (`W`, `Enter`)
- Adjust timestamps of selected line(s) in **Offset time** mode
    - Four ⚙️**Intervals**: large `X`/`C`, medium `S`/`D`, small `A`/`F`, and tiny `Z`/`V
    - Select <u>multiple lines</u> with `Shift+Click` or `Shift+↑/↓`
- Review timestamps with `R`/`Shift+R` and **Seek offset**
    - In **Offset seek** toggle mode (``Shift+` ``), Controls adjust **Seek offset** instead of timestamps
    - **Sync file** (``Ctrl+I ``) adjusts all timestamps by the current **Seek offset**, then resets the offset to the default (−600ms)
- Delete the active line with `G` in **Hotkey mode**
    - Refuses to delete metadata lines or the only remaining content line
    - Undo with `Ctrl+Z` if accidentally deleted
- Automatically replay lines to review-in-place with ⚙️**Instant Replay** triggers
    - These automatically move the selected line following **Seek offset**
        - ⚙️✅"Moving to previous line" (`Q`)
        - ⚙️✅"Moving to next line" (`E`)
        - ⚙️✅"Playing another line" (`Click` or pause and resume on another line)
    - ⚙️✅"Resuming currently playing line" (`Space`)
    - ⚙️✅"Syncing line" (`W`, `Enter`)
    - ⚙️✅"Adjusting timestamp" (`A`,`S`,`D`,`F`,`Z`,`X`,`C`,`V`)
- Reduce the ⚙️📝**Undo window** (default 150 ms) if too many edits are undone per step
### Adding translations
- **Add**/**Hide**/**Merge** fields (`Ctrl+3`, `Ctrl+4`, `Ctrl+5`)
    - Paste Genius lyrics into a **Secondary** field to extract clean lyrics
    - `Middle click` a secondary field or click its 📂 button to open a `.lrc` file
    - Secondary ✅"( )" wraps translations with parentheses to indicate "not main lyrics"
- Merged lyrics are offset 0.01 seconds from the next main field timestamp
- This prevents music players like Feishin from highlighting them to reduce clutter
- **Merge fields** if:
    - Main lyrics have timestamps, including final trailing timestamp
    - Main and secondary fields have the same number of lyric lines
- Mark individual lines as translations with `Ctrl+ArrowLeft`
    - Main ✅"( )" automatically wraps these with parentheses and capitalizes the first letter if lowercase
    - Main ✅"↩"
        - Moves existing inline translations that are in parentheses to new lines
        - Marks them as translations
    - Lyrics added while ↩ is checked will be batch converted
### Publishing .lrc files to LRCLIB with LRCGET + LineByLine
#### 1. Load an audio file
1. Open LRCGET and add an library directory to watch.
2. Copy the song's audio file if the directory is a temporary working folder and not your real music library
3. Click the three vertical dots in LRCGET's top right corner
4. Click **`⟳ Refresh library`**
#### 2. Prepare a lyrics file
Skip this section if you already have one.
1. Search for the song in the `LRCLIB` tab of the main LRCGET window
2. Click the eye icon on the song's row to confirm it's the right one
3. Click the editing icon on the song's row
4. Click **`CHOOSE FILE...`** and pick your autodetected song from library
5. Click **`EDIT WITH AUDIO`**
6. Click the **`SYNCED`** tab of the lyrics editor
7. Click the ⌄ dropdown next to **`SAVE`** -> **`EXPORT TO TRACK'S DIRECTORY`**/**`[✔️] Synced lyrics (.lrc)`** -> **`EXPORT`**. Or use the main screen **`EXPORT`** button.
8. Open in LineByLine to edit and save somewhere you can find it
#### 3. Import and publish
1. Click the first row of the **`SYNCED`** tab
2. Hold `Backspace` to delete all existing lines
3. Click **`IMPORT LRC FILE`** and find your edited `Song Filename.lrc` file
4. Click the play button in the **`SYNCED`** tab. Listen to verify timestamp positions. Make minor corrections directly in LRCGET to save time
5. Click the **`PLAIN`** tab in the lyrics editor
6. Paste in corrected lyrics or clear existing ones and **`IMPORT FROM SYNCED LYRICS`**
7. Click the ⌄ dropdown next to **`SAVE`** -> **`SAVE AND PUBLISH`** -> **`PUBLISH NOW`**

**License:** [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html)
