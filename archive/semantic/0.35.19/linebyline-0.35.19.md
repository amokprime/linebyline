# LineByLine 0.35.19 — Build Log

## Changes from 0.35.18

Pure SonarQube quality pass. No functional changes. No checklist file required.

---

## Turn 1

### Prompt

> Another round of SonarQube Cloud reports — version as patch.

---

### Response

Processed issues.zip containing 24 findings across 6 rule categories.

**Findings summary and disposition:**

| Rule  | ID                           | Line(s)                                                      | Title                                                                         | Action                                                                                       |
| ----- | ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| S7721 | Move function to outer scope | 1495                                                         | `_handleSecKeydown` declared inside `addSecondary`                            | **Fixed**                                                                                    |
| S2681 | Braceless if                 | 1083                                                         | `if(audioEl)audioEl.playbackRate=1;` followed by unconditional statement      | **Fixed**                                                                                    |
| S2681 | Braceless if                 | 2394                                                         | `if(!settingsOpen)openSettings();` inside `_handleSettingsKeys`               | **Fixed**                                                                                    |
| S2681 | Braceless if                 | 1764                                                         | `_hkDisp`: `return` after `if` is a separate statement                        | Won't Fix — false positive                                                                   |
| S2681 | Braceless if                 | 1929 (x2)                                                    | `_normKey`: two early-return `if`s on one line                                | Won't Fix — false positive                                                                   |
| S2681 | Braceless if                 | 2389                                                         | `if(settingsOpen)closeSettings();else openSettings();` is inside outer braces | Won't Fix — false positive                                                                   |
| S7744 | Empty object is useless      | 501                                                          | `d.hotkeys\|\|{}` — `{}` is a required spread fallback                        | Won't Fix — false positive; removing it would crash the spread when `d.hotkeys` is undefined |
| S2310 | Loop counter reassignment    | 1349                                                         | `i=runEnd` inside `_assignInterpolatedTs` for loop                            | Won't Fix — intentional skip-ahead to avoid reprocessing already-assigned lines              |
| S2486 | Empty catch                  | 507                                                          | `}catch(e){return structuredClone(DEFAULT_CFG);}`                             | Won't Fix — not empty; returns meaningful fallback on parse failure                          |
| S2486 | Empty catch                  | 959, 1049, 1126                                              | `catch(_){/* read-only in some browser contexts */}`                          | Won't Fix — comments added in v0.35.18; suppression already documented                       |
| S3776 | Cognitive Complexity         | 468, 844, 905, 944, 1327, 1353, 2014, 2332, 2377, 2414, 2436 | Various functions at 17–63 CC                                                 | Deferred — large-scope structural refactors out of scope for patch release                   |

**Patches applied:**

1. **S7721 — `_handleSecKeydown` moved to outer scope**
   - Extracted from inside `addSecondary()` to a named top-level function before it.
   - References only outer-scope identifiers (`HOTKEY_ONLY`, `keyStr`, `cfg`) — safe to move.
   - `le.addEventListener('keydown', _handleSecKeydown)` unchanged; function is shared across all secondary instances correctly (each event carries its own `e`).

2. **S2681 — `setupAudio` braceless if (line 1083)**
   - `if(audioEl)audioEl.playbackRate=1;document.getElementById('speed-val').value='1';`
   - Changed to `if(audioEl){audioEl.playbackRate=1;}` so `document.getElementById(...)` is clearly unconditional.

3. **S2681 — `_handleSettingsKeys` inner braceless if (line 2394)**
   - `if(!settingsOpen)openSettings();showResetConfirm();`
   - Changed to `if(!settingsOpen){openSettings();}showResetConfirm();` to clarify `showResetConfirm()` always runs.

**SECTIONS index updated:** Settings~1862 (was 1861; +1 line from S7721 fix indentation normalisation).

**Syntax check:** `new Function(scriptContent)` — OK.
