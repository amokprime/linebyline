---
summary: Modular slices of the LineByLine repo to combine into vibecoding workflows. Reduces context load compared to a naive `repomix` on the whole project.
links:
  - "[[ai/z-ai-glm/Vibecoding workflow|Vibecoding workflow]]"
---
### Onboard
```sh
repomix --output "local/upload/repomix-onboard.xml" \
--include-full-directory-structure \
--include "package.json,README.md,\
ai/z-ai-glm/skills/project-workflow-SKILL.md,\
ai/z-ai-glm/skills/web-channel-SKILL.md,\
ai/z-ai-glm/skills/skill-SKILL.md,\
ai/z-ai-glm/Memory.md,archive/modular/plan/**"
```
- Workflows always start with the Onboard step, including dedicated sessions:
```
Follow `*-SKILL.md` files as rules. This is the Onboard step.
```

---
### Skills
```sh
repomix --output "local/upload/repomix-skills.xml" \
--include "CONTRIBUTING.md,ai/z-ai-glm/**"
--ignore "ai/z-ai-glm/skills/project-workflow-SKILL.md,\
ai/z-ai-glm/skills/skill-SKILL.md,\
ai/z-ai-glm/skills/chat/**"
```
- The Skills step typically follows Onboard in a dedicated non-code session:
```
Re-read `project-workflow-SKILL.md`. Follow `*-SKILL.md` files as rules. This will be a meta-session involving work on agent scaffolding for fresh chats.
```

---
### Build
```sh
repomix --output "local/upload/repomix-build.xml" \
--include "ai/z-ai-glm/skills/linebyline-section-index-SKILL.md,\
ai/z-ai-glm/skills/single-file-html-app-SKILL.md,\
ai/z-ai-glm/skills/browser-hotkey-system-SKILL.md,\
docs/index.html"
```
- Features created from this step should pass a superficial manual test
- For longer requests zip a [[ai/z-ai-glm/Build|Build]] template along with the Repomix

---
### Review
```sh
repomix --output "local/upload/repomix-review.xml" \
--include "ai/z-ai-glm/skills/aria-accessibility-SKILL.md,\
ai/z-ai-glm/skills/code-quality-SKILL.md,\
ai/z-ai-glm/skills/sonarqube-workflow-SKILL.md"
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
repomix --output "local/upload/repomix-test.xml" \
--include "ai/z-ai-glm/skills/playwright-testing-SKILL.md,\
tests/**,playwright.config.js" \
--ignore "tests/*snapshots/**"
```
- For longer requests zip a [[ai/z-ai-glm/Test|Test]] template along with the Repomix
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
