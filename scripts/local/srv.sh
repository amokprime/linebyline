#!/usr/bin/env bash
# srv.sh — start Vite preview server for manual testing (MANUAL.md).
#
# Bash port of scripts/local/srv.fish. Builds dist/ if missing, starts Vite
# preview on :5173 (if not already running), opens the URL in the default
# browser, then waits in the foreground so Ctrl+C stops the server.
#
# Popup terminal: when stdout is NOT a TTY (double-clicked), re-launches in
# a popup ghostty window so Ctrl+C works to stop the server.
#
# Install: `ln -s ~/GitHub/linebyline/scripts/local/srv.sh ~/.local/bin/srv`
# Usage: srv

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
  echo "srv: building dist/ first..."
  npm run build
fi

url="http://localhost:5173/linebyline/"

# Check if server is already running on 5173
if curl -s -o /dev/null -w '' "$url" 2>/dev/null; then
  echo "srv: Vite preview already running on $url"
  echo "srv: Opening in default browser..."
  xdg-open "$url" >/dev/null 2>&1 &
  # In popup mode, pause so the user can read the message before the window closes.
  if [[ "${LBL_POPUP:-0}" == "1" ]]; then
    read -rp "Press Enter to close this window..."
  fi
  exit 0
fi

echo "srv: starting Vite preview on $url"
# Start server in background, poll until ready, then open browser
npx --ignore-scripts vite preview --port 5173 --strictPort >/dev/null 2>&1 &
srv_pid=$!

# Poll up to 10s for the server to be ready
for _ in $(seq 1 40); do
  if curl -s -o /dev/null -w '' "$url" 2>/dev/null; then
    echo "srv: server ready, opening in default browser..."
    xdg-open "$url" >/dev/null 2>&1 &
    # Bring the server to foreground so Ctrl+C stops it
    wait "$srv_pid"
    exit $?
  fi
  sleep 0.25
done

echo "srv: WARNING — server didn't become ready in 10s, opening browser anyway"
xdg-open "$url" >/dev/null 2>&1 &
wait "$srv_pid"
