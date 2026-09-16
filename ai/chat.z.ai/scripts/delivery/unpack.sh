#!/bin/bash
# unpack.sh — user-side deployment script. Run via the `dpl` fish abbreviation
# (abbr --add dpl '~/GitHub/linebyline/ai/chat.z.ai/scripts/delivery/unpack.sh')
# from a terminal (NOT double-clicked) so ssh + npm output is visible.
#
# Thin wrapper: extracts deliver.zip to scratch/, snapshots the zip contents
# so deploy.sh can do scoped cleanup, runs deploy.sh, then removes deploy.sh
# + deliver.zip + .deliver-files.list.
#
# The heavy lifting (deploy files, npm install, run tests, scoped cleanup)
# lives in deploy.sh — keeps unpack.sh a thin wrapper that just handles
# extraction + handoff. This mirrors the sonar-issue-exporter pattern
# (see ai/chat.z.ai/scripts/delivery/ in that repo).
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - LINEBYLINE_ROOT override (config over constants)
#   - unzip -oqq — -o overwrites stale files from a failed previous run
#   - EXIT trap cleans up deploy.sh + deliver.zip + .deliver-files.list on
#     ALL exits (success, failure, signal). This prevents stale files from
#     colliding with the next download (KDE file picker autonames to
#     deliver(1).zip if a stale deliver.zip is still in scratch/).
#   - Errors on stderr with explicit exit codes

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"
DELIVER_ZIP="$SCRATCH/deliver.zip"
DEPLOY_SH="$SCRATCH/deploy.sh"
DELIVER_LIST="$SCRATCH/.deliver-files.list"

# ── EXIT-trap cleanup ────────────────────────────────────────────────────────
# Runs on ALL exits — success, set -e failure, INT/TERM signal. This ensures
# deliver.zip + deploy.sh + .deliver-files.list are always removed, so the
# next download doesn't collide with a stale deliver.zip (which KDE's file
# picker would autoname deliver(1).zip, requiring manual rename before dpl).
#
# The previous design (trap on INT/TERM only, leaving files on set -e failure
# "for debugging") caused the stale-file collision problem. Since deploy.sh
# is regenerated each session and deliver.zip is re-downloaded from the chat,
# there's no debugging value in leaving them behind — the user can always
# re-download.
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
# This protects pre-existing files in scratch/ (e.g. scratch.md notes,
# prior session's upload zips) from being swept by the cleanup phase.
# Writes one filename per line to .deliver-files.list (hidden dotfile so
# it doesn't collide with any real deliverable).
unzip -l "$DELIVER_ZIP" | awk 'NR>3 && $4 != "" {print $4}' > "$DELIVER_LIST"

# Extract (-o overwrites stale files from a failed previous run; -qq = quiet).
unzip -oqq "$DELIVER_ZIP"

# Run deploy.sh (deploys files, runs npm install + npm run test:unit, then
# cleans up only the zip-extracted files).
chmod +x "$DEPLOY_SH"
./deploy.sh

echo "Done."
