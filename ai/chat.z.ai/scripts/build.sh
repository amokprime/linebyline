#!/bin/bash
snippet() {
    local include="ai/chat.z.ai/skills/linebyline-section-index-SKILL.md"
    include+=",ai/chat.z.ai/skills/single-file-html-app-SKILL.md"
    include+=",ai/chat.z.ai/skills/browser-hotkey-system-SKILL.md"
    include+=",docs/index.html"
    include+=",src/**"
    include+=",vite.config.mts"
    include+=",tsconfig.json"
    include+=",tsconfig.app.json"
    include+=",tsconfig.node.json"
    include+=",tsconfig.vitest.json"
    include+=",tests/unit/**"
    include+=",tests/helpers/**"
    repomix --output "$upload/repomix-build.xml" --include "$include"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
