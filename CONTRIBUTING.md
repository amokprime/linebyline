### Architecture and workflows

LineByLine is a modular Vite + Vue + shadcn-vue (Tailwind CSS v4) app — all app code lives in [src/](https://github.com/amokprime/linebyline/tree/main/src) and builds to `dist/` (gitignored; GitHub Pages deploys it via the `deploy.yml` GitHub Actions workflow). Releases ship a single-file offline build (`vite-plugin-singlefile` inlines everything). See the [ai](https://github.com/amokprime/linebyline/tree/main/ai) folder README and the [skills/](https://github.com/amokprime/linebyline/tree/main/skills) folder for the chat.z.ai web-channel workflow. Legacy claude.ai / ZCode harness scaffolding has been dropped. OMP has a skeleton config for Copilot-like tasks using free API providers. Expand it if you use OMP with paid subscriptions.

#### CI

All code changes **must** pass [ESLint](https://github.com/amokprime/linebyline/tree/main/archive/modular/plan/2-Zed-ESLint.md) (i.e. `npx eslint src/ tests/`), CodeQL, and SonarCloud GitHub Actions. When issues are found, fetch them locally with [`sie`](https://github.com/amokprime/sonar-issue-exporter) (the consolidated `sonar-issue-exporter` CLI) — it produces a single Markdown report combining SonarCloud issues and CodeQL code-scanning alerts, with `#### Why` / `#### How to fix` rationale per rule when `SONAR_API_KEY` is set. Run `sie -c` / `--clean` to drop the licensed Sonar Why/How sections before committing (they're public information but also technically Sonar IP which conflicts with LineByLine's GPL 3 license). Save the report to `archive/modular/<version>/issues.md` (auto-increments to `issues1.md`, `issues2.md`, …; pre-cutover reports live in `archive/semantic/<version>/` — that tree is read-only history since the monolith was deleted).

LineByLine has two types of QA tests: Playwright and [MANUAL.md.](https://github.com/amokprime/linebyline/tree/main/tests/MANUAL.md). Playwright CI **must** pass. See [PLAYWRIGHT_SETUP.md](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md) for help running them pre-commit.

#### Test helpers

The helper [tests/helpers/index.js](https://github.com/amokprime/linebyline/tree/main/tests/helpers/index.js) provides several code-saving shortcuts. Every real test file will most likely require at least this structure:
```js
const { test, expect } = require("@linebyline/test-helpers"); //once at the top

test("mytest", async({ page }) => {
//test code
});
```
`test` is extended with `page`, which navigates to the app URL for each test. Otherwise every test would need a line like `await page.goto(URL);`. Playwright's config starts the server itself (`npx vite preview --port 5173 --strictPort`) and `getAppUrl()` resolves to `/` — the Vite preview root. (The monolith-era `findLatestVersion` helper and the `npx serve . -l 3004` server were removed when `docs/index.html` was deleted in Phase E Tranche 6.)

Example with the fixtures loaded:
```js
const { test, expect, waitForImport } = require("@linebyline/test-helpers");

test("mytest", async ({ page, media, readMedia, importSecondary }) => {
      await page.locator('#file-picker').setInputFiles([
        media('audio.mp3'),
        media('synced_english.lrc'),
      ]);
      await waitForImport(page);

      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, readMedia('mock.txt'));

      await importSecondary(1, "plain_spanish.lrc")
});
```
What they do:
- `page` auto-navigates to the app before each test (see above)
- `media` resolves a filename inside `tests/media` to an absolute path (for `setInputFiles`)
- `readMedia` reads a media file's contents as UTF-8 (for clipboard paste tests)
- `importSecondary` opens the nth secondary field's 📂 button, sets the file, and waits for the textarea to populate
- `workaroundPaste` auto-setup fixture: include it in a test's destructured args to (1) skip the test on webkit and (2) grant `clipboard-read`/`clipboard-write` permissions on chromium. Destructure as `{ workaroundPaste: _workaroundPaste }` — the underscore prefix silences tsserver's "declared but never read" warning, since the fixture has no value
- Exported wait helpers (shared across spec files):
    - `waitForLyrics` waits for the main lyrics to load (first line gets the cursor border)
    - `waitForAudio` waits for audio metadata to load (duration no longer `0:00`)
    - `waitForImport` combines both — use after importing a song
- `tabUntilFocused` holds `Tab` until a certain element is focused. It refers to elements either by their HTML fixed locator name or by a selector and index number for element names rebuilt dynamically when loaded (i.e. secondary fields, Settings window buttons).

Notes:
- The audio element is NOT in the DOM (`new Audio()` without append), so `document.querySelector("audio")` returns null and dispatching a synthetic `timeupdate` is a no-op. Read audio state from the display elements (`#time-pos`, `#time-dur`, `#vol-slider`, `#speed-val`) and use real playback (Space + wait + Space) when a `timeupdate` is needed.
- Some helpers live inside individual spec files instead of the shared helper (e.g. `lyricLinesText` in `sync-adjust.spec.js` and `intervals.spec.js`) — check the spec file itself before reaching for one.