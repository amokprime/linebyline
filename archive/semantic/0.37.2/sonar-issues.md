# SonarQube Issues — amokprime_linebyline (local export)

Generated: 2026-09-10 03:49 UTC
Source: `/home/user/GitHub/linebyline/archive/semantic/0.37.2/issues`
Total: 83 issue(s) across 25 rule(s)

---

## Summary

| Severity   | Count |   | Type          | Count |
|------------|-------|---|---------------|-------|
| CRITICAL   | 2     |  | CODE_SMELL    | 77    |
| MAJOR      | 54    |  | VULNERABILITY | 5     |
| MINOR      | 27    |  | BUG           | 1     |

Top rules:
- `shelldre:S7688` — 12×
- `typescript:S8786` — 10×
- `typescript:S6594` — 9×
- `shelldre:S7679` — 7×
- `typescript:S6606` — 7×
- `Web:S6819` — 5×
- `shelldre:S7682` — 5×
- `typescript:S6582` — 4×
- `typescript:S4138` — 3×
- `Web:S7927` — 2×

---

## Rule: `typescript:S3735` — typescript:S3735

Severity: CRITICAL: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/LeftPanel.vue` | L78 | Remove this use of the "void" operator. | `AaCEjWnNsgu35AS-jVFX` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S3776` — typescript:S3776

Severity: CRITICAL: 1 · Type: CODE_SMELL: 1 · CleanCode: FOCUSED: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAutosave.ts` | L99 | Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed. | `AaCEjWnksgu35AS-jVFZ` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `shelldre:S7688` — shelldre:S7688

Severity: MAJOR: 12 · Type: CODE_SMELL: 12 · CleanCode: CONVENTIONAL: 12 · 12 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/blank.sh` | L3 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `local:Use_'[['_instead_of_'['_for_conditional_tests._The_'[['_construct_is_safer_and_m/L3` | OPEN |
| `ai/chat.z.ai/scripts/delivery/deploy.sh` | L45 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjesgu35AS-jVFQ` | OPEN |
| `ai/chat.z.ai/scripts/delivery/deploy.sh` | L51 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjfsgu35AS-jVFR` | OPEN |
| `ai/chat.z.ai/scripts/delivery/deploy.sh` | L113 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjfsgu35AS-jVFS` | OPEN |
| `ai/chat.z.ai/scripts/delivery/deploy.sh` | L130 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjfsgu35AS-jVFT` | OPEN |
| `ai/chat.z.ai/scripts/delivery/prepare.sh` | L31 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjssgu35AS-jVFU` | OPEN |
| `ai/chat.z.ai/scripts/delivery/prepare.sh` | L36 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjssgu35AS-jVFV` | OPEN |
| `ai/chat.z.ai/scripts/delivery/prepare.sh` | L51 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWjssgu35AS-jVFW` | OPEN |
| `ai/chat.z.ai/scripts/delivery/unpack.sh` | L25 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWg-sgu35AS-jVFO` | OPEN |
| `ai/chat.z.ai/scripts/delivery/unpack.sh` | L32 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWg_sgu35AS-jVFP` | OPEN |
| `ai/chat.z.ai/scripts/delivery/unpack.sh` | L44 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCEjWg-sgu35AS-jVFO` | OPEN |
| `ai/chat.z.ai/scripts/delivery/unpack.sh` | L48 | Use '[[' instead of '[' for conditional tests. The '[[' construct is safer and more feature-rich. | `AaCIU_oTsmsHQ2vn3UJM` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S8786` — typescript:S8786

Severity: MAJOR: 10 · Type: CODE_SMELL: 10 · CleanCode: EFFICIENT: 10 · 10 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useTitle.ts` | L30 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCEjWoPsgu35AS-jVFe` | OPEN |
| `src/composables/useTitle.ts` | L32 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCEjWoPsgu35AS-jVFg` | OPEN |
| `src/composables/useTitle.ts` | L34 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCIU_yesmsHQ2vn3UJN` | OPEN |
| `src/utils/geniusExtractor.ts` | L104 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaCC2RPU3vu4aE8Mnjr2` | OPEN |
| `src/utils/lrcParser.ts` | L72 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk2IDk5q6SaK23Im` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Io` | OPEN |
| `src/utils/pasteHandlers.ts` | L24 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ip` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Ir` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23It` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Simplify this regular expression to reduce its runtime, as it has super-linear performance due to backtracking. | `AaB4pk4RDk5q6SaK23Iv` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `shelldre:S7679` — shelldre:S7679

Severity: MAJOR: 7 · Type: CODE_SMELL: 7 · CleanCode: CLEAR: 7 · 7 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/zcode/transcript.sh` | L37 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L37` | OPEN |
| `ai/zcode/transcript.sh` | L76 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L76` | OPEN |
| `ai/zcode/transcript.sh` | L93 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L93` | OPEN |
| `ai/zcode/transcript.sh` | L104 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L104` | OPEN |
| `ai/zcode/transcript.sh` | L106 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L106` | OPEN |
| `ai/zcode/transcript.sh` | L109 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L109` | OPEN |
| `ai/zcode/transcript.sh` | L117 | Assign this positional parameter to a local variable. | `local:Assign_this_positional_parameter_to_a_local_variable/L117` | OPEN |

---

## Rule: `Web:S6819` — Web:S6819

Severity: MAJOR: 5 · Type: CODE_SMELL: 5 · CleanCode: CONVENTIONAL: 5 · 5 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/HotkeyCell.vue` | L33 | Use <button> or <input> instead of the button role to ensure accessibility across all devices. | `local:Use_button_or_input_instead_of_the_button_role_to_ensure_accessibility_across_al/L33` | OPEN |
| `src/components/LeftPanel.vue` | L76 | Use <input> instead of the slider role to ensure accessibility across all devices. | `local:Use_input_instead_of_the_slider_role_to_ensure_accessibility_across_all_devices/L76` | OPEN |
| `src/components/LeftPanel.vue` | L82 | Use <input> instead of the slider role to ensure accessibility across all devices. | `local:Use_input_instead_of_the_slider_role_to_ensure_accessibility_across_all_devices/L82` | OPEN |
| `src/components/LeftPanel.vue` | L149 | Use <input> instead of the slider role to ensure accessibility across all devices. | `AaB5FcWM50elM9qDQH86` | OPEN |
| `src/components/LeftPanel.vue` | L151 | Use <input> instead of the slider role to ensure accessibility across all devices. | `AaB5FcWM50elM9qDQH86` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `shelldre:S7682` — shelldre:S7682

Severity: MAJOR: 5 · Type: CODE_SMELL: 5 · CleanCode: LOGICAL: 5 · 5 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/chat.z.ai/scripts/build.sh` | L2 | Add an explicit return statement at the end of the function. | `local:Add_an_explicit_return_statement_at_the_end_of_the_function/L2` | OPEN |
| `ai/chat.z.ai/scripts/onboard.sh` | L2 | Add an explicit return statement at the end of the function. | `local:Add_an_explicit_return_statement_at_the_end_of_the_function/L2_2` | OPEN |
| `ai/chat.z.ai/scripts/review.sh` | L2 | Add an explicit return statement at the end of the function. | `local:Add_an_explicit_return_statement_at_the_end_of_the_function/L2_3` | OPEN |
| `ai/chat.z.ai/scripts/skills.sh` | L2 | Add an explicit return statement at the end of the function. | `local:Add_an_explicit_return_statement_at_the_end_of_the_function/L2_4` | OPEN |
| `ai/chat.z.ai/scripts/test.sh` | L2 | Add an explicit return statement at the end of the function. | `local:Add_an_explicit_return_statement_at_the_end_of_the_function/L2_5` | OPEN |

---

## Rule: `Web:S7927` — Web:S7927

Severity: MAJOR: 2 · Type: CODE_SMELL: 2 · CleanCode: CLEAR: 2 · 2 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/MenuBar.vue` | L116 | The accessible name should be part of the visible label. | `local:The_accessible_name_should_be_part_of_the_visible_label/L116` | OPEN |
| `src/components/MenuBar.vue` | L118 | The accessible name should be part of the visible label. | `AaB45xMSBD7wArG_suY0` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `css:S4666` — css:S4666

Severity: MAJOR: 2 · Type: CODE_SMELL: 2 · CleanCode: LOGICAL: 2 · 2 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/style.css` | L146 | Duplicate selector ":root", first used at line 68 | `local:Duplicate_selector_root,_first_used_at_line/L146` | OPEN |
| `src/style.css` | L159 | Duplicate selector ".dark", first used at line 104 | `local:Duplicate_selector_.dark,_first_used_at_line/L159` | OPEN |

---

## Rule: `githubactions:S8233` — githubactions:S8233

Severity: MAJOR: 2 · Type: VULNERABILITY: 2 · CleanCode: TRUSTWORTHY: 2 · 2 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `.github/workflows/deploy.yml` | L20 | Move this write permission from workflow level to job level. | `local:Move_this_write_permission_from_workflow_level_to_job_level/L20` | OPEN |
| `.github/workflows/deploy.yml` | L21 | Move this write permission from workflow level to job level. | `local:Move_this_write_permission_from_workflow_level_to_job_level/L21` | OPEN |

---

## Rule: `typescript:S7721` — typescript:S7721

Severity: MAJOR: 2 · Type: CODE_SMELL: 2 · CleanCode: EFFICIENT: 2 · 2 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/usePanelCollapse.ts` | L30 | Move function 'setExpandRef' to the outer scope. | `local:Move_function_'setExpandRef'_to_the_outer_scope/L30` | OPEN |
| `src/composables/usePanelCollapse.ts` | L33 | Move function 'setCollapseRef' to the outer scope. | `local:Move_function_'setCollapseRef'_to_the_outer_scope/L33` | OPEN |

---

## Rule: `Web:InputWithoutLabelCheck` — Web:InputWithoutLabelCheck

Severity: MAJOR: 1 · Type: BUG: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/components/SecondaryField.vue` | L43 | Add an "id" attribute to this input field and associate it with a label. | `local:Add_an_id_attribute_to_this_input_field_and_associate_it_with_a_label/L43` | OPEN |

---

## Rule: `githubactions:S6505` — githubactions:S6505

Severity: MAJOR: 1 · Type: VULNERABILITY: 1 · CleanCode: TRUSTWORTHY: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `.github/workflows/deploy.yml` | L40 | Omitting "--ignore-scripts" allows lifecycle scripts to run during package installation. | `local:Omitting_--ignore-scripts_allows_lifecycle_scripts_to_run_during_package_install/L40` | OPEN |

---

## Rule: `githubactions:S7631` — githubactions:S7631

Severity: MAJOR: 1 · Type: VULNERABILITY: 1 · CleanCode: TRUSTWORTHY: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `.github/workflows/sync-staging.yml` | L64 | Make sure that no untrusted code is executed from a fork. | `local:Make_sure_that_no_untrusted_code_is_executed_from_a_fork/L64` | OPEN |

---

## Rule: `githubactions:S8264` — githubactions:S8264

Severity: MAJOR: 1 · Type: VULNERABILITY: 1 · CleanCode: TRUSTWORTHY: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `.github/workflows/deploy.yml` | L19 | Move this read permission from workflow level to job level. | `local:Move_this_read_permission_from_workflow_level_to_job_level/L19` | OPEN |

---

## Rule: `shelldre:S1066` — shelldre:S1066

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `ai/zcode/transcript.sh` | L94 | Merge this if statement with the enclosing one. | `local:Merge_this_if_statement_with_the_enclosing_one/L94` | OPEN |

---

## Rule: `typescript:S6557` — typescript:S6557

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/utils/geniusExtractor.ts` | L35 | Use the 'String#endsWith' method instead. | `AaCC2RPU3vu4aE8Mnjrz` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6661` — typescript:S6661

Severity: MAJOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CONVENTIONAL: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAppState.ts` | L68 | Use an object spread instead of `Object.assign` eg: `{ ...foo }`. | `AaCDPDhshoGEu_MZKhps` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6594` — typescript:S6594

Severity: MINOR: 9 · Type: CODE_SMELL: 9 · CleanCode: EFFICIENT: 9 · 9 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useTitle.ts` | L30 | Use the "RegExp.exec()" method instead. | `AaCEjWoPsgu35AS-jVFd` | OPEN |
| `src/composables/useTitle.ts` | L32 | Use the "RegExp.exec()" method instead. | `AaCEjWoPsgu35AS-jVFf` | OPEN |
| `src/utils/geniusExtractor.ts` | L123 | Use the "RegExp.exec()" method instead. | `AaCC2RPU3vu4aE8Mnjr4` | OPEN |
| `src/utils/lrcParser.ts` | L72 | Use the "RegExp.exec()" method instead. | `AaB4pk2IDk5q6SaK23Il` | OPEN |
| `src/utils/pasteHandlers.ts` | L21 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23In` | OPEN |
| `src/utils/pasteHandlers.ts` | L35 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iq` | OPEN |
| `src/utils/pasteHandlers.ts` | L39 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Is` | OPEN |
| `src/utils/pasteHandlers.ts` | L48 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iu` | OPEN |
| `src/utils/pasteHandlers.ts` | L51 | Use the "RegExp.exec()" method instead. | `AaB4pk4RDk5q6SaK23Iw` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S6606` — typescript:S6606

Severity: MINOR: 7 · Type: CODE_SMELL: 7 · CleanCode: CONVENTIONAL: 7 · 7 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

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

## Rule: `typescript:S6582` — typescript:S6582

Severity: MINOR: 4 · Type: CODE_SMELL: 4 · CleanCode: CLEAR: 4 · 4 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAudio.ts` | L290 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCEjWoCsgu35AS-jVFc` | OPEN |
| `src/composables/useAutosave.ts` | L114 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCEjWnksgu35AS-jVFa` | OPEN |
| `src/composables/useTitle.ts` | L36 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCEjWoPsgu35AS-jVFh` | OPEN |
| `src/composables/useTitle.ts` | L38 | Prefer using an optional chain expression instead, as it's more concise and easier to read. | `AaCEjWoPsgu35AS-jVFi` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S4138` — typescript:S4138

Severity: MINOR: 3 · Type: CODE_SMELL: 3 · CleanCode: CONVENTIONAL: 3 · 3 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAutosave.ts` | L88 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCEjWnksgu35AS-jVFY` | OPEN |
| `src/composables/useModeSwitch.ts` | L100 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCEjWnxsgu35AS-jVFb` | OPEN |
| `src/utils/geniusExtractor.ts` | L122 | Expected a `for-of` loop instead of a `for` loop with this simple iteration. | `AaCC2RPU3vu4aE8Mnjr3` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7755` — typescript:S7755

Severity: MINOR: 2 · Type: CODE_SMELL: 2 · CleanCode: CONVENTIONAL: 2 · 2 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/utils/geniusExtractor.ts` | L51 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr0` | OPEN |
| `src/utils/geniusExtractor.ts` | L70 | Prefer `.at(…)` over `[….length - index]`. | `AaCC2RPU3vu4aE8Mnjr1` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7744` — typescript:S7744

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: CLEAR: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAppState.ts` | L73 | The empty object is useless. | `AaCIU_zLsmsHQ2vn3UJO` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---

## Rule: `typescript:S7784` — typescript:S7784

Severity: MINOR: 1 · Type: CODE_SMELL: 1 · CleanCode: EFFICIENT: 1 · 1 instance(s)

### Why
(no `why.md` content was present in the local export)

### How to fix
(no `how.md` content was present in the local export)

### Instances

| File | Line | Message | Key | Status |
|------|------|---------|-----|--------|
| `src/composables/useAppState.ts` | L60 | Prefer `structuredClone(…)` over `JSON.parse(JSON.stringify(…))` to create a deep clone. | `AaCDPDhshoGEu_MZKhpr` | OPEN |

Deep links: `https://sonarcloud.io/project/issues?open=<KEY>&id=amokprime_linebyline`

---
