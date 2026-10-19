---
summary: Utility scripts for the LineByLine repo — sandbox setup, ad-hoc zip, fish functions, Espanso snippets, diff-staging capture, and the user-side deployment wrapper.
links:
  - "[[ai/Vibecoding workflow|Vibecoding workflow]]"
---
### Sandbox setup for the chat.z.ai agent
```
skills/delivery/scripts/setup-sandbox.sh
```
- Copies project skills from `skills/<name>/SKILL.md` into the chat.z.ai sandbox's `/home/z/my-project/skills/` folder so their `description` frontmatter auto-loads into the agent's `available_skills` list. Also installs Shellcheck (npm package + static binary fallback) and Ruff (via `setup-lint-deps.sh`). Run once at Onboard after cloning the repo; idempotent.
```
bash skills/delivery/scripts/setup-sandbox.sh
```
- Lives at `skills/delivery/scripts/` (not `scripts/`) because it's owned by the `delivery` skill — it installs the delivery pipeline's dependencies (skills + lint tools).
### Preparing uploads
```
scripts/zip.sh
```
- Zips whatever is in `~/GitHub/linebyline/scratch/upload/` into a uniquely-named zip in `scratch/`, then copies the path to clipboard via `wl-copy`. Used for ad-hoc uploads of non-deliverable files (e.g. a single screenshot or test fixture).
- Can be double-clicked after setup. Aborts with an error if the upload folder is empty.
### Sharing uncommitted state
```
scripts/diff-staging.sh
```
- Captures the local working tree state (uncommitted + untracked + unpushed commits) as a portable patch + metadata so the chat.z.ai sandbox can reproduce your local state by cloning the staging branch and applying the patch. Use this when you made a lot of changes "offline" and don't want the agent to clobber them on the next deploy
- Output goes to `~/GitHub/linebyline/scratch/upload/`:
    - `changes.patch` — `git diff --binary $BASE_SHA` covering tracked + untracked files (uses `git add -N .` to mark untracked files as intent-to-add, then `git reset` to undo)
    - `changes.status` — `git status --porcelain` (the authoritative pre-mutation state)
    - `changes.meta` — `base_ref`, `base_sha`, `head_sha`, `branch`, `status_file` pointer
- See [archive/scripts/3.md](https://github.com/amokprime/linebyline/tree/main/archive/scripts/3.md) for the design rationale (DeepSeek session that worked through `origin/staging` vs local `staging`, intent-to-add + reset pattern, no status duplication in meta).
- Manual deployment only — must be copied to the user's `scripts/` folder outside the deliver.zip workflow.
### Copy paste onboarding prompts
```
scripts/local/espanso.yml
```
- Espanso match file with triggers for the standard vibecoding-step context-loading instructions. See `ai/README.md` for the current trigger list and descriptions.
- Install (hardlink so both copies stay in sync):
```sh
ln ~/.config/espanso/match/linebyline.yml scripts/local/espanso.yml
```
### Bash scripts for testing
```
scripts/local/tst.sh
scripts/local/tsta.sh
scripts/local/cgn.sh
scripts/local/srv.sh
```
- User-side Playwright helpers (Bash). `tst` runs the full suite via SSH to the Server (Podman container); `tsta` runs UI mode against local Vite preview; `cgn` runs Codegen; `srv` starts a Vite preview server for manual testing. These are user-side only — the chat.z.ai sandbox cannot invoke them. See [SSH_SETUP](https://github.com/amokprime/linebyline/tree/main/tests/SSH_SETUP.md) and [PLAYWRIGHT_SETUP](https://github.com/amokprime/linebyline/tree/main/tests/PLAYWRIGHT_SETUP.md) for the full setup.
- All four double-click in a file manager (popup Ghostty window when stdout is not a TTY, same pattern as `unpack.sh`) OR run from a terminal.
- Symlink to PATH for bare-invocation:
  ```sh
  ln -s ~/GitHub/linebyline/scripts/local/tst.sh ~/.local/bin/tst
  ln -s ~/GitHub/linebyline/scripts/local/tsta.sh ~/.local/bin/tsta
  ln -s ~/GitHub/linebyline/scripts/local/cgn.sh ~/.local/bin/cgn
  ln -s ~/GitHub/linebyline/scripts/local/srv.sh ~/.local/bin/srv
  ```
- `deploy.sh` calls `scripts/local/tst.sh` as the canonical Playwright runner (the dedup pattern from the shared lint gate — `deploy.sh` no longer duplicates the SSH+Syncthing+trash-prune logic that lives in `scripts/server/tst`).
### "Installing" chat.z.ai sandbox changes locally
```
scripts/unpack.sh
```
- User-side wrapper that extracts `deliver.zip` to `scratch/`, snapshots the zip contents to `.deliver-files.list`, runs `deploy.sh` inside a bwrap sandbox for extra safety, then cleans up. Double-clicked in a file manager OR run from a terminal — the script re-launches itself in a popup Ghostty window when it detects a non-TTY stdout, so ssh + npm output is visible either way.
- The bwrap sandbox makes it read-only inside the sandbox, so future edits to `unpack.sh` must be deployed manually (copy the file, don't use deliver.zip) — a malicious `deliver.zip` can't modify the bwrap filter for future runs.
### Local server Playwright scripts (tst + tst-locked)
```
scripts/server/tst
scripts/server/tst-locked
```
- `tst` — LAN server Playwright runner (Podman Ubuntu container, Syncthing auto-sync, trash/ artifact pull). Symlinked to `~/.local/bin/tst` on the Server so a bare `ssh Server tst` works.
- `tst-locked` — Server-side gate for the OMP agent's locked SSH key. The `command=` target in `authorized_keys` — allowlists Playwright args, rejects everything else. Deployed to `~/.local/bin/tst-locked` on the Server as a COPY of `scripts/server/tst-locked` (two independent files — tampering the repo copy can't affect the deployed gate). When `tst-locked` changes, update the Server's copy via fish abbreviations: `tlkdf` to diff, `tlkcp` to copy. See [SSH_SETUP](https://github.com/amokprime/linebyline/tree/main/tests/SSH_SETUP.md) → "Why copy (not symlink or hardlink) for `tst-locked`?" for the rationale.
- The whole `scripts/server/` folder is tmpfs'd inside the bwrap sandbox so neither file can be modified by a malicious `deliver.zip`.
- See tests/[SSH_SETUP](https://github.com/amokprime/linebyline/tree/main/tests/SSH_SETUP.md) → "Concrete deployment: LineByLine / OMP agent" for the chain-of-trust diagram (`agent-tst` → `sshd` → `tst-locked` → `tst` → `podman`).
### Playwright test remote access for sandboxed OMP agents
```
skills/playwright-testing/scripts/agent-tst
skills/playwright-testing/scripts/agent-sync
```
- `agent-tst` — OMP sandbox wrapper around `ssh Server tst-locked` using the locked OMP agent SSH key. Symlinked to `~/.local/bin/agent-tst`. The ONLY command an OMP agent should use to run server-side tests.
- `agent-sync` — Force the local Syncthing instance to push to the Server before `agent-tst`. Symlinked to `~/.local/bin/agent-sync`.
- See playwright-testing [SKILL](https://github.com/amokprime/linebyline/tree/main/skills/playwright-testing/SKILL.md) → "Co-located bash scripts" for full details.
## Delivery + setup scripts for the chat.z.ai agent
The delivery workflow scripts:
```
skills/delivery/scripts/prepare.sh
skills/delivery/scripts/deploy.sh
skills/delivery/scripts/lint_markdown.py
skills/delivery/scripts/split_bullets.py
```
The lint gate (Shellcheck, Ruff, ESLint): is sourced by both `prepare.sh` (sandbox-side) and `deploy.sh` (user-side). See code-quality [SKILL](https://github.com/amokprime/linebyline/tree/main/skills/code-quality/SKILL.md) → "Bash workflow scripts" for its behavior.
```
skills/code-quality/scripts/lint_gate.sh
```
## Setup
- Scripts default to the repo root `~/GitHub/linebyline`; set the `LINEBYLINE_ROOT` environment variable to point somewhere else.
- If not on a Fedora distro, replace `wl-copy` with the equivalent.
- Make the scripts executable (except for `prepare.sh` and `deploy.sh` — those are not directly invoked).
- They assume that the repo is at `~/GitHub/linebyline`, and that zips are downloaded into `~/GitHub/linebyline/scratch/`.
- If your paths differ, customize paths and add an exception for `unpack.sh`'s path (i.e. `nano .git/info/exclude`).
- `unpack.sh` can be double-clicked (popup terminal) or run from a terminal.