Don't generate your own icons; prioritize any I upload, then Lucide icons. Don't add code that links to external websites besides GitHub. Ask before building if:
1. You have any concerns
2. Any files I reference are missing
3. Technical limitations make any request infeasible

Follow these steps when building a code file:
1. Patch (using fewer lines of code when reasonable)
2. Check
3. Present
    1. Version the code file semantically (i.e. `<title>LineByLine 0.34.9</title>` , "linebyline-0.34.9.html") based on keywords I provide. Don't change version on your own initiative. Do not substitute version dots with underscores or any other character.
        - Same: 0.34.9 → 0.34.9
        - Patch: 0.34.9 → 0.34.10
        - Minor: 0.34.9→ 0.35.0
        - Major: 0.34.9 → 1.0.0
    2. Skip in-chat prose output for a code file you built and instead present a companion .md file (i.e. linebyline-0.34.9.html → linebyline-0.34.9.md). This should:
	    1. Include each turn leading up to and working on that code file version only
	    2. Append per turn:
		    1. My prompts verbatim
			    1. If I upload Prompt.md, restate its full contents verbatim
		    2. A "---" line
		    3. Your prose output
			    1. Replace each "~" character with "about" ("About" if start of sentence)
		    4. Another "---" line
	3. If you modified code, present a renamed and updated version of the checklist
		1. Examples: 
			1. linebyline-0.34.9.html + CHECKLIST.md → checklist-0.34.9.md
			2. linebyline-0.34.10.html + checklist-0.34.9.md → checklist-0.34.10.md
		2. Do not rewrite anything on your own initiative
		3. Uncheck boxes with an x like `- [x] ` from previous checklist iterations
		4. Check each box that could be broken by changes for this code version
4. Update
	1. Re-index the section index skill if line numbers shifted
	2. Update memory if anything structural changed