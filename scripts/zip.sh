#!/bin/bash
# zip.sh — upload-packaging utility for the LineByLine repo's scratch/upload/
# folder.
#
# Runs scripts/diff.sh first (Nov 23, 2026) so every upload carries a fresh
# diff package — changes.patch (working tree + untracked + unpushed commits
# vs origin), changes.status, changes.meta — plus deploy.sh's deploy.log from
# scratch/upload/. Zips the folder into a uniquely-named zip in scratch/ and
# copies the path to clipboard via wl-copy. Aborts only if the upload folder
# is STILL empty (diff.sh failed and nothing ad-hoc was added). This is the
# user's only per-turn manual step: upload the zip, and the agent reconstructs
# repo + deploy state from it (AGENTS.md → "Upload sync"). Ad-hoc non-diff
# uploads (a screenshot, a fixture) also work — a diff.sh failure warns but
# does not abort.
#
# Can be double-clicked after setup. Manual deployment only (deploy_manual) —
# unpack.sh ro-binds this script + scripts/diff.sh inside bwrap since
# Nov 23, 2026, so a malicious deliver.zip can't rewrite scripts the user
# executes directly outside any sandbox.
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - LINEBYLINE_ROOT override (config over constants)
#   - EXIT trap not needed (no scoped cleanup beyond the upload folder sweep)

set -euo pipefail

root="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
scratch="$root/scratch"
upload="$scratch/upload"
unique="$(date +%s%N).zip"

export PATH="$HOME/.npm-global/bin:$PATH"

# Always carry a fresh repo diff: run diff.sh first so every upload zip
# contains changes.patch/changes.status/changes.meta (+ deploy.log written by
# deploy.sh into scratch/upload/). A diff.sh failure is a warning, not an
# abort — ad-hoc uploads (screenshots, fixtures) must still work without one.
if ! bash "$root/scripts/diff.sh"; then
  echo "WARNING: diff.sh failed -- this zip will NOT carry a fresh changes.patch." >&2
fi

# Abort if upload folder is empty (would otherwise produce an empty zip).
if [[ ! -d "$upload" ]]; then
  echo "ERROR: upload folder not found: $upload" >&2
  exit 1
fi
if [[ -z "$(ls -A "$upload")" ]]; then
  echo "Nothing to zip: $upload is empty" >&2
  exit 1
fi

# Sweep stale zips from scratch/local/ (legacy Repomix output location).
rm -f "${root:?}/local"/*.zip 2>/dev/null || true
mkdir -p "$upload"
cd "$root" || exit 1

# Zip the upload folder contents into scratch/$unique.
cd "$upload" || exit 1
zip -r "../$unique" ./*
rm -rf "${upload:?}"/*

# Clean up stale upload zips in $scratch/: remove any *.zip that is at least
# 1 hour older than the just-generated $unique. Sweeps old zips from prior
# double-click runs while keeping recent ones (e.g. rapid successive runs
# within the same session). The threshold is relative to "now" (effectively
# the same as "relative to $unique" since $unique was created seconds ago).
removed=$(find "${scratch:?}" -maxdepth 1 -name '*.zip' -type f \
  ! -name "$unique" \
  -mmin +60 \
  -print -delete)
if [[ -n "$removed" ]]; then
  echo "Removed stale zip(s) older than 1 hour:"
  # Prefix each line with two spaces for readability. Parameter expansion
  # avoids sed (shellcheck SC2001): ${var//search/replace} does global replace.
  printf '  %s\n' "${removed//$'\n'/$'\n'  }"
fi

wl-copy "$scratch/$unique" || echo "warning: wl-copy failed; zip is at $scratch/$unique" >&2

notify-send "Zip created" "$scratch/$unique"
