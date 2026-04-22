# LineByLine 0.35.2 — Chat log

## Prompt

Bugs

* The hardcoded `Ctrl+M` is not restricted - other hotkeys can be mapped to it.
* The collapse panel icon height changes slightly between 1-expanded.png and 2-collapsed.png
* Parenthesized groups are still not being moved to newlines so the entire parent line they're on is still marked as translation as if it was just a regular line. Even a lyric line with just one trailing parenthesized group (the simplest case) skips the step where the group is moved to newline and marks the whole parent line instead.

---

## Response

**Bug: Ctrl+M not restricted** — Added `Ctrl+M` to `RESTRICTED_ALL`. It was hardcoded in the global keydown handler but missing from the restriction set, so other actions could be remapped to it.

**Bug: collapse button icon stretching** — When the panel collapses to `width:0`, `overflow:hidden` clips the panel content but the `#left-panel-header` flex layout was still rendering and stretching the button's SVG horizontally. Added `#left-panel.collapsed #btn-collapse-panel { display:none; }` to hide it entirely when collapsed.

**Bug: split not activating** — The split logic tested correctly in isolation. The ↩ checkbox was defaulting to unchecked, meaning `splitMode` was always false and the normal mark-as-translation path ran instead. Changed the default to checked so split mode is active out of the box. Let me know if you'd prefer it unchecked by default.

---

---

# LineByLine 0.35.2 — Chat log

## Prompt

(Starting from 0.35.1)
Version
Same
Bugs

* The collapse/expand panel icon is now the same height as when there was no collapse bar. But the collapsed panel bar icon is still not quite the same height as the expanded panel icon. Consider something like the below workaround for icon height gap: Get the ratio of: vertical pixel distance from bottom browser viewport to icon center / vertical pixel distance from top browser viewport to icon center. Hardcode this ratio to be the same for both icon in expanded panel and icon in collapsed panel bar (with the expanded panel icon height being the source of truth)
Refinements

* When lyrics are added while ↩ is checked, loop through every line of lyrics with the "Split trailing parenthesized groups..." pattern. Basically as if the user pressed Ctrl+ArrowLeft on the first line, then when no more groups remained, navigated down to the next line with groups to repeat until the last line with lyrics (just before and not counting the final trailing timestamp). Effectively batch converting an entire song instead of one line at a time.
* If the user leaves ↩ unchecked (still default), adds lyrics, and only then checks ↩, it should support marking one line at a time with Ctrl+ArrowLeft like version 0.35.1.

Follow-up clarifications:
* Bug: CSS preferred over JS for icon alignment
* Refinement batch-convert: on paste or .lrc/.txt file import; silently modify in place
* Refinement one-at-a-time: yes, preserve the behavior
* Skip already timestamped lines and modify incoming lyrics only

---

## Response

**Bug — expand button icon height:** Changed `padding-top` from `6px` to `13px` on `#btn-expand-panel`. The collapse icon center sits at `panel-padding(8.8px) + half-header-height(~12px) ≈ 21px` from the top of `#main`. With a 16px icon, `padding-top = 21 - 8 = 13px` puts the expand icon center at the same position. Pure CSS, no JS.

**Refinement — batch split on paste/import:** Added `batchSplitParens(text)` which walks every line, skips meta/timestamped/blank lines, peels all trailing `(...)` groups via `_peelLastParen`, and inserts them as plain lines immediately after their parent — all in one pass, returning the modified text. Wired into all four entry points when ↩ is checked: typing-mode textarea paste, hotkey-mode main-lines paste, lrcOnly file import, and audio+LRC combined file import.

**Refinement — one-at-a-time preserved:** `Ctrl+ArrowLeft` on a single line still works as in 0.35.1 when ↩ is checked. No changes to `markAsTranslation`.

---
