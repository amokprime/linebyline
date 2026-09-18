#!/bin/bash
# build-test.sh — generates a combined Build + Test Repomix bundle.
#
# Combines the file lists from `build.sh` (Build bundle) and `test.sh`
# (Test bundle) into a single `repomix-build-test.xml` so the agent has
# BOTH app code AND test code available for tasks that require both:
#
#   - Fixing test failures that involve both source patches and test
#     patches (the canonical case — the agent needs to read the failing
#     spec AND the module under test).
#   - Expanding test coverage for new build features (test code needed
#     alongside app code).
#   - Understanding what's being tested when reviewing app code changes
#     (tests connect to app code via import paths).
#
# Usage: bash build-test.sh
#
# Output: $REPO_ROOT/repomix-build-test.xml
#
# `build.sh` and `test.sh` remain as-is — this script is additive, not a
# replacement. See `ai/chat.z.ai/AGENTS.md` → "Bundle map" → "Build-Test
# bundle" for the rationale.
#
# Code quality per `code-quality-SKILL.md` (Review bundle) → "Bash
# workflow scripts":
#   - `set -euo pipefail`
#   - `${var:?}` guards on every `rm` with a variable path (SC2115)
#   - REPO_ROOT derived from $HOME + LINEBYLINE_ROOT override (no
#     hardcoded absolute paths)
#   - Bash arrays for the include list (no word-splitting)
#   - Errors on stderr with explicit exit codes

set -euo pipefail

# ── Resolve repo root ───────────────────────────────────────────────────────
# Prefer LINEBYLINE_ROOT (matches deploy.sh convention); fall back to
# ~/GitHub/linebyline. No hardcoded absolute paths.
REPO_ROOT="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"
OUTPUT="${REPO_ROOT}/repomix-build-test.xml"

# ── Sourcing note (intended future design) ─────────────────────────────────
# Ideally, this script would `source` `build.sh` and `test.sh` to reuse
# their Repomix include/ignore arrays verbatim, avoiding duplication of
# the file lists below. Sourcing trusted local scripts is generally safe
# in a personal vibecoding setup, BUT it should be reviewed if those
# scripts ever handle untrusted input (e.g., user-provided paths from
# chat uploads, env vars set by external callers). A sourced script can
# re-export env vars, `cd` out from under the caller, or invoke commands
# at source time — fine for trusted internal scripts, a smell for
# anything that touches untrusted data.
#
# For now, the include list below is a hardcoded copy of what `build.sh`
# and `test.sh` currently include. If those scripts' Repomix commands
# change, this combined list MUST be updated in lockstep. A future
# refactor could extract the include arrays into a shared `repomix-
# includes.sh` that all three scripts source.

# ── Combined Build + Test Repomix includes ─────────────────────────────────
# Each section documents which files come from which bundle. Note that
# `tests/**` (Test bundle) subsumes `tests/unit/**` and `tests/helpers/**`
# (Build bundle) — the duplicate entries are kept here as documentation of
# the per-bundle structure; repomix dedupes overlapping includes.
#
# Build bundle (also shipped by build.sh):
#   - src/**                      modular Vite + Vue + TS app
#   - tests/unit/**               Vitest specs
#   - tests/helpers/**            Playwright helper + its package.json
#   - docs/index.html             the live single-file monolith (pre-cutover)
#   - vite.config.mts             Vite config
#   - tsconfig*.json              4 TypeScript project configs
#   - eslint.config.mjs           ESLint flat config
#   - package.json                npm manifest
#   - ai/chat.z.ai/skills/{linebyline-section-index,
#       single-file-html-app, browser-hotkey-system}-SKILL.md
#
# Test bundle (also shipped by test.sh):
#   - tests/**                    Playwright specs + chat transcripts + media
#                                  + helpers + unit (full tests/ tree)
#   - playwright.config.js        Playwright config (webServer, baseURL, etc.)
#   - ai/chat.z.ai/skills/playwright-testing-SKILL.md
BUILD_TEST_INCLUDES=(
  # ── Build bundle entries ──
  "src/**"
  "docs/index.html"
  "vite.config.mts"
  "tsconfig.json"
  "tsconfig.app.json"
  "tsconfig.node.json"
  "tsconfig.vitest.json"
  "eslint.config.mjs"
  "package.json"
  "ai/chat.z.ai/skills/linebyline-section-index-SKILL.md"
  "ai/chat.z.ai/skills/single-file-html-app-SKILL.md"
  "ai/chat.z.ai/skills/browser-hotkey-system-SKILL.md"
  # ── Test bundle entries ──
  "tests/**"
  "playwright.config.js"
  "ai/chat.z.ai/skills/playwright-testing-SKILL.md"
)

# ── Sanity checks ───────────────────────────────────────────────────────────
if [[ ! -d "$REPO_ROOT" ]]; then
  echo "ERROR: repo root not found: $REPO_ROOT" >&2
  echo "       Set LINEBYLINE_ROOT or run from a checkout." >&2
  exit 1
fi

if ! command -v repomix >/dev/null 2>&1; then
  echo "ERROR: repomix CLI not found in PATH." >&2
  echo "       Install with 'npm install -g repomix'." >&2
  exit 1
fi

# ── Remove any previous bundle (SC2115: guarded rm with variable path) ─────
if [[ -f "$OUTPUT" ]]; then
  echo "Removing previous bundle: $OUTPUT"
  rm -- "${OUTPUT:?}"
fi

# ── Build comma-separated --include list from the array ────────────────────
# Repomix's --include flag accepts a comma-separated glob list. Joining
# a bash array with a custom separator requires setting IFS for the
# expansion only — do it in a subshell so the parent IFS is untouched.
INCLUDE_ARG=$(IFS=','; echo "${BUILD_TEST_INCLUDES[*]}")

echo "Generating combined Build + Test Repomix bundle..."
echo "  Repo root: $REPO_ROOT"
echo "  Output:    $OUTPUT"
echo "  Includes:  ${#BUILD_TEST_INCLUDES[@]} patterns"
echo ""

# ── Generate the combined bundle ───────────────────────────────────────────
# Repomix flags:
#   --include   comma-separated glob list (files to pack)
#   --output    write the XML to this path
#   (run from REPO_ROOT so the relative globs resolve correctly)
cd "$REPO_ROOT"
repomix --include "$INCLUDE_ARG" --output "$OUTPUT"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Bundle Summary ==="
echo "  Path: $OUTPUT"
if [[ -f "$OUTPUT" ]]; then
  echo "  Size: $(wc -c <"$OUTPUT") bytes"
  echo "  Files packed: $(grep -c '<file ' "$OUTPUT" || echo 'unknown')"
else
  echo "ERROR: bundle not created at $OUTPUT" >&2
  exit 1
fi
echo ""
echo "Done."
