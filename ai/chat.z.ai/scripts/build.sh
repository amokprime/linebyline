#!/bin/bash
snippet() {
    local include="ai/chat.z.ai/skills/linebyline-section-index-SKILL.md"
    include+=",ai/chat.z.ai/skills/single-file-html-app-SKILL.md"
    include+=",ai/chat.z.ai/skills/browser-hotkey-system-SKILL.md"
    include+=",ai/chat.z.ai/Memory.md"
    include+=",docs/index.html"
    repomix --output "$upload/repomix-build.xml" --include "$include"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
