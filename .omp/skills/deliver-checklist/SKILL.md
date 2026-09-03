---
name: deliver-checklist
description: Pre-patch, post-patch, and post-turn checks for every LineByLine coding session. Use this skill before writing any code change, immediately after every patch, and after every turn regardless of whether code was changed. Also use when designing a session's workflow or when reflecting on what documentation needs to be updated. This skill replaces a legacy multi-stage workflow that was a workaround for a 200K-token context window.
globs: []
alwaysApply: false
---

The three phases below are independent and run in this order. Every turn completes all three. Skip a phase only when the turn's work genuinely doesn't touch its scope (e.g. a pure diagnosis turn skips the syntax check).

---

## Pre-patch checklist

Before writing any code change:

1. **Clarify ambiguity first.** Stop and ask when a request is unclear, relevant files are missing, a request is technically infeasible, or a request violates a best practice in `code-quality` or `aria-accessibility`. Don't guess and patch the wrong thing.
2. **Read only the sections you need.** Use the `linebyline-section-index` skill to locate sections by grepping for `// ──` markers, then read just those ranges. Avoid loading the entire ~2700-line file (~50k tokens) when only a few sections are relevant.
3. **Patch with minimal diff.** Change only what's needed and preserve surrounding code. Prefer targeted edits over full-section rewrites unless the section is being restructured. Don't generate your own icons; prioritize any the user uploads, then Lucide icons. Don't add code that links to external websites besides GitHub.
4. **Consult `code-quality` before modifying functions.** The pre-delivery checklist in that skill (CC, braceless-if, state management, undo/redo single-push, config reads, helper extraction safety, test impact) is the durable reference; re-read it before changing any non-trivial function.

---

## Post-patch verification

After every patch, before delivering:

1. **Syntax check.** Confirm the patched file parses without errors (`new Function(src)`, `node --check`, or load in browser). A syntax error in a single-file app means the entire app is broken.
2. **Section index accuracy.** Re-run the grep for `// ──` markers and compare to the previous index. Line numbers shift with every insertion or deletion; the section-index skill must reflect the new reality. Update its section list when markers shift.
3. **Spot-check referenced functions.** If the patch touched any function referenced by the section index, verify the function still exists at its declared line.
4. **Trace one representative user action.** If the patch changed any logic (not just formatting), trace one user action through the changed code path to confirm it still reaches the expected outcome. This catches wiring mistakes that syntax checks cannot.
5. **Test impact analysis.** Use the `playwright-testing` skill's "When code changes require snapshot/screenshot regen" table to enumerate which test snapshots and screenshots are affected. Tell the user which baselines will need regeneration before they push.

---

## Post-turn updates

Apply after every turn, regardless of whether a code patch was made. The user may push at any moment without notifying the agent — on the off chance that any turn is the last before a push, the documentation artifacts must already be current. This is default turn hygiene, not a special end-of-session step.

1. **Reflect on the change set.** What was actually new and distinctive this turn? (a) A code change — list the affected functions and the design choice. (b) A resolved failure — document root cause and the fix, even if small. (c) A discovery — a non-obvious gotcha future sessions should know. If none of these apply (pure diagnosis with no new finding), skip the rest of this phase.
2. **When the change set is durable, extract it to a skill.** Use the test: "would a fresh model in a new session need this?" — if yes, it belongs in a skill. OMP's `local` memory backend auto-consolidates past sessions; that handles durable facts automatically.
3. **Update skills in-place, not by appending.** When the change shifts the architecture a skill documents (helper extraction, new restricted key, new SonarQube rule, new Playwright helper), update the skill in-place. Don't add "Turn N: extracted helper X" appendices — those are commit-log noise. Re-read the affected skill before editing to avoid drift.
4. **Cross-skill consistency.** When updating one skill, check whether an existing skill already covers the pattern. If so, update both.
5. **Tell the user about follow-on work.** If the turn produced code that requires the user to regenerate test snapshots, push a fix, or run a verification command, surface that at the end of the turn. Don't bury it in a long internal paragraph.

---

## Versioning

The app file is `docs/index.html` — overwrite it in place, never create a versioned copy. The version is encoded in `<title>`, not in the filename. Semver rules:

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Don't change version without an explicit request. Don't substitute version dots with spaces, underscores, or any other character — applies to filenames passed to all tools, not just `<title>`. The user states the current version in their first message; if they don't, derive it from the highest semver folder under `archive/modular/` in the directory structure.

---

## What this skill does NOT cover

- **Session transcript capture** — that's the `pi-md-export` plugin or OMP's in-app session tree. Transcripts are auto-managed; don't recreate a hand-written transcript system.
- **Test writing patterns** — see `playwright-testing`.
- **SonarQube remediation procedure** — see `sonarqube-workflow`.
- **Code quality patterns and CC reduction** — see `code-quality`.

This skill is only the framework: when to read, when to verify, when to document. The substance lives in the domain skills it cross-references.
