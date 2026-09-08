### ZCode

See [[ai/zcode/README|README]]. The generic root-level AGENTS.md and README.md also have specialized versions adopted for chat.z.ai.

### OMP

See [[ai/omp/OMP_SETUP|OMP_SETUP]] and [[ai/omp/README|README]]. Skills and other context files are already included in the repo. The config I committed enables the `local` memory subsystem, which starts from zero and consolidates lessons from your sessions into a project-specific folder like `~/.omp/agent/memories/--path-to-linebyline--`. Copy [[ai/omp/learned|learned.md]] into that folder to seed the project memory with historical lessons.

### Web chats

LineByLine was originally built with Claude Sonnet 4.6 in [claude.ai](https://claude.ai/) Projects. Any comparable model that can accept zip/code file uploads and generate code files for download should also work. Use a Chromium-based browser (e.g. Helium) with uBlock Origin or Adguard Adblocker. The web chat rendering for claude.ai and chat.z.ai relies on backends that Firefox lacks, resulting in CPU and memory usage spikes that slow things down to a crawl.

The guidelines below are designed for a free account AI web chat without access to your filesystem such as chat.z.ai. These tend to be more generous than free API providers, but will require more manual steps to work with.

See [ai/templates](https://github.com/amokprime/linebyline/tree/main/ai/templates) for blank transcript templates to paste in Obsidian. Trim unused turns at the end of the session. Other post-processing can be handled with 5 [Better Paste](https://github.com/johansan/better-paste/wiki/Snippets) plugin snippets. Copy the block below and use the `Import snippets` button.
```
# Remove bold from headings

s/(?<=^#{1,6} [^\n]*?)(?<!\\)\*\*([^\n]*?)(?<!\\)\*\*/$1/gm

# Remove italics from headings

s/(?<=^#{1,6} [^\n]*?)(?<!\\)[\*_]([^\n]*?)(?<!\\)[\*_]/$1/gm

# Remove backticks from headings

s/(?<=^#{1,6} [^\n]*?)(?<!\\)`([^`]*)`/$1/gm

# Demote headings

s/^(#{1,3}) /#### /gm

# Collapse blank lines

s/\n(?:[ \t]*\n){2,}/\n\n/g
```

Put the associated chat transcript for new version of LineByLine into its own semantically numbered folder in [archive/modular](https://github.com/amokprime/linebyline/tree/main/archive/modular).

| Scope of your changes                                                         | Version | Resulting number change |
| ----------------------------------------------------------------------------- | ------- | ----------------------- |
| Quick hotfix of a patch or minor feature                                      | Same    | 0.34.9 → 0.34.9         |
| Bug fixes and refining existing features                                      | Patch   | 0.34.9 → 0.34.10        |
| New features that fit into existing ones and invisible code quality refactors | Minor   | 0.34.9→ 0.35.0          |
| Refactoring that visibly breaks existing features                             | Major   | 0.34.9 → 1.0.0          |
Rename the folder with the same number. If the AI forgot to update the app version or does it wrong, edit the app's filename (i.e. linebyline-0.34.7.html) and the HTML `<title>` element (i.e. `<title>LineByLine 0.34.7</title>`).