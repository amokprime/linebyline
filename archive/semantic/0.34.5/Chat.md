I decided to abandon the Python port and revert to linebyline-0.34.4.html - update your memory after the latest round of web app patches in Prompt.md

---

Memory updated. Patched to 0.34.5. Changes below.

**Bugs fixed**

- **Title from .lrc with no `[ti:]`** — lrc-only import now sets `lastImportStem` from the lrc filename when no audio is loaded, and uses it to populate `[ti:]` when the lrc has no title tag.
- **Save fallback to `lyrics.lrc`** — same fix: `lastImportStem` is now set in lrc-only import, so `doSave` can fall back to the lrc filename stem instead of `lyrics`.
- **Undo on .lrc import** — lrc-only import now calls `pushSnapshot()` before replacing the text, so `Ctrl+Z` and the undo button restore the prior state. (The undo stack is no longer reset on lrc-only import.)
- **Auto-strip metadata on .lrc import** — when `strip_metadata + strip_on_lrc`, the merged meta block is replaced with `cfg.default_meta` instead of the lrc's own tags. Applied to both lrc-only and audio+lrc import paths.
- **Auto-strip metadata on paste** — after paste, if `strip_on_paste + strip_metadata`, the leading metadata block in the main field is replaced with defaults.
- **Auto-strip sections on .lrc import** — was already gated on `cfg.strip_on_lrc && cfg.strip_sections`; the metadata fix above unblocked it from being shadowed.
- **Merge button state on reload** — `mergeDone` is now persisted in `sessionStorage` via `doAutosave` and restored in `loadAutosave`, so the button stays disabled after reload if merge was already done.

**Refinements**

- **Help window font** — `#help-body` now uses `var(--editor-font)` and `var(--editor-size)` so it matches the lyrics editor font and size.
- **Inter font** — added to Google Fonts `<link>` in `<head>` and as a third option in the font dropdown.
- **Issues button** — added after the Help button in the menu bar, using the uploaded Lucide `bug.svg` icon inline. Opens `github.com/amokprime/linebyline/issues` in a new tab. Tooltip shows the configured hotkey.
- **Issues hotkey** — `Ctrl+'` added to `DEFAULT_CFG`, `HK_SECTIONS` Menu group (after Help), `HK_LABELS`, `isRestrictedForKey`, `loadCfg` migration, `updateDynamicTooltips`, and global keydown handler.
- **Settings hotkey order** — Menu section now: Open, Save, Undo, Redo, Settings, Toggle theme, Help, Issues.
- **More restricted hotkeys** — added `Ctrl+Z`, `Ctrl+Y`, `Ctrl+X`, `Ctrl+C`, `Ctrl+V`, `Ctrl+E`, `Ctrl+K` to `RESTRICTED_ALL`.

---

---

### Version
Same

### Bugs

- When a .lrc file with no `[ti: ]` metadata field or companion audio file is added, the `[ti: ]` field and Now Playing title are in all lowercase, even if the filename is in title case, sentence case, etc.
	- Saving .lrc file similarly saves as an all lowercase filename
- Importing lyrics with .lrc file and then undoing with `Ctrl+Z` or undo button cannot be redone with `Ctrl+Y` or redo button (to restore the imported lyrics)
- Settings → Auto Strip: Just revert to the default behavior of 0.34.4 (i.e. always cleaning pasted Genius lyrics but not .lrc files, always removing sections, and updating but not overwriting existing metadata.), remove the Auto Strip section Settings, and remove related dead code
- Merge fields button still stays visually (not functionally) enabled if the user forgoes merging fields when it is allowed and reloads the page - just disable it on app exit/reload if enabled (or on startup if either: it would be cleaner and not visually perceptible, or if on exit is impossible)

### Refinements

- Remove the Inter font
- Remove Google related code
- Replace all Courier fonts with ui-monospace or monospace family (don't add to font dropdown)
- Remove references to Microsoft-specific fonts like Segoe UI, Georgia, Courier New, and variants
- When a user hovers the Issues button, expose the URL it would open in the browser lower-left corner

---

**Bugs fixed**

- **Lowercase title/filename from .lrc** — `stemOf` now preserves original filename casing. Previously `.toLowerCase()` forced everything lowercase for `lastImportStem`, `[ti:]`, and save filename.
- **Undo/redo on .lrc import** — `pushSnapshot()` called twice: before replacing text (saves pre-import state) and after (saves post-import state), so both undo and redo work.
- **Auto Strip reverted** — entire Auto Strip Settings section removed, along with the four `cfg` fields, all `openSettings`/`saveSettingsNow`/reset-defaults references, and the four event listeners. `cleanPaste` hardcoded to 0.34.4 behavior: strips sections on paste, never strips metadata, no lrc-import stripping.
- **Merge button on reload** — `updateMergeBtn()` called immediately after `loadAutosave()` in Init, so restored `mergeDone` correctly disables the button before the page is visible.

**Refinements**

- **Google Fonts removed** — three `<link>` tags for fonts.googleapis.com/gstatic.com gone.
- **Inter removed** — dropped from font dropdown and all code.
- **`--font-mono`** updated to `ui-monospace,monospace`.
- **Segoe UI** removed from `body` font stack.
- **Georgia** removed from font dropdown; "System Serif" now uses generic `serif`.
- **Issues URL on hover** — `<button>` replaced with `<a href="..." target="_blank" rel="noopener">` styled identically; browser shows URL in status bar natively. CSS adds `text-decoration:none`.

---
