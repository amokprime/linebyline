#!/bin/bash
# unpack.sh — user-side wrapper: extracts deliver.zip, deploys files, waits
# for Syncthing, runs tests, and cleans up.
#
# Lives at ai/chat.z.ai/scripts/delivery/unpack.sh. Run via the fish
# abbreviation:
#   abbr --add dpl '~/GitHub/linebyline/ai/chat.z.ai/scripts/delivery/unpack.sh'
#
# Must be run from a terminal (not double-clicked) — the ssh + notify-send
# output needs a visible terminal. The `delivery/` subdir keeps this away
# from the double-click silent scripts in `ai/chat.z.ai/scripts/`.
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - LINEBYLINE_ROOT override (no hardcoded /home/user/... paths)
#   - -- on rm to prevent option injection
#   - unzip -o for collision prevention (overwrites stale files from a
#     failed previous run)
#   - Errors on stderr with explicit exit codes
set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"

if [ ! -d "$SCRATCH" ]; then
  echo "ERROR: scratch directory not found: $SCRATCH" >&2
  exit 1
fi

cd "$SCRATCH"

if [ ! -f "deliver.zip" ]; then
  echo "ERROR: deliver.zip not found in $SCRATCH — download it from chat.z.ai first" >&2
  exit 1
fi

# Extract — -o overwrites any stale files from a failed previous run
# (collision prevention). -qq suppresses output.
unzip -oqq deliver.zip

# Deploy — deploy.sh handles its own collision cleanup for the repo files.
# If deploy.sh fails, set -e aborts. deliver.zip + deploy.sh remain in
# scratch/ for inspection; the next run's `unzip -o` overwrites them.
chmod +x deploy.sh
./deploy.sh

# Wait for Syncthing to sync deployed files to the Server.
# 60s is empirical — adjust if your Syncthing setup is slower/faster.
# A smarter check would poll the Syncthing REST API for sync completion,
# but that requires auth and is overkill for this workflow.
sleep 60

# Run tests on the Server via SSH. `&&` means notify-send only fires if
# tests pass (ssh exits 0). If ssh fails, set -e aborts before cleanup —
# deliver.zip + deploy.sh remain for debugging; the next run's `unzip -o`
# overwrites them.
ssh Server tst && notify-send "Tests done."

# Cleanup — only runs if everything succeeded. deploy.sh already removed
# all extracted files except itself and deliver.zip.
rm -f -- deliver.zip deploy.sh
