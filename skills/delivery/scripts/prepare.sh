#!/bin/bash
# prepare.sh — sandbox-side script that zips all deliverables in download/
# into a single deliver.zip, then removes the loose files.
#
# Usage: bash /home/z/my-project/scripts/prepare.sh
#
# Output: /home/z/my-project/download/deliver.zip
#   (contains every loose file in download/ — flat, hyphenated names,
#    no subdirectories — PLUS deploy.sh which is one of those loose files)
#
# This script does four things:
#   1. Lint all *.md files in download/ (auto-fix bare #id/[id]/[[id]],
#      warn about overlong bullets — see lint_markdown.py for details)
#   2. Verify every file listed in deploy.sh's deploy_file calls exists
#      in download/ (catches forgotten deliverables BEFORE zipping)
#   3. Run the shared lint gate (lint_gate.sh: Shellcheck + Ruff + ESLint)
#      on the deliverables in download/ AND on the sandbox project tree
#      (if node_modules is installed) — catches code quality failures
#      BEFORE zipping.
#   4. Zip everything into deliver.zip + clean up loose files
#
# The linter + expected-files check + lint gate are JIT reminders: if
# you forgot to copy a file, wrote bare #tokens in MEMORY.md, introduced a
# lint violation, or broke a unit test, this script fails before the zip
# is created. Fix the issues, then re-run.

set -euo pipefail

DOWNLOAD_DIR="/home/z/my-project/download"
ZIP="$DOWNLOAD_DIR/deliver.zip"
LINTER="/home/z/my-project/skills/delivery/scripts/lint_markdown.py"
SANDBOX_DIR="/home/z/my-project/sandbox"

# Source the shared lint gate (Shellcheck + Ruff + ESLint).
LINT_GATE="/home/z/my-project/skills/delivery/scripts/lint_gate.sh"
if [[ -f "$LINT_GATE" ]]; then
  # shellcheck source=lint_gate.sh
  . "$LINT_GATE"
fi

if [[ ! -d "$DOWNLOAD_DIR" ]]; then
  echo "ERROR: download directory not found: $DOWNLOAD_DIR" >&2
  exit 1
fi

if [[ ! -f "$DOWNLOAD_DIR/deploy.sh" ]]; then
  echo "ERROR: deploy.sh not found in $DOWNLOAD_DIR — create it first" >&2
  exit 1
fi

# ── Step 1: Lint markdown files ──────────────────────────────────────────────
echo "=== Linting markdown files ==="
md_files=()
while IFS= read -r f; do
  md_files+=("$f")
done < <(find "$DOWNLOAD_DIR" -maxdepth 1 -name '*.md' -type f | sort)

if [[ ${#md_files[@]} -gt 0 ]]; then
  python3 "$LINTER" "${md_files[@]}" || true
  # Linter exits 0 always (auto-fixes bare tokens, warns about overlong bullets).
  # The warning is the JIT reminder — it doesn't block the zip.
else
  echo "  (no .md files found — skipping lint)"
fi

# ── Step 2: Verify expected files from deploy.sh ────────────────────────────
echo ""
echo "=== Verifying expected files (from deploy.sh deploy_file calls) ==="
expected_files=()
while IFS= read -r f; do
  [[ -n "$f" ]] && expected_files+=("$f")
done < <(awk '$1 == "deploy_file" {print $2}' "$DOWNLOAD_DIR/deploy.sh" | tr -d "\"'")

missing_files=()
for f in "${expected_files[@]}"; do
  if [[ ! -f "$DOWNLOAD_DIR/$f" ]]; then
    missing_files+=("$f")
  fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
  echo "ERROR: The following files are listed in deploy.sh but missing from download/:" >&2
  for f in "${missing_files[@]}"; do
    echo "  $f" >&2
  done
  echo "" >&2
  echo "Either copy the missing files to download/, or remove the deploy_file" >&2
  echo "lines from deploy.sh if this turn intentionally ships a subset." >&2
  exit 1
fi

echo "  ${#expected_files[@]} expected files found in download/ — all present."

# ── Step 3: Run lint gate on deliverables in download/ ──────────────────────
# The gate runs Shellcheck on *.sh deliverables + Ruff on *.py deliverables.
# ESLint is auto-skipped (download/ has no eslint.config.mjs — deliverables
# are flat files, not a project tree). This is the consolidated gate call
# that replaces the previous inline shellcheck+ruff loop. The gate is
# blocking: if any installed linter finds issues after autofix, the script
# aborts before zipping.
echo ""
if type run_lint_gate >/dev/null 2>&1; then
  echo "=== Running lint gate on deliverables in download/ ==="
  if ! run_lint_gate "$DOWNLOAD_DIR"; then
    echo "ERROR: Lint gate failed on deliverables — fix before zipping." >&2
    exit 1
  fi
else
  echo "  (skipped: lint_gate.sh not sourced — run_lint_gate unavailable)"
  echo "  This means lint_gate.sh is missing from skills/delivery/scripts/."
  echo "  Shellcheck + Ruff checks on deliverables were NOT run."
fi

# ── Step 4: Run lint gate + vue-tsc + Vitest in sandbox (if project tree exists) ─
# The sandbox project tree (with node_modules) lets us run ESLint + vue-tsc +
# Vitest against the patched src/ + tests/ files before zipping. This is the
# same gate deploy.sh runs on the user's machine — catching failures here
# means the user doesn't have to ship a broken deliver.zip back.
echo ""
echo "=== Running lint gate + vue-tsc + Vitest in sandbox ==="

# Check if the sandbox project tree exists (with package.json + node_modules)
if [[ ! -d "$SANDBOX_DIR" ]] || [[ ! -f "$SANDBOX_DIR/package.json" ]]; then
  echo "  (skipped: sandbox project tree not found at $SANDBOX_DIR)"
  echo "  To enable: extract the Build Repomix into $SANDBOX_DIR and run 'npm install --ignore-scripts'"
elif [[ ! -f "$SANDBOX_DIR/node_modules/.bin/eslint" ]]; then
  echo "  (skipped: node_modules not installed in sandbox — run 'npm install --ignore-scripts' in $SANDBOX_DIR)"
else
  # Parse deploy_file lines to get flat → repo path mappings, copy patched
  # files into the sandbox so ESLint + Vitest test the actual patched code.
  echo "  Copying patched files to sandbox..."
  while IFS= read -r flat rel; do
    [[ -z "$flat" || -z "$rel" ]] && continue
    # Only copy src/ or tests/ files (skip docs, config, etc.)
    if [[ "$rel" == src/* || "$rel" == tests/* ]]; then
      mkdir -p "$SANDBOX_DIR/$(dirname "$rel")"
      cp "$DOWNLOAD_DIR/$flat" "$SANDBOX_DIR/$rel"
      echo "    $flat → $rel"
    fi
  done < <(awk '$1 == "deploy_file" {print $2, $3}' "$DOWNLOAD_DIR/deploy.sh" | tr -d "\"'")

  # Run the shared lint gate (Shellcheck + Ruff + ESLint) on the sandbox
  # project tree. This replaces the previous inline ESLint call — the gate
  # function already does autofix + gate, and shellcheck/ruff will no-op
  # if no .sh/.py files are present in the sandbox project root.
  echo ""
  if type run_lint_gate >/dev/null 2>&1; then
    if ! run_lint_gate "$SANDBOX_DIR" "src/"; then
      echo "" >&2
      echo "ERROR: Lint gate failed in sandbox — fix the violations above before zipping." >&2
      exit 1
    fi
  else
    echo "  (skipped: run_lint_gate not available — lint_gate.sh not sourced)" >&2
  fi

  echo ""
  echo "  Running vue-tsc type check..."
  cd "$SANDBOX_DIR"
  if ! ./node_modules/.bin/vue-tsc -b 2>&1; then
    echo "" >&2
    echo "ERROR: vue-tsc type check failed — fix the type errors above before zipping." >&2
    exit 1
  fi
  echo "  vue-tsc clean."

  echo ""
  echo "  Running Vitest unit suite..."
  if ! ./node_modules/.bin/vitest run 2>&1; then
    echo "" >&2
    echo "ERROR: Vitest suite failed — fix the failing tests above before zipping." >&2
    exit 1
  fi
  echo "  Vitest suite passed."
fi

# ── Step 5: Zip everything ──────────────────────────────────────────────────
echo ""
echo "=== Creating deliver.zip ==="

# Remove any previous zip
rm -f -- "$ZIP"

# Collect all loose files (exclude deliver.zip itself and any subdirs).
cd "$DOWNLOAD_DIR"
mapfile -t files < <(find . -maxdepth 1 -type f ! -name 'deliver.zip' | sort)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "ERROR: no files to zip in $DOWNLOAD_DIR" >&2
  exit 1
fi

# Zip everything (flat, no subdirectories). -j = junk paths, -q = quiet.
zip -jq "$ZIP" "${files[@]}"

echo "Created $ZIP"
echo ""
echo "Contents:"
unzip -l "$ZIP" | tail -n +4 | head -n -2

# ── Touch download/ to refresh the chat.z.ai "All files in task" widget ─────
# The web UI's download widget can go stale after multiple prepare.sh runs or
# after sandbox-side file operations. Touching the directory's mtime forces
# the widget to re-scan and surface the new deliver.zip. If the widget is still
# broken, upload deliver.zip to https://tmpfiles.org as a fallback (the user
# can download it directly from there).
touch -- "$DOWNLOAD_DIR"

# ── Clean up loose files ────────────────────────────────────────────────────
echo ""
echo "Cleaning up loose files..."
for f in "${files[@]}"; do
  rm -f -- "${DOWNLOAD_DIR:?}/${f#./}"
done

echo ""
echo "Done. download/ now contains only:"
ls -1 -- "$DOWNLOAD_DIR"
