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
