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

# ── Install lint gate dependencies ──────────────────────────────────────────
# The lint gate (skills/delivery/scripts/lint_gate.sh) runs Shellcheck on
# *.sh files, Ruff on *.py files, and ESLint on src/. The sandbox doesn't
# preinstall Shellcheck or Ruff — install them here so prepare.sh's lint
# gate actually runs (instead of skipping with "shellcheck not installed").
#
# Shellcheck: installed via the `shellcheck` npm devDependency (downloads
#   the binary on first invocation). Falls back to a direct binary download
#   if npm install fails or the npm package's binary download is rate-limited.
# Ruff: installed via pip from requirements-dev.txt (the `ruff` npm package
#   is an unrelated coroutine library, NOT the Python linter).
# ESLint: already available via npm devDependencies (no extra install needed).
echo ""
echo "=== Installing lint gate dependencies ==="

# Resolve repo root (for requirements-dev.txt + npm install).
repo_root="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
if [[ ! -d "$repo_root" ]]; then
  repo_root="$(cd "$(dirname "$0")/.." && pwd)"
fi

# 1. npm install (gets shellcheck npm package + ESLint + all other devDeps).
if [[ -f "$repo_root/package.json" ]]; then
  echo "  Running npm install --ignore-scripts (gets shellcheck + ESLint)..."
  (cd "$repo_root" && npm install --ignore-scripts 2>&1 | tail -3) || true
else
  echo "  (skipped: package.json not found at $repo_root)"
fi

# 2. Ruff via pip (Python linter — NOT the npm package of the same name).
if [[ -f "$repo_root/requirements-dev.txt" ]]; then
  if [[ -f "$repo_root/scripts/.setup-lint-deps.sh" ]]; then
    bash "$repo_root/scripts/.setup-lint-deps.sh" "$repo_root" 2>&1 | tail -5 || true
  else
    echo "  (skipped: .setup-lint-deps.sh not found)"
  fi
else
  echo "  (skipped: requirements-dev.txt not found at $repo_root)"
fi

# 3. Shellcheck fallback: if the npm package's binary download failed (GitHub
#    API rate limit), download the static binary directly.
if ! command -v shellcheck >/dev/null 2>&1; then
  sh_npm_bin="$repo_root/node_modules/.bin/shellcheck"
  if [[ -f "$sh_npm_bin" ]] && "$sh_npm_bin" --version >/dev/null 2>&1; then
    echo "  shellcheck available via node_modules/.bin/"
  else
    echo "  shellcheck npm package binary not ready — downloading static binary..."
    sc_url="https://github.com/koalaman/shellcheck/releases/download/v0.10.0/shellcheck-v0.10.0.linux.x86_64.tar.xz"
    if command -v curl >/dev/null 2>&1; then
      tmp_dir="$(mktemp -d)"
      # --proto/--proto-redir "=https" pin both the initial request and any
      # redirect to HTTPS (Sonar shell:S6506) — otherwise the GitHub release
      # URL could be redirected down to plain HTTP and the binary tampered
      # with in transit.
      if curl --proto "=https" --proto-redir "=https" -sL "$sc_url" \
        -o "$tmp_dir/sc.tar.xz" 2>/dev/null; then
        tar -xJf "$tmp_dir/sc.tar.xz" -C "$tmp_dir/" 2>/dev/null
        mkdir -p "$HOME/.local/bin"
        cp "$tmp_dir/shellcheck-v0.10.0/shellcheck" "$HOME/.local/bin/shellcheck" 2>/dev/null
        chmod +x "$HOME/.local/bin/shellcheck"
        echo "  shellcheck installed to ~/.local/bin/shellcheck"
        echo "  (add ~/.local/bin to PATH if not already there)"
      else
        echo "  (skipped: shellcheck download failed — GitHub rate limit?)"
      fi
      rm -rf -- "$tmp_dir"
    else
      echo "  (skipped: curl not available to download shellcheck)"
    fi
  fi
else
  echo "  shellcheck already in PATH"
fi

echo ""
echo "Lint gate dependencies installed. The lint gate in prepare.sh /"
echo "deploy.sh will now run Shellcheck + Ruff + ESLint instead of skipping."
