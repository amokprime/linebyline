# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.js >> axe-scan-settings
- Location: tests\accessibility.spec.js:19:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 37

- Array []
+ Array [
+   Object {
+     "description": "Ensure the banner landmark is at top level",
+     "help": "Banner landmark should not be contained in another landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-banner-is-top-level?application=playwright",
+     "id": "landmark-banner-is-top-level",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "role": "banner",
+             },
+             "id": "landmark-is-top-level",
+             "impact": "moderate",
+             "message": "The banner landmark is contained in another landmark.",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   The banner landmark is contained in another landmark.",
+         "html": "<div class=\"field-header\" style=\"justify-content:flex-start;\" role=\"banner\" aria-label=\"Main field header\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           ".field-header",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation "Main toolbar" [ref=e2]:
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
  - main [ref=e43]:
    - heading "LineByLine" [level=1] [ref=e44]
    - generic [ref=e45]:
      - generic [ref=e46]:
        - generic [ref=e47]: Now playing
        - button "Collapse panel" [ref=e48] [cursor=pointer]:
          - img [ref=e49]
      - region "Now playing" [ref=e52]:
        - generic "Song title" [ref=e53]: Unknown Title
        - generic "Song artist" [ref=e54]: Unknown Artist
        - slider "Playback position" [ref=e55] [cursor=pointer]
        - generic [ref=e56]:
          - generic "Current position" [ref=e57]: 0:00
          - generic "Duration" [ref=e58]: 0:00
        - generic [ref=e59]:
          - spinbutton "Playback speed" [ref=e60]: "1"
          - generic [ref=e61]: x
          - generic [ref=e62]:
            - button "▲" [ref=e63] [cursor=pointer]
            - button "▼" [ref=e64] [cursor=pointer]
          - button "Seek back" [ref=e65] [cursor=pointer]:
            - img [ref=e66]
          - button "Play" [ref=e69] [cursor=pointer]:
            - img [ref=e70]
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
            - generic [ref=e97]: Hotkey mode
            - generic [ref=e98]: "`"
        - button "Play/pause" [ref=e99] [cursor=pointer]:
          - generic [ref=e100]: Play/pause
          - generic [ref=e101]: Space
        - button "Sync line start" [ref=e102] [cursor=pointer]:
          - generic [ref=e103]: Sync line
          - generic [ref=e104]:
            - generic [ref=e105]: W
            - generic [ref=e106]: Enter
        - button "Previous line" [ref=e107] [cursor=pointer]:
          - generic [ref=e108]: Previous line
          - generic [ref=e109]:
            - generic [ref=e110]: Q
            - generic [ref=e111]: ↑
        - button "Next line" [ref=e112] [cursor=pointer]:
          - generic [ref=e113]: Next line
          - generic [ref=e114]:
            - generic [ref=e115]: E
            - generic [ref=e116]: ↓
        - button "Replay only" [ref=e117] [cursor=pointer]:
          - generic [ref=e118]: Replay only
          - generic [ref=e119]: R
        - button "Sync line end" [ref=e120] [cursor=pointer]:
          - generic [ref=e121]: End line
          - generic [ref=e122]: T
        - button "Back tiny amount" [ref=e123] [cursor=pointer]:
          - generic [ref=e124]: −100ms time
          - generic [ref=e125]: Z
        - button "Forward tiny amount" [ref=e126] [cursor=pointer]:
          - generic [ref=e127]: +100ms time
          - generic [ref=e128]: V
        - button "Back small amount" [ref=e129] [cursor=pointer]:
          - generic [ref=e130]: −200ms time
          - generic [ref=e131]: A
        - button "Forward small amount" [ref=e132] [cursor=pointer]:
          - generic [ref=e133]: +200ms time
          - generic [ref=e134]: F
        - button "Back medium amount" [ref=e135] [cursor=pointer]:
          - generic [ref=e136]: −400ms time
          - generic [ref=e137]: S
        - button "Forward medium amount" [ref=e138] [cursor=pointer]:
          - generic [ref=e139]: +400ms time
          - generic [ref=e140]: D
        - button "Back large amount" [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: −1000ms time
          - generic [ref=e143]: X
        - button "Forward large amount" [ref=e144] [cursor=pointer]:
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
      - list "Lyric lines" [ref=e158]
  - dialog "Settings" [ref=e160]:
    - generic [ref=e161]:
      - generic [ref=e162]: Settings
      - generic [ref=e163]:
        - textbox "Search settings" [active] [ref=e164]:
          - /placeholder: Search…
        - button "Switch to hotkey search mode" [ref=e165] [cursor=pointer]: ⌨
    - generic [ref=e166]:
      - generic [ref=e167]:
        - generic [ref=e168]: Instant Replay
        - generic [ref=e169] [cursor=pointer]:
          - checkbox "Moving to previous line" [ref=e170]
          - text: Moving to previous line
        - generic [ref=e171] [cursor=pointer]:
          - checkbox "Moving to next line" [ref=e172]
          - text: Moving to next line
        - generic [ref=e173] [cursor=pointer]:
          - checkbox "Resuming currently playing line" [ref=e174]
          - text: Resuming currently playing line
        - generic [ref=e175] [cursor=pointer]:
          - checkbox "Playing another line" [ref=e176]
          - text: Playing another line
        - generic [ref=e177] [cursor=pointer]:
          - checkbox "Adjusting seek offset" [ref=e178]
          - text: Adjusting seek offset
        - generic [ref=e179] [cursor=pointer]:
          - checkbox "Syncing line" [ref=e180]
          - text: Syncing line
        - generic [ref=e181] [cursor=pointer]:
          - checkbox "Adjusting timestamp" [ref=e182]
          - text: Adjusting timestamp
      - generic [ref=e183]:
        - generic [ref=e184]: Intervals
        - generic [ref=e185]:
          - generic [ref=e186]: Tiny
          - spinbutton "Tiny" [ref=e187]: "100"
          - generic [ref=e188]: ms
        - generic [ref=e189]:
          - generic [ref=e190]: Small
          - spinbutton "Small" [ref=e191]: "200"
          - generic [ref=e192]: ms
        - generic [ref=e193]:
          - generic [ref=e194]: Medium
          - spinbutton "Medium" [ref=e195]: "400"
          - generic [ref=e196]: ms
        - generic [ref=e197]:
          - generic [ref=e198]: Large
          - spinbutton "Large" [ref=e199]: "1000"
          - generic [ref=e200]: ms
        - generic [ref=e201]:
          - generic [ref=e202]: Seek increment
          - spinbutton "Seek increment" [ref=e203]: "5"
          - generic [ref=e204]: s
        - generic [ref=e205]:
          - generic [ref=e206]: Speed ratio
          - spinbutton "Speed ratio" [ref=e207]: "1.10"
          - generic [ref=e208]: ×
        - generic [ref=e209]:
          - generic [ref=e210]: Volume increment
          - spinbutton "Volume increment" [ref=e211]: "10"
          - generic [ref=e212]: "%"
        - generic [ref=e213]:
          - generic [ref=e214]: Undo window
          - spinbutton "Undo window" [ref=e215]: "150"
          - generic [ref=e216]: ms
      - generic [ref=e217]:
        - generic [ref=e218]: Default metadata tags
        - textbox "Default metadata tags" [ref=e219]: "[ti: Unknown] [ar: Unknown] [al: Unknown] [re: https://amokprime.github.io/linebyline/]"
      - generic [ref=e220]:
        - generic [ref=e221]: Hotkeys
        - generic [ref=e222]:
          - generic [ref=e223]: Menu
          - generic [ref=e224]:
            - generic [ref=e225]: Open
            - textbox "Open" [ref=e226] [cursor=pointer]: Ctrl+;
          - generic [ref=e227]:
            - generic [ref=e228]: Save
            - textbox "Save" [ref=e229] [cursor=pointer]: Ctrl+'
          - generic [ref=e230]:
            - generic [ref=e231]: Undo
            - textbox "Undo" [ref=e232] [cursor=pointer]: Ctrl+Z
          - generic [ref=e233]:
            - generic [ref=e234]: Redo
            - textbox "Redo" [ref=e235] [cursor=pointer]: Ctrl+Y
          - generic [ref=e236]:
            - generic [ref=e237]: Settings
            - textbox "Settings" [ref=e238] [cursor=pointer]: Ctrl+,
          - generic [ref=e239]:
            - generic [ref=e240]: Toggle theme
            - textbox "Toggle theme" [ref=e241] [cursor=pointer]: Ctrl+.
          - generic [ref=e242]:
            - generic [ref=e243]: Help
            - textbox "Help" [ref=e244] [cursor=pointer]: Ctrl+/
          - generic [ref=e245]:
            - generic [ref=e246]: Issues
            - textbox "Issues" [ref=e247] [cursor=pointer]: Ctrl+[
          - generic [ref=e248]:
            - generic [ref=e249]: Toggle panel
            - textbox "Toggle panel" [ref=e250] [cursor=pointer]: "Ctrl+`"
          - generic [ref=e251]:
            - generic [ref=e252]: Reset defaults
            - textbox "Reset defaults" [ref=e253] [cursor=pointer]: Ctrl+\
          - generic [ref=e254]: Playback
          - generic [ref=e255]:
            - generic [ref=e256]: Play/pause
            - textbox "Play/pause" [ref=e257] [cursor=pointer]: Space
          - generic [ref=e258]:
            - generic [ref=e259]: Play/pause (alternate)
            - textbox "Play/pause (alternate)" [ref=e260] [cursor=pointer]: Ctrl+Space
          - generic [ref=e261]:
            - generic [ref=e262]: Reduce speed
            - textbox "Reduce speed" [ref=e263] [cursor=pointer]: Ctrl+1
          - generic [ref=e264]:
            - generic [ref=e265]: Increase speed
            - textbox "Increase speed" [ref=e266] [cursor=pointer]: Ctrl+2
          - generic [ref=e267]:
            - generic [ref=e268]: Reset speed
            - textbox "Reset speed" [ref=e269] [cursor=pointer]: Ctrl+3
          - generic [ref=e270]:
            - generic [ref=e271]: Seek back
            - textbox "Seek back" [ref=e272] [cursor=pointer]: Ctrl+9
          - generic [ref=e273]:
            - generic [ref=e274]: Seek forward
            - textbox "Seek forward" [ref=e275] [cursor=pointer]: Ctrl+0
          - generic [ref=e276]: Sync
          - generic [ref=e277]:
            - generic [ref=e278]: Toggle offset mode
            - textbox "Toggle offset mode" [ref=e279] [cursor=pointer]: Shift+~
          - generic [ref=e280]:
            - generic [ref=e281]: Sync file
            - textbox "Sync file" [ref=e282] [cursor=pointer]: Ctrl+I
          - generic [ref=e283]:
            - generic [ref=e284]: Sync line start
            - textbox "Sync line start" [ref=e285] [cursor=pointer]: W
          - generic [ref=e286]:
            - generic [ref=e287]: Sync line end
            - textbox "Sync line end" [ref=e288] [cursor=pointer]: T
          - generic [ref=e289]:
            - generic [ref=e290]: Previous line
            - textbox "Previous line" [ref=e291] [cursor=pointer]: Q
          - generic [ref=e292]:
            - generic [ref=e293]: Next line
            - textbox "Next line" [ref=e294] [cursor=pointer]: E
          - generic [ref=e295]:
            - generic [ref=e296]: Replay only
            - textbox "Replay only" [ref=e297] [cursor=pointer]: R
          - generic [ref=e298]:
            - generic [ref=e299]: Replay end
            - textbox "Replay end" [ref=e300] [cursor=pointer]: Shift+R
          - generic [ref=e301]: Adjustments
          - generic [ref=e302]:
            - generic [ref=e303]: Back tiny amount
            - textbox "Back tiny amount" [ref=e304] [cursor=pointer]: Z
          - generic [ref=e305]:
            - generic [ref=e306]: Forward tiny amount
            - textbox "Forward tiny amount" [ref=e307] [cursor=pointer]: V
          - generic [ref=e308]:
            - generic [ref=e309]: Back small amount
            - textbox "Back small amount" [ref=e310] [cursor=pointer]: A
          - generic [ref=e311]:
            - generic [ref=e312]: Forward small amount
            - textbox "Forward small amount" [ref=e313] [cursor=pointer]: F
          - generic [ref=e314]:
            - generic [ref=e315]: Back medium amount
            - textbox "Back medium amount" [ref=e316] [cursor=pointer]: S
          - generic [ref=e317]:
            - generic [ref=e318]: Forward medium amount
            - textbox "Forward medium amount" [ref=e319] [cursor=pointer]: D
          - generic [ref=e320]:
            - generic [ref=e321]: Back large amount
            - textbox "Back large amount" [ref=e322] [cursor=pointer]: X
          - generic [ref=e323]:
            - generic [ref=e324]: Forward large amount
            - textbox "Forward large amount" [ref=e325] [cursor=pointer]: C
          - generic [ref=e326]: Text
          - generic [ref=e327]:
            - generic [ref=e328]: Toggle mode
            - textbox "Toggle mode" [ref=e329] [cursor=pointer]: "`"
          - generic [ref=e330]:
            - generic [ref=e331]: Add field
            - textbox "Add field" [ref=e332] [cursor=pointer]: Ctrl+4
          - generic [ref=e333]:
            - generic [ref=e334]: Hide field
            - textbox "Hide field" [ref=e335] [cursor=pointer]: Ctrl+5
          - generic [ref=e336]:
            - generic [ref=e337]: Merge fields
            - textbox "Merge fields" [ref=e338] [cursor=pointer]: Ctrl+6
          - generic [ref=e339]:
            - generic [ref=e340]: Mark line as translation
            - textbox "Mark line as translation" [ref=e341] [cursor=pointer]: Ctrl+ArrowLeft
    - contentinfo "Settings actions" [ref=e342]:
      - button "Reset all settings to defaults" [ref=e343] [cursor=pointer]: Reset defaults
```

# Test source

```ts
  1  | const { test, expect } = require("@linebyline/test-helpers");
  2  | import AxeBuilder from "@axe-core/playwright";
  3  | 
  4  | test("axe-scan-landing", async ({ page }) => {
  5  |   const results = await new AxeBuilder({ page }).analyze();
  6  |   expect(results.violations).toEqual([]);
  7  | });
  8  | 
  9  | test("axe-scan-lyrics", async ({ page, media, importSecondary }) => {
  10 |   await page
  11 |     .locator("#file-picker")
  12 |     .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  13 |   await page.keyboard.press("Control+4");
  14 |   await importSecondary(1, "plain_french.lrc");
  15 |   const results = await new AxeBuilder({ page }).analyze();
  16 |   expect(results.violations).toEqual([]);
  17 | });
  18 | 
  19 | test("axe-scan-settings", async ({ page }) => {
  20 |   await page.keyboard.press("Control+,");
  21 |   const results = await new AxeBuilder({ page }).analyze();
> 22 |   expect(results.violations).toEqual([]);
     |                              ^ Error: expect(received).toEqual(expected) // deep equality
  23 | });
  24 | 
```