A few things in the skill are stale relative to 0.34.7. Here's what I see:

**`linebyline-section-index/SKILL.md` — needs updates:**

1. **Line count estimate** — "2270 lines" and "55k tokens" are approximate but were calibrated for an older version. The 0.34.7 file is a bit shorter (2177 lines per its SECTIONS index, down from the old 2294 range). Minor but could cause an off-by-one when sed-slicing near the end.

2. **SECTIONS index location** — The skill says "line 436" and gives a `sed -n '434,438p'` example. The 0.34.7 SECTIONS line is at approximately line 330 (immediately below `'use strict';`). The sed sample would miss it entirely if followed literally.

3. **Prompt-to-section map** — The **Overlay utilities** row references `_bringToFront` and `_topmostOverlay`, which were removed in 0.34.5 when the Help overlay was replaced with an `<a>` tag. The map entry should drop those references and simplify to just Settings open/close.

4. **Section list (reference)** — The `Confirm dialog` entry mentions a `showConfirm helper` which is vestigial (the section exists but is empty). The `Overlay utilities` sub-section description still mentions `_overlayZ`, `_bringToFront`, `_topmostOverlay` — all removed. Should just say `arrowNavTimer` now.

5. **Version tag** — The reference section says "as of v0.34.1" — worth bumping to 0.34.7.

The **`browser-hotkey-system`** and **`single-file-html-app`** skills don't appear to need changes based on what was altered in this release cycle.

Want me to write a patch for the skill file with those corrections?