#!/bin/bash
# unpack.sh -- user-side deployment script. Run via the `dpl` fish abbreviation
# (abbr --add dpl '~/GitHub/linebyline/skills/delivery/scripts/unpack.sh')
# from a terminal (NOT double-clicked) so ssh + npm output is visible.
#
# Thin wrapper: extracts deliver.zip to scratch/, snapshots the zip contents
# so deploy.sh can do scoped cleanup, runs deploy.sh inside a bwrap sandbox
# for extra safety, then removes deploy.sh + deliver.zip + .deliver-files.list.
#
# The heavy lifting (deploy files, npm install, run tests, scoped cleanup)
# lives in deploy.sh -- keeps unpack.sh a thin wrapper that just handles
# extraction + sandbox setup + handoff.
#
# bwrap sandbox (if available):
#   --clearenv: clears all env vars, then re-adds only what deploy.sh needs
#   Read-only overlays: .git/, archive/, unpack.sh itself (the bwrap filter)
#   Blocked (tmpfs): trash/, playwright-report/, test-results/, blob-report/,
#     .obsidian/, .stfolder/, .stversions/
#   If bwrap isn't installed, deploy.sh runs directly with a warning.
#
# Tradeoff: unpack.sh is read-only inside the sandbox. Future edits to
# unpack.sh must be deployed manually (copy the file, don't use dpl) -- a
# malicious deliver.zip can't modify the bwrap filter for future runs.
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - LINEBYLINE_ROOT override (config over constants)
#   - unzip -oqq -- -o overwrites stale files from a failed previous run
#   - EXIT trap cleans up deploy.sh + deliver.zip + .deliver-files.list on
#     ALL exits (success, failure, signal).

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"
DELIVER_ZIP="$SCRATCH/deliver.zip"
DEPLOY_SH="$SCRATCH/deploy.sh"
DELIVER_LIST="$SCRATCH/.deliver-files.list"
TST="$DEST/scripts/tst"

# ── EXIT-trap cleanup ────────────────────────────────────────────────────────
# Runs on ALL exits -- success, set -e failure, INT/TERM signal.
cleanup() {
  rm -f -- "${DEPLOY_SH:?}" "${DELIVER_ZIP:?}" "${DELIVER_LIST:?}"
  echo "" >&2
  echo "Cleaned up deploy.sh + deliver.zip + .deliver-files.list." >&2
}
trap cleanup EXIT

# ── Sanity checks ────────────────────────────────────────────────────────────
if [[ ! -d "$SCRATCH" ]]; then
  echo "ERROR: scratch dir not found: $SCRATCH" >&2
  exit 1
fi
if [[ ! -f "$DELIVER_ZIP" ]]; then
  echo "ERROR: deliver.zip not found at $DELIVER_ZIP" >&2
  echo "Download deliver.zip from the chat first." >&2
  exit 1
fi

cd "$SCRATCH"

# Snapshot the zip's contents before extraction so deploy.sh can clean up
# ONLY the files that came from the zip (plus deliver.zip and deploy.sh).
unzip -l "$DELIVER_ZIP" | awk 'NR>3 && $4 != "" {print $4}' > "$DELIVER_LIST"

# Extract (-o overwrites stale files from a failed previous run; -qq = quiet).
unzip -oqq "$DELIVER_ZIP"

# Run deploy.sh
chmod +x "$DEPLOY_SH"
chmod +x "$TST"

# ── bwrap sandbox ────────────────────────────────────────────────────────────
# If bwrap is available, run deploy.sh inside a sandbox with:
#   - Cleared env (only essential vars passed through)
#   - Read-only system paths (/usr, /etc, /lib, /bin, /sbin, /run)
#   - Read-write: /tmp, /dev, /proc, repo root ($DEST)
#   - Read-only SSH keys (~/.ssh) and Python tools (~/.local; binding the
#     whole tree so ~/.local/bin symlinks into ~/.local/share resolve)
#   - Read-only overlays on .git/, archive/, unpack.sh (the filter itself)
#   - Blocked (tmpfs): trash/, playwright-report/, test-results/,
#     blob-report/, .obsidian/, .stfolder/, .stversions/
#
# Warnings when a deploy runs into the filter:
#   - Read-only paths: EROFS errors from deploy.sh commands naturally appear
#     in deploy.log (deploy.sh tees output to $LOG).
#   - Blocked (tmpfs) paths: writes silently go to tmpfs (discarded on exit).
#     deploy.sh doesn't access these locally (only on the server via SSH).
#
# If bwrap is NOT available, run deploy.sh directly with a warning.
if command -v bwrap >/dev/null 2>&1; then
  # Build bwrap args array
  bwrap_args=()

  # ── Clear env, re-add essentials ─────────────────────────────────────────
  bwrap_args+=(
    --clearenv
    --setenv HOME "$HOME"
    --setenv USER "${USER:-$(whoami)}"
    --setenv PATH "$PATH"
    --setenv LINEBYLINE_ROOT "$DEST"
    # SSH: use ~/.ssh/config only, skip /etc/ssh/ssh_config.d/ (the system
    # config files have ownership issues inside bwrap's user namespace --
    # "Bad owner or permissions on /etc/ssh/ssh_config.d/...". The user's
    # ~/.ssh/config has the Server Host block, which is all deploy.sh needs.)
    --setenv GIT_SSH_COMMAND "ssh -F $HOME/.ssh/config"
    --setenv SSH_AUTH_SOCK "${SSH_AUTH_SOCK:-}"
  )

  # Syncthing env vars (optional -- deploy.sh uses them for pre-Playwright sync)
  [[ -n "${SYNCTHING_API_KEY:-}" ]] && bwrap_args+=(--setenv SYNCTHING_API_KEY "$SYNCTHING_API_KEY")
  [[ -n "${SYNCTHING_LBL_ID:-}" ]] && bwrap_args+=(--setenv SYNCTHING_LBL_ID "$SYNCTHING_LBL_ID")
  [[ -n "${SYNCTHING_SERVER_ID:-}" ]] && bwrap_args+=(--setenv SYNCTHING_SERVER_ID "$SYNCTHING_SERVER_ID")

  # Display/DBus for notify-send at the end of deploy.sh (optional)
  [[ -n "${DISPLAY:-}" ]] && bwrap_args+=(--setenv DISPLAY "$DISPLAY")
  [[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] && bwrap_args+=(--setenv DBUS_SESSION_BUS_ADDRESS "$DBUS_SESSION_BUS_ADDRESS")
  [[ -n "${XDG_RUNTIME_DIR:-}" ]] && bwrap_args+=(--setenv XDG_RUNTIME_DIR "$XDG_RUNTIME_DIR")

  # ── System paths (read-only) ────────────────────────────────────────────
  # /usr contains binaries (npm, node, ssh, curl, jq) + libraries.
  # /etc contains resolv.conf (DNS), ssh_config, npm config, etc.
  bwrap_args+=(
    --ro-bind /usr /usr
    --ro-bind /etc /etc
    --bind /tmp /tmp
    --dev /dev
    --proc /proc
  )

  # Distro-specific symlink paths (Fedora: /lib → /usr/lib, /bin → /usr/bin, etc.)
  for p in /lib /lib64 /bin /sbin; do
    [[ -e "$p" ]] && bwrap_args+=(--ro-bind "$p" "$p")
  done

  # /run for D-Bus socket, SSH agent socket (read-only -- connectable but
  # can't create/delete files in /run).
  [[ -d /run ]] && bwrap_args+=(--ro-bind /run /run)

  # ── SSH keys (read-only) ────────────────────────────────────────────────
  [[ -d "$HOME/.ssh" ]] && bwrap_args+=(--ro-bind "$HOME/.ssh" "$HOME/.ssh")

  # ── ~/.local (read-only) ────────────────────────────────────────────────
  # pip/uv install Python tools here. Without this bind, the bwrap sandbox
  # can't see them even if PATH includes the dir.
  #
  # Bind all of ~/.local, NOT just ~/.local/bin: the executables there are
  # commonly symlinks whose targets live under ~/.local/share (e.g.
  # `ruff -> ~/.local/share/uv/tools/ruff/bin/ruff`). Binding only
  # ~/.local/bin leaves the symlink dangling in the sandbox, so
  # `command -v ruff` and `test -x` both fail even though the path is on
  # PATH -- the "ruff not installed" lint-gate bug.
  [[ -d "$HOME/.local" ]] && bwrap_args+=(--ro-bind "$HOME/.local" "$HOME/.local")

  # ── Repo root (read-write -- deploy.sh deploys files here) ───────────────
  bwrap_args+=(--bind "$DEST" "$DEST")

  # ── Read-only overlays (must come AFTER --bind above to take effect) ────
  # .git/ -- git history shouldn't be modified by deploy
  [[ -d "$DEST/.git" ]] && bwrap_args+=(--ro-bind "$DEST/.git" "$DEST/.git")
  # archive/ -- historical artifacts, read-only
  [[ -d "$DEST/archive" ]] && bwrap_args+=(--ro-bind "$DEST/archive" "$DEST/archive")
  # unpack.sh itself -- the bwrap filter; must be deployed manually
  [[ -f "$DEST/skills/delivery/scripts/unpack.sh" ]] && bwrap_args+=(--ro-bind "$DEST/skills/delivery/scripts/unpack.sh" "$DEST/skills/delivery/scripts/unpack.sh")
  # scripts/tst -- the canonical server tst script; deployed manually (symlinked
  # to ~/.local/bin/tst). Read-only so a malicious deliver.zip can't modify it.
  [[ -f "$DEST/scripts/tst" ]] && bwrap_args+=(--ro-bind "$DEST/scripts/tst" "$DEST/scripts/tst")

  # ── Blocked paths (tmpfs -- empty, writes discarded on exit) ─────────────
  # These paths are NOT needed locally by deploy.sh:
  #   trash/ -- Playwright artifacts (accessed on server via SSH)
  #   playwright-report/ -- Playwright HTML report (server-side)
  #   test-results/ -- Playwright test results (server-side)
  #   blob-report/ -- Playwright blob report (server-side)
  #   .obsidian/ -- Obsidian config (not a deploy target)
  #   .stfolder/ -- Syncthing marker (not a deploy target)
  #   .stversions/ -- Syncthing versioning (not a deploy target)
  for p in trash playwright-report test-results blob-report .obsidian .stfolder .stversions; do
    bwrap_args+=(--tmpfs "$DEST/$p")
  done

  # ── Run deploy.sh inside the sandbox ─────────────────────────────────────
  # shellcheck disable=SC2086
  bwrap "${bwrap_args[@]}" -- "$DEPLOY_SH"
else
  echo "WARNING: bwrap not installed -- running deploy.sh without sandbox." >&2
  echo "WARNING: install bubblewrap (dnf install bubblewrap) for sandbox isolation." >&2
  "$DEPLOY_SH"
fi

echo "Done."
