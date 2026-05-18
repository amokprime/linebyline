# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings.spec.js >> persistence
- Location: tests\settings.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('spinbutton', { name: 'Seek offset (ms): shifts' })

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
      - option "System Sans"
      - option "System Serif" [selected]
    - generic [ref=e16]:
      - spinbutton "Font size" [ref=e17]: "20"
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
          - spinbutton "Playback speed" [active] [ref=e59]: "1.5"
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
        - listitem [ref=e158] [cursor=pointer]: I wish I could identify that smell
        - listitem [ref=e159] [cursor=pointer]: That smell
        - listitem [ref=e160]
        - listitem [ref=e161] [cursor=pointer]: It disturbs my concentration
        - listitem [ref=e162] [cursor=pointer]: And it bothers me to hell
        - listitem [ref=e163] [cursor=pointer]: Oh, I wish I could identify that smell
```

# Test source

```ts
  1   | const { test, expect } = require("@linebyline/test-helpers");
  2   | 
  3   | test("persistence", async ({ page, media }) => {
  4   |   const exp = (role, name, v, soft) =>
  5   |     (soft ? expect.soft : expect)(page.getByRole(role, { name })).toHaveValue(
  6   |       v,
  7   |     );
  8   |   const titlebar = page.getByText("📂 💾 System Sans System");
  9   |   const newmeta = "[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]";
  10  |   await page
  11  |     .locator("#file-picker")
  12  |     .setInputFiles([media("plain_english.lrc")]);
  13  |   // Set
  14  |   await page
  15  |     .getByRole("combobox", { name: "Editor font" })
  16  |     .selectOption("serif");
  17  |   await page.getByRole("spinbutton", { name: "Font size" }).fill("20");
  18  |   await page.getByRole("spinbutton", { name: "Playback speed" }).fill("1.5");
  19  |   await page
  20  |     .getByRole("spinbutton", { name: "Seek offset (ms): shifts" })
> 21  |     .fill("-400");
      |      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  22  |   await page.keyboard.press("Control+.");
  23  |   await page.keyboard.press("Control+,");
  24  |   await page.getByRole("checkbox", { name: "Moving to previous line" }).check();
  25  |   await page.getByRole("spinbutton", { name: "Tiny" }).fill("99");
  26  |   await page.locator("#s-default-meta").fill(newmeta);
  27  |   await page.keyboard.press("Escape");
  28  |   await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  29  |   // Reload
  30  |   await page.reload();
  31  |   await page
  32  |     .locator("#file-picker")
  33  |     .setInputFiles([media("plain_english.lrc")]);
  34  |   await exp("combobox", "Editor font", "serif");
  35  |   await exp("spinbutton", "Font size", "20");
  36  |   await exp("spinbutton", "Playback speed", "1.5", true); // soft: confirmed broken
  37  |   await exp("spinbutton", "Seek offset (ms): shifts", "-400");
  38  |   await expect(titlebar).toHaveScreenshot("titlebar-dark.png");
  39  |   await page.keyboard.press("Control+,");
  40  |   await expect(
  41  |     page.getByRole("checkbox", { name: "Moving to previous line" }),
  42  |   ).toBeChecked();
  43  |   await exp("spinbutton", "Tiny", "99");
  44  |   await expect(page.locator("#s-default-meta")).toHaveValue(newmeta);
  45  |   // Reset
  46  |   await page.locator("#settings-body").focus();
  47  |   await page.locator("body").press("ControlOrMeta+\\");
  48  |   await page.keyboard.press("Enter");
  49  |   await exp("combobox", "Editor font", "system-ui,sans-serif");
  50  |   await exp("spinbutton", "Font size", "14");
  51  |   await exp("spinbutton", "Playback speed", "1"); // hard: reset should work even for broken-persist items
  52  |   await exp("spinbutton", "Seek offset (ms): shifts", "-600");
  53  |   await expect(
  54  |     page.getByRole("checkbox", { name: "Moving to previous line" }),
  55  |   ).not.toBeChecked();
  56  |   await exp("spinbutton", "Tiny", "100");
  57  |   await expect(page.locator("#s-default-meta")).toHaveValue(
  58  |     "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n",
  59  |   );
  60  | });
  61  | 
  62  | test("settings-window", async ({ page }) => {
  63  |   await page.keyboard.press("Control+,");
  64  |   await expect(page.locator("#settings-overlay")).toHaveClass(/open/);
  65  |   await page.evaluate(() => {
  66  |     const win = document.getElementById("settings-win");
  67  |     const body = document.getElementById("settings-body");
  68  |     win.style.maxHeight = "none";
  69  |     win.style.overflow = "visible";
  70  |     body.style.overflow = "visible";
  71  |     body.style.flex = "none";
  72  |   });
  73  |   await expect(page.locator("#settings-body")).toHaveScreenshot();
  74  |   await page.keyboard.press("Escape");
  75  |   await expect(page.locator("#settings-overlay")).not.toHaveClass(/open/);
  76  | });
  77  | 
  78  | test("search-check", async ({ page }) => {
  79  |   await page.keyboard.press("Control+,");
  80  |   await page
  81  |     .getByRole("textbox", { name: "Search…" })
  82  |     .pressSequentially("Moving to n");
  83  |   for (let i = 0; i < 2; i++) await page.keyboard.press("Tab");
  84  |   await page.keyboard.press("Space");
  85  |   await expect(
  86  |     page.getByRole("checkbox", { name: "Moving to next line" }),
  87  |   ).toBeChecked();
  88  | });
  89  | 
  90  | test("search-field", async ({ page }) => {
  91  |   await page.keyboard.press("Control+,");
  92  |   await page
  93  |     .getByRole("textbox", { name: "Search…" })
  94  |     .pressSequentially("Default");
  95  |   for (let i = 0; i < 2; i++) await page.keyboard.press("Tab");
  96  |   expect(await page.locator("#s-default-meta").inputValue()).toMatchSnapshot();
  97  | });
  98  | 
  99  | test("assign-ok-click", async ({ page }) => {
  100 |   await page.keyboard.press("Control+,");
  101 |   await page.getByRole("textbox", { name: "Search…" }).pressSequentially("y/");
  102 |   await page.getByRole("textbox").nth(1).click();
  103 |   await page.keyboard.press("NumpadAdd");
  104 |   await expect(page.getByRole("textbox").nth(1)).toHaveValue("+");
  105 | });
  106 | 
  107 | test("assign-reserved-click", async ({ page }) => {
  108 |   await page.keyboard.press("Control+,");
  109 |   await page.getByRole("textbox", { name: "Search…" }).pressSequentially("of");
  110 |   await page.locator("#hk-settings-rows").getByRole("textbox").click();
  111 |   await page.keyboard.press("Control+c");
  112 |   await expect(page.getByText('⚠ "Ctrl+C" is reserved by the')).toBeVisible();
  113 |   await expect(
  114 |     page.locator("#hk-settings-rows").getByRole("textbox"),
  115 |   ).toHaveValue("Shift+~");
  116 |   await page.getByRole("button", { name: "↺ Default" }).click();
  117 |   await expect(page.getByText("Hotkeys MenuOpen✕Replace↺")).toHaveScreenshot();
  118 | });
  119 | 
  120 | test("assign-conflict-tab", async ({ page }) => {
  121 |   await page.keyboard.press("Control+,");
```