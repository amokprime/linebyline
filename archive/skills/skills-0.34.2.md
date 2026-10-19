First, let me find the latest version in the semantic archive.
Good. Now I'll read all the needed files in parallel — the four root .md files, the app, and my own skills from Claude's filesystem (they should already be in context from earlier this session, but I'll verify they're current).
Now let me read the HTML app — it's large so I'll copy it to Claude's filesystem:
I now have everything I need. Let me compare against the skills I wrote earlier this session and identify the diffs:
Good — I have a clear picture now. Let me enumerate the actual gaps versus what the app does, then apply the updates:

**`single-file-html-app` updates needed:**

1. `structuredClone` wasn't available in older browsers — the app uses `JSON.parse(JSON.stringify(...))` which is more compatible; skill should note this
2. The app stores theme, font, and volume as _separate_ `localStorage` keys (not inside `cfg`) — the skill's storage table says "Volume, theme, font → localStorage" but doesn't mention this pattern explicitly; worth clarifying
3. The app separates non-config state storage (theme, vol, font) with their own `localStorage.getItem` calls at declaration time, not inside `loadCfg` — the skill conflates these
4. The app deletes deprecated keys from config (`delete c.hotkeys.mute`) — migration section should mention removal, not just renaming
5. `HK_SECTIONS` grouping for Settings display is a real pattern worth capturing

**`browser-hotkey-system` updates needed:**

1. `Escape` is in `RESTRICTED_ALL` in the app but not in the skill's set — significant omission since it's used for overlay-close and must stay free
2. The skill's example `isRestrictedForKey` hardcodes `Ctrl+S`/`Ctrl+Z` as examples, but the real pattern is that _any_ hotkey with a fixed slot gets a guard — the skill should clarify this is app-specific, not a template to copy literally
3. `SEC_BLOCKED` in the app includes extra actions beyond `HOTKEY_ONLY`: `clear_sel`, `replay_line`, `replay_end`, `toggle_mode`, `offset_mode_toggle` — the skill's secondary textarea section was simplified and missed this
4. The skill says "Backspace/Delete = unassign" but the app also has a dedicated ✕ clear button (`hk-clear`) that fires separately — worth noting the two clear paths
5. `HK_SECTIONS` grouping (sections with labels in Settings) isn't in the skill at all
6. The skill describes `filterRowsByHotkey` hiding rows, but the actual pattern is `applySettingsFilter` which handles both text search and hotkey search together — the skill's search section slightly misrepresents the real flowNow update the hotkey skill:**Changes applied:**

_`single-file-html-app`_

- `structuredClone` → `JSON.parse(JSON.stringify(...))` (broader browser compatibility; `structuredClone` is newer)
- Migration pattern expanded: now includes removing deprecated keys (`delete c.hotkeys.mute`) and adding missing new keys, not just renaming
- Storage table rewritten: distinguishes `cfg` as one localStorage key vs display prefs (theme, font, volume) as separate individual keys — with a new "Non-config state storage" section showing that pattern
- Added `HK_SECTIONS` grouping pattern for labelled sections in Settings

_`browser-hotkey-system`_

- `'Escape'` added to `RESTRICTED_ALL` — it was in the actual app but missing from the skill, which was a meaningful gap since overlay close depends on it staying free
- `isRestrictedForKey` rewritten with a note that the guards are app-specific — the original used `Ctrl+S`/`Ctrl+Z` as examples which don't match what the app actually reserves and could mislead future use
- Secondary textarea `SEC_BLOCKED` corrected: it's not just `HOTKEY_ONLY` — the app also blocks `toggle_mode`, `offset_mode_toggle`, `clear_sel`, `replay_line`, `replay_end`, and hard-stops `Space`/`Enter`/`Tab`/`Escape` unconditionally; the skill now reflects this and explains why
- Also added `PageUp`/`PageDown` to the passthrough list (present in the app, missing from the skill)
