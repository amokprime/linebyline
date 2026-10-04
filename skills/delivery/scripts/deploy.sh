#!/bin/bash
# deploy.sh — deploys session files from cwd (where deliver.zip was extracted)
# to the LineByLine repo, then runs npm install + lint gate + Vitest + Vite build +
# Playwright (via SSH + Syncthing) + zip-pruning on the server.
#
# Called by unpack.sh after extraction. This file is committed at
# skills/delivery/scripts/deploy.sh as a template — each session, the
# agent fills in the file mappings below and includes the filled-in copy
# inside deliver.zip. The user's `dpl` fish abbreviation runs unpack.sh which
# extracts the zip and calls this script.
#
# Output is streamed live to the terminal. A filtered log (errors + summaries)
# is written to scratch/upload/deploy.log — cat'd at the end for easy review.
#
# Test/build/playwright failures do NOT abort the script — the log is always
# printed and cleanup always runs. Only deploy_file + npm install + lint gate
# failures abort early (those indicate a broken delivery, not a test regression).

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"
LOG="$SCRATCH/upload/deploy.log"
RAW="$SCRATCH/upload/deploy.raw.tmp"

mkdir -p "$(dirname "$LOG")"
: > "$LOG"
: > "$RAW"

# Source the shared lint gate (Shellcheck + Ruff + ESLint + check_sonar_exclusions).
# The lookup tries three locations in order:
#   1. Sibling `lint_gate.sh` — the template context (this script lives at
#      skills/delivery/scripts/deploy.sh, sibling to lint_gate.sh).
#   2. Sibling `skills-delivery-scripts-lint_gate.sh` — the session-copy context
#      (unpack.sh extracts deliver.zip to scratch/, where the flat hyphenated
#      name is alongside this script).
#   3. The deployed repo path `$DEST/skills/delivery/scripts/lint_gate.sh` —
#      the post-deploy_file context (the patched lint_gate.sh has already been
#      moved into the repo by deploy_file). This is the fallback if the file
#      was already consumed (mv'd) by deploy_file before the source runs.
#      NOTE: the source runs at the TOP of deploy.sh, BEFORE deploy_file, so
#      this fallback only fires if a prior session left the file in the repo.
LINT_GATE="$(dirname "$(readlink -f "$0")")/lint_gate.sh"
if [[ ! -f "$LINT_GATE" ]]; then
  LINT_GATE="$(dirname "$(readlink -f "$0")")/skills-delivery-scripts-lint_gate.sh"
fi
if [[ ! -f "$LINT_GATE" ]]; then
  LINT_GATE="$DEST/skills/delivery/scripts/lint_gate.sh"
fi
if [[ -f "$LINT_GATE" ]]; then
  # shellcheck disable=SC1090,SC1091
  # Source path is intentionally dynamic (three fallback locations above);
  # the linter cannot resolve it at check time.
  . "$LINT_GATE"
else
  echo "WARN: lint_gate.sh not found — skipping shared lint gate" >&2
  echo "  Looked for: lint_gate.sh, skills-delivery-scripts-lint_gate.sh," >&2
  echo "              \$DEST/skills/delivery/scripts/lint_gate.sh" >&2
fi

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
    # Use cp instead of mv when the destination is hardlinked to another file
    # (e.g. scripts/espanso/linebyline.yml ↔ ~/.config/espanso/match/linebyline.yml,
    # or scripts/fish/*.fish ↔ ~/.config/fish/functions/*.fish). cp overwrites the
    # file contents in place, preserving the inode and its hardlinks. mv would
    # replace the file (new inode), breaking the hardlink.
    # Detect hardlinks by checking if the destination has a link count > 1.
    local use_cp=0
    if [[ -f "$dst" ]]; then
      local link_count
      link_count=$(stat -c '%h' "$dst" 2>/dev/null || echo 1)
      if [[ "$link_count" -gt 1 ]]; then
        use_cp=1
      fi
    fi
    if [[ "$use_cp" -eq 1 ]]; then
      cp -- "$src" "$dst"
      rm -- "${src:?}"
    else
      mv -- "$src" "$dst"
    fi
    changed+=("$rel")
    echo "deployed: $rel"
  fi
}

# deploy_hardlinked: same as deploy_file but always uses cp (for files known to
# be hardlinked). Use this for scripts/espanso/linebyline.yml and scripts/fish/*.fish
# so the user's hardlinks to ~/.config/ are preserved across deploys.
deploy_hardlinked() {
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
    # Always cp (never mv) — preserves hardlinks by overwriting in place.
    cp -- "$src" "$dst"
    rm -- "${src:?}"
    changed+=("$rel")
    echo "deployed (hardlink-safe): $rel"
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
{
  echo "Changed:           ${#changed[@]}"
  echo "Skipped (same):    ${#skipped_identical[@]}"
  echo "Skipped (missing): ${#skipped_missing[@]}"
} | tee -a "$LOG"

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

# ── Lint gate (Shellcheck + Ruff + ESLint, shared with prepare.sh) ──────────
# Runs the shared lint gate from lint_gate.sh. Blocking: if any installed linter
# finds issues after autofix, the deploy aborts here.
#
# Passes the changed files (as absolute paths) to run_lint_gate so Shellcheck
# and Ruff scan ONLY the files this deploy changed — not the full repo root
# depth-0. ESLint still scans src/ (it's project-tree-aware and needs
# eslint.config.mjs to resolve imports — can't lint individual files in
# isolation).
log_section "Lint gate (Shellcheck + Ruff + ESLint)"
if type run_lint_gate >/dev/null 2>&1; then
  # Build absolute paths of changed files for the gate's changed-files mode.
  changed_abs=()
  for rel in "${changed[@]}"; do
    changed_abs+=("$DEST/$rel")
  done
  # tee -a captures full gate output in $LOG so the user can review
  # linter findings in deploy.log (without this, when the gate fails,
  # deploy.log shows just the section header with no findings).
  # pipefail (set at script top) ensures the pipeline returns
  # run_lint_gate's exit code, so `if !` detects failure.
  if ! run_lint_gate "$DEST" "src/" "${changed_abs[@]}" 2>&1 | tee -a "$LOG"; then
    echo "ERROR: Lint gate failed — fix the issues above before deploying." >&2
    echo "ERROR: Lint gate failed — fix the issues above before deploying." >> "$LOG"
    exit 1
  fi
  echo "Lint gate passed." >> "$LOG"
else
  echo "  (skipped: run_lint_gate not available — lint_gate.sh not sourced)" >&2
  echo "  (skipped: run_lint_gate not available)" >> "$LOG"
fi

# ── SonarCloud exclusion coverage check (non-blocking JIT reminder) ─────────
# After the blocking lint gate, runs the non-blocking sonar exclusion coverage
# check. Warns if any deploy_file rel-path isn't covered by either
# Dsonar.exclusions or Dsonar.coverage.exclusions in sonarcloud.yml. Catches
# the "new file path that should be added to sonar exclusions" case at deploy
# time so the agent can ship the sonarcloud.yml edit alongside the new file,
# saving a separate commit for a one-line edit.
log_section "SonarCloud exclusion coverage (non-blocking)"
if type check_sonar_exclusions >/dev/null 2>&1; then
  check_sonar_exclusions "$0" "$DEST"
  echo "SonarCloud exclusion coverage check done." >> "$LOG"
else
  echo "  (skipped: check_sonar_exclusions not available — lint_gate.sh not sourced)" >> "$LOG"
fi

# ── Determine if app/test code changed ───────────────────────────────────────
# Vitest, Vite build, and Playwright are only useful if src/ or tests/ files
# changed. Docs, scripts, skills, config files don't affect runtime behavior.
# The check scans the changed[] array for src/* or tests/* paths.
run_pw=0
for rel in "${changed[@]}"; do
  if [[ "$rel" == src/* || "$rel" == tests/* ]]; then
    run_pw=1
    break
  fi
done

# ── Vitest unit suite (skip if no app/test code changed) ────────────────────
# Vitest failure is a test regression — log it but don't abort (we still want
# the build + Playwright log for the full picture).
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Running Vitest unit suite"
  run_and_log npm run test:unit
else
  log_section "Vitest unit suite"
  echo "  No app/test code changed — skipping Vitest." | tee -a "$LOG"
fi

# ── Vite build (skip if no app/test code changed) ────────────────────────────
# Build failure means dist/ is stale — Playwright would run against the old
# build. Log it but don't abort (the user can still see what went wrong).
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Building Vite dist/"
  run_and_log npm run build
  echo "dist/ rebuilt."
  echo "dist/ rebuilt." >> "$LOG"
else
  log_section "Building Vite dist/"
  echo "  No app/test code changed — skipping Vite build." | tee -a "$LOG"
fi

# ── Playwright suite via SSH (skip if no app/test code changed) ───────────
# run_pw was set above (before Vitest + Vite build). Playwright only runs
# if app/test code changed.
#
# Pre-Playwright Syncthing sync: if deliver.zip is still in scratch/ (deploy
# via dpl), trigger a client-side rescan + poll the SERVER device's completion.
# This pushes the freshly-deployed files to the server before tests run.
# If deliver.zip is gone (manual re-run), skip — the server already has the
# files. This check lives in deploy.sh (not the server tst) because only the
# client knows whether deliver.zip was just extracted.
#
# The server's tst script also does its own local rescan + status poll as a
# safety net — if deploy.sh's sync was insufficient, the server detects it.
#
# Playwright failures are expected during pre-cutover verification — don't
# abort. The deploy.sh post-Playwright block re-runs failures scoped and only
# pulls persistent (twice-failed) artifacts via scratch/upload/.
#
# Output filtering: drop `[N/294] [browser] › ...` progress lines (too verbose),
# but preserve full error context for failures (from `  N) [browser] › ...`
# through `Error Context: ...`) and the final summary line. This keeps the
# log readable while retaining all debugging info.

# Pre-Playwright Syncthing force-sync (only if deliver.zip exists in scratch/).
# deploy.sh is invoked two ways:
#   1. Via `dpl` (unpack.sh) — deliver.zip is in scratch/ (cleaned up by
#      unpack.sh's EXIT trap AFTER deploy.sh returns). Need to sync deployed
#      files to the server before Playwright runs.
#   2. Manually (re-running deploy.sh after a fix) — no deliver.zip. The
#      server already has the files. Skip the sync.
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Pre-Playwright Syncthing force-sync"
  if [[ -f "$SCRATCH/deliver.zip" ]]; then
    echo "  deliver.zip found — syncing deployed files to Server..."
    echo "  deliver.zip found — syncing deployed files to Server..." >> "$LOG"
    if [[ -n "${SYNCTHING_API_KEY:-}" && -n "${SYNCTHING_LBL_ID:-}" && -n "${SYNCTHING_SERVER_ID:-}" ]]; then
      echo "  Triggering Syncthing rescan (pre-Playwright)..."
      echo "  Triggering Syncthing rescan (pre-Playwright)..." >> "$LOG"
      curl -s -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
        "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID" >/dev/null 2>&1 || true
      echo "  Polling server completion..."
      echo "  Polling server completion..." >> "$LOG"
      for i in $(seq 1 120); do
        pct=$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
          "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
          2>/dev/null | jq -r '.completion // 0' 2>/dev/null || echo 0)
        if [[ "$pct" == "100" ]]; then
          echo "  Sync complete (100%)."
          echo "  Sync complete (100%)." >> "$LOG"
          break
        fi
        if (( i % 10 == 0 )); then
          echo "  Sync at ${pct}%..."
          echo "  Sync at ${pct}%..." >> "$LOG"
        fi
        sleep 2
      done
    else
      echo "  (skipped: SYNCTHING_API_KEY / SYNCTHING_LBL_ID / SYNCTHING_SERVER_ID not set)"
      echo "  (skipped: Syncthing env vars not set)" >> "$LOG"
    fi
  else
    echo "  No deliver.zip in scratch/ — skipping sync (manual re-run, server already has files)."
    echo "  No deliver.zip — skipping sync" >> "$LOG"
  fi
fi

log_section "Running Playwright suite via SSH"
if [[ "$run_pw" -eq 1 ]]; then
  echo "  App/test code changed — running full Playwright suite..."
  echo "  App/test code changed — running full Playwright suite..." >> "$LOG"
  ssh Server tst 2>&1 | tee "$RAW" || true
  # Filter: drop progress lines [N/294], keep everything else
  grep -vE "^\[[0-9]+/[0-9]+\] \[" "$RAW" >> "$LOG" 2>/dev/null || true
else
  echo "  No app/test code changed (only docs/scripts/skills/config) — skipping Playwright."
  echo "  No app/test code changed — skipping Playwright" >> "$LOG"
fi
: > "$RAW"

# ── Prune stale Playwright artifacts on the SERVER (>1 day old) ─────────────
# Playwright writes artifacts to the Server's trash/ and playwright-report/
# (it runs there via SSH + Podman). The server's tst script handles pulling
# fresh failure artifacts via scratch/upload/ after each run. This prune
# covers the residual: HTML report's data/ subfolder (which Playwright
# doesn't auto-prune) + any artifacts older than 1 day.
#
# Playwright config retains artifacts only for failed tests
# (trace: "retain-on-failure", screenshot: "only-on-failure");
# video recording is OFF (default) to avoid the per-test encoding overhead
# that tripped 30s timeouts on firefox/webkit.
#
# `-mtime +1` matches files older than 1 day (24h), so the most recent
# test run's artifacts (just created) survive for review. `-type f` only
# deletes files, not directories.
log_section "Pruning stale Playwright artifacts on Server (>1 day old)"
ssh Server "find ~/GitHub/linebyline/trash ~/GitHub/linebyline/playwright-report -type f -mtime +1 -delete 2>/dev/null" || true
echo "  Pruned on server (trash/ + playwright-report/)."
echo "  Pruned on server (trash/ + playwright-report/)." >> "$LOG"
echo "Pruning complete." >> "$LOG"

# ── Post-Playwright: re-run failures scoped, pull persistent failures ────────
# The server tst script already pulls trash/ artifacts via scratch/upload/
# after the first run. This block re-runs ONLY the failed tests (via -g pattern)
# to separate flaky failures (which pass on re-run) from persistent failures
# (which fail twice). Only persistent failures' artifacts are copied to
# scratch/upload/ — the user doesn't need to review flaky failures' traces.
#
# Skip if Playwright was skipped (no app/test code changed) or if there were
# no failures in the first run.
if [[ "$run_pw" -eq 1 ]]; then
  # Extract failed test names from the first run's output (in $LOG).
  # Pattern: "  N) [browser] › tests/foo.spec.js:line:col › test-name"
  failed_tests=$(grep -oE '^[[:space:]]+[0-9]+\) \[[^]]+\] › [^ ]+' "$LOG" 2>/dev/null \
    | sed -E 's/^[[:space:]]+[0-9]+\) \[[^]]+\] › //' \
    | sort -u || true)
  if [[ -n "$failed_tests" ]]; then
    log_section "Re-running failed tests (flaky check)"
    echo "  Re-running ${#failed_tests} unique failed test(s) to separate flaky from persistent..."
    echo "  Re-running failed tests (flaky check)" >> "$LOG"
    # Build -g grep pattern: Playwright -g takes a regex; join test names with |
    # Escape any special regex chars in test names (unlikely but safe).
    grep_pattern=$(echo "$failed_tests" | tr '\n' '|' | sed 's/|$//')
    # shellcheck disable=SC2029
    # $grep_pattern is intentionally expanded on the client side — we want the
    # client's value passed to the server's tst as the -g argument.
    ssh Server "tst -g \"$grep_pattern\"" 2>&1 | tee "$RAW" || true
    grep -vE "^\[[0-9]+/[0-9]+\] \[" "$RAW" >> "$LOG" 2>/dev/null || true
    : > "$RAW"

    # Check if the re-run had failures (persistent failures).
    if grep -qE '^[[:space:]]*[0-9]+[[:space:]]+failed' "$LOG" 2>/dev/null; then
      echo "  Persistent failures detected — pulling artifacts via scratch/upload/..."
      echo "  Persistent failures — pulling artifacts" >> "$LOG"
      ssh Server "mkdir -p ~/GitHub/linebyline/scratch/upload && cp -r ~/GitHub/linebyline/trash ~/GitHub/linebyline/scratch/upload/" 2>&1 || true
      # Trigger client rescan
      if [[ -n "${SYNCTHING_API_KEY:-}" && -n "${SYNCTHING_LBL_ID:-}" ]]; then
        curl -s -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
          "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID" >/dev/null 2>&1 || true
        echo "  Client rescan triggered."
        echo "  Client rescan triggered." >> "$LOG"
      fi
    else
      echo "  All failures were flaky (passed on re-run) — no artifacts to pull."
      echo "  All failures flaky — no artifacts to pull" >> "$LOG"
    fi
  else
    echo "  No failures in first run — skipping re-run."
    echo "  No failures — skipping re-run" >> "$LOG"
  fi
fi

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
notify-send "Changes deployed"
