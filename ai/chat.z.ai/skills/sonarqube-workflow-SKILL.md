---
name: sonarqube-workflow
description: Process SonarQube Cloud issues for the LineByLine project and guide remediation. Use this skill whenever the user asks about SonarQube findings, mentions rules like S3776/S2004/S7761/S6819/S7927, needs help deciding whether to fix or mark as Won't Fix, or wants to plan a SonarQube remediation pass before writing any code. Also use when the user uploads a zip of locally-exported SonarQube issues, or when the agent should enumerate issues directly from the SonarCloud public API (no user upload needed for issue enumeration).
---

SonarQube Cloud scans run on every push via GitHub Actions. The sandbox can enumerate issues directly via the public JSON API (no auth, no `sonar-export`); for rule rationale (`why`/`how` content), the user still exports locally via `sonar-export` and uploads the zip. The two paths complement each other: API for "what's firing where right now", local export for "why this rule and how to fix it".

---

Step 0: Sandbox API enumeration (preferred first step)

Before asking the user to export anything, fetch the current issue list directly from the SonarCloud public JSON API. The project is public (`amokprime_linebyline`), so issue enumeration works unauthenticated.

Endpoints (use Python `urllib`, not the web reader tool — the web reader's URL validator rejects some query strings and the SPA pages render nothing for a static reader):

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

- `api/rules/show?key=<rule>` — rule "why"/"how" content. For rule rationale, the user must export locally via `sonar-export` and upload the zip (see Step 1).
- `api/rules/list` — rule search. Same auth requirement.
- Single-issue lookup via `?issues=<KEY>` on `api/issues/search` — returns 0 results without auth. To check a specific issue's status, filter by `rules=<rule>` + `component=<component>` instead, or fetch all OPEN issues and grep the response for the key.

Closed-issue gotcha: closed issues have `line: null` in the API response (and appear as `Lunknown.json` in local `sonar-export` exports). When triaging an export batch the user uploaded, cross-check each issue's `key` against the live API to detect staleness — a closed/FIXED issue in a fresh export batch is stale, not new (this bit the tranche-6 gate triage: the HotkeyCell S6819 export was the closed tranche-4 issue, not a regression). The API's `status` field is the source of truth: `OPEN`, `RESOLVED`, `CLOSED`.

Reference test script: `ai/chat.z.ai/scripts/test_sonar_api.py` — re-run it to verify API access still works after any sandbox change.

When to skip Step 0 and go straight to Step 1: only when the user has already uploaded a zip of locally-exported issues AND wants the `why.md`/`how.md` rule rationale that the API cannot provide. In that case, the export zip is the authoritative source — but still run Step 0 in parallel to cross-check issue statuses (catches the closed-issue staleness gotcha).

---

Step 1: Parse a local export zip (when the user uploads one)

Directory layout (per version):
```
{version}/
  issues/
    Category_folder_name/
      L1234.json      — one per issue instance, named by line number
      L1234_2.json    — second issue on the same line
      why.md          — rule rationale (shared — same for all instances of a rule)
      how.md          — fix guidance (shared; absent on simple rules)
    Another_category/
      ...
  linebyline-{version}.html
  linebyline-{version}.md
```

Each `L{line}.json` contains the full issue data (rule, component, line, textRange, message, severity, type, cleanCodeAttribute, cleanCodeAttributeCategory, impacts, flows). Category folder names are trimmed: no `_1`/`_2` instance counters, no `_from_N_to_the_15_allo` complexity suffixes — all instances of the same rule are merged into one folder.

Read `why.md`/`how.md` once per category folder (they are already deduplicated). Scan all `L*.json` files in the folder to get every instance — each file is a separate finding.

Before triaging an export batch, cross-check each issue's status via the API (Step 0). A closed issue in a fresh export is stale — the user may have re-exported an already-folded FIXED issue. The API's `status` field is authoritative; the export's `line` field being `null`/`Lunknown` is a symptom of closed status, not the cause.

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

GitHub Actions workflow rules (target `.github/workflows/*.yml`):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| `githubactions:S6505` | `npx`/`npm ci` supply-chain | Replace `npx <pkg>` with `./node_modules/.bin/<pkg>` (direct binary, no on-demand install); add `--ignore-scripts` to `npm ci` to prevent lifecycle scripts from running during install | Low — both fixes are mechanical and eliminate the attack surface without breaking functionality. The `npx` binary is already in `node_modules/.bin/` after `npm ci`, so the direct path works. `--ignore-scripts` is safe when the only postinstall that matters (e.g. Playwright browser download) is explicitly handled by a separate step. |
| `githubactions:S8543` | Pin exact package version | Collapses into the S6505 fix — `./node_modules/.bin/<pkg>` runs the version pinned in `package.json`, so no on-demand install can pull an unverified release. For action pins (`actions/checkout@v4`), pin to the commit SHA (`actions/checkout@11d5960a...`) | Low — SHA-pinning is best practice. Version-tag pins (`@v4`) are mutable and can be re-pointed by the action maintainer. |

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

---

Step 3: Assess each finding individually

Never apply a rule category wholesale. Assess each instance:

for-of conversion (S4138) — convert only when the loop index is not used for accumulation via index, output assignment keyed to index, indexed mutation of a parallel array, or any expression involving i other than arr[i]. When in doubt, skip and document as Won't Fix — a broken for-of conversion is worse than a SonarQube warning.

replaceAll (S1321) — convert only when the search value is a fixed string. Skip if the regex has quantifiers (+, *, ?, {n}), character classes, or anchors — replaceAll with a regex argument behaves the same as replace with /g, which SonarQube already accepted.

String.raw on regex literals (S6443) — almost always false positive. SonarQube flags regex literals like `/\d+/` as needing String.raw, but String.raw applies to template literals, not regex literals. Mark as Won't Fix: "False positive: rule does not apply to regex literal syntax."

Math.min/max ternaries (S4023) — not every `a > b ? a : b` is a min/max replacement. If the ternary involves side effects, string coercion, or a non-numeric comparison, skip it.

Negated condition (S3800) — only invert the condition if there is a meaningful else or else if branch. A lone `if (!x) return` with no else is fine as-is; inverting it adds an empty block and reduces clarity. Mark as Won't Fix: "No else branch; inversion would reduce clarity."

githubactions:S6505 (`npx` supply-chain) — always fix. Replace `npx <pkg>` with `./node_modules/.bin/<pkg>`. This is safe because `npm ci` (which runs before the `npx` call in CI) installs the package into `node_modules/.bin/`. The direct binary path eliminates the on-demand install path that `npx` would use if the package were missing. For `npm ci` findings, add `--ignore-scripts` — safe when the only postinstall that matters is handled by a separate explicit step (e.g. `playwright install --with-deps` handles browser download, so `npm ci --ignore-scripts` skipping `@playwright/test`'s postinstall is fine).

githubactions:S8543 (pin exact version) — always fix for `npx` calls (collapsed into the S6505 fix — direct binary uses package.json-pinned version). For GitHub Actions (`actions/checkout@v4`), pin to commit SHA. No false positives observed.

shelldre:S7682 (explicit return) — Won't Fix for `.base.sh`'s snippet-caller functions where the exit status is intentionally the last command's (repomix); an explicit `return 0` would mask a repomix failure and zip/copy missing output. Fix elsewhere.

Web:S6819 (ARIA role → native element) — fix when the native element's interaction model fully covers the use case (e.g. `div[role=button]` → `<button type=button>`). Won't Fix when the element has a custom mouse/keyboard interaction model that can't be a native input (e.g. `#progress-wrap` seek bar with mousedown+drag+wheel). Document the Won't Fix rationale and mark Accept in the SonarCloud UI.

Web:S7927 (accessible name contains visible label) — False Positive for icon-only buttons whose `aria-label` can't contain an emoji glyph (e.g. theme toggle button with Vue-interpolated emoji). The emoji siblings go unflagged only because their content is a static character. `aria-label` is the correct accessible name for icon-only buttons (WCAG / aria-accessibility skill Rule 8).

Web:InputWithoutLabelCheck — add `id` + `aria-label`. `aria-label` satisfies the rule; no visible `<label for>` is needed on a `display:none` input (mirrors the App-level `#file-picker` pattern that passes the analyzer).

---

Step 4: Plan the remediation pass

Group accepted fixes by section (use the linebyline-section-index skill to find sections, or grep `src/` for the component path). Plan one category of change per turn to reduce regression risk. Typical order:

1. Simple substitutions first (`.dataset`, `Number.isNaN`, `Object.hasOwn`, `replaceAll`)
2. for-of conversions (selective)
3. Helper extraction for nesting depth (S2004)
4. Cognitive complexity reduction (S3776) — most invasive, do last
5. Workflow-file rules (S6505, S8543) — independent of app code, can be done in any order
6. Shell-script rules (S7682, S7679, S7688) — independent of app code
7. Vue/web rules (S6819, S7927, InputWithoutLabelCheck) — coordinate with the aria-accessibility skill

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

In the SonarCloud UI, the resolution options are "False Positive" and "Accept" (no "Won't Fix" label). Use "False Positive" for analyzer-error cases (S6443, S7927 icon-only), "Accept" for intentional-design cases (S6819 custom interaction, S7682 snippet-caller, S6606 verbatim-port). A resolved security issue plus an Accept marking flips the retroactively-computed quality gate green.

---

Step 6: Version and delivery

SonarQube remediation passes are patch releases (e.g. 0.35.17 → 0.35.18). No checklist file required for pure quality passes with no functional change — state this explicitly in the chat output.

After delivery, SonarQube will re-scan on the next push. New findings may appear if a refactor introduced new patterns (e.g. helper extraction can create new functions SonarQube evaluates independently). To force a re-scan without a push, the user can re-run the SonarCloud workflow via `workflow_dispatch` (enabled on `sonarcloud.yml`).

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
