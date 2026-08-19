### General vibecoding workflow in OMP

WIP

### General vibecoding workflow in web chats

LineByLine was originally built with Claude Sonnet 4.6 in [claude.ai](https://claude.ai/) Projects. Any comparable model that can accept zip/code file uploads and generate code files for download should also work. Use a Chromium-based browser (e.g. Helium) with uBlock Origin or Adguard Adblocker. The web chat rendering for claude.ai and chat.z.ai relies on backends that Firefox lacks, resulting in CPU and memory usage spikes that slow things down to a crawl.

The guidelines below are designed for a free account AI web chat without access to your filesystem. You may be able to install Claude Desktop on Windows, but I haven't had a good experience with the Filesystem or GitHub MCP connectors. If using Claude Code, OpenCode, etc., you might find it more efficient to just ask it to make all the changes directly.

Put the associated chat transcript for new version of LineByLine into its own semantically numbered folder in [archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic). Overwrite [docs/index.html](https://github.com/amokprime/linebyline/tree/main/docs/index.html) with the actual `.html` file. You can tell the AI a keyword for the next version to get it to automatically rename the folder, or fill out [ai/chat.z.ai/Build.md](https://github.com/amokprime/linebyline/tree/main/ai/chat.z.ai/Build) to help it [infer](https://github.com/amokprime/linebyline/tree/main/ai/chat.z.ai/skills/project-workflow-SKILL.md) the appropriate version.

| Scope of your changes                                                         | Version | Resulting number change |
| ----------------------------------------------------------------------------- | ------- | ----------------------- |
| Quick hotfix of a patch or minor feature                                      | Same    | 0.34.9 → 0.34.9         |
| Bug fixes and refining existing features                                      | Patch   | 0.34.9 → 0.34.10        |
| New features that fit into existing ones and invisible code quality refactors | Minor   | 0.34.9→ 0.35.0          |
| Refactoring that visibly breaks existing features                             | Major   | 0.34.9 → 1.0.0          |
Rename the folder manually with the same number. If the AI forgets to update the version or does it wrong, edit the app's filename (i.e. linebyline-0.34.7.html) and the HTML `<title>` element (i.e. `<title>LineByLine 0.34.7</title>`).
