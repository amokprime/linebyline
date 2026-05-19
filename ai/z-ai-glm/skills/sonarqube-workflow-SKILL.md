---
name: sonarqube-workflow
description: Process SonarQube Cloud issue exports for the LineByLine project and guide remediation. Use this skill whenever the user uploads a zip of SonarQube issues, asks about SonarQube findings, mentions rules like S3776/S2004/S7761, or needs help deciding whether to fix or mark as Won't Fix. Also use when planning a SonarQube remediation pass before writing any code.
---

SonarQube Cloud scans run on every push via GitHub Actions. Issues are exported as a zip of subfolders (one per issue), each containing up to three files: `where.json`, `why.md`, `how.md`.

---

Step 1: Parse the export

Each subfolder name is the issue title (URL-encoded). Each folder contains:
- `where.json` — rule ID, severity, line range, flow locations (nesting/complexity path)
- `why.md` — rule rationale (same text for all instances of a rule — read once per unique rule)
- `how.md` — fix guidance (present on complexity/structural rules; absent on simple ones)

Read the first instance of each unique rule to understand it; skip `why.md`/`how.md` for subsequent duplicates of the same rule. Extract line numbers and function names from `where.json` for each instance.

---

Step 2: Categorize by rule

Group findings before acting. Common rules in this project:

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

---

Step 3: Assess each finding individually

Never apply a rule category wholesale. Assess each instance:

for-of conversion (S4138) — convert only when the loop index is not used for accumulation via index, output assignment keyed to index, indexed mutation of a parallel array, or any expression involving i other than arr[i]. When in doubt, skip and document as Won't Fix — a broken for-of conversion is worse than a SonarQube warning.

replaceAll (S1321) — convert only when the search value is a fixed string. Skip if the regex has quantifiers (+, *, ?, {n}), character classes, or anchors — replaceAll with a regex argument behaves the same as replace with /g, which SonarQube already accepted.

String.raw on regex literals (S6443) — almost always false positive. SonarQube flags regex literals like `/\d+/` as needing String.raw, but String.raw applies to template literals, not regex literals. Mark as Won't Fix: "False positive: rule does not apply to regex literal syntax."

Math.min/max ternaries (S4023) — not every `a > b ? a : b` is a min/max replacement. If the ternary involves side effects, string coercion, or a non-numeric comparison, skip it.

Negated condition (S3800) — only invert the condition if there is a meaningful else or else if branch. A lone `if (!x) return` with no else is fine as-is; inverting it adds an empty block and reduces clarity. Mark as Won't Fix: "No else branch; inversion would reduce clarity."

---

Step 4: Plan the remediation pass

Group accepted fixes by section (use the linebyline-section-index skill to find sections). Plan one category of change per turn to reduce regression risk. Typical order:

1. Simple substitutions first (`.dataset`, `Number.isNaN`, `Object.hasOwn`, `replaceAll`)
2. for-of conversions (selective)
3. Helper extraction for nesting depth (S2004)
4. Cognitive complexity reduction (S3776) — most invasive, do last

For cognitive complexity, identify the function by its start line and name from `where.json`, then look up the section. High-CC functions that have already been reduced via helper extraction in a prior pass may have CC scores that are now lower than what the export shows — verify current state before writing any code.

---

Step 5: Won't Fix rationale

Document Won't Fix decisions in the companion .md build log. Standard rationales:

- False positive (S6443 / regex literal): "False positive: String.raw applies to template literals, not regex literal syntax (/pattern/)."
- for-of index used: "Won't Fix: loop index used for [accumulation / output assignment / indexed mutation]."
- replaceAll quantifier: "Won't Fix: regex contains quantifiers; replaceAll with regex is equivalent to replace(/pattern/g) already accepted by SonarQube."
- Negated condition, no else: "Won't Fix: no else branch; negation would invert to an empty block and reduce clarity."
- Math.min/max non-numeric: "Won't Fix: ternary is not a pure numeric min/max pattern."
- Deferred (major refactor scope): "Deferred: function complexity requires structural redesign; out of scope for patch release. Tracked for next major version."

---

Step 6: Version and delivery

SonarQube remediation passes are patch releases (e.g. 0.35.17 → 0.35.18). No checklist file required for pure quality passes with no functional change — state this explicitly in the companion .md.

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
