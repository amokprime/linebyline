#!/bin/bash
# lint_gate.sh — shared blocking lint gate for Bash + Python + JavaScript/TypeScript.
#
# Sourced by both prepare.sh (sandbox-side, before zipping) and deploy.sh
# (user-side, after deploying files). Runs every linter that's installed;
# fails (exit 1) if any linter finds issues after autofix.
#
# Usage (source this file, then call run_lint_gate):
#   . /path/to/lint_gate.sh
#   run_lint_gate "$TARGET_DIR" "src/" "${changed_files[@]}"
#
# Linters run (in order):
#   1. Shellcheck — *.sh files (no autofix; blocking on findings)
#   2. Ruff — *.py files (autofix via `ruff check --fix`, then gate via `ruff check`)
#   3. ESLint — src/** (autofix via `--fix`, then gate)
#
# Each linter is skipped if not installed or if no matching files exist.
# The gate is BLOCKING: if any linter that IS installed finds issues after
# autofix, the function returns 1 (and the caller should exit).
#
# Also defines check_sonar_exclusions() — a non-blocking JIT reminder that
# warns when deploy_file rel-paths are not covered by sonarcloud.yml's
# Dsonar.exclusions or Dsonar.coverage.exclusions.

set -euo pipefail

# run_lint_gate <target_dir> [<eslint_scope>] [<changed_files...>]
#   target_dir: the directory to lint (repo root or sandbox project tree)
#   eslint_scope: optional, defaults to "src/" — the ESLint target scope
#   changed_files: optional, absolute paths of specific files changed this
#     deploy. If provided, Shellcheck/Ruff scan ONLY these files (not the
#     full target_dir depth-0 scan). ESLint always scans eslint_scope
#     (it's project-tree-aware — needs eslint.config.mjs). If not provided,
#     falls back to the find-based depth-0 scan (prepare.sh context).
run_lint_gate() {
  local target_dir="$1"
  shift
  local eslint_scope="${1:-src/}"
  [[ $# -gt 0 ]] && shift
  local changed_files=("$@")
  local lint_failed=0

  echo "=== Lint gate (Shellcheck + Ruff + ESLint) ==="
  echo "Target: $target_dir"
  if [[ ${#changed_files[@]} -gt 0 ]]; then
    echo "Mode: changed-files-only (${#changed_files[@]} file(s))"
  else
    echo "Mode: depth-0 scan"
  fi

  # ── Shellcheck ──────────────────────────────────────────────────────────────
  echo ""
  echo "--- Shellcheck (*.sh) ---"
  if ! command -v shellcheck >/dev/null 2>&1; then
    echo "  (skipped: shellcheck not installed)"
  else
    local sh_files=()
    if [[ ${#changed_files[@]} -gt 0 ]]; then
      # Changed-files mode: only lint .sh files from the changed list
      for f in "${changed_files[@]}"; do
        [[ -f "$f" && "$f" == *.sh ]] && sh_files+=("$f")
      done
    else
      # Depth-0 scan mode: find all .sh files in the target dir
      while IFS= read -r f; do
        sh_files+=("$f")
      done < <(find "$target_dir" -maxdepth 1 -name '*.sh' -type f | sort)
      # Also check .base.sh-style dotfiles
      while IFS= read -r f; do
        sh_files+=("$f")
      done < <(find "$target_dir" -maxdepth 1 -name '.*.sh' -type f | sort)
    fi

    if [[ ${#sh_files[@]} -eq 0 ]]; then
      if [[ ${#changed_files[@]} -gt 0 ]]; then
        echo "  (no .sh files changed this deploy)"
      else
        echo "  (no .sh files found in $target_dir)"
      fi
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
    if [[ ${#changed_files[@]} -gt 0 ]]; then
      # Changed-files mode: only lint .py files from the changed list
      for f in "${changed_files[@]}"; do
        [[ -f "$f" && "$f" == *.py ]] && py_files+=("$f")
      done
    else
      # Depth-0 scan mode: find all .py files in the target dir
      while IFS= read -r f; do
        py_files+=("$f")
      done < <(find "$target_dir" -maxdepth 1 -name '*.py' -type f | sort)
    fi

    if [[ ${#py_files[@]} -eq 0 ]]; then
      if [[ ${#changed_files[@]} -gt 0 ]]; then
        echo "  (no .py files changed this deploy)"
      else
        echo "  (no .py files found in $target_dir)"
      fi
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
  # ESLint scans the full eslint_scope (typically src/) — it's
  # project-tree-aware and needs eslint.config.mjs to resolve imports.
  # Changed-files mode doesn't apply to ESLint; we can't lint individual
  # .ts/.vue files without the project context.
  #
  # Skip ESLint if in changed-files mode AND no changed files are under src/.
  # If no src/ files changed, ESLint on src/ would pass trivially (code hasn't
  # changed) — skipping saves ~5-10s per deploy. Shellcheck + Ruff on the
  # changed .sh/.py files still run (they're the delivery scripts).
  echo ""
  echo "--- ESLint ($eslint_scope) ---"
  local eslint_bin="$target_dir/node_modules/.bin/eslint"
  local eslint_config="$target_dir/eslint.config.mjs"

  # Check if any changed file is under src/ (or the eslint_scope dir).
  local has_src_changes=0
  if [[ ${#changed_files[@]} -gt 0 ]]; then
    local src_prefix="$target_dir/$eslint_scope"
    # Trim trailing slash if present (src/ → src)
    src_prefix="${src_prefix%/}"
    for f in "${changed_files[@]}"; do
      if [[ "$f" == "$src_prefix"/* ]]; then
        has_src_changes=1
        break
      fi
    done
    if [[ "$has_src_changes" -eq 0 ]]; then
      echo "  (no $eslint_scope files changed this deploy — skipping ESLint)"
      # Jump to summary
      echo ""
      if [[ "$lint_failed" -ne 0 ]]; then
        echo "=== Lint gate: FAILED ===" >&2
        echo "Fix the issues above, then re-run." >&2
        return 1
      else
        echo "=== Lint gate: PASSED ==="
      fi
      return 0
    fi
  fi

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

# check_sonar_exclusions <deploy_sh_path> <repo_root>
#   Non-blocking JIT reminder: warns when a deploy_file rel-path is NOT
#   covered by either Dsonar.exclusions or Dsonar.coverage.exclusions in
#   <repo_root>/.github/workflows/sonarcloud.yml.
#
#   Non-blocking: returns 0 even if uncovered paths are found (warning only).
#   Skips silently if sonarcloud.yml is missing.
check_sonar_exclusions() {
  local deploy_sh="$1"
  local repo_root="$2"
  local sonar_yml="$repo_root/.github/workflows/sonarcloud.yml"

  if [[ ! -f "$deploy_sh" ]]; then
    return 0
  fi
  if [[ ! -f "$sonar_yml" ]]; then
    echo "  (skipped: $sonar_yml not found)"
    return 0
  fi

  local exclusions=""
  local coverage_exclusions=""
  while IFS= read -r line; do
    case "$line" in
      *"-Dsonar.exclusions="*)
        exclusions="${line#*-Dsonar.exclusions=}"
        ;;
      *"-Dsonar.coverage.exclusions="*)
        coverage_exclusions="${line#*-Dsonar.coverage.exclusions=}"
        ;;
    esac
  done < "$sonar_yml"

  local all_excludes="${exclusions},${coverage_exclusions}"
  if [[ -z "$exclusions" && -z "$coverage_exclusions" ]]; then
    echo "  (skipped: no Dsonar.exclusions found in $sonar_yml)"
    return 0
  fi

  local patterns=()
  IFS=',' read -r -a patterns <<< "$all_excludes"

  local uncovered=()
  local rel
  while IFS= read -r rel; do
    [[ -z "$rel" ]] && continue
    local matched=0
    for pat in "${patterns[@]}"; do
      [[ -z "$pat" ]] && continue
      if [[ "$rel" == "$pat" ]]; then
        matched=1
        break
      fi
      if [[ "${pat: -3}" == "/**" ]]; then
        local prefix="${pat:0:-3}"
        if [[ "$rel" == "$prefix"/* ]]; then
          matched=1
          break
        fi
      fi
    done
    if [[ "$matched" -eq 0 ]]; then
      uncovered+=("$rel")
    fi
  done < <(awk '$1 == "deploy_file" {print $3}' "$deploy_sh" | tr -d "\"'")

  if [[ ${#uncovered[@]} -gt 0 ]]; then
    echo "  SonarCloud exclusion coverage warning:"
    echo "    The following deploy_file rel-paths are NOT covered:"
    for f in "${uncovered[@]}"; do
      echo "      $f"
    done
    echo ""
    echo "    If any of these are non-source files, add them to the appropriate"
    echo "    exclusion list in sonarcloud.yml — saves a separate commit."
    echo "    Source files in src/ are EXPECTED to be uncovered."
    echo ""
    echo "    (Non-blocking warning — the gate still proceeds.)"
  else
    echo "  All deploy_file paths are covered by sonarcloud.yml exclusions."
  fi
  return 0
}
