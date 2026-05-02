# LineByLine 0.35.18 Build Notes

## Session prompt

Plan changes for latest round of SonarQube Cloud recommendations in `issues.zip`, low severity. Version as patch.

---

Planning pass: read all issue files in full. Identified 6 rule categories across about 25 flagged locations in `docs/index.html` (0.35.13). Mapped each to 0.35.17 equivalents before patching.

**for-of loop assessment (5 flagged, 3 skipped):**

- Line 597 (`_restoreSecondaryPool`): converted — values only, index not needed
- Line 660 (`applyMode`): skipped — loop accumulates `charCount` positionally, index indispensable
- Line 869 (`_findGeniusLyricBounds`): skipped — assigns `end=i` on break, index is the output
- Line 905 (`_filterYmal`): converted — values only, index not needed
- Line 1319 (`_assignInterpolatedTs`): skipped — reads/writes `out[i]` by index throughout, and mutates `i` at end to skip processed runs

**String.raw false positive (1 skipped):** `ALPHA_NUM_SPACE_RE` is a regex literal, not a string. `String.raw` does not apply to regex literals. Skipped.

**Negated condition at index.html line 1210:** No `else` clause in 0.35.17 equivalent — not a valid flag. Skipped.

**replaceAll candidates at index.html lines 1536 and 1690:** Both patterns use regex quantifiers (`\n{3,}`) or character classes (`[/\\:*?"<>|]`) that cannot be expressed as plain string arguments to `replaceAll`. The flag is not applicable. Skipped.

**Math.max ternary at index.html line 2526:** The flagged expression (`base=e.key==='PageUp'?nonMeta.length-1:0`) is not a min/max pattern — it is a conditional default assignment. The adjacent `Math.max`/`Math.min` calls on the following line are already correct. False positive. Skipped.

---

## Session prompt

Continue

---

Applied all actionable SonarQube fixes to 0.35.17, producing 0.35.18. Changes by rule:

**S6353 — Use `\d` instead of `[0-9]`:**
- `ALPHA_NUM_SPACE_RE`: `[0-9]` replaced with `\d`

**S7784 — Prefer `structuredClone` over `JSON.parse(JSON.stringify(…))`:**
- `loadCfg`: three occurrences replaced (`!s` return, `c=` initialisation, `catch` return)
- `_doResetDefaults`: one occurrence replaced

**S2486 — Handle exception or don't catch at all (empty catch):**
- Three `try{audioEl.volume=…}catch(_){}` blocks: added `/* read-only in some browser contexts */` comment to document intentional suppression

**S4138 — Prefer for-of:**
- `_restoreSecondaryPool`: `for(let i=vis;…)` converted to `for(const entry of secondaryPool.slice(vis))`
- `_filterYmal`: `for(let i=0;…)` converted to `for(const line of lyricLines)`, local variable renamed from `lyricLines[i]` to `line`

**S7770 — Prefer native coercion function (`Boolean`) directly:**
- `extractGeniusMeta`: `.filter(l=>l)` replaced with `.filter(Boolean)`

**S7781 — Prefer `String#replaceAll()`:**
- `normalizeLrcTimestamps`: `.replace(/…/g,…)` converted to `.replaceAll(/…/g,…)` (regex with backreferences retained; `replaceAll` accepts regex with `g` flag)
- Lines 1536/1690 skipped (see planning notes above)

**S7773 — Prefer `Number.parseInt`/`Number.parseFloat`/`Number.isNaN`:**
All instances already used `Number.*` forms in 0.35.17. No changes needed.

**S7748 — No zero fractions:**
- `DEFAULT_CFG.speed_ratio`: `1.10` → `1.1`
- `loadCfg` migration guard: `1.10` → `1.1`
- `currentSpeed` initialisation: `1.0` → `1` (3 occurrences: declaration, `setupAudio`, `changeSpeed`)
- `audioEl.playbackRate=1.0` → `audioEl.playbackRate=1` (in `setupAudio`)
- `cfg.speed_ratio||1.10` → `cfg.speed_ratio||1.1`
- `speed_ratio??1.10` → `speed_ratio??1.1`
- `value||1.10` → `value||1.1`
- HTML `value="1.10"` attribute on `#s-speed-ratio` input: left as-is (UI display string, not a JS number literal)

**S7735 — Unexpected negated condition:**
- `index.html` line 1210 (`vol-slider` handler): no `else` clause in 0.35.17 — not applicable, skipped
- `markAsTranslation` `if(!hotkeyMode){…}else{…}`: inverted to `if(hotkeyMode){…}else{…}` with branches swapped

**S7784 structuredClone / S7780 String.raw / S7766 Math.max ternary / S7735 line 1210:** See planning notes for skips.

Syntax check: passed (`new Function(scriptContent)`).

## Checklist items affected

- [x] Toggle Hotkey/Typing mode with `` ` `` and button
- [x] `Ctrl+ArrowLeft` mark as translation works correctly in both modes
