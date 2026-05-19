# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> button-tint
- Location: tests\smoke.spec.js:34:1

# Error details

```
Error: locator.hover: Error: strict mode violation: getByRole('button', { name: 'Play' }) resolved to 3 elements:
    1) <button class="media-btn" aria-label="Play" id="btn-play-pause" title="Play/pause (Ctrl+Space)">…</button> aka getByRole('button', { name: 'Play', exact: true })
    2) <div tabindex="0" role="button" class="hk-cell" title="Play/pause" aria-label="Play/pause">…</div> aka getByRole('button', { name: 'Play/pause' })
    ...

Call log:
  - waiting for getByRole('button', { name: 'Play' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - toolbar "Main toolbar" [ref=e2]:
    - button "Open file" [ref=e3] [cursor=pointer]: 📂
    - button "Save" [ref=e4] [cursor=pointer]: 💾
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
    - button "Add secondary field" [ref=e22] [cursor=pointer]: Add field
    - button "Hide last secondary field" [disabled] [ref=e23]: Hide field
    - button "Merge fields" [disabled] [ref=e24]
    - button "Settings" [ref=e26] [cursor=pointer]: ⚙️
    - button "Toggle theme" [ref=e27] [cursor=pointer]: 🌙
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
      - region "Now playing" [ref=e51]:
        - generic "Song title" [ref=e52]: Unknown Title
        - generic "Song artist" [ref=e53]: Unknown Artist
        - slider "Playback position" [ref=e54] [cursor=pointer]
        - generic [ref=e55]:
          - generic "Current position" [ref=e56]: 0:00
          - generic "Duration" [ref=e57]: 0:00
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
          - spinbutton "Seek offset in milliseconds" [ref=e76]: "-600"
          - generic [ref=e77]: ms
          - generic [ref=e78]:
            - button "▲" [ref=e79] [cursor=pointer]
            - button "▼" [ref=e80] [cursor=pointer]
          - button "Sync file" [ref=e81] [cursor=pointer]:
            - text: Sync file
            - generic [ref=e82]: Ctrl+I
        - generic [ref=e83]:
          - button "Mute" [ref=e84] [cursor=pointer]:
            - img [ref=e85]
          - slider "Volume" [ref=e87] [cursor=pointer]: "1"
          - generic "Volume percentage" [ref=e88]: 100%
      - generic [ref=e89]: Controls
      - group "Controls" [ref=e90]:
        - generic [ref=e91]:
          - button "Toggle offset mode" [ref=e92] [cursor=pointer]:
            - generic [ref=e93]: Offset time
            - generic [ref=e94]: Shift+~
          - button "Toggle mode" [ref=e95] [cursor=pointer]:
            - generic [ref=e96]: Hotkey mode
            - generic [ref=e97]: "`"
        - button "Play/pause" [ref=e98] [cursor=pointer]:
          - generic [ref=e99]: Play/pause
          - generic [ref=e100]: Space
        - button "Sync line start" [ref=e101] [cursor=pointer]:
          - generic [ref=e102]: Sync line
          - generic [ref=e103]:
            - generic [ref=e104]: W
            - generic [ref=e105]: Enter
        - button "Previous line" [ref=e106] [cursor=pointer]:
          - generic [ref=e107]: Previous line
          - generic [ref=e108]:
            - generic [ref=e109]: Q
            - generic [ref=e110]: ↑
        - button "Next line" [ref=e111] [cursor=pointer]:
          - generic [ref=e112]: Next line
          - generic [ref=e113]:
            - generic [ref=e114]: E
            - generic [ref=e115]: ↓
        - button "Replay only" [ref=e116] [cursor=pointer]:
          - generic [ref=e117]: Replay only
          - generic [ref=e118]: R
        - button "Sync line end" [ref=e119] [cursor=pointer]:
          - generic [ref=e120]: End line
          - generic [ref=e121]: T
        - button "Back tiny amount" [ref=e122] [cursor=pointer]:
          - generic [ref=e123]: −100ms time
          - generic [ref=e124]: Z
        - button "Forward tiny amount" [ref=e125] [cursor=pointer]:
          - generic [ref=e126]: +100ms time
          - generic [ref=e127]: V
        - button "Back small amount" [ref=e128] [cursor=pointer]:
          - generic [ref=e129]: −200ms time
          - generic [ref=e130]: A
        - button "Forward small amount" [ref=e131] [cursor=pointer]:
          - generic [ref=e132]: +200ms time
          - generic [ref=e133]: F
        - button "Back medium amount" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: −400ms time
          - generic [ref=e136]: S
        - button "Forward medium amount" [ref=e137] [cursor=pointer]:
          - generic [ref=e138]: +400ms time
          - generic [ref=e139]: D
        - button "Back large amount" [ref=e140] [cursor=pointer]:
          - generic [ref=e141]: −1000ms time
          - generic [ref=e142]: X
        - button "Forward large amount" [ref=e143] [cursor=pointer]:
          - generic [ref=e144]: +1000ms time
          - generic [ref=e145]: C
    - generic [ref=e149]:
      - banner "Main field header" [ref=e150]:
        - generic [ref=e151]: Main
        - generic "Wrap marked translations in parentheses" [ref=e152] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e153]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e154] [cursor=pointer]:
          - checkbox "↩" [ref=e155]
          - text: ↩
      - list "Lyric lines" [ref=e157]
```

# Test source

```ts
  1  | const { test, expect } = require("@linebyline/test-helpers");
  2  | 
  3  | test("title", async ({ page }) => {
  4  |   await expect(page).toHaveTitle(/LineByLine/);
  5  | });
  6  | 
  7  | test("favicon", async ({ page }) => {
  8  |   const href = await page.locator('link[rel="icon"]').getAttribute("href");
  9  |   expect(href).toContain("image/svg+xml");
  10 |   expect(href).toContain("%23ffff00"); // yellow strokes
  11 |   expect(href).toContain("%2300ff00"); // green checkmarks
  12 | });
  13 | 
  14 | test("landing", async ({ page }) => {
  15 |   const errors = [];
  16 |   page.on("pageerror", (e) => errors.push(`Uncaught: ${e.message}`));
  17 |   page.on("console", (msg) => {
  18 |     if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  19 |   });
  20 |   // Visual snapshot (already exists)
  21 |   await expect(page).toHaveScreenshot();
  22 |   // No JS errors on load
  23 |   expect(errors).toEqual([]);
  24 |   // Layout structure
  25 |   await expect(page.locator("#menu-bar")).toBeVisible();
  26 |   await expect(page.locator("#left-panel")).toBeVisible();
  27 |   await expect(page.locator("#editor-wrapper")).toBeVisible();
  28 |   // Controls grid rendered (rebuildHkPanel ran)
  29 |   await expect(page.locator("#hk-grid .hk-cell")).toHaveCount(16);
  30 |   // File picker exists but is hidden
  31 |   await expect(page.locator("#file-picker")).toHaveCSS("display", "none");
  32 | });
  33 | 
  34 | test("button-tint", async ({ page }) => {
  35 |   const button = page.getByRole("button", { name: "Play" });
> 36 |   await button.hover();
     |                ^ Error: locator.hover: Error: strict mode violation: getByRole('button', { name: 'Play' }) resolved to 3 elements:
  37 |   await expect(button).toHaveScreenshot();
  38 | });
  39 | 
  40 | test("button-feedback", async ({ page }) => {
  41 |   const button = page.getByRole("button", { name: "Play" });
  42 |   await button.click();
  43 |   await expect(button).toHaveScreenshot();
  44 | });
  45 | 
```