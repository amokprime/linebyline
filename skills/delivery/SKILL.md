---
name: delivery
description: Package and deploy session deliverables from the chat.z.ai sandbox to the user's local LineByLine repo, and the behavioral rules for the chat.z.ai web channel that apply every turn. Use this skill whenever you need to ship files (run `prepare.sh` to zip the download folder, fill out `deploy.sh` with file mappings), when the user mentions `deliver.zip`, `dpl`, `unpack.sh`, the prepare → download → deploy pattern, chat.z.ai, download folder, web chat, Agent mode, uploads, or when the agent is unsure about file visibility, output format, comment density, or when to re-read context after compaction. Also use when linting markdown files for Obsidian prettify issues or splitting overlong bullet lines.
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

Avoid 3+ consecutive lines of source comments, both inline and multiline blocks like Python's `""" """`. Instead:

- Pair each non-trivial `name.ext` source file with a `name.md` readme, explaining intent, usage, suggested core patches (if a workaround or monkeypatch), and known limitations. If such a file is already provided, use it as a starting point.
- Don't use readmes as memory dumping grounds — preserve their structure for naive users and developers.
- Reserve 1-2 line source comments for non-obvious decisions like workarounds, deferred bugs, intentional smells.

Context compaction

The agent has a large native context (~1M tokens) but may compact or re-read uploaded files in later turns. If you find yourself re-reading uploaded files, also re-read this skill — the channel rules are just as likely to have been forgotten as the file contents.

---

Scripts packaged in this skill

All six scripts live at `skills/delivery/scripts/`:

1. **`prepare.sh`** (sandbox-side, agent-run) — zips all loose files in `/home/z/my-project/download/` into `deliver.zip`, after (a) linting all `*.md` files via `lint_markdown.py`, (b) verifying every file listed in `deploy.sh`'s `deploy_file` calls exists in `download/`, (c) running the shared lint gate (`lint_gate.sh`) on `*.sh` + `*.py` deliverables, and (d) running ESLint + vue-tsc + Vitest in `/home/z/my-project/sandbox/` if a sandbox project tree with `node_modules` exists. Removes loose files after zipping. Also touches `download/` to refresh the chat.z.ai "All files in task" widget.

2. **`deploy.sh`** (template, agent-filled per session) — deploys files from the extracted zip location to the LineByLine repo, then runs `npm install` + the shared lint gate + Vitest + Vite build + Playwright (via SSH + Syncthing). The agent fills in the `deploy_file <flat> <repo_path>` lines as a checklist. Uses `cmp -s` to skip byte-identical files. The `deploy_file` function auto-detects hardlinked destinations (via `stat -c '%h'`) and uses `cp` instead of `mv` to preserve the hardlink. For files known to be hardlinked, use `deploy_hardlinked` instead. The committed template lives at `skills/delivery/scripts/deploy.sh`; the session copy is ephemeral.

3. **`unpack.sh`** (user-side, run via `dpl` fish abbreviation) — thin wrapper that extracts `deliver.zip` to `scratch/`, snapshots the zip contents to `.deliver-files.list`, runs `deploy.sh`, then cleans up. Must be run from a terminal (not double-clicked) so ssh + npm output is visible.

4. **`lint_markdown.py`** (sandbox-side, auto-run by `prepare.sh`) — auto-fixes bare `#identifier` / `[identifier]` outside backticks, normalizes bullet indentation to 4-space steps, auto-fixes `=== text ===` patterns, and warns about `[[wikilink]]` occurrences and bullet lines >400 chars. Skips YAML frontmatter, inline backtick spans, and fenced code blocks.

5. **`lint_gate.sh`** (shared, sourced by both `prepare.sh` and `deploy.sh`) — the blocking lint gate for Bash + Python + JavaScript/TypeScript. Runs Shellcheck on `*.sh` files, Ruff on `*.py` files (autofix via `--fix`, then gate), and ESLint on `src/` (autofix via `--fix`, then gate). Each linter is skipped if not installed or if no matching files exist. Blocking: if any installed linter finds issues after autofix, the function returns 1 and the caller aborts. Both `prepare.sh` (sandbox-side, on deliverables) and `deploy.sh` (user-side, on the repo) source this script so the gate is consistent across both environments.

6. **`split_bullets.py`** (sandbox-side, manual run) — splits overlong bullet lines (>400 chars) at natural break points. Use when `lint_markdown.py` warns about overlong bullets.

---

Workflow (high-level)

1. Fill out `deploy.sh` FIRST (write the `deploy_file <flat> <repo_path>` lines as a checklist of what you plan to deliver). This is the JIT reminder mechanism — `prepare.sh` verifies every expected file exists before zipping.
2. Place all deliverables in `/home/z/my-project/download/` with flat hyphenated names (e.g. `src-composables-useAudio.ts`, not `src/composables/useAudio.ts`).
3. Place the filled-in `deploy.sh` in `download/` too (it gets included in the zip).
4. Run `bash /home/z/my-project/scripts/prepare.sh` (or wherever the sandbox-side copy lives). The script lints, verifies, runs Shellcheck + ESLint/Vitest if available, zips everything into `deliver.zip`, touches `download/` to refresh the widget, and removes the loose files.
5. The user downloads `deliver.zip` (via the "All files in task" widget, or from https://tmpfiles.org if the widget is broken), runs `dpl` (which runs `unpack.sh`), which extracts, runs `deploy.sh`, and cleans up.

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

The user-side `tst`/`tsta`/`cgn` fish functions live at `scripts/fish/` for reference but cannot be invoked from the sandbox.

---

Cross-references

- `linebyline-SKILL.md` → "Download copy" — the brief download-folder rules; this skill has the full deliver-zip protocol + linter details.
- `code-quality-SKILL.md` → "Bash workflow scripts" — the bash patterns all five scripts follow (`set -euo pipefail`, `${var:?}` guards, scoped cleanup, no line continuations in quoted strings).

