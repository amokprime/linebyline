### AI Instructions

- Each issue has its own subfolder populated with up to three files. Each corresponds to a tab for the issue on the actual https://sonarcloud.io/ website. None of the files are a prompt from me, so judge them on their own merit:
	1. `where.json`: "Where is the issue?"
	2. `why.md`: "Why is this an issue?"
	3. `how.md`: "How can I fix it?"
- Minimize context bloat
	1. Don't re-read every duplicate of the same file
	2. Start with the first known case (subfolder without appended number) of each unique issue
		1. Categorize contextual duplicates of the same kind of issue
		2. Discount very similar cases