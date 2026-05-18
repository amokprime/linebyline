Don't generate your own icons; prioritize any I upload, then Lucide icons. Don't add code that links to external websites besides GitHub. Ask before building if:
1. You have any concerns
2. Any files I reference or that you need to clarify something are missing
3. Technical limitations make any request infeasible

Follow these steps when building a code file:
1. Patch with minimal diff — change only what's needed and preserve surrounding code. Prefer targeted edits over full-section rewrites unless the section is being restructured.
2. Check
	1. The patched file passes `new Function` syntax check
	2. The SECTIONS index line numbers are still accurate (run the grep and compare)
	3. If the patch touched any function referenced by the section index, spot-check that the function still exists at its declared line
	4. If the patch changed any logic (not just formatting), trace one representative user action through the changed code path to confirm it still reaches the expected outcome
3. Update
	1. Re-index the section index skill if line numbers shifted
	2. Update Memory.md if
		1. You finished a new, distinctive set of code changes
		2. A code change failed in a way that would surprise you in a fresh chat if it wasn't documented in Memory.md
	3. Update a skill when a patch changes the architecture that the skill documents (e.g., extracting `handleSecKeydown` to outer scope changes the section index skill, adding a new restricted key changes the hotkey skill)
	4. Don't update a skill when the patch is a pure bug fix that doesn't change the documented architecture
4. *Each turn*, without prompting, update any of these files that already exist, then copy *only* files you created or updated (without extra subfolders) to downloads
    1. Version the code file semantically (i.e. `<title>LineByLine 0.34.9</title>` , "linebyline-0.34.9.html") based on keywords I provide. Don't change version on your own initiative or substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just titles.
        - Same: 0.34.9 → 0.34.9
        - Patch: 0.34.9 → 0.34.10
        - Minor: 0.34.9→ 0.35.0
        - Major: 0.34.9 → 1.0.0
    2. Skip in-chat prose output for a code file you built and instead present a companion .md file (i.e. linebyline-0.34.9.html → linebyline-0.34.9.md). If the version is to be kept the same and the file already exists, update it.
	    1. Include each turn leading up to and working on that code file version only
	    2. Prepend or update frontmatter at the start listing the model and a 1-2 sentence summary of the companion file's contents like the below example. Sometimes this may already partially exist from a Prompt.md file I upload.
	    ```md
---
model: GLM-5.1
summary: Split activeLine/playingLine, fix highlight offset timing
---
	    ```
		3. Append per turn (separate my text from yours with a "---" line)
			1. The turn number in a header
			2. My prompts verbatim
				1. Include the full contents of Prompt.md if uploaded
			2. Your prose output, including any skills you updated
				1. Use "about" to express approximation instead of "~"