See this [Obsidian Share Note](https://share.note.sx/9wimmaly) for what's planned in the near future.

### Architecture and environment

LineByLine is a no-dependencies 2.7k+ LOC. .html file (with JavaScript and CSS all inside). It was originally built with Claude Sonnet 4.6 in [claude.ai](https://claude.ai/) Projects and uses [these](https://github.com/amokprime/linebyline/tree/main/archive/ai_instructions) skills and instructions. Any comparable model that can work with files (i.e. GLM in [Z.ai](https://chat.z.ai/) Agent mode web chat that I currently use) should also be able to follow the skills and instructions. Use a Chromium-based browser with uBlock Origin or Adguard Adblocker. The web chat rendering for claude.ai and chat.z.ai relies on backends that Firefox lacks, resulting in CPU and memory usage spikes that slow things down to a crawl.

### General workflow

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
- I have noticed as many as 2k ads being blocked by uBlock Origin! It starts at a few hundred and just keeps ramping up over time.
- The website itself is often unresponsive even in Chromium browsers (I wonder why??). It may help to close the browser window and reopen the page (just reloading or closing the browser tab isn't always enough)
- A captcha slider randomly pops up sometimes
- Sessions now expire after 2 hours. After that, start a new Agent chat, because the originally uploaded files vanish and newly uploaded files fail to persist. Work around by typing something before it expires to reset the timer to another 2 hours.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder
- Downgrade from GLM-5.2 to a lower model, chats failing to submit or load or timing out, during peak hours

There are also no built-in skills or memory scaffolding to enforce a large amount of recurring behaviors. The more competing demands, the less likely any of them are to be remembered, much less followed. The latest planned workflow is to upload just-in-time, explicitly telling the agent what to read and follow on the spot without trusting its memory (Chat.md, project-workflow-SKILL.md).

##### [Repomix](https://repomix.com/)

This makes repetitive uploads more manageable than the zip folder of symlinks I used for a while. To prepare the global install I ran `npm config set prefix "~/.npm-global"` and added `set -x PATH $HOME/.npm-global/bin $PATH` to my `~/.config/fish.config`.
`/**` = everything in the folder. If you rerun the command on the same output file the old one is overwritten. Example syntax:
```sh
repomix --output local/linebyline.xml \
--include "ai/z-ai-glm/skills/**,archive/modular/**,docs/**,tests/**,\
CONTRIBUTING.md,HELP.md,\
package.json,playwright.config.js,README.md" \
--ignore "ai/z-ai-glm/skills/chat/**,tests/prompts/**"
```

##### [Espanso](https://espanso.org/docs/matches/extensions/#clipboard-extension)

Use these to either run a command directly from a markdown editor like Obsidian and print output to a codeblock in the same file, or paste into a codeblock. Not recommended for Playwright tests with many screens of output. Syntax will vary if you're not on Fedora or don't use Fish shell (i.e. Bash would be `bash -c`). `ansi2txt` and `export` (which includes `unbuffer`) may need to be installed. Fancy output like Playwright tests and Python messages may look strange without them.

File: `~.config/espanso/match/youreditor.yml`
```yml
global_vars:
  - name: "printoutput"
    type: "shell"
    params:
      cmd: 'unbuffer fish -c "$(wl-paste 2>/dev/null || echo '''')" 2>&1 | ansi2txt'
      trim: true
  - name: "pasteclipboard"
    type: "clipboard"
matches:
  - trigger: "//.."
    replace: "```sh\n{{printoutput}}\n```\n"
  - trigger: "//sh"
    replace: "```sh\n{{pasteclipboard}}\n```\n"
```

#### Fish shell config

Like the Espanso `//..`snippet, but for logging very long output like Playwright tests. Type the abbreviation (`psl` in this case) to grab a copied command and append its output to a log file you can upload to the AI. You can also use the Bash compatible `alias "abbreviation" 'command'` syntax if you don't need to edit the log destination or filename.

File: `~/.config/fish/config.fish`
```fish
if status is-interactive

abbr --add psl 'unbuffer fish -c "$(wl-paste 2>/dev/null || echo '''')" 2>&1 | ansi2txt | tee -a local/output.log'

end
```

#### Working with Claude Sonnet (web chat/Claude Desktop)

Warning: I stopped maintaining these after 0.35.19. You might have to backport some more updated information from GLM's instructions.
claude.ai has extremely strict free plan 5-hour limits. Fill out the preferences and project instructions and add the skills, and turn on memory. Occasionally upload a Repomix or zip of all chat logs since last skill update and ask Claude to update them or create new ones (it has a skill-creator skill).

#### CI

Any changes to the app code must pass CodeQL and SonarQube Cloud GitHub Actions. ⚠️These are currently broken pending review of a flag on my account.⚠️ When Sonar issues are found, fetch them with the [sonar-issue-exporter](https://github.com/amokprime/sonar-issue-exporter) tool and put them in an "issues" folder inside the app version folder, minus the why.md and how.md files (they're public information but also technically Sonar IP which conflicts with LineByLine's GPL 3 license).

LineByLine has two types of QA tests: Playwright and [MANUAL.md.](https://github.com/amokprime/linebyline/tree/main/tests/MANUAL.md). You don't have to do either of these for now. Just leave the existing Playwright test files and folders (such as snapshots) alone so that I can access them on my end when I checkout your PR.

#### Running tests

This section will be replaced by Playwright CI in the future.

If you want to run the Playwright tests yourself, see [PLAYWRIGHT_SETUP.md](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md). 🚧I am in the process of starting to rebuild snapshots for Linux and refactor tests that break in headless mode.🚧

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
