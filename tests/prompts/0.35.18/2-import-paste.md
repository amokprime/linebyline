AI used: [GLM-5.1](https://chat.z.ai)

---
Read contents of linebyline.zip for context, starting with INDEX.md (/linebyline parent folder represents repo root). I need to decide whether test-files.js is still worthwhile over [direct references](https://playwright.dev/docs/input#upload-files) given the flat /media structure I reorganized /music into. A few /music folders like folder 1 were referenced frequently in the original checklist, but many of those checklist tests were invalidated in suggestions-0.35.18.md.

---
I'll start by extracting the zip file and reading INDEX.md to understand the repository structure, then dig into the relevant documents about test-files.js and the /music reorganization.
Now let me read the key files in parallel to understand the full picture:
Let me also check the media folder structure and remaining context files:
Let me also look at the content of the media files and the corresponding music files to understand the exact mapping:
Now I have the full picture. Here's my analysis:

---

## Is `test-files.js` still worthwhile?

**Short answer: No, it's not worthwhile in its current form. Drop it and use direct `setInputFiles()` paths.** Here's the detailed reasoning:

### 1. What `test-files.js` does vs. what the flat `/media` structure gives you

The current `test-files.js` defines a `FILES` lookup that maps semantic keys to file paths:

```js
const FILES = {
  synced:              { audio: 'media/audio.mp3',        lrc: 'media/synced_english.lrc' },
  plain:               { audio: 'media/audio.mp3',        lrc: 'media/I Wish I Could Identify That Smell.lrc' },
  translationInline:   { lrc: 'media/translation_inline.lrc' },
  translationSplit:    { lrc: 'media/translation_split.lrc' },
  bilingual:           { lrc: 'media/synced_english.lrc',  translationSpanish: 'media/spanish.lrc' },
};
```

And a stub `loadFiles(page, key)` function that would call `setInputFiles()`. But here's the problem: **the indirection buys you almost nothing now.**

### 2. Why the original `/music` folder structure *might* have justified it

The old `/music` structure was:

| Folder | Purpose | Unique aspect |
|--------|---------|---------------|
| `1/` | Import + playback | Synced .lrc + audio (same as `synced_english.lrc`) |
| `2/` | Syncing + adjustments | Plain .lrc + audio (same as `plain_english.lrc`) |
| `3.1/` | Inline translation marking | .lrc with inline French + `example.txt` |
| `3.2/` | Split translation marking | .lrc with inline split translations + `example.txt` |
| `4/` | Secondary fields + merge + save | Synced .lrc + `french.lrc` + `spanish.lrc` + `sample.txt` |

Each folder was a self-contained "test scenario bundle." A helper that said "load folder 2" made sense because you needed both files together and they lived in one place.

### 3. Why the flat `/media` structure eliminates that justification

Your reorganized `/media` is:

```
media/
  audio.mp3                ← single shared audio file
  genius.txt               ← Genius paste test
  plain_english.lrc        ← was music/2/*.lrc (no timestamps)
  plain_french.lrc         ← was music/4/french.lrc
  plain_spanish.lrc        ← was music/4/spanish.lrc
  synced_english.lrc       ← was music/1/*.lrc (with timestamps)
  translation_inline.lrc   ← was music/3.1/*.lrc
  translation_split.lrc    ← was music/3.2/*.lrc
```

Every file is a single hop from `media/`. There's no "folder to load" — you just pick the 1–3 files you need by name. The `FILES` dictionary is just **renaming files you can already reference directly**, e.g.:

- `FILES.synced.audio` → `'media/audio.mp3'` — you'd write this verbatim in `setInputFiles()` anyway
- `FILES.bilingual.translationSpanish` → `'media/plain_spanish.lrc'` — but "translationSpanish" is actually "plain_spanish" on disk, so the alias *adds confusion* rather than removing it

### 4. The `loadFiles()` function was never finished

The stub is:
```js
function loadFiles(page, key) {
  const files = FILES[key];
  // Use page.locator('#file-picker').setInputFiles(...)
}
```

It's incomplete and the comment even tells you the direct API. Per the [Playwright docs you linked](https://playwright.dev/docs/input#upload-files), you'd write:

```js
await page.locator('#file-picker').setInputFiles('media/synced_english.lrc');
```

That's it. Wrapping this in a lookup + function call saves zero keystrokes and adds a maintenance layer.

### 5. What `test-files.js` *would* be useful for (if you needed it)

A helper would earn its keep if it:

- **Resolved absolute paths** (Playwright needs them for `setInputFiles`) — but `path.resolve(__dirname, '..', 'media', 'synced_english.lrc')` is a one-liner in each test
- **Combined multi-file uploads** — e.g., loading audio + lrc together. But that's just `setInputFiles(['media/audio.mp3', 'media/synced_english.lrc'])`
- **Provided fixture-level setup** — like Playwright's `test.extend()` with custom fixtures that pre-load files. But you're not doing that, and your spec files so far (`smoke.spec.js`, `theme-font.spec.js`) don't even import `test-files.js`

None of these justify a dedicated module at your current scale (7 test files, ~58 tests).

### 6. The broken reference in `test-files.js`

There's a concrete bug: `plain` maps to `'media/I Wish I Could Identify That Smell.lrc'` — **this file doesn't exist in `/media`**. The actual file is `media/plain_english.lrc`. This is exactly the kind of desync that happens when you maintain an alias layer over a reorganized flat structure.

### 7. What about the `example.txt` / `sample.txt` reference files?

The CHECKLIST used `example.txt` (folders 3.1, 3.2) and `sample.txt` (folder 4) to *manually verify* output ("Merging fields matches sample.txt", "( ) checkbox wraps lines... matching example.txt"). But per `suggestions-0.35.18.md`, these comparison tests should be automated differently:

- **Download interception** (`waitForEvent('download')`) + content assertion replaces "saved lyrics match window contents"
- **DOM assertion** on merged field content replaces "matches sample.txt"

Neither approach needs the reference files at all — Playwright can assert against the expected content inline. And if you *did* want to keep reference files for comparison, they'd just be another direct path in `/media/`, not something that needs a lookup table.

### Recommendation

**Delete `test-files.js`** and use direct `setInputFiles()` paths in each test. Here's the pattern your existing spec files already follow:

```js
// import-paste.spec.js (hypothetical)
import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';

const latestPath = findLatestVersion();
const MEDIA = 'tests/media';  // or use path.resolve for absolute paths

test.describe('file import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(latestPath);
  });

  test('import synced lyrics + audio', async ({ page }) => {
    await page.locator('#file-picker').setInputFiles([
      path.resolve(MEDIA, 'audio.mp3'),
      path.resolve(MEDIA, 'synced_english.lrc'),
    ]);
    await expect(page.locator('#main-lines')).toContainText('I wish I could identify');
  });
});
```

If you ever grow to 20+ file-combo fixtures, then consider a helper. At your current scale (~58 tests, 7 LRC files, 1 audio file, 1 text file), the flat directory makes the indirection counterproductive.

**Also:** delete the `/music` folder. It's fully superseded by `/media` and keeping it around risks accidentally referencing stale paths. The INDEX.md already notes it "may be deprecated or consolidated into /media."

---
``` js
import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';
const latestPath = findLatestVersion();
const path = require('path');

test.describe('all', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(latestPath);
  });
  test('import audio + plain lyrics', async ({ page }) => {
    await page.locator('#file-picker').setInputFiles([
      path.join(__dirname, 'media/audio.mp3'),
      path.join(__dirname, 'media/plain_english.lrc'),
    ]);
    await expect(page.locator('#main-lines')).toContainText('I wish I could identify');
  });
});
```
The above worked. I just realized every test so far has `async ({ page }) => {`. Is it a good idea to use `test.describe` in all test files with 4+ tests to save having to put `await page.goto(latestPath);` in every test? Or is there a better way to do that?

---
Yes, `test.describe` + `test.beforeEach` is the right call — and honestly, even for 3+ tests, not just 4+. Every one of your spec files navigates to the same `latestPath`, so there's no reason to repeat it.

But there's also a step beyond `beforeEach` that's worth knowing about: **custom fixtures**. Here's how both approaches compare for your project:

### Option A: `beforeEach` (what you already have)

```js
test.describe('import and paste', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(latestPath);
  });

  test('import audio + plain lyrics', async ({ page }) => { /* ... */ });
  test('paste Genius text', async ({ page }) => { /* ... */ });
  test('metadata extraction', async ({ page }) => { /* ... */ });
});
```

Perfectly fine, idiomatic, and every Playwright user will recognize it. The only friction: you still need `test.describe` + `test.beforeEach` boilerplate in every spec file.

### Option B: Custom fixture (eliminates the boilerplate entirely)

Your existing `@linebyline/test-helpers` package already exports `findLatestVersion`. You can extend it to also export a custom fixture that auto-navigates:

```js
// tests/helpers/index.js
const fs = require('node:fs');
const path = require('node:path');
const { test: base } = require('@playwright/test');

function findLatestVersion(archiveRoot = 'archive/semantic') {
  // ... existing implementation unchanged ...
}

const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
});

module.exports = { findLatestVersion, test };
```

Then in every spec file:

```js
// import-paste.spec.js
const { test, expect } = require('@playwright/test');  // still get expect from PW
const { test } = require('@linebyline/test-helpers');   // overridden test with auto-navigate

// OR if you want both in one line:
const { test, expect } = require('@linebyline/test-helpers'); // if you also re-export expect

test('import audio + plain lyrics', async ({ page }) => {
  // page already navigated — no beforeEach needed
  await page.locator('#file-picker').setInputFiles([/* ... */]);
});
```

No `describe`, no `beforeEach`, no `page.goto` — it just works.

### Which to use?

| | `beforeEach` | Custom fixture |
|---|---|---|
| **Learning curve** | None | Low — you already have the helper package |
| **Boilerplate per file** | 3 lines (describe + beforeEach + goto) | 0 lines |
| **Can override per-test** | Yes — skip `beforeEach` with `test.describe.configure({ mode: 'serial' })` + manual goto | Yes — just call `page.goto()` again to override |
| **Tests that *don't* navigate** | Easy — don't put them in the describe | Need a separate `test` import from `@playwright/test` |
| **Consistency with your existing files** | `smoke.spec.js` and `theme-font.spec.js` already use `page.goto` per-test | Would need to migrate those too |

**My recommendation for where you are now:** Stick with `beforeEach`. It's the right pattern, and the custom fixture is a small optimization that only pays off once you have 8+ spec files all doing the same navigation. You'll know when it's worth switching because you'll feel the repetition — and the migration from `beforeEach` to custom fixture is mechanical (one helper change + update imports).

### One thing to fix either way

Your snippet mixes `import` and `require`:

```js
import { test, expect } from '@playwright/test';   // ESM
const path = require('path');                        // CJS
```

Your `package.json` has `"type": "commonjs"`, so go all-in on `require`:

```js
const { test, expect } = require('@playwright/test');
const { findLatestVersion } = require('@linebyline/test-helpers');
const path = require('node:path');
```

Or if you switch to ESM later (changing `"type"` to `"module"`), you'd need `import.meta.dirname` instead of `__dirname` — but that's a separate decision. For now, CJS `require` across the board is simplest.

---
I want to try the custom fixture. Does it go alongside or supersede these?
``` js
const { findLatestVersion } = require('@linebyline/test-helpers');
const latestPath = findLatestVersion();
```

---
It supersedes both of those lines in every spec file. The `findLatestVersion` call moves into the fixture definition, so your spec files never import or call it directly anymore.

Here's the before/after:

### `tests/helpers/index.js` — add the fixture alongside the existing export

```js
const fs = require('node:fs');
const path = require('node:path');
const { test: base, expect } = require('@playwright/test');

function findLatestVersion(archiveRoot = 'archive/semantic') {
  // ... existing implementation unchanged ...
}

// Auto-navigating fixture — this is the new part
const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
});

module.exports = { findLatestVersion, test, expect };
```

You're keeping `findLatestVersion` in the exports because the fixture calls it internally — and it's still useful on its own for your `cgn` bash alias in PLAYWRIGHT_SETUP.md.

### Every spec file — before

```js
const { test, expect } = require('@playwright/test');
const { findLatestVersion } = require('@linebyline/test-helpers');
const latestPath = findLatestVersion();

test('title', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
});
```

### Every spec file — after

```js
const { test, expect } = require('@linebyline/test-helpers');

test('title', async ({ page }) => {
  // page already at latestPath — no goto needed
  await expect(page).toHaveTitle(/LineByLine/);
});
```

Three lines replaced by one. The `page.goto` disappears entirely. And if you ever need a test that *doesn't* auto-navigate (e.g., testing the blank landing state before navigation), you'd import `test` from `@playwright/test` directly for just that test — but that's an edge case you haven't needed yet.

### What about `describe` + `beforeEach`?

With the custom fixture, you only need `test.describe` for **logical grouping** (giving related tests a shared name in the test runner output), not for shared setup. So:

```js
const { test, expect } = require('@linebyline/test-helpers');
const path = require('node:path');

test.describe('file import', () => {
  test('audio + plain lyrics', async ({ page }) => {
    await page.locator('#file-picker').setInputFiles([
      path.join(__dirname, 'media/audio.mp3'),
      path.join(__dirname, 'media/plain_english.lrc'),
    ]);
    await expect(page.locator('#main-lines')).toContainText('I wish I could identify');
  });

  test('audio + synced lyrics', async ({ page }) => {
    await page.locator('#file-picker').setInputFiles([
      path.join(__dirname, 'media/audio.mp3'),
      path.join(__dirname, 'media/synced_english.lrc'),
    ]);
    await expect(page.locator('#main-lines')).toContainText('I wish I could identify');
    await expect(page.locator('#main-lines')).toContainText('[00:00.000]');
  });
});
```

No `beforeEach` — the fixture handles it. The `describe` is just there so the test runner prints `file import › audio + plain lyrics` instead of a flat list.

---
Can const path = require('node:path'); be bundled into the fixture too? It's still required for now or error is thrown that path is not defined

---
Yes — the cleanest way is to add a `media` fixture that's a function, so spec files never touch `path` or `__dirname` at all:

### `tests/helpers/index.js`

```js
const fs = require('node:fs');
const path = require('node:path');
const { test: base, expect } = require('@playwright/test');

function findLatestVersion(archiveRoot = 'archive/semantic') {
  // ... existing implementation unchanged ...
}

const MEDIA_DIR = path.join(__dirname, '..', 'media');

const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
  media: async ({}, use) => {
    await use((filename) => path.join(MEDIA_DIR, filename));
  },
});

module.exports = { findLatestVersion, test, expect };
```

### Spec file — now zero boilerplate

```js
const { test, expect } = require('@linebyline/test-helpers');

test.describe('file import', () => {
  test('audio + plain lyrics', async ({ page, media }) => {
    await page.locator('#file-picker').setInputFiles([
      media('audio.mp3'),
      media('plain_english.lrc'),
    ]);
    await expect(page.locator('#main-lines')).toContainText('I wish I could identify');
  });
});
```

No `path`, no `__dirname`, no `findLatestVersion`, no `page.goto`. The only thing you ever write per file is the one `require` line and your tests.

### How it works

- `media` is a fixture, so Playwright injects it per test just like `page`
- Its value is a function: pass a filename, get back an absolute path
- `MEDIA_DIR` is computed once at require time using `__dirname` inside the helper (which correctly resolves to `tests/helpers/`), then goes up one level to `tests/media/`
- If you ever move the media folder, you change one line in `index.js`

### If you want it even shorter for multi-file uploads

You could make `media()` accept multiple args and return an array:

```js
media: async ({}, use) => {
  await use((...filenames) => filenames.map(f => path.join(MEDIA_DIR, f)));
},
```

Then:

```js
await page.locator('#file-picker').setInputFiles(media('audio.mp3', 'plain_english.lrc'));
```

But the single-arg version is more flexible — you'll also use `media()` for non-`setInputFiles` paths (like reading file contents for assertions), where a string is what you need. I'd stick with the single-arg version.

---
Error appeared after adding these two lines to test metadata updating in Typing mode after import:
    await page.keyboard.press('Backquote')
    await expect(page.locator('#main-textarea')).toContainText('\[ti: audio\]');

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#main-textarea')
Expected substring: "[ti: audio]"
Received string:    ""
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#main-textarea')
    8 × locator resolved to <textarea class="visible" id="main-textarea" spellcheck="false"></textarea>
      - unexpected value ""

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
        - generic [ref=e52]: audio
        - generic [ref=e53]: Unknown Artist
        - generic [ref=e55]:
          - generic [ref=e56]: 0:00
          - generic [ref=e57]: 0:13
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
            - generic [ref=e96]: Typing mode
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
    - generic [ref=e149]:
      - generic [ref=e150]:
        - generic [ref=e151]: Main
        - generic "Wrap marked translations in parentheses" [ref=e152] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e153]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e154] [cursor=pointer]:
          - checkbox "↩" [ref=e155]
          - text: ↩
      - textbox [active] [ref=e156]: "[ti: audio] [ar: Unknown] [al: Unknown] [re: https://amokprime.github.io/linebyline/] I wish I could identify that smell That smell It disturbs my concentration And it bothers me to hell Oh, I wish I could identify that smell"
```

# Test source

```ts
  1  | const { test, expect } = require('@linebyline/test-helpers');
  2  | 
  3  | test('import audio + plain lyrics', async ({ page, media }) => {
  4  |   await page.locator('#file-picker').setInputFiles([
  5  |     media('audio.mp3'),
  6  |     media('plain_english.lrc'),
  7  |   ]);
  8  |     await expect(page.getByText('audio')).toBeVisible();
  9  |     await expect(page.locator('#main-lines')).toContainText('I wish I could');
  10 |     await page.keyboard.press('Backquote')
> 11 |     await expect(page.locator('#main-textarea')).toContainText('\[ti: audio\]');
     |                                                  ^ Error: expect(locator).toContainText(expected) failed
  12 | });
  13 | 
  14 | test('import audio + synced lyrics', async ({ page, media }) => {
  15 |   await page.locator('#file-picker').setInputFiles([
  16 |     media('audio.mp3'),
  17 |     media('synced_english.lrc'),
  18 |   ]);
  19 |     await expect(page.getByText('I Wish I Could Identify That Smell', { exact: true })).toBeVisible();
  20 |     await expect(page.locator('#main-lines')).toContainText('[00:00.00] I wish I could');
  21 | });
```

---
This is a known Playwright gotcha: **`toContainText` doesn't work on `<textarea>`**. The DOM `textContent` of a textarea is always empty — the actual text lives in its `value` property, which `toContainText` doesn't read.

The page snapshot confirms the content *is* there:
> `textbox [active] [ref=e156]: "[ti: audio] [ar: Unknown] ..."`

### Fix: use `toHaveValue` with a regex

```js
await page.keyboard.press('Backquote');
await expect(page.locator('#main-textarea')).toHaveValue(/\[ti: audio\]/);
```

`toHaveValue` reads the `value` property (which is where textarea content lives), and passing a regex gives you substring matching like `toContainText` does.

### Why not `toHaveValue` with a string?

`toHaveValue(string)` checks for an **exact** match on the entire value — so it would fail unless the textarea contained *only* `[ti: audio]`. The regex gives you the "contains" behavior you want.

### Why `\[` in the regex?

Because `[` starts a character class in regex. `\[` is the escaped literal bracket. You don't need the backslash in a plain string, but you do in a regex pattern.

### Quick reference for textarea assertions

| What you want | Write this |
|---|---|
| Contains text | `.toHaveValue(/pattern/)` |
| Exact full value | `.toHaveValue('exact string')` |
| Grab value for custom logic | `const val = await locator.inputValue()` |

This will apply to every assertion you make against `#main-textarea` in your Typing mode tests.

---
Is `setInputFiles` an adequate substitute for a separate test of pasting (not uploading) lyrics? Basically the equivalent of copying lyrics to clipboard, focusing `locator('#main-lines')` , and pressing `Ctrl+V`. LineByLine's code treats these ways of adding lyrics differently, and in the past pasting has often broken.

---
No — these are entirely different code paths in the browser and in your app. You need separate paste tests.

| | `setInputFiles` | Clipboard paste |
|---|---|---|
| Browser API | File API → `change` event | Clipboard API → `paste` event |
| Your code path | File reader → parser | Paste handler → parser |
| Historically buggy | No (you said so) | Yes ("pasting has often broken") |

They share some downstream logic (the parser that extracts metadata/lyrics from the pasted text), but the *entry point* is different, and that's exactly where paste bugs live.

### How to test paste in Playwright

```js
test('paste plain lyrics', async ({ page }) => {
  const lyrics = `I wish I could identify that smell
That smell

It disturbs my concentration
And it bothers me to hell
Oh, I wish I could identify that smell`;

  await page.locator('#main-lines').focus();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, lyrics);
  await page.keyboard.press('Control+v');

  await expect(page.locator('#main-lines')).toContainText('I wish I could');
});
```

Or more concisely, Playwright has a built-in method since v1.51:

```js
await page.locator('#main-lines').fill(lyrics);
```

But **don't use `fill`** — it bypasses the clipboard entirely and fires `input` events instead of `paste` events. That's a third code path you're not trying to test.

### For Genius paste specifically

This is the case where paste bugs are most likely, since your app extracts metadata from the raw Genius page content. You have `media/genius.txt` for this:

```js
test('paste Genius lyrics', async ({ page, media }) => {
  const fs = require('node:fs');
  const geniusText = fs.readFileSync(media('genius.txt'), 'utf-8');

  await page.locator('#main-lines').focus();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, geniusText);
  await page.keyboard.press('Control+v');

  // verify metadata extraction worked
  await expect(page.locator('#main-textarea')).toHaveValue(/\[ti: Title\]/);
  await expect(page.locator('#main-textarea')).toHaveValue(/\[ar: Artist/);
});
```

### How this affects your test plan

Every scenario that can receive lyrics via paste needs at least one paste-variant test. But you don't need to duplicate every `setInputFiles` test — just the ones where paste enters a different code path:

| Scenario | `setInputFiles` test | Paste test needed? |
|---|---|---|
| Import plain lyrics | ✅ | Yes — paste handler parses differently |
| Import synced lyrics | ✅ | Yes — metadata extraction on paste |
| Genius extraction | N/A (no file) | Yes — this is paste-only |
| Secondary field paste | ✅ (file import) | Yes — different target element |
| Typing mode paste | ✅ (file import) | Yes — `#main-textarea` instead of `#main-lines` |

The `suggestions-0.35.18.md` file already lists "Paste" in the `import-paste.spec.js` scope — this is why it's in the file name.

---
In earlier versions of the Genius extraction code, whole stanzas were sometimes missed near the "You may also like" suggestions. Missing lyrics could happen again if Genius changes their website in the future, and I can't predict exactly where or how. How can I efficiently compare the complete output of tests like `await expect(page.locator('#main-lines')).toContainText('[00:00.00] some lyrics');` and `await expect(page.locator('#main-textarea')).toHaveValue(/some lyrics/);` with genius.txt?

---
The problem is you're checking for the *presence* of specific strings, but what you really need is the *absence* of anything missing. That's a different kind of assertion — and Playwright has a built-in mechanism for it: **text snapshots**.

### The approach: `toMatchSnapshot()` on extracted text

```js
test('Genius extraction is complete', async ({ page, media }) => {
  const fs = require('node:fs');
  const geniusText = fs.readFileSync(media('genius.txt'), 'utf-8');

  await page.locator('#main-lines').focus();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, geniusText);
  await page.keyboard.press('Control+v');

  // Capture the full extracted output
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot('genius-extracted.snap.txt');
});
```

### How it works

1. **First run** — Playwright generates `genius-extracted.snap.txt` in a `__snapshots__` folder next to your spec file. You manually verify it once — check that every stanza from the Genius page is present and nothing is missing around "You may also like" or anywhere else.

2. **Subsequent runs** — Playwright compares the current output against the snapshot. If a stanza goes missing, the test fails with a **line-by-line diff** showing exactly what disappeared.

3. **When Genius changes their site** — you update `genius.txt`, verify the new extraction output manually, then run with `--update-snapshots` to accept the new baseline.

### Why this beats `toContainText` for completeness

| | `toContainText` | `toMatchSnapshot` |
|---|---|---|
| Catches missing content | Only lines you remembered to assert | **Everything** — any missing line fails the diff |
| Shows what changed | No — just "expected X, not found" | **Yes — full diff** |
| Maintenance | Add new assertions when Genius changes | Re-verify and `--update-snapshots` |
| False negatives | Easy to miss a stanza | Impossible — the whole output is checked |

### You still want a few targeted assertions too

The snapshot catches *completeness*, but targeted assertions catch *correctness* — that metadata was extracted properly, that section headers like `[Intro: Marvin Gaye]` were stripped, etc.:

```js
test('Genius extraction', async ({ page, media }) => {
  const fs = require('node:fs');
  const geniusText = fs.readFileSync(media('genius.txt'), 'utf-8');

  await page.locator('#main-lines').focus();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, geniusText);
  await page.keyboard.press('Control+v');

  // Correctness — metadata extracted properly
  await expect(page.locator('#main-textarea')).toHaveValue(/\[ti: Title\]/);
  await expect(page.locator('#main-textarea')).toHaveValue(/\[ar: Artist\]/);

  // Completeness — nothing missing
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot('genius-extracted.snap.txt');
});
```

This way, if metadata extraction breaks, you get a clear failure message from `toHaveValue`. If a stanza goes missing, you get a diff from the snapshot. Both failure modes are covered with one test.

---
Current `import-paste.spec.js`:
``` js
const { test, expect } = require('@linebyline/test-helpers');
const fs = require('node:fs');
​
test('import-audio-plain', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
    await expect(page.getByText('audio')).toBeVisible();
    await expect(page.locator('#main-lines')).toContainText('I wish I could');
    const lyrics = await page.locator('#main-textarea').inputValue();
    expect(lyrics).toMatchSnapshot();
});
​
test('import-audio-synced', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
    await expect(page.getByText('I Wish I Could Identify That Smell', { exact: true })).toBeVisible();
    await expect(page.getByText('The Jazz Kissingers')).toBeVisible();
    await expect(page.locator('#main-lines')).toContainText('[00:00.00] I wish I could');
    const lyrics = await page.locator('#main-textarea').inputValue();
    expect(lyrics).toMatchSnapshot();
});
​
test('paste-plain', async ({ page, media }) => {
  const plainEnglish = fs.readFileSync(media('plain_english.lrc'), 'utf-8');
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, plainEnglish);
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});
​
test('paste-synced', async ({ page, media }) => {
  const syncedEnglish = fs.readFileSync(media('synced_english.lrc'), 'utf-8');
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, syncedEnglish);
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});
​
test('paste-secondary', async ({ page, media }) => {
  const plainFrench = fs.readFileSync(media('plain_french.lrc'), 'utf-8');
  await page.keyboard.press('Control+4');
  await page.getByRole('textbox').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, plainFrench);
  await page.keyboard.press('Control+v');
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});
​
test('paste-genius-hotkey', async ({ page, media }) => {
  const geniusText = fs.readFileSync(media('genius.txt'), 'utf-8');
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, geniusText);
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});
​
test('paste-genius-typing', async ({ page, media }) => {
  const geniusText = fs.readFileSync(media('genius.txt'), 'utf-8');
  await page.keyboard.press('Backquote')
  await page.locator('#main-textarea').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, geniusText);
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});
```
I just spammed these two lines for every `#main-textarea` check to keep things simple (no need to predict which lines might break, just test them all):
``` js
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
```
Is there a similar method for `#main-lines`? I still have spot checks only for those.

Also, is it a good idea to incorporate any of these lines into the fixture?
``` js
const fs = require('node:fs');
const lyrics = await page.locator('#main-textarea').inputValue();
expect(lyrics).toMatchSnapshot();
```

---
### Question 1: Snapshotting `#main-lines`

Yes — since `#main-lines` is a regular element (not a textarea), use `innerText()` instead of `inputValue()`:

```js
const lines = await page.locator('#main-lines').innerText();
expect(lines).toMatchSnapshot();
```

`innerText()` captures the visible text as the user sees it (respects CSS, ignores hidden elements). `textContent()` would also work but includes whitespace and hidden content that doesn't match what's on screen — `innerText()` is the right choice.

So your paired pattern per test becomes:

```js
// Hotkey mode content
const lines = await page.locator('#main-lines').innerText();
expect(lines).toMatchSnapshot();

// Typing mode content
const lyrics = await page.locator('#main-textarea').inputValue();
expect(lyrics).toMatchSnapshot();
```

Only use whichever is relevant for the test — no need to snapshot both if you're only testing one mode.

### Question 2: Incorporating into the fixture

The `fs` + `readFileSync` pattern is worth adding. The snapshot lines aren't — here's why:

**`fs.readFileSync` → yes, add to fixture**

You're doing this 6 times:
```js
const fs = require('node:fs');
const text = fs.readFileSync(media('genius.txt'), 'utf-8');
```

Add a `readMedia` function to the fixture so spec files never import `fs`:

```js
// tests/helpers/index.js
const fs = require('node:fs');
const path = require('node:path');
const { test: base, expect } = require('@playwright/test');

function findLatestVersion(archiveRoot = 'archive/semantic') {
  // ... existing ...
}

const MEDIA_DIR = path.join(__dirname, '..', 'media');

const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(findLatestVersion());
    await use(page);
  },
  media: async ({}, use) => {
    await use((filename) => path.join(MEDIA_DIR, filename));
  },
  readMedia: async ({}, use) => {
    await use((filename) => fs.readFileSync(path.join(MEDIA_DIR, filename), 'utf-8'));
  },
});

module.exports = { findLatestVersion, test, expect };
```

Now spec files just do:

```js
const geniusText = readMedia('genius.txt');
```

No `fs` import, no `media()` + `readFileSync` chaining.

**Snapshot lines → no, keep in tests**

```js
const lyrics = await page.locator('#main-textarea').inputValue();
expect(lyrics).toMatchSnapshot();
```

This is two lines and it's an *assertion* — it belongs in the test where you can see exactly what's being asserted. Wrapping it in something like `snapshotMainTextarea(page)` hides the locator and the snapshot point, which makes test failures harder to trace back. It's also not always `#main-textarea` — sometimes it's `#main-lines`, sometimes a secondary field textbox — so a generic helper would need parameters that re-expose the same complexity.

### Your spec file after both changes

```js
const { test, expect } = require('@linebyline/test-helpers');

test('import-audio-plain', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
  await expect(page.getByText('audio')).toBeVisible();
  await expect(page.locator('#main-lines')).toContainText('I wish I could');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-plain', async ({ page, readMedia }) => {
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('plain_english.lrc'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-genius-hotkey', async ({ page, readMedia }) => {
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('genius.txt'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});
```

No `fs` anywhere in spec files, and the only per-test boilerplate is the two-line snapshot pattern at the end.

---
Snapshotting `#main-lines` failed (readMedia did work though in separate tests):
```js
const lines = await page.locator('#main-lines').innerText();
expect(lines).toMatchSnapshot();
```
# Error details
```
Error: expect(string).toMatchSnapshot(expected) failed
  @@ -1,11 +1,6 @@
  -[ti: audio]
  -[ar: Unknown]
  -[al: Unknown]
  -[re: https://amokprime.github.io/linebyline/]
  -
   I wish I could identify that smell
   That smell
  -
  + 
   It disturbs my concentration
   And it bothers me to hell
   Oh, I wish I could identify that smell
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
        - generic [ref=e52]: audio
        - generic [ref=e53]: Unknown Artist
        - generic [ref=e55]:
          - generic [ref=e56]: 0:00
          - generic [ref=e57]: 0:13
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
    - generic [ref=e149]:
      - generic [ref=e150]:
        - generic [ref=e151]: Main
        - generic "Wrap marked translations in parentheses" [ref=e152] [cursor=pointer]:
          - checkbox "( )" [checked] [ref=e153]
          - text: ( )
        - generic "Split trailing parenthesized groups to new translation lines on Ctrl+ArrowLeft" [ref=e154] [cursor=pointer]:
          - checkbox "↩" [ref=e155]
          - text: ↩
      - generic [ref=e157]:
        - generic [ref=e158] [cursor=pointer]: I wish I could identify that smell
        - generic [ref=e159] [cursor=pointer]: That smell
        - generic [ref=e161] [cursor=pointer]: It disturbs my concentration
        - generic [ref=e162] [cursor=pointer]: And it bothers me to hell
        - generic [ref=e163] [cursor=pointer]: Oh, I wish I could identify that smell
```
# Test source
```ts
  1  | const { test, expect } = require('@linebyline/test-helpers');
  2  | 
  3  | test('import-audio-plain', async ({ page, media }) => {
  4  |   await page.locator('#file-picker').setInputFiles([
  5  |     media('audio.mp3'),
  6  |     media('plain_english.lrc'),
  7  |   ]);
  8  |     await expect(page.getByText('audio')).toBeVisible();
  9  |     const lines = await page.locator('#main-lines').innerText();
> 10 |     expect(lines).toMatchSnapshot();
     |                   ^ Error: expect(string).toMatchSnapshot(expected) failed
  11 |     const lyrics = await page.locator('#main-textarea').inputValue();
  12 |     expect(lyrics).toMatchSnapshot();
  13 | });
  14 | 
  15 | test('import-audio-synced', async ({ page, media }) => {
  16 |   await page.locator('#file-picker').setInputFiles([
  17 |     media('audio.mp3'),
  18 |     media('synced_english.lrc'),
  19 |   ]);
  20 |     await expect(page.getByText('I Wish I Could Identify That Smell', { exact: true })).toBeVisible();
  21 |     await expect(page.getByText('The Jazz Kissingers')).toBeVisible();
  22 |     await expect(page.locator('#main-lines')).toContainText('[00:00.00] I wish I could');
  23 |     const lyrics = await page.locator('#main-textarea').inputValue();
  24 |     expect(lyrics).toMatchSnapshot();
  25 | });
  26 | 
  27 | test('paste-plain-hotkey', async ({ page, readMedia }) => {
  28 |   await page.locator('#main-lines').click();
  29 |   await page.evaluate((text) => {
  30 |     navigator.clipboard.writeText(text);
  31 |   }, readMedia('plain_english.lrc'));
  32 |   await page.keyboard.press('Control+v');
  33 |   const lyrics = await page.locator('#main-textarea').inputValue();
  34 |   expect(lyrics).toMatchSnapshot();
  35 | });
  36 | 
  37 | test('paste-synced-hotkey', async ({ page, readMedia }) => {
  38 |   await page.locator('#main-lines').click();
  39 |   await page.evaluate((text) => {
  40 |     navigator.clipboard.writeText(text);
  41 |   }, readMedia('synced_english.lrc'));
  42 |   await page.keyboard.press('Control+v');
  43 |   const lyrics = await page.locator('#main-textarea').inputValue();
  44 |   expect(lyrics).toMatchSnapshot();
  45 | });
  46 | 
  47 | test('paste-plain-typing', async ({ page, readMedia }) => {
  48 |   await page.keyboard.press('Backquote')
  49 |   await page.locator('#main-textarea').click();
  50 |   await page.evaluate((text) => {
  51 |     navigator.clipboard.writeText(text);
  52 |   }, readMedia('plain_english.lrc'));
  53 |   await page.keyboard.press('Control+v');
  54 |   const lyrics = await page.locator('#main-textarea').inputValue();
  55 |   expect(lyrics).toMatchSnapshot();
  56 | });
  57 | 
  58 | test('paste-synced-typing', async ({ page, readMedia }) => {
  59 |   await page.keyboard.press('Backquote')
  60 |   await page.locator('#main-textarea').click();
  61 |   await page.evaluate((text) => {
  62 |     navigator.clipboard.writeText(text);
  63 |   }, readMedia('synced_english.lrc'));
  64 |   await page.keyboard.press('Control+v');
  65 |   const lyrics = await page.locator('#main-textarea').inputValue();
  66 |   expect(lyrics).toMatchSnapshot();
  67 | });
  68 | 
  69 | test('paste-secondary', async ({ page, readMedia }) => {
  70 |   await page.keyboard.press('Control+4');
  71 |   await page.getByRole('textbox').click();
  72 |   await page.evaluate((text) => {
  73 |     navigator.clipboard.writeText(text);
  74 |   }, readMedia('plain_french.lrc'));
  75 |   await page.keyboard.press('Control+v');
  76 |   const lyrics = await page.getByRole('textbox').inputValue();
  77 |   expect(lyrics).toMatchSnapshot();
  78 | });
  79 | 
  80 | test('paste-genius-hotkey', async ({ page, readMedia }) => {
  81 |   await page.locator('#main-lines').click();
  82 |   await page.evaluate((text) => {
  83 |     navigator.clipboard.writeText(text);
  84 |   }, readMedia('genius.txt'));
  85 |   await page.keyboard.press('Control+v');
  86 |   const lyrics = await page.locator('#main-textarea').inputValue();
  87 |   expect(lyrics).toMatchSnapshot();
  88 | });
  89 | 
  90 | test('paste-genius-typing', async ({ page, readMedia }) => {
  91 |   await page.keyboard.press('Backquote')
  92 |   await page.locator('#main-textarea').click();
  93 |   await page.evaluate((text) => {
  94 |     navigator.clipboard.writeText(text);
  95 |   }, readMedia('genius.txt'));
  96 |   await page.keyboard.press('Control+v');
  97 |   const lyrics = await page.locator('#main-textarea').inputValue();
  98 |   expect(lyrics).toMatchSnapshot();
  99 | });
```

Also, is there a reason why await is omitted for `expect(lyrics).toMatchSnapshot();`?
How to auto rerun the tests a second time if the snapshot is missing?

---
### Why the `#main-lines` snapshot failed

The snapshot captured metadata lines (`[ti: audio]`, `[ar: Unknown]`, etc.) that only exist in `#main-textarea` — not in `#main-lines`. In Hotkey mode, `#main-lines` shows lyrics without metadata. The snapshot was generated from the wrong content.

Delete it and regenerate:

```bash
npx playwright test --update-snapshots import-audio-plain
```

But to prevent this from happening again, **use named snapshots**. Right now both assertions in the same test call `toMatchSnapshot()` with no name, so they get auto-named like `import-audio-plain-1.snap` and `import-audio-plain-2.snap` — easy to mix up. Name them explicitly:

```js
test('import-audio-plain', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
  await expect(page.getByText('audio')).toBeVisible();

  const lines = await page.locator('#main-lines').innerText();
  expect(lines).toMatchSnapshot('import-plain-lines.snap');

  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot('import-plain-textarea.snap');
});
```

Now you can tell at a glance which snapshot is which, and if one goes stale you know exactly what to inspect.

### The whitespace difference in the diff

The diff also shows `-` (empty line) vs `+ ` (space-only line) between stanzas. This is `innerText()` normalizing whitespace differently than your app renders it. If this causes flaky snapshots, strip trailing spaces at assertion time:

```js
const lines = (await page.locator('#main-lines').innerText()).replace(/ +$/gm, '');
expect(lines).toMatchSnapshot('import-plain-lines.snap');
```

### Why `await` is omitted on `toMatchSnapshot`

`toMatchSnapshot()` on a plain string is synchronous — it's comparing two in-memory values, not waiting on the DOM. `await` is a no-op here. You can add it for consistency if you want, but it doesn't change behavior. The `await` *is* required on `inputValue()` and `innerText()` because those are async DOM reads.

### Auto-rerunning when snapshots are missing

Playwright already auto-generates missing snapshots on first run (test passes). The problem is you don't get a verification pass. Add a script to `package.json`:

```json
"scripts": {
  "test:snap": "npx playwright test --update-snapshots && npx playwright test"
}
```

First run generates/updates, second run verifies. If the second run fails, you know the snapshot doesn't match current behavior — something is genuinely wrong, not just "new snapshot."

For CI, you'd skip this — CI should always run without `--update-snapshots` so missing snapshots fail the build. Your existing config already handles this:

```js
retries: process.env.CI ? 2 : 0,
```

---
What's the best place to find source files for your suggestion to check for '**Oversized paste** — pasting 10,000 lines of text'? Should I check for https://github.com/minimaxir/big-list-of-naughty-strings too? If so, in a separate test alongside 10k lines of normal test, or 10k lines of naughty strings? (I'd probably test importing that too which combines out to more tests the more the requirements are)

---
### Oversized paste — generate it in the test, no file needed

10,000 lines of normal lyrics doesn't need a source file. Generate it inline:

```js
test('oversized paste does not crash', async ({ page }) => {
  const longText = Array(10000).fill('I wish I could identify that smell').join('\n');

  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, longText);
  await page.keyboard.press('Control+v');

  // Just verify it didn't crash and content is present
  await expect(page.locator('#main-lines')).toContainText('I wish I could');
});
```

The test is "does the app hang, crash, or silently drop content" — not "does it produce a specific output." So a snapshot is overkill here; a `toContainText` check on the first and last lines is sufficient.

### Naughty strings — yes, but filtered and separate

The [big-list-of-naughty-strings](https://github.com/minimaxir/big-list-of-naughty-strings) is worth testing, but with two caveats:

**1. Most entries are irrelevant to a client-side lyrics app.** The list includes SQL injection, XSS payloads, and server-side attack vectors that don't apply to LineByLine. The ones that *do* matter for your parser:

| Category | Why it matters for LineByLine | Example |
|---|---|---|
| LRC metacharacters | `[`, `]`, `:`, `.` could break timestamp parsing | `[[[00:00.00]]]` |
| Unicode RTL/LTR marks | Could reverse or corrupt lyric line rendering | `\u202E` (RTL override) |
| Zero-width characters | Invisible chars that could break line matching | `\u200B\u200C\u200D` |
| Combining characters | Stacking diacritics could cause display issues | `Z͑ͫ̓ͪ̂ͫ̽͏̴̙̤̞͉͚̯̞̠͍A̴̵̜̰͔ͫ͗͢L̠ͨͧͩ͘G̴̻͈͍͔̹̑͗̎̅͛́Ǫ̵̹̻̝̳͂̌̌͘` |
| Extremely long single lines | Could overflow your textarea or line-height calc | 10,000-char string with no newline |
| Empty / whitespace-only | Should produce empty lines, not disappear | `   \n\t\n  ` |
| CJK / emoji | Should display correctly in both modes | `🎵日本語한국어` |
| Null bytes / control chars | Could silently truncate text | `\x00` |

**2. Don't combine with the 10k-line test.** That tests two variables at once — volume AND weird content. If it fails, you won't know which caused it. Keep them separate:

```js
// Volume test — normal content, extreme quantity
test('oversized paste does not crash', async ({ page }) => { /* 10k normal lines */ });

// Content test — weird content, normal quantity
test('naughty strings do not break parser', async ({ page }) => { /* one line per naughty string */ });
```

### Practical setup for naughty strings

Download the JSON, filter it, and save a subset to `/media`:

```bash
# Download
curl -o tests/media/naughty-strings.json \
  https://raw.githubusercontent.com/minimaxir/big-list-of-naughty-strings/master/blns.json
```

Then in the test, read it and paste each string as a single-line lyric:

```js
test('naughty strings do not break parser', async ({ page, readMedia }) => {
  const blns = JSON.parse(readMedia('naughty-strings.json'));

  for (const [i, naughty] of blns.entries()) {
    await page.locator('#main-lines').click();
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press('Control+v');

    // Verify the app is still responsive after each paste
    const lines = await page.locator('#main-lines').innerText();
    // The string should appear somewhere, or at minimum the app shouldn't have crashed
    // (some strings may be filtered by the parser, which is fine — we're testing for crashes)
    await expect(page.locator('#main-lines')).toBeVisible();

    // Clear for next iteration
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
  }
});
```

### How many tests does this add?

Just two:

| Test | File | Purpose |
|---|---|---|
| `oversized-paste` | `import-paste.spec.js` | Volume stress — 10k normal lines |
| `naughty-strings` | `import-paste.spec.js` | Content edge cases — weird chars, one per iteration |

The naughty strings test will have many *iterations* inside a single test, but it counts as one test in Playwright's output. If you want individual test reporting per string (so you can see *which* string broke), use `test.describe` + `test.skip` dynamically — but that's overkill for now. Start with the loop approach and split only if you need to.

---
### The timeout is a test problem, not an app problem

The blns.json has ~500 entries. Each iteration does clipboard write → paste → assert → select all → delete — that's 5+ async operations per string. At 30 seconds total, you get ~60ms per iteration, which isn't enough. The "1234567890..." string isn't special — it's just where the clock ran out.

Two fixes, apply both:

**1. Increase the timeout for this test only:**

```js
test('naughty strings do not break parser', async ({ page, readMedia }) => {
  test.setTimeout(120000);  // 2 minutes for ~500 strings
  // ...
});
```

**2. Don't clear between iterations — just re-paste over existing content:**

The select-all + delete between each string adds latency without testing anything meaningful. Your app replaces content on paste anyway, right? If so:

```js
test('naughty strings do not break parser', async ({ page, readMedia }) => {
  test.setTimeout(120000);
  const blns = JSON.parse(readMedia('naughty-strings.json'));

  for (const naughty of blns) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press('Control+v');

    // Just verify the app is still alive
    await expect(page.locator('#main-lines')).toBeVisible();
  }
});
```

Fewer operations per iteration, and if one string *does* crash the app, `toBeVisible()` will catch it on the next iteration.

### The 10k line question

That's a product decision, not a test decision. Your test proved the app *can* handle 10k lines — whether it *should* allow it is different. If you want to cap it:

- **Where to cap**: In the paste handler, check line count before processing. If over the limit, either reject or truncate with a visible warning.
- **What limit**: LRCLIB's longest synced lyrics I've seen are ~300 lines. Even a double-album with multiple languages would be under 1000. 1000–2000 is a generous cap.
- **Test update**: Change the test from "doesn't crash" to "shows warning and rejects/truncates":

```js
test('oversized paste shows warning', async ({ page }) => {
  const longText = Array(2001).fill('I wish I could identify that smell').join('\n');
  // ... paste ...
  await expect(page.getByText(/too many lines|limit/i)).toBeVisible();
});
```

But this should follow your design intent — don't add a limit just because a test proved it's possible. Add it because you've decided users shouldn't paste that much.

---
It passed, I just had to add `await page.locator('#main-lines').click();` before the for loop to focus the lyrics field (I noticed earlier that .focus() didn't seem to work). Is it normal for the preview browser URL to change to `about:blank` every time the Filter action is on the "Evaluate" step after the "Expect "toBeVisible" locator('#main-lines')" step?

---
Yes, that's normal Playwright trace viewer behavior. It's not your app navigating away — it's just how the trace viewer renders evaluation steps.

Here's what's happening: Playwright's trace captures a snapshot at each user-visible action (click, press, etc.). But `Evaluate` steps — like the internal JavaScript `page.evaluate()` runs to check `toBeVisible()` — don't have their own page snapshots. When the trace viewer filters to show one of these steps, there's no captured DOM snapshot to display, so the preview falls back to `about:blank`.

You'll notice:

| Step type | Preview URL | Shows your app? |
|---|---|---|
| Click / Press / setInputFiles | `localhost:3004/archive/...` | Yes |
| Expect → action snapshot | `localhost:3004/archive/...` | Yes |
| Expect → Evaluate | `about:blank` | No |

The actual page never navigated to `about:blank` — the trace viewer just has nothing to render for that sub-step. Click on any adjacent action step and you'll see your app again.

This is cosmetic and doesn't affect test reliability or results at all. Just ignore it when browsing traces.