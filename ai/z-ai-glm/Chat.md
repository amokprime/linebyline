This is an experimental procedure that uploads 4 zip files at different points in one session instead of 1 large zip at the start.
#### Phase 1
- Create and upload a new 1_onboard.zip from:
	- 1_onboard (folder)
		- project-workflow-SKILL.md (symlink)
		- README.md (symlink)
- Paste before the period the latest app name (i.e. `F2` → `Ctrl+C` → `Ctrl+V` → linebyline-0.37.1.html). Then paste in chat:
```
The current app is . Read 1_onboard.zip contents.
```
- Move to Phase 2 if the AI has no further requests for clarification

#### Phase 2
- Create and upload a new 2_work.zip from:
	- 2_work (folder)
		- browser-hotkey-system-SKILL.md (symlink)
		- linebyline-section-index-SKILL.md (symlink)
		- single-file-html-app-SKILL.md (symlink)
		- Memory.md (symlink)
		- Prompt.md (symlink)
		- latest (symlink to latest app folder)
- Paste in chat:
```
Re-read project-workflow-SKILL.md, then start "Phase 2 — Work".
```
- Move to Phase 3 after work is complete

#### Phase 3
- Create and upload a new 3_pre-push.zip from:
	- 3_pre-push (folder)
		- tests (folder)
			- helpers (folder)
				- index.js (symlink)
			- accessibility.spec.js (symlink)
			- fields-merge.spec.js (symlink)
			- import-paste.spec.js (symlink)
			- intervals.spec.js (symlink)
			- key-guard.spec.js (symlink)
			- keyboard-nav.spec.js (symlink)
			- logic.spec.js (symlink)
			- MANUAL.md (symlink)
			- mark.spec.js (symlink)
			- playback.spec.js (symlink)
			- settings.spec.js (symlink)
			- smoke.spec.js (symlink)
			- sync-adjust.spec.js (symlink)
			- theme-font.spec.js (symlink)
			- typing-mode.spec.js (symlink)
			- undo-redo.spec.js (symlink)
		- aria-accessibility-SKILL.md (symlink)
		- code-quality-SKILL.md (symlink)
		- playwright-testing-SKILL.md (symlink)
- Paste in chat:
```
Re-read project-workflow-SKILL.md, then start "Phase 3 — Pre-push audit".
```
- Move to Phase 4 after:
	- All tests pass
	- All new tests are read and reviewed in ui mode

#### Phase 4 (SonarQube Cloud scan clean✅)
- Create and upload a new 4_post_push_clean.zip from:
	- 4_post_push_clean (folder)
		- skill-SKILL.md (symlink)
- Paste in chat:
```
Re-read project-workflow-SKILL.md, then start "Phase 4 — Post-push (conditional)".
```

#### Phase 4 (SonarQube Cloud issues found❌)
- Create and upload a new 4_post_push_issues.zip from:
	- 4_post_push_issues (folder)
		- issues (folder, generated with exporter script in other repo)
		- skill-SKILL.md (symlink)
		- sonarqube-workflow-SKILL.md (symlink)
- Paste in chat:
```
Re-read project-workflow-SKILL.md, then start "Phase 4 — Post-push (conditional)".
```