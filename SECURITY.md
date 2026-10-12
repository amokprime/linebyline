# Security Policy

## Supported Versions

| Version                                                                                                     | ESLint, CodeQL     | SonarCloud         |
| ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ |
| [src/](https://github.com/amokprime/linebyline/tree/main/src) (modular Vue app, builds to `dist/`)          | :white_check_mark: | :white_check_mark: |
| [docs/index.html](https://github.com/amokprime/linebyline/blob/main/docs/index.html) (pre-cutover monolith) | :white_check_mark: | :white_check_mark: |
| [archive/semantic](https://github.com/amokprime/linebyline/tree/main/archive/semantic)                      | :x:                | :x:                |
| [archive/pre-semantic](https://github.com/amokprime/linebyline/tree/main/archive/pre-semantic)              | :x:                | :x:                |
| [tests/](https://github.com/amokprime/linebyline/blob/main/tests/)                                          | :white_check_mark: | :x:                |
**Architecture note (pre-cutover)**: `docs/index.html` is the live monolith on GitHub Pages. `src/` is the modular Vite + Vue app that will replace it after the Phase E cutover (see `ROADMAP.md`). Both are scanned by ESLint + CodeQL + SonarCloud. Post-cutover, `docs/index.html` will be deleted and `src/` → `dist/` (built by the `deploy.yml` GitHub Actions workflow, not committed) will be the live site.
## Reporting a Vulnerability
You can open a new [Issue](https://github.com/amokprime/linebyline/issues) or [report it privately](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/privately-reporting-a-security-vulnerability). There are many known [false positives](https://github.com/amokprime/linebyline/blob/main/SECURITY.md#false-positives) that boil down to these points:
1. LineByLine is an offline app. Loading the GitHub Page is basically the same as downloading index.html and opening it in a browser.
2. Scanners treat it like a website that stores and processes data server-side. SonarQube Cloud is especially spammy here. I'm using it more to check code quality (i.e. C.R.A.P.) as CodeQL already covers security.

I am not a cybersecurity professional or security researcher. What I can do about any [true positives](https://github.com/amokprime/linebyline/blob/main/SECURITY.md#true-positives):
1. Me asking AI - hopefully it's solved here🤷
2. GitHub account compromise - I change all my passwords
3. Code issue AI can't solve confined to recent version of the app - delete folder and commit
4. Code issue AI can't solve affecting most versions of the app - archive whole repo
## True positives
- SonarQube Cloud warning "Change this code to not construct the path from user-controlled data" (affects abandoned Python code)
    - Action: Moved [python_abandoned](https://github.com/amokprime/linebyline/blob/main/archive/python_abandoned) and [Python](https://github.com/amokprime/linebyline/blob/main/archive/pre-semantic/0_abandoned/Python) folders out of repo. Resolved.
    - LineByLine is a client-side web app — no Python runtime, no server-side processing. The abandoned Python port was removed to clean up the repo architecture.
## False positives
- [Semgrep](https://github.com/amokprime/linebyline/blob/main/security/Semgrep.md)/[Opengrep](https://github.com/amokprime/linebyline/blob/main/security/Opengrep.md) scans flag `html.security.audit.missing-integrity.missing-integrity`. Claude Sonnet 4.6 says it's a false positive so I'm just going to use `--exclude-rule html.security.audit.missing-integrity.missing-integrity` until I get supporting errors from another tool (i.e. Mozilla Observatory), or a human programmer or security researcher says it's a real problem
- [Mozilla Observatory](https://github.com/amokprime/linebyline/blob/main/security/Mozilla.pdf) scan flags Content Security Policy, X-Content-Type-Options, and X-Frame-Options. Again [Sonnet](https://github.com/amokprime/linebyline/blob/main/security/Mozilla.md) says it's not a problem so I'll ignore those for now.
- [CodeQL](https://github.com/amokprime/linebyline/blob/main/security/CodeQL.md) scan warned that Node.js 20 is deprecated and would be replaced with Node.js 24 starting June 2nd this year. I opted into it now.
- [SonarQube Cloud](https://github.com/amokprime/linebyline/blob/main/security/SonarQube.md) 
    - Denial of Service: "Make sure the regex used here, which is vulnerable to super-linear runtime due to backtracking, cannot lead to denial of service."
        - 548 cases that look like `text.match(/^\[ti:\s*(.+)\]/m)`
        - LineByLine is a client-side app. All processing happens in the user's browser.
    - Weak Cryptography: "Make sure that using this pseudorandom number generator is safe here."
        - 26 cases that look like `const DEFAULT_META = '[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: Genius, GeniusLyricsCopier, LineByLine]\n[by: contributor'+Math.floor(1000+Math.random()*9000)+']\n\n';`
        - This was used to append `[by: contributor 9124]` in early versions.
    - "Make sure not using resource integrity feature is safe here."
        - 3 cases that look like `<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">`
        - All three files are in `archive/pre-semantic/29/` which predated the GitHub Page and will not be deployed. 
            - The GitHub Page only ever deploys a copy of the latest `archive/semantic/` version that was QA tested and passed CodeQL
    - "Make sure not using "noopener" is safe here."
        - 58 cases that look like one of these:
            - `function openHelp({window.open('https://github.com/amokprime/linebyline/blob/main/HELP.md','_blank');}`
            - `if(hk.issues&&hkMatch(ks,hk.issues)){e.preventDefault();window.open('https://github.com/amokprime/linebyline/issues','_blank');return;}`
        - Those are pages for this repo.
    - `S8786` super-linear regex (×11 in `src/`): same DoS family as the 548-case `text.match` above, but in the modular `src/` port. Bounded by `MAX_LINES=500` — input size is capped, so super-linear backtracking can't run away.
    - `S6594` `.match` → `.exec` (×8 in `src/`): verbatim port from the monolith. Safe for non-global regexes (`.match` and `.exec` are equivalent when `g` flag is absent). Modernization belongs to the post-Phase-E cutover pass.
    - `S6606` `??=` nullish coalescing (×7 in `src/config.ts` `ensureDefaultHotkeys`): NOT equivalent — `??=` coalesces `null` too, but the code checks `=== undefined` explicitly (deliberately cleared hotkeys are `''`, not `null`/`undefined`). Converting would reset intentionally-cleared hotkeys on config load.
    - `S7755` `.at()` (×3 in `src/`): verbatim port. Safe, but diverges from the monolith's `arr[arr.length - 1]` style. Accept for now; modernize post-cutover.
    - `S4138` `for` with index (×1 in `src/utils/geniusExtractor.ts`): index used for lookahead (`head[i+1]`). `for-of` can't replace this pattern.
    - `S6819` custom slider role (×1 in `src/components/LeftPanel.vue` `#progress-wrap`): custom mousedown+drag+wheel interaction model that a native `<input type="range">` can't cover. Won't Fix — see `aria-accessibility-SKILL.md` Rule 1 documented exception.
    - `S7927` icon-only button (×1 in `src/components/MenuBar.vue` theme toggle): has `aria-label`. False Positive — the rule doesn't detect the label.
    - `S7631` fork-code in workflow (sync-staging.yml): hardened with a compare-API check (`repos/…/compare/main...$HEAD_SHA` must be `behind|identical`) before merging. Residual flag is Won't Fix — the workflow only merges verified main commits, never checks out or executes the event SHA.
    - `S7682` explicit return in shell functions (×5 in `scripts/*.sh`): Won't Fix for wrapper functions where the exit status is intentionally the last command's (e.g. a zip-and-copy wrapper that should propagate a zip failure). An explicit `return 0` would mask the failure.
## About the `security/` folder
The `security/` folder contains historical scanner outputs + AI analysis transcripts (Semgrep, Opengrep, Mozilla Observatory, CodeQL, SonarQube). These are point-in-time snapshots of what the scanners reported and how the findings were triaged — they are NOT maintained or updated retroactively. If a finding was resolved (e.g. the Python path-traversal true positive), the resolution is noted in `SECURITY.md` above, not by editing the historical transcript.

LineByLine is a client-side web app — no server-side processing, no telemetry, no keys, no payments. Most security scanner findings are false positives that assume a server-side deployment model (path traversal, SSRF, SQL injection, etc.). CodeQL + ESLint cover the real attack surface (XSS, supply-chain). SonarCloud is used primarily for code quality (cognitive complexity, code smells) rather than security — its security findings are triaged but most are marked Won't Fix with documented rationale in `sonarqube-workflow-SKILL.md`.

Dependabot alerts are handled case-by-case: if a dependency has a known fix, bump it; if the vulnerability doesn't affect LineByLine's attack surface (e.g. a dev-only tool), dismiss with rationale.

**Why not retroactively document resolved issues here?** The `security/` folder was created Apr 2026. Since then, many Sonar/CodeQL/Dependabot issues were resolved (S2083 taint analysis, S7630 workflow input injection, S7688 `[`→`[[`, Node 20 deprecation, etc.) but not added to `SECURITY.md` or `security/`. Retroactive documentation of every *resolved* issue would be theater for a client-side app with no exploitable attack surface — git history + `archive/semantic/*/issues.md` (the `sie` reports) are the archaeological record if needed. However, unique *false-positive* patterns (unexploitable due to client-side architecture, Won't Fix with a documented rationale) are added when they fit the existing categories — they help triage future scanner output efficiently. `SECURITY.md` documents only the durable dispositions a security researcher would need before opening a report; per-version Accept/Won't-Fix/False-Positive decisions live in `MEMORY.md` → "SonarQube / CodeQL dispositions (non-app-code)".
