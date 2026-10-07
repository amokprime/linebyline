#!/bin/bash
# deploy.sh -- deploys session files from cwd (where deliver.zip was extracted)
# to the LineByLine repo, then runs npm install + lint gate + Vitest + Vite build +
# Playwright (via SSH + Syncthing).
#
# Called by unpack.sh after extraction. This file is committed at
# skills/delivery/scripts/deploy.sh as a template -- each session, the
# agent fills in the file mappings below and includes the filled-in copy
# inside deliver.zip. The user's `dpl` fish abbreviation runs unpack.sh which
# extracts the zip and calls this script.
#
# Output is streamed live to the terminal. A filtered log (errors + summaries)
# is written to scratch/upload/deploy.log -- cat'd at the end for easy review.
#
# Test/build/playwright failures do NOT abort the script -- the log is always
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

# Source the shared lint gate. Prefer the zip's extracted copy in scratch/
# (always current this session) over the repo's copy (may be stale from a
# previous deploy -- the chicken-and-egg problem: deploy.sh sources
# lint_gate.sh BEFORE deploy_file updates it, so the FIRST run after a
# lint_gate.sh change uses the OLD version. Sourcing from scratch/ avoids
# this: the zip's copy is always the latest.)
LINT_GATE_SCRATCH="$SCRATCH/skills-delivery-scripts-lint_gate.sh"
LINT_GATE_REPO="$DEST/skills/delivery/scripts/lint_gate.sh"
if [[ -f "$LINT_GATE_SCRATCH" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "$LINT_GATE_SCRATCH"
elif [[ -f "$LINT_GATE_REPO" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "$LINT_GATE_REPO"
else
  echo "WARN: lint_gate.sh not found -- skipping shared lint gate" >&2
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
# snapshot diffs (@@, +/- lines), axe violations, attachment references,
# mv/cp/rm errors, read-only filesystem errors, command-not-found.
log_filter() {
    grep -iE "error|fail|warn|passed|skipped|gate|exit [1-9]|✗|✘|built|added|removed|changed|audited|up to date|Test Files|Tests +[0-9]|Duration|^\s+[0-9]+\) |@@|^[+-]\[|^[+-]Filler|^[+-] |Snapshot:|Expected:|Received:|attachment #|Error Context:|violations|Cognitive Complexity|sonarjs|inter-device|read-only|erofs|filesystem|mv:|cp:|rm:|ln:|operation not permitted|permission denied|cannot|could not|unable|no such file|not found|command not found|not installed|manual deploy" "$RAW" >> "$LOG" 2>/dev/null || true
    : > "$RAW"
}

# run_and_log: run a command, tee output to $RAW, then filter into $LOG.
# Does NOT abort on non-zero exit (test/build failures are expected during
# pre-cutover verification -- we want the full log regardless).
run_and_log() {
    "$@" 2>&1 | tee "$RAW" || true
    log_filter
}

changed=()
skipped_identical=()
skipped_missing=()
manual_deploys=()

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
      # Capture cp stderr to $LOG so the log_filter regex surfaces errors
      # (e.g. "Read-only file system" from a bwrap --ro-bind overlay).
      if ! cp -f -- "$src" "$dst" 2>>"$LOG"; then
        {
          echo ""
          echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
          echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
          echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
        } >&2
        {
          echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
          echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
          echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
        } >> "$LOG"
        exit 1
      fi
      rm -f -- "${src:?}"
    else
      # Capture mv stderr to $LOG so the log_filter regex surfaces errors
      # (e.g. "inter-device move failed" or "Read-only file system").
      if ! mv -f -- "$src" "$dst" 2>>"$LOG"; then
        {
          echo ""
          echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
          echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
          echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
        } >&2
        {
          echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
          echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
          echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
        } >> "$LOG"
        exit 1
      fi
    fi
    # Check if the deploy succeeded. If the destination is read-only (bwrap
    # --ro-bind overlay, chattr +i, or filesystem RO), mv/cp fail.
    # Don't check $src (it's gone after mv) -- just check $dst exists.
    if [[ ! -f "$dst" ]]; then
      {
        echo ""
        echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
        echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
        echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
      } >&2
      {
        echo "ERROR: cannot deploy $rel -- destination is read-only or write failed."
        echo "  (if this is a bwrap --ro-bind path like archive/, .git/, or scripts/tst,"
        echo "   use deploy_manual instead -- copy outside the sandbox after deploy)"
      } >> "$LOG"
      exit 1
    fi
    changed+=("$rel")
    echo "deployed: $rel"
  fi
}

# deploy_manual: for files in read-only bwrap paths (archive/, .git/,
# unpack.sh itself, scripts/tst). The bwrap sandbox protects these paths
# from modification by a malicious deliver.zip. The file is LEFT in
# scratch/ for the user to copy manually after the deploy completes.
# Tracks in manual_deploys[] for the deploy summary + collision cleanup skip.
deploy_manual() {
  local src="$1"
  local rel="$2"

  if [[ ! -f "$src" ]]; then
    skipped_missing+=("$src")
    echo "skip (missing): $src"
    return 0
  fi
  manual_deploys+=("$src")
  echo "MANUAL DEPLOY: $rel (bwrap-protected path -- copy after deploy completes)"
  echo "  cp $SCRATCH/$src $DEST/$rel"
  echo "MANUAL DEPLOY: $rel (bwrap-protected path)" >> "$LOG"
  echo "  cp $SCRATCH/$src $DEST/$rel" >> "$LOG"
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
    # Always cp (never mv) -- preserves hardlinks by overwriting in place.
    cp -f -- "$src" "$dst"
    rm -f -- "${src:?}"
    # Check if the deploy succeeded (same read-only guard as deploy_file).
    # Don't check $src (it's gone after rm) -- just check $dst exists.
    if [[ ! -f "$dst" ]]; then
      echo "" >&2
      echo "ERROR: cannot deploy $rel -- destination is read-only or write failed." >&2
      echo "  Review the changes and deploy manually, then re-run dpl:" >&2
      echo "    cp $src $dst" >&2
      echo "" >&2
      exit 1
    fi
    changed+=("$rel")
    echo "deployed (hardlink-safe): $rel"
  fi
}

# ── File mappings ───────────────────────────────────────────────────────────
# Format: deploy_file <flat_filename> <repo_relative_path>
# Files not present in the zip are silently skipped ("skip (missing)") --
# expected when a turn ships a subset.
#
# IMPORTANT: prepare.sh reads these deploy_file lines to verify every expected
# file exists in download/ BEFORE zipping. If you add a deploy_file line but
# forget to copy the actual file, prepare.sh will fail. This is the JIT
# reminder mechanism -- fill out the mappings FIRST, then write the deliverables.

# ── Summary ────────────────────────────────────────────────────────────────
log_section "Deploy Summary"
{
  echo "Changed:           ${#changed[@]}"
  echo "Skipped (same):    ${#skipped_identical[@]}"
  echo "Skipped (missing): ${#skipped_missing[@]}"
  echo "Manual deploy:     ${#manual_deploys[@]}"
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

if [[ ${#manual_deploys[@]} -gt 0 ]]; then
  echo ""
  echo "Manual deploy files (bwrap-protected -- copy after deploy):"
  echo "" >> "$LOG"
  echo "Manual deploy files (bwrap-protected -- copy after deploy):" >> "$LOG"
  for f in "${manual_deploys[@]}"; do
    echo "  $f"
    echo "  $f" >> "$LOG"
  done
fi

# ── npm install (idempotent, --ignore-scripts per S6505) ────────────────────
# npm install CAN fail (network issues, broken package-lock) -- that's a real
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
# tee -a $LOG captures full gate output in deploy.log so the user can review
# findings when the gate fails (without this, deploy.log shows just the header).
# run_lint_gate prints its own "=== Lint gate ===" header, so we don't
# call log_section here (that would produce a double header in the log).
# Auto-install .lint-deps/ if no ruff resolves (system ruff may be
# inaccessible inside bwrap — the symlink fix helps, but .lint-deps/ is
# the guaranteed-available fallback since it's inside $DEST which is
# mounted read-write by bwrap).
if [[ ${#changed[@]} -gt 0 ]] && type run_lint_gate >/dev/null 2>&1; then
  if ! command -v ruff >/dev/null 2>&1 && \
     ! [[ -x "$HOME/.local/bin/ruff" ]] && \
     ! [[ -x "$DEST/.lint-deps/bin/ruff" ]]; then
    if [[ -f "$DEST/scripts/.setup-lint-deps.sh" ]]; then
      echo "  No ruff found — auto-installing .lint-deps/..." | tee -a "$LOG"
      bash "$DEST/scripts/.setup-lint-deps.sh" "$DEST" 2>&1 | tee -a "$LOG" || true
    fi
  fi
fi

# Skip the gate entirely if nothing was deployed (changed=() means all
# files were skip-identical or the deploy had no mappings -- either way,
# there's nothing new to lint, and ESLint on src/ wastes ~10s).
if [[ ${#changed[@]} -eq 0 ]]; then
  {
    echo ""
    echo "=== Lint gate (Shellcheck + Ruff + ESLint) ==="
    echo "  (skipped: no files changed this deploy)"
    echo "=== Lint gate: SKIPPED ==="
  }
  {
    echo "=== Lint gate (Shellcheck + Ruff + ESLint) ==="
    echo "  (skipped: no files changed this deploy)"
    echo "=== Lint gate: SKIPPED ==="
  } >> "$LOG"
else
  if type run_lint_gate >/dev/null 2>&1; then
    changed_abs=()
    for rel in "${changed[@]}"; do
      changed_abs+=("$DEST/$rel")
    done
    if ! run_lint_gate "$DEST" "src/" "${changed_abs[@]}" 2>&1 | tee -a "$LOG"; then
      echo "ERROR: Lint gate failed -- fix the issues above before deploying." >&2
      echo "ERROR: Lint gate failed -- fix the issues above before deploying." >> "$LOG"
      exit 1
    fi
    echo "Lint gate passed." >> "$LOG"
  else
    echo "  (skipped: run_lint_gate not available -- lint_gate.sh not sourced)" >&2
    echo "  (skipped: run_lint_gate not available)" >> "$LOG"
  fi
fi

# ── Determine if app/test code changed OR was skip-identical ────────────────
# Vitest, Vite build, and Playwright are only useful if src/ or tests/ files
# are in the repo. Files can be in `changed[]` (deployed this run) OR
# `skipped_identical[]` (already in the repo from a previous deploy). Both
# cases mean the source code is present -- the dist/ should be rebuilt because
# a previous deploy might have aborted before the build step (e.g. the
# archive/ mv failure in the bwrap sandbox).
run_pw=0
for rel in "${changed[@]}" "${skipped_identical[@]}"; do
  if [[ "$rel" == src/* || "$rel" == tests/* ]]; then
    run_pw=1
    break
  fi
done

# ── Vitest unit suite (skip if no app/test code in repo) ────────────────────
# Vitest failure is a test regression -- log it but don't abort (we still want
# the build + Playwright log for the full picture).
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Running Vitest unit suite"
  run_and_log npm run test:unit
else
  log_section "Vitest unit suite"
  echo "  No app/test code in repo -- skipping Vitest." | tee -a "$LOG"
fi

# ── Vite build (skip if no app/test code in repo) ────────────────────────────
# Build failure means dist/ is stale -- Playwright would run against the old
# build. Log it but don't abort (the user can still see what went wrong).
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Building Vite dist/"
  run_and_log npm run build
  echo "dist/ rebuilt." | tee -a "$LOG"
else
  log_section "Building Vite dist/"
  echo "  No app/test code in repo -- skipping Vite build." | tee -a "$LOG"
fi

# ── Server trash/ prune (always runs, even if Playwright is skipped) ────────
# trace.zip files (one per trash snapshot folder) inflate Syncthing upload
# size by 26MB+ per run. Prune them + stale (>1 day old) artifacts before
# any Playwright run or manual tst invocation. This runs unconditionally
# so leftover trash/ from a previous manual tst is cleaned up even when
# this deploy skips Playwright (run_pw=0).
log_section "Pruning server trash/ (trace.zip + stale >1 day)"
ssh -F "$HOME/.ssh/config" Server "find ~/GitHub/linebyline/trash -type f -name 'trace.zip' -delete 2>/dev/null; find ~/GitHub/linebyline/trash ~/GitHub/linebyline/playwright-report -type f -mtime +1 -delete 2>/dev/null" || true
echo "  Pruned trace.zip + stale artifacts on server." | tee -a "$LOG"

# ── Playwright suite via SSH (skip if no app/test code in repo) ─────────────
# Only run Playwright if the deploy changed files under src/ or tests/.
# Docs, scripts, skills, config files don't affect the app's runtime
# behavior -- running the full suite for those would be ~10 min wasted.
#
# Pre-Playwright Syncthing sync: if deliver.zip is still in scratch/ (deploy
# via dpl), trigger a client-side rescan + poll the SERVER device's completion.
# This pushes the freshly-deployed files to the server before tests run.
# If deliver.zip is gone (manual re-run), skip -- the server already has the
# files. This check lives in deploy.sh (not the server tst) because only the
# client knows whether deliver.zip was just extracted.
#
# The server's tst script also does its own local rescan + status poll as a
# safety net -- if deploy.sh's sync was insufficient, the server detects it.
#
# Playwright failures are expected during pre-cutover verification -- don't
# abort. The deploy.sh post-Playwright block re-runs failures scoped and only
# pulls persistent (twice-failed) artifacts via scratch/upload/.
#
# Output filtering: drop `[N/294] [browser] › ...` progress lines (too verbose),
# but preserve full error context for failures (from `  N) [browser] › ...`
# through `Error Context: ...`) and the final summary line. This keeps the
# log readable while retaining all debugging info.

# Pre-Playwright Syncthing force-sync (only if deliver.zip exists in scratch/).
if [[ "$run_pw" -eq 1 ]]; then
  log_section "Pre-Playwright Syncthing force-sync"
  if [[ -f "$SCRATCH/deliver.zip" ]]; then
    echo "  deliver.zip found -- syncing deployed files to Server..." | tee -a "$LOG"
    if [[ -n "${SYNCTHING_API_KEY:-}" && -n "${SYNCTHING_LBL_ID:-}" && -n "${SYNCTHING_SERVER_ID:-}" ]]; then
      echo "  Triggering Syncthing rescan..." | tee -a "$LOG"
      curl -s -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
        "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID" >/dev/null 2>&1 || true
      echo "  Polling server completion..." | tee -a "$LOG"
      for i in $(seq 1 120); do
        pct=$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
          "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
          2>/dev/null | jq -r '.completion // 0' 2>/dev/null || echo 0)
        if [[ "$pct" == "100" ]]; then
          echo "  Sync complete (100%)." | tee -a "$LOG"
          break
        fi
        if (( i % 10 == 0 )); then
          echo "  Sync at ${pct}%..." | tee -a "$LOG"
        fi
        sleep 2
      done
    else
      echo "  (skipped: Syncthing env vars not set)" | tee -a "$LOG"
    fi
  else
    echo "  No deliver.zip -- skipping sync" | tee -a "$LOG"
  fi

  log_section "Running Playwright suite via SSH"
  echo "  App/test code changed -- running full Playwright suite..." | tee -a "$LOG"
  ssh -F "$HOME/.ssh/config" Server tst 2>&1 | tee "$RAW" || true
  grep -vE "^\[[0-9]+/[0-9]+\] \[" "$RAW" >> "$LOG" 2>/dev/null || true
  : > "$RAW"

  # Prune trace.zip + stale artifacts AFTER tst run (trace.zip from this
  # run's trash/ weren't pruned by the pre-Playwright prune above).
  log_section "Pruning Playwright artifacts on Server (trace.zip + >1 day)"
  ssh -F "$HOME/.ssh/config" Server "find ~/GitHub/linebyline/trash -type f -name 'trace.zip' -delete 2>/dev/null; find ~/GitHub/linebyline/trash ~/GitHub/linebyline/playwright-report -type f -mtime +1 -delete 2>/dev/null" || true
  echo "  Pruned trace.zip + stale artifacts on server." | tee -a "$LOG"


else
  log_section "Playwright suite via SSH"
  echo "  No app/test code changed -- skipping Playwright." | tee -a "$LOG"
fi

# ── Collision cleanup (scoped to zip-extracted files only) ─────────────────
log_section "Cleanup (scoped to zip-extracted files)"

# Client-side trace.zip prune: remove leftover trace.zip files from
# scratch/upload/trash/ (synced from server before the server-side prune
# ran). These inflate the upload size by 26MB+ per Playwright run.
if [[ -d "$SCRATCH/upload/trash" ]]; then
  find "$SCRATCH/upload/trash" -type f -name 'trace.zip' -delete 2>/dev/null || true
  echo "  Pruned trace.zip from client scratch/upload/trash/." | tee -a "$LOG"
fi

DELIVER_LIST="$SCRATCH/.deliver-files.list"
if [[ ! -f "$DELIVER_LIST" ]]; then
  echo "WARNING: $DELIVER_LIST not found -- unpack.sh may be out of date." >&2
  echo "WARNING: $DELIVER_LIST not found" >> "$LOG"
else
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ "$f" == "deploy.sh" || "$f" == "deliver.zip" || "$f" == ".deliver-files.list" ]] && continue
    # Skip files flagged for manual deploy -- they stay in scratch/ for the
    # user to copy manually (bwrap-protected paths like archive/, .git/).
    is_manual=0
    for m in "${manual_deploys[@]}"; do
      if [[ "$f" == "$m" ]]; then
        is_manual=1
        break
      fi
    done
    if [[ "$is_manual" -eq 1 ]]; then
      echo "  keep (manual deploy): $f"
      echo "  keep (manual deploy): $f" >> "$LOG"
      continue
    fi
    full="$SCRATCH/$f"
    if [[ -f "$full" ]]; then
      echo "  rm: $f"
      rm -- "${full:?}"
    fi
  done < "$DELIVER_LIST"
fi

# trap cleanup handles: rm $RAW, print "Done.", cat $LOG
notify-send "Changes deployed"
