#!/bin/bash
# lint_gate.sh -- shared blocking lint gate for Bash + Python + JavaScript/TypeScript.
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
#   1. Shellcheck -- *.sh files (no autofix; blocking on findings)
#   2. Ruff -- *.py files (autofix via `ruff check --fix`, then gate via `ruff check`)
#   3. ESLint -- src/** (autofix via `--fix`, then gate)
#
# Each linter is skipped if not installed or if no matching files exist.
# The gate is BLOCKING: if any linter that IS installed finds issues after
# autofix, the function returns 1 (and the caller should exit).
#
# Also defines check_sonar_exclusions() -- a non-blocking JIT reminder that
# warns when deploy_file rel-paths are not covered by sonarcloud.yml's
# Dsonar.exclusions or Dsonar.coverage.exclusions.

set -euo pipefail

# run_lint_gate <target_dir> [<eslint_scope>] [<changed_files...>]
#   target_dir: the directory to lint (repo root or sandbox project tree)
#   eslint_scope: optional, defaults to "src/" -- the ESLint target scope
#   changed_files: optional, absolute paths of specific files changed this
#     deploy. If provided, Shellcheck/Ruff scan ONLY these files (not the
#     full target_dir depth-0 scan). ESLint always scans eslint_scope
#     (it's project-tree-aware -- needs eslint.config.mjs). If not provided,
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
  # Resolve shellcheck binary: prefer PATH, fall back to node_modules/.bin/shellcheck
  # (installed via the `shellcheck` npm devDependency in package.json).
  local sh_bin=""
  if command -v shellcheck >/dev/null 2>&1; then
    sh_bin="shellcheck"
  elif [[ -f "$target_dir/node_modules/.bin/shellcheck" ]]; then
    sh_bin="$target_dir/node_modules/.bin/shellcheck"
  fi
  if [[ -z "$sh_bin" ]]; then
    echo "  (skipped: shellcheck not installed and not in node_modules/.bin/)"
    echo "  Install via: npm install (devDependency 'shellcheck@4.1.0')"
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
        if ! "$sh_bin" -x "$f" 2>&1; then
          echo "  FAIL: $f" >&2
          sh_failed=1
        fi
      done
      if [[ "$sh_failed" -ne 0 ]]; then
        echo "  Shellcheck gate FAILED -- fix the issues above." >&2
        lint_failed=1
      else
        echo "  Shellcheck clean (${#sh_files[@]} files)."
      fi
    fi
  fi

  # ── Ruff (Python) ───────────────────────────────────────────────────────────
  echo ""
  echo "--- Ruff (*.py) ---"
  # Resolve ruff binary: prefer PATH, then .lint-deps/bin/ruff (project-contained
  # pip install via .setup-sandbox.sh), then node_modules.
  local ruff_bin=""
  if command -v ruff >/dev/null 2>&1; then
    ruff_bin="ruff"
  elif [[ -x "$HOME/.local/bin/ruff" ]]; then
    ruff_bin="$HOME/.local/bin/ruff"
  elif [[ -f "$target_dir/.lint-deps/bin/ruff" ]]; then
    ruff_bin="$target_dir/.lint-deps/bin/ruff"
  elif [[ -f "$target_dir/node_modules/.bin/ruff" ]]; then
    ruff_bin="$target_dir/node_modules/.bin/ruff"
  fi
  if [[ -z "$ruff_bin" ]]; then
    echo "  (skipped: ruff not installed)"
    echo "  Install via: bash scripts/.setup-sandbox.sh (installs to .lint-deps/)"
    echo "  Debug: PATH=$PATH"
    echo "  Debug: command -v ruff: $(command -v ruff 2>&1 || echo 'not found')"
    if [[ -L "$HOME/.local/bin/ruff" && ! -e "$HOME/.local/bin/ruff" ]]; then
      echo "  Debug: ~/.local/bin/ruff: DANGLING symlink -> $(readlink "$HOME/.local/bin/ruff" 2>/dev/null)"
      echo "  Debug:   (the symlink target is outside bwrap's mounts -- bind its target dir in unpack.sh)"
    else
      echo "  Debug: ~/.local/bin/ruff: $([[ -f "$HOME/.local/bin/ruff" ]] && echo 'exists' || echo 'missing')"
    fi
    echo "  Debug: .lint-deps/bin/ruff: $([[ -f "$target_dir/.lint-deps/bin/ruff" ]] && echo 'exists' || echo 'missing')"
    echo "  Debug: node_modules/.bin/ruff: $([[ -f "$target_dir/node_modules/.bin/ruff" ]] && echo 'exists' || echo 'missing')"
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
      "$ruff_bin" check --fix "${py_files[@]}" 2>&1 || true
      # Gate (blocking)
      if ! "$ruff_bin" check "${py_files[@]}" 2>&1; then
        echo "  Ruff gate FAILED -- fix the issues above." >&2
        lint_failed=1
      else
        echo "  Ruff clean (${#py_files[@]} files)."
      fi
    fi
  fi

  # ── ESLint (JavaScript/TypeScript) ──────────────────────────────────────────
  # ESLint scans src/ + tests/ -- it's project-tree-aware and needs
  # eslint.config.mjs to resolve imports. Changed-files mode doesn't apply
  # to ESLint; we can't lint individual .ts/.vue files without the project
  # context.
  #
  # Skip ESLint if:
  #   - changed-files mode AND no changed files are under src/ or tests/
  #   - depth-0 scan mode (no changed_files at all)
  echo ""
  echo "--- ESLint (src/ tests/ -- was: $eslint_scope) ---"
  local eslint_bin="$target_dir/node_modules/.bin/eslint"
  local eslint_config="$target_dir/eslint.config.mjs"

  # Check if any changed file is under src/ or tests/.
  local has_code_changes=0
  if [[ ${#changed_files[@]} -gt 0 ]]; then
    local src_prefix="$target_dir/src"
    local tests_prefix="$target_dir/tests"
    for f in "${changed_files[@]}"; do
      if [[ "$f" == "$src_prefix"/* || "$f" == "$tests_prefix"/* ]]; then
        has_code_changes=1
        break
      fi
    done
    if [[ "$has_code_changes" -eq 0 ]]; then
      echo "  (no src/ or tests/ files changed this deploy -- skipping ESLint)"
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
  else
    echo "  (depth-0 scan -- no changed files, skipping ESLint to save time)"
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

  if [[ ! -f "$eslint_config" ]]; then
    echo "  (skipped: eslint.config.mjs not found in $target_dir)"
  elif [[ ! -f "$eslint_bin" ]]; then
    echo "  (skipped: node_modules/.bin/eslint not found -- run 'npm install --ignore-scripts')"
  else
    # Build list of existing dirs to lint (src/ + tests/ may not both exist)
    local eslint_targets=()
    [[ -d "$target_dir/src" ]] && eslint_targets+=("src/")
    [[ -d "$target_dir/tests" ]] && eslint_targets+=("tests/")
    if [[ ${#eslint_targets[@]} -eq 0 ]]; then
      echo "  (skipped: neither src/ nor tests/ found in $target_dir)"
    else
      echo "  Running eslint ${eslint_targets[*]} --fix..."
      (cd "$target_dir" && ./node_modules/.bin/eslint "${eslint_targets[@]}" --fix --no-warn-ignored 2>&1) || true
      if ! (cd "$target_dir" && ./node_modules/.bin/eslint "${eslint_targets[@]}" --no-warn-ignored 2>&1); then
        echo "  ESLint gate FAILED -- fix the violations above." >&2
        lint_failed=1
      else
        echo "  ESLint clean (${eslint_targets[*]})."
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
    echo "    exclusion list in sonarcloud.yml -- saves a separate commit."
    echo "    Source files in src/ are EXPECTED to be uncovered."
    echo ""
    echo "    (Non-blocking warning -- the gate still proceeds.)"
  else
    echo "  All deploy_file paths are covered by sonarcloud.yml exclusions."
  fi
  return 0
}
