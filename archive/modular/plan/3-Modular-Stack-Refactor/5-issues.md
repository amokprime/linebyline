# SonarQube Issues — amokprime_linebyline (PR #11)

Generated: 2026-09-15 01:33 UTC
Source: `pr`
Total: 43 issue(s) across 12 rule(s)
Token: clean (why/how sections suppressed)

---

## Summary

| Severity   | Count |   | Type          | Count |
|------------|-------|---|---------------|-------|
| CRITICAL   | 4     |  | CODE_SMELL    | 43    |
| MAJOR      | 14    |  |               |       |
| MINOR      | 25    |  |               |       |

Top rules:
- `typescript:S8786` — 11×
- `typescript:S6594` — 8×
- `typescript:S6606` — 7×
- `typescript:S7781` — 5×
- `typescript:S3776` — 3×
- `typescript:S7755` — 3×
- `Web:S6819` — 1×
- `Web:S7927` — 1×
- `typescript:S3735` — 1×
- `typescript:S4138` — 1×

---

## Rule: `typescript:S3776` — typescript:S3776

Severity: CRITICAL: 3 · Type: CODE_SMELL: 3 · CleanCode: FOCUSED: 3 · 3 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useSync.ts` | L269 | Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed. | `AaCimn6QMBtv7rY63plB` | OPEN |
| `src/composables/useSync.ts` | L549 | Refactor this function to reduce its Cognitive Complexity from 39 to the 15 allowed. | `AaCimn6QMBtv7rY63plH` | OPEN |
| `src/composables/useSync.ts` | L914 | Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed. | `AaCimn6QMBtv7rY63plJ` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S3735` — typescript:S3735

Severity: CRITICAL: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useMerge.ts` | L198 | Remove this use of the "void" operator. | `AaCimn3-MBtv7rY63pk8` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S8786` — typescript:S8786

Severity: MAJOR: 11 · Type: CODE_SMELL: 11 · CleanCode: EFFICIENT: 11 · 11 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useImport.ts` | L201 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCimn5kMBtv7rY63pk_` | OPEN |
| `src/composables/useSync.ts` | L796 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCimn6QMBtv7rY63plI` | OPEN |
| `src/composables/useTitle.ts` | L32 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCEjWoPsgu35AS-jVFg` | OPEN |
| `src/composables/useTitle.ts` | L34 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCIU_yesmsHQ2vn3UJN` | OPEN |
| `src/utils/geniusExtractor.ts` | L104 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCC2RPU3vu4aE8Mnjr2` | OPEN |
| `src/utils/lrcParser.ts` | L75 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk2IDk5q6SaK23Im` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Io` | OPEN |
| `src/utils/pasteHandlers.ts` | L24 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ip` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ir` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23It` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Iv` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `Web:S6819` — Web:S6819

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/LeftPanel.vue` | L151 | Use <input> instead of the slider role to ensure accessibility across all devices. | `AaB5FcWM50elM9qDQH86` | OPEN |

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

## Rule: `typescript:S6557` — typescript:S6557

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/utils/geniusExtractor.ts` | L35 | Use the 'String#endsWith' method instead. | `AaCC2RPU3vu4aE8Mnjrz` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6594` — typescript:S6594

Severity: MINOR: 8 · Type: CODE_SMELL: 8 · CleanCode: EFFICIENT: 8 · 8 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useImport.ts` | L201 | Use the "RegExp.exec()" method instead. | `AaCimn5kMBtv7rY63pk-` | OPEN |
| `src/utils/geniusExtractor.ts` | L123 | Use the "RegExp.exec()" method instead. | `AaCC2RPU3vu4aE8Mnjr4` | OPEN |
| `src/utils/lrcParser.ts` | L75 | Use the "RegExp.exec()" method instead. | `AaB4pk2IDk5q6SaK23Il` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23In` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iq` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Is` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iu` | OPEN |
| `src/utils/pasteHandlers.ts` | L51 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iw` | OPEN |

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

## Rule: `typescript:S7781` — typescript:S7781

Severity: MINOR: 5 · Type: CODE_SMELL: 5 · CleanCode: CLEAR: 5 · 5 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useSync.ts` | L365 | Prefer `String#replaceAll()` over `String#replace()`. | `AaCimn6QMBtv7rY63plC` | OPEN |
| `src/composables/useSync.ts` | L366 | Prefer `String#replaceAll()` over `String#replace()`. | `AaCimn6QMBtv7rY63plD` | OPEN |
| `src/composables/useSync.ts` | L367 | Prefer `String#replaceAll()` over `String#replace()`. | `AaCimn6QMBtv7rY63plE` | OPEN |
| `src/composables/useSync.ts` | L368 | Prefer `String#replaceAll()` over `String#replace()`. | `AaCimn6QMBtv7rY63plF` | OPEN |
| `src/composables/useSync.ts` | L369 | Prefer `String#replaceAll()` over `String#replace()`. | `AaCimn6QMBtv7rY63plG` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7755` — typescript:S7755

Severity: MINOR: 3 · Type: CODE_SMELL: 3 · CleanCode: CONVENTIONAL: 3 · 3 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useMerge.ts` | L255 | Prefer `.at(…)` over `[….length - index]`. | `AaCimn3-MBtv7rY63pk9` | OPEN |
| `src/utils/geniusExtractor.ts` | L51 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr0` | OPEN |
| `src/utils/geniusExtractor.ts` | L70 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr1` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S4138` — typescript:S4138

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/utils/geniusExtractor.ts` | L122 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCC2RPU3vu4aE8Mnjr3` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6582` — typescript:S6582

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useImport.ts` | L287 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCimn5kMBtv7rY63plA` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---
