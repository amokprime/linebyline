#!/bin/bash
# unpack.sh — user-side deployment script. Run via the `dpl` fish abbreviation
# (abbr --add dpl '~/GitHub/linebyline/ai/chat.z.ai/scripts/delivery/unpack.sh')
# from a terminal (NOT double-clicked) so ssh + notify-send output is visible.
#
# Extracts deliver.zip to scratch/, runs the per-session deploy.sh, then
# cleans up. The Syncthing-wait + Playwright-test blocks are commented out
# by default for src/** patches — see the comments below those blocks for
# the rationale and the procedure to re-enable them.
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - LINEBYLINE_ROOT override (config over constants)
#   - unzip -oqq — -o overwrites stale files from a failed previous run
#   - INT/TERM trap cleans up deploy.sh + deliver.zip on Ctrl+C
#     (set -e failure does NOT trigger this trap — files remain for
#      debugging per the existing documented behavior; next run's
#      `unzip -oqq` overwrites anyway)
#   - Errors on stderr with explicit exit codes

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"
DELIVER_ZIP="$SCRATCH/deliver.zip"
DEPLOY_SH="$SCRATCH/deploy.sh"

# ── Signal-trap cleanup ──────────────────────────────────────────────────────
# Ctrl+C during the (commented-out) wait/test steps leaves deploy.sh and
# deliver.zip in scratch/, requiring manual cleanup. The trap fires only on
# INT/TERM — set -e failures leave files for debugging (existing behavior).
# Note: the prior turn's deploy-log.md reported this as a "hang" — it was
# actually 8.3 minutes of Playwright tests, not a real hang. The trap is
# still useful for Ctrl+C during any future long-running step.
cleanup() {
  rm -f -- "${DEPLOY_SH:?}" "${DELIVER_ZIP:?}"
  echo "" >&2
  echo "Cleaned up deploy.sh + deliver.zip (Ctrl+C caught)." >&2
}
trap cleanup INT TERM

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

# Extract (-o overwrites stale files from a failed previous run; -qq = quiet).
unzip -oqq "$DELIVER_ZIP"

# Run the per-session deploy.sh (maps flat files → repo paths).
chmod +x "$DEPLOY_SH"
./deploy.sh

# ── Syncthing wait (COMMENTED OUT — see rationale below) ─────────────────────
# The `sleep 60` was a hacky wait for Syncthing to sync changes to the test
# server before running Playwright. Two reasons it's commented out now:
#
# 1. The Playwright block below is also commented out (see rationale), so
#    there's no need to wait for sync — nothing reads the synced state.
# 2. Even when re-enabling Playwright, `sleep 60` is unreliable. Use the
#    Syncthing REST API instead (see Syncthing.md):
#      - Turn 1 Method 1: trigger an immediate rescan:
#          curl -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
#            "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID"
#      - Turn 4 Option 1: poll for completion (replaces `sleep 60`):
#          while [ "$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
#            "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
#            | jq -r .completion)" -ne 100 ]; do
#            sleep 2
#          done
#    The polling loop exits as soon as completion hits 100%, instead of
#    always waiting the full 60s.
#
# echo "Waiting 60s for Syncthing..." >&2
# sleep 60

# ── Playwright suite via SSH (COMMENTED OUT — see rationale below) ───────────
# The Playwright suite currently targets docs/index.html (the monolith) —
# see MEMORY.md → "Project invariants": "All app code lives at
# docs/index.html until the item-3 modular cutover (Phase E); src/ is
# scaffold-only until Phase C." Phase D Tranches 1–4 patched src/**, which
# docs/index.html doesn't load. The Playwright suite would pass/fail
# identically with or without the src/** patches — running it is wasted
# time (~8.3 minutes per the prior turn's deploy-log).
#
# Verification for src/** patches is the Vitest unit suite (run in-sandbox
# by the agent after each patch: 231/231 specs green; ~8s). The full
# Playwright suite stays a Phase E concern — re-enable this block (and the
# Syncthing wait above) once Phase E flips Playwright's target to the
# Vite build output. See roadmap item 1 → "After modular refactor (item
# 3), tests point at the Vite built output served by a static server in
# CI instead of docs/index.html."
#
# To re-enable (post-Phase E, or when patching docs/index.html directly):
#   1. Uncomment the Syncthing wait block above (or replace with the
#      polling loop from Syncthing.md Turn 4 Option 1).
#   2. Uncomment the ssh line below.
#
# ssh Server tst && notify-send "Tests done."

# ── Normal-exit cleanup ─────────────────────────────────────────────────────
# Disable the signal trap so Ctrl+C during the final rm doesn't recurse.
trap - INT TERM
cleanup
echo "Done."
