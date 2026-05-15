See this [Obsidian Share Note](https://share.note.sx/9wimmaly) for what's planned in the near future.

#### Architecture and environment

LineByLine is a no-dependencies 2.6k+ LOC. .html file (with JavaScript and CSS all inside). It was originally built with Claude Sonnet 4.6 in [claude.ai](https://claude.ai/) Projects and uses [these](https://github.com/amokprime/linebyline/tree/main/archive/ai_instructions) skills and instructions. Any comparable model that can work with files (i.e. GLM in [Z.ai](https://chat.z.ai/) Agent mode web chat) should also be able to follow the skills and instructions. If you use z.ai specifically, avoid peak hours.

#### Organization

The guidelines below are designed for a free account AI web chat without access to your filesystem. If using Claude Code, OpenCode, etc., you might find it more efficient to just ask it to make all the changes directly.

Put each new version of LineByLine and its companion .md file into its own semantically numbered folder in [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic). Tell the AI a version keyword to get it to automatically name the app version and .md file following [Project.md](https://github.com/amokprime/linebyline/tree/main/archive/ai_instructions/Project.md) instructions:

| Scope of your changes                     | Version keyword | Resulting number change |
| ----------------------------------------- | --------------- | ----------------------- |
| Quick hotfix of a patch or minor feature  | Same            | 0.34.9 → 0.34.9         |
| Bug fixes and refining existing features  | Patch           | 0.34.9 → 0.34.10        |
| New features that fit into existing ones  | Minor           | 0.34.9→ 0.35.0          |
| Refactoring that breaks existing features | Major           | 0.34.9 → 1.0.0          |
Rename the folder manually with the same number. If the AI forgets to update the version or does it wrong, edit the app's filename (i.e. linebyline-0.34.7.html) and the HTML `<title>` element (i.e. `<title>LineByLine 0.34.7</title>`).

#### CI

Any changes must pass CodeQL and SonarQube Cloud GitHub Actions.

LineByLine has two types of QA tests: Playwright and [MANUAL.md.](https://github.com/amokprime/linebyline/tree/main/tests/MANUAL.md). You don't have to do either of these for now. Just leave the existing Playwright test files and folders (such as snapshots) alone so that I can access them on my end when I checkout your PR.

#### Running tests

This section may be replaced by Playwright CI in the future.

If you want to run the Playwright tests yourself, see [PLAYWRIGHT_SETUP.md](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md). I am working from Windows and only test Firefox for now. For other platforms and browsers, you'd have to delete existing snapshots and generate your own (this mess is why I'm not asking people to do this for now). 

The `ff` .bashrc alias in the setup file starts a local server from the highest-version semantic app version (which expects the naming convention in the Organization section), then checks every second for it to come online before starting `test --ui` and Codegen. You may need to customize it and other setup details if your platform and browser differ. Run all the tests from the Playwright Test window (it defaults to 4 workers at a time), then run them all again if any were missing snapshots. 

The following Playwright tests are known to fail as of version 0.35.18:

| Test file             | Line | Test name            | Issue                                                                                                                                                                            |
| --------------------- | ---- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessibility.spec.js | All  | All                  | Many, this is a top priority for next version                                                                                                                                    |
| settings.spec.js      | 36   | persistence          | Playback speed field doesn't reset with page reload.                                                                                                                             |
| undo-redo.spec.js     | 27   | import-one-secondary | Undo import doesn't work in secondary fields.                                                                                                                                    |
| undo-redo.spec.js     | 70   | sync-repeat          | Two undoes are required per sync except first line. Similar to undoing multiline edits in Typing mode with Settings/ Undo window set to 1ms, except sync is done in Hotkey mode. |
Open a new Issue if you find:
- Other latent bugs that also exist in the latest main branch version
- Brittle tests that fail at first and only pass on second run (except if caused by missing snapshots the first run)
- Genius website changed, breaking extraction in the latest app version in main branch and invalidating the current [mock.txt](https://github.com/amokprime/linebyline/tree/main/tests/media/mock.txt) file

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
`tabUntilFocused` holds `Tab` until a certain element is focused. It is only used in keyboard-nav.spec.js for now. It refers to elements either by their HTML fixed locator name or by a selector and index number for element names rebuilt dynamically when loaded (i.e. secondary fields, Settings window buttons).
`media` is used to import audio and main field lyrics; `readMedia` loads a .lrc file to the clipboard for paste tests; `importSecondary` imports secondary field lyrics.