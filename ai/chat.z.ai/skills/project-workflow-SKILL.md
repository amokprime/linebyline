---
name: project-workflow
description: Session bootstrapping, file navigation, and patch delivery workflow for the LineByLine app. Use this skill at the start of every session, whenever you receive a Repomix snippet, need to locate project files, follow the build/patch workflow, version the app, or decide whether MEMORY.md or a skill needs updating after a change. Also use when the user mentions a vibecoding step (Build, Review, Test, Skills, Propose), Repomix, or post-turn documentation hygiene.
---

The project uses a Repomix-based workflow: context arrives as just-in-time Repomix snippets so that only the files needed for the current step occupy attention. A single-file HTML app must be patched with minimal diff, and a set of obligations (pre-patch checklist, post-patch verification, post-turn documentation updates) must be followed. Following this workflow each turn prevents regressions and keeps session artifacts in sync — the user may push at any moment without notifying the agent, so artifacts must be current after every turn.

---

Re-read cadence

Re-read this skill at the start of each new step and whenever the user announces a step change. The agent's context compacts over long sessions — early-turn workflow rules become less reliable later. Re-reading this skill at step boundaries is the countermeasure. Also re-read the web-channel skill at the same time, since its rules apply every turn and are equally vulnerable to compaction.

---

Workflows and steps

There are many possible vibecoding workflows — see `Vibecoding workflow` (ai/chat.z.ai/Vibecoding-workflow.md) for the known ones with flowchart diagrams. The agent should be aware that the user may pick and choose steps in any order, stitch multiple workflows together in a single session, or follow a custom workflow not yet documented. Do not assume a linear front-to-back progression (e.g. Onboard → Build → Review → Test → done). The user tells you which step they're on; each step can span multiple turns, and the user will announce when they're changing steps. The user may end a session at any point without a formal wrap-up — they may push on the spur of the moment, or click the send button and suddenly remember something they forgot to mention. The agent's defense against this unpredictability is to keep documentation artifacts (MEMORY.md, skills) current after every turn, so that a push at any moment captures a complete audit trail. See Post-turn updates.

The steps below are the building blocks. Their Repomix snippets are defined in `Repomix snippets` (ai/chat.z.ai/Repomix-snippets.md) — the snippet headers there are intentionally not numbered, reflecting that steps can be used in any order.

---

Onboard

Repomix: `repomix-onboard.xml`. Contains: project-workflow-SKILL.md, README.md, skill-SKILL.md, web-channel-SKILL.md, MEMORY.md, and archive/modular/plan/**.

1. Read project-workflow-SKILL.md (this file), README.md, and MEMORY.md.
2. Read the web-channel skill — it applies to every turn of the session, not just onboarding.
3. Note the current app version. The user may state it directly ("Current version: 0.37.1"). If they don't state it, derive it from the Onboard Repomix's `<directory_structure>` (which always runs with `--include-full-directory-structure`): grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). Extract the semver portion either way — this is the baseline; derive all version numbers from it rather than asking the user to type them again. The app always lives at `docs/index.html` (its `<title>` tag carries the version), but that file arrives in `repomix-build.xml` and won't be available in non-build sessions — so don't rely on grepping it during Onboard.
4. Do not begin coding — the app HTML and domain skills arrive in a later step if needed. Onboard may be the only step in a session (e.g. a pure planning session), or it may be followed by any combination of the other steps in any order.
5. There is no companion file created at Onboard.

---

Build

Repomix: `repomix-build.xml`. Contains: linebyline-section-index-SKILL.md, single-file-html-app-SKILL.md, browser-hotkey-system-SKILL.md, MEMORY.md, the current app HTML, and (folded in) `src/**` + `tests/unit/**` + supporting config for in-sandbox Vitest runs.

1. Read MEMORY.md for development history.
2. Re-read project-workflow-SKILL.md to refresh the workflow rules.
3. Read only the domain skills relevant to the current task — use the description in each skill's frontmatter to decide. Use the linebyline-section-index skill to read only the sections of the app HTML you need, not the entire file.
4. Follow the user's requests that do not conflict with project-workflow-SKILL.md. Before writing any code, follow the Pre-patch checklist. After every patch, follow Post-patch verification. After every turn (patch or not), follow Post-turn updates.
5. If multiple features are requested, the user may bucket them into a single turn when they're minor or interdependent. If they're independent and substantial, address them sequentially.
6. In Build.md (if provided), the highest existing version header inherently implies the next app version. No need for the user to keyword-hint the semver — derive it from the existing headers.

---

Review

Repomix: `repomix-review.xml`. Contains: aria-accessibility-SKILL.md, code-quality-SKILL.md, sonarqube-workflow-SKILL.md.

1. Re-read project-workflow-SKILL.md.
2. Read the three audit skills in full. These are the skills most likely to be missed if read too early — reading them now, immediately before the audit, maximizes recall.
3. For post-push Sonar remediation: enumerate issues directly from the SonarCloud public API via the sandbox (see sonarqube-workflow-SKILL.md Step 0) — no user upload needed for issue enumeration. For rule rationale (`why`/`how`), the user exports locally via `sonar-export` and uploads the zip.
4. Review the code changes you made earlier this session. Audit those changes for the issues referenced in the three audit skills and make suggested fixes.

---

Test

Repomix: `repomix-test.xml`. Contains: playwright-testing-SKILL.md, tests/**, playwright.config.js.

1. Re-read project-workflow-SKILL.md.
2. Read playwright-testing-SKILL.md in full.
3. Patch failing tests, or generate new tests/helpers for new features added in the Build step.
4. The full Playwright suite is too heavy for the web sandbox (snapshot data overwhelms context). The user runs the full suite locally via `tst` and uploads results.

---

Skills (meta-session)

Repomix: `repomix-skills.xml`. Contains: all skills, Boilerplate.md, MEMORY.md, and the other `ai/chat.z.ai/` docs.

1. Re-read project-workflow-SKILL.md.
2. Read the relevant skills for the meta-work being done (e.g., skill-SKILL.md for creating/updating skills, sonarqube-workflow-SKILL.md for post-push remediation).
3. Work on agent scaffolding — updating skills, pruning MEMORY.md, creating new skills, etc.

---

Propose / Investigate / Plan

Repomix: `repomix-onboard.xml` (or a custom bundle). Used for high-level research and planning that may not produce code.

1. Re-read project-workflow-SKILL.md.
2. Read any relevant skills and project files for the investigation.
3. Proposals may start with half-baked criteria and become more refined in follow-up turns. Investigations may need web searches to rule out alternatives. One idea often leads to another — this produces large buckets of proposed items to triage later.

---

MEMORY.md discipline

Write one bullet per parallel thread of work, not one bullet per turn. When a session iterates on the same change across multiple turns (fix → regression catch → follow-up), narrating each turn's state as a separate bullet duplicates earlier states — the reader must mentally diff successive bullets to recover the current state. Instead, identify the unique parallel threads in the session (e.g. "SonarCloud remediation" vs "Genius paste cleanup" vs "test suite hardening") and write one bullet per thread, updated in-place to reflect its latest state. New turns that touch an existing thread edit the existing bullet rather than appending a new one. This keeps MEMORY.md a current-state snapshot, not a change log. If a thread is still actively evolving at session end, the in-place bullet should describe the final state.

No turn numbers in MEMORY.md bullets. Turn numbers are session-local: a version like 0.37.2 can span multiple sessions (e.g. an app-code session, a CI/test session, a skills session), and "Turn 7" in one session is unrelated to "Turn 7" in another. Referencing them in MEMORY.md creates ambiguous pointers that a reader cannot resolve without already knowing which session is meant.

Verbose Memory entries signal skill gaps. When a MEMORY.md entry starts explaining how to do something rather than just what happened, that's a sign the knowledge belongs in a skill. MEMORY.md should say "Fixed X by doing Y (root cause: Z)." If it needs to say "When doing X, always do Y because Z, and here are the three cases to watch for," that's a skill.

Knowledge offload reduces MEMORY.md bloat. Extracting domain knowledge from MEMORY.md into a skill turns verbose per-version details into one-line references. MEMORY.md becomes a compact historical overview for regression investigation, not a how-to guide. The how-to guide lives in the skill.

Pruning preserves history. Pruning a MEMORY.md entry means condensing it to a brief reference, not deleting it. Past session entries are historical records — they document what changed, why, and what went wrong, which is essential for regression investigation. A future session that encounters a similar bug needs to know it happened before and what the root cause was. Only prune entries you created or updated this session; leave past session entries intact unless they are now fully redundant with a skill (in which case, replace with a one-line reference pointing to that skill, not a deletion).

The agent edits MEMORY.md in-sandbox and produces the updated file in `download/` for the user to apply to the repo. Apply updates inline — do not propose them as drafts for the user to approve. The user is a solo vibecoder, not a review board; proposing-and-deferring just creates a queue of un-applied knowledge that gets lost when the user pushes without wrapping up.

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
5. Run `npm run test:unit` in-sandbox if the patch touches `src/` modules with unit tests. The Build Repomix bundles `src/**` + `tests/unit/**` for this purpose. For Playwright-level verification, the user runs `tst` locally.

---

Post-turn updates

Apply after every turn, regardless of whether a code patch was made. The user may push at any moment without notifying the agent — on the off chance that any turn is the last before a push, the documentation artifacts must already be current. This is default turn hygiene, not a special end-of-session step.

1. Update MEMORY.md when:
 - You finished a new, distinctive set of code changes — future sessions need to know what changed and why.
 - A code change failed in a way that would surprise a fresh model in a new chat if it wasn't documented — failures are the most valuable MEMORY.md entries because they prevent re-discovery.
 Apply the update inline — produce the updated MEMORY.md in `download/` for the user to apply. Do not propose it as a draft for the user to approve. If the turn produces no distinctive changes worth remembering, skip this.
2. Re-index the section index if a code patch shifted line numbers — update `linebyline-section-index-SKILL.md`. The section structure (names and contents) is the durable part; line numbers are point-in-time references that must be refreshed after patches that insert or delete lines.
3. Update a skill when a patch changes the architecture the skill documents (e.g. extracting `handleSecKeydown` to outer scope changes the section index skill, adding a new restricted key changes the hotkey skill). Don't update a skill for a pure bug fix that doesn't change the documented architecture. Apply the update inline (deliver the updated skill file in `download/`). Check cross-skill consistency: when updating one skill, check whether existing skills already cover the pattern — if they do, update them rather than just adding to MEMORY.md. Prune any MEMORY.md entries you fully extracted to a skill this session to brief references pointing to that skill.

---

Versioning

The user states the current version in their first chat message, either directly ("Current version: 0.37.1") or by referencing `docs/index.html`. If they don't state it, derive it from the Onboard Repomix's `<directory_structure>` (which always runs with `--include-full-directory-structure`): grep for the highest semver folder name under `archive/semantic/` (pre-modular-rework sessions) or `archive/modular/` (post-rework sessions). Extract the semver portion and use it as the baseline. The app file is always `docs/index.html` — the version is encoded in `<title>`, not in the filename — but that file arrives in `repomix-build.xml` and won't be available in non-build sessions, so don't rely on grepping it during Onboard. When the user requests a version change, apply semver rules:

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Don't change version without an explicit request from the user. Don't substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just `<title>`.

Derive the target version from the stated baseline and semver rules — don't ask the user to type it separately. The user states the version once; you apply it consistently everywhere (`<title>` in `docs/index.html`, version comments). The HTML file is always `docs/index.html` — overwrite it in place, don't create a versioned copy.

In Build.md, the highest existing version header with a real item inherently implies the next app version. No need for the user to keyword-hint the semver — derive it from the existing headers.

---

Download copy

Each turn, without prompting, copy only the files you created or updated that turn to the download directory. This includes:

1. Any modified source files (`*.ts`, `*.vue`) so they are visible alongside code changes.
2. Any modified test files (`*.spec.js`, `*.test.ts`) so they are visible alongside code changes.
3. Any skill files you created or updated that turn.
4. The updated `ai/chat.z.ai/MEMORY.md`, if you changed it this turn.
5. The updated `0-Roadmap.md`, if tranche status changed.

Put files directly in `download/` — do not use subdirectories (the user cannot see them). Use hyphenated filenames that encode the path (e.g. `src-composables-useAudio.ts`, not `src/composables/useAudio.ts`).

**Keep `download/` clean between turns.** The same file should not exist both inside and outside the zip — the point of the zip is to collapse the sprawling flat structure. At the end of each turn, after running `prepare.sh` to generate `deliver.zip`, remove the loose files so only `deliver.zip` remains. At the start of the next turn, if a stale `deliver.zip` from the previous turn is still there, remove it before placing new files. The user downloads the zip, not the individual files.

---

Deliver zip pattern (multi-file sessions)

When a session produces more than a handful of files (the modular refactor routinely ships 10-20 files per tranche), the flat download directory becomes hard to track. Use the prepare → download → deploy pattern:

1. **Sandbox side (`scripts/prepare.sh`)**: after all files are in `download/`, run `bash /home/z/my-project/scripts/prepare.sh` to zip everything into `download/deliver.zip`. The script then removes the loose files, leaving only `deliver.zip`. The zip includes a `deploy.sh` that maps each flat hyphenated filename to its real repo path. The committed repo copy of `prepare.sh` lives at `ai/chat.z.ai/scripts/delivery/prepare.sh`.

2. **User side (`ai/chat.z.ai/scripts/delivery/unpack.sh`)**: the user's `dpl` fish abbreviation (`abbr --add dpl '~/GitHub/linebyline/ai/chat.z.ai/scripts/delivery/unpack.sh'`) runs `unpack.sh`, which extracts `deliver.zip` to `scratch/`, runs `./deploy.sh`, waits 60s for Syncthing, then runs tests via SSH. The script cleans up `deploy.sh` and `deliver.zip` afterward. `unpack.sh` must be run from a terminal (not double-clicked) — the ssh + notify-send output needs a visible terminal.

3. **`deploy.sh` template** (committed at `ai/chat.z.ai/scripts/delivery/deploy.sh`): a reusable script with a `deploy_file` function that uses `cmp -s` to skip byte-identical files — preserves timestamps and avoids unnecessary Syncthing syncs / git diffs. Each session, the agent fills in the file mappings (the `deploy_file <flat> <repo_path>` lines) and includes the filled-in copy inside `deliver.zip`. The template stays committed for reproducibility; the session copy is ephemeral.

4. **`deploy.sh` contents**: the `deploy_file` function handles `mkdir -p` for the destination, `cmp -s` for the byte-identical check, and `mv` (or `rm` if skipped). After all `deploy_file` calls, a summary section lists changed files (one per line) for sanity-checking against the chat output. A collision-cleanup section then removes ALL remaining loose files (except `deploy.sh` and `deliver.zip`, which `unpack.sh` handles) to prevent collision with the next `unzip` round. Edit the `DEST` variable (or set `LINEBYLINE_ROOT`) if the repo lives elsewhere.

5. **All three scripts live at `ai/chat.z.ai/scripts/delivery/`** — `deploy.sh` and `prepare.sh` are agent-facing (run by the agent or `prepare.sh`); `unpack.sh` is user-facing (run from terminal via `dpl`). The `delivery/` subdir keeps them away from the double-click silent scripts in `ai/chat.z.ai/scripts/`.

The `deploy.sh` must be updated whenever a new file is added to the session's deliverables. Keep it in sync with `download/` — if a file is in `download/` but not in `deploy.sh`, it won't be deployed.

---

Cross-references

- `web-channel` — behavioral rules for the chat.z.ai Agent web channel (applies every turn)
- `linebyline-section-index` — how to read only the sections you need instead of the entire file
- `skill` — when to create or update skills vs MEMORY.md entries
- `code-quality` — patterns to follow and pitfalls to avoid when writing JavaScript
- `single-file-html-app` — architectural patterns for the single-file constraint
- `playwright-testing` — test impact awareness after code changes
- `sonarqube-workflow` — sandbox API enumeration + local-export triage
- `Vibecoding workflow` (ai/chat.z.ai/Vibecoding-workflow.md) — the human-directed session flow with step diagrams; documents the known workflows (Building features, Improving AI scaffolding, Remediating latent Sonar issues, Improving Playwright tests, Researching and implementing high-level plans). The user may follow any of these, stitch them together, or invent custom ones.
- `Repomix snippets` (ai/chat.z.ai/Repomix-snippets.md) — the Repomix commands and step-to-bundle mapping. Step headers there are intentionally not numbered to reflect that steps can be used in any order.
- `Diagrammo flowcharts` (ai/chat.z.ai/Diagrammo-flowcharts.md) — syntax reference for reading `dgmo` codeblocks in the Vibecoding workflow
