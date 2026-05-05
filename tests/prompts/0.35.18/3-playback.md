Read contents of linebyline.zip for context, starting with INDEX.md (/linebyline parent folder represents repo root). I need to figure out why the audio-box text changes in Typing mode.
# Test info
- Name: playback.spec.js >> play-pause-typing
- Location: tests\playback.spec.js:15:1
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
+       0:000:13
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
    7 × locator resolved to <div id="audio-box">…</div>
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
```
# Page snapshot
```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - button "📂" [ref=e3] [cursor=pointer]
    - button "💾" [ref=e4] [cursor=pointer]
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
    - button "Add field" [ref=e22] [cursor=pointer]
    - button "Hide field" [disabled] [ref=e23]
    - button "Merge fields" [disabled] [ref=e24]
    - button "⚙️" [ref=e26] [cursor=pointer]
    - button "🌙" [ref=e27] [cursor=pointer]
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
      - generic [ref=e51]:
        - generic [ref=e52]: I Wish I Could Identify That Smell
        - generic [ref=e53]: The Jazz Kissingers
        - generic [ref=e55]:
          - generic [ref=e56]: 0:02
          - generic [ref=e57]: 0:13
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
          - 'spinbutton "Seek offset (ms): shifts playback position when clicking a timestamped line" [ref=e77]': "-600"
          - generic [ref=e78]: ms
          - generic [ref=e79]:
            - button "▲" [ref=e80] [cursor=pointer]
            - button "▼" [ref=e81] [cursor=pointer]
          - button "Sync file Ctrl+I" [ref=e82] [cursor=pointer]:
            - text: Sync file
            - generic [ref=e83]: Ctrl+I
        - generic [ref=e84]:
          - button "Mute" [ref=e85] [cursor=pointer]:
            - img [ref=e86]
          - slider [ref=e88] [cursor=pointer]: "1"
          - generic [ref=e89]: 100%
      - generic [ref=e90]: Controls
      - generic [ref=e91]:
        - generic [ref=e92]:
          - generic "Toggle offset mode" [ref=e93] [cursor=pointer]:
            - generic [ref=e94]: Offset time
            - generic [ref=e95]: Shift+~
          - generic "Toggle mode" [ref=e96] [cursor=pointer]:
            - generic [ref=e97]: Typing mode
            - generic [ref=e98]: "`"
        - generic "Play/pause" [ref=e99] [cursor=pointer]:
          - generic [ref=e100]: Play/pause
          - generic [ref=e101]: Space
        - generic "Sync line start" [ref=e102] [cursor=pointer]:
          - generic [ref=e103]: Sync line
          - generic [ref=e104]:
            - generic [ref=e105]: W
            - generic [ref=e106]: Enter
        - generic "Previous line" [ref=e107] [cursor=pointer]:
          - generic [ref=e108]: Previous line
          - generic [ref=e109]:
            - generic [ref=e110]: Q
            - generic [ref=e111]: ↑
        - generic "Next line" [ref=e112] [cursor=pointer]:
          - generic [ref=e113]: Next line
          - generic [ref=e114]:
            - generic [ref=e115]: E
            - generic [ref=e116]: ↓
        - generic "Replay only" [ref=e117] [cursor=pointer]:
          - generic [ref=e118]: Replay only
          - generic [ref=e119]: R
        - generic "Sync line end" [ref=e120] [cursor=pointer]:
          - generic [ref=e121]: End line
          - generic [ref=e122]: T
        - generic "Back tiny amount" [ref=e123] [cursor=pointer]:
          - generic [ref=e124]: −100ms time
          - generic [ref=e125]: Z
        - generic "Forward tiny amount" [ref=e126] [cursor=pointer]:
          - generic [ref=e127]: +100ms time
          - generic [ref=e128]: V
        - generic "Back small amount" [ref=e129] [cursor=pointer]:
          - generic [ref=e130]: −200ms time
          - generic [ref=e131]: A
        - generic "Forward small amount" [ref=e132] [cursor=pointer]:
          - generic [ref=e133]: +200ms time
          - generic [ref=e134]: F
        - generic "Back medium amount" [ref=e135] [cursor=pointer]:
          - generic [ref=e136]: −400ms time
          - generic [ref=e137]: S
        - generic "Forward medium amount" [ref=e138] [cursor=pointer]:
          - generic [ref=e139]: +400ms time
          - generic [ref=e140]: D
        - generic "Back large amount" [ref=e141] [cursor=pointer]:
          - generic [ref=e142]: −1000ms time
          - generic [ref=e143]: X
        - generic "Forward large amount" [ref=e144] [cursor=pointer]:
          - generic [ref=e145]: +1000ms time
          - generic [ref=e146]: C
    - generic [ref=e150]:
      - generic [ref=e151]:
        - generic [ref=e152]: Main
        - generic "Wrap marked translations in parentheses" [ref=e153] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e154]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e155] [cursor=pointer]:
          - checkbox "↩" [ref=e156]
          - text: ↩
      - textbox [active] [ref=e157]: "[ti: I Wish I Could Identify That Smell] [ar: The Jazz Kissingers] [al: microSong Entries] [re: LineByLine, https://amokprime.github.io/linebyline/] [00:00.00] I wish I could identify that smell [00:03.06] That smell [00:06.35] It disturbs my concentration [00:08.08] And it bothers me to hell [00:09.91] Oh, I wish I could identify that smell [00:12.12]"
```
# Test source
```ts
  1  | const { test, expect } = require('@linebyline/test-helpers');
  2  | 
  3  | test('play-pause-hotkey', async ({ page, media }) => {
  4  |   await page.locator('#file-picker').setInputFiles([
  5  |     media('audio.mp3'),
  6  |     media('synced_english.lrc'),
  7  |   ]);
  8  |   await page.keyboard.press('Space')
  9  |   await expect(page.locator('#audio-box')).toContainText('0:01');
  10 |   await page.keyboard.press('Space')
  11 |   await page.waitForTimeout(1000);
  12 |   await expect(page.locator('#audio-box')).toContainText('0:01');
  13 | });
  14 | 
  15 | test('play-pause-typing', async ({ page, media }) => {
  16 |   await page.locator('#file-picker').setInputFiles([
  17 |     media('audio.mp3'),
  18 |     media('synced_english.lrc'),
  19 |   ]);
  20 |   await page.keyboard.press('Backquote')
  21 |   await page.keyboard.press('Control+Space')
> 22 |   await expect(page.locator('#audio-box')).toContainText('0:01');
     |                                            ^ Error: expect(locator).toContainText(expected) failed
  23 |   await page.keyboard.press('Control+Space')
  24 |   await page.waitForTimeout(1000);
  25 |   await expect(page.locator('#audio-box')).toContainText('0:01');
  26 |   const lyrics = await page.locator('#main-textarea').inputValue();
  27 |   expect(lyrics).toMatchSnapshot('import-synced-textarea.txt');
  28 | });
```

---
Now let me read the Audio section, Mode switching section, and the relevant parts of Global KD:
Now let me find the HTML structure of `#audio-box` and the Controls panel:
Now let me read the Global KD (keyboard dispatch) section and the Controls section to understand how play/pause works in typing mode:
Let me find the `_handleGlobalHotkeys` and `_handleHotkeyModeKeys` functions:
Now let me check the default hotkey config, specifically `play_pause` and `play_pause_alt`:
Let me check the `keyStr` function and also look at how the secondary textarea handles keydown:
Let me check the Secondary fields section for any keydown handlers that might intercept events:
Let me check the CSS for `#audio-box` and any display-related differences between modes:
Let me look at the import flow and what happens with focus after file loading:
Let me check the test helpers and test configuration:
Let me search for any event propagation blockers in the code:
Let me check the `_handleSettingsKeys` function and also look at the CSS for any hidden `#audio-box` elements:
Let me check the State section and any variables that might affect playback:
Here's my analysis after reading through the codebase:

## The `#audio-box` text doesn't actually change between modes

The `#audio-box` always contains the same child elements in both Hotkey and Typing mode: `#song-title`, `#song-artist`, `#progress-wrap`, `#time-row`, `#media-row`, `#seek-row`, `#vol-row`. The text content is identical in both modes — the test failure is **not** about the element structure changing.

## The real problem: `Ctrl+Space` isn't starting playback

The test expects `0:01` to appear inside `#audio-box` (via `#time-pos`), but the audio never plays, so the time stays at `0:00`. The received text `0:000:13` is just `0:00` (time-pos) + `0:13` (time-dur) concatenated — and `0:01` is not a substring of `0:000:13`.

## Why `Ctrl+Space` fails — tracing the code path

The code logic for `Ctrl+Space` in typing mode **appears correct on paper**:

1. **Line 361**: `play_pause_alt:'Ctrl+Space'` is in the default config
2. **Line 2428** in `_handleGlobalHotkeys`: `if(hk.play_pause_alt&&hkMatch(ks,hk.play_pause_alt)){e.preventDefault();togglePlay();return true;}` — this runs **before** the `if(!hotkeyMode)return;` guard on line 2527, so it should work in both modes
3. **Line 2525**: The `isFocusedUI` guard has `!e.ctrlKey` — since `Ctrl` is held, the guard passes even if a textarea is focused
4. The `main-textarea` keydown handler (line 2368) doesn't call `stopPropagation()` for `Ctrl+Space`

**So why does it fail?** The most likely cause is **browser-level interception of `Ctrl+Space`**. In Firefox (one of the three browsers in `playwright.config.js`), `Ctrl+Space` is the default IME toggle shortcut. When the `main-textarea` has focus and `Ctrl+Space` is dispatched:

- Firefox may consume the event at the browser level for IME composition
- The JavaScript `keydown` handler either **never fires** or fires with `e.key = 'Process'` instead of `e.key = ' '`
- If `e.key = 'Process'`, then `keyStr(e)` produces `'Ctrl+Process'`, which **doesn't match** `hk.play_pause_alt = 'Ctrl+Space'`
- `togglePlay()` is never called → audio never plays → `#time-pos` stays at `0:00`

This explains the error: the assertion retries for 5 seconds but the time never advances because playback was never triggered. The page snapshot showing `0:02` was taken after the test error, likely after some other interaction started playback.

## How to verify

Add a `console.log` inside `_handleGlobalHotkeys` to confirm whether `Ctrl+Space` reaches the handler at all:

```js
// In _handleGlobalHotkeys, before the play_pause_alt check:
console.log('[DBG] _handleGlobalHotkeys ks=', ks, 'play_pause_alt=', hk.play_pause_alt);
```

Also log inside `togglePlay()` to confirm it's called:

```js
function togglePlay(){
  console.log('[DBG] togglePlay called, audioEl=', !!audioEl, 'playing=', playing);
  // ...
}
```

Run the test with `--project=firefox` specifically to see if it's Firefox-only.

## Recommended fix

The cleanest fix is to **change the `play_pause_alt` default to a key combo that browsers don't intercept**, such as `Ctrl+Shift+Space` or `Ctrl+P` (making sure it doesn't conflict with print). In `DEFAULT_CFG`:

```js
play_pause_alt: 'Ctrl+Shift+Space',  // was 'Ctrl+Space'
```

Or alternatively, add a `beforeinput` / `compositionstart` listener on the textarea that detects IME activation and falls back to a click on `#btn-play-pause` as a workaround — but that's more fragile.

A simpler test-side workaround is to **click the play/pause button directly** instead of using the keyboard shortcut:

```js
await page.keyboard.press('Backquote')
await page.locator('#btn-play-pause').click()  // instead of keyboard.press('Control+Space')
await expect(page.locator('#audio-box')).toContainText('0:01');
```

This bypasses the keyboard event entirely and confirms the `togglePlay()` logic works — isolating the problem to the keyboard dispatch layer.
The investigation is complete. The `#audio-box` text doesn't actually change between modes — the test fails because `Ctrl+Space` never triggers `togglePlay()` due to browser IME interception (most likely Firefox). The `play_pause_alt` key combo `Ctrl+Space` collides with Firefox's built-in IME toggle, so the keydown event either doesn't reach JavaScript or arrives with `e.key='Process'` instead of `e.key=' '`, producing a mismatched key string. Changing the default to `Ctrl+Shift+Space` or using `#btn-play-pause`.click() in the test would resolve it.

---
`Ctrl+Space` works fine in a real Firefox browser, so I'm not changing it. The error was caused by sending a click to `locator('#main-textarea')`, which somehow prevented `locator('#progress-wrap')` or the 0:00 time under the seek slider from updating (visually confirmed in the browser preview). After checking again, a real Firefox browser automatically places the typing cursor at `|[00:00.00]` anyway after entering Typing mode (not sure about Playwright). 
In a earlier LineByLine version, Hotkey mode exclusive buttons would fire in Typing mode while typing. On reflection, `Ctrl+Space` could never have typed anything, so the last two lines were pointless. And it makes more sense to stick with the plan and reserve rigorous typing mode tests for typing-mode.spec.js. Code updated:
``` js
test('play-pause-typing', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Backquote')
  await page.keyboard.press('Control+Space')
  await expect(page.locator('#audio-box')).toContainText('0:01')
  await page.keyboard.press('Control+Space')
  await page.waitForTimeout(1000)
  await expect(page.locator('#audio-box')).toContainText('0:01')
});
```

---
Thanks for the correction — my IME theory was off. The real culprit was the click on `#main-textarea` interfering with the progress/time update, which makes sense given how `applyMode()` uses `requestAnimationFrame` to set cursor position and focus (lines 666–671). A Playwright click landing in the middle of that async focus dance could plausibly disrupt the `onTimeUpdate` render cycle.

The updated test looks clean:

```js
test('play-pause-typing', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Backquote')
  await page.keyboard.press('Control+Space')
  await expect(page.locator('#audio-box')).toContainText('0:01')
  await page.keyboard.press('Control+Space')
  await page.waitForTimeout(1000)
  await expect(page.locator('#audio-box')).toContainText('0:01')
});
```

Good call removing the snapshot assertion — that belongs in `typing-mode.spec.js` where the textarea content is what's actually under test, not in a playback test where the concern is just "does Ctrl+Space play/pause in Typing mode?"

---
For seek testing, I'm having trouble clicking a specific point on `locator('#progress-wrap')` in the Codegen browser. First click snaps to the midpoint of the slider (corresponding to 0:06 in the 0:13 song), and every click (or hold and drag) is captured as a generic `await page.locator('#progress-wrap').click();` that doesn't reveal time progress or slider position. What's a reliable and realistic (close to real input) way to click a relative spot on the slider that corresponds to a time, accurate within the nearest second?

---
The seek bar's click handler (lines 1192–1197) computes position from `e.clientX` relative to the element's bounding rect:

```js
function getPct(e){const r=pw.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));}
```

So to click at a specific fraction, you need the element's bounding box and use `page.mouse.click()` with absolute viewport coordinates — this fires the exact same `mousedown` → `seekTo` path a real click takes:

```js
// Click at a relative position (0–1) on the seek bar
async function seekTo(page, fraction) {
  const box = await page.locator('#progress-wrap').boundingBox();
  await page.mouse.click(
    box.x + box.width * fraction,
    box.y + box.height / 2,
  );
}
```

For your 13-second test audio, each second is `1/13 ≈ 0.077` of the slider width. So seeking to a specific second:

```js
await seekTo(page, 1 / 13);   // ≈ 0:01
await seekTo(page, 3 / 13);   // ≈ 0:03
await seekTo(page, 10 / 13);  // ≈ 0:10
```

This is accurate within one second because each second maps to ~7.7% of the bar — on a typical 290px-wide panel, that's ~22px per second, well within click precision. The `page.mouse.click()` approach dispatches real `mousedown`/`mouseup` events that flow through the app's `getPct()` → `seekTo()` path identically to a human click, unlike `locator.click()` with a `position` option which Playwright handles more synthetically.

---
This passes:
``` js
test('speed-slow', async({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
    for (let i = 0; i < 5; i++) {
​    await page.keyboard.press('Control+1')
​    }
  await page.keyboard.press('Space')
  await page.waitForTimeout(3000)
  await expect(page.locator('#audio-box')).toContainText('0:02')
});
```

But so does this! Is there more a reliable measure of passing time to compare against and detect slower or faster playback?
``` js
test('speed-slow', async({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Space')
  await page.waitForTimeout(3000)
  await expect(page.locator('#audio-box')).toContainText('0:02')
});
```

---
The problem is `toContainText('0:02')` is a substring match on the entire `#audio-box`, and `fmtTime` (line 1111) rounds down to whole seconds with no decimal. At ~1x speed after startup latency, 3 real seconds might only show `0:02` in the display — the same as at ~0.62x. Both tests pass because the assertion is too coarse to tell the difference.

The fix: read `currentTime` directly via `page.evaluate()`. The app has a top-level `currentMs()` function (line 1141):

```js
function currentMs(){return audioEl?audioEl.currentTime*1000:0;}
```

Since it's a `function` declaration in a classic `<script>` (not a module), it's on the global scope. Use it to measure the *ratio* of audio elapsed vs. real elapsed, which cancels out startup latency:

```js
test('speed-slow', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Control+1');
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(500); // let playback stabilize

  const t1 = await page.evaluate(() => currentMs());
  await page.waitForTimeout(2000);
  const t2 = await page.evaluate(() => currentMs());

  const audioDelta = (t2 - t1) / 1000;
  // After 5 speed-down presses at ratio 1.1: speed ≈ 0.62x
  // 2 real seconds × 0.62 ≈ 1.24 audio seconds
  expect(audioDelta).toBeGreaterThan(1.0);
  expect(audioDelta).toBeLessThan(1.6);
});
```

The two-measurement approach isolates the speed from startup latency — you're comparing audio-elapsed-time against wall-clock-time, and that ratio *is* the playback rate. At 1x the delta would be ~2.0, at 0.62x it's ~1.24, and no substring ambiguity can conflate them.

---
It seems very flaky. At respective `await page.waitForTimeout()` settings of 500, 2000, it fails; 2000, 2000 passes; 2000, 4000 fails again.

---
Headless browser audio pipelines don't reliably advance `currentTime` at the configured `playbackRate` — that's why the timing-based measurement is flaky regardless of how you tune the timeouts. The delta between two `currentMs()` reads depends on the browser's media scheduler, which is not deterministic in headless/CI environments.

The reliable fix: **assert the speed state directly** instead of measuring elapsed time. The `changeSpeed` function (line 1798) sets both `audioEl.playbackRate` and `#speed-val` synchronously — no audio pipeline involvement needed:

```js
test('speed-slow', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Control+1');
  }
  await expect(page.locator('#speed-val')).toHaveValue('0.62');
});
```

After 5 presses at ratio 1.1: `1 → 0.91 → 0.83 → 0.75 → 0.68 → 0.62`. Zero timing dependency, zero flake. If you also want to confirm the audio element was wired up:

```js
const rate = await page.evaluate(() => audioEl?.playbackRate);
expect(rate).toBeCloseTo(0.62, 1);
```

But `#speed-val` alone is sufficient — `changeSpeed` always writes both in the same function call, so one implies the other.

---
