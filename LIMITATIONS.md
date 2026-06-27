**These apply to the .html app as of version 0.36.2**
- No direct filesystem access due to browser security restrictions
	- Can't read audio file metadata tags
	- Audio file doesn't persist if page is reloaded
	- Can't live edit .lrc file in place, must work with a copy in `localStorage` or `sessionStorage` and save it manually elsewhere
- No system media keys - cannot even assign volume up or down hotkeys as workarounds, only mute
- The main field cannot be focused on startup or tabbing back into the app. Copied from [linebyline-0.34.1.md](https://github.com/amokprime/linebyline/blob/main/archive/semantic/0.34.1/linebyline-0.34.1.md):
```
browsers intentionally block programmatic `focus()` calls that aren't triggered by user interaction, as an anti-fingerprinting and anti-annoyance measure. This applies in both standard Firefox and ResistFingerprinting mode. The only reliable approaches would be an explicit click-to-activate overlay (intrusive) or making the whole app a PWA installed to the OS (out of scope).
```
- Cursor is positioned one line too high in **Typing mode** on startup. Worked around by pasting in lyrics in **Hotkey mode** first which adds the expected newline, or changing ⚙️**Default metadata tags** to not include a newline.
- Many hotkey restrictions (copied from [/docs/index.html](https://github.com/amokprime/linebyline/blob/main/docs/index.html))
```html
// ── Restricted hotkey rules ──────────────────────────────────────────────────
// Keys blocked for ALL remappable hotkeys (browser-reserved or destructive)
const RESTRICTED_ALL=new Set([
  'MouseLeft','MouseRight',
  'Escape','Tab','Enter',
  // Ctrl combos browsers reserve
  'Ctrl+R','Ctrl+F','Ctrl+Q','Ctrl+W','Ctrl+L',
  'Ctrl+O',
  'Ctrl+T','Ctrl+D','Ctrl+M','Ctrl+N','Ctrl+P','Ctrl+H','Ctrl+J','Ctrl+U',
  'Ctrl+B','Ctrl+G',
  'Ctrl+Z','Ctrl+Y','Ctrl+X','Ctrl+C','Ctrl+V','Ctrl+E','Ctrl+K',
  'Ctrl+Shift+I','Ctrl+Shift+J','Ctrl+Shift+C','Ctrl+Shift+K','Ctrl+Shift+N',
  'Ctrl+Shift+O','Ctrl+Shift+P','Ctrl+Shift+T','Ctrl+Shift+W','Ctrl+Shift+Delete',
  // All Meta (Cmd on Mac) combos
  'Meta+A','Meta+B','Meta+C','Meta+D','Meta+E','Meta+F','Meta+G','Meta+H','Meta+I','Meta+J',
  'Meta+K','Meta+L','Meta+M','Meta+N','Meta+O','Meta+P','Meta+Q','Meta+R','Meta+S','Meta+T',
  'Meta+U','Meta+V','Meta+W','Meta+X','Meta+Y','Meta+Z',
  'Meta+0','Meta+1','Meta+2','Meta+3','Meta+4','Meta+5','Meta+6','Meta+7','Meta+8','Meta+9',
  'Meta+Left','Meta+Right','Meta+Up','Meta+Down',
  'Meta+Shift+I','Meta+Shift+J','Meta+Shift+C',
  // All Alt combos (fingerprinting-resistant browsers remap many; blanket block)
  'Alt+A','Alt+B','Alt+C','Alt+D','Alt+E','Alt+F','Alt+G','Alt+H','Alt+I','Alt+J',
  'Alt+K','Alt+L','Alt+M','Alt+N','Alt+O','Alt+P','Alt+Q','Alt+R','Alt+S','Alt+T',
  'Alt+U','Alt+V','Alt+W','Alt+X','Alt+Y','Alt+Z',
  'Alt+0','Alt+1','Alt+2','Alt+3','Alt+4','Alt+5','Alt+6','Alt+7','Alt+8','Alt+9',
  'Alt+Left','Alt+Right','Alt+Up','Alt+Down',
  // Navigation / system keys
  'Home','End','Insert','Delete','Backspace',
  'NumLock','ScrollLock','Meta','PrintScreen','ContextMenu',
  // All F-keys
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
]);
```
- The unsaved work popup jumps to default "Leave page" button on Firefox but [not](https://github.com/amokprime/linebyline/blob/main/archive/semantic/0.36.1/linebyline-0.36.1.md) other browsers
- Copying a Genius song to a text editor and then copying the contents of that file to LineByLine now adds this to the bottom:
```
somenumber
Embed
```
- There's no reason I can think of at this point why anyone should do that though. The live Genius website should always be trusted over a potentially stale mock.txt, which provides a persistent test file anyway.

**These apply to Playwright tests as of version 0.37.1**
- Certain tests are still [manual](https://github.com/amokprime/linebyline/blob/main/tests/MANUAL.md) as of version 0.36.2
- The official Microsoft Playwright image pins an outdated version of npm that's hopefully compatible with the GitHub CI ubuntu-runner
- Webkit tests crash after completion on Linux, which also triggers a coredump in the repo root and false positive SELinux AVC [warning](https://github.com/amokprime/linebyline/blob/main/archive/modular/plan/1-Playwright/2.md#3. SELinux AVC — NOT related to the cache folder mount). The SELinux alerts can be silenced with the below policy. I never got around to silencing the Webkit crash alerts and just added `my-systemdcoredum.*` to .gitignore.
```sh
sudo ausearch -c 'systemd-coredum' --raw | audit2allow -M my-systemdcoredum
sudo semodule -X 300 -i my-systemdcoredum.pp
```
- Many tests require gimmicky focus clicks on any part of the page or in a lyrics field. The real browsers shift focus automatically in ways Playwright browsers (especially headless) do not.

```js
await page.locator("#left-panel-header").click();
await page.locator("#main-textarea").click();
await page.getByRole("textbox", { name: "Main lyric text" }).click();
```

- The realistic paste method is only supported by Firefox
```js
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("lyrics file"));
  await page.keyboard.press("Control+v");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot();
```
- Chromium generates an empty snapshot from pasted content unless clipboard permissions are granted:
```js
  const browserName = context.browser()?.browserType()?.name();
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
```
- Webkit doesn't have an equivalent so I'm just skipping it outright for paste tests:
```js
  test.skip(
    browserName === "webkit",
    "Webkit always generates empty snapshot from Contrl+V paste",
  );
```
