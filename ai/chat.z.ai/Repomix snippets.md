---
summary: Modular slices of the LineByLine repo to combine into vibecoding workflows. Reduces context load compared to a naive `repomix` on the whole project.
links:
  - "[[ai/chat.z.ai/Vibecoding workflow|Vibecoding workflow]]"
---
### Onboard
```sh
repomix --output "scratch/upload/repomix-onboard.xml" \
--include-full-directory-structure \
--include "package.json,AGENTS.md,README.md\
ai/chat.z.ai/skills/project-workflow-SKILL.md,\
ai/chat.z.ai/skills/web-channel-SKILL.md,\
ai/chat.z.ai/skills/skill-SKILL.md,\
ai/chat.z.ai/MEMORY.md,archive/modular/plan/**"
```
- Workflows always start with the Onboard step, including dedicated sessions:
```
Follow `*-SKILL.md` files as rules. This is the Onboard step.
```

---
### Skills
```sh
repomix --output "scratch/upload/repomix-skills.xml" \
--include "CONTRIBUTING.md,ai/chat.z.ai/**"
--ignore "ai/chat.z.ai/skills/project-workflow-SKILL.md,\
ai/chat.z.ai/skills/skill-SKILL.md,\
ai/chat.z.ai/skills/chat/**"
```
- The Skills step typically follows Onboard in a dedicated non-code session:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This will be a meta-session involving work on agent scaffolding for fresh chats.
```

---
### Build
```sh
repomix --output "scratch/upload/repomix-build.xml" \
--include "ai/chat.z.ai/skills/linebyline-section-index-SKILL.md,\
ai/chat.z.ai/skills/single-file-html-app-SKILL.md,\
ai/chat.z.ai/skills/browser-hotkey-system-SKILL.md,\
docs/index.html,src/**,vite.config.mts,tsconfig.json,\
tsconfig.app.json,tsconfig.node.json,tsconfig.vitest.json,\
tests/unit/**,tests/helpers/index.js,tests/helpers/package.json"
```
- `package.json` is provided in Onboard; `package-lock.json` is omitted (too large; `npm install` works without it for non-reproducible installs)
- The `src/**` + `tests/unit/**` + tsconfig bundle lets the agent run `npm install && npm run test:unit` (~103 specs, ~7s) in-sandbox as a build-test loop after patching `src/` modules
- For longer requests zip a [[ai/chat.z.ai/Build|Build]] template along with the Repomix:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Build step.
```
---
### Review
```sh
repomix --output "scratch/upload/repomix-review.xml" \
--include "ai/chat.z.ai/skills/aria-accessibility-SKILL.md,\
ai/chat.z.ai/skills/code-quality-SKILL.md,\
ai/chat.z.ai/skills/sonarqube-workflow-SKILL.md"
```
- Check new code pre-commit
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Review step — use the review skills to screen for new code issues pre-commit.
```
- Remediate post-push SonarCloud issues
```
Re-read `project-workflow-SKILL.md` and the review skills. Follow `*-SKILL.md` files as rules. This is the Review step again post-push — use the review skills to patch SonarCloud issues.
```

---
### Test
```sh
repomix --output "scratch/upload/repomix-test.xml" \
--include "ai/chat.z.ai/skills/playwright-testing-SKILL.md,\
tests/**,playwright.config.js" \
--ignore "tests/*snapshots/**"
```
- For longer requests zip a [[ai/chat.z.ai/Test|Test]] template along with the Repomix
- Patch failing tests (including newly written) after the Build step and pre-commit:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Test step — use the Playwright skill to patch the failed tests.
```
- Generate new tests or helpers for new features added in the Build step:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is the Test step — use the Playwright skill to:
<Add specific requests>
```
- Follow Onboard in a dedicated testwriting session:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This is primarily a testwriting session. However, tell me if you suspect app code to be at fault with any failing tests.
```
