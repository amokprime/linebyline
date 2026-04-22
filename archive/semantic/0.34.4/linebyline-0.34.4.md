### Type
Patch
### Bugs
When selecting a number in a number field and pressing Backspace and then Enter, the field stays blank even though the number has actually reverted to its previous value - make the number update properly right after the user presses Enter if possible
### Refinements
Change lyric export to default to whatever the metadata `[ti: ]` field currently is, but apply it to the filename of the saved lyric (currently it saves as 'artist - title' which is problematic for files saved as 'title.ext')
Replace the "-" and "+" icon speed control buttons with the type of up/down tick arrow controls used in Settings/Intervals positioned next to the speed number without covering it, still multiplying with the speed ratio configured in Settings; up tick to increase speed, down tick to decrease
Replace the small black left/right triangle icon buttons for increase/decrease seek offset with the same vertical tick arrows, taking care not to cover the number in the field or the "ms" label to the right of the field, and still; up tick to increase offset, down tick to decrease, both still by the hardcoded 1000ms magnitude
### Learning
Show me the code that you added or changed to: 
- Add the type of up/down tick arrow controls used in Settings/Intervals
- Ensure they were properly linked to their associated fields (i.e. actually ticked the amount up and down)
- Specify their dimensions (so I can try different widths and visually check it looks good without burning up tokens)

---

**Bug fix:** The `change` event fires on all number fields when you clear them and commit (Backspace then Enter). The handlers were doing an early-return on invalid/NaN values, leaving the display blank even though the underlying variable still held the previous value. Fix applied to three places:

- `speed-val` change handler: on NaN/invalid, now resets display to `currentSpeed` instead of returning silently
- `seek-offset` change handler: on NaN, now resets display to `cfg.seek_offset` instead of defaulting to 0
- `saveSettingsNow` (Settings intervals): added explicit display resync for all eight number fields (`s-tiny`, `s-small`, `s-medium`, `s-large`, `s-seek-inc`, `s-speed-ratio`, `s-vol-inc`, `s-undo-debounce`) after computing cfg values, so the field always shows the clamped/fallback value actually stored

**Save filename:** `doSave` now uses only `[ti:]` for the filename. The `ar - ti` branch and the `arMatch` variable were removed entirely.

**Speed tick controls:** The `−` and `+` `seek-arr` buttons were replaced with an `fs-spinner` div containing two `fs-tick` buttons (▲ up = increase, ▼ down = decrease), placed immediately after the speed number input and before the `x` label. The existing `speed-up-btn` and `speed-down-btn` IDs are preserved so all existing JS wiring and tooltip logic works unchanged.

**Seek offset tick controls:** The `◄` and `►` `seek-arr` buttons were replaced identically — an `fs-spinner` after the number input and before the `ms` label. `seek-arr-fwd` (▲) and `seek-arr-back` (▼) IDs preserved.

**Dimensions for the spinners** (from the `.fs-spinner` CSS): `width: 16px`, `height: 24.2px` (overridden inline from the default 28.6px to match the compact row height). Each tick half is `flex: 1` of that, so roughly `16 x 12px` per button.

---
I rearranged buttons in media-row and seek-row, reduced width of speed-val field 42 → 39px, (updated code in project files, same version; you can update your copy but don't need to present unless my changes broke the index). In my previous prompt I had a Learning section that I would still like to understand. I can see that the spinner buttons in the main window area (main.png) look different from the ones in Settings (settings.png) - is that style difference or literally different due to technical limits? Also, how do I remove the reset button (not hotkey, just button) or any button in general without breaking other things?
___
Looking at the images: the Settings spinners (Image 1) have the native browser `<input type="number">` spin buttons built into the field itself, while the main window spinners (Image 2) are the custom `fs-spinner`/`fs-tick` divs we added. They're **literally different elements** — the Settings fields are plain `<input class="s-num" type="number">` with no custom spinner attached, so the browser renders its own default arrows inside the field. The main window ones are the custom `fs-spinner` divs sitting outside the field.

You could unify them either direction — strip the native spinners from Settings fields and add `fs-spinner` divs next to each, or hide the custom ones and rely on native. The current mixed state is just because the Settings inputs were never given custom spinners.

---

**Removing the speed reset button** — the reset button (`speed-reset-btn`) touches four places:

1. **HTML** — the `<button class="seek-arr" id="speed-reset-btn">` element in `#media-row`
2. **`updateDynamicTooltips()`** — the line `document.getElementById('speed-reset-btn').title=...`
3. **Button wiring** — `document.getElementById('speed-reset-btn').addEventListener('click',()=>changeSpeed(0));`
4. **The hotkey** — `speed_reset` still works via keyboard (`Ctrl+3` by default); removing the button doesn't affect that

So the safe removal is: delete the HTML element, delete the tooltip line, delete the wiring line. The `changeSpeed(0)` function and `speed_reset` hotkey config entry are harmless to leave — they cost nothing and preserve the hotkey path.

The same pattern applies to any button: find its `id`, grep for it, and you'll get the full list of places that reference it. Nothing else in the app depends on button elements existing at runtime, so deletion is safe as long as you get all three locations (HTML, tooltip wiring if any, click listener).
___
I have now removed the speed reset button with steps 1-3, preserving the hotkey (project file updated again). What's the most correct way to show numerical input fields - the Settings spinners or main window spinners? What about showing the labels like "ms" or "x" on the side vs as an un-editable label inside the field itself (expanding field width as needed to fit both value and label)?
___
**Custom vs native spinners:** The custom `fs-spinner` is strictly better for this app. Native `<input type="number">` spinners are inconsistent across browsers and OS themes, ignore your CSS variables, and can't be sized independently of the field. The custom ones match your design tokens exactly and you control the hit area. The Settings fields should be migrated to custom spinners — the only reason they still have native ones is they were never updated.

To suppress the native arrows on the Settings fields without adding custom spinners yet, you can add to the CSS:

```css
.s-num{-moz-appearance:textfield;}
.s-num::-webkit-inner-spin-button,.s-num::-webkit-outer-spin-button{-webkit-appearance:none;}
```

That's already done for `#font-size-inp` and `#speed-val` — just extend it to `.s-num`.

---

**Inline label vs external label:** External labels (`ms` as a separate `<span>`) are the standard and correct pattern here. Inline labels (value + unit inside the field) have real problems: the field value is then a string like `"100 ms"` rather than a number, so you lose native number validation, `parseFloat()` breaks, and keyboard increment/decrement stops working. You'd have to fake it with a `<div>` styled as an input, which adds significant complexity for no functional gain.

The one case where inline units make sense is a **read-only display** — like a formatted time readout — where you never parse the value back out. For editable fields that feed into `cfg`, external labels are the right call and what you already have.