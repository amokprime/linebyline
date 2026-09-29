**These apply to the Vite + Vue + shadcn-vue app (Phase E pre-cutover)**
- No direct filesystem access due to browser security restrictions
    - Can't read audio file metadata tags
    - Audio file doesn't persist if page is reloaded
    - Can't live edit .lrc file in place, must work with a copy in `localStorage` or `sessionStorage` and save it manually elsewhere
- No system media keys - cannot even assign volume up or down hotkeys as workarounds, only mute
- The main field cannot be focused on startup or tabbing back into the app. Copied from [linebyline-0.34.1.md](https://github.com/amokprime/linebyline/blob/main/archive/semantic/0.34.1/linebyline-0.34.1.md):
```
browsers intentionally block programmatic `focus()` calls that aren't triggered by user interaction, as an anti-fingerprinting and anti-annoyance measure. This applies in both standard Firefox and ResistFingerprinting mode. The only reliable approaches would be an explicit click-to-activate overlay (intrusive) or making the whole app a PWA installed to the OS (out of scope).
```
- Cursor is positioned one line too high in **Typing mode** on startup. The default metadata tags include a trailing newline for style, so there should be a blank line between `[re:]` and the first line of lyrics. Pasting in either mode now respects this (the paste handlers insert `\n\n`), but manually typing lyrics still starts the cursor right below `[re:]` without the blank line. Adding a `\n` in `applyMode()` would fix the cursor position but breaks undo (the modification isn't snapshot-pushed, so `Control+Z` restores the old value without the extra `\n`, causing assertion failures). Worked around by pasting lyrics in **Hotkey mode** first (which adds the expected newline), or changing ⚙️**Default metadata tags** to include a trailing blank line.
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
- LibreWolf browser cannot connect to `http://localhost:5173/` (Vite preview). Plain Firefox (upstream architecture) works. This may affect the GitHub Pages post-cutover URL as well — needs verification.

**These apply to Playwright tests as of version 0.37.2**
- Certain tests are still [manual](https://github.com/amokprime/linebyline/blob/main/tests/MANUAL.md) as of version 0.37.2
- The official Microsoft Playwright image pins an outdated version of npm that's hopefully compatible with the GitHub CI ubuntu-runner
- Webkit tests crash after completion on Linux, which also triggers a coredump in the repo root and false positive SELinux AVC [warning](https://github.com/amokprime/linebyline/blob/main/tests/chat/0.37.1/2.md#3. SELinux AVC — NOT related to the cache folder mount). The SELinux alerts can be silenced with the below policy. I never got around to silencing the Webkit crash alerts and just added `my-systemdcored.*` to .gitignore.
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
- I run UI tests with Playwright npm natively in Fedora, which has different OS font rendering than Ubuntu. This causes font-based screenshot [incompatibilities](https://github.com/amokprime/linebyline/blob/main/tests/chat/0.37.1/9.md) that must be worked around by skipping relevant tests or rewriting them to expect consistent elements or shared fonts
- Tests that pass may not pin the specific implementation mechanism — a test can verify the user-facing behavior without catching a regression that removes the code responsible.
    - Example (Sep 25, 2026, Tranche 4.5): the `reload-clears-lyrics-audio` test passes whether or not `sessionStorage.removeItem('lbl_autosave')` is present in `App.vue`. The test verifies the clean-state-after-reload behavior, but the autosave isn't written during the fast test import cycle, so the `removeItem` line's presence or absence doesn't change the outcome. The test catches a regression where reload gives a dirty state, but misses a regression where `removeItem` is deleted.
    - Mutation testing (break the app, verify the test fails, restore) catches this class of gap; the cheaper alternative is adding stronger assertions that pin the mechanism (e.g. `expect(page.evaluate(() => sessionStorage.getItem('lbl_autosave'))).toBeNull()` after reload). See Tranche 4.7 in `archive/modular/plan/0-Roadmap.md` for the project's decision on whether to adopt mutation testing permanently.
