I downloaded your output .html file just before the cutoff and manually appended the new chat output. If you didn't plan to add any code between presenting the .html file and the cutoff, there are some more bugs for a patch:

* Media keys show no feedback on hover (other buttons temporarily tint gray when hovered)
* Trailing timestamp not added after lyrics imported or pasted even though audio file exists. I can see the audio duration in Now Playing - why isn't this information getting through backend?
* Merge fields can be undone but not redone - affects both hotkeys and buttons

---

Let me read the relevant sections before patching.
I see the problem. `maybeAppendTrailingTs` is defined at line 687, but the paste handler at line 671 calls it *before* `maybeAppendTrailingTs` is defined. Wait — that's the `main-textarea` paste handler. Let me check the ordering more carefully:

The function is defined at 687 but called at 671 inside an event listener — that's fine since the listener only runs at event time, well after all definitions. The real bug must be elsewhere. Let me check:
 `maybeAppendTrailingTs` checks `!lines.some(l=>tsToMs(l)!==null)` — for a fresh paste of plain lyrics (no timestamps), this returns early because there are no timestamps yet. The trailing ts is only added when there are already timestamped lines. That's the bug — for plain lyric paste, there are no timestamps, so it bails. The intent should be to add the trailing ts whenever audio duration is known and no trailing ts exists, regardless of whether there are timestamps (since the user will sync them later).

Also the `setMainText` call inside `maybeAppendTrailingTs` calls `pushSnapshot` which will clear the redo stack — for the merge redo bug, let me check `mergeTranslations`:

Same pattern as the lrc import bug — `pushSnapshot()` before `_setTA` clears the redo stack but never pushes post-merge state. Also check `media-btn` hover:
 the CSS looks correct (`var(--bg)` on hover). But `var(--bg)` is a very light gray on light theme — visually similar to the button's transparent background. Other toolbar buttons use `var(--border)` on hover (the `.mb-btn:hover` rule). Let me verify:
 
The issue is clear:
 `.media-btn` sits inside `#audio-box` which has `background:var(--bg)`. So hovering to `var(--bg)` is invisible — same color as the parent. It needs `var(--border)` like the other small buttons in the panel. Now applying all three fixes:
 
Three fixes, all same-version patches to ~~0.34.6~~ 0.34.7:

- **Media button hover invisible** — `.media-btn:hover` changed from `var(--bg)` to `var(--border)`. The audio box parent already has `background:var(--bg)`, so hovering to the same color was a no-op visually.
- **Trailing timestamp not added on paste/import** — `maybeAppendTrailingTs` had a guard requiring existing timestamped lines before adding the trailing ts. Removed it — the function now fires whenever audio duration is known and no trailing timestamp exists, which is the correct condition for plain lyric paste too.
- **Merge fields undo without redo** — same double-`pushSnapshot` fix applied: one call before `_setTA` (saves pre-merge state for undo) and one after (saves post-merge state for redo).

---
Hardcode alternate hotkeys for both Seek back (ArrowLeft) and Seek forward (ArrowRight) that are only active in Hotkey mode and not shown in Settings, and update back/forward media button tooltips - similar to how the main field has both a remappable Ctrl+O and hardcoded Middle click and shows both in 📂 button tooltip but only remappable hotkey in Settings. Left/right arrow key behavior in Typing mode shouldn't change. Then version output file and last presented file as 0.34.7 and handoff for new chat.

---
Now I have everything. Two targeted patches:
ArrowLeft and ArrowRight now seek back/forward in Hotkey mode only — handled by two hardcoded checks placed after the `if(!hotkeyMode)return` guard, before the remappable `actions` dispatch. They don't appear in Settings, don't conflict with Typing mode cursor movement (which never reaches that code path), and the seek back/forward button tooltips now read e.g. `Seek back 5s (Ctrl+A / ArrowLeft in Hotkey mode)` matching the `📂` pattern.