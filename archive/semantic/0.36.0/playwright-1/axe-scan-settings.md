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

- Expected  -   1
+ Received  + 354

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
+     "description": "Ensure every form element has a label",
+     "help": "Form elements must have labels",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/label?application=playwright",
+     "id": "label",
+     "impact": "critical",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "implicit-label",
+             "impact": "critical",
+             "message": "Element does not have an implicit (wrapped) <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "explicit-label",
+             "impact": "critical",
+             "message": "Element does not have an explicit <label>",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "critical",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "critical",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "critical",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-placeholder",
+             "impact": "critical",
+             "message": "Element has no placeholder attribute",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "presentational-role",
+             "impact": "critical",
+             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element does not have an implicit (wrapped) <label>
+   Element does not have an explicit <label>
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute
+   Element has no placeholder attribute
+   Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
+         "html": "<textarea class=\"s-meta\" id=\"s-default-meta\"></textarea>",
+         "impact": "critical",
+         "none": Array [],
+         "target": Array [
+           "#s-default-meta",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.forms",
+       "wcag2a",
+       "wcag412",
+       "section508",
+       "section508.22.n",
+       "TTv5",
+       "TT5.c",
+       "EN-301-549",
+       "EN-9.4.1.2",
+       "ACT",
+       "RGAAv4",
+       "RGAA-11.1.1",
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
  - dialog "Settings" [ref=e159]:
    - generic [ref=e160]:
      - generic [ref=e161]: Settings
      - generic [ref=e162]:
        - textbox "Search settings" [active] [ref=e163]:
          - /placeholder: Search…
        - button "Switch to hotkey search mode" [ref=e164] [cursor=pointer]: ⌨
    - generic [ref=e165]:
      - generic [ref=e166]:
        - generic [ref=e167]: Instant Replay
        - generic [ref=e168] [cursor=pointer]:
          - checkbox "Moving to previous line" [ref=e169]
          - text: Moving to previous line
        - generic [ref=e170] [cursor=pointer]:
          - checkbox "Moving to next line" [ref=e171]
          - text: Moving to next line
        - generic [ref=e172] [cursor=pointer]:
          - checkbox "Resuming currently playing line" [ref=e173]
          - text: Resuming currently playing line
        - generic [ref=e174] [cursor=pointer]:
          - checkbox "Playing another line" [ref=e175]
          - text: Playing another line
        - generic [ref=e176] [cursor=pointer]:
          - checkbox "Adjusting seek offset" [ref=e177]
          - text: Adjusting seek offset
        - generic [ref=e178] [cursor=pointer]:
          - checkbox "Syncing line" [ref=e179]
          - text: Syncing line
        - generic [ref=e180] [cursor=pointer]:
          - checkbox "Adjusting timestamp" [ref=e181]
          - text: Adjusting timestamp
      - generic [ref=e182]:
        - generic [ref=e183]: Intervals
        - generic [ref=e184]:
          - generic [ref=e185]: Tiny
          - spinbutton "Tiny" [ref=e186]: "100"
          - generic [ref=e187]: ms
        - generic [ref=e188]:
          - generic [ref=e189]: Small
          - spinbutton "Small" [ref=e190]: "200"
          - generic [ref=e191]: ms
        - generic [ref=e192]:
          - generic [ref=e193]: Medium
          - spinbutton "Medium" [ref=e194]: "400"
          - generic [ref=e195]: ms
        - generic [ref=e196]:
          - generic [ref=e197]: Large
          - spinbutton "Large" [ref=e198]: "1000"
          - generic [ref=e199]: ms
        - generic [ref=e200]:
          - generic [ref=e201]: Seek increment
          - spinbutton "Seek increment" [ref=e202]: "5"
          - generic [ref=e203]: s
        - generic [ref=e204]:
          - generic [ref=e205]: Speed ratio
          - spinbutton "Speed ratio" [ref=e206]: "1.10"
          - generic [ref=e207]: ×
        - generic [ref=e208]:
          - generic [ref=e209]: Volume increment
          - spinbutton "Volume increment" [ref=e210]: "10"
          - generic [ref=e211]: "%"
        - generic [ref=e212]:
          - generic [ref=e213]: Undo window
          - spinbutton "Undo window" [ref=e214]: "150"
          - generic [ref=e215]: ms
      - generic [ref=e216]:
        - generic [ref=e217]: Default metadata tags
        - textbox [ref=e218]: "[ti: Unknown] [ar: Unknown] [al: Unknown] [re: https://amokprime.github.io/linebyline/]"
      - generic [ref=e219]:
        - generic [ref=e220]: Hotkeys
        - generic [ref=e221]:
          - generic [ref=e222]: Menu
          - generic [ref=e223]:
            - generic [ref=e224]: Open
            - textbox "Open" [ref=e225] [cursor=pointer]: Ctrl+;
          - generic [ref=e226]:
            - generic [ref=e227]: Save
            - textbox "Save" [ref=e228] [cursor=pointer]: Ctrl+'
          - generic [ref=e229]:
            - generic [ref=e230]: Undo
            - textbox "Undo" [ref=e231] [cursor=pointer]: Ctrl+Z
          - generic [ref=e232]:
            - generic [ref=e233]: Redo
            - textbox "Redo" [ref=e234] [cursor=pointer]: Ctrl+Y
          - generic [ref=e235]:
            - generic [ref=e236]: Settings
            - textbox "Settings" [ref=e237] [cursor=pointer]: Ctrl+,
          - generic [ref=e238]:
            - generic [ref=e239]: Toggle theme
            - textbox "Toggle theme" [ref=e240] [cursor=pointer]: Ctrl+.
          - generic [ref=e241]:
            - generic [ref=e242]: Help
            - textbox "Help" [ref=e243] [cursor=pointer]: Ctrl+/
          - generic [ref=e244]:
            - generic [ref=e245]: Issues
            - textbox "Issues" [ref=e246] [cursor=pointer]: Ctrl+[
          - generic [ref=e247]:
            - generic [ref=e248]: Toggle panel
            - textbox "Toggle panel" [ref=e249] [cursor=pointer]: "Ctrl+`"
          - generic [ref=e250]:
            - generic [ref=e251]: Reset defaults
            - textbox "Reset defaults" [ref=e252] [cursor=pointer]: Ctrl+\
          - generic [ref=e253]: Playback
          - generic [ref=e254]:
            - generic [ref=e255]: Play/pause
            - textbox "Play/pause" [ref=e256] [cursor=pointer]: Space
          - generic [ref=e257]:
            - generic [ref=e258]: Play/pause (alternate)
            - textbox "Play/pause (alternate)" [ref=e259] [cursor=pointer]: Ctrl+Space
          - generic [ref=e260]:
            - generic [ref=e261]: Reduce speed
            - textbox "Reduce speed" [ref=e262] [cursor=pointer]: Ctrl+1
          - generic [ref=e263]:
            - generic [ref=e264]: Increase speed
            - textbox "Increase speed" [ref=e265] [cursor=pointer]: Ctrl+2
          - generic [ref=e266]:
            - generic [ref=e267]: Reset speed
            - textbox "Reset speed" [ref=e268] [cursor=pointer]: Ctrl+3
          - generic [ref=e269]:
            - generic [ref=e270]: Seek back
            - textbox "Seek back" [ref=e271] [cursor=pointer]: Ctrl+9
          - generic [ref=e272]:
            - generic [ref=e273]: Seek forward
            - textbox "Seek forward" [ref=e274] [cursor=pointer]: Ctrl+0
          - generic [ref=e275]: Sync
          - generic [ref=e276]:
            - generic [ref=e277]: Toggle offset mode
            - textbox "Toggle offset mode" [ref=e278] [cursor=pointer]: Shift+~
          - generic [ref=e279]:
            - generic [ref=e280]: Sync file
            - textbox "Sync file" [ref=e281] [cursor=pointer]: Ctrl+I
          - generic [ref=e282]:
            - generic [ref=e283]: Sync line start
            - textbox "Sync line start" [ref=e284] [cursor=pointer]: W
          - generic [ref=e285]:
            - generic [ref=e286]: Sync line end
            - textbox "Sync line end" [ref=e287] [cursor=pointer]: T
          - generic [ref=e288]:
            - generic [ref=e289]: Previous line
            - textbox "Previous line" [ref=e290] [cursor=pointer]: Q
          - generic [ref=e291]:
            - generic [ref=e292]: Next line
            - textbox "Next line" [ref=e293] [cursor=pointer]: E
          - generic [ref=e294]:
            - generic [ref=e295]: Replay only
            - textbox "Replay only" [ref=e296] [cursor=pointer]: R
          - generic [ref=e297]:
            - generic [ref=e298]: Replay end
            - textbox "Replay end" [ref=e299] [cursor=pointer]: Shift+R
          - generic [ref=e300]: Adjustments
          - generic [ref=e301]:
            - generic [ref=e302]: Back tiny amount
            - textbox "Back tiny amount" [ref=e303] [cursor=pointer]: Z
          - generic [ref=e304]:
            - generic [ref=e305]: Forward tiny amount
            - textbox "Forward tiny amount" [ref=e306] [cursor=pointer]: V
          - generic [ref=e307]:
            - generic [ref=e308]: Back small amount
            - textbox "Back small amount" [ref=e309] [cursor=pointer]: A
          - generic [ref=e310]:
            - generic [ref=e311]: Forward small amount
            - textbox "Forward small amount" [ref=e312] [cursor=pointer]: F
          - generic [ref=e313]:
            - generic [ref=e314]: Back medium amount
            - textbox "Back medium amount" [ref=e315] [cursor=pointer]: S
          - generic [ref=e316]:
            - generic [ref=e317]: Forward medium amount
            - textbox "Forward medium amount" [ref=e318] [cursor=pointer]: D
          - generic [ref=e319]:
            - generic [ref=e320]: Back large amount
            - textbox "Back large amount" [ref=e321] [cursor=pointer]: X
          - generic [ref=e322]:
            - generic [ref=e323]: Forward large amount
            - textbox "Forward large amount" [ref=e324] [cursor=pointer]: C
          - generic [ref=e325]: Text
          - generic [ref=e326]:
            - generic [ref=e327]: Toggle mode
            - textbox "Toggle mode" [ref=e328] [cursor=pointer]: "`"
          - generic [ref=e329]:
            - generic [ref=e330]: Add field
            - textbox "Add field" [ref=e331] [cursor=pointer]: Ctrl+4
          - generic [ref=e332]:
            - generic [ref=e333]: Hide field
            - textbox "Hide field" [ref=e334] [cursor=pointer]: Ctrl+5
          - generic [ref=e335]:
            - generic [ref=e336]: Merge fields
            - textbox "Merge fields" [ref=e337] [cursor=pointer]: Ctrl+6
          - generic [ref=e338]:
            - generic [ref=e339]: Mark line as translation
            - textbox "Mark line as translation" [ref=e340] [cursor=pointer]: Ctrl+ArrowLeft
    - contentinfo "Settings actions" [ref=e341]:
      - button "Reset all settings to defaults" [ref=e342] [cursor=pointer]: Reset defaults
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