---
name: project-workflow
description: Session bootstrapping, file navigation, and patch delivery workflow for the LineByLine app. Use this skill at the start of every session, whenever you receive a Repomix snippet, need to locate project files, follow the build/patch workflow, version the app, update companion files, or decide whether Memory.md or a skill needs updating after a change. Also use when the user mentions a vibecoding step (Build, Review, Test, Skills, Propose), Repomix, or post-turn documentation hygiene.
---

The project uses a Repomix-based workflow: context arrives as just-in-time Repomix snippets so that only the files needed for the current step occupy attention. A single-file HTML app must be patched with minimal diff, and a set of obligations (pre-patch checklist, post-patch verification, post-turn documentation updates) must be followed. Following this workflow each turn prevents regressions and keeps session artifacts in sync — the user may push at any moment without notifying the agent, so artifacts must be current after every turn.

---

Re-read cadence

Re-read this skill at the start of each new step and whenever the user announces a step change. The agent's context compacts over long sessions — early-turn workflow rules become less reliable later. Re-reading this skill at step boundaries is the countermeasure. Also re-read the web-channel skill at the same time, since its rules apply every turn and are equally vulnerable to compaction.

---

Workflows and steps

There are many possible vibecoding workflows — see `Vibecoding workflow` (ai/chat.z.ai/Vibecoding-workflow.md) for the known ones with flowchart diagrams. The agent should be aware that the user may pick and choose steps in any order, stitch multiple workflows together in a single session, or follow a custom workflow not yet documented. Do not assume a linear front-to-back progression (e.g. Onboard → Build → Review → Test → done). The user tells you which step they're on; each step can span multiple turns, and the user will announce when they're changing steps. The user may end a session at any point without a formal wrap-up — they may push on the spur of the moment, or click the send button and suddenly remember something they forgot to mention. The agent's defense against this unpredictability is to keep documentation artifacts (companion file, Memory.md, skills) current after every turn, so that a push at any moment captures a complete audit trail. See Post-turn updates.

The steps below are the building blocks. Their Repomix snippets are defined in `Repomix snippets` (ai/chat.z.ai/Repomix-snippets.md) — the snippet headers there are intentionally not numbered, reflecting that steps can be used in any order.

---

Onboard

Repomix: `repomix-onboard.xml`. Contains: project-workflow-SKILL.md, README.md, Memory.md, skill-SKILL.md, web-channel-SKILL.md, and archive/modular/plan/**.

1. Read project-workflow-SKILL.md (this file), README.md, and Memory.md.
2. Read the web-channel skill — it applies to every turn of the session, not just onboarding.
3. Note the current app version. The user may state it directly ("Current version: 0.37.1"). If they don't state it, derive it from the Onboard Repomix's `<directory_structure>` (which always runs with `--include-full-directory-structure`): grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). Extract the semver portion either way — this is the baseline; derive all version numbers from it rather than asking the user to type them again. The app always lives at `docs/index.html` (its `<title>` tag carries the version), but that file arrives in `repomix-build.xml` and won't be available in non-build sessions — so don't rely on grepping it during Onboard.
4. Do not begin coding — the app HTML and domain skills arrive in a later step if needed. Onboard may be the only step in a session (e.g. a pure planning session), or it may be followed by any combination of the other steps in any order.
5. There is no companion file created at Onboard — the companion file's location depends on which workflow the session follows (see "Companion .md file" below). The user's first work step after Onboard determines the destination.

---

Build

Repomix: `repomix-build.xml`. Contains: linebyline-section-index-SKILL.md, single-file-html-app-SKILL.md, browser-hotkey-system-SKILL.md, Memory.md, and the current app HTML.

1. Read Memory.md for development history.
2. Re-read project-workflow-SKILL.md to refresh the workflow rules.
3. Read only the domain skills relevant to the current task — use the description in each skill's frontmatter to decide. Use the linebyline-section-index skill to read only the sections of the app HTML you need, not the entire file.
4. Follow the user's requests that do not conflict with project-workflow-SKILL.md. Before writing any code, follow the Pre-patch checklist. After every patch, follow Post-patch verification. After every turn (patch or not), follow Post-turn updates.
5. Document all your work in the companion .md file (see "Companion .md file" for destination).
6. If multiple features are requested, the user may bucket them into a single turn when they're minor or interdependent. If they're independent and substantial, address them sequentially.
7. In Build.md (if provided), the highest existing version header inherently implies the next app version. No need for the user to keyword-hint the semver — derive it from the existing headers.

---

Review

Repomix: `repomix-review.xml`. Contains: aria-accessibility-SKILL.md, code-quality-SKILL.md, sonarqube-workflow-SKILL.md.

1. Re-read project-workflow-SKILL.md.
2. Read the three audit skills in full. These are the skills most likely to be missed if read too early — reading them now, immediately before the audit, maximizes recall.
3. Review the code changes you made earlier this session (documented in the companion .md). Audit those changes for the issues referenced in the three audit skills and make suggested fixes.
4. Document all your fixes in the companion .md file.

---

Test

Repomix: `repomix-test.xml`. Contains: playwright-testing-SKILL.md, tests/**, playwright.config.js.

1. Re-read project-workflow-SKILL.md.
2. Read playwright-testing-SKILL.md in full.
3. Patch failing tests, or generate new tests/helpers for new features added in the Build step.
4. Document all your work in the companion .md file.

---

Skills (meta-session)

Repomix: `repomix-skills.xml`. Contains: all skills, Boilerplate.md, Memory.md, and the other `ai/chat.z.ai/` docs.

1. Re-read project-workflow-SKILL.md.
2. Read the relevant skills for the meta-work being done (e.g., skill-SKILL.md for creating/updating skills, sonarqube-workflow-SKILL.md for post-push remediation).
3. Work on agent scaffolding — updating skills, pruning Memory.md, creating new skills, etc.
4. Document all your work in the companion .md file (see "Companion .md file" for destination).

---

Propose / Investigate / Plan

Repomix: `repomix-onboard.xml` (or a custom bundle). Used for high-level research and planning that may not produce code.

1. Re-read project-workflow-SKILL.md.
2. Read any relevant skills and project files for the investigation.
3. Proposals may start with half-baked criteria and become more refined in follow-up turns. Investigations may need web searches to rule out alternatives. One idea often leads to another — this produces large buckets of proposed items to triage later.
4. Document all findings and proposals in the companion .md file.

---

Memory.md discipline

Write one bullet per parallel thread of work, not one bullet per turn. When a session iterates on the same change across multiple turns (fix → regression catch → follow-up), narrating each turn's state as a separate bullet duplicates earlier states — the reader must mentally diff successive bullets to recover the current state. Instead, identify the unique parallel threads in the session (e.g. "SonarCloud remediation" vs "Genius paste cleanup" vs "test suite hardening") and write one bullet per thread, updated in-place to reflect its latest state. New turns that touch an existing thread edit the existing bullet rather than appending a new one. This keeps Memory.md a current-state snapshot, not a change log — the per-turn change log lives in the companion `.md` file. If a thread is still actively evolving at session end, the in-place bullet should describe the final state, with one cross-reference line pointing to the companion `.md` for the turn-by-turn evolution.

No turn numbers in Memory.md bullets. Turn numbers are session-local: a version like 0.37.2 can span multiple sessions (e.g. an app-code session, a CI/test session, a skills session), and "Turn 7" in one session is unrelated to "Turn 7" in another. Referencing them in Memory.md creates ambiguous pointers that a reader cannot resolve without already knowing which session is meant. The per-turn chronology lives in the companion file; Memory.md should describe the final state of each thread without naming the turns that produced it. Companion-file cross-references should describe the thread or topic (e.g. "see `tests/chat/0.37.2/1.md`"), not a turn range (e.g. "see `tests/chat/0.37.2/1.md` (Turns 3–7)") — the companion file's frontmatter summary already conveys its scope. This rule also applies to narrative clauses within a bullet: write "corrected in a follow-up patch" rather than "corrected in Turn 4", and "initially missed `<head>`" rather than "Turns 2–4 patched only `<script>` body". The goal is a current-state snapshot that survives session-boundary reorganization of the companion files.

Verbose Memory entries signal skill gaps. When a Memory.md entry starts explaining how to do something rather than just what happened, that's a sign the knowledge belongs in a skill. Memory.md should say "Fixed X by doing Y (root cause: Z)." If it needs to say "When doing X, always do Y because Z, and here are the three cases to watch for," that's a skill.

Knowledge offload reduces Memory.md bloat. Extracting domain knowledge from Memory.md into a skill turns verbose per-version details into one-line references. Memory.md becomes a compact historical overview for regression investigation, not a how-to guide. The how-to guide lives in the skill.

Pruning preserves history. Pruning a Memory.md entry means condensing it to a brief reference, not deleting it. Past session entries are historical records — they document what changed, why, and what went wrong, which is essential for regression investigation. A future session that encounters a similar bug needs to know it happened before and what the root cause was. Only prune entries you created or updated this session; leave past session entries intact unless they are now fully redundant with a skill (in which case, replace with a one-line reference pointing to that skill, not a deletion).

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

Post-turn updates

Apply after every turn, regardless of whether a code patch was made. The user may push at any moment without notifying the agent — on the off chance that any turn is the last before a push, the documentation artifacts must already be current. This is default turn hygiene, not a special end-of-session step.

1. Update the companion .md file — every turn, by default. The threshold is just "document the turn": prepend the user's prompt verbatim and your non-file outputs. Even pure-diagnosis turns with no code changes get documented, because the next agent reading the transcript needs to know what was decided, not just what was patched. See "Companion .md file" for the destination and format.
2. Re-index the section index if a code patch shifted line numbers — update `linebyline-section-index-SKILL.md`. The section structure (names and contents) is the durable part; line numbers are point-in-time references that must be refreshed after patches that insert or delete lines.
3. Update Memory.md when:
 - You finished a new, distinctive set of code changes — future sessions need to know what changed and why.
 - A code change failed in a way that would surprise a fresh model in a new chat if it wasn't documented — failures are the most valuable Memory.md entries because they prevent re-discovery.
 Apply the update inline — do not propose it as a draft for the user to approve. The user is a solo vibecoder, not a review board; proposing-and-deferring Memory updates just creates a queue of un-applied knowledge that gets lost when the user pushes without wrapping up. If the turn produces no distinctive changes worth remembering, skip this (the companion file still captures the turn).
4. Update a skill when a patch changes the architecture the skill documents (e.g. extracting `handleSecKeydown` to outer scope changes the section index skill, adding a new restricted key changes the hotkey skill). Don't update a skill for a pure bug fix that doesn't change the documented architecture. Apply the update inline. Check cross-skill consistency: when updating one skill, check whether existing skills already cover the pattern — if they do, update them rather than just adding to Memory.md. Prune any Memory.md entries you fully extracted to a skill this session to brief references pointing to that skill (see "Pruning preserves history" below for what pruning does and does not mean).

---

Versioning

The user states the current version in their first chat message, either directly ("Current version: 0.37.1") or by referencing `docs/index.html`. If they don't state it, derive it from the Onboard Repomix's `<directory_structure>` (which always runs with `--include-full-directory-structure`): grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). Extract the semver portion and use it as the baseline. The app file is always `docs/index.html` — the version is encoded in `<title>`, not in the filename — but that file arrives in `repomix-build.xml` and won't be available in non-build sessions, so don't rely on grepping it during Onboard. When the user requests a version change, apply semver rules:

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Don't change version without an explicit request from the user. Don't substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just `<title>`.

Derive the target version from the stated baseline and semver rules — don't ask the user to type it separately. The user states the version once; you apply it consistently everywhere (`<title>` in `docs/index.html`, companion .md filename, version comments). The HTML file is always `docs/index.html` — overwrite it in place, don't create a versioned copy.

In Build.md, the highest existing version header with a real item inherently implies the next app version. No need for the user to keyword-hint the semver — derive it from the existing headers.

---

Companion .md file

Every session gets a companion `.md` file — not just build sessions. The companion file is the chat transcript, documenting the reasoning behind decisions for any workflow step (Build, Review, Test, Skills, Propose). The user keeps a chat transcript for every session regardless of whether app code changes.

The companion file's location depends on which workflow the session follows. The user distributes transcripts to multiple locations by topic:

- **Building one or more features or post-push Review** (app code changes) → `archive/modular/X.XX.XX/linebyline-X.XX.XX.md`. Every building session from 0.37.2 onward is post-refactor, so `archive/semantic/` is effectively deprecated after 0.37.2.
- **Researching and implementing high-level plans** (e.g. `0-Roadmap` steps) → `archive/modular/plan/<step>/<N>.md`. For a step with multiple sessions, use `archive/modular/plan/1-Playwright/1.md`, `2.md`, etc. For a new step where the folder structure is uncertain, be pessimistic and go with the `1.md` folder assumption.
- **Improving AI scaffolding** (Skills meta-sessions) → `ai/chat.z.ai/skills/chat/skills-X.XX.XX.md`.
- **Improving Playwright tests** OR **Building one or more features** (test-related work) → `tests/chat/X.XX.XX/<N>.md` (e.g. `tests/chat/0.37.2/1.md`).

For build sessions that produce a versioned app file, name the companion after the version (e.g. version `0.34.9` → `linebyline-0.34.9.md`). The HTML file is always `docs/index.html` but the companion carries the version. For non-build sessions, use the naming convention of the destination folder (numbered files in version folders for tests chat, single `skills-X.XX.XX.md` file for skills chat, numbered files in step folders for plan chat).

A single session may stitch multiple workflows together (e.g. Sonar remediation followed by Playwright test patches). In that case, choose the primary workflow's destination for the companion file, or split the transcript retroactively into multiple files at the workflow boundaries if the topics are distinct enough to warrant separate files.

Include each turn leading up to and working on that session's work.

Prepend or update frontmatter at the start:

```md
---
model: "GLM-5.1"
summary: "<1-2 sentence summary of the companion file's contents>"
---
```

Wrap the `summary` value in double quotes. Escape nested double quotes as `\"`, nested single quotes as `\'`, and literal backslashes as `\\`. This ensures proper rendering in Obsidian. Example: `summary: "Phase 4 post-push remediation on version 0.37.2. Turn 2 fixes S2486: use structuredClone instead of JSON.parse."`. Default the model name to `GLM-5.1` unless the user provides a skeleton transcript with a different model like `GLM-5.2`.

Append per turn (separate the user's text from yours with a `---` line): the turn number in a header, the user's prompts verbatim (including full contents of Prompt.md if uploaded), and all your non-file chat outputs that turn (including markdown tables and Mermaid diagrams). Use "about" to express approximation instead of "~".

Number turns sequentially with integers throughout the entire companion file (Turn 1, Turn 2, Turn 3, …), continuing across sessions if the companion file already exists from a prior session. Do not switch to letter labels (Turn A, Turn B, …) mid-session — this creates inconsistent references and makes it hard for a human to follow the turn sequence. If a session spans multiple companion files (e.g. Onboard in `linebyline-0.37.1.md`, then Build work in `linebyline-0.37.2.md`), the turn counter continues across files — the new file starts at the next turn number, not back at 1.

Never quote potentially licensed content in the companion file. This includes song lyrics, artist names, song titles, album titles, and any other text that could be copyrighted or trademarked. When documenting a fix that involved real lyrics (e.g. a Genius paste extraction bug), replace all lyric text and identifying metadata with functional placeholders: `[intro vocalization]` for a dropped intro line, `[final lyric line]` for the last line, `[Verse 1: singers]` for section headers with real singer names, `[real artist] — [real song]` for the page title. The technical discussion should reference structural properties (line index, bracket format, blank-line position) rather than the actual content. The companion file lives in `download/` and may be visible to GitHub contributors — treat it as public.

Drop these sections from every turn — they add clutter without helping the reader:

- `## Deliverables this turn` — the reader (whether the user or a GitHub contributor) cannot see the agent's sandbox filesystem, so listing file paths there is useless. The companion file itself is the deliverable; the user can see what files were produced by looking at the `download/` directory or the commit.
- `## Awaiting` — the next turn's verbatim user prompt already conveys what happened next, making this section redundant. If the user confirmed tests passed, that confirmation appears at the top of the next turn. If the user reported a new issue, that issue is the next turn's prompt.
- `## Skill updates` / `## Skill and Memory updates` (and equivalent "what I changed in Memory.md / skill-SKILL.md this turn" descriptions) — the commit history already shows what changed in those files line-by-line; restating it in the companion duplicates the commit log. The companion's job is to preserve the *reasoning* behind decisions, not to repeat the diff. If a Memory or skill update introduces a new general principle (e.g. a new lesson extracted from this turn's incident), document the principle itself and why it matters — that's reasoning — but skip the "added to skill-SKILL.md under section X" framing.
- `## Post-fix verification` (and equivalent "next steps to confirm before pushing" lists) — these are streaming instructions to the user that resolve to either commits (if the user runs the suggested check and applies the result) or follow-up prompts (if the user reports back what happened). Either way they don't belong in the transcript: a future reader of commit history wants the reasoning behind what was decided, not a checklist of "now run X to verify." If verification surfaced a non-obvious finding (e.g. "after revert, `npm audit` showed 4 high — confirmed the OOM CVE is unfixable as Turn 13 predicted"), that finding belongs in the diagnosis section, not in a separate verification list.

If the version is unchanged and the companion file already exists, update it rather than creating a new one.

Companion .md vs readme .md. The Boilerplate rule says "Pair each non-trivial name.ext source file with a name.md readme." The companion file is a chat transcript, not a readme — it documents the reasoning behind decisions, not how to use the file. These are different artifacts with different purposes. A readme explains intent, usage, and known limitations for a developer. A companion records the turn-by-turn conversation that produced the file. They can coexist for the same code file (e.g. `linebyline-0.37.2.md` companion alongside a `readme.md` for the same version). In practice, the LineByLine project uses companion files for all sessions and does not produce separate readmes for each version — the companion file serves as the primary code-understanding surface.

---

Download copy

Each turn, without prompting, copy only the files you created or updated that turn to the download directory. This includes:

1. The app HTML file, `docs/index.html` (if produced this session).
2. Any modified test files (`*.spec.js`) so they are visible alongside code changes.
3. The companion `.md` file.
4. Any skill files you created or updated that turn.
5. Any other files the user would need to see (e.g., updated Memory.md, updated skills).

This ensures the user can access all deliverables from the current session without searching the project tree.

---

Cross-references

- `web-channel` — behavioral rules for the chat.z.ai Agent web channel (applies every turn)
- `linebyline-section-index` — how to read only the sections you need instead of the entire file
- `skill` — when to create or update skills vs Memory.md entries
- `code-quality` — patterns to follow and pitfalls to avoid when writing JavaScript
- `single-file-html-app` — architectural patterns for the single-file constraint
- `playwright-testing` — test impact awareness after code changes
- `Vibecoding workflow` (ai/chat.z.ai/Vibecoding-workflow.md) — the human-directed session flow with step diagrams; documents the known workflows (Building features, Improving AI scaffolding, Remediating latent Sonar issues, Improving Playwright tests, Researching and implementing high-level plans). The user may follow any of these, stitch them together, or invent custom ones.
- `Repomix snippets` (ai/chat.z.ai/Repomix-snippets.md) — the Repomix commands and step-to-bundle mapping. Step headers there are intentionally not numbered to reflect that steps can be used in any order.
- `Diagrammo flowcharts` (ai/chat.z.ai/Diagrammo-flowcharts.md) — syntax reference for reading `dgmo` codeblocks in the Vibecoding workflow
