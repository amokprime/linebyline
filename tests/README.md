---
model: GLM-5.3-Flash
provider: https://chat.z.ai
start: 2026-11-24
---
This directory has the automated test suites for LineByLine. The app is a Vite + Vue application in `src/`. Both suites run against the Vite build only.
## Documents in this directory
- `MANUAL.md` — manual checks that Playwright cannot do. Run them in a real browser before a release.
- `PLAYWRIGHT_SETUP.md` — the user-side workflow: run the suite on a second machine with SSH, Syncthing, and Podman (`tst`).
- `SSH_SETUP.md` — the Server SSH keys: the human master key and the restricted agent key.
- `archive/tests/FAILURES.md` — failure history per tranche (moved out of tests/ Nov 25, 2026 — pre-TS-conversion era closed).
- `README.md` — this file.
## Run the tests
```bash
npm run build          # build dist/ first; the tests serve this build
npx playwright test    # full Playwright suite (all projects)
npm run test:unit      # Vitest unit suite
```

- The Playwright config starts `vite preview` on port 5173 and serves `dist/`. You do not start a server yourself.
- Scope a run to one file or one browser:
```bash
npx playwright test tests/reset.spec.ts --project=chromium
```

- `CI=1` sets workers=1, retries=2, and `forbidOnly`. `PW_CONTAINER=1` or `CI=1` also adds the webkit project (see `playwright.config.ts`).
- Failed tests write traces and screenshots to `trash/`. Delete `trash/` at any time.
## The two suites
The suites are disjoint by file extension: the Playwright `testMatch` pattern collects only `*.spec.ts`, so Vitest files never enter the browser run.
- **Playwright** (`*.spec.ts`): drives the built app in a real browser. Asserts user-visible behavior, and also the mechanisms behind that behavior (see "Mechanism pins" below).
- **Vitest** (`unit/*.test.ts`): imports the `src/` modules directly. Pins pure logic and module behavior without a browser.
## Conventions
- Test names are kebab-case descriptions of the behavior, for example `reload-clears-lyrics-audio`.
- Snapshot mismatches show a diff in the report. Refresh snapshots with `npx playwright test --update-snapshots`, check the diff, then commit.
- `media/10k_lines.lrc` is large. Use it only in the manual test it was made for.
- Keep new Playwright helpers in `helpers/index.ts`. Keep new pure-logic tests in `unit/`.
## Layout

| Path | Purpose |
| --- | --- |
| `*.spec.ts` | Playwright suites (one file per feature area) |
| `*-snapshots/` | Screenshots and text snapshots for the adjacent spec file |
| `helpers/` | Shared test fixtures and helper functions |
| `media/` | Fixture files: LRC samples, audio, a Genius mock, naughty strings |
| `unit/` | Vitest files (TypeScript) |
| `spec-globals.d.ts` | Declares test-injected window properties (`__doSaveCalled`, `__saveCapture`) |
| `trash/` | Playwright failure artifacts (gitignored) |

## Helpers (`helpers/index.ts`)
Spec files import as `@linebyline/test-helpers`. The `helpers/package.json` file resolves that alias.

Fixtures (use them as test arguments):
- `page` — a page already at the app URL
- `media(filename)` — absolute path to a file in `media/`
- `readMedia(filename)` — contents of a `media/` file as a string
- `importSecondary(nth, filename)` — opens the nth import button and sets the file
- `workaroundPaste` — grants clipboard permissions and skips webkit (destructure it to activate)

Functions:
- `getAppUrl()` — returns `/` (the `vite preview` root)
- `waitForLyrics(page)` / `waitForAudio(page)` / `waitForImport(page)` — wait helpers for import states
- `tabUntilFocused(page, selector)` — presses Tab until the element has focus
- `beforeUnloadPrevented(page)` — pins the beforeunload dirty check (see below)

## Spec files

| File | Covers |
| --- | --- |
| `accessibility.spec.ts` | axe-core scans: landing page, lyrics view, settings dialog |
| `fields-merge.spec.ts` | Secondary fields: import, hide, replace, merge; merge state after reload |
| `import-paste.spec.ts` | File import and paste in hotkey and typing modes; save; import blocking |
| `intervals.spec.ts` | Large intervals; seek, speed, and volume increments; typing debounce |
| `key-guard.spec.ts` | Hotkey restriction in typing mode; key leak; repeat guard |
| `keyboard-nav.spec.ts` | Tab order; arrow navigation in settings; panel toggle |
| `mark.spec.ts` | Mark as translation; split parens; bracket and paren autocomplete |
| `playback.spec.ts` | Play/pause; seek by click, scroll, type, and drag; speed; volume; mute |
| `reset.spec.ts` | Reload clears state; new tab starts fresh; beforeunload dirty check |
| `settings.spec.ts` | Settings persistence after reload; dialog; search; key assign; reset |
| `smoke.spec.ts` | Title, version, favicon, landing elements, `window.doSave` exposure |
| `sync-adjust.spec.ts` | Sync line; adjust timestamp; replay; cursor and highlight follow |
| `theme-font.spec.ts` | Theme toggle; font family and size; stylesheet links |
| `typing-mode.spec.ts` | Typing-mode keystrokes: arrows, brackets, character keys |
| `undo-redo.spec.ts` | Undo/redo stacks; debounce timing for typed input |

## Mechanism pins
A test that asserts only an outcome can pass after you delete the code that produces the outcome. Before you deliver a behavioral test, ask: **does this test fail if I delete the source code that does the work?** If not, add an assertion that observes the mechanism directly: storage keys, `window.*` exposure, or event effects.

Examples from the Tranche 9 audit (see `ROADMAP.md` → Phase E Tranche 9):
- `reset.spec.ts` checks `sessionStorage.getItem("lbl_autosave")` before and after a reload. The null value after reload is the direct effect of the `removeItem` call in `App.vue`.
- `reset.spec.ts` → `new-tab-starts-fresh` opens the new page in the same context (`page.context().newPage()`). A new tab shares `localStorage` with the first tab, so the test can detect a leak of lyric text into `localStorage`.
- `fields-merge.spec.ts` → `merge-block-reload` calls `beforeUnloadPrevented(page)` after a merge. A synthetic `F5` keydown does not reload a page (the browser, not the page, handles the F5 key press). The pin checks the actual protection: the beforeunload warning.

### Mutation testing
Before you write a new behavioral test, mutation-test it:
1. Revert the source change with `sed` (or edit by hand).
2. Run `npm run build`. Check that the build succeeds.
3. Run the test. The test must FAIL.
4. Restore the source. Run `npm run build`. The test must pass.

If the test passes with the change reverted, the test does not pin the mechanism. Rewrite it with a stronger assertion. The full procedure, the verdict traps, and the `beforeUnloadPrevented` pattern are in `skills/playwright-testing/SKILL.md`.
