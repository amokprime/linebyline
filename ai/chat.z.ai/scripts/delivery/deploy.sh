
#!/bin/bash
# deploy.sh — deploys session files from cwd (where deliver.zip was extracted)
# to the LineByLine repo, then runs npm install + ESLint + Vitest + Vite build +
# Playwright (via SSH + Syncthing).
#
# Called by unpack.sh after extraction. This file is committed at
# ai/chat.z.ai/scripts/delivery/deploy.sh as a template — each session, the
# agent fills in the file mappings below and includes the filled-in copy
# inside deliver.zip. The user's `dpl` fish abbreviation runs unpack.sh which
# extracts the zip and calls this script.
#
# Output is streamed live to the terminal. A filtered log (errors + summaries)
# is written to scratch/upload/deploy.log — cat'd at the end for easy review.
#
# Test/build/playwright failures do NOT abort the script — the log is always
# printed and cleanup always runs. Only deploy_file + npm install failures
# abort early (those indicate a broken delivery, not a test regression).

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"
LOG="$SCRATCH/upload/deploy.log"
RAW="$SCRATCH/upload/deploy.raw.tmp"

mkdir -p "$(dirname "$LOG")"
: > "$LOG"
: > "$RAW"

# Always clean up $RAW and print the filtered log on exit (success or failure).
# This ensures the log is always complete even if Playwright/Vitest fail and
# the script would otherwise exit early via `set -e`.
cleanup() {
  local exit_code=$?
  rm -f -- "${RAW:?}" 2>/dev/null || true
  echo ""
  echo "Done. (exit $exit_code)"
  echo ""
  echo "Done. (exit $exit_code)" >> "$LOG"
  echo ""
  echo "=== deploy.log (filtered) ==="
  cat "$LOG" 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT

# log_section: print a header to both terminal and log
log_section() {
    echo ""
    echo "=== $1 ==="
    echo "" >> "$LOG"
    echo "=== $1 ===" >> "$LOG"
}

# log_filter: extract errors + summary lines from $RAW, append to $LOG, reset $RAW
# Filter pattern: errors, failures, warnings, pass/fail counts, build results,
# snapshot diffs (@@, +/- lines), axe violations, attachment references.
log_filter() {
    grep -iE "error|fail|warn|passed|skipped|gate|exit [1-9]|✗|✘|built|added|removed|changed|audited|up to date|Test Files|Tests +[0-9]|Duration|^\s+[0-9]+\) |@@|^[+-]\[|^[+-]Filler|^[+-] |Snapshot:|Expected:|Received:|attachment #|Error Context:|violations|Cognitive Complexity|sonarjs" "$RAW" >> "$LOG" 2>/dev/null || true
    : > "$RAW"
}

# run_and_log: run a command, tee output to $RAW, then filter into $LOG.
# Does NOT abort on non-zero exit (test/build failures are expected during
# pre-cutover verification — we want the full log regardless).
run_and_log() {
    "$@" 2>&1 | tee "$RAW" || true
    log_filter
}

changed=()
skipped_identical=()
skipped_missing=()

deploy_file() {
  local src="$1"
  local rel="$2"
  local dst="$DEST/$rel"

  if [[ ! -f "$src" ]]; then
    skipped_missing+=("$src")
    echo "skip (missing): $src"
    return 0
  fi

  if [[ -f "$dst" ]] && cmp -s "$src" "$dst"; then
    skipped_identical+=("$rel")
    echo "skip (identical): $rel"
    rm -- "${src:?}"
  else
    mkdir -p "$(dirname "$dst")"
    mv -- "$src" "$dst"
    changed+=("$rel")
    echo "deployed: $rel"
  fi
}

# ── File mappings ───────────────────────────────────────────────────────────
# Format: deploy_file <flat_filename> <repo_relative_path>
# Files not present in the zip are silently skipped ("skip (missing)") —
# expected when a turn ships a subset.
#
# IMPORTANT: prepare.sh reads these deploy_file lines to verify every expected
# file exists in download/ BEFORE zipping. If you add a deploy_file line but
# forget to copy the actual file, prepare.sh will fail. This is the JIT
# reminder mechanism — fill out the mappings FIRST, then write the deliverables.

# ── Summary ─────────────────────────────────────────────────────────────────
log_section "Deploy Summary"
echo "Changed:           ${#changed[@]}"
echo "Skipped (same):    ${#skipped_identical[@]}"
echo "Skipped (missing): ${#skipped_missing[@]}"
echo "Changed:           ${#changed[@]}" >> "$LOG"
echo "Skipped (same):    ${#skipped_identical[@]}" >> "$LOG"
echo "Skipped (missing): ${#skipped_missing[@]}" >> "$LOG"

if [[ ${#changed[@]} -gt 0 ]]; then
  echo ""
  echo "Changed files:"
  echo "" >> "$LOG"
  echo "Changed files:" >> "$LOG"
  for f in "${changed[@]}"; do
    echo "  $f"
    echo "  $f" >> "$LOG"
  done
fi

# ── npm install (idempotent, --ignore-scripts per S6505) ────────────────────
# npm install CAN fail (network issues, broken package-lock) — that's a real
# delivery error, so let `set -e` abort here.
log_section "npm install"
cd "$DEST"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found in PATH." >&2
  exit 1
fi

npm install --ignore-scripts 2>&1 | tee "$RAW"
log_filter

# ── ESLint (autofix + gate) ─────────────────────────────────────────────────
# ESLint gate failure is a real code-quality issue — abort if the gate fails.
log_section "ESLint (autofix + gate)"
if [[ -f "$DEST/eslint.config.mjs" ]] && [[ -f "$DEST/node_modules/.bin/eslint" ]]; then
  ./node_modules/.bin/eslint src/ --fix 2>&1 | tee "$RAW" || true
  log_filter
  if ! ./node_modules/.bin/eslint src/ 2>&1 | tee "$RAW"; then
    log_filter
    echo "ERROR: ESLint gate failed — fix violations before deploying." >&2
    exit 1
  fi
  log_filter
  echo "ESLint gate passed."
  echo "ESLint gate passed." >> "$LOG"
else
  echo "  (skipped: eslint.config.mjs or node_modules/.bin/eslint not found)"
  echo "  (skipped: eslint.config.mjs or node_modules/.bin/eslint not found)" >> "$LOG"
fi

# ── Vitest unit suite ───────────────────────────────────────────────────────
# Vitest failure is a test regression — log it but don't abort (we still want
# the build + Playwright log for the full picture).
log_section "Running Vitest unit suite"
run_and_log npm run test:unit

# ── Vite build (rebuild dist/ with patched source) ──────────────────────────
# Build failure means dist/ is stale — Playwright would run against the old
# build. Log it but don't abort (the user can still see what went wrong).
log_section "Building Vite dist/"
run_and_log npm run build
echo "dist/ rebuilt."
echo "dist/ rebuilt." >> "$LOG"

# ── Playwright suite via SSH (Vite target) ──────────────────────────────────
# The Playwright run uses the human's master SSH key (`ssh Server tst` — see
# tests/SSH_SETUP.md). The server's `tst` bash script runs `podman run …
# npx playwright test "$@"` in the Podman Ubuntu container (PW_CONTAINER=1).
# The client `tst` fish function passes LBL_VITE_TARGET=1 through SSH.
#
# The Server's tst script handles Syncthing sync wait + trash/ cleanup before
# running Playwright. Use `tst --update-snapshots` to regenerate baselines.
# Playwright failures are expected during pre-cutover verification — don't
# abort.
#
# Output filtering: drop `[N/294] [browser] › ...` progress lines (too verbose),
# but preserve full error context for failures (from `  N) [browser] › ...`
# through `Error Context: ...`) and the final summary line. This keeps the
# log readable while retaining all debugging info.
log_section "Running Playwright suite via SSH (Vite target)"
ssh Server "LBL_VITE_TARGET=1 tst" 2>&1 | tee "$RAW" || true
# Filter: drop progress lines [N/294], keep everything else (failures, summary, errors)
grep -vE "^\[[0-9]+/[0-9]+\] \[" "$RAW" >> "$LOG" 2>/dev/null || true
: > "$RAW"

# ── Collision cleanup (scoped to zip-extracted files only) ─────────────────
log_section "Cleanup (scoped to zip-extracted files)"
DELIVER_LIST="$SCRATCH/.deliver-files.list"
if [[ ! -f "$DELIVER_LIST" ]]; then
  echo "WARNING: $DELIVER_LIST not found — unpack.sh may be out of date." >&2
  echo "WARNING: $DELIVER_LIST not found" >> "$LOG"
else
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ "$f" == "deploy.sh" || "$f" == "deliver.zip" || "$f" == ".deliver-files.list" ]] && continue
    full="$SCRATCH/$f"
    if [[ -f "$full" ]]; then
      echo "  rm: $f"
      rm -- "${full:?}"
    fi
  done < "$DELIVER_LIST"
fi

# trap cleanup handles: rm $RAW, print "Done.", cat $LOG
