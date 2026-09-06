# LineByLine — project agent instructions

This file sits in the conventional project-root `AGENTS.md` slot; ZCode loads it as workspace instructions automatically (it is not optional reading). The OMP harness keeps its own context at `.omp/AGENTS.md` + `.omp/RULES.md` — those are frozen fallback copies; do not migrate content back into them, and don't expect OMP to read this file (it only reads the nearest `.omp/`). Edit project context here, not in `ai/chat.z.ai/`. Other files in this slot:

- `.zcode/skills/<name>/SKILL.md` — authored project skills (workspace scope, git-tracked; the live copy)
- `.omp/skills/<name>/SKILL.md` — OMP fallback copies (frozen; sync content edits from `.zcode/skills/` into them only if OMP is re-promoted; harness-specific paths may differ between the two)
- `.omp/`, `ai/omp/` — OMP harness scaffolding (left as-is for fallback; do not migrate back into them)

## Project structure

- `/` — Project docs for humans. Under certain conditions they should be evaluated for stale references:
    - `CONTRIBUTING.md` — when a vibecoding workflow changes
    - `HELP.md` — when App UX changes
    - `README.md` — when core app features change, originally unplanned features are added
    - `LIMITATIONS.md` — when the underlying technology (i.e. web architecture, Playwright) experiences a breaking change or uplift
    - `SECURITY.md` — when the app code file splits up, changes languages, or moves folders
    - `CREDITS.md` — when new licensed content or services are used
- `.stversions/`, `.trash/`, `trash/` — Recover files the user deleted manually. Prefer `trash-put` (available at `/usr/sbin/trash-put`) over `rm` for deletions.
- `.github/` — Issues templates and GitHub Actions `.yml` workflows
- `ai/` — Vibecoding instructions and tools for humans
    - `claude.ai/` — Abandoned web chat workflow
    - `chat.z.ai/` — Web chat workflow used when API providers are down
    - `omp/` — Setup docs for the OMP harness
    - `zcode/` — Setup docs for the ZCode harness
- `.omp/skills/` — Authored project skills for the OMP harness (frozen fallback copies; `.zcode/skills/` is the live copy — sync content edits there only if OMP is re-promoted; harness-specific paths may differ)
- `archive/` — AI chat transcripts for app code building sessions
- `docs/` — `index.html` single-file LineByLine app code
- `scratch/` — gitignored scratch directory. The user drafts prompts at `scratch/scratch.md` — do not save files at that name.
- `security/` — Older collection of security disclosures — false positives in hindsight. Update when a genuinely scary incident occurs (beyond Dependabot warning to bump versions)
- `tests/` — Playwright test suite for the project and supporting docs for humans

## Scratch directory rules

- Do not save files at `scratch/scratch.md` — the user drafts prompts there; the filename will collide.

## Memory

- `MEMORY.md` (project root) is the durable, harness-agnostic memory seed — git-tracked. When a turn produces a durable fact (architectural decision, bug pattern, critical constraint, project invariant), update it there.
- Harness-specific memory (e.g. ZCode's machine-local `~/.zcode/cli/memories/`) is a cache bootstrapped from `MEMORY.md`; refresh it from the seed when it drifts. `ai/omp/learned.md` is the OMP-era snapshot of the seed, kept frozen for OMP fallback.
- `ai/zcode/transcript.sh` distills a session's rollout log into an Obsidian-friendly transcript for the `archive/` companions (see the script header for usage).

## Coding and testing

- Don't put large comment blocks in code files. Separate documentation from source.
- Run tests to cover the blast radius of code patches (i.e. with `agent-tst -g`)
- Suggest new Playwright tests to cover new app features
- Run the entire `agent-tst` Playwright suite before presenting work for the user to commit

## Running LineByLine tests (hard rules)

- `agent-tst` is NOT on ZCode's PATH — invoke it by full path: `~/.local/bin/agent-tst`
- Run server-side tests ONLY via `agent-tst` (e.g. `~/.local/bin/agent-tst -g pattern`,
  `~/.local/bin/agent-tst --list`, `~/.local/bin/agent-tst tests/foo.spec.js`).
- Never use raw `ssh`, `npx playwright`, or `podman` for tests — those need the
  master key, which is human-only and will be rejected.
- `agent-tst -g <pattern>` (scoped) is preferred; a full run takes ~7 min and may
  exceed synchronous tool timeouts, so keep runs scoped unless a full pass is
  genuinely required (run long passes in the background).
- `agent-tst` accepts only: `-g <pattern>` / `--grep=<pattern>` (letters, digits,
  `_ / . -`, space only — no shell metachars), `--list`, `tests/*.spec.js`,
  `--project=chromium|firefox|webkit`. Anything else is rejected.

## Never touch the keys

- The **master** key (`~/.ssh/id_ed25519_server`) grants a full shell on the Server.
  It is for the **human** only — do not use it, copy it, or read it.
- The restricted key profile lives at `~/.agent-tools/limited-entry/`; do not modify
  `authorized_keys`, the restricted key, or `~/.agent-tools/`.

## If a test fails or something looks off

- Reproduce with a scoped `agent-tst -g <pattern>` so output stays small.
- You MAY edit source/test files and re-run `agent-tst` to iterate — that is the
  intended loop.
- You are NOT authorized to SSH into the Server to "fix" it, run shell commands
  there, or change the test infrastructure.
- If `agent-tst` itself errors, report the exact output. Do not improvise a
  different SSH invocation.

## GitHub

- `gh` is available on PATH (`/usr/sbin/gh`). Use it for PR checks, failed workflow runs
  (`gh run list --status failure`), and Dependabot alerts
  (`gh api repos/amokprime/linebyline/dependabot/alerts/<number>`).

## SonarCloud

- The project is public — enumerate open issues via the JSON API
  (`https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&pullRequest=N&issueStatuses=OPEN`)
  and export each with `~/.local/bin/sonar-export "LINK"` (full path, not on ZCode's
  PATH; exports land in `~/Downloads/issues/`, fold them into
  `archive/semantic/<version>/issues/`). Exact workflow: sonarqube-workflow skill, Step 0 —
  faster than running `sonar-watch` and copying links manually.

## Deletions

- Prefer `trash-put <path>` (at `/usr/sbin/trash-put`) over `rm` so deletions are recoverable.
