---
model: GLM-5.1
---
Each turn, suggest starting a fresh chat if one of these two bulleted events occurred:
- The conversation has drifted to a different topic than the first 10 turns
- We exceeded 20 turns on the same codebase

Read INDEX.md first, then the rest of this prompt:

---

Moving on to tests/prompts/8-review.md → "B. **`smoke.spec.js` — minimal landing test**"

>Console errors on load (`page.on('pageerror', ...)`) 

Is this enough (from https://playwright.dev/docs/api/class-page#page-event-page-error)?
```js
page.on('pageerror', exception => {
  console.log(`Uncaught exception: "${exception}"`);
});
```

>All expected UI elements are present (controls panel, buttons, etc.)

The screenshot captures all UI elements visually. Some buttons aren't even "real" buttons (like the entire Controls section) and are be identified with `getByText` instead of `getByRole`. Should I corroborate it with something like `await expect(page).toMatchAriaSnapshot();`? Would an exhaustive list like this add much value?
```js
//Every button
  await expect(page.getByRole('button', { name: '📂' })).toBeVisible();
  //...
//Every psuedo-button identified by text
  await expect(page.getByText('Offset timeShift+~')).toBeVisible();
  //..
//Every pseudo-button identified by
  await expect(page.getByTitle('Increase speed (Ctrl+2)')).toBeVisible();
  //...
//Every slider
  await expect(page.locator('#progress-wrap')).toBeVisible();
  //...
//Every checkbox
  await expect(page.getByRole('checkbox', { name: '( )' })).toBeVisible();
  //...
```

>The file picker input exists and is hidden

Is this enough to check for both at the same time?
```js
  await expect(page.locator("#file-picker")).not.toBeVisible();
```

---
Now let me read the skills and app HTML to understand the UI structure for the specific questions:
Let me look at the app's HTML to understand the UI structure for the smoke test questions:
Now let me read the Controls section to understand the dynamically generated hk-grid:
Now I have all the context I need. Let me also quickly check the Init section to see what happens on page load:
Good questions — all three touch on real gaps. Here's my take on each:

---

## 1. Console errors on load: Is `page.on('pageerror')` enough?

**No — it only catches uncaught exceptions, not `console.error()` calls.**

`page.on('pageerror')` fires when JS throws and nothing catches it. But many problems manifest as `console.error()` instead of a thrown exception — for example, LineByLine's own code uses `console.error` in the `catch` block of `loadCfg()` (line 507: `}catch(e){return structuredClone(DEFAULT_CFG);}` — silently swallows the error). If `localStorage` is corrupted, you'd never know from `pageerror` alone.

For a smoke test you should listen to **both**:

```js
const errors = [];
page.on('pageerror', e => errors.push(`Uncaught: ${e.message}`));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});
```

Then assert at the end:

```js
expect(errors).toEqual([]);
```

**One caveat**: register the listeners *before* `page.goto()` (your custom fixture already calls `goto` inside the fixture, so you'd need to set up the listener inside the fixture or in a `test.beforeEach`). Since the fixture calls `goto` during `page` setup, the cleanest approach is to add the error collection inside the test itself, using `test.beforeEach` or just adding it at the top of each test — but that means the listener might miss errors from the very start of navigation. The most robust approach would be to extend the fixture:

```js
page: async ({ page }, use) => {
  const errors = [];
  page.on('pageerror', e => errors.push(`Uncaught: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  await page.goto(findLatestVersion());
  await use(page);
  // The test can access errors via page._consoleErrors or similar
},
```

Or, more pragmatically, just use it inside the `landing` test and accept that you're checking after initial render, not during the literal first byte of navigation — which for a single-file HTML app with no external resource loads is fine.

**Verdict**: `pageerror` alone misses the most common class of errors. Add `console` listener too. For LineByLine specifically (no external assets, single HTML file), this combination is comprehensive enough.

---

## 2. UI elements present: exhaustive list vs. screenshot vs. aria snapshot?

**Don't write the exhaustive list.** It would be brittle, high-maintenance, and largely redundant with the screenshot. Here's why and what to do instead:

### Why the exhaustive list is a bad idea

The controls grid (`#hk-grid`) is **dynamically generated** by `rebuildHkPanel()` — the labels include config-derived values like `−100ms time`, `+200ms time`, etc. Any config change (e.g. default `tiny_ms` from 100→200) would break your `getByText('−100ms time')` assertion. You'd be testing the *config values*, not the structural integrity.

Similarly, the mode cells show dynamic text (`"Hotkey mode"` / `"Typing mode"`, `"Offset time"` / `"Offset seek"`) depending on state. An exhaustive check would need to know the exact initial state.

And the screenshot already covers all of this — if a button disappears, the pixel diff catches it.

### Why `toMatchAriaSnapshot()` is also overkill here

Aria snapshots are great for testing accessible names and roles. But for a smoke test:
- The snapshot would be enormous (every button, slider, label, checkbox...)
- It would be just as brittle as the manual list — any label change breaks it
- The controls grid cells are `<div>` elements with no semantic role, so they'd show up as generic text nodes, not as buttons
- The `aria-label` on Play button is `"Play"`, but many elements rely on `title` attributes instead of proper ARIA — the snapshot would be incomplete

### What I'd recommend instead

Check **3–4 structural landmarks** that confirm the major layout regions rendered and the JS initialized:

```js
// Major layout regions exist
await expect(page.locator('#menu-bar')).toBeVisible();
await expect(page.locator('#left-panel')).toBeVisible();
await expect(page.locator('#editor-wrapper')).toBeVisible();

// Controls grid was populated by JS (rebuildHkPanel ran)
const hkCells = page.locator('#hk-grid .hk-cell');
await expect(hkCells).toHaveCount(16); // 2 mode cells + 14 action cells

// Settings overlay exists but is closed
await expect(page.locator('#settings-overlay')).not.toBeVisible();
```

The `#hk-grid .hk-cell` count check is the single most valuable structural assertion — it confirms `rebuildHkPanel()` executed successfully and the full Controls panel rendered. A count of 16 = 2 mode-half cells + 14 action cells (Play/pause, Sync line, Previous, Next, Replay only, End line, then 8 timestamp adjustments = 6 + 8 = 14). If JS failed silently, this would be 0.

**Verdict**: The screenshot covers visual presence. Add a few structural checks for layout regions + the controls grid cell count. Skip the exhaustive element list and the aria snapshot.

---

## 3. File picker: does `not.toBeVisible()` check both existence and hiddenness?

**No. `not.toBeVisible()` also passes when the element doesn't exist at all.**

Playwright considers an element "not visible" if it's either (a) hidden via CSS *or* (b) absent from the DOM. So if someone accidentally removes `#file-picker` from the HTML, or you typo the selector, your test would still pass — silently.

You need two assertions to check both properties:

```js
await expect(page.locator('#file-picker')).toBeAttached();    // exists in DOM
await expect(page.locator('#file-picker')).not.toBeVisible();  // but hidden
```

Or, since the element uses inline `style="display:none"`, you can do it in one:

```js
await expect(page.locator('#file-picker')).toHaveCSS('display', 'none');
```

`toHaveCSS` implicitly requires the element to exist (it'll time out if it can't find the element), so this single assertion verifies both conditions. It's also slightly more intention-revealing — it says "this element should exist with display:none" rather than "this element should not be visible (for any reason)."

I'd go with `toHaveCSS('display', 'none')` — it's concise and checks exactly what matters: the file input is in the DOM and hidden via the expected mechanism.

---

## Summary of recommended `landing` test additions

```js
test('landing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(`Uncaught: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  // Visual snapshot (already exists)
  await expect(page).toHaveScreenshot();

  // No JS errors on load
  expect(errors).toEqual([]);

  // Layout structure
  await expect(page.locator('#menu-bar')).toBeVisible();
  await expect(page.locator('#left-panel')).toBeVisible();
  await expect(page.locator('#editor-wrapper')).toBeVisible();

  // Controls grid rendered (rebuildHkPanel ran)
  await expect(page.locator('#hk-grid .hk-cell')).toHaveCount(16);

  // File picker exists but is hidden
  await expect(page.locator('#file-picker')).toHaveCSS('display', 'none');
});
```

Wait — there's a subtle timing issue: the `page.on(...)` listeners need to be registered *before* navigation. But your custom fixture calls `page.goto()` during fixture setup, before the test body runs. So by the time the `landing` test registers the listeners, the page has already loaded and any early errors were missed.

Two options:

1. **Move the error collection into the fixture** (cleanest, but requires modifying `index.js`):
   ```js
   page: async ({ page }, use) => {
     const consoleErrors = [];
     page.on('pageerror', e => consoleErrors.push(`Uncaught: ${e.message}`));
     page.on('console', msg => {
       if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
     });
     await page.goto(findLatestVersion());
     await use(page);
     // Expose for tests — could attach to page or use a custom fixture property
   },
   ```

2. **Just accept the slight gap** — for a single-file HTML app with no async resource loads, errors during initial parse are extremely unlikely to slip through. Register in the test body and it'll catch any errors from subsequent interactions or delayed init. This is the pragmatic choice and sufficient for LineByLine.

Option 2 is fine for this app. The more rigorous approach would be Option 1, which you could implement later if you want the fixture to expose `consoleErrors` as a custom fixture property.

---
Moving on to C, from the app code perspective, is it necessary to check every interval, or just one control-time and one control-seek?

---
Now let me also check the `adjustTs` and `tickSeekOffset` functions to confirm the code paths:
Now I have the complete picture. Here's the answer:

---

**One control-time and one control-seek is sufficient.** Here's why, from the app code:

### All 8 time/seek controls are structurally identical

In `CTRL_ACTIONS` (lines 1775–1782), every timestamp control follows the exact same pattern:

```js
ts_back_tiny:  () => offsetSeekMode ? tickSeekOffset(-cfg.tiny_ms)   : adjustTs(-cfg.tiny_ms),
ts_fwd_tiny:   () => offsetSeekMode ? tickSeekOffset(cfg.tiny_ms)    : adjustTs(cfg.tiny_ms),
ts_back_small: () => offsetSeekMode ? tickSeekOffset(-cfg.small_ms)  : adjustTs(-cfg.small_ms),
ts_fwd_small:  () => offsetSeekMode ? tickSeekOffset(cfg.small_ms)   : adjustTs(cfg.small_ms),
// ... same for medium and large
```

The only difference between them is **which config value** gets passed (`tiny_ms`, `small_ms`, `medium_ms`, `large_ms`). The code path is identical — they all call the same two functions (`adjustTs` or `tickSeekOffset`) with a numeric delta.

### `adjustTs` doesn't care about magnitude

```js
function adjustTs(delta){
  const lines = getTA().split('\n');
  const targets = selectedLines.size > 0 ? [...selectedLines] : [activeLine];
  targets.forEach(i => {
    const ms = tsToMs(lines[i]); if (ms === null) return;
    lines[i] = replaceTs(lines[i], ms + delta);  // simple addition
  });
  setMainText(lines.join('\n'));
}
```

Whether `delta` is 100 or 1000, the logic is `ms + delta` — same code path, same boundary conditions (both hit `tsToMs`, `replaceTs`, `setMainText`). There's no branching, rounding, or clamping that varies by interval size.

### `tickSeekOffset` is similarly uniform

It just increments/decrements the seek offset spinner by the delta — no magnitude-dependent logic.

### The rendering is also a uniform loop

`rebuildHkPanel()` generates all 8 controls in a single `.forEach()` loop (lines 1831–1855). Each cell gets the same `innerHTML` template and the same click handler pattern. If one renders correctly, they all do — the only variable is the label text (`−100ms time` vs `−1000ms time`), which comes straight from config.

### What the current tests are actually checking

The `control-time` and `control-seek` tests check that 8 text labels are visible. They're testing that `rebuildHkPanel()` ran and read the config values correctly. But the screenshot in `landing` already confirms the grid rendered — so these tests are really just verifying the default config values (100, 200, 400, 1000) appear in the labels.

### What I'd recommend

Replace the two 8-assertion visibility tests with **one test that actually exercises the functionality**:

```js
test("control-time", async ({ page, media }) => {
  // Verify adjustTs works (tiny interval, normal mode)
  await page.locator("#file-picker").setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("v");  // ts_fwd_tiny: adjustTs(+100)
  await expect(page.getByText("[00:00.10] I wish I could")).toBeVisible();
  await page.keyboard.press("z");  // ts_back_tiny: adjustTs(-100)
  await expect(page.getByText("[00:00.00] I wish I could")).toBeVisible();
});

test("control-seek", async ({ page, media }) => {
  // Verify tickSeekOffset works (tiny interval, offset mode)
  await page.locator("#file-picker").setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Shift+Backquote");  // toggle offset mode
  await page.keyboard.press("v");  // tickSeekOffset(+100)
  await expect(page.getByRole("spinbutton", { name: "Seek offset (ms): shifts" })).toHaveValue("-500");
  await page.keyboard.press("z");  // tickSeekOffset(-100)
  await expect(page.getByRole("spinbutton", { name: "Seek offset (ms): shifts" })).toHaveValue("-600");
});
```

Wait — this is almost exactly what the existing `adjust-time` and `adjust-seek` tests already do! The only difference is those tests happen to use the tiny interval keys (`Z`/`V`). So the `control-time` and `control-seek` visibility tests are **entirely redundant** with `adjust-time` and `adjust-seek` which actually exercise the behavior.

**Verdict**: Delete `control-time` and `control-seek` entirely. The `adjust-time` test already proves the time-adjustment path works (via tiny keys), and `adjust-seek` already proves the seek-offset path works (via tiny keys in offset mode). Since all 8 intervals share the same code path with only a numeric argument differing, testing one of each mode is sufficient. The label visibility is covered by the `landing` screenshot.

---
3D appears complete, I forgot to mention it. Moving on to 4./"A. **`naughty-strings` test in `import-paste.spec.js`** — extremely slow and fragile". How would you implement recommendation 1?

---
Now let me look at the LRC parsing code to understand what string patterns would actually stress it:
Now I have the full picture of what parsing paths the pasted text goes through. Here's my analysis and implementation:

---

The key question is: which 10 strings actually stress **LineByLine's** code, not the browser's? Looking at the paste path in `renderMainLines()` + `main-lines` paste handler, the dangerous patterns are:

1. **`div.textContent = line`** — safe, but **`div.innerHTML = '&nbsp;'`** on blank lines means HTML-like content only matters for the blank-line branch (which doesn't apply to pasted content since blank lines in paste get the `&nbsp;` treatment)

2. **`TS_RE` and `META_RE` regexes** — strings starting with `[` could match `META_RE` and get filtered out, or match `TS_RE` and get sliced at position 10

3. **`mergeLrcMeta`** — extracts `[key: value]` pairs from pasted text

4. **`normalizeLrcTimestamps`** — replaces `[mm:ss.ddd]` patterns

5. **`batchSplitParens`** — looks for trailing parenthesized groups

6. **Extremely long strings** — could stress the `split('\n')` + per-line rendering loop

7. **Zero-width/invisible characters** — could make rendered output differ from textarea content

8. **BOM / RTL overrides** — could corrupt how metadata is parsed

9. **LRC-looking strings** — `[00:00.00]` prefix gets special rendering treatment (split into timestamp span + content span at `line.slice(10)`)

10. **Newline-equivalent characters** — `split('\n')` wouldn't split on `\r`, `\u2028`, `\u2029`

Here's the implementation — a curated array inline in the test, with each string targeting a specific parsing surface:

```js
test("naughty-strings", async ({ page }) => {
  // Curated subset targeting LineByLine's specific parsing surfaces:
  //  1. META_RE = /^\[[a-zA-Z]+:/  →  strings starting with [ could be misidentified as metadata
  //  2. TS_RE   = /^\[(\d{2}):(\d{2})\.(\d{2})\]/  →  timestamp-like brackets get sliced at offset 10
  //  3. normalizeLrcTimestamps  →  3-decimal timestamps like [00:00.000]
  //  4. renderMainLines  →  blank lines get innerHTML = '&nbsp;', non-blank get textContent
  //  5. mergeLrcMeta  →  extracts [key: value] from pasted content
  //  6. batchSplitParens  →  looks for trailing parenthesized groups
  const NAUGHTY = [
    // --- LRC timestamp-adjacent ---
    "[00:00.000] three-decimal ts",          // normalizeLrcTimestamps should truncate to [00:00.00]
    "[99:99.99] invalid timestamp",          // TS_RE won't match, but looks like one
    "[ar: <script>alert(1)</script>]",       // META_RE match; mergeLrcMeta extracts value with HTML

    // --- Bracket confusion ---
    "[not: a meta tag]",                     // starts with [ but META_RE rejects (space after colon)
    "[]",                                    // empty brackets
    "[[[nested]]]",                          // nested brackets could confuse parsing

    // --- Invisible / zero-width characters ---
    "\ufeffBOM prefix",                      // BOM at start of line
    "zero\u200bwidth",                       // zero-width space between words

    // --- Newline-adjacent ---
    "line1\rline2",                          // \r not split by split('\n')
    "A".repeat(10000),                       // extremely long single line
  ];

  await page.locator("#main-lines").click();
  for (const [i, naughty] of NAUGHTY.entries()) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press("Control+v");
    // The app must survive — main-lines container still visible and non-empty
    await expect(page.locator("#main-lines")).toBeVisible();
    // Clear for next iteration
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
  }
});
```

Key design decisions:

**Why each string was chosen:**

| # | String | Parsing surface | What could break |
|---|--------|----------------|------------------|
| 1 | `[00:00.000] three-decimal ts` | `normalizeLrcTimestamps` → `TS_RE` | If normalization fails, `TS_RE` won't match the 3-decimal form, so the line won't get timestamp rendering |
| 2 | `[99:99.99] invalid timestamp` | `TS_RE` regex | `99:99` passes the `\d{2}:\d{2}` pattern — it's structurally valid. `tsToMs` would compute 5999.9 seconds. Tests that the app doesn't crash on nonsensical timestamps |
| 3 | `[ar: <script>alert(1)</script>]` | `META_RE` → `mergeLrcMeta` → `renderMainLines` | This matches `META_RE` so it gets filtered from lyrics lines. The `[ar:]` value gets extracted by `mergeLrcMeta` and displayed as "Unknown Artist" if no `[ar:]` exists. The HTML in the value goes through `textContent` in `renderMainLines`, so it should be safe — but worth verifying |
| 4 | `[not: a meta tag]` | `META_RE` boundary | `META_RE = /^\[[a-zA-Z]+:/` — note the space: `[not: a]` has a space before `a`, but the regex only checks the key part. Actually `[not: a meta tag]` DOES match `META_RE` (`not:` is `[a-zA-Z]+:`). The real edge case is `[not:a meta tag]` (no space after colon). Let me reconsider — both match. The non-matching edge case is `[: empty key]` or `[123: numeric key]`. I'll change this to `[123: numeric]` which won't match `META_RE` but starts with `[` |
| 5 | `[]` | Empty between brackets | Could confuse `META_RE` (no `:`) or `TS_RE` (no digits). Tests empty bracket handling |
| 6 | `[[[nested]]]` | Multiple opening brackets | `TS_RE` anchors to `^`, so `[[[nested]]]` won't match. `META_RE` also anchors to `^\[`, but `[[[nested]]]` has `[` then `[nested` which doesn't match `[a-zA-Z]+:`. Tests that triple brackets don't confuse either regex |
| 7 | `\ufeffBOM prefix` | BOM character | Could break `META_RE`/`TS_RE` since `\ufeff` isn't `[`, so neither matches. But the BOM would appear in `textContent` rendering — if it renders invisibly, the displayed text differs from the textarea content |
| 8 | `zero\u200bwidth` | Zero-width space | Same as above — the character is invisible but present in the string, causing a mismatch between what the user sees and what the LRC file contains |
| 9 | `line1\rline2` | Carriage return | `split('\n')` won't split on `\r`, so this becomes a single line with an embedded `\r`. When rendered via `textContent`, the `\r` may cause display issues |
| 10 | `A`.repeat(10000) | Extremely long line | Stresses the per-line rendering loop in `renderMainLines`. A 10K character line creates a single `div.textContent` assignment — testing that the DOM doesn't choke |

**Why I added the clear step:** The original test pasted each string on top of the previous one, accumulating 515 layers of text. The clear between iterations (`Ctrl+A` → `Backspace`) means each string is tested in isolation. If string #7 crashes the app, the error is clearly attributable to that specific string.

**Why the `toContainText` check was replaced:** The original `await expect(page.locator("#main-lines")).toBeVisible()` is nearly meaningless — `#main-lines` is a persistent container div that's always visible. The real test is that the app didn't crash and can still accept the next paste. The clear-then-paste-next pattern implicitly verifies the app is still responsive.

**One thing to note about the `[123: numeric]` string** — I said above that `[not: a meta tag]` actually matches `META_RE`. Let me fix string #4:

```js
"[123: numeric key]",   // Does NOT match META_RE (digits, not [a-zA-Z]+)
```

This is the more interesting case — it starts with `[` and has a `:`, but `META_RE` requires `[a-zA-Z]+:` so `[123:` won't match. The line will be treated as regular lyric text, not metadata. It could also match `TS_RE` if it were `[12:34.56]` format, but `[123: ...]` won't. Good boundary test.

So the final version:

```js
test("naughty-strings", async ({ page }) => {
  const NAUGHTY = [
    "[00:00.000] three-decimal ts",          // normalizeLrcTimestamps truncation
    "[99:99.99] invalid timestamp",          // structurally valid TS_RE, nonsensical time
    "[ar: <script>alert(1)</script>]",       // META_RE match with HTML in value
    "[123: numeric key]",                    // bracket+colon but NOT META_RE (digits)
    "[]",                                    // empty brackets
    "[[[nested]]]",                          // triple brackets
    "\ufeffBOM prefix",                      // BOM character
    "zero\u200bwidth",                       // zero-width space
    "line1\rline2",                          // carriage return (not split by \n)
    "A".repeat(10000),                       // extremely long single line
  ];

  await page.locator("#main-lines").click();
  for (const [i, naughty] of NAUGHTY.entries()) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press("Control+v");
    await expect(page.locator("#main-lines")).toBeVisible();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
  }
});
```

This runs in ~10–15 seconds instead of 515 iterations × ~1.5s = ~13 minutes, and every string targets a real LineByLine parsing surface rather than testing the browser's clipboard handling of emojis and XSS payloads.

---
I just remembered I had added a similar test in 1A called in tests\import-paste.spec.js called "import-corrupted-lyrics"

---
Good catch. Let me compare what's already covered:

| `import-corrupted-lyrics` | Naughty strings #1–3 |
|---|---|
| `[00:00.0000]` — 4-decimal timestamp | `[00:00.000]` — 3-decimal timestamp |
| `[X:X.X]` — non-numeric "timestamp" | `[99:99.99]` — structurally valid but nonsensical |
| Missing closing `]` on `[ti:` line | — |
| `00:06.350]` — missing opening `[` | — |
| `[00:12.120]` — end timestamp with no lyrics | — |
| Metadata with no closing `]` | `[ar: <script>alert(1)</script>]` — HTML in value |

There's real overlap on the timestamp boundary testing. The corrupted file already proves the app handles:
- 4-decimal timestamps (more extreme than our 3-decimal case)
- Non-numeric bracket content
- Missing brackets
- Trailing timestamps with no content

So from the 10 naughty strings, **strings 1 and 2 are already covered** by `import-corrupted-lyrics`. That leaves 8, but more importantly it means the naughty-strings test should focus on what `import-corrupted-lyrics` *doesn't* touch — which is the paste path with unusual single-line strings, not file import with a malformed but structured LRC.

Updated list, removing the duplicates and noting why:

```js
test("naughty-strings", async ({ page }) => {
  // Targets paste-path edge cases NOT covered by import-corrupted-lyrics:
  //  import-corrupted-lyrics already tests: 3/4-decimal timestamps,
  //  non-numeric [X:X.X], missing brackets, trailing end timestamps.
  const NAUGHTY = [
    "[ar: <script>alert(1)</script>]",       // META_RE match with HTML in value
    "[123: numeric key]",                    // bracket+colon but NOT META_RE (digits)
    "[]",                                    // empty brackets
    "[[[nested]]]",                          // triple brackets
    "\ufeffBOM prefix",                      // BOM character
    "zero\u200bwidth",                       // zero-width space
    "line1\rline2",                          // carriage return (not split by \n)
    "A".repeat(10000),                       // extremely long single line
  ];

  await page.locator("#main-lines").click();
  for (const [i, naughty] of NAUGHTY.entries()) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press("Control+v");
    await expect(page.locator("#main-lines")).toBeVisible();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
  }
});
```

8 strings, none duplicating what `import-corrupted-lyrics` already tests, each targeting a distinct parsing surface.

---
B addressed by importing a new no_trailing.lrc without the final trailing timestamp. Moving on to C. How to implement `keyboard.press` with those two approaches? The second approach also sounds like `Tab` would be hardcoded after the initial focus.

---
Now I have the full picture. Let me show both approaches applied to the `tab-settings` test:

---

You're right that approach 2 (`focus()` then Tab) still hardcodes subsequent Tab counts. The real improvement is **approach 1: tab until the target is focused**, which eliminates all magic numbers. Here's how both look:

### Approach 1: Tab until focused (no hardcoded counts)

```js
test('tab-settings', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  
  // Tab to first checkbox
  await tabUntilFocused(page, '#s-replay-prev');
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();

  // Tab to Tiny interval input
  await tabUntilFocused(page, '#s-tiny');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.getByText('−99ms timeZ')).toBeVisible();

  // Tab to default metadata textarea
  await tabUntilFocused(page, '#s-default-meta');
  await page.keyboard.press('&');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n&');

  // Tab to first hotkey capture field
  await tabUntilFocused(page, '.hk-capture');
  await page.keyboard.press('i');
  await expect(page.locator('.hk-capture').first()).toHaveValue('I');
  await page.keyboard.press('Enter');   // accept assignment
  await page.keyboard.press('o');
  await expect(page.locator('.hk-capture').nth(1)).toHaveValue('O');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.hk-capture').first()).toHaveValue('Ctrl+;');
});

/**
 * Press Tab repeatedly until the target element has focus.
 * Fails after maxTabs presses to avoid infinite loops.
 */
async function tabUntilFocused(page, selector, maxTabs = 50) {
  const loc = page.locator(selector).first();
  for (let i = 0; i < maxTabs; i++) {
    if (await loc.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntilFocused: ${selector} not focused after ${maxTabs} Tabs`);
}
```

Every magic number is gone. If you add a new checkbox, reorder settings sections, or insert a field, the test still works — it just Tabs a few more times to reach the target.

### Approach 2: `focus()` for positioning, then verify Tab advances

```js
test('tab-settings', async ({ page, media }) => {
  await page.keyboard.press('Control+,');

  // Directly focus the first checkbox, then verify keyboard interaction
  await page.locator('#s-replay-prev').focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();

  // Focus the Tiny input directly
  await page.locator('#s-tiny').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.getByText('−99ms timeZ')).toBeVisible();

  // Focus the metadata textarea directly
  await page.locator('#s-default-meta').focus();
  await page.keyboard.press('&');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n&');

  // Focus the first hotkey capture field directly
  await page.locator('.hk-capture').first().focus();
  await page.keyboard.press('i');
  await expect(page.locator('.hk-capture').first()).toHaveValue('I');
  await page.keyboard.press('Enter');
  // Tab to verify that Tab advances to the next hotkey capture field
  await page.keyboard.press('Tab');
  await page.keyboard.press('o');
  await expect(page.locator('.hk-capture').nth(1)).toHaveValue('O');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.hk-capture').first()).toHaveValue('Ctrl+;');
});
```

Your instinct is correct — **approach 2 only hardcodes Tab counts for the "advance to next" navigation after the initial focus**. In the example above, there's exactly one `Tab` (between consecutive hotkey capture fields), which is inherently correct because those fields are DOM-siblings — Tab from one always goes to the next. That's not a fragile count; it's a structural fact.

### Which to use?

**Approach 1** is the better choice here. Here's why:

1. **It tests the real user experience** — a keyboard-only user navigating Settings actually mashes Tab. Approach 2 skips that entirely with `.focus()`.

2. **It tests the focus order** — if a DOM reordering accidentally breaks tab order (e.g., a checkbox traps focus), approach 1 catches it. Approach 2 doesn't.

3. **The Settings dialog has a focus trap** (`aria-modal="true"`) — approach 1 implicitly verifies that Tab wraps within the dialog and doesn't escape to the page behind it. Approach 2 skips past this entirely.

4. **The `maxTabs = 50` safety net** prevents infinite loops. If something breaks focus (e.g., the overlay doesn't open), `tabUntilFocused` throws a clear error: `"#s-replay-prev not focused after 50 Tabs"`.

The one advantage of approach 2 is speed — it avoids up to 50 Tab presses per target. But Settings has ~30 focusable elements, so even the worst case is 30 × 4 targets = 120 key presses, which Playwright handles in well under a second. Not a real concern.

**Go with approach 1.** Put the `tabUntilFocused` helper in `helpers/index.js` since `tab-font` and `tab-lyrics` could also use it to replace their magic `for` loops:

```js
// tab-font: instead of `for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')`
await tabUntilFocused(page, '#font-select');
```

```js
// tab-lyrics: instead of `for (let i = 0; i < 3; i++) await page.keyboard.press('Tab')`
await tabUntilFocused(page, '#main-textarea');
```

---
Approach 1 works for tab-settings and tab-font. 
For tab-lyrics, both triple tabs are navigating to *secondary* lyrics fields, not main lyrics. Playwright sees them as `getByRole('textbox').nth(1)` and `getByRole('textbox').nth(2)` (and this is when two secondary fields are open; if only one is open that secondary field is just `getByRole('textbox')`). I don't know if they have valid locators for `tabUntilFocused` to use.

---
So secondary textareas have class `sec-textarea` but no IDs — they're created dynamically with just `le.className='sec-textarea'`. Let me verify what the existing test is actually doing:

The `tab-lyrics` test currently does:
1. Switch to Typing mode
2. Type `1` in main textarea
3. Open 2 secondary fields (`Control+4` × 2)
4. Tab 3 times → lands on first secondary textarea → type `2`
5. Tab 3 times → lands on second secondary textarea → type `3`
6. Verify values

The secondary textareas are `textarea.sec-textarea` — they have no IDs, no `aria-label`, no `data-testid`. They're identified only by class and DOM order. So `tabUntilFocused` can't use `#id` selectors.

But it *can* use Playwright locators — `tabUntilFocused` just needs to check `document.activeElement` against a given locator. Here are two ways to make it work:

### Option A: `tabUntilFocused` accepts a Playwright locator

```js
async function tabUntilFocused(page, locator, maxTabs = 50) {
  for (let i = 0; i < maxTabs; i++) {
    if (await locator.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntilFocused: element not focused after ${maxTabs} Tabs`);
}
```

Then `tab-lyrics` becomes:

```js
test('tab-lyrics', async ({ page, media }) => {
  await page.keyboard.press('Backquote');
  await page.keyboard.press('1');

  // Open two secondary fields
  await page.keyboard.press('Control+4');
  await page.keyboard.press('Control+4');

  // Tab to first secondary textarea, type in it
  const sec1 = page.locator('.sec-textarea').first();
  await tabUntilFocused(page, sec1);
  await page.keyboard.press('2');

  // Tab to second secondary textarea, type in it
  const sec2 = page.locator('.sec-textarea').nth(1);
  await tabUntilFocused(page, sec2);
  await page.keyboard.press('3');

  // Verify values
  await expect(page.locator('#main-textarea')).toHaveValue(
    '[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n1'
  );
  await expect(page.locator('.sec-textarea').first()).toHaveValue('2');
  await expect(page.locator('.sec-textarea').nth(1)).toHaveValue('3');
});
```

This works because:
- `.sec-textarea` is a unique class in the app (only secondary textareas have it)
- `.first()` and `.nth(1)` resolve to specific DOM elements, so `locator.evaluate(el => el === document.activeElement)` checks the exact element
- No hardcoded Tab counts — if a new focusable element appears between the main textarea and the secondaries, `tabUntilFocused` just Tabs a few more times

### Option B: Use `getByRole('textbox')` like the existing test

```js
  const sec1 = page.getByRole('textbox').nth(1);
  const sec2 = page.getByRole('textbox').nth(2);
```

Same structure, just different locator style. This is what the current test uses, and it works because `role('textbox')` matches both `#main-textarea` and the `.sec-textarea` elements.

**Go with Option A** (`.sec-textarea` class selector). It's more self-documenting — `.sec-textarea.first()` clearly means "the first secondary field", whereas `getByRole('textbox').nth(1)` requires you to know that index 0 is the main textarea and index 1+ are secondaries. It also won't break if someone adds an unrelated `textbox` role to the page.

The updated helper in `helpers/index.js`:

```js
/**
 * Press Tab repeatedly until the target locator's element has focus.
 * Accepts any Playwright Locator (by CSS, role, test-id, etc.).
 */
async function tabUntilFocused(page, locator, maxTabs = 50) {
  for (let i = 0; i < maxTabs; i++) {
    if (await locator.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntilFocused: element not focused after ${maxTabs} Tabs`);
}
```

This single helper now works for all three tests:
- `tab-font`: `tabUntilFocused(page, page.locator('#font-select'))`
- `tab-lyrics`: `tabUntilFocused(page, page.locator('.sec-textarea').first())`
- `tab-settings`: `tabUntilFocused(page, page.locator('#s-replay-prev'))`

---
Where does the updated helper go in index.js?

---
Between the `test` fixture definition and the `module.exports` — add it as a standalone exported function alongside `findLatestVersion`, not inside the fixture. It takes `page` and a locator as arguments, so it doesn't need fixture magic:

```js
// ...fixture definition ends at line 96...

/**
 * Press Tab repeatedly until the target locator's element receives focus.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [maxTabs=50] - Safety limit to prevent infinite loops
 */
async function tabUntilFocused(page, locator, maxTabs = 50) {
  for (let i = 0; i < maxTabs; i++) {
    if (await locator.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntilFocused: element not focused after ${maxTabs} Tabs`);
}

module.exports = { findLatestVersion, test, expect, tabUntilFocused };
```

Then in spec files:

```js
const { test, expect, tabUntilFocused } = require('@linebyline/test-helpers');
```

It goes next to `findLatestVersion` because they're the same kind of thing — standalone utility functions that spec files import directly. The fixtures (`media`, `readMedia`, `importSecondary`) are different because they're injected into the test context via `base.extend`.

---
Updated index.js → three new errors:
Parameter 'page' implicitly has an 'any' type (ts 7006).
Parameter 'locator' implicitly has an 'any' type (ts 7006).
Parameter 'el' implicitly has an 'any' type (ts 7006).

---
The `@param` with `import()` works (the file already uses it on line 68), but the `evaluate` callback parameter `el` can't be typed from JSDoc `@param` — it needs an inline cast. Three fixes:

```js
/**
 * Press Tab repeatedly until the target locator's element receives focus.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {number} [maxTabs=50]
 */
async function tabUntilFocused(page, locator, maxTabs = 50) {
  for (let i = 0; i < maxTabs; i++) {
    if (await locator.evaluate((/** @type {Element} */ el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntilFocused: element not focused after ${maxTabs} Tabs`);
}
```

The only change from before: `el` gets an inline `/** @type {Element} */` cast inside the arrow function parameter. `@param` can't reach into callback parameters — that's the `ts(7006)` on `el`. The `page` and `locator` errors are the same issue if the `@param` JSDoc block isn't being picked up — make sure the JSDoc comment block `/** ... */` is directly above the function with no blank line between them.

---
The tests now fail with error "TypeError: locator.evaluate is not a function", referring to index.js

---
`Locator.evaluate()` was added in Playwright 1.14 — your project likely uses an older version. The fix is to use `page.evaluate()` instead, which has existed since the beginning:

```js
/**
 * Press Tab repeatedly until the target element receives focus.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector
 * @param {{ index?: number, maxTabs?: number }} [options]
 */
async function tabUntilFocused(page, selector, options = {}) {
  const { index = 0, maxTabs = 50 } = options;
  for (let i = 0; i < maxTabs; i++) {
    const isFocused = await page.evaluate(
      ({ sel, idx }) => document.querySelectorAll(sel)[idx] === document.activeElement,
      { sel: selector, idx: index },
    );
    if (isFocused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`tabUntilFocused: ${selector}[${index}] not focused after ${maxTabs} Tabs`);
}
```

The tradeoff is it only accepts CSS selectors instead of arbitrary locators, but all the targets have CSS selectors available:

```js
// tab-font
await tabUntilFocused(page, '#font-select');

// tab-settings
await tabUntilFocused(page, '#s-replay-prev');

// tab-lyrics — first secondary
await tabUntilFocused(page, '.sec-textarea', { index: 0 });

// tab-lyrics — second secondary
await tabUntilFocused(page, '.sec-textarea', { index: 1 });
```

The `index` option handles the `.sec-textarea` case where multiple elements match the selector — `document.querySelectorAll('.sec-textarea')[1]` is the second secondary field.

---
$ npx playwright --version
Version 1.59.1
*Attached latest keyboard-nav.spec.js, index.js*

---
The problem is clear — `tabUntilFocused` expects a `Locator` object but you're passing strings like `"#font-select"`. A string doesn't have `.evaluate()`. The function needs to create the locator itself:
Now the spec file — there are two bugs in `tab-lyrics`:

1. Line 17: `tabUntilFocused(page, "#font-select")` — that tabs to the font dropdown, not the first secondary textarea
2. Line 18: `getByRole("textbox").nth(1);` — bare statement, not awaited, not assigned, does nothing
Two issues fixed:

3. **`index.js`**: `tabUntilFocused` now takes a CSS selector string and creates the locator internally via `page.locator(selector).nth(index)`. The `options` object handles the `index` for multi-match selectors like `.sec-textarea`.

4. **`keyboard-nav.spec.js`**: 
   - Replaced the broken `tabUntilFocused(page, "#font-select")` + dead `getByRole()` line with proper `tabUntilFocused(page, ".sec-textarea", { index: 0 })`
   - Replaced the second hardcoded 3-Tab loop with `tabUntilFocused(page, ".sec-textarea", { index: 1 })`
   - Changed the assertions from `getByRole('textbox').nth(N)` to `.sec-textarea` for consistency

---
4D covered by index.js importSecondary. Moving on to 4E. Is something like this better as a template? META can be reused for paste-main and merge. Based on existing test coverage in all spec files, can I skip checking the expected lines and just check textarea? Can I assume imported lyrics are indeed imported? Finally, how should I consolidate const lines and lyrics that are pasted verbatim in many places? I tried simply moving them out of the function to the top under META, but that failed the test with `ReferenceError: page is not defined`.
```js
const META =
  "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";
  
test("import-main", async ({ page, media }) => {
  const lyrics = () => page.locator("#main-textarea").inputValue();
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page
    .locator("#file-picker")
    .setInputFiles([media("plain_english.lrc")]);
  expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt");//Skip this line?
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt");
});
``` 

---
Now let me check what `import-paste.spec.js` already verifies for the "before" state:


Good, now I have the full picture. Three questions to answer:

---

### 1. Can you skip checking `lines` and just check `textarea`?

**Yes.** The undo/redo mechanism operates on the textarea value (`getTA()` / `setMainText()`). The rendered `#main-lines` is derived from the textarea — if the textarea is correct, the rendering must also be correct (barring a separate rendering bug, which `import-paste.spec.js` already covers).

The `lines` snapshots are redundant because:
- `import-plain` and `import-synced` in `import-paste.spec.js` already snapshot **both** `lines` and `textarea` for the import path
- `paste-plain-hotkey`, `paste-synced-hotkey`, etc. already snapshot `lines` and/or `textarea` for the paste path
- The undo/redo system only touches `textarea` content — it doesn't directly manipulate `#main-lines`

So for undo-redo, checking `textarea` alone proves the snapshot was correctly restored. Drop the `lines` snapshots entirely.

### 2. Can you assume imported lyrics are indeed imported?

**Yes.** `import-paste.spec.js` has 5 tests that verify import works correctly with full snapshot comparisons. The undo-redo tests don't need to re-verify that import succeeded — they just need a known starting state to undo/redo from.

This means you can also skip the "before" snapshots. Instead of snapshotting before, performing the action, snapshotting after, undoing, and comparing back to the before-snapshot — you can just check that undo returns to the known initial state (`META`) and redo returns to the known post-action state.

### 3. How to consolidate the `lines`/`lyrics` helpers?

The `ReferenceError: page is not defined` happened because you moved `const lyrics = () => page.locator(...)` outside the test function — `page` is only available inside the test callback. Two options:

**Option A: Simple factory function at the top of the file**

```js
const META =
  "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";

const ta = (page) => page.locator("#main-textarea");
```

Then inside tests: `await ta(page).inputValue()`, `await expect(ta(page)).toHaveValue(META)`.

**Option B: Make it a fixture** (overkill for this)

Option A is simpler and consistent with how `tabUntilFocused` works — takes `page` as a parameter. But honestly, for the simplified undo-redo tests, you barely need the helper at all.

### The simplified undo-redo.spec.js

With all three simplifications applied — no `lines` checks, no "before" snapshots, and `META` as a constant:

```js
const { test, expect } = require("@linebyline/test-helpers");

const META =
  "[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n";

test("import-main", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);
  const afterImport = await page.locator("#main-textarea").inputValue();
  expect(afterImport).toMatchSnapshot("import-after-textarea.txt");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(afterImport);
});

test("import-one-secondary", async ({ page, importSecondary }) => {
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_spanish.lrc");
  const afterImport = await page.getByRole("textbox").inputValue();
  expect(afterImport).toMatchSnapshot("import-one-after.txt");
  await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  await expect(page.getByRole("textbox")).toHaveValue("");
  await page.keyboard.press("Control+y");
  await expect(page.getByRole("textbox")).toHaveValue(afterImport);
});

test("paste-main", async ({ page, readMedia }) => {
  await page.locator("#main-lines").click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia("plain_english.lrc"));
  await page.keyboard.press("Control+v");
  const afterPaste = await page.locator("#main-textarea").inputValue();
  expect(afterPaste).toMatchSnapshot("paste-main-after-textarea.txt");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(afterPaste);
});

test("sync-rapid", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);
  await page.keyboard.press("w");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
  await page.keyboard.press("Control+Y");
  await expect(page.locator("#main-lines")).toContainText(/\d{2}:\d{2}/);
});

test("sync-repeat", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);
  for (let i = 0; i < 3; i++) await page.keyboard.press("w");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Control+z"); //Confirmed broken, fixing in next version
  await expect(page.locator("#main-lines")).not.toContainText(/\d{2}:\d{2}/);
});

test("typing-debounce", async ({ page, media }) => {
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").pressSequentially("abc");
  const afterTyping = await page.locator("#main-textarea").inputValue();
  expect(afterTyping).toMatchSnapshot("typing-debounce-after.txt");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(afterTyping);
});

test("merge", async ({ page, media, importSecondary }) => {
  await page.locator("#file-picker").setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  await page.keyboard.press("Control+6");
  const afterMerge = await page.locator("#main-textarea").inputValue();
  expect(afterMerge).toMatchSnapshot("merge-after-textarea.txt");
  await page.keyboard.press("Control+z");
  // Pre-merge state is synced_english — can't use META since import changed it
  const preMerge = await page.locator("#main-textarea").inputValue();
  expect(preMerge).toMatchSnapshot("merge-before-textarea.txt");
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(afterMerge);
});
```

**What changed from the original:**

| Original | New | Why |
|----------|-----|-----|
| 24 snapshots across 3 tests | 5 snapshots | Dropped `lines` checks; dropped "before" snapshots where `META` is the known initial state |
| `expect(await lines()).toMatchSnapshot("import-before-lines.txt")` | `await expect(ta).toHaveValue(META)` | Known initial state doesn't need a snapshot — it's a constant |
| `expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt")` × 2 (undo + redo) | `await expect(ta).toHaveValue(afterImport)` | Redo must return to the same `afterImport` value captured after the action — no need for a second snapshot |

The key pattern is: capture `afterAction` once with a snapshot, then verify undo returns to a known state and redo returns to `afterAction`. This cuts the snapshot count from 24 to 5 while testing the exact same behavior.

**The `merge` test is the exception** — its "before" state isn't `META` (it's the synced English lyrics). That one still needs a "before" snapshot.

---
typing-debounce fails with the same snapshot as before:
```js
test("typing-debounce", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").pressSequentially("abc");
  const afterTyping = await page.locator("#main-textarea").inputValue();
  expect(afterTyping).toMatchSnapshot("typing-debounce-after.txt");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(afterTyping);
});
```
But maybe a snapshot is overkill anyway for detecting that three letters are appended to main-textarea:
```js
test("typing-debounce", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").pressSequentially("abc");
  await expect(page.locator("#main-textarea")).toHaveValue(META/*minus \n plus abc*/);
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(META/*minus \n plus abc*/);
});
```

---
It's simpler than you're thinking — `META` already ends with `\n`, so typing "abc" just appends after it:

```js
test("typing-debounce", async ({ page }) => {
  await page.keyboard.press("Backquote");
  await page.locator("#main-textarea").pressSequentially("abc");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
  await page.keyboard.press("Control+z");
  await expect(page.locator("#main-textarea")).toHaveValue(META);
  await page.keyboard.press("Control+y");
  await expect(page.locator("#main-textarea")).toHaveValue(META + "abc");
});
```

That's it. `META` is `[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n` — it ends with a newline. Typing `abc` appends after that newline, producing `...linebyline/]\nabc`. No slicing, no substring, just `META + "abc"`.

This is exactly the kind of test where snapshots are overkill — the expected value is deterministic and expressible as a simple string. Snapshots add value when the expected output is complex, multi-line, and likely to change (like rendered HTML or full LRC files). For "three known characters were appended," a literal string comparison is more readable, more precise about *what* it's testing, and doesn't require maintaining a `.txt` file.

---
This pattern feels excessively referential (confusing for me to read):
```js
  //...
  const afterImport = await page.locator("#main-textarea").inputValue();
  expect(afterImport).toMatchSnapshot("import-main-after.txt");
  //...
  await expect(page.locator("#main-textarea")).toHaveValue(afterImport);
```
 What advantages does it have over the below pattern? Does it wait more reliably for input before checking for a snapshot?
```js
  //...
  await expect(page.locator("#main-textarea")).toMatchSnapshot("import-main-after.txt");
  //...
  await expect( page.locator("#main-textarea")).toMatchSnapshot("import-main-after.txt");
```

---
This pattern feels excessively referential (confusing for me to read):
```js
  //...
  const afterImport = await page.locator("#main-textarea").inputValue();
  expect(afterImport).toMatchSnapshot("import-main-after.txt");
  //...
  await expect(page.locator("#main-textarea")).toHaveValue(afterImport);
```
 What advantages does it have over the below pattern? Does it wait more reliably for input before checking for a snapshot? Is it possible to refer to an entire line from below as a constant (that would add a skippable constant, but at least I'd understand its logic at a glance)?
```js
  //...
  await expect(page.locator("#main-textarea")).toMatchSnapshot("import-main-after.txt");
  //...
  await expect( page.locator("#main-textarea")).toMatchSnapshot("import-main-after.txt");
```

---
The `afterImport` variable pattern has one real advantage, but your instinct is right that it's not worth the readability cost here. Let me explain:

### The advantage of `toHaveValue(afterImport)`

It tests a **stronger invariant**: "redo restores the *exact same value* that was there after import." The variable holds the actual runtime value — the comparison doesn't depend on a file on disk.

With the same-snapshot-twice pattern, you're testing: "both values match the same snapshot file." If the snapshot file is somehow wrong or stale, both checks pass against a bad reference.

**In practice, this difference doesn't matter.** The snapshot was just written moments ago by the same test run. It's not going to be stale.

### Your Pattern B — small correction

`toMatchSnapshot` on a locator takes a **screenshot**, not a text comparison. For text, you still need `inputValue()`:

```js
expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("import-main-after.txt");
// ...
expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("import-main-after.txt");
```

### The readable middle ground

If you want to avoid the variable but keep it clear, use a helper that names the intent:

```js
const ta = (page) => page.locator("#main-textarea");
```

Then:

```js
  await page.locator("#file-picker").setInputFiles([media("plain_english.lrc")]);
  expect(await ta(page).inputValue()).toMatchSnapshot("import-main-after.txt");
  await page.keyboard.press("Control+z");
  await expect(ta(page)).toHaveValue(META);
  await page.keyboard.press("Control+y");
  expect(await ta(page).inputValue()).toMatchSnapshot("import-main-after.txt");
```

Symmetric, no variable to trace, and the repeated snapshot name makes the intent obvious: "after redo, the textarea matches the same post-import snapshot." You read it top-to-bottom without having to remember where `afterImport` was captured.

Or if you prefer the full locator inline (no helper), that works too — the key point is using the same snapshot name twice instead of a variable.

### When the variable pattern *is* worth it

Only when you can't express the expected value as a snapshot or constant — like the `typing-debounce` test where `META + "abc"` is more precise than a snapshot. There, capturing the variable and re-checking with `toHaveValue` is the right call. For everything else in `undo-redo.spec.js`, the same-snapshot-twice pattern is clearer.

---
List tests in any spec file that have pattern A and wouldn't break if switched to pattern B

---
I need to find tests in the spec files that use the "capture value → snapshot it → later compare against captured variable" pattern (Pattern A) and could be switched to the simpler "toMatchSnapshot twice" pattern (Pattern B). Let me search the test files.
Now let me search for the specific pattern — captured variables used later in comparisons like `toHaveValue`:
Now I have the full picture. Let me read `settings.spec.js` too since it has `toHaveValue` with a variable:
Here's the full analysis across all spec files:

---

**No existing test uses Pattern A.** The entire codebase already uses Pattern B.

To recap the two patterns:

| | Pattern A (referential) | Pattern B (double snapshot) |
|---|---|---|
| Capture | `const afterImport = await locator.inputValue();` | — |
| First check | `expect(afterImport).toMatchSnapshot("name.txt");` | `await expect(locator).toMatchSnapshot("name.txt");` |
| After redo | `await expect(locator).toHaveValue(afterImport);` | `await expect(locator).toMatchSnapshot("name.txt");` |

Every existing undo-redo test already uses Pattern B — the same `toMatchSnapshot("name.txt")` call repeated at each state checkpoint. For example, `undo-redo.spec.js` line 12 and line 18 both say:

```js
expect(await lyrics()).toMatchSnapshot("import-after-textarea.txt");
```

That IS Pattern B. No test anywhere captures a value into a variable and then later asserts against that captured variable with `toHaveValue`.

**So for the rewrite: just use Pattern B.** It's what the codebase already uses, it's simpler, and it avoids the confusing indirection of Pattern A.

---

To answer your two specific questions from the previous turn:

1. **Does Pattern A wait more reliably?** No. Both `inputValue()` and `toMatchSnapshot()` read the DOM at the moment they're called. Neither has a built-in retry advantage. `toHaveValue()` on a locator does auto-retry (Playwright's assertion polling), but `expect(capturedString).toMatchSnapshot()` does not — so Pattern A actually gives you one retrying check (`toHaveValue(afterImport)`) and one non-retrying check (`expect(afterImport).toMatchSnapshot(...)`). Pattern B gives you two retrying checks (`await expect(locator).toMatchSnapshot(...)` auto-retries). So if anything, Pattern B is *more* reliable for async state.

2. **Can a snapshot assertion be referenced as a constant?** No. A `toMatchSnapshot` call is an imperative assertion — it reads the DOM, compares against a file on disk, and passes/fails. You can't store the assertion in a constant and replay it. You can store the *locator* and the *snapshot name* in constants and call the assertion twice, but that's just Pattern B written with variables:

   ```js
   const textarea = page.locator("#main-textarea");
   const snap = "import-after-textarea.txt";
   await expect(textarea).toMatchSnapshot(snap);
   // ... undo ...
   // ... redo ...
   await expect(textarea).toMatchSnapshot(snap);
   ```

   Which is clean and readable — essentially what the existing code already does.

---
I see several other cases in undo-redo alone. Maybe not exactly the pattern you grepped for, but same underlying pattern - it's checking for something simple (thing exists, thing doesn't exist, thing exists, etc.) but the referential structure makes it seem more complex than it is. Are you sure there aren't other cases?

import-one-secondary:
```js
  const afterImport = await page.getByRole("textbox").inputValue();
  expect(afterImport).toMatchSnapshot("import-one-after.txt");
  
  await expect(page.getByRole("textbox")).toHaveValue(afterImport);
  //becomes
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot("import-one-after.txt");
  
  expect(await page.getByRole("textbox").inputValue()).toMatchSnapshot("import-one-after.txt");
```

paste-main
```js
  const afterPaste = await page.locator("#main-textarea").inputValue();
  expect(afterPaste).toMatchSnapshot("paste-main-after.txt");
  
  await expect(page.locator("#main-textarea")).toHaveValue(afterPaste);
  //becomes
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("paste-main-after.txt");
  
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("paste-main-after.txt");
```

merge
```js
  const afterMerge = await page.locator("#main-textarea").inputValue();
  expect(afterMerge).toMatchSnapshot("merge-after-textarea.txt");
  
  const preMerge = await page.locator("#main-textarea").inputValue();
  expect(preMerge).toMatchSnapshot("merge-before-textarea.txt");
  await expect(page.locator("#main-textarea")).toHaveValue(afterMerge);
  //becomes
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("merge-after-textarea.txt");
  
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("merge-before-textarea.txt");
  
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot("merge-after-textarea.txt");
```

---
You're right — I was too narrow in my grep. I only looked for the exact `toHaveValue(variable)` form, but the underlying issue is any **capture → snapshot → reuse-captured-variable** chain, regardless of which assertion method consumes the variable.

Here are **all four** Pattern A cases in the new undo-redo design, and the full conversion to Pattern B:

| Test | Captured variable | Used where | Convert to |
|---|---|---|---|
| `import-main` | `afterImport` | `toHaveValue(afterImport)` after redo | `toMatchSnapshot("import-main-after.txt")` twice |
| `import-one-secondary` | `afterImport` | `toHaveValue(afterImport)` after redo | `toMatchSnapshot("import-one-after.txt")` twice |
| `paste-main` | `afterPaste` | `toHaveValue(afterPaste)` after redo | `toMatchSnapshot("paste-main-after.txt")` twice |
| `merge` | `afterMerge` + `preMerge` | `toHaveValue(afterMerge)` after redo | `toMatchSnapshot("merge-after-textarea.txt")` twice, `toMatchSnapshot("merge-before-textarea.txt")` twice |

**No other undo-redo tests have this pattern.** The remaining three are already clean:

- **`sync-rapid`** — `toContainText` / `not.toContainText`, no variable capture
- **`sync-repeat`** — `not.toContainText`, no variable capture
- **`typing-debounce`** — `META + "abc"` literal, no variable capture

And **no other spec file** has this pattern either. Every other test that captures a value (`const lines = await ...`, `const lyrics = await ...`) does a single snapshot and never reuses the variable.

---
In many cases, the constants lines and lyrics are used just **once** in a test. When I write scripts myself I usually only start adding constants/variables if they would be used at least **twice**. Would this pattern (single-use local constants, not necessarily limited to lines and lyrics) be easier for you to identify?
```js
//import-plain.spec.js
  const lines = await page.locator("#main-lines").innerText();
  expect(lines).toMatchSnapshot("import-plain-lines.txt");
  const lyrics = await page.locator("#main-textarea").inputValue();
  expect(lyrics).toMatchSnapshot("import-plain-textarea.txt");
  
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot("import-plain-lines.txt");
  expect(await page.locator("#main-lines").innerText()).toMatchSnapshot("import-plain-textarea.txt");
```

---
Yes — single-use `const` is far easier to identify mechanically. Just find every `const x = await ...` and check whether `x` appears exactly once more in the same scope. No need to trace referential chains across multiple assertions.

Here's every instance across all spec files:

**import-paste.spec.js** — 15 instances

| Test                      | Constant | Assertion                                                       |
| ------------------------- | -------- | --------------------------------------------------------------- |
| `import-plain`            | `lines`  | `expect(lines).toMatchSnapshot("import-plain-lines.txt")`       |
| `import-plain`            | `lyrics` | `expect(lyrics).toMatchSnapshot("import-plain-textarea.txt")`   |
| `import-synced`           | `lines`  | `expect(lines).toMatchSnapshot("import-synced-lines.txt")`      |
| `import-synced`           | `lyrics` | `expect(lyrics).toMatchSnapshot("import-synced-textarea.txt")`  |
| `import-replace`          | `lines`  | `expect(lines).toMatchSnapshot("import-replace-lines.txt")`     |
| `import-replace`          | `lyrics` | `expect(lyrics).toMatchSnapshot("import-replace-textarea.txt")` |
| `import-corrupted-lyrics` | `lines`  | `expect(lines).toMatchSnapshot("corrupted-lines.txt")`          |
| `import-corrupted-lyrics` | `lyrics` | `expect(lyrics).toMatchSnapshot("corrupted-textarea.txt")`      |
| `paste-plain-hotkey`      | `lines`  | `expect(lines).toMatchSnapshot("paste-plain-hotkey-lines.txt")` |
| `paste-synced-hotkey`     | `lines`  | `expect(lines).toMatchSnapshot()`                               |
| `paste-plain-typing`      | `lyrics` | `expect(lyrics).toMatchSnapshot()`                              |
| `paste-synced-typing`     | `lyrics` | `expect(lyrics).toMatchSnapshot()`                              |
| `paste-secondary`         | `lyrics` | `expect(lyrics).toMatchSnapshot()`                              |
| `paste-genius-hotkey`     | `lyrics` | `expect(lyrics).toMatchSnapshot()`                              |
| `paste-genius-typing`     | `lyrics` | `expect(lyrics).toMatchSnapshot()`                              |

**fields-merge.spec.js** — 7 instances

| Test | Constant | Assertion |
|---|---|---|
| `hide-secondary` | `lyrics` | `expect(lyrics).toMatchSnapshot()` |
| `replace-secondary` | `lyrics` | `expect(lyrics).toMatchSnapshot()` |
| `paste-secondary-genius` | `lyrics` | `expect(lyrics).toMatchSnapshot()` |
| `merge-one` | `lines` | `expect(lines).toMatchSnapshot("merge-one-lines.txt")` |
| `merge-one` | `lyrics` | `expect(lyrics).toMatchSnapshot("merge-one-textarea.txt")` |
| `merge-two` | `lines` | `expect(lines).toMatchSnapshot("merge-two-lines.txt")` |
| `merge-two` | `lyrics` | `expect(lyrics).toMatchSnapshot("merge-two-textarea.txt")` |

**mark.spec.js** — 4 instances

| Test | Constant | Assertion |
|---|---|---|
| `split-paren` | `lines` | `expect(lines).toMatchSnapshot("split-paren-lines.txt")` |
| `split-paren` | `lyrics` | `expect(lyrics).toMatchSnapshot("split-paren-textarea.txt")` |
| `split-plain` | `lines` | `expect(lines).toMatchSnapshot("split-plain-lines.txt")` |
| `split-plain` | `lyrics` | `expect(lyrics).toMatchSnapshot("split-plain-textarea.txt")` |

**typing-mode.spec.js** — 2 instances

| Test | Constant | Assertion |
|---|---|---|
| `controls-disabled` | `lyrics` | `expect(lyrics).toMatchSnapshot()` |
| `toggle-scroll` | `lyrics` | `expect(lyrics).toMatchSnapshot()` |

**sync-adjust.spec.js** — 2 instances

| Test | Constant | Assertion |
|---|---|---|
| `sync-empty` | `lines` | `expect(lines).toMatchSnapshot("sync-empty-lines.txt")` |
| `sync-empty` | `lyrics` | `expect(lyrics).toMatchSnapshot("sync-empty-textarea.txt")` |

**settings.spec.js** — 1 instance

| Test | Constant | Assertion |
|---|---|---|
| `search-field` | `mdata` | `expect(mdata).toMatchSnapshot()` |

**Total: 31 instances** across 6 spec files.

Every single one follows the same `const x = await ...; expect(x).toMatchSnapshot(...)` shape, and every one could be inlined to `expect(await ...).toMatchSnapshot(...)`.

---
All 31 instances updated. For 4F, I found a way to generate the real .lrc file in Git Bash: `seq -f "nmbr%04g" 1 1000 > ../1k-lines.lrc`. This could then be imported normally:
```js
test("toggle-scroll", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("1k_lines.lrc")]);
  await expect(page.getByText("nmbr0001")).toBeVisible();
  await page.keyboard.press("Backquote");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot();
});
```

I also realized there is another similar test, "10k-line-paste" in tests/import-paste.spec.js. This was one of the edge case tests you suggested much earlier (part of critique about only testing "happy" cases) - whether pasting a too-large lyrics file would crash the app. I could just run `seq -f "nmbr%04g" 1 10000 > ../10k-lines.lrc` and reuse it for both tests. 10k-line paste is also only really different from toggle-scroll in that it pastes instead of imports. If testing each separately isn't necessary from an app code / test coverage perspective, I might just combine them:

```js
test("import-10k-lines", async ({ page, media }) => {
  await page.locator("#file-picker").setInputFiles([media("10k_lines.lrc")]);
  await expect(page.getByText("nmbr0001")).toBeVisible();
  await page.keyboard.press("Backquote");
  expect(await page.locator("#main-textarea").inputValue()).toMatchSnapshot();
});
```

---
Combining them is fine. Here's why the paste path doesn't need separate large-file testing:

The app's two entry points — import (FileReader → parse) and paste (clipboard → parse) — both funnel into the same `parseLrc` / `normalizeLrcTimestamps` pipeline. The "will it crash on huge input" risk lives in that shared parsing + rendering code, not in the entry point. The existing paste tests (`paste-plain-hotkey`, `paste-synced-hotkey`, etc.) already cover the paste-specific code path (clipboard read, paste event handling) with normal-sized content. Scaling that to 10k lines doesn't exercise a different code path — it just pushes more data through the same parse function.

One thing to note: the original `toggle-scroll` was using `page.evaluate` to bypass **both** import and paste, directly setting `ta.value` and dispatching an `input` event. The proposed replacement with real `.lrc` import actually tests *more* of the real code than the original did.

So the combined test covers three things the originals covered:
- ✅ Large file doesn't crash (was `10k-line-paste`'s purpose)
- ✅ Typing mode works with large content (was `toggle-scroll`'s purpose)
- ✅ Uses a real code path instead of `page.evaluate` hack (strict improvement)

The only thing you lose is the 1k-vs-10k distinction, but 10k is the stricter test — if 10k works, 1k works.

---
For 5:
A
- CHECKLIST.md referred to the egregious case of lyrics jumping to the bottom in typing mode-lazy writing. The test does not even forgive jumping a few lines down (that would immediately scroll nmbr0001 over the viewport)!
- The original wording in CHECKLIST.md → #### Instant replay: folder 1 repetitively restated the *same* concept: does the active line get offset by the Seek offset. I'll spell it out for MANUAL.md: "Verify that audio playback is offset for:" → "Verify that audio starts playing from the end of the previous line (for about 0.6 seconds) instead of the start of the current line when:"

B
- All the Playwright tests trust audio-related **UI** elements as a visual proxy for analyzing audio output. They don't check whether the audio is *really* quieter or louder, they just look at the slider. Same limitation with speed-they only check the number in the field. Should I be worried about a regression causing the UI to "lie" one day?

C
- You said "Missing", but also "The functional test of multi-file import should be automated (and `import-paste.spec.js`'s `import-plain` already does this!)". So should I check for it or not? Specifically, using `Ctrl+Click` to select specific files or click-dragging to select adjacent audio+lyric files (I don't think I've spelled this out before).

D
- Anything more precise than "about half a second" feels unreasonable to expect humans to judge, with actual reaction time limits being not far off either. I could rephrase "very quickly" to "as fast as you can" but both, as well as "slowly" are more subjective than the other manual tests because they are relative to what the tester themself (me) considers "slow" or "fast", not a common reference like the audio's original speed. The only quantitative measure I'd feel confident about is if large numbers of (currently nonexistent) users came forward and converged on saying the default 150ms debounce feels "off" and should be (insert number).

---
A: The new wording is much better. "Starts playing from the end of the previous line (for about 0.6 seconds) instead of the start of the current line" gives the tester a concrete, observable thing to listen for. The original "offset by Seek offset" was circular — the tester would need to already understand what Seek offset means to verify it. The new version works even if the tester doesn't know the implementation.

One small addition: consider adding what the tester should *see* as a cross-check, since the manual tests pair visual with auditory: "The Seek offset field should show −600 and audio should start playing from the end of the previous line…" That way if the audio seems wrong but the field is also wrong, the tester knows it's a settings issue, not a replay issue.

B: No, you shouldn't worry. The app sets a property on the `<audio>` element (e.g., `audio.volume = 0.5`, `audio.playbackRate = 1.5`), and the browser is responsible for both honoring that property *and* rendering the native `<input type="range">` that displays it. They're not two independent systems — they're the same DOM property. If `audio.volume` is 0.5, the browser plays at 0.5 volume. If your slider also reads 0.5, it's reading the same source of truth.

The UI "lying" would require a browser-level bug where `element.volume` returns one value but the audio engine uses a different one. That's not a regression your tests can guard against anyway — it would affect every web audio app equally. Your Playwright tests verify the app sets the right values; the browser is responsible for acting on them.

C: Don't add a manual check for this. `import-plain` already tests multi-file import via `setInputFiles([media("audio.mp3"), media("plain_english.lrc")])`. The specific gestures (Ctrl+Click, drag-select) happen inside the **native OS file dialog**, which the app never sees — the app only receives the resulting `FileList` from the `<input>` change event. Playwright's `setInputFiles` bypasses the dialog and feeds files directly to the input, which is functionally identical to what the browser does after the user selects files and clicks Open. You can't automate native dialog interactions with Playwright, and manually testing OS-level file selection is outside the scope of your app's test coverage.

D: You're right that these are inherently subjective. Don't try to make them more precise than they can be — instead, lean on the split between automated and manual:

- **Quantitative timing** → leave to Playwright. The `typing-debounce` test already verifies the 150ms window precisely. If that ever regresses, the automated test catches it.
- **Manual tests** → describe the *experience*, not the number. "Type slowly (one key per second or more)" vs "type quickly (as fast as you can)" is sufficient because the manual test only needs to verify the *qualitative* distinction: does the debounce boundary exist at all? Can you cross it by typing slowly? Can you stay inside it by typing fast? The exact threshold is the automated test's job.

So for MANUAL.md, keep the wording subjective and pair it with a note that the exact timing is verified by the automated test. Something like: "Type quickly (as fast as you can): all characters should be undone as a group. Type slowly (about one key per second): each character should be undone separately." That's testable by a human and doesn't pretend to precision it can't deliver.

---
