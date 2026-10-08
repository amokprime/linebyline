#!/bin/bash
# base.sh — sourced by each workflow script, which must define snippet() first
set -euo pipefail

root="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
scratch="$root/scratch"
upload="$scratch/upload"
unique="$(date +%s%N).zip"

export PATH="$HOME/.npm-global/bin:$PATH"

type snippet >/dev/null 2>&1 || { echo "snippet() not defined by caller" >&2; exit 1; }

rm -f "${root:?}/local"/*.zip
mkdir -p "$upload"
cd "$root" || exit 1

snippet                                  # the workflow-specific command

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
  echo "$removed" | sed 's/^/  /'
fi

wl-copy "$scratch/$unique" || echo "warning: wl-copy failed; zip is at $scratch/$unique" >&2
