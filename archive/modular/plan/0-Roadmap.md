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

State moves out of the monolith into Vue composables. Tranche plan (smallest dependency-first, global keyboard handler last — it dispatches to ~30 actions and needs every state composable to exist):

- Shared state via Vue's `provide`/`inject` (equivalent to React Context): `cfg`, `hotkeyMode`, `activeLine`/`playingLine`, `isDirty`
- Local state via `ref()` / `reactive()`: component-specific UI (search query, capture input focus)
- Composables for persistence: `usePersistedState` (localStorage), `useAutosave` (sessionStorage)
- The global keyboard handler becomes an `onMounted` + `onUnmounted` lifecycle hook with `ref()` for reactive state

#### Tranche plan

Each tranche ships its composables + Vitest specs. Components that grew inert during Phase C are wired in the matching tranche. Tranches 1–2 are leaf pure-state; 3–7 wire increasingly coupled subsystems; 8 ports the settings interactions; 9 ports the most coupled piece last.

- **Tranche 1 — Foundation** (done) — `useAppState` (core state refs + the `cfg` ref loaded via `migrateHotkeys` + a `provide`/`inject` API so children read `cfg.hotkeys.X` reactively), `usePersistedState` (thin `ref(localStorage)` helper for scattered scalar prefs: `lbl_speed`, `lbl_vol`, `lbl_muted`), `useUndoRedo` (snapshot stack, single-push model, debounced input push). No component wiring yet.
- **Tranche 2 — Persistence + Title** (done) — `useAutosave` (load/save sessionStorage, `_restoreSecondaryPool` shape, seed-on-load) + `useTitle` (pure `updateTitleFromText` parsing [ti:]/[ar:] into reactive refs). Wired the `cfg` ref into `SettingsDialog.vue` so rows render from live config instead of `DEFAULT_CFG`. Also added `mainText` ref to useAppState, wired useAudio/useModeSwitch to read from it, and instantiated useUndoRedo in App.vue. See MEMORY.md Phase D tranches → Tranche 2 for the full port-delta list (monolith's `sessionStorage.removeItem` before loadAutosave is NOT ported — the skill says "reload on init"; `_restoreSecondaryPool` pushes to secondaryPool with `{visible, text}` shape instead of creating DOM columns; `mainText` ref replaces `getTA()`/`_setTA()` DOM access).
- **Tranche 3 — Mode switch** (done) — `useModeSwitch` (applyMode scroll/selection logic). Wire into `ControlsPanel.vue` (replaces local mode refs at monolith defaults; mode cell @activate dispatches through toggleMode/toggleOffsetSeek). EditorArea registers template refs for #main-scroll / #main-textarea / #main-lines and calls initModeSwitch in setup; App.vue's onMounted calls applyMode() as the last Init step (monolith parity). **Scope amendment**: the roadmap originally listed "the secondary-focus auto-switch" here, but the monolith's "Auto mode" section comment is documentation drift — `addSecondary()` attaches no focus/blur handlers. Not implemented in this tranche; if added later, it belongs in `SecondaryField.vue`'s @focus/@blur calling `setHotkeyMode(false)`. See MEMORY.md Phase D tranches → Tranche 3 for the full port-delta list.
- **Tranche 4 — Audio** (done) — `useAudio` composable. Wired `LeftPanel.vue` audio controls (play/pause, volume, seek, speed, progress bar). Persists `lbl_vol`/`lbl_muted`/`lbl_speed` via Tranche 1's `usePersistedState`. The sync-file button and seek-offset arrows stay inert (Tranche 5 owns `doSyncFile`/`tickSeekOffset`/`setOffsetMode`). See MEMORY.md Phase D tranches → Tranche 4 for the full port-delta list (reactive DOM sync replaces `applyVolume()`; `_preMuteVolume`/`_volWheeling` guard eliminated; `rebuildHkPanel()` call in `updatePlayBtn` eliminated; Tranche 2/5/6 cross-cutting functions passed as no-op callbacks).
- **Tranche 5 — Sync/timestamp** — `useSync` (syncLine, insertEndLine, seekPrev/Next, replayActiveLine, adjustTs, batchSplitParens, markAsTranslation, doSyncFile, tickSeekOffset, setOffsetMode, `_assignInterpolatedTs`, `_peelLastParen`). Wire the `EditorArea.vue` main textarea (paste handler, click handling, renderMainLines). Adds the four missing `tests/logic.spec.js` functions to `src/utils/` with Vitest coverage (the roadmap's Phase E consolidation begins here).
- **Tranche 6 — Merge + Secondary fields** — `useMerge` (getSecLines, checkLineCounts, updateMergeBtn, mergeTranslations). Wire inert `SecondaryField.vue` columns (paste, keydown, scroll-sync, import, paren-wrap) and the MenuBar Add/Hide/Merge buttons (the disabled state falls out of `useAppState.secondaryPool.length`).
- **Tranche 7 — Import/Save** — `useImport` (doImport, doSave, file-picker handler, multi-file handling). Wire MenuBar's 📂/💾 buttons and App's `#file-picker`.
- **Tranche 8 — Settings interactions** — Settings capture input (Tab trap inside shadcn Dialog, Shift+Backspace=clear, Backspace=reset+advance, Enter=swap+advance), `initSettingsSearch`/`applySettingsFilter`, `saveSettingsNow`, reset confirm (decide whether the inline footer confirm stays or swaps to shadcn `AlertDialog`).
- **Tranche 9 — Keyboard handler** — `useTextareaKeys` (Main textarea KD: Enter trim, bracket/paren autocomplete) + `useGlobalHotkeys` (the dispatch table to ~30 actions, onMounted/onUnmounted, repeat-guard, typing-mode arrow override, settings focus trap interactions). The most coupled piece — done last so every state composable it dispatches to already exists. Also ports `updateDynamicTooltips` (needs the `cfg` ref).

#### Tranche 1 design (this session)

`useAppState.ts`:
- Module-level singleton refs (the same pattern `useTheme`/`usePanelCollapse` use) for the monolith State section's mutable globals: `hotkeyMode`, `offsetSeekMode`, `activeLine`, `playingLine`, `selectedLines`, `mergeDone`, `savedAudioPath`, `lastImportStem`, `suppressScrollSync`, `_syncAutoAdvanced`, `_geniusDetectedThisSession`, `_pasteJustHappened`. `MAX_LINES=500` is a `const`.
- `secondaryPool` is a `ref<SecondaryEntry[]>` of pool entries (max 10); `secondaryCols` is a `computed` over `secondaryPool.value.filter(e => e.visible)`. The monolith keeps them as separate arrays with manual bookkeeping — collapsing into one source of truth is the single-source-of-truth rule from the single-file-html-app skill.
- `cfg` is a `ref<AppConfig>` initialised via `loadCfg()` (ported verbatim from the monolith's loadCfg, including the JSON.parse clone + `migrateHotkeys` call). Provided via `provide(CFG_KEY, cfg)` and consumed via `inject(CFG_KEY)` — components that need `cfg.hotkeys.X` reactively call `inject`.
- `isDirty` is a `ref<boolean>` initialised `false`; the unload-warning handler reads it (Tranche 7 wires it).
- Export an `AppProvider` symbol (`InjectionKey<Ref<AppConfig>>`) and a `useCfg()` convenience wrapper that calls `inject(CFG_KEY)` and throws if missing.

`usePersistedState.ts`:
- A generic helper `usePersistedRef(key, default, opts?)` that returns a `ref` whose value is read from `localStorage` at module-load and persists on every set. Options: `{ serialize?: (v) => string, deserialize?: (s) => T, validate?: (v) => boolean }` — defaults to JSON.
- Pre-seeded exports for the three scalar prefs still scattered across the monolith: `useSpeed()` (lbl_speed → number, default 1), `useVolume()` (lbl_vol → number 0..1, default 1), `useMuted()` (lbl_muted → '0'|'1', default false). The `useEditorFont`/`useTheme`/`usePanelCollapse` composables already in the tree use direct `localStorage.getItem` calls — left alone this tranche (consolidating them onto `usePersistedRef` is a post-cutover cleanup, not a tranche-1 goal).

`useUndoRedo.ts`:
- Snapshot shape: `{ main: string, secondaries: string[], mergeDone: boolean }` (the monolith's takeSnapshot, ported).
- Stack: `undoStack: ref<Snapshot[]>`, `redoStack: ref<Snapshot[]>`. The single-push model from the code-quality skill: `pushSnapshot()` pushes post-change only and clears `redoStack`; wholesale replacement ops call `pushSnapshot` before AND after.
- `applySnapshot` clears extra secondaries beyond the snapshot's `secondaries.length` (the documented invariant).
- `doUndo`/`doRedo` follow the monolith: undo needs at least 2 entries (the seed + one), redo needs at least 1.
- Input debounce: `scheduleInputSnapshot(debounceMs)` — clears any pending timer and sets a new one. Caller passes the configured `cfg.undo_debounce_ms`.
- The composable is **shape-only** this tranche — it doesn't yet own the snapshot content. Callers pass a `takeSnapshot: () => Snapshot` and an `applySnapshot: (s: Snapshot) => void` to the composable's `useUndoRedo({ take, apply })` factory; the composable manages the stacks + debounce but defers DOM writes to the caller. Wiring real `take`/`apply` happens in Tranche 2 once `useAutosave` and the `#main-textarea` ref exist. This keeps Tranche 1 dependency-free and unit-testable in pure node.

#### Tranche 3 implementation notes (2026-09-09)

`useModeSwitch.ts` shipped. Key decisions recorded for future tranches:

- **Singleton pattern, not provide/inject** — matches `useAppState`. `initModeSwitch(refs, renderMainLines)` called once in `EditorArea.vue` setup; `ControlsPanel.vue` and the future Tranche 9 keyboard handler import `toggleMode`/`toggleOffsetSeek`/`applyMode` directly. No injection key, no provider component. `vi.resetModules()` in tests gives a fresh module each run.
- **Refs as `Ref<HTMLElement | null>`, not raw elements** — `applyMode` reads `.value` at call time, so it doesn't matter that the refs are empty during setup. By the time `App.vue`'s `onMounted` calls `applyMode()` (children mount before parents), `EditorArea` has populated them.
- **`renderMainLines` is a callback parameter** — Tranche 5 swaps the no-op stub for the real renderer without re-touching this composable. The call site (inside `applyMode`'s hotkey-mode branch) is preserved verbatim from the monolith.
- **No `rebuildHkPanel()` call** — Vue's reactivity re-renders `ControlsPanel`'s computed `modeCells`/`actions` when `hotkeyMode`/`offsetSeekMode` change. The monolith's explicit `rebuildHkPanel()` call at the end of `applyMode` is a no-op in Vue. Documented as a port delta in the composable header.
- **No secondary-focus auto-switch** — the monolith's "Auto mode switch when secondary focused" section comment is documentation drift (no focus/blur handlers in `addSecondary()`). Not implemented here. If a future tranche adds it, the wiring is `SecondaryField.vue` `@focus` → `setHotkeyMode(false)`. See MEMORY.md Phase D tranches → Tranche 3 for the full rationale.
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
- **`useSpeed` validate amended to [0.1, 4]** — was (0, 5] in Tranche 1; the monolith's runtime clamp (`changeSpeed` + Init) is [0.1, 4]. A stored 4.5 or 0.05 now falls back to 1 at load instead of sneaking through. The HTML input's `min=0.05` is a stale attr with no effect (changeSpeed clamps). Documented as a Tranche 1 amendment.
- **`setupAudio`'s `[ti:]` update uses callbacks** — `getMainText()`/`setMainText()` instead of `getTA()`/`_setTA()`. The `[ti:]` update logic is verbatim: only overwrite if blank or "unknown".
- **Test infrastructure quirks** — `HTMLAudioElement.duration` is readonly in happy-dom; tests stub it via `Object.defineProperty(el, 'duration', { value, configurable: true, writable: true })`. The progress-bar drag test dispatches events sequentially and asserts after each (not all-then-assert). `toggleMute` doesn't write `lbl_vol` to localStorage — `savedVolume` stays in-memory until the user explicitly sets volume via the slider (monolith parity: `applyVolume` writes `lbl_vol` with `_preMuteVolume`, which is the same in-memory value).

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

**Phase E cleanup reminders:**

- **Consolidate unit tests from logic tests.** `tests/logic.spec.js` (Playwright, pre-refactor) shadows the Vitest unit suite for 6 functions: `tsToMs`/`msToTs`/`replaceTs`/`isEndTs`/`normalizeLrcTimestamps`/`stripSecLine`, `_normKey`/`keyStr`, `isRestrictedForAll`/`isRestrictedForKey`, `mergeLrcMeta`/`ensureReTagDefault`, `cleanPaste`/`cleanGenius`, `collapseBlanks`. Four functions are unique to `logic.spec.js`: `_peelLastParen`, `batchSplitParens`, `_findNextTimestampMs`, `_assignInterpolatedTs` — these are still in the monolith and haven't been ported to `src/utils/` yet. When they're ported (Phase D/E), add Vitest unit tests for them, then delete the corresponding `logic.spec.js` sections. The shadowed sections can be deleted once the Phase E cutover is verified (the monolith is no longer the test target). Until then, keep `logic.spec.js` entirely — it's the parity bridge.
- **Check stale references in human-facing root-level docs.** Per the AGENTS project-structure section, evaluate these docs for stale references after the cutover:
  - `CONTRIBUTING.md` — vibecoding workflow changed (modular, not single-file)
  - `HELP.md` — app UX may change if shadcn-vue components alter the interface
  - `README.md` — core app features, "Getting started" section (Vite dev server, not `docs/index.html`)
  - `LIMITATIONS.md` — web architecture changed (Vite + Vue, not single-file HTML)
  - `SECURITY.md` — app code split into `src/` (no longer single-file)
  - `CREDITS.md` — new dependencies (Vue, shadcn-vue, Radix Vue, Lucide, Tailwind)

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
