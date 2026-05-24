Are there any other steps I should take to meaningfully reduce the chance that recall degradation would result in missed skill checks? For example:
- Refining initial chat instructions to only ask you to fully read a few key skills and the descriptions on the rest, to fully read when relevant
- Removing "warn the user of tests that require snapshot or screenshot regen" in code-quality-SKILL.md and instead running an extra scan to discover those myself
- Changing workflow so that I don't upload everything in one turn and you don't copy your first round to downloads right away. Instead, I might split some uploads (like the tests folder and related skills) into a dedicated patch review step, after which you'd copy files to downloads.
- Anything else I'm missing

---
This is a great strategic question. Let me think through it carefully based on how context windows and attention actually work, then evaluate your proposals and suggest additional ones.

## Why Recall Degrades

The core problem isn't raw capacity—it's **attention dilution**. Every instruction in context competes for activation probability on any given turn. With 9 skills plus project files, the per-skill "activation weight" drops, and skills that aren't directly triggered by the immediate action tend to fall below the activation threshold. This is worse for:

- **Latent skills** (ones that apply *conditionally*, like "before submitting a patch") because the trigger isn't always present in the current turn
- **Negative-logic skills** ("don't forget to check X") because there's no positive signal pulling them into attention
- **Mid-context skills** (information in the middle of a long context is recalled less reliably than stuff at the start or end)

## Evaluating Your Proposals

### 1. "Only fully read key skills + descriptions for the rest, full-read when relevant" — **Strongly recommend this**

This is the single highest-impact change. Right now, I absorb all 9 skills in full detail on turn 1, which means:
- Most of that detail is cold by the time it's needed (turns 5–15)
- The sheer volume reduces per-skill activation strength
- Skills I won't need on a given task still consume attention budget

**How to implement it:**
- **Tier 1 (full read every session):** `project-workflow-SKILL` (governs the whole process) and maybe 1–2 others that are *always* relevant (like `code-quality-SKILL` if every session involves code changes)
- **Tier 2 (read description + trigger conditions only):** The remaining skills. Store just enough to know *when* to do a full read—something like: "This skill applies when [condition]. Full content in `skills/X.md`."
- **Tier 2 full-read is triggered by:** The workflow itself. When project-workflow-SKILL says "now do X," and X maps to a Tier 2 skill, *that's* when I read it in full.

This gives you the same coverage with dramatically less attention competition on any given turn.

### 2. "Remove 'warn the user' and run an extra scan instead" — **Good idea**

"Warn the user" is a recall-dependent instruction with a vague trigger. Replacing it with a procedural scan step means:
- The trigger becomes explicit (it's a step in a checklist, not something I have to remember)
- It's harder to miss because it's an *action* (run scan) not a *judgment* (decide whether to warn)
- You can verify I did it by checking the output

I'd go further: **convert any "remember to X" instruction into a concrete step in a checklist or an automated scan.** Recall-dependent reminders are the weakest form of instruction; procedural steps are the strongest.

### 3. "Split uploads into phases, don't copy to downloads until after review" — **Very high value**

This helps in two ways:

**a) Reduces simultaneous context load.** If I'm reading 9 skills + Memory + changelog + Prompt + all project files at once, the competition for attention is enormous. Phasing means I only hold what's relevant to the current phase.

**b) Creates natural checkpoints.** A "patch review" step where I re-read relevant skills *just before* finalizing is far more effective than hoping I recall a skill I read 10 turns ago. This is essentially implementing a just-in-time retrieval pattern.

**Suggested phase structure:**
1. **Onboarding phase:** Read Tier 1 skills, Memory, changelog, Prompt. Understand the task.
2. **Work phase:** Read relevant project files, make changes. Read Tier 2 skills only as needed.
3. **Review phase:** Re-read `code-quality-SKILL` and any other review-relevant skills. Run scans/checklists. *Then* copy to downloads.

This means the skills most likely to be missed (review/checklist skills) are read *closest to when they're needed*.

## Additional Strategies

### 4. **Explicit per-turn skill activation checklist**

Have me briefly state which skills I'm actively checking this turn before taking action. Something like:

> "Before proceeding: Checking project-workflow-SKILL (step X), code-quality-SKILL (scan). Not relevant this turn: [list]."

This is lightweight, creates a verifiable paper trail, and—critically—*forces me to sweep through the skill list* rather than hoping the right one activates automatically.

### 5. **Merge or eliminate skills where possible**

9 skills is a lot. If any two skills have overlapping scope (e.g., two skills both touch on testing), consider merging them. Every reduction in count increases the per-skill activation probability for the remaining ones. Ask: "Is this a separate skill, or could it be a section of an existing skill?"

### 6. **Make trigger conditions specific and unique**

Vague triggers like "when applicable" or "before submitting" are easy to miss. Specific triggers like "before writing any code to a file in `app/`" or "after any change to a test file" are much easier to match. Each trigger condition should map to *exactly one* skill to avoid ambiguity.

### 7. **Use the worklog as skill-check memory**

Already doing this to some degree, but you could formalize it: have me log which skills I checked and what I found. On subsequent turns, I can read the worklog entry instead of re-deriving from scratch. This converts recall from "remember the skill" to "remember to read the worklog," which is a much more reliable trigger.

### 8. **Priority-tier the skills explicitly**

Not all 9 skills are equally important. If you explicitly rank them as "must-check every turn" vs. "check when triggered" vs. "check if time permits," I can allocate attention accordingly rather than treating all 9 as equally critical (which effectively makes none of them critical).

---

## TL;DR Ranking of Your Proposals + Mine

| Strategy | Impact | Effort |
|---|---|---|
| Tier 1/2 skill reading (your #1) | 🔴 Very High | Medium |
| Phase-split workflow (your #3) | 🔴 Very High | Medium |
| Procedural scans vs. warnings (your #2) | 🟡 High | Low |
| Per-turn activation checklist (#4) | 🟡 High | Low |
| Merge/eliminate skills (#5) | 🟡 High | Medium |
| Specific trigger conditions (#6) | 🟡 High | Low |
| Worklog as skill memory (#7) | 🟠 Medium | Low |
| Priority tiering (#8) | 🟠 Medium | Low |

The two highest-impact changes are the **Tier 1/2 reading strategy** and the **phase-split workflow**—together they solve both the "too much at once" problem and the "too far from when needed" problem. The rest are incremental improvements on top of that foundation.

Want me to actually extract the zip and do the onboarding now, applying these principles? Or do you want to refine the workflow changes first?

---
I've started working on some skills you use for another project following a discussion in linebyline/skills/chat/skills-0.37.1.md. See Comparison.md for a rough outline-it contains many unresolved concerns and gaps I opted not to fill yet until I clear things up.

---
I'll start by reading the Comparison.md file and exploring the uploaded files to understand your work and the unresolved concerns you've mentioned.
Let me extract all the zip files to understand their contents in detail.
Now let me read all the key files to understand the full picture. I'll read them in parallel.
Let me read the remaining skill files from both old and new approaches.
Now let me check for any differences between the old (linebyline.zip) and new (phased zips) versions of the same skills.
Let me check the remaining context files.
I've now read everything thoroughly. Let me organize my analysis of your work and address each unresolved concern from Comparison.md.

---

## Summary of What You've Built

You've taken the LineByLine project's 9 skills and reorganized them from a **monolithic single-upload** approach into a **4-phase JIT (just-in-time) workflow**:

| Phase | Zip | Contents | When |
|---|---|---|---|
| 1. Onboard | `1_onboard.zip` | project-workflow-SKILL, README | Turn 1 |
| 2. Work | `2_work.zip` | 3 domain skills, Memory.md, Prompt.md | Turn 2 |
| 3. Pre-push | `3_pre-push.zip` | code-quality, aria, playwright skills + full tests/ | Turn 3 |
| 4. Post-push | `4_post_push_issues.zip` | skill-SKILL, sonarqube-workflow-SKILL | Turn 4 (conditional) |

The **only material diff** between old and new skill files is in `code-quality-SKILL.md` line 217 — the old version says "warn the user of tests that require snapshot or screenshot regen" and the new version removes that clause, converting it from a recall-dependent reminder into something you'd discover yourself via the pre-push audit.

This is solid work. The phased approach directly addresses the core problem identified in `skills-0.37.1.md`: **attention dilution from loading all 9 skills at once**, where skills read on turn 1 are cold by the time they're needed on turns 5–15.

---

## Addressing Each Unresolved Concern

### 1. "worklog.md without prompting"

You noted I sometimes create `worklog.md` unprompted. This is a behavior from my system prompt — I have a worklog specification at `/home/z/my-project/worklog.md`. The inconsistency you're seeing is because I create it when my task management system activates (multi-step tasks), but skip it for simpler interactions.

**My recommendation: Don't rely on it as a workflow mechanism for LineByLine sessions.** Here's why:

- Your project already has `linebyline-0.37.1.md` (companion file) serving as a per-version session log with structured turn-by-turn documentation.
- The worklog concept serves a different purpose — it's for subagent coordination in my system, not for project history.
- Instead, keep the companion `.md` file as your authoritative session record and the "Download copy" step in project-workflow-SKILL as your deliverable pipeline.

If you *do* want a cross-session worklog for LineByLine specifically, add a single line to the Onboard phase: "Create or append to `linebyline-worklog.md` in downloads with a dated entry for this session." That's explicit and reliable.

### 2. "Uploading all skills this turn and telling the AI to only read descriptions — does it still bloat context?"

**Yes, it does.** Even if I only "read the description" of a skill, the file is still in my upload context. I can't selectively forget a file that's been uploaded. The tokenizer has already processed it.

Your JIT-read-all-in-zip strategy is the right fix for this. By not uploading `3_pre-push.zip` and `4_post_push_issues.zip` until they're needed, you keep them entirely out of context during the work phase. This is strictly better than uploading everything on Turn 1 and telling me to only read summaries.

The concern about tiers is still valid **within** a phase though. For example, in `2_work.zip` you bundle 3 domain skills. If only one is relevant to the current Prompt.md, the other two are still context-weight I'm carrying. Options:

- **Accept the overhead**: 3 skills in the work phase (~1500 lines total) is far less than the old 9 (~3000+ lines). The marginal cost of 2 irrelevant skills in the work phase is small.
- **Further sub-split**: Only upload the specific domain skill relevant to the current task. But this creates more coordination burden for you and more turns consumed on uploads.
- **Compromise**: Keep the 3 work skills bundled but add a one-line directive: "Read only the skill(s) relevant to Prompt.md; skim descriptions of the rest." This doesn't reduce token count, but it does focus attention on the right content.

I'd recommend **accepting the overhead** for the work phase — 3 skills is manageable. The big win was eliminating the other 6 from turns 1–2.

### 3. "The multi-phase approach fragments the folder structure — does a single project-workflow-SKILL still make sense?"

**Yes, but it needs restructuring.** The current `project-workflow-SKILL.md` describes a single-folder layout (`linebyline/`) where everything coexists. Your phased approach breaks that assumption — the folder structure changes between phases, and the skill describes paths that may not exist yet.

Two options:

**Option A: One workflow skill with phase sections.** Restructure the skill into clearly delineated phases:

```md
## Phase 1: Onboard (1_onboard.zip)
Extract to project root. Read project-workflow-SKILL, README, Memory.md.
[onboarding steps]

## Phase 2: Work (2_work.zip)
Extract into same project root. Now you have skills/ and Memory.md.
[work steps]

## Phase 3: Pre-push audit (3_pre-push.zip)
Extract into same project root. Now you have tests/ and audit skills.
[audit steps]
```

This works because the skill becomes the *roadmap across phases*, not just a description of a static folder layout. Each phase section only references files that exist at that point.

**Option B: Split into per-phase workflow files.** `onboard-WORKFLOW.md`, `work-WORKFLOW.md`, `audit-WORKFLOW.md`, etc. Each is self-contained for its phase.

**I'd recommend Option A.** A single file is easier to maintain and gives a holistic view. The key change is making the folder layout section *dynamic* — show what exists after each phase's extraction, not a single monolithic tree.

### 4. "Prompt.md is already a strain — adding /tests and proactive checks might accelerate degradation"

This is a real risk. The `3_pre-push.zip` tests directory is substantial (15+ spec files, media, prompts). Here's how to mitigate:

**Don't upload the full tests/ directory.** Instead, include only:
- `tests/helpers/index.js` (infrastructure the AI needs to understand)
- `tests/MANUAL.md` (manual test coverage)
- The 3 pre-push skill files (code-quality, aria, playwright)

For the actual spec files, tell me to *find and read only the relevant test files* when auditing. The playwright-testing skill already tells me which test files correspond to which types of changes. I can grep for the relevant spec files on demand rather than absorbing all 15 at once.

**For proactive checks**, the pre-delivery checklist in code-quality-SKILL is already well-scoped (8 items). The key is making it *procedural* rather than *recall-dependent*. Your current phrasing works: "Before delivering any patch, verify: [checklist]." The AI reads this in the pre-push phase, immediately before it needs it. That's the optimal placement.

### 5. "If I scaled down to a single bug fix, could work and pre-push be integrated?"

**Yes, absolutely.** For small-scope sessions (1–2 bug fixes, no architectural changes), you could:

1. Upload `1_onboard.zip` + `2_work.zip` together on Turn 1 (they're small combined — ~30KB)
2. Skip the pre-push phase entirely for pure bug fixes that don't change architecture
3. Only upload `3_pre-push.zip` if the bug fix touches code quality, a11y, or test-related code

The project-workflow-SKILL already says "Don't update a skill for a pure bug fix that doesn't change the documented architecture." The same logic applies to the pre-push audit: if the change is a targeted fix with no architectural impact, the full audit is overkill.

**Suggested phrasing in the workflow skill:**
> "If the session scope is a single bug fix with no architectural impact, combine onboarding and work into one turn and skip the pre-push audit."

### 6. "Can the AI selectively re-read parts of a file it has forgotten?"

**No, not in the way you're hoping.** I can't detect which parts of my context I've "forgotten" and selectively re-read them. Context attention is not a conscious process I can introspect on.

However, **re-reading the entire file is still valuable** because of the **recency effect** — information at the end of context is recalled more reliably than information in the middle. If you tell me "Re-read project-workflow-SKILL.md" at the start of the pre-push phase, that content is now at the *end* of my context (most recent), which is exactly where attention is strongest.

Your draft of "Re-read project-workflow-SKILL.md" at the start of each phase is the right instinct. Don't worry about redundancy — a duplicate instruction at the end of context is *more* likely to be followed, not less.

**What about dismissing duplicate information?** I can't do this automatically either. But in practice, duplicate restatement of key rules is *beneficial* for LLMs. It's like the pattern of putting important instructions at both the start and end of a prompt — the duplication increases activation weight. Your instinct to avoid verbatim repetition every turn is correct for *boilerplate* (don't re-paste the entire skill text), but *restating the specific rule that applies to this turn's task* is actually good practice.

### 7. "Past-tense wording for post-work audit phase"

You're right that if the pre-push audit is a separate turn, the phrasing needs adjustment. Currently you have:

> "Reference worklog.md for code you changed this session. Audit those changes for issues..."

This is already forward-looking even though it references past work. It's fine as-is. But if you want to be more precise:

> "Review the code changes made earlier this session (documented in the companion .md). Audit those changes for issues..."

This avoids the ambiguity of "worklog.md" (which as discussed above, I'd recommend not using for this purpose) and instead points to the companion `.md` file that already records what changed each turn.

---

## Overall Assessment

The phased JIT approach is a **significant improvement** over the monolithic upload. It directly addresses the two highest-impact problems identified in the `skills-0.37.1.md` discussion:

1. **Too much at once** → Skills arrive only when relevant
2. **Too far from when needed** → Audit skills arrive immediately before the audit phase

The one structural change I'd recommend making before finalizing:

**Restructure `project-workflow-SKILL.md` to describe the phased workflow explicitly.** Currently it describes a static folder layout that doesn't match the phased reality. Add phase-specific sections that say what exists after each extraction and what to do with it. This makes the skill a roadmap rather than a static map.

Want me to draft a revised `project-workflow-SKILL.md` that incorporates these recommendations? Or would you prefer to discuss any of these points further first?

---
Yes, but first consider these points in case anything changes your plan:


>keep the companion `.md` file as your authoritative session record

Like this? I don't want to maintain a version number manually in many different places and risk make a typo somewhere (compared to if I just clicked the current version file and used F2 → Ctrl + C to copy it verbatim)
- Note in first chat about current version like "The latest app is linebyline-0.37.1.html" since I wouldn't upload the app in the first turn anymore with the new staged system
- `- Create worklog.md in downloads if it's not already there` → `- Create linebyline-newversion.md in downloads if it's not already there`
- `  - Document all your work in worklog.md in downloads` → `  - Document all your work in linebyline-newversion.md in downloads`
- `  - Document all your fixes in worklog.md in downloads` → `  - Document all your fixes in linebyline-newversion.md in downloads`


>Option A: One workflow skill with phase sections.

Yes, I prefer this.


>For the actual spec files, tell me to *find and read only the relevant test files* when auditing. The playwright-testing skill already tells me which test files correspond to which types of changes. I can grep for the relevant spec files on demand rather than absorbing all 15 at once.

How would you grep test files I haven't uploaded yet? Would I need to upload something like a test-index.md file in their place like a menu you could use to "order" specific test files on demand? Would the cost of the extra back-and-forth request turn + upload turn likely be worth the savings of not uploading all the test files?


>If I scaled down to a single bug fix, could work and pre-push be integrated?

On second thought, I wonder if it would waste more computing resources overall (i.e. account-wide) to reupload all the files collectively for a single bug fix in another sandbox when I have quite a few bugs overall to clear. Also with the (up to 3) sandboxes not talking to each other, there's greater risk of conflicting fixes as none would have "the big picture".


>You're right that if the pre-push audit is a separate turn, the phrasing needs adjustment.

Yes, do that.

---
Good points — let me address each before drafting, since a couple of them do change the plan.

---

### 1. Companion `.md` naming — avoiding version number repetition

Your instinct is right. You shouldn't have to type the version number in multiple places. Here's how to handle it cleanly:

- **In your first chat message**, state the current version once: `"Current version: 0.37.1"`
- The AI reads this, knows the baseline, and applies semver rules when work begins to determine the target version
- The AI creates and references `linebyline-X.X.X.md` using the version *it* determines

So the skill's instructions should say something like:

> "The user states the current version in the first chat message. When code changes require a version bump, apply semver to determine the new version. Create the companion file as `linebyline-{newversion}.md` and document all work there."

This means your chat instructions in Comparison.md become version-agnostic:

```
- Create the companion .md file in downloads if it's not already there
- Document all your work in the companion .md file in downloads
```

No version number to type, no typo risk. The AI resolves it from the stated baseline + semver.

---

### 2. Test files — the grep problem and the cost question

You caught a real flaw in my suggestion. I can't grep files that haven't been uploaded. A test-index.md would technically work but I'd recommend against it because:

- **The back-and-forth cost is almost certainly not worth it.** Each request/upload cycle costs a full turn of your attention — the scarcest resource. Saving ~10-15KB of spec file context doesn't justify that.
- **The spec files themselves are small.** 15 spec files at ~50-200 lines each is roughly 3000 lines (~12k tokens). That's modest — roughly the same as one large skill file.

**The real culprit is the 757KB zip size.** That's almost entirely `media/` (audio.mp3, naughty-strings.json, 10k_lines.lrc) and `prompts/` (historical chat logs). Neither of those is needed for a pre-push audit. The AI needs spec files to *check for conflicts*, not to *run* them.

**Revised recommendation:** Strip `media/` and `prompts/` out of `3_pre-push.zip`. Keep only:

```
3_pre-push/
├── code-quality-SKILL.md
├── aria-accessibility-SKILL.md
├── playwright-testing-SKILL.md
├── tests/
│   ├── MANUAL.md
│   ├── helpers/
│   │   └── index.js
│   └── *.spec.js
```

This should shrink the zip from ~757KB to maybe 30-50KB. The media files only need uploading if the AI is *writing new tests* — a separate, less common activity that you'd handle on demand.

---

### 3. Single bug fix vs. batching — you've convinced me the other way

Your two points are decisive:

- **Resource waste**: Re-uploading onboarding + work files across multiple sandboxes is pure overhead multiplied by the number of sessions
- **Conflict risk**: Separate sandboxes have no shared state. If Sandbox A fixes a bug in `syncLine()` and Sandbox B fixes a different bug in the same function, they'll produce incompatible patches

The phased approach already solves the context problem *within* a single session. There's no need to also split across sessions. I'll drop the "skip phases for small sessions" recommendation entirely.

---

### 4. Past-tense wording — confirmed, will implement

The pre-push audit phase talks about code that was already written. I'll phrase it retroactively.

---

### Net changes to the plan

| Original plan | Revised plan |
|---|---|
| worklog.md references | Companion `.md` file, version derived from stated baseline + semver |
| One workflow skill with phase sections | Same — confirmed |
| Don't upload test spec files; grep on demand | **Keep spec files in 3_pre-push.zip**, but strip `media/` and `prompts/` |
| Optional phase-skipping for small sessions | **Dropped** — always use all phases, batch work in one session |
| Keep present-tense for pre-push phase | Past-tense wording |

Now I'll draft the revised skill. One more question though: the current `project-workflow-SKILL.md` includes the **pre-patch checklist**, **post-patch verification**, **post-patch updates**, **versioning**, **companion .md**, and **download copy** sections. These are all currently written for a non-phased workflow. Should I:

- **(A)** Keep those sections mostly as-is and add phase wrappers around them (i.e., "during the work phase, follow the pre-patch checklist and post-patch verification"), or
- **(B)** Fully restructure so each phase section is self-contained with its own subset of those rules?

I'd recommend **A** — the checklist and verification rules don't change by phase, they're just *invoked* at different phases. A phase wrapper + cross-reference is cleaner than duplicating rules per phase. But let me know if you'd prefer B.

---
Go with Option A

---
Let me re-read the current skill one more time to make sure I don't miss anything, then draft the revised version.
Now let me also draft the revised Comparison.md with updated chat instructions that align with the new skill:
Drafted and saved. Here's what changed and why:

### project-workflow-SKILL.md — key changes

| Section | What changed | Why |
|---|---|---|
| Opening paragraph | "phased upload workflow" replaces "fixed directory layout uploaded as a zip" | Reflects the new reality |
| **Uploaded zip layout** | **Removed entirely** | Replaced by the per-phase file lists in Session phases |
| **Session phases** (new) | 4 phases with explicit file lists and step-by-step instructions | The core structural change — skills arrive JIT |
| Pre-patch checklist | Unchanged | Still applies during Phase 2 |
| Post-patch verification | Unchanged | Still applies during Phase 2 |
| Post-patch updates | Unchanged | Still applies during Phase 2 |
| **Versioning** | User states version once in first chat; AI derives from baseline + semver | Eliminates manual version typing, avoids typos |
| **Companion .md file** | "Derive the version from the stated baseline and semver rules — don't ask the user to type it separately" | Same rationale |
| Download copy | Unchanged | Still applies at end of each work/audit turn |
| Cross-references | Removed "Replaces the former Index.md and Project.md" from description | Those redirects are no longer in any zip |

### Comparison.md — key changes

| Old | New | Why |
|---|---|---|
| Unresolved annotations | **Removed** | All resolved in this session |
| `Create worklog.md in downloads` | **Removed** — skill now tells AI to create the companion .md automatically | worklog.md is not the right mechanism; companion .md is |
| `Document all your work in worklog.md` | **Removed** — skill's Phase 2 instructions cover this | Redundant with the skill |
| `Document all your fixes in worklog.md` | **Removed** — skill's Phase 3/4 instructions cover this | Same |
| No version stated | `"Current version: 0.37.1"` on Turn 1 | Version stated once, AI derives everything else |
| Present-tense audit wording | Past-tense: "Review the code changes you **made** earlier this session" | Audit is retroactive |
| `3_pre-push.zip` chat | Simplified — skill contains the full audit procedure | Chat instructions are brief; skill is authoritative |

### What's intentionally left out

- **No `media/` or `prompts/` in 3_pre-push.zip** — the skill notes this in the Phase 3 file list. Those directories only need uploading if the AI is writing new Playwright tests.
- **No phase-skipping for small sessions** — per our discussion, batching work in one session avoids re-upload overhead and conflict risk.
- **No re-reading instructions per turn in chat** — the skill already instructs "Re-read project-workflow-SKILL.md" at the start of Phases 2 and 3. No need to duplicate in chat.

Take a look and let me know if anything needs adjusting. Once the skill is finalized, you can drop it into `1_onboard.zip` and test it in a fresh session.

---
Both branches of Turn 4 stop prompting to re-read project-workflow-SKILL.md. Is it possible that you might forget certain deliverables it lists as a result (i.e. keeping the companion .md updated with your Turn 4 changes, not just Memory.md)?

---
Good catch — that's exactly the kind of recall gap the phased approach is supposed to prevent. By Turn 4, the last re-read of the skill was Turn 3, and deliverable obligations like companion .md updates and download copy are easy to lose.

The fix belongs in the skill itself, not just the chat instructions — the skill is the authoritative source. Let me update both Phase 4 branches:
Good, but the clean branch is missing the companion .md documentation step — it jumps straight from re-reading the skill to reading skill-SKILL.md. Even when there are no SonarQube fixes, there may still be skill updates or Memory.md changes that should be recorded. Let me add that:
Now let me also update the Comparison.md chat instructions to match:
Done. Here's the pattern across all phases now:

| Phase | Re-read project-workflow-SKILL? | Source |
|---|---|---|
| Phase 1 — Onboard | Read for the first time (step 1) | Skill |
| Phase 2 — Work | Re-read (step 2) | Skill + chat |
| Phase 3 — Pre-push | Re-read (step 1) | Skill + chat |
| Phase 4 — Issues | Re-read (step 1) | Skill + chat |
| Phase 4 — Clean | Re-read (step 1) | Skill + chat |

The reasoning is consistent: **every phase that involves deliverable obligations starts by re-reading the workflow skill**. This places the rules for companion .md, download copy, versioning, and post-patch updates at the most recent position in context — exactly when they need to be followed.

The clean branch also now has an explicit step 4 ("Document any skill or Memory.md updates in the companion .md file") because even with no SonarQube fixes, skill and Memory.md changes still need to be recorded.

---
There seems to be some redundancy between the skill and the chat. The skill describes the same steps in chat and in greater detail. Could chat be simplified further like:

Turn 1 (typing out 0.37.1 or removing the parts before and after take a bit more manual work-I wonder if you could recognize the number part as the version)
```
The current app is linebyline-0.37.1.html. Read 1_onboard.zip contents.
```

Turn 2
```
Re-read project-workflow-SKILL.md, then start "Phase 2 — Work".
```

Turn 3
```
Re-read project-workflow-SKILL.md, then start "Phase 3 — Pre-push audit".
```

Turn 4
```
Re-read project-workflow-SKILL.md, then start "Phase 4 — Post-push (conditional)".
```

---
Yes, this is much cleaner. The skill is the authority; chat just activates the right phase. Two things to adjust:

**Version from filename** — yes, I can extract `0.37.1` from `linebyline-0.37.1.html`. I'll update the skill to accept either format.

**Re-read in chat vs. skill** — the re-read is already step 1 of each phase in the skill, so having it in chat too is redundant. But it's also near-zero cost and serves as a second trigger. I'll leave that call to you — the skill guarantees it regardless.

Let me update both files:
Now update Comparison.md with the simplified chat:
Done. Here's what changed and the one design note:

### Changes

**Skill** — Phase 1 step 2 and Versioning section now accept the version as either a bare semver or a filename. The AI extracts `0.37.1` from `linebyline-0.37.1.html` without you having to type the number separately.

**Comparison.md** — Chat instructions are now just:
1. A version reference + read command (Turn 1)
2. `"Re-read project-workflow-SKILL.md, then start 'Phase N'"` (Turns 2–4)

All substantive steps live in the skill. The chat is a thin activation layer.

### The re-read in chat vs. skill question

The re-read appears in **both** places now:

- **Chat**: "Re-read project-workflow-SKILL.md, then start Phase X"
- **Skill** Phase X step 1: "Re-read project-workflow-SKILL.md"

This is technically redundant — if the AI follows the skill, step 1 already handles it. But the cost is one line of chat, and the benefit is a second trigger that ensures the re-read actually happens before the AI starts interpreting phase instructions. If you want maximum brevity, you could drop it from chat and just write:

```
Start "Phase 2 — Work".
```

The skill's step 1 would still guarantee the re-read. Your call — I kept it in the draft since you included it in your proposal.

---
A few more points:
1. Could repeating the instruction to "Re-read project-workflow-SKILL.md" lead you to read it twice in one phase, or is the skill wording in all four phases enough to prevent that?
2. Sometimes I may start a new non-build discussion like this session. What do you think would likely result from replacing the app-build-oriented chats with whatever I'm discussing and:
	1. Leaving out project-workflow-SKILL.md to make sure it doesn't somehow hijack the session
	2. Vs leaving project-workflow-SKILL.md in to give you a fuller understanding of the core build loop

---
### 1. Would the AI read the skill twice?

No — or more precisely, it might scan it a second time, but it wouldn't *process* it twice as a full re-read. Here's what would actually happen:

- Chat says "Re-read project-workflow-SKILL.md, then start Phase 2"
- AI reads the skill (placing it at the end of context)
- AI starts Phase 2, sees step 2: "Re-read project-workflow-SKILL.md"
- AI recognizes it just did that and skips it

This isn't harmful, just slightly wasteful. But there's a more elegant fix: **drop the re-read from chat entirely.** The skill's phase steps already include it. The chat instruction just needs to activate the phase:

```
Start "Phase 2 — Work".
```

When the AI reads that instruction, it looks up Phase 2 in the skill (already in context from Turn 1) and follows its steps — step 2 being the re-read. The re-read happens exactly once, triggered by the skill, at the right moment.

The only risk: if enough turns pass between phases that the AI's attention on the earlier skill content degrades significantly, it might not recall that Phase 2 starts with a re-read. But that's unlikely within the span of 2–4 turns, and the phase name in the chat instruction ("Phase 2 — Work") serves as a strong retrieval cue for the skill content.

**My recommendation:** Drop "Re-read project-workflow-SKILL.md" from all chat instructions except Turn 1. Let the skill own the re-read discipline. The chat just names the phase.

### 2. Non-build sessions: include or exclude the skill?

**Include it.** Here's why:

The skill has two kinds of content:

| Type | Examples | Useful in non-build session? |
|---|---|---|
| Descriptive | Phase structure, what each skill covers, versioning conventions, companion .md format | Yes — essential for informed discussion |
| Procedural | Pre-patch checklist, post-patch verification, download copy, "document all your work" | No — irrelevant without active coding |

The procedural rules only activate when the AI is actively patching code. In a discussion like this one, the AI doesn't start running the pre-patch checklist just because it read the skill — there's no code change to check. The trigger for procedural behavior is the phase start command, not the skill's presence.

In this very session, having the skill available was what let me give you informed feedback on phase structure, versioning, companion .md naming, and download copy obligations. Without it, I'd have been working from a fuzzier understanding.

The one real risk: if you mention something that *sounds* like a build action ("I should update Memory.md after this change"), the AI might start following the full post-patch workflow. But that's easily handled with a one-line chat instruction on non-build sessions:

```
The current app is linebyline-0.37.1.html. Read 1_onboard.zip contents. Not a build session — for context only.
```

That "for context only" is sufficient to suppress procedural activation while keeping the descriptive knowledge available. No need to strip the skill from the zip.

**One caveat:** if the non-build discussion is completely unrelated to the project (e.g., you're using the same chat to ask about an entirely different codebase), the skill is noise. But that's a different scenario — you'd probably start a fresh session anyway.

---

Want me to update both files with the simplified chat (dropping re-reads from Turns 2–4)?

---
No, and to clarify-the AI would technically still be you (GLM-5.1), but in a fresh chat

---
Right — that changes the analysis significantly. A fresh GLM-5.1 in a new chat has none of our conversation context. It only has the uploaded files and the chat message. So the question becomes: what does a cold model do when it reads a skill that says "Use this skill at the start of every session" and the chat message is about something non-build?

Let me reconsider both options for a fresh model:

### Option 2i: Leave out project-workflow-SKILL.md

The fresh model has only README.md and whatever you type in chat. It can discuss what you bring up, but it has no knowledge of the phased workflow, the skill inventory, versioning conventions, companion .md format, or how the build loop works. Any discussion about the project's workflow would require you to explain all of that context manually, or the discussion would be shallower.

### Option 2ii: Leave project-workflow-SKILL.md in as-is

The fresh model reads the skill and sees "Use this skill at the start of every session" in the description. Even if your chat message is purely discursive, the skill's own activation language is aggressive enough that the model will likely start following Phase 1 steps — creating a companion .md, noting the version, etc. — because the skill told it to. The "for context only" annotation I suggested earlier is fighting against the skill's own instructions, which is fragile. A fresh model might obey the skill over the chat qualifier.

### The real fix: adjust the skill's description

The problem isn't whether to include the skill — it's the activation trigger. Currently the description says:

> "Use this skill at the start of every session and whenever you receive a phase zip..."

The phrase "at the start of every session" is too broad. It causes activation even when the session isn't a build session. Changing it to scope the activation to build sessions would solve both options:

> "Use this skill at the start of every **build** session and whenever you receive a phase zip..."

With this change:

- **Build sessions**: The phase-start chat instruction triggers the skill. Model follows all procedural steps. ✓
- **Non-build sessions with the skill included**: The model reads it as reference material — it understands the workflow, phases, versioning, skill inventory — but doesn't activate the procedural steps because the activation condition ("build session") isn't met. ✓
- **Non-build sessions with a "start Phase 2" chat command**: The "whenever you receive a phase zip" clause still triggers activation. ✓

This means you can safely include the skill in `1_onboard.zip` for all sessions without needing a "for context only" hack. The skill self-gates based on whether the session involves actual build work.

Want me to make that description change and then finalize both files?

---
I modified the skill description area to "...LineByLine app. Use this skill at the start of every app build session..." to preclude building test files or helper scripts and hopefully future-proof against an architectural change like a single-file → modular refactor (which I imagine would still be understood by you in a fresh chat as parts of the whole app). If you changed any other skills, copy those to downloads too.

---
Good. Now let me check the other skill files for any references to project-workflow-SKILL that might need alignment — particularly the `skill-SKILL.md` which references "Project.md":
Three references to fix in `skill-SKILL.md`. `Project.md` no longer exists in any of the new zips — it was a redirect file that pointed to project-workflow-SKILL.md. These references need to point to project-workflow-SKILL.md instead.
Three `Project.md` references in skill-SKILL.md need updating. The old project had `Project.md` as a redirect file — it no longer exists in any of the new zips. These should reference `project-workflow-SKILL.md` instead:
Now let me check the other skills for any stale references:
The remaining `Project.md`/`Index.md` references are in the *old* project-workflow-SKILL.md files (the originals in `extracted/`), not in the revised one I'm writing. My revised version already removed the "Replaces the former Index.md and Project.md" line and the folder layout that listed them. The skill-SKILL.md in downloads has been fixed. Let me verify my revised project-workflow-SKILL.md is clean:
Clean. Now let me also copy the other skills that belong to phases that would be in the new zips — I need to check if any of those have stale references too:
All clean. Here's a summary of what's in downloads and what changed:

### Files in `/home/z/my-project/download/`

| File | Phase | Changes from original |
|---|---|---|
| `project-workflow-SKILL.md` | 1_onboard | **Major restructure** — phased workflow, version from filename, companion .md instead of worklog, no folder layout section |
| `Comparison.md` | Chat template | **Simplified** — phased chat instructions, no redundant worklog/workflow restatements |
| `skill-SKILL.md` | 4_post_push | 3 `Project.md` → `project-workflow-SKILL.md` references |
| `browser-hotkey-system-SKILL.md` | 2_work | No changes |
| `linebyline-section-index-SKILL.md` | 2_work | No changes |
| `single-file-html-app-SKILL.md` | 2_work | No changes |
| `code-quality-SKILL.md` | 3_pre-push | No changes (the snapshot regen warning was already removed in your new version) |
| `aria-accessibility-SKILL.md` | 3_pre-push | No changes |
| `playwright-testing-SKILL.md` | 3_pre-push | No changes |
| `sonarqube-workflow-SKILL.md` | 4_post_push | No changes |

The only skill that needed `Project.md` references fixed was `skill-SKILL.md` — all the others were clean.

---
