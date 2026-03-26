>Bugs Ensure the number of newlines after metadata in Settings matches the number of newlines in actual new file, and that this is not hard coded. Ctrl+N hotkey opens new browser window instead. Rather than fight that, change to Ctrl+M Typing view still jumps after first import only but then matches hotkey view. The "I" cursor is at the bottom of the lyrics in typing mode after first import, maybe presetting it to the first lyric line position would help? Changes Add explicit media controls to HOTKEYS Settings to work around browser possibly not recognizing system media keys:

>- Mute: Default F1
>- Volume Up: Default F3
>- Volume Down: Default F2 Refinements Arrow keys and left click should skip and not select metadata fields in hotkey mode If possible, snap the cursor to Ok button in new file dialog box Check the metadata and header strip in Settings by default Add Enter as alternate seek hotkey to left clicking a line Change flanking seek offset arrows like this: 0 ms <>. Add default hotkeys: 1 for left arrow, 2 for right arrow. Gray out Control buttons that do not function in Typing mode while in Typing mode.

Let me read the relevant sections before making changes.
Good, I have everything I need. Let me now apply all changes:
**1. Ctrl+N → Ctrl+M, add media hotkeys (mute/vol up/vol down), strip defaults to checked**
**2. Add media hotkey labels to HK_LABELS and seek_offset arrow labels**
**3. Seek offset layout change: `0 ms <>` — input then ms label then tick buttons**
**4. Meta textarea in Settings: show as-is (don't trimEnd), save as-is — newlines must match actual content exactly**

The core bug: Settings strips trailing newlines on display (`trimEnd()`), then adds exactly one back on save. But the actual new-file content uses the raw `cfg.default_meta` which may have a different number. Fix: show the raw value in settings and save it raw — let the user control exactly what's there. The textarea already handles visual newlines correctly.

**5. Focus OK button in confirm dialog**
**6. Arrow keys and left-click skip metadata lines in hotkey mode**
First update the arrow key handler to skip meta lines:
Now update the mousedown handler in renderMainLines to skip meta lines on plain click:
**7. Fix typing mode scroll jump on first import — set textarea cursor to first lyric line position before measuring ratio**

The root cause: on first import the textarea has never been shown, so `scrollTop=0` and `scrollHeight` may not yet reflect content. We need to position the cursor at the first non-meta line when switching to typing mode:
**8. Add media volume/mute actions to CTRL_ACTIONS and keyboard handler; add seek_offset_back/fwd hotkeys**Now add `tickSeekOffset` helper near the seek tick button wiring:
**9. Add Enter as alternate seek (same as clicking a line) and seek_offset hotkeys to keyboard handler; add media hotkeys outside hotkey-mode guard**Now add Enter as seek + the seek_offset_back/fwd to the hotkey-mode actions map:
**10. Gray out Controls panel cells that don't work in typing mode. Update `rebuildHkPanel` to apply dimming:**

The typing-mode-only disabled actions are everything except: toggle_mode, play_pause, mute, vol_down, vol_up, seek_offset_back, seek_offset_fwd (which work in both modes).
**11. Final checks — verify no leftover references, line count, stray bugs:
**Turns out there were quite a few changes and I hit the tool limit right before the final copy step. Let me do a quick note for the new chat you'll need to open:

---

**Status for new chat:**

All edits are complete and validated in `/home/claude/linebyline_6.html` but the file was not yet copied to outputs. The new chat should open that file and run:

```
cp /home/claude/linebyline_6.html /mnt/user-data/outputs/linebyline_6.html
```

Then present it. All changes were applied:

- **Bug: Metadata newlines** — Settings now shows/saves `default_meta` raw with no `trimEnd()`/`+'\n'` manipulation; user directly controls what's in the textarea
- **Bug: Ctrl+N** — Changed to `Ctrl+M` throughout
- **Bug: Typing mode scroll jump** — On switch to typing, if scroll ratio ≤ 1%, cursor is set to first lyric line and scrolled to top instead of jumping
- **Change: Media controls in Settings** — Added Mute (F1), Volume Down (F2), Volume Up (F3) as configurable hotkeys, active in both modes
- **Refinement: Arrow keys / click skip metadata** — Both skip meta lines in hotkey mode
- **Refinement: Confirm OK focused** — `requestAnimationFrame(() => confirm-yes.focus())`
- **Refinement: Strip checked by default** — `strip_headers:true, strip_metadata:true`
- **Refinement: Enter as seek** — Enter seeks to active line (same as clicking)
- **Refinement: Seek offset layout** — Reordered to `0 ms ◀ ▶`; added hotkeys `1`/`2` for ◀/▶
- **Refinement: Gray out Controls in typing mode** — Hotkey-only cells get `opacity: 0.35` and clicks disabled when in typing mode
___
Here's a recap of everything in this version:

**Bugs fixed:**

- Metadata newlines in Settings are no longer manipulated — the textarea shows and saves `default_meta` exactly as stored, so what you see is what a new file gets
- `Ctrl+N` → **`Ctrl+M`** to avoid browser new-window conflict
- Typing mode scroll jump: if the view has no meaningful scroll position (e.g. first import), the cursor is placed at the first lyric line instead of the bottom

**Changes:**

- Three new media hotkeys added to Settings (configurable, active in both modes): **Mute** (F1), **Vol −** (F2), **Vol +** (F3)

**Refinements:**

- Arrow keys and plain left-click skip over metadata lines in hotkey mode
- Confirm dialog (New file) auto-focuses the OK button — Enter confirms immediately
- Strip headers and strip metadata now **checked by default**
- **Enter** seeks to the active line, same as clicking it
- Seek offset row reordered to `[value] ms ◀ ▶`; default hotkeys **1** (◀) and **2** (▶) added, active in both modes
- Controls panel cells that only work in hotkey mode are **grayed out at 35% opacity** and unclickable while in typing mode