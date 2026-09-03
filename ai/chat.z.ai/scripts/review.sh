#!/bin/bash
snippet() {
    local include="ai/chat.z.ai/skills/aria-accessibility-SKILL.md"
    include+=",ai/chat.z.ai/skills/code-quality-SKILL.md"
    include+=",ai/chat.z.ai/skills/sonarqube-workflow-SKILL.md"
    repomix --output "$upload/repomix-review.xml" --include "$include"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
