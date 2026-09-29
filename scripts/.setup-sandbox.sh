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
# session resets). Idempotent: re-running overwrites existing project skills
# with their latest content. Built-in sandbox skills (charts, design, LLM,
# etc.) are never touched — only project skill names are written.
#
# After running, the agent's available_skills list will include:
#   project-workflow, web-channel, skill, linebyline-section-index,
#   single-file-html-app, browser-hotkey-system, aria-accessibility,
#   code-quality, sonarqube-workflow, playwright-testing, delivery

set -euo pipefail

SANDBOX_SKILLS="/home/z/my-project/skills"

# Locate the project skills source directory.
skills_src="${1:-${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}/skills}"
if [[ ! -d "$skills_src" ]]; then
  # Fall back to ./skills (relative to cwd)
  if [[ -d "./skills" ]]; then
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
  # We do NOT touch built-in sandbox skills — project skill names
  # (project-workflow, web-channel, etc.) don't collide with built-in
  # skill names (charts, design, LLM, etc.).
  rm -rf -- "${SANDBOX_SKILLS:?}/$skill_name"
  cp -r -- "$skill_dir" "$SANDBOX_SKILLS/$skill_name"
  echo "  installed: $skill_name"
  installed=$((installed + 1))
done

echo ""
echo "Done. Installed $installed skill(s), skipped $skipped."
echo ""
echo "Project skill descriptions are now in available_skills."
echo "Invoke via: Skill(command=\"<name>\") — e.g. Skill(command=\"project-workflow\")."
