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
- Fence code snippets in markdown documentation, including agent context files like this one and `MEMORY.md`. Short inline references like `variableName` or `npm run dev` or `<HTML tag>` are fine as inline backticks; longer code fragments, URLs with query params, and multi-line examples should be fenced in codeblocks — bare inline code either spills (Obsidian syntax-highlighting with no closing HTML tag) or gets rendered as an embedded element hiding the source (with closing HTML tag).
- Inline fence strings with certain special characters when the following Obsidian behaviors are not desired:
        - `#audio-box`: tag "audio-box", displays as pill
        - `[blah]` -> Markdown link label with no URL, syntax highlighted anyway
        - `[[blah]]` -> Wikilink to note "blah.md"
- Suggest new Playwright tests to cover new app features, but the user runs them — the agent writes the test code, the user executes and reports back.

## Running LineByLine tests

- The full Playwright suite (~540 tests, ~7 min, with snapshot data) is too heavy to upload and run inside the web sandbox — the snapshot data alone would overwhelm context. The user runs tests locally via `tst` and uploads results.
- If the agent needs to verify a change, it writes the test code and asks the user to run a scoped pattern (e.g. `tst -g <pattern>`) and paste the output. Prefer batching such requests or bundling them alongside other output to avoid excessive back-and-forth turns.
- The agent may write and run small standalone scripts (unit-level logic checks, data transforms) inside the sandbox to validate reasoning without needing the full Playwright harness.
- The Vitest unit suite (`tests/unit/*.test.ts`, ~103 specs) is lightweight enough to run in-sandbox when the Build Repomix includes `src/**` and `tests/unit/**`. Run `npm install && npm run test:unit` after patching `src/` modules. This gives a fast feedback loop for pure-logic regressions but does not cover DOM interaction or Playwright-level concerns.

## SonarCloud & CodeQL

- The user runs `sie` (the consolidated `sonar-issue-exporter` CLI, https://github.com/amokprime/sonar-issue-exporter) locally after each push and uploads the resulting Markdown report. The report combines SonarCloud issues and CodeQL code-scanning alerts in one file; the `#### Why` / `#### How to fix` blocks per rule are populated when `SONAR_API_KEY` is set (public-project issue enumeration works without a token; only the Why/How rationale is gated). CodeQL alerts require `gh auth login` locally — they are NOT available via the sandbox API at all.
- The sandbox cannot authenticate with GitHub or SonarCloud, so it cannot:
  - Fetch the SonarCloud rule Why/How rationale (`api/rules/show` requires auth).
  - Fetch CodeQL code-scanning alerts (the GitHub code-scanning endpoint requires auth).
  - Commit/push in an end-to-end build loop (no GitHub token in the sandbox).
  This means the `sie` report IS the canonical input — read it directly. The sandbox API is a fallback for the cases listed in the `sonarqube-workflow` skill Step 1.
- Sandbox API fallback (use only when `sie` is unavailable or for a quick staleness cross-check on a specific issue key). The project is public (`amokprime_linebyline`), so issue enumeration works unauthenticated via Python `urllib` (not the web reader tool — its URL validator rejects some query strings and the SPA pages render nothing for a static reader):
  - Main-branch OPEN issues: `https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&issueStatuses=OPEN`
  - PR-scoped OPEN issues (replace `N` with the open PR number): `https://sonarcloud.io/api/issues/search?componentKeys=amokprime_linebyline&pullRequest=N&issueStatuses=OPEN`
- See the `sonarqube-workflow` skill for: the `sie` report format, the full sandbox API protocol (facets for first-pass counts, rule filtering, pagination), and the auth-required endpoints to avoid.
- The `sie` report goes in `archive/semantic/<version>/issues.md` (auto-increments to `issues1.md`, `issues2.md`, …). Use `sie -c` / `--clean` to drop the licensed Sonar Why/How sections before committing to a GPL-3 repo.
- **Gotcha**: closed issues have `line: null` in the API response and show `Status: CLOSED` in the `sie` report — check `status`/`resolution` before triaging, since closed issues can masquerade as fresh findings if the user re-ran `sie` before their fix pushed.