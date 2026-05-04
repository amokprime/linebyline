AI used: [GLM-5.1](https://chat.z.ai)

---

I am learning Playwright (https://playwright.dev/docs/intro, used from Windows Terminal Git Bash profile) to test a vibe coded web app. The latest version relative to repo folder root is at /archive/semantic/0.35.18/linebyline-0.35.18.html. 
Playwright expects a server URL to be configured in playwright.config.js located at root. So my first task is to configure playwright.config.js to serve the local file. Port 3004 is free.

I configured Playwright to store tests in /tests. It already put example.spec.js there.
I want to create a similar test tailored for LineByLine, like:
``` js
// @ts-check
import { test, expect } from '@playwright/test';
test('has title', async ({ page }) => {
  await page.goto('/archive/semantic/0.35.18/linebyline-0.35.18.html');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/LineByLine/);
});
```

---
Now I have a clear picture. I need to:

1. Configure `playwright.config.js` to serve the local static HTML file on port 3004
2. Update `example.spec.js` with the LineByLine-specific test

Let me update both files:
Both files are configured. Here's a summary of the changes:

### `playwright.config.js` — 2 changes

| Setting | Before | After |
|---|---|---|
| `baseURL` | commented out | `'http://localhost:3004'` |
| `webServer` | commented out | `{ command: 'npx serve . -l 3004', url: 'http://localhost:3004', reuseExistingServer: !process.env.CI }` |

**How it works:** When you run `npx playwright test`, Playwright will automatically start `npx serve . -l 3004` to serve your repo root as static files on port 3004. It waits until `http://localhost:3004` responds, then runs your tests. If port 3004 is already in use (non-CI), it reuses the existing server instead of failing.

### `example.spec.js`

- Changed `page.goto()` from the remote Playwright docs URL to `/archive/semantic/0.35.18/linebyline-0.35.18.html` (resolved against `baseURL` → `http://localhost:3004/archive/...`)
- Kept only the `has title` test with the `/LineByLine/` title assertion
- Removed the `get started link` test (specific to the Playwright docs site)

### To run

```bash
npx playwright test
```

> **Note:** `npx serve` must be available. If it isn't installed, you can swap the `command` to `npx http-server . -p 3004 --cors` (both work for static file serving). On Windows Git Bash, `npx serve` should work fine since it runs under Node.js.

---
How to update playwright.config or linebyline.spec (I created a separate test file for it instead of editing the example) so instead of specifying full file path like await page.goto('/archive/semantic/0.35.18/linebyline-0.35.18.html'); it just automatically detects the highest version that follows that general pattern '/archive/semantic/X.X.X/linebyline-X.X.X.html', where X is any non-negative integer, but the folder version number matches the file number?

---
Great idea — let me create a small helper that scans the `archive/semantic/` directory, finds the highest semver folder, and verifies the matching HTML file exists. Then the test just imports it.
Now I'll create the helper and the new test file. Since your project uses ESM (the config uses `import`/`export`), I'll keep everything in ESM.
Done. Here's what I created:

### `tests/helpers/latest-version.js` — the resolver

It runs **once at test load time** (not inside the test body), scans `archive/semantic/`, and returns the URL path for the highest version:

| Step | What it does |
|---|---|
| 1. Read `archive/semantic/` | Lists all entries in the directory |
| 2. Filter | Keeps only directories matching `/^\d+\.\d+\.\d+$/` |
| 3. Parse | Splits each `X.X.X` into `[major, minor, patch]` numbers |
| 4. Sort | Descending by semver → first entry is the highest |
| 5. Verify | Confirms `linebyline-X.X.X.html` actually exists in that folder |
| 6. Return | URL path like `/archive/semantic/0.35.18/linebyline-0.35.18.html` |

If nothing matches, it throws a clear error at startup — your test won't silently pass against the wrong file.

### `tests/linebyline.spec.js` — the test

```js
import { findLatestVersion } from './helpers/latest-version.js';

const latestPath = findLatestVersion();   // ← runs once at import time

test('has title', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
});
```

### No changes needed to `playwright.config.js`

The `baseURL: 'http://localhost:3004'` stays the same — the helper produces a root-relative URL path that gets resolved against it automatically.

### How it behaves when you add new versions

When you drop a new folder like `archive/semantic/0.36.0/linebyline-0.36.0.html`, the test will automatically target it next run — no config or code changes needed.

---
The helper is many times the size of the test itself! I prefer option 1 so I don't have to scroll down a page before seeing the actual tests.

---
Wait, typo — let me fix that syntax error in the spec:
Now delete the old file:
Here's what changed and what you need to do on your end:

### File structure

```
tests/
  helpers/
    package.json     ← NEW: defines the @linebyline/test-helpers package
    index.js         ← NEW: CJS module (the helper), replaces latest-version.js
  linebyline.spec.js ← UPDATED: imports by package name
```

### Why CommonJS in the helper?

Playwright's transform compiles everything to CJS (`require()`) under the hood. Using `module.exports` in the helper means it works natively with that pipeline — no ESM→CJS mismatch.

### One step on your machine

Add the local package as a dependency in your **root** `package.json`:

```json
"devDependencies": {
  "@linebyline/test-helpers": "file:./tests/helpers",
  ...
}
```

Then run:

```bash
npm install
```

This symlinks `node_modules/@linebyline/test-helpers` → `tests/helpers/`, so the import `from '@linebyline/test-helpers'` resolves through `node_modules` the same way `@playwright/test` does. No more Windows relative-path issues.

### Your spec is now compact

```js
import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';

const latestPath = findLatestVersion();

test('has title', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
});
```

The 30-line helper is out of sight, and any future spec files can share it with the same one-line import.

---
Now recall the Firefox screenshot I shared - its browser tab title had not only the word LineByLine but also an svg icon. Sample code:
``` html
<title>LineByLine 0.35.18</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='512' height='512' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23000000' height='24' width='24'/%3E%3Cpath d='m13,5l8,0' stroke='%23ffff00' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='m13,12l8,0' stroke='%23ffff00' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='m13,19l8,0' stroke='%23ffff00' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='m3,17l2,2l4,-4' stroke='%2300ff00' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m3,7l2,2l4,-4' stroke='%2300ff00' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<style>
```

---
Good — that confirms a couple of things:

1. **The title is `LineByLine 0.35.18`** — so `/LineByLine/` matches correctly as-is. When you bump to `0.36.0`, the title will become `LineByLine 0.36.0` and the regex still matches. ✅

2. **The favicon is an inline SVG data URI** — Playwright can test for that too if you want. For example:

```js
test('has favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
});
```

Want me to add that test (and any others you have in mind) to `linebyline.spec.js`?

---
The URL of the app doesn't change at all after first load. Is it necessary to have await page.goto(latestPath); for every test? Also is it better to have many tiny tests or one large test like this:

```js
test('has title, icon', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
});
```

---
Two good questions — here's the practical breakdown:

### Do you need `page.goto()` in every test?

**Yes, you should.** Playwright creates a **fresh browser context** for each test by default — `page` is a brand new tab, not the one from the previous test. Without `goto`, you'd be looking at `about:blank`. This isolation is intentional: it prevents one test's state from leaking into the next.

If you *really* want to skip the navigation, you can opt into a shared context with `test.describe.configure({ mode: 'serial' })` + manual setup, but that's generally discouraged for anything beyond specific performance-sensitive scenarios.

### Many small tests vs. one combined test?

**Many small tests.** Here's why:

| Aspect | One big test | Many small tests |
|---|---|---|
| **Failure diagnosis** | Something failed, but what? | Test name tells you exactly what |
| **Retry** | Must rerun *everything* | Only the failed test reruns |
| **Parallelism** | Blocked — one big chain | Playwright runs them in parallel |
| **Readability** | Scroll through a wall of asserts | Each test name is living documentation |

The favicon example you showed is the boundary case — title and favicon are both trivial checks of the same `<head>`. Combined they're still short and clear. But once you add real interaction tests (clicking buttons, checking playback state, etc.), separate tests are far easier to maintain.

### Recommended pattern

```js
// @ts-check
import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';

const latestPath = findLatestVersion();

test('has title', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
});

test('has favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
});
```

Yes, `page.goto(latestPath)` repeats — but that's by design. If the repetition bothers you, you can extract it into a fixture or `test.beforeEach`, but for a small test file it's clearer to just see it inline.

---
```js
test('has favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
});
```

Does this test that there is any favicon in the title or check for the exact right one?

---
It only checks that **there is a favicon and it's SVG type** — very loose. Any of these would pass:

```html
<!-- Your actual favicon ✅ -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...your-specific-svg...">

<!-- A completely different SVG favicon ✅ (also passes) -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...totally-different-icon...">

<!-- Even an external SVG file ✅ (also passes) -->
<link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">
```

If you want to assert the **exact** favicon, match the full data URI:

```js
test('has correct favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toBe('data:image/svg+xml,%3Csvg%20width%3D%27512%27...');
});
```

But that's brittle — any tiny SVG change breaks the test. A practical middle ground is to check for **distinctive parts** of your icon, like the color scheme:

```js
test('has LineByLine favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
  expect(href).toContain('%23ffff00');   // yellow strokes
  expect(href).toContain('%2300ff00');   // green checkmarks
});
```

This catches "wrong icon was loaded" without breaking on minor SVG formatting changes.

---
If I wanted to test that buttons tinted when hovered and showed feedback when clicked, would it be better to do that as a standalone test for each button, a collective test for all buttons, or as a check that's embedded into other tests that happen to press buttons?

---
Great question — this is about test design philosophy, and the answer depends on what you're actually asserting.

### The key distinction: visual effects vs. functional outcomes

| What you're testing | Best approach |
|---|---|
| **Hover tint** (purely visual CSS) | Snapshot/visual regression, not per-button tests |
| **Click feedback** (ripple, flash, pulse) | Snapshot/visual regression, not per-button tests |
| **Click → something happens** (play/pause, dialog opens, etc.) | Embedded in the functional test for that feature |

Here's why:

### Hover tint and click feedback = visual regression territory

These are **pure CSS concerns** — every button gets the same `:hover` or `:active` styling from the same rule. If it works for one button, it works for all of them (unless you have a broken `class` on a specific button, which you'd catch by testing the button *exists*, not by re-testing its CSS).

Testing hover tint per-button looks like:

```js
// ❌ Painful and redundant
test('play button tints on hover', async ({ page }) => { ... });
test('pause button tints on hover', async ({ page }) => { ... });
test('skip button tints on hover', async ({ page }) => { ... });
// ... 10 more
```

Instead, the right tool is **visual comparison snapshots** — Playwright's `toHaveScreenshot()`:

```js
// ✅ One test, catches any visual regression on any element
test('button hover states', async ({ page }) => {
  await page.goto(latestPath);
  const button = page.getByRole('button', { name: 'Play' });
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
});
```

You take the screenshot once as a baseline. Future runs pixel-diff against it. If a CSS change breaks hover tinting anywhere, the diff catches it. You don't need to write 20 hover tests.

### Functional click outcomes = embed in feature tests

When a button *does something* (play triggers playback, sync line navigates, etc.), that assertion belongs in the test for that feature:

```js
// ✅ Pressing the button is the *means*, not the *end*
test('playback starts when play is clicked', async ({ page }) => {
  await page.goto(latestPath);
  await page.getByRole('button', { name: 'Play' }).click();
  // Assert something actually happened — elapsed time advances, icon changes, etc.
  await expect(page.getByTestId('elapsed-time')).not.toBe('0:00');
});
```

You're not testing "click feedback" here — you're testing **the feature works**. The click is just how you trigger it.

### Summary

| Strategy | Use for |
|---|---|
| **One visual snapshot test** | Hover tint, click ripple/flash — pure CSS effects that apply uniformly |
| **Embedded in feature tests** | "Clicking X causes Y" — the click is just the input method |
| **Per-button standalone** | Almost never justified unless a specific button has unique, complex behavior |
| **Collective test for all buttons** | Not useful — if all buttons share the same CSS, one snapshot covers it |

The rule of thumb: **test behavior, not appearance** (for functional tests), and **test appearance with screenshots** (for visual regressions). Don't try to assert CSS states with functional `expect()` calls — that's what screenshot diffs are built for.

---
How to test buttons for external links would show link preview (in lower left corner of real Firefox browser) on hover?

---
You **can't** — and this is a hard limitation, not a Playwright gap. Here's why and what you can do instead:

### The link preview is browser chrome, not page content

The lower-left URL preview is part of **Firefox's own UI** (the status bar / browser chrome), not the DOM. Playwright controls the **page** — it has zero access to browser chrome elements. No automation tool (Selenium, Cypress, Puppeteer) can see it either.

```
┌─────────────────────────────────────┐
│ Firefox chrome (tab bar, menus)     │ ← Playwright can't see this
│─────────────────────────────────────│
│                                     │
│         Web page content            │ ← Playwright can see this
│                                     │
│─────────────────────────────────────│
│ https://example.com          ↗      │ ← Link preview lives here (browser chrome)
└─────────────────────────────────────┘
```

### What you *can* test instead

You can verify the **underlying mechanism** that *produces* the preview — the `href` attribute itself. If `href` is correct, the browser will show the correct preview. Guaranteed — that's just how browsers work.

```js
test('external link buttons have correct hrefs', async ({ page }) => {
  await page.goto(latestPath);

  // Find all links that open externally
  const externalLinks = page.locator('a[target="_blank"]');

  const count = await externalLinks.count();
  for (let i = 0; i < count; i++) {
    const href = await externalLinks.nth(i).getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);   // absolute URL = external
  }
});
```

This confirms every external link button points where it should. If the `href` is right, the preview will be right.

### What you *can't* test without a real browser

If you truly need to verify the status bar preview itself (e.g., you're testing a Firefox extension, or you need to confirm `rel="noopener"` doesn't suppress it), you'd need:

| Approach | Feasibility |
|---|---|
| **Playwright** | ❌ No browser chrome access |
| **Selenium** | ❌ Same limitation |
| **Firefox Marionette** with custom script | 🟡 Theoretically possible but extremely fragile — you'd be querying Firefox's own XUL/JS internals |
| **Manual testing** | ✅ Hover the button, look at the corner |

### Practical recommendation

Don't test browser chrome behavior. Test the contract:

> **If `href` is correct and the link is visible, the preview will be correct.**

Assert the `href`, assert the link is visible and hoverable, and trust the browser to do its job for the preview. The only thing that could go wrong is if you dynamically override the `href` via JavaScript on hover — and you *can* test for that:

```js
test('href does not change on hover', async ({ page }) => {
  await page.goto(latestPath);
  const link = page.locator('a[target="_blank"]').first();
  const hrefBefore = await link.getAttribute('href');
  await link.hover();
  const hrefAfter = await link.getAttribute('href');
  expect(hrefAfter).toBe(hrefBefore);
});
```

That covers the one edge case where the preview could lie to the user.

---
No need for loop-just two such links exist and I know what they are

---
Even simpler then:

```js
test('external links have correct hrefs', async ({ page }) => {
  await page.goto(latestPath);

  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href', 'https://github.com/your-repo'
  );
  await expect(page.getByRole('link', { name: 'NPM' })).toHaveAttribute(
    'href', 'https://www.npmjs.com/package/your-package'
  );
});
```

Replace the names and URLs with your actual two links. `getByRole('link', { name: ... })` matches by accessible name (visible text or `aria-label`), and `toHaveAttribute` asserts the exact `href` — so you're confirming both that the link exists *and* that it points to the right place.

---
Both links are subdomains of my GitHub repo-is it necessary to actually click the buttons to see if they open? This page points out that might not be a best practice: https://playwright.dev/docs/best-practices#avoid-testing-third-party-dependencies

---
Exactly right — don't click through. That page is talking directly about your situation. Your test's job is to verify **your app wired the links correctly**, not that GitHub is online.

If you click through, you're testing:

| What the test covers | Your responsibility? |
|---|---|
| Your `href` is correct | ✅ Yes |
| GitHub is up | ❌ No |
| DNS resolves | ❌ No |
| No corporate firewall blocks it | ❌ No |
| GitHub doesn't rate-limit your CI | ❌ No |

Any of those failing makes **your** test go red, even though your app is fine. That's a flaky test — the worst kind.

### The `toHaveAttribute` test you already have is sufficient

```js
test('external links have correct hrefs', async ({ page }) => {
  await page.goto(latestPath);

  await expect(page.getByRole('link', { name: 'Repo' })).toHaveAttribute(
    'href', 'https://github.com/you/linebyline'
  );
  await expect(page.getByRole('link', { name: 'Issues' })).toHaveAttribute(
    'href', 'https://github.com/you/linebyline/issues'
  );
});
```

This confirms: the link exists, it's accessible, and it points to the right URL. If those three things are true, clicking it **will** open the right page — that's just how browsers work. You're done.

### If you ever *do* need to verify reachability

That's a separate concern — a **monitoring** problem, not a testing problem. Use a uptime monitor (GitHub Actions scheduled workflow, UptimeRobot, etc.) that pings your URLs periodically. Don't mix that into your app's functional tests.

---
Is it necessary to separately test the corresponding hotkey for each button (nearly every button in my app has a hotkey), or is there a way to reliably infer hotkey functionality like external URLs from hrefs? What about Tab/Shift+Tab/arrow key navigation? I only found CLI methods for forcing keyboard inputs: https://playwright.dev/agent-cli/commands/keyboard-mouse, and codegen didn't seem to record keystrokes

---
### Hotkeys: can't be inferred like hrefs

The `href` analogy breaks down because `href` is **declarative** — the attribute *is* the behavior. But a hotkey is **imperative** — it requires JavaScript to listen for `keydown` and call the right handler. Three things can go wrong independently:

| Failure mode | Example |
|---|---|
| Key listener not registered | Forgot to bind `keydown` |
| Wrong key mapped | `Space` mapped to skip instead of play |
| Handler not shared | Click works, key fires but calls wrong function |

So no, you can't infer hotkey functionality the way you can trust an `href`.

### The practical middle ground

If your app has a **centralized keyboard map** (which most do — a single `keydown` listener with a switch or lookup table), then the risk isn't the wiring pattern, it's **individual key mappings**. Test a few representative hotkeys to confirm the listener is connected, then verify the key map itself:

```js
test('hotkey: Space toggles playback', async ({ page }) => {
  await page.goto(latestPath);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('elapsed-time')).not.toBe('0:00');
});
```

Don't test every key — test **categories**: one play/pause key, one navigation key, one special function key. If those three work, your keyboard handler is wired up and the mapping table is loaded. The rest follow the same code path.

### If your app declares hotkeys in the UI

Your LineByLine app has a CONTROLS panel listing hotkeys (visible in the earlier screenshot). You could verify **the documentation matches reality**:

```js
test('documented hotkey for play/pause is Space', async ({ page }) => {
  await page.goto(latestPath);
  // Verify the label says Space
  await expect(page.getByText(/play.*pause.*space/i)).toBeVisible();
  // Verify Space actually works
  await page.keyboard.press('Space');
  // Assert playback started
});
```

This catches the most common bug: the label says `Space` but the code listens for `Enter`.

### Tab/Shift+Tab/Arrow key navigation

This is absolutely testable in Playwright — `page.keyboard` works in tests too, not just CLI:

```js
test('Tab navigates to interactive elements', async ({ page }) => {
  await page.goto(latestPath);

  // First Tab should hit the first focusable element
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button').first()).toBeFocused();

  // Tab again moves to next element
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link').first()).toBeFocused();

  // Shift+Tab goes back
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button').first()).toBeFocused();
});
```

### Why codegen didn't record keystrokes

Codegen records **text input** (typing into fields) and **clicks**, but it can't see custom `keydown` listeners — it only knows about standard browser interactions. Tab/Shift+Tab are recorded as focus changes, not key presses. Hotkey bindings are invisible to it. You'll need to write these tests manually.

### Summary

| What | Strategy |
|---|---|
| **Hotkey clicks** | Test 2–3 representative keys, not all |
| **Hotkey labels** | Assert documented key matches actual behavior |
| **Tab order** | Manual test with `keyboard.press('Tab')` + `toBeFocused()` |
| **Arrow key nav** | Same as Tab — press and assert focus moved |
| **Full coverage** | Consider an accessibility audit tool (axe-core) instead of manual tests |

The accessibility audit point is worth highlighting — tools like `@axe-core/playwright` will flag missing focus indicators, incorrect tab order, and keyboard traps in one scan, which is far more efficient than writing individual Tab tests for every element.

---
Part of my .bashrc used by Git Bash:
```
alias rld="source ~/.bashrc"  
alias bsr="nano ~/.bashrc"
alias cgn="npx playwright codegen "http://localhost:3004$(node -e "const{findLatestVersion}=require('@linebyline/test-helpers');process.stdout.write(findLatestVersion())")" --browser firefox"  
alias tsta="npx playwright test --ui"  
alias tst="npx playwright test --project=firefox"
```
On first Git Bash load:
```
bash: node: command not found
user@PC MINGW64 /a/Scripts/GitHub/linebyline (staging)
$
```
When running `srv` and then `cgn` in separate Git Bash tabs, it opens Firefox with Index of /linebyline showing all root level files and folders instead of linebyline-0.35.18.html
```
srv window:
HTTP 5/3/2026 6:01:20 PM 127.0.0.1 GET /  
HTTP 5/3/2026 6:01:20 PM 127.0.0.1 Returned 200 in 75 ms  
HTTP 5/3/2026 6:01:20 PM 127.0.0.1 GET /favicon.ico  
HTTP 5/3/2026 6:01:20 PM 127.0.0.1 Returned 404 in 7 ms

cgn window:
user@PC MINGW64 /a/Scripts/GitHub/linebyline (staging)  
$ cgn

```

---
Nested double quotes — bash saw `"http://localhost:3004$(node -e "` and thought the string ended at the second `"`. Use a variable to avoid the nesting:

```bash
cgn() {
  local path=$(node -e "const{findLatestVersion}=require('@linebyline/test-helpers');process.stdout.write(findLatestVersion())")
  npx playwright codegen "http://localhost:3004${path}" --browser firefox
}
```

The `node -e "..."` argument now uses double quotes consistently (the package name uses single quotes inside), and the URL string has no nested quotes to confuse bash.

---
What's the origin of the 'smoke' name for smoke.spec.js?

---
From **hardware manufacturing**. When a new circuit board or appliance was built, the first test was literally: **plug it in and see if smoke comes out**. If it smokes, it's broken at the most fundamental level — no point testing anything else.

The term migrated to software as the first-run sanity check: **does the app even start without crashing?** If `page.goto()` fails or throws an exception, everything downstream is pointless.

The metaphor holds for your LineByLine tests — `smoke.spec.js` checks:

- Does the page load?
- Does it have the right title?
- Does it have a favicon?

If any of those fail, something is deeply wrong and no other test will pass.

---
Font dropdown test is tricky. Text and value assertions don't report anything. Aria snapshot does but I'm not sure about the syntax.
# Test info

- Name: theme-font.spec.js >> font-toggle
- Location: tests\theme-font.spec.js:23:5

---
# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#font-select')
Expected substring: "System Sans"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#font-select')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { findLatestVersion } from '@linebyline/test-helpers';
  3  | const latestPath = findLatestVersion();
  4  | 
  5  | test('link-hrefs', async ({ page }) => {
  6  |   await page.goto(latestPath);
  7  |   await expect(page.getByRole('link', { name: '?' })).toHaveAttribute(
  8  |     'href', 'https://github.com/amokprime/linebyline/blob/main/HELP.md'
  9  |   );
  10 |   await expect(page.getByRole('link', { name: 'Issues (Ctrl+[)' })).toHaveAttribute(
  11 |     'href', 'https://github.com/amokprime/linebyline/issues'
  12 |   );
  13 | });
  14 | 
  15 | test('theme-toggle', async ({ page }) => {
  16 |   await page.goto(latestPath);
  17 |   await page.keyboard.press('Control+.')
  18 |   await expect(page).toHaveScreenshot('dark-mode.png');
  19 |   await page.keyboard.press('Control+.')
  20 |   await expect(page).toHaveScreenshot('light-mode.png');
  21 | });
  22 | 
  23 | test('font-toggle', async ({ page }) => {
> 24 |   await expect(page.locator('#font-select')).toContainText('System Sans');
     |                                              ^ Error: expect(locator).toContainText(expected) failed
  25 |   for (let i = 0; i < 5; i++) {
  26 |     await page.keyboard.press('Tab');
  27 |   }
  28 |   await page.keyboard.press('ArrowDown');
  29 |   await expect(page.locator('#font-select')).toContainText('System Serif');
  30 | });
```

---
# Error details

```
Error: expect.toMatchAriaSnapshot: Node value should be a string or a sequence
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { findLatestVersion } from '@linebyline/test-helpers';
  3  | const latestPath = findLatestVersion();
  4  | 
  5  | test('link-hrefs', async ({ page }) => {
  6  |   await page.goto(latestPath);
  7  |   await expect(page.getByRole('link', { name: '?' })).toHaveAttribute(
  8  |     'href', 'https://github.com/amokprime/linebyline/blob/main/HELP.md'
  9  |   );
  10 |   await expect(page.getByRole('link', { name: 'Issues (Ctrl+[)' })).toHaveAttribute(
  11 |     'href', 'https://github.com/amokprime/linebyline/issues'
  12 |   );
  13 | });
  14 | 
  15 | test('theme-toggle', async ({ page }) => {
  16 |   await page.goto(latestPath);
  17 |   await page.keyboard.press('Control+.')
  18 |   await expect(page).toHaveScreenshot('dark-mode.png');
  19 |   await page.keyboard.press('Control+.')
  20 |   await expect(page).toHaveScreenshot('light-mode.png');
  21 | });
  22 | 
  23 | test('font-toggle', async ({ page }) => {
> 24 |   await expect(page.locator('#font-select')).toMatchAriaSnapshot(`
     |                                              ^ Error: expect.toMatchAriaSnapshot: Node value should be a string or a sequence
  25 |   - combobox "Editor font":
  26 |   - option "System Sans" [selected]
  27 |   - option "System Serif"
  28 | `);
  29 |   for (let i = 0; i < 5; i++) {
  30 |     await page.keyboard.press('Tab');
  31 |   }
  32 |   await page.keyboard.press('ArrowDown');
  33 |   await expect(page.locator('#font-select')).toMatchAriaSnapshot(`
  34 |   - combobox "Editor font":
  35 |   - option "System Sans"
  36 |   - option "System Serif" [selected]
  37 | `);
  38 | });
```

---
# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: locator('#font-select')
Expected: "system-ui,sans-serif"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for locator('#font-select')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { findLatestVersion } from '@linebyline/test-helpers';
  3  | const latestPath = findLatestVersion();
  4  | 
  5  | test('link-hrefs', async ({ page }) => {
  6  |   await page.goto(latestPath);
  7  |   await expect(page.getByRole('link', { name: '?' })).toHaveAttribute(
  8  |     'href', 'https://github.com/amokprime/linebyline/blob/main/HELP.md'
  9  |   );
  10 |   await expect(page.getByRole('link', { name: 'Issues (Ctrl+[)' })).toHaveAttribute(
  11 |     'href', 'https://github.com/amokprime/linebyline/issues'
  12 |   );
  13 | });
  14 | 
  15 | test('theme-toggle', async ({ page }) => {
  16 |   await page.goto(latestPath);
  17 |   await page.keyboard.press('Control+.')
  18 |   await expect(page).toHaveScreenshot('dark-mode.png');
  19 |   await page.keyboard.press('Control+.')
  20 |   await expect(page).toHaveScreenshot('light-mode.png');
  21 | });
  22 | 
  23 | test('font-toggle', async ({ page }) => {
> 24 |   await expect(page.locator('#font-select')).toHaveValue('system-ui,sans-serif');
     |                                              ^ Error: expect(locator).toHaveValue(expected) failed
  25 |   for (let i = 0; i < 5; i++) {
  26 |     await page.keyboard.press('Tab');
  27 |   }
  28 |   await page.keyboard.press('ArrowDown');
  29 |   await expect(page.locator('#font-select')).toHaveValue('sans-serif');
  30 | });
```

---
Three separate issues here:

### Issue 1: "element(s) not found"

The `<select>` is in the DOM but Playwright can't find it because `#menu-bar` has `overflow-x:auto` — on Playwright's default viewport (1280×720), the font dropdown might be scrolled out of view. Playwright considers off-screen elements inside overflow containers as "not found" for actionable assertions.

**Fix:** Use a role-based locator and ensure the element is visible first:

```js
test('font-toggle', async ({ page }) => {
  await page.goto(latestPath);
  const fontSelect = page.getByLabel('Editor font');

  // Verify default
  await expect(fontSelect).toHaveValue('system-ui,sans-serif');

  // Change via selectOption (not keyboard)
  await fontSelect.selectOption('serif');

  // Verify change
  await expect(fontSelect).toHaveValue('serif');
});
```

`getByLabel('Editor font')` matches the `title="Editor font"` attribute and is more reliable than `locator('#font-select')` for native form controls.

### Issue 2: ARIA snapshot syntax error

The error `"Node value should be a string or a sequence"` means the indentation is wrong — options must be **nested deeper** than the combobox:

```js
// ❌ Wrong — options at same level as combobox
await expect(page.locator('#font-select')).toMatchAriaSnapshot(`
- combobox "Editor font":
- option "System Sans" [selected]
- option "System Serif"
`);

// ✅ Correct — options indented as children
await expect(page.locator('#font-select')).toMatchAriaSnapshot(`
- combobox "Editor font":
    - option "System Sans" [selected]
    - option "System Serif"
`);
```

### Issue 3: Testing font change via keyboard

If you want to test keyboard navigation to the dropdown (Tab + ArrowDown), use `selectOption` instead — it's more reliable than simulating native dropdown keyboard interaction, which varies across browsers:

```js
test('font-toggle via keyboard', async ({ page }) => {
  await page.goto(latestPath);
  const fontSelect = page.getByLabel('Editor font');

  await expect(fontSelect).toHaveValue('system-ui,sans-serif');

  // Focus the select and change with arrow keys
  await fontSelect.focus();
  await page.keyboard.press('ArrowDown');

  await expect(fontSelect).toHaveValue('serif');
});
```

### Why `toContainText` doesn't work on `<select>`

`<select>` is a native form control — the option text lives in the browser's native dropdown UI, not as visible DOM text. `toContainText('System Sans')` checks the rendered text content, which for a `<select>` is empty (the browser renders the dropdown, not the HTML text). Use `toHaveValue()` or `toMatchAriaSnapshot()` instead.

---
# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Editor font')
Expected: "system-ui,sans-serif"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" with timeout 5000ms
  - waiting for getByLabel('Editor font')

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
  1  | import { test, expect } from '@playwright/test';
  2  | import { findLatestVersion } from '@linebyline/test-helpers';
  3  | const latestPath = findLatestVersion();
  4  | 
  5  | test('link-hrefs', async ({ page }) => {
  6  |   await page.goto(latestPath);
  7  |   await expect(page.getByRole('link', { name: '?' })).toHaveAttribute(
  8  |     'href', 'https://github.com/amokprime/linebyline/blob/main/HELP.md'
  9  |   );
  10 |   await expect(page.getByRole('link', { name: 'Issues (Ctrl+[)' })).toHaveAttribute(
  11 |     'href', 'https://github.com/amokprime/linebyline/issues'
  12 |   );
  13 | });
  14 | 
  15 | test('theme-toggle', async ({ page }) => {
  16 |   await page.goto(latestPath);
  17 |   await page.keyboard.press('Control+.')
  18 |   await expect(page).toHaveScreenshot('dark-mode.png');
  19 |   await page.keyboard.press('Control+.')
  20 |   await expect(page).toHaveScreenshot('light-mode.png');
  21 | });
  22 | 
  23 | test('font-toggle via keyboard', async ({ page }) => {
  24 |   await page.goto(latestPath);
  25 |   const fontSelect = page.getByLabel('Editor font');
> 26 |   await expect(fontSelect).toHaveValue('system-ui,sans-serif');
     |                            ^ Error: expect(locator).toHaveValue(expected) failed
  27 |   await fontSelect.focus();
  28 |   await page.keyboard.press('ArrowDown');
  29 |   await expect(fontSelect).toHaveValue('serif');
  30 | });
```

---

# This is what Pick locator sees with System Sans selected:

Locator
```
locator('#font-select')
```
Aria snapshot
```
- combobox "Editor font":
  - option "System Sans" [selected]
  - option "System Serif"
```

And with System Serif:
Locator
```
locator('#font-select')
```
Aria snapshot
```
- combobox "Editor font":
  - option "System Sans"
  - option "System Serif" [selected]
```

---
The Page snapshot proves the element exists, but the locator says "not found" — this is a **stale frame context** issue. Playwright is searching the wrong execution context. This happens when the page navigates or reloads after `goto` but before your assertion runs.

The fix is to use `getByRole` (matches the ARIA snapshot directly) and explicitly wait for the element:

```js
test('font-toggle', async ({ page }) => {
  await page.goto(latestPath);
  const fontSelect = page.getByRole('combobox', { name: 'Editor font' });

  // Verify default selection
  await expect(fontSelect).toHaveValue('system-ui,sans-serif');

  // Change via selectOption (reliable cross-browser)
  await fontSelect.selectOption('serif');
  await expect(fontSelect).toHaveValue('serif');

  // Change back
  await fontSelect.selectOption('system-ui,sans-serif');
  await expect(fontSelect).toHaveValue('system-ui,sans-serif');
});
```

### Why `locator('#font-select')` and `getByLabel` fail but Pick Locator works

Pick Locator operates on the **live accessibility tree** (which your Page snapshot confirms shows `combobox "Editor font"`). But `locator('#font-select')` and `getByLabel()` query the **DOM frame context** — if that context is stale (e.g., the page's `sessionStorage` autosave triggered a re-render during init), the query runs against a detached document.

`getByRole('combobox', { name: 'Editor font' })` also queries the frame context, but it's the most Playwright-native locator and tends to be more resilient. If it still fails, add an explicit frame sync:

```js
await page.goto(latestPath);
await page.waitForLoadState('domcontentloaded');  // ensure frame is stable
```

### ARIA snapshot syntax fix (for reference)

Your Pick Locator output shows the correct indentation — options must be **children** of the combobox (indented 2+ spaces under the parent with the colon):

```js
await expect(fontSelect).toMatchAriaSnapshot(`
  - combobox "Editor font":
    - option "System Sans" [selected]
    - option "System Serif"
`);
```

### Why not keyboard (`ArrowDown`) to change the font?

Native `<select>` dropdown keyboard behavior is **browser-specific** — Firefox and Chromium handle `ArrowDown` on a closed `<select>` differently. `selectOption('serif')` sets the value directly without opening the dropdown, making it reliable across browsers. Save keyboard testing for your `keyboard-nav.spec.js` where you specifically test Tab + Arrow focus behavior.

---
Now I understand the full picture. There are two categories of SonarQube issues:

### Issue 1: Code quality (3 specific findings)

All are easy fixes:
Code quality fixes are done. Now the bigger issue:

### Issue 2: "0% coverage on new code" — SonarQube is scanning the wrong files

SonarQube is reporting **0% line coverage** on your **test files themselves**:

| File | Uncovered lines |
|---|---|
| `tests/helpers/index.js` | 19 |
| `tests/smoke.spec.js` | 23 |
| `tests/theme-font.spec.js` | 26 |

This is a **misconfiguration** — SonarQube is treating your Playwright test files as **application source code** and trying to measure how much of *them* is covered by unit tests. But test files don't get tested by other tests — they *are* the tests.

### The fix: exclude test files from SonarQube coverage

Add a `sonar.properties` file to your repo root (or add to your `sonar-project.properties` if you have one):

```properties
# Tests are test infrastructure, not application code
sonar.tests=tests
sonar.test.inclusions=tests/**/*.spec.js
sonar.coverage.exclusions=tests/**/*
```

Or if you configure via GitHub Actions YAML, add these as arguments:

```yaml
- name: SonarQube Scan
  uses: SonarSource/sonarqube-scan-action@v4
  with:
    args: >
      -Dsonar.tests=tests
      -Dsonar.test.inclusions=tests/**/*.spec.js
      -Dsonar.coverage.exclusions=tests/**/*
```

This tells SonarQube:
- **`sonar.tests=tests`** — the `tests/` directory contains test files (not source code)
- **`sonar.test.inclusions`** — which files *are* tests (`.spec.js` files)
- **`sonar.coverage.exclusions`** — don't measure coverage on test infrastructure

### Why the quality gate fails

Your SonarQube quality gate requires **≥80% coverage on new code**. Since SonarQube is counting all 68 lines in your test files as "uncovered source code," the coverage percentage drops to 0%. Once you exclude them, only your actual app code (`linebyline-0.35.18.html`) will be measured for coverage — and that's a single HTML file that SonarQube's JavaScript scanner likely can't instrument anyway.

### Summary of changes

| File                     | Change                                                                                | SonarQube rule      |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------- |
| `tests/helpers/index.js` | `require('fs')` → `require('node:fs')`, `require('path')` → `require('node:path')`    | S7772               |
| `playwright.config.js`   | Removed commented-out dotenv import and commented-out mobile/branded browser projects | S125                |
| Repo root (new)          | Add `sonar.properties` to exclude test files from coverage                            | N/A — configuration |

---
Found it — **duplicate `sonar.exclusions` keys**. YAML and SonarQube don't merge them; the second one **replaces** the first:

```yaml
-Dsonar.exclusions=archive/**    # ← overwritten by next line
-Dsonar.exclusions=tests/**      # ← only this one takes effect
```

So `archive/` is no longer excluded. Fix: combine them into a single comma-separated value:

```yaml
args:
  -Dsonar.projectKey=amokprime_linebyline
  -Dsonar.organization=amokprime
  -Dsonar.scm.provider=git
  -Dsonar.exclusions=archive/**,tests/**
```
That's the fix. **Duplicate `-Dsonar.exclusions` keys don't merge — the last one wins.** So when you added `tests/**`, it silently replaced `archive/**` instead of adding to it. The comma-separated syntax (`archive/**,tests/**`) excludes both.

---
