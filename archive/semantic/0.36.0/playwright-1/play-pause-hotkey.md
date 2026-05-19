# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playback.spec.js >> play-pause-hotkey
- Location: tests\playback.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Play' })
Expected: visible
Error: strict mode violation: getByRole('button', { name: 'Play' }) resolved to 3 elements:
    1) <button class="media-btn" aria-label="Play" id="btn-play-pause" title="Play/pause (Ctrl+Space)">…</button> aka getByRole('button', { name: 'Play', exact: true })
    2) <div tabindex="0" role="button" class="hk-cell" title="Play/pause" aria-label="Play/pause">…</div> aka getByRole('button', { name: 'Play/pause' })
    ...

Call log:
  - Expect "toBeVisible" with timeout 5000ms
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
        - generic "Song title" [ref=e52]: I Wish I Could Identify That Smell
        - generic "Song artist" [ref=e53]: The Jazz Kissingers
        - slider "Playback position" [ref=e54] [cursor=pointer]
        - generic [ref=e55]:
          - generic "Current position" [ref=e56]: 0:01
          - generic "Duration" [ref=e57]: 0:13
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
      - list "Lyric lines" [ref=e157]:
        - listitem [ref=e158] [cursor=pointer]: "[00:00.00] I wish I could identify that smell"
        - listitem [ref=e159] [cursor=pointer]: "[00:03.06] That smell"
        - listitem [ref=e160]
        - listitem [ref=e161] [cursor=pointer]: "[00:06.35] It disturbs my concentration"
        - listitem [ref=e162] [cursor=pointer]: "[00:08.08] And it bothers me to hell"
        - listitem [ref=e163] [cursor=pointer]: "[00:09.91] Oh, I wish I could identify that smell"
        - listitem [ref=e164] [cursor=pointer]: "[00:12.12]"
```

# Test source

```ts
  1   | const { test, expect } = require("@linebyline/test-helpers");
  2   | 
  3   | test("play-pause-hotkey", async ({ page, media }) => {
  4   |   await page
  5   |     .locator("#file-picker")
  6   |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  7   |   await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  8   |   await page.keyboard.press("Space");
  9   |   await expect(page.locator("#audio-box")).toContainText("0:01");
  10  |   await page.keyboard.press("Space");
> 11  |   await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  12  | });
  13  | 
  14  | test("play-pause-typing", async ({ page, media }) => {
  15  |   await page
  16  |     .locator("#file-picker")
  17  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  18  |   await page.keyboard.press("Backquote");
  19  |   await page.keyboard.press("Control+Space"); //Sometimes this fails if many tests are running
  20  |   await expect(page.locator("#audio-box")).toContainText("0:01");
  21  |   await page.keyboard.press("Control+Space");
  22  |   await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  23  | });
  24  | 
  25  | test("seek-click", async ({ page, media }) => {
  26  |   await page
  27  |     .locator("#file-picker")
  28  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  29  |   async function seekTo(page, fraction) {
  30  |     const box = await page.locator("#progress-wrap").boundingBox();
  31  |     await page.mouse.click(
  32  |       box.x + box.width * fraction,
  33  |       box.y + box.height / 2,
  34  |     );
  35  |   }
  36  |   await seekTo(page, 1 / 13);
  37  |   await page.getByRole("button", { name: "Play" }).click();
  38  |   await expect(page.locator("#audio-box")).toContainText("0:01");
  39  | });
  40  | 
  41  | test("seek-scroll", async ({ page, media }) => {
  42  |   await page
  43  |     .locator("#file-picker")
  44  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  45  |   await page.locator("#progress-wrap").hover();
  46  |   await page.mouse.wheel(0, -120);
  47  |   await expect(page.locator("#audio-box")).toContainText("0:05");
  48  | });
  49  | 
  50  | test("seek-typing", async ({ page, media }) => {
  51  |   await page
  52  |     .locator("#file-picker")
  53  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  54  |   await page.keyboard.press("Backquote");
  55  |   await page.keyboard.press("Control+0");
  56  |   await expect(page.locator("#audio-box")).toContainText("0:05");
  57  | });
  58  | 
  59  | test("speed-typing", async ({ page, media }) => {
  60  |   await page
  61  |     .locator("#file-picker")
  62  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  63  |   await page.keyboard.press("Backquote");
  64  |   for (let i = 0; i < 2; i++) await page.keyboard.press("Control+1");
  65  |   await expect(page.locator("#speed-val")).toHaveValue("0.83");
  66  |   await page.keyboard.press("Control+2");
  67  |   await expect(page.locator("#speed-val")).toHaveValue("0.91");
  68  |   await page.keyboard.press("Control+3");
  69  |   await expect(page.locator("#speed-val")).toHaveValue("1");
  70  | });
  71  | 
  72  | test("volume-mute-up", async ({ page }) => {
  73  |   await page.locator("#vol-slider").hover();
  74  |   await page.keyboard.press("Control+m");
  75  |   await page.mouse.wheel(0, -120);
  76  |   await expect(page.locator("#vol-slider")).toHaveValue("0.1");
  77  | });
  78  | 
  79  | test("volume-mute-down", async ({ page }) => {
  80  |   await page.locator("#vol-slider").hover();
  81  |   for (let i = 0; i < 2; i++) await page.keyboard.press("Control+m");
  82  |   await page.mouse.wheel(0, 120);
  83  |   await expect(page.locator("#vol-slider")).toHaveValue("0.9");
  84  | });
  85  | 
  86  | test("audio-missing-noop", async ({ page, media }) => {
  87  |   await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
  88  |     "audio-missing-load.png",
  89  |   );
  90  |   await page.keyboard.press("Space");
  91  |   await page.keyboard.press("ArrowRight");
  92  |   await page.keyboard.press("Control+1");
  93  |   await page.locator("#progress-wrap").click();
  94  |   await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
  95  |     "audio-missing-play.png",
  96  |   );
  97  |   await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  98  |   await expect(
  99  |     page.getByText("audio Unknown Artist 0:000:13"),
  100 |   ).toHaveScreenshot("audio-import-reset.png");
  101 | });
  102 | 
```