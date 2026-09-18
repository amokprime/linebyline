
# Playwright Test Failures — Phase E Tranche 3

Live status of the Vite-target Playwright suite (`LBL_VITE_TARGET=1 tst`).
Updated after each test run. The monolith-target suite (`tst` without the env
var) should stay green throughout Phase E — failures here are Vite-target only.

## Current status (Sep 17, 2026 — session 9, Tranche 3 done)

### Tranche 3 checkpoint: PASSED

The local-test checkpoint is complete. The `deploy.sh` `npm run build` fix
(from session 8) ensures `dist/` is rebuilt after Vitest, so source patches
actually reach Playwright. Two non-logic failures were fixed in session 9:

- **`typing-mode.spec.js:meta-save-update` (firefox-only)** — FIXED. Root
  cause: the test monkeypatches `window.doSave` on Firefox (which blocks the
  download event), but the Vue port's hotkey handler called the imported
  `doSave` directly, bypassing the monkeypatch. Fix: `App.vue` exposes
  `window.doSave = doSave` in `onMounted`; `useGlobalHotkeys.ts` dispatches
  through `window.doSave` when set, falling back to the imported reference in
  node unit tests. New `src/globals.d.ts` declares the `Window.doSave`
  augmentation for `src/**`; `tsconfig.vitest.json` includes it.

- **`intervals.spec.js:typing-debounce-1` (chromium-only)** — FIXED. Root
  cause: the Settings save-on-close watch (Vue async flush `'pre'`) may not
  have committed `undo_debounce_ms=1` before the first keystroke, leaving the
  undo stack one entry short. Fix: added a 50ms wait after pressing Escape +
  bumped inter-keystroke wait from 20ms to 50ms.

### Session 9 test run results (253 failures)

```
253 failed / 284 passed / 9 skipped (16.4m)
```

Breakdown:

| Category | Tests (unique) | Browser scope | Status |
|---|---|---|---|
| `logic.spec.js` `ReferenceError: X is not defined` | 84 × 3 = 252 | all 3 | Deferred to Tranche 4 |
| `settings.spec.js:assign-conflict-tab` | 1 | webkit only | Needs test rewrite |

### Remaining failure: `assign-conflict-tab` (webkit-only)

This is a pre-existing known failure (FAILURES.md category 15). The test times
out at 30s on the "Confirm reset" button click (line 148). The shadcn-vue
Dialog's reset-confirm flow uses a focus trap + reactivity timing that doesn't
match the monolith's imperative flow. Needs a dedicated test rewrite — not a
source-code fix. Fits a future Test session alongside the Tranche 4
`logic.spec.js` consolidation.

### `--update-snapshots` notes

`--update-snapshots` only writes baselines for `toMatchSnapshot` /
`toHaveScreenshot` / `toMatchAriaSnapshot`. It does NOT affect
`toHaveValue` / `toBeVisible` / `toBeChecked` — these are value assertions.
Tests that timeout before reaching the snapshot assertion also can't be fixed
by `--update-snapshots`. None of the remaining 253 failures are snapshot
assertions.

### Sandbox verification

Session 9 verified the fixes work end-to-end against the production Vite build
(`npx vite preview --port 5173` in sandbox):

- `window.doSave` exposure: `typeof window.doSave === 'function'` → PASS
- `Ctrl+'` dispatch through `window.doSave`: monkeypatch invoked → PASS
- Firefox capture pattern (meta-save-update mechanism): `__saveCapture`
  populated → PASS
- `intervals.spec.js:typing-debounce-1` timing fix: typed a/b/c with 50ms
  gaps, 2× Control+Z undid back to "a" → PASS (all 4 assertions)

### Previous session notes (session 8)

#### Root cause of session 8's "patches didn't work"

**`deploy.sh` was missing `npm run build`.** The `vite preview` server serves
`dist/` — if `dist/` isn't rebuilt after source patches, Playwright tests run
against the stale build. Every session 8 patch (SettingsDialog watch, LeftPanel
seek-offset, useGlobalHotkeys offset mode, useImport undo fix, index.html
favicon) was deployed to source files but never built into `dist/`.

**Fix**: `deploy.sh` now runs `npm run build` after the Vitest suite.

#### Session 8 test run results (stale dist/ — same as pre-patch)

```
307 failed / 224 passed / 9 skipped (18.7m) — --update-snapshots run
306 failed / 225 passed / 9 skipped (18.4m) — normal run
```

Both runs had the same 104 unique failing tests. `--update-snapshots` didn't
fix any because most failures were `toHaveValue`/`toBeVisible`/`toBeChecked`
— not snapshot assertions.

#### Categories fixed in session 8 (all green after dist/ rebuild)

| Category | Tests (unique) | Status |
|---|---|---|
| 3. `#settings-overlay` | 0 | Fixed (session 8) |
| 5. Wheel events | 0 | Fixed (session 8) |
| 6. restrictWarnText | 0 | Fixed (session 8) |
| 7. Settings save on Escape | 4 | Fixed (session 8) |
| 8. Dialog viewport | 5 | Fixed (session 8) |
| 9. page.evaluate module fn | 1 | Fixed (session 8) |
| 10. Section filter + Tab order | 2 | Fixed (session 8) |
| 11. Seek-offset + undo stack | 3 | Fixed (session 8) |
| 12. Favicon | 1 | Fixed (session 8) |

#### Categories fixed in session 9

| Category | Tests (unique) | Status |
|---|---|---|
| typing-mode meta-save-update | 1 (firefox) | Fixed (session 9) |
| intervals typing-debounce-1 | 1 (chromium) | Fixed (session 9) |
| smoke doSave-exposed + doSave-dispatch | 6 (new tests) | Fixed (session 9) |

#### `tst-vite-log` fish function fixes (session 8)

1. Replaced `\d` with `[0-9]` (Perl regex not supported in `grep -E` — caused
   "stray \ before d" warning).
2. Simplified grep pattern to only match numbered errors + Error/Expected/
   Received + final counts (removed `[N/540]` progress lines that produced
   hundreds of lines of noise).

The fixed function is in `tst-vite-log.fish` (deploy to
`~/.config/fish/functions/tst-vite-log.fish`).
