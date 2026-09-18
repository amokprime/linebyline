#!/bin/bash
# deploy.sh — deploys session files from cwd (where deliver.zip was extracted)
# to the LineByLine repo, then runs npm install + the Vitest unit suite.
#
# Called by unpack.sh after extraction. This file is committed at
# ai/chat.z.ai/scripts/delivery/deploy.sh as a template — each session, the
# agent fills in the file mappings below and includes the filled-in copy
# inside deliver.zip. The user's `dpl` fish abbreviation runs unpack.sh which
# extracts the zip and calls this script.
#
# This script does three things:
#   1. Deploy changed files from the zip to the repo (byte-identical skipped)
#   2. Run `npm install --ignore-scripts` (idempotent; --ignore-scripts per S6505)
#   3. Run `npm run test:unit` — the Vitest suite (~460 specs, ~10s)
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - DEST derived from $HOME + LINEBYLINE_ROOT override (no hardcoded paths)
#   - Arrays instead of word-splitting for file lists
#   - Errors on stderr with explicit exit codes

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
SCRATCH="$DEST/scratch"

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
echo ""
echo "=== Deploy Summary ==="
echo "Changed:           ${#changed[@]}"
echo "Skipped (same):    ${#skipped_identical[@]}"
echo "Skipped (missing): ${#skipped_missing[@]}"

if [[ ${#changed[@]} -gt 0 ]]; then
  echo ""
  echo "Changed files:"
  for f in "${changed[@]}"; do
    echo "  $f"
  done
fi

# ── npm install (idempotent, --ignore-scripts per S6505) ────────────────────
echo ""
echo "=== npm install ==="
cd "$DEST"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found in PATH." >&2
  exit 1
fi

# --ignore-scripts prevents lifecycle scripts from running during install
# (supply-chain hardening per shell:S6505). The Vite build was verified to
# work without lifecycle scripts locally.
npm install --ignore-scripts

# ── ESLint (autofix + gate) ─────────────────────────────────────────────────
# Runs ESLint on src/ between npm install and Vitest — catches SonarQube-rule
# violations locally before they reach CI (SonarCloud). Pattern mirrors the
# sonar-issue-exporter deploy.sh (ruff --fix → ruff gate → pytest).
#
# Uses the direct binary ./node_modules/.bin/eslint (per githubactions:S6505 —
# avoids `npx eslint` which can trigger on-demand install). The binary is
# guaranteed to exist after `npm install` since eslint is a devDependency.
#
# Conditional on eslint.config.mjs existing: pure-markdown turns or turns that
# ship only ai/chat.z.ai/ files (no src/ changes) can skip this by not having
# the config — but in practice the config is always present in the repo root.
echo ""
echo "=== ESLint (autofix + gate) ==="
if [[ -f "$DEST/eslint.config.mjs" ]] && [[ -f "$DEST/node_modules/.bin/eslint" ]]; then
  # Autofix pass — applies --fix for auto-fixable rules (formatting, prefer-const, etc.)
  ./node_modules/.bin/eslint src/ --fix || true
  # Gate pass — fails the deploy if any issues remain after autofix
  ./node_modules/.bin/eslint src/
  echo "ESLint gate passed."
else
  echo "  (skipped: eslint.config.mjs or node_modules/.bin/eslint not found)"
  echo "  If this is unexpected, run 'npm install --ignore-scripts' manually."
fi

# ── Vitest unit suite ───────────────────────────────────────────────────────
echo ""
echo "=== Running Vitest unit suite ==="
npm run test:unit

# ── Vite build (rebuild dist/ with patched source) ──────────────────────────
echo ""
echo "=== Building Vite dist/ ==="
npm run build
echo "dist/ rebuilt."

# ── Syncthing wait + Playwright via SSH ─────────────────────────────────────
# COMMENTED OUT — Playwright targets docs/index.html until Phase E (per
# "Project invariants" in MEMORY.md), so running it on src/** patches is ~8.3
# minutes wasted per deploy. Re-enable both post-Phase E (Tranche 5 cutover).
#
# The Syncthing wait ensures the deployed files have synced to the remote test
# machine before Playwright runs. The `sleep 60` is a blunt heuristic — replace
# with Syncthing REST API polling post-Phase E:
#   curl -X POST -H "X-API-Key: $KEY" "http://127.0.0.1:8384/rest/db/scan?folder=$LBL_ID"
#   poll /rest/db/completion?folder=$LBL_ID&device=$SERVER_ID until .completion == 100
#
# The Playwright run uses the human's master SSH key (`ssh Server tst` — see
# tests/SSH_SETUP.md). The server's `tst` fish function runs `podman run …
# npx playwright test "$@"` in the Podman Ubuntu container (PW_CONTAINER=1).
# The prior "unpack.sh hung" report was actually 8.3 minutes of Playwright
# tests, not a real hang — the user's Ctrl+C was during the `sleep 60`.
#
# echo ""
# echo "=== Waiting for Syncthing sync ==="
# sleep 60
#
# echo ""
# echo "=== Running Playwright suite via SSH ==="
# ssh Server tst

# ── Collision cleanup (scoped to zip-extracted files only) ─────────────────
echo ""
echo "=== Cleanup (scoped to zip-extracted files) ==="
DELIVER_LIST="$SCRATCH/.deliver-files.list"
if [[ ! -f "$DELIVER_LIST" ]]; then
  echo "WARNING: $DELIVER_LIST not found — unpack.sh may be out of date." >&2
  echo "         Skipping cleanup. Leftover zip-extracted files may collide with the next unzip." >&2
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

echo ""
echo "Done."
