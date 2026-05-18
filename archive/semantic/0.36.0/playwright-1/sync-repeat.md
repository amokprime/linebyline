# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: undo-redo.spec.js >> sync-repeat
- Location: tests\undo-redo.spec.js:65:1

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: locator('#main-lines')
Expected pattern: not /\d{2}:\d{2}/
Received string: "[00:00.00] I wish I could identify that smellThat smell It disturbs my concentrationAnd it bothers me to hellOh, I wish I could identify that smell"
Timeout: 5000ms

Call log:
  - Expect "not toContainText" with timeout 5000ms
  - waiting for locator('#main-lines')
    8 × locator resolved to <div role="list" id="main-lines" class="lyric-area" aria-label="Lyric lines">…</div>
      - unexpected value "[00:00.00] I wish I could identify that smellThat smell It disturbs my concentrationAnd it bothers me to hellOh, I wish I could identify that smell"

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
        - generic "Song title" [ref=e52]: plain_english
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
      - alert [ref=e156]: ⚠ Missing trailing timestamp
      - list "Lyric lines" [ref=e158]:
        - listitem [ref=e159] [cursor=pointer]: "[00:00.00] I wish I could identify that smell"
        - listitem [ref=e160] [cursor=pointer]: That smell
        - listitem [ref=e161]
        - listitem [ref=e162] [cursor=pointer]: It disturbs my concentration
        - listitem [ref=e163] [cursor=pointer]: And it bothers me to hell
        - listitem [ref=e164] [cursor=pointer]: Oh, I wish I could identify that smell
```

# Test source

```ts
  1   | const { test, expect } = require("@linebyline/test-helpers");
  2   | const META =
  3   |   "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";
  4   | const ta = (page) => page.locator("#main-textarea");
  5   | 
  6   | test("import-main", async ({ page, media }) => {
  7   |   await page
  8   |     .locator("#file-picker")
  9   |     .setInputFiles([media("plain_english.lrc")]);
  10  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  11  |     "import-main-after.txt",
  12  |   );
  13  |   await page.keyboard.press("Control+z");
  14  |   await expect(page.locator("#main-textarea")).toHaveValue(META);
  15  |   await page.keyboard.press("Control+y");
  16  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  17  |     "import-main-after.txt",
  18  |   );
  19  | });
  20  | 
  21  | test("import-one-secondary", async ({ page, importSecondary }) => {
  22  |   await page.keyboard.press("Control+4");
  23  |   await importSecondary(1, "plain_spanish.lrc");
  24  |   expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
  25  |     "import-one-after.txt",
  26  |   );
  27  |   await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  28  |   await expect(page.getByRole("textbox")).toHaveValue("");
  29  |   await page.keyboard.press("Control+y");
  30  |   expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot(
  31  |     "import-one-after.txt",
  32  |   );
  33  | });
  34  | 
  35  | //Placeholder for when one secondary is fixed
  36  | 
  37  | test("paste-main", async ({ page, readMedia }) => {
  38  |   await page.locator("#main-lines").click();
  39  |   await page.evaluate((text) => {
  40  |     navigator.clipboard.writeText(text);
  41  |   }, readMedia("plain_english.lrc"));
  42  |   await page.keyboard.press("Control+v");
  43  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  44  |     "paste-main-after.txt",
  45  |   );
  46  |   await page.keyboard.press("Control+z");
  47  |   await expect(page.locator("#main-textarea")).toHaveValue(META);
  48  |   await page.keyboard.press("Control+y");
  49  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  50  |     "paste-main-after.txt",
  51  |   );
  52  | });
  53  | 
  54  | test("sync-rapid", async ({ page, media }) => {
  55  |   await page
  56  |     .locator("#file-picker")
  57  |     .setInputFiles([media("plain_english.lrc")]);
  58  |   await page.keyboard.press("w");
  59  |   await page.keyboard.press("Control+z");
  60  |   await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
  61  |   await page.keyboard.press("Control+Y");
  62  |   await expect(page.locator("#main-lines")).toContainText(/\d{2}:\d{2}/);
  63  | });
  64  | 
  65  | test("sync-repeat", async ({ page, media }) => {
  66  |   await page
  67  |     .locator("#file-picker")
  68  |     .setInputFiles([media("plain_english.lrc")]);
  69  |   for (let i = 0; i < 3; i++) await page.keyboard.press("w");
  70  |   for (let i = 0; i < 3; i++) await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
> 71  |   await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
      |                                                 ^ Error: expect(locator).not.toContainText(expected) failed
  72  | });
  73  | 
  74  | test("typing-debounce", async ({ page }) => {
  75  |   await page.keyboard.press("Backquote");
  76  |   await page.locator("#main-textarea").pressSequentially("abc");
  77  |   await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
  78  |   await page.keyboard.press("Control+z");
  79  |   await expect(page.locator("#main-textarea")).toHaveValue(META);
  80  |   await page.keyboard.press("Control+y");
  81  |   await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
  82  | });
  83  | 
  84  | test("merge", async ({ page, media, importSecondary }) => {
  85  |   await page
  86  |     .locator("#file-picker")
  87  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  88  |   await page.keyboard.press("Control+4");
  89  |   await importSecondary(1, "plain_french.lrc");
  90  |   await page.keyboard.press("Control+6");
  91  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  92  |     "merge-after-textarea.txt",
  93  |   );
  94  |   await page.keyboard.press("Control+z");
  95  |   // Pre-merge state is synced_english — can't use META since import changed it
  96  |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  97  |     "merge-before-textarea.txt",
  98  |   );
  99  |   await page.keyboard.press("Control+y");
  100 |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  101 |     "merge-after-textarea.txt",
  102 |   );
  103 | });
  104 | 
```