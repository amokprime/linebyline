# LineByLine — web chat agent instructions (chat.z.ai)

These are the agent project instructions, tailored for the chat.z.ai web-channel sandbox. It covers information that is not obvious from the provided Repomix archive.

## Repomix context — read these notes first

- Anything in `.gitignore` is dropped from the packed file contents, **but** the `<directory_structure>` tree summary still lists those paths. A path appearing in the tree does not guarantee its contents are in the pack — if the agent needs a file that isn't in the pack, ask the user to re-export or paste it.
- The tree is a snapshot at generation time; the live repo may have moved. When in doubt, confirm with the user.
- Binary files (images, Playwright snapshots) are never packed — only their paths appear in the tree.
- The Repomix file tree somewhat overlaps with the project-structure section below; the tree gives current paths, the section below explains what each directory is *for*.

## Project structure

- `/` — Project docs for humans (`CONTRIBUTING.md`, `HELP.md`, `README.md`, `LIMITATIONS.md`, `SECURITY.md`, `CREDITS.md`). Evaluate for stale references when the relevant area changes.
- `.github/` — Issue templates and GitHub Actions workflows (`codeql.yml`, `playwright.yml`, `sonarcloud.yml`, `deploy.yml`).
- `ai/` — Vibecoding instructions and tools for humans.
  - `chat.z.ai/` — This web chat workflow (the live copy).
  - `claude.ai/` — Abandoned web chat workflow.
  - `omp/`, `zcode/` — Other harness setup docs (not used by the web agent).
- `archive/` — AI chat transcripts for app code building sessions, plus Sonar issue exports under `archive/semantic/<version>/issues/`.
- `docs/` — `index.html` single-file LineByLine app code (the live monolith, pre-modular-refactor).
- `src/` — Modular Vite + Vue + Tailwind + shadcn-vue app (refactor in progress; see `archive/modular/plan/0-Roadmap.md`).
- `tests/` — Playwright test suite and supporting docs.
- `scratch/` — gitignored scratch directory.

## Coding and testing

- Don't put large comment blocks in code files. Separate documentation from source.
- Documentation and context files should never be dense, minified walls of text.
- Fence code snippets in markdown documentation. Short inline references like `variableName` or `npm run dev` are fine as inline backticks; longer code fragments, URLs with query params, and multi-line examples should be fenced — bare inline code either spills (Obsidian syntax-highlighting with no closing tag) or gets rendered as an embedded element hiding the source (with closing tag).
- Fence strings with certain special characters when the following Obsidian behaviors are not desired:
	- `#audio-box`: tag "audio-box", displays as pill
	- `[blah]` -> Markdown link label with no URL, syntax highlighted anyway
	- `[[blah]]` -> Wikilink to note "blah.md"
- Suggest new Playwright tests to cover new app features, but the user runs them — the agent writes the test code, the user executes and reports back.

## Running LineByLine tests

- The full Playwright suite (~540 tests, ~7 min, with snapshot data) is too heavy to upload and run inside the web sandbox — the snapshot data alone would overwhelm context. The user runs tests locally via `tst` and uploads results.
- If the agent needs to verify a change, it writes the test code and asks the user to run a scoped pattern (e.g. `tst -g <pattern>`) and paste the output. Prefer batching such requests or bundling them alongside other output to avoid excessive back-and-forth turns.
- The agent may write and run small standalone scripts (unit-level logic checks, data transforms) inside the sandbox to validate reasoning without needing the full Playwright harness.
- The Vitest unit suite (`tests/unit/*.test.ts`, ~103 specs) is lightweight enough to run in-sandbox when the Build Repomix includes `src/**` and `tests/unit/**`. Run `npm install && npm run test:unit` after patching `src/` modules. This gives a fast feedback loop for pure-logic regressions but does not cover DOM interaction or Playwright-level concerns.

## SonarCloud

- The project is public — the sandbox can enumerate open issues directly via the JSON API (no auth needed for public projects). Use Python `urllib` (not the web reader tool — its URL validator rejects some query strings and the SPA pages render nothing for a static reader).
  - **Main branch** (long-standing findings on `main`): `https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&issueStatuses=OPEN`
  - **PR staging** (new-code findings on the current staging→main PR): `https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&pullRequest=N&issueStatuses=OPEN`
- The agent can triage directly from the returned JSON — no need for the user to export and upload. See the `sonarqube-workflow` skill for the full sandbox API protocol (facets for first-pass counts, rule filtering, pagination, the auth-required endpoints to avoid).
- **Auth boundary**: issue enumeration, facets, and rule filtering work unauthenticated. Rule metadata (`api/rules/show` — the `why`/`how` content) and single-issue lookup by key require auth — for rule rationale, the user still exports locally via `sonar-export` and uploads.
- Exported issue JSONs (when the user does export locally) are folded into `archive/semantic/<version>/issues/<issue-name>/`.
- **Gotcha**: closed issues have `line: null` in the API response (and appear as `Lunknown.json` in local exports) — check `status`/`resolution` before triaging, since closed issues can masquerade as fresh findings.

## If a test fails or something looks off

- The user reproduces failures locally and uploads the output. The agent diagnoses from the pasted output, proposes a fix, and the user applies and re-runs.
