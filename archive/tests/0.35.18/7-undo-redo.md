---
model: GLM-5.1
---
Are any of these planned tests for undo-redo.spec.js unnecessary, too complex, or too simple?
- [ ] undo-redo.spec.js      ← Undo/redo across import, sync, typing, merge
	- [ ] Import lyrics can be undone (snapshot before and after) and redone (compare with snapshot before)
		- [ ] In main field
		- [ ] In first secondary field
	- [ ] Paste regular lyrics can be undone (snapshot before and after) and redone (compare with snapshot before)
		- [ ] In main field
		- [ ] In first secondary field
	- [ ] Paste Genius lyrics can be undone (snapshot before and after) and redone (compare with snapshot before)
		- [ ] In main field
		- [ ] In first secondary field
	- [ ] Sync lyrics (W) can be undone (getByText before and after) and redone (getByText again matching before text)
	- [ ] Typing the letter "a" can be undone (snapshot before and after) and redone (compare with snapshot before)
		- [ ] In main field
		- [ ] In first secondary field
	- [ ] Merging one translation can be undone (snapshot before and after) and redone (compare with snapshot before)
	- [ ] Merging two translations can be undone (snapshot before and after) and redone (compare with snapshot before)

Also 1.1-suggestions.md suggests testing the edge case: "pressing sync + undo simultaneously". How would that work in Playwright?

---
Good question — the answer depends on understanding what the undo/redo system actually does under the hood. Since it's snapshot-based (full state capture each time), most of these tests are exercising the **same mechanism** with different data.

## Verdict on each planned test

### ❌ Unnecessary — remove entirely

| Test | Why |
|---|---|
| **Paste Genius undo/redo** (main *and* secondary) | Genius paste runs through the same `pushSnapshot()` → `setContent()` → `pushSnapshot()` code path as regular paste. The *extraction* differences (HTML stripping, metadata) are tested in `import-paste.spec.js`. For undo/redo, both are just "content replaced, snapshot pushed." Same mechanism. |
| **Merge two translations** | Same `mergeTranslations()` → `pushSnapshot()` → `pushSnapshot()` flow as merging one. Testing a second merge just tests counting, not the undo mechanism. If you want to test multi-step undo (undo twice), do: merge once → undo → undo again (back to pre-merge) — that tests the *stack* depth, not a second merge operation. |

### ✂️ Redundant across main/secondary — keep ONE, not for every operation

The real question is: **does `takeSnapshot()` capture secondary field content?** If yes, one secondary-field test proves it; the rest repeat the same code path.

| Keep | Drop |
|---|---|
| Import undo in **secondary** field | Paste undo in secondary field |
| (optionally) Typing undo in **secondary** field | — |

**Reasoning**: Import into a secondary field calls a *different function* (`addSecondary` / secondary file handler) than import into main. Testing it once proves the secondary content is included in snapshots. Paste into secondary uses the same snapshot path — it adds nothing.

Typing in secondary is a marginal call — it verifies the secondary textarea's `input` event listener is wired to `pushSnapshot`. Worth a 3-line test if you want belt-and-suspenders, but functionally the same debounce→snapshot path.

### 🔄 Too simple — upgrade

| Test | Problem | Fix |
|---|---|---|
| **Typing "a"** then undo | Single keystroke is trivial — it doesn't test the debounce boundary, which is the interesting part of typing undo | Type `"abc"` rapidly (debounce window), then undo. **Expect**: all three characters vanish in one undo step. Then undo again — expect nothing happens (stack has only 2 entries: initial + post-typing). |

### The pruned plan

```
undo-redo.spec.js
├─ Import lyrics can be undone and redone
│   ├─ In main field
│   └─ In first secondary field          ← proves snapshots include secondary
├─ Paste regular lyrics can be undone and redone
│   └─ In main field only                ← secondary covered by import above
├─ Sync can be undone and redone
├─ Typing (debounced group) can be undone as one step and redone
│   └─ In main field                     ← secondary is same debounce path
├─ Merge one translation can be undone and redone
├─ Redo stack clears on new action       ← classic undo invariant
│   (type → undo → type → redo does nothing)
└─ Undo/redo at stack boundaries         ← no-op at bottom/top
```

That's **9 tests** instead of your original 14, covering every distinct behavior.

---

## "Pressing sync + undo simultaneously" — how it works in Playwright

### Short answer: you can't, and you shouldn't try

JavaScript is single-threaded. `keydown` events are dispatched sequentially by the browser's event loop. There is no true simultaneity — the sync handler **always** completes before the undo `keydown` fires. The "simultaneous" scenario from 1.1-suggestions.md is really about **rapid sequential actions** and whether the undo stack stays consistent.

### What you *can* test (and what's actually valuable)

The realistic edge case isn't "simultaneous" — it's **"undo before the user can see the sync finished,"** which in practice means:

```js
test('rapid sync then undo leaves consistent state', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([media('synced_english.lrc')]);
  // Sync a line
  await page.keyboard.press('W');
  // Immediately undo — no assertion between them
  await page.keyboard.press('Control+Z');
  // State should be back to pre-sync, with no corrupted stack
  await expect(page.locator('#main-lines')).not.toContainText(/\d{2}:\d{2}/);
  
  // And redo should still work (stack isn't broken)
  await page.keyboard.press('Control+Y');
  await expect(page.locator('#main-lines')).toContainText(/\d{2}:\d{2}/);
});
```

This tests that the undo stack is consistent even under rapid sequential input — which is the closest meaningful approximation of "simultaneous."

### What `Promise.all` does (and why it's misleading)

```js
// This does NOT fire two keydowns simultaneously
await Promise.all([
  page.keyboard.press('W'),
  page.keyboard.press('Control+Z'),
]);
```

Playwright serializes both `press()` calls into the browser's input pipeline. The browser processes them one at a time. `Promise.all` just means Playwright waits for both to complete before continuing — the keydowns themselves are still sequential.

### The edge case that *is* worth testing: key repeat

The app's global handler already guards against key repeat (`if (e.repeat && !isNavKey) return;`). But what about repeated sync presses?

```js
test('repeated sync presses produce one undo step per sync', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([media('synced_english.lrc')]);
  // Sync three lines rapidly
  await page.keyboard.press('W');
  await page.keyboard.press('W');
  await page.keyboard.press('W');
  // Each sync is a separate snapshot — three undos to get back
  await page.keyboard.press('Control+Z');
  await page.keyboard.press('Control+Z');
  await page.keyboard.press('Control+Z');
  // Should be back to initial state
  // ...verify
});
```

This is a more realistic "rapid action" test than "simultaneous" — and it actually tests something meaningful: that each sync call correctly pushes its own snapshot and doesn't accidentally coalesce them or skip the push.

---
``` js
test('import-main', async ({ page, media }) => {
  const lines = await page.locator('#main-lines').innerText();
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lines).toMatchSnapshot('import-before-lines.txt');
  expect(lyrics).toMatchSnapshot('import-before-textarea.txt');
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);
  expect(lines).toMatchSnapshot('import-after-lines.txt');
  expect(lyrics).toMatchSnapshot('import-after-textarea.txt');
  await page.keyboard.press('Control+z');
  expect(lines).toMatchSnapshot('import-before-lines.txt');
  expect(lyrics).toMatchSnapshot('import-before-textarea.txt');
  await page.keyboard.press('Control+y');
  expect(lines).toMatchSnapshot('import-after-lines.txt');
  expect(lyrics).toMatchSnapshot('import-after-textarea.txt');
});
```
The above passes but the snapshot contents below show it isn't really working. Do I need to explicitly update or spin off the constants, lines and lyrics?
```import-before-lines-firefox-win32.txt

```

```import-after-lines-firefox-win32.txt

```

```import-before-textarea-firefox-win32.txt
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: https://amokprime.github.io/linebyline/]
```

```import-after-textarea-firefox-win32.txt
[ti: Unknown]
[ar: Unknown]
[al: Unknown]
[re: https://amokprime.github.io/linebyline/]
```
The snapshots worked before in import-paste.spec.js and fields-merge.spec.js, but in those cases I didn't make them so close to the `setInputFiles` event.

---
Yes, exactly that. `innerText()` and `inputValue()` resolve to **strings** — they're snapshots of the DOM at that moment, not live references. Your `const` captures the value once, then you keep comparing the same stale string.

```js
// Captures "empty" → lines will always be "" no matter what happens later
const lines = await page.locator('#main-lines').innerText();
```

Re-read after each action:

```js
test('import-main', async ({ page, media }) => {
  const lines = () => page.locator('#main-lines').innerText();
  const lyrics = () => page.locator('#main-textarea').inputValue();

  expect(await lines()).toMatchSnapshot('import-before-lines.txt');
  expect(await lyrics()).toMatchSnapshot('import-before-textarea.txt');

  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);

  expect(await lines()).toMatchSnapshot('import-after-lines.txt');
  expect(await lyrics()).toMatchSnapshot('import-after-textarea.txt');

  await page.keyboard.press('Control+z');

  expect(await lines()).toMatchSnapshot('import-before-lines.txt');
  expect(await lyrics()).toMatchSnapshot('import-before-textarea.txt');

  await page.keyboard.press('Control+y');

  expect(await lines()).toMatchSnapshot('import-after-lines.txt');
  expect(await lyrics()).toMatchSnapshot('import-after-textarea.txt');
});
```

The `() => page.locator(...).innerText()` pattern gives you a cheap factory that re-queries the DOM each time. You could also just spell out the full `await page.locator(...).innerText()` at each assertion — same effect, just more verbose.

**Why it "worked" in your other test files**: you probably didn't capture into a variable early and reuse it later. You queried and asserted in one step each time, so the locator always read the current DOM state.

---
