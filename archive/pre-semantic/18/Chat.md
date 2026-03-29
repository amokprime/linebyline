About how much would the undo architecture option (a) increase app size?
___
Let me measure what we're working with and estimate the delta.The current file is **80 KB**. The undo rewrite is purely a JS logic change — no new HTML, no new CSS, no libraries. Here's the breakdown:

**What gets replaced/added:**

- `pushUndo`, `doUndo`, `doRedo`, `setMainText` — currently 10 lines, new versions 20–25 lines (snapshot includes secondary field text array alongside textarea)
- `addSecondary` / `removeSecondary` / `mergeTranslations` / typing-mode paste — each needs one `pushUndo()` call changed to `pushSnapshot()`, 5 call-site changes, no logic change
- New `pushSnapshot()` / `restoreSnapshot()` helpers — 15 lines to serialize `{main, secondaries:[...innerTexts], mergeDone}` into the stack, and restore textarea + repopulate secondary field `innerText` from it

**Estimate:** 30–40 net new lines of JS, roughly **+1–1.5 KB** unminified. The file would go from 80 KB to 81–82 KB — well under the 30 MB limit and not meaningfully different in load time.

The only real constraint is that restoring secondary field content from a snapshot means wiping and re-setting `le.innerText`, which is simple since those fields are `contentEditable` divs. The secondary _columns themselves_ (DOM nodes) would still need to exist — so undo of "remove field" would only work if the column is still present; a full remove-field undo would require also storing and recreating the DOM node, which adds another 20 lines. That part is optional — you could undo the _content_ of a merge/paste without also undoing add/remove field, which covers the most painful cases.
___
###### Bugs
The volume up and down hotkeys (F2 and F3) don't work unless I manually click the volume slider first.

Ctrl + O *still* works while Settings window is open. At this point, just remove that hotkey entirely and make Middle click the official one everywhere.

Typing and normal use of Ctrl + A still don't work in secondary fields. Would the new undo architecture resolve this or is it because secondary fields don't have the same full-fledged raw text field that the main field does (I want them to)?
###### Changes
Implement undo architecture option (a) including optional part
___
Let me read the current file carefully before writing anything.I have a complete picture now. Let me address all items:

**Ctrl+A in secondary fields:** The `stopPropagation` is already there — the real issue is that `contentEditable` divs don't natively support Ctrl+A the same way textareas do. The prompt asks for "the same full-fledged raw text field" — meaning I should replace `contentEditable` divs with actual `<textarea>` elements. This also resolves Ctrl+A, typing naturally, and undo within those fields.

**Volume hotkeys:** The issue is that `audioEl.volume` setter only works reliably if the audio element has been interacted with. The vol slider click "activates" it. Fix: ensure `audioEl` volume changes also sync to slider value, and call the same setter path unconditionally.

Now implementing everything:The vol-pct is there on line 1096/1103 — the check split was off. All good. Let me also verify the `_addSecondaryRaw` function references `addSecondary` correctly and there's no `scrollEl` leftover:Here's what changed in v18 (82 KB, +2 KB from v17):

**Bugs fixed:**

- **Volume hotkeys (F2/F3)** — `vol_down`/`vol_up` now update the slider value and `vol-pct` label directly without relying on `audioEl`'s `volumechange` event, removing the "must click slider first" dependency
- **Ctrl+O while Settings open** — hotkey removed entirely; Middle click is now the only official way to open files (the Open button still works by click)
- **Ctrl+A and typing in secondary fields** — secondary fields are now real `<textarea>` elements (class `sec-textarea`) instead of `contentEditable` divs, giving them identical editing behaviour to the main field: Ctrl+A selects all, native cursor movement, proper text selection, Enter/Tab work naturally

**Changes:**

- **Full snapshot-based undo architecture** — replaces the textarea-only string stack with `{main, secondaries[], colCount, mergeDone}` snapshots, enabling undo/redo of:
    - Paste in typing mode (main and secondary)
    - Add field / Remove field (restores DOM columns + their content)
    - Merge fields (fully reversible)
    - All existing hotkey-mode edits
    - Typing in main or secondary fields (debounced, 800ms after last keystroke)
- Session autosave (`sessionStorage`) now also persists secondary field content and column count across accidental navigation

**On Ctrl+A:** Since secondary fields are now real textareas, Ctrl+A natively selects all text within the focused field without any JS needed. The `stopPropagation` handler for it is still there as a safety net to prevent the global hotkey handler from intercepting it.