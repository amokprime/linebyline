# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sync-adjust.spec.js >> replay-resume
- Location: tests\sync-adjust.spec.js:110:1

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
  23  |   await page
  24  |     .locator("#file-picker")
  25  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  26  |   await page.keyboard.press("v");
  27  |   await expect(page.getByText("[00:00.10] I wish I could")).toBeVisible();
  28  |   await page.keyboard.press("z");
  29  |   await expect(page.getByText("[00:00.00] I wish I could")).toBeVisible();
  30  | });
  31  | 
  32  | test("adjust-seek", async ({ page, media }) => {
  33  |   await page
  34  |     .locator("#file-picker")
  35  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  36  |   await page.keyboard.press("Shift+Backquote");
  37  |   await page.keyboard.press("v");
  38  |   await expect(
  39  |     page.getByRole("spinbutton", { name: "Seek offset (ms): shifts" }),
  40  |   ).toHaveValue("-500");
  41  |   await page.keyboard.press("Control+i");
  42  |   await expect(page.getByText("[00:02.56] That smell")).toBeVisible();
  43  |   await page.keyboard.press("z");
  44  |   await expect(
  45  |     page.getByRole("spinbutton", { name: "Seek offset (ms): shifts" }),
  46  |   ).toHaveValue("-600");
  47  | });
  48  | 
  49  | test("replay-r", async ({ page, media }) => {
  50  |   await page
  51  |     .locator("#file-picker")
  52  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  53  |   await page.keyboard.press("ArrowDown");
  54  |   await page.keyboard.press("r");
  55  |   await expect(
  56  |     page.getByText(
  57  |       "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
  58  |     ),
  59  |   ).toHaveScreenshot();
  60  | });
  61  | 
  62  | test("replay-shift+r", async ({ page, media }) => {
  63  |   await page
  64  |     .locator("#file-picker")
  65  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  66  |   await page.keyboard.press("Shift+Backquote");
  67  |   await page.keyboard.press("d");
  68  |   await page.keyboard.press("f");
  69  |   await page.keyboard.press("End");
  70  |   await page.keyboard.press("ArrowUp");
  71  |   await page.keyboard.press("Shift+r");
  72  |   await expect(
  73  |     page.getByText(
  74  |       "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
  75  |     ),
  76  |   ).toHaveScreenshot();
  77  | });
  78  | 
  79  | test("replay-moving-next", async ({ page, media }) => {
  80  |   await page
  81  |     .locator("#file-picker")
  82  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  83  |   await page.keyboard.press("Control+,");
  84  |   await page.getByText("Moving to next line").check();
  85  |   await page.keyboard.press("Escape");
  86  |   await page.keyboard.press("e");
  87  |   await expect(
  88  |     page.getByText(
  89  |       "[00:00.00] I wish I could identify that smell[00:03.06] That smell [00:06.35]",
  90  |     ),
  91  |   ).toHaveScreenshot();
  92  | });
  93  | 
  94  | test("replay-sync-time", async ({ page, media }) => {
  95  |   await page
  96  |     .locator("#file-picker")
  97  |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  98  |   await page.keyboard.press("Control+,");
  99  |   await page.getByText("Adjusting timestamp").check();
  100 |   await page.keyboard.press("Escape");
  101 |   await page.keyboard.press("ArrowDown");
  102 |   await page.keyboard.press("c");
  103 |   await expect(
  104 |     page.getByText(
  105 |       "[00:00.00] I wish I could identify that smell[00:04.06] That smell [00:06.35]",
  106 |     ),
  107 |   ).toHaveScreenshot();
  108 | });
  109 | 
  110 | test("replay-resume", async ({ page, media }) => {
  111 |   await page
  112 |     .locator("#file-picker")
  113 |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  114 |   await page.keyboard.press("Control+,");
  115 |   await page
  116 |     .getByRole("checkbox", { name: "Resuming currently playing" })
  117 |     .check();
  118 |   await page.keyboard.press("Escape");
  119 |   await page.locator("#left-panel-header").click(); //Not needed in real browser; Playwright loses focus
  120 |   await page.keyboard.press("Space");
  121 |   await expect(page.locator("#audio-box")).toContainText("0:01");
  122 |   await page.keyboard.press("Space");
> 123 |   await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  124 | });
  125 | 
  126 | test("replay-another-line", async ({ page, media }) => {
  127 |   await page
  128 |     .locator("#file-picker")
  129 |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  130 |   await page.keyboard.press("Control+,");
  131 |   await page.getByRole("checkbox", { name: "Playing another line" }).check();
  132 |   await page.keyboard.press("Escape");
  133 |   await page.getByText("[00:03.06] That smell").click();
  134 |   await expect(page).toHaveScreenshot();
  135 | });
  136 | 
  137 | test("sync-empty", async ({ page }) => {
  138 |   await page.locator("#main-lines").pressSequentially("asdfzxcvt");
  139 |   expect(await page.locator("#main-lines").innerText()).toMatchSnapshot(
  140 |     "sync-empty-lines.txt",
  141 |   );
  142 |   expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot(
  143 |     "sync-empty-textarea.txt",
  144 |   );
  145 | });
  146 | 
```