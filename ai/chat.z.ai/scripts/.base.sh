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
wl-copy "$scratch/$unique" || echo "warning: wl-copy failed; zip is at $scratch/$unique" >&2
