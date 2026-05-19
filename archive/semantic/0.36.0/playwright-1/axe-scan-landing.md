# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.js >> axe-scan-landing
- Location: tests\accessibility.spec.js:4:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 325

- Array []
+ Array [
+   Object {
+     "description": "Ensure role attribute has an appropriate value for the element",
+     "help": "ARIA role should be appropriate for the element",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/aria-allowed-role?application=playwright",
+     "id": "aria-allowed-role",
+     "impact": "minor",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Array [
+               "toolbar",
+             ],
+             "id": "aria-allowed-role",
+             "impact": "minor",
+             "message": "ARIA role toolbar is not allowed for given element",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   ARIA role toolbar is not allowed for given element",
+         "html": "<nav id=\"menu-bar\" role=\"toolbar\" aria-label=\"Main toolbar\">",
+         "impact": "minor",
+         "none": Array [],
+         "target": Array [
+           "#menu-bar",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.aria",
+       "best-practice",
+     ],
+   },
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
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div id=\"audio-box\" role=\"region\" aria-labelledby=\"now-playing-label\">",
+                 "target": Array [
+                   "#audio-box",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #9198a1, background color: #f6f8fa, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span id=\"vol-pct\" aria-label=\"Volume percentage\">100%</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#vol-pct",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#bddff9",
+               "contrastRatio": 3.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#0969da",
+               "fontSize": "8.3pt (11px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.73 (foreground color: #0969da, background color: #bddff9, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<span class=\"hk-key\" style=\"\">Shift+~</span>",
+                 "target": Array [
+                   "div[aria-label=\"Toggle offset mode\"] > .hk-key",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"hk-cell mode half\" role=\"button\" tabindex=\"0\" aria-label=\"Toggle offset mode\" title=\"Toggle offset mode\"><span>Offset time</span><span class=\"hk-key\" style=\"\">Shift+~</span></div>",
+                 "target": Array [
+                   "div[aria-label=\"Toggle offset mode\"]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.73 (foreground color: #0969da, background color: #bddff9, font size: 8.3pt (11px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"hk-key\" style=\"\">Shift+~</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "div[aria-label=\"Toggle offset mode\"] > .hk-key",
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
+     "description": "Ensure the document has a main landmark",
+     "help": "Document should have one main landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=playwright",
+     "id": "landmark-one-main",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [
+           Object {
+             "data": null,
+             "id": "page-has-main",
+             "impact": "moderate",
+             "message": "Document does not have a main landmark",
+             "relatedNodes": Array [],
+           },
+         ],
+         "any": Array [],
+         "failureSummary": "Fix all of the following:
+   Document does not have a main landmark",
+         "html": "<html lang=\"en\" data-theme=\"\" style=\"--editor-font: system-ui,sans-serif; --editor-size: 14px;\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "html",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+   Object {
+     "description": "Ensure that the page, or at least one of its frames contains a level-one heading",
+     "help": "Page should contain a level-one heading",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/page-has-heading-one?application=playwright",
+     "id": "page-has-heading-one",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [
+           Object {
+             "data": null,
+             "id": "page-has-heading-one",
+             "impact": "moderate",
+             "message": "Page must have a level-one heading",
+             "relatedNodes": Array [],
+           },
+         ],
+         "any": Array [],
+         "failureSummary": "Fix all of the following:
+   Page must have a level-one heading",
+         "html": "<html lang=\"en\" data-theme=\"\" style=\"--editor-font: system-ui,sans-serif; --editor-size: 14px;\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "html",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+   Object {
+     "description": "Ensure all page content is contained by landmarks",
+     "help": "All page content should be contained by landmarks",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/region?application=playwright",
+     "id": "region",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<nav id=\"menu-bar\" role=\"toolbar\" aria-label=\"Main toolbar\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "#menu-bar",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<div class=\"section-label\" style=\"margin:0\" id=\"now-playing-label\">Now playing</div>",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "#now-playing-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<div class=\"section-label\" style=\"margin-top:4px\" id=\"controls-label\">Controls</div>",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "#controls-label",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<div class=\"hk-grid\" id=\"hk-grid\" role=\"group\" aria-labelledby=\"controls-label\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "#hk-grid",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<div class=\"lyric-scroll\" id=\"main-scroll\"><div class=\"lyric-area\" id=\"main-lines\" role=\"list\" aria-label=\"Lyric lines\"></div></div>",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "#main-scroll",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.keyboard",
+       "best-practice",
+       "RGAAv4",
+       "RGAA-9.2.1",
+     ],
+   },
+ ]
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
  2  | import AxeBuilder from "@axe-core/playwright";
  3  | 
  4  | test("axe-scan-landing", async ({ page }) => {
  5  |   const results = await new AxeBuilder({ page }).analyze();
> 6  |   expect(results.violations).toEqual([]);
     |                              ^ Error: expect(received).toEqual(expected) // deep equality
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
  22 |   expect(results.violations).toEqual([]);
  23 | });
  24 | 
```