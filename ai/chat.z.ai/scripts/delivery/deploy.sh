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
#   2. Run `npm install` (idempotent — no-op if node_modules/ is current)
#   3. Run `npm run test:unit` — the Vitest suite (~460 specs, ~10s)
#
# The Syncthing wait + Playwright SSH blocks are commented out for src/**
# patches — Playwright targets docs/index.html (the monolith) until Phase E.
# See the comments below those blocks for the rationale + re-enable procedure.
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

# Arrays for the summary — collect results as we go.
changed=()
skipped_identical=()
skipped_missing=()

# deploy_file <flat_filename> <repo_relative_path>
# Moves the file if it differs from the destination; skips if byte-identical.
# Always removes the source file (so the extraction directory stays clean).
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

# ── npm install (idempotent) ────────────────────────────────────────────────
echo ""
echo "=== npm install (recreate node_modules/ if needed) ==="
cd "$DEST"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found in PATH." >&2
  exit 1
fi

# `npm install` is idempotent: if node_modules/ exists and package-lock.json
# hasn't changed, it's a no-op. If deps changed or node_modules/ was deleted,
# it recreates with the exact deps from package-lock.json.
npm install

# ── Vitest unit suite ───────────────────────────────────────────────────────
echo ""
echo "=== Running Vitest unit suite ==="
# ~460 specs, ~10s. Covers pure-logic regressions in src/** — does NOT cover
# DOM interaction or Playwright-level concerns. The full Playwright suite
# stays a Phase E concern (re-enable the block below once Phase E flips
# Playwright's target to the Vite build output).
npm run test:unit

# ── Syncthing wait (COMMENTED OUT — see rationale below) ───────────────────
# The `sleep 60` was a hacky wait for Syncthing to sync changes to the test
# server before running Playwright. Two reasons it's commented out now:
#
# 1. The Playwright block below is also commented out (see rationale), so
#    there's no need to wait for sync — nothing reads the synced state.
# 2. Even when re-enabling Playwright, `sleep 60` is unreliable. Use the
#    Syncthing REST API instead (see Syncthing.md):
#      - Turn 1 Method 1: trigger an immediate rescan:
#          curl -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
#            "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID"
#      - Turn 4 Option 1: poll for completion (replaces `sleep 60`):
#          while [ "$(curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
#            "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
#            | jq -r .completion)" -ne 100 ]; do
#            sleep 2
#          done
#    The polling loop exits as soon as completion hits 100%, instead of
#    always waiting the full 60s.
#
# echo "Waiting 60s for Syncthing..." >&2
# sleep 60

# ── Playwright suite via SSH (COMMENTED OUT — see rationale below) ───────────
# The Playwright suite currently targets docs/index.html (the monolith) —
# see MEMORY.md → "Project invariants": "All app code lives at
# docs/index.html until the item-3 modular cutover (Phase E); src/ is
# scaffold-only until Phase C." Phase D Tranches 1–9 patched src/**, which
# docs/index.html doesn't load. The Playwright suite would pass/fail
# identically with or without the src/** patches — running it is wasted
# time (~8.3 minutes per the prior turn's deploy-log).
#
# Verification for src/** patches is the Vitest unit suite (run above).
# The full Playwright suite stays a Phase E concern — re-enable this block
# (and the Syncthing wait above) once Phase E flips Playwright's target to
# the Vite build output. See roadmap item 1 → "After modular refactor (item
# 3), tests point at the Vite built output served by a static server in
# CI instead of docs/index.html."
#
# To re-enable (post-Phase E, or when patching docs/index.html directly):
#   1. Uncomment the Syncthing wait block above (or replace with the
#      polling loop from Syncthing.md Turn 4 Option 1).
#   2. Uncomment the ssh line below.
#
# ssh Server tst && notify-send "Tests done."

# ── Collision cleanup (scoped to zip-extracted files only) ─────────────────
# Remove ONLY the files that came from deliver.zip (per the manifest unpack.sh
# wrote to .deliver-files.list before extraction), plus deploy.sh itself.
# Pre-existing files in scratch/ (scratch.md notes, prior session's upload
# zips, anything the user stashed there) are NOT touched.
#
# Why not `find . -maxdepth 1 -type f`? A prior version of this script did
# that and swept every file in scratch/, deleting a user's scratch.md notes
# (the second time this bug class bit — the first deleted repo-root files
# because the cd after uv-sync was missing). The scoped-list approach is
# safer: only files the agent put there get cleaned up.
#
# deploy.sh can't self-delete (unpack.sh handles it); deliver.zip is also
# left for unpack.sh. Files that the deploy_file mappings already moved
# or rm'd above won't exist anymore — the `[[ -f "$f" ]]` guard skips them
# silently.
echo ""
echo "=== Cleanup (scoped to zip-extracted files) ==="
DELIVER_LIST="$SCRATCH/.deliver-files.list"
if [[ ! -f "$DELIVER_LIST" ]]; then
  echo "WARNING: $DELIVER_LIST not found — unpack.sh may be out of date." >&2
  echo "         Skipping cleanup. Leftover zip-extracted files may collide with the next unzip." >&2
else
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    # $f is the basename as stored in the zip (flat, no subdirs). Skip the
    # three files unpack.sh owns — it removes them after deploy.sh exits.
    [[ "$f" == "deploy.sh" || "$f" == "deliver.zip" || "$f" == ".deliver-files.list" ]] && continue
    full="$SCRATCH/$f"
    if [[ -f "$full" ]]; then
      echo "  rm: $f"
      rm -- "${full:?}"
    fi
  done < "$DELIVER_LIST"
fi

echo ""
echo "Done. scratch/ cleanup scoped to zip contents (pre-existing files preserved)."
