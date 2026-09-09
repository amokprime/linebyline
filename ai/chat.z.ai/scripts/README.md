---
summary: Scripted Repomix slices of the LineByLine repo to combine into vibecoding workflows. Reduces context load compared to a naive `repomix` on the whole project. For use with web chat agents like chat.z.ai.
links:
  - "[[ai/chat.z.ai/Vibecoding workflow|Vibecoding workflow]]"
---
## Workflows

*Prepare local project files for upload.*

### onboard.sh
- Workflows always start with the Onboard step, including dedicated sessions:
```
Follow `*-SKILL.md` files as rules. This is the Onboard step.
```

### build.sh
- `package.json` is provided in Onboard; `package-lock.json` is omitted (too large; `npm install` works without it for non-reproducible installs)
- The `src/**` + `tests/unit/**` + tsconfig bundle lets the agent run `npm install && npm run test:unit` (~103 specs, ~7s) in-sandbox as a build-test loop after patching `src/` modules
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Build step.
```

### review.sh
- Check new code pre-commit
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Review step — use the review skills to screen for new code issues pre-commit.
```
- Remediate post-push SonarCloud issues
```
Re-read `project-workflow-SKILL.md` and the review skills. Follow `*-SKILL.md` files as rules. This is the Review step again post-push — use the review skills to patch SonarCloud issues.
```

### test.sh
- Patch failing tests (including newly written) after the Build step and pre-commit:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Test step — use the Playwright skill to patch the failed tests.
```
- Generate new tests or helpers for new features added in the Build step:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Test step — use the Playwright skill to:
<Add specific requests>
```
- Follow Onboard in a dedicated testwriting session:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is primarily a testwriting session. However, tell me if you suspect app code to be at fault with any failing tests.
```

### skills.sh
- The Skills step typically follows Onboard in a dedicated non-code session:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This will be a meta-session involving work on agent scaffolding for fresh chats.
```

## Delivery

*Batch "install" downloaded files the agent generated.*

### prepare.sh
- The agent fills out this template to funnel all "deliverables", including `deploy.sh`, into a `deliver.zip` file in its downloads folder—aka the "All files in task" window. The new modular architecture is spread across too many files to individually download, rename, and move manually.

### deploy.sh
- This copies changed files (not byte-identical to target) to the repo folder from the downloaded and unzipped files like a package installer. Unchanged files are removed without copying to avoid polluting timestamps.

### unpack.sh
- This is a wrapper to unzip `deliver.zip`, run `deploy.sh`, optionally run Playwright tests, and then cleanup the zip and deploy script.

## Setup
- Scripts default to the repo root `~/GitHub/linebyline`; set the `LINEBYLINE_ROOT` environment variable to point somewhere else
- `repomix` is looked up in `~/.npm-global/bin` and then the rest of `PATH`; install it there or adjust `PATH` in `.base.sh`
- If not on a Fedora distro, replace `wl-copy` with the equivalent
- Make the scripts executable (except for `.bash.sh`, `prepare.sh`, and `deploy.sh`). Then configure `.bash.sh` and `unpack.sh`.
	- They assume that the repo is at `~/GitHub/linebyline`, and that the zip is downloaded into `~/GitHub/linebyline/scratch/`
	- If your paths differ, customize paths and add an exception for `unpack.sh`'s path (i.e. `nano .git/info/exclude`)
	- The Workflow scripts can be blindly double-clicked after setup, but `unpack.sh` should be run from the terminal to view output

## Features
- Fails fast in strict mode (`set -euo pipefail`): if repomix or zip fails, the script aborts before deleting anything or copying a stale path to the clipboard
- Zips the upload folder's visible files, then clears the folder so the next run starts fresh
- Runs one of the scripts in this directory, except for `blank.sh` which can be used for uploads of non-Repomix files
- `blank.sh` aborts with an error if the upload folder is empty (nothing to zip)
- Gives each zip file a unique name to prevent upload filenames colliding with stale server-side files. It's the current date in nanoseconds (`date +%s%N`), which should also help in tracing future upload bugs
- Copies the zip file's path to clipboard with `wl-copy` to paste into file picker path field when uploading
