## LineByLine project context

This file is the OMP-native `.omp/AGENTS.md` for the project. Edit project context here, not in `ai/chat.z.ai/`. Other files in this slot:
- `.omp/RULES.md` — sticky hard rules (test wrapper, sandbox, key handling)
- `.omp/skills/<name>/SKILL.md` — authored project skills (the `native` provider, priority 100; canonical OMP-native location)

### Project structure
- `/` — Project docs for humans. Under certain conditions they should be evaluated for stale references:
    - `CONTRIBUTING.md` — when a vibecoding workflow changes
    - `HELP.md` — when App UX changes
    - `README.md` — when core app features change, originally unplanned features are added
    - `LIMITATIONS.md` — when the underlying technology (i.e. web architecture, Playwright) experiences a breaking change or uplift
    - `SECURITY.md` — when the app code file splits up, changes languages, or moves folders
    - `CREDITS.md` — when new licensed content or services are used
- `.pi/trash/files/` — Recover project files you deleted (from the `@piotr-oles/pi-trash` OMP plugin)
- `.stversions/`, `.trash/` — Recover files the user deleted manually
- `.github/` — Issues templates and GitHub Actions `.yml` workflows
- `ai/` — Vibecoding instructions and tools for humans
    - `claude.ai/` — Abandoned web chat workflow
    - `chat.z.ai/` — Web chat workflow used when OMP API providers are down
    - `omp/` — Setup docs for the OMP harness
- `.omp/skills/` — Authored project skills, one folder per skill with `SKILL.md` (the `native` discovery provider, priority 100)
- `archive/` — AI chat transcripts for app code building sessions
    - `autohotkey/` — Abandoned scripts
    - `pre-semantic/` — AI chat transcripts for abandoned versions of LineByLine that did not use semver
    - `semantic/` — AI chat transcripts for older versions of LineByLine that used semver
    - `modular/` — AI chat transcripts for emerging versions of LineByLine that use semver and are refactored into a modular architecture
        - plan/ — The plan for refactoring LineByLine
            - `0-Roadmap.md` — high-level roadmap
            - `1-Playwright/` — completed roadmap item
            - `2-Zed-ESLint.md` — completed roadmap item
- `docs/` — `index.html` single-file LineByLine app code
- `scratch/` — gitignored scratch directory (renamed from `local/`; the OMP `local://` URL scheme is a separate OMP-internal concept and is unaffected). The `@piotr-oles/pi-reflag` OMP plugin hides gitignored folders from `grep`/`find`; pass full paths or use the `local://` URL scheme. The user drafts prompts at `scratch/scratch.md` — do not save files at that name. Staging files for the OMP `memory.backend: local` seed are at `scratch/lb-seed-*.md` (e.g. `scratch/lb-seed-prompt.md`, `scratch/lb-seed-MEMORY.md`); the `scratch/` directory and the OMP `local` backend are unrelated.
- `security/` — Older collection of security disclosures — false positives in hindsight. Update when a genuinely scary incident occurs (beyond Dependabot warning to bump versions)
- `tests/` — Playwright test suite for the project and supporting docs for humans

### Scratch directory rules
- Do not save files at `scratch/scratch.md` — the user drafts prompts there; the filename will collide.

### Coding and testing
- Don't put large comment blocks in code files. Separate documentation from source.
- Run tests to cover the blast radius of code patches (i.e. with `agent-tst -g`)
- Suggest new Playwright tests to cover new app features
- Run the entire `agent-tst` Playwright suite before presenting work for the user to commit
