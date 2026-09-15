
# LineByLine — web chat agent instructions (chat.z.ai)

These are the agent project instructions, tailored for the chat.z.ai web-channel sandbox. It covers information that is not obvious from the provided Repomix archive.

Most reusable procedural knowledge has been extracted into skills under `ai/chat.z.ai/skills/`. This file holds the cross-cutting project context the agent needs at Onboard before any skill is read — Repomix caveats, the project directory layout, the markdown conventions for agent context files, and the harness-specific constraints (sandbox auth boundaries). When a topic is covered by a skill, this file points to it rather than restating the rule.

## Consolidation direction

When the same piece of information appears in multiple agent-facing files, consolidate upstream so each unique piece of info has exactly one canonical home. The consolidation direction, in priority order (highest = most authoritative, lowest = most specific):

1. **Skill file** (`ai/chat.z.ai/skills/*-SKILL.md`) — general patterns, bug classes, rule rationales, procedural workflows, reference tables. The most reusable layer; skills are read by name when their `description` matches the current task.
2. **Roadmap file** (`archive/modular/plan/0-Roadmap.md`, Onboard bundle) — large, structured, app-specific but non-event-driven content: the modular refactor plan, Phase A–E tranche implementation notes, port deltas per tranche, file lists per tranche. A roadmap section is the canonical home when content is too large for MEMORY.md and too app-specific for a skill.
3. **`AGENTS.md`** (this file) — cross-cutting project context needed at Onboard before any skill is read: Repomix caveats, project structure, harness sandbox limits, the consolidation direction itself. When a topic is covered by a skill, this file points to it rather than restating the rule.
4. **`MEMORY.md`** — app-specific events, per-version dispositions, invariants tied to specific versions, CI/repo automation history. The most specific layer; entries here point to skills/roadmap for the general rule and record only the instance.

**Direction of consolidation:** when you discover the same information duplicated across these files, move it upstream (skill or roadmap), then replace every duplicate with a one-line pointer (e.g. `see \`code-quality-SKILL.md\` → "Section Name" for the rule`). Never duplicate a rule across files — that creates a synchronization burden and the copies drift.

**Concrete examples from the Sep 2026 consolidation sessions:**
- SonarQube rule rationales (S2083 taint analysis, S6819 ARIA exceptions, etc.) — duplicated across MEMORY.md and sonarqube-workflow-SKILL.md → consolidated into the skill; MEMORY.md keeps per-version Accept/Won't-Fix decisions only.
- Phase D tranche implementation notes — duplicated across MEMORY.md and 0-Roadmap.md → consolidated into the roadmap; MEMORY.md's "Architectural decisions" section is now a 3-paragraph pointer.
- Bash workflow script patterns — duplicated across MEMORY.md and code-quality-SKILL.md → consolidated into the skill.

The full protocol is in `skill-SKILL.md` → "Consolidation direction" (Onboard bundle). Read that skill before any meta-session involving agent scaffolding.

## Bundle map

The chat.z.ai web channel workflow ships context in isolated Repomix bundles, one per vibecoding step. A fresh chat session at Onboard has ONLY the Onboard bundle. Pointers to files in other bundles are annotated with the bundle name in parentheses. See `MEMORY.md` → "Bundle map" for the full table of which files ship in which bundle.

The Onboard bundle includes: `package.json`, `README.md`, `ai/chat.z.ai/{AGENTS,MEMORY}.md`, `ai/chat.z.ai/skills/{project-workflow,web-channel,skill}-SKILL.md`, `ai/chat.z.ai/scripts/delivery/{prepare,deploy,unpack}.sh`, and `archive/modular/plan/**` (includes `0-Roadmap.md`).

## Repomix context — read these notes first

- Anything in `.gitignore` is dropped from the packed file contents, **but** the `<directory_structure>` tree Summary still lists those paths. A path appearing in the tree does not guarantee its contents are in the pack — if the agent needs a file that isn't in the pack, ask the user to re-export or paste it.
- The tree is a snapshot at generation time; the live repo may have moved. When in doubt, confirm with the user.
- Binary files (images, Playwright snapshots) are never packed — only their paths appear in the tree.
- The Repomix file tree somewhat overlaps with the project-structure section below; the tree gives current paths, the section below explains what each directory is *for*.

## Project structure

- `/` — Project docs for humans (`CONTRIBUTING.md`, `HELP.md`, `README.md`, `LIMITATIONS.md`, `SECURITY.md`, `CREDITS.md`). Evaluate for stale references when the relevant area changes.
- `.github/` — Issue templates and GitHub Actions workflows (`codeql.yml`, `playwright.yml`, `sonarcloud.yml`, `deploy.yml`).
- `ai/` — Vibecoding instructions and tools for humans.
  - `chat.z.ai/` — This web chat workflow (the live copy).
  - `claude.ai/` — Abandoned web chat workflow.
  - `omp/`, `zcode/` — Other harness setup docs (not used by the web agent).
- `archive/` — AI chat transcripts for app code building sessions, plus Sonar issue exports under `archive/semantic/<version>/issues/`.
- `docs/` — `index.html` single-file LineByLine app code (the live monolith, pre-modular-refactor).
- `src/` — Modular Vite + Vue + Tailwind + shadcn-vue app (refactor in progress; see `archive/modular/plan/0-Roadmap.md`).
- `tests/` — Playwright test suite and supporting docs.
- `scratch/` — gitignored scratch directory.

## Coding and testing

- Don't put large comment blocks in code files. Separate documentation from source. See `web-channel-SKILL.md` (Onboard bundle) → "Comment density" for the full rule (3+ consecutive comment lines, paired `name.md` readmes, etc.).
- Documentation and context files should never be dense, minified walls of text.
- Fence code snippets in markdown documentation, including agent context files like this one and `MEMORY.md`. Short inline references like `variableName` or `npm run dev` or `<HTML tag>` are fine as inline backticks; longer code fragments, URLs with query params, and multi-line examples should be fenced in codeblocks — bare inline code either spills (Obsidian syntax-highlighting with no closing HTML tag) or gets rendered as an embedded element hiding the source (with closing HTML tag).
- Inline fence strings with certain special characters when the following Obsidian behaviors are not desired:
        - `#audio-box`: tag "audio-box", displays as pill
        - `[blah]` -> Markdown link label with no URL, syntax highlighted anyway
        - `[[blah]]` -> Wikilink to note "blah.md"
- For test-running workflows (when to write tests, when the user runs them, what the Vitest unit suite covers) see `project-workflow-SKILL.md` (Onboard bundle) → "Build" / "Test" steps and "Post-patch verification", plus `playwright-testing-SKILL.md` (Test bundle) for snapshot strategy and the `tst` / `tsta` / CI environment matrix.

## Running LineByLine tests

The sandbox can run small standalone scripts (unit-level logic checks, data transforms) and the Vitest unit suite when the Build Repomix includes `src/**` and `tests/unit/**`. The full Playwright suite (~540 tests, ~7 min, with snapshot data) is too heavy for the sandbox — the user runs it locally via `tst` and uploads results.

For the canonical workflow see `project-workflow-SKILL.md` (Onboard bundle) → "Test" step and "Post-patch verification", and `playwright-testing-SKILL.md` (Test bundle) for snapshot strategy, font-fragile screenshots, and the TS diagnostics setup.

## SonarCloud & CodeQL

The user runs `sie` (the consolidated `sonar-issue-exporter` CLI, https://github.com/amokprime/sonar-issue-exporter) locally after each push and uploads the resulting Markdown report. The report combines SonarCloud issues and CodeQL code-scanning alerts in one file; the `#### Why` / `#### How to fix` blocks per rule are populated when `SONAR_API_KEY` is set (public-project issue enumeration works without a token; only the Why/How rationale is gated). CodeQL alerts require `gh auth login` locally — they are NOT available via the sandbox API at all.

The sandbox cannot authenticate with GitHub or SonarCloud, so it cannot fetch the SonarCloud rule Why/How rationale, fetch CodeQL code-scanning alerts, or commit/push in an end-to-end build loop. This means the `sie` report IS the canonical input — read it directly. The sandbox API is a fallback for the cases listed in `sonarqube-workflow-SKILL.md` (Review bundle) Step 1.

For the `sie` report format, the full sandbox API protocol (facets for first-pass counts, rule filtering, pagination), the auth-required endpoints to avoid, and per-rule triage decisions — see `sonarqube-workflow-SKILL.md` (Review bundle). The `sie` report goes in `archive/semantic/<version>/issues.md` (auto-increments to `issues1.md`, `issues2.md`, …). Use `sie -c` / `--clean` to drop the licensed Sonar Why/How sections before committing to a GPL-3 repo.
