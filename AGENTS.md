# LineByLine — project agent instructions

This file is a minimal pointer. Most agent-facing context lives in skills under `skills/` (auto-loaded into `available_skills` via `scripts/.setup-sandbox.sh`) and in `MEMORY.md`. If you're a fresh agent looking for onboarding, workflow, or project structure details, invoke `Skill(command="linebyline")` — that skill is the canonical onboarding + workflow reference.

## Why this file is minimal

Many projects put project structure, coding rules, test-running instructions, sandbox environment details, and consolidation direction in AGENTS.md. This project offloads those to skills instead, because the chat.z.ai sandbox auto-loads skill descriptions into the system prompt's `available_skills` list — skills are invokable on-demand without an explicit Read, and their descriptions surface proactively when the task matches. A bare AGENTS.md cannot do this; it must be Read explicitly every turn.

What would normally live here, and where it actually lives:

- **Onboarding + workflow** (steps, pre/post-patch checklists, versioning, deliver-zip) → `linebyline` skill (`Skill(command="linebyline")`)
- **Web channel behavioral rules** (file visibility, input handling, output format, comment density) → `delivery` skill
- **Sandbox vs. user-side environment** (which commands run in-sandbox vs. locally) → `delivery` skill → "Sandbox vs. user-side environment"
- **Test-running** (sandbox Vitest, sample Playwright, `tst`/`tsta`/CI environments) → `playwright-testing` skill
- **SonarCloud & CodeQL** (`sie` report, sandbox API fallback) → `sonarqube-workflow` skill
- **Consolidation direction** (skill vs. MEMORY.md vs. roadmap) → `skill` skill
- **Linting instructions** → automated by `skills/delivery/scripts/lint_markdown.py` (runs in `prepare.sh`)

## Project structure

- `/` — Project docs for humans (`CONTRIBUTING.md`, `HELP.md`, `README.md`, `LIMITATIONS.md`, `SECURITY.md`, `CREDITS.md`, `AGENTS.md`, `MEMORY.md`). Evaluate for stale references when the relevant area changes.
- `.github/` — Issue templates and GitHub Actions workflows (`codeql.yml`, `playwright.yml`, `sonarcloud.yml`, `deploy.yml`, `sync-staging.yml`).
- `ai/` — Vibecoding docs for humans: `README.md`, `Vibecoding workflow.md` (the high-level workflow flowcharts with division of labor), `Diagrammo flowcharts.md` (syntax reference for the `dgmo` codeblocks), `templates/` (blank Obsidian transcript templates for archiving chat sessions).
- `archive/` — AI chat transcripts and historical artifacts: `archive/modular/` (modular refactor plan + transcripts), `archive/semantic/` (pre-modular transcripts + Sonar issue exports), `archive/tests/` (test-writing transcripts), `archive/skills/` (skill-creation transcripts), `archive/scripts/` (script-creation transcripts + `autohotkey/`).
- `docs/` — `index.html` single-file LineByLine app code (the live monolith, pre-modular-refactor). This folder is also the GitHub Pages source until the Phase E cutover switches to `dist/`.
- `skills/` — Project skills (auto-load via `scripts/.setup-sandbox.sh`). Each skill lives at `skills/<name>/SKILL.md` with optional co-located `scripts/` (e.g. `skills/delivery/scripts/`).
- `scripts/` — `.setup-sandbox.sh` (skill installer), `blank.sh` + `.base.sh` (pure-zip utility for ad-hoc uploads), fish functions (`fish/tst.fish`, `fish/tsta.fish`, `fish/cgn.fish`, `fish/srv.fish`), `espanso/linebyline.yml` (Espanso snippets), and `README.md`.
- `src/` — Modular Vite + Vue + Tailwind + shadcn-vue app (refactor in progress; see `archive/modular/plan/0-Roadmap.md`).
- `tests/` — Playwright test suite and supporting docs (`SSH_SETUP.md`, `PLAYWRIGHT_SETUP.md`, `FAILURES.md`, `MANUAL.md`).
- `scratch/` — gitignored scratch directory. The user drafts prompts at `scratch/scratch.md` — do not save files at that name (collision).

## Getting started

1. Clone the staging branch: `git clone --branch staging https://github.com/amokprime/linebyline.git`
2. Run `bash scripts/.setup-sandbox.sh` to install project skills into the sandbox's `available_skills`.
3. Invoke `Skill(command="linebyline")` for onboarding, workflow, and project structure.
4. Read `MEMORY.md` for development history.
5. Use the Espanso snippets in `scripts/espanso/linebyline.yml` (`:onb`, `:code`, `:skl` triggers) for step-specific context loading. See `ai/README.md` for the current trigger list.
