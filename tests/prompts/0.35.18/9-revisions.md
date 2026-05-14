# Test info

* Name: import-paste.spec.js >> save

* Location: tests\import-paste.spec.js:140:1

# Error details

```
TypeError: Cannot read properties of null (reading 'toString')
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - generic [ref=e52]: Unknown Title
        - generic [ref=e53]: Unknown Artist
        - generic [ref=e55]:
          - generic [ref=e56]: 0:00
          - generic [ref=e57]: 0:00
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
          - 'spinbutton "Seek offset (ms): shifts playback position when clicking a timestamped line" [ref=e76]': "-600"
          - generic [ref=e77]: ms
          - generic [ref=e78]:
            - button "▲" [ref=e79] [cursor=pointer]
            - button "▼" [ref=e80] [cursor=pointer]
          - button "Sync file Ctrl+I" [ref=e81] [cursor=pointer]:
            - text: Sync file
            - generic [ref=e82]: Ctrl+I
        - generic [ref=e83]:
          - button "Mute" [ref=e84] [cursor=pointer]:
            - img [ref=e85]
          - slider [ref=e87] [cursor=pointer]: "1"
          - generic [ref=e88]: 100%
      - generic [ref=e89]: Controls
      - generic [ref=e90]:
        - generic [ref=e91]:
          - generic "Toggle offset mode" [ref=e92] [cursor=pointer]:
            - generic [ref=e93]: Offset time
            - generic [ref=e94]: Shift+~
          - generic "Toggle mode" [ref=e95] [cursor=pointer]:
            - generic [ref=e96]: Hotkey mode
            - generic [ref=e97]: "`"
        - generic "Play/pause" [ref=e98] [cursor=pointer]:
          - generic [ref=e99]: Play/pause
          - generic [ref=e100]: Space
        - generic "Sync line start" [ref=e101] [cursor=pointer]:
          - generic [ref=e102]: Sync line
          - generic [ref=e103]:
            - generic [ref=e104]: W
            - generic [ref=e105]: Enter
        - generic "Previous line" [ref=e106] [cursor=pointer]:
          - generic [ref=e107]: Previous line
          - generic [ref=e108]:
            - generic [ref=e109]: Q
            - generic [ref=e110]: ↑
        - generic "Next line" [ref=e111] [cursor=pointer]:
          - generic [ref=e112]: Next line
          - generic [ref=e113]:
            - generic [ref=e114]: E
            - generic [ref=e115]: ↓
        - generic "Replay only" [ref=e116] [cursor=pointer]:
          - generic [ref=e117]: Replay only
          - generic [ref=e118]: R
        - generic "Sync line end" [ref=e119] [cursor=pointer]:
          - generic [ref=e120]: End line
          - generic [ref=e121]: T
        - generic "Back tiny amount" [ref=e122] [cursor=pointer]:
          - generic [ref=e123]: −100ms time
          - generic [ref=e124]: Z
        - generic "Forward tiny amount" [ref=e125] [cursor=pointer]:
          - generic [ref=e126]: +100ms time
          - generic [ref=e127]: V
        - generic "Back small amount" [ref=e128] [cursor=pointer]:
          - generic [ref=e129]: −200ms time
          - generic [ref=e130]: A
        - generic "Forward small amount" [ref=e131] [cursor=pointer]:
          - generic [ref=e132]: +200ms time
          - generic [ref=e133]: F
        - generic "Back medium amount" [ref=e134] [cursor=pointer]:
          - generic [ref=e135]: −400ms time
          - generic [ref=e136]: S
        - generic "Forward medium amount" [ref=e137] [cursor=pointer]:
          - generic [ref=e138]: +400ms time
          - generic [ref=e139]: D
        - generic "Back large amount" [ref=e140] [cursor=pointer]:
          - generic [ref=e141]: −1000ms time
          - generic [ref=e142]: X
        - generic "Forward large amount" [ref=e143] [cursor=pointer]:
          - generic [ref=e144]: +1000ms time
          - generic [ref=e145]: C
    - generic [ref=e150]:
      - generic [ref=e151]: Main
      - generic "Wrap marked translations in parentheses" [ref=e152] [cursor=pointer]:
        - checkbox "( )" [checked] [ref=e153]
        - text: ( )
      - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e154] [cursor=pointer]:
        - checkbox "↩" [ref=e155]
        - text: ↩
```

# Test source

```ts
  140 | test('save', async ({ page }) => {
  141 |   const downloadPromise = page.waitForEvent('download');
  142 |   await page.keyboard.press("Control+'");
  143 |   const download = await downloadPromise;
> 144 |   const content = await download.createReadStream().then(s => s.read().toString());
      |                                                                       ^ TypeError: Cannot read properties of null (reading 'toString')
  145 |   expect(content).toContain('[ti:');
  146 |   expect(content).toContain('[ar:');
  147 | });
```

***

The error is clear: `s.read()` returns `null` because `createReadStream()` returns a Node.js `Readable` stream in paused mode — calling `.read()` once before data is buffered yields `null`. You need to properly consume the entire stream with event listeners.

**Fix:**

```js
test('save', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const content = await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
  expect(content).toContain('[ti:');
  expect(content).toContain('[ar:');
});
```

**Why it broke:** `readable.read()` is a low-level API that returns `null` when no data is currently buffered. It only works in paused mode after a `'readable'` event, and even then must be called in a loop until it returns `null`. The `data`/`end` event pattern above is the correct way to consume the full contents.

**Simpler alternative** if you don't want to manage streams:

```js
test('save', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download.path().then(p => require('fs').readFileSync(p, 'utf-8'));
  expect(content).toContain('[ti:');
  expect(content).toContain('[ar:');
});
```

`download.path()` gives you the temporary file Playwright already saved the download to, so you just read it directly with `fs`. No stream handling needed.

***

```js
test('save', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('synced_english.lrc'),
  ]);
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download.path().then(p => require('fs').readFileSync(p, 'utf-8'));
  const filename = await download.suggestedFilename();
  expect(content).toContain('[ti: I Wish I Could Identify That Smell]') //1
  expect(content).toContain('[ar: The Jazz Kissingers]'); //2
  expect(content).toMatchSnapshot();
  expect(filename).toContain('I Wish I Could Identify That Smell') //3
});
```

Tests 1-3 pass silently without any obvious artifact (like the snapshot) or visual indication that they actually did what they were supposed to.
Also I want to set the title to a const and reuse it inside the quotes in case I ever change the song, and to make it even more explicit that the title is the same in both `[ti: ]` and filename.

***

Two changes: extract the title into a const, and replace the "silent" `toContain` substring checks with exact-value assertions so a pass proves something specific:

```js
const TITLE = 'I Wish I Could Identify That Smell';

test('save', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('synced_english.lrc'),
  ]);
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press("Control+'");
  const download = await downloadPromise;
  const content = await download.path().then(p => require('fs').readFileSync(p, 'utf-8'));
  const filename = download.suggestedFilename();
  const savedTitle = content.match(/\[ti: (.+?)\]/)?.[1]; // 1
  expect(savedTitle).toEqual(TITLE);                      // 1: exact, not substring
  expect(content).toContain('[ar: The Jazz Kissingers]');
  expect(content).toMatchSnapshot();                      // artifact for full content
  expect(filename).toBe(`${TITLE}.lrc`);                  // 3: exact, not substring
});
```

**What changed and why:**

| Before                                 | After                               | Reason                                                                                                                                                                                                            |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toContain('[ti: I Wish…]')`           | Parse with regex → `toEqual(TITLE)` | `toContain` is a substring check — it'd pass on `[ti: I Wish…][ti: Garbage]`. `toEqual` on the extracted value is exact, so a pass proves the `[ti:]` field contains *only* the expected title and nothing extra. |
| `toContain('I Wish…')` on filename     | `toBe(`\${TITLE}.lrc`)`             | `toContain` would pass on `Copy of I Wish….lrc` or `I Wish….lrc.bak`. `toBe` proves the filename is exactly what the save dialog should produce.                                                                  |
| Title literal duplicated in two places | `const TITLE` shared by both        | One source of truth — change the song, change one line. Also makes it visually obvious that the `[ti:]` field and the filename must agree.                                                                        |

The `toContain('[ar: …]')` stays as-is since it's not about the title and the snapshot covers the full content as the visual artifact.

***

```js
test('persistence', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);
  await page.getByRole('combobox', { name: 'Editor font' }).selectOption('serif');
  await page.getByRole('spinbutton', { name: 'Font size' }).fill('20');
  await page.getByRole('spinbutton', { name: 'Playback speed' }).fill('1.5');
  await page.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' }).fill('-400');
  await page.keyboard.press('Control+.');
  await page.keyboard.press('Control+,');
  await page.getByRole('checkbox', { name: 'Moving to previous line' }).check();
  await page.getByRole('spinbutton', { name: 'Tiny' }).fill('99');
  await page.locator('#s-default-meta').fill('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');
  await page.keyboard.press('Escape');
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');
  
  await page.reload();
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);
  await expect(page.locator('#font-select')).toHaveValue('serif');
  await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('20');
  await expect.soft(page.getByRole('spinbutton', { name: 'Playback speed' })).toHaveValue('1.5'); //confirmed broken, fixing in next version
  await expect(page.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' })).toHaveValue('-400');
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');
  await page.keyboard.press('Control+,');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');
  
  await page.locator('#settings-body').focus(); //not needed in real browser; Playwright loses focus
  await page.locator('body').press('ControlOrMeta+\\');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).not.toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('100');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n');
  await page.keyboard.press('Escape');
  await expect(page.locator('#font-select')).toHaveValue('system-ui,sans-serif');
  await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('14');
  await expect(page.getByRole('spinbutton', { name: 'Playback speed' })).toHaveValue('1');
  await expect(page.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' })).toHaveValue('-600');
});
```

The test itself is working as expected...it just feels too long. But splitting it into two or more tests would result in even more LOC overall as each would duplicate setup steps. Is this a good use case for `test.describe` grouping? Would it be worthwhile to assign some exact repetitions like `getByRole('spinbutton', { name: 'Font size' })` to a const. Or is there a more intelligent way to extrapolate expected value from an associated action? What if its syntax is not exactly the same, like `await page.getByRole('combobox', { name: 'Editor font' }).selectOption('serif');` → `await expect(page.locator('#font-select')).toHaveValue('serif');`?

***

Three questions, three answers:

### 1. `test.describe` — No

This is one sequential story: *set → reload → verify persistence → reset → verify defaults*. Splitting it means each sub-test re-runs the setup, and you'd also need to ensure they run in order (which defeats Playwright's parallelism). Keep it as one test.

### 2. Locator constants — Yes, but a spec array is better

Repeated locators cry out for deduplication, but the real win isn't saving characters — it's that the **set** and **verify** phases use the same data in both directions. A spec array lets both the "verify persisted" loop and the "verify reset" loop share a single source of truth:

```js
const PERSISTED = [
  { set: p => p.getByRole('combobox', { name: 'Editor font' }),  via: 'select', get: p => p.locator('#font-select'),                                value: 'serif',            default: 'system-ui,sans-serif' },
  { set: p => p.getByRole('spinbutton', { name: 'Font size' }),  via: 'fill',   get: p => p.getByRole('spinbutton', { name: 'Font size' }),         value: '20',                default: '14' },
  { set: p => p.getByRole('spinbutton', { name: 'Playback speed' }), via: 'fill', get: p => p.getByRole('spinbutton', { name: 'Playback speed' }), value: '1.5',               default: '1', soft: true },
  { set: p => p.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' }), via: 'fill', get: p => p.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' }), value: '-400', default: '-600' },
];
```

Then the test body becomes:

```js
test('persistence', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([media('plain_english.lrc')]);

  // ── Set values ──────────────────────────────────────────────
  for (const s of PERSISTED) {
    s.via === 'select' ? await s.set(page).selectOption(s.value) : await s.set(page).fill(s.value);
  }
  await page.keyboard.press('Control+.');
  await page.keyboard.press('Control+,');
  await page.getByRole('checkbox', { name: 'Moving to previous line' }).check();
  await page.getByRole('spinbutton', { name: 'Tiny' }).fill('99');
  await page.locator('#s-default-meta').fill('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');
  await page.keyboard.press('Escape');
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');

  // ── Verify persistence after reload ─────────────────────────
  await page.reload();
  await page.locator('#file-picker').setInputFiles([media('plain_english.lrc')]);
  for (const s of PERSISTED) {
    const assert = s.soft ? expect.soft : expect;
    await assert(s.get(page)).toHaveValue(s.value);
  }
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');

  await page.keyboard.press('Control+,');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');

  // ── Reset all and verify defaults ───────────────────────────
  await page.locator('#settings-body').focus();
  await page.locator('body').press('ControlOrMeta+\\');
  await page.keyboard.press('Enter');
  for (const s of PERSISTED) {
    await expect(s.get(page)).toHaveValue(s.default);   // always hard — reset should work even for broken-persist items
  }
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).not.toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('100');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n');
  await page.keyboard.press('Escape');
});
```

### 3. Extrapolating expected from action (even with locator mismatch)

The spec array handles this exactly. The mismatch you noticed — `getByRole('combobox', …).selectOption('serif')` vs `locator('#font-select').toHaveValue('serif')` — is why the spec has separate `set` and `get` accessors:

```
set: p => p.getByRole('combobox', { name: 'Editor font' })   // what you interact with
get: p => p.locator('#font-select')                            // what you assert against
```

The `value` field is the expected value in both directions because `selectOption('serif')` and `toHaveValue('serif')` agree on the representation. If they ever didn't (e.g. you set `'1.5'` but the UI normalizes to `'1.50'`), you'd add a separate `expected` field — but right now they all match.

### Why the Settings-dialog settings stay inline

The checkbox, Tiny spinner, and metadata field live in Settings and need the dialog open. They use different assertion types (`toBeChecked`, `toHaveValue`, multiline `toHaveValue`) and have unique default values. Forcing them into the same spec shape would add `assertType`, `negated`, and multiline-value handling — more complexity than the 3 inline lines they replace. The rule of thumb: **loop the uniform cases, inline the exceptional ones**.

***

The new way is actually slightly more LOC and harder for me to read. It would be easier for me to read some kind of callable function(X,Y) that refers to this:

```js
await page.getByRole('').fill('X');
```

And outputs this:

```js
await expect(page.getByRole).toHaveValue('Y');
```

Pseudocode example (like a .bashrc alias but for JavaScript):

```js
function(20,20) => await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('20');

function(20,14) => await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('14');

//both calls 'know' await page.getByRole('spinbutton', { name: 'Font size' }).fill('20'); is referred to since fill('20') is unique
```

***

You want a one-liner shorthand for `expect(locator).toHaveValue(Y)`. The simplest version:

```js
const val = (role, name, v, soft) =>
  (soft ? expect.soft : expect)(page.getByRole(role, { name })).toHaveValue(v);
```

Then the test reads like this:

```js
test('persistence', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([media('plain_english.lrc')]);

  // ── Set ─────────────────────────────────────────────────────
  await page.getByRole('combobox',  { name: 'Editor font' }).selectOption('serif');
  await page.getByRole('spinbutton', { name: 'Font size' }).fill('20');
  await page.getByRole('spinbutton', { name: 'Playback speed' }).fill('1.5');
  await page.getByRole('spinbutton', { name: 'Seek offset (ms): shifts' }).fill('-400');
  await page.keyboard.press('Control+.');
  await page.keyboard.press('Control+,');
  await page.getByRole('checkbox', { name: 'Moving to previous line' }).check();
  await page.getByRole('spinbutton', { name: 'Tiny' }).fill('99');
  await page.locator('#s-default-meta').fill('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');
  await page.keyboard.press('Escape');
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');

  // ── Verify persistence ──────────────────────────────────────
  await page.reload();
  await page.locator('#file-picker').setInputFiles([media('plain_english.lrc')]);
  await val('combobox',  'Editor font', 'serif');
  await val('spinbutton', 'Font size', '20');
  await val('spinbutton', 'Playback speed', '1.5', true); // soft: confirmed broken
  await val('spinbutton', 'Seek offset (ms): shifts', '-400');
  await expect(page.getByText('📂 💾 System Sans System')).toHaveScreenshot('titlebar-dark.png');
  await page.keyboard.press('Control+,');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Lalala]\n[ar: Me]\n[al: Myself]\n[re: And I]');

  // ── Reset all ───────────────────────────────────────────────
  await page.locator('#settings-body').focus();
  await page.locator('body').press('ControlOrMeta+\\');
  await page.keyboard.press('Enter');
  await val('combobox',  'Editor font', 'system-ui,sans-serif');
  await val('spinbutton', 'Font size', '14');
  await val('spinbutton', 'Playback speed', '1'); // hard: reset should work even for broken-persist items
  await val('spinbutton', 'Seek offset (ms): shifts', '-600');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).not.toBeChecked();
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('100');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n');
  await page.keyboard.press('Escape');
});
```

### Why `function(X,Y)` keyed by fill-value is fragile

Your pseudocode `function(20, 20)` assumes `fill('20')` uniquely identifies which field you mean. But `-400` could theoretically appear in another spinner someday, and `'1.5'` could collide with a version number field. Using the **role + name** as the key is unambiguous and doesn't break when values overlap.

### The font combobox mismatch goes away

Your original test used two different locators for the same element:

```
set:    getByRole('combobox', { name: 'Editor font' }).selectOption('serif')
check:  locator('#font-select').toHaveValue('serif')
```

`getByRole('combobox', …)` and `locator('#font-select')` point to the same `<select>` element — `toHaveValue` works on both. Using the same accessor for set and check (`val('combobox', 'Editor font', 'serif')`) eliminates the mismatch entirely.

### The three-phase structure is the real win

Notice how the comments (`Set` / `Verify persistence` / `Reset all`) plus the `val()` shorthand make each phase visually distinct. You can scan just the `val()` lines to see the full persistence↔reset story at a glance, which was the thing buried in repetition before.

---
I'm looking at 8-review.md "Non-navigation hotkey repeat suppression test". Manually, I would just held various keys down for a second or so with audio and lyrics loaded and watched for spammy behavior. But how to implement "for a second or so" properly in Playwright? I understand `waitForTimeout(1000)` is generally unreliable.

---
You don't need to simulate a duration at all. The repeat suppression is event-based (`e.repeat`), not time-based. "Hold for a second" is just how a human triggers OS key repeat — the code itself checks `e.repeat` on each incoming keydown. So the automation tests the *cause* directly:

```js
test('non-nav hotkeys suppress repeat', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);

  // Press W once — should sync one line
  await page.keyboard.press('w');
  const afterFirst = await page.locator('#main-lines').innerText();
  expect(afterFirst).toMatch(/\d{2}:\d{2}/);

  // Simulate OS key repeat (what holding the key actually produces)
  await page.keyboard.down('w');
  for (let i = 0; i < 10; i++) {
    await page.evaluate(key => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key, repeat: true, bubbles: true,
      }));
    }, 'w');
  }
  await page.keyboard.up('w');

  // Lines should be unchanged — repeats were suppressed
  await expect(page.locator('#main-lines')).toHaveText(afterFirst);
});
```

Then verify the opposite for a navigation key where repeats *should* work:

```js
test('nav keys allow repeat', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);

  // Press ArrowDown once
  await page.keyboard.press('ArrowDown');

  // Simulate key repeat
  await page.keyboard.down('ArrowDown');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(key => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key, repeat: true, bubbles: true,
      }));
    }, 'ArrowDown');
  }
  await page.keyboard.up('ArrowDown');

  // Should have moved multiple lines — repeat was allowed
  await expect(page.locator('.line-active')).toBeVisible();
});
```

### Why this is better than "hold for a second"

| Concern | `waitForTimeout(1000)` + `keyboard.down()` | Dispatch `{ repeat: true }` |
|---------|---------------------------------------------|----------------------------|
| Flaky timing | Depends on how fast the app processes events in 1s | Zero timing dependency |
| Correct cause | Tests "does it work if I wait" — but Playwright doesn't auto-repeat keys, so holding does nothing extra | Tests the exact signal (`e.repeat`) the code checks |
| Deterministic count | "About 1 second" → unknown number of repeats → unknown expected state | Exactly 10 repeat events → assert state is unchanged (or changed for nav) |
| CI-friendly | Slow — burns 1 second per key tested | Instant |

The key insight: **Playwright's `keyboard.down()` does NOT auto-generate OS key repeats**. It fires a single `keydown` with `repeat: false` and then nothing. So holding a key via `keyboard.down()` then waiting doesn't actually produce the conditions you're trying to test. The `evaluate` approach injects the real signal the app guards against.

---
From a code perspective, how many distinct keys do I need to sample for testing repeat spam?

---
One. The repeat guard is a single `if` in one handler:

```js
const isNavKey = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.key);
if (e.repeat && !isNavKey) {
  if (hkMatch(ks, hk.toggle_mode) || hkMatch(ks, hk.offset_mode_toggle)) {
    e.preventDefault();
  }
  return;
}
```

Three branches exist, so three keys covers every path:

| Key                   | Branch                          | Proves                                                         |
| --------------------- | ------------------------------- | -------------------------------------------------------------- |
| `w` (sync)            | `return` — generic non-nav      | Repeats are suppressed                                         |
| `` ` `` (toggle mode) | `return` + `e.preventDefault()` | Repeats are suppressed AND don't leak characters into textarea |
| `ArrowDown`           | Skipped entirely (is nav key)   | Repeats pass through                                           |

Any fourth non-nav key (say `z`, `v`, `r`) hits the exact same `return` as `w`. Same code path, same `e.repeat` check, same result — testing it again proves nothing new.

---
In 8-review.md you mentioned "No audio loaded — do playback controls gracefully no-op?" and also "C. **`import-audio-update` test in `playback.spec.js`** — questionable value". That *was* my attempt to test playback controls with no audio loaded, and then to show that loading audio would reset any resulting changes. I updated it to include a screenshot indicating any UI changes resulting from no-audio interaction and another to capture the reset state. Not sure what counts as "gracefully no-op". When I wrote the tests in CHECKLIST I meant "do the buttons update visually when there's no audio for them to act upon" and "if so, do they at least reset when the audio is added?".
```js
test("import-audio-update", async ({ page, media }) => {
  await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
    "audio-missing-load.png",
  );
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Control+1");
  await page.locator("#progress-wrap").click();
  await expect(page.getByText("Unknown Title Unknown Artist")).toHaveScreenshot(
    "audio-missing-play.png",
  );
  await page.locator("#file-picker").setInputFiles([media("audio.mp3")]);
  await expect(
    page.getByText("audio Unknown Artist 0:000:13"),
  ).toHaveScreenshot("audio-import-reset.png");
});
```

---
You're right, I misread the intent. The test is asking a valid question — it's just that the test name and structure made it look like it was testing "press keys before loading files, then load files," rather than "do controls no-op without audio, and does import recover from any visual lies?"

The actual concern is two distinct behaviors:

1. **No-op correctness**: Play/seek/speed with no audio should change nothing visually (the app shouldn't show a "playing" state or a nonzero time position when there's nothing to play)
2. **Import recovery**: If the UI *did* change, loading audio should reset it to a clean state

Your test already covers both with screenshots, but the name obscures this. A rename + a comment makes the intent unambiguous:

```js
test('no-audio-no-op', async ({ page, media }) => {
  // Controls should not visually update when there's no audio to act on
  await expect(page.getByText('Unknown Title Unknown Artist')).toHaveScreenshot('no-audio-idle.png');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Control+1');
  await page.locator('#progress-wrap').click();
  await expect(page.getByText('Unknown Title Unknown Artist')).toHaveScreenshot('no-audio-after-controls.png');

  // Importing audio should produce a clean state regardless
  await page.locator('#file-picker').setInputFiles([media('audio.mp3')]);
  await expect(page.getByText('audio Unknown Artist 0:000:13')).toHaveScreenshot('no-audio-after-import.png');
});
```

**What counts as "gracefully no-op"**: Exactly what your two screenshots already check. If `no-audio-idle.png` and `no-audio-after-controls.png` are pixel-identical, that proves the controls did nothing. If they differ, the screenshot diff shows exactly what leaked — and the third screenshot proves import recovers from it. That's the full story.

---
Zed found three errors in current tests/helpers/index.js
![[zed.png]]

---
Zed found three TypeScript errors on lines 61–65. Here's what they are and how to fix them:

### The three errors

| Line | Error | Cause |
|------|-------|-------|
| 61 | `media does not exist in type Fixtures` | `base.extend()` doesn't know `media` is a valid custom fixture name — you need to declare the type |
| 62 | `Parameter filename implicitly has an any type` | The arrow function `(filename) => …` has no type annotation |
| 65 | `Parameter filename implicitly has an any type` | Same for `readMedia`'s arrow function |

### The fix

Since the file uses `// @ts-check` with JSDoc, add type annotations to the custom fixtures:

```js
const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
  media: async ({}, use) => {
    await use((/** @type {string} */ filename) => path.join(MEDIA_DIR, filename));
  },
  readMedia: async ({}, use) => {
    await use((/** @type {string} */ filename) => fs.readFileSync(path.join(MEDIA_DIR, filename), 'utf-8'));
  },
});
```

This fixes errors 2 and 3 (the implicit `any` on `filename`).

For error 1 (`media does not exist in type Fixtures`), the root cause is that `base.extend()` returns a typed `TestApi` whose `Fixtures` type only includes the built-in Playwright fixtures. Custom fixture names like `media` and `readMedia` need to be registered in the type system. Add a JSDoc typedef above the `extend` call:

```js
/**
 * @typedef {object} CustomFixtures
 * @property {(filename: string) => string} media - Resolves a media filename to an absolute path
 * @property {(filename: string) => string} readMedia - Reads a media file's contents as UTF-8
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & CustomFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */
const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
  media: async ({}, use) => {
    await use((/** @type {string} */ filename) => path.join(MEDIA_DIR, filename));
  },
  readMedia: async ({}, use) => {
    await use((/** @type {string} */ filename) => fs.readFileSync(path.join(MEDIA_DIR, filename), 'utf-8'));
  },
});
```

### Simpler alternative

If the `TestType` typedef feels verbose (and it is), you can suppress just the fixture-registration error with a local cast and keep only the `@type {string}` annotations on the parameters:

```js
const test = /** @type {import('@playwright/test').TestType<{media: (filename: string) => string; readMedia: (filename: string) => string} & import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
  base.extend({
    page: async ({ page }, use) => {
      await page.goto(findLatestVersion());
      await use(page);
    },
    media: async ({}, use) => {
      await use((/** @type {string} */ filename) => path.join(MEDIA_DIR, filename));
    },
    readMedia: async ({}, use) => {
      await use((/** @type {string} */ filename) => fs.readFileSync(path.join(MEDIA_DIR, filename), 'utf-8'));
    },
  })
);
```

Either approach silences all three errors. The `@type {string}` on each `filename` parameter is the essential fix — without it, `@ts-check` correctly flags implicit `any` in strict mode.

---
The fixes look like comment blocks, but Zed's syntax highlighting and a test of removing them show them to be functional code.

---
Right — they're **both**. This is the core trick of `@ts-check`:

```
/** @type {string} */ filename
```

At **runtime**: The JS engine sees `/* ... */` → ignores it entirely → `filename` is just an untyped parameter. Zero effect on execution.

At **analysis time**: The TypeScript checker (activated by `// @ts-check`) parses the `@type` inside the comment and enforces it. This is how JS files get type safety without changing the language — the types live in comments.

The same dual nature applies to the larger fixture type annotation:

```js
/** @type {import('@playwright/test').TestType<...>} */
const test = base.extend({ ... });
```

- **JS runtime**: Sees a comment, then an assignment. Runs normally.
- **TS checker**: Reads the comment, uses it as the declared type of `test`, and validates every subsequent `test('name', async ({ page, media }) => ...)` against that type.

So when you removed them and the errors came back, you weren't removing "just comments" — you were removing the type information the checker relies on. The comment syntax is the carrier, but the `@type`/`@param`/`@returns` tags inside are functional directives to the type system. This is why `// @ts-check` is optional — without it, those JSDoc tags are truly just comments.

---
For 8-review.md "B. **Duplicate file-import boilerplate across spec files**", you built this for importing secondary .lrc files and I simply copy pasted the structure whenever I needed to do that, as the index.js helper only covered importing main lyrics. There are two spec files with such boilerplate, fields-merge.spec.js and undo-redo.spec.js. I could put this near the top of fields-merge.spec.js:
```js
const [fileChooser] = await Promise.all([
page.waitForEvent('filechooser'),
page.getByRole('button', { name: '📂' }).nth(1).click(),
]);
const [fileChooser2] = await Promise.all([
page.waitForEvent('filechooser'),
page.getByRole('button', { name: '📂' }).nth(2).click(),
]);
```
And this near the top of undo-redo.spec.js:
```js
const [fileChooser] = await Promise.all([
page.waitForEvent('filechooser'),
page.getByRole('button', { name: '📂' }).nth(1).click(),
]);
```

Or put the const filechooser in index.js just for those two files. Would that be doable with <12 LOC?

---
You can't put the `const fileChooser` at the top of a spec file because it's a runtime async value — it doesn't exist until `page` is live and a button is clicked. But you can put a **helper function** in `index.js` that does the whole operation in one call. 7 LOC added:
Now the spec files. `fields-merge.spec.js` — 7 instances of the boilerplate become 1-liners:
Now `undo-redo.spec.js` — 2 instances:
Done. Here's the tally:

| File | Added | Removed | Net |
|------|-------|---------|-----|
| `index.js` | +8 (1 typedef line + 7 fixture lines) | 0 | +8 |
| `fields-merge.spec.js` | +11 (one-liner calls + `importSecondary` in destructuring) | -63 (boilerplate) | **-52** |
| `undo-redo.spec.js` | +2 | -12 | **-10** |
| **Total** | +21 | -75 | **-54** |

The `replace-secondary` test now reads:
```js
await importSecondary(1, 'plain_spanish.lrc');
await importSecondary(1, 'plain_french.lrc');
```
The second call clicks the same 📂 button again, which opens a new file chooser — so it works as a replacement, no special handling needed.

---
In index.js I fixed a few errors by using `"/** @type {number} */ nth, /** @type {string} */ filename"`. Zed autocomplete suggested capitalizing the types like Number and String. Not sure how to fix this:
```
Object literal may only specify known properties, and 'importSecondary' does not exist in type 'Fixtures<CustomFixtures, {}, PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>'.
```

---
### `number` vs `Number`

Use **lowercase**. Zed's autocomplete is suggesting JavaScript constructor types, not TypeScript types:

| JSDoc | What it means | Use it? |
|-------|---------------|---------|
| `number` | TypeScript primitive — the kind you actually get from `42` or `"hello".length` | ✅ Always |
| `Number` | JavaScript wrapper object — `new Number(42)` — almost never what you want | ❌ Never for annotations |

Same for `string`/`String`, `boolean`/`Boolean`. Your `/** @type {number} */ nth, /** @type {string} */ filename` is correct.

### The `importSecondary` error

The `@type` annotation on `const test` tells TypeScript what the *output* type is — so `test('name', async ({ importSecondary }) => ...)` type-checks correctly. But TypeScript still validates the *input* to `.extend()` against its declared parameter type, which doesn't include `importSecondary`. This is a known limitation — Playwright's `extend()` can't infer custom fixture names from an object literal in JS.

Add `@ts-expect-error` on the assignment line:

```js
/** @type {import('@playwright/test').TestType<...>} */
// @ts-expect-error — Custom fixtures can't be inferred by extend(); output type is annotated above
const test = base.extend({
```

This is the standard pattern: `@type` handles the output (what tests see), `@ts-expect-error` acknowledges the input can't be inferred. The directive also self-validates — if Playwright ever adds inference for custom fixtures, the error disappears and `@ts-expect-error` will itself produce an "unused directive" warning, telling you to remove it.

---
Adding this over `const test = base.extend({` replaced the one error with 7 errors!
```js
/** @type {import('@playwright/test').TestType<...>} */
// @ts-expect-error — Custom fixtures can't be inferred by extend(); output type is annotated above
const test = base.extend({
```
![[7errors.png]]

---
The `...` in the `@type` annotation was shorthand I wrote for "your existing full type goes here" — it wasn't meant to be literal. TypeScript is trying to parse `...` as an actual type and failing, which cascades into all 7 errors.

Let me read what's there now and fix it:
I see — you already had the full `@type` annotation on line 67. The `...` wasn't the issue. The problem is that the `@type` on line 67 declares the *output* type but line 69 (`base.extend({...})`) is validated against the *input* type, which doesn't know about custom fixtures. The blank line 68 between the `@type` and the `const` might also be breaking the annotation association.

Replace the annotation + declaration block:
Now close the parenthetical at the end:
Let me verify the final state:
Two things went wrong with the previous approach:

1. **`@type` before `const` with a blank line between them** — JSDoc `@type` only attaches to the *next* statement. The blank line broke the association, so TypeScript ignored it and fell back to inferring the type from `base.extend()` (which doesn't include custom fixtures).

2. **`@ts-expect-error` before `@type` before `const`** — when both are above `const`, they fight: `@ts-expect-error` suppresses the *next* error, but `@type` changes the declared type first, so there may be no error to suppress.

The fix: **cast the expression, not the declaration**. The `@type` wraps `base.extend(...)` as an inline cast, and `@ts-expect-error` sits alone above `const`:

```
// @ts-expect-error — ...
const test = /** @type {FullTypeHere} */ (base.extend({...}));
```

This way:
- `@ts-expect-error` catches the "custom fixtures don't exist in Fixtures" error from `base.extend()`
- `/** @type {FullTypeHere} */` tells TypeScript what the *result* type is, so all spec files see `importSecondary` correctly
- No blank line breaks anything — `const` immediately follows the comment

---
```js
const { test, expect } = require("@linebyline/test-helpers");
import AxeBuilder from "@axe-core/playwright";

test("axe-scan-landing", async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-lyrics", async ({ page, media, importSecondary }) => {
  await page
    .locator("#file-picker")
    .setInputFiles([media("audio.mp3"), media("synced_english.lrc")]);
  await page.keyboard.press("Control+4");
  await importSecondary(1, "plain_french.lrc");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("axe-scan-settings", async ({ page }) => {
  await page.keyboard.press("Control+,");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
I renamed the "axe-scan" test to "axe-scan-landing" and added the other tests recommended in 8-review.md/"A. **`accessibility.spec.js` — single axe scan on empty page**". The secondary lyrics field is technically seen by Playwright as `page.getByRole('textbox')`. The Settings window doesn't really have a unified box but is split into `page.getByText('Settings ⌨')`, `page.locator('#settings-body')`, and `page.getByText('Reset defaults Reset all')`. Do I need to customize these two lines for each test accordingly:
```js
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
```

---
No, you don't need to customize those lines. The default `new AxeBuilder({ page }).analyze()` already scans the entire DOM on the page — every element, including the textbox, the settings body, and everything else.

The whole reason to have three separate tests is that each test **navigates to a different view first**, and then the same one-liner scan captures everything visible in that view:

| Test | What it sets up | What the scan sees |
|------|-----------------|-------------------|
| `axe-scan-landing` | Empty page | Landing state |
| `axe-scan-lyrics` | Files loaded, secondary import | Textboxes, buttons, all lyrics UI |
| `axe-scan-settings` | Settings opened | Settings body, inputs, labels |

You don't need `.include('#settings-body')` or `.include('textbox')` because those elements are already on the page — axe finds them automatically.

The only reason to customize the AxeBuilder call would be:

- **`.exclude()`** — to silence a known false positive you can't fix (e.g., a third-party component or an intentional design choice like low contrast on a decorative element)
- **`.withRules()`** — to focus on a specific rule during debugging

Neither applies here. The plain two-liner is correct for all three tests as-is.

---
