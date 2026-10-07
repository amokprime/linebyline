---
name: linebyline
description: Project onboarding, session workflow, and patch delivery for the LineByLine app. Use this skill at the start of every session (after `.setup-sandbox.sh`), whenever you need to locate project files, follow the build/patch workflow, version the app, or decide whether MEMORY.md or another skill needs updating after a change. Also use when the user mentions a vibecoding step (Onboard, Code, Skills, Propose), or asks about project structure. This skill is the single onboarding + workflow reference — read it once at session start, re-read at step boundaries if context compacts.
---

This is the canonical project onboarding + workflow skill. It covers context loading, the vibecoding workflow steps, pre/post-patch checklists, post-turn documentation hygiene, versioning, and the deliver-zip pattern. Project structure lives in `AGENTS.md` (read once at Onboard, not every turn). Behavioral rules for the chat.z.ai web channel live in the `delivery` skill; specialized domain knowledge lives in the domain skills (`code-quality`, `aria-accessibility`, `sonarqube-workflow`, `playwright-testing`, etc.) — invoke those via `Skill(command="name")` when their description matches the current task.

---

Context loading

The chat.z.ai web channel does not auto-inject context files — the agent must Read them explicitly. To streamline this, `scripts/.setup-sandbox.sh` copies the project skills into `/home/z/my-project/skills/` so their `description` frontmatter auto-loads into the sandbox's `available_skills` list (invokable via `Skill(command="name")`). Run it once at Onboard after cloning the repo; it's idempotent. Root-level `AGENTS.md` and `MEMORY.md` do NOT auto-load — they must be Read explicitly (the Espanso snippets in `scripts/espanso/linebyline.yml` insert the clone + read instructions).

The Espanso snippets define which files to read per step. See `ai/README.md` for the current trigger list (`:onb`, `:code`, `:skl`).

---

Coding and testing

- Don't put large comment blocks in code files. Separate documentation from source. See the `delivery` skill → "Comment density" for the full rule (3+ consecutive comment lines, paired `name.md` readmes, etc.).
- Documentation and context files should never be dense, minified walls of text.

---

Re-read cadence

Re-read this skill at the start of each new step and whenever the user announces a step change. The agent's context compacts over long sessions — early-turn workflow rules become less reliable later. Re-reading this skill at step boundaries is the countermeasure. Also re-read the `delivery` skill at the same time, since its web-channel rules apply every turn and are equally vulnerable to compaction.

---

Workflows and steps

There are many possible vibecoding workflows — see `ai/Vibecoding workflow.md` for the known ones with flowchart diagrams. The agent handles the blue square nodes (Build, Review, Test, Skills, Investigate, Plan, Attempt); the user handles the green/red/yellow nodes (Onboard, decisions, push, wrap up). After building or patching, the agent loops Review ↔ Test until both code-quality checks and tests pass — the user does not need to announce "Review step" or "Test step" separately.

The user may pick and choose steps in any order, stitch multiple workflows together, or follow a custom workflow. The user tells you which step they're on; each step can span multiple turns. The user may end a session at any point without a formal wrap-up. The agent's defense against this unpredictability is to keep documentation artifacts (MEMORY.md, skills) current after every turn, so that a push at any moment captures a complete audit trail. See Post-turn updates.

---

Onboard

Trigger: `:onb`. Read `AGENTS.md`, `MEMORY.md`, `ROADMAP.md`, `package.json`, `README.md`, and `skills/delivery/scripts/{prepare,deploy,unpack}.sh`. Run `bash scripts/.setup-sandbox.sh` to install project skills into the sandbox.

1. Read `AGENTS.md` (minimal pointer to this skill + project structure) and `MEMORY.md` for development history.
2. Read this skill (the `linebyline` skill — you're reading it now) and the `delivery` skill.
3. Note the current app version. The user may state it directly ("Current version: 0.37.1"). If they don't state it, derive it from the repo tree: grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). The app always lives at `docs/index.html` (its `<title>` tag carries the version).
4. Do not begin coding — the app HTML and domain skills are read on-demand when the Code step begins. Onboard may be the only step in a session (e.g. a pure planning session), or it may be followed by Code or Skills.
5. There is no companion file created at Onboard.

---

Code (Build + Test + automatic Review)

Trigger: `:code`. Read `AGENTS.md`, `LIMITATIONS.md`, `docs/index.html`, `src/**`, config files, `tests/unit/**`, `tests/helpers/**`. The domain skills (`linebyline-section-index`, `single-file-html-app`, `browser-hotkey-system`) auto-load via `.setup-sandbox.sh` — invoke them via `Skill(command="name")` when needed.

1. Read `MEMORY.md` for development history if not already read at Onboard.
2. Re-read this skill to refresh the workflow rules.
3. Use the `linebyline-section-index` skill to read only the sections of `docs/index.html` you need, not the entire ~2600-line file.
4. Follow the user's requests that do not conflict with this skill. Before writing any code, follow the Pre-patch checklist. After every patch, follow Post-patch verification. After every turn (patch or not), follow Post-turn updates.
5. If multiple features are requested, the user may bucket them into a single turn when they're minor or interdependent. If they're independent and substantial, address them sequentially.
6. The highest existing version header in `Build.md` (if provided) inherently implies the next app version. No need for the user to keyword-hint the semver — derive it from the existing headers.

**Automatic Review loop.** After patching, the agent runs Review (audit for issues from `aria-accessibility`, `code-quality`, `sonarqube-workflow` skills) and Test (run `npm run test:unit` in-sandbox; the user runs the full Playwright suite via `tst` locally) until both pass. This loop is agent-driven — the user does not need to announce "Review step" or "Test step" separately. The loop ends when: (a) the agent's code-quality audit finds no issues, AND (b) the Vitest unit suite passes in-sandbox. The user then pushes and checks SonarCloud; if new issues surface, the user prompts the agent to Review again. See `ai/Vibecoding workflow.md` → "Division of labor".

For test-running details (sandbox Vitest, sample Playwright, the `tst`/`tsta`/CI environment matrix), see the `playwright-testing` skill.

---

Skills (meta-session)

Trigger: `:skl`. Read `CONTRIBUTING.md`, `AGENTS.md`, `MEMORY.md`, `skills/**` (except this skill + `delivery` + `skill`), `scripts/**`, `ai/**` (except `ai/templates/`).

1. Re-read this skill and the `skill` skill.
2. Work on agent scaffolding — updating skills, pruning MEMORY.md, creating new skills, etc.
3. Historical skill-creation transcripts are at `archive/skills/`; script-creation at `archive/scripts/`; test-creation at `archive/tests/` — read those if directly relevant to the meta-work being done.

---

Propose / Investigate / Plan

No dedicated trigger — uses `:onb` context. Used for high-level research and planning that may not produce code.

1. Re-read this skill.
2. Read any relevant skills and project files for the investigation.
3. Proposals may start with half-baked criteria and become more refined in follow-up turns. Investigations may need web searches to rule out alternatives. One idea often leads to another — this produces large buckets of proposed items to triage later.

---

MEMORY.md discipline

Write one bullet per parallel thread of work, not one bullet per turn. When a session iterates on the same change across multiple turns (fix → regression catch → follow-up), narrating each turn's state as a separate bullet duplicates earlier states — the reader must mentally diff successive bullets to recover the current state. Instead, identify the unique parallel threads in the session and write one bullet per thread, updated in-place to reflect its latest state. This keeps MEMORY.md a current-state snapshot, not a change log.

No turn numbers in MEMORY.md bullets. Turn numbers are session-local: a version like 0.37.2 can span multiple sessions, and "Turn 7" in one session is unrelated to "Turn 7" in another.

Verbose Memory entries signal skill gaps. When a MEMORY.md entry starts explaining how to do something rather than just what happened, that's a sign the knowledge belongs in a skill. MEMORY.md should say "Fixed X by doing Y (root cause: Z)." If it needs to say "When doing X, always do Y because Z, and here are the three cases to watch for," that's a skill.

Pruning preserves history. Pruning a MEMORY.md entry means condensing it to a brief reference, not deleting it. Past session entries are historical records. Only prune entries you created or updated this session; leave past session entries intact unless they are now fully redundant with a skill.

The agent edits MEMORY.md in-sandbox and produces the updated file in `download/` for the user to apply to the repo. Apply updates inline — do not propose them as drafts for the user to approve.

---

Pre-patch checklist

Before writing any code change:

1. Stop and request clarification when: a request is unclear or overly complex, relevant files are missing, a request is technically infeasible, or a request violates best practices from a skill.
2. Read only the sections you need — use the `linebyline-section-index` skill to locate sections by grepping for `// ──` markers, then read just those ranges. This avoids loading the entire ~2600-line file (~50k tokens) when only a few sections are relevant.
3. Patch with minimal diff — change only what's needed and preserve surrounding code. Prefer targeted edits over full-section rewrites unless the section is being restructured. Don't generate your own icons; prioritize any the user uploads, then Lucide icons. Don't add code that links to external websites besides GitHub.
4. Consult the `code-quality` skill before modifying functions.

---

Post-patch verification

After every patch, before delivering:

1. Syntax check — confirm the patched file passes `new Function` (or equivalent) without errors. A syntax error in a single-file app means the entire app is broken.
2. Section index accuracy — re-run the grep for `// ──` markers and compare to the previous index. Line numbers shift with every insertion or deletion; the section-index skill must reflect the new reality.
3. Spot-check referenced functions — if the patch touched any function referenced by the section index, verify the function still exists at its declared line.
4. Trace one representative user action — if the patch changed any logic (not just formatting), trace one user action through the changed code path to confirm it still reaches the expected outcome.
5. Run `npm run test:unit` in-sandbox if the patch touches `src/` modules with unit tests. For Playwright-level verification, the user runs `tst` locally. See the `playwright-testing` skill for sandbox-side sample test guidance.

---

Post-turn updates

Apply after every turn, regardless of whether a code patch was made. The user may push at any moment without notifying the agent — on the off chance that any turn is the last before a push, the documentation artifacts must already be current.

1. Update MEMORY.md when:
- You finished a new, distinctive set of code changes — future sessions need to know what changed and why.
- A code change failed in a way that would surprise a fresh model in a new chat if it wasn't documented — failures are the most valuable MEMORY.md entries because they prevent re-discovery.
 Apply the update inline — produce the updated MEMORY.md in `download/` for the user to apply. Do not propose it as a draft for the user to approve. If the turn produces no distinctive changes worth remembering, skip this.
2. Re-index the section index if a code patch shifted line numbers — update `linebyline-section-index-SKILL.md`. The section structure (names and contents) is the durable part; line numbers are point-in-time references.
3. Update a skill when a patch changes the architecture the skill documents. Don't update a skill for a pure bug fix that doesn't change the documented architecture. Apply the update inline (deliver the updated skill file in `download/`). Check cross-skill consistency: when updating one skill, check whether existing skills already cover the pattern — if they do, update them rather than just adding to MEMORY.md.

---

Versioning

The user states the current version in their first chat message, either directly ("Current version: 0.37.1") or by referencing `docs/index.html`. If they don't state it, derive it from the repo tree: grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). The app file is always `docs/index.html` — the version is encoded in `<title>`, not in the filename. When the user requests a version change, apply semver rules:

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Don't change version without an explicit request from the user. Don't substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just `<title>`.

---

Download copy

Each turn, without prompting, copy only the files you created or updated that turn to the download directory. Put files directly in `download/` — do not use subdirectories (the user cannot see them). Use hyphenated filenames that encode the path (e.g. `src-composables-useAudio.ts`, not `src/composables/useAudio.ts`).

**Keep `download/` clean between turns.** After running `prepare.sh` to generate `deliver.zip`, remove the loose files so only `deliver.zip` remains. At the start of the next turn, remove any stale `deliver.zip` before placing new files. See the `delivery` skill for the full deliver-zip pattern.

---

Cross-references

- `delivery` — behavioral rules for the chat.z.ai web channel (applies every turn) + the delivery workflow (prepare → zip → deploy) + sandbox vs. user-side environment table
- `skill` — when to create or update skills vs MEMORY.md entries; consolidation direction protocol
- `linebyline-section-index` — how to read only the sections you need instead of the entire file
- `code-quality` — patterns to follow and pitfalls to avoid when writing JavaScript
- `single-file-html-app` — architectural patterns for the single-file constraint
- `browser-hotkey-system` — key normalization, restriction rules, capture-input behavior
- `playwright-testing` — test environments, sandbox-side sample tests, snapshot strategy, font-fragile screenshots
- `sonarqube-workflow` — `sie` Markdown report triage + sandbox API fallback + SonarCloud/CodeQL environment details
- `aria-accessibility` — Rules 1–9 covering semantic HTML, accessible names, dialog/modals
- `ai/Vibecoding workflow.md` — the human-directed session flow with step diagrams + division of labor
- `ai/Diagrammo flowcharts.md` — syntax reference for reading `dgmo` codeblocks
- `ai/README.md` — the current Espanso trigger list
- `ROADMAP.md` — the modular refactor plan + tranche implementation notes
