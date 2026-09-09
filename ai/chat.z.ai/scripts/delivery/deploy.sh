#!/bin/bash
# deploy.sh — moves session files from cwd (where deliver.zip was extracted)
# to their repo locations.
#
# Called by unpack.sh after extraction. This file is committed at
# ai/chat.z.ai/scripts/deploy.sh as a template — each session, the agent
# fills in the file mappings below and includes the filled-in copy inside
# deliver.zip. The user's `dpl` fish abbreviation runs unpack.sh which
# extracts the zip and calls this script.
#
# Refinements:
#   - Byte-identical files are skipped (cmp -s) to preserve timestamps and
#     avoid unnecessary Syncthing syncs / git diffs. The source file is still
#     removed (cleaned up) even when skipped.
#   - At the end, ALL remaining loose files are deleted (collision prevention
#     for the next unzip round). deploy.sh can't self-delete (unpack.sh
#     handles that); deliver.zip is also left for unpack.sh.
#   - Per-file result is printed (one per line) for sanity-checking against
#     the agent's chat output. A summary section lists changed files.
#
# Code quality per code-quality-SKILL.md → "Bash workflow scripts":
#   - set -euo pipefail
#   - ${var:?} guards on every rm with a variable path (SC2115)
#   - DEST derived from $HOME + LINEBYLINE_ROOT override (no hardcoded paths)
#   - Arrays instead of word-splitting for file lists
#   - Errors on stderr with explicit exit codes

set -euo pipefail

DEST="${LINEBYLINE_ROOT:-$HOME/GitHub/linebyline}"

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

  if [ ! -f "$src" ]; then
    skipped_missing+=("$src")
    echo "skip (missing): $src"
    return 0
  fi

  if [ -f "$dst" ] && cmp -s "$src" "$dst"; then
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

# Source composables
deploy_file src-composables-useAppState.ts          src/composables/useAppState.ts
deploy_file src-composables-useAudio.ts             src/composables/useAudio.ts
deploy_file src-composables-useAutosave.ts          src/composables/useAutosave.ts
deploy_file src-composables-useEditorFont.ts        src/composables/useEditorFont.ts
deploy_file src-composables-useModeSwitch.ts        src/composables/useModeSwitch.ts
deploy_file src-composables-usePanelCollapse.ts     src/composables/usePanelCollapse.ts
deploy_file src-composables-usePersistedState.ts    src/composables/usePersistedState.ts
deploy_file src-composables-useTheme.ts             src/composables/useTheme.ts
deploy_file src-composables-useTitle.ts             src/composables/useTitle.ts
deploy_file src-composables-useUndoRedo.ts          src/composables/useUndoRedo.ts

# Source components
deploy_file src-components-ControlsPanel.vue        src/components/ControlsPanel.vue
deploy_file src-components-EditorArea.vue           src/components/EditorArea.vue
deploy_file src-components-LeftPanel.vue            src/components/LeftPanel.vue
deploy_file src-components-SettingsDialog.vue       src/components/SettingsDialog.vue

# Source root
deploy_file src-App.vue                             src/App.vue

# Tests
deploy_file tests-unit-audio.test.ts                tests/unit/audio.test.ts
deploy_file tests-unit-autosave.test.ts             tests/unit/autosave.test.ts
deploy_file tests-unit-controlsPanel.test.ts        tests/unit/controlsPanel.test.ts
deploy_file tests-unit-modeSwitch.test.ts           tests/unit/modeSwitch.test.ts
deploy_file tests-unit-persistedState.test.ts       tests/unit/persistedState.test.ts
deploy_file tests-unit-title.test.ts                tests/unit/title.test.ts

# Memory + roadmap
deploy_file ai-chat.z.ai-MEMORY.md                  ai/chat.z.ai/MEMORY.md
deploy_file archive-modular-plan-0-Roadmap.md       archive/modular/plan/0-Roadmap.md

# Scaffolding (skills + scripts)
deploy_file ai-chat.z.ai-skills-project-workflow-SKILL.md  ai/chat.z.ai/skills/project-workflow-SKILL.md
deploy_file ai-chat.z.ai-skills-web-channel-SKILL.md       ai/chat.z.ai/skills/web-channel-SKILL.md
deploy_file ai-chat.z.ai-scripts-prepare.sh                ai/chat.z.ai/scripts/prepare.sh

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Summary ==="
echo "Changed:          ${#changed[@]}"
echo "Skipped (same):   ${#skipped_identical[@]}"
echo "Skipped (missing): ${#skipped_missing[@]}"

if [ "${#changed[@]}" -gt 0 ]; then
  echo ""
  echo "Changed files:"
  for f in "${changed[@]}"; do
    echo "  $f"
  done
fi

# ── Collision cleanup ───────────────────────────────────────────────────────
# Remove ALL remaining loose files to prevent collision with the next unzip
# round. deploy.sh can't self-delete (unpack.sh handles it); deliver.zip is
# also left for unpack.sh. Everything else is fair game — scratch/ is an
# ephemeral extraction dir, not a workspace.
echo ""
echo "=== Cleanup (collision prevention) ==="
# Print then delete each remaining file (except deploy.sh and deliver.zip).
while IFS= read -r f; do
  [ -z "$f" ] && continue
  echo "  rm: $f"
  rm -- "${f:?}"
done < <(find . -maxdepth 1 -type f ! -name 'deploy.sh' ! -name 'deliver.zip')

echo ""
echo "Done. Extraction directory clean (deploy.sh + deliver.zip handled by unpack.sh)."
