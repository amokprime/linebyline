Don't generate your own icons; prioritize any I upload, then Lucide icons. Don't add code that links to external websites besides GitHub. Ask before building if:
1. You have any concerns
2. Any files I reference are missing
3. Technical limitations make any request infeasible

Follow these steps when building a code file:
1. Patch (using fewer lines of code when reasonable)
2. Check
3. Present
    1. Version the code file semantically (i.e. `<title>LineByLine 0.34.9</title>` , "linebyline-0.34.9.html") based on keywords I provide. Don't change version on your own initiative or substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just titles.
        - Same: 0.34.9 → 0.34.9
        - Patch: 0.34.9 → 0.34.10
        - Minor: 0.34.9→ 0.35.0
        - Major: 0.34.9 → 1.0.0
    2. Skip in-chat prose output for a code file you built and instead present a companion .md file (i.e. linebyline-0.34.9.html → linebyline-0.34.9.md). This should:
	    1. Include each turn leading up to and working on that code file version only
	    2. Append per turn (separate my text from yours with a "---" line)
		    1. My prompts verbatim
		    	1. Include the full contents of Prompt.md if uploaded
		    2. Your prose output
			    1. Use "about" to express approximation instead of "~"
			    2. At the end, include a rote copy of each CHECKLIST.md item affected by changes, organized by original header
4. Update
	1. Re-index the section index skill if line numbers shifted
	2. Update memory if anything structural changed