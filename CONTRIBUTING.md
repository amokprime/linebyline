See this [Obsidian Share Note](https://share.note.sx/9wimmaly) for what's planned in the near future.

### Architecture and environment

LineByLine is a no-dependencies 2.7k+ LOC. .html file (with JavaScript and CSS all inside). It was originally built with Claude Sonnet 4.6 in [claude.ai](https://claude.ai/) Projects and uses [these](https://github.com/amokprime/linebyline/tree/main/archive/ai_instructions) skills and instructions. Any comparable model that can work with files (i.e. GLM in [Z.ai](https://chat.z.ai/) Agent mode web chat that I currently use) should also be able to follow the skills and instructions. Use a Chromium-based browser (e.g. Helium) with uBlock Origin or Adguard Adblocker. The web chat rendering for claude.ai and chat.z.ai relies on backends that Firefox lacks, resulting in CPU and memory usage spikes that slow things down to a crawl.

### General workflow for web app vibe coding

The guidelines below are designed for a free account AI web chat without access to your filesystem. You may be able to install Claude Desktop on Windows, but I haven't had a good experience with the Filesystem or GitHub MCP connectors. If using Claude Code, OpenCode, etc., you might find it more efficient to just ask it to make all the changes directly.

Put each new version of LineByLine and its companion .md file into its own semantically numbered folder in [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic). Tell the [AI](https://github.com/amokprime/linebyline/tree/main/archive/ai) a version keyword to get it to automatically name the app version and .md file:

| Scope of your changes                                                         | Version | Resulting number change |
| ----------------------------------------------------------------------------- | ------- | ----------------------- |
| Quick hotfix of a patch or minor feature                                      | Same    | 0.34.9 → 0.34.9         |
| Bug fixes and refining existing features                                      | Patch   | 0.34.9 → 0.34.10        |
| New features that fit into existing ones and invisible code quality refactors | Minor   | 0.34.9→ 0.35.0          |
| Refactoring that visibly breaks existing features                             | Major   | 0.34.9 → 1.0.0          |
Rename the folder manually with the same number. If the AI forgets to update the version or does it wrong, edit the app's filename (i.e. linebyline-0.34.7.html) and the HTML `<title>` element (i.e. `<title>LineByLine 0.34.7</title>`).

#### Working with GLM (web chat Agent mode)

chat.z.ai's free tier is currently far more generous overall with some caveats:
- I have noticed as many as 2k ads being blocked by uBlock Origin! It keeps ramping up over time.
- The website itself is often unresponsive even in Chromium browsers (I wonder why??). It may help to close the browser window and reopen the page (just reloading or closing the browser tab isn't always enough)
- A captcha slider randomly pops up sometimes
- Sessions expire after 2 hours. After that, start a new Agent chat, because the originally uploaded files vanish and newly uploaded files fail to persist. Work around by typing something before it expires to reset the timer to another 2 hours.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder
- Downgrade to a lower model, chats failing to submit or load or timing out, during peak hours (really just all the time now since GLM-5.2 release)

There are also no built-in skills or memory scaffolding to enforce a large amount of recurring behaviors. The more competing demands, the less likely any of them are to be remembered, much less followed. The latest planned workflow is to upload just-in-time, explicitly telling the agent what to read and follow on the spot without trusting its memory (Chat.md, project-workflow-SKILL.md).

##### [Repomix](https://repomix.com/)

This makes repetitive uploads more manageable than the zip folder of symlinks I used for a while. To prepare the global install I ran `npm config set prefix "~/.npm-global"` and added `set -x PATH $HOME/.npm-global/bin $PATH` to my `~/.config/fish.config`.
`/**` = everything in the folder. If you rerun the command on the same output file the old one is overwritten. Example syntax:
```sh
repomix --output "local/repomix-output.xml"\
--include "ai/z-ai-glm/skills/**,archive/modular/**,docs/**,tests/**,\
HELP.md,package.json,playwright.config.js,README.md" \
--ignore "ai/z-ai-glm/skills/chat/**,\
tests/prompts/**,tests/media/10k_lines.lrc,\
tests/media/naughty-strings.json,archive/modular/plan/1-Playwright/5.md"
```

#### Working with Claude Sonnet (web chat/Claude Desktop)

Warning: I stopped maintaining Claude's skills after 0.35.19. You might have to backport some more updated information from GLM's instructions.
claude.ai has extremely strict free plan 5-hour limits. Fill out the preferences and project instructions and add the skills, and turn on memory. Use the Espanso and Fish helpers to share terminal output. Occasionally upload a Repomix or zip of all chat logs since last skill update and ask Claude to update them or create new ones (it has a skill-creator skill).

#### CI

Any changes to the app code must pass CodeQL and SonarCloud GitHub Actions. ⚠️These are currently broken pending review of a flag on my account.⚠️ When Sonar issues are found, fetch them with the [sonar-issue-exporter](https://github.com/amokprime/sonar-issue-exporter) tool and put them in an "issues" folder inside the app version folder, minus the why.md and how.md files (they're public information but also technically Sonar IP which conflicts with LineByLine's GPL 3 license).

LineByLine has two types of QA tests: Playwright and [MANUAL.md.](https://github.com/amokprime/linebyline/tree/main/tests/MANUAL.md). You don't have to do either of these for now. Just leave the existing Playwright test files and folders (such as snapshots) alone so that I can access them on my end when I checkout your PR.

#### Running tests

This section will be replaced by Playwright CI in the future. 🚧Tests/snapshots are being rewritten/regenerated for Linux and may change abruptly at this time.🚧

LineByLine uses a [split test architecture](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md):
- Podman container, headless: runs all 3 browsers (Chromium, Firefox, Webkit). Use to verify tests that have already been tested in UI Mode.
- Host `npm`, UI mode: runs 2 browsers (Chromium, Firefox) with interactive UI. Use to help write tests initially and as a sanity check (sometimes headless tests break in UI mode and vice versa).

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
- `tabUntilFocused` holds `Tab` until a certain element is focused. It is only used in keyboard-nav.spec.js for now. It refers to elements either by their HTML fixed locator name or by a selector and index number for element names rebuilt dynamically when loaded (i.e. secondary fields, Settings window buttons).
- These are only used in sync-adjust.spec.js for now:
	- `waitForImport` waits for the main lyrics to load, the first line to become active (left blue border), and audio metadata to load
	- `triggerTimeUpdate` forces the app to update the highlighted line and the time in the media box instead of waiting (which breaks in headless)
- `lyricLinesText` replaces flaky ARIA snapshots that broke in headless with a capture of the main lyrics as a single string of list items and newlines
- `media` is used to import audio and main field lyrics
- `readMedia` loads a .lrc file to the clipboard for paste tests
- `importSecondary` imports secondary field lyrics
