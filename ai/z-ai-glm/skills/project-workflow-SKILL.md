---
name: project-workflow
description: Session bootstrapping, file navigation, and patch delivery workflow for the LineByLine project. Use this skill at the start of every session and whenever you need to locate project files, follow the build/patch workflow, version the app, update companion files, or decide whether Memory.md or a skill needs updating after a change. Replaces the former Index.md and Project.md — those files now redirect here.
---

The project has a fixed directory layout uploaded as a zip, a single-file HTML app that must be patched with minimal diff, and a set of post-patch obligations (syntax check, re-index, Memory.md update, companion .md, download copy). Following this workflow each turn prevents regressions and keeps session artifacts in sync.

---

Uploaded zip layout

When the user uploads a `linebyline.zip`, extract it. The resulting folder contains:

```
linebyline/
├── skills/                 — Architecture and domain knowledge (SKILL.md files)
│   └── chat/              — Logs of skill creation/update sessions
├── Memory.md              — Condensed lessons and decisions (newest first)
├── Project.md             — Redirects here; formerly held build workflow rules
├── Index.md               — Redirects here; formerly held file locations
├── Prompt.md              — Current round of specific changes (if present)
├── app/
│   ├── linebyline-X.X.X.html  — Current app version (highest semver = latest)
│   ├── linebyline-X.X.X.md    — That version's AI chat transcript
│   ├── issues/             — SonarQube Cloud reports (may be absent)
│   └── playwright/         — Playwright test errors (may be absent)
└── tests/
    ├── helpers/
    │   └── index.js        — Local server starter + test-saving constants
    ├── prompts/            — Previous AI chats about Playwright (lowest = oldest)
    ├── media/              — Files for Playwright and manual tests
    ├── MANUAL.md           — Manual tests not yet automated
    └── *spec.js            — Playwright test files
```

If subfolders for more than one app version exist inside `app/`, the highest semver is the latest. If you need files from an older version referenced by Memory.md, ask the user — they may not be included.

---

Pre-patch checklist

Before writing any code change:

1. Stop and request clarification when: a request is unclear or overly complex, relevant files are missing, a request is technically infeasible, or a request violates best practices from a skill.
2. Read only the sections you need — use the `linebyline-section-index` skill to locate sections by grepping for `// ──` markers, then read just those ranges. This avoids loading the entire ~2600-line file (~50k tokens) when only a few sections are relevant.
3. Patch with minimal diff — change only what's needed and preserve surrounding code. Prefer targeted edits over full-section rewrites unless the section is being restructured. Don't generate your own icons; prioritize any the user uploads, then Lucide icons. Don't add code that links to external websites besides GitHub.

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
5. Reconcile Playwright tests with app code changes when feasible. Warn me of tests that require snapshot or screenshot regen due to app code change.
6. For new features are not covered by existing Playwright tests, make conservative changes when reasonable with a comment like `// Covers playback starting after seeking added in 0.36.2`. Favor expanding existing <20 LOC tests over creating new tests. Favor adding new tests to existing <200 LOC test files over creating new test files.

---

Versioning

Version the code file semantically based on keywords the user provides. Don't change version on your own initiative and don't substitute version dots with spaces, underscores, or any other character — this applies to filenames passed to all tools, not just `<title>`.

- Same: 0.34.9 → 0.34.9
- Patch: 0.34.9 → 0.34.10
- Minor: 0.34.9 → 0.35.0
- Major: 0.34.9 → 1.0.0

Start from whatever semver the current `linebyline-X.X.X.html` filename shows.

---

Companion .md file

For each code file version, create or update a companion `.md` file with the same base name (e.g. `linebyline-0.34.9.html` → `linebyline-0.34.9.md`). Include each turn leading up to and working on that code file version only.

Prepend or update frontmatter at the start:

```md
---
model: <model name>
summary: <1-2 sentence summary of the companion file's contents>
---
```

Append per turn (separate the user's text from yours with a `---` line): the turn number in a header, the user's prompts verbatim (including full contents of Prompt.md if uploaded), and all your non-file chat outputs that turn (including markdown tables and Mermaid diagrams). Use "about" to express approximation instead of "~".

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
