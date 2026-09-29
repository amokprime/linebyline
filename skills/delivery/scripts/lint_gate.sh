#!/bin/bash
# lint_gate.sh — shared blocking lint gate for Bash + Python + JavaScript/TypeScript.
#
# Sourced by both prepare.sh (sandbox-side, before zipping) and deploy.sh
# (user-side, after deploying files). Runs every linter that's installed;
# fails (exit 1) if any linter finds issues after autofix.
#
# Usage (source this file, then call run_lint_gate <target_dir>):
#   LINT_GATE_LOG=/dev/stdout  # or a log file path
#   . /path/to/lint_gate.sh
#   run_lint_gate "$TARGET_DIR"
#
# Linters run (in order):
#   1. Shellcheck — *.sh files (no autofix; blocking on findings)
#   2. Ruff — *.py files (autofix via `ruff check --fix`, then gate via `ruff check`)
#   3. ESLint — src/** (autofix via `--fix`, then gate)
#
# Each linter is skipped if not installed or if no matching files exist.
# The gate is BLOCKING: if any linter that IS installed finds issues after
# autofix, the function returns 1 (and the caller should exit).

set -euo pipefail

# run_lint_gate <target_dir> [<eslint_scope>]
#   target_dir: the directory to lint (repo root or sandbox project tree)
#   eslint_scope: optional, defaults to "src/" — the ESLint target scope
run_lint_gate() {
  local target_dir="$1"
  local eslint_scope="${2:-src/}"
  local lint_failed=0

  echo "=== Lint gate (Shellcheck + Ruff + ESLint) ==="
  echo "Target: $target_dir"

  # ── Shellcheck ──────────────────────────────────────────────────────────────
  echo ""
  echo "--- Shellcheck (*.sh) ---"
  if ! command -v shellcheck >/dev/null 2>&1; then
    echo "  (skipped: shellcheck not installed)"
  else
    local sh_files=()
    # Find all .sh files in the target dir (including dotfiles like .base.sh)
    while IFS= read -r f; do
      sh_files+=("$f")
    done < <(find "$target_dir" -maxdepth 1 -name '*.sh' -type f | sort)
    # Also check .base.sh-style dotfiles
    while IFS= read -r f; do
      sh_files+=("$f")
    done < <(find "$target_dir" -maxdepth 1 -name '.*.sh' -type f | sort)

    if [[ ${#sh_files[@]} -eq 0 ]]; then
      echo "  (no .sh files found in $target_dir)"
    else
      local sh_failed=0
      for f in "${sh_files[@]}"; do
        if ! shellcheck -x "$f" 2>&1; then
          echo "  FAIL: $f" >&2
          sh_failed=1
        fi
      done
      if [[ "$sh_failed" -ne 0 ]]; then
        echo "  Shellcheck gate FAILED — fix the issues above." >&2
        lint_failed=1
      else
        echo "  Shellcheck clean (${#sh_files[@]} files)."
      fi
    fi
  fi

  # ── Ruff (Python) ───────────────────────────────────────────────────────────
  echo ""
  echo "--- Ruff (*.py) ---"
  if ! command -v ruff >/dev/null 2>&1; then
    echo "  (skipped: ruff not installed)"
  else
    local py_files=()
    while IFS= read -r f; do
      py_files+=("$f")
    done < <(find "$target_dir" -maxdepth 1 -name '*.py' -type f | sort)

    if [[ ${#py_files[@]} -eq 0 ]]; then
      echo "  (no .py files found in $target_dir)"
    else
      # Autofix first
      echo "  Running ruff check --fix..."
      ruff check --fix "${py_files[@]}" 2>&1 || true
      # Gate (blocking)
      if ! ruff check "${py_files[@]}" 2>&1; then
        echo "  Ruff gate FAILED — fix the issues above." >&2
        lint_failed=1
      else
        echo "  Ruff clean (${#py_files[@]} files)."
      fi
    fi
  fi

  # ── ESLint (JavaScript/TypeScript) ──────────────────────────────────────────
  echo ""
  echo "--- ESLint ($eslint_scope) ---"
  local eslint_bin="$target_dir/node_modules/.bin/eslint"
  local eslint_config="$target_dir/eslint.config.mjs"
  if [[ ! -f "$eslint_config" ]]; then
    echo "  (skipped: eslint.config.mjs not found in $target_dir)"
  elif [[ ! -f "$eslint_bin" ]]; then
    echo "  (skipped: node_modules/.bin/eslint not found — run 'npm install --ignore-scripts')"
  else
    local eslint_target="$target_dir/$eslint_scope"
    if [[ ! -d "$eslint_target" ]]; then
      echo "  (skipped: $eslint_scope not found in $target_dir)"
    else
      # Autofix first
      echo "  Running eslint $eslint_scope --fix..."
      (cd "$target_dir" && ./node_modules/.bin/eslint "$eslint_scope" --fix 2>&1) || true
      # Gate (blocking)
      if ! (cd "$target_dir" && ./node_modules/.bin/eslint "$eslint_scope" 2>&1); then
        echo "  ESLint gate FAILED — fix the violations above." >&2
        lint_failed=1
      else
        echo "  ESLint clean ($eslint_scope)."
      fi
    fi
  fi

  # ── Summary ─────────────────────────────────────────────────────────────────
  echo ""
  if [[ "$lint_failed" -ne 0 ]]; then
    echo "=== Lint gate: FAILED ===" >&2
    echo "Fix the issues above, then re-run." >&2
    return 1
  else
    echo "=== Lint gate: PASSED ==="
  fi
}
