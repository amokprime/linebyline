---
name: sonarqube-workflow
description: Process SonarQube Cloud issue exports for the LineByLine project and guide remediation. Use this skill whenever the user uploads a zip of SonarQube issues, asks about SonarQube findings, mentions rules like S3776/S2004/S7761, or needs help deciding whether to fix or mark as Won't Fix. Also use when planning a SonarQube remediation pass before writing any code.
---

SonarQube Cloud scans run on every push via GitHub Actions. Issues are exported into a per-version directory structure. Inside each version's `issues/` subfolder, issues are grouped by category — one folder per rule category containing `L{line}.json` files (one per instance) and shared `why.md`/`how.md`.

---

Step 0: Fetch the issues directly (agent-side — no zip, no sonar-watch link copying)

The project is public on SonarCloud, so the agent can enumerate and export issues itself:

1. **Enumerate** via the public JSON API (no auth needed; Bash `curl -s` — the web reader tool also passes it through, but its URL validator rejects `%2C`-encoded commas, so write `issueStatuses=OPEN,CONFIRMED` with literal commas there):
   `https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&pullRequest=11&issueStatuses=OPEN&sinceLeakPeriod=true`
   Omit `pullRequest` for main-branch scans. Each hit's `key` identifies the issue.
2. **Build the issue link** (sonar-export requires `id` and `open` params):
   `https://sonarcloud.io/project/issues?id=amokprime_linebyline&pullRequest=11&issues=KEY&open=KEY`
3. **Export each**: `~/.local/bin/sonar-export "LINK"` — full path, it is not on ZCode's non-interactive PATH (same as agent-tst). Unauthenticated works for public projects; set `BEARER_TOKEN` for private ones. Exports land in `~/Downloads/issues/<message-slug>/L{line}.json` plus `why.md`/`how.md` when SonarCloud has tab content (css: rules have none). Same-message instances of a rule merge into one folder, one `L{line}.json` per instance.
4. **Fold into the archive**: `mv ~/Downloads/issues/* archive/semantic/<version>/issues/` using the version directory currently in triage — then continue with Step 1.

---

Step 1: Parse the export

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

---

Step 2: Categorize by rule

Group findings before acting. Common rules in this project:

JavaScript / TypeScript rules (target `docs/index.html` or test files):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| S3776 | Cognitive Complexity | Helper extraction, early return, optional chaining | Low — but check if SQ counts per-function independently (it does in JS) |
| S2004 | Nesting depth >4 | Extract inner callbacks/arrow fns as named helpers | Low |
| S7761 | Prefer `.dataset` | Replace `getAttribute/setAttribute('data-*')` with `.dataset.x` | Low |
| S1940 | Use `Array.from` / spread | Replace `Array.prototype.slice.call(...)` etc. with `Array.from` | Low |
| S6679 | Prefer `Number.isNaN` | Replace `isNaN()` with `Number.isNaN()` | Low |
| S6606 | Prefer `??=` (nullish coalescing) | NOT a safe mechanical fix — `??=` also coalesces `null`, while the monolith checked `=== undefined` explicitly. On verbatim monolith ports mark Accept, don't convert | High on verbatim ports — see Step 3 |
| S6594 | Prefer `RegExp.exec()` over `String.match()` | Equivalent for non-global regexes, but diverges from verbatim monolith bodies | Medium on verbatim ports — see Step 3 |
| S8786 | Super-linear regex backtracking | Same disposition as the eslint-off `sonarjs/super-linear-regex` for `src/**` — inputs are bounded (MAX_LINES=500, per-line strings); roadmap item 5 may add bounded parsers post-cutover | High on verbatim ports |
| S6666 | Prefer `Object.hasOwn` | Replace `obj.hasOwnProperty(x)` with `Object.hasOwn(obj, x)` | Low |
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
| `githubactions:S7631` | Untrusted code from a fork | Harden event-data use before dismissing — see the sync-staging disposition below | Medium |

Shell script rules (target `ai/**/*.sh`; verify with `shellcheck` and `bash -n`, smoke-test the script live where possible):

| Rule | Name | Typical fix | False positive risk |
|---|---|---|---|
| `shelldre:S7679` | Assign positional parameter to a local | One `local var="$1"` per function, then use `$var` everywhere — collapses all instances in that function into a single fix | Low |
| `shelldre:S7682` | Explicit return at end of function | Often Won't Fix — see disposition below | High |
| `shelldre:S7688` | Prefer `[[ ]]` over `[` | Safe when the shebang is bash; check for POSIX `sh` consumers first | Low |
| `shelldre:S1066` | Merge if with enclosing | Fold an inner `if cmd` into the outer condition with `&&` when short-circuit order is preserved | Low |

Note on `ai/chat.z.ai/scripts/`: shellcheck can't resolve the `# shellcheck source=.base.sh` directive from the repo root and reports SC2154 (`$upload`) / SC1091 on every script — invocation artifact, not a code problem; `$upload` is assigned in `.base.sh` before `snippet` runs.

---

Step 3: Assess each finding individually

Never apply a rule category wholesale. Assess each instance:

Modular-port context (Phase C, Sep 2026) — `src/` modules are verbatim ports of monolith functions with behavior pinned by vitest specs. Stylistic modernization findings (S6606 `??=`, S6594 `exec()`, S8786 regex backtracking) deviate from the port and can change semantics (`??=` widens the coalesce from `=== undefined` to include `null`). Prefer Accept over conversion for these on ported code; convert only in a deliberate post-cutover cleanup pass (roadmap item 5).

for-of conversion (S4138) — convert only when the loop index is not used for accumulation via index, output assignment keyed to index, indexed mutation of a parallel array, or any expression involving i other than arr[i]. When in doubt, skip and document as Won't Fix — a broken for-of conversion is worse than a SonarQube warning.

replaceAll (S1321) — convert only when the search value is a fixed string. Skip if the regex has quantifiers (+, *, ?, {n}), character classes, or anchors — replaceAll with a regex argument behaves the same as replace with /g, which SonarQube already accepted.

String.raw on regex literals (S6443) — almost always false positive. SonarQube flags regex literals like `/\d+/` as needing String.raw, but String.raw applies to template literals, not regex literals. Mark as Won't Fix: "False positive: rule does not apply to regex literal syntax."

Math.min/max ternaries (S4023) — not every `a > b ? a : b` is a min/max replacement. If the ternary involves side effects, string coercion, or a non-numeric comparison, skip it.

Negated condition (S3800) — only invert the condition if there is a meaningful else or else if branch. A lone `if (!x) return` with no else is fine as-is; inverting it adds an empty block and reduces clarity. Mark as Won't Fix: "No else branch; inversion would reduce clarity."

githubactions:S6505 (`npx` supply-chain) — always fix. Replace `npx <pkg>` with `./node_modules/.bin/<pkg>`. This is safe because `npm ci` (which runs before the `npx` call in CI) installs the package into `node_modules/.bin/`. The direct binary path eliminates the on-demand install path that `npx` would use if the package were missing. For `npm ci` findings, add `--ignore-scripts` — safe when the only postinstall that matters is handled by a separate explicit step (e.g. `playwright install --with-deps` handles browser download, so `npm ci --ignore-scripts` skipping `@playwright/test`'s postinstall is fine).

githubactions:S8543 (pin exact version) — always fix for `npx` calls (collapsed into the S6505 fix — direct binary uses package.json-pinned version). For GitHub Actions (`actions/checkout@v4`), pin to commit SHA. No false positives observed.

githubactions:S7631 (untrusted fork code) — assess what the workflow actually does with event data before dismissing. sync-staging.yml disposition (Sep 2026): `workflow_run` + `branches: [main]` still matches a fork PR whose head branch happens to be named `main`, and that PR's own green CI runs could pass the gate — hardened by verifying `HEAD_SHA` is on main via the compare API (`repos/…/compare/main...$HEAD_SHA` must return `behind|identical`) before merging. Residual flag is Won't Fix: the workflow checks out `staging`, never the event SHA, and executes no code from it; only commits verified on main are merged.

shelldre:S7682 (explicit return) — Won't Fix for the `ai/chat.z.ai/scripts/*.sh` snippet functions: `.base.sh` runs `set -e` and then calls `snippet`, whose exit status is intentionally that of its last command (repomix). An explicit `return 0` would mask a repomix failure and the zip/wl-copy steps would run on missing output.

---

Step 4: Plan the remediation pass

Group accepted fixes by section (use the linebyline-section-index skill to find sections). Plan one category of change per turn to reduce regression risk. Typical order:

1. Simple substitutions first (`.dataset`, `Number.isNaN`, `Object.hasOwn`, `replaceAll`)
2. for-of conversions (selective)
3. Helper extraction for nesting depth (S2004)
4. Cognitive complexity reduction (S3776) — most invasive, do last
5. Workflow-file rules (S6505, S8543) — independent of app code, can be done in any order

For cognitive complexity, identify the function by its start line and name from the `L{line}.json` file, then look up the section. High-CC functions that have already been reduced via helper extraction in a prior pass may have CC scores that are now lower than what the export shows — verify current state before writing any code.

---

Step 5: Won't Fix rationale

Document Won't Fix decisions in the durable project memory seed (`MEMORY.md` at the project root) — it is git-tracked, harness-agnostic, and outlives harness switches; the active harness memory may also carry them. Note the SonarCloud UI terminology (Sep 2026): issue resolutions are "False Positive" and "Accept" — there is no "Won't Fix" label; map these dispositions to whichever of the two fits. Standard rationales:

- False positive (S6443 / regex literal): "False positive: String.raw applies to template literals, not regex literal syntax (/pattern/)."
- for-of index used: "Won't Fix: loop index used for [accumulation / output assignment / indexed mutation]."
- replaceAll quantifier: "Won't Fix: regex contains quantifiers; replaceAll with regex is equivalent to replace(/pattern/g) already accepted by SonarQube."
- Negated condition, no else: "Won't Fix: no else branch; negation would invert to an empty block and reduce clarity."
- Math.min/max non-numeric: "Won't Fix: ternary is not a pure numeric min/max pattern."
- Deferred (major refactor scope): "Deferred: function complexity requires structural redesign; out of scope for patch release. Tracked for next major version."
- Verbatim monolith port (S6594/S6606/S8786 on src/, Phase C): "Accept: ported verbatim from the monolith; behavior pinned by unit specs; conversion risks semantic drift (e.g. `??=` coalesces null too). Modernization deferred to post-cutover cleanup (roadmap item 5)."

---

Step 6: Version and delivery

SonarQube remediation passes are patch releases (e.g. 0.35.17 → 0.35.18). No checklist file required for pure quality passes with no functional change — state this explicitly in the same hand-curated project memory file.

After delivery, SonarQube will re-scan on the next push. New findings may appear if a refactor introduced new patterns (e.g. helper extraction can create new functions SonarQube evaluates independently).

---

False positive summary

| Pattern | Rule | Action |
|---|---|---|
| `/regex/` literal flagged for String.raw | S6443 | Won't Fix — false positive |
| Math.max(a, b) already written correctly | S4023 | Won't Fix — false positive |
| for loop where index used | S4138 | Won't Fix — unsafe conversion |
| Negated condition with no else | S3800 | Won't Fix — clarity |
| replace(/pat+/g, ...) flagged for replaceAll | S1321 | Won't Fix — quantifier present |
| snippet() without explicit return | S7682 | Won't Fix — set -e contract; return 0 masks repomix failure |
| workflow_run merge workflow flagged for fork code | S7631 | Won't Fix after on-main compare hardening — see disposition |
