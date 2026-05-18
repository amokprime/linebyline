# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playback.spec.js >> play-pause-typing
- Location: tests\playback.spec.js:14:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#audio-box')
Timeout: 5000ms
- Expected substring  -  1
+ Received string     + 42

- 0:01
+
+       I Wish I Could Identify That Smell
+       The Jazz Kissingers
+       
+       0:020:13
+       
+         
+         x
+         
+           ▲
+           ▼
+         
+         
+           
+         
+         
+           
+           
+         
+         
+           
+         
+       
+       
+         
+         ms
+         
+           ▲
+           ▼
+         
+         Sync fileCtrl+I
+         
+       
+       
+         
+           
+           
+         
+         
+         100%
+       
+     

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#audio-box')
    6 × locator resolved to <div role="region" id="audio-box" aria-labelledby="now-playing-label">…</div>
      - unexpected value "
      I Wish I Could Identify That Smell
      The Jazz Kissingers
      
      0:000:13
      
        
        x
        
          ▲
          ▼
        
        
          
        
        
          
          
        
        
          
        
      
      
        
        ms
        
          ▲
          ▼
        
        Sync fileCtrl+I
        
      
      
        
          
          
        
        
        100%
      
    "
    - locator resolved to <div role="region" id="audio-box" aria-labelledby="now-playing-label">…</div>
    - unexpected value "
      I Wish I Could Identify That Smell
      The Jazz Kissingers
      
      0:020:13
      
        
        x
        
          ▲
          ▼
        
        
          
        
        
          
          
        
        
          
        
      
      
        
        ms
        
          ▲
          ▼
        
        Sync fileCtrl+I
        
      
      
        
          
          
        
        
        100%
      
    "

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - generic "Current position" [ref=e56]: 0:05
          - generic "Duration" [ref=e57]: 0:13
        - generic [ref=e58]:
          - spinbutton "Playback speed" [ref=e59]: "1"
          - generic [ref=e60]: x
          - generic [ref=e61]:
            - button "▲" [ref=e62] [cursor=pointer]
            - button "▼" [ref=e63] [cursor=pointer]
          - button "Seek back" [ref=e64] [cursor=pointer]:
            - img [ref=e65]
          - button "Pause" [ref=e68] [cursor=pointer]:
            - img [ref=e69]
          - button "Seek forward" [ref=e72] [cursor=pointer]:
            - img [ref=e73]
        - generic [ref=e76]:
          - spinbutton "Seek offset in milliseconds" [ref=e77]: "-600"
          - generic [ref=e78]: ms
          - generic [ref=e79]:
            - button "▲" [ref=e80] [cursor=pointer]
            - button "▼" [ref=e81] [cursor=pointer]
          - button "Sync file" [ref=e82] [cursor=pointer]:
            - text: Sync file
            - generic [ref=e83]: Ctrl+I
        - generic [ref=e84]:
          - button "Mute" [ref=e85] [cursor=pointer]:
            - img [ref=e86]
          - slider "Volume" [ref=e88] [cursor=pointer]: "1"
          - generic "Volume percentage" [ref=e89]: 100%
      - generic [ref=e90]: Controls
      - group "Controls" [ref=e91]:
        - generic [ref=e92]:
          - button "Toggle offset mode" [ref=e93] [cursor=pointer]:
            - generic [ref=e94]: Offset time
            - generic [ref=e95]: Shift+~
          - button "Toggle mode" [ref=e96] [cursor=pointer]:
            - generic [ref=e97]: Typing mode
            - generic [ref=e98]: "`"
        - button "Play/pause" [disabled] [ref=e99] [cursor=pointer]:
          - generic [ref=e100]: Play/pause
          - generic [ref=e101]: Space
        - button "Sync line start" [disabled] [ref=e102] [cursor=pointer]:
          - generic [ref=e103]: Sync line
          - generic [ref=e104]:
            - generic [ref=e105]: W
            - generic [ref=e106]: Enter
        - button "Previous line" [disabled] [ref=e107] [cursor=pointer]:
          - generic [ref=e108]: Previous line
          - generic [ref=e109]:
            - generic [ref=e110]: Q
            - generic [ref=e111]: ↑
        - button "Next line" [disabled] [ref=e112] [cursor=pointer]:
          - generic [ref=e113]: Next line
          - generic [ref=e114]:
            - generic [ref=e115]: E
            - generic [ref=e116]: ↓
        - button "Replay only" [disabled] [ref=e117] [cursor=pointer]:
          - generic [ref=e118]: Replay only
          - generic [ref=e119]: R
        - button "Sync line end" [disabled] [ref=e120] [cursor=pointer]:
          - generic [ref=e121]: End line
          - generic [ref=e122]: T
        - button "Back tiny amount" [disabled] [ref=e123] [cursor=pointer]:
          - generic [ref=e124]: −100ms time
          - generic [ref=e125]: Z
        - button "Forward tiny amount" [disabled] [ref=e126] [cursor=pointer]:
          - generic [ref=e127]: +100ms time
          - generic [ref=e128]: V
        - button "Back small amount" [disabled] [ref=e129] [cursor=pointer]:
          - generic [ref=e130]: −200ms time
          - generic [ref=e131]: A
        - button "Forward small amount" [disabled] [ref=e132] [cursor=pointer]:
          - generic [ref=e133]: +200ms time
          - generic [ref=e134]: F
        - button "Back medium amount" [disabled] [ref=e135] [cursor=pointer]:
          - generic [ref=e136]: −400ms time
          - generic [ref=e137]: S
        - button "Forward medium amount" [disabled] [ref=e138] [cursor=pointer]:
          - generic [ref=e139]: +400ms time
          - generic [ref=e140]: D
        - button "Back large amount" [disabled] [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: −1000ms time
          - generic [ref=e143]: X
        - button "Forward large amount" [disabled] [ref=e144] [cursor=pointer]:
          - generic [ref=e145]: +1000ms time
          - generic [ref=e146]: C
    - generic [ref=e150]:
      - banner "Main field header" [ref=e151]:
        - generic [ref=e152]: Main
        - generic "Wrap marked translations in parentheses" [ref=e153] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e154]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e155] [cursor=pointer]:
          - checkbox "↩" [ref=e156]
          - text: ↩
      - textbox "Main lyric text" [active] [ref=e157]: "[ti: I Wish I Could Identify That Smell] [ar: The Jazz Kissingers] [al: microSong Entries] [re: LineByLine, https://amokprime.github.io/linebyline/] [00:00.00] I wish I could identify that smell [00:03.06] That smell [00:06.35] It disturbs my concentration [00:08.08] And it bothers me to hell [00:09.91] Oh, I wish I could identify that smell [00:12.12]"
  - generic [ref=e158]: "Playing line 7: That smell"
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
  11  |   await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  12  | });
  13  | 
  14  | test("play-pause-typing", async ({ page, media }) => {
  15  |   await page
  16  |     .locator("#file-picker")
  17  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  18  |   await page.keyboard.press("Backquote");
  19  |   await page.keyboard.press("Control+Space"); //Sometimes this fails if many tests are running
> 20  |   await expect(page.locator("#audio-box")).toContainText("0:01");
      |                                            ^ Error: expect(locator).toContainText(expected) failed
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