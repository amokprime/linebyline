#!/bin/bash
# cleanup.sh — remove LineByLine skills from the chat.z.ai sandbox skills
# folder and delete their platform user-skill pool artifacts.

# Usage:
#   cleanup.sh --all               every LineByLine skill: repo skills/ dir
#                                  names + KNOWN_STALE_SKILLS (deleted names)
#   cleanup.sh <name> [<name>...]  targeted retirement of specific skills
#   cleanup.sh -h                  this help
#
# Per skill name, removes:
#   /home/z/my-project/skills/<name>/     installed sandbox copy
#   /home/user_skills/<name>.zip          pool seed archive
#   /home/user_skills/.<name>.usermark    pool user-installed marker
#
# Modes:
#   --all    Called by setup-sandbox.sh at session start (its install loop
#            reinstates the repo's current set right after). Also run
#            standalone at session end / wrap-up: without it the pool
#            re-seeds every LineByLine skill into the next sandbox boot,
#            polluting standalone chats and other Projects.
#   <name>   Retire individual skills (e.g. a deprecated upload).
#
# Missing artifacts are skipped with a message, never an error: e.g. the
# pool zip may already be gone from an earlier cleanup pass. Only
# explicitly listed / repo-derived names are removed — platform built-ins
# (charts, docx, LLM, …) and unknown pool entries are never touched.
#
# Exit codes: 0 = done (skips are normal); 1 = usage error, unknown flag,
# or --all without a resolvable repo.

set -euo pipefail

SANDBOX_SKILLS="/home/z/my-project/skills"
POOL_SKILLS="/home/user_skills"

# Skills deleted from the repo but still present in the sandbox or pool.
# Maintain when a skill is deleted from the repo: add the name + reason.
KNOWN_STALE_SKILLS=(
  "project-workflow"          # merged into skills/linebyline/ in Tranche 4.6 (Sep 29, 2026)
  "task-review"               # never in this repo's skills/ — sandbox-seed leftover
  "linebyline-section-index"  # retired into skills/modular-app/ in Phase E Tranche 8 (Nov 24, 2026)
  "single-file-html-app"      # retired into skills/modular-app/ in Phase E Tranche 8 (Nov 24, 2026)
  "web-channel"               # deprecated upload, frozen in the pool (see NOTE below)
)

# NOTE (Nov 24, 2026): `web-channel` is the project's own DEPRECATED
# web-channel skill, uploaded to the platform's user-skill pool on Oct 6,
# 2026. No stock copy exists in any plugin (checked /opt/zcode/rt/runtime/
# packages and the plugin caches). Pool zips freeze at upload and re-seed
# every sandbox boot — the Nov 22 "built-in platform skill" diagnosis was
# wrong (mtime refresh, description, same-session re-seed are all pool
# behavior). The seeded copy was permanently stale: it referenced the
# retired deploy alias and the deleted `project-workflow-SKILL.md`. The
# repo's `delivery` skill bundles the current web-channel behavioral rules
# (merged in Tranche 4.6), so the frozen standalone copy must go. If the
# platform reconstitutes the pool artifacts from a backend store, the
# cleanup below re-runs every session.

show_help() {
  cat <<'EOF'
cleanup.sh — remove LineByLine skills from the chat.z.ai sandbox skills
folder and delete their platform user-skill pool artifacts.

Usage:
  cleanup.sh --all               every LineByLine skill (repo + known-stale)
  cleanup.sh <name> [<name>...]  targeted retirement
  cleanup.sh -h                  this help

Per name removes: /home/z/my-project/skills/<name>/,
/home/user_skills/<name>.zip, /home/user_skills/.<name>.usermark.
Missing artifacts are skipped with a message. Exit 0 on success;
1 on usage error or --all without a resolvable repo.
EOF
}

removed=0
missing=0
remove_one() {
  local path="$1" label="$2"
  if [[ -e "$path" || -L "$path" ]]; then
    rm -rf -- "$path"
    echo "  removed: $label"
    removed=$((removed + 1))
  else
    echo "  skip (missing): $label"
    missing=$((missing + 1))
  fi
}

mode=""
names=()
for arg in "$@"; do
  case "$arg" in
    -h | --help)
      show_help
      exit 0
      ;;
    --all) mode="all" ;;
    -*)
      echo "ERROR: unknown flag: $arg" >&2
      show_help >&2
      exit 1
      ;;
    *) names+=("$arg") ;;
  esac
done

if [[ "$mode" == "all" ]]; then
  # Repo root: $LINEBYLINE_ROOT, else three levels up from this script
  # (scripts/ -> delivery/ -> skills/ -> repo root).
  repo_root="${LINEBYLINE_ROOT:-}"
  if [[ -z "$repo_root" || ! -d "$repo_root" ]]; then
    repo_root="$(cd "$(dirname "$0")/../../.." 2>/dev/null && pwd)" || repo_root=""
  fi
  if [[ -z "$repo_root" || ! -d "$repo_root/skills" ]]; then
    echo "ERROR: --all needs the repo's skills/ dir (set LINEBYLINE_ROOT or run from the repo)." >&2
    exit 1
  fi
  for skill_dir in "$repo_root/skills"/*/; do
    if [[ -f "$skill_dir/SKILL.md" ]]; then
      names+=("$(basename "$skill_dir")")
    fi
  done
  names+=("${KNOWN_STALE_SKILLS[@]}")
elif [[ ${#names[@]} -eq 0 ]]; then
  echo "ERROR: nothing to do — pass --all or at least one skill name." >&2
  show_help >&2
  exit 1
fi

# Dedupe while preserving order (a name can be both repo-derived and stale
# if it was deleted and later re-added to the repo).
declare -A seen=()
unique=()
for name in "${names[@]}"; do
  if [[ -z "${seen[$name]:-}" ]]; then
    seen[$name]=1
    unique+=("$name")
  fi
done

echo "=== Cleaning LineByLine skills (${#unique[@]} targeted) ==="
for name in "${unique[@]}"; do
  echo "- $name:"
  remove_one "${SANDBOX_SKILLS:?}/$name" "sandbox skills/$name/"
  remove_one "${POOL_SKILLS:?}/$name.zip" "pool $name.zip"
  remove_one "${POOL_SKILLS:?}/.$name.usermark" "pool .$name.usermark"
done

echo ""
echo "Done. Removed $removed artifact(s), skipped $missing already-missing."
