See this [Obsidian Share Note](https://share.note.sx/9wimmaly) for what's planned in the near future.

### Architecture and workflows

LineByLine is a no-dependencies 2.7k+ LOC .html file (with JavaScript and CSS all inside). See the [ai](https://github.com/amokprime/linebyline/tree/main/ai) folder README or specific subfolders to reproduce my workflows. `omp/` is the current one and still very WIP as it's the first CLI harness I've used. `chat.z.ai/` and `claude.ai/` are both web chat based.

#### CI

All code changes must pass [ESLint](https://github.com/amokprime/linebyline/tree/main/archive/modular/plan/2-Zed-ESLint.md) (i.e. `npx eslint . > local/log.txt 2>&1`) after the upcoming HTML modular [refactor](https://github.com/amokprime/linebyline/tree/main/archive/modular/plan/0-Roadmap.md). Any changes to app code **must** pass CodeQL and SonarCloud GitHub Actions. When Sonar issues are found, fetch them with the [sonar-issue-exporter](https://github.com/amokprime/sonar-issue-exporter) tool and put them in an "issues" folder inside the app version folder, minus the why.md and how.md files (they're public information but also technically Sonar IP which conflicts with LineByLine's GPL 3 license).

LineByLine has two types of QA tests: Playwright and [MANUAL.md.](https://github.com/amokprime/linebyline/tree/main/tests/MANUAL.md). Playwright CI **must** pass. See [PLAYWRIGHT_SETUP.md](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md) for help running them pre-commit.

#### Writing tests

The helper [tests/helpers/index.js](https://github.com/amokprime/linebyline/tree/main/tests/helpers.index.js) provides several code-saving shortcuts. Every real test file will most likely require at least this structure:
```js
const { test, expect } = require("@linebyline/test-helpers"); //once at the top

test("mytest", async({ page }) => {
//test code
});
```
`test` is extended with `page`, which loads the local LineByLine server for each test. Otherwise every test would need a line like `await page.goto(URL);`. The URL is a local server like `npx serve . -l 3004` from repo root folder, resolved to the specific app version by the `findLatestVersion` helper function.

Example with every possible helper parameter loaded:
```js
const { test, expect, tabUntilFocused } = require("@linebyline/test-helpers");

async function waitForImport(page) {
  await expect(page.locator(".lrc-line.cursor")).toBeVisible();
  await expect(page.locator("#time-dur")).not.toHaveText("0:00");
}

async function triggerTimeUpdate(page) {
  await page.evaluate(() => {
    const audio = document.querySelector("audio");
    if (audio) audio.dispatchEvent(new Event("timeupdate"));
  });
}

async function lyricLinesText(page) {
  return page.getByLabel("Lyric lines").innerText();
}

test("mytest", async ({ page, media, readMedia, importSecondary})) => {
      await page.locator('#file-picker').setInputFiles([
        media('audio.mp3'),
        media('synced_english.lrc'),
      ]);

      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, readMedia('mock.txt'));
      
      await importSecondary(1, "plain_spanish.lrc")
});
```
What they do:
- `tabUntilFocused` holds `Tab` until a certain element is focused. It is only used in `keyboard-nav.spec.js` for now. It refers to elements either by their HTML fixed locator name or by a selector and index number for element names rebuilt dynamically when loaded (i.e. secondary fields, Settings window buttons).
- These are only used in `sync-adjust.spec.js` for now:
	- `waitForImport` waits for the main lyrics to load, the first line to become active (left blue border), and audio metadata to load
	- `triggerTimeUpdate` forces the app to update the highlighted line and the time in the media box instead of waiting (which breaks in headless)
- `lyricLinesText` replaces flaky ARIA snapshots that broke in headless with a capture of the main lyrics as a single string of list items and newlines. This is used in `intervals.spec.js` and `sync-adjust.spec.js`.
- These are used in multiple files:
	- `media` imports audio and main field lyrics
	- `readMedia` loads a .lrc file to the clipboard for paste tests
	- `importSecondary` imports secondary field lyrics
