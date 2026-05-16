---
model: GLM-5.1
---
I finished `sync-adjust.spec.js` and am now working on `typing-mode.spec.js`. There may be a way to automate a test planned to keep manual in 1.1-suggestions.md: "Lyrics scroll position after mode toggle". Recall the 2-import-paste.md strategy "10,000 lines of normal lyrics doesn't need a source file. Generate it inline:". 

Now suppose 1,000 lines were generated with an incrementing number + unique ID per line. The original scroll bug in a much earlier version of LineByLine jumped all the way to the bottom when entering Typing mode if there were enough lyrics to run offscreen. And 1,000 lines should be more than most computer monitors can display, maybe an even lower number would work. Checking that 1-uniquerandomid is visible (i.e. `getByText`) in both Hotkey and Typing modes should catch the scroll bug's return. If a more subtle scroll bug emerged, it could be found by line number + ID.

---
That's a solid approach. A line number + short unique tag gives you both quick scanning and unambiguous matching. Something like:

```js
// Generate N timestamped lines with unique IDs
function generateLrc(n, intervalSec = 3) {
  const tag = (i) => {
    // Short deterministic unique string per line index
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const a = chars[i % 26];
    const b = chars[Math.floor(i / 26) % 26];
    return `${i + 1}${a}${b}`;
  };
  const meta = '[ti: Scroll Test]\n[ar: Test]\n[al: Test]\n[re: Test]\n';
  const lines = [];
  for (let i = 0; i < n; i++) {
    const sec = i * intervalSec;
    const mm = Math.floor(sec / 60);
    const ss = String(sec % 60).padStart(2, '0');
    lines.push(`[${String(mm).padStart(2,'0')}:${ss}.00] ${tag(i)}`);
  }
  return meta + lines.join('\n');
}
```

Then the test just needs to load the content, verify a line near the top is visible, toggle modes, and verify it's still visible:

```js
test('scroll-position-after-mode-toggle', async ({ page }) => {
  const lrc = generateLrc(1000);
  await page.evaluate((text) => {
    _setTA(text);
    renderMainLines();
    // Set activeLine to first lyric line
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!META_RE.test(lines[i]) && lines[i].trim() !== '') {
        activeLine = i; break;
      }
    }
    renderMainLines();
  }, lrc);

  // Hotkey mode: line 1 tag should be visible
  const tag1 = '1ab'; // tag(0) = '1ab'
  await expect(page.getByText(tag1)).toBeVisible();

  // Switch to Typing mode
  await page.keyboard.press('Backquote');

  // Typing mode: line 1 tag should still be visible (not scrolled to bottom)
  await expect(page.getByText(tag1)).toBeVisible();
});
```

If a subtler scroll drift appears — say the viewport lands at line 47 instead of line 1 — you can probe by line number. Pick a line near the top (e.g. `tag(2) = '3cd'`), one in the middle (`tag(499) = '500sw'`), and one near the bottom (`tag(999) = '1000ot'`). Whichever is `toBeVisible()` tells you roughly where the viewport landed, and the unique tag disambiguates if the same number ever appears in different contexts.

`_setTA`, `renderMainLines`, `META_RE`, and `activeLine` are all in the global scope of the classic `<script>`, so `page.evaluate()` can reach them directly — no file or clipboard needed.

---
The math looks more complex than I expected. What about a minimum viable unique pattern like nmbr0001, nmbr0002...nmbr1000? The padded zeros would for example prevent "1" from being caught as part of 0010, 0100, 1000. "nmbr" doesn't appear in the lyrics or any element name.

---
Much cleaner. Zero chance of substring collisions, instantly readable, and trivial to generate:

```js
function generateLrc(n, intervalSec = 3) {
  const meta = '[ti: Scroll Test]\n[ar: Test]\n[al: Test]\n[re: Test]\n';
  const lines = [];
  for (let i = 0; i < n; i++) {
    const sec = i * intervalSec;
    const mm = Math.floor(sec / 60);
    const ss = String(sec % 60).padStart(2, '0');
    lines.push(`[${String(mm).padStart(2,'0')}:${ss}.00] nmbr${String(i + 1).padStart(4,'0')}`);
  }
  return meta + lines.join('\n');
}
```

Then in the test:

```js
await expect(page.getByText('nmbr0001')).toBeVisible();
await page.keyboard.press('Backquote');
await expect(page.getByText('nmbr0001')).toBeVisible();
```

And if you need to diagnose a drift, just check which `nmbr` is visible — the number tells you exactly where the viewport landed.

---
No interval is necessary (don't bother generating timestamps), just the raw output per line like:
```lrc
nmbr0001
nmbr0002
...
nmbr1000
```
Also I wasn't able to call the function like `const lrcs = generateLrc(1000);` or `const lrcs = generateLrc(1000, 1);`. I don't know much JavaScript but if either of those was right then the method of pushing the lyrics might not have succeeded - in which case, fall back to `Ctrl+V` in hotkey mode to paste them in (this would also simplify the metadata reproduction code by just using the defaults).

---
No function needed — just build the string inline and inject it:

```js
const lines = [];
for (let i = 1; i <= 1000; i++) lines.push(`nmbr${String(i).padStart(4, '0')}`);
const text = lines.join('\n');

await page.evaluate((t) => {
  const ta = document.getElementById('main-textarea');
  ta.value = t;
  ta.dispatchEvent(new Event('input'));
}, text);
```

The `input` event triggers the same chain as typing/pasting — `renderMainLines()`, `checkLineCounts()`, `doAutosave()` — so the UI ends up in the same state. No clipboard, no metadata, no timestamps. The app will show its default `[ti: Unknown]` etc. header, and `nmbr0001` through `nmbr1000` as the lyric lines.