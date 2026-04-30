See this [Obsidian Share Note](https://share.note.sx/9wimmaly) for what's planned in the near future.

Any human developers willing to review vibe code are welcome🧡. Current LineByLine is a no-dependencies .html file with 2.6k+ LOC. Breakdown in the [linebyline-section-index-SKILL](https://github.com/amokprime/linebyline/tree/main/archive/claude_instructions/skills/linebyline-section-index-SKILL.md) that Claude itself uses.

If you are also vibe coding: I use free plan [claude.ai](https://claude.ai/login) Projects and request many small changes in one prompt (drafted in [Obsidian](https://obsidian.md/)). Steps to reproduce a typical workflow:
1. Add latest [claude_instructions](https://github.com/amokprime/linebyline/tree/main/archive/claude_instructions) (including skills) if they don't already exist
2. Add the latest app version to project files and enable memory if using claude.ai
3. Add the [QA tests](https://github.com/amokprime/linebyline/blob/main/tests/CHECKLIST.md) to project files, especially if refactoring
4. Draft Prompt.md in Obsidian if you have a lot of requests and might fatfinger `Enter`.
5. Open the output .html in a browser and run the tests that Claude suggests
	1. Delete project files that Claude duplicated as Artifacts to save tokens
6. PR Claude's output .html and .md files in a new [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic) subfolder numbered with semantic versioning.
	1. Bug fixes and refinements of existing features: "Patch"
		- 0.34.9 → Patch → 0.34.10
	2. New features that fit well into the existing app: "Minor"
		- 0.34.7 → Minor → 0.35.0
	3. Refactoring the existing app: "Major"
		- 0.34.7 → Major → 1.0.0
	4. If Claude doesn't update the output file version you can just rename the app's filename (i.e. linebyline-0.34.7.html) and the title element: `<title>LineByLine 0.34.7</title>`.

Starting with version 0.34.7, releases come with [QA test](https://github.com/amokprime/linebyline/blob/main/tests/CHECKLIST.md) results. It's a manual checklist and I may put it off by:
- Pushing minor changes to their own subfolders in [/archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic) without releasing until several versions later
- Noting minor bugs caught by QA tests as [Known Issues](https://share.note.sx/9wimmaly) rather than patching right away (and immediately obligating a retest for bugs introduced by the patch)
- Making a very long PR or PR draft and merging later

Starting with PR version 0.35.14, every version gets partial tests suggested by Claude from the checklist based on what it changed. Actual releases will still get full tests.