---
summary: Utility scripts for the LineByLine repo — sandbox setup, ad-hoc zip, fish functions, Espanso snippets.
links:
  - "[[ai/Vibecoding workflow|Vibecoding workflow]]"
---

## Sandbox setup

### .setup-sandbox.sh
- Copies project skills from `skills/<name>/SKILL.md` into the chat.z.ai sandbox's `/home/z/my-project/skills/` folder so their `description` frontmatter auto-loads into the agent's `available_skills` list. Run once at Onboard after cloning the repo; idempotent.
```
bash scripts/.setup-sandbox.sh
```

## Ad-hoc zip utility

### blank.sh + .base.sh
- `blank.sh` zips whatever is in `~/GitHub/linebyline/scratch/upload/` into a uniquely-named zip in `scratch/`, then copies the path to clipboard via `wl-copy`. Used for ad-hoc uploads of non-deliverable files (e.g. a single screenshot or test fixture).
- `.base.sh` is sourced by `blank.sh` (and was historically sourced by the now-deleted Repomix workflow scripts). It handles the zip + clipboard + stale-zip-cleanup logic.
- Can be double-clicked after setup. Aborts with an error if the upload folder is empty.

## Espanso snippets

### espanso/linebyline.yml
- Espanso match file with triggers for the standard vibecoding-step context-loading instructions. See `ai/README.md` for the current trigger list and descriptions.
- Install: `ln ~/.config/espanso/match/linebyline.yml scripts/espanso/linebyline.yml` (hardlink so both copies stay in sync).

## Fish functions

### fish/tst.fish, fish/tsta.fish, fish/cgn.fish, fish/srv.fish
- User-side Playwright helpers. `tst` runs the full suite via SSH to the Server (Podman container); `tsta` runs UI mode against local Vite preview; `cgn` runs codegen; `srv` starts a Vite preview server for manual testing. These are user-side only — the chat.z.ai sandbox cannot invoke them. See `tests/SSH_SETUP.md` and `tests/PLAYWRIGHT_SETUP.md` for the full setup.

## Syncthing sync helper

### agent-sync
- Forces the **local** Syncthing instance to push the LineByLine folder to the Server and waits for the Server to report `completion == 100` / `needBytes == 0`. Exits non-zero on timeout so it can gate a test run.
- Built for the OMP harness: `deploy.sh`'s inline force-sync needs the full user environment, which the sandbox lacks, but the Syncthing GUI API on `127.0.0.1:8384` is reachable from inside `bwrap`.
- Auto-detects the folder id (path contains `linebyline`), the API key (`~/.local/state/syncthing/config.xml`), and the peer (the SSH `HostName` matched against Syncthing's reported connection addresses). Override with `LBL_SYNC_FOLDER_ID`, `LBL_SYNC_DEVICE_ID`, `SYNCTHING_API_KEY`, or `SYNCTHING_CONFIG`.
```
scripts/agent-sync [--timeout SECONDS] [--quiet]
```
- Note: `agent-tst -g <pattern>` deliberately skips the Server-side sync check (see `scripts/tst`), so run `agent-sync` first when the Server must see the current working tree.

## Delivery scripts

The delivery workflow scripts (`prepare.sh`, `deploy.sh`, `unpack.sh`, `lint_markdown.py`, `split_bullets.py`) live at `skills/delivery/scripts/` — packaged as a skill. See `skills/delivery/SKILL.md` for documentation.

## Setup
- Scripts default to the repo root `~/GitHub/linebyline`; set the `LINEBYLINE_ROOT` environment variable to point somewhere else
- If not on a Fedora distro, replace `wl-copy` with the equivalent
- Make the scripts executable (except for `.base.sh`, `prepare.sh`, and `deploy.sh`)
- They assume that the repo is at `~/GitHub/linebyline`, and that zips are downloaded into `~/GitHub/linebyline/scratch/`
- If your paths differ, customize paths and add an exception for `unpack.sh`'s path (i.e. `nano .git/info/exclude`)
- `unpack.sh` should be run from the terminal to view output
