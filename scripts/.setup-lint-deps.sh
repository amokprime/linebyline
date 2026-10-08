#!/bin/bash
# .setup-lint-deps.sh — install Python lint tools (ruff) into a project-contained
# venv at .lint-deps/. Works both sandbox-side (chat.z.ai) and locally.
#
# Uses `uv` if available (faster), falls back to `python3 -m venv` + `pip`.
# Idempotent: skips if .lint-deps/bin/ruff already exists and is executable.
# Legacy migration: a pre-existing --target dir lacking pyvenv.cfg is removed
# and replaced with a proper venv.
#
# The venv is self-contained: console scripts get an absolute shebang
# (.lint-deps/bin/python3), so they don't depend on ambient PYTHONPATH or
# system site-packages. This is more robust than `pip install --target`
# (which uses a bare #!/usr/bin/python3 shebang + ambient package discovery).
#
# Called by:
#   - scripts/.setup-sandbox.sh (delegates its pip block here)
#   - skills/delivery/scripts/deploy.sh (auto-installs when no system ruff)
#   - manually: bash scripts/.setup-lint-deps.sh

set -euo pipefail

repo_root="${1:-${LINEBYLINE_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}}"
lint_deps="$repo_root/.lint-deps"
req_file="$repo_root/requirements-dev.txt"

if [[ ! -f "$req_file" ]]; then
  echo "ERROR: $req_file not found" >&2
  exit 1
fi

# Idempotent: skip if .lint-deps/bin/ruff exists and is executable.
if [[ -x "$lint_deps/bin/ruff" ]]; then
  echo "Already installed: $lint_deps/bin/ruff"
  echo "  (delete $lint_deps to force reinstall)"
  exit 0
fi

# Legacy migration: if .lint-deps exists but lacks pyvenv.cfg, it's a
# --target dir from the old mechanism. Remove and recreate as venv.
if [[ -d "$lint_deps" && ! -f "$lint_deps/pyvenv.cfg" ]]; then
  echo "Migrating legacy --target dir to venv..."
  rm -rf -- "${lint_deps:?}"
fi

echo "Creating venv $lint_deps ..."

if command -v uv >/dev/null 2>&1; then
  echo "  (via uv venv)"
  uv venv "$lint_deps" 2>&1
  echo "Installing dependencies from $req_file (via uv pip)..."
  uv pip install --python "$lint_deps/bin/python" -r "$req_file" 2>&1
else
  echo "  (via python3 -m venv)"
  if ! python3 -m venv "$lint_deps" 2>&1; then
    echo "ERROR: venv creation failed." >&2
    echo "  On Debian/Ubuntu: apt install python3-venv" >&2
    echo "  On Fedora: dnf install python3-libs" >&2
    exit 1
  fi
  # Guard: venv without pip (ensurepip not available)
  if [[ ! -x "$lint_deps/bin/pip" ]]; then
    echo "ERROR: venv created but pip is missing (ensurepip not available)." >&2
    echo "  Install python3-pip or python3-venv with ensurepip support." >&2
    rm -rf -- "${lint_deps:?}"
    exit 1
  fi
  echo "Installing dependencies from $req_file (via pip)..."
  "$lint_deps/bin/pip" install -r "$req_file" 2>&1
fi

# Verify ruff is installed
if [[ -x "$lint_deps/bin/ruff" ]]; then
  echo "Installed: ruff $("$lint_deps/bin/ruff" --version) -> $lint_deps/bin/ruff"
else
  echo "ERROR: ruff not found in $lint_deps/bin after install" >&2
  exit 1
fi
