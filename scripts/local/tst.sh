#!/usr/bin/env bash
# tst.sh — run Playwright tests on the Server via SSH.
#
# Canonical Playwright runner for LineByLine. Both manual terminal invocation
# AND deploy.sh drive this script (dedup pattern from the shared lint gate).
# This script owns local refinements (trace.zip prune, popup terminal,
# notify-send); the server's scripts/server/tst owns server-side refinements
# (Syncthing sync, podman, trash/ artifact pull).
#
# Popup terminal: when stdout is NOT a TTY (double-clicked in a file manager),
# re-launches itself in a popup ghostty window so ssh output is visible.
# Terminal invocations already have a TTY and skip the popup. deploy.sh sets
# LBL_NO_POPUP=1 to skip the popup when calling this script programmatically
# (its stdout is piped through tee, so ! -t 1 would falsely trigger the popup).
#
# Install: `ln -s ~/GitHub/linebyline/scripts/local/tst.sh ~/.local/bin/tst`
# Usage: tst [playwright args...]
#   e.g. tst --list
#        tst tests/foo.spec.js
#        tst -g "login"
#        tst --update-snapshots

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"

# ── Popup terminal on double-click ──────────────────────────────────────────
# Skip when LBL_NO_POPUP=1 (deploy.sh sets this — its piped stdout would
# falsely trigger the popup). Skip when stdout IS a TTY (terminal invocation).
if [[ "${LBL_NO_POPUP:-0}" != "1" && ! -t 1 ]]; then
  if command -v ghostty >/dev/null 2>&1; then
    exec ghostty -e bash -c 'LBL_POPUP=1 exec "$@"' _ "$0" "$@"
  fi
  echo "WARNING: stdout is not a TTY and ghostty is not installed." >&2
  echo "WARNING: install ghostty, or run from a terminal." >&2
fi

# ── Snapshot regen mode ──────────────────────────────────────────────────────
# When LBL_UPDATE_SNAPSHOTS=1 (set by deploy.sh when a .update-snapshots flag
# file is present in the deliver.zip), pass --update-snapshots to the server's
# tst. This regenerates any snapshots that don't match the current app output
# AND runs the tests. If the test was failing only because of a snapshot
# mismatch, it will now pass. A followup `tst` is NOT needed —
# --update-snapshots runs the full test suite after regenerating.
TST_ARGS=("$@")
if [[ "${LBL_UPDATE_SNAPSHOTS:-0}" == "1" ]]; then
  TST_ARGS=("--update-snapshots" "$@")
  echo "tst: snapshot regen mode (--update-snapshots)"
fi

# ── Pre-test client-side Syncthing sync ──────────────────────────────────────
# Skipped for scoped runs (-g flag) — the server's tst also skips its sync
# check for -g runs. Skipped if SYNCTHING_API_KEY / SYNCTHING_LBL_ID /
# SYNCTHING_SERVER_ID env vars are not set (bare `ssh Server tst` still works).
# The server's tst does its own server-side rescan + wait-for-idle, which is
# sufficient to detect + confirm the client's pushed changes. A scan at either
# end triggers the sync; the server-side wait-for-idle confirms completion.
if [[ -n "${SYNCTHING_API_KEY:-}" && -n "${SYNCTHING_LBL_ID:-}" && -n "${SYNCTHING_SERVER_ID:-}" ]]; then
  if echo "$*" | grep -q -- '-g'; then
    echo "tst: scoped run (-g) — skipping client-side Syncthing sync"
  else
    echo "tst: triggering Syncthing rescan of linebyline folder..."
    curl -s -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
      "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID" >/dev/null 2>&1 || true
    echo "tst: polling server completion..."
    for _ in $(seq 1 60); do
      pct=$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
        "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
        2>/dev/null | jq -r '.completion // 0' 2>/dev/null || echo 0)
      if [[ "$pct" == "100" ]]; then
        echo "tst: sync complete (100%)."
        break
      fi
      sleep 2
    done
  fi
fi

# ── Run Playwright on the server ──────────────────────────────────────────────
# Use -F "$HOME/.ssh/config" to bypass system SSH config files — inside the
# bwrap sandbox (deploy.sh), /etc/ssh/ssh_config.d/*.conf may have wrong
# ownership/permissions, causing "Bad owner or permissions" errors.
# Use -o ControlMaster=no -o ControlPath=none to disable connection multiplexing
# — the bwrap sandbox makes ~/.ssh/ read-only, so ssh can't create the
# ControlPath socket. Disabling multiplexing is safe here (each tst run is a
# single ssh invocation; no benefit from multiplexing).
# shellcheck disable=SC2029
# Intentional: args expand client-side so the server's `tst` script receives
# them as positional args.
ssh -F "$HOME/.ssh/config" -o ControlMaster=no -o ControlPath=none Server tst "${TST_ARGS[@]}" 2>&1 | \
  grep -E "^\s+[0-9]+\) \[|Error:|Expected:|Received:|at /workspace/tests/|passed|failed|skipped|writing actual|does not match|tst:|WARNING" || true

# ── Post-test trace.zip prune ─────────────────────────────────────────────────
# trace.zip files inflate Syncthing upload size. Prune on the server.
ssh -F "$HOME/.ssh/config" -o ControlMaster=no -o ControlPath=none Server "find ~/GitHub/linebyline/trash -type f -name 'trace.zip' -delete 2>/dev/null" || true
# Also prune any trace.zip that already synced to the client's scratch/upload/trash/.
find "$DEST/scratch/upload/trash" -type f -name 'trace.zip' -delete 2>/dev/null || true

notify-send "Tests done."

# Pause if running in popup mode (double-click case).
if [[ "${LBL_POPUP:-0}" == "1" ]]; then
  echo ""
  read -rp "Press Enter to close this window..."
fi
