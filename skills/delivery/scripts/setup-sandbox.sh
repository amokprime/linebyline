#!/bin/bash
# setup-sandbox.sh — install LineByLine project skills into the chat.z.ai
# sandbox's built-in skills folder so their frontmatter `description` fields
# auto-load into the system prompt's available_skills section.
#
# Why: the chat.z.ai sandbox auto-loads /home/z/my-project/skills/<name>/SKILL.md
# descriptions into the agent's system prompt. Without this script, project
# skills have to be uploaded as Repomix bundle files and the agent must be
# reminded to Read them each turn. With this script, project skills behave
# like built-in skills — descriptions appear in available_skills; bodies
# load on-demand via `Skill(command="name")`.
#
# Usage:
#   bash scripts/setup-sandbox.sh [skills_src_dir]
#
#   skills_src_dir  Path to the project's skills/ folder (defaults to
#                   $LINEBYLINE_ROOT/skills, then ./skills, then
#                   /home/z/my-project/skills-src).
#
# Run once at session start (sandboxes expire after 2h, so re-run if the
# session resets). Idempotent: it first strips every LineByLine skill (repo
# names + KNOWN_STALE_SKILLS deleted names) from the sandbox skills folder
# and the platform user-skill pool — via cleanup.sh, which also runs
# standalone at session end — then installs the repo's current skills fresh.
# Built-in sandbox skills (charts, design, LLM, etc.) are never touched.
#
# After running, the agent's available_skills list will include:
#   linebyline, delivery, skill, modular-app,
#   browser-hotkey-system, aria-accessibility,
#   code-quality, sonarqube-workflow, playwright-testing

set -euo pipefail

SANDBOX_SKILLS="/home/z/my-project/skills"

# Locate the project skills source directory. Priority: $1 > LINEBYLINE_ROOT
# > the skills/ dir this script itself lives in > ./skills (cwd).
# The script-location fallback (Nov 23, 2026) fixes the turn-1 snag: the
# sandbox clones to /home/z/my-project/repo, so the old defaults
# ($HOME/GitHub/linebyline, then ./skills relative to cwd) only worked when
# run from the repo root -- from anywhere else setup failed or installed a
# stale skills copy.
skills_src="${1:-${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}/skills}"
if [[ ! -d "$skills_src" ]]; then
  script_skills="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || script_skills=""
  if [[ -d "$script_skills/delivery" ]]; then
    skills_src="$script_skills"
  elif [[ -d "./skills" ]]; then
    skills_src="./skills"
  elif [[ -d "/home/z/my-project/skills-src" ]]; then
    skills_src="/home/z/my-project/skills-src"
  else
    echo "ERROR: project skills/ folder not found." >&2
    echo "Pass it as an argument: bash setup-sandbox.sh /path/to/skills" >&2
    echo "Or set LINEBYLINE_ROOT, or run from a directory containing skills/." >&2
    exit 1
  fi
fi

if [[ ! -d "$SANDBOX_SKILLS" ]]; then
  echo "ERROR: sandbox skills folder not found at $SANDBOX_SKILLS" >&2
  echo "This script only works inside the chat.z.ai sandbox." >&2
  exit 1
fi

# The platform's sandbox restore resets the clone's .git/config each boot
# (core.fileMode back to true) and flips every tracked file to 0755, so git
# then reports hundreds of fake "old mode/new mode" diffs on top of real
# content changes. Silence mode noise for this session; content diffs and
# patches are unaffected.
repo_root="$(cd "$skills_src/.." 2>/dev/null && pwd)" || repo_root=""
if [[ -n "$repo_root" && -d "$repo_root/.git" ]]; then
  git -C "$repo_root" config core.fileMode false
fi

# Strip every LineByLine skill (repo names + KNOWN_STALE_SKILLS deleted
# names) from the sandbox skills folder and the platform user-skill pool;
# the install loop below reinstates the repo's current set. Non-fatal: a
# cleanup failure must not block installation.
cleanup_sh="$(dirname "$0")/cleanup.sh"
if [[ -f "$cleanup_sh" ]]; then
  bash "$cleanup_sh" --all || echo "WARNING: cleanup.sh failed — stale skills may remain." >&2
else
  echo "WARNING: cleanup.sh not found beside setup-sandbox.sh — skipping cleanup." >&2
fi
echo ""

echo "=== Installing LineByLine project skills ==="
echo "Source:  $skills_src"
echo "Target:  $SANDBOX_SKILLS"
echo ""

installed=0
skipped=0

for skill_dir in "$skills_src"/*/; do
  [[ -d "$skill_dir" ]] || continue
  skill_name="$(basename "$skill_dir")"

  # Skip non-skill directories (e.g. chat/, scripts/ if present).
  # A valid skill folder must contain a SKILL.md file.
  if [[ ! -f "$skill_dir/SKILL.md" ]]; then
    echo "  skip (no SKILL.md): $skill_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Copy (clobber any existing project skill of the same name).
  # We do NOT touch built-in sandbox skills — built-in skill names
  # (charts, design, LLM, etc.) are plugin-provided and never overlap
  # the repo's skills/ tree.
  rm -rf -- "${SANDBOX_SKILLS:?}/$skill_name"
  cp -r -- "$skill_dir" "$SANDBOX_SKILLS/$skill_name"
  echo "  installed: $skill_name"
  installed=$((installed + 1))
done

echo ""
echo "Done. Installed $installed skill(s), skipped $skipped."
echo ""
echo "Project skill descriptions are now in available_skills."
echo "Invoke via: Skill(command=\"<name>\") — e.g. Skill(command=\"linebyline\")."

# ── Install lint gate dependencies ──────────────────────────────────────────
# The lint gate (skills/code-quality/scripts/lint_gate.sh) runs Shellcheck on
# *.sh files, Ruff on *.py files, and ESLint on src/. The sandbox doesn't
# preinstall Shellcheck or Ruff — install them here so prepare.sh's lint
# gate actually runs (instead of skipping with "shellcheck not installed").
#
# Shellcheck: NOT an npm dependency (the npm package bundles a stale binary
#   behind a critically vulnerable decompress@4.2.1). Resolved by the shared
#   ensure-shellcheck.sh: PATH, then a checksum-verified official release
#   download. Set SHELLCHECK_BIN to point at a preinstalled binary.
# Ruff: installed via pip from requirements-dev.txt (the `ruff` npm package
#   is an unrelated coroutine library, NOT the Python linter).
# ESLint: already available via npm devDependencies (no extra install needed).
echo ""
echo "=== Installing lint gate dependencies ==="

# Resolve repo root (for requirements-dev.txt + npm install).
# In the chat.z.ai sandbox, LINEBYLINE_ROOT is unset and $HOME/GitHub/linebyline
# doesn't exist — fall back to the script's own location. The script lives at
# $REPO/skills/delivery/scripts/setup-sandbox.sh, so repo_root is three levels
# up: scripts/ -> delivery/ -> skills/ -> repo root.
repo_root="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
if [[ ! -d "$repo_root" ]]; then
  repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
fi

# 1. npm install (gets ESLint + all other devDeps).
if [[ -f "$repo_root/package.json" ]]; then
  echo "  Running npm install --ignore-scripts (gets ESLint + devDeps)..."
  (cd "$repo_root" && npm install --ignore-scripts 2>&1 | tail -3) || true
else
  echo "  (skipped: package.json not found at $repo_root)"
fi

# 2. Ruff via pip (Python linter — NOT the npm package of the same name).
if [[ -f "$repo_root/requirements-dev.txt" ]]; then
  if [[ -f "$repo_root/skills/delivery/scripts/setup-lint-deps.sh" ]]; then
    bash "$repo_root/skills/delivery/scripts/setup-lint-deps.sh" "$repo_root" 2>&1 | tail -5 || true
  else
    echo "  (skipped: setup-lint-deps.sh not found)"
  fi
else
  echo "  (skipped: requirements-dev.txt not found at $repo_root)"
fi

# 3. Shellcheck: resolve (or download + checksum-verify) via the helper that
#    lives beside this script, so the sandbox never runs an unverified binary
#    and never needs the npm `shellcheck` package.
sh_helper="$repo_root/skills/delivery/scripts/ensure-shellcheck.sh"
if [[ -f "$sh_helper" ]]; then
  # shellcheck disable=SC1090,SC1091 # resolved at runtime
  . "$sh_helper"
  if sh_path="$(TARGET_DIR="$repo_root" resolve_shellcheck)"; then
    echo "  shellcheck: $sh_path ($("$sh_path" --version | tail -1))"
  else
    echo "  (skipped: shellcheck unavailable -- set SHELLCHECK_BIN or install it)"
  fi
else
  echo "  (skipped: ensure-shellcheck.sh not found at $sh_helper)"
fi

echo ""
echo "Lint gate dependencies installed. The lint gate in prepare.sh /"
echo "deploy.sh will now run Shellcheck + Ruff + ESLint instead of skipping."
