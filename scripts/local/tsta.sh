#!/usr/bin/env bash
# tsta.sh — Playwright UI mode against the Vite build.
#
# Bash port of scripts/local/tsta.fish. Builds dist/ if missing, ensures a
# Vite preview server is running on :5173, then launches `playwright test --ui`.
#
# Popup terminal: when stdout is NOT a TTY (double-clicked), re-launches in
# a popup ghostty window so the Playwright UI + terminal output is visible.
#
# Install: `ln -s ~/GitHub/linebyline/scripts/local/tsta.sh ~/.local/bin/tsta`
# Usage: tsta [playwright args...]

set -euo pipefail

# ── Popup terminal on double-click ──────────────────────────────────────────
# Skip when LBL_NO_POPUP=1 (programmatic callers). Skip when stdout IS a TTY.
if [[ "${LBL_NO_POPUP:-0}" != "1" && ! -t 1 ]]; then
  if command -v ghostty >/dev/null 2>&1; then
    exec ghostty -e bash -c 'LBL_POPUP=1 exec "$@"' _ "$0" "$@"
  fi
  echo "WARNING: stdout is not a TTY and ghostty is not installed." >&2
  echo "WARNING: install ghostty, or run from a terminal." >&2
fi

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
cd "$DEST"

# vite preview requires dist/ — build if missing
if [[ ! -d dist ]]; then
  echo "tsta: building dist/ first..."
  npm run build
fi

need_cleanup=false

# Ensure Vite preview server is running on port 5173
if ! curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null; then
  echo "tsta: starting Vite preview on :5173 ..."
  npx vite preview --port 5173 --strictPort >/dev/null 2>&1 &
  need_cleanup=true
  # Wait up to 5s for it to be ready
  for _ in $(seq 1 20); do
    if curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null; then
      break
    fi
    sleep 0.25
  done
fi

# LBL_VITE_TARGET=1 tells playwright.config.js to expect Vite preview on :5173.
# The config's webServer has reuseExistingServer: true locally, so it reuses.
LBL_VITE_TARGET=1 npx playwright test --ui "$@"

# Kill the server we started; leave pre-existing ones alone
if [[ "$need_cleanup" == true ]]; then
  fuser -k 5173/tcp 2>/dev/null || true
fi

# Pause if running in popup mode (double-click case).
if [[ "${LBL_POPUP:-0}" == "1" ]]; then
  echo ""
  read -rp "Press Enter to close this window..."
fi
