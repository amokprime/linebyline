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

### Status: In progress — Phases A+B+C done 2026-09-06; Phases D-E pending

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

- Full mapping table is commented in `src/style.css`. Highlights:
    - `--bg→--background`, `--surface→--card`, `--text→--foreground`
    - `--accent(blue)→--primary`, `--accent-bg(tint)→--accent`, `--border-mid→--input`
    - `--hk-key-bg→--secondary`
- **The `--accent` name collision is the gotcha**: shadcn's accent is a tint background, the monolith's is the blue. Ported CSS using `var(--accent)` for the blue must become `var(--primary)` during Phase C extraction. Only a handful of rules: `.mb-btn.accent`, `.om-ts`, `#progress-fill`, `.lrc-line.cursor` border, `#vol-slider`, `#s-search:focus`, `.fs-tick:focus-visible`.
- App tokens with no shadcn equivalent live in a separate block (survives shadcn tooling rewrites): `--active-bg/text/ts` (playing line), `--warn-*` (warning trio), `--hk-key-bg`, `--accent-border`, `--editor-font/size` (runtime-controlled by the font selector). All are exposed to Tailwind as utilities via `@theme inline` (`bg-warn-bg`, `text-active-ts`, …).
- Dropped: `--text-faint` (defined in the monolith, zero usages). Added: a dark `--destructive` (`#f85149`, GitHub dark danger — the monolith never styled destructive in dark). `--primary-foreground` stays `#ffffff` in both themes (app precedent: line-flash uses white on accent).
- **Layout-to-Tailwind migration is deferred into Phase C** per component: the monolith's HTML stays frozen, so there is nothing to migrate yet — each extracted component converts its layout to utilities as it moves. Domain CSS (`.lrc-line`, `.lyric-area`, `.hk-cell`, …) also moves with Phase C, porting `var(--accent)`→`var(--primary)` and `[data-theme="dark"]` selectors→`.dark`.
- Theme mechanism switch recorded for Phase C: monolith sets `[data-theme="dark"]` on `<html>` (`applyTheme()`); the new theme uses the `.dark` class (`@custom-variant dark (&:is(.dark *))`). `ThemeProvider.vue` implements the class toggle + `lbl_theme` localStorage.
- Verified: `vue-tsc`+`vite build` clean; computed token values in the browser match every monolith hex in both themes (`.dark` class toggled on `<html>`); swatch placeholder in `App.vue` renders GitHub Light/Dark correctly.

### Phase C — HTML → Vue Components

**Done 2026-09-06** (tranches 1–6). Tranche plan, following the leaf-first migration order:

- **Tranche 1 (done)** — six pure modules ported verbatim:
    - `src/config.ts` — DEFAULT_META, DEFAULT_CFG, HK_SECTIONS, HK_LABELS, LEGACY_HOTKEY_MAP + `migrateLegacyHotkeys`/`ensureDefaultHotkeys`/`migrateHotkeys`
    - `src/hotkeys/restrictedKeys.ts` — RESTRICTED_ALL, `isRestrictedForAll/ForKey`
    - `src/hotkeys/keyUtils.ts` — `normKey`/`keyStr`/`hkMatch`
    - `src/utils/lrcParser.ts` — TS_RE/META_RE, `tsToMs`/`msToTs`/`isEndTs`/`isHeader`/`replaceTs`/`normalizeLrcTimestamps`/`stripSecLine`/`collapseBlanks`/`findLastMetaIdx`/`lrcHasTi`
    - `src/utils/pasteHandlers.ts` — `cleanPaste`/`ensureReTagDefault`/`mergeLrcMeta`
    - `src/utils/geniusExtractor.ts` — the pure Genius helpers incl. `cleanGenius`/`extractGeniusFields`
    - DOM/state-coupled functions (`getSeekOffset`, `hasLyricContent`, `maybeAppendTrailingTs`, `suppressAuto`, `advanceActiveLine`, `markGeniusSource`, `extractGeniusMeta`) stay in the monolith for the Phase D composables.
- **Verification bridge** — `vitest` (devDep) + `tests/unit/*.test.ts` via `npm run test:unit`. Pins every ported module's behavior while the Playwright suite still targets the monolith (until Phase E). 47 specs (grew to 103 by tranche 6). `playwright.config.js` got `testMatch: "**/*.spec.js"` — the default testMatch also matches `*.test.ts`, so the Server/CI suite collected the vitest files and failed on the import; unit tests and Playwright specs are now disjoint by extension.
    - Quirks pinned by tests:
    - `TS_RE` is `^`-anchored (mid-line timestamps don't parse)
    - `normKey('Escape')` → `'Esc'` so `hkMatch`'s `'Escape'` branch is unreachable via `keyStr`
    - `findArtistAfterTitle` breaks entirely on a `Producer` line
    - `ensureReTagDefault` fills empty tags as `[re:VALUE]` (no space)
    - `normalizeLrcTimestamps` truncates exactly-3 decimals (4-decimal untouched)
    - `migrateLegacyHotkeys` only rewrites values present in the legacy map
- **PORT DELTAS** (documented in module headers):
    - `ensureReTagDefault(text, defaultMeta)` and `mergeLrcMeta(lrcText, defaultMeta)` take the meta text as a parameter (monolith reads the `cfg` global) — Phase D's config composable binds the live value
    - `_`-prefixed helpers dropped the underscore as module exports
    - Monolith function bodies are otherwise verbatim.
- **Tranche 2 (done)** — first real Vue components:
    - `src/composables/useTheme.ts` — module-level `themeMode` ref (singleton so Phase D's `theme_toggle` hotkey dispatch shares state with MenuBar; `lbl_theme` key kept for cutover continuity; port delta: `.dark` class toggle instead of `[data-theme]`)
    - `src/composables/useEditorFont.ts` — `lbl_font`/`lbl_fsize` keys, JS default 14 (the 13.2px CSS token stays as the pre-JS fallback). The input path applies `|| 14` BEFORE clamping so 0/NaN become 14, while ticks clamp only the side they step toward — both quirks pinned by tests. Port delta: no `getElementById` value sync, Vue refs are the inputs' state.
    - `src/components/ThemeProvider.vue` — renderless slot provider; applies theme in setup = monolith Init parity
    - `src/components/FontSelector.vue`
    - `src/components/MenuBar.vue` — full monolith button set; theme + font wired; import/save/undo/redo/add-field/hide-field/merge/settings rendered inert with `<!-- Phase D -->` wiring comments; mousedown focus-prevention ported verbatim
    - CSS: monolith CSS values verbatim as scoped styles with the Phase B token rewrites — `--surface→--card`, `--border-mid→--input`, `--text→--foreground`, `--bg→--background`, `--text-muted→--muted-foreground`, and the `--accent` flip: monolith blue → `--primary`, `--accent-bg` tint → `--accent` in `.mb-btn.accent` and `.fs-tick:focus-visible`
    - A11y fix-forward: text buttons ("Add field"/"Hide field"/"Merge fields") dropped their mismatched `aria-label` per the aria-accessibility skill (visible text is the accessible name; emoji/link buttons keep theirs)
    - `App.vue` swapped the Phase B swatch page for ThemeProvider + MenuBar + an empty `<main>` placeholder (h1 sr-only ported)
    - New devDeps for component tests: `@vue/test-utils` + `happy-dom` (vitest environment per-file via `// @vitest-environment happy-dom`; pure-module tests stay on node) — 63 unit specs total, no new npm-audit findings beyond the known shadcn-vue→stylus chain
- **Tranche 3 (done)** — main layout frame:
    - `src/composables/usePanelCollapse.ts` — module-level singleton; `lbl_panel_collapsed` persistence, portrait auto-collapse <640px, focus transfer for the keyboard path. Port delta: classList/`.inert` DOM writes became reactive bindings, focus goes through registered template refs.
    - `src/components/LeftPanel.vue` — header + collapse button, `#audio-box` with song/artist/progress/time/media/seek/volume rows (markup and static titles verbatim, controls inert until Phase D useAudio; `#controls-box` with an EMPTY `#hk-grid` for tranche 4)
    - `src/components/EditorArea.vue` — `#editor-wrapper`/scroll/area + main field column: "( )" and "↩" checkboxes unbound until the Phase D config composable, warn-bar shell, empty `ul.lyric-area` awaiting the Phase D renderMainLines port, hidden textarea
    - `App.vue` now the full frame (MenuBar + `#main` + panel/expand-button/EditorArea wiring incl. the Init sequence autoCollapse→applyPanelCollapse→resize listener)
    - CSS ported with the Phase B token rewrites; blue-accent rules (`#progress-fill`, `#vol-slider`, checkbox accent-color, `.lrc-line.cursor` border, `line-flash` start) use `--primary`; `[data-theme="dark"] .lrc-line.cursor` → `.dark .lrc-line.cursor`
    - Shared `.fs-spinner`/`.fs-tick` moved from FontSelector's scoped styles to `src/style.css` (unscoped — also used by the speed/seek spinners), adding the `.fs-tick:hover/:active` rules tranche 2 had omitted
    - Port deltas documented: `html{font-size:14.3px}` root scaling NOT ported (explicit shell font-size instead — Tailwind rem utilities keep the standard root); `.sec-textarea`/`.hk-cell`/`.hk-key`/`.om-btn` CSS stays with their future components (SecondaryField/ControlsPanel)
    - 75 unit specs total (panel-collapse composable + layout smoke tests new)
- **Tranche 4 (done)** — controls-panel hotkey grid:
    - `src/utils/hotkeyDisplay.ts` holds the pure display rules (hkDisp Escape→Esc/— fallback; hkCellKeys per-action key arrays — sync's dual sync+replay_line key, play_pause's alt key in Typing mode, prev/next arrow badges, the `||'Enter'`-before-Escape-mapping order; hkPanelActions' 14-cell order with ms labels and the seek/time flip; the two sets) — unit-testable without mounting
    - `src/components/HotkeyCell.vue` renders a `div[role=button][tabindex=0]` cell (Enter/Space activation emits `activate`; dimmed cells don't emit, matching the monolith's !dimmed guard; warn styling = the monolith's inline warn palette)
    - `src/components/ControlsPanel.vue` fills the grid with the mode row + action cells (aria-labels from HK_LABELS — including the monolith quirk that the "(disabled in typing mode)" suffix only applies when NO HK_LABELS entry exists, || short-circuit)
    - LeftPanel mounts it in `#hk-grid` (fieldset reset CSS added — required by the aria skill) and gained the sync-file hotkey badge
    - `.hk-key` moved to style.css global (cells + badge + future Settings rows reuse it)
    - Inert until Phase D: hotkeyMode/offsetSeekMode are local refs at monolith defaults (useModeSwitch replaces them), cells render from DEFAULT_CFG (config composable swaps in live cfg), `activate` has no dispatch table
    - 88 unit specs total
    - VTU gotcha: findAll on a multi-root fragment component returns matches in component order, not document order — scope assertions with `.mode-row .hk-cell` / `.hk-cell:not(.mode)`
- **Tranche 5 (done)** — settings overlay ported onto the shadcn-vue Dialog:
    - `shadcn-vue add dialog` — remember it re-adds the Google Fonts import to style.css; deleted again
    - `src/components/SettingsDialog.vue` ports the monolith's openSettings-populated markup: title bar (heading + conflict output + search field + ⌨ toggle), Instant Replay checkboxes, interval rows, default-meta textarea, and the buildHkRows hotkey rows (HK_SECTIONS groups, readOnly capture inputs with the `Escape→Esc`/blank-stays-blank display rule, hidden clear/swap/reset/restrict-warn buttons)
    - All rendered from DEFAULT_CFG, all inert until Phase D wires the config composable, the capture interactions, initSettingsSearch/applySettingsFilter, saveSettingsNow, and the reset confirm (kept as the monolith's inline footer confirm; the roadmap's AlertDialog swap is a Phase D decision)
    - Port deltas: `:show-close-button="false"` (no visible X — monolith parity; Escape/backdrop close via reka-ui, which also replaces the monolith's hand-rolled focus trap); a visually-hidden DialogDescription satisfies reka's aria-describedby; a `sr-only` h1 stays at App level
    - MenuBar's settings button now emits `openSettings` and App owns the dialog (`v-model:open`)
    - eslint.config.mjs exempts `src/components/ui/**` from `vue/multi-word-component-names` + `vue/require-default-prop` (vendored shadcn conventions; regenerated files)
    - 96 unit specs
- **Tranche 6 (done)** — last JS-generated UI structure without a component: the secondary-field columns from `addSecondary()`.
    - `src/components/SecondaryField.vue` renders one column (`index` prop drives the "Secondary N" label, header aria-label, and textarea aria-label): header right group (📂 import button with the "Open (Middle click)" title + paren-wrap checkbox — inline styles verbatim with the `--text-muted→--muted-foreground` and `accent-color: var(--accent)→--primary` rewrites), a warn-bar WITHOUT `role="alert"` (monolith parity — only `#main-warn` has it), the hidden per-field file picker (`accept=".lrc,.txt"`), and the `.sec-textarea`
    - CSS split: `.sec-textarea` scoped in the component (its only user); the shared `.field-col/.field-header/.field-header-label/.fh-btn/.warn-bar` rules moved from EditorArea's scoped block to `style.css` unscoped (same multi-component rationale as `.fs-spinner`/`.hk-key`)
    - EditorArea renders `<SecondaryField v-for="i in secCount">` from a local `secCount` ref defaulting to 0 (monolith init parity — Phase D's useAppState pool with the 10-field cap replaces it); every interaction is inert with `<!-- Phase D -->` comments (paste/import path, secondary keydown guard, scroll sync, checkLineCounts)
    - Also completes body-markup parity: App.vue now carries the two app-level hidden nodes — `#file-picker` (`audio/*,.lrc,.txt`, multiple) and `#a11y-announcer` (the monolith's inline clip recipe → the same `.sr-only` utility the h1 uses), both inert until Phase D (`doImport` / `_announce`)
    - 103 unit specs
- **Phase C closed here.** The "global keyboard handler last" tranche formally moved into Phase D: the handler dispatches to ~30 actions and reads cfg/hotkeyMode/line state, none of which exist before the Phase D composables — porting it now would mean a throwaway stub dispatcher. Phase D's section below already describes the port (`onMounted`/`onUnmounted` + refs; `useGlobalHotkeys`/`useTextareaKeys`). Everything monolith-side that remains (Render/UI renderMainLines, Audio, Sync/timestamp, Mode switching, State/Persistence/Undo, Merge, Title, Import, Settings search/confirm logic, dynamic tooltips) is behavior for Phase D — the Phase C "HTML → components" goal is met: every static body element and every JS-generated UI structure (hk panel, settings rows, secondary columns) now has a Vue component, inert where state is pending.

| Current Section | Vue Module |
|---|---|
| Config, HK_SECTIONS, HK_LABELS | `config.ts`, `hotkeyConfig.ts` |
| Hotkey rules, keyStr, hkMatch | `hotkeys/keyUtils.ts`, `hotkeys/restrictedKeys.ts` |
| Theme, Font | `components/ThemeProvider.vue`, `components/FontSelector.vue` |
| State, Persistence, Undo/redo | `composables/useAppState.ts`, `composables/useUndoRedo.ts`, `composables/useAutosave.ts` |
| Mode switching | `composables/useModeSwitch.ts` |
| LRC parse, Paste/meta, Genius | `utils/lrcParser.ts`, `utils/pasteHandlers.ts`, `utils/geniusExtractor.ts` |
| Audio | markup in `components/LeftPanel.vue` (tranche 3); `composables/useAudio.ts` (Phase D) |
| Sync/timestamp | `composables/useSync.ts`, `composables/useTimestampAdjust.ts` |
| Secondary fields, Merge | `components/SecondaryField.vue` (tranche 6, inert), `composables/useMerge.ts` |
| Controls panel | `components/ControlsPanel.vue`, `components/HotkeyCell.vue` |
| Settings | `components/SettingsDialog.vue` (shadcn-vue `Dialog`) |
| Keyboard (global KD, textarea, overlay) | `composables/useGlobalHotkeys.ts`, `composables/useTextareaKeys.ts` — moved here from Phase C's "last tranche": dispatch needs the Phase D state composables to exist |
| Init | `App.vue` lifecycle hooks |

Vue uses `composables/` instead of `hooks/` (Vue convention for Composition API functions that start with `use`). Vue Single File Components (`.vue`) keep `<template>`, `<script>`, and `<style>` together in one file per component.

**Migration order**: leaf components first (no children) → composite components → main layout → global keyboard handler last (most coupled piece — it dispatches to ~30 actions and reads DOM state directly).

### Phase D — Vue State Management

**This section is the single source of truth for Phase D tranche details** — port deltas, test quirks, and file lists per tranche live in the implementation notes subsections below. MEMORY.md no longer duplicates this content; it points here.

State moves out of the monolith into Vue composables. Tranche plan (smallest dependency-first, global keyboard handler last — it dispatches to ~30 actions and needs every state composable to exist):

- Shared state via Vue's `provide`/`inject` (equivalent to React Context): `cfg`, `hotkeyMode`, `activeLine`/`playingLine`, `isDirty`
- Local state via `ref()` / `reactive()`: component-specific UI (search query, capture input focus)
- Composables for persistence: `usePersistedState` (localStorage), `useAutosave` (sessionStorage)
- The global keyboard handler becomes an `onMounted` + `onUnmounted` lifecycle hook with `ref()` for reactive state

#### Tranche plan

Each tranche ships its composables + Vitest specs. Components that grew inert during Phase C are wired in the matching tranche. Tranches 1–2 are leaf pure-state; 3–7 wire increasingly coupled subsystems; 8 ports the settings interactions; 9 ports the most coupled piece last.

- **Tranche 1 — Foundation** (done) — `useAppState` (core state refs + the `cfg` ref loaded via `migrateHotkeys` + a `provide`/`inject` API so children read `cfg.hotkeys.X` reactively), `usePersistedState` (thin `ref(localStorage)` helper for scattered scalar prefs: `lbl_speed`, `lbl_vol`, `lbl_muted`), `useUndoRedo` (snapshot stack, single-push model, debounced input push). No component wiring yet.
- **Tranche 2 — Persistence + Title** (done) — `useAutosave` (load/save sessionStorage, `_restoreSecondaryPool` shape, seed-on-load) + `useTitle` (pure `updateTitleFromText` parsing `[ti:]`/`[ar:]` into reactive refs). Wired the `cfg` ref into `SettingsDialog.vue` so rows render from live config instead of `DEFAULT_CFG`. Also added `mainText` ref to useAppState, wired useAudio/useModeSwitch to read from it, and instantiated useUndoRedo in App.vue. See "Tranche 2 implementation notes" below for the full port-delta list.
- **Tranche 3 — Mode switch** (done) — `useModeSwitch` (applyMode scroll/selection logic). Wire into `ControlsPanel.vue` (replaces local mode refs at monolith defaults; mode cell @activate dispatches through toggleMode/toggleOffsetSeek). EditorArea registers template refs for `#main-scroll` / `#main-textarea` / `#main-lines` and calls initModeSwitch in setup; App.vue's onMounted calls applyMode() as the last Init step (monolith parity). **Scope amendment**: the roadmap originally listed "the secondary-focus auto-switch" here, but the monolith's "Auto mode" section comment is documentation drift — `addSecondary()` attaches no focus/blur handlers. Not implemented in this tranche; if added later, it belongs in `SecondaryField.vue`'s @focus/@blur calling `setHotkeyMode(false)`. See "Tranche 3 implementation notes" below for the full port-delta list.
- **Tranche 4 — Audio** (done) — `useAudio` composable. Wired `LeftPanel.vue` audio controls (play/pause, volume, seek, speed, progress bar). Persists `lbl_vol`/`lbl_muted`/`lbl_speed` via Tranche 1's `usePersistedState`. The sync-file button and seek-offset arrows stay inert (Tranche 5 owns `doSyncFile`/`tickSeekOffset`/`setOffsetMode`). See "Tranche 4 implementation notes" below for the full port-delta list (reactive DOM sync replaces `applyVolume()`; `_preMuteVolume`/`_volWheeling` guard eliminated; `rebuildHkPanel()` call in `updatePlayBtn` eliminated; Tranche 2/5/6 cross-cutting functions passed as no-op callbacks).
- **Tranche 5 — Sync/timestamp** (done) — `useSync` (syncLine, insertEndLine, seekPrev/Next, replayActiveLine, adjustTs, markAsTranslation, doSyncFile, tickSeekOffset, setOffsetMode, `_insertSyncTrailing`, `_advanceAfterSplit`, updateActiveLineFromTime, renderMainLines, `_handleLineClick`/`_handleLineClickPlain`, onMainInput, onMainPaste, onMainLinesPaste, onSeekOffsetChange) + `src/utils/timestampSync.ts` (pure helpers: `peelLastParen`, `findNextTimestampMs`, `findPrevTsMs`, `findNextTsMs`, `findRunEnd`, `assignInterpolatedTs`, `batchSplitParens`, `findNextUnprocessedSplit`, `findNextNonMetaFromIdx`) + `lrcParser.ts` additions (`hasLyricContent`, `hasTrailingTimestamp`, `allLyricLinesHaveTs`). Wired `EditorArea.vue` (textarea `@input`/`@paste`, `#main-lines` delegated mousedown/contextmenu/paste, renderMainLines port) + `LeftPanel.vue` (`setSeekOffsetRef` + seek-arr-back/fwd → tickSeekOffset + sync-file-btn → doSyncFile + `#seek-offset` `@change`) + `App.vue` (setMainText side-effect chain + useSync/useAudio/useAutosave/useModeSwitch callback wiring + setOnInputCallback for undo debounce). 76 new specs (37 timestampSync + 12 lrcParser additions + 27 useSync); full suite 307/307 green; `vue-tsc -b` clean. The roadmap's Phase E consolidation begins here — the four unique-to-`tests/logic.spec.js` functions now live in `src/utils/timestampSync.ts` with Vitest coverage.
- **Tranche 6 — Merge + Secondary fields** (done) — `useMerge` (addSecondary/removeSecondary pool management, checkLineCounts/updateMergeBtn warn-bar + merge-button state, mergeTranslations with `_buildMergedResult` verbatim, syncScrollFrom/syncSecScroll, onSecInput/onSecPaste/onSecKeydown/onSecFileImport handlers) + `lrcParser.ts` additions (`getMainLyricLines`/`getSecLines`) + `SecondaryField.vue` full wiring (textarea `@input`/`@paste`/`@scroll`/`@keydown`, paren checkbox, file picker) + `MenuBar.vue` (Add/Hide/Merge buttons reactive) + `EditorArea.vue` (v-for over secondaryPool + `#main-warn` reactive + `#main-scroll` scroll sync) + `App.vue` (initMerge + setSyncCallbacks Tranche 6 stubs become real + applySnapshot secondary restore). 32 new specs (31 merge + 1 secondaryField added); full suite 339/339 green; `vue-tsc -b` clean.
- **Tranche 7 — Import/Save** (done) — `useImport` (doImport, doSave with `[ti:]` tag filename + sanitise, onFilePickerChange multi-file dispatch: audio-only/lrc-only/audio+lrc pair, onMiddleClick) + `MenuBar.vue` (Open/Save buttons) + `App.vue` (`#file-picker` ref + middle-click handler + initImport + onFilePickerChange listener). 12 new specs; full suite 351/351 green; `vue-tsc -b` clean.
- **Tranche 8 — Settings interactions** (done) — `useSettings` composable + `SettingsDialog.vue` full wiring. Capture input keydown (Tab/Arrow passthrough to the focus trap, Shift+Backspace=clear, Backspace=reset+advance, Enter=swap+advance, Escape=revert); conflict detection with Swap; reset-to-default with swap pattern (gives any holder of the default its own default back); text + hotkey search modes (`applySettingsFilter`); `saveSettingsNow` with clamping; inline footer Yes/No reset confirm (kept as `v-show` on the original elements — NOT swapped to shadcn `AlertDialog`, preserves the monolith's `style.display === 'none'` test). 32 new specs. Full suite 307/307 green (275 baseline + 32 new); `vue-tsc -b` clean.
- **Tranche 9 — Keyboard handler** (done) — `useTextareaKeys` (main textarea KD: Enter trim trailing whitespace, bracket/paren autocomplete with line-start wrap for `(`, selection-wrap for `(`/`[`) + `useGlobalHotkeys` (document-level keydown dispatch table to ~30 actions, onMounted/onUnmounted via App.vue, repeat-guard, focused-UI-element guard, typing-mode arrow override, settings focus trap, reset-confirm Enter/Backspace shortcuts). Also ports `updateDynamicTooltips` (imperative DOM title writes, App.vue calls it after Init + via a `watch` on `cfg`). LeftPanel.vue's Tranche 5 wiring stubs were also patched (the build Repomix had stale stubs for `onSyncFile`/`onSeekOffsetTick`/`onSeekOffsetChange` — wired to the real `useSync` functions). 40 new specs (11 textareaKeys + 29 globalHotkeys). Full suite 347/347 green; `vue-tsc -b` clean.

#### Tranche 1 design (this session)

`useAppState.ts`:
- Module-level singleton refs (the same pattern `useTheme`/`usePanelCollapse` use) for the monolith State section's mutable globals: `hotkeyMode`, `offsetSeekMode`, `activeLine`, `playingLine`, `selectedLines`, `mergeDone`, `savedAudioPath`, `lastImportStem`, `suppressScrollSync`, `_syncAutoAdvanced`, `_geniusDetectedThisSession`, `_pasteJustHappened`. `MAX_LINES=500` is a `const`.
- `secondaryPool` is a `ref<SecondaryEntry[]>` of pool entries (max 10); `secondaryCols` is a `computed` over `secondaryPool.value.filter(e => e.visible)`. The monolith keeps them as separate arrays with manual bookkeeping — collapsing into one source of truth is the single-source-of-truth rule from the single-file-html-app skill.
- `cfg` is a `ref<AppConfig>` initialised via `loadCfg()` (ported verbatim from the monolith's loadCfg, including the JSON.parse clone + `migrateHotkeys` call). Provided via `provide(CFG_KEY, cfg)` and consumed via `inject(CFG_KEY)` — components that need `cfg.hotkeys.X` reactively call `inject`.
- `isDirty` is a `ref<boolean>` initialised `false`; the unload-warning handler reads it (Tranche 7 wires it).
- Export an `AppProvider` symbol (`InjectionKey<Ref<AppConfig>>`) and a `useCfg()` convenience wrapper that calls `inject(CFG_KEY)` and throws if missing.

`usePersistedState.ts`:
- A generic helper `usePersistedRef(key, default, opts?)` that returns a `ref` whose value is read from `localStorage` at module-load and persists on every set. Options: `{ serialize?: (v) => string, deserialize?: (s) => T, validate?: (v) => boolean }` — defaults to JSON.
- Pre-seeded exports for the three scalar prefs still scattered across the monolith: `useSpeed()` (`lbl_speed` → number, default 1), `useVolume()` (`lbl_vol` → number 0..1, default 1), `useMuted()` (`lbl_muted` → `'0'`/`'1'`, default false). The `useEditorFont`/`useTheme`/`usePanelCollapse` composables already in the tree use direct `localStorage.getItem` calls — left alone this tranche (consolidating them onto `usePersistedRef` is a post-cutover cleanup, not a tranche-1 goal).

`useUndoRedo.ts`:
- Snapshot shape: `{ main: string, secondaries: string[], mergeDone: boolean }` (the monolith's takeSnapshot, ported).
- Stack: `undoStack: ref<Snapshot[]>`, `redoStack: ref<Snapshot[]>`. The single-push model from the code-quality skill: `pushSnapshot()` pushes post-change only and clears `redoStack`; wholesale replacement ops call `pushSnapshot` before AND after.
- `applySnapshot` clears extra secondaries beyond the snapshot's `secondaries.length` (the documented invariant).
- `doUndo`/`doRedo` follow the monolith: undo needs at least 2 entries (the seed + one), redo needs at least 1.
- Input debounce: `scheduleInputSnapshot(debounceMs)` — clears any pending timer and sets a new one. Caller passes the configured `cfg.undo_debounce_ms`.
- The composable is **shape-only** this tranche — it doesn't yet own the snapshot content. Callers pass a `takeSnapshot: () => Snapshot` and an `applySnapshot: (s: Snapshot) => void` to the composable's `useUndoRedo({ take, apply })` factory; the composable manages the stacks + debounce but defers DOM writes to the caller. Wiring real `take`/`apply` happens in Tranche 2 once `useAutosave` and the `#main-textarea` ref exist. This keeps Tranche 1 dependency-free and unit-testable in pure node.

#### Tranche 2 implementation notes (2026-09-09)

`useAutosave.ts` + `useTitle.ts` shipped. Also wired `SettingsDialog.vue` to live `cfg`, added `mainText` ref to `useAppState`, wired `useAudio`/`useModeSwitch` to read from it, and instantiated `useUndoRedo` in `App.vue`. 22 new specs (231 total).

- `useTitle.ts` — ports `updateTitleFromText()`. Parses `[ti:]`/`[ar:]` tags into reactive `songTitle`/`songArtist` refs. Also exports `setSongTitle(s)` for `useAudio.setupAudio` to set the title from the audio filename stem (before `updateTitleFromText` potentially overwrites with `[ti:]` tag). `LeftPanel` binds `#song-title`/`#song-artist` to these refs (was hardcoded "Unknown Artist" + `useAudio`'s `songTitleText`).
- `useAutosave.ts` — ports `loadAutosave`/`doAutosave`/`_restoreSecondaryPool`. Singleton with `initAutosave(callbacks)` — `App.vue` wires `getMainText`/`setMainText`/`updateTitleFromText`/`takeSnapshot`/`seedUndo` + Tranche 5/6 stubs.
- `useAppState.ts` amendment — added `mainText` ref (source of truth for the LRC text being edited). `EditorArea` binds `<textarea :value="mainText">` (one-way — Tranche 5 adds `@input`). `useModeSwitch` reads `mainText.value` instead of the DOM textarea's `.value` property. **Caveat**: until Tranche 5, user typing in the textarea doesn't update `mainText` — `doAutosave` saves the programmatic value, not user edits.
- `SettingsDialog.vue` — swapped `DEFAULT_CFG` → `useAppState().cfg` for all live values (captureValue, intervalRows, replayChecks `:checked`, default meta textarea). Now reactive — settings changes re-render the dialog (Tranche 8 wires the capture/save interactions).
- `useAudio.ts` amendment — removed `songTitleText` ref (moved to `useTitle`); `setupAudio` calls `setSongTitle(stem)` from `useTitle`. Added `setAudioCallbacks(callbacks)` — separate from `initAudio(refs)` so `App.vue` can wire Tranche 2/5/6 callbacks without needing the audio DOM refs (which live in `LeftPanel`).
- `App.vue` — instantiates `useUndoRedo` with take/apply callbacks that read from `useAppState`. Wires `initAutosave` + `setAudioCallbacks` with real `doAutosave`/`updateTitleFromText` + Tranche 5/6 stubs. `onMounted` calls `loadAutosave()` before `applyMode()` (monolith Init parity).
- **Port deltas:**
    - **The monolith's Init clears sessionStorage before loadAutosave** (`sessionStorage.removeItem('lbl_autosave')`), meaning autosave NEVER restores. The Vue port does NOT clear — the `single-file-html-app` skill says "reload on init to survive accidental refresh". If the user wants the clear behavior, add `sessionStorage.removeItem('lbl_autosave')` before `loadAutosave()` in `App.vue`.
    - **`_setTA(d.main)` → `setMainText(d.main)` callback** — writes `mainText` ref, not the DOM. The monolith reads/writes `getElementById('main-textarea').value` directly; Vue uses a reactive ref.
    - **`_restoreSecondaryPool` pushes to `secondaryPool`** with `{ visible, text }` shape — no DOM elements. The monolith creates DOM columns via `addSecondary()`; Vue's `SecondaryField` component renders columns reactively from the pool.
    - **`poolTexts` maps from `secondaryPool.value.map(e => e.text)`** — not `c.linesEl.value` (the DOM textarea is gone). **Caveat**: until Tranche 6 wires `SecondaryField`'s textarea `@input` to update `e.text`, `doAutosave` saves whatever was loaded — user typing in secondary fields isn't captured.
- **Deploy pattern introduced** — `scripts/prepare.sh` (sandbox-side, committed at `ai/chat.z.ai/scripts/delivery/prepare.sh`) zips `download/` into `deliver.zip` with a `deploy.sh` that maps flat hyphenated filenames to real repo paths. The user's `dpl` fish abbreviation runs `ai/chat.z.ai/scripts/delivery/unpack.sh` which extracts the zip to `scratch/`, runs `deploy.sh`, waits 60s for Syncthing, then runs tests via SSH. See `project-workflow-SKILL.md` → "Deliver zip pattern" for the full protocol.

#### Tranche 3 implementation notes (2026-09-09)

`useModeSwitch.ts` shipped. Key decisions recorded for future tranches:

- **Singleton pattern, not provide/inject** — matches `useAppState`. `initModeSwitch(refs, renderMainLines)` called once in `EditorArea.vue` setup; `ControlsPanel.vue` and the future Tranche 9 keyboard handler import `toggleMode`/`toggleOffsetSeek`/`applyMode` directly. No injection key, no provider component. `vi.resetModules()` in tests gives a fresh module each run.
- **Refs as `Ref<HTMLElement | null>`, not raw elements** — `applyMode` reads `.value` at call time, so it doesn't matter that the refs are empty during setup. By the time `App.vue`'s `onMounted` calls `applyMode()` (children mount before parents), `EditorArea` has populated them.
- **`renderMainLines` is a callback parameter** — Tranche 5 swaps the no-op stub for the real renderer without re-touching this composable. The call site (inside `applyMode`'s hotkey-mode branch) is preserved verbatim from the monolith.
- **No `rebuildHkPanel()` call** — Vue's reactivity re-renders `ControlsPanel`'s computed `modeCells`/`actions` when `hotkeyMode`/`offsetSeekMode` change. The monolith's explicit `rebuildHkPanel()` call at the end of `applyMode` is a no-op in Vue. Documented as a port delta in the composable header.
- **No secondary-focus auto-switch** — the monolith's "Auto mode switch when secondary focused" section comment is documentation drift (no focus/blur handlers in `addSecondary()`). Not implemented here. If a future tranche adds it, the wiring is `SecondaryField.vue` `@focus` → `setHotkeyMode(false)`. The full rationale is documented above in this section.
- **`toggleOffsetSeek` doesn't call `applyMode`** — offset seek is orthogonal to which view (rendered list vs raw textarea) is shown. It only changes how the ts-adjust hotkeys behave, which is Tranche 5's dispatch.
- **`setHotkeyMode` is idempotent** — no `applyMode` when the value is unchanged. Pinned by a test.
- **Test infrastructure quirks** — happy-dom has no layout, so `ta.scrollHeight = 0` makes `lineH = 0` and `topLine = NaN`; tests stub `scrollHeight` via `Object.defineProperty`. The double-rAF in typing mode is mocked by overriding `globalThis.requestAnimationFrame` to fire synchronously (`vi.useFakeTimers` doesn't cover rAF). Spying on `Element.prototype.scrollIntoView` doesn't work in happy-dom; spy on the element instance instead.

#### Tranche 4 implementation notes (2026-09-09)

`useAudio.ts` shipped. Key decisions recorded for future tranches:

- **Reactive DOM sync replaces `applyVolume()`** — the monolith's imperative `getElementById().value =` / `.textContent =` / `.style.display =` pattern becomes Vue `:value` / `{{ }}` / `:style` reactive bindings. A `watch([masterVolume, masterMuted])` syncs `audioEl.volume`/`muted`. `applyVolume` is gone — the reactivity system IS `applyVolume`. This is the single-file-html-app skill's "single source of truth for stateful UI" rule in practice. Future tranches should follow the same pattern: prefer reactive bindings over imperative DOM sync functions.
- **`_preMuteVolume` eliminated via single source of truth** — `savedVolume` (`useVolume()`) IS the pre-mute volume; `masterMuted` (`useMuted()`) is the mute flag; `masterVolume = computed(() => masterMuted.value ? 0 : savedVolume.value)`. No save/restore dance. This eliminates the double-flag bug pattern. Future tranches encountering similar dual-variable state should collapse to one source + a computed.
- **`_volWheeling` guard unnecessary in Vue** — `:value` bindings don't emit `@input` events on programmatic changes (unlike direct `el.value =` in the monolith). The guard was a workaround for direct DOM manipulation. Future tranches can drop similar guards when they move to reactive bindings.
- **Cross-tranche callbacks default to no-ops** — `getMainText`/`setMainText`/`doAutosave`/`updateTitleFromText`/`updateActiveLineFromTime`/`renderMainLines`/`scrollToPlaying`/`syncSecScroll`/`announce` are passed to `initAudio(refs, callbacks)` and default to no-ops. Tranche 2 (when it ships) provides `doAutosave`/`updateTitleFromText`; Tranche 5 provides the rest. The call sites are preserved so those tranches swap in real functions without re-touching `useAudio`.
- **`mountProgressDrag()` returns a cleanup function** — the monolith's progress-bar drag IIFE (document-level `mousemove`/`mouseup`) becomes a function that attaches listeners and returns a cleanup. `LeftPanel` calls it in `onMounted` and calls cleanup in `onBeforeUnmount`. Future tranches with document-level listeners should follow this pattern.
- **`useSpeed` validate amended to `[0.1, 4]`** — was `(0, 5]` in Tranche 1; the monolith's runtime clamp (`changeSpeed` + Init) is `[0.1, 4]`. A stored 4.5 or 0.05 now falls back to 1 at load instead of sneaking through. The HTML input's `min=0.05` is a stale attr with no effect (changeSpeed clamps). Documented as a Tranche 1 amendment.
- **`setupAudio`'s `[ti:]` update uses callbacks** — `getMainText()`/`setMainText()` instead of `getTA()`/`_setTA()`. The `[ti:]` update logic is verbatim: only overwrite if blank or "unknown".
- **Test infrastructure quirks** — `HTMLAudioElement.duration` is readonly in happy-dom; tests stub it via `Object.defineProperty(el, 'duration', { value, configurable: true, writable: true })`. The progress-bar drag test dispatches events sequentially and asserts after each (not all-then-assert). `toggleMute` doesn't write `lbl_vol` to localStorage — `savedVolume` stays in-memory until the user explicitly sets volume via the slider (monolith parity: `applyVolume` writes `lbl_vol` with `_preMuteVolume`, which is the same in-memory value).

#### Tranche 5 implementation notes (2026-09-15)

`useSync.ts` + `timestampSync.ts` shipped. Key decisions recorded for future tranches:

- **Pure helpers extracted to `src/utils/timestampSync.ts`** — the four unique-to-`tests/logic.spec.js` functions (`peelLastParen`, `findNextTimestampMs`, `assignInterpolatedTs`, `batchSplitParens`) and their internal helpers (`findPrevTsMs`, `findNextTsMs`, `findRunEnd`, `findNextUnprocessedSplit`, `findNextNonMetaFromIdx`). The Phase E consolidation begins here: the corresponding `tests/logic.spec.js` sections can be deleted once Phase E cutover is verified (the Vitest specs replace them). Naming drops the leading underscore per Phase C convention (matches `findLastMetaIdx`/`collapseBlanks`).
- **`setMainText(t)` is owned by `App.vue`**, not the composable. The monolith inlines `_setTA(t); renderMainLines(); checkLineCounts(); updateMergeBtn(); updateTitleFromText(); doAutosave(); pushSnapshot();` everywhere; Tranche 5 collapses it into one callback so the composable's calls are one-liners. The wholesale-replacement pattern (pre + post `pushSnapshot`) is preserved per the code-quality skill + `useUndoRedo`'s documented invariant. Future tranches calling `setMainText` for wholesale replacement get pre + post snapshots automatically; incremental edits should call `pushSnapshot()` once (post-change only).
- **`renderMainLines` uses innerHTML string assembly** instead of `createElement` per line. Faster for large lists (the line list is rebuilt from scratch on every render — potentially hundreds of lines). Click handlers come from a single delegated `mousedown` listener on `#main-lines` (uses `data-idx` attribute to recover the line index, avoiding one `addEventListener` per line). HTML-escapes text content via `_escapeHtml` to prevent XSS (the monolith's `textContent` per line was XSS-safe; the innerHTML path needs explicit escaping).
- **The `_seekOffsetRef` is shared between `useAudio` and `useSync`** — `LeftPanel` registers it via `setSeekOffsetRef(ref)` for `useSync`, and `useAudio.initAudio({ seekOffset })` already owns the same ref. Both composables read the input value (no second DOM lookup). The `setSeekOffsetRef` setter exists because `LeftPanel` owns the ref, not `EditorArea` (which calls `initSync` with the main editor refs).
- **`suppressAuto` is a module-level singleton timer** — same semantics as the monolith's `arrowNavTimer`/`suppressAutoLine`. Exported `isAutoLineSuppressed()` for the future Tranche 9 keyboard handler's `_handleTypingModeArrowKeys` (which reads the flag to skip auto-line-follow).
- **No `rebuildHkPanel()` calls** — Vue's reactivity re-renders `ControlsPanel` when `offsetSeekMode` changes (the only state `setOffsetMode` mutates). The monolith's explicit `rebuildHkPanel()` call at the end of `setOffsetMode` is a no-op in Vue.
- **`#main-lines` paste handler is hotkey-mode-only**; `#main-textarea` paste handler is typing-mode-only. The monolith attached both with a `hotkeyMode` check at the top; the Vue port splits the responsibility cleanly via the EditorArea template's `@paste` on each element.
- **`tickSeekOffset` / `onSeekOffsetChange` persist cfg directly** via `localStorage.setItem('lbl_cfg', JSON.stringify(cfg.value))` — the monolith calls `saveCfg()` (an inline `localStorage.setItem`). Tranche 8 (settings dialog) may consolidate this into a `setCfg` helper; for now, the direct write matches the monolith.
- **`markAsTranslation` reads the `#main-split-check` / `#main-paren-check` checkboxes from the DOM** (via `document.getElementById`) — EditorArea owns them and they're not reactive state. A future refactor could move them to `useAppState` (Tranche 6 or 9), but for now the DOM-read path matches the monolith.
- **`setOnInputCallback(cb)` decouples `useSync` from `useUndoRedo`** — the typing-mode input handler schedules a debounced snapshot push via this callback. App.vue wires it to `undoRedo.scheduleInputSnapshot(...)`. Without this decoupling, `useSync` would import `useUndoRedo`, which imports `useAppState`, which `useSync` also imports — a circular dependency.
- **Test infrastructure quirks** — `peelLastParen` handles unbalanced parens gracefully (tracks depth, returns the partial group, not null); `findNextTimestampMs` does NOT skip meta/blank lines (differs from `findNextTsMs` which does — `markAsTranslation` relies on this); `assignInterpolatedTs` mutates the array in place (callers pass a fresh copy); `tsToMs('[00:01.00]') = 1000` (NOT 100ms — the `.cc` field is centiseconds × 10 for ms); `renderMainLines` no-ops when the `mainLines` ref is unbound (pre-mount, pure-node tests).

#### Tranche 6 implementation notes (2026-09-15)

`useMerge.ts` + `SecondaryField.vue` (full wiring) + `MenuBar.vue` (Add/Hide/Merge) + `EditorArea.vue` (render from `secondaryPool`) + `App.vue` (`initMerge` + `setSyncCallbacks` Tranche 6 stubs become real). 32 new specs (31 merge + 1 secondaryField added). Full suite 339/339 green.

- `lrcParser.ts` amendments — `getMainLyricLines(lines)` and `getSecLines(text)` ported from the monolith body. PORT DELTA: take the text/lines as a parameter instead of reading `getTA()`.
- `useMerge.ts` (new) — ports the monolith Secondary fields + Line counts/merge sections. Owns `addSecondary`/`removeSecondary` (pool management — toggle `visible` on pool entries), `checkLineCounts`/`updateMergeBtn` (warn-bar state + merge button disabled state), `mergeTranslations` (`_buildMergedResult` verbatim from the monolith), `syncScrollFrom`/`syncSecScroll` (scroll sync), `onSecInput`/`onSecPaste`/`onSecKeydown`/`onSecFileImport` (SecondaryField handlers). Singleton pattern: `initMerge(callbacks)` called once in `App.vue` setup.
- `useAppState.ts` amendments — `SecondaryEntry` interface augmented with `warnText`/`warnVisible`/`textareaEl` (marked optional so existing constructors with just `{ visible, text }` still type-check). Added `mainWarnText` + `mainWarnVisible` refs (the monolith imperatively wrote `#main-warn.textContent`; Vue binds reactively).
- `SecondaryField.vue` amendments — full wiring: `:value="entry?.text"` + `@input="onSecInput"` + `@paste="onSecPaste"` + `@keydown="onSecKeydown"` + `@scroll` (syncScrollFrom) + `@vue:mounted`/`@vue:unmounted` (register `textareaEl` on the pool entry). Paren checkbox is local `ref(true)` per component instance. File picker (`#sec-file-${index}`) `@change="onFileChange"` reads the file + cleans + paren-wraps + replaces pool entry text.
- `MenuBar.vue` amendments — Add field `@click="addSecondary"`, Hide field `:disabled="hideDisabled"` (computed: no visible secondaries) + `@click="removeSecondary"`, Merge fields `:disabled="mergeDisabled"` (computed: `mergeDone || computeMergeBtnDisabled()`) + `@click="mergeTranslations"`.
- `EditorArea.vue` amendments — `v-for` over `secondaryPool` (not the computed `secondaryCols`) with `v-show="entry.visible"` so each `SecondaryField` receives its actual pool index as `:index`. `#main-warn` binds `:class="{ visible: mainWarnVisible }"` + `{{ mainWarnText }}`. `#main-scroll` `@scroll="syncScrollFrom"` for secondary-field scroll sync.
- `App.vue` amendments — `setSyncCallbacks` wires Tranche 6 stubs to real `checkLineCounts`/`updateMergeBtn`/`syncSecScroll`. `initMerge` wires `setMainText` + `pushSnapshot` + `scheduleSecInputSnapshot` + `markGeniusSource` (no-op until Tranche 9). `applySnapshot` now clears extra secondaries beyond the snapshot's length (the documented invariant) + restores each snap entry's text.
- **Port deltas:**
    - **`secondaryPool` is the single source of truth** (Tranche 1 port delta). add/remove toggle `visible` on pool entries — no separate `secondaryCols` array to keep in sync (it's a computed). The monolith's `secondaryPool.push(entry); secondaryCols.push(entry);` becomes one push.
    - **`_handleSecKeydown` stays in the Tranche 9 keyboard handler** — it dispatches through `cfg.hotkeys` and `HOTKEY_ONLY`. Tranche 6's `onSecKeydown` is a stub that stops propagation on navigation keys + space/enter/tab/escape (the always-block set). Tranche 9 replaces it with the full dispatch.
    - **`checkLineCounts` reads `secondaryPool.value` directly** (filtering visible entries). The warn-bar DOM writes become reactive `:class` + `{{ }}` bindings on `SecondaryField.vue` — the component reads `warnText`/`warnVisible` from the pool entry's reactive state.
    - **`updateFieldBorders` is a no-op** — the monolith's imperative DOM write (set `borderRight: none` on the last visible column) is handled by Vue's reactivity (the `v-show` toggles display + CSS `:last-child` could handle the border; for now the visual border is a non-blocking cosmetic concern).
    - **`mergeTranslations` uses `getMainLyricLines` + `getSecLines`** (pure helpers in `lrcParser.ts`) instead of inlining the filter logic. The `_buildMergedResult` builder is verbatim from the monolith.
    - **`syncScrollFrom` is a DOM imperative** (no clean reactive equivalent for scroll position). The `suppressScrollSync` guard is shared with `useAppState` (Tranche 1) — same singleton semantics.
    - **`onSecInput` collapses 3+ consecutive newlines to 2** (monolith parity) and writes the cleaned text back to the pool entry's `text` field.
    - **`onSecPaste` cleans + paren-wraps** (per the paren checkbox) and inserts at the caret. Genius paste triggers `markGeniusSource` (Tranche 9 owns that — stub for now).
    - **`SecondaryEntry` additions are optional** (`warnText?`/`warnVisible?`/`textareaEl?`) so existing constructors in `useAutosave` + tests still type-check. `addSecondary` always populates them; `SecondaryField` reads with `?.` for safety.
- **Quirks pinned by tests:** `addSecondary` caps at `MAX_SECONDARIES=10` (alerts on 11th); `removeSecondary` always hides the last visible (scanning backwards from pool end); `checkLineCounts` resets `mergeDone` when no visible secondaries exist; `mergeTranslations` alerts on each precondition failure (no timestamps / not all lines ts'd / count mismatch / no trailing ts); `computeMergeBtnDisabled` returns false only when all preconditions met (hasTs + hasTrailing + allLyricLinesHaveTs + secondary content + count match); `onSecInput` collapses `\n{3,}` → `\n\n`; `onSecPaste` strips meta + headers + paren-wraps per checkbox; `syncScrollFrom` no-ops when `suppressScrollSync` is true.
- **Files touched:** `src/utils/lrcParser.ts` (2 additions), `src/composables/useMerge.ts` (new), `src/composables/useAppState.ts` (SecondaryEntry augmentation + mainWarnText/mainWarnVisible), `src/components/SecondaryField.vue` (full wiring), `src/components/MenuBar.vue` (Add/Hide/Merge), `src/components/EditorArea.vue` (v-for over pool + `#main-warn` reactive + `#main-scroll` scroll sync), `src/App.vue` (initMerge + applySnapshot secondary restore), `tests/unit/secondaryField.test.ts` (updated — no longer "stays unbound"), `tests/unit/merge.test.ts` (new — 31 specs).

#### Tranche 7 implementation notes (2026-09-15)

`useImport.ts` + `MenuBar.vue` (Open/Save) + `App.vue` (`#file-picker` ref + middle-click handler + `initImport`). 12 new specs. Full suite 351/351 green.

- `useImport.ts` (new) — ports the monolith Import section. Owns `doImport` (opens `#file-picker`), `doSave` (builds filename from `[ti:]` tag or fallback, sanitises, downloads as .lrc), `onFilePickerChange` (multi-file dispatch: audio-only / lrc-only / audio+lrc pair), `onMiddleClick` (middle-click → `doImport`, or open secondary picker if hovering over a visible secondary textarea). Singleton pattern: `initImport(callbacks)` + `setFilePickerRef(ref)` called once in `App.vue` setup.
- `MenuBar.vue` amendments — Open button `@click="doImport"`, Save button `@click="doSave"`. Both `@mousedown.prevent` (focus prevention — clicking a menu button must not steal focus from the editor).
- `App.vue` amendments — `filePicker` ref registered via `setFilePickerRef(filePicker)` so `useImport` can trigger the picker click + read the change event. `onMounted` attaches `document.addEventListener('mousedown', onMiddleClick)` + `fp.addEventListener('change', onFilePickerChange)`. `onBeforeUnmount` removes both. `initImport` wires `setMainText` + `setupAudio`/`clearAudio` + `setSongTitle`/`setSongArtist` + `pushSnapshot`/`seedUndo`/`takeSnapshot` + render/checkLineCounts/updateMergeBtn/updateTitleFromText callbacks.
- **Port deltas:**
    - **State reads come from `useAppState` refs** (`mainText`, `lastImportStem`, `savedAudioPath`, `secondaryPool`, `activeLine`, `playingLine`, `selectedLines`). The monolith reads module-level `let`s directly.
    - **`setupAudio` + `clearAudio` are callbacks** (`App.vue` wires to `useAudio`). `useImport` doesn't import `useAudio` (avoids a circular dependency — `useAudio` imports `useAppState` which `useImport` also imports).
    - **`setMainText` is a callback** (`App.vue` owns the side-effect chain). The monolith inlines `_setTA(text); renderMainLines(); checkLineCounts(); …`. Tranche 5 collapsed it into `setMainText(t)`.
    - **`#settings-overlay` open check is gone** — the monolith checked `settings-overlay.classList.contains('open')` before `doImport` to prevent middle-click import while settings is open. In Vue, the `SettingsDialog` is a shadcn-vue `Dialog` with its own focus trap — middle-click outside the dialog doesn't reach the document handler. The check is unnecessary.
    - **`resetStateForPairImport()`** — the monolith clears undoStack, redoStack, activeLine, playingLine, selectedLines, secondaryPool visibility, audioEl, playing, savedAudioPath, song-title, song-artist. Vue-side, most of these are reactive refs that reset by reassignment. The undo stack is cleared via `seedUndo` (`useUndoRedo`) after the lrc is read.
    - **Middle-click secondary picker** — the monolith finds the secondary entry whose `col.contains(e.target)` and opens its file picker. Vue-side, `SecondaryField` registers its file picker via the pool entry; `useImport` scans `secondaryPool.value` for a visible entry whose `textareaEl` contains the click target, then finds the picker by `#sec-file-${poolIndex + 1}` id.
- **Quirks pinned by tests:** `doImport` resets `picker.value = ''` before click (so re-selecting the same file fires `change`); `doSave` sanitises filename via `stem.replace(/[/\\:*?"<>|]/g, '_')`; `onFilePickerChange` alerts on `MAX_LINES` exceeded; audio+lrc pair resets state before `setupAudio`; middle-click no-ops when `button !== 1`; middle-click over a secondary textarea opens the per-field picker.
- **Files touched:** `src/composables/useImport.ts` (new), `src/components/MenuBar.vue` (Open/Save wiring), `src/App.vue` (filePicker ref + initImport + onMiddleClick/onFilePickerChange listeners), `tests/unit/import.test.ts` (new — 12 specs).

### Phase E — Verify and Swap

**This section is the single source of truth for Phase E tranche details** — cutover steps, snapshot regen strategy, deploy pipeline wiring, and post-cutover cleanup. MEMORY.md no longer duplicates this content; it points here.

Phase E is the cutover from `docs/index.html` (the monolith, live on Pages) to the Vite-built `dist/`. It happens on `main`, ordered so the live site never serves a broken build. The cutover is the highest-risk moment in the entire refactor — every prior phase was sandboxed on `staging` with the monolith as fallback. Once Pages source flips, the monolith is gone.

Each tranche ships its verification + cutover step + Vitest/Playwright specs. Tranches 1–4.5 are pre-cutover (still on `staging`, monolith still live); tranche 5 is the cutover itself; tranches 6–8 are post-cutover cleanup. **All tranches require the user to run the full Playwright suite locally via `tst`** — the sandbox cannot run Playwright (snapshot data overwhelms context). The agent writes test code + verification scripts; the user runs them and pastes results. **Tranche 3 (local-test checkpoint) is the gate** — the user manually verifies the Vite build in both Playwright Codegen and a real browser before the cutover.

**ESLint in the deploy pipeline** — the committed `deploy.sh` template (`ai/chat.z.ai/scripts/delivery/deploy.sh`) runs ESLint between `npm install` and `npm run test:unit`: `eslint src/ --fix` (autofix) then `eslint src/` (gate, fails the deploy if issues remain). This mirrors the sonar-issue-exporter deploy pattern (ruff --fix → ruff gate → pytest) and catches SonarQube-rule violations locally before they reach CI — reducing the back-and-forth of upload → SonarCloud scan → fix → re-upload that plagued the S2083 path traversal remediation. The ESLint config (`eslint.config.mjs` with `@eslint/js` + `eslint-plugin-sonarjs` + `eslint-plugin-vue`) was set up in roadmap item 2 and reconfigured in Phase A; the deploy pipeline integration makes it enforceable on every `dpl` run once `src/` patches are shipped. See `code-quality-SKILL.md` (Review bundle) → "Pre-delivery code quality checklist" item 10 + "Blocking Sonar issues: comply, don't bypass" for the full rationale.

#### Tranche plan

- **Tranche 1 — `beforeunload` wiring + isDirty bridge** (pre-cutover, sandbox-safe) — **Status: Done (Sep 16, 2026).** 13 new Vitest specs (9 isDirty watch + 4 App.vue beforeunload integration via happy-dom); 473/473 specs green; `vue-tsc -b` clean. Implementation: a `watch` in `useAppState` on `[mainText, secondaryPool]` with `{ immediate: true, deep: true, flush: 'sync' }` sets `isDirty.value` from the dirty check; `App.vue`'s `onMounted` adds a `beforeunload` listener that re-reads `mainText.value` + `secondaryPool.value` directly (so a stale `isDirty` can never suppress the warning), removed in `onBeforeUnmount`. The secondary check reads `secondaryPool` (all entries, including hidden) — not `secondaryCols` (visible-only computed) — so hidden entries with text still trigger the warning. Original spec preserved below for reference: the monolith's `beforeunload` dirty-check (lines 2766–2770) reads `getTA()` and `secondaryCols[].linesEl.value` directly. The Vue port has `isDirty` as a ref in `useAppState` (Tranche 1) but it's never set to `true` anywhere — `App.vue` has no `beforeunload` listener. This tranche closes that gap: wire `beforeunload` in `App.vue`'s `onMounted` to read `mainText.value` + `secondaryPool.value` (filter visible, check `.text`), set `isDirty` reactively from a `watch` on `mainText` + `secondaryPool` (deep), and remove the listener in `onBeforeUnmount`. **Port delta**: the monolith's `getTA().trim() !== cfg.default_meta.trim()` check (treats default-meta-only content as "not dirty") becomes a `mainText.value.trim() !== cfg.value.default_meta.trim() && mainText.value.trim() !== ''` check. **Quirk to preserve**: the monolith checks all `secondaryCols` (visible + hidden); the Vue port checks `secondaryPool.value` (all entries, since hidden entries may still have text from a previous session). 8–12 new specs (appState isDirty watch + App.vue beforeunload integration via happy-dom). No Playwright snapshot regen — `beforeunload` is a runtime behavior, not a DOM structure change.

- **Tranche 2 — Playwright retarget to Vite preview** (pre-cutover, on `staging`) — **Status: Done (Sep 16, 2026).** Three files patched: `tests/helpers/index.js` `getAppUrl()` branches on `LBL_VITE_TARGET=1` only (auto-detect via `dist/index.html` removed — too aggressive in SSH+Syncthing workflow); `playwright.config.js` branches `webServer.command` (`npx vite preview --port 5173 --strictPort` vs `npx serve . -l 3004`) + `use.baseURL` (`http://localhost:5173` vs `http://localhost:3004`); `tests/PLAYWRIGHT_SETUP.md` documents the SSH+Syncthing workflow. The `tst` is a **server-side bash script** at `~/.local/bin/tst` (not a PC fish function) — the repo's section-4 bash script is the template; the Server copy lives outside the synced repo and must be updated manually to propagate `LBL_VITE_TARGET` into Podman. The human runs `ssh Server "LBL_VITE_TARGET=1 tst"` (master key); the agent's `agent-tst` restricted-key path routes through `tst-locked` (allowlists Playwright args, does NOT pass env-var prefixes) — Tranche 3 uses the master key interactively. **`[INEFFECTIVE_DYNAMIC_IMPORT]` Vite build warnings** (`useMerge` in `SecondaryField.vue`, `useSync` in `useGlobalHotkeys.ts`) are harmless — intentional circular-dependency breakers; `vite-plugin-singlefile` inlines everything for production. **Next step (Tranche 3)**: update Server's `~/.local/bin/tst` → `npm run build` on PC → wait for Syncthing sync (REST API poll or `ssh Server 'stat -c %Y ~/GitHub/linebyline/dist/index.html'`) → `ssh Server "LBL_VITE_TARGET=1 tst -- --update-snapshots"` to regenerate baselines → `ssh Server "LBL_VITE_TARGET=1 tst"` for the full suite. Original spec preserved below for reference: the full Playwright + Codegen + UI-mode toolchain currently hardcodes `docs/index.html` as the target. This tranche adds a `LBL_VITE_TARGET` env-var branch to every layer so the Vite build can be tested without removing the monolith target. **Three files change**:
  1. **`tests/helpers/index.js`** — `getAppUrl()` returns `/` when `LBL_VITE_TARGET=1` (or auto-detect via `fs.existsSync('dist/index.html')`), otherwise `/docs/index.html` (current behavior).
  2. **`playwright.config.js`** — `webServer.command` branches: `npx vite preview --port 5173` when `LBL_VITE_TARGET=1`, otherwise `npx serve . -l 3004` (current). `use.baseURL` branches to `http://localhost:5173` vs `http://localhost:3004`. The `reuseExistingServer: !inCI` setting works for both — Playwright reuses whichever server is running.
  3. **`tests/PLAYWRIGHT_SETUP.md`** — the `cgn` and `tsta` fish functions hardcode `http://localhost:3004/docs/index.html`. Document the Vite-target variants: `cgn` targets `http://localhost:5173/` (no `/docs/index.html` suffix); `tsta` needs `LBL_VITE_TARGET=1` set before invocation so `playwright.config.js`'s `webServer` starts `vite preview` instead of `serve`. The user may add fish function wrappers (`cgn-vite`, `tsta-vite`) or set the env var inline (`env LBL_VITE_TARGET=1 tsta`).

  **Two modes coexist during Phase E**: the default still targets `docs/index.html` (so the monolith Playwright suite keeps running until Tranche 6 deletes it); the Vite-target mode is opt-in via env var so the user can run `LBL_VITE_TARGET=1 tst` to verify the Vue build against the full Playwright suite before cutover. **No new specs** — the existing ~540 specs run against both targets. **Expect `.aria.yml` snapshot regen** when first running Vite-target mode: Vue produces different DOM structure (shadcn-vue `Dialog` vs custom overlay, `<button>` vs `<div role=button>` in HotkeyCell, etc.) — same ARIA semantics, different element tree. The user regenerates baselines via `LBL_VITE_TARGET=1 npx playwright test --update-snapshots` locally, then commits the new baselines. **Font-fragile screenshots** (see `playwright-testing-SKILL.md`, Test bundle): most font-fragile tests already have the `!CI && !PW_CONTAINER` skip guard; the Vite build uses the same `system-ui, sans-serif` stack so font metrics don't shift. **`findLatestVersion()`** — currently returns `/docs/index.html`; under Vite-target mode it returns `/` (the preview server root). No version-folder scan needed since Vite serves a single `dist/index.html`. **Files touched**: `tests/helpers/index.js`, `playwright.config.js`, `tests/PLAYWRIGHT_SETUP.md` (documentation-only for the fish function variants).

- **Tranche 3 — Local-test checkpoint** (pre-cutover, the gate) — **Status: Done (Sep 17, 2026).** Tranche 3 is complete — the local-test checkpoint passed. The `deploy.sh` `npm run build` fix (added earlier in session 8) worked: `dist/` is now rebuilt after Vitest, so source patches reach Playwright (no more stale `dist/` served by `vite preview`). Two non-logic failures were fixed in session 9: `typing-mode meta-save-update` (firefox-only) via `window.doSave` exposure in `App.vue` + `useGlobalHotkeys.ts` (the Vue port was calling the imported `doSave()` directly, bypassing the test's `window.doSave` monkeypatch); and `intervals typing-debounce-1` (chromium-only) via a 50ms wait after pressing Escape (lets the save-on-close watch commit `undo_debounce_ms=1`) plus a bumped inter-keystroke wait (20ms → 50ms) to cover the HTML5 timer clamp + microtask drain. 253 Playwright failures remain: 252 × `logic.spec.js` (84 unique `ReferenceError: X is not defined` × 3 browsers — deferred to Tranche 4) + 1 × `assign-conflict-tab` (needs a test rewrite). See `tests/FAILURES.md` for the current failure breakdown. The four test categories below were the verification standard applied; they remain the gate for any future regression check:

  1. **Full Playwright suite (headless, `tst`)**: `LBL_VITE_TARGET=1 tst` — runs all ~540 specs against the Vite build in the Podman container. Regenerate snapshots first: `LBL_VITE_TARGET=1 npx playwright test --update-snapshots`, commit the new baselines, then run the suite clean. **Gate**: all specs green (or the only failures are pre-existing flaky tests documented in `playwright-testing-SKILL.md` → "Known flaky test categories").
  2. **Playwright UI mode (`tsta`)**: `env LBL_VITE_TARGET=1 tsta` — interactive debugging against the Vite build on the Fedora host. Use this to investigate any failures from step 1. Webkit is disabled on host (unstable on Linux per `playwright.config.js`); run `LBL_VITE_TARGET=1 tst` for the webkit project in the container if needed.
  3. **Playwright Codegen (`cgn`)**: `cgn-vite` (or `env LBL_VITE_TARGET=1 cgn`) — opens a Chromium browser at `http://localhost:5173/` with the Playwright Codegen inspector. Use this to manually click through the app's UI and verify behavior matches the monolith. The Codegen window records actions as Playwright test code — useful for writing new specs if a behavioral gap is found. For Firefox Codegen: `env LBL_VITE_TARGET=1 cgn --browser firefox`.
  4. **Real-browser manual tests (`MANUAL.md`)**: open `http://localhost:5173/` in a real browser (not Playwright's controlled browser). Run through every item in `tests/MANUAL.md` — file picker window, playback and focus, instant replay, Genius paste, undo debounce, unsaved work warning, huge file import. The MANUAL.md tests cover behaviors Playwright can't automate (audio sounding "normal", OS-level file picker windows, undo debounce timing). **Gate**: all MANUAL.md checkboxes ticked.

  **Why this is a separate tranche and not just a step within Tranche 2**: Tranche 2 is infrastructure (the env-var wiring + config branching). This tranche is verification — the user's manual judgment that the Vite build is behaviorally equivalent to the monolith. The four test categories use different tools (headless Playwright, UI-mode Playwright, Codegen browser, real browser) and catch different classes of regression. Skipping this tranche and going straight to Tranche 5 (cutover) risks shipping a Vite build that passes automated tests but has a manual-test gap (e.g. audio sounds wrong, or the OS file picker doesn't open). **No new specs** — this tranche produces a paste of test results, not code. **Pre-conditions**: Tranche 2 done (the `LBL_VITE_TARGET` env var is wired). **Post-conditions**: the user confirms all four categories green, then proceeds to Tranche 4.

- **Tranche 4 — `tests/logic.spec.js` consolidation** (done, Sep 22, 2026) — `tests/logic.spec.js` deleted entirely; all 84 unique test cases consolidated into the existing Vitest unit suite. The 4 functions unique to `logic.spec.js` (`peelLastParen`, `batchSplitParens`, `findNextTimestampMs`, `assignInterpolatedTs`) were already covered by `tests/unit/timestampSync.test.ts` (Phase D Tranche 5). The 10 shadowed functions were covered by `tests/unit/lrcParser.test.ts`, `tests/unit/hotkeys.test.ts`, `tests/unit/geniusExtractor.test.ts`, and `tests/unit/pasteHandlers.test.ts`. Edge-case audit found 26 missing cases (tsToMs max-2-digit + single-digit-null + trailing-content; msToTs centisecond-truncation; isEndTs trailing-whitespace + plain-line; replaceTs end-ts; stripSecLine double-space; normalizeLrcTimestamps 2-decimal + mixed; collapseBlanks single/no-blank/trailing/multi-run; normKey uppercase + multi-char; keyStr Shift+ArrowUp + bare-Space; isRestrictedForAll Ctrl+C/Tab/Alt+F/Ctrl+;/ArrowDown; isRestrictedForKey Ctrl+; + BracketLeft; cleanGenius YMAL + section-headers; peelLastParen paren-only + unbalanced-close-before-open) — all ported before deletion. Also fixed a pre-existing `sonarjs/no-duplicate-test-title` in `timestampSync.test.ts`. Full Vitest suite: 501/501 green (was 475 + 26 new); `vue-tsc -b` clean; `eslint src/` clean. **Files touched**: `tests/logic.spec.js` (deleted), `tests/unit/lrcParser.test.ts`, `tests/unit/hotkeys.test.ts`, `tests/unit/geniusExtractor.test.ts`, `tests/unit/timestampSync.test.ts`.

- **Tranche 4.5 — Regression coverage + MANUAL.md automation** (pre-cutover, sandbox-safe, in progress Sep 24, 2026) — dogfood the localhost Vite build (`srv`) to discover remaining feature regressions, then automate as many `tests/MANUAL.md` items as reasonably possible. Each regression found during Phase E pre-cutover testing revealed a test coverage gap — the missing highlighter/border wasn't caught by any Playwright test (screenshot tests were dropped), the nonfunctional hotkeys weren't caught (Playwright's synthetic events bypass browser-level interception), the refresh-persistence wasn't caught (no Playwright test reloads + checks empty state). This tranche closes those gaps before the cutover.
    - **Regression dogfooding**: use `srv` + real browsers (Helium, Firefox, LibreWolf) to test every `MANUAL.md` item against the Vite build. Log any new regressions in `tests/FAILURES.md`. The `srv` fish function now opens the default browser automatically via `xdg-open`. **Status**: Sep 22, 2026 session 10 dogfood pass found + fixed: Genius paste metadata extraction, active-line highlighting (scoped CSS → global `<style>` block in EditorArea.vue), refresh-persists-lyrics (`sessionStorage.removeItem` before `loadAutosave`), NOW PLAYING focus stealing (`@mousedown.prevent` on panel buttons). Remaining UI quirks (slider click-to-seek halfway, Ctrl+` browser-level interception, Tab+Enter on buttons) are Codegen-specific; real browser (Helium) is fine.
    - **Screenshot vs ARIA tradeoff** — resolved Sep 24, 2026: structural assertions (`toHaveCSS`, `toHaveClass`, `toBeVisible`, `toBeFocused`, `toHaveValue`, `toHaveCount`, `page.evaluate()` for runtime state) dominate for MANUAL.md items. Screenshots are font-fragile per `playwright-testing-SKILL.md` (the skill recommends replacing with structural assertions when they fail in CI). ARIA snapshots don't capture CSS classes (`.cursor`/`.active`), CSS colors, audio state (`muted`/`volume`/`playbackRate`/`currentTime`), or focus state. The full per-test recommendation table is in this Tranche 4.5 implementation notes section below. Conclusion: avoid `toHaveScreenshot` for new Tranche 4.5 tests — every visual check (blue border, active-bg, theme) is `toHaveCSS` (CI-safe, environment-independent, catches the actual CSS property change). Avoid `toMatchAriaSnapshot` for runtime state — it doesn't capture the things MANUAL.md tests. Use structural assertions + `page.evaluate()` for runtime state.
    - **Real browser automation categorization** — resolved Sep 24, 2026: 5 MANUAL.md items genuinely require a real browser (audio "sounds normal", `Ctrl+W` unsaved warning, middle click tab close, tab `x` close button, real Genius page paste). 1 is partial (`page.close({ runBeforeUnload: true })` approximates the browser close button — the actual button click stays manual). Everything else is fully automatable in Playwright. The "real Genius page" qualifier is manual-only because cross-origin blocks prevent in-app fetching; the extraction logic is fully covered by the mock-based `paste-genius-hotkey`/`paste-genius-typing` tests (snapshot contains `[ti: Mock Song]`, `[ar: Alpha & Beta]`, `[al: Mock Album]`, `[re: Genius, ...]`).
    - **Playwright test additions** — first batch delivered Sep 24, 2026 (3 enhanced spec files, 6 new tests):
        - `tests/playback.spec.js` — enhanced `seek-click` (multi-position 1/13, 1/2, 12/13 with `#time-pos` regex checks — catches the session-10 "click-to-seek halfway" bug). New `seek-drag` (mousedown + mousemove + mouseup; verifies `#time-pos` reflects ~75% position after drag). New `focus-not-stolen` (clicks 10 NOW PLAYING / FontSelector buttons, verifies ArrowDown moves cursor after all clicks — catches `@mousedown.prevent` regression). New `focus-not-stolen-collapse-toggle` (Collapse + Expand panel toggle pair, verifies ArrowDown after).
        - `tests/theme-font.spec.js` — enhanced `theme-toggle` with structural `expect(page.locator('html')).toHaveClass(/dark/)` assertion alongside the existing screenshot (CI-safe regression guard if font metrics diverge).
        - `tests/sync-adjust.spec.js` — new `cursor-moves-with-q-e` (Q/E navigation moves `.lrc-line.cursor`). New `highlight-moves-with-w-enter` (W sync moves `.lrc-line.active`; uses real playback Space+wait+Space to fire timeupdate since audio is not in DOM and triggerTimeUpdate is a no-op). New `active-line-cursor-border` (`toHaveCSS` on `.lrc-line.cursor` border-left-color in light `rgb(9, 105, 218)` + dark `rgb(88, 166, 255)` themes).
    - **Existing screenshot tests NOT refactored this turn** (they pass in `tst`): `smoke.spec.js:landing/button-tint/button-feedback`, `settings.spec.js:persistence` (titlebar-dark.png), `sync-adjust.spec.js:replay-r/replay-shift+r/replay-moving-next/replay-sync-time/replay-another-line`. The skill recommends replacing with structural assertions, but only when they fail in CI. Refactoring risks losing the visual state coverage that's the test's whole point.
    - **Audio element DOM attachment gotcha** (learned Sep 24, 2026, sandbox-verified): `useAudio.ts:setupAudio` creates the audio element via `new Audio()` and does NOT attach it to the DOM. `document.querySelector("audio")` returns null. Tests that need to read audio state must: (a) use display elements (`#time-pos`, `#time-dur`, `#vol-slider`, `#speed-val`) which the app updates from audio events, (b) add `waitForTimeout(100)` after click/drag operations to let the display settle, (c) for `.active` class assignment, use real playback (Space + wait + Space) to fire a real `timeupdate` — the existing `triggerTimeUpdate` helper is a no-op because it dispatches on `document.querySelector("audio")` which returns null. Document in `playwright-testing-SKILL.md` (Test bundle) when that skill is next updated.
    - **Button accessible name gotcha** (learned Sep 24, 2026, sandbox-verified): Buttons with `title="..."` but no `aria-label` have their accessible name derived from text content (e.g. `▲`/`▼`), not from the title. `getByRole("button", { name: "Increase font size" })` fails. Use `page.locator('button[title="..."]')` for these. Buttons with dynamic `:title` bindings (play/pause `#btn-play-pause`, mute `#vol-mute-btn`) should be located by `#id`. The `getByRole` approach only works for buttons with stable `aria-label` (Seek back, Seek forward, Collapse panel, Sync file). Document in `playwright-testing-SKILL.md` (Test bundle) when that skill is next updated.
    - **Scaffolding updates** (deferred to follow-up turn):
        - `githubactions:S7630` resolved by DeepSeek (delivered Sep 24, 2026 as `playwright-snapshot-regen (fixed).yml`): pattern moves every unsafe `${{ inputs.* }}` in `run:` blocks into the step's `env:` block, then references as `$VAR` (shell variable expansion, not GitHub expression syntax). 4 instances at original L41, L54, L56, L57 all addressed. See `sonarqube-workflow-SKILL.md` (Review bundle) → "Step 3: githubactions:S7630" when that skill is next updated (currently covers S7631 fork-code but not S7630 script injection).
    - **Playwright test additions — second batch delivered Sep 24, 2026** (10 new tests, sandbox-verified via standalone Playwright script against `vite preview` + chromium): `keyboard-nav.spec.js:toggle-panel-ctrl-shift-tilde` (Ctrl+Shift+~ panel toggle), `settings.spec.js:hotkey-search-mode-toggle` (` enters hk mode, Escape exits — ⌨ icon + ` both return focus to search field), `import-paste.spec.js:import-10k-blocking` (10k-line alert dialog + empty textarea), `undo-redo.spec.js` 4 typing-debounce tests (fast-inline=1 step, slow-inline=3 steps, fast-newlines=1 step, slow-newlines=5 steps), new `tests/refresh-behavior.spec.js` (reload-clears-lyrics-audio + new-tab-starts-fresh), new `tests/beforeunload.spec.js` (beforeunload handler registered + preventDefault when dirty — headless chromium suppresses the dialog, so verify via synthetic Event dispatch).
    - **MANUAL.md pruned** Sep 24, 2026: automated items annotated with `[automated in <spec>:<test>]` pointers. The file now serves as the manual cross-check list the user runs before a release, not a list of untested behaviors.
    - **Mutation-testing finding** (Sep 24, 2026): the `reload-clears-lyrics-audio` test passes whether or not `sessionStorage.removeItem('lbl_autosave')` is present in `App.vue` — the test verifies the user-facing behavior (reload gives clean state) but does NOT pin the specific mechanism (`removeItem`). The autosave may not be written during the test's fast import cycle, or `loadAutosave` may not restore for another reason. The test is still valuable (it catches a regression where reload gives a dirty state) but doesn't catch a regression where `removeItem` is deleted. Document as a known test-coverage gap; a future test should verify `sessionStorage.getItem('lbl_autosave')` is null after reload to pin the mechanism.
    - **No new specs required for MANUAL.md items that can't be automated** (audio sounds "normal", OS file picker, undo debounce timing) — those stay manual. The goal is to automate the automatable, not force everything into Playwright.
    - **Pre-conditions**: Tranche 4 done. **Post-conditions**: all regressions patched, all automatable MANUAL.md items have Playwright coverage, `tst` is green (0 failures), `tsta` is green (UI mode tests pass on host). Then proceed to Tranche 5.

- **Tranche 4.6 — Git-based context loading + context-file refactor** (pre-cutover, sandbox-safe) — replace the Repomix-bundle workflow with `git clone --depth 1 --branch staging --single-branch` for sandbox context loading. The user's repo is public (`https://github.com/amokprime/linebyline`); a shallow clone of the staging branch takes ~2.4s and 30MB — faster and more complete than any Repomix bundle (which excludes binary files like `audio.mp3`, requires an `index.html` workaround for the Vite build, and wraps everything in XML). This tranche also refactors context files so the chat.z.ai harness can read them from the standard repo paths the other harnesses (ZCode, OMP) already use.
    - **Meta-question 1 answer (Repomix vs symlinked zip vs git clone)**: git clone wins. Repomix bundles are the worst option — XML wrapping adds parse overhead, binary files are excluded (the sandbox had to generate `audio.mp3` via ffmpeg and create a root `index.html` because both were missing from the bundle), and the agent has to extract files to a working directory anyway. Symlinked zip is better than Repomix (real files, no XML) but still requires a manual zip-upload step and has the same binary-exclusion problem if the zip is built from `.gitignore`-aware tooling. Git clone gives the agent the full repo tree as-is — every file, every binary, every config — in one command. The agent can `cd` into the clone and run `npm install` + `npm run build` + `npx playwright test` directly, no extraction or workaround needed.
    - **Meta-question 2 answer (fold Onboard into Build/Test)**: yes, fold it. With git clone, the agent has the full repo from turn 1 — there's no "Onboard bundle" vs "Build bundle" split. The Onboard step becomes "clone + read `AGENTS.md` + `MEMORY.md` + the skill matching the current task" — one step, not a separate bundle. The vibecoding-step model (Onboard → Build → Review → Test → Skills → Propose) becomes "the agent reads what it needs when it needs it" — the steps are still useful as a workflow description, but they no longer need separate bundle uploads. The `scratch/upload/` staging area and `.clean` flag-file grace-period mechanism from `scaffolding-updates.md` are not needed — git clone is cheap enough to run every session.
    - **Context-file locations (where the agent looks for `AGENTS.md`, `MEMORY.md`, skills)**: the staging branch already has BOTH root-level `AGENTS.md` + `MEMORY.md` (for ZCode/OMP harnesses) AND `ai/chat.z.ai/AGENTS.md` + `ai/chat.z.ai/MEMORY.md` (for the chat.z.ai harness). The chat.z.ai harness should switch to reading the ROOT-level files and stop maintaining separate copies. The root `AGENTS.md` already documents the multi-harness layout (line 3: "Edit project context here, not in `ai/chat.z.ai/`"). Skills currently live at `ai/chat.z.ai/skills/*-SKILL.md` (chat.z.ai) and `.zcode/skills/<name>/SKILL.md` (ZCode) and `.omp/skills/<name>/SKILL.md` (OMP) — three copies. The refactor should consolidate to ONE canonical location (the root-level `ai/chat.z.ai/skills/` is the natural choice since it's the most-developed set) and the other harnesses symlink or sync from it.
    - **Format / folder changes needed**: (1) the chat.z.ai `AGENTS.md` should be deleted (the root `AGENTS.md` supersedes it); (2) the chat.z.ai `MEMORY.md` should be merged into the root `MEMORY.md` (the root version is already a 164-line harness-agnostic subset; the chat.z.ai version's 277 lines include chat.z.ai-specific entries that should move to the root or to a skill); (3) the chat.z.ai skills should stay at `ai/chat.z.ai/skills/` (the canonical location) and the ZCode/OMP harnesses should sync from there; (4) the `scripts/delivery/` workflow (prepare.sh / deploy.sh / unpack.sh) should be replaced by a git-based workflow: the agent commits changes to the clone, pushes to a branch, and the user merges — no more `deliver.zip` + `dpl`. This is a substantial refactor; sketch it here, implement in a follow-up session.
    - **Will two `index.html` files cause problems when pushed?** No — the root `index.html` I created in the sandbox was a workaround for the missing Vite entry point (the Repomix bundle didn't include it). The repo already has `docs/index.html` (the monolith) and will have `dist/index.html` (the Vite build output, gitignored). The root `index.html` I created should NOT be pushed — it's a sandbox-only artifact. If the repo doesn't already have a root `index.html` (Vite entry), one should be added as part of the Phase A scaffold (or the Vite config should point at `docs/index.html` as the entry until the cutover). Check the staging branch — if root `index.html` doesn't exist there, the Vite build is using a different entry or a different config.
    - **Server-side or client-side post-cutover?** Client-side. The Vite + Vue + shadcn-vue app is a single-page application — the build output (`dist/`) is static HTML + JS + CSS served by GitHub Pages. When a user loads the site, GitHub Pages serves `dist/index.html` + the JS/CSS bundles; the browser runs the entire app client-side. There are NO server-side GitHub requests after the initial load — no API calls, no server-side rendering, no server-side data fetching. The app reads audio + lyrics files from the user's local filesystem (via the file picker) and stores state in `sessionStorage` / `localStorage`. The only network request after the initial load is the user opening a link (HELP, Issues, GitHub repo) which opens a new tab. The monolith (`docs/index.html`) works the same way — it's a single-file HTML app with no server-side component. The cutover changes the BUILD pipeline (Vite instead of the monolith), not the deployment model (still static GitHub Pages).
    - **Pre-conditions**: Tranche 4.5 done. **Post-conditions**: the chat.z.ai harness uses `git clone` for context loading; the root `AGENTS.md` + `MEMORY.md` are the canonical context files; the `ai/chat.z.ai/` copies are deleted or symlinked; the `deliver.zip` + `dpl` workflow is replaced by git push. Then proceed to Tranche 4.7.
    - **Context bloat from files on disk** (user-raised, Sep 24, 2026): the user's original reason for uploading slices rather than a zip of the whole repo was a concern that files on disk bloat context load. **Answer**: no — files on disk do NOT bloat context. The agent's context window is filled only by files it explicitly `Read` or `Grep`, not by the filesystem contents. A 30MB git clone on disk is invisible to the context window until the agent opens a file. The agent can `ls` the repo tree (cheap — just filenames) and `grep` for patterns (cheap — returns only matching lines) without loading every file. The original slice-upload concern was misplaced — the real constraint is what the agent CHOOSES to read, not what's available on disk. This reinforces the git strategy: a full clone gives the agent the option to read any file without the user having to predict which slice is needed.
    - **Running the full Playwright suite + context bloat** (user-raised, Sep 24, 2026): the user also wondered whether running the full ~7-min Playwright suite (possibly several times a session) bloats context, or whether it was tried during an unlucky peak-usage period. **Answer**: the concern is partially valid but manageable. Running `tst` via SSH (the current pattern) streams ~7 min of output to the terminal; the deploy.sh `log_filter` greps it down to errors + summaries, but the raw `tee` output can still be large (hundreds of `N) [browser] › testname` lines + error context blocks). The agent's context is NOT bloated by the SSH output if the deploy.sh filtering is tight — only the filtered `deploy.log` is printed to the chat, not the raw 7-min stream. The "peak usage" concern is about model latency/throughput, not context size — the sandbox waits for the SSH command to finish (no context consumed during the wait), then reads the filtered log (small). If the suite runs multiple times per session, the filtered logs accumulate but each is small (~10-50KB). The real risk is if the agent re-reads the full `deploy.log` multiple times — keep it in the worklog summary, not the chat context. Recommendation: keep `tst` runs scoped (`tst -g <pattern>`) when iterating on a specific test; run the full suite only at the end of a turn for the final verification. The sandbox standalone Playwright runner (`scripts/sandbox-test.js` pattern) is even cheaper — it runs 3-10 tests in ~10s with direct console output, no SSH, no filtering needed.

- **Tranche 4.7 — Sonar remediation + ARIA label coverage** (pre-cutover, sandbox-safe) — address lingering Sonar issues + Won't Fix / Accept / False Positive cases before the Tranche 5 cutover. The Tranche 4.5 session's "button accessible name gotcha" (buttons with `title=` but no `aria-label=`) would not have occurred if ARIA label coverage were more extensive. Refactor app code where necessary to reduce Won't Fix notes scattered in `sonarqube-workflow-SKILL.md` + `code-quality-SKILL.md` + `aria-accessibility-SKILL.md`.
    - **ARIA label audit**: every interactive element (`<button>`, `<input>`, `<select>`, custom `role=slider`/`role=button`) should have either a visible text label or an `aria-label` that matches (or is a superset of) the visible text. The Tranche 4.5 `focus-not-stolen` test revealed that `▲`/`▼` buttons have `title=` but no `aria-label` — their accessible name is the glyph, which is fragile (screen readers announce "up-pointing triangle" not "Increase font size"). Add `aria-label` to all `title=`-only buttons: `#fs-up`/`#fs-down` (font size), `#speed-up-btn`/`#speed-down-btn` (speed), `#seek-arr-fwd`/`#seek-arr-back` (seek offset). This also makes the buttons locatable by `getByRole("button", { name: "..." })` in tests, eliminating the `button[title="..."]` workaround.
    - **Sonar issue triage**: read the latest `sie` report (user uploads after each push). Triage per `sonarqube-workflow-SKILL.md` Step 3. Target: reduce OPEN issues to ≤10 (currently ~29 per MEMORY.md Sep 15, 2026). Apply fixes for: S3776 (CC) if any function exceeds 15; S2004 (nesting) if any >4; S7761 (`.dataset`); S1940 (`Array.from`); S6606 (`Number.isNaN`) — but verify semantics first (S6606 is NOT equivalent to `=== undefined` check per MEMORY.md); S6666 (`Object.hasOwn`); S7744 (`|| {}` after spread). Won't Fix: S6443 (String.raw on regex literals — false positive), S4138 (for-of with index used), S1321 (replaceAll with quantifier), S3800 (negated condition no else), S6606 (semantics differ), S6594/S8786/S6557/S7755 (verbatim port). Accept: S6819 (`#progress-wrap` custom interaction — documented exception), S7927 (icon-only button — false positive).
    - **CodeQL alerts**: assess per rule; same triage logic. CodeQL rule keys use `language/category` namespace. Fix blocking alerts (security/reliability); Accept/Won't Fix non-blocking per the rule semantics.
    - **`githubactions:S7630` skill update** (delivered Sep 24, 2026): added S7630 to the GitHub Actions rules table + Step 3 + false-positive summary in `sonarqube-workflow-SKILL.md`. Pattern: move `${{ inputs.* }}` in `run:` blocks to `env:` + `$VAR` shell expansion. The `playwright-snapshot-regen (fixed).yml` is the reference implementation (4 instances fixed).
    - **Pre-conditions**: Tranche 4.6 done. **Post-conditions**: OPEN Sonar issues ≤10, ARIA label audit complete, `sie` report re-run shows the reduction. Then proceed to Tranche 4.8 (if mutation testing is adopted) or Tranche 5 (cutover).

- **Tranche 4.8 — Mutation testing** (pre-cutover, sandbox-safe, optional) — incorporate mutation-testing-style sanity checks into the test suite so tests catch the case where the app is broken but the test passes (the `reload-clears-lyrics-audio` gap from Tranche 4.5 is the canonical example). The user did this manually for ~60% of the original Playwright tests and asks whether the whole suite should incorporate it permanently.
    - **Decision pending**: mutation testing frameworks (Stryker for JS/TS) add CI time + maintenance burden. The user's manual approach (break the app, verify test fails, restore) is cheaper but not repeatable. A middle ground: add a `tests/mutation/` directory with one-off scripts that break a specific app behavior and verify the corresponding test fails — run manually before a release, not in CI. The `scripts/sandbox-mutation.js` from Tranche 4.5 is the prototype.
    - **Scope if adopted**: target the highest-risk tests first — those that verify user-facing behavior where a regression would be visible (seek, focus, undo, beforeunload). Skip tests that are already structural (snapshot comparisons, unit tests). The mutation scripts should be small (one mutation per script) and self-restoring (backup → mutate → rebuild → test → restore → rebuild).
    - **Alternative**: instead of mutation testing, add stronger assertions to existing tests. The `reload-clears-lyrics-audio` gap is fixed by adding `expect(page.evaluate(() => sessionStorage.getItem('lbl_autosave'))).toBeNull()` after reload — pins the mechanism. This is cheaper than a mutation framework and catches the same class of bug. Prefer this approach unless the user explicitly wants mutation testing.
    - **Should Vite unit tests also have mutations?** (user-raised, Sep 24, 2026): **yes, but lower priority than Playwright tests.** The Vitest unit suite (501 tests) tests pure functions + composables in isolation — `tsToMs`, `msToTs`, `replaceTs`, `peelLastParen`, `batchSplitParens`, etc. These are deterministic pure-logic tests where the assertion IS the mechanism (e.g., `expect(tsToMs('[01:23.45]')).toBe(83450)` — if `tsToMs` is broken, the test fails; there's no "behavior without mechanism" gap like the Playwright `reload-clears` case). Mutation testing on unit tests would catch a weaker class of gap: a test that passes because the function returns the right value for the wrong reason (e.g., a regex that matches too broadly but happens to pass the test cases). Stryker would catch this, but the cost/benefit is lower than for Playwright tests because unit tests are already structural. Recommendation: if mutation testing is adopted (Tranche 4.8 decision), start with Playwright tests (high-value, user-facing behavior) and add unit-test mutations only if Stryker is already set up and CI time allows. The unit tests' value is already high enough that mutation testing them is a nice-to-have, not a must-have.
    - **Pre-conditions**: Tranche 4.7 done. **Post-conditions**: either mutation testing is adopted (with a `tests/mutation/` directory + documentation in `playwright-testing-SKILL.md`), or the alternative stronger-assertion approach is applied to the gap tests, or the tranche is deferred to post-cutover. Then proceed to Tranche 5.

- **Tranche 5 — Cutover: Pages source flip + deploy.yml trigger** (the cutover itself, on `main`) — this is the single moment the live site changes. **Pre-conditions**: Tranches 1–4.5 done; Tranche 3 local-test checkpoint passed; CodeQL + SonarCloud gates green on the PR. **Steps** (executed by the user, the agent writes the deploy.yml + workflow changes):
  1. Merge `staging` → `main` (PR or fast-forward). `docs/index.html` still ships to Pages via the legacy branch deploy, so the live site is unchanged.
  2. Uncomment the `push: main` trigger in `.github/workflows/deploy.yml` (currently `workflow_dispatch` only per Phase A notes). Verify the workflow runs green on `main` — it builds `dist/` and deploys via `actions/deploy-pages` (OIDC, no PAT).
  3. Switch Pages source in repo settings from "Deploy from a branch" (`main:/docs`) to "GitHub Actions". **This is the cutover moment** — the live site now serves the Vite `dist/` instead of `docs/index.html`. Smoke-test the live URL immediately.
  4. Decide whether "Deploy to GitHub Pages" joins `sync-staging.yml`'s gate list (deploy failure blocking staging sync) or stays CI-only. Recommend adding it to the gate — a failed deploy should block staging merges until Pages is healthy.
  5. Add the release workflow: tag push (`v*.*.*`) → build with `SINGLEFILE=1 npm run build:single` (produces a self-contained one-file HTML via `vite-plugin-singlefile`) → attach to GitHub Release. The single-file artifact is the GitHub Releases download; the Pages deploy is the multi-file `dist/`.
  6. **Do NOT delete `docs/index.html` yet** — wait until Tranche 6 verifies the Vite deploy is stable for at least one full Playwright suite run on `main`.

  **Rollback**: if the live site is broken after step 3, switch Pages source back to "Deploy from a branch" (`main:/docs`) in repo settings. The monolith is still in `docs/index.html` (Tranche 6 deletes it) — the rollback is instant. Document the rollback procedure in `SECURITY.md` as part of this tranche.

- **Tranche 6 — Monolith deletion + archive cleanup** (post-cutover, on `main`) — **Pre-condition**: Tranche 5 step 3 verified, live site stable for ≥1 full Playwright suite run on `main` (the user runs `tst` after the cutover and pastes results). **Steps**:
  1. Delete `docs/index.html`. This is the point of no return — the rollback from Tranche 5 no longer works. Ensure the user has confirmed the live site is healthy first.
  2. Delete `tests/logic.spec.js` if Tranche 4 didn't already remove it (the monolith is gone, so the Playwright parity bridge is moot).
  3. Update `tests/helpers/index.js`'s `getAppUrl()` to always return `/` (remove the `LBL_VITE_TARGET` env-var branch — Vite is now the only target). Update `playwright.config.js`'s `webServer` to always `npx vite preview`.
  4. Remove the `sonar.coverage.exclusions=src/**,vite.config.mts` line from `sonarcloud.yml` IF a coverage pipeline exists by this point (vitest coverage or Playwright v8 coverage). If not, leave the exclusion — but file a follow-up issue. See MEMORY.md → "SonarQube / CodeQL dispositions" → "Coverage on New Code" for the rationale.
  5. Update `archive/semantic/` README (if one exists) to note it's no longer the deployment mechanism — purely historical reference. The archive itself stays (regression investigation may need old chat transcripts).
  6. **`findLatestVersion()`** — now that `docs/index.html` is gone, the function either returns `/` (Vite root) or can be removed entirely if no test uses it. Audit usage; remove if dead.

- **Tranche 7 — Stale-docs sweep** (post-cutover, sandbox-safe) — evaluate every human-facing root-level doc for stale references per the cleanup reminder below. Each doc gets its own commit so the user can review piecemeal:
    - `CONTRIBUTING.md` — vibecoding workflow changed (modular, not single-file); the Repomix bundle structure is the new contribution model.
    - `HELP.md` — app UX may change if shadcn-vue components alter the interface (e.g. the `Dialog` overlay replaces the custom settings overlay; the `Select` font selector may replace the custom dropdown). Audit each UX reference.
    - `README.md` — core app features ("Getting started" section: `npm run dev` on Vite, not opening `docs/index.html`; the "download from Releases" section now points at the single-file GitHub Release artifact, not `docs/index.html`).
    - `LIMITATIONS.md` — web architecture changed (Vite + Vue, not single-file HTML); browser limitations may have shifted (shadcn-vue `Dialog` handles focus trapping natively, so the "browser-native dialog focus" limitation may no longer apply).
    - `SECURITY.md` — app code split into `src/` (no longer single-file); the rollback procedure from Tranche 5 should be documented here.
    - `CREDITS.md` — new dependencies (Vue, shadcn-vue, Radix Vue / reka-ui, Lucide, Tailwind v4, vite-plugin-singlefile).
  **No new specs** — this is documentation only. The agent delivers updated docs in `download/`; the user reviews and commits.

- **Tranche 8 — Skills update for modular architecture** (post-cutover, sandbox-safe) — the "Skills That Need Updating After This Refactor" list below is the checklist. Each skill gets its own commit:
    - `single-file-html-app-SKILL.md` — heavily revise or retire. The app is no longer single-file; the skill's CSS architecture, JS architecture, and common pitfalls sections describe patterns that no longer apply. Either reframe it as "modular Vue app patterns" or retire it and let `code-quality-SKILL.md` + `browser-hotkey-system-SKILL.md` absorb the still-relevant content.
    - `linebyline-section-index-SKILL.md` — retire. The section-marker grep protocol targets the monolith's `// ──` markers; the modular app uses file boundaries instead. The prompt-to-section map is obsolete. Replace with a `src/-module-index-SKILL.md` that maps user intents to `src/composables/*.ts` + `src/components/*.vue` files (or fold into `project-workflow-SKILL.md`).
    - `project-workflow-SKILL.md` — update the Build step description (no more "patch the monolith"; the Build Repomix now bundles `src/**` + `tests/unit/**` + `docs/index.html` until Tranche 6 deletes the latter). The companion-file pattern still applies.
    - `browser-hotkey-system-SKILL.md` — architecture stays the same, but implementation is across `src/composables/useGlobalHotkeys.ts` + `useTextareaKeys.ts` + `useSettings.ts` instead of one monolith section. Add a "module map" subsection pointing to the composables.
    - `playwright-testing-SKILL.md` — `findLatestVersion` changes (Tranche 6); test file structure may shift (`.spec.js` → `.spec.ts` per roadmap item 4); the `LBL_VITE_TARGET` env var from Tranche 2 becomes the default after Tranche 6.
    - `code-quality-SKILL.md` — minor: the "Bash workflow scripts" section's deploy.sh reference may need updating if Tranche 5 changes the deploy pattern. Audit.
    - `sonarqube-workflow-SKILL.md` — minor: the `sonar.coverage.exclusions` line from Tranche 6 step 4 may shift the coverage gate behavior. Audit.
    - `aria-accessibility-SKILL.md` — minor: shadcn-vue `Dialog` + Radix Vue primitives handle most accessibility automatically; the skill's "Dialog/modal accessibility" section may be simplified. Audit.
  **No new specs** — this is skill maintenance. The agent delivers updated skills in `download/`; the user reviews and commits.

#### Phase E cleanup reminders

- **Consolidate unit tests from logic tests.** DONE (Tranche 4, Sep 22, 2026). `tests/logic.spec.js` is deleted; all 84 unique test cases live in the Vitest unit suite. The 4 unique functions (`peelLastParen`, `batchSplitParens`, `findNextTimestampMs`, `assignInterpolatedTs`) were ported to `src/utils/timestampSync.ts` in Phase D Tranche 5, and the 10 shadowed functions were already covered by existing Vitest specs. 26 missing edge cases were ported before deletion; full suite 501/501 green.
- **Check stale references in human-facing root-level docs.** Per the AGENTS project-structure section, evaluate these docs for stale references after the cutover:
    - `CONTRIBUTING.md` — vibecoding workflow changed (modular, not single-file)
    - `HELP.md` — app UX may change if shadcn-vue components alter the interface
    - `README.md` — core app features, "Getting started" section (Vite dev server, not `docs/index.html`)
    - `LIMITATIONS.md` — web architecture changed (Vite + Vue, not single-file HTML)
    - `SECURITY.md` — app code split into `src/` (no longer single-file)
    - `CREDITS.md` — new dependencies (Vue, shadcn-vue, Radix Vue, Lucide, Tailwind)

### Critical Things a Fresh Chat Must Know

- **Global keyboard handler is the hardest migration** — it dispatches to ~30 actions and reads DOM state directly. In Vue it becomes `onMounted`/`onUnmounted` with `ref()` for reactive state. This is a well-known Vue pattern but the most error-prone piece. (Phase D Tranche 9 done — see "Tranche 9 implementation notes" above.)
- **Hotkey capture input has complex focus management** (Tab trap, Shift+Backspace=clear, Backspace=reset+advance, Enter=swap+advance). shadcn-vue `Dialog` handles the outer focus trap; capture behavior must be preserved manually inside the component. (Phase D Tranche 8 done.)
- **`vite-plugin-singlefile` inlines JS and CSS but NOT external assets.** LineByLine uses inline SVG and system fonts, so this is fine. If custom fonts/images are added later, they'll need base64 encoding.
- **Sonar coverage is deliberately unmeasured for the new stack.** `sonar.coverage.exclusions=src/**,vite.config.mts` (sonarcloud.yml) keeps the gate's 80%-on-new-code condition green while no coverage pipeline exists — the Playwright e2e suite reports no coverage, so the first src/ files would otherwise pin the gate at 0%. Issue analysis on src/ continues. Narrow the exclusions if a coverage pipeline is ever added (vitest / Playwright v8 coverage) — see MEMORY.md → "SonarQube / CodeQL dispositions" → "Coverage on New Code". Phase E Tranche 6 step 4 is the revisit point.
- **`archive/semantic/` is no longer the deployment mechanism.** Versioning moves to Git tags (`git tag v0.38.0 && git push --tags`). The archive can be kept as historical reference or eventually pruned.
- **shadcn-vue `Dialog` replaces the custom Settings overlay entirely** — no more manual focus trap code, no more `_topmostOverlay` / `_bringToFront` management. Significant simplification. (Phase C Tranche 5 done.)
- **`isDirty` + `beforeunload` is a Phase E gap.** The `isDirty` ref exists in `useAppState` (Tranche 1) but is never set to `true` and `App.vue` has no `beforeunload` listener. Phase E Tranche 1 closes this gap. The monolith's `beforeunload` (lines 2766–2770) is the parity reference.
- **`tests/logic.spec.js` parity bridge — DONE.** Deleted in Tranche 4 (Sep 22, 2026). The Vitest unit suite is the sole source of truth for LRC parsing / hotkey / paste-handler logic coverage.

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

- `[x]` Delete `archive/python_abandoned` and `archive/pre-semantic/0_abandoned/Python`
- `[x]` Add `sonar.exclusions=archive/**` to SonarQube Cloud configuration

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
