---
name: project-workflow
description: Phased session bootstrapping, file navigation, and patch delivery workflow for the LineByLine app. Use this skill at the start of every app build session and whenever you receive a phase zip, need to locate project files, follow the build/patch workflow, version the app, update companion files, or decide whether Memory.md or a skill needs updating after a change.
---

The project uses a phased upload workflow: skills and project files arrive in stages so that only the context needed for the current phase occupies attention. A single-file HTML app must be patched with minimal diff, and a set of post-patch obligations (syntax check, re-index, Memory.md update, companion .md, download copy) must be followed. Following this workflow each turn prevents regressions and keeps session artifacts in sync.

---

Session phases

Skills and project files arrive across up to four phases. Each phase adds files to the same project directory. The user uploads one zip per phase; the skill tells you what to do with the arriving files.

Phase 1 — Onboard (1_onboard.zip)

Contains: project-workflow-SKILL.md, README.md.

1. Read project-workflow-SKILL.md (this file) and README.md.
2. Note the current app version from the user's chat message. They may state it directly ("Current version: 0.37.1") or as a filename ("The current app is linebyline-0.37.1.html") — extract the semver portion either way. This is the baseline; derive all version numbers from it rather than asking the user to type them again.
3. Create the companion .md file in downloads if it is not already there (see Companion .md file section). Name it using the current version, not a placeholder.
4. Do not begin coding — the app HTML and domain skills arrive in the next phase.

Phase 2 — Work (2_work.zip + app HTML)

Contains: domain skills (browser-hotkey-system-SKILL.md, linebyline-section-index-SKILL.md, single-file-html-app-SKILL.md), Memory.md, Prompt.md. The user also uploads the current app HTML file alongside this zip.

1. Read Memory.md for development history, then Prompt.md for the current task.
2. Re-read project-workflow-SKILL.md to refresh the workflow rules.
3. Read only the domain skills relevant to the current Prompt.md — use the description in each skill's frontmatter to decide. Use the linebyline-section-index skill to read only the sections of the app HTML you need, not the entire file.
4. Follow Prompt.md requests that do not conflict with project-workflow-SKILL.md. Before writing any code, follow the Pre-patch checklist. After every patch, follow Post-patch verification and Post-patch updates.
5. Document all your work in the companion .md file in downloads.

Phase 3 — Pre-push audit (3_pre-push.zip)

Contains: audit skills (code-quality-SKILL.md, aria-accessibility-SKILL.md, playwright-testing-SKILL.md) and test files (helpers/, MANUAL.md, *.spec.js — no media or prompts directories).

1. Re-read project-workflow-SKILL.md.
2. Read code-quality-SKILL.md, aria-accessibility-SKILL.md, and playwright-testing-SKILL.md in full. These are the skills most likely to be missed if read too early — reading them now, immediately before the audit, maximizes recall.
3. Review the code changes you made earlier this session (documented in the companion .md). Audit those changes for the issues referenced in the three audit skills and make suggested fixes.
4. Document all your fixes in the companion .md file in downloads.

Phase 4 — Post-push (conditional)

This phase runs after the pre-push audit. There are two paths:

If SonarQube issues are present (user uploads 4_post_push_issues.zip):
Contains: skill-SKILL.md, sonarqube-workflow-SKILL.md, and an issues folder.

1. Re-read project-workflow-SKILL.md to refresh deliverable obligations.
2. Read sonarqube-workflow-SKILL.md and the issues folder. Fix SonarQube issues not caught previously.
3. Document all your fixes in the companion .md file in downloads.
4. Read skill-SKILL.md. Follow its guidelines to update Memory.md and/or uploaded skills.
5. Update Memory.md with any skills you changed.

If the SonarQube scan was clean (user uploads 4_post_push_clean.zip):
Contains: skill-SKILL.md
1. Re-read project-workflow-SKILL.md to refresh deliverable obligations.
2. Read skill-SKILL.md. Follow its guidelines to update Memory.md and/or uploaded skills.
3. Update Memory.md with any skills you changed.
4. Document any skill or Memory.md updates in the companion .md file in downloads.

---

Pre-patch checklist

Before writing any code change:

1. Stop and request clarification when: a request is unclear or overly complex, relevant files are missing, a request is technically infeasible, or a request violates best practices from a skill.
2. Read only the sections you need — use the `linebyline-section-index` skill to locate sections by grepping for `// ──` markers, then read just those ranges. This avoids loading the entire ~2600-line file (~50k tokens) when only a few sections are relevant.
3. Patch with minimal diff — change only what's needed and preserve surrounding code. Prefer targeted edits over full-section rewrites unless the section is being restructured. Don't generate your own icons; prioritize any the user uploads, then Lucide icons. Don't add code that links to external websites besides GitHub.
4. Consult code-quality-SKILL before modifying functions.

---

Post-patch verification

After every patch, before delivering:

1. Syntax check — confirm the patched file passes `new Function` (or equivalent) without errors. A syntax error in a single-file app means the entire app is broken.
2. Section index accuracy — re-run the grep for `// ──` markers and compare to the previous index. Line numbers shift with every insertion or deletion; the section-index skill must reflect the new reality.
3. Spot-check referenced functions — if the patch touched any function referenced by the section index, verify that the function still exists at its declared line.
4. Trace one representative user action — if the patch changed any logic (not just formatting), trace one user action through the changed code path to confirm it still reaches the expected outcome. This catches wiring mistakes that syntax checks cannot.

---

Post-patch updates

1. Re-index the section index — update `linebyline-section-index-SKILL.md` if line numbers shifted. The section structure (names and contents) is the durable part; line numbers are point-in-time references that must be refreshed after patches that insert or delete lines.
2. Update Memory.md when:
   - You finished a new, distinctive set of code changes — future sessions need to know what changed and why.
   - A code change failed in a way that would surprise a fresh model in a new chat if it wasn't documented — failures are the most valuable Memory.md entries because they prevent re-discovery.
3. Update a skill when a patch changes the architecture the skill documents (e.g. extracting `handleSecKeydown` to outer scope changes the section index skill, adding a new restricted key changes the hotkey skill). Don't update a skill for a pure bug fix that doesn't change the documented architecture.
4. Don't update a skill when the patch is a pure bug fix that doesn't change the documented architecture.

---

Versioning

The user states the current version in their first chat message, either directly ("Current version: 0.37.1") or as a filename ("linebyline-0.37.1.html"). Extract the semver portion and use it as the baseline. When the user requests a version change, apply semver rules:

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Don't change version without an explicit request from the user. Don't substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just `<title>`.

Derive the target version from the stated baseline and semver rules — don't ask the user to type it separately. The user states the version once; you apply it consistently everywhere (HTML filename, companion .md filename, `<title>`, version comments).

---

Companion .md file

For each code file version, create or update a companion `.md` file with the same base name (e.g. `linebyline-0.34.9.html` → `linebyline-0.34.9.md`). Derive the version from the stated baseline and semver rules.

Include each turn leading up to and working on that code file version only.

Prepend or update frontmatter at the start:

```md
---
model: <model name>
summary: <1-2 sentence summary of the companion file's contents>
---
```

Wrap the `summary` value in single quotes when it contains YAML-special characters (colons, backticks, em-dashes, etc.). Single-quoted YAML strings preserve these characters literally and require no escape sequences (the only special case is a literal single quote inside the string, which must be doubled as `''`). Example: `summary: 'Phase 4 post-push remediation on version 0.37.2. Turn 2 fixes S2486: ...'`. An unquoted summary containing a colon parses as a mapping key/value pair and corrupts the frontmatter.

Append per turn (separate the user's text from yours with a `---` line): the turn number in a header, the user's prompts verbatim (including full contents of Prompt.md if uploaded), and all your non-file chat outputs that turn (including markdown tables and Mermaid diagrams). Use "about" to express approximation instead of "~".

Number turns sequentially with integers throughout the entire companion file (Turn 1, Turn 2, Turn 3, …), continuing across sessions if the companion file already exists from a prior session. Do not switch to letter labels (Turn A, Turn B, …) mid-session — this creates inconsistent references and makes it hard for a human to follow the turn sequence. If a session spans multiple companion files (e.g. Phase 1 onboard in `linebyline-0.37.1.md`, then Phase 4 work in `linebyline-0.37.2.md`), the turn counter continues across files — the new file starts at the next turn number, not back at 1.

Never quote potentially licensed content in the companion file. This includes song lyrics, artist names, song titles, album titles, and any other text that could be copyrighted or trademarked. When documenting a fix that involved real lyrics (e.g. a Genius paste extraction bug), replace all lyric text and identifying metadata with functional placeholders: `[intro vocalization]` for a dropped intro line, `[final lyric line]` for the last line, `[Verse 1: singers]` for section headers with real singer names, `[real artist] — [real song]` for the page title. The technical discussion should reference structural properties (line index, bracket format, blank-line position) rather than the actual content. The companion file lives in `download/` and may be visible to GitHub contributors — treat it as public.

Drop these sections from every turn — they add clutter without helping the reader:

- `## Deliverables this turn` — the reader (whether the user or a GitHub contributor) cannot see the agent's sandbox filesystem, so listing file paths there is useless. The companion file itself is the deliverable; the user can see what files were produced by looking at the `download/` directory or the commit.
- `## Awaiting` — the next turn's verbatim user prompt already conveys what happened next, making this section redundant. If the user confirmed tests passed, that confirmation appears at the top of the next turn. If the user reported a new issue, that issue is the next turn's prompt.
- `## Skill updates` / `## Skill and Memory updates` (and equivalent "what I changed in Memory.md / skill-SKILL.md this turn" descriptions) — the commit history already shows what changed in those files line-by-line; restating it in the companion duplicates the commit log. The companion's job is to preserve the *reasoning* behind decisions, not to repeat the diff. If a Memory or skill update introduces a new general principle (e.g. a new lesson extracted from this turn's incident), document the principle itself and why it matters — that's reasoning — but skip the "added to skill-SKILL.md under section X" framing.
- `## Post-fix verification` (and equivalent "next steps to confirm before pushing" lists) — these are streaming instructions to the user that resolve to either commits (if the user runs the suggested check and applies the result) or follow-up prompts (if the user reports back what happened). Either way they don't belong in the transcript: a future reader of commit history wants the reasoning behind what was decided, not a checklist of "now run X to verify." If verification surfaced a non-obvious finding (e.g. "after revert, `npm audit` showed 4 high — confirmed the OOM CVE is unfixable as Turn 13 predicted"), that finding belongs in the diagnosis section, not in a separate verification list.

If the version is unchanged and the companion file already exists, update it rather than creating a new one.

---

Download copy

Each turn, without prompting, copy only the files you created or updated that turn to the download directory. This includes:

1. The versioned app HTML file.
2. Any modified test files (`*.spec.js`) so they are visible alongside code changes.
3. The companion `.md` file.
4. Any skill files you created or updated that turn.

This ensures the user can access all deliverables from the current session without searching the project tree.

---

Cross-references

- `linebyline-section-index` — how to read only the sections you need instead of the entire file
- `skill` — when to create or update skills vs Memory.md entries
- `code-quality` — patterns to follow and pitfalls to avoid when writing JavaScript
- `single-file-html-app` — architectural patterns for the single-file constraint
- `playwright-testing` — test impact awareness after code changes
