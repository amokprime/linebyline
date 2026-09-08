#!/bin/bash
snippet() {
    local include="package.json,AGENTS.md,MEMORY.md,README.md"
    include+=",ai/chat.z.ai/skills/project-workflow-SKILL.md"
    include+=",ai/chat.z.ai/skills/web-channel-SKILL.md"
    include+=",ai/chat.z.ai/skills/skill-SKILL.md"
    include+=",archive/modular/plan/**"
    repomix --output "$upload/repomix-onboard.xml" \
        --include-full-directory-structure \
        --include "$include"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
