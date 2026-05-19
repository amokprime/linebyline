# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.js >> axe-scan-lyrics
- Location: tests\accessibility.spec.js:9:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 295

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f8fa",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9198a1",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"ts\">[00:03.06]</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-idx=\"6\"] > .ts",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f8fa",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9198a1",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"ts\">[00:06.35]</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-idx=\"8\"] > .ts",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f8fa",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9198a1",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"ts\">[00:08.08]</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-idx=\"9\"] > .ts",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f8fa",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9198a1",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"ts\">[00:09.91]</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[data-idx=\"10\"] > .ts",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f8fa",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9198a1",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body>",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"ts\">[00:12.12]</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".end-ts > .ts",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
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
+           "div[aria-label=\"Main field header\"]",
+         ],
+       },
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
+         "html": "<div class=\"field-header\" style=\"justify-content: flex-start;\" role=\"banner\" aria-label=\"Secondary 1 field header\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "div[aria-label=\"Secondary 1 field header\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+   Object {
+     "description": "Ensure the document has at most one banner landmark",
+     "help": "Document should not have more than one banner landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-no-duplicate-banner?application=playwright",
+     "id": "landmark-no-duplicate-banner",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "page-no-duplicate-banner",
+             "impact": "moderate",
+             "message": "Document has more than one banner landmark",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"field-header\" style=\"justify-content: flex-start;\" role=\"banner\" aria-label=\"Secondary 1 field header\">",
+                 "target": Array [
+                   "div[aria-label=\"Secondary 1 field header\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Document has more than one banner landmark",
+         "html": "<div class=\"field-header\" style=\"justify-content:flex-start;\" role=\"banner\" aria-label=\"Main field header\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "div[aria-label=\"Main field header\"]",
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
    - button "Hide last secondary field" [ref=e23] [cursor=pointer]: Hide field
    - button "Merge fields" [ref=e24] [cursor=pointer]
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
        - generic "Song title" [ref=e53]: I Wish I Could Identify That Smell
        - generic "Song artist" [ref=e54]: The Jazz Kissingers
        - slider "Playback position" [ref=e55] [cursor=pointer]
        - generic [ref=e56]:
          - generic "Current position" [ref=e57]: 0:00
          - generic "Duration" [ref=e58]: 0:13
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
    - generic [ref=e149]:
      - generic [ref=e150]:
        - banner "Main field header" [ref=e151]:
          - generic [ref=e152]: Main
          - generic "Wrap marked translations in parentheses" [ref=e153] [cursor=pointer]:
            - checkbox "( )" [checked] [ref=e154]
            - text: ( )
          - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e155] [cursor=pointer]:
            - checkbox "↩" [ref=e156]
            - text: ↩
        - list "Lyric lines" [ref=e158]:
          - listitem [ref=e159] [cursor=pointer]: "[00:00.00] I wish I could identify that smell"
          - listitem [ref=e160] [cursor=pointer]: "[00:03.06] That smell"
          - listitem [ref=e161]
          - listitem [ref=e162] [cursor=pointer]: "[00:06.35] It disturbs my concentration"
          - listitem [ref=e163] [cursor=pointer]: "[00:08.08] And it bothers me to hell"
          - listitem [ref=e164] [cursor=pointer]: "[00:09.91] Oh, I wish I could identify that smell"
          - listitem [ref=e165] [cursor=pointer]: "[00:12.12]"
      - generic [ref=e166]:
        - banner "Secondary 1 field header" [ref=e167]:
          - generic [ref=e168]: Secondary 1
          - generic [ref=e169]:
            - button "Import secondary lyrics file" [active] [ref=e170] [cursor=pointer]: 📂
            - generic "Wrap all secondary lines in parentheses" [ref=e171] [cursor=pointer]:
              - checkbox "( )" [checked] [ref=e172]
              - text: ( )
        - textbox "Secondary 1 lyrics" [ref=e173]: (J'aimerais pouvoir identifier cette odeur) (Cette odeur) (Cela perturbe ma concentration) (Et ça me dérange au plus haut point) (Oh, j'aimerais pouvoir identifier cette odeur)
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
> 16 |   expect(results.violations).toEqual([]);
     |                              ^ Error: expect(received).toEqual(expected) // deep equality
  17 | });
  18 | 
  19 | test("axe-scan-settings", async ({ page }) => {
  20 |   await page.keyboard.press("Control+,");
  21 |   const results = await new AxeBuilder({ page }).analyze();
  22 |   expect(results.violations).toEqual([]);
  23 | });
  24 | 
```