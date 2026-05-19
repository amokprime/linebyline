---
name: skill
description: Create new skills and update existing ones for the LineByLine project. Use this skill whenever you need to create a skill from scratch, revise an existing skill, extract knowledge from Memory.md into a skill, or decide whether something belongs in a skill versus Memory.md. Also use when planning a skill-creation or skill-update session, or when evaluating whether existing skills need updating based on recent code changes.
---

A skill bakes substantive, reusable knowledge into a persistent artifact so it doesn't bloat Memory.md or get lost between sessions. Covers when to create or update skills, how to write them, and how to keep them current.

---

When to create a skill

1. Accumulated patterns — the same class of problem recurs across versions (SonarQube Cloud remediation, ARIA remediation, Playwright test writing). If you've written the same explanation three times in Memory.md, it belongs in a skill.
2. Procedural knowledge — a multi-step workflow the model must follow in a specific order (read export → categorize → assess → plan → deliver). Memory.md can note that the workflow exists, but the steps belong in a skill.
3. Domain reference — a catalog of rules, patterns, or gotchas the model needs to look up (SonarQube false positive categories, ARIA role-to-element mappings, Playwright assertion strategies). Reference tables belong in skills.
4. Architecture documentation — structural knowledge about the codebase that guides where to read and how to patch (section index, function layout). Changes slowly and is expensive to rediscover each session.

When not to create a skill: one-off bug fixes (stay in Memory.md), app-specific state that doesn't generalize, information already well-covered by an existing skill (update that skill instead).

---

Memory.md vs skills

Memory.md holds: app-specific bugs and their root causes, architectural decisions unique to this app, one-off pitfalls (e.g. "don't delete `_peelLastParen` during refactoring"), version-by-version change log, known limitations (e.g. browser-native dialog focus).

Skills hold: general patterns that caused those bugs, reusable architectural patterns, general cautions (e.g. "audit all pre-existing callees after extracting helpers"), workflow that applies across versions, workarounds and best practices.

If you'd need to explain it to a fresh model in a new session and it's not specific to one app's state, put it in a skill. If it's a historical fact needed to understand why something broke or was changed, keep it in Memory.md.

When extracting from Memory.md into a skill, prune the Memory.md entry to a brief reference. Don't duplicate — Memory.md should point to the skill, not restate it.

---

Anatomy of a skill

File: `topic-SKILL.md` stored in `linebyline/skills/`. Frontmatter `name` matches the file prefix without `-SKILL` (e.g. `name: sonarqube-workflow`). Keep a chat log of skill creation/update sessions in `linebyline/skills/chat/`.

Frontmatter `description` is the primary triggering mechanism — it determines whether the model consults this skill. Write it to be pushy: include both what the skill does and specific contexts for when to use it. List synonyms, related terms, and adjacent scenarios to combat undertriggering.

Weak: "Process SonarQube Cloud issues for LineByLine."
Strong: "Process SonarQube Cloud issue exports for the LineByLine project and guide remediation. Use this skill whenever the user uploads a zip of SonarQube issues, asks about SonarQube findings, mentions rules like S3776/S2004/S7761, or needs help deciding whether to fix or mark as Won't Fix. Also use when planning a SonarQube remediation pass before writing any code."

Body structure — organize in the order the model will need it during a typical session:
1. One-paragraph scope statement
2. Step-by-step workflow (if procedural)
3. Reference tables (only for genuine lookup data like rule catalogs)
4. Cautions and gotchas
5. Cross-references to other skills

Keep the body under 500 lines. If approaching this limit, split the domain into sub-skills.

---

Writing style

Explain the why. Don't rely on MUST and NEVER — explain the reasoning so the model understands why something matters and can adapt to situations the skill doesn't explicitly cover.

Weak: "NEVER convert a for loop to for-of if the index is used."
Strong: "Convert only when the loop index is not used for accumulation via index, output assignment keyed to index, indexed mutation of a parallel array, or any expression involving i other than arr[i]. When in doubt, skip and document as Won't Fix — a broken for-of conversion is worse than a SonarQube warning."

Generalize, don't overfit. Skills should capture patterns that apply across many invocations. If you're writing instructions that only make sense for one particular function, step back and find the general principle.

Overfit: "When batchSplitParens skips timestamped lines, strip the prefix first, then peel, then re-prepend."
Generalized: "When a function must operate on line content that may include a timestamp prefix, strip the prefix before processing and re-prepend after — a guard that skips timestamped lines entirely will miss lines that have both a timestamp and processable content."

Keep it lean. Remove anything that isn't pulling its weight. A shorter skill is read more carefully than a long one.

Use imperative form: "Read the first instance of each unique rule" (not "The first instance should be read").

Include concrete examples sparingly — one per non-obvious pattern. Skip examples for things the model already does correctly by default.

Prefer plain structure over decorative formatting. Indentation and numbered lists do the work of headers; plain prose does the work of bold emphasis. Tables only where they serve as genuine lookup references (e.g. a rule catalog). Bold only for the single most important term in a paragraph. The more formatting you add, the less weight any individual element carries.

---

Creating a new skill

1. Identify the domain — look at Memory.md entries that share a common theme. If multiple entries about the same domain are verbose and would benefit from a shared reference, that domain needs a skill.
2. Scope the skill — decide what it covers and what it doesn't. Narrow, actionable skills are better than broad, vague ones. ("Process SonarQube Cloud issue exports and guide remediation decisions" is a good scope. "Write better code" is not.)
3. Extract from Memory.md — for each related entry: if it describes a general pattern, extract the pattern into the skill and prune Memory.md to a brief reference; if it describes an app-specific event, keep it in Memory.md as-is; if it straddles both, extract the general principle into the skill and keep the specific instance in Memory.md.
4. Write the skill — follow the anatomy and writing style above. Draft it, then read it with fresh eyes and improve. Would a fresh model in a new session be able to follow this without additional context?
5. Cross-reference with existing skills — check that the new skill doesn't duplicate or contradict existing ones. If it overlaps, merge the overlapping content, split the domain more clearly, or add a cross-reference note in both skills.
6. Update Project.md if the new skill changes how the model should work (e.g. "always consult the ARIA skill before adding ARIA attributes").

---

Updating an existing skill

Per Project.md: update a skill when a patch changes the architecture the skill documents. Don't update for a pure bug fix that doesn't change the documented architecture.

Also update when: a new pattern or gotcha is discovered that the skill should cover; reference data is stale (section line numbers shifted, new SonarQube rules encountered); Memory.md entries reveal knowledge that belongs in the skill instead.

Stale reference hygiene — skills that reference specific line numbers go stale quickly. Prefer structural descriptions over exact numbers. Stale-prone: "The global keydown handler starts at line 2571." Durable: "The global keydown handler is in the `Keyboard → Global KD` section — find it by grepping for `// ──` section markers." When line numbers must appear, label them as a point-in-time reference.

Add to skill: patterns that recurred or would recur, cautions that prevent real bugs, reference data the model looks up, workflow steps the model must follow. Don't add: app-specific state, one-off fixes that don't generalize, implementation details that change frequently, anything already well-covered by another skill.

---

Evaluating skill quality

1. Triggering accuracy — would the description cause the skill to be consulted when it should be? Would it trigger when it shouldn't?
2. Self-sufficiency — can a fresh model follow the skill without additional context? If the skill says "use the pattern from v0.35.15," it's not self-sufficient.
3. Brevity vs completeness — does every section earn its token cost?
4. No contradiction — does the skill conflict with any other skill or with Project.md?
5. Currency — are version references current? Are deprecated patterns marked as such?

---

Lessons from practice

Knowledge offload reduces Memory.md bloat. Extracting SonarQube remediation knowledge from Memory.md into `sonarqube-workflow-SKILL.md` turned about 30 verbose lines of per-version SonarQube details into one-line references. Memory.md is now a compact historical overview for regression investigation, not a how-to guide.

SECTIONS moved from code to skill. The embedded `// SECTIONS:` comment in the app HTML was redundant with `linebyline-section-index-SKILL.md`. Removing it from code and keeping it in the skill eliminated a synchronization burden — the skill now uses a grep protocol that finds section markers dynamically.

Skills prevent re-discovery. Without `browser-hotkey-system-SKILL.md`, each new session would need to re-learn that Tab must be handled before `e.stopPropagation()` in search fields, that `RESTRICTED_ALL` should include Ctrl+M and Ctrl+O, and that focus traps must enumerate focusable elements at Tab-time rather than open-time. These are subtle patterns that are expensive to re-discover and easy to get wrong.

General patterns emerge from specific incidents. The `single-file-html-app-SKILL.md` "single source of truth" section was extracted from three separate Memory.md entries: the masterVolume/masterMuted double-flag bug, the `_volWheeling` race condition, and the undo/redo double-push pattern. No single entry justified its own section, but together they pointed to a general principle: when two variables represent the same underlying state, they will eventually disagree.

Verbose Memory entries signal skill gaps. When a Memory.md entry starts explaining how to do something rather than just what happened, that's a sign the knowledge belongs in a skill. Memory.md should say "Fixed X by doing Y (root cause: Z)." If it needs to say "When doing X, always do Y because Z, and here are the three cases to watch for," that's a skill.

Cross-skill consistency matters. The `browser-hotkey-system-SKILL.md` originally didn't include Ctrl+M in its `RESTRICTED_ALL` example, but the app had already learned this lesson the hard way. When updating skills from transcripts, check whether existing skills already cover the pattern — and if they don't, update them rather than just adding to Memory.md.
