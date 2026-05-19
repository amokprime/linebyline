# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: undo-redo.spec.js >> import-one-secondary
- Location: tests\undo-redo.spec.js:21:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "filechooser"
============================================================
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
    - button "Hide last secondary field" [ref=e23] [cursor=pointer]: Hide field
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
    - generic [ref=e148]:
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
      - generic [ref=e158]:
        - banner "Secondary 1 field header" [ref=e159]:
          - generic [ref=e160]: Secondary 1
          - generic [ref=e161]:
            - button "Import secondary lyrics file" [ref=e162] [cursor=pointer]: 📂
            - generic "Wrap all secondary lines in parentheses" [ref=e163] [cursor=pointer]:
              - checkbox "( )" [checked] [ref=e164]
              - text: ( )
        - textbox "Secondary 1 lyrics" [ref=e165]
```

# Test source

```ts
  1   | // @ts-check
  2   | "use strict";
  3   | 
  4   | const fs = require("node:fs");
  5   | const path = require("node:path");
  6   | const { test: base, expect } = require("@playwright/test");
  7   | 
  8   | /**
  9   |  * Scans archive/semantic/ for the highest semver directory
  10  |  * and returns the URL path to the matching linebyline HTML file.
  11  |  *
  12  |  * Pattern: archive/semantic/X.X.X/linebyline-X.X.X.html
  13  |  * where each X is a non-negative integer.
  14  |  *
  15  |  * @param {string} [archiveRoot='archive/semantic'] - Relative path from project root
  16  |  * @returns {string} URL path like /archive/semantic/0.35.18/linebyline-0.35.18.html
  17  |  */
  18  | function findLatestVersion(archiveRoot = "archive/semantic") {
  19  |   const absRoot = path.resolve(process.cwd(), archiveRoot);
  20  | 
  21  |   if (!fs.existsSync(absRoot)) {
  22  |     throw new Error(`Archive directory not found: ${absRoot}`);
  23  |   }
  24  | 
  25  |   const entries = fs.readdirSync(absRoot, { withFileTypes: true });
  26  | 
  27  |   const versions = entries
  28  |     .filter((d) => d.isDirectory() && /^\d+\.\d+\.\d+$/.test(d.name))
  29  |     .map((d) => {
  30  |       const [major, minor, patch] = d.name.split(".").map(Number);
  31  |       return { name: d.name, major, minor, patch };
  32  |     })
  33  |     .sort(
  34  |       (a, b) => b.major - a.major || b.minor - a.minor || b.patch - a.patch,
  35  |     );
  36  | 
  37  |   if (versions.length === 0) {
  38  |     throw new Error(`No semver directories (X.X.X) found in ${absRoot}`);
  39  |   }
  40  | 
  41  |   const latest = versions[0].name;
  42  |   const htmlFile = `linebyline-${latest}.html`;
  43  |   const htmlAbsPath = path.resolve(
  44  |     process.cwd(),
  45  |     archiveRoot,
  46  |     latest,
  47  |     htmlFile,
  48  |   );
  49  | 
  50  |   if (!fs.existsSync(htmlAbsPath)) {
  51  |     throw new Error(
  52  |       `Version directory ${latest} exists but expected file not found: ${htmlAbsPath}`,
  53  |     );
  54  |   }
  55  | 
  56  |   return `/${archiveRoot}/${latest}/${htmlFile}`;
  57  | }
  58  | 
  59  | const MEDIA_DIR = path.join(__dirname, "..", "media");
  60  | /**
  61  |  * @typedef {object} CustomFixtures
  62  |  * @property {(filename: string) => string} media - Resolves a media filename to an absolute path
  63  |  * @property {(filename: string) => string} readMedia - Reads a media file's contents as UTF-8
  64  |  * @property {(nth: number, filename: string) => Promise<void>} importSecondary - Opens nth 📂 button and sets files
  65  |  */
  66  | 
  67  | const test =
  68  |   /** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & CustomFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
  69  |     base.extend({
  70  |       page: async ({ page }, use) => {
  71  |         await page.goto(findLatestVersion());
  72  |         await use(page);
  73  |       },
  74  |       media: async ({}, use) => {
  75  |         await use((/** @type {string} */ filename) =>
  76  |           path.join(MEDIA_DIR, filename),
  77  |         );
  78  |       },
  79  |       readMedia: async ({}, use) => {
  80  |         await use((/** @type {string} */ filename) =>
  81  |           fs.readFileSync(path.join(MEDIA_DIR, filename), "utf-8"),
  82  |         );
  83  |       },
  84  |       importSecondary: async ({ page, media }, use) => {
  85  |         await use(
  86  |           async (/** @type {number} */ nth, /** @type {string} */ filename) => {
  87  |             const [fc] = await Promise.all([
> 88  |               page.waitForEvent("filechooser"),
      |                    ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
  89  |               page.getByRole("button", { name: "📂" }).nth(nth).click(),
  90  |             ]);
  91  |             await fc.setFiles([media(filename)]);
  92  |           },
  93  |         );
  94  |       },
  95  |     })
  96  |   );
  97  | /**
  98  |  * Press Tab repeatedly until the element matching the selector receives focus.
  99  |  * @param {import('@playwright/test').Page} page
  100 |  * @param {string} selector - CSS selector
  101 |  * @param {{ index?: number, maxTabs?: number }} [options]
  102 |  */
  103 | async function tabUntilFocused(page, selector, options = {}) {
  104 |   const { index = 0, maxTabs = 50 } = options;
  105 |   const locator = page.locator(selector).nth(index);
  106 |   for (let i = 0; i < maxTabs; i++) {
  107 |     if (
  108 |       await locator.evaluate(
  109 |         (/** @type {Element} */ el) => el === document.activeElement,
  110 |       )
  111 |     )
  112 |       return;
  113 |     await page.keyboard.press("Tab");
  114 |   }
  115 |   throw new Error(
  116 |     `tabUntilFocused: ${selector}[${index}] not focused after ${maxTabs} Tabs`,
  117 |   );
  118 | }
  119 | module.exports = { findLatestVersion, test, expect, tabUntilFocused };
  120 | 
```