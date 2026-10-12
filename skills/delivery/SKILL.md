---
name: delivery
description: Package and deploy session deliverables from the chat.z.ai sandbox to the user's local LineByLine repo, and the behavioral rules for the chat.z.ai web channel that apply every turn. Use this skill whenever you need to ship files (run `prepare.sh` to zip the download folder, fill out `deploy.sh` with file mappings), when the user mentions `deliver.zip`, `unpack.sh`, the prepare → download → deploy pattern, chat.z.ai, download folder, web chat, Agent mode, uploads, or when the agent is unsure about file visibility, output format, comment density, or when to re-read context after compaction. Also use when linting markdown files for Obsidian prettify issues or splitting overlong bullet lines.
---

This skill covers two related concerns: (1) the delivery workflow (prepare → zip → deploy) and the five scripts that automate it, and (2) the chat.z.ai web-channel behavioral rules that apply every turn. The web channel is the only interaction surface — the agent cannot see the user's filesystem directly; deliverables must be copied to `download/` for the user to retrieve. The agent's context window compacts over long sessions, making early-turn instructions less reliable later — re-read this skill mid-session when that happens.

---

Web channel behavioral rules

These apply every turn, not just at onboarding. The agent is most likely to forget them in later turns as context compacts.

File visibility — the user can only see files inside `/home/z/my-project/download/`. Everything else (project tree, scripts, temp files) is invisible to them.

- Copy every deliverable to `download/` — the user cannot access other folders.
- Avoid subdirectories inside `download/` — the user cannot see them. Put files directly in `download/` or zip them.
- Don't clutter `download/` with compiled temporary files like `*.pyc`.
- For multi-file sessions, use the prepare → deploy pattern (see "Workflow" below) — `prepare.sh` handles the zip + cleanup automatically.
- **Keep `download/` clean between turns.** `prepare.sh` removes loose files after zipping so only `deliver.zip` remains. At the start of the next turn, remove any stale `deliver.zip` before placing new files.
- Avoid spaces in filenames in `download/` — the download system URL-encodes spaces as `+`, causing "Failed to download file" errors. Use hyphens or underscores. (This rule applies to `download/` only; repo files may have spaces.)

Input handling

- Stop immediately to request any missing uploads. Don't infer their contents — if the user refers to a file you haven't seen, ask for it.
- Read docs and manifests (i.e. `*.md`, `package.json`, `pyproject.toml`) before code (i.e. `*.html`, `*.js`, `*.py`). Documentation describes intent; code is the implementation.
- Follow obsidian-style links like `![[filename.png]]` (embed) or `[[filename]]` (non-embed) in the same-level 'attachments' subfolder.

Output format

- Don't generate Office documents or PDFs. Just output to chat in English.
- Implement the strongly dominant solution as a drop-in code file for the user to run and test. Only stop and ask if the user's intention or environment are unclear, or if multiple competing solutions exist.

Comment density

Large comment blocks in code files are hard to maintain (comments rot faster than code). The rule differs by file type:

- **Component and test files** (e.g. `src/*.vue`, `src/*.ts`, `tests/*.spec.js`): minimal comments. Reserve 1-2 line comments for non-obvious decisions like workarounds, deferred bugs, intentional smells. Don't pedantically document every file — a folder-level `README.md` covering the shared intent of multiple files is better than one readme per file.
- **Standalone scripts** (e.g. `scripts/unpack.sh`, `skills/delivery/scripts/deploy.sh`): larger header comment blocks are acceptable when they serve a functional purpose — usage examples, env var list, exit codes, or the chain of trust a reader needs before opening the file. But don't write a monolithic wall of text. The patterns to follow:
    - Lead with a one-line description of what the script does, then a blank line before the longer block.
    - Group related information into labeled sections (`# Usage:`, `# Env:`, `# Exit codes:`) so a reader can scan to what they need.
    - For CLI tools with flags, document each flag inline at the argparse/getopts level (Python `help=` strings, Bash `case` blocks with `# -h: show help`) rather than in a single monolithic header — this keeps the help close to the code that implements it.
    - If the script sources or is sourced by another file, note the dependency in both files (the `# shellcheck source=` directive in Bash, or a `# Depends on:` line).
    - Keep the header under ~30 lines. If the script needs more documentation than that, it belongs in a paired `README.md` in the same folder.

For documentation that doesn't fit in a comment, pair a folder with a `README.md` (the Notebook Navigator plugin supports a global folder note name — `README.md` is the conventional choice). Several files in a folder may share one README unless it would be massive — then consider splitting the folder into subfolders with their own READMEs, monorepo style. Don't use readmes as memory dumping grounds — preserve their structure for naive users and developers.

Context compaction

The agent has a large native context (~1M tokens) but may compact or re-read uploaded files in later turns. If you find yourself re-reading uploaded files, also re-read this skill — the channel rules are just as likely to have been forgotten as the file contents.

---

Scripts packaged in this skill

Four delivery scripts live at `skills/delivery/scripts/`; two setup scripts are co-located here because they install the delivery pipeline's lint dependencies. The user-side `unpack.sh` lives at `scripts/unpack.sh` (it's the user entry point, double-clicked in a file manager); the shared `lint_gate.sh` lives at `skills/code-quality/scripts/` (owned by the code-quality skill).

1. **`prepare.sh`** (sandbox-side, agent-run) — zips all loose files in `/home/z/my-project/download/` into `deliver.zip`, after (a) linting all `*.md` files via `lint_markdown.py`, (b) verifying every file listed in `deploy.sh`'s `deploy_file` calls exists in `download/`, (c) running the shared lint gate (`skills/code-quality/scripts/lint_gate.sh`) on `*.sh` + `*.py` deliverables, and (d) running ESLint + vue-tsc + Vitest in `/home/z/my-project/sandbox/` if a sandbox project tree with `node_modules` exists. Removes loose files after zipping. Also touches `download/` to refresh the chat.z.ai "All files in task" widget.

2. **`deploy.sh`** (template, agent-filled per session) — deploys files from the extracted zip location to the LineByLine repo, then runs `npm install` + the shared lint gate + Vitest + Vite build + Playwright (via SSH + Syncthing). The agent fills in the `deploy_file <flat> <repo_path>` lines as a checklist. Uses `cmp -s` to skip byte-identical files. The `deploy_file` function auto-detects hardlinked destinations (via `stat -c '%h'`) and uses `cp` instead of `mv` to preserve the hardlink. For files known to be hardlinked, use `deploy_hardlinked` instead. The committed template lives at `skills/delivery/scripts/deploy.sh`; the session copy is ephemeral.

3. **`unpack.sh`** (user-side, double-clicked) — thin wrapper that extracts `deliver.zip` to `scratch/`, snapshots the zip contents to `.deliver-files.list`, runs `deploy.sh` inside a bwrap sandbox for extra safety, then cleans up. When double-clicked in a file manager (stdout not a TTY), the script re-launches itself in a popup ghostty window (`ghostty -e bash -c 'LBL_POPUP=1 exec "$@"' _ "$0" "$@"`) so ssh + npm output is visible. The popup stays open after the script finishes (`read -rp "Press Enter..."` gated on `LBL_POPUP=1`). Lives at `scripts/unpack.sh` (not `skills/delivery/scripts/`) because it's the user-side entry point — discoverable at the repo's top-level `scripts/` folder. The bwrap sandbox makes it read-only inside the sandbox, so future edits to `unpack.sh` must be deployed manually (copy the file, don't use deliver.zip) — a malicious `deliver.zip` can't modify the bwrap filter for future runs.

4. **`lint_markdown.py`** (sandbox-side, auto-run by `prepare.sh`) — auto-fixes bare `#identifier` / `[identifier]` outside backticks, normalizes bullet indentation to 4-space steps, auto-fixes `=== text ===` patterns, and warns about `[[wikilink]]` occurrences and bullet lines >400 chars. Skips YAML frontmatter, inline backtick spans, and fenced code blocks.

5. **`split_bullets.py`** (sandbox-side, manual run) — splits overlong bullet lines (>400 chars) at natural break points. Use when `lint_markdown.py` warns about overlong bullets.

6. **`setup-sandbox.sh`** (sandbox-side, one-time per session) — copies project skills into `/home/z/my-project/skills/` so their `description` frontmatter auto-loads into the system prompt's `available_skills` list. Also installs Shellcheck (npm package + static binary fallback) and Ruff (via `setup-lint-deps.sh`). Idempotent; re-run if the sandbox resets. Lives at `skills/delivery/scripts/` because it installs the delivery pipeline's dependencies (skills + lint tools) — the delivery workflow can't run without them.

7. **`setup-lint-deps.sh`** (sandbox-side + user-side) — installs Python lint tools (ruff) into a project-contained venv at `.lint-deps/`. Called by `setup-sandbox.sh` (sandbox-side) and `deploy.sh` (user-side, auto-installs when no system ruff resolves). Uses `uv` if available, falls back to `python3 -m venv` + `pip`. Idempotent.

The shared **`lint_gate.sh`** (Shellcheck + Ruff + ESLint) lives at `skills/code-quality/scripts/lint_gate.sh` — see `code-quality-SKILL.md` → "Bash workflow scripts" for its behavior.

---

Workflow (high-level)

1. Fill out `deploy.sh` FIRST (write the `deploy_file <flat> <repo_path>` lines as a checklist of what you plan to deliver). This is the JIT reminder mechanism — `prepare.sh` verifies every expected file exists before zipping. **Only include files that CHANGED this turn** — files already deployed + unchanged will be "skip (identical)" and waste the user's time (deploy.sh has to cmp each one, and the zip is inflated with unnecessary files). The user reports issues with specific files — only those + their dependencies go in deploy.sh.
2. Place all deliverables in `/home/z/my-project/download/` with flat hyphenated names (e.g. `src-composables-useAudio.ts`, not `src/composables/useAudio.ts`).
3. Place the filled-in `deploy.sh` in `download/` too (it gets included in the zip).
4. Run `bash /home/z/my-project/scripts/prepare.sh` (or wherever the sandbox-side copy lives). The script lints, verifies, runs Shellcheck + ESLint/Vitest if available, zips everything into `deliver.zip`, touches `download/` to refresh the widget, and removes the loose files.
5. The user downloads `deliver.zip` (via the "All files in task" widget, or from https://tmpfiles.org if the widget is broken), double-clicks `scripts/unpack.sh` (or runs it from a terminal), which extracts, runs `deploy.sh`, and cleans up.

---

Cautions and gotchas

- **`download/` cleanliness**: the same file should not exist both inside and outside the zip. After running `prepare.sh`, only `deliver.zip` should remain.
- **Widget staleness**: if the "All files in task" widget doesn't show `deliver.zip` after `prepare.sh` runs, `prepare.sh` now touches `download/` to force a refresh. If the widget is still broken, upload `deliver.zip` to https://tmpfiles.org and paste the direct download link in chat.
- **`deploy.sh` is a template**: the committed copy at `skills/delivery/scripts/deploy.sh` is the reusable template. Each session, the agent fills in the `deploy_file` mappings and includes the filled-in copy inside `deliver.zip`.
- **Scoped cleanup**: `unpack.sh` snapshots the zip's contents to `.deliver-files.list` before extraction. `deploy.sh`'s cleanup loop reads this manifest and only removes files that came from the zip — pre-existing `scratch/` files like `scratch.md` are NOT touched. Never use `find . -maxdepth 1 -type f` for cleanup; it sweeps pre-existing files.
- **Playwright SSH block**: `deploy.sh` includes a `ssh Server "LBL_VITE_TARGET=1 tst"` block that runs the full Playwright suite via SSH. This is user-side only — the sandbox cannot SSH. For sandbox-side sample Playwright tests, see the `playwright-testing` skill → "Sandbox-side sample tests".

---

## Sandbox vs. user-side environment

The chat.z.ai sandbox and the user's local machine are different environments. Commands that work locally may not work in-sandbox, and vice versa. This table disambiguates:

| Concern | Sandbox (chat.z.ai) | User-side (local machine) |
|---|---|---|
| Filesystem | `/home/z/my-project/` only; user sees `/home/z/my-project/download/` | `~/GitHub/linebyline` (LINEBYLINE_ROOT override) |
| Playwright (full suite) | Too heavy (~540 tests, ~7 min, snapshots overwhelm context) | `tst` (fish function) — SSHes to Server, runs in Podman Ubuntu container |
| Playwright (sample tests) | Direct `playwright` package import in standalone Node script against `vite preview` | `tsta` (fish function) — UI mode against local Vite preview on :5173 |
| Playwright (codegen) | N/A | `cgn` (fish function) — codegen against local Vite preview |
| SonarCloud / CodeQL | Public JSON API only (no Why/How, no CodeQL) | `sie` CLI; produces Markdown report combining both |
| GitHub CLI | NOT available — sandbox can't auth | `gh`; PR checks, failed runs, Dependabot alerts |

The user-side `tst`/`tsta`/`cgn` fish functions live at `scripts/local/` for reference but cannot be invoked from the sandbox. The bash `tst`, `agent-tst`, and `agent-sync` scripts (server-side and OMP-side Playwright runners) live at `skills/playwright-testing/scripts/` — see `playwright-testing-SKILL.md` for details.

---

Cross-references

- `linebyline-SKILL.md` → "Download copy" — the brief download-folder rules; this skill has the full deliver-zip protocol + linter details.
- `code-quality-SKILL.md` → "Bash workflow scripts" — the bash patterns all delivery scripts follow (`set -euo pipefail`, `${var:?}` guards, scoped cleanup, no line continuations in quoted strings) and the `lint_gate.sh` behavior (owned by the code-quality skill at `skills/code-quality/scripts/lint_gate.sh`).
- `ROADMAP.md` → "Deploy Workflow" (item 1) + "Phase E — Verify and Swap" — the post-cutover build pipeline. `dist/` is gitignored (never committed); the `deploy.yml` GitHub Actions workflow rebuilds it on the ubuntu-runner from `src/` on every push to `main`, then deploys via `actions/deploy-pages`. Pre-cutover, `deploy.sh` builds `dist/` locally (via `npm run build`) for Playwright verification against the Vite preview. Post-cutover, the local `deploy.sh` build is for verification only; the CI `deploy.yml` build is what ships to GitHub Pages.

