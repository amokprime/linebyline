#!/bin/bash
snippet() {
    local include="ai/chat.z.ai/skills/playwright-testing-SKILL.md"
    include+=",tests/**"
    include+=",playwright.config.js"
    repomix --output "$upload/repomix-test.xml" \
        --include "$include" \
        --ignore "tests/*snapshots/**"
}
# shellcheck source=.base.sh
. "$(dirname "$(readlink -f "$0")")/.base.sh"
