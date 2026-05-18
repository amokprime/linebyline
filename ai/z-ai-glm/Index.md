This file explains where important files are located and what they are for.

linebyline/ - minimal flattened copy of repo folder containing:
- skills/ - Critical information about app architecture and purpose
- app/ - App code and detailed context from last session. issues/ and playwright/ may not always be present. If there are subfolders for more than one app version, the highest semver is the latest one. Let me know if you need to see files from a missing older version referenced by Memory.md.
	- linebyline-X.X.X.html - current version of the app. Start from whatever this semver number (X.X.X) is for version changes.
	- linebyline-X.X.X.md - that app version's AI chat transcript
	- issues/ - SonarQube Cloud reports (security, code smells, etc.)
	- playwright/ - Playwright test errors
- tests/ - Files used by me in original manual tests and Playwright for automated tests
	- helpers/
		- index.js - starts local server from highest version of LineByLine and contains code-saving constants
	- prompts/ - Previous AI chats about Playwright test writing. Lowest number oldest → highest number newest.
	- media/ - all files to be used by Playwright, or by me in manual tests. Streamlined from original "music" folder (removed) for cleaner test-files.js
	- MANUAL.md - remaining manual tests *not* automated by Playwright
	- \*spec.js - Playwright test files
- playwright.config.js - Playwright config
- package.json - repo README summary and Playwright dependencies

Memory.md - condensed lessons learned or decisions learned by you or other models while building the app. Newest first.
Project.md - how you should build files for LineByLine
Prompt.md - the latest round of specific changes you will make for LineByLine