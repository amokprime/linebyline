#!/bin/bash
snippet() {
    local include="CONTRIBUTING.md,ai/chat.z.ai/**"
    local ignore="ai/chat.z.ai/skills/project-workflow-SKILL.md"
    ignore+=",ai/chat.z.ai/skills/skill-SKILL.md"
    ignore+=",ai/chat.z.ai/skills/chat/**"
    ignore+=",ai/chat.z.ai/scripts/chat/**"
    repomix --output "$upload/repomix-skills.xml" \
        --include "$include" \
        --ignore "$ignore"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
