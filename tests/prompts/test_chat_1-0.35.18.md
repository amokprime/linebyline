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
