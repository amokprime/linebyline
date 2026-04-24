## Semantic HTML Audit — LineByLine 0.35.8

### Summary

LineByLine is a tool-style single-page app. Most of it is intentionally non-semantic (the lyric editor is a bare `div` grid, hotkey cells are `div`s), which is defensible for a keyboard-driven power tool. But there are specific gaps that would confuse a screen reader even for a sighted user who relies on one for focus management.

---

### Issues found

**1. No landmark structure** — The entire page is `div`s. A screen reader user has no way to jump to regions. The menu bar, left panel, and editor area should be `<header>`, `<nav>` or `role="toolbar"`, `<aside>`, and `<main>` respectively. The settings dialog should be `<dialog>` or at minimum `role="dialog"` with `aria-modal="true"` and `aria-labelledby`.

**2. Settings overlay is not a dialog** — `#settings-overlay` / `#settings-win` are bare `div`s with no `role="dialog"`, no `aria-modal`, no `aria-labelledby`. Screen readers won't announce it as a dialog when it opens, and won't trap virtual cursor focus within it. The focus trap in JS helps keyboard users but does nothing for screen reader browse mode.

**3. Icon-only buttons have no accessible name** — `#btn-undo`, `#btn-redo` contain only SVGs with no `aria-label`. The `title` attribute provides a tooltip but is not reliably announced as an accessible name in all screen readers (NVDA/JAWS often ignore it). Same applies to `#btn-collapse-panel`, `#btn-expand-panel`, `#btn-seek-back`, `#btn-seek-fwd`, `#btn-play-pause`, `#vol-mute-btn`, `#settings-close`, `#s-search-kbd`, all media-btn SVGs. Emoji buttons (`📂`, `💾`, `⚙️`, `🌗`) are announced as their Unicode name ("open file folder", "floppy disk") which is passable but inconsistent.

**4. SVGs are not hidden from AT** — Decorative SVGs inside buttons lack `aria-hidden="true"`. Screen readers may read path data or announce "graphic" before or after the button label.

**5. Progress bar is not a range** — `#progress-wrap` / `#progress-fill` are `div`s acting as a seekable progress bar. Should be `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`. Currently announces nothing.

**6. `#song-title` / `#song-artist` are bare `div`s** — These are live-updated. A screen reader won't announce changes. They should have `aria-live="polite"` or be inside a live region, or at minimum be `<p>` or `<output>` elements.

**7. `.warn-bar` elements are not live regions** — Warning messages (e.g. "Missing trailing timestamp") appear and disappear visually. They need `role="status"` or `aria-live="polite"` to be announced.

**8. `#main-lines` lyric area has no role** — It behaves like a listbox (selectable items, keyboard navigation), but has no `role`, no `aria-label`, and the `.lrc-line` children have no `role="option"`. Screen readers see a wall of anonymous text.

**9. Settings interval `<label>` elements are not linked to inputs** — `<div class="s-row"><label>Tiny</label><input class="s-num" id="s-tiny">` — the `<label>` has no `for` attribute pointing to the input's `id`. Screen readers won't associate them. `<label for="s-tiny">Tiny</label>` fixes this.

**10. `#font-size-inp` has no label** — There's a `title="Font size"` but no `<label>` or `aria-label`. Same for `#seek-offset`, `#speed-val`.

**11. `#settings-close` button has no accessible name** — Contains only `✕` (a Unicode multiply sign). Should be `aria-label="Close settings"`.

**12. `#s-search-kbd` button** — Contains `⌨` emoji. Tooltip says "Switch to hotkey search…" but no `aria-label`. Should be `aria-label="Switch to hotkey search mode"`.

**13. `hk-key` badge spans** — These are purely visual. Inside buttons and cells they'll be read as part of the button text (e.g. "Play/pause Space"), which is actually fine. No fix needed.

**14. `<div class="mb-sep">` separators** — Should be `role="separator"` or `aria-hidden="true"` to avoid being announced as empty content.

**15. Secondary field headers built entirely in JS** — The dynamically-built secondary columns don't get `aria-label` on their textareas. A screen reader won't know which field it's in.

---

### Severity ranking for a tool app

|Priority|Items|
|---|---|
|High (meaningfully broken)|2 (dialog), 3 (icon buttons), 9 (label-input association)|
|Medium (degraded but usable)|5 (progress bar), 6 (live song title), 7 (warn bars), 11, 12|
|Low (cosmetic/polish)|1 (landmarks), 4 (aria-hidden SVGs), 8 (listbox role), 13 (separators), 14, 15|

---

### Recommendation

LineByLine is fundamentally a hotkey-driven power tool — full WCAG compliance would require deep structural changes (the lyric grid as a proper listbox, etc.) and may not be worth the effort. The **high-priority** fixes (dialog semantics, icon button labels, label-for associations) are small, targeted, and would meaningfully help any user who navigates Settings by keyboard with a screen reader. The rest I'd flag as "nice to have" and leave for a dedicated accessibility pass.

Do you want me to include the high-priority fixes in this patch, or keep it code-only for the originally scoped items?

---
High-priority for now