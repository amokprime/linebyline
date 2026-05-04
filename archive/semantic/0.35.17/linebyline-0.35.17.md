# LineByLine 0.35.17

## SonarQube fixes: medium severity — mechanical substitutions + nested ternary flattening

### My prompt
(Full Prompt.md contents)

### Version
Patch

### Bugs
- You substituted version dots with spaces. Does that (or any other) part of my project instructions need to be rewritten?
- Plan changes for latest round of SonarQube Cloud recommendations in issues.zip, medium severity

---

**Version dots in `present_files`:** The dots-to-spaces substitution is the `present_files` tool's cosmetic label rendering, not a build error. The HTML file is named correctly with dots (`linebyline-0.35.17.html`). No project instruction rewrite needed.

**Issues planned and resolved:**

**S7773 — Prefer `Number.*` static methods (13 instances fixed)**
All bare `parseFloat(` → `Number.parseFloat(` (6 instances), `parseInt(` → `Number.parseInt(` (4 instances), `isNaN(` → `Number.isNaN(` (3 instances). Global substitution across the file.

**S7762 — Prefer `.remove()` over `parentNode.removeChild()` (1 instance)**
`document.body.removeChild(a)` → `a.remove()` in `doSave`.

**S6661 — Prefer object spread over `Object.assign({}, ...)` (2 instances fixed, 1 Won't Fix)**
- `Object.assign({}, DEFAULT_CFG.hotkeys, d.hotkeys||{})` → `{...DEFAULT_CFG.hotkeys,...(d.hotkeys||{})}` in `loadCfg`
- `Object.assign({}, d.hotkeys)` → `{...d.hotkeys}` in `loadAutosave`
- `Object.assign(c, d)` (mutating form) left as-is — spread would create a new object and break the downstream reference chain

**S3358 — Flatten nested ternaries (all instances)**
- Secondary field paren-wrap map callbacks (2 identical instances in paste and import): extracted inner ternary into a named `const t` for the `.trim()` result
- `hk[key]==='Escape'?'Esc':(hk[key]||'—')` used in 4 `cell.innerHTML` templates in `buildControls`: extracted `function _hkDisp(v)` helper defined at top of Controls section
- `k==='Escape'?'Esc':k===' '?'Space':k.length===1?k.toUpperCase():k` used in `_handleSettingsSearchKeydown`, `buildHkRows` capture handler, and `keyStr`: extracted `function _normKey(k)` helper defined at top of Settings search section. This also cleans up the previously two-level ternary in `keyStr`
- `curPos<0?(e.key==='PageUp'?nonMeta.length-1:0):curPos` in `_handleHotkeyModeKeys` PageUp/Down handler: split to `let base=curPos; if(base<0)base=...`

**Won't Fix / deferred:**
- S2681 (braceless `if` one-liners, 14 flags): all intentional; adding braces to every one-liner would bulk the file with no functional gain
- S2310 (assignment in condition, 1 flag): false positive — flagged line is an assignment inside a loop body, not a condition
- S6660 (`else{if}` → `else if`, 1 flag): false positive against old deployed file line numbers; current `_applySeekForPlay` already uses `else if` correctly
- Web:S6819 (`<dialog>` instead of `role="dialog"`): architectural HTML change requiring `showModal()`/`close()` rewiring and CSS adjustments; deferred

SECTIONS index updated (Settings search~1928, Confirm~2273, Keyboard~2309, Key norm~2310, Main textarea KD~2318, Overlay utils~2373, Global KD~2509, Unload~2531, Button wiring~2537, Init~2556).

---

**Affected checklist items:** none — no functional changes.
