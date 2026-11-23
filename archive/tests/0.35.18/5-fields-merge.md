---
model: GLM-5.1
---
Previously I added a test for pasting lyrics into the secondary field aka `getByRole('textbox')` in import-paste.spec.js. I'm not sure how to import lyrics into the secondary field (instead of the main field) in fields-merge.spec.js. The real browser equivalent is clicking the the 📂 button in the secondary field title bar aka `getByTitle('Open (Middle click)')` or middle clicking the secondary field to open the file opening dialog box.

# Error details
```
Error: locator.setInputFiles: Error: Node is not an HTMLInputElement
Call log:
  - waiting for getByRole('textbox')
    - locator resolved to <textarea spellcheck="false" class="sec-textarea"></textarea>
```
# Page snapshot
```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "📂" [ref=e3] [cursor=pointer]
    - button "💾" [ref=e4] [cursor=pointer]
    - button "Undo" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
    - button "Redo" [ref=e10] [cursor=pointer]:
      - img [ref=e11]
    - combobox "Editor font" [ref=e15] [cursor=pointer]:
      - option "System Sans" [selected]
      - option "System Serif"
    - generic [ref=e16]:
      - spinbutton "Font size" [ref=e17]: "14"
      - generic [ref=e18]:
        - button "▲" [ref=e19] [cursor=pointer]
        - button "▼" [ref=e20] [cursor=pointer]
    - button "Add field" [ref=e22] [cursor=pointer]
    - button "Hide field" [ref=e23] [cursor=pointer]
    - button "Merge fields" [disabled] [ref=e24]
    - button "⚙️" [ref=e26] [cursor=pointer]
    - button "🌙" [ref=e27] [cursor=pointer]
    - link "?" [ref=e28] [cursor=pointer]:
      - /url: https://github.com/amokprime/linebyline/blob/main/HELP.md
      - strong [ref=e29]: "?"
    - link "Issues (Ctrl+[)" [ref=e30] [cursor=pointer]:
      - /url: https://github.com/amokprime/linebyline/issues
      - img [ref=e31]
  - generic [ref=e43]:
    - generic [ref=e44]:
      - generic [ref=e45]:
        - generic [ref=e46]: Now playing
        - button "Collapse panel" [ref=e47] [cursor=pointer]:
          - img [ref=e48]
      - generic [ref=e51]:
        - generic [ref=e52]: Unknown Title
        - generic [ref=e53]: Unknown Artist
        - generic [ref=e55]:
          - generic [ref=e56]: 0:00
          - generic [ref=e57]: 0:00
        - generic [ref=e58]:
          - spinbutton "Playback speed" [ref=e59]: "1"
          - generic [ref=e60]: x
          - generic [ref=e61]:
            - button "▲" [ref=e62] [cursor=pointer]
            - button "▼" [ref=e63] [cursor=pointer]
          - button "Seek back" [ref=e64] [cursor=pointer]:
            - img [ref=e65]
          - button "Play" [ref=e68] [cursor=pointer]:
            - img [ref=e69]
          - button "Seek forward" [ref=e71] [cursor=pointer]:
            - img [ref=e72]
        - generic [ref=e75]:
          - 'spinbutton "Seek offset (ms): shifts playback position when clicking a timestamped line" [ref=e76]': "-600"
          - generic [ref=e77]: ms
          - generic [ref=e78]:
            - button "▲" [ref=e79] [cursor=pointer]
            - button "▼" [ref=e80] [cursor=pointer]
          - button "Sync file Ctrl+I" [ref=e81] [cursor=pointer]:
            - text: Sync file
            - generic [ref=e82]: Ctrl+I
        - generic [ref=e83]:
          - button "Mute" [ref=e84] [cursor=pointer]:
            - img [ref=e85]
          - slider [ref=e87] [cursor=pointer]: "1"
          - generic [ref=e88]: 100%
      - generic [ref=e89]: Controls
      - generic [ref=e90]:
        - generic [ref=e91]:
          - generic "Toggle offset mode" [ref=e92] [cursor=pointer]:
            - generic [ref=e93]: Offset time
            - generic [ref=e94]: Shift+~
          - generic "Toggle mode" [ref=e95] [cursor=pointer]:
            - generic [ref=e96]: Hotkey mode
            - generic [ref=e97]: "`"
        - generic "Play/pause" [ref=e98] [cursor=pointer]:
          - generic [ref=e99]: Play/pause
          - generic [ref=e100]: Space
        - generic "Sync line start" [ref=e101] [cursor=pointer]:
          - generic [ref=e102]: Sync line
          - generic [ref=e103]:
            - generic [ref=e104]: W
            - generic [ref=e105]: Enter
        - generic "Previous line" [ref=e106] [cursor=pointer]:
          - generic [ref=e107]: Previous line
          - generic [ref=e108]:
            - generic [ref=e109]: Q
            - generic [ref=e110]: ↑
        - generic "Next line" [ref=e111] [cursor=pointer]:
          - generic [ref=e112]: Next line
          - generic [ref=e113]:
            - generic [ref=e114]: E
            - generic [ref=e115]: ↓
        - generic "Replay only" [ref=e116] [cursor=pointer]:
          - generic [ref=e117]: Replay only
          - generic [ref=e118]: R
        - generic "Sync line end" [ref=e119] [cursor=pointer]:
          - generic [ref=e120]: End line
          - generic [ref=e121]: T
        - generic "Back tiny amount" [ref=e122] [cursor=pointer]:
          - generic [ref=e123]: −100ms time
          - generic [ref=e124]: Z
        - generic "Forward tiny amount" [ref=e125] [cursor=pointer]:
          - generic [ref=e126]: +100ms time
          - generic [ref=e127]: V
        - generic "Back small amount" [ref=e128] [cursor=pointer]:
          - generic [ref=e129]: −200ms time
          - generic [ref=e130]: A
        - generic "Forward small amount" [ref=e131] [cursor=pointer]:
          - generic [ref=e132]: +200ms time
          - generic [ref=e133]: F
        - generic "Back medium amount" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: −400ms time
          - generic [ref=e136]: S
        - generic "Forward medium amount" [ref=e137] [cursor=pointer]:
          - generic [ref=e138]: +400ms time
          - generic [ref=e139]: D
        - generic "Back large amount" [ref=e140] [cursor=pointer]:
          - generic [ref=e141]: −1000ms time
          - generic [ref=e142]: X
        - generic "Forward large amount" [ref=e143] [cursor=pointer]:
          - generic [ref=e144]: +1000ms time
          - generic [ref=e145]: C
    - generic [ref=e148]:
      - generic [ref=e150]:
        - generic [ref=e151]: Main
        - generic "Wrap marked translations in parentheses" [ref=e152] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e153]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e154] [cursor=pointer]:
          - checkbox "↩" [ref=e155]
          - text: ↩
      - generic [ref=e158]:
        - generic [ref=e159]:
          - generic [ref=e160]: Secondary 1
          - generic [ref=e161]:
            - button "📂" [ref=e162] [cursor=pointer]
            - generic "Wrap all secondary lines in parentheses" [ref=e163] [cursor=pointer]:
              - checkbox "( )" [checked] [ref=e164]
              - text: ( )
        - textbox [ref=e165]
```
# Test source
```ts
  1  | const { test, expect } = require('@linebyline/test-helpers');
  2  | 
  3  | test('hide-secondary', async ({ page, media }) => {
  4  |   await page.keyboard.press('Control+4');
> 5  |   await page.getByRole('textbox').setInputFiles([
     |   ^ Error: locator.setInputFiles: Error: Node is not an HTMLInputElement
  6  |     media('audio.mp3'),
  7  |     media('synced_english.lrc'),
  8  |   ]);
  9  |   await page.keyboard.press('Control+5');
  10 |   await page.keyboard.press('Control+4');
  11 |   const lyrics = await page.getByRole('textbox').inputValue();
  12 |   expect(lyrics).toMatchSnapshot();
  13 | });
```

---
The error is because `getByRole('textbox')` resolves to the `<textarea>`, not the hidden `<input type="file">`. The secondary field's file picker is a hidden input created in `addSecondary()` (line 1519), wired to the 📂 button (line 1523).

The most realistic approach — click the 📂 button, catch the file chooser dialog:

```js
test('hide-secondary', async ({ page, media }) => {
  await page.keyboard.press('Control+4');

  // Click 📂 button, intercept the file chooser it opens
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('.field-col:not(#main-col) button[title="Open (Middle click)"]').click(),
  ]);
  await fileChooser.setFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);

  await page.keyboard.press('Control+5');
  await page.keyboard.press('Control+4');
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});
```

This mirrors exactly what a real user does: click the 📂 button → file dialog opens → pick files. The `waitForEvent('filechooser')` + `click()` in a `Promise.all` is Playwright's standard pattern for file dialogs triggered by JavaScript (since the `<input>` itself is `display:none` and can't be targeted directly without a selector guess).

---
``` js
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
```
Is the existing method for picking main audio and lyrics realistic enough or should it also be using `fileChooser` like secondary lyrics?

---
`setInputFiles` on `#file-picker` is fine for the main field. It's a stable, ID'd `<input type="file">` — Playwright can set files on it directly and the `change` handler runs the same code either way.

The `fileChooser` pattern was only needed for the secondary field because its `<input>` is dynamically created with no stable selector. If you ever want to also test the 📂 toolbar button itself (that it opens the right dialog), that's when you'd use `fileChooser` for the main field — but that's a button-wiring test, not a functional import test.

---
The original CHECKLIST.md had several tests for invalid merging:
- [ ] Merge fields button is grayed out and `Ctrl+6` throws warning popup when
	- [ ] Lyric lines don't match
	- [ ] The main field lacks any timestamps (import english.lrc)
	- [ ] The main field lacks a final end timestamp (delete it)
	- [ ] Webpage is reloaded without merging fields when it's allowed
- [ ] Unsaved work warning is not bypassed by skipping merge fields and reloading page
Is it feasible to check for LineByLine's various browser warning popups in Playwright (i.e. do they look different in different browsers)? I wrote the tests after finding the inline warning in one or both lyrics fields (which can be read by `getByText`) and even a grayed-out Merge fields button could be bypassed by the hotkey (which was in turn blocked by the warning popup).

---
There are two types of popups here:

**1. `alert()` calls** (lines 1631, 1632, 1636) — native browser dialogs. Playwright **auto-dismisses** these by default (accepts them silently), and you can intercept their text with `page.on('dialog')`. This works consistently across all three browsers:

```js
test('merge-blocks-no-timestamps', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),  // no timestamps
  ]);
  await page.keyboard.press('Control+4');

  const dialog = await Promise.all([
    page.waitForEvent('dialog'),
    page.keyboard.press('Control+6'),
  ]);
  expect(dialog.message()).toBe('No timestamps in main field.');
});
```

**2. `confirm()` call** (line 1638) — the "no trailing end timestamp" case. Same Playwright API, but you can also control which button is clicked:

```js
test('merge-no-end-ts-cancel', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  // inject secondary text, then delete the end timestamp...

  page.on('dialog', async (d) => {
    expect(d.message()).toContain('No trailing end timestamp');
    await d.dismiss(); // Cancel — merge should NOT proceed
  });
  await page.keyboard.press('Control+6');
  // verify merge didn't happen
});
```

**3. Inline `.warn-bar`** (line 124–125, 290) — the yellow bars under field headers. These are just DOM elements, so `getByText` works regardless of browser:

```js
await expect(page.locator('#main-warn')).toBeVisible();
```

Native `alert()`/`confirm()` dialogs look different per browser visually, but Playwright intercepts them before rendering — it sees the message text and accept/dismiss actions identically across Chromium, Firefox, and WebKit. So the feasibility answer is yes, all three popup types are testable without cross-browser concerns.

---
