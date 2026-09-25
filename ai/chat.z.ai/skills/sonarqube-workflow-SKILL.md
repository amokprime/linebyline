---
name: sonarqube-workflow
description: Triage SonarCloud and CodeQL findings for the LineByLine project and guide remediation. Use this skill whenever the user uploads a `sie` Markdown report (or a legacy `sonar-export` zip), asks about SonarCloud/CodeQL findings, mentions rules like S3776/S2004/S7761/S6819/S7927 or `py/...` CodeQL rule keys, needs help deciding whether to fix or mark as Won't Fix, or wants to plan a remediation pass before writing any code. Also use when the sandbox API is the only path (the user's `sie` run failed, or a quick staleness cross-check is needed mid-triage).
---

SonarCloud and CodeQL scans run on every push via GitHub Actions. The user runs `sie` (the consolidated `sonar-issue-exporter` CLI) locally and uploads the Markdown report — it includes both SonarCloud issues and CodeQL code-scanning alerts in one file, plus the rule "Why"/"How to fix it" rationale when `SONAR_API_KEY` is set. The sandbox cannot authenticate with GitHub or SonarCloud, so it cannot fetch the Why/How rationale, CodeQL alerts, or push back to a build loop on its own. When `sie` is unavailable (script failed, partial fetch, or you need a quick staleness check on a specific issue key), fall back to the public SonarCloud JSON API — it covers issue enumeration but not the rest.

---

Step 0: Read the user-provided `sie` report (preferred first step)

The user runs `sie` locally and attaches the resulting Markdown file. The agent does not run `sie` (it can't — `sie` needs the user's `gh auth login` for CodeQL alerts and `SONAR_API_KEY` for the Why/How rationale). Your job is to parse the report and triage.

What to expect in the report:

- A project header: `# Issues — <project> (<scope>)`, with `Generated: <UTC>`, `Source: <input>`, `Total: N issue(s) across M source(s), K rule(s)  (SonarCloud: X, CodeQL: Y)`, and `Token: present | absent`. The token line tells you whether Why/How rationale was fetched — if `absent`, the Why/How subsections show a placeholder (e.g. `⚠ Set SONAR_TOKEN`) and you should ask the user to re-run with the token if you need rationale for an unfamiliar rule.
- One `## <Source> Issues` section per source. `SonarCloud Issues` and `CodeQL Alerts` are the two possible sources. When only one source has findings, the simpler single-source layout is used (no parent `## <Source>` heading).
- Per-source `### Summary` table: severity × count, type × count, and a "Top rules" bullet list with `ruleKey — N×` counts. Use this for the first-pass triage before reading individual findings.
- One `### Rule: <ruleKey> — <rule name>` subsection per rule, with `Severity: … · Type: … · N instance(s)`, a `#### Why` block (rule rationale), a `#### How to fix` block (fix guidance; absent on simple rules), and an `#### Instances` table.
- The Instances table columns are: `File | Line | Message | Key | Status`. `Key` is the stable identifier SonarCloud exposes (`AaBprfwD68fRE0gxBFj3` for SonarCloud issues, `codeql:N` for CodeQL alerts). `Status` is `OPEN`, `CONFIRMED`, `RESOLVED`, or `CLOSED`.
- Deep links: SonarCloud issues link to `https://sonarcloud.io/project/issues?open=<KEY>&id=<PROJECT>`. CodeQL alerts do not have a deep link in the report — they live in the GitHub Security tab.
- File names are repo-relative (e.g. `sie.py`, `src/composables/useAppState.ts`, `ai/chat.z.ai/scripts/delivery/deploy.sh`).

Things that may surprise a fresh session:

- CodeQL rule keys use a different namespace: `py/foo`, `js/bar`, `css/baz` — NOT the `python:S1234` / `Web:S5678` / `typescript:S8888` form SonarCloud uses. Same triage logic, different rule keys.
- CodeQL "How to fix" is often a copy of the "Why" content (SonarCloud's `api/rules/show` doesn't return separate fix guidance for CodeQL rules). Don't flag this as a parsing bug.
- The `Token: absent` line is fine for a public-project report — only the Why/How placeholders are gated. Issue enumeration + facets work without a token.
- A single-issue URL (`?open=<KEY>&id=<PROJECT>`) input produces a "Focal Issue" callout at the top of the file. `sie` auto-falls-back to fetching the whole project's OPEN issues if the focal-issue lookup returns 0 results (the auth-boundary case) — the focal issue is still included because it appears in the full-project fetch.
- A `-c` / `--clean` run drops the Why/How subsections silently (no placeholder). If the user mentions they ran `sie -c`, the Why/How blocks are intentionally absent — don't ask the user to re-run.
- The default output filename is `issues.md`, auto-incrementing to `issues1.md`, `issues2.md`, etc. The user may rename the file before uploading.
- A legacy `sonar-export` zip (per-issue JSON folders with `L1234.json` files plus shared `why.md`/`how.md` per rule) is the OLD format. `sie` replaced it. If the user uploads the old format, Step 2 of this skill still applies to the per-instance triage, but ask the user to re-run `sie` if possible — the Markdown report is the canonical input going forward.

What the report does NOT include:

- Source code snippets around each finding. For in-sandbox patching, the source must come from the Build Repomix bundle (`src/**`, `docs/index.html`). SonarCloud's `api/sources/show` is auth-gated even for public projects, so the sandbox cannot fetch snippets either.
- Issue resolution state in real time. The report's `Status` column is a snapshot at generation time. If the user fixed an issue after running `sie` but before uploading, the report still shows `OPEN`. Cross-check via the API (Step 1) if status matters for the triage call.

Triage directly from the report. Cross-check `Status` against the live API only when the report seems stale (e.g. the user mentions fixing an issue that still shows OPEN).

---

Step 1: Sandbox API enumeration (fallback when `sie` is unavailable)

Use the public SonarCloud JSON API when:
- The user's `sie` run failed or returned partial data (e.g. CodeQL alerts missing because `gh auth login` wasn't set up).
- You need to cross-check whether a specific issue is still OPEN (the report's `Status` is a snapshot, not live).
- The user asked about SonarCloud findings but did not attach a `sie` report, and wants a quick count before running `sie` themselves.

The project is public (`amokprime_linebyline`), so issue enumeration works unauthenticated. The sandbox uses Python `urllib` (not the web reader tool — the web reader's URL validator rejects some query strings and the SPA pages render nothing for a static reader).

Endpoints:

- Main-branch OPEN issues (long-standing findings on `main`):
  ```
  https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&issueStatuses=OPEN
  ```
- PR-scoped OPEN issues (new-code findings on the current staging→main PR — replace `N` with the open PR number):
  ```
  https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&pullRequest=N&issueStatuses=OPEN
  ```

Optional query params:

- `&facets=rules,severities,types` — first-pass triage: returns summary counts without fetching every issue. Useful for "how many of each rule are firing on this PR?" before reading individual issues.
- `&rules=Web:S6819` — narrow to one rule. Combine with the component/pr params.
- `&ps=500` — page size (default 50, max 500).
- `&p=2` — page number, if `total > ps`.
- `&issueStatuses=OPEN,CONFIRMED` — comma-separated multi-status works in raw form via Python urllib. (An older note about "no `%2C`" referred to the web reader tool's URL validator rejecting URL-encoded commas — irrelevant when using Python directly.)

What the API returns: each issue has `key`, `rule`, `severity`, `component`, `line`, `message`, `status`, `type`, `cleanCodeAttribute`, `cleanCodeAttributeCategory`, `impacts`, `creationDate`, `updateDate`. The `key` is the stable identifier; the `component` is the file path (e.g. `amokprime_linebyline:src/components/LeftPanel.vue`); the `rule` is the rule key (e.g. `Web:S6819`).

Auth boundary (verified Sep 2026): issue enumeration, facets, and rule filtering work unauthenticated. The following endpoints require auth and return HTTP 400 or empty results without it:

- `api/rules/show?key=<rule>` — rule "why"/"how" content. The sandbox cannot fetch this — ask the user to re-run `sie` with `SONAR_API_KEY` set if the Why/How matters for the triage call.
- `api/rules/list` — rule search. Same auth requirement.
- `api/sources/show` — source snippets. Auth-gated even for public projects. The Build Repomix is the only sandbox-side source of patch-target code.
- Single-issue lookup via `?issues=<KEY>` on `api/issues/search` — returns 0 results without auth. To check a specific issue's status, filter by `rules=<rule>` + `component=<component>` instead, or fetch all OPEN issues and grep the response for the key.

CodeQL alerts are NOT available via the sandbox API. The CodeQL code-scanning alerts endpoint (`/repos/{owner}/{repo}/code-scanning/alerts`) requires GitHub auth — only `sie` (with `gh auth login`) can fetch them locally.

Closed-issue gotcha: closed issues have `line: null` in the API response. When triaging a `sie` report or cross-checking the API, the `status` field is the source of truth: `OPEN`, `RESOLVED`, `CLOSED`. A closed issue in a fresh `sie` report is stale — the user may have re-run `sie` before pushing their fix; cross-check with the API.

Reference test script: `ai/chat.z.ai/scripts/test_sonar_api.py` — re-run it to verify API access still works after any sandbox change.

---

Step 2: Categorize by rule

Group findings before acting. Common rules in this project:

JavaScript / TypeScript rules (target `docs/index.html` or test files):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| S3776 | Cognitive Complexity | Helper extraction, early return, optional chaining | Low — but check if SQ counts per-function independently (it does in JS) |
| S2004 | Nesting depth >4 | Extract inner callbacks/arrow fns as named helpers | Low |
| S7761 | Prefer `.dataset` | Replace `getAttribute/setAttribute('data-*')` with `.dataset.x` | Low |
| S1940 | Use `Array.from` / spread | Replace `Array.prototype.slice.call(...)` etc. | Low |
| S6606 | Prefer `Number.isNaN` | Replace `isNaN()` with `Number.isNaN()` | Low |
| S6666 | Prefer `Object.hasOwn` | Replace `obj.hasOwnProperty(x)` | Low |
| S4138 | Prefer `for-of` | Only convert when index is unused | High — see caution below |
| S1321 | Prefer `replaceAll` | Only when replacing a fixed string, not a regex with quantifiers | Medium |
| S6443 | Use `String.raw` on regex | Almost always false positive for `/pattern/` literals | High |
| S4023 | Prefer `Math.min`/`Math.max` | Only true min/max patterns; not all ternaries | Medium |
| S3800 | Negate condition | Only when there is a meaningful `else` branch | Medium |
| S7744 | Useless `|| {}` after spread | Spreading `undefined` is a no-op (`{...undefined}` === `{}`); drop the fallback | Low |

GitHub Actions workflow rules (target `.github/workflows/*.yml`):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| `githubactions:S6505` | `npx`/`npm ci` supply-chain | Replace `npx <pkg>` with `./node_modules/.bin/<pkg>` (direct binary, no on-demand install); add `--ignore-scripts` to `npm ci` to prevent lifecycle scripts from running during install | Low — both fixes are mechanical and eliminate the attack surface without breaking functionality. The `npx` binary is already in `node_modules/.bin/` after `npm ci`, so the direct path works. `--ignore-scripts` is safe when the only postinstall that matters (e.g. Playwright browser download) is explicitly handled by a separate step. |
| `githubactions:S8543` | Pin exact package version | Collapses into the S6505 fix — `./node_modules/.bin/<pkg>` runs the version pinned in `package.json`, so no on-demand install can pull an unverified release. For action pins (`actions/checkout@v4`), pin to the commit SHA (`actions/checkout@11d5960a...`) | Low — SHA-pinning is best practice. Version-tag pins (`@v4`) are mutable and can be re-pointed by the action maintainer. |
| `githubactions:S7631` | Fork-code in workflow | Compare-API check that the head SHA is on `main` (or `behind`/`identical`) before merging | Low — Won't Fix when the workflow never checks out or executes the event SHA, only merges commits verified to be on main. Marked False Positive in the SonarCloud UI; a resolved security issue plus this marking flips the retroactively-computed quality gate green. |
| `githubactions:S7630` | Script injection via workflow inputs | Move `${{ inputs.* }}` interpolations in `run:` blocks into the step's `env:` block, then reference as `$VAR` (shell variable expansion, not GitHub expression syntax) | Low — mechanical fix. The `env:` assignment is still a GitHub expression, but the shell sees the value as a literal string (no re-evaluation). |
| `githubactions:S8264/S8233` | Permissions scope | Split workflow-level permissions to job level (build: `contents: read`; deploy: `pages: write` + `id-token: write`) | Low |

Shell rules (target `ai/chat.z.ai/scripts/*.sh`, `ai/zcode/transcript.sh`):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| `shelldre:S7682` | Explicit return | Add `return 0` / `return N` to shell functions | Low — but Won't Fix when the function's exit status is intentionally its last command's (e.g. `.base.sh`'s snippet caller, where masking a repomix failure would zip/copy missing output) |
| `shelldre:S7679` | Positional params → locals | `local foo="$1"` at function top | Low |
| `shelldre:S7688` | `[` → `[[` | Use bash `[[` for conditionals | Low |

Vue / web rules (target `src/components/*.vue`):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| `Web:S6819` | Use native element instead of ARIA role | Replace `<div role="button">` with `<button>`, `<div role="slider">` with `<input type="range">` where the native interaction model fits | Medium — Won't Fix when the element has a custom mouse/keyboard interaction model that can't be a native input (e.g. `#progress-wrap` seek bar with mousedown+drag+wheel) |
| `Web:S7927` | Accessible name contains visible label | `aria-label` must be a superset of visible text; for icon-only buttons, the `aria-label` is the accessible name (can't contain an emoji glyph — False Positive) | Medium |
| `Web:InputWithoutLabelCheck` | Input without label | Add `id` + `aria-label` (visible `<label for>` not needed on `display:none` inputs) | Low |

CodeQL rules (target `sie.py`, `docs/index.html`, `src/**`):

CodeQL rule keys use a `language/category` namespace, distinct from Sonar's `language:Snnnn`. Triage is the same as SonarCloud issues — assess each instance, fix or Accept per the rule's actual semantics. CodeQL alerts appear in the `## CodeQL Alerts` section of the `sie` report and only fire when `gh auth login` is set up locally.

---

Step 3: Assess each finding individually

Never apply a rule category wholesale. Assess each instance:

for-of conversion (S4138) — convert only when the loop index is not used for accumulation via index, output assignment keyed to index, indexed mutation of a parallel array, or any expression involving i other than arr`[i]`. When in doubt, skip and document as Won't Fix — a broken for-of conversion is worse than a SonarQube warning.

replaceAll (S1321) — convert only when the search value is a fixed string. Skip if the regex has quantifiers (+, *, ?, {n}), character classes, or anchors — replaceAll with a regex argument behaves the same as replace with /g, which SonarQube already accepted.

String.raw on regex literals (S6443) — almost always false positive. SonarQube flags regex literals like `/\d+/` as needing String.raw, but String.raw applies to template literals, not regex literals. Mark as Won't Fix: "False positive: rule does not apply to regex literal syntax."

Math.min/max ternaries (S4023) — not every `a > b ? a : b` is a min/max replacement. If the ternary involves side effects, string coercion, or a non-numeric comparison, skip it.

Negated condition (S3800) — only invert the condition if there is a meaningful else or else if branch. A lone `if (!x) return` with no else is fine as-is; inverting it adds an empty block and reduces clarity. Mark as Won't Fix: "No else branch; inversion would reduce clarity."

Useless `|| {}` after spread (S7744) — spreading `undefined` is a no-op (`{...undefined}` === `{}`), so `{ ...foo, ...(bar || {}) }` has dead `|| {}` fallback. Drop it: `{ ...foo, ...bar }`. The same applies to `(arr || [])` after a spread into an array literal — `[...foo, ...(arr || [])]` should be `[...foo, ...arr]`.

githubactions:S6505 (`npx` supply-chain) — always fix. Replace `npx <pkg>` with `./node_modules/.bin/<pkg>`. This is safe because `npm ci` (which runs before the `npx` call in CI) installs the package into `node_modules/.bin/`. The direct binary path eliminates the on-demand install path that `npx` would use if the package were missing. For `npm ci` findings, add `--ignore-scripts` — safe when the only postinstall that matters is handled by a separate explicit step (e.g. `playwright install --with-deps` handles browser download, so `npm ci --ignore-scripts` skipping `@playwright/test`'s postinstall is fine).

githubactions:S8543 (pin exact version) — always fix for `npx` calls (collapsed into the S6505 fix — direct binary uses package.json-pinned version). For GitHub Actions (`actions/checkout@v4`), pin to commit SHA. No false positives observed.

githubactions:S7631 (fork-code) — Won't Fix when the workflow only merges commits verified to be on `main`, never checks out or executes the event SHA. Marked False Positive in the SonarCloud UI; a resolved security issue plus this marking flips the retroactively-computed quality gate green.

githubactions:S7630 (script injection via workflow inputs) — fix by moving every `${{ inputs.* }}` interpolation in a `run:` block into the step's `env:` block, then referencing it as `$VAR` (shell variable expansion). Example: `run: ./bin/test ${{ inputs.filter }}` → `env: FILTER: ${{ inputs.filter }}` + `run: ./bin/test $FILTER`. The `env:` assignment still uses GitHub expression syntax, but the shell receives the value as a literal string (variable expansion, not expression re-evaluation), so shell metacharacters in the input can't inject commands. Applied to `playwright-snapshot-regen.yml` (Sep 24, 2026): 4 instances at L41 (`test_filter`), L54/L56/L57 (`target_branch`) all fixed via `env: TEST_FILTER:` / `env: TARGET_BRANCH:` + `$TEST_FILTER` / `$TARGET_BRANCH` in the shell. The `Filter: ${TEST_FILTER:-(all tests)}` in the commit message is also shell expansion (safe), not a GitHub expression.

shelldre:S7682 (explicit return) — Won't Fix for `.base.sh`'s snippet-caller functions where the exit status is intentionally the last command's (repomix); an explicit `return 0` would mask a repomix failure and zip/copy missing output. Fix elsewhere.

shelldre:S7688 (`[` → `[[`) — always fix. `[[` is bash's safer test: no word splitting, no pathname expansion on variables, supports `&&`/`||` inside, and is generally preferred for conditional tests. Mechanical: `if [ ! -f "$src" ]` → `if [[ ! -f "$src" ]]`.

Web:S6819 (ARIA role → native element) — fix when the native element's interaction model fully covers the use case (e.g. `div[role=button]` → `<button type=button>`). Won't Fix when the element has a custom mouse/keyboard interaction model that can't be a native input (e.g. `#progress-wrap` seek bar with mousedown+drag+wheel). Document the Won't Fix rationale and mark Accept in the SonarCloud UI.

Web:S7927 (accessible name contains visible label) — False Positive for icon-only buttons whose `aria-label` can't contain an emoji glyph (e.g. theme toggle button with Vue-interpolated emoji). The emoji siblings go unflagged only because their content is a static character. `aria-label` is the correct accessible name for icon-only buttons (WCAG / aria-accessibility skill Rule 8).

Web:InputWithoutLabelCheck — add `id` + `aria-label`. `aria-label` satisfies the rule; no visible `<label for>` is needed on a `display:none` input (mirrors the App-level `#file-picker` pattern that passes the analyzer).

`python:S2083` (path traversal in CLI scripts) — when a CLI script reads a file path from `sys.argv` and passes it to `open()` / `Path.read_text()` / `Path.write_text()`, SonarCloud's taint analyzer requires the path validation + the I/O call to be in the SAME function body. Taint analysis does NOT cross function boundaries, and module-level constants (e.g. `_BASE_DIR = os.path.realpath(...)`) are NOT recognized as trusted sources — the derivation must be inline in the I/O function. What works: inline `base_dir = os.path.realpath(os.getcwd())` in the I/O function, then `resolved = os.path.realpath(path_str)`, then `if resolved != base_dir and not resolved.startswith(base_dir + os.sep): raise ValueError(...)`, then `with open(resolved) as f: ...`. The base_dir derivation, the guard, and the I/O are all in the same function body, and `open()` receives the validated `resolved` path (not the original user input). What does NOT work: (1) a `safe_path()` helper called from `main()` — taint analysis can't trace the validation across the boundary; (2) `os.path.realpath` + `startswith(_BASE_DIR + os.sep)` using a module-level constant — SonarCloud doesn't recognize the module-level variable as trusted.

---

Step 4: Plan the remediation pass

Group accepted fixes by section (use the linebyline-section-index skill to find sections, or grep `src/` for the component path). Plan one category of change per turn to reduce regression risk. Typical order:

1. Simple substitutions first (`.dataset`, `Number.isNaN`, `Object.hasOwn`, `replaceAll`, `|| {}` after spread)
2. for-of conversions (selective)
3. Helper extraction for nesting depth (S2004)
4. Cognitive complexity reduction (S3776) — most invasive, do last
5. Workflow-file rules (S6505, S8543, S7631) — independent of app code, can be done in any order
6. Shell-script rules (S7682, S7679, S7688) — independent of app code
7. Vue/web rules (S6819, S7927, InputWithoutLabelCheck) — coordinate with the aria-accessibility skill
8. CodeQL alerts — assess per rule; same triage logic as SonarCloud

For cognitive complexity, identify the function by its start line and name from the issue JSON, then look up the section. High-CC functions that have already been reduced via helper extraction in a prior pass may have CC scores that are now lower than what the export shows — verify current state before writing any code.

---

Step 5: Won't Fix rationale

Document Won't Fix decisions in the chat output for the user to record. Standard rationales:

- False positive (S6443 / regex literal): "False positive: String.raw applies to template literals, not regex literal syntax (/pattern/)."
- for-of index used: "Won't Fix: loop index used for `[accumulation / output assignment / indexed mutation]`."
- replaceAll quantifier: "Won't Fix: regex contains quantifiers; replaceAll with regex is equivalent to replace(/pattern/g) already accepted by SonarQube."
- Negated condition, no else: "Won't Fix: no else branch; negation would invert to an empty block and reduce clarity."
- Math.min/max non-numeric: "Won't Fix: ternary is not a pure numeric min/max pattern."
- Deferred (major refactor scope): "Deferred: function complexity requires structural redesign; out of scope for patch release. Tracked for next major version."
- S6819 custom interaction: "Won't Fix: custom mouse/keyboard interaction model (mousedown+drag+wheel) can't use a native `<input type="range">`. See aria-accessibility skill Rule 1."
- S7927 icon-only button: "False Positive: icon-only button whose aria-label can't contain an emoji glyph. aria-label is the correct accessible name (WCAG / aria-accessibility skill Rule 8)."
- S7682 snippet-caller: "Won't Fix: function exit status is intentionally the last command's (repomix); an explicit return would mask failures."
- S6606 verbatim port: "Accept: verbatim monolith port (Tranche 1); modernization belongs to the post-Phase-E cutover pass (roadmap item 5)."
- S8786 verbatim port: "Accept: verbatim monolith port; input bounded by `MAX_LINES=500`, simple tag-matcher regex with no nested quantifiers — linear backtracking."
- S6594 verbatim port: "Accept: verbatim monolith port; `.match` → `.exec` is safe but diverges from the verbatim body."
- S7744: "Fixed: dropped `|| {}` after spread — spreading `undefined` is a no-op."

In the SonarCloud UI, the resolution options are "False Positive" and "Accept" (no "Won't Fix" label). Use "False Positive" for analyzer-error cases (S6443, S7927 icon-only), "Accept" for intentional-design cases (S6819 custom interaction, S7682 snippet-caller, S6606 verbatim-port). A resolved security issue plus an Accept marking flips the retroactively-computed quality gate green.

**Blocking vs non-blocking dispositions** — the Won't Fix / Accept / False Positive rationales above apply to **non-blocking** issues only (code smells, maintainability issues that don't fail the quality gate). For **blocking** issues (security rules like S2083, reliability rules that fail the gate), comply fully rather than attempting workarounds. SonarCloud's taint analysis is thorough — regex tricks, helper functions, and "almost compliant" patterns will all be detected, and each failed attempt costs a full upload → scan → triage cycle. The time spent bypassing a blocking issue is almost always greater than the time spent complying with it. See `code-quality-SKILL.md` → "Blocking Sonar issues: comply, don't bypass" for the full rationale and the S2083 cautionary example.

---

Step 6: Version and delivery

SonarQube remediation passes are patch releases (e.g. 0.35.17 → 0.35.18). No checklist file required for pure quality passes with no functional change — state this explicitly in the chat output.

After delivery, SonarCloud will re-scan on the next push. New findings may appear if a refactor introduced new patterns (e.g. helper extraction can create new functions SonarQube evaluates independently). To force a re-scan without a push, the user can re-run the SonarCloud workflow via `workflow_dispatch` (enabled on `sonarcloud.yml`). CodeQL alerts are re-scanned on every push to a branch with the default setup; the GitHub Security tab is the source of truth for alert state.

The `sie` report itself should be saved to `archive/semantic/<version>/issues.md` (or `issues-N.md` if the user incremented the filename) so future sessions can compare the triage baseline against the next push's report. The `sie -c` / `--clean` flag drops the licensed Why/How sections if the user prefers not to commit that SonarSource content to a GPL-3 repo.

---

False positive summary

| Pattern | Rule | Action |
|---|---|---|
| `/regex/` literal flagged for String.raw | S6443 | Won't Fix — false positive |
| Math.max(a, b) already written correctly | S4023 | Won't Fix — false positive |
| for loop where index used | S4138 | Won't Fix — unsafe conversion |
| Negated condition with no else | S3800 | Won't Fix — clarity |
| replace(/pat+/g, ...) flagged for replaceAll | S1321 | Won't Fix — quantifier present |
| Icon-only button aria-label can't contain emoji | S7927 | False Positive — aria-label is the accessible name |
| Custom mouse/drag/wheel interaction can't be native input | S6819 | Accept — documented exception |
| Shell snippet-caller exit status is last command's | S7682 | Won't Fix — masking risk |
| `??=` not equivalent to `=== undefined` check | S6606 | Accept — semantics differ on null |
| `.match` → `.exec` diverges from verbatim port | S6594 | Accept — verbatim-port rationale |
| Verbatim monolith port, modernization deferred | S8786/S6557/S7755/S4138 | Accept — post-Phase-E pass |
| Fork-code in workflow that only merges verified main commits | githubactions:S7631 | False Positive — workflow never executes the event SHA |
| `|| {}` after spread is dead code | S7744 | Fix — drop the `|| {}` |
| Script injection via `${{ inputs.* }}` in `run:` blocks | githubactions:S7630 | Fix — move to `env:` + `$VAR` shell expansion |

---

Cross-references

- `code-quality` (Review bundle, same bundle as this skill) — the same rule patterns from a "write code that avoids them in the first place" angle
- `aria-accessibility` (Review bundle, same bundle as this skill) — full Rule 1 / Rule 8 rationale for S6819 / S7927
- `project-workflow` (Onboard bundle — not in the Review bundle; available at Onboard step or if the user uploaded it separately) — Post-patch verification (run `npm run test:unit` after `src/**` patches) and Post-turn updates (MEMORY.md / skill updates after a remediation turn)
- `sie` README (https://github.com/amokprime/sonar-issue-exporter) — installation, full CLI reference, the auth-boundary table, troubleshooting
