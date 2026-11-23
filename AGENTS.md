# LineByLine — agent bootstrap
The full onboarding + workflow details (steps, checklists, versioning, deliver-zip) live in the `linebyline` skill — invoke `Skill(command="linebyline")` once the context below is loaded.
## Getting started (every session)
1. Clone the branch the user names — main: `https://github.com/amokprime/linebyline/tree/main`, staging: `https://github.com/amokprime/linebyline/tree/staging` (default to staging when unspecified).
2. Read from the repo folder: `MEMORY.md` (development history — always), `ROADMAP.md` (refactor plan + tranche implementation notes — always; the user references sections as `[[ROADMAP#…]]` — read the referenced section), `package.json` + `README.md`.
3. Run `bash skills/delivery/scripts/setup-sandbox.sh` — installs the project skills into the sandbox's `available_skills` (idempotent). Invoke skills via `Skill(command="name")` instead of Reading their SKILL.md.
4. Read only the files relevant to the current task — the tree is large. Use Glob/Grep to locate files instead of LS on the repo root; use read-only subagents to read heavy folders in parallel.
## Reads per session type
- **Code / build / patch** (default): `LIMITATIONS.md`, `src/` via the `linebyline-section-index` skill's prompt-to-file map (never the whole tree), config files (`eslint.config.mjs`, `vite.config.mts`, `tsconfig*.json`), `tests/unit/` + `tests/helpers/` (Grep for the files matching the patched code).
- **Test debugging**: uploaded artifacts first (failure log, `trash/*/error-context.md`), then `tests/MANUAL.md`, `tests/FAILURES.md`, and the spec files the failures point at.
- **Skills meta-session** (agent scaffolding): `CONTRIBUTING.md`, `skills/` (except the `linebyline`, `skill`, `delivery` skills — auto-loaded; invoke by name), `scripts/`, `ai/` (except `ai/templates/`). Historical transcripts: `archive/skills/`, `archive/scripts/`, `archive/tests/`.
- **Propose / investigate / plan**: the Getting-started reads + whatever the investigation needs; web searches to rule out alternatives.
- **Roadmap / docs work**: the `[[ROADMAP#…]]` section the user references, plus `LIMITATIONS.md` if the topic touches app constraints.
## Versioning
The app version is encoded in root `index.html`'s `<title>`; the highest semver folder under `archive/` gives history. The user states the current version in their opening message — don't change versions without an explicit request.
## Pointers
- `ai/README.md` — chat.z.ai caveats + this file's Projects-instructions workflow.
- `ai/Vibecoding workflow.md` — step flowcharts + the agent/user division of labor.
- Full workflow details — invoke `Skill(command="linebyline")`.