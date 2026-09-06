---
model: GLM-5.2
---
Prioritized plan for future refactors, ordered to minimize long-term effort. Each item includes a high-level implementation plan covering the most critical steps a fresh chat session must know.

---

## Dependency Graph

```
1. Playwright CI ──────────────────────────────────┐
2. ESLint in Zed ──────────────────────────────────┤ (parallel)
                              ↓                     ↓
3. Modular Stack Refactor ←─(CI green, lint)───────┤
   (Vite + Vue + Tailwind + shadcn-vue)            |
                              ↓                     |
4. TypeScript Conversion ←──(modular files)────────┤
                              ↓                     |
5. Security/CC Remediation ←(stable arch)──────────┤
                              ↓                     |
6. UI Refactor ←────────────(everything stable)────┘
```

Items 1 and 2 can be done in parallel (or 1 first, then 2). Items 3→4→5→6 are sequential with real dependencies. Item 6 can begin partial work (DESIGN.md, icon research) while item 5 is in progress.

---

## 1. Playwright CI + Local Workflow

### Status: Implemented — CI only; the deploy workflow below is still planned (ships in item 3)
### Why First

Every subsequent refactor (modular stack, TypeScript, UI) will break things. You need automated verification before touching architecture. Right now the Playwright test suite is solid but only runs locally — CI catches regressions from pushes and PRs automatically.

### CI Workflow (`.github/workflows/ci.yml`)

- Triggers on push and PRs
- Ubuntu runner with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` (Node 20 removed from runners September 2026; this env var opts into Node 24 now)
- Steps: `npm ci` → `npx playwright install --with-deps` → `npx playwright test` (Chromium + Firefox + WebKit)
- Upload test results artifact on failure
- After modular refactor (item 3), tests point at the Vite built output served by a static server in CI instead of `docs/index.html`

### Deploy Workflow (`.github/workflows/deploy.yml`) — Planned, not yet created

Status as of Sep 2026: only `codeql.yml`, `playwright.yml`, and `sonarcloud.yml` exist. This workflow ships in item 3 (scaffold it in Phase A, wire the real cutover in Phase E). Note `playwright.yml` already triggers on push/PR to **both `main` and `staging`**, so CI covers staging work natively.

- Triggers on push to `main` after CI passes, plus `workflow_dispatch` so the Pages pipeline can be smoke-tested from `staging`
- `npm run build` → deploy `dist/` to GitHub Pages via `actions/deploy-pages` (OIDC tokens, no personal access token needed)
- Set Pages source to "GitHub Actions" in repo settings (not "Deploy from a branch")
- On tag push (`v*.*.*`): also build with `vite-plugin-singlefile` and attach the single HTML file to a GitHub Release

### Local Workflow

- `npm run dev` — Vite HMR server (live reload as you save; replaces the old workflow of copying to `docs/` and refreshing)
- `npm run preview` — serves the production build locally for pre-deploy verification
- Playwright UI mode stays local for writing/updating tests and regenerating snapshots
- Snapshot regen: `npx playwright test --update-snapshots` locally, never in CI

### Critical Things a Fresh Chat Must Know

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` env var required in all workflow files — CodeQL flagged Node 20 deprecation
	- Done in all three current workflows (codeql.yml, sonarcloud.yml, playwright.yml — the latter also pins `node-version: 24`)
- Firefox Playwright bug: context teardown after download events causes `Protocol error` — workaround documented in `playwright-testing-SKILL.md`
- `findLatestVersion()` in `tests/helpers/index.js` currently returns `/docs/index.html` (it originally scanned `archive/semantic/` and was repointed since this plan was written). During the modular refactor it must be updated again to point at the Vite build output
- All three browsers run in CI per preference; Firefox is the flakiest

---

## 2. ESLint in Zed

### Status: Implemented

### Why Second

It's a 30-minute setup that pays dividends immediately. Every subsequent coding session benefits from lint catches in-editor. Cheap to redo if config needs updating after the modular refactor.

### Setup

- ESLint 9+ with flat config (`eslint.config.js`)
- `@eslint/js` recommended rules + `eslint-plugin-sonarjs` for catching cognitive complexity issues in-editor (complements SonarQube Cloud scans)
- Zed picks up ESLint automatically — just enable the ESLint language server in settings
- Will be reconfigured twice later: once for TypeScript (item 4), once for the Vite/Vue project structure (item 3). This is expected and the interim value is worth it.

### After TypeScript Conversion

Swap `@eslint/js` → `typescript-eslint` with `@typescript-eslint/*` rules.

---

## 3. Modular Stack Refactor (Vite + Vue + Tailwind + shadcn-vue)

### Status: In progress — Phases A+B done 2026-09-06; Phases C-E pending

### Why Third

TypeScript conversion, component-library UI, and most security/maintainability fixes all assume a modular codebase. Doing them on a ~2850-line monolith (2835 lines as of Sep 2026) fights the architecture at every step. This is the biggest and riskiest change, so CI (item 1) and linting (item 2) must be in place first.

### Architecture Choice: Why Vue + shadcn-vue

- **Vite was built for Vue**: Evan You created both Vite and Vue. The integration is first-class, not an afterthought. `npm create vite@latest` with the Vue template works out of the box.
- **Theme swapping**: shadcn-vue uses the same CSS-variable-based theming as shadcn/ui. Copy a premade theme block from `ui.shadcn.com/themes` and paste it in. For runtime switching (user picks from multiple themes), it's a thin Vue composable. This is exactly the "quickly swap out theme with premade ones" goal.
- **Consistent icons**: shadcn-vue uses Lucide Vue (clean SVGs, same appearance on every OS). No more emoji that varies by platform.
- **Accessible components**: Radix Vue primitives (under shadcn-vue) handle keyboard navigation, focus trapping, and ARIA automatically. The custom Settings focus trap, `inert` management, and much of `aria-accessibility-SKILL.md` become the library's responsibility.
- **Single-file Releases**: `vite-plugin-singlefile` inlines all JS/CSS into one HTML file. Users still get a downloadable single-file artifact from GitHub Releases. The only limitation is external assets (images, fonts) aren't inlined — but LineByLine uses system fonts and inline SVG, so this is a non-issue.
- **Easier learning curve**: Vue Single File Components (`.vue` files) keep HTML, CSS, and JS together per component — closer to how LineByLine sections already work. The template syntax is more HTML-like than React's JSX. Vue's Composition API (`ref`, `computed`, `onMounted`, `watch`) maps directly to React hooks (`useState` → `ref`, `useEffect` → `onMounted`/`watch`, `useContext` → `provide`/`inject`).

### Phase A — Scaffold

Work happens on `staging` (repo convention for app code). As of Sep 2026 `staging` and `main` point at the same commit, so branch from `staging` and merge back when the scaffold is verified.

- Scaffold Vite + Vue + TypeScript into the repo root. `create-vite` won't scaffold into a non-empty directory non-interactively — generate into a temp dir and merge files up, keeping the existing `package.json` fields (`name`, `description`) and merging scripts/devDependencies
- **Don't flip `"type": "commonjs"` to `"module"` yet** — the Playwright test helpers and specs are CommonJS. Vite doesn't care (it bundles `vite.config.ts` independently of package type). Decide the ESM flip during item 4 when tests convert
- Install: `tailwindcss`, `@tailwindcss/vite` (Tailwind v4), `shadcn-vue` (`npx shadcn-vue@latest init`)
- Install: `vite-plugin-singlefile` for release builds
- Configure `vite.config.ts`: `base: '/linebyline/'` (project-pages path), singlefile plugin for release builds only
- Verify the scaffold builds and serves **locally**: `npm run build` → `npm run preview`. No Pages deploy happens in this phase
- Create `deploy.yml` with `workflow_dispatch` so the Pages pipeline is ready, but leave Pages settings untouched for now

**Why not deploy from staging now:** GitHub Pages is one site per repo (`https://amokprime.github.io/linebyline/`). Today it is a legacy branch deploy serving `main:/docs`. A `deploy-pages` run from any branch — staging included — *would* work, but it repoints the repo setting to "GitHub Actions" and immediately replaces the live site with the empty scaffold. There is no separate staging URL. The live site only changes when (a) `docs/index.html` changes on `main` or (b) the Pages source is switched to "GitHub Actions" — so as long as Pages settings stay untouched, all `staging` work is invisible to the public site and the monolith stays live as fallback. The real cutover is Phase E.

### Phase B — CSS → Tailwind Design Tokens

**Done 2026-09-06.** The mapped theme lives in `src/style.css` (shadcn token blocks + a marked "LineByLine app tokens" block). Implementation notes:

- Full mapping table is commented in `src/style.css`. Highlights: `--bg→--background`, `--surface→--card`, `--text→--foreground`, `--accent(blue)→--primary`, `--accent-bg(tint)→--accent`, `--border-mid→--input`, `--hk-key-bg→--secondary`. **The `--accent` name collision is the gotcha**: shadcn's accent is a tint background, the monolith's is the blue — ported CSS using `var(--accent)` for the blue must become `var(--primary)` during Phase C extraction (only a handful of rules: `.mb-btn.accent`, `.om-ts`, `#progress-fill`, `.lrc-line.cursor` border, `#vol-slider`, `#s-search:focus`, `.fs-tick:focus-visible`).
- App tokens with no shadcn equivalent live in a separate block (survives shadcn tooling rewrites): `--active-bg/text/ts` (playing line), `--warn-*` (warning trio), `--hk-key-bg`, `--accent-border`, `--editor-font/size` (runtime-controlled by the font selector). All are exposed to Tailwind as utilities via `@theme inline` (`bg-warn-bg`, `text-active-ts`, …).
- Dropped: `--text-faint` (defined in the monolith, zero usages). Added: a dark `--destructive` (`#f85149`, GitHub dark danger — the monolith never styled destructive in dark). `--primary-foreground` stays `#ffffff` in both themes (app precedent: line-flash uses white on accent).
- **Layout-to-Tailwind migration is deferred into Phase C** per component: the monolith's HTML stays frozen, so there is nothing to migrate yet — each extracted component converts its layout to utilities as it moves. Domain CSS (`.lrc-line`, `.lyric-area`, `.hk-cell`, …) also moves with Phase C, porting `var(--accent)`→`var(--primary)` and `[data-theme="dark"]` selectors→`.dark`.
- Theme mechanism switch recorded for Phase C: monolith sets `[data-theme="dark"]` on `<html>` (`applyTheme()`); the new theme uses the `.dark` class (`@custom-variant dark (&:is(.dark *))`). `ThemeProvider.vue` implements the class toggle + `lbl_theme` localStorage.
- Verified: `vue-tsc`+`vite build` clean; computed token values in the browser match every monolith hex in both themes (`.dark` class toggled on `<html>`); swatch placeholder in `App.vue` renders GitHub Light/Dark correctly.

### Phase C — HTML → Vue Components

**In progress — tranche 2 done 2026-09-06** (first Vue components: ThemeProvider/FontSelector + menu-bar shell). Tranche plan, following the leaf-first migration order:

- **Tranche 1 (done)**: `src/config.ts` (DEFAULT_META, DEFAULT_CFG, HK_SECTIONS, HK_LABELS, LEGACY_HOTKEY_MAP + `migrateLegacyHotkeys`/`ensureDefaultHotkeys`/`migrateHotkeys`), `src/hotkeys/restrictedKeys.ts` (RESTRICTED_ALL, `isRestrictedForAll/ForKey`), `src/hotkeys/keyUtils.ts` (`normKey`/`keyStr`/`hkMatch`), `src/utils/lrcParser.ts` (TS_RE/META_RE, `tsToMs`/`msToTs`/`isEndTs`/`isHeader`/`replaceTs`/`normalizeLrcTimestamps`/`stripSecLine`/`collapseBlanks`/`findLastMetaIdx`/`lrcHasTi`), `src/utils/pasteHandlers.ts` (`cleanPaste`/`ensureReTagDefault`/`mergeLrcMeta`), `src/utils/geniusExtractor.ts` (the pure Genius helpers incl. `cleanGenius`/`extractGeniusFields`). DOM/state-coupled functions (`getSeekOffset`, `hasLyricContent`, `maybeAppendTrailingTs`, `suppressAuto`, `advanceActiveLine`, `markGeniusSource`, `extractGeniusMeta`) stay in the monolith for the Phase D composables.
- **Verification bridge**: `vitest` (devDep) + `tests/unit/*.test.ts` via `npm run test:unit` — pins every ported module's behavior while the Playwright suite still targets the monolith (until Phase E). 47 specs. **playwright.config.js got `testMatch: "**/*.spec.js"`** — the default testMatch also matches `*.test.ts`, so the Server/CI suite collected the vitest files and failed on the import; unit tests and Playwright specs are now disjoint by extension. Unit tests documented 6 monolith quirks worth knowing: `TS_RE` is `^`-anchored (mid-line timestamps don't parse); `normKey('Escape')` → `'Esc'` so `hkMatch`'s `'Escape'` branch is unreachable via `keyStr`; `findArtistAfterTitle` breaks entirely on a `Producer` line; `ensureReTagDefault` fills empty tags as `[re:VALUE]` (no space); `normalizeLrcTimestamps` truncates exactly-3 decimals (4-decimal untouched); `migrateLegacyHotkeys` only rewrites values present in the legacy map.
- **PORT DELTAS** (documented in module headers): `ensureReTagDefault(text, defaultMeta)` and `mergeLrcMeta(lrcText, defaultMeta)` take the meta text as a parameter (monolith reads the `cfg` global) — Phase D's config composable binds the live value; `_`-prefixed helpers dropped the underscore as module exports; monolith function bodies are otherwise verbatim.
- **Tranche 2 (done)**: the first real Vue components, ported from the monolith's Theme / Font settings / menu-bar markup / menu-bar CSS slices. `src/composables/useTheme.ts` (module-level `themeMode` ref — singleton so the Phase D `theme_toggle` hotkey dispatch shares state with MenuBar; `lbl_theme` key kept for cutover continuity; port delta: `.dark` class toggle instead of `[data-theme]`), `src/components/ThemeProvider.vue` (renderless slot provider; applies theme in setup = monolith Init parity), `src/composables/useEditorFont.ts` (`lbl_font`/`lbl_fsize` keys, JS default 14 — the 13.2px CSS token stays as the pre-JS fallback; the input path applies `|| 14` BEFORE clamping so 0/NaN become 14, while ticks clamp only the side they step toward — both quirks pinned by tests; port delta: no `getElementById` value sync, Vue refs are the inputs' state), `src/components/FontSelector.vue`, `src/components/MenuBar.vue` (full monolith button set; theme + font wired; import/save/undo/redo/add-field/hide-field/merge/settings rendered inert with `<!-- Phase D -->` wiring comments; mousedown focus-prevention ported verbatim; monolith CSS values verbatim as scoped styles with the Phase B token rewrites — `--surface→--card`, `--border-mid→--input`, `--text→--foreground`, `--bg→--background`, `--text-muted→--muted-foreground`, and the `--accent` flip: monolith blue → `--primary`, `--accent-bg` tint → `--accent` in `.mb-btn.accent` and `.fs-tick:focus-visible`). A11y fix-forward: text buttons ("Add field"/"Hide field"/"Merge fields") dropped their mismatched `aria-label` per the aria-accessibility skill (visible text is the accessible name; emoji/link buttons keep theirs). `App.vue` swapped the Phase B swatch page for ThemeProvider + MenuBar + an empty `<main>` placeholder (h1 sr-only ported). New devDeps for component tests: `@vue/test-utils` + `happy-dom` (vitest environment per-file via `// @vitest-environment happy-dom`; pure-module tests stay on node) — 63 unit specs total, no new npm-audit findings beyond the known shadcn-vue→stylus chain.
- **Later tranches**: main layout (panels, editor columns, lyric area with `.lrc-line` CSS ported as scoped/app CSS, rewriting `var(--accent)`→`var(--primary)` and `[data-theme="dark"]`→`.dark`) → ControlsPanel/HotkeyCell → SettingsDialog (shadcn-vue `Dialog`) → **global keyboard handler last**.


| Current Section | Vue Module |
|---|---|
| Config, HK_SECTIONS, HK_LABELS | `config.ts`, `hotkeyConfig.ts` |
| Hotkey rules, keyStr, hkMatch | `hotkeys/keyUtils.ts`, `hotkeys/restrictedKeys.ts` |
| Theme, Font | `components/ThemeProvider.vue`, `components/FontSelector.vue` |
| State, Persistence, Undo/redo | `composables/useAppState.ts`, `composables/useUndoRedo.ts`, `composables/useAutosave.ts` |
| Mode switching | `composables/useModeSwitch.ts` |
| LRC parse, Paste/meta, Genius | `utils/lrcParser.ts`, `utils/pasteHandlers.ts`, `utils/geniusExtractor.ts` |
| Audio | `components/AudioPlayer.vue`, `composables/useAudio.ts` |
| Sync/timestamp | `composables/useSync.ts`, `composables/useTimestampAdjust.ts` |
| Secondary fields, Merge | `components/SecondaryField.vue`, `composables/useMerge.ts` |
| Controls panel | `components/ControlsPanel.vue`, `components/HotkeyCell.vue` |
| Settings | `components/SettingsDialog.vue` (shadcn-vue `Dialog`) |
| Keyboard (global KD, textarea, overlay) | `composables/useGlobalHotkeys.ts`, `composables/useTextareaKeys.ts` |
| Init | `App.vue` lifecycle hooks |

Vue uses `composables/` instead of `hooks/` (Vue convention for Composition API functions that start with `use`). Vue Single File Components (`.vue`) keep `<template>`, `<script>`, and `<style>` together in one file per component.

**Migration order**: leaf components first (no children) → composite components → main layout → global keyboard handler last (most coupled piece — it dispatches to ~30 actions and reads DOM state directly).

### Phase D — Vue State Management

- Shared state via Vue's `provide`/`inject` (equivalent to React Context): `cfg`, `hotkeyMode`, `activeLine`/`playingLine`, `isDirty`
- Local state via `ref()` / `reactive()`: component-specific UI (search query, capture input focus)
- Composables for persistence: `usePersistedState` (localStorage), `useAutosave` (sessionStorage)
- The global keyboard handler becomes an `onMounted` + `onUnmounted` lifecycle hook with `ref()` for reactive state

### Phase E — Verify and Swap

Cutover happens on `main`, ordered so the live site never serves a broken build:

1. Run full Playwright suite against the Vite build (still on `staging`)
2. Expect `.aria.yml` snapshot regen (Vue produces different DOM structure — same ARIA semantics, different element tree)
3. Update `findLatestVersion()` → point at Vite build output; get CI green on `staging`
4. Merge to `main` — `docs/index.html` still ships to Pages, so the live site is unchanged
5. Switch Pages source from "Deploy from a branch" (`main:/docs`) to "GitHub Actions" in repo settings — `deploy.yml` deploys the Vite `dist/`. This is the single moment the live site changes. Also decide whether "Deploy to GitHub Pages" should join sync-staging.yml's gate list (deploy failure blocking staging sync) or stay CI-only
6. Add release workflow: tag push → build with singlefile → attach to GitHub Release
7. Delete `docs/index.html`, but only after step 5 is verified

- `archive/semantic/` stays for historical reference but is no longer part of the deploy or test cycle

### Critical Things a Fresh Chat Must Know

- **Global keyboard handler is the hardest migration** — it dispatches to ~30 actions and reads DOM state directly. In Vue it becomes `onMounted`/`onUnmounted` with `ref()` for reactive state. This is a well-known Vue pattern but the most error-prone piece.
- **Hotkey capture input has complex focus management** (Tab trap, Shift+Backspace=clear, Backspace=reset+advance, Enter=swap+advance). shadcn-vue `Dialog` handles the outer focus trap; capture behavior must be preserved manually inside the component.
- **`vite-plugin-singlefile` inlines JS and CSS but NOT external assets.** LineByLine uses inline SVG and system fonts, so this is fine. If custom fonts/images are added later, they'll need base64 encoding.
- **Sonar coverage is deliberately unmeasured for the new stack.** `sonar.coverage.exclusions=src/**,vite.config.mts` (sonarcloud.yml) keeps the gate's 80%-on-new-code condition green while no coverage pipeline exists — the Playwright e2e suite reports no coverage, so the first src/ files would otherwise pin the gate at 0%. Issue analysis on src/ continues. Narrow the exclusions if a coverage pipeline is ever added (vitest / Playwright v8 coverage) — see MEMORY.md SonarQube dispositions.
- **`archive/semantic/` is no longer the deployment mechanism.** Versioning moves to Git tags (`git tag v0.38.0 && git push --tags`). The archive can be kept as historical reference or eventually pruned.
- **shadcn-vue `Dialog` replaces the custom Settings overlay entirely** — no more manual focus trap code, no more `_topmostOverlay` / `_bringToFront` management. Significant simplification.

### Phase A implementation notes (2026-09-06)

- Versions landed: Vite 8.2, Vue 3.5, TS ~6.0, Tailwind v4.1 (`@tailwindcss/vite`), shadcn-vue 2.8 (`reka-nova` style, neutral base color), vite-plugin-singlefile 2.3, eslint-plugin-vue 10
- `shadcn-vue init` prepends a **Google Fonts import (Geist)** and points `--font-sans` at it — this was removed (system-fonts invariant; single-file builds cannot inline remote assets). If a future `shadcn-vue add` re-adds the import, delete it again
- `shadcn-vue` CLI is a **devDependency**; it brings 7 moderate npm-audit findings via `vue-metamorph → stylus → decode-uri-component` (build-tool-only exposure). If Dependabot flags it, dismiss as dev dependency
- package.json stays `"type": "commonjs"`, so the Vite config is **`vite.config.mts`** (ESM per-file) — keeps vue-tsc and Vite 8's native config loader happy without flipping the package to ESM
- TypeScript 6 deprecates `baseUrl` — the `@/*` paths alias works without it in both tsconfig.app.json and the root tsconfig (paths resolve relative to the tsconfig)
- deploy.yml was created with **workflow_dispatch as the only trigger** (see its header comment); the `push: main` trigger gets added at the Phase E cutover

### Skills That Need Updating After This Refactor

- `single-file-html-app-SKILL.md` — retire or heavily revise (the app is no longer single-file)
- `linebyline-section-index-SKILL.md` — section markers become file boundaries; the grep protocol changes to navigating between module files
- `project-workflow-SKILL.md` — phased workflow changes (no more "patch the monolith"), but companion .md still applies
- `browser-hotkey-system-SKILL.md` — architecture stays the same, but implementation is across files
- `playwright-testing-SKILL.md` — `findLatestVersion` changes, test file structure may change

---

## 4. TypeScript Conversion

### Why Fourth

TypeScript on a single-file monolith is genuinely painful — you fight `tsc` on every global variable. On a modular codebase with proper imports/exports, it's straightforward and incremental. Also applies to the Playwright test files.

### Approach

Largely automatic since the Vite scaffold (from item 3) is already TypeScript. The conversion is about adding proper types to the extracted modules.

- **Leaf modules first**: `lrcParser.ts`, `keyUtils.ts`, `pasteHandlers.ts` — these have clear input/output types
- **Define core interfaces**: `LrcLine`, `Snapshot`, `Config`, `HotkeyConfig`, `SecondaryField`
- **Convert composables**: `useAppState`, `useUndoRedo`, `useSync` — Vue composables use `ref()` and `computed()` which are already typed when using `<script setup lang="ts">`
- **Convert Playwright tests**: `.spec.js` → `.spec.ts`, type the custom fixtures (the JSDoc in `helpers/index.js` gives a head start)
- **ESLint update**: swap `@eslint/js` → `typescript-eslint`

`allowJs: true` in tsconfig lets `.ts` and `.js` coexist during migration — each module converts independently, no flag-day cutover needed.

---

## 5. Security / Maintainability / CC Remediation

### Why Fifth

Many "won't fix" and "deferred" decisions were made because fixing them in a monolith was too risky or didn't make sense. A modular, typed codebase changes the calculus: functions that were too coupled to extract become standalone modules (CC reduction is natural), regex logic can be consolidated into bounded parsers, and library primitives replace custom accessibility implementations.

### Already Done

- [x] Delete `archive/python_abandoned` and `archive/pre-semantic/0_abandoned/Python`
- [x] Add `sonar.exclusions=archive/**` to SonarQube Cloud configuration

### Quick Wins

- Add `noopener,noreferrer` to any remaining `window.open` calls (verify during modular refactor — some may be replaced by Vue Router links or removed)
- Verify `Math.random()` / Weak Cryptography findings: check if the `[by: contributor####]` feature still exists in current code. If so, replace with `crypto.randomUUID()` or remove.
- Run a fresh CodeQL scan after the modular refactor — verify the Node.js 24 migration works

### Re-Evaluate After Architecture Change

- **CC reduction**: Re-scan SonarQube. Many deferred S3776 issues will auto-resolve because the modular refactor naturally breaks large functions into smaller modules. Address only what remains above threshold 15.
- **Regex "DOS" findings** (548 instances): Still "Won't Fix" in principle (client-side processing). But with modules, consider consolidating scattered `text.match(/^\[ti:\s*(.+)\]/m)` patterns into a single `parseMetadataTags()` function with bounded matching — a maintainability win and defense-in-depth improvement.
- **WCAG compliance**: Run fresh `axe-core` scan. shadcn-vue + Radix Vue handle most accessibility automatically. Verify custom components (lyrics display, hotkey grid) still pass. The `role="slider"` Won't Fix on the progress bar — re-evaluate whether shadcn-vue `Slider` can replace the custom interaction.
- **False positive re-evaluation**: Re-scan with CodeQL, SonarQube, Semgrep/Opengrep after architecture change. Some false positives may shift status.

---

## 6. UI Refactor

### Why Last

UI is the most visible and most iterative change. It benefits enormously from a stable architecture underneath. With a modular, typed codebase and CI, you can iterate on UI with confidence. Starting UI work before the architecture is solid leads to constant rework.

### Phase A — DESIGN.md

- Create `DESIGN.md` in the repo root following the iterative design spec (https://stitch.withgoogle.com/docs/design-md/overview, https://github.com/voltagent/awesome-design-md)
- Document design tokens (already in shadcn/ui CSS variable format from item 3)
- This becomes the single source of truth for all UI decisions

### Phase B — Icon Replacement

- Replace all emoji icons (📂, 💾, 🌗, ⚙️) with Lucide Vue icons (shadcn-vue default)
- Swap custom inline SVGs (undo, redo, play, pause) with Lucide equivalents
- The issues beetle icon (custom SVG): keep custom or find a Lucide equivalent

### Phase C — Component Modernization (shadcn-vue Drop-ins)

| Current Element | shadcn-vue Replacement | Notes |
|---|---|---|
| Settings overlay (custom) | `Dialog` | Built-in focus trap, Escape to close, backdrop click |
| Font size / speed spinners | `Input` + buttons, or `Slider` | |
| Volume / seek range inputs | `Slider` | Replace custom range inputs |
| Toolbar buttons | `Button` variants | `outline`, `ghost`, `default` |
| Font selector | `Select` | |
| Checkboxes (instant replay, etc.) | `Checkbox` | |
| Merge fields button | `Button` with accent variant | |
| Confirm dialog (inline Yes/No) | `AlertDialog` | |
| Hotkey capture input | Keep custom | No shadcn-vue equivalent for key capture |

### Phase D — Theme Marketplace

- Define 3-4 named themes beyond light/dark (e.g., Ocean, Rose, Forest)
- Each theme is just a CSS class overriding the same CSS variables — no code changes to components
- Add a theme picker UI (visual swatch grid or `Select`)
- This is the prototyping environment for DESIGN.md iterations
- Premade themes available from `ui.shadcn.com/themes` and third-party generators — copy the CSS block, drop it in `globals.css`, done (shadcn-vue uses the same CSS variable format as shadcn/ui, so the same theme blocks work)

### Phase E — Layout and Spacing Polish

- Tailwind utilities make spatial layout trivial (the pain point from the original Claude Sonnet experience)
- Standardize spacing: `gap-2`, `gap-3`, `p-4`, etc. instead of hardcoded `8.8px`, `6.6px`
- Responsive breakpoints: ensure the left-panel collapse still works at narrow viewports
- The `.lrc-line` rendering stays custom (domain-specific) but gets consistent spacing

---

## Versioning Strategy

Git tags + GitHub Releases. This is the standard pattern for professional web projects of any size.

**Workflow:**
1. Write code → commit as usual
2. When ready to release: `git tag v0.38.0 && git push --tags`
3. GitHub Actions builds the single-file HTML and creates a Release automatically
4. GitHub Pages deploys from the same build

*Example numbers were written at app version 0.37.x. As of Sep 2026 the app is at **0.37.2**, so the next minor is still v0.38.0 — shift the examples up as releases accrue.*

**Version comparison:**
- Source diff: `git diff v0.37.1..v0.38.0`
- Browse Release artifacts for built output comparison
- Check out old source: `git checkout v0.37.1` (detached HEAD, read-only, fine for inspection)

**Git worktrees are not needed here.** They solve the problem of working on two branches simultaneously (e.g., hotfix on a release branch while continuing feature work on main). They add complexity without benefit for version comparison — `git diff` and GitHub's tag browser handle that more easily.

**`archive/semantic/` directory** stays as historical reference but is no longer part of the deploy or test cycle. Can be pruned eventually.

---

## Hosting

GitHub Pages via the `actions/deploy-pages` workflow (OIDC tokens, no PAT needed). This is sufficient for modern webpages — the Vite-built output is static HTML/CSS/JS with no server-side requirements. Cloudflare Pages is a viable alternative if needed later, but GitHub Pages is simpler since the repo is already on GitHub.

Current state (Sep 2026): legacy branch deploy serving `main:/docs` (`docs/index.html`). The switch to the workflow happens in item 3 Phase E — until then, do not touch the Pages source setting, since that alone repoints the live site.
