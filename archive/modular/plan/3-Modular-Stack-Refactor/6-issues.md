# SonarQube Issues — amokprime_linebyline (PR #11)

Generated: 2026-09-15 05:13 UTC
Source: `pr`
Total: 65 issue(s) across 19 rule(s)
Token: clean (why/how sections suppressed)

---

## Summary

| Severity   | Count |   | Type          | Count |
|------------|-------|---|---------------|-------|
| BLOCKER    | 1     |  | CODE_SMELL    | 56    |
| CRITICAL   | 9     |  | VULNERABILITY | 8     |
| MAJOR      | 22    |  | BUG           | 1     |
| MINOR      | 33    |  |               |       |

Top rules:
- `typescript:S8786` — 11×
- `typescript:S6594` — 8×
- `typescript:S7773` — 8×
- `typescript:S6606` — 7×
- `typescript:S3735` — 5×
- `pythonsecurity:S8707` — 4×
- `typescript:S7755` — 4×
- `python:S3457` — 3×
- `python:S3776` — 2×
- `typescript:S3776` — 2×

---

## Rule: `pythonsecurity:S2083` — pythonsecurity:S2083

Severity: BLOCKER: 1 · Type: VULNERABILITY: 1 · CleanCode: COMPLETE: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/split_bullets.py` | L111 | Path Traversal via unsanitized user input | `AaCjd1sksCCpe7YBmzyg` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S3735` — typescript:S3735

Severity: CRITICAL: 5 · Type: CODE_SMELL: 5 · CleanCode: CLEAR: 5 · 5 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useGlobalHotkeys.ts` | L347 | Remove this use of the "void" operator. | `AaCjd1ufsCCpe7YBmzyo` | OPEN |
| `src/composables/useGlobalHotkeys.ts` | L462 | Remove this use of the "void" operator. | `AaCjd1ufsCCpe7YBmzyq` | OPEN |
| `src/composables/useGlobalHotkeys.ts` | L595 | Remove this use of the "void" operator. | `AaCjd1ufsCCpe7YBmzyr` | OPEN |
| `src/composables/useGlobalHotkeys.ts` | L596 | Remove this use of the "void" operator. | `AaCjd1ufsCCpe7YBmzys` | OPEN |
| `src/composables/useTextareaKeys.ts` | L55 | Remove this use of the "void" operator. | `AaCjd1uvsCCpe7YBmzyt` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `python:S3776` — python:S3776

Severity: CRITICAL: 2 · Type: CODE_SMELL: 2 · CleanCode: FOCUSED: 2 · 2 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/lint_markdown.py` | L126 | Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. | `AaCjd1qFsCCpe7YBmzyY` | OPEN |
| `ai/chat.z.ai/scripts/split_bullets.py` | L17 | Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed. | `AaCjd1sksCCpe7YBmzyf` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S3776` — typescript:S3776

Severity: CRITICAL: 2 · Type: CODE_SMELL: 2 · CleanCode: FOCUSED: 2 · 2 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useSettings.ts` | L297 | Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed. | `AaCjd1tOsCCpe7YBmzyj` | OPEN |
| `src/composables/useSettings.ts` | L475 | Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed. | `AaCjd1tOsCCpe7YBmzyl` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S8786` — typescript:S8786

Severity: MAJOR: 11 · Type: CODE_SMELL: 11 · CleanCode: EFFICIENT: 11 · 11 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useImport.ts` | L201 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCimn5kMBtv7rY63pk_` | OPEN |
| `src/composables/useSync.ts` | L851 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCimn6QMBtv7rY63plI` | OPEN |
| `src/composables/useTitle.ts` | L32 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCEjWoPsgu35AS-jVFg` | OPEN |
| `src/composables/useTitle.ts` | L34 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCIU_yesmsHQ2vn3UJN` | OPEN |
| `src/utils/geniusExtractor.ts` | L113 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCC2RPU3vu4aE8Mnjr2` | OPEN |
| `src/utils/lrcParser.ts` | L75 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk2IDk5q6SaK23Im` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Io` | OPEN |
| `src/utils/pasteHandlers.ts` | L24 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ip` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ir` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23It` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Iv` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `pythonsecurity:S8707` — pythonsecurity:S8707

Severity: MAJOR: 4 · Type: VULNERABILITY: 4 · CleanCode: COMPLETE: 4 · 4 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/lint_markdown.py` | L183 | Path Traversal via faulty LLM-supplied CLI arguments | `AaCjd1qFsCCpe7YBmzyd` | OPEN |
| `ai/chat.z.ai/scripts/lint_markdown.py` | L206 | Path Traversal via faulty LLM-supplied CLI arguments | `AaCjd1qFsCCpe7YBmzyc` | OPEN |
| `ai/chat.z.ai/scripts/split_bullets.py` | L91 | Path Traversal via faulty LLM-supplied CLI arguments | `AaCjd1sksCCpe7YBmzyh` | OPEN |
| `ai/chat.z.ai/scripts/split_bullets.py` | L111 | Path Traversal via faulty LLM-supplied CLI arguments | `AaCjd1sksCCpe7YBmzyi` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `python:S3457` — python:S3457

Severity: MAJOR: 3 · Type: CODE_SMELL: 3 · CleanCode: LOGICAL: 3 · 3 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/lint_markdown.py` | L154 | Add replacement fields or use a normal string instead of an f-string. | `AaCjd1qFsCCpe7YBmzyZ` | OPEN |
| `ai/chat.z.ai/scripts/lint_markdown.py` | L161 | Add replacement fields or use a normal string instead of an f-string. | `AaCjd1qFsCCpe7YBmzya` | OPEN |
| `ai/chat.z.ai/scripts/lint_markdown.py` | L167 | Add replacement fields or use a normal string instead of an f-string. | `AaCjd1qFsCCpe7YBmzyb` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `Web:S6819` — Web:S6819

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/LeftPanel.vue` | L159 | Use <input> instead of the slider role to ensure accessibility across all devices. | `AaB5FcWM50elM9qDQH86` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `Web:S7927` — Web:S7927

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/MenuBar.vue` | L154 | The accessible name should be part of the visible label. | `AaB45xMSBD7wArG_suY0` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `shell:S6505` — shell:S6505

Severity: MAJOR: 1 · Type: VULNERABILITY: 1 · CleanCode: TRUSTWORTHY: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/delivery/deploy.sh` | L101 | Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation. | `AaCjd1sBsCCpe7YBmzye` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S3923` — typescript:S3923

Severity: MAJOR: 1 · Type: BUG: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useSettings.ts` | L329 | Remove this conditional structure or edit its code blocks so that they're not all the same. | `AaCjd1tOsCCpe7YBmzyk` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6594` — typescript:S6594

Severity: MINOR: 8 · Type: CODE_SMELL: 8 · CleanCode: EFFICIENT: 8 · 8 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useImport.ts` | L201 | Use the "RegExp.exec()" method instead. | `AaCimn5kMBtv7rY63pk-` | OPEN |
| `src/utils/geniusExtractor.ts` | L132 | Use the "RegExp.exec()" method instead. | `AaCC2RPU3vu4aE8Mnjr4` | OPEN |
| `src/utils/lrcParser.ts` | L75 | Use the "RegExp.exec()" method instead. | `AaB4pk2IDk5q6SaK23Il` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23In` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iq` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Is` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iu` | OPEN |
| `src/utils/pasteHandlers.ts` | L51 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iw` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7773` — typescript:S7773

Severity: MINOR: 8 · Type: CODE_SMELL: 8 · CleanCode: CONVENTIONAL: 8 · 8 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/SettingsDialog.vue` | L180 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzyv` | OPEN |
| `src/components/SettingsDialog.vue` | L181 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzyw` | OPEN |
| `src/components/SettingsDialog.vue` | L182 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzyx` | OPEN |
| `src/components/SettingsDialog.vue` | L183 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzyy` | OPEN |
| `src/components/SettingsDialog.vue` | L184 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzyz` | OPEN |
| `src/components/SettingsDialog.vue` | L185 | Prefer `Number.parseFloat` over `parseFloat`. | `AaCjd1xrsCCpe7YBmzy0` | OPEN |
| `src/components/SettingsDialog.vue` | L186 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzy1` | OPEN |
| `src/components/SettingsDialog.vue` | L187 | Prefer `Number.parseInt` over `parseInt`. | `AaCjd1xrsCCpe7YBmzy2` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6606` — typescript:S6606

Severity: MINOR: 7 · Type: CODE_SMELL: 7 · CleanCode: CONVENTIONAL: 7 · 7 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/config.ts` | L133 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23Ix` | OPEN |
| `src/config.ts` | L134 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23Iy` | OPEN |
| `src/config.ts` | L135 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23Iz` | OPEN |
| `src/config.ts` | L136 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23I0` | OPEN |
| `src/config.ts` | L137 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23I1` | OPEN |
| `src/config.ts` | L139 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23I2` | OPEN |
| `src/config.ts` | L140 | Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is simpler to read. | `AaB4pk4tDk5q6SaK23I3` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7755` — typescript:S7755

Severity: MINOR: 4 · Type: CODE_SMELL: 4 · CleanCode: CONVENTIONAL: 4 · 4 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useGlobalHotkeys.ts` | L415 | Prefer `.at(…)` over `[….length - index]`. | `AaCjd1ufsCCpe7YBmzyp` | OPEN |
| `src/composables/useMerge.ts` | L254 | Prefer `.at(…)` over `[….length - index]`. | `AaCimn3-MBtv7rY63pk9` | OPEN |
| `src/utils/geniusExtractor.ts` | L60 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr0` | OPEN |
| `src/utils/geniusExtractor.ts` | L79 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr1` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S4138` — typescript:S4138

Severity: MINOR: 2 · Type: CODE_SMELL: 2 · CleanCode: CONVENTIONAL: 2 · 2 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/utils/geniusExtractor.ts` | L131 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCC2RPU3vu4aE8Mnjr3` | OPEN |
| `src/utils/timestampSync.ts` | L134 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCjd1v8sCCpe7YBmzyu` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S5148` — typescript:S5148

Severity: MINOR: 2 · Type: VULNERABILITY: 2 · CleanCode: COMPLETE: 2 · 2 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/App.vue` | L271 | Make sure not using "noopener" is safe here. | `AaCjd1yrsCCpe7YBmzy3` | OPEN |
| `src/App.vue` | L274 | Make sure not using "noopener" is safe here. | `AaCjd1yrsCCpe7YBmzy4` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6582` — typescript:S6582

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useGlobalHotkeys.ts` | L210 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCjd1ufsCCpe7YBmzyn` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7763` — typescript:S7763

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useSettings.ts` | L652 | Use `export…from` to re-export `HK_SECTIONS`. | `AaCjd1tOsCCpe7YBmzym` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---
