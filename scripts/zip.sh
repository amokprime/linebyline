#!/bin/bash
# zip.sh — ad-hoc zip utility for the LineByLine repo's scratch/upload/ folder.
#
# Zips whatever is in $LINEBYLINE_ROOT/scratch/upload/ into a uniquely-named
# zip in scratch/, then copies the path to clipboard via wl-copy. Aborts with
# an error if the upload folder is empty. Used for ad-hoc uploads of non-
# deliverable files (e.g. a single screenshot or test fixture).
#
# Can be double-clicked after setup. Manual deployment only — must be copied
# to the user's scripts/ folder outside the deliver.zip workflow (a malicious
# deliver.zip can't modify this script because it's read-only inside bwrap).
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
