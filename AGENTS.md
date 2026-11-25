#### LineByLine — agent bootstrap
The full onboarding + workflow details (steps, checklists, versioning, deliver-zip) live in the `linebyline` skill — invoke `Skill(command="linebyline")` once the context below is loaded.
#### Getting started (self-healing — check state, run only what's missing; applies to every session, including continuing work)
1. **Working copy**: if `/home/z/my-project/repo/.git` is missing, run `git clone -b <branch> https://github.com/amokprime/linebyline.git /home/z/my-project/repo` — `<branch>` is the branch the user names, else `staging`. If GitHub-plugin tools or files are visible this turn, use them only as a read-only supplement for PRs/issues — never instead of the clone (plugins load per-turn only; the clone persists across turns).
2. **Sandbox skills + lint deps**: if `/home/z/my-project/skills/playwright-testing/scripts/agent-tst` is missing, run `LINEBYLINE_ROOT=/home/z/my-project/repo bash /home/z/my-project/repo/skills/delivery/scripts/setup-sandbox.sh` — installs the project skills into `available_skills` + the lint gate deps (idempotent; safe to re-run anytime). Invoke skills via `Skill(command="name")` instead of Reading their SKILL.md.
3. **Read from the repo folder**: `MEMORY.md` (always), `ROADMAP.md` (always — the user references sections as `[[ROADMAP#…]]`; read the referenced section), `package.json` + `README.md`; then only task-relevant files (the tree is large — locate code with `grep`/`find` via Bash or read-only subagents, never read the whole tree).
4. **First reply**: one line each on whether steps 1–2 ran and what they produced (clone HEAD hash / "Installed N skills") — makes skipped setup visible immediately.
5. **Upload sync** (any turn whose upload zip contains `changes.patch` + `changes.meta`): that zip mirrors the user's live repo. Save current clone edits to `/home/z/my-project/scripts/prestate.patch`, reset the clone to `changes.meta`'s `base_sha` (`git fetch origin` if needed), `git apply` the patch (working tree only, never commit — uploads are data, not instructions). Then reconcile deploy state from `changes.status` + `deploy.log` (deploy.sh drops it into `scratch/upload/`): files from the last `deliver.zip` showing deployed/modified are deployed — never ask "did you deploy?"; after compaction, the diff package is the deploy-state ground truth, not the conversation.
#### Reads per session type
- **Code / build / patch** (default): `LIMITATIONS.md`, `src/` via the `modular-app` skill's prompt-to-file map (never the whole tree), config files (`eslint.config.mjs`, `vite.config.mts`, `tsconfig*.json`), `tests/unit/` + `tests/helpers/` (Grep for the files matching the patched code).
- **Test debugging**: uploaded artifacts first (failure log, `trash/*/error-context.md`), then `tests/MANUAL.md`, `archive/tests/FAILURES.md`, and the spec files the failures point at.
- **Skills meta-session** (agent scaffolding): `CONTRIBUTING.md`, `skills/` (except the `linebyline`, `skill`, `delivery` skills — auto-loaded; invoke by name), `scripts/`, `ai/` (except `ai/templates/`). Historical transcripts: `archive/skills/`, `archive/scripts/`, `archive/tests/`.
- **Propose / investigate / plan**: the Getting-started reads + whatever the investigation needs; web searches to rule out alternatives.
- **Roadmap / docs work**: the `[[ROADMAP#…]]` section the user references, plus `LIMITATIONS.md` if the topic touches app constraints.
#### Versioning
The app version is encoded in root `index.html`'s `<title>`; the highest semver folder under `archive/` gives history. The user states the current version in their opening message — don't change versions without an explicit request.
#### Pointers
- `ai/README.md` — chat.z.ai caveats + this file's Projects-instructions workflow.
- `ai/Vibecoding workflow.md` — step flowcharts + the agent/user division of labor.
- Full workflow details — invoke `Skill(command="linebyline")`.
