The front-facing context files in this repo are designed for a cloud sandbox agent (chat.z.ai) that builds and tests most code. You (the OMP agent) will work with the existing local checkout of the same repo (`~/GitHub/linebyline/`, literally this project) for relatively lightweight tasks such as:
- Troubleshooting bugs that cannot be reproduced in the cloud sandbox (i.e. due to a local environment quirk). Usually this involves scripts, but sometimes test or app code may share the blame.
- Patching SonarCloud issues when the chat.z.ai session is 15+ turns in
- Updating stale documentation or agent context files
Therefore, you have your own context files, sandbox rules, and a subset of relevant skills.
### Project structure
- `/` — Project docs for humans (`CONTRIBUTING.md`, `HELP.md`, `README.md`, `LIMITATIONS.md`, `SECURITY.md`, `CREDITS.md`, `AGENTS.md`, `MEMORY.md`). Evaluate for stale references when the relevant area changes.
- `.github/` — Issue templates and GitHub Actions workflows (`codeql.yml`, `playwright.yml`, `sonarcloud.yml`, `deploy.yml`, `sync-staging.yml`).
- `ai/` — Vibecoding docs for humans: `README.md`, `Vibecoding workflow.md` (the high-level workflow flowcharts with division of labor), `Diagrammo flowcharts.md` (syntax reference for the `dgmo` codeblocks), `templates/` (blank Obsidian transcript templates for archiving chat sessions).
- `archive/` — AI chat transcripts and historical artifacts: `archive/modular/` (modular refactor plan + transcripts), `archive/semantic/` (pre-modular transcripts + Sonar issue exports), `archive/tests/` (test-writing transcripts), `archive/skills/` (skill-creation transcripts), `archive/scripts/` (script-creation transcripts + `autohotkey/`).
- `docs/` — `index.html` single-file LineByLine app code (the live monolith, pre-modular-refactor). This folder is also the GitHub Pages source until the Phase E cutover switches to `dist/`.
- `scripts/` — fish functions (`fish/tst.fish`, `fish/tsta.fish`, `fish/cgn.fish`, `fish/srv.fish`) and `README.md`
- `src/` — Modular Vite + Vue + Tailwind + shadcn-vue app (refactor in progress; see `ROADMAP.md`).
- `skills/`—The cloud agent's skill folder
	- `skills/delivery/scripts/`—Scripts used to quickly "install" files the cloud agent generated and packaged into a `deliver.zip` for download
- `tests/` — Playwright test suite and supporting docs (`SSH_SETUP.md`, `PLAYWRIGHT_SETUP.md`, `FAILURES.md`, `MANUAL.md`).
- `scratch/` — gitignored scratch directory. The user drafts prompts at `scratch/scratch.md` — do not save files at that name (collision).