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
# This script does three things:
#   1. Lint all *.md files in download/ (auto-fix bare #id/[id]/[[id]],
#      warn about overlong bullets — see lint_markdown.py for details)
#   2. Verify every file listed in deploy.sh's deploy_file calls exists
#      in download/ (catches forgotten deliverables BEFORE zipping)
#   3. Zip everything into deliver.zip + clean up loose files
#
# The linter + expected-files check are JIT reminders: if you forgot to copy
# a file to download/, or wrote bare #tokens in MEMORY.md, this script fails
# before the zip is created. Fix the issues, then re-run.

set -euo pipefail

DOWNLOAD_DIR="/home/z/my-project/download"
ZIP="$DOWNLOAD_DIR/deliver.zip"
LINTER="/home/z/my-project/scripts/delivery/lint_markdown.py"

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
done < <(grep -oP 'deploy_file\s+\K\S+' "$DOWNLOAD_DIR/deploy.sh")

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

# ── Step 3: Zip everything ──────────────────────────────────────────────────
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

# ── Clean up loose files ────────────────────────────────────────────────────
echo ""
echo "Cleaning up loose files..."
for f in "${files[@]}"; do
  rm -f -- "${DOWNLOAD_DIR:?}/${f#./}"
done

echo ""
echo "Done. download/ now contains only:"
ls -1 -- "$DOWNLOAD_DIR"
